import { siteUrl } from "@/lib/site";

// Drafts the monthly LinkedIn post for the Latina Dev page from the site's own data: members added
// that month, resources added to /resources and guides published. Frances posts it herself, since
// posting to a LinkedIn page through the API needs LinkedIn's approval. Everyone in the directory
// is opted in to discovery, so every member can be named.

export interface PostMember {
  name: string;
  slug: string;
  added: string; // YYYY-MM-DD
  linkedin: string; // LinkedIn vanity handle
  affiliation?: string;
}

interface PostResource {
  name: string;
  group: string; // title of its section on /resources
}

interface PostGuide {
  title: string;
  slug: string;
  published: string; // YYYY-MM-DD
}

export interface MonthlyPostInput {
  month: string; // YYYY-MM
  members: PostMember[]; // every member in the directory
  newResources: PostResource[]; // resources added during the month
  guides: PostGuide[]; // every guide
}

export interface MonthlyPost {
  month: string;
  label: string; // e.g. October 2026
  newMembers: PostMember[];
  spotlight: PostMember[]; // members featured to fill a quiet month
  newResources: PostResource[];
  newGuides: PostGuide[];
  memberCount: number;
  text: string; // the post, ready to paste into LinkedIn
}

// The post names at least this many members, topping up new members with a rotating spotlight
const featuredCount = 3;
const maxListed = { members: 10, resources: 5 };

export const isMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

/** The month before the one `date` falls in, as YYYY-MM (in UTC) */
export const previousMonth = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
};

/** First instant of `month` and of the month after it, in UTC */
export const monthBounds = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(year, m - 1, 1)), end: new Date(Date.UTC(year, m, 1)) };
};

const monthLabel = (month: string) =>
  monthBounds(month).start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const inMonth = (date: string, month: string) => date.startsWith(`${month}-`);

/**
 * Members to feature in a month, rotating through the directory in name order so everyone gets a
 * turn. Members added that month are left out; they're already welcomed.
 */
export const spotlightMembers = (members: PostMember[], month: string, count: number) => {
  const pool = members
    .filter((member) => !inMonth(member.added, month))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  if (count <= 0 || pool.length === 0) return [];
  const [year, m] = month.split("-").map(Number);
  const start = ((year * 12 + m) * featuredCount) % pool.length;
  return Array.from(
    { length: Math.min(count, pool.length) },
    (_, i) => pool[(start + i) % pool.length]
  );
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const memberLine = (member: PostMember) =>
  `• ${member.name}${member.affiliation ? `, ${member.affiliation}` : ""}: ${siteUrl}/members/${member.slug}`;

const listed = <T>(
  items: T[],
  max: number,
  line: (item: T) => string,
  more: (n: number) => string
) => [...items.slice(0, max).map(line), ...(items.length > max ? [more(items.length - max)] : [])];

export const buildMonthlyPost = ({
  month,
  members,
  newResources,
  guides,
}: MonthlyPostInput): MonthlyPost => {
  if (!isMonth(month)) throw new Error(`month must be YYYY-MM, got "${month}"`);

  const label = monthLabel(month);
  const newMembers = members
    .filter((member) => inMonth(member.added, month))
    .sort((a, b) => a.name.localeCompare(b.name));
  const newGuides = guides
    .filter((guide) => inMonth(guide.published, month))
    .sort((a, b) => a.title.localeCompare(b.title));
  const spotlight = spotlightMembers(members, month, featuredCount - newMembers.length);

  // The first line is all LinkedIn shows before "see more", so it carries the month's news
  const news = [
    newMembers.length && plural(newMembers.length, "new member"),
    newResources.length && plural(newResources.length, "new resource"),
    newGuides.length && plural(newGuides.length, "new guide"),
  ].filter(Boolean);
  const hook = news.length
    ? `${label} on Latina Dev: ${news.join(", ").replace(/, ([^,]*)$/, " and $1")} for Latina software engineers.`
    : `${label} on Latina Dev: meet ${plural(spotlight.length, "Latina software engineer")} from our directory.`;

  const sections: string[][] = [[hook]];
  if (newMembers.length) {
    sections.push([
      newMembers.length === 1 ? "Welcome to our newest member:" : "Welcome to our newest members:",
      ...listed(
        newMembers,
        maxListed.members,
        memberLine,
        (n) => `• and ${n} more: ${siteUrl}/members`
      ),
    ]);
  }
  if (newResources.length) {
    // A few are named; a big batch is summed up by section so the post stays short
    const byGroup = new Map<string, number>();
    for (const { group } of newResources) byGroup.set(group, (byGroup.get(group) ?? 0) + 1);
    sections.push([
      `New on ${siteUrl}/resources:`,
      ...(newResources.length <= maxListed.resources
        ? newResources.map((resource) => `• ${resource.name} (${resource.group})`)
        : [...byGroup].map(([group, n]) => `• ${group} (${n})`)),
    ]);
  }
  if (newGuides.length) {
    sections.push([
      newGuides.length === 1 ? "New guide:" : "New guides:",
      ...newGuides.map((guide) => `• ${guide.title}: ${siteUrl}/guides/${guide.slug}`),
    ]);
  }
  if (spotlight.length) {
    sections.push([newMembers.length ? "Also meet:" : "Meet:", ...spotlight.map(memberLine)]);
  }
  sections.push([
    `Latina Dev is a free directory of ${plural(members.length, "Latina software engineer")}, from students to leaders. Are you a Latina in software engineering? Add yourself at ${siteUrl}/add-member`,
  ]);
  sections.push(["#LatinasInTech #WomenInTech #SoftwareEngineering"]);

  return {
    month,
    label,
    newMembers,
    spotlight,
    newResources,
    newGuides,
    memberCount: members.length,
    text: sections.map((lines) => lines.join("\n")).join("\n\n"),
  };
};

/** The GitHub issue that delivers the draft to Frances */
export const monthlyPostIssue = (post: MonthlyPost, runUrl?: string) => {
  const tag = [...post.newMembers.slice(0, maxListed.members), ...post.spotlight];
  return [
    `Here's a draft of the ${post.label} post for the Latina Dev LinkedIn page. Edit it as you like, then post it from the page.`,
    "",
    "```text",
    post.text,
    "```",
    "",
    `**Share image:** download \`share-image\` from the Artifacts of ${runUrl ? `[this run](${runUrl})` : "the workflow run"} and attach it to the post.`,
    "",
    tag.length
      ? `**Tag on LinkedIn:** type @ and their name in the post to mention them.\n\n${tag
          .map(
            (member) =>
              `- ${member.name}: https://www.linkedin.com/in/${encodeURIComponent(member.linkedin)}`
          )
          .join("\n")}`
      : "",
    "",
    "Close this issue once it's posted.",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
};
