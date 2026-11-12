import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bioExcerpt,
  buildWeeklySpotlight,
  isoWeek,
  pastSpotlights,
  pickSpotlight,
  SpotlightMember,
  weeklySpotlightIssue,
} from "@/lib/weeklySpotlight";

const member = (slug: string, added: string, extra: Partial<SpotlightMember> = {}) => ({
  name: slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" "),
  slug,
  added,
  level: "Individual Contributor" as const,
  linkedin: `${slug}-li`,
  ...extra,
});

const members: SpotlightMember[] = [
  member("ana-lopez", "2024-01-01"),
  member("bea-ruiz", "2023-01-01"),
  member("carla-diaz", "2025-01-01", {
    affiliation: "Staff Engineer at Acme",
    countries: ["Peru"],
  }),
  member("dora-vega", "2026-01-01"),
];

describe("isoWeek", () => {
  it("numbers weeks from Monday, with the year the week's Thursday is in", () => {
    assert.equal(isoWeek(new Date("2026-11-12T12:00:00Z")), "2026-W46");
    assert.equal(isoWeek(new Date("2026-11-16T15:00:00Z")), "2026-W47");
    assert.equal(isoWeek(new Date("2027-01-01T00:00:00Z")), "2026-W53");
    assert.equal(isoWeek(new Date("2025-12-29T00:00:00Z")), "2026-W01");
  });
});

describe("pickSpotlight", () => {
  it("starts with fuller profiles, then longest-standing members", () => {
    assert.equal(pickSpotlight(members, []).slug, "carla-diaz");
    const next = pickSpotlight(members, [{ slug: "carla-diaz", date: "2026-11-02" }]);
    assert.equal(next.slug, "bea-ruiz");
  });

  it("puts members who opted in to milestone posts first", () => {
    const optedIn = members.map((m) =>
      m.slug === "dora-vega" ? { ...m, featureMilestones: true } : m
    );
    assert.equal(pickSpotlight(optedIn, []).slug, "dora-vega");
  });

  it("features everyone before repeating, then whoever went longest ago", () => {
    const past = [
      { slug: "carla-diaz", date: "2026-10-05" },
      { slug: "bea-ruiz", date: "2026-10-12" },
      { slug: "ana-lopez", date: "2026-10-19" },
    ];
    assert.equal(pickSpotlight(members, past).slug, "dora-vega");
    const all = [...past, { slug: "dora-vega", date: "2026-10-26" }];
    assert.equal(pickSpotlight(members, all).slug, "carla-diaz");
    // A later spotlight of the same member counts, not the first
    assert.equal(
      pickSpotlight(members, [...all, { slug: "carla-diaz", date: "2026-11-02" }]).slug,
      "bea-ruiz"
    );
  });
});

describe("pastSpotlights", () => {
  it("reads the marker from each issue body", () => {
    const issue = weeklySpotlightIssue(
      buildWeeklySpotlight({ week: "2026-W46", member: members[0], memberCount: 4 })
    );
    assert.deepEqual(
      pastSpotlights([
        { body: issue, createdAt: "2026-11-09T15:00:00Z" },
        { body: "no marker here", createdAt: "2026-11-02T15:00:00Z" },
      ]),
      [{ slug: "ana-lopez", date: "2026-11-09T15:00:00Z" }]
    );
  });
});

describe("buildWeeklySpotlight", () => {
  it("leads with the member and links the profile", () => {
    const { text } = buildWeeklySpotlight({
      week: "2026-W46",
      member: {
        ...members[2],
        location: "Austin, TX",
        openTo: ["Mentoring", "Speaking"],
        bio: "Carla builds **payments** systems at [Acme](https://acme.test).",
      },
      memberCount: 63,
    });
    const lines = text.split("\n\n");
    assert.equal(lines[0], "Latina Dev of the Week: Carla Diaz");
    assert.equal(
      lines[1],
      "Meet Carla Diaz, Staff Engineer at Acme with roots in Peru, based in Austin, TX."
    );
    assert.equal(lines[2], `In Carla's words: "Carla builds payments systems at Acme."`);
    assert.equal(lines[3], "Carla is open to mentoring and speaking.");
    assert.match(text, /https:\/\/latina\.dev\/members\/carla-diaz/);
    assert.match(text, /directory of 63 Latina software engineers/);
    assert.doesNotMatch(text, /Latinx/);
  });

  it("describes a sparse profile by level", () => {
    const { text } = buildWeeklySpotlight({
      week: "2026-W46",
      member: { ...members[1], level: "Leader", countries: ["Mexico", "Dominican Republic"] },
      memberCount: 63,
    });
    assert.match(
      text,
      /Meet Bea Ruiz, an engineering leader with roots in Mexico and the Dominican Republic\./
    );
    const company = buildWeeklySpotlight({
      week: "2026-W46",
      member: { ...members[0], affiliation: "Chromatic" },
      memberCount: 63,
    });
    assert.match(company.text, /Meet Ana Lopez \(Chromatic\), a software engineer\./);
  });
});

describe("weeklySpotlightIssue", () => {
  it("links the run, the LinkedIn profile and notes whether the member opted in", () => {
    const spotlight = buildWeeklySpotlight({
      week: "2026-W46",
      member: members[0],
      memberCount: 4,
    });
    const issue = weeklySpotlightIssue(spotlight, "https://github.com/run/1");
    assert.match(issue, /\[this run\]\(https:\/\/github\.com\/run\/1\)/);
    assert.match(issue, /linkedin\.com\/in\/ana-lopez-li/);
    assert.match(issue, /hasn't opted in/);
    const optedIn = weeklySpotlightIssue({
      ...spotlight,
      member: { ...members[0], featureMilestones: true },
    });
    assert.match(optedIn, /opted in to being featured/);
  });
});

describe("bioExcerpt", () => {
  it("cuts a long bio at a sentence end", () => {
    const bio = "First sentence here. ".repeat(40);
    const excerpt = bioExcerpt(bio, 100);
    assert.ok(excerpt.length <= 100);
    assert.ok(excerpt.endsWith("."));
  });
});
