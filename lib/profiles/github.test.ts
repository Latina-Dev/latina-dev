import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { cancelAutoMerge, rejectPull } from "@/lib/profiles/github";

interface Call {
  method: string;
  path: string;
  body?: unknown;
}

const realFetch = globalThis.fetch;
let calls: Call[];

/** Replace fetch with canned GitHub responses keyed by "METHOD path" */
const mockGitHub = (responses: Record<string, unknown>) => {
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const path = url.pathname + url.search;
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const key = `${method} ${path}`;
    if (!(key in responses)) return new Response("not mocked", { status: 500 });
    return Response.json(responses[key]);
  }) as typeof fetch;
};

const sha = (c: string) => c.repeat(40);
const pull = (overrides: Record<string, unknown> = {}) => ({
  number: 7,
  html_url: "https://github.com/Latina-Dev/latina-dev/pull/7",
  node_id: "PR_7",
  state: "open",
  merged: false,
  head: { ref: "profile/abc", sha: sha("a"), repo: { full_name: "Latina-Dev/latina-dev" } },
  auto_merge: null,
  ...overrides,
});
const openPulls =
  "GET /repos/Latina-Dev/latina-dev/pulls?state=open&head=Latina-Dev%3Aprofile%2Fabc";

beforeEach(() => {
  calls = [];
  process.env.PROFILE_BOT_GITHUB_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("cancelAutoMerge", () => {
  it("does nothing when the branch has no open pull request", async () => {
    mockGitHub({ [openPulls]: [] });
    await cancelAutoMerge("profile/abc");
    assert.equal(calls.length, 1);
  });

  it("does nothing when auto-merge isn't queued", async () => {
    mockGitHub({ [openPulls]: [pull()] });
    await cancelAutoMerge("profile/abc");
    assert.equal(calls.length, 1);
  });

  it("disables queued auto-merge", async () => {
    mockGitHub({ [openPulls]: [pull({ auto_merge: {} })], "POST /graphql": { data: {} } });
    await cancelAutoMerge("profile/abc");
    assert.equal(calls.length, 2);
    const body = calls[1].body as { query: string; variables: { id: string } };
    assert.match(body.query, /disablePullRequestAutoMerge/);
    assert.equal(body.variables.id, "PR_7");
  });

  it("throws when GitHub reports an error", async () => {
    mockGitHub({
      [openPulls]: [pull({ auto_merge: {} })],
      "POST /graphql": { errors: [{ message: "nope" }] },
    });
    await assert.rejects(cancelAutoMerge("profile/abc"), /nope/);
  });
});

describe("rejectPull", () => {
  const get = "GET /repos/Latina-Dev/latina-dev/pulls/7";

  it("leaves the pull request open when the member resubmitted after the review", async () => {
    mockGitHub({ [get]: pull({ head: { ...pull().head, sha: sha("b") } }) });
    const outcome = await rejectPull(7, sha("a"));
    assert.match(outcome, /changed it after this review/);
    assert.deepEqual(
      calls.map((c) => c.method),
      ["GET"]
    );
  });

  it("closes the reviewed pull request and deletes its branch", async () => {
    mockGitHub({
      [get]: pull(),
      "PATCH /repos/Latina-Dev/latina-dev/pulls/7": {},
      "DELETE /repos/Latina-Dev/latina-dev/git/refs/heads/profile/abc": {},
    });
    assert.equal(await rejectPull(7, sha("a")), "closed");
    assert.deepEqual(
      calls.map((c) => c.method),
      ["GET", "PATCH", "DELETE"]
    );
  });
});
