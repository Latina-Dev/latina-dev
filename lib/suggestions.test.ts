import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPublicHttpUrl,
  readSuggestion,
  suggestionIssue,
  suggestionReviewMessage,
} from "@/lib/suggestions";

const state = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).map(([id, value]) => [
      id,
      {
        value:
          id === "kind"
            ? { selected_option: { value } }
            : id === "when"
              ? { selected_date: value }
              : { value },
      },
    ])
  );

const resource = {
  kind: "resource",
  name: "Latinas in Tech",
  url: "https://latinasintech.org",
  description: "A community for Latinas working in tech.",
};

describe("readSuggestion", () => {
  it("reads a resource", () => {
    assert.deepEqual(readSuggestion(state(resource)), { suggestion: resource });
  });

  it("needs a date for an event", () => {
    const result = readSuggestion(state({ ...resource, kind: "event" }));
    assert.ok("errors" in result && result.errors.when);
  });

  it("rejects private and non-web links", () => {
    for (const url of [
      "http://localhost:3000",
      "http://10.0.0.1",
      "ftp://x.org",
      "https://user:pw@x.org",
      "http://intranet",
    ]) {
      const result = readSuggestion(state({ ...resource, url }));
      assert.ok("errors" in result && result.errors.url, url);
    }
  });
});

describe("isPublicHttpUrl", () => {
  it("accepts ordinary sites", () => {
    assert.equal(isPublicHttpUrl("https://www.colorstack.org/"), true);
    assert.equal(isPublicHttpUrl("http://[::1]/"), false);
    assert.equal(isPublicHttpUrl("https://x.org:8443/"), false);
  });
});

describe("suggestionIssue", () => {
  it("lists the details, the link check and the vetting checklist without the Slack id", () => {
    const issue = suggestionIssue(
      { ...resource, kind: "resource", notes: "Ping @frances <script>" },
      { ok: true, status: 200, title: "Latinas in Tech" },
      "ana-lopez"
    );
    assert.equal(issue.title, "Resource suggestion: Latinas in Tech");
    assert.match(issue.body, /✅ Loads \(HTTP 200\)/);
    assert.match(issue.body, /description matches what the live site says/);
    assert.match(issue.body, /latina\.dev\/members\/ana-lopez/);
    assert.match(issue.body, /\\@frances \\<script\\>/);
  });
});

describe("suggestionReviewMessage", () => {
  it("mentions who suggested it and links the issue", () => {
    const message = suggestionReviewMessage(
      { ...resource, kind: "resource" },
      { ok: false, status: 404 },
      "U0456",
      "https://github.com/Latina-Dev/latina-dev/issues/1"
    );
    const json = JSON.stringify(message);
    assert.match(json, /<@U0456>/);
    assert.match(json, /Link didn't load/);
  });
});
