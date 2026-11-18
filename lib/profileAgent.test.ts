import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyChanges,
  compactChanges,
  describeChanges,
  parseChanges,
  profileValues,
  Proposal,
  proposalMessage,
  quickReply,
} from "@/lib/profileAgent";
import { buildMemberProfile } from "@/lib/profiles/memberFile";

const profile = {
  name: "Ana López",
  added: "2023-05-31",
  level: "Individual Contributor" as const,
  linkedin: "ana-lopez",
  affiliation: "Senior Engineer at Acme",
  github: "analopez",
  openTo: ["Mentoring" as const],
};
const bio = "Ana builds things.";

const none: Proposal = {
  affiliation: null,
  location: null,
  github: null,
  twitter: null,
  bluesky: null,
  website: null,
  blog: null,
  openTo: null,
  featureMilestones: null,
  bio: null,
  clear: [],
  reply: "Got it!",
};

describe("applyChanges", () => {
  it("changes only what was proposed", () => {
    const before = profileValues(profile, bio);
    const after = applyChanges(before, { ...none, affiliation: "Staff Engineer at Acme" });
    assert.deepEqual(after, { ...before, affiliation: "Staff Engineer at Acme" });
    assert.deepEqual(describeChanges(before, after), ["*Role:* Staff Engineer at Acme"]);
  });

  it("cleans pasted handles and clears fields", () => {
    const before = profileValues(profile, bio);
    const after = applyChanges(before, {
      ...none,
      bluesky: "https://bsky.app/profile/Ana.bsky.social",
      clear: ["github", "openTo"],
    });
    assert.equal(after.bluesky, "ana.bsky.social");
    assert.equal(after.github, "");
    assert.deepEqual(after.openTo, []);
  });

  it("produces a profile that passes the same checks as the editor, with today's date", () => {
    const after = applyChanges(profileValues(profile, bio), { ...none, location: "Austin, TX" });
    const built = buildMemberProfile(after, profile, "2026-11-14");
    assert.ok(built.success);
    assert.equal(built.data.location, "Austin, TX");
    assert.equal(built.data.updated, "2026-11-14");
    assert.equal(built.data.added, "2023-05-31");
  });
});

describe("button round trip", () => {
  it("carries only the changed fields and reads them back", () => {
    const proposal = { ...none, affiliation: "Staff Engineer at Acme", featureMilestones: false };
    const compact = compactChanges(proposal);
    assert.deepEqual(compact, { affiliation: "Staff Engineer at Acme", featureMilestones: false });
    const back = parseChanges(JSON.stringify(compact));
    assert.ok(back);
    assert.deepEqual(
      applyChanges(profileValues(profile, bio), back),
      applyChanges(profileValues(profile, bio), proposal)
    );
  });

  it("refuses fields the agent may not change", () => {
    assert.equal(parseChanges(JSON.stringify({ name: "Someone Else" })), undefined);
    assert.equal(parseChanges(JSON.stringify({ linkedin: "someone" })), undefined);
    assert.equal(parseChanges("not json"), undefined);
  });

  it("falls back to the editor when the change is too long for a button", () => {
    const message = proposalMessage("ana-lopez", "Here you go", ["*Bio:* …"], {
      bio: "x".repeat(2500),
    });
    assert.doesNotMatch(JSON.stringify(message), /agent_send_edit/);
  });
});

describe("quickReply", () => {
  it("answers greetings, thanks, invites and short messages without Claude", () => {
    for (const text of ["hola", "help", "Thanks!", "can you invite my friend Ana?", "edit", "ok"]) {
      assert.ok(quickReply(text), text);
    }
  });

  it("leaves real profile changes for Claude", () => {
    assert.equal(quickReply("I'm a Staff Engineer at Acme now"), undefined);
    assert.equal(quickReply("I moved to Austin, TX"), undefined);
  });
});
