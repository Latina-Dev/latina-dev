import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  resourceCount,
  resourceFaqs,
  resourceGroups,
  resourcesJsonLd,
  resourceSlug,
} from "@/lib/resources";

const all = resourceGroups.flatMap((group) => group.resources);

describe("resourceGroups", () => {
  it("has unique group anchors", () => {
    const ids = resourceGroups.map((group) => group.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("lists each resource once, with a valid http(s) URL and a description", () => {
    assert.equal(new Set(all.map((r) => r.url)).size, all.length);
    for (const resource of all) {
      assert.match(resource.url, /^https?:\/\/[^\s]+$/, resource.name);
      assert.ok(resource.description.trim().length > 0, resource.name);
    }
  });

  it("gives each resource a unique slug, used for its anchor and logo file", () => {
    const slugs = all.map(resourceSlug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(resourceSlug({ name: "#LatinaGeeks", url: "", description: "" }), "latinageeks");
  });

  it("links every category page from llms.txt", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const group of resourceGroups) {
      assert.ok(llms.includes(`https://latina.dev/resources/${group.id})`), group.id);
    }
  });
});

describe("resource order", () => {
  it("lists each category A to Z, ignoring punctuation", () => {
    for (const group of resourceGroups) {
      const names = group.resources.map((r) =>
        r.name.replace(/[^\p{L}\p{N} ]/gu, "").toLowerCase()
      );
      assert.deepEqual(
        names,
        [...names].sort((a, b) => a.localeCompare(b, "en"))
      );
    }
  });
});

describe("resource logos", () => {
  it("has a logo for every resource", () => {
    const logos = new Set(
      readdirSync("public/img/resources").map((file) => file.replace(/\.\w+$/, ""))
    );
    const missing = resourceGroups
      .flatMap((group) => group.resources.map(resourceSlug))
      .filter((slug) => !logos.has(slug));
    assert.deepEqual(missing, []);
  });
});

describe("resourceFaqs", () => {
  it("answers each category's question with its resources and page", () => {
    const faqs = resourceFaqs();
    assert.equal(faqs.length, resourceGroups.length);
    resourceGroups.forEach((group, i) => {
      assert.equal(faqs[i].question, group.question);
      for (const resource of group.resources) assert.ok(faqs[i].answer.includes(resource.name));
      assert.ok(faqs[i].answer.endsWith(`/resources/${group.id}`));
    });
  });
});

describe("resourcesJsonLd", () => {
  it("lists every resource in order in an ItemList", () => {
    const data = resourcesJsonLd({
      name: "Resources",
      path: "/resources",
      description: "desc",
    }) as {
      "@type": string;
      mainEntity: {
        numberOfItems: number;
        itemListElement: { position: number; item: { name: string } }[];
      };
    };
    assert.equal(data["@type"], "CollectionPage");
    assert.equal(data.mainEntity.numberOfItems, resourceCount);
    assert.deepEqual(
      data.mainEntity.itemListElement.map((el) => el.item.name),
      all.map((r) => r.name)
    );
    assert.deepEqual(
      data.mainEntity.itemListElement.map((el) => el.position),
      all.map((_, i) => i + 1)
    );
  });
});
