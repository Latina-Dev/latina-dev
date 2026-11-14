import { faSlack } from "@fortawesome/free-brands-svg-icons";
import {
  faBuilding,
  faHouseLaptop,
  faLayerGroup,
  faMoneyBillWave,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonLink from "@/components/ButtonLink/ButtonLink";
import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "State of Latina Engineers survey",
  description:
    "An annual, anonymous survey of Latina software engineers on pay, level, company, remote work and AI tools. Opening in early 2027.",
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

const steps = [
  { when: "Now", what: "Finalizing the questions." },
  { when: "Winter 2026", what: "A short test run with members of the Latina Dev Slack." },
  { when: "Early 2027", what: "The survey opens to every Latina software engineer for six weeks." },
  { when: "Spring 2027", what: "A free public report here on latina.dev." },
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
        eyebrow="Work in progress"
        title="State of Latina Engineers"
        lede={
          <p>
            An annual, anonymous survey of Latina software engineers. Opening in early 2027, with a
            goal of 200+ responses in its first year.
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

      <section className={`page-width ${styles.volunteer}`} aria-labelledby="timeline-heading">
        <div className={styles.sectionHeader}>
          <h2 id="timeline-heading">Timeline</h2>
          <p>Dates may shift while we finish the questions.</p>
        </div>

        <ol className={styles.timeline}>
          {steps.map((step) => (
            <li key={step.when}>
              <strong>{step.when}</strong>
              <span>{step.what}</span>
            </li>
          ))}
        </ol>

        <div className={styles.slack}>
          <p>
            Want to help test the survey or share it when it opens? Join the Latina Dev Slack and
            we&apos;ll let you know.
          </p>
          <ButtonLink text="Join our Slack" url="/add-member" icon={faSlack} />
        </div>
      </section>
    </>
  );
}
