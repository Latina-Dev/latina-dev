import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMadrinaMcpServer } from "~/lib/mcp/server";

const authorized = (header: string | undefined) => {
  const token = process.env.MCP_TOKEN;
  if (!token || !header) return false;
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

/**
 * MCP connector over Streamable HTTP, stateless: a fresh server and transport
 * per request, JSON responses. Guarded by `Authorization: Bearer $MCP_TOKEN`.
 * Wins are in memory, so this only sees them when it runs in the same process
 * as the Slack app (local `slack run`, not across Vercel instances).
 */
export default defineEventHandler(async (event) => {
  if (!authorized(getHeader(event, "authorization"))) {
    setResponseStatus(event, 401);
    return { ok: false, error: "unauthorized" };
  }

  const server = createMadrinaMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(toWebRequest(event));
    return sendWebResponse(event, response);
  } finally {
    await server.close();
  }
});
