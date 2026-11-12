import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  aggregateQuery,
  buildReferralReport,
  parseAggregate,
  referralReportIssue,
  reportRange,
} from "@/lib/referralReport";

const listed = [
  { name: "SHPE", kind: "resource" as const },
  { name: "ColorStack", kind: "resource" as const },
  { name: "Acme", kind: "erg" as const },
];

describe("reportRange", () => {
  it("covers the whole month, including leap days", () => {
    assert.deepEqual(reportRange("2028-02"), { since: "2028-02-01", until: "2028-02-29" });
    assert.deepEqual(reportRange("2026-12"), { since: "2026-12-01", until: "2026-12-31" });
  });

  it("rejects a malformed month", () => {
    assert.throws(() => reportRange("2026-13"));
  });
});

describe("aggregateQuery", () => {
  it("groups outbound clicks by organization", () => {
    const query = aggregateQuery("2026-11", "team_1", "prj_1");
    assert.equal(query.get("by"), "eventData/org");
    assert.equal(query.get("filter"), "eventName eq 'Outbound click'");
    assert.equal(query.get("since"), "2026-11-01");
    assert.equal(query.get("until"), "2026-11-30");
  });
});

describe("parseAggregate", () => {
  it("reads each shape of grouped value and drops the Others bucket", () => {
    assert.deepEqual(
      parseAggregate({
        data: [
          { "eventData/org": "SHPE", count: 5, visitors: 4 },
          { eventData: "Acme", count: 2, visitors: 2 },
          { org: "Gone", count: 1, visitors: 1 },
          { eventData: "Others", count: 9, visitors: 9 },
          { eventData: "", count: 3, visitors: 3 },
        ],
      }),
      [
        { org: "SHPE", clicks: 5, visitors: 4 },
        { org: "Acme", clicks: 2, visitors: 2 },
        { org: "Gone", clicks: 1, visitors: 1 },
      ]
    );
  });

  it("fails on an unexpected response", () => {
    assert.throws(() => parseAggregate({ error: "nope" }));
  });
});

describe("buildReferralReport", () => {
  const report = buildReferralReport(
    "2026-11",
    [
      { org: "Acme", clicks: 2, visitors: 2 },
      { org: "SHPE", clicks: 5, visitors: 4 },
      { org: "Gone", clicks: 1, visitors: 1 },
    ],
    listed
  );

  it("sorts by clicks and marks organizations no longer listed", () => {
    assert.deepEqual(
      report.rows.map((row) => [row.org, row.kind]),
      [
        ["SHPE", "resource"],
        ["Acme", "erg"],
        ["Gone", "no longer listed"],
      ]
    );
    assert.equal(report.totalClicks, 8);
    assert.equal(report.label, "November 2026");
  });

  it("lists organizations nobody clicked", () => {
    assert.deepEqual(report.unclicked, [{ name: "ColorStack", kind: "resource" }]);
  });

  it("renders a table, the unclicked list and the run link", () => {
    const issue = referralReportIssue(report, "https://example.org/run");
    assert.match(issue, /\*\*8 clicks\*\* to 3 organizations/);
    assert.match(issue, /\| SHPE \| Resource \| 5 \| 4 \|/);
    assert.match(issue, /\| Gone \| No longer listed \| 1 \| 1 \|/);
    assert.match(issue, /1 listed organization with no clicks/);
    assert.match(issue, /\[this workflow run\]\(https:\/\/example.org\/run\)/);
  });

  it("escapes backslashes and pipes in organization names", () => {
    const odd = buildReferralReport("2026-11", [{ org: "A\\|B", clicks: 1, visitors: 1 }], []);
    assert.ok(referralReportIssue(odd).includes("| A\\\\\\|B | No longer listed |"));
  });

  it("says so when nothing was clicked", () => {
    const empty = referralReportIssue(buildReferralReport("2026-11", [], listed));
    assert.match(empty, /No clicks were recorded this month/);
    assert.match(empty, /3 listed organizations with no clicks/);
  });
});
