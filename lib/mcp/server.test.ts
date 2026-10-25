import { DELETE, GET, OPTIONS, POST } from "@/app/mcp/route";

import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

// Talks to the /mcp route handler the way a remote MCP client does, over Streamable HTTP
const call = async (method: string, params: Record<string, unknown> = {}) => {
  const response = await POST(
    new Request("https://latina.dev/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  return (await response.json()).result;
};

describe("/mcp HTTP handling", () => {
  // Runs first: members are cached once loaded, so a failed load has to come before any other call
  it("retries loading members after a failed load instead of caching the error", async () => {
    // Member profiles are read from data/members relative to the working directory
    const cwd = process.cwd();
    process.chdir(mkdtempSync(join(tmpdir(), "mcp-")));
    try {
      await assert.rejects(call("tools/list"));
    } finally {
      process.chdir(cwd);
    }
    const { tools } = await call("tools/list");
    assert.equal(tools.length, 4);
  });

  it("answers CORS preflight requests", () => {
    const response = OPTIONS();
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /Mcp-Protocol-Version/
    );
  });

  it("accepts a session DELETE as a no-op, since the server is stateless", async () => {
    const response = await DELETE(new Request("https://latina.dev/mcp", { method: "DELETE" }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  });

  it("rejects a GET that doesn't accept an event stream, still with CORS headers", async () => {
    const response = await GET(new Request("https://latina.dev/mcp"));
    assert.equal(response.status, 406);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  });
});

describe("/mcp", () => {
  it("initializes with instructions about Latina engineers", async () => {
    const result = await call("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    });
    assert.equal(result.serverInfo.name, "latina-dev");
    assert.match(result.instructions, /Latina software engineers/);
  });

  it("lists read-only tools", async () => {
    const { tools } = await call("tools/list");
    assert.deepEqual(tools.map((t: { name: string }) => t.name).sort(), [
      "get_member",
      "list_resource_categories",
      "search_members",
      "search_resources",
    ]);
    for (const tool of tools) assert.equal(tool.annotations.readOnlyHint, true);
  });

  it("searches real members and gets a profile", async () => {
    const search = await call("tools/call", {
      name: "search_members",
      arguments: { query: "Frances Coronel" },
    });
    const [member] = search.structuredContent.members;
    assert.equal(member.url, "https://latina.dev/members/frances-coronel");

    const profile = await call("tools/call", {
      name: "get_member",
      arguments: { slug: member.slug },
    });
    assert.equal(profile.structuredContent.member.name, member.name);

    const missing = await call("tools/call", { name: "get_member", arguments: { slug: "nope" } });
    assert.equal(missing.isError, true);
  });

  it("searches resources", async () => {
    const result = await call("tools/call", {
      name: "search_resources",
      arguments: { category: "conferences" },
    });
    assert.ok(result.structuredContent.total > 0);
  });

  it("lists resource categories with counts", async () => {
    const { structuredContent } = await call("tools/call", {
      name: "list_resource_categories",
      arguments: {},
    });
    const jobs = structuredContent.categories.find((c: { id: string }) => c.id === "jobs");
    assert.equal(jobs.url, "https://latina.dev/resources/jobs");
    assert.ok(jobs.count > 0);
  });
});
