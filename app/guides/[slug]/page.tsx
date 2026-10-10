import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import {
  formatGuideDate,
  getGuide,
  getGuides,
  guideAuthor,
  guideJsonLd,
  renderGuide,
} from "@/lib/guides";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import styles from "../guides.module.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return pageMetadata({ title: guide.title, description: guide.description, path: guide.path });
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const html = await renderGuide(guide);

  return (
    <>
      <JsonLd
        data={[
          guideJsonLd(guide),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: guide.title, path: guide.path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Guide"
        title={guide.title}
        lede={
          <p>
            By <Link href={guideAuthor.path}>{guideAuthor.name}</Link>, founder of Latina Dev
            <br />
            Published <time dateTime={guide.published}>{formatGuideDate(guide.published)}</time>
            {guide.updated && (
              <>
                {" "}
                · Updated <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
              </>
            )}
          </p>
        }
      />
      <article className={`page-width ${styles.article}`}>
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
        <p className={styles.back}>
          <Link href="/resources#guides">More guides and resources</Link>
        </p>
      </article>
    </>
  );
}
