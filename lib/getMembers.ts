import fs from "fs";
import grayMatter from "gray-matter";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { MemberFrontmatter, validateMemberFrontmatter } from "@/lib/memberSchema";

import { MemberInterface } from "@/types/members";

const memberPath = "data/members";

/**
 * Read and validate every member profile
 * @returns validated frontmatter and Markdown body for each profile
 * @throws if any profile is invalid, listing every problem across all files
 */
export const readMemberFiles = () => {
  // Get files from members directory
  const files = fs.readdirSync(memberPath);

  const errors: string[] = [];
  const memberFiles: { slug: string; data: MemberFrontmatter; content: string }[] = [];

  files.forEach((filename) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) {
      errors.push(
        `${memberPath}/${filename}\n✖ filename must be a lowercase slug ending in .md, e.g. frances-coronel.md`
      );
      return;
    }

    // Get raw markdown
    const markdownWithMetadata = fs.readFileSync(`${memberPath}/${filename}`).toString();

    // Parse markdown, grab front matter
    const { data, content } = grayMatter(markdownWithMetadata);

    const result = validateMemberFrontmatter(filename, data);
    if (!result.success) {
      errors.push(result.error);
      return;
    }

    memberFiles.push({ slug: filename.replace(".md", ""), data: result.data, content });
  });

  if (errors.length > 0) {
    throw new Error(
      `${errors.length} invalid member profile(s) in ${memberPath}:\n\n${errors.join("\n\n")}`
    );
  }

  return memberFiles;
};

/**
 * Get all members from Markdown posts
 * @returns members
 */
export const getMembers = async (): Promise<MemberInterface[]> => {
  // Loop through files and create array of members
  const members = readMemberFiles().map(async ({ slug, data, content }) => {
    const path = `/members/${slug}`;

    // Parse Markdown
    const html = await unified().use(remarkParse).use(remarkHtml).process(content);
    const bio = html.value.toString();

    // Return member data
    return { ...data, slug, path, bio };
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
