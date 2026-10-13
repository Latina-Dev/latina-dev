import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allResources,
  resourceCategories,
  searchMembers,
  searchResources,
  toMcpMembers,
} from "@/lib/mcp/directory";

import { MemberInterface } from "@/types/members";

const base = { added: "2024-01-01", level: "Leader" as const };

const members = toMcpMembers([
  {
    ...base,
    name: "Ana Pérez",
    slug: "ana-perez",
    path: "/members/ana-perez",
    linkedin: "ana-perez",
    github: "anap",
    twitter: "anap_dev",
    website: "https://anaperez.dev",
    affiliation: "Staff Engineer at Acme",
    location: "Austin, TX",
    countries: ["México" as never, "Peru"],
    openTo: ["Mentoring"],
    bio: "<p>Builds <strong>design systems</strong> &amp; mentors. Writes &amp;lt;code&amp;gt;.</p>",
    skills: ["React"],
  },
  {
    ...base,
    level: "Student",
    name: "Bea Ruiz",
    slug: "bea-ruiz",
    path: "/members/bea-ruiz",
    linkedin: "bea-ruiz",
    countries: ["Colombia"],
  },
  {
    ...base,
    name: "Hidden Member",
    slug: "hidden",
    path: "/members/hidden",
    linkedin: "hidden",
    noindex: true,
  },
] satisfies MemberInterface[]);

describe("toMcpMembers", () => {
  it("drops opted-out members and fields the site doesn't show", () => {
    assert.deepEqual(
      members.map((m) => m.slug),
      ["ana-perez", "bea-ruiz"]
    );
    assert.equal("skills" in members[0], false);
    assert.equal("noindex" in members[0], false);
  });

  it("returns full URLs and the bio as plain text", () => {
    const [ana, bea] = members;
    assert.equal(ana.url, "https://latina.dev/members/ana-perez");
    assert.equal(ana.linkedin, "https://www.linkedin.com/in/ana-perez");
    assert.equal(ana.github, "https://github.com/anap");
    assert.equal(ana.twitter, "https://x.com/anap_dev");
    assert.equal(ana.website, "https://anaperez.dev");
    assert.equal(ana.bio, "Builds design systems & mentors. Writes &lt;code&gt;.");
    assert.equal("bio" in bea, false);
    for (const field of ["github", "twitter", "website", "affiliation", "location", "openTo"]) {
      assert.equal(field in bea, false, field);
    }
  });
});

describe("searchMembers", () => {
  const slugs = (search: Parameters<typeof searchMembers>[1]) =>
    searchMembers(members, search).members.map((m) => m.slug);

  it("matches every keyword across profile fields, ignoring case and accents", () => {
    assert.deepEqual(slugs({ query: "acme austin" }), ["ana-perez"]);
    assert.deepEqual(slugs({ query: "MEXICO" }), ["ana-perez"]);
    assert.deepEqual(slugs({ query: "design systems" }), ["ana-perez"]);
    assert.deepEqual(slugs({ query: "acme colombia" }), []);
  });

  it("ignores words that describe every member", () => {
    assert.deepEqual(slugs({ query: "Latina software engineers in Austin" }), ["ana-perez"]);
  });

  it("filters by level, country and what members are open to", () => {
    assert.deepEqual(slugs({ level: "Student" }), ["bea-ruiz"]);
    assert.deepEqual(slugs({ country: "Peru" }), ["ana-perez"]);
    assert.deepEqual(slugs({ openTo: "mentoring" }), ["ana-perez"]);
  });

  it("lists everyone with no search and respects the limit", () => {
    assert.deepEqual(slugs({}), ["ana-perez", "bea-ruiz"]);
    const limited = searchMembers(members, { limit: 1 });
    assert.equal(limited.total, 2);
    assert.equal(limited.members.length, 1);
  });
});

describe("searchResources", () => {
  it("covers every resource on the site", () => {
    assert.equal(
      allResources.length,
      resourceCategories.reduce((sum, c) => sum + c.count, 0)
    );
    assert.equal(searchResources({ limit: 50 }).total, allResources.length);
  });

  it("finds resources by keyword and category", () => {
    const { resources } = searchResources({ query: "techqueria" });
    assert.equal(resources[0].name, "Techqueria");
    assert.match(resources[0].page, /^https:\/\/latina\.dev\/resources\/[a-z0-9-]+#techqueria$/);

    const jobs = searchResources({ category: "jobs", limit: 50 });
    assert.ok(jobs.total > 0);
    assert.ok(jobs.resources.every((r) => r.category === "jobs"));
  });
});

describe("searchResources edge cases", () => {
  it("returns nothing when no resource matches every keyword", () => {
    assert.deepEqual(searchResources({ query: "zzzz-no-such-resource" }), {
      total: 0,
      resources: [],
    });
  });

  it("ignores generic words and respects the limit", () => {
    assert.equal(
      searchResources({ query: "Latina software engineers" }).total,
      allResources.length
    );
    assert.equal(searchResources({ limit: 2 }).resources.length, 2);
  });
});
