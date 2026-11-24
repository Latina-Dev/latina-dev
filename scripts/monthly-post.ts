import { execFileSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";

import { readMemberFiles } from "@/lib/getMembers";
import { getGuides } from "@/lib/guides";
import { hasFullGitHistory } from "@/lib/memberDates";
import {
  buildMonthlyPost,
  isMonth,
  monthBounds,
  MonthlyPost,
  monthlyPostIssue,
  previousMonth,
} from "@/lib/monthlyPost";
import { resourceGroups } from "@/lib/resources";

import { escapeHtml, fontFaces, memberPhoto, owlMark, renderShareImage } from "./share-image";

// Drafts the monthly LinkedIn post for a month (YYYY-MM, default: last month) and its share image.
// Writes monthly-post/post.txt, monthly-post/issue.md and monthly-post/share-image.png. Set
// RUN_URL to link the workflow run, where the image is uploaded, from the issue. Needs full git history, to tell which
// resources were added during the month.

const outDir = "monthly-post";

/** `git` output for the given arguments, or an empty string if the command fails */
const gitOutput = (args: string[]) => {
  try {
    return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return ""; // e.g. the path didn't exist at that commit
  }
};

/** Resource URLs listed as of the last commit before `date`, empty if none */
const resourceUrlsBefore = (date: Date) => {
  const rev = gitOutput(["rev-list", "-1", `--before=${date.toISOString()}`, "HEAD"]).trim();
  if (!rev) return new Set<string>();
  // Resources are files in data/resources; before November 2026 they were a list in lib/resources.ts
  const files = gitOutput(["grep", "-h", "-E", "^url: ", rev, "--", "data/resources"]);
  const list = gitOutput(["show", `${rev}:lib/resources.ts`]);
  return new Set(
    [...files.matchAll(/^url: "([^"]+)"/gm), ...list.matchAll(/\burl: "([^"]+)"/g)].map(
      (match) => match[1]
    )
  );
};

// 1200×627 is LinkedIn's size for a shared image
const shareImageHtml = (post: MonthlyPost) => {
  const people = [...post.newMembers, ...post.spotlight].slice(0, 4);
  const stats = [
    [post.newMembers.length, post.newMembers.length === 1 ? "new member" : "new members"],
    [post.newResources.length, post.newResources.length === 1 ? "new resource" : "new resources"],
    [post.newGuides.length, post.newGuides.length === 1 ? "new guide" : "new guides"],
  ].filter(([n]) => n);
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${fontFaces()}
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 627px; background: #9e0001; color: #fff; font-family: Latina, sans-serif;
  padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
header { display: flex; align-items: center; gap: 20px; font-weight: 900; font-size: 34px; letter-spacing: 1px; }
header img { height: 64px; }
h1 { font-weight: 900; font-size: 76px; line-height: 1; }
.sub { font-weight: 500; font-size: 30px; margin-top: 16px; opacity: .92; }
.row { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
.stats { display: flex; gap: 40px; }
.stat b { display: block; font-weight: 900; font-size: 56px; line-height: 1; }
.stat span { font-weight: 500; font-size: 24px; }
.people { display: flex; }
.people img { width: 112px; height: 112px; border-radius: 50%; border: 5px solid #fff; object-fit: cover;
  margin-left: -24px; background: #fff; }
.people img:first-child { margin-left: 0; }
</style></head><body>
<header><img src="${owlMark()}" alt="">LATINA DEV</header>
<div>
  <h1>${escapeHtml(post.label)}</h1>
  <p class="sub">${post.memberCount} Latina software engineers · latina.dev</p>
</div>
<div class="row">
  <div class="stats">${
    stats.length
      ? stats
          .map(([n, label]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`)
          .join("")
      : `<div class="stat"><b>Member spotlight</b></div>`
  }</div>
  <div class="people">${people
    .map((member) => memberPhoto(member.slug))
    .filter(Boolean)
    .map((src) => `<img src="${src}" alt="">`)
    .join("")}</div>
</div>
</body></html>`;
};

async function main() {
  const month = process.argv[2] || previousMonth();
  if (!isMonth(month)) throw new Error(`month must be YYYY-MM, got "${month}"`);
  if (!hasFullGitHistory()) {
    throw new Error("needs full git history to find new resources (checkout with fetch-depth: 0)");
  }

  const { start, end } = monthBounds(month);
  const before = resourceUrlsBefore(start);
  const after = resourceUrlsBefore(end);
  const newResources = resourceGroups.flatMap((group) =>
    group.resources
      .filter((resource) => after.has(resource.url) && !before.has(resource.url))
      .map((resource) => ({ name: resource.name, group: group.title }))
  );

  const post = buildMonthlyPost({
    month,
    members: readMemberFiles().map(({ slug, data }) => ({
      name: data.name,
      slug,
      added: data.added,
      linkedin: data.linkedin,
      affiliation: data.affiliation,
    })),
    newResources,
    guides: getGuides(),
  });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/post.txt`, post.text + "\n");
  writeFileSync(`${outDir}/issue.md`, monthlyPostIssue(post, process.env.RUN_URL));
  await renderShareImage(shareImageHtml(post), `${outDir}/share-image.png`);
  console.log(post.text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
