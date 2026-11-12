import { CountryName } from "@/types/countries";

export const memberLevels = ["Student", "Individual Contributor", "Leader"] as const;

export type MemberLevel = (typeof memberLevels)[number];

export const openToOptions = [
  "Mentoring",
  "Being mentored",
  "Job opportunities",
  "Speaking",
  "Hiring",
] as const;

export type OpenToOption = (typeof openToOptions)[number];

export interface MemberInterface {
  name: string; // full name, e.g. Frances Coronel
  added: string; // when member was added, e.g. 2023-05-07
  level: MemberLevel;
  linkedin: string; // LinkedIn vanity handle, e.g. frances-coronel from "in/frances-coronel"
  slug: string; // e.g. frances-coronel
  path: string; // e.g. /members/frances-coronel
  github?: string; // optional: GitHub username, e.g. FrancesCoronel
  twitter?: string; // optional: Twitter username, e.g. FrancesCoronel
  bluesky?: string; // optional: Bluesky handle, e.g. frances.bsky.social
  website?: string; // optional: Personal website URL, e.g. https://francescoronel.com
  blog?: string; // optional: Blog or RSS feed URL, e.g. https://francescoronel.com/rss.xml
  bio?: string; // optional: Markdown that forms bio, e.g. Frances Coronel is a senior software engineer...
  affiliation?: string; // optional: title and company or school, e.g. Senior Software Engineer at XYZ
  countries?: CountryName[]; // optional: Country or countries of origin, e.g. ['Peru']
  location?: string; // optional: where the member is based now, e.g. San Francisco, CA
  openTo?: OpenToOption[]; // optional: what the member is open to, e.g. ['Mentoring', 'Speaking']
  featureMilestones?: true; // optional: member opted in to having milestones shared on Latina Dev's social accounts
}

export const exampleMember: MemberInterface = {
  name: "Frances Coronel",
  linkedin: "frances-coronel",
  github: "FrancesCoronel",
  twitter: "FrancesCoronel",
  website: "https://francescoronel.com",
  added: "2021-01-01",
  level: "Individual Contributor",
  slug: "frances-coronel",
  path: "/members/frances-coronel",
  countries: ["Peru"],
  location: "San Francisco, CA",
  openTo: ["Mentoring", "Speaking"],
};
