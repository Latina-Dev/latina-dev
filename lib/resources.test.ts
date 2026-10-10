import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resourceCount, resourceGroups, resourcesJsonLd } from "@/lib/resources";

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
});

describe("resourcesJsonLd", () => {
  it("lists every resource in order in an ItemList", () => {
    const data = resourcesJsonLd("desc") as {
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
