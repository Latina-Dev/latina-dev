import { siteUrl } from "@/lib/site";

import { MemberLevel } from "@/types/members";

// Drafts the weekly "Latina Dev of the Week" LinkedIn post for the Latina Dev page: one member,
// picked so everyone gets a turn before anyone is featured twice. Frances posts it herself, since
// posting to a LinkedIn page through the API needs LinkedIn's approval. Being in the directory
// isn't consent to be featured on social media, so only members who ticked "OK to feature my
// milestones" (featureMilestones in their profile) are picked.

export interface SpotlightMember {
  name: string;
  slug: string;
  added: string; // YYYY-MM-DD
  level: MemberLevel;
  linkedin: string; // LinkedIn vanity handle
  affiliation?: string;
  location?: string;
  countries?: string[];
  openTo?: string[];
  bio?: string; // Markdown body of the profile
  featureMilestones?: boolean; // opted in to being featured in social posts
}

/** A past spotlight, read from the marker in its GitHub issue */
export interface PastSpotlight {
  slug: string;
  date: string; // when the issue was opened, ISO 8601
}

export interface WeeklySpotlight {
  week: string; // ISO week, e.g. 2026-W46
  member: SpotlightMember;
  memberCount: number;
  text: string; // the post, ready to paste into LinkedIn
}

/** ISO 8601 week of `date` (in UTC), e.g. 2026-W46 */
export const isoWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Weeks start on Monday, and the week's Thursday decides which year it belongs to
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const year = d.getUTCFullYear();
  const week = 1 + Math.floor((d.getTime() - Date.UTC(year, 0, 1)) / 604800000);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

/** How much a profile has to say, so fuller profiles are featured first */
const profileDetail = (member: SpotlightMember) =>
  [
    member.bio,
    member.affiliation,
    member.location,
    member.countries?.length,
    member.openTo?.length,
  ].filter(Boolean).length;

/**
 * The member to feature next, among those who opted in: someone never featured if there is anyone
 * left, otherwise whoever was featured longest ago. Ties go to fuller profiles, then
 * longest-standing members. Undefined when nobody has opted in.
 */
export const pickSpotlight = (
  members: SpotlightMember[],
  past: PastSpotlight[]
): SpotlightMember | undefined => {
  const lastFeatured = new Map<string, string>();
  for (const { slug, date } of past) {
    if ((lastFeatured.get(slug) ?? "") < date) lastFeatured.set(slug, date);
  }
  return [...members.filter((member) => member.featureMilestones)].sort(
    (a, b) =>
      (lastFeatured.get(a.slug) ?? "").localeCompare(lastFeatured.get(b.slug) ?? "") ||
      profileDetail(b) - profileDetail(a) ||
      a.added.localeCompare(b.added) ||
      a.slug.localeCompare(b.slug)
  )[0];
};

const levelPhrase: Record<MemberLevel, string> = {
  Student: "a student in software engineering",
  "Individual Contributor": "a software engineer",
  Leader: "an engineering leader",
};

/** Country names that read with "the" in a sentence */
const countryPhrase = (country: string) =>
  country === "Dominican Republic" ? `the ${country}` : country;

/** "a, b and c" */
const joinAnd = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** The bio as plain text, cut at a sentence end near `max` characters */
export const bioExcerpt = (markdown: string, max = 500) => {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links keep their text
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > max / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

export const buildWeeklySpotlight = ({
  week,
  member,
  memberCount,
}: {
  week: string;
  member: SpotlightMember;
  memberCount: number;
}): WeeklySpotlight => {
  const firstName = member.name.split(" ")[0];
  const profileUrl = `${siteUrl}/members/${member.slug}`;

  const intro = [
    `Meet ${member.name}`,
    // "Title at Company" reads as a description; a bare company or title goes in parentheses
    member.affiliation?.includes(" at ")
      ? `, ${member.affiliation}`
      : `${member.affiliation ? ` (${member.affiliation})` : ""}, ${levelPhrase[member.level]}`,
    member.countries?.length
      ? ` with roots in ${joinAnd(member.countries.map(countryPhrase))}`
      : "",
    member.location ? `, based in ${member.location}` : "",
    ".",
  ].join("");

  const sections = [
    // The first line is all LinkedIn shows before "see more"
    `Latina Dev of the Week: ${member.name}`,
    intro,
    // Bios are often written in the first person, so they're quoted
    member.bio ? `In ${firstName}'s words: "${bioExcerpt(member.bio)}"` : "",
    member.openTo?.length
      ? `${firstName} is open to ${joinAnd(member.openTo.map((option) => option.toLowerCase()))}.`
      : "",
    `See ${firstName}'s profile and connect: ${profileUrl}`,
    `Latina Dev is a free directory of ${memberCount} Latina software engineers, from students to leaders. Are you a Latina in software engineering? Add yourself at ${siteUrl}/add-member`,
    "#LatinasInTech #WomenInTech #SoftwareEngineering #LatinaDevOfTheWeek",
  ].filter(Boolean);

  return { week, member, memberCount, text: sections.join("\n\n") };
};

const marker = (slug: string) => `<!-- weekly-spotlight: ${slug} -->`;

/** Slugs featured in past spotlight issues, from the marker each issue body carries */
export const pastSpotlights = (issues: { body: string; createdAt: string }[]): PastSpotlight[] =>
  issues.flatMap(({ body, createdAt }) =>
    [...body.matchAll(/<!-- weekly-spotlight: ([a-z0-9-]+) -->/g)].map((match) => ({
      slug: match[1],
      date: createdAt,
    }))
  );

/** The GitHub issue that delivers the draft to Frances */
export const weeklySpotlightIssue = (spotlight: WeeklySpotlight, runUrl?: string) => {
  const { member } = spotlight;
  return [
    marker(member.slug),
    `Here's a draft of this week's Latina Dev of the Week post (${spotlight.week}) for the Latina Dev LinkedIn page. Edit it as you like, then post it from the page.`,
    "",
    "```text",
    spotlight.text,
    "```",
    "",
    `**Share image:** download \`spotlight-image\` from the Artifacts of ${runUrl ? `[this run](${runUrl})` : "the workflow run"} and attach it to the post.`,
    "",
    `**Tag on LinkedIn:** type @ and their name in the post to mention them: https://www.linkedin.com/in/${encodeURIComponent(member.linkedin)}`,
    "",
    member.featureMilestones
      ? `${member.name} opted in to being featured on Latina Dev's social accounts.`
      : `**${member.name} hasn't opted in on their profile.** Only post this if they've told you it's OK.`,
    "",
    "Close this issue once it's posted.",
  ]
    .join("\n")
    .concat("\n");
};
