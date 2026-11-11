# Search and Structured Data

Latina Dev is built so search engines (Google, Bing) and AI search tools (ChatGPT, Claude, Perplexity, Google AI Mode) can find members and cite the site. Every page is rendered on the server, so crawlers that don't run JavaScript still see the full content.

## What the site publishes for crawlers

| URL                                                | What it is                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`/robots.txt`](https://latina.dev/robots.txt)     | Allows all crawlers, names the main search and AI crawlers explicitly, and links the sitemap |
| [`/sitemap.xml`](https://latina.dev/sitemap.xml)   | The main pages and every member profile page                                                 |
| [`/llms.txt`](https://latina.dev/llms.txt)         | A short Markdown summary of the site for AI tools                                            |
| [`/members.json`](https://latina.dev/members.json) | The directory as JSON (see [Members Data Feed](/pages/members-feed))                         |

| [`/resources.md`](https://latina.dev/resources.md) | Every resource as Markdown, with its type, career stage and audience |
| [`/resources.json`](https://latina.dev/resources.json) | The same list as JSON, plus counts per type and stage |

The code lives in `app/robots.ts`, `app/sitemap.ts` and `public/llms.txt`.

## Profile pages

Each member has a page at `/members/firstname-lastname`, built from their file in `data/members`. Member cards link there, and each profile links back to the directory through its breadcrumb and to three related members at the same level. See [Adding a Member](/pages/adding-a-member) for the fields a profile shows.

## Directory views

The directory has a crawlable page for each level and for each country of origin with at least two members, each with its own title, intro and sitemap entry:

- `/members/students`, `/members/ic` and `/members/leaders`
- `/members/country/<country>`, e.g. `/members/country/mexico`

Every directory page opens with a sentence that answers the search directly ("Latina Dev is an open-source directory of N Latina software engineers…"), with counts taken from the data, and shows when the directory was last updated (the last commit to `data/members`, or the build date when git history isn't available). The views are defined in `lib/memberViews.ts` and rendered by `components/MemberDirectory`.

The home page ends with a short FAQ (`components/Homepage/Faq`), which is also published as `FAQPage` structured data.

## Resource pages

Resources have a crawlable page for each way someone might ask for them, each with its own title, intro, structured data and sitemap entry:

- `/resources/<category>`, e.g. `/resources/jobs`
- `/resources/stage/<stage>`, e.g. `/resources/stage/leadership`
- `/resources/type/<type>`, e.g. `/resources/type/job-board`

Stage and type pages are built from the `stages` and `types` tags on each file in `data/resources`, in `lib/resourceViews.ts`. A tag gets a page once three resources carry it. When a tag lists exactly the same resources as a category (K-12 today), links go to the category page instead, so two URLs never compete for one question. Give a new type or stage a heading and summary in that file, and add the page to `public/llms.txt`; `npm test` fails until you do.

The type and stage menus on `/resources` only hide cards on the page. They are for people; the pages above are what search engines and AI agents read.

## Every kind of content is published the same way

Anything new the site lists (ERGs and events are planned) should ship with all of these, so search engines and AI assistants can find it on day one:

1. Server-rendered pages with a title and intro phrased the way people ask
2. Structured data (JSON-LD) on those pages
3. Entries in `/sitemap.xml` and `public/llms.txt`
4. A JSON feed and a Markdown feed
5. A search tool on the [MCP server](/pages/mcp-server)

## Structured data (JSON-LD)

Pages include [schema.org](https://schema.org) data in a `<script type="application/ld+json">` tag, built by the helpers in `lib/jsonLd.ts`:

| Page                         | Types                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                         | `Organization` and `WebSite`                                                                                                                      |
| `/members`                   | `CollectionPage` with an `ItemList` of every member, and `BreadcrumbList`                                                                         |
| Profile pages                | `ProfilePage` whose `mainEntity` is a `Person` (with `memberOf` Latina Dev), and `BreadcrumbList`                                                 |
| Resource pages               | `CollectionPage` with an `ItemList` of each resource (with its types and stages as `keywords`), and `BreadcrumbList`; `/resources` adds `FAQPage` |
| Conference, Add Your Profile | `BreadcrumbList`                                                                                                                                  |

Google shows profile pages as a "Profile page" rich result. The `ProfilePage` carries `dateCreated` (the member's `added` date) and `dateModified` (the last commit to their file). A `Person` only includes fields the member has filled in: `jobTitle` comes from `affiliation`, `sameAs` from their LinkedIn, GitHub, X and website, and `homeLocation` from `location`. Nothing is inferred or made up.

To check a page, paste its URL into Google's [Rich Results Test](https://search.google.com/test/rich-results) or the [Schema.org validator](https://validator.schema.org). Run the helper tests with `npm test`.

## Social previews

Every page sets Open Graph and Twitter card tags through `pageMetadata()` in `lib/pageMetadata.ts`. Next.js replaces the layout's `openGraph` and `twitter` objects when a page sets its own, so new pages should build their metadata with that helper rather than by hand. It sets the title, description, canonical URL, Open Graph URL, site name and a `summary_large_image` card.

Most pages share `/img/featured-image.png`. Profile pages get their own 1200×630 image from `app/members/[slug]/opengraph-image.tsx`, generated at build time with the member's photo, name, level and affiliation (when they have one) on Latina Dev branding. To preview one, run the site and open `/members/<slug>/opengraph-image`.

## Every member is discoverable

Every profile is in the sitemap, `/members.json`, the structured data and the related members on other profiles, and every page is open to search engines and AI crawlers. There is no opt-out: the directory exists so members get found. The member schema rejects a `noindex` field.
