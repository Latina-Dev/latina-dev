import { z } from "zod";

import { MemberFrontmatter, memberFrontmatterSchema } from "@/lib/memberSchema";

// Filenames taken by directory views under /members
const reservedSlugs = ["students", "ic", "leaders", "country"];

const bioMaxLength = 2000;

// Frontmatter keys in the order they're written, so every generated file reads the same
const keyOrder: (keyof MemberFrontmatter)[] = [
  "name",
  "added",
  "level",
  "linkedin",
  "github",
  "twitter",
  "website",
  "affiliation",
  "countries",
  "skills",
  "location",
  "openTo",
  "noindex",
];

/** Profile fields a member fills in on the profile form */
export interface ProfileFormValues {
  name: string;
  level: string;
  linkedin: string;
  affiliation: string;
  github: string;
  website: string;
  location: string;
  countries: string[];
  skills: string;
  openTo: string[];
  noindex: boolean;
  bio: string;
}

/**
 * Read the profile form fields out of submitted form data
 * @param data form data from the profile form
 */
export const readProfileForm = (data: FormData): ProfileFormValues => {
  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const list = (key: string) =>
    data
      .getAll(key)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim());

  return {
    name: text("name"),
    level: text("level"),
    // Accept a pasted profile URL as well as the bare handle
    linkedin: text("linkedin")
      .replace(/^(https?:\/\/)?([a-z]+\.)?linkedin\.com\/in\//i, "")
      .replace(/\/+$/, ""),
    affiliation: text("affiliation"),
    github: text("github").replace(/^@/, ""),
    website: text("website"),
    location: text("location"),
    countries: list("countries"),
    skills: text("skills"),
    openTo: list("openTo"),
    noindex: data.get("noindex") === "true",
    bio: text("bio"),
  };
};

/**
 * Normalize a bio so it stores cleanly as the Markdown body of a profile
 * @param bio text from the form
 */
const normalizeBio = (bio: string) =>
  bio
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Turn profile form values into validated frontmatter and a bio
 * @param values values from the profile form
 * @param existing the member's current frontmatter when editing, so fields the form doesn't show (like twitter) are kept
 * @param today date to record as `added` for a new profile, e.g. 2026-10-09
 * @returns frontmatter and bio, or a readable list of problems
 */
export const buildMemberProfile = (
  values: ProfileFormValues,
  existing: MemberFrontmatter | undefined,
  today: string
): { success: true; data: MemberFrontmatter; bio: string } | { success: false; error: string } => {
  const bio = normalizeBio(values.bio);
  if (!bio) return { success: false, error: "Bio: please add a short bio." };
  if (bio.length > bioMaxLength) {
    return { success: false, error: `Bio: please keep it under ${bioMaxLength} characters.` };
  }

  const skills = values.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  // Empty optional fields are left out rather than saved as empty strings
  const optional = <T>(value: T, empty: boolean) => (empty ? undefined : value);

  const candidate = {
    ...existing,
    name: values.name,
    added: existing?.added ?? today,
    level: values.level,
    linkedin: values.linkedin,
    github: optional(values.github, !values.github),
    website: optional(values.website, !values.website),
    affiliation: optional(values.affiliation, !values.affiliation),
    countries: optional(values.countries, values.countries.length === 0),
    skills: optional(skills, skills.length === 0),
    location: optional(values.location, !values.location),
    openTo: optional(values.openTo, values.openTo.length === 0),
    noindex: optional(true, !values.noindex),
  };

  const result = memberFrontmatterSchema.safeParse(candidate);
  if (!result.success) return { success: false, error: z.prettifyError(result.error) };
  // Drop the keys left undefined above so the result matches a parsed file
  const data = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined)
  ) as MemberFrontmatter;
  return { success: true, data, bio };
};

/**
 * Write a member profile as Markdown, in the same style as the hand-written files in data/members
 * @param frontmatter validated frontmatter
 * @param bio Markdown bio
 */
export const serializeMemberFile = (frontmatter: MemberFrontmatter, bio: string) => {
  const lines = keyOrder.flatMap((key) => {
    const value = frontmatter[key];
    if (value === undefined) return [];
    if (typeof value === "boolean") return [`${key}: ${value}`];
    // JSON strings are valid double-quoted YAML, so quotes and colons in values stay safe
    if (Array.isArray(value)) {
      return [`${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`];
    }
    return [`${key}: ${JSON.stringify(value)}`];
  });

  return `---\n${lines.join("\n")}\n---\n${bio ? `\n${bio}\n` : ""}`;
};

/**
 * Make a profile filename slug from a name, e.g. "Fernanda Pérez Gutiérrez" → "fernanda-perez-gutierrez"
 * @param name the member's full name
 * @param taken slugs already in use
 */
export const slugForName = (name: string, taken: Set<string>) => {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "member";

  let slug = base;
  for (let n = 2; taken.has(slug) || reservedSlugs.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
};
