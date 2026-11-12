import { mkdirSync, writeFileSync } from "fs";

import { ergs } from "@/lib/ergs";
import { isMonth, previousMonth } from "@/lib/monthlyPost";
import {
  aggregateQuery,
  buildReferralReport,
  ListedOrg,
  parseAggregate,
  referralReportIssue,
} from "@/lib/referralReport";
import { resourceGroups } from "@/lib/resources";

// Writes referral-report/issue.md: clicks from latina.dev to each listed resource and ERG for a
// month (YYYY-MM, default: last month), from Vercel Web Analytics. Needs VERCEL_TOKEN with read
// access to the project, plus VERCEL_TEAM_ID and VERCEL_PROJECT_ID. Set RUN_URL to link the run.

const outDir = "referral-report";

const main = async () => {
  const month = process.argv[2] || previousMonth();
  if (!isMonth(month)) throw new Error(`month must be YYYY-MM, got "${month}"`);
  const { VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID, RUN_URL } = process.env;
  if (!VERCEL_TOKEN || !VERCEL_TEAM_ID || !VERCEL_PROJECT_ID) {
    throw new Error("Set VERCEL_TOKEN, VERCEL_TEAM_ID and VERCEL_PROJECT_ID");
  }

  const query = aggregateQuery(month, VERCEL_TEAM_ID, VERCEL_PROJECT_ID);
  const response = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/events/aggregate?${query}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!response.ok) {
    throw new Error(`Web Analytics API answered ${response.status}: ${await response.text()}`);
  }

  // A resource listed in more than one group is still one organization
  const listed: ListedOrg[] = [
    ...resourceGroups.flatMap((group) =>
      group.resources.map((resource) => ({ name: resource.name, kind: "resource" as const }))
    ),
    ...ergs.map((erg) => ({ name: erg.company, kind: "erg" as const })),
  ];
  const unique = [...new Map(listed.map((org) => [org.name, org])).values()];
  const report = buildReferralReport(month, parseAggregate(await response.json()), unique);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/title.txt`, `Referrals to listed organizations, ${report.label}\n`);
  writeFileSync(`${outDir}/issue.md`, referralReportIssue(report, RUN_URL));
  console.log(
    `${report.label}: ${report.totalClicks} clicks to ${report.rows.length} organizations`
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
