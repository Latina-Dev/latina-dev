import { expect, test } from "@playwright/test";

// The MCP server at /mcp, called over Streamable HTTP the way Claude, ChatGPT or Cursor would
const rpc = (method: string, params: Record<string, unknown> = {}) => ({
  headers: {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18",
  },
  data: { jsonrpc: "2.0", id: 1, method, params },
});

test("MCP server initializes and lists its tools", async ({ request }) => {
  const init = await request.post(
    "/mcp",
    rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "e2e", version: "1.0.0" },
    })
  );
  expect(init.ok()).toBe(true);
  expect((await init.json()).result.serverInfo.name).toBe("latina-dev");

  const list = await request.post("/mcp", rpc("tools/list"));
  const names = (await list.json()).result.tools.map((tool: { name: string }) => tool.name);
  expect(names.sort()).toEqual([
    "get_member",
    "list_resource_categories",
    "search_members",
    "search_resources",
  ]);
});

test("MCP server finds real members and resources from the deployed data", async ({ request }) => {
  const members = await request.post(
    "/mcp",
    rpc("tools/call", { name: "search_members", arguments: { query: "Frances Coronel" } })
  );
  const found = (await members.json()).result.structuredContent.members;
  expect(found[0].url).toBe("https://latina.dev/members/frances-coronel");

  const resources = await request.post(
    "/mcp",
    rpc("tools/call", { name: "search_resources", arguments: { category: "jobs" } })
  );
  expect((await resources.json()).result.structuredContent.total).toBeGreaterThan(0);
});
