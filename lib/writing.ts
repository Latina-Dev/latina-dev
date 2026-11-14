import fs from "fs";
import { z } from "zod";

import { readMemberFiles } from "@/lib/getMembers";
import { siteUrl } from "@/lib/site";

// Posts members publish on their own blogs. A daily run reads the RSS or Atom feed in each member's
// `blog` profile field, shares new posts in the Latina Dev Slack, and writes them to
// data/writing/<member-slug>.json through a pull request. These pages only list and link to them:
// every post stays on the author's own site, which keeps the canonical URL and the SEO credit.

const writingDataPath = "data/writing";

export const writingPath = "/writing";
export const writingFeedPath = "/writing.xml";

export const writingTitle = "Writing by Latina software engineers";
export const writingDescription =
  "Blog posts written by Latina software engineers in the Latina Dev directory, newest first, each linking to the author's own site.";

const text = z
  .string()
  .min(1, "must not be empty")
  .refine((value) => value === value.trim(), "must not start or end with a space");

const httpsUrl = z.url({ protocol: /^https$/, message: "must be an https:// URL" });

const postSchema = z.strictObject({
  title: text.max(300, "must be 300 characters or fewer"),
  url: httpsUrl,
  published: z.iso.datetime({
    message: "must be an ISO date and time, e.g. 2026-11-12T15:00:00Z",
  }),
  // Plain text from the start of the post, for the list and for search
  summary: text.max(400, "must be 400 characters or fewer").optional(),
});

/** Each file in data/writing. Unknown keys fail the build */
const writingFileSchema = z.strictObject({
  feed: httpsUrl, // the member's `blog` field when the posts were read
  posts: z.array(postSchema),
  // Post URLs an organizer hid with a 🚫 in #member-posts; the daily run keeps them out on every read
  hidden: z.array(httpsUrl).optional(),
});

export type WritingFile = z.infer<typeof writingFileSchema>;

export interface WritingPost extends z.infer<typeof postSchema> {
  author: string;
  authorSlug: string;
  authorPath: string; // the author's profile, e.g. /members/frances-coronel
}

/** Writer details the list needs from each member profile */
export interface WritingAuthor {
  slug: string;
  name: string;
  blog?: string;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate one file in data/writing
 * @param file e.g. frances-coronel.json, named after the author's profile
 * @param json the file's contents
 */
export const parseWritingFile = (file: string, json: string): WritingFile => {
  const slug = file.replace(/\.json$/, "");
  if (!file.endsWith(".json") || !slugPattern.test(slug)) {
    throw new Error(
      `${writingDataPath}/${file}: name it after a member profile, e.g. ana-lopez.json`
    );
  }
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error(`${writingDataPath}/${file}: not valid JSON`);
  }
  const result = writingFileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`${writingDataPath}/${file}\n${z.prettifyError(result.error)}`);
  }
  return result.data;
};

/**
 * Join posts to their authors, newest first. Posts are left out when the member has left the
 * directory or cleared her `blog` field, so the site never waits on the next daily run, and
 * when an organizer hid them.
 */
export const collectWriting = (
  files: { slug: string; data: WritingFile }[],
  authors: WritingAuthor[]
): WritingPost[] => {
  const bySlug = new Map(authors.map((author) => [author.slug, author]));
  const seen = new Set<string>();
  return files
    .flatMap(({ slug, data }) => {
      const author = bySlug.get(slug);
      if (!author?.blog) return [];
      const hidden = new Set(data.hidden);
      return data.posts
        .filter((post) => !hidden.has(post.url))
        .map((post) => ({
          ...post,
          author: author.name,
          authorSlug: slug,
          authorPath: `/members/${encodeURIComponent(slug)}`,
        }));
    })
    .filter((post) => {
      // A post can appear twice when a feed lists it under two URLs that normalize the same
      if (seen.has(post.url)) return false;
      seen.add(post.url);
      return true;
    })
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
};

const readWritingFiles = () => {
  let files: string[];
  try {
    files = fs.readdirSync(writingDataPath).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  return files.map((file) => ({
    slug: file.replace(/\.json$/, ""),
    data: parseWritingFile(file, fs.readFileSync(`${writingDataPath}/${file}`, "utf8")),
  }));
};

let cache: WritingPost[] | undefined;

/** Every listed post, newest first */
export const getWriting = (): WritingPost[] =>
  (cache ??= collectWriting(
    readWritingFiles(),
    readMemberFiles().map(({ slug, data }) => ({ slug, name: data.name, blog: data.blog }))
  ));

/** The newest posts by one member, for her profile page */
export const getMemberWriting = (slug: string, limit = 3) =>
  getWriting()
    .filter((post) => post.authorSlug === slug)
    .slice(0, limit);

/** A date for readers, e.g. "November 12, 2026" */
export const formatWritingDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

/** One post for the JSON feed and the MCP server */
export const writingForAgents = (post: WritingPost) => ({
  title: post.title,
  url: post.url,
  published: post.published,
  author: post.author,
  authorProfile: `${siteUrl}${post.authorPath}`,
  ...(post.summary ? { summary: post.summary } : {}),
});

/** The /writing page as a schema.org CollectionPage listing each post as a BlogPosting */
export const writingJsonLd = (posts: WritingPost[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${siteUrl}${writingPath}`,
  url: `${siteUrl}${writingPath}`,
  name: writingTitle,
  description: writingDescription,
  inLanguage: "en",
  isPartOf: { "@id": `${siteUrl}/#website` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        url: post.url,
        datePublished: post.published,
        ...(post.summary ? { abstract: post.summary } : {}),
        author: {
          "@type": "Person",
          "@id": `${siteUrl}${post.authorPath}#person`,
          name: post.author,
          url: `${siteUrl}${post.authorPath}`,
        },
      },
    })),
  },
});

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** RSS 2.0 feed of the newest posts, so readers and agents can follow along */
export const writingRss = (posts: WritingPost[], limit = 50) => {
  const items = posts
    .slice(0, limit)
    .map((post) =>
      [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(post.url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(post.url)}</guid>`,
        `      <pubDate>${new Date(post.published).toUTCString()}</pubDate>`,
        `      <dc:creator>${escapeXml(post.author)}</dc:creator>`,
        ...(post.summary ? [`      <description>${escapeXml(post.summary)}</description>`] : []),
        "    </item>",
      ].join("\n")
    );
  const updated = posts[0] ? new Date(posts[0].published) : undefined;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(writingTitle)}</title>`,
    `    <link>${siteUrl}${writingPath}</link>`,
    `    <description>${escapeXml(writingDescription)}</description>`,
    "    <language>en-us</language>",
    `    <atom:link href="${siteUrl}${writingFeedPath}" rel="self" type="application/rss+xml"/>`,
    ...(updated ? [`    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};
