import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { getMembers } from "@/lib/getMembers";
import { McpMember, toMcpMembers } from "@/lib/mcp/directory";
import { createMcpServer } from "@/lib/mcp/server";

// Remote MCP server (Streamable HTTP) so AI assistants can search the directory and resources.
// It is stateless: every request gets its own server and transport, which suits serverless.

let members: Promise<McpMember[]> | undefined;

// Read the profiles once per server instance; they only change on a redeploy
const loadMembers = () =>
  (members ??= getMembers()
    .then(toMcpMembers)
    .catch((error) => {
      // Let the next request try again instead of caching the failure
      members = undefined;
      throw error;
    }));

// The data is public, so any site or browser-based client may call it
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
};

const handle = async (request: Request) => {
  const server = createMcpServer(await loadMembers());
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(request);

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
};

export { handle as GET, handle as POST, handle as DELETE };

export const OPTIONS = () => new Response(null, { status: 204, headers: corsHeaders });
