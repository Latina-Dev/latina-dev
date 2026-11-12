import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { readMemberFiles } from "@/lib/getMembers";
import {
  buildWeeklySpotlight,
  isoWeek,
  pastSpotlights,
  pickSpotlight,
  SpotlightMember,
  WeeklySpotlight,
  weeklySpotlightIssue,
} from "@/lib/weeklySpotlight";

import { escapeHtml, fontFaces, memberPhoto, owlMark, renderShareImage } from "./share-image";

// Drafts this week's "Latina Dev of the Week" LinkedIn post and its share image.
// Usage: tsx scripts/weekly-spotlight.ts [member-slug]
// Without a slug, it picks the member to feature from past spotlight issues, read from the JSON
// file at SPOTLIGHT_HISTORY (the output of `gh issue list --json body,createdAt`). Writes
// weekly-spotlight/post.txt, weekly-spotlight/issue.md and weekly-spotlight/share-image.png. Set
// RUN_URL to link the workflow run, where the image is uploaded, from the issue.

const outDir = "weekly-spotlight";

const readHistory = () => {
  const path = process.env.SPOTLIGHT_HISTORY;
  if (!path || !existsSync(path)) return [];
  return pastSpotlights(JSON.parse(readFileSync(path, "utf8")));
};

const shareImageHtml = ({ member }: WeeklySpotlight) => {
  const photo = memberPhoto(member.slug);
  const details = [
    member.affiliation,
    member.countries?.length ? `Roots in ${member.countries.join(" · ")}` : undefined,
    member.location ? `Based in ${member.location}` : undefined,
  ].filter(Boolean) as string[];
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${fontFaces()}
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 627px; background: #9e0001; color: #fff; font-family: Latina, sans-serif;
  padding: 64px 72px; display: flex; gap: 64px; align-items: center; }
.photo { flex: none; width: 400px; height: 400px; border-radius: 50%; border: 8px solid #fff;
  object-fit: cover; background: #fff; }
main { display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-width: 0; }
header { display: flex; align-items: center; gap: 20px; font-weight: 900; font-size: 34px; letter-spacing: 1px; }
header img { height: 64px; }
.kicker { font-weight: 700; font-size: 30px; letter-spacing: 2px; text-transform: uppercase; opacity: .92; }
h1 { font-weight: 900; font-size: 84px; line-height: 1; margin-top: 12px; }
.details { font-weight: 500; font-size: 30px; margin-top: 6px; line-height: 1.3; }
h1 + .details { margin-top: 20px; }
footer { font-weight: 500; font-size: 26px; opacity: .92; }
</style></head><body>
${photo ? `<img class="photo" src="${photo}" alt="">` : ""}
<main>
  <header><img src="${owlMark()}" alt="">LATINA DEV</header>
  <div>
    <p class="kicker">Latina Dev of the Week</p>
    <h1>${escapeHtml(member.name)}</h1>
    ${details.map((line) => `<p class="details">${escapeHtml(line)}</p>`).join("")}
  </div>
  <footer>latina.dev/members/${member.slug}</footer>
</main>
</body></html>`;
};

async function main() {
  const members: SpotlightMember[] = readMemberFiles().map(({ slug, data, content }) => ({
    name: data.name,
    slug,
    added: data.added,
    level: data.level,
    linkedin: data.linkedin,
    affiliation: data.affiliation,
    location: data.location,
    countries: data.countries,
    openTo: data.openTo,
    bio: content.trim() || undefined,
    // Optional opt-in to social posts; read loosely so this works before and after it's in the schema
    featureMilestones: (data as { featureMilestones?: boolean }).featureMilestones === true,
  }));

  const slug = process.argv[2];
  const member = slug
    ? members.find((candidate) => candidate.slug === slug)
    : pickSpotlight(members, readHistory());
  if (!member) throw new Error(`no member profile named "${slug}" in data/members`);

  const spotlight = buildWeeklySpotlight({ week: isoWeek(), member, memberCount: members.length });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/post.txt`, spotlight.text + "\n");
  writeFileSync(`${outDir}/issue.md`, weeklySpotlightIssue(spotlight, process.env.RUN_URL));
  await renderShareImage(shareImageHtml(spotlight), `${outDir}/share-image.png`);
  console.log(spotlight.text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
