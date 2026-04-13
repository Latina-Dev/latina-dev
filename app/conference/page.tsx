import { faSlack } from "@fortawesome/free-brands-svg-icons";
import { faHandshake, faStar, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Conference",
  description:
    "Latina Dev is exploring the idea of a conference for Latina software engineers. Interested in volunteering? We'd love to hear from you.",
  openGraph: {
    title: "Conference | Latina Dev",
    description:
      "We're exploring a conference for Latina engineers. Help us make it happen — volunteer interest now open.",
    images: [{ url: "/img/featured-image.png", width: 1200, height: 630 }],
  },
};

export default function ConferencePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.tag}>An idea in progress</p>
        <h1 className={styles.title}>Conference</h1>
        <p className={styles.subtitle}>
          We&apos;re exploring the idea of a conference for Latina software engineers — and we need
          your help to make it happen.
        </p>
      </section>

      <hr className={styles.divider} />

      {/* The idea */}
      <section className={styles.section}>
        <h2>The Idea</h2>
        <p className={styles.body}>
          Nothing is set in stone yet — no venue, no date, no agenda. But we believe the Latina Dev
          community deserves a dedicated in-person space: a day of talks, workshops, and genuine
          connection among Latina engineers at all levels.
        </p>
        <p className={styles.body}>
          If that sounds exciting to you, we&apos;d love your involvement. This only happens if the
          community shows up to build it.
        </p>
      </section>

      {/* Volunteer */}
      <section className={styles.section}>
        <h2>Interested in Volunteering?</h2>
        <p className={styles.body}>
          We&apos;re looking for people who want to help shape this from the ground up — logistics,
          speaker outreach, social media, or whatever skills you bring.
        </p>

        <div className={styles.roleGrid}>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faUsers} className={styles.roleIcon} />
            <h3>Logistics</h3>
            <p>Venue research, scheduling, day-of coordination.</p>
          </div>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faStar} className={styles.roleIcon} />
            <h3>Programming</h3>
            <p>Speaker outreach, session ideas, agenda planning.</p>
          </div>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faHandshake} className={styles.roleIcon} />
            <h3>Community</h3>
            <p>Spreading the word, welcoming attendees, keeping the energy up.</p>
          </div>
        </div>

        <p className={styles.body}>
          Join our Slack and drop a note in <strong>#conference-volunteers</strong> — we&apos;ll
          take it from there.
        </p>
        <div className={styles.volunteerCta}>
          <ButtonLink text="Join our Slack" url="/add-member" icon={faSlack} />
        </div>
      </section>
    </div>
  );
}
