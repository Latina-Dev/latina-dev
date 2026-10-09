import fs from "fs";
import grayMatter from "gray-matter";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { MemberInterface, OpenToOption, openToOptions } from "@/types/members";

/**
 * Normalize an optional front matter list, dropping empty values
 * @param value
 * @returns trimmed strings, or undefined when nothing is left
 */
const toStringList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((item) => String(item).trim()).filter(Boolean);
  return list.length ? list : undefined;
};

/**
 * Get all members from Markdown posts
 * @returns members
 */
export const getMembers = async (): Promise<MemberInterface[]> => {
  const memberPath = "data/members";
  // Get files from members directory
  const files = fs.readdirSync(memberPath);

  // Loop through files and create array of members
  const members = files.map(async (filename) => {
    // Get raw markdown
    const markdownWithMetadata = fs.readFileSync(`${memberPath}/${filename}`).toString();

    // Parse markdown, grab front matter
    const { data, content } = grayMatter(markdownWithMetadata);

    // Process front matter
    const slug = filename.replace(".md", "");
    const path = `/members/${slug}`;

    // Process custom fields
    const { name, linkedin, github, twitter, website, added, affiliation, level, countries } = data;
    const skills = toStringList(data.skills);
    const location =
      typeof data.location === "string" && data.location.trim() ? data.location.trim() : undefined;
    const openTo = toStringList(data.openTo)?.filter((option): option is OpenToOption =>
      (openToOptions as readonly string[]).includes(option)
    );

    // Parse Markdown
    const html = await unified().use(remarkParse).use(remarkHtml).process(content);
    const bio = html.value.toString();

    // Return member data
    return {
      name,
      linkedin,
      github,
      twitter,
      website,
      added,
      affiliation,
      level,
      slug,
      path,
      bio,
      countries,
      ...(skills ? { skills } : {}),
      ...(location ? { location } : {}),
      ...(openTo?.length ? { openTo } : {}),
    };
  });

  // Return all members
  return Promise.all(members);
};

/**
 * Get a member by slug
 * @param slug
 * @returns member
 */
export const getMemberBySlug = async (slug: string) => {
  const members = await getMembers();
  const member = members.find((member) => member.slug === slug);
  return member;
};
