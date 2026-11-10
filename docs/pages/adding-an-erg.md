# Adding an ERG

Every card on [latina.dev/resources/ergs](https://latina.dev/resources/ergs) is one file in [`data/ergs`](https://github.com/Latina-Dev/latina-dev/tree/main/data/ergs). The same files feed [`/ergs.json`](https://latina.dev/ergs.json), [`/ergs.md`](https://latina.dev/ergs.md) and the `search_ergs` tool on the [MCP server](/pages/mcp-server).

## What belongs here

An employee resource group (ERG) for Latina and Latino employees at a company, with a public page that names it. One file per company. If you can't find a public page, the ERG can't be listed.

The page lives under Resources on purpose and is not in the menu or on the home page. Joining an ERG helps, but running one is often work that doesn't lead to promotion, so the site points people to [the guide on making it count](https://latina.dev/guides/erg-work-and-promotion) instead of pushing them to start one.

## The file

Name the file after the company, in lowercase with hyphens: `Bank of America` becomes `bank-of-america.md`. The build fails if the filename doesn't match the company.

```yaml
---
company: "Netflix"
name: "SOMOS@"
website: "https://www.netflix.com/"
url: "https://jobs.netflix.com/inclusion"
checked: "2026-11-10"
---
```

| Field         | What to put                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `company`     | The company's name as it writes it                                                |
| `name`        | What the group calls itself, as written on the source page                        |
| `website`     | The company's home page. Its logo is fetched from here                            |
| `url`         | A public page from the company that names the group. No intranet or private links |
| `checked`     | The date you last read that page, as `YYYY-MM-DD`                                 |
| `description` | Optional. One sentence on what the group does, if the source says                 |

## Logo

Cards show the company's initials until it has a logo. To fetch one, run the **Resource logos** workflow from the Actions tab on your branch, then push again so the checks run.
