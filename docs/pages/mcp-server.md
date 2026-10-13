# MCP Server

Latina Dev runs a public, read-only [Model Context Protocol](https://modelcontextprotocol.io) server at **`https://latina.dev/mcp`**. It lets AI assistants like Claude, ChatGPT, Cursor and VS Code search the directory of Latina software engineers and the resources on [latina.dev/resources](https://latina.dev/resources), then link people to the right profile or community.

No sign-in or API key is needed. It only returns what is already public on latina.dev.

## Tools

| Tool                       | What it does                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `search_members`           | Find Latina engineers by keywords (name, title and company or school, location, countries of heritage, bio) and filter by level, country, or what they are open to |
| `get_member`               | Get one member's full public profile by slug, e.g. `frances-coronel`                                                                                               |
| `search_resources`         | Find communities, student programs, scholarships, job boards, conferences, founder support, podcasts, newsletters and reports by keyword or category               |
| `list_resource_categories` | List the resource categories and how many resources each has                                                                                                       |

Every keyword in a query must match. Matching ignores case and accents, so `mexico` finds `México`.

## Add it to your assistant

Custom connectors depend on your plan: Claude and ChatGPT only offer them on some plans, and in a ChatGPT workspace an admin may need to allow developer mode.

**Claude (claude.ai and the desktop app):** go to Settings → Connectors → Add custom connector, name it Latina Dev and paste `https://latina.dev/mcp`.

**Claude Code:**

```bash
claude mcp add --transport http latina-dev https://latina.dev/mcp
```

**ChatGPT:** turn on developer mode in Settings → Apps → Advanced settings, then create an app with the URL `https://latina.dev/mcp` and no authentication.

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "latina-dev": { "url": "https://latina.dev/mcp" }
  }
}
```

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "latina-dev": { "type": "http", "url": "https://latina.dev/mcp" }
  }
}
```

Then ask something like "Find Latina engineering leaders open to mentoring" or "What scholarships are there for Latina college students in computer science?"

## How it works

- The server uses the Streamable HTTP transport in stateless mode, so each request is handled on its own. It is a Next.js route handler at `app/mcp/route.ts`, built with the official [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).
- Tools are defined in `lib/mcp/server.ts`, and the search logic is in `lib/mcp/directory.ts`.
- Member data comes from `data/members`, the same files as the site and [`/members.json`](/pages/members-feed). Resources come from `lib/resources.ts`. Both update whenever the site is redeployed.
- Results include each member's public profile fields and profile URL.

## Try it locally

Run `npm run dev`, then open the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) and connect to `http://localhost:3000/mcp` with the Streamable HTTP transport:

```bash
npx @modelcontextprotocol/inspector
```
