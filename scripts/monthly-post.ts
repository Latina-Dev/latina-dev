import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { chromium } from "@playwright/test";

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

// Drafts the monthly LinkedIn post for a month (YYYY-MM, default: last month) and its share image.
// Writes monthly-post/post.txt, monthly-post/issue.md and monthly-post/share-image.png. Set
// RUN_URL to link the workflow run, where the image is uploaded, from the issue. Needs full git history, to tell which
// resources were added during the month.

const outDir = "monthly-post";

/** URLs listed in lib/resources.ts as of the last commit before `date`, empty if none */
const resourceUrlsBefore = (date: Date) => {
  const rev = execFileSync("git", ["rev-list", "-1", `--before=${date.toISOString()}`, "HEAD"])
    .toString()
    .trim();
  if (!rev) return new Set<string>();
  try {
    const source = execFileSync("git", ["show", `${rev}:lib/resources.ts`], {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    return new Set([...source.matchAll(/\burl: "([^"]+)"/g)].map((match) => match[1]));
  } catch {
    return new Set<string>(); // the file didn't exist yet
  }
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const dataUri = (path: string, type: string) =>
  `data:${type};base64,${readFileSync(path).toString("base64")}`;

// 1200×627 is LinkedIn's size for a shared image
const shareImageHtml = (post: MonthlyPost) => {
  const people = [...post.newMembers, ...post.spotlight].slice(0, 4);
  const stats = [
    [post.newMembers.length, post.newMembers.length === 1 ? "new member" : "new members"],
    [post.newResources.length, post.newResources.length === 1 ? "new resource" : "new resources"],
    [post.newGuides.length, post.newGuides.length === 1 ? "new guide" : "new guides"],
  ].filter(([n]) => n);
  const font = (weight: number, file: string) =>
    `@font-face { font-family: Latina; font-weight: ${weight}; src: url(${dataUri(`public/fonts/${file}.woff2`, "font/woff2")}); }`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${font(500, "Latina-Medium")}
${font(700, "Latina-Bold")}
${font(900, "Latina-Heavy")}
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
<header><img src="${dataUri("public/img/logos/owl-mark-white.svg", "image/svg+xml")}" alt="">LATINA DEV</header>
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
    .map((member) => {
      try {
        return `<img src="${dataUri(`public/img/members/${member.slug}.jpg`, "image/jpeg")}" alt="">`;
      } catch {
        return ""; // no photo yet
      }
    })
    .join("")}</div>
</div>
</body></html>`;
};

const renderShareImage = async (post: MonthlyPost, path: string) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 627 } });
    await page.setContent(shareImageHtml(post));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path });
  } finally {
    await browser.close();
  }
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
  await renderShareImage(post, `${outDir}/share-image.png`);
  console.log(post.text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
