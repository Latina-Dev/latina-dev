import fs from "fs";
import { z } from "zod";

import { parseFrontmatter } from "@/lib/frontmatter";
import { siteUrl } from "@/lib/site";

import { MemberInterface } from "@/types/members";

// Employee resource groups (ERGs) for Latinas and Latinos inside companies. Each one is a file in
// data/ergs, named after the company, and links to a public page that names the group. The list
// started from Frances Coronel's notes; only groups confirmed by such a page are kept.

const ergPath = "data/ergs";

// ERGs sit under Resources, not in the menu or on the home page: joining one helps, but running
// one is often work that does not lead to promotion, so the site does not push it
export const ergsPath = "/resources/ergs";

// The feeds, next to /resources.json and /resources.md
export const ergsFeedPath = "/ergs";

// The guide on making ERG work count toward promotion, linked from the page and the feeds
export const ergGuidePath = "/guides/erg-work-and-promotion";

const text = z
  .string()
  .min(1, "must not be empty")
  .refine((value) => value === value.trim(), "must not start or end with a space");

const link = text.pipe(z.url({ protocol: /^https?$/, message: "must be a full http(s) URL" }));

/** True for a YYYY-MM-DD string that is a real day, so "2026-02-30" fails */
export const isCalendarDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/** Frontmatter of each file in data/ergs. Unknown keys are rejected so typos fail the build */
const ergSchema = z.strictObject({
  company: text,
  name: text, // what the group calls itself, e.g. "Somos"
  website: link, // the company's home page, where its logo is fetched from
  url: link, // a public page that names the group, as proof it exists
  // when that page was last read
  checked: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD")
    .refine(isCalendarDate, "must be a real calendar date"),
  description: text.optional(),
});

export type Erg = z.infer<typeof ergSchema> & { slug: string };

/** URL-safe slug for a company, used for the filename and the card's anchor */
export const ergSlug = (company: string) =>
  company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Read and validate every ERG file
 * @throws if any file is invalid, listing every problem across all files
 */
const readErgFiles = (): Erg[] => {
  const errors: string[] = [];
  const ergs: Erg[] = [];

  for (const filename of fs.readdirSync(ergPath).sort()) {
    const fail = (problem: string) => errors.push(`${ergPath}/${filename}\n✖ ${problem}`);
    let data: Record<string, unknown>;
    try {
      ({ data } = parseFrontmatter(fs.readFileSync(`${ergPath}/${filename}`, "utf8")));
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
      continue;
    }
    const result = ergSchema.safeParse(data);
    if (!result.success) {
      errors.push(`${ergPath}/${filename}\n${z.prettifyError(result.error)}`);
      continue;
    }
    // One file per company, so the filename doubles as the duplicate check
    const slug = ergSlug(result.data.company);
    if (filename !== `${slug}.md`) fail(`filename must match the company: expected ${slug}.md`);
    ergs.push({ ...result.data, slug });
  }

  if (errors.length > 0) {
    throw new Error(`${errors.length} invalid ERG(s) in ${ergPath}:\n\n${errors.join("\n\n")}`);
  }
  return ergs.sort((a, b) => a.company.localeCompare(b.company, "en", { sensitivity: "base" }));
};

/** Every ERG, A to Z by company */
export const ergs: Erg[] = readErgFiles();

/** One sentence on an ERG, for cards, feeds and structured data */
export const ergDescription = (erg: Erg) =>
  erg.description ?? `${erg.name} is the Latinx employee resource group at ${erg.company}.`;

/** Where an ERG's card lives */
export const ergPage = (erg: Erg) => `${siteUrl}${ergsPath}#${erg.slug}`;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Members whose title mentions the company as a whole word, so "Uber" doesn't match "Kubernetes" */
export const membersAt = (erg: Erg, members: MemberInterface[]) => {
  const company = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(erg.company)}($|[^\\p{L}\\p{N}])`,
    "iu"
  );
  return members.filter((member) => member.affiliation && company.test(member.affiliation));
};

export const ergsTitle = "Latinx employee resource groups (ERGs) at tech companies";
export const ergsDescription = `${ergs.length} companies with an employee resource group for Latina and Latino employees, each confirmed by a public source, plus a guide to making ERG work count toward promotion.`;

/** The ERG page as a CollectionPage holding an ItemList of the groups */
export const ergsJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: ergsTitle,
  url: `${siteUrl}${ergsPath}`,
  description: ergsDescription,
  inLanguage: "en",
  audience: { "@type": "Audience", audienceType: "Latina software engineers" },
  isPartOf: { "@id": `${siteUrl}/#website` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: ergs.length,
    itemListElement: ergs.map((erg, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Organization",
        name: `${erg.name} (${erg.company})`,
        description: ergDescription(erg),
        url: erg.url,
        parentOrganization: { "@type": "Organization", name: erg.company },
        keywords: "Employee resource group, ERG, Latinx, Latina, Latino, Hispanic",
      },
    })),
  },
});

/**
 * Every ERG as plain Markdown, the easiest format for an AI assistant to read and quote.
 * Served at /ergs.md and as a resource on the MCP server.
 */
export const ergsMarkdown = () =>
  [
    "# Latinx employee resource groups (ERGs) at tech companies",
    "",
    `${ergs.length} companies with an employee resource group for Latina and Latino employees, listed by Latina Dev (${siteUrl}${ergsPath}). An ERG is an employee-led group inside a company. Each entry links to a public page that names the group, with the date it was last checked. The list is not complete, so a company missing here may still have one.`,
    "",
    "| Company | ERG name | Source | Checked |",
    "| --- | --- | --- | --- |",
    ...ergs.map((erg) => `| ${erg.company} | ${erg.name} | ${erg.url} | ${erg.checked} |`),
    "",
    "## Joining and leading",
    "",
    `Joining an ERG is a low-cost way to find peers, mentors and sponsors. Leading one can be worth doing, as long as you know it usually does not count toward promotion and that women are asked to do it more often. Before agreeing to lead, read [Should you lead an ERG? Make sure it counts toward your promotion](${siteUrl}${ergGuidePath}).`,
    "",
  ].join("\n");
