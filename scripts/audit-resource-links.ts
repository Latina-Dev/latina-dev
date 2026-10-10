import { writeFileSync } from "fs";

import { resourceGroups } from "@/lib/resources";

// Monthly audit of every link on /resources. A plain link checker only catches errors, so this also
// flags the ways a resource goes stale while still answering 200: a redirect to a different domain
// (rebrands, acquisitions, shutdowns) and parked or spam pages (an expired domain someone bought).
// Writes a Markdown report to resource-audit.md and exits 1 when anything needs review.

const parkedPatterns = [
  /domain (is )?for sale/i,
  /buy this domain/i,
  /this domain (name )?(has expired|may be for sale|is parked)/i,
  /parked (free|domain)/i,
  /hugedomains|sedo\.com|dan\.com|afternic|godaddy\.com\/domains/i,
  /\b(casino|slot ?gacor|judi|togel|sportsbook|betting|poker online|bandar)\b/i,
  /\b(viagra|cialis|payday loans?)\b/i,
];

// Sites that block bots answer 403, 429 or a 503 challenge page; we can't tell those apart from a
// real block, so they are listed separately instead of being called broken
const blockedStatuses = new Set([401, 403, 429, 503, 999]);

const userAgent =
  "Mozilla/5.0 (compatible; LatinaDevLinkAudit/1.0; +https://github.com/Latina-Dev/latina-dev)";

// Registrable part of the hostname, so moving between subdomains (www, jobs, info) isn't flagged.
// Keeps three labels under two-part country suffixes like .co.uk or .org.mx
const baseDomain = (url: string) => {
  const labels = new URL(url).hostname.split(".");
  const twoPart =
    /^(co|com|org|net|edu|gob|gov|ac)$/.test(labels.at(-2) ?? "") && labels.at(-1)?.length === 2;
  return labels.slice(twoPart ? -3 : -2).join(".");
};

// Text a visitor would see, so URLs and words inside scripts, styles or comments don't match
const visibleText = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");

interface Finding {
  name: string;
  url: string;
  problem: string;
}

async function check(name: string, url: string, retry = true): Promise<Finding | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": userAgent, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(20_000),
    });

    if (blockedStatuses.has(response.status)) {
      return { name, url, problem: `couldn't check: the site answered ${response.status}` };
    }
    if (!response.ok) {
      return { name, url, problem: `broken: HTTP ${response.status}` };
    }

    if (baseDomain(response.url) !== baseDomain(url)) {
      return { name, url, problem: `moved to a different domain: ${response.url}` };
    }

    const type = response.headers.get("content-type") ?? "";
    if (type.includes("text/html")) {
      const text = visibleText((await response.text()).slice(0, 500_000));
      const match = parkedPatterns.find((pattern) => pattern.test(text));
      if (match) {
        return { name, url, problem: `looks parked or spammy (matched ${match})` };
      }
    }
    return null;
  } catch (error) {
    // Small sites time out now and then, so try once more before reporting
    if (retry) return check(name, url, false);
    const reason = error instanceof Error ? error.message : String(error);
    return { name, url, problem: `unreachable: ${reason}` };
  }
}

async function main() {
  const resources = resourceGroups.flatMap((group) => group.resources);
  const findings: Finding[] = [];

  // A few at a time, to be polite to small nonprofit sites
  for (let i = 0; i < resources.length; i += 6) {
    const batch = resources.slice(i, i + 6);
    const results = await Promise.all(batch.map((r) => check(r.name, r.url)));
    findings.push(...results.filter((f): f is Finding => f !== null));
  }

  const blocked = findings.filter((f) => f.problem.startsWith("couldn't check"));
  const review = findings.filter((f) => !blocked.includes(f));
  const row = (f: Finding) => `- [ ] **${f.name}** (${f.url}): ${f.problem}`;

  const report = [
    `The monthly audit checked ${resources.length} links on https://latina.dev/resources.`,
    "",
    review.length
      ? `## Needs review (${review.length})\n\nUpdate the URL in \`lib/resources.ts\`, or remove the entry if the organization has closed.\n\n${review.map(row).join("\n")}`
      : "Nothing needs review.",
    "",
    blocked.length
      ? `## Couldn't check automatically (${blocked.length})\n\nThese sites block automated checkers. Open them by hand once in a while.\n\n${blocked.map(row).join("\n")}`
      : "",
  ].join("\n");

  writeFileSync("resource-audit.md", report.trim() + "\n");
  console.log(report);
  process.exitCode = review.length ? 1 : 0;
}

main();
