# Members Data Feed

Latina Dev publishes the member directory as JSON at [`https://latina.dev/members.json`](https://latina.dev/members.json), so AI agents, scripts and other sites can read it without scraping HTML.

The feed is generated at build time from the files in `data/members`, so it updates whenever the site is redeployed.

## Format

```json
{
  "site": "https://latina.dev",
  "count": 62,
  "members": [
    {
      "name": "Frances Coronel",
      "linkedin": "frances-coronel",
      "github": "FrancesCoronel",
      "twitter": "FrancesCoronel",
      "bluesky": "frances.bsky.social",
      "website": "https://francescoronel.com",
      "blog": "https://francescoronel.com/rss.xml",
      "added": "2021-01-01",
      "level": "Individual Contributor",
      "affiliation": "Senior Software Engineer at XYZ",
      "countries": ["Peru"],
      "location": "San Francisco, CA",
      "openTo": ["Mentoring", "Speaking"],
      "featureMilestones": true,
      "slug": "frances-coronel",
      "path": "/members/frances-coronel",
      "url": "https://latina.dev/members/frances-coronel",
      "bio": "<p>Frances Coronel is a senior software engineer...</p>"
    }
  ]
}
```

- `count` is the number of members in the feed.
- `members` is sorted by `slug`.
- Each member has the fields from their Markdown file (see [Adding a Member](/pages/adding-a-member)), plus `slug`, `path` and `url` for their profile page.
- `bio` is the member's Markdown bio rendered as HTML. It is an empty string when the member has no bio.
- Optional fields the member has not filled in are left out rather than set to `null`.
- `featureMilestones` is `true` when the member has opted in to having their milestones shared on Latina Dev's social accounts. It is left out otherwise, so treat a missing value as no consent.

## Example

```sh
curl -s https://latina.dev/members.json | jq '.members[] | select(.level == "Leader") | .name'
```

Find members who are open to mentoring:

```sh
curl -s https://latina.dev/members.json | jq '.members[] | select(.openTo // [] | index("Mentoring")) | .name'
```
