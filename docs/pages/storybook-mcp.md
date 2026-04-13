# Storybook MCP

The [Storybook MCP server](https://storybook.js.org/blog/storybook-mcp-for-react/) lets AI tools like Claude Code read component stories and documentation directly, so they have accurate context when building UI.

## How it works

When Storybook is running locally, it exposes an MCP endpoint at `http://localhost:6006/mcp`. Claude Code (and other MCP-compatible AI tools) connects to this endpoint to browse stories, inspect props, and understand component usage patterns.

## Setup

The addon and project config are already included in this repo — no extra installation needed.

**Start Storybook:**

```bash
npm run storybook
```

Then open a new Claude Code session. It will automatically connect to the Storybook MCP server and can read stories for `ButtonLink`, `MemberCard`, `CountryFlags`, and other components.

## Example stories

The following components currently have stories (check `components/**/*.stories.*` for the full up-to-date list):

| Component | Story file |
|-----------|-----------|
| `ButtonLink` | `components/ButtonLink/ButtonLink.stories.tsx` |
| `MemberCard` | `components/MemberCard/MemberCard.stories.tsx` |
| `CountryFlags` | `components/CountryFlags/CountryFlags.stories.tsx` |

## MCP config

The `.mcp.json` at the repo root registers the server for Claude Code:

```json
{
  "mcpServers": {
    "storybook": {
      "type": "http",
      "url": "http://localhost:6006/mcp"
    }
  }
}
```

> The server is only available while `npm run storybook` is running. Claude Code will skip it gracefully if Storybook is not started.
