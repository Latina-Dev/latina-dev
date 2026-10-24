// Property-based (fuzz) tests: fast-check feeds each function many random inputs and
// shrinks any failure down to the smallest input that still breaks it
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fc from "fast-check";
import { dump } from "js-yaml";

import { parseFrontmatter } from "@/lib/frontmatter";
import { memberFrontmatterSchema, validateMemberFrontmatter } from "@/lib/memberSchema";

// Plain YAML values that survive a dump and load unchanged
const yamlValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.array(fc.string(), { maxLength: 5 })
);
const yamlKey = fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,15}$/);

describe("parseFrontmatter (fuzzed)", () => {
  it("reads back any frontmatter map and body it was given", () => {
    fc.assert(
      fc.property(
        fc.dictionary(yamlKey, yamlValue, { minKeys: 1, noNullPrototype: true }),
        fc.string(),
        (data, body) => {
          const parsed = parseFrontmatter(`---\n${dump(data)}---\n${body}`);
          assert.deepEqual(parsed.data, data);
          assert.equal(parsed.content, body);
        }
      ),
      // Always try an empty body and a body that itself opens with ---
      {
        examples: [
          [{ a: "x" }, ""],
          [{ a: "x" }, "---\nnot frontmatter\n---\n"],
        ],
      }
    );
  });

  it("leaves text that doesn't open with --- untouched", () => {
    fc.assert(
      fc.property(
        fc.string().filter((text) => !text.startsWith("---")),
        (text) => {
          assert.deepEqual(parseFrontmatter(text), { data: {}, content: text });
        }
      )
    );
  });
});

const knownKeys = Object.keys(memberFrontmatterSchema.shape);

const validProfile = {
  name: "Ana",
  added: "2026-01-01",
  level: "Student",
  linkedin: "ana",
};

describe("validateMemberFrontmatter (fuzzed)", () => {
  it("never throws, whatever a profile's frontmatter contains", () => {
    fc.assert(
      fc.property(fc.anything(), (data) => {
        const result = validateMemberFrontmatter("fuzz.md", data);
        if (!result.success) assert.match(result.error, /^data\/members\/fuzz\.md\n/);
      })
    );
  });

  it("rejects any unknown key", () => {
    assert.equal(validateMemberFrontmatter("fuzz.md", validProfile).success, true);
    fc.assert(
      fc.property(
        yamlKey.filter((key) => !knownKeys.includes(key)),
        (key) => {
          const result = validateMemberFrontmatter("fuzz.md", { ...validProfile, [key]: "x" });
          assert.equal(result.success, false);
        }
      )
    );
  });
});
