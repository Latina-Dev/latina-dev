import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getGuides, guideJsonLd, renderGuide } from "@/lib/guides";

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

describe("guideJsonLd", () => {
  it("describes a guide as an Article by Frances", () => {
    const guide = getGuides()[0];
    const data = guideJsonLd(guide) as { "@type": string; author: { name: string } };
    assert.equal(data["@type"], "Article");
    assert.equal(data.author.name, "Frances Coronel");
  });
});
