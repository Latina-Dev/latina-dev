import fs from "fs";
import grayMatter from "gray-matter";

import { validateMemberFrontmatter } from "@/lib/memberSchema";
import { ownersPath } from "@/lib/profiles/owners";

// Read at request time on /profile, so next.config.js traces these folders into the function
export const memberPath = "data/members";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Slugs of every profile in data/members */
export const memberSlugs = () =>
  new Set(
    fs
      .readdirSync(memberPath)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""))
  );

/**
 * Read one member's profile
 * @param slug e.g. frances-coronel
 */
export const readMemberProfile = (slug: string) => {
  if (!slugPattern.test(slug)) throw new Error(`Invalid profile slug: ${slug}`);
  const { data, content } = grayMatter(fs.readFileSync(`${memberPath}/${slug}.md`, "utf8"));
  const result = validateMemberFrontmatter(`${slug}.md`, data);
  if (!result.success) throw new Error(result.error);
  return { frontmatter: result.data, bio: content.trim() };
};

/** Slugs that already have an approved owner */
export const claimedSlugs = () => {
  try {
    return new Set(
      fs
        .readdirSync(ownersPath)
        .filter((file) => file.endsWith(".txt"))
        .map((file) => fs.readFileSync(`${ownersPath}/${file}`, "utf8").trim())
    );
  } catch {
    return new Set<string>();
  }
};

/**
 * Profiles nobody has claimed yet, for the "this is me" picker
 * @returns name and slug of each unclaimed profile, sorted by name
 */
export const unclaimedProfiles = () => {
  const claimed = claimedSlugs();
  return [...memberSlugs()]
    .filter((slug) => !claimed.has(slug))
    .map((slug) => ({ slug, name: readMemberProfile(slug).frontmatter.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
