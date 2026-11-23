import Link from "next/link";

import styles from "@/components/JobSearch/JobSearch.module.css";
import StepNav from "@/components/JobSearch/StepNav";
import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import {
  demoteHeadings,
  getJobSearchSteps,
  jobSearchDescription,
  jobSearchJsonLd,
  jobSearchPath,
  jobSearchTitle,
  renderJobSearchMarkdown,
} from "@/lib/jobSearch";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: jobSearchTitle,
  description: jobSearchDescription,
  path: jobSearchPath,
});

// "Where are you right now?" shortcuts into the guide
const startingPoints = [
  { label: "Just getting started", step: "prepare" },
  { label: "Looking for roles", step: "search" },
  { label: "Ready to apply", step: "apply" },
  { label: "Have an interview", step: "interview" },
  { label: "Got an offer", step: "accept" },
];

const editUrl = "https://github.com/Latina-Dev/latina-dev/tree/main/data/job-search";

export default async function JobSearchPage() {
  const steps = getJobSearchSteps();
  const bodies = await Promise.all(
    steps.map((step) => renderJobSearchMarkdown(demoteHeadings(step.content)))
  );

  return (
    <>
      <JsonLd
        data={[
          jobSearchJsonLd({
            path: jobSearchPath,
            title: jobSearchTitle,
            description: jobSearchDescription,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Job search guide", path: jobSearchPath },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Guide"
        title={jobSearchTitle}
        lede={
          <p>
            Five steps to your next software engineering job, from interview prep to negotiating the
            offer. Started by <Link href="/members/frances-coronel">Frances Coronel</Link> in 2017
            as Hire Me, and written for anyone job hunting in tech.
          </p>
        }>
        <div className={styles.start}>
          <p>Where are you right now?</p>
          <ul>
            {startingPoints.map((point) => (
              <li key={point.step}>
                <a href={`#${point.step}`}>{point.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </PageHero>

      <div className={`page-width ${styles.layout}`}>
        <StepNav steps={steps.map(({ slug, number, title }) => ({ slug, number, title }))} />

        <div className={styles.steps}>
          {steps.map((step, i) => (
            <section
              key={step.slug}
              id={step.slug}
              className={styles.step}
              aria-labelledby={`${step.slug}-heading`}>
              <p className={styles.stepNumber}>Step {step.number}</p>
              <h2 id={`${step.slug}-heading`}>{step.title}</h2>
              <p className={styles.stepLede}>{step.description}</p>

              {step.pages.length > 0 && (
                <ul className={styles.cards} aria-label={`Go deeper on ${step.title}`}>
                  {step.pages.map((page) => (
                    <li key={page.slug}>
                      <Link href={page.path}>
                        <strong>{page.title}</strong>
                        <span>{page.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.body} dangerouslySetInnerHTML={{ __html: bodies[i] }} />
            </section>
          ))}

          <section className={styles.more} aria-labelledby="more-heading">
            <h2 id="more-heading">Keep going</h2>
            <ul className={styles.cards}>
              <li>
                <a href="https://apprenticeships.me">
                  <strong>Apprenticeships.me</strong>
                  <span>
                    No CS degree? A directory of paid tech apprenticeships that train you on the
                    job.
                  </span>
                </a>
              </li>
              <li>
                <Link href="/resources/jobs">
                  <strong>Job boards for Latina engineers</strong>
                  <span>Job boards and hiring platforms focused on diversity in tech.</span>
                </Link>
              </li>
              <li>
                <Link href="/members">
                  <strong>Latina Dev directory</strong>
                  <span>Find Latina engineers to ask for advice, referrals and warm intros.</span>
                </Link>
              </li>
            </ul>
            <p className={styles.edit}>
              Know a resource that should be here? <a href={editUrl}>Suggest an edit on GitHub</a>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
