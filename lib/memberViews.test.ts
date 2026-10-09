import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countrySlug, getCountryViews, levelViewFor, levelViews } from "@/lib/memberViews";

import { CountryName } from "@/types/countries";
import { MemberInterface } from "@/types/members";

const member = (slug: string, countries?: CountryName[], noindex?: boolean): MemberInterface => ({
  name: slug,
  added: "2024-01-01",
  level: "Student",
  linkedin: slug,
  slug,
  path: `/members/${slug}`,
  countries,
  noindex,
});

describe("countrySlug", () => {
  it("makes URL-safe segments", () => {
    assert.equal(countrySlug("Mexico"), "mexico");
    assert.equal(countrySlug("Dominican Republic"), "dominican-republic");
    assert.equal(countrySlug("Perú"), "peru");
  });
});

describe("getCountryViews", () => {
  it("only includes countries with at least two indexable members, biggest first", () => {
    const views = getCountryViews([
      member("a", ["Mexico"]),
      member("b", ["Mexico", "Peru"]),
      member("c", ["Mexico"]),
      member("d", ["Peru"]),
      member("e", ["Chile"]),
      member("f", ["Chile"], true),
      member("g"),
    ]);

    assert.deepEqual(
      views.map((view) => [view.slug, view.members.map((m) => m.slug)]),
      [
        ["mexico", ["a", "b", "c"]],
        ["peru", ["b", "d"]],
      ]
    );
  });
});

describe("levelViews", () => {
  it("covers every level once, with unique segments", () => {
    assert.deepEqual(levelViews.map((view) => view.level).sort(), [
      "Individual Contributor",
      "Leader",
      "Student",
    ]);
    assert.equal(levelViewFor("leaders")?.level, "Leader");
    assert.equal(levelViewFor("unknown"), undefined);
  });

  it("writes intros that match the count", () => {
    assert.match(levelViewFor("students")!.intro(1), /^1 Latina software engineering student /);
    assert.match(levelViewFor("leaders")!.intro(9), /^9 Latina engineering leaders working as/);
  });
});
