import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import { isValidSlackSignature, reviewMessage } from "@/lib/profiles/slack";

const secret = "test-secret";
const sign = (timestamp: string, body: string) =>
  `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;

describe("isValidSlackSignature", () => {
  const now = 1_700_000_000;
  const timestamp = String(now);
  const body = "payload=%7B%7D";

  it("accepts a correctly signed, recent request", () => {
    assert.equal(isValidSlackSignature(secret, timestamp, body, sign(timestamp, body), now), true);
  });

  it("rejects a tampered body", () => {
    assert.equal(
      isValidSlackSignature(secret, timestamp, `${body}x`, sign(timestamp, body), now),
      false
    );
  });

  it("rejects an old request", () => {
    const old = String(now - 60 * 10);
    assert.equal(isValidSlackSignature(secret, old, body, sign(old, body), now), false);
  });

  it("rejects missing headers or secret", () => {
    assert.equal(isValidSlackSignature(secret, null, body, sign(timestamp, body), now), false);
    assert.equal(isValidSlackSignature("", timestamp, body, sign(timestamp, body), now), false);
  });
});

describe("reviewMessage", () => {
  it("escapes member text and carries the pull request number on both buttons", () => {
    const message = reviewMessage({
      kind: "new",
      pullNumber: 42,
      pullUrl: "https://github.com/Latina-Dev/latina-dev/pull/42",
      profileName: "Ana <script>",
      linkedinName: "Ana",
      linkedinHandle: "ana-example",
    });
    const section = message.blocks[0] as { text: { text: string } };
    assert.match(section.text.text, /Ana &lt;script&gt;/);
    const actions = message.blocks[1] as { elements: { value: string }[] };
    assert.deepEqual(
      actions.elements.map((button) => button.value),
      ["42", "42"]
    );
  });
});
