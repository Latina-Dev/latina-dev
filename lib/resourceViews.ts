import { Resource, ResourceGroup, resourceGroups, resourcesPath } from "@/lib/resources";

import { resourceStages, resourceTypes } from "@/types/resources";

// Pages that cut across the categories: every resource of one type (/resources/type/job-board) or
// for one career stage (/resources/stage/leadership). The type and stage menus on /resources only
// hide cards, so a search engine or an AI agent never sees a filtered list; these pages give each
// question its own URL, title and structured data.

type ResourceType = (typeof resourceTypes)[number];
type ResourceStage = (typeof resourceStages)[number];

interface ViewCopy {
  title: string; // short label for links and breadcrumbs
  heading: string; // h1, phrased the way people search
  summary: string; // intro and meta description
}

const typeCopy: Record<ResourceType, ViewCopy> = {
  Community: {
    title: "Communities",
    heading: "Communities for Latina software engineers to join",
    summary:
      "Communities, Slack groups and nonprofits where Latina software engineers find peers, mentors and job leads.",
  },
  Program: {
    title: "Programs",
    heading: "Coding programs, fellowships and cohorts for Latinas in tech",
    summary:
      "Coding classes, fellowships, bootcamps and leadership cohorts for Latinas, from a first line of code to senior roles.",
  },
  Scholarship: {
    title: "Scholarships",
    heading: "Scholarships for Latinas studying computer science",
    summary: "Scholarships for Latina and Latino students studying computer science and STEM.",
  },
  "Professional association": {
    title: "Professional associations",
    heading: "Professional associations for Latina engineers",
    summary:
      "Membership associations with chapters, conferences and career programs for Latina and Latino professionals in engineering and tech.",
  },
  "Job board": {
    title: "Job boards",
    heading: "Job boards that reach Latina software engineers",
    summary:
      "Job boards run by diversity-in-tech communities and hiring platforms, where Latina software engineers can find open roles.",
  },
  Directory: {
    title: "Directories",
    heading: "Directories of companies and apprenticeships for Latina engineers",
    summary:
      "Open lists of apprenticeships and of companies with fairer interviews, useful to Latina engineers looking for a job.",
  },
  Guide: {
    title: "Guides",
    heading: "Job search guides for Latina software engineers",
    summary: "Guides to finding and landing a software engineering job.",
  },
  Conference: {
    title: "Conferences",
    heading: "Conferences and summits for Latinas in tech",
    summary:
      "Conferences and summits where Latina and Latino technologists, leaders and founders meet in person.",
  },
  Accelerator: {
    title: "Accelerators",
    heading: "Accelerators for Latina founders and leaders",
    summary: "Accelerators and scaling programs for Latina and Latino founders and executives.",
  },
  Newsletter: {
    title: "Newsletters",
    heading: "Newsletters for Latina software engineers",
    summary:
      "Newsletters with jobs, career advice and news for Latina engineers and other underrepresented people in tech.",
  },
  Podcast: {
    title: "Podcasts",
    heading: "Podcasts about Latinas in tech",
    summary: "Podcasts by and about Latinas working in tech and engineering.",
  },
  Report: {
    title: "Reports",
    heading: "Research reports on Latinas and Latinos in tech",
    summary:
      "Research and data on how Latinas and Latinos are represented in engineering and tech.",
  },
};

const stageCopy: Record<ResourceStage, ViewCopy> = {
  "K-12": {
    title: "K-12 students",
    heading: "Resources for Latina K-12 students learning to code",
    summary: "Coding and STEM programs for Latina girls and teens.",
  },
  College: {
    title: "College students",
    heading: "Resources for Latina college students in computer science",
    summary:
      "Communities, scholarships, career prep and associations for Latinas studying computer science or engineering in college.",
  },
  Workplace: {
    title: "Working engineers",
    heading: "Resources for Latina software engineers at work",
    summary:
      "Communities, job boards, programs and reads for Latinas working as software engineers.",
  },
  Leadership: {
    title: "Leaders",
    heading: "Resources for Latina engineering leaders",
    summary:
      "Associations, cohorts, summits and reads for Latinas moving into staff, management and executive roles.",
  },
  Founders: {
    title: "Founders",
    heading: "Resources for Latina founders in tech",
    summary:
      "Accelerators, communities and summits for Latinas starting and growing a tech company.",
  },
};

export interface ResourceView extends ViewCopy {
  kind: "type" | "stage";
  value: string; // the tag as written in data/resources, e.g. "Job board"
  slug: string;
  count: number;
  // Where the list lives: its own page, a category page that already lists exactly the same
  // resources, or nowhere when it is too short to be worth a page
  path?: string;
  ownPage: boolean;
  groups: ResourceGroup[]; // the categories, cut down to the matching resources
}

// A page with one or two entries reads as thin to a search engine and helps nobody
const minResources = 3;

const viewSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const names = (resources: Resource[]) =>
  resources
    .map((resource) => resource.name)
    .sort()
    .join("|");

const buildView = (
  kind: ResourceView["kind"],
  value: string,
  copy: ViewCopy,
  matches: (resource: Resource) => boolean
): ResourceView => {
  const groups = resourceGroups
    .map((group) => ({ ...group, resources: group.resources.filter(matches) }))
    .filter((group) => group.resources.length > 0);
  const resources = groups.flatMap((group) => group.resources);
  // Same list as a category page: link there, so two URLs never compete for one question
  const sameAsGroup = resourceGroups.find((group) => names(group.resources) === names(resources));
  const ownPage = !sameAsGroup && resources.length >= minResources;
  const slug = viewSlug(value);

  return {
    ...copy,
    kind,
    value,
    slug,
    count: resources.length,
    ownPage,
    path: sameAsGroup
      ? `${resourcesPath}/${sameAsGroup.id}`
      : ownPage
        ? `${resourcesPath}/${kind}/${slug}`
        : undefined,
    groups,
  };
};

/** One view per type that at least one resource has, in the order the site defines them */
export const typeViews: ResourceView[] = resourceTypes
  .map((type) => buildView("type", type, typeCopy[type], (r) => r.types.includes(type)))
  .filter((view) => view.count > 0);

/** One view per career stage that at least one resource has */
export const stageViews: ResourceView[] = resourceStages
  .map((stage) => buildView("stage", stage, stageCopy[stage], (r) => r.stages.includes(stage)))
  .filter((view) => view.count > 0);

/** The views that have a page of their own, for static params, the sitemap and llms.txt */
export const resourceViewPages = [...stageViews, ...typeViews].flatMap((view) =>
  view.ownPage && view.path ? [{ ...view, path: view.path }] : []
);

export const getResourceView = (kind: ResourceView["kind"], slug: string) =>
  resourceViewPages.find((view) => view.kind === kind && view.slug === slug);
