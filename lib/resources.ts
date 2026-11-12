import fs from "fs";

import { parseFrontmatter } from "@/lib/frontmatter";
import { ResourceFrontmatter, validateResourceFrontmatter } from "@/lib/resourceSchema";
import { siteUrl } from "@/lib/site";

import { resourceGroupIds } from "@/types/resources";

// Communities and resources for Latina software engineers, grouped by career stage. Curated by
// Frances Coronel from her Notion notes, plus newer ones found in October and November 2026. Each resource is
// one file in data/resources, named by its slug; the groups below are the pages that list them.
// Every entry is rendered in the page HTML and in the page's JSON-LD.

const resourcePath = "data/resources";

/** One resource: the frontmatter of its file in data/resources */
export type Resource = Omit<ResourceFrontmatter, "group">;

export interface ResourceGroup {
  id: (typeof resourceGroupIds)[number]; // anchor on /resources and the slug of its own page, /resources/<id>
  title: string;
  intro: string;
  // h1 and meta description of /resources/<id>, phrased the way people search
  heading: string;
  summary: string;
  // The question this group answers, for the FAQ on /resources and its FAQPage JSON-LD
  question: string;
  resources: Resource[];
}

const groups: Omit<ResourceGroup, "resources">[] = [
  {
    id: "latina-communities",
    title: "Communities for Latinas in tech",
    intro: "Groups built by and for Latinas and women of color working in tech.",
    heading: "Communities for Latinas in tech",
    summary:
      "Communities and nonprofits that connect, mentor and support Latina women working in tech and software engineering.",
    question: "What communities are there for Latina software engineers?",
  },
  {
    id: "latino-tech-communities",
    title: "Latino tech communities",
    intro:
      "Larger Latino tech communities where Latina engineers can network, find jobs and mentors.",
    heading: "Latino tech communities for Latina software engineers",
    summary:
      "Latino tech communities, Slack groups and nonprofits where Latina software engineers can network, find jobs and get mentorship.",
    question: "What are the biggest Latino tech communities Latina engineers can join?",
  },
  {
    id: "k-12",
    title: "Students: K-12",
    intro: "Programs that introduce Latina girls and teens to coding.",
    heading: "Coding programs for Latina K-12 students",
    summary: "Free and low-cost coding and STEM programs for Latina girls and teens in the US.",
    question: "Where can Latina girls learn to code?",
  },
  {
    id: "college",
    title: "Students: college",
    intro: "Communities, scholarships and career prep for Latinas in college.",
    heading: "Programs and scholarships for Latina computer science students",
    summary:
      "Communities, scholarships and career prep for Latina college students studying computer science.",
    question: "What programs help Latina computer science students in college?",
  },
  {
    id: "jobs",
    title: "Find a job",
    intro:
      "Job boards and hiring platforms focused on diversity in tech, including companies that skip whiteboard interviews.",
    heading: "Job boards for Latina software engineers",
    summary:
      "Job boards and hiring platforms focused on diversity in tech, including companies that skip whiteboard interviews.",
    question: "Where can Latina software engineers find jobs?",
  },
  {
    id: "career-growth",
    title: "Career growth and leadership",
    intro: "Professional associations and programs for Latina engineers moving up.",
    heading: "Career growth and leadership for Latina engineers",
    summary:
      "Professional associations, cohorts and leadership programs for Latina engineers moving into senior and executive roles.",
    question: "How can Latina engineers grow into senior and leadership roles?",
  },
  {
    id: "conferences",
    title: "Conferences",
    intro: "Gatherings where Latina technologists can meet in person.",
    heading: "Conferences for Latina technologists",
    summary:
      "Conferences and summits where Latina engineers, cybersecurity professionals and tech leaders meet.",
    question: "What conferences are there for Latinas in tech?",
  },
  {
    id: "founders",
    title: "Founders",
    intro: "Support for Latinas starting their own companies.",
    heading: "Support for Latina tech founders",
    summary: "Accelerators and communities for Latina founders building tech companies.",
    question: "Where can Latina founders find support for a tech startup?",
  },
  {
    id: "listen-and-read",
    title: "Listen and read",
    intro: "Podcasts, newsletters, blogs and research on Latinas in tech.",
    heading: "Podcasts, newsletters and reports on Latinas in tech",
    summary:
      "Podcasts, newsletters, blogs and research reports about Latinas in tech and engineering.",
    question: "What podcasts, newsletters and research cover Latinas in tech?",
  },
];

