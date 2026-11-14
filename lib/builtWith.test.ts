import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { supportGroups, tools, toolsFor } from "@/lib/builtWith";

describe("built with", () => {
  it("puts every tool in a group shown on the page", () => {
    const shown = supportGroups.flatMap((group) => toolsFor(group.support));
    assert.equal(shown.length, tools.length);
  });

  it("has unique names and https links", () => {
    assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length);
    for (const tool of tools) assert.match(tool.url, /^https:\/\//, tool.name);
  });

  it("never lists a price", () => {
    for (const tool of tools) {
      assert.doesNotMatch(
        `${tool.use} ${tool.plan ?? ""}`,
        /[$€£]|\d+\s*(\/|per)\s*(mo|month|year)/i,
        tool.name
      );
    }
  });
});
