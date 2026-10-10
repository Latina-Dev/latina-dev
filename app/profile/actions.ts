"use server";

import { auth, signIn, signOut } from "@/auth";

import { commitToBranch, openOrUpdatePull, RepoFile } from "@/lib/profiles/github";
import {
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
    const response = await fetch(parsed, { cache: "no-store" });
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

  await commitToBranch(branch, files, title);
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
      pullUrl: pull.html_url,
      profileName,
      profileUrl: kind === "new" ? undefined : `${siteUrl}/members/${slug}`,
      linkedinName: user.name ?? "Unknown",
      linkedinHandle,
      email: user.email ?? undefined,
      note,
    });
  } catch (error) {
    // The pull request is the source of truth, so a Slack outage shouldn't fail the submission
    console.error(error);
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
  const current = ownedSlug ? readMemberProfile(ownedSlug) : undefined;
  const values = readProfileForm(formData);
  const today = new Date().toISOString().slice(0, 10);

  const profile = buildMemberProfile(values, current?.frontmatter, today);
  if (!profile.success) return { status: "error", message: profile.error };

  const slug = ownedSlug ?? slugForName(profile.data.name, memberSlugs());
  const files: RepoFile[] = [
    { path: `${memberPath}/${slug}.md`, content: serializeMemberFile(profile.data, profile.bio) },
  ];

  let note: string | undefined;
  if (!ownedSlug || formData.get("usePhoto") === "true") {
    const photo = await fetchLinkedInPhoto(member.user.image);
    if (photo) files.push({ path: `public/img/members/${slug}.jpg`, content: photo });
    else if (!ownedSlug) note = "No LinkedIn photo was found, so add one before approving.";
  }
  if (!ownedSlug) files.push({ path: ownerFile(slug), content: `${member.ownerHash}\n` });

  try {
    await submitForReview({
      kind: ownedSlug ? "edit" : "new",
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

export async function signInWithLinkedIn() {
  await signIn("linkedin", { redirectTo: "/profile" });
}

export async function signOutMember() {
  await signOut({ redirectTo: "/" });
}
