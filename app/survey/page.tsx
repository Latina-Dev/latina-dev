import {
  faBuilding,
  faBullhorn,
  faChartColumn,
  faClipboardList,
  faCode,
  faHouseLaptop,
  faLayerGroup,
  faMoneyBillWave,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import JoinButton from "@/components/JoinButton/JoinButton";
import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "State of Latina Engineers survey",
  description:
    "An annual, anonymous survey of Latina software engineers on pay, level, company, remote work and AI tools. A work in progress built by volunteers.",
  path: "/survey",
});

const topics = [
  {
    icon: faMoneyBillWave,
    title: "Pay",
    body: "Base salary, equity and bonus by level and region, and whether Latinas know how their pay compares.",
  },
  {
    icon: faLayerGroup,
    title: "Level and promotion",
    body: "Where Latina engineers sit on the ladder, how long they stay there and who gets promoted.",
  },
  {
    icon: faBuilding,
    title: "Company",
    body: "Company size and type, Latino ERGs, and how many other Latinas are on the team.",
  },
  {
    icon: faHouseLaptop,
    title: "Remote work",
    body: "Remote, hybrid or in office, what people would choose, and how return-to-office mandates land.",
  },
  {
    icon: faWandMagicSparkles,
    title: "AI tools",
    body: "Which AI tools Latina engineers use, how much of their code they write with them and how it feels.",
  },
];

const privacy = [
  "No sign-in and no email: answers aren't tied to who you are.",
  "Pay, age and experience are asked in ranges, not exact numbers.",
  "Every question after the first is optional, with “Prefer not to say” on anything sensitive.",
  "We never publish a number from a group of fewer than 10 people.",
  "Raw answers are never shared, and are deleted 12 months after the report comes out.",
];

const roles = [
  {
    icon: faClipboardList,
    title: "Questions",
    body: "Sharpen the draft questions and help run a short test with a few members.",
  },
  {
    icon: faCode,
    title: "Build",
    body: "Build the form on latina.dev and keep every answer private and anonymous.",
  },
  {
    icon: faChartColumn,
    title: "Analysis",
    body: "Turn the answers into clear charts and a free public report.",
  },
  {
    icon: faBullhorn,
    title: "Outreach",
    body: "Share the survey with Latina engineers in your communities once it opens.",
  },
];

export default function SurveyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "State of Latina Engineers survey", path: "/survey" },
        ])}
      />
      <PageHero
        eyebrow="An idea in progress"
        title="State of Latina Engineers"
        lede={
          <p>
            An annual, anonymous survey of Latina software engineers, built by volunteers from the
            community.
          </p>
        }
      />

      <section className={`page-width ${styles.idea}`} aria-labelledby="why-heading">
        <h2 id="why-heading">Why a survey</h2>
        <div>
          <p className={styles.body}>
            Salary reports and developer surveys rarely break out Latina engineers, so we&apos;re
            left guessing about our own pay, levels and working conditions.
          </p>
          <p className={styles.body}>
            This survey gives Latinas in software engineering real numbers to negotiate with, plan
            careers around and share. The results will be free for anyone to read.
          </p>
        </div>
      </section>

      <section className={`page-width ${styles.volunteer}`} aria-labelledby="topics-heading">
        <div className={styles.sectionHeader}>
          <h2 id="topics-heading">What it covers</h2>
          <p>About 10 minutes, almost all multiple choice.</p>
        </div>

        <ul className={styles.roleGrid}>
          {topics.map((topic) => (
            <li key={topic.title} className={styles.role}>
              <FontAwesomeIcon icon={topic.icon} className={styles.roleIcon} aria-hidden="true" />
              <h3>{topic.title}</h3>
              <p>{topic.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`page-width ${styles.idea}`} aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Your answers stay private</h2>
        <ul className={styles.list}>
          {privacy.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`page-width ${styles.volunteer}`} aria-labelledby="volunteer-heading">
        <div className={styles.sectionHeader}>
          <h2 id="volunteer-heading">Help make it happen</h2>
          <p>
            There&apos;s no launch date yet. This survey happens when enough volunteers help build
            it.
          </p>
        </div>

        <ul className={`${styles.roleGrid} ${styles.roleGridFour}`}>
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
            Want to help? Add your profile to join Latina Dev and the Slack, then say hi and mention
            the survey. We&apos;ll take it from there.
          </p>
          <JoinButton />
        </div>
      </section>
    </>
  );
}
