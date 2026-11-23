import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/components/JobSearch/JobSearch.module.css";
import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import {
  getJobSearchPage,
  getJobSearchPages,
  jobSearchJsonLd,
  jobSearchPath,
  renderJobSearchMarkdown,
} from "@/lib/jobSearch";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getJobSearchPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getJobSearchPage((await params).slug);
  if (!found) return {};
  return pageMetadata({
    title: found.page.title,
    description: found.page.description,
    path: found.page.path,
  });
}

export default async function JobSearchDeepPage({ params }: Props) {
  const found = getJobSearchPage((await params).slug);
  if (!found) notFound();
  const { page, step } = found;
  const html = await renderJobSearchMarkdown(page.content);
  const siblings = step.pages.filter((p) => p.slug !== page.slug);

  return (
    <>
      <JsonLd
        data={[
          jobSearchJsonLd(page),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Job search guide", path: jobSearchPath },
            { name: page.title, path: page.path },
          ]),
        ]}
      />
      <PageHero
        before={
          <p className={styles.crumb}>
            <Link href={jobSearchPath}>Job search guide</Link> ·{" "}
            <Link href={step.path}>
              Step {step.number}: {step.title}
            </Link>
          </p>
        }
        title={page.title}
        lede={<p>{page.description}</p>}
      />
      <article className={`page-width ${styles.article}`}>
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
        {siblings.length > 0 && (
          <nav className={styles.more} aria-labelledby="siblings-heading">
            <h2 id="siblings-heading">More on {step.title.toLowerCase()}</h2>
            <ul className={styles.cards}>
              {siblings.map((sibling) => (
                <li key={sibling.slug}>
                  <Link href={sibling.path}>
                    <strong>{sibling.title}</strong>
                    <span>{sibling.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <p className={styles.back}>
          <Link href={step.path}>Back to step {step.number} of the job search guide</Link>
        </p>
      </article>
    </>
  );
}
