import { auth } from "@/auth";

import PageHero from "@/components/PageHero/PageHero";
import styles from "@/components/ProfileForm/ProfileForm.module.css";
import SignInButton from "@/components/ProfileForm/SignInButton";

import { pageMetadata } from "@/lib/pageMetadata";
import { readMemberProfile } from "@/lib/profiles/memberData";
import { readOwnedSlug } from "@/lib/profiles/owners";
import { linkedSlug, verifyLinkToken } from "@/lib/slackLinks";

import type { Metadata } from "next";

import { linkSlackAccount } from "./actions";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Link Slack",
    description: "Link your Latina Dev Slack account to your directory profile.",
    path: "/slack/link",
  }),
  robots: { index: false, follow: false },
};

/**
 * Where a member lands from the "Link with LinkedIn" button in Slack. The button carries a
 * signed, 15-minute token naming their Slack account; signing in with LinkedIn here proves which
 * profile is theirs.
 */
export default async function SlackLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const { t: token, status } = await searchParams;
  let slack: ReturnType<typeof verifyLinkToken>;
  try {
    slack = verifyLinkToken(token);
  } catch {
    // AUTH_SECRET isn't set, e.g. on a preview deployment
    slack = undefined;
  }
  const session = await auth().catch(() => null);

  return (
    <>
      <PageHero
        eyebrow="Slack"
        title="Link your Slack account."
        lede={
          <p>
            Link Slack to your Latina Dev profile to update your links, what you&apos;re open to and
            more without leaving Slack.
          </p>
        }
      />
      <div className="page-width">
        <div className={styles.stack} style={{ maxWidth: "40rem", paddingBlock: "3rem" }}>
          <div className={styles.panel}>
            {!slack || !token ? (
              <>
                <h2>This link has expired</h2>
                <p>
                  Links from Slack work for 15 minutes. Type <code>/latinadev</code> in Slack to get
                  a new one.
                </p>
              </>
            ) : status === "sent" ? (
              <>
                <h2>Sent! 🎉</h2>
                <p>
                  An organizer will approve your link soon. Once it&apos;s live, open the Latina Dev
                  app&apos;s Home tab in Slack or type <code>/latinadev</code> to edit your profile.
                </p>
              </>
            ) : !session?.ownerHash || !session.user ? (
              <>
                <h2>Sign in</h2>
                <p>
                  Sign in with the LinkedIn account your profile belongs to. It&apos;s the only
                  sign-in we use, and we never post anything to your account.
                </p>
                <SignInButton slack={token} />
              </>
            ) : (
              <SignedIn
                token={token}
                slug={readOwnedSlug(session.ownerHash)}
                linked={linkedSlug(slack.teamId, slack.userId)}
                failed={status === "error"}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SignedIn({
  token,
  slug,
  linked,
  failed,
}: {
  token: string;
  slug?: string;
  linked?: string;
  failed: boolean;
}) {
  if (!slug) {
    return (
      <>
        <h2>Add your profile first</h2>
        <p>
          This LinkedIn account doesn&apos;t have an approved profile yet.{" "}
          <a href="/profile">Add your profile</a> or claim your existing one, and once an organizer
          approves it, type <code>/latinadev</code> in Slack to link it.
        </p>
      </>
    );
  }
  const name = readMemberProfile(slug).frontmatter.name;
  if (linked === slug) {
    return (
      <>
        <h2>You&apos;re already linked ✨</h2>
        <p>
          Your Slack account is linked to {name}. Type <code>/latinadev</code> in Slack to edit your
          profile.
        </p>
      </>
    );
  }
  return (
    <>
      <h2>Link Slack to {name}?</h2>
      {failed && (
        <p className={styles.error} role="alert">
          Something went wrong sending your link. Please try again in a few minutes.
        </p>
      )}
      <p>
        An organizer approves every link, just like profile changes. After that, you can update your
        profile from Slack any time.
      </p>
      <form action={linkSlackAccount}>
        <input type="hidden" name="t" value={token} />
        <button type="submit" className={styles.submit}>
          Link my Slack account
        </button>
      </form>
    </>
  );
}
