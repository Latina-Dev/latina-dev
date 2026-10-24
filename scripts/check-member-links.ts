import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { basename } from "path";

import { readMemberFiles } from "@/lib/getMembers";
import {
  checkGitHubUser,
  checkPage,
  confirmDead,
  LinkResult,
  setFrontmatterField,
} from "@/lib/linkCheck";

// Checks each member's website and GitHub account. LinkedIn and Twitter are left out because they
// block automated checkers.
//
//   npm run links:members -- data/members/a.md   check some profiles; exits 1 if a link is dead
//   npm run links:members -- --fix               fix every profile: point moved websites at their
//                                                new address and drop dead links (both are optional)
//
// Timeouts, bot blocks and server errors are listed as warnings and never fail or remove anything.
// Writes a Markdown report to member-links.md for the pull request body or job summary.

interface Finding {
  file: string;
  name: string;
  field: "website" | "github";
  value: string;
  result: Exclude<LinkResult, { status: "ok" }>;
}

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const only = new Set(args.filter((arg) => arg.endsWith(".md")).map((file) => basename(file)));
const token = process.env.GITHUB_TOKEN;
const maxRemovals = 10;

async function checkMember(
  file: string,
  data: { name: string; website?: string; github?: string }
) {
  const findings: Finding[] = [];
  if (data.website) {
    const url = data.website;
    const result = await confirmDead(() => checkPage(url));
    if (result.status !== "ok")
      findings.push({ file, name: data.name, field: "website", value: url, result });
  }
  if (data.github) {
    const username = data.github;
    const result = await confirmDead(() => checkGitHubUser(username, token));
    if (result.status !== "ok")
      findings.push({ file, name: data.name, field: "github", value: username, result });
  }
  return findings;
}

async function main() {
  const members = readMemberFiles()
    .map(({ slug, data }) => ({ file: `data/members/${slug}.md`, data }))
    .filter(({ file }) => only.size === 0 || only.has(basename(file)));
  if (members.length < only.size) {
    throw new Error(`No member profile for some of: ${[...only].join(", ")}`);
  }

  const findings: Finding[] = [];
  // A few at a time, to be polite to small personal sites
  for (let i = 0; i < members.length; i += 6) {
    const batch = members.slice(i, i + 6);
    const results = await Promise.all(batch.map(({ file, data }) => checkMember(file, data)));
    findings.push(...results.flat());
  }

  const byStatus = (status: LinkResult["status"]) =>
    findings.filter((f) => f.result.status === status);

  // Many dead links at once is more likely a network problem on the runner than members' sites
  // all going down, so only list them
  const tooMany = fix && byStatus("dead").length > maxRemovals;
  if (fix) {
    for (const f of tooMany ? byStatus("moved") : [...byStatus("moved"), ...byStatus("dead")]) {
      const value = f.result.status === "moved" ? f.result.to : null;
      try {
        writeFileSync(f.file, setFrontmatterField(readFileSync(f.file, "utf8"), f.field, value));
      } catch (error) {
        // Leave a profile laid out in an unexpected way for a person, and keep fixing the rest
        const reason = error instanceof Error ? error.message : String(error);
        f.result = { status: "unsure", reason: `couldn't edit the profile (${reason})` };
      }
    }
  }

  const moved = byStatus("moved");
  const dead = byStatus("dead");
  const unsure = byStatus("unsure");

  // Text from profiles and members' sites goes in code spans, so a URL, markup or @mention can't
  // render as a link or ping anyone
  const code = (text: string) =>
    `\`${text.replaceAll("`", "'").replace(/\s+/g, " ").slice(0, 300)}\``;
  const label = (f: Finding) => `${code(f.name)} (${code(f.file)}) ${f.field} ${code(f.value)}`;
  const why = (f: Finding) => ("reason" in f.result ? code(f.result.reason) : "");
  const section = (title: string, intro: string, rows: string[]) =>
    rows.length ? `## ${title} (${rows.length})\n\n${intro}\n\n${rows.join("\n")}\n` : "";

  const report = [
    `Checked the website and GitHub links of ${members.length} member profile(s).\n`,
    section(
      fix ? "Updated to the new address" : "Moved",
      "These redirect permanently to a new address.",
      moved.map((f) => `- ${label(f)} → ${"to" in f.result ? code(f.result.to) : ""}`)
    ),
    section(
      fix && !tooMany ? "Removed" : "Dead",
      tooMany
        ? `More than ${maxRemovals} links look dead at once, which usually means a network problem on the checker, so none were removed. Run the check again later.`
        : fix
          ? "These links are gone, so they were taken off the profile. Website and GitHub are optional."
          : "Fix the link, or remove it from the profile. Website and GitHub are optional.",
      dead.map((f) => `- ${label(f)}: ${why(f)}`)
    ),
    section(
      "Couldn't check",
      "These didn't answer the checker, which may be temporary or a bot block. Nothing was changed.",
      unsure.map((f) => `- ${label(f)}: ${why(f)}`)
    ),
    findings.length ? "" : "All links work.",
    fix && findings.length
      ? "\n_This branch is rebuilt from main each week, so a commit pushed to it will be replaced. Make other changes in a separate pull request._"
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  writeFileSync("member-links.md", report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  // Tells the workflow not to close an open fix pull request after a run that held back removals
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `held=${tooMany}\n`);
  console.log(report);
  process.exitCode = !fix && dead.length ? 1 : 0;
}

main();
