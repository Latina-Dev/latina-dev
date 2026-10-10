import Link from "next/link";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { getGuides } from "@/lib/guides";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import { resourceCount, resourceGroups, resourcesJsonLd, resourcesPath } from "@/lib/resources";

import type { Metadata } from "next";

import styles from "./page.module.css";

const description = `${resourceCount} communities, programs, conferences and reads for Latina software engineers at every stage, from K-12 coding programs to engineering leadership.`;

export const metadata: Metadata = pageMetadata({
  title: "Resources and communities for Latina software engineers",
  description,
  path: resourcesPath,
});

export default function ResourcesPage() {
  const guides = getGuides();

  return (
    <>
      <JsonLd
        data={[
          resourcesJsonLd(description),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: resourcesPath },
          ]),
        ]}
      />
      <PageHero
        eyebrow="For every stage of your career"
        title="Resources"
        lede={
          <p>
            Communities, programs and reading for Latina software engineers, whether you&apos;re
            writing your first line of code or leading a team.
          </p>
        }>
        <nav aria-label="Resource categories" className={styles.jump}>
          <a href="#guides">Guides</a>
          {resourceGroups.map((group) => (
            <a key={group.id} href={`#${group.id}`}>
              {group.title}
            </a>
          ))}
        </nav>
      </PageHero>

      <div className={`page-width ${styles.groups}`}>
        <section id="guides" className={styles.group} aria-labelledby="guides-heading">
          <div className={styles.sectionHeader}>
            <h2 id="guides-heading">Guides</h2>
            <p>Advice from Latina Dev founder Frances Coronel.</p>
          </div>
          <ul className={styles.grid}>
            {guides.map((guide) => (
              <li key={guide.slug} className={styles.card}>
                <h3>
                  <Link href={guide.path}>{guide.title}</Link>
                </h3>
                <p>{guide.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {resourceGroups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className={styles.group}
            aria-labelledby={`${group.id}-heading`}>
            <div className={styles.sectionHeader}>
              <h2 id={`${group.id}-heading`}>{group.title}</h2>
              <p>{group.intro}</p>
            </div>
            <ul className={styles.grid}>
              {group.resources.map((resource) => (
                <li key={resource.url} className={styles.card}>
                  <h3>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.name}
                    </a>
                  </h3>
                  <p>{resource.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
