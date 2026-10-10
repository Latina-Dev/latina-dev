import { Fragment } from "react";
import Link from "next/link";

import ResourceDirectory from "@/components/ResourceDirectory/ResourceDirectory";
import styles from "@/components/ResourceDirectory/ResourceDirectory.module.css";

import { formatGuideDate, getGuides } from "@/lib/guides";
import { faqJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import {
  resourceCount,
  resourceFaqs,
  resourceGroups,
  resourceSlug,
  resourcesPath,
} from "@/lib/resources";

import type { Metadata } from "next";

const title = "Resources and communities for Latina software engineers";
const description = `${resourceCount} communities, programs, job boards, conferences and reads for Latina software engineers at every stage, from K-12 coding programs to engineering leadership.`;

export const metadata: Metadata = pageMetadata({ title, description, path: resourcesPath });

export default function ResourcesPage() {
  const guides = getGuides();
  const faqs = resourceFaqs();

  return (
    <ResourceDirectory
      heading="Resources for Latina software engineers"
      title={title}
      intro={description}
      path={resourcesPath}
      groups={resourceGroups}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Resources", path: resourcesPath },
      ]}
      extraJsonLd={[faqJsonLd(faqs)]}
      after={
        <>
          <section id="guides" className={styles.extra} aria-labelledby="guides-heading">
            <h2 id="guides-heading">Guides</h2>
            <ul className={styles.guides}>
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link href={guide.path}>
                    <strong>{guide.title}</strong>
                    <span>{guide.description}</span>
                    <time dateTime={guide.updated ?? guide.published}>
                      {guide.updated ? "Updated" : "Published"}{" "}
                      {formatGuideDate(guide.updated ?? guide.published)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.faq} aria-labelledby="faq-heading">
            <h2 id="faq-heading">Questions</h2>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>
                  {faq.group.summary} Latina Dev recommends{" "}
                  {faq.group.resources.map((resource, i) => (
                    <Fragment key={resource.name}>
                      {i > 0 && ", "}
                      <a href={`#${resourceSlug(resource)}`}>{resource.name}</a>
                    </Fragment>
                  ))}
                  . See the <Link href={`${resourcesPath}/${faq.group.id}`}>{faq.group.title}</Link>{" "}
                  page.
                </p>
              </details>
            ))}
          </section>
        </>
      }
    />
  );
}
