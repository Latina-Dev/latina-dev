import { isMonth, monthBounds } from "@/lib/monthlyPost";
import { outboundClickEvent, OutboundKind, referralSource } from "@/lib/referral";

// Builds the monthly report of clicks from latina.dev to each listed organization, from Vercel Web
// Analytics' custom events. Kept free of network and file access so it can be tested;
// scripts/referral-report.ts fetches the numbers and writes the issue.

export interface ListedOrg {
  name: string;
  kind: OutboundKind;
}

export interface OrgClicks {
  org: string;
  clicks: number;
  visitors: number;
}

interface ReferralRow extends OrgClicks {
  kind: OutboundKind | "no longer listed";
}

export interface ReferralReport {
  month: string;
  label: string;
  rows: ReferralRow[];
  totalClicks: number;
  unclicked: ListedOrg[];
}

const kindLabels: Record<ReferralRow["kind"], string> = {
  resource: "Resource",
  erg: "ERG",
  "no longer listed": "No longer listed",
};

/** First and last day of `month`, as the YYYY-MM-DD dates the Web Analytics API takes */
export const reportRange = (month: string) => {
  if (!isMonth(month)) throw new Error(`month must be YYYY-MM, got "${month}"`);
  const { start, end } = monthBounds(month);
  const last = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { since: start.toISOString().slice(0, 10), until: last.toISOString().slice(0, 10) };
};

/** Query string for the Web Analytics events aggregate endpoint: clicks grouped by organization */
export const aggregateQuery = (month: string, teamId: string, projectId: string) =>
  new URLSearchParams({
    teamId,
    projectId,
    ...reportRange(month),
    by: "eventData/org",
    filter: `eventName eq '${outboundClickEvent}'`,
    limit: "100",
  });

/**
 * Rows from an aggregate response. The grouped value's key has varied between API versions
 * ("eventData/org", "eventData" or "org"), so all three are read. Rows with no organization, and
 * the "Others" bucket past the limit, are dropped.
 */
export const parseAggregate = (body: unknown): OrgClicks[] => {
  const data = (body as { data?: unknown })?.data;
  if (!Array.isArray(data)) throw new Error("Web Analytics response has no data array");
  return data.flatMap((row: Record<string, unknown>) => {
    const org = row["eventData/org"] ?? row.eventData ?? row.org;
    if (typeof org !== "string" || !org || org === "Others") return [];
    return [{ org, clicks: Number(row.count) || 0, visitors: Number(row.visitors) || 0 }];
  });
};

export const buildReferralReport = (
  month: string,
  clicks: OrgClicks[],
  listed: ListedOrg[]
): ReferralReport => {
  const label = monthBounds(month).start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const kinds = new Map(listed.map((org) => [org.name, org.kind]));
  const rows = clicks
    .filter((row) => row.clicks > 0)
    .map((row) => ({ ...row, kind: kinds.get(row.org) ?? ("no longer listed" as const) }))
    .sort((a, b) => b.clicks - a.clicks || a.org.localeCompare(b.org));
  const clicked = new Set(rows.map((row) => row.org));
  return {
    month,
    label,
    rows,
    totalClicks: rows.reduce((n, row) => n + row.clicks, 0),
    unclicked: listed
      .filter((org) => !clicked.has(org.name))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Backslashes first, so an escaped pipe can't be undone by a name ending in a backslash
const cell = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\s+/g, " ");

/** Markdown body of the GitHub issue */
export const referralReportIssue = (report: ReferralReport, runUrl?: string) => {
  const lines = [`Clicks from latina.dev to the organizations it lists, ${report.label}.`, ""];
  if (report.rows.length === 0) {
    lines.push("No clicks were recorded this month.");
  } else {
    lines.push(
      `**${report.totalClicks} ${report.totalClicks === 1 ? "click" : "clicks"}** to ${report.rows.length} ${report.rows.length === 1 ? "organization" : "organizations"}.`,
      "",
      "| Organization | Listed as | Clicks | Visitors |",
      "| --- | --- | ---: | ---: |",
      ...report.rows.map(
        (row) => `| ${cell(row.org)} | ${kindLabels[row.kind]} | ${row.clicks} | ${row.visitors} |`
      )
    );
  }
  if (report.unclicked.length > 0) {
    lines.push(
      "",
      "<details>",
      `<summary>${report.unclicked.length} listed ${report.unclicked.length === 1 ? "organization" : "organizations"} with no clicks</summary>`,
      "",
      ...report.unclicked.map((org) => `- ${org.name} (${kindLabels[org.kind]})`),
      "",
      "</details>"
    );
  }
  lines.push(
    "",
    `To show an organization what Latina Dev sends them: every link carries \`utm_source=${referralSource}\` and \`utm_medium=referral\`, so these visits also appear in their own analytics under that source.`,
    "",
    "Clicks are counted with Vercel Web Analytics, without cookies or visitor ids. Visitors is Vercel's estimate of distinct people. A click is counted when the link is opened, whether or not the page loads."
  );
  if (runUrl) lines.push("", `Generated by [this workflow run](${runUrl}).`);
  return `${lines.join("\n")}\n`;
};
