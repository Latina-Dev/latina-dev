import fs from "fs";
import { z } from "zod";

import { parseFrontmatter } from "@/lib/frontmatter";
import { siteUrl } from "@/lib/site";

import { MemberInterface } from "@/types/members";

// Employee resource groups (ERGs) for Latinas and Latinos inside companies. Each one is a file in
// data/ergs, named after the company. The list started from Frances Coronel's notes and has not
// been checked against each company since, so the page asks readers for corrections.

const ergPath = "data/ergs";

export const ergsPath = "/ergs";

// The guide on starting an ERG, linked from the page and the feeds
export const ergGuidePath = "/guides/starting-a-latinx-erg";

const text = z
  .string()
  .min(1, "must not be empty")
  .refine((value) => value === value.trim(), "must not start or end with a space");

/** Frontmatter of each file in data/ergs. Unknown keys are rejected so typos fail the build */
const ergSchema = z.strictObject({
  company: text,
  name: text, // what the group calls itself, e.g. "Somos"
  // A public page about the group, when the company has one
  url: text.pipe(z.url({ protocol: /^https?$/, message: "must be a full http(s) URL" })).optional(),
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
export const ergsDescription = `${ergs.length} companies with an employee resource group for Latina and Latino employees, with the name each group goes by, plus a guide to starting one where you work.`;

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
        url: erg.url ?? ergPage(erg),
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
    `${ergs.length} companies with an employee resource group for Latina and Latino employees, listed by Latina Dev (${siteUrl}${ergsPath}). An ERG is an employee-led group inside a company. This list started from notes by Frances Coronel, founder of Latina Dev, and group names can change, so confirm with the company.`,
    "",
    "| Company | ERG name | More |",
    "| --- | --- | --- |",
    ...ergs.map((erg) => `| ${erg.company} | ${erg.name} | ${erg.url ?? ergPage(erg)} |`),
    "",
    "## Starting one",
    "",
    `No Latinx ERG where you work? Read [How to start a Latinx ERG at your company](${siteUrl}${ergGuidePath}).`,
    "",
  ].join("\n");