// Sort key ignoring punctuation, so "#LatinaGeeks" and "/path2lead" sort by their letters
const sortName = (name: string) => name.replace(/[^\p{L}\p{N} ]/gu, "");

/** URL-safe slug for a resource, used for its filename, its logo file and its anchor */
export const resourceSlug = (resource: Pick<Resource, "name">) =>
  resource.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Read and validate every resource file
 * @returns each resource's frontmatter, including the group it belongs to
 * @throws if any file is invalid, listing every problem across all files
 */
const readResourceFiles = () => {
  const errors: string[] = [];
  const resources: ResourceFrontmatter[] = [];
  const urls = new Map<string, string>();

  for (const filename of fs.readdirSync(resourcePath).sort()) {
    const fail = (problem: string) => errors.push(`${resourcePath}/${filename}\n✖ ${problem}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) {
      fail("filename must be a lowercase slug ending in .md, e.g. latinas-in-tech.md");
      continue;
    }
    // Malformed YAML throws; report it with the file's path and keep checking the rest
    let data: Record<string, unknown>;
    try {
      ({ data } = parseFrontmatter(fs.readFileSync(`${resourcePath}/${filename}`, "utf8")));
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
      continue;
    }
    const result = validateResourceFrontmatter(filename, data);
    if (!result.success) {
      errors.push(result.error);
      continue;
    }
    // The slug names the logo file and the card's anchor, so it has to follow the name
    const slug = resourceSlug(result.data);
    if (filename !== `${slug}.md`) fail(`filename must match the name: expected ${slug}.md`);
    const duplicate = urls.get(result.data.url);
    if (duplicate) fail(`url is already listed in ${duplicate}`);
    urls.set(result.data.url, filename);
    resources.push(result.data);
  }

  if (errors.length > 0) {
    throw new Error(
      `${errors.length} invalid resource(s) in ${resourcePath}:\n\n${errors.join("\n\n")}`
    );
  }
  return resources;
};

const files = readResourceFiles();

/** Resource categories, each listed A to Z by name */
export const resourceGroups: ResourceGroup[] = groups.map((group) => ({
  ...group,
  resources: files
    .filter((file) => file.group === group.id)
    .map(({ group: _group, ...resource }) => resource)
    .sort((a, b) =>
      sortName(a.name).localeCompare(sortName(b.name), "en", { sensitivity: "base" })
    ),
}));

export const getResourceGroup = (id: string) => resourceGroups.find((group) => group.id === id);

/** The question each group answers, with its resources named, for FAQPage JSON-LD */
export const resourceFaqs = () =>
  resourceGroups.map((group) => ({
    question: group.question,
    group,
    // Plain text for FAQPage JSON-LD; the page renders the same answer with named links instead
    answer: `${group.summary} Latina Dev recommends ${group.resources
      .map((r) => r.name)
      .join(", ")}. See ${siteUrl}${resourcesPath}/${group.id}`,
  }));

export const resourceCount = resourceGroups.reduce((n, group) => n + group.resources.length, 0);

export const resourcesPath = "/resources";

interface CollectionOptions {
  name: string;
  path: string;
  description: string;
  groups?: ResourceGroup[]; // defaults to every group
}

/** A resources page as a CollectionPage holding an ItemList of its resources */
export const resourcesJsonLd = ({
  name,
  path,
  description,
  groups = resourceGroups,
}: CollectionOptions) => {
  let position = 0;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${siteUrl}${path}`,
    description,
    inLanguage: "en",
    audience: { "@type": "Audience", audienceType: "Latina software engineers" },
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: groups.reduce((n, group) => n + group.resources.length, 0),
      itemListElement: groups.flatMap((group) =>
        group.resources.map((resource) => ({
          "@type": "ListItem",
          position: ++position,
          item: {
            "@type": resource.schemaType ?? "Organization",
            name: resource.name,
            url: resource.url,
            description: resource.description,
            // What it is and the career stages it helps, so a filtered question can match it
            keywords: [...resource.types, ...resource.stages].join(", "),
          },
        }))
      ),
    },
  };
};
