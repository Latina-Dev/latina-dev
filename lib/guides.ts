import fs from "fs";
import grayMatter from "gray-matter";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { siteName, siteUrl } from "@/lib/site";

// Guides written by Frances Coronel, from her notes. Each is a Markdown file in data/guides.

const guidesPath = "data/guides";

export const guideAuthor = { name: "Frances Coronel", path: "/members/frances-coronel" };

export interface Guide {
  slug: string;
  path: string;
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  updated?: string; // YYYY-MM-DD, when the guide was last revised
  content: string; // Markdown body
}

const readString = (data: Record<string, unknown>, key: string, file: string) => {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${guidesPath}/${file}: frontmatter "${key}" must be a non-empty string`);
  }
  return value.trim();
};

/** Every guide, sorted by title */
export const getGuides = (): Guide[] =>
  fs
    .readdirSync(guidesPath)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, content } = grayMatter(fs.readFileSync(`${guidesPath}/${file}`, "utf8"));
      const slug = file.replace(/\.md$/, "");
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(
          `${guidesPath}/${file}: file names must be lowercase words joined by dashes`
        );
      }
      const published = readString(data, "published", file);
      const updated = typeof data.updated === "string" ? data.updated.trim() : undefined;
      for (const [key, date] of Object.entries({ published, updated })) {
        if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          throw new Error(`${guidesPath}/${file}: "${key}" must be YYYY-MM-DD`);
        }
      }
      return {
        slug,
        path: `/guides/${encodeURIComponent(slug)}`,
        title: readString(data, "title", file),
        description: readString(data, "description", file),
        published,
        updated,
        content,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

/** A guide date for readers, e.g. "October 10, 2026" */
export const formatGuideDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const getGuide = (slug: string) => getGuides().find((guide) => guide.slug === slug);

/** Guide bodies are our own Markdown, so the HTML is trusted */
export const renderGuide = async (guide: Guide) =>
  String(await unified().use(remarkParse).use(remarkHtml).process(guide.content));

/** A guide as a schema.org Article written by Frances */
export const guideJsonLd = (guide: Guide) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${siteUrl}${guide.path}`,
  url: `${siteUrl}${guide.path}`,
  headline: guide.title,
  description: guide.description,
  datePublished: guide.published,
  dateModified: guide.updated ?? guide.published,
  inLanguage: "en",
  author: {
    "@type": "Person",
    "@id": `${siteUrl}${guideAuthor.path}#person`,
    name: guideAuthor.name,
    url: `${siteUrl}${guideAuthor.path}`,
  },
  publisher: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: siteName },
  isPartOf: { "@id": `${siteUrl}/#website` },
});
