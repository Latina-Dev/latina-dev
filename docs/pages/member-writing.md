# Member Writing

[latina.dev/writing](https://latina.dev/writing) lists blog posts that Latina Dev members publish on their own sites, newest first. Each member's three newest posts also show on her profile page.

Posts are never copied onto latina.dev. Every entry links out to the author's own site, so she keeps the canonical URL, the traffic and the SEO credit, and an edit she makes to a post shows up for readers right away.

## How a post gets listed

1. A member adds her blog, or its RSS or Atom feed, to the `blog` field of her profile at [latina.dev/profile](https://latina.dev/profile).
2. Once a day, a GitHub Action reads every member's feed, shares new posts in the Latina Dev Slack's `#member-posts` channel, and writes up to 50 of her newest posts to `data/writing/<member-slug>.json` through a pull request.
3. When that pull request merges, the site redeploys and the posts appear on `/writing`, on her profile, in the feeds below and in the MCP server.

Members are already vetted when they join the directory, so posts don't need a separate approval. To take a post down, an organizer reacts with 🚫 to it in `#member-posts`, and the next run adds it to that member's `hidden` list. If a member clears her `blog` field or leaves the directory, her posts drop off the site on the next deploy, without waiting for the daily run.

## Feeds for readers and agents

| URL                                                     | What it is                                         |
| ------------------------------------------------------- | -------------------------------------------------- |
| [`/writing`](https://latina.dev/writing)                | The page, with schema.org `BlogPosting` data       |
| [`/writing.xml`](https://latina.dev/writing.xml)        | RSS 2.0 feed of the 50 newest posts                |
| [`/writing.json`](https://latina.dev/writing.json)      | Every listed post as JSON                          |
| `search_writing` on [the MCP server](/pages/mcp-server) | Search posts by keyword or by member, newest first |

The page is kept out of search engines and the sitemap until it has at least one post.

## Data format

One file per member, named after her profile slug, e.g. `data/writing/ana-lopez.json`. The build fails on unknown keys, links that aren't `https://`, or dates that aren't ISO 8601.

```json
{
  "feed": "https://ana.dev/rss.xml",
  "posts": [
    {
      "title": "What I learned in my first year as an engineer",
      "url": "https://ana.dev/first-year",
      "published": "2026-11-01T15:00:00Z",
      "summary": "Plain text from the start of the post, 400 characters at most."
    }
  ],
  "hidden": ["https://ana.dev/a-post-an-organizer-took-down"]
}
```

| Key       | Required | What it is                                                                 |
| --------- | -------- | -------------------------------------------------------------------------- |
| `feed`    | Yes      | The member's `blog` field when the posts were read                         |
| `posts`   | Yes      | Her posts, in any order; the site sorts them newest first                  |
| `summary` | No       | Plain text, no HTML, up to 400 characters                                  |
| `hidden`  | No       | Post URLs an organizer took down in Slack; the daily run keeps them hidden |

The code that reads these files is `lib/writing.ts`.
