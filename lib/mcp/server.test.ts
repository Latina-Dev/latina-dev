import { POST } from "@/app/mcp/route";

import assert from "node:assert/strict";
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
});
