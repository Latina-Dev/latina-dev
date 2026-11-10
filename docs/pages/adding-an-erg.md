# Adding an ERG

Every card on [latina.dev/ergs](https://latina.dev/ergs) is one file in [`data/ergs`](https://github.com/Latina-Dev/latina-dev/tree/main/data/ergs). The same files feed [`/ergs.json`](https://latina.dev/ergs.json), [`/ergs.md`](https://latina.dev/ergs.md) and the `search_ergs` tool on the [MCP server](/pages/mcp-server).

## What belongs here

An employee resource group (ERG) for Latina and Latino employees at a company. One file per company.

## The file

Name the file after the company, in lowercase with hyphens: `Warner Bros.` becomes `warner-bros.md`. The build fails if the filename doesn't match the company.

```yaml
---
company: "Netflix"
name: "Somos"
---
```

| Field         | What to put                                                           |
| ------------- | --------------------------------------------------------------------- |
| `company`     | The company's name as it writes it                                    |
| `name`        | What the group calls itself                                           |
| `url`         | Optional. A public page about the group, starting with `https://`     |
| `description` | Optional. One sentence on what the group does, if you know first-hand |

Only add a `url` that is public. Links to an intranet or a private Slack don't help anyone outside the company.
