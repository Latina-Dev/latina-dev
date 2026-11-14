import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  demoteHeadings,
  getJobSearchPage,
  getJobSearchPages,
  getJobSearchSteps,
  renderJobSearchMarkdown,
} from "@/lib/jobSearch";
import { legacyHashTarget, legacyHashTargets } from "@/lib/jobSearchLegacy";

describe("getJobSearchSteps", () => {
  it("reads the five steps in order", () => {
    const steps = getJobSearchSteps();
    assert.deepEqual(
      steps.map((step) => [step.number, step.slug]),
      [
        [1, "prepare"],
        [2, "search"],
        [3, "apply"],
        [4, "interview"],
        [5, "accept"],
      ]
    );
  });

  it("files every deeper page under a step", () => {
    const pages = getJobSearchPages();
    assert.equal(pages.length, 13);
    for (const page of pages) {
      assert.equal(page.path, `/job-search/${page.slug}`);
      assert.ok(page.description.length > 20, `${page.slug} needs a description`);
    }
    assert.equal(getJobSearchPage("negotiating-salary")?.step.slug, "accept");
    assert.equal(getJobSearchPage("nope"), undefined);
  });
});

describe("demoteHeadings", () => {
  it("pushes headings down a level but leaves code blocks alone", () => {
    assert.equal(
      demoteHeadings("## A\n### B\n```\n# not a heading\n```"),
      "### A\n#### B\n```\n# not a heading\n```"
    );
  });
});

describe("renderJobSearchMarkdown", () => {
  it("renders every page without leftover docsify markup", async () => {
    for (const step of getJobSearchSteps()) {
      for (const page of [step, ...step.pages]) {
        const html = await renderJobSearchMarkdown(page.content);
        assert.ok(!html.includes("docsify"), `${page.slug} still mentions docsify`);
        assert.ok(!html.includes("README.md"), `${page.slug} links to an old README`);
      }
    }
  });
});

describe("legacyHashTarget", () => {
  it("sends old engjobsearch.com links to the new guide", () => {
    assert.equal(legacyHashTarget("#/03-apply/README"), "/job-search#apply");
    assert.equal(legacyHashTarget("#/03-apply/cover-letters/README"), "/job-search/cover-letters");
    assert.equal(
      legacyHashTarget("#/05-accept/salary?id=salary-research-tools"),
      "/job-search/negotiating-salary"
    );
    assert.equal(legacyHashTarget("#apply"), undefined);
    assert.equal(legacyHashTarget(""), undefined);
  });

  it("only points at pages that exist", () => {
    const slugs = new Set(getJobSearchPages().map((page) => page.slug));
    const steps = new Set(getJobSearchSteps().map((step) => step.slug));
    for (const target of Object.values(legacyHashTargets)) {
      if (target.startsWith("#")) assert.ok(steps.has(target.slice(1)), target);
      else assert.ok(slugs.has(target.slice(1)), target);
    }
  });
});
