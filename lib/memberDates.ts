import { execFileSync } from "child_process";

import { MemberInterface } from "@/types/members";

/**
 * Whether git history is available and complete. A shallow clone (common in CI) only knows the
 * latest commit, so every file would look like it changed today.
 */
export const hasFullGitHistory = () => {
  try {
    return (
      execFileSync("git", ["rev-parse", "--is-shallow-repository"]).toString().trim() === "false"
    );
  } catch {
    return false;
  }
};

/** Date of the last commit touching `path`, or undefined if git can't say */
const lastCommitDate = (path: string) => {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cI", "--", path]).toString().trim();
    return date ? new Date(date) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * When a member's profile last changed: the last commit to their data file when git history is
 * available, otherwise the date they were added.
 */
export const memberLastModified = (member: MemberInterface, useGit = hasFullGitHistory()) =>
  (useGit && lastCommitDate(`data/members/${member.slug}.md`)) || new Date(member.added);

/**
 * When the member directory last changed: the last commit to data/members when git history is
 * available, otherwise the build date.
 */
export const directoryLastUpdated = (useGit = hasFullGitHistory()) =>
  (useGit && lastCommitDate("data/members")) || new Date();
