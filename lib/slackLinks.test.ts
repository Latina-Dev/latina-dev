import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  createLinkToken,
  linkedSlug,
  slackKey,
  slackLinkBranch,
  verifyLinkToken,
} from "@/lib/slackLinks";

const secret = "test-secret";
const now = 1_800_000_000;

describe("link tokens", () => {
  it("round-trips the Slack member it was made for", () => {
    const token = createLinkToken("T0123", "U0456", now, secret);
    assert.deepEqual(verifyLinkToken(token, now + 60, secret), {
      teamId: "T0123",
      userId: "U0456",
    });
  });

  it("expires after 15 minutes", () => {
    const token = createLinkToken("T0123", "U0456", now, secret);
    assert.equal(verifyLinkToken(token, now + 15 * 60 + 1, secret), undefined);
  });

  it("rejects a token for a different member", () => {
    const token = createLinkToken("T0123", "U0456", now, secret);
    const forged = token.replace("U0456", "U0999");
    assert.equal(verifyLinkToken(forged, now, secret), undefined);
  });

  it("rejects a token signed with another secret", () => {
    const token = createLinkToken("T0123", "U0456", now, "other");
    assert.equal(verifyLinkToken(token, now, secret), undefined);
  });

  it("rejects malformed tokens and ids", () => {
    assert.equal(verifyLinkToken(undefined, now, secret), undefined);
    assert.equal(verifyLinkToken("nope", now, secret), undefined);
    assert.throws(() => createLinkToken("T0123", "u-lower", now, secret));
  });
});

describe("Slack links", () => {
  it("never stores the raw Slack id", () => {
    const key = slackKey("T0123", "U0456");
    assert.match(key, /^[a-f0-9]{64}$/);
    assert.ok(!key.includes("U0456"));
  });

  it("uses a profile/ branch apart from the member's profile branch", () => {
    assert.match(slackLinkBranch("T0123", "U0456"), /^profile\/slack-[a-f0-9]{12}$/);
  });

  it("finds the profile a Slack member is linked to", () => {
    const cwd = process.cwd();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "slack-links-"));
    const dir = path.join(root, "data/owners/slack");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "ana-garcia.txt"), `${slackKey("T0123", "U0456")}\n`);
    fs.writeFileSync(path.join(dir, "README.md"), slackKey("T0123", "U0999"));
    try {
      process.chdir(root);
      assert.equal(linkedSlug("T0123", "U0456"), "ana-garcia");
      assert.equal(linkedSlug("T0123", "U0999"), undefined);
      assert.equal(linkedSlug("T0999", "U0456"), undefined);
      process.chdir(os.tmpdir());
      assert.equal(linkedSlug("T0123", "U0456"), undefined);
    } finally {
      process.chdir(cwd);
    }
  });
});
