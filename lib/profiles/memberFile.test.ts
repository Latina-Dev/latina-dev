import assert from "node:assert/strict";
import { describe, it } from "node:test";
import grayMatter from "gray-matter";

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
  website: "",
  location: "",
  countries: ["Peru"],
  skills: "",
  openTo: [],
  noindex: false,
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
    data.set("noindex", "true");

    const form = readProfileForm(data);
    assert.equal(form.name, "Ana Example");
    assert.equal(form.linkedin, "ana-example");
    assert.equal(form.github, "ana");
    assert.deepEqual(form.countries, ["Peru", "Chile"]);
    assert.equal(form.noindex, true);
  });
});

describe("buildMemberProfile", () => {
  it("dates a new profile today and leaves empty optional fields out", () => {
    const result = buildMemberProfile(values(), undefined, "2026-10-09");
    assert.ok(result.success);
    assert.equal(result.data.added, "2026-10-09");
    assert.equal(result.data.github, undefined);
    assert.equal(result.data.noindex, undefined);
  });

  it("keeps the original date and fields the form doesn't show when editing", () => {
    const existing = {
      name: "Ana Example",
      added: "2023-01-01",
      level: "Student" as const,
      linkedin: "ana-example",
      twitter: "ana",
      noindex: true,
    };
    const result = buildMemberProfile(values({ level: "Leader" }), existing, "2026-10-09");
    assert.ok(result.success);
    assert.equal(result.data.added, "2023-01-01");
    assert.equal(result.data.twitter, "ana");
    assert.equal(result.data.level, "Leader");
    // Unchecking the box removes noindex
    assert.equal(result.data.noindex, undefined);
  });

  it("splits skills on commas", () => {
    const result = buildMemberProfile(
      values({ skills: "React, , TypeScript" }),
      undefined,
      "2026-10-09"
    );
    assert.ok(result.success);
    assert.deepEqual(result.data.skills, ["React", "TypeScript"]);
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
        skills: "React, TypeScript",
        openTo: ["Mentoring"],
        noindex: true,
        bio: "Line one\r\n\r\n\r\n\r\nLine two   ",
      }),
      undefined,
      "2026-10-09"
    );
    assert.ok(result.success);

    const file = serializeMemberFile(result.data, result.bio);
    const { data, content } = grayMatter(file);
    const parsed = validateMemberFrontmatter("ana-example.md", data);
    assert.ok(parsed.success);
    assert.deepEqual(parsed.data, result.data);
    assert.equal(content.trim(), "Line one\n\nLine two");
    assert.match(file, /^countries: \["Peru", "Chile"\]$/m);
    assert.match(file, /^noindex: true$/m);
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
