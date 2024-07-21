import { CountryName } from "@/types/countries";

type MemberLevel = "Student" | "Individual Contributor" | "Leader";

export interface MemberInterface {
  name: string; // full name, e.g. Frances Coronel
  added: string; // when member was added, e.g. 2023-05-07
  level: MemberLevel;
  linkedin: string; // LinkedIn vanity handle, e.g. frances-coronel from "in/frances-coronel"
  slug: string; // e.g. frances-coronel
  path: string; // e.g. /members/frances-coronel
  github?: string; // optional: GitHub username, e.g. FrancesCoronel
  twitter?: string; // optional: Twitter username, e.g. FrancesCoronel
  website?: string; // optional: Personal website URL, e.g. https://francescoronel.com
  bio?: string; // optional: Markdown that forms bio, e.g. Frances Coronel is a senior software engineer...
  affiliation?: string; // optional: title and company or school, e.g. Senior Software Engineer at XYZ
  countries?: CountryName[]; // optional: Country or countries of origin, e.g. ['Peru']
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
  countries: ["Peru"]
};
