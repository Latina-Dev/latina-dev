import Link from "next/link";

import PageHero from "@/components/PageHero/PageHero";
import styles from "@/components/ProfileForm/ProfileForm.module.css";
import SignInButton from "@/components/ProfileForm/SignInButton";

const steps = [
  {
    title: "Sign in with LinkedIn",
    body: "It's the only sign-in we use, so every profile is real.",
  },
  { title: "We add you to the directory", body: "An organizer reviews every new profile." },
  { title: "Join us on Slack", body: "We invite you to the Latina Dev Slack community." },
];

export default function AddMemberPage() {
  return (
    <>
      <PageHero
        eyebrow="Join the directory"
        title="Add your profile."
        lede={
          <p>
            Sign in with LinkedIn and fill in your profile. Once an organizer approves it,
            you&apos;ll appear in the Latina Dev member directory and we&apos;ll invite you to our
            Slack community.
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
          <div className={styles.panel}>
            <h2>Get started</h2>
            <p>
              We only support signing in with LinkedIn. We use your name, email and photo from
              LinkedIn, never publish your email, and never post anything to your account.
            </p>
            <SignInButton />
          </div>
          <div className={styles.panel}>
            <h2>Already a member?</h2>
            <p>
              Sign in the same way to claim your existing profile and edit it yourself, any time, on{" "}
              <Link href="/profile">your profile page</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
