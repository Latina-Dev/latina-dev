import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatGuideDate, getGuides, guideJsonLd, renderGuide } from "@/lib/guides";

describe("getGuides", () => {
  it("reads every guide with a title, description and publish date", () => {
    const guides = getGuides();
    assert.ok(guides.length > 0);
    for (const guide of guides) {
      assert.equal(guide.path, `/guides/${guide.slug}`);
      assert.match(guide.published, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("renders Markdown to HTML", async () => {
    const html = await renderGuide(getGuides()[0]);
    assert.match(html, /<h2>/);
  });
});

describe("formatGuideDate", () => {
  it("shows the date readers see, without shifting it by time zone", () => {
    assert.equal(formatGuideDate("2026-10-10"), "October 10, 2026");
    assert.equal(formatGuideDate("2022-01-01"), "January 1, 2022");
  });
});

describe("guideJsonLd", () => {
  it("describes a guide as an Article by Frances", () => {
    const guide = getGuides()[0];
    const data = guideJsonLd(guide) as { "@type": string; author: { name: string } };
    assert.equal(data["@type"], "Article");
    assert.equal(data.author.name, "Frances Coronel");
  });
});
