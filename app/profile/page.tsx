import { auth } from "@/auth";

import PageHero from "@/components/PageHero/PageHero";
import ClaimForm from "@/components/ProfileForm/ClaimForm";
import ProfileForm from "@/components/ProfileForm/ProfileForm";
import styles from "@/components/ProfileForm/ProfileForm.module.css";
import SignInButton from "@/components/ProfileForm/SignInButton";

import { pageMetadata } from "@/lib/pageMetadata";
import { findOpenPull } from "@/lib/profiles/github";
import { readMemberProfile, unclaimedProfiles } from "@/lib/profiles/memberData";
import { ownerBranch, readOwnedSlug } from "@/lib/profiles/owners";

import type { Metadata } from "next";

import { signOutMember } from "./actions";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Your Profile",
    description: "Sign in with LinkedIn to add or update your Latina Dev directory profile.",
    path: "/profile",
  }),
  robots: { index: false, follow: false },
};

const steps = [
  {
    title: "Sign in with LinkedIn",
    body: "It's the only sign-in we use, so every profile is real.",
  },
  { title: "Fill in your profile", body: "Your level, roots, skills and what you're open to." },
  { title: "We review it", body: "An organizer approves every new profile and every change." },
];

/**
 * Whether the member already has a change waiting for review. Best effort: without a GitHub
 * token (local development) it reports nothing pending.
 */
const hasPendingChange = async (hash: string) => {
  try {
    return Boolean(await findOpenPull(ownerBranch(hash)));
  } catch {
    return false;
  }
};

const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Until the LinkedIn and auth secrets are set (local development, new previews), auth()
  // throws, so show the signed-out page instead of an error
  const session = await auth().catch((authError: unknown) => {
    console.error(authError);
    return null;
  });

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Your profile."
        lede={
          <p>
            Add yourself to the Latina Dev directory or keep your profile up to date. Sign in with
            LinkedIn to get started.
          </p>
        }
      />
      <div className={`page-width ${styles.layout}`}>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepBody}>{step.body}</span>
            </li>
          ))}
        </ol>
        <div className={styles.stack}>
          {session?.ownerHash && session.user ? (
            <SignedIn hash={session.ownerHash} name={session.user.name ?? ""} />
          ) : (
            <div className={styles.panel}>
              <h2>Sign in</h2>
              {error && (
                <p className={styles.error} role="alert">
                  Signing in with LinkedIn didn&apos;t work. Please try again.
                </p>
              )}
              <p>
                We only support signing in with LinkedIn. We use your name, email and photo from
                LinkedIn, and never post anything to your account.
              </p>
              <SignInButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

async function SignedIn({ hash, name }: { hash: string; name: string }) {
  const ownedSlug = readOwnedSlug(hash);
  const pending = await hasPendingChange(hash);

  return (
    <>
      <div className={styles.signedIn}>
        <span>Signed in as {name || "a LinkedIn member"}</span>
        <form action={signOutMember}>
          <button type="submit" className={styles.secondary}>
            Sign out
          </button>
        </form>
      </div>
      {pending && (
        <p className={styles.notice} role="status">
          Your last change is waiting for review. Sending another one replaces it.
        </p>
      )}
      {ownedSlug ? <EditProfile slug={ownedSlug} /> : <JoinOrClaim name={name} />}
    </>
  );
}

function EditProfile({ slug }: { slug: string }) {
  const { frontmatter, bio } = readMemberProfile(slug);

  return (
    <>
      <h2>Edit your profile</h2>
      <ProfileForm
        editing
        initial={{
          ...frontmatter,
          github: frontmatter.github ?? "",
          website: frontmatter.website ?? "",
          affiliation: frontmatter.affiliation ?? "",
          location: frontmatter.location ?? "",
          countries: frontmatter.countries ?? [],
          skills: (frontmatter.skills ?? []).join(", "),
          openTo: frontmatter.openTo ?? [],
          noindex: frontmatter.noindex ?? false,
          bio,
        }}
      />
    </>
  );
}

function JoinOrClaim({ name }: { name: string }) {
  const profiles = unclaimedProfiles();
  const suggested = profiles.find(
    (profile) => normalizeName(profile.name) === normalizeName(name)
  )?.slug;

  return (
    <>
      <div className={styles.panel}>
        <h2>Already in the directory?</h2>
        <p>
          Pick your name and we&apos;ll link it to your LinkedIn sign-in, so you can edit your
          profile yourself from now on.
        </p>
        <ClaimForm profiles={profiles} suggested={suggested} />
      </div>
      <h2>New to Latina Dev? Add your profile</h2>
      <ProfileForm editing={false} initial={{ name }} />
    </>
  );
}
