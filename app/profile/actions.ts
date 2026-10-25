"use server";

import { auth, signIn, signOut } from "@/auth";

import { commitToBranch, openOrUpdatePull, RepoFile } from "@/lib/profiles/github";
import {
  claimableSlug,
  claimedSlugs,
  memberPath,
  memberSlugs,
  readMemberProfile,
} from "@/lib/profiles/memberData";
import {
  buildMemberProfile,
  readProfileForm,
  serializeMemberFile,
  slugForName,
} from "@/lib/profiles/memberFile";
import { ownerBranch, ownerFile, readOwnedSlug } from "@/lib/profiles/owners";
import { postReviewRequest, ReviewKind } from "@/lib/profiles/slack";
import { siteUrl } from "@/lib/site";

export type ProfileActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "submitted" };

const photoMaxBytes = 5 * 1024 * 1024;

const signedInMember = async () => {
  const session = await auth();
  if (!session?.ownerHash || !session.user) return undefined;
  return { ownerHash: session.ownerHash, user: session.user };
};

/**
 * Download the member's LinkedIn photo to use as their directory photo
 * @param url picture URL from the LinkedIn sign-in
 * @returns JPEG bytes, or undefined if there's no usable photo
 */
const fetchLinkedInPhoto = async (url: string | null | undefined) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Only LinkedIn's own image CDN, so a crafted URL can't make the server fetch anything else
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".licdn.com")) return undefined;
    // No redirects, so the host check above holds, and a deadline so a slow CDN falls back to no photo
    const response = await fetch(parsed, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return undefined;
    const bytes = Buffer.from(await response.arrayBuffer());
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    return isJpeg && bytes.length <= photoMaxBytes ? bytes : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Commit a profile change to the member's branch, open a pull request and ask for review in Slack
 */
const submitForReview = async ({
  kind,
  ownerHash,
  user,
  slug,
  profileName,
  linkedinHandle,
  files,
  note,
}: {
  kind: ReviewKind;
  ownerHash: string;
  user: { name?: string | null; email?: string | null };
  slug: string;
  profileName: string;
  linkedinHandle: string;
  files: RepoFile[];
  note?: string;
}) => {
  const branch = ownerBranch(ownerHash);
  const verb = { new: "Add", claim: "Claim", edit: "Update" }[kind];
  const title = `${verb} profile: ${profileName}`;

  const headSha = await commitToBranch(branch, files, title);
  const pull = await openOrUpdatePull(
    branch,
    title,
    [
      `${verb} the profile for **${profileName}**, submitted through latina.dev/profile.`,
      "",
      "Approve or reject it from the review message in Slack. Approving merges it once checks pass.",
      note ? `\nNote: ${note}` : "",
    ].join("\n")
  );

  try {
    await postReviewRequest({
      kind,
      pullNumber: pull.number,
      headSha,
      pullUrl: pull.html_url,
      profileName,
      profileUrl: kind === "new" ? undefined : `${siteUrl}/members/${slug}`,
      linkedinName: user.name ?? "Unknown",
      linkedinHandle,
      email: user.email ?? undefined,
      note,
    });
  } catch (error) {
    // Slack is the only place organizers see review requests, so tell the member to retry.
    // Sending again updates the same pull request and posts a fresh review message.
    console.error(error);
    throw error;
  }
};

/**
 * Submit a new profile, or changes to the member's own profile
 */
export async function submitProfile(
  _previous: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const member = await signedInMember();
  if (!member) return { status: "error", message: "Please sign in with LinkedIn first." };

  const ownedSlug = readOwnedSlug(member.ownerHash);
  // A member who came from their personal link claims and updates their profile in one review
  const claimSlug = ownedSlug ? undefined : claimableSlug(formData.get("claim"));
  if (!ownedSlug && formData.has("claim") && !claimSlug) {
    return {
      status: "error",
      message: "That profile is already linked to an account. Email hola@latina.dev for help.",
    };
  }
  const existingSlug = ownedSlug ?? claimSlug;
  const current = existingSlug ? readMemberProfile(existingSlug) : undefined;
  const values = readProfileForm(formData);
  const today = new Date().toISOString().slice(0, 10);

  const profile = buildMemberProfile(values, current?.frontmatter, today);
  if (!profile.success) return { status: "error", message: profile.error };

  const slug = existingSlug ?? slugForName(profile.data.name, memberSlugs());
  const files: RepoFile[] = [
    { path: `${memberPath}/${slug}.md`, content: serializeMemberFile(profile.data, profile.bio) },
  ];

  let note: string | undefined = claimSlug
    ? "Came from their personal link. Check the LinkedIn account matches the profile."
    : undefined;
  if (!existingSlug || formData.get("usePhoto") === "true") {
    const photo = await fetchLinkedInPhoto(member.user.image);
    if (photo) files.push({ path: `public/img/members/${slug}.jpg`, content: photo });
    else if (!existingSlug) note = "No LinkedIn photo was found, so add one before approving.";
  }
  if (!ownedSlug) files.push({ path: ownerFile(slug), content: `${member.ownerHash}\n` });

  try {
    await submitForReview({
      kind: ownedSlug ? "edit" : claimSlug ? "claim" : "new",
      ownerHash: member.ownerHash,
      user: member.user,
      slug,
      profileName: profile.data.name,
      linkedinHandle: profile.data.linkedin,
      files,
      note,
    });
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Something went wrong sending your profile. Please try again in a few minutes.",
    };
  }
  return { status: "submitted" };
}

/**
 * Ask to link the signed-in LinkedIn account to an existing profile
 */
export async function claimProfile(
  _previous: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const member = await signedInMember();
  if (!member) return { status: "error", message: "Please sign in with LinkedIn first." };
  if (readOwnedSlug(member.ownerHash)) {
    return { status: "error", message: "Your account is already linked to a profile." };
  }

  const slug = formData.get("slug");
  if (typeof slug !== "string" || !memberSlugs().has(slug)) {
    return { status: "error", message: "Please choose your profile from the list." };
  }
  if (claimedSlugs().has(slug)) {
    return {
      status: "error",
      message: "That profile is already linked to an account. Email hola@latina.dev for help.",
    };
  }

  const { frontmatter } = readMemberProfile(slug);
  try {
    await submitForReview({
      kind: "claim",
      ownerHash: member.ownerHash,
      user: member.user,
      slug,
      profileName: frontmatter.name,
      linkedinHandle: frontmatter.linkedin,
      files: [{ path: ownerFile(slug), content: `${member.ownerHash}\n` }],
    });
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Something went wrong sending your request. Please try again in a few minutes.",
    };
  }
  return { status: "submitted" };
}

/**
 * Sign in with LinkedIn, coming back to the member's personal claim link if they used one
 */
export async function signInWithLinkedIn(formData: FormData) {
  const claim = formData.get("claim");
  const redirectTo =
    typeof claim === "string" && /^[a-z0-9-]+$/.test(claim)
      ? `/profile?claim=${claim}`
      : "/profile";
  await signIn("linkedin", { redirectTo });
}

export async function signOutMember() {
  await signOut({ redirectTo: "/" });
}
