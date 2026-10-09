import { CountryName } from "@/types/countries";
import { MemberInterface, MemberLevel } from "@/types/members";

// Filtered views of the directory, each with its own crawlable URL under /members

export interface LevelView {
  segment: string; // URL segment under /members
  level: MemberLevel;
  label: string; // short label for filter links and breadcrumbs
  title: string; // page title
  intro: (count: number) => string;
}

export const levelViews: LevelView[] = [
  {
    segment: "students",
    level: "Student",
    label: "Students",
    title: "Latina Software Engineering Students",
    intro: (count) =>
      `${count} Latina software engineering ${count === 1 ? "student" : "students"} in degree programs and coding bootcamps, or teaching themselves to code.`,
  },
  {
    segment: "ic",
    level: "Individual Contributor",
    label: "Individual Contributors",
    title: "Latina Software Engineers (Individual Contributors)",
    intro: (count) =>
      `${count} Latina software ${count === 1 ? "engineer" : "engineers"} working as individual contributors, or recent graduates looking for their next role.`,
  },
  {
    segment: "leaders",
    level: "Leader",
    label: "Leaders",
    title: "Latina Engineering Leaders",
    intro: (count) =>
      `${count} Latina engineering ${count === 1 ? "leader" : "leaders"} working as engineering managers, directors, executives or technical founders.`,
  },
];

export const levelViewFor = (segment: string) =>
  levelViews.find((view) => view.segment === segment);

// A country page with a single member is too thin to be useful, so a country needs this many
export const minMembersPerCountryView = 2;

/** URL segment for a country, e.g. "Dominican Republic" → "dominican-republic" */
export const countrySlug = (country: string) =>
  country
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface CountryView {
  slug: string;
  country: CountryName;
  members: MemberInterface[];
}

/**
 * Countries of origin with enough members for their own page, most members first.
 * Members with `noindex: true` don't count towards a country.
 */
export const getCountryViews = (members: MemberInterface[]): CountryView[] => {
  const byCountry = new Map<CountryName, MemberInterface[]>();
  for (const member of members) {
    if (member.noindex) continue;
    for (const country of member.countries ?? []) {
      byCountry.set(country, [...(byCountry.get(country) ?? []), member]);
    }
  }

  return [...byCountry.entries()]
    .filter(([, countryMembers]) => countryMembers.length >= minMembersPerCountryView)
    .map(([country, countryMembers]) => ({
      slug: countrySlug(country),
      country,
      members: countryMembers,
    }))
    .sort((a, b) => b.members.length - a.members.length || a.country.localeCompare(b.country));
};
