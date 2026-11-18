# Adding a Resource

Every card on [latina.dev/resources](https://latina.dev/resources) is one file in [`data/resources`](https://github.com/Latina-Dev/latina-dev/tree/main/data/resources). The same files feed [`/resources.json`](https://latina.dev/resources.json), [`/resources.md`](https://latina.dev/resources.md) and the [MCP server](/pages/mcp-server).

## What belongs here

A resource should be useful to Latina software engineers and still be running. It doesn't have to be only for Latinas: communities for Latinos, women, or people of color in tech all count.

## The file

Name the file after the resource, in lowercase with hyphens: `Latinas in Tech` becomes `latinas-in-tech.md`. The build fails if the filename doesn't match the name.

```yaml
---
name: "Latinas in Tech"
url: "https://latinasintech.org/"
description: "Nonprofit with local chapters that connects and supports Latina women working in tech."
group: "latina-communities"
types: ["Community"]
stages: ["Workplace"]
serves: ["Latinas"]
---
```

| Field         | What to put                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | The name as the organization writes it                                                                                                                                    |
| `url`         | Full link, starting with `https://`. Each link can only be listed once. Leave out `utm_` tags: the site adds `utm_source=latina.dev` itself                               |
| `description` | One sentence on what it offers and who it's for                                                                                                                           |
| `group`       | The page that lists it: `latina-communities`, `latino-tech-communities`, `ai`, `k-12`, `college`, `jobs`, `career-growth`, `conferences`, `founders` or `listen-and-read` |
| `types`       | One or more of: Community, Program, Scholarship, Professional association, Job board, Directory, Guide, Conference, Accelerator, Newsletter, Podcast, Report              |
| `stages`      | One or more of: K-12, College, Workplace, Leadership, Founders                                                                                                            |
| `serves`      | Who it's built for. One or more of: Latinas, Latinos, Women, Women of color, People of color, Underrepresented groups, Everyone                                           |
| `schemaType`  | Optional. `Report` or `PodcastSeries` when it isn't an organization                                                                                                       |

`types` and `stages` are the **Type** and **Stage** menus on the page. The lists of allowed values live in [`types/resources.ts`](https://github.com/Latina-Dev/latina-dev/blob/main/types/resources.ts).

## Logo

Cards show the resource's initials until it has a logo. To fetch one, run the **Resource logos** workflow from the Actions tab on your branch, then push again so the checks run. `npm test` fails while a resource has no logo.

## Check your work

```bash
npm test
npm run links:resources
```
