import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseFrontmatter } from "@/lib/frontmatter";
import { validateMemberFrontmatter } from "@/lib/memberSchema";
import {
  buildMemberProfile,
  ProfileFormValues,
  readProfileForm,
  serializeMemberFile,
  slugForName,
} from "@/lib/profiles/memberFile";

const values = (overrides: Partial<ProfileFormValues> = {}): ProfileFormValues => ({
  name: "Ana Example",
  level: "Student",
  linkedin: "ana-example",
  affiliation: "",
  github: "",
  twitter: "",
  bluesky: "",
  website: "",
  blog: "",
  location: "",
  countries: ["Peru"],
  openTo: [],
  featureMilestones: false,
  bio: "Ana builds things.",
  ...overrides,
});

describe("readProfileForm", () => {
  it("trims values and strips a pasted LinkedIn URL down to the handle", () => {
    const data = new FormData();
    data.set("name", "  Ana Example ");
    data.set("linkedin", "https://www.linkedin.com/in/ana-example/");
    data.set("github", "@ana");
    data.append("countries", "Peru");
    data.append("countries", "Chile");

    const form = readProfileForm(data);
    assert.equal(form.name, "Ana Example");
    assert.equal(form.linkedin, "ana-example");
    assert.equal(form.github, "ana");
    assert.deepEqual(form.countries, ["Peru", "Chile"]);
    assert.equal(form.featureMilestones, false);
  });

  it("strips pasted X and Bluesky profile URLs down to the handle", () => {
    const data = new FormData();
    data.set("twitter", "https://x.com/ana_ex/");
    data.set("bluesky", "https://bsky.app/profile/Ana.bsky.social");
    data.set("featureMilestones", "true");

    const form = readProfileForm(data);
    assert.equal(form.twitter, "ana_ex");
    assert.equal(form.bluesky, "ana.bsky.social");
    assert.equal(form.featureMilestones, true);

    data.set("twitter", "@ana_ex");
    data.set("bluesky", "@ana.example.com");
    assert.equal(readProfileForm(data).twitter, "ana_ex");
    assert.equal(readProfileForm(data).bluesky, "ana.example.com");
  });
});

describe("buildMemberProfile", () => {
  it("dates a new profile today and leaves empty optional fields out", () => {
    const result = buildMemberProfile(values(), undefined, "2026-10-09");
    assert.ok(result.success);
    assert.equal(result.data.added, "2026-10-09");
    assert.equal(result.data.github, undefined);
  });

  it("keeps the original date when editing", () => {
    const existing = {
      name: "Ana Example",
      added: "2023-01-01",
      level: "Student" as const,
      linkedin: "ana-example",
    };
    const result = buildMemberProfile(values({ level: "Leader" }), existing, "2026-10-09");
    assert.ok(result.success);
    assert.equal(result.data.added, "2023-01-01");
    assert.equal(result.data.level, "Leader");
  });

  it("saves Bluesky, blog and X, and drops them when cleared", () => {
    const added = buildMemberProfile(
      values({
        twitter: "ana_ex",
        bluesky: "ana.bsky.social",
        blog: "https://ana.example/feed.xml",
      }),
      undefined,
      "2026-10-09"
    );
    assert.ok(added.success);
    assert.equal(added.data.bluesky, "ana.bsky.social");
    assert.equal(added.data.blog, "https://ana.example/feed.xml");
    assert.equal(added.data.twitter, "ana_ex");

    const cleared = buildMemberProfile(values(), added.data, "2026-10-10");
    assert.ok(cleared.success);
    assert.equal("bluesky" in cleared.data, false);
    assert.equal("blog" in cleared.data, false);
    assert.equal("twitter" in cleared.data, false);
  });

  it("rejects a Bluesky handle that isn't a domain and a blog that isn't a URL", () => {
    assert.equal(buildMemberProfile(values({ bluesky: "ana" }), undefined, "x").success, false);
    assert.equal(buildMemberProfile(values({ blog: "ana.blog" }), undefined, "x").success, false);
  });

  it("records milestone consent only while the box is ticked", () => {
    const optedIn = buildMemberProfile(
      values({ featureMilestones: true }),
      undefined,
      "2026-10-09"
    );
    assert.ok(optedIn.success);
    assert.equal(optedIn.data.featureMilestones, true);
    assert.match(serializeMemberFile(optedIn.data, optedIn.bio), /^featureMilestones: true$/m);

    const withdrawn = buildMemberProfile(values(), optedIn.data, "2026-10-10");
    assert.ok(withdrawn.success);
    assert.equal("featureMilestones" in withdrawn.data, false);

    const notAsked = buildMemberProfile(values(), undefined, "2026-10-09");
    assert.ok(notAsked.success);
    assert.equal("featureMilestones" in notAsked.data, false);
  });

  it("reports schema problems", () => {
    const result = buildMemberProfile(values({ level: "CEO" }), undefined, "2026-10-09");
    assert.equal(result.success, false);
  });

  it("requires a bio", () => {
    const result = buildMemberProfile(values({ bio: "   " }), undefined, "2026-10-09");
    assert.equal(result.success, false);
  });
});

describe("serializeMemberFile", () => {
  it("writes a file that parses back to the same profile", () => {
    const result = buildMemberProfile(
      values({
        name: 'Ana "La Dev": Example',
        countries: ["Peru", "Chile"],
        openTo: ["Mentoring"],
        bluesky: "ana.bsky.social",
        blog: "https://ana.example/blog",
        featureMilestones: true,
        bio: "Line one\r\n\r\n\r\n\r\nLine two   ",
      }),
      undefined,
      "2026-10-09"
    );
    assert.ok(result.success);

    const file = serializeMemberFile(result.data, result.bio);
    const { data, content } = parseFrontmatter(file);
    const parsed = validateMemberFrontmatter("ana-example.md", data);
    assert.ok(parsed.success);
    assert.deepEqual(parsed.data, result.data);
    assert.equal(content.trim(), "Line one\n\nLine two");
    assert.match(file, /^countries: \["Peru", "Chile"\]$/m);
  });
});

describe("slugForName", () => {
  it("drops accents and punctuation", () => {
    assert.equal(slugForName("Fernanda Pérez Gutiérrez", new Set()), "fernanda-perez-gutierrez");
  });

  it("adds a number when the slug is taken or reserved", () => {
    assert.equal(slugForName("Ana Example", new Set(["ana-example"])), "ana-example-2");
    assert.equal(slugForName("Students", new Set()), "students-2");
  });
});
