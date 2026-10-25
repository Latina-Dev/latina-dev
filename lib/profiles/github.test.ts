import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  approvePull,
  NotMergeableError,
  OutdatedReviewError,
  rejectPull,
} from "@/lib/profiles/github";

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
    const response = responses[key] as { status?: number };
    if (response?.status && response.status >= 400) {
      return new Response(JSON.stringify({ message: "Required status check is expected" }), {
        status: response.status,
      });
    }
    return Response.json(response);
  }) as typeof fetch;
};

const sha = (c: string) => c.repeat(40);
const pull = (overrides: Record<string, unknown> = {}) => ({
  number: 7,
  html_url: "https://github.com/Latina-Dev/latina-dev/pull/7",
  state: "open",
  merged: false,
  head: { ref: "profile/abc", sha: sha("a"), repo: { full_name: "Latina-Dev/latina-dev" } },
  ...overrides,
});

beforeEach(() => {
  calls = [];
  process.env.PROFILE_BOT_GITHUB_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("approvePull", () => {
  const get = "GET /repos/Latina-Dev/latina-dev/pulls/7";
  const merge = "PUT /repos/Latina-Dev/latina-dev/pulls/7/merge";

  it("merges only the reviewed commit", async () => {
    mockGitHub({ [get]: pull(), [merge]: { merged: true } });
    assert.equal(await approvePull(7, sha("a")), "merged");
    assert.deepEqual(calls[1], {
      method: "PUT",
      path: "/repos/Latina-Dev/latina-dev/pulls/7/merge",
      body: { merge_method: "squash", sha: sha("a") },
    });
  });

  it("doesn't merge when the member resubmitted after the review", async () => {
    mockGitHub({ [get]: pull({ head: { ...pull().head, sha: sha("b") } }) });
    await assert.rejects(approvePull(7, sha("a")), OutdatedReviewError);
    assert.equal(calls.length, 1);
  });

  it("asks to approve again while checks are pending, without queueing auto-merge", async () => {
    mockGitHub({ [get]: pull(), [merge]: { status: 405 } });
    await assert.rejects(approvePull(7, sha("a")), (error: unknown) => {
      assert.ok(error instanceof NotMergeableError);
      assert.match(error.message, /\(Required status check is expected\)/);
      return true;
    });
    assert.deepEqual(
      calls.map((c) => c.method),
      ["GET", "PUT"]
    );
  });
});

describe("rejectPull", () => {
  const get = "GET /repos/Latina-Dev/latina-dev/pulls/7";

  it("leaves the pull request open when the member resubmitted after the review", async () => {
    mockGitHub({ [get]: pull({ head: { ...pull().head, sha: sha("b") } }) });
    await assert.rejects(rejectPull(7, sha("a")), OutdatedReviewError);
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
