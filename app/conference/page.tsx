import { faSlack } from "@fortawesome/free-brands-svg-icons";
import { faHandshake, faStar, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonLink from "@/components/ButtonLink/ButtonLink";
import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Conference",
  description:
    "Latina Dev is exploring the idea of a conference for Latina software engineers. Interested in volunteering? We'd love to hear from you.",
  path: "/conference",
});

const roles = [
  {
    icon: faUsers,
    title: "Logistics",
    body: "Venue research, scheduling, day-of coordination.",
  },
  {
    icon: faStar,
    title: "Programming",
    body: "Speaker outreach, session ideas, agenda planning.",
  },
  {
    icon: faHandshake,
    title: "Community",
    body: "Spreading the word, welcoming attendees, keeping the energy up.",
  },
];

export default function ConferencePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Conference", path: "/conference" },
        ])}
      />
      <PageHero
        eyebrow="An idea in progress"
        title="Conference"
        lede={
          <p>
            We&apos;re exploring the idea of a conference for Latina software engineers — and we
            need your help to make it happen.
          </p>
        }
      />

      {/* The idea */}
      <section className={`page-width ${styles.idea}`} aria-labelledby="idea-heading">
        <h2 id="idea-heading">The Idea</h2>
        <div>
          <p className={styles.body}>
            Nothing is set in stone yet — no venue, no date, no agenda. But we believe the Latina
            Dev community deserves a dedicated in-person space: a day of talks, workshops, and
            genuine connection among Latina engineers at all levels.
          </p>
          <p className={styles.body}>
            If that sounds exciting to you, we&apos;d love your involvement. This only happens if
            the community shows up to build it.
          </p>
        </div>
      </section>

      {/* Volunteer */}
      <section className={`page-width ${styles.volunteer}`} aria-labelledby="volunteer-heading">
        <div className={styles.sectionHeader}>
          <h2 id="volunteer-heading">Interested in Volunteering?</h2>
          <p>
            We&apos;re looking for people who want to help shape this from the ground up —
            logistics, speaker outreach, social media, or whatever skills you bring.
          </p>
        </div>

        <ul className={styles.roleGrid}>
          {roles.map((role) => (
            <li key={role.title} className={styles.role}>
              <FontAwesomeIcon icon={role.icon} className={styles.roleIcon} aria-hidden="true" />
              <h3>{role.title}</h3>
              <p>{role.body}</p>
            </li>
          ))}
        </ul>

        <div className={styles.slack}>
          <p>
            Join our Slack and drop a note in <strong>#conference-volunteers</strong> — we&apos;ll
            take it from there.
          </p>
          <ButtonLink text="Join our Slack" url="/add-member" icon={faSlack} />
        </div>
      </section>
    </>
  );
}
