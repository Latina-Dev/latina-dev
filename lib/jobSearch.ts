import fs from "fs";
import { defaultSchema } from "hast-util-sanitize";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { parseFrontmatter } from "@/lib/frontmatter";
import { jobSearchPath } from "@/lib/jobSearchLegacy";
import { siteName, siteUrl } from "@/lib/site";

export { jobSearchPath };

// The job search guide, moved here from the hire-me repo (engjobsearch.com). Five steps, each a
// Markdown file in data/job-search with `step: <number>`, plus deeper pages that name the step
// they belong to with `step: "<step slug>"`.

const jobSearchDir = "data/job-search";

export const jobSearchTitle = "The tech job search guide";
export const jobSearchDescription =
  "A free, step-by-step guide to landing a software engineering job: prepare for interviews, search for roles, apply, interview and negotiate your offer.";

export interface JobSearchPage {
  slug: string;
  path: string;
  title: string;
  description: string;
  content: string; // Markdown body
}

export interface JobSearchStep extends JobSearchPage {
  number: number;
  pages: JobSearchPage[]; // deeper pages for this step, in file order
}

const readString = (data: Record<string, unknown>, key: string, file: string) => {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${jobSearchDir}/${file}: frontmatter "${key}" must be a non-empty string`);
  }
  return value.trim();
};

// Deep pages in the order the old hire-me sidebar listed them
const pageOrder = [
  "product-manager",
  "company-research",
  "conference-scholarships",
  "online-presence",
  "listing-skills",
  "cover-letters",
  "replying-to-recruiters",
  "interview-checklist",
  "introducing-yourself",
  "answering-questions",
  "asking-questions",
  "following-up",
  "negotiating-salary",
];

const readFiles = () =>
  fs
    .readdirSync(jobSearchDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(
          `${jobSearchDir}/${file}: file names must be lowercase words joined by dashes`
        );
      }
      const { data, content } = parseFrontmatter(
        fs.readFileSync(`${jobSearchDir}/${file}`, "utf8")
      );
      return { file, slug, data, content };
    });

/** The five steps in order, each with its deeper pages */
export const getJobSearchSteps = (): JobSearchStep[] => {
  const files = readFiles();
  const steps: JobSearchStep[] = files
    .filter(({ data }) => typeof data.step === "number")
    .map(({ file, slug, data, content }) => ({
      slug,
      number: data.step as number,
      path: `${jobSearchPath}#${slug}`,
      title: readString(data, "title", file),
      description: readString(data, "description", file),
      content,
      pages: [],
    }))
    .sort((a, b) => a.number - b.number);

  for (const { file, slug, data, content } of files) {
    if (typeof data.step === "number") continue;
    const stepSlug = readString(data, "step", file);
    const step = steps.find((s) => s.slug === stepSlug);
    if (!step) throw new Error(`${jobSearchDir}/${file}: no step named "${stepSlug}"`);
    step.pages.push({
      slug,
      path: `${jobSearchPath}/${slug}`,
      title: readString(data, "title", file),
      description: readString(data, "description", file),
      content,
    });
  }
  const rank = (slug: string) => {
    const i = pageOrder.indexOf(slug);
    return i === -1 ? pageOrder.length : i;
  };
  for (const step of steps) step.pages.sort((a, b) => rank(a.slug) - rank(b.slug));
  return steps;
};

/** Every deeper page, across all steps */
export const getJobSearchPages = () => getJobSearchSteps().flatMap((step) => step.pages);

/** A deeper page and the step it belongs to */
export const getJobSearchPage = (slug: string) => {
  for (const step of getJobSearchSteps()) {
    const page = step.pages.find((p) => p.slug === slug);
    if (page) return { page, step };
  }
  return undefined;
};

/** Push every Markdown heading down one level, outside code blocks */
export const demoteHeadings = (markdown: string) => {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^(```|~~~)/.test(line)) inFence = !inFence;
      if (!inFence && /^#{1,5} /.test(line)) return `#${line}`;
      return line;
    })
    .join("\n");
};

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hProperties?: Record<string, string> };
}

const nodeText = (node: MdNode): string =>
  node.value ?? (node.children ?? []).map(nodeText).join("");

/** GitHub-style heading slug, so links like #cracking-the-pm-interview keep working */
export const headingSlug = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");

/** Give each heading an id, numbering repeats the way GitHub does (-1, -2) */
const remarkHeadingIds = () => (tree: MdNode) => {
  const seen = new Map<string, number>();
  const walk = (node: MdNode) => {
    if (node.type === "heading") {
      const base = headingSlug(nodeText(node));
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      node.data = { ...node.data, hProperties: { id: count ? `${base}-${count}` : base } };
    }
    node.children?.forEach(walk);
  };
  walk(tree);
};

/**
 * Guide bodies are our own Markdown, so the HTML is trusted. Deep pages get heading ids for
 * their in-page links; the step page leaves them off so they can't clash with the step ids.
 */
export const renderJobSearchMarkdown = async (
  markdown: string,
  { headingIds = false }: { headingIds?: boolean } = {}
) => {
  const processor = unified().use(remarkParse);
  if (headingIds) processor.use(remarkHeadingIds);
  // Keep the default sanitizing, but without the user-content- prefix so ids match the links
  return String(
    await processor
      .use(remarkHtml, { sanitize: { ...defaultSchema, clobberPrefix: "" } })
      .process(markdown)
  );
};

/** The guide as a schema.org Article by Frances */
export const jobSearchJsonLd = (page: { path: string; title: string; description: string }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${siteUrl}${page.path}`,
  url: `${siteUrl}${page.path}`,
  headline: page.title,
  description: page.description,
  inLanguage: "en",
  author: {
    "@type": "Person",
    "@id": `${siteUrl}/members/frances-coronel#person`,
    name: "Frances Coronel",
    url: `${siteUrl}/members/frances-coronel`,
  },
  publisher: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: siteName },
  isPartOf: { "@id": `${siteUrl}/#website` },
});
