import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MemberFrontmatter } from "@/lib/memberSchema";
import { buildMemberProfile } from "@/lib/profiles/memberFile";
import {
  editorErrors,
  editorView,
  linkMeter,
  profileBlocks,
  readEditor,
} from "@/lib/slackProfileViews";

const profile: MemberFrontmatter = {
  name: "Ana <García>",
  added: "2024-01-01",
  level: "Individual Contributor",
  linkedin: "ana-garcia",
  github: "anagarcia",
  countries: ["Mexico"],
};

describe("linkMeter", () => {
  it("counts links and nudges toward the next missing one", () => {
    const meter = linkMeter(profile);
    assert.equal(meter.added, 1);
    assert.equal(meter.total, 5);
    assert.match(meter.summary, /^🌟☆☆☆☆ {2}1 of 5 links added\. Add your blog/);
  });

  it("celebrates a complete profile", () => {
    const full = {
      ...profile,
      blog: "https://ana.dev/blog",
      bluesky: "ana.bsky.social",
      twitter: "ana",
      website: "https://ana.dev",
    };
    assert.match(linkMeter(full).summary, /All 5 links added/);
  });
});

describe("profileBlocks", () => {
  it("escapes profile text and links each added profile", () => {
    const json = JSON.stringify(profileBlocks("ana-garcia", profile));
    assert.ok(json.includes("Ana &lt;García&gt;"));
    assert.ok(json.includes("https://github.com/anagarcia|GitHub"));
    assert.ok(!json.includes("bsky.app"));
    assert.ok(json.includes('"action_id":"open_profile_editor"'));
  });
});

describe("profile editor", () => {
  it("prefills current values", () => {
    const view = editorView("ana-garcia", { ...profile, openTo: ["Mentoring"] }, "Hola!");
    assert.equal(view.private_metadata, "ana-garcia");
    const json = JSON.stringify(view);
    assert.ok(json.includes('"initial_value":"anagarcia"'));
    assert.ok(json.includes('"initial_value":"Hola!"'));
    assert.ok(json.includes('"initial_options":[{"text"'));
  });

  it("reads a submission, cleaning up pasted URLs and keeping hidden fields", () => {
    const values = readEditor(
      {
        github: { value: { value: "@anagarcia" } },
        bluesky: { value: { value: "https://bsky.app/profile/Ana.bsky.social" } },
        twitter: { value: { value: "https://x.com/ana_g/" } },
        blog: { value: { value: "  https://ana.dev/feed.xml " } },
        openTo: { value: { selected_options: [{ value: "Speaking" }, { value: "Hiring" }] } },
        featureMilestones: { value: { selected_options: [{ value: "true" }] } },
        bio: { value: { value: "Engineer in CDMX." } },
      },
      profile
    );
    assert.equal(values.name, "Ana <García>");
    assert.deepEqual(values.countries, ["Mexico"]);
    assert.equal(values.github, "anagarcia");
    assert.equal(values.bluesky, "ana.bsky.social");
    assert.equal(values.twitter, "ana_g");
    assert.equal(values.blog, "https://ana.dev/feed.xml");
    assert.deepEqual(values.openTo, ["Speaking", "Hiring"]);
    assert.equal(values.featureMilestones, true);

    const built = buildMemberProfile(values, profile, "");
    assert.ok(built.success);
    if (built.success) assert.equal(built.data.added, "2024-01-01");
  });

  it("turns validation errors into per-field errors", () => {
    const values = readEditor(
      { github: { value: { value: "not a username!" } }, bio: { value: { value: "Hi" } } },
      profile
    );
    const built = buildMemberProfile(values, profile, "");
    assert.equal(built.success, false);
    if (!built.success) {
      const errors = editorErrors(built.error);
      assert.match(errors.github, /GitHub username/);
    }
    assert.deepEqual(editorErrors("Bio: please add a short bio."), {
      bio: "please add a short bio.",
    });
  });
});
