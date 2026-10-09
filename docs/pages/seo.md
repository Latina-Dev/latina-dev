# Search and Structured Data

Latina Dev is built so search engines (Google, Bing) and AI search tools (ChatGPT, Claude, Perplexity, Google AI Mode) can find members and cite the site. Every page is rendered on the server, so crawlers that don't run JavaScript still see the full content.

## What the site publishes for crawlers

| URL                                                | What it is                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`/robots.txt`](https://latina.dev/robots.txt)     | Allows all crawlers, names the main search and AI crawlers explicitly, and links the sitemap |
| [`/sitemap.xml`](https://latina.dev/sitemap.xml)   | The main pages and every member profile page                                                 |
| [`/llms.txt`](https://latina.dev/llms.txt)         | A short Markdown summary of the site for AI tools                                            |
| [`/members.json`](https://latina.dev/members.json) | The directory as JSON (see [Members Data Feed](/pages/members-feed))                         |

The code lives in `app/robots.ts`, `app/sitemap.ts` and `public/llms.txt`.

## Profile pages

Each member has a page at `/members/firstname-lastname`, built from their file in `data/members`. Member cards link there, and each profile links back to the directory through its breadcrumb and to three related members at the same level. See [Adding a Member](/pages/adding-a-member) for the fields a profile shows.

## Directory views

The directory has a crawlable page for each level and for each country of origin with at least two members, each with its own title, intro and sitemap entry:

- `/members/students`, `/members/ic` and `/members/leaders`
- `/members/country/<country>`, e.g. `/members/country/mexico`

Every directory page opens with a sentence that answers the search directly ("Latina Dev is an open-source directory of N Latina software engineers…"), with counts taken from the data, and shows when the directory was last updated (the last commit to `data/members`, or the build date when git history isn't available). The views are defined in `lib/memberViews.ts` and rendered by `components/MemberDirectory`.

The home page ends with a short FAQ (`components/Homepage/Faq`), which is also published as `FAQPage` structured data.

## Structured data (JSON-LD)

Pages include [schema.org](https://schema.org) data in a `<script type="application/ld+json">` tag, built by the helpers in `lib/jsonLd.ts`:

| Page                         | Types                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| Home                         | `Organization` and `WebSite`                                              |
| `/members`                   | `CollectionPage` with an `ItemList` of every member, and `BreadcrumbList` |
| Profile pages                | `Person` (with `memberOf` Latina Dev) and `BreadcrumbList`                |
| Conference, Add Your Profile | `BreadcrumbList`                                                          |

A `Person` only includes fields the member has filled in: `jobTitle` comes from `affiliation`, `sameAs` from their LinkedIn, GitHub, X and website, `knowsAbout` from `skills`, and `homeLocation` from `location`. Nothing is inferred or made up.

To check a page, paste its URL into Google's [Rich Results Test](https://search.google.com/test/rich-results) or the [Schema.org validator](https://validator.schema.org). Run the helper tests with `npm test`.

## Social previews

Every page sets Open Graph and Twitter card tags through `pageMetadata()` in `lib/pageMetadata.ts`. Next.js replaces the layout's `openGraph` and `twitter` objects when a page sets its own, so new pages should build their metadata with that helper rather than by hand. It sets the title, description, canonical URL, Open Graph URL, site name and a `summary_large_image` card.

Most pages share `/img/featured-image.png`. Profile pages get their own 1200×630 image from `app/members/[slug]/opengraph-image.tsx`, generated at build time with the member's photo, name, level and affiliation (when they have one) on Latina Dev branding. To preview one, run the site and open `/members/<slug>/opengraph-image`.

## Opting out

A member with `noindex: true` in their front matter:

- gets a `noindex` robots tag on their profile page
- is left out of the sitemap, `/members.json`, the structured data and the related members on other profiles

Their card still appears in the directory on latina.dev.
