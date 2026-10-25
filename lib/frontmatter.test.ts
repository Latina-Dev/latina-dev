import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseFrontmatter } from "@/lib/frontmatter";

describe("parseFrontmatter", () => {
  it("splits YAML frontmatter from the Markdown body", () => {
    const { data, content } = parseFrontmatter('---\nname: "Ana"\ntags: [a, b]\n---\n\n# Hi\n');
    assert.deepEqual(data, { name: "Ana", tags: ["a", "b"] });
    assert.equal(content, "\n# Hi\n");
  });

  it("handles Windows line endings and empty frontmatter", () => {
    assert.deepEqual(parseFrontmatter("---\r\na: 1\r\n---\r\nbody"), {
      data: { a: 1 },
      content: "body",
    });
    assert.deepEqual(parseFrontmatter("---\n---\nbody"), { data: {}, content: "body" });
  });

  it("leaves files without frontmatter untouched", () => {
    assert.deepEqual(parseFrontmatter("# Title\n---\n"), { data: {}, content: "# Title\n---\n" });
  });

  it("doesn't end the frontmatter at --- inside a value", () => {
    assert.deepEqual(parseFrontmatter("---\na: x---\nb: 2\n---\n").data, { a: "x---", b: 2 });
  });

  it("rejects frontmatter that isn't a map", () => {
    assert.throws(() => parseFrontmatter("---\n- a\n---\n"), /YAML map/);
  });
});
