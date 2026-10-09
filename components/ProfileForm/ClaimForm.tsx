"use client";

import { useActionState } from "react";
import { claimProfile, ProfileActionState } from "@/app/profile/actions";

import styles from "./ProfileForm.module.css";

interface Props {
  profiles: { slug: string; name: string }[];
  suggested?: string; // slug whose name matches the LinkedIn account
}

/** Lets an existing member link their LinkedIn sign-in to their directory profile */
export default function ClaimForm({ profiles, suggested }: Props) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(claimProfile, {
    status: "idle",
  });

  if (state.status === "submitted") {
    return (
      <p className={styles.notice} role="status">
        Thanks! We&apos;ll confirm it&apos;s you and link your account. You can edit your profile
        here once that&apos;s done.
      </p>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="slug" className={styles.label}>
          Your profile
        </label>
        <select
          id="slug"
          name="slug"
          required
          defaultValue={suggested ?? ""}
          className={styles.input}>
          <option value="">Select your name…</option>
          {profiles.map((profile) => (
            <option key={profile.slug} value={profile.slug}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>
      {state.status === "error" && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={styles.secondary}>
        {pending ? "Sending…" : "This is me"}
      </button>
    </form>
  );
}
