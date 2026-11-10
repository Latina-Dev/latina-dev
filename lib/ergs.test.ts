import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { ergGuidePath, ergs, ergsJsonLd, ergSlug, ergsMarkdown, membersAt } from "@/lib/ergs";
import { searchErgs } from "@/lib/mcp/directory";

import { exampleMember } from "@/types/members";

describe("ergs", () => {
  it("lists each company once, A to Z, with the group's name", () => {
    assert.ok(ergs.length > 0);
    const companies = ergs.map((erg) => erg.company);
    assert.equal(new Set(companies).size, companies.length);
    assert.deepEqual(
      companies,
      [...companies].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    );
    for (const erg of ergs) assert.equal(erg.slug, ergSlug(erg.company));
    assert.equal(ergSlug("AT&T"), "at-t");
    assert.equal(ergSlug("Warner Bros."), "warner-bros");
  });

  it("links to a guide that exists", () => {
    assert.ok(existsSync(`data${ergGuidePath}.md`));
  });

  it("is listed in llms.txt and the sitemap source", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const path of ["/ergs", "/ergs.md", "/ergs.json", ergGuidePath]) {
      assert.ok(llms.includes(`https://latina.dev${path})`), path);
    }
  });
});

describe("membersAt", () => {
  const erg = ergs.find((e) => e.company === "Uber")!;
  const at = (affiliation?: string) => membersAt(erg, [{ ...exampleMember, affiliation }]).length;

  it("matches the company as a whole word in a member's title", () => {
    assert.equal(at("Staff Engineer at Uber"), 1);
    assert.equal(at("Engineer, uber"), 1);
    assert.equal(at("Kubernetes Engineer at Acme"), 0);
    assert.equal(at(undefined), 0);
  });
});

describe("ergsJsonLd", () => {
  it("lists every ERG as an organization inside its company", () => {
    const { mainEntity } = ergsJsonLd();
    assert.equal(mainEntity.numberOfItems, ergs.length);
    const first = mainEntity.itemListElement[0];
    assert.equal(first.position, 1);
    assert.equal(first.item.parentOrganization.name, ergs[0].company);
  });
});

describe("ergsMarkdown", () => {
  it("has a row per company and a link to the guide", () => {
    const markdown = ergsMarkdown();
    for (const erg of ergs) assert.ok(markdown.includes(`| ${erg.company} | ${erg.name} |`));
    assert.ok(markdown.includes(`https://latina.dev${ergGuidePath}`));
  });
});

describe("searchErgs", () => {
  it("finds by company or group name, ignoring words every entry shares", () => {
    assert.equal(searchErgs({}).total, ergs.length);
    assert.deepEqual(
      searchErgs({ query: "Latinx ERG at Zillow" }).ergs.map((erg) => erg.name),
      ["Latinos Unidos"]
    );
    assert.ok(searchErgs({ query: "somos" }).total >= 2);
    assert.equal(searchErgs({ query: "no such company" }).total, 0);
  });
});
