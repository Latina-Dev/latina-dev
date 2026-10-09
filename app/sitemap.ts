import { execFileSync } from "child_process";

import { getMembers } from "@/lib/getMembers";
import { siteUrl } from "@/lib/site";

import type { MetadataRoute } from "next";
import { MemberInterface } from "@/types/members";

/**
 * Whether git history is available and complete. A shallow clone (common in CI) only knows the
 * latest commit, so every file would look like it changed today.
 */
const hasFullGitHistory = () => {
  try {
    return (
      execFileSync("git", ["rev-parse", "--is-shallow-repository"]).toString().trim() === "false"
    );
  } catch {
    return false;
  }
};

/**
 * When a member's profile last changed: the last commit to their data file when git history is
 * available, otherwise the date they were added.
 */
const memberLastModified = (member: MemberInterface, useGit: boolean) => {
  if (useGit) {
    try {
      const date = execFileSync("git", [
        "log",
        "-1",
        "--format=%cI",
        "--",
        `data/members/${member.slug}.md`,
      ])
        .toString()
        .trim();
      if (date) return new Date(date);
    } catch {
      // Fall through to the added date
    }
  }
  return new Date(member.added);
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const members = await getMembers();
  const useGit = hasFullGitHistory();

  // No lastModified on these: we don't have a reliable date for them, and a wrong one is worse
  // than none
  const pages: MetadataRoute.Sitemap = ["", "/members", "/conference", "/add-member"].map(
    (path) => ({ url: `${siteUrl}${path}` })
  );

  const memberPages: MetadataRoute.Sitemap = members
    .filter((member) => !member.noindex)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => ({
      url: `${siteUrl}${member.path}`,
      lastModified: memberLastModified(member, useGit),
    }));

  return [...pages, ...memberPages];
}
