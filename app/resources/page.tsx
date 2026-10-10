import Link from "next/link";

import ResourceDirectory from "@/components/ResourceDirectory/ResourceDirectory";
import styles from "@/components/ResourceDirectory/ResourceDirectory.module.css";

import { getGuides } from "@/lib/guides";
import { faqJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import { resourceCount, resourceFaqs, resourceGroups, resourcesPath } from "@/lib/resources";

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
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>
        </>
      }
    />
  );
}
