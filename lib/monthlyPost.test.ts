import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildMonthlyPost,
  monthBounds,
  monthlyPostIssue,
  PostMember,
  previousMonth,
  spotlightMembers,
} from "@/lib/monthlyPost";

const member = (slug: string, added: string, affiliation?: string): PostMember => ({
  name: slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" "),
  slug,
  added,
  linkedin: `${slug}-li`,
  affiliation,
});

const members = [
  member("ana-lopez", "2026-10-03", "Software Engineer at Acme"),
  member("bea-ruiz", "2026-10-20"),
  member("carla-diaz", "2023-05-01"),
  member("dora-vega", "2023-06-01"),
  member("eva-soto", "2024-07-20"),
  member("fina-mora", "2026-09-30"),
];

describe("month helpers", () => {
  it("finds the previous month across a year boundary", () => {
    assert.equal(previousMonth(new Date("2026-11-01T15:00:00Z")), "2026-10");
    assert.equal(previousMonth(new Date("2027-01-01T00:00:00Z")), "2026-12");
  });

  it("bounds a month in UTC", () => {
    const { start, end } = monthBounds("2026-12");
    assert.equal(start.toISOString(), "2026-12-01T00:00:00.000Z");
    assert.equal(end.toISOString(), "2027-01-01T00:00:00.000Z");
  });
});

describe("spotlightMembers", () => {
  it("skips members added that month and rotates by month", () => {
    const october = spotlightMembers(members, "2026-10", 3);
    assert.equal(october.length, 3);
    assert.ok(october.every((m) => !m.added.startsWith("2026-10")));
    assert.notDeepEqual(
      spotlightMembers(members, "2026-11", 3).map((m) => m.slug),
      october.map((m) => m.slug)
    );
  });

  it("returns nobody when asked for none", () => {
    assert.deepEqual(spotlightMembers(members, "2026-10", 0), []);
  });
});

describe("buildMonthlyPost", () => {
  it("welcomes new members, lists new resources and guides, and tops up with a spotlight", () => {
    const post = buildMonthlyPost({
      month: "2026-10",
      members,
      newResources: [{ name: "Techqueria", group: "Latino tech communities" }],
      guides: [
        { title: "Old guide", slug: "old", published: "2026-09-01" },
        { title: "New guide", slug: "new", published: "2026-10-10" },
      ],
    });
    assert.deepEqual(
      post.newMembers.map((m) => m.slug),
      ["ana-lopez", "bea-ruiz"]
    );
    assert.equal(post.spotlight.length, 1);
    assert.deepEqual(
      post.newGuides.map((g) => g.slug),
      ["new"]
    );
    assert.match(
      post.text,
      /^October 2026 on Latina Dev: 2 new members, 1 new resource and 1 new guide for Latina software engineers\./
    );
    assert.match(
      post.text,
      /• Ana Lopez, Software Engineer at Acme: https:\/\/latina\.dev\/members\/ana-lopez/
    );
    assert.match(post.text, /• Techqueria \(Latino tech communities\)/);
    assert.match(post.text, /• New guide: https:\/\/latina\.dev\/guides\/new/);
    assert.doesNotMatch(post.text, /Old guide/);
    assert.match(post.text, /directory of 6 Latina software engineers/);
    assert.doesNotMatch(post.text, /latinx/i);
  });

  it("features members in a quiet month", () => {
    const post = buildMonthlyPost({ month: "2026-08", members, newResources: [], guides: [] });
    assert.equal(post.spotlight.length, 3);
    assert.match(post.text, /^August 2026 on Latina Dev: meet 3 Latina software engineers/);
  });

  it("sums up a big batch of resources by section and stays within LinkedIn's limit", () => {
    const newResources = Array.from({ length: 40 }, (_, i) => ({
      name: `Resource ${i}`,
      group: i % 2 ? "Find a job" : "Conferences",
    }));
    const many = Array.from({ length: 30 }, (_, i) => member(`new-member-${i}`, "2026-10-05"));
    const post = buildMonthlyPost({ month: "2026-10", members: many, newResources, guides: [] });
    assert.match(post.text, /• Conferences \(20\)\n• Find a job \(20\)/);
    assert.match(post.text, /• and 20 more: https:\/\/latina\.dev\/members/);
    assert.ok(post.text.length < 3000);
  });

  it("rejects a malformed month", () => {
    assert.throws(() =>
      buildMonthlyPost({ month: "2026-13", members, newResources: [], guides: [] })
    );
  });
});

describe("monthlyPostIssue", () => {
  it("wraps the post for copying and lists who to tag", () => {
    const post = buildMonthlyPost({ month: "2026-10", members, newResources: [], guides: [] });
    const issue = monthlyPostIssue(post, "https://github.com/Latina-Dev/latina-dev/actions/runs/1");
    assert.ok(issue.includes("```text\n" + post.text + "\n```"));
    assert.match(
      issue,
      /\[this run\]\(https:\/\/github\.com\/Latina-Dev\/latina-dev\/actions\/runs\/1\)/
    );
    assert.match(issue, /- Ana Lopez: https:\/\/www\.linkedin\.com\/in\/ana-lopez-li/);
  });
});
