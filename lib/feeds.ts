/**
 * Reading RSS and Atom feeds for the Slack feed channels: #member-posts (members' blogs) and
 * #creator-feed (the curated creators in lib/creatorFeeds.ts). Pure functions, so the parsing is
 * tested without the network.
 */

export interface FeedItem {
  title: string;
  link: string;
  published: Date;
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode CDATA, XML entities and stray tags in a feed's text */
const decode = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === "#") {
        const point =
          code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
        return Number.isFinite(point) ? String.fromCodePoint(point) : match;
      }
      return entities[code.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();

const tag = (xml: string, name: string) =>
  new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml)?.[1];

const parseDate = (value: string | undefined) => {
  if (!value) return undefined;
  const date = new Date(decode(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** Whether a response body is a feed rather than a web page */
export const isFeed = (body: string) => /<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 5000));

/**
 * Read the items of an RSS or Atom feed. Items without a link, title or date are skipped.
 * @param xml the feed
 */
export const parseFeed = (xml: string): FeedItem[] => {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  return blocks.flatMap((block) => {
    // Titles are often escaped HTML (Atom type="html", most RSS), so decode twice to plain text
    const title = decode(decode(tag(block, "title") ?? ""));
    const atomLinks = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((match) => match[1]);
    const atomLink =
      atomLinks.find((attrs) => /rel=["']alternate["']/i.test(attrs)) ??
      atomLinks.find((attrs) => !/rel=/i.test(attrs));
    const link = decode(
      (atomLink && /href=["']([^"']+)["']/i.exec(atomLink)?.[1]) || tag(block, "link") || ""
    );
    const published = parseDate(
      tag(block, "pubDate") ??
        tag(block, "published") ??
        tag(block, "dc:date") ??
        tag(block, "updated")
    );
    if (!title || !/^https?:\/\//.test(link) || !published) return [];
    return [{ title, link, published }];
  });
};

/**
 * Find the feed a web page advertises with <link rel="alternate">
 * @param html the page
 * @param pageUrl the page's URL, to resolve a relative feed URL
 */
export const discoverFeedUrl = (html: string, pageUrl: string) => {
  const link = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find(
      (element) =>
        /rel=["']?alternate/i.test(element) &&
        /type=["']?application\/(rss|atom)\+xml/i.test(element)
    );
  const href = link && /href=["']([^"']+)["']/i.exec(link)?.[1];
  if (!href) return undefined;
  try {
    return new URL(decode(href), pageUrl).href;
  } catch {
    return undefined;
  }
};

/**
 * The UTC day before `now`, so a daily run posts each item once without remembering anything
 * @param now when the run started
 */
export const previousDay = (now: Date) => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { start: new Date(end.getTime() - 24 * 60 * 60 * 1000), end };
};

/**
 * Items published in [start, end), oldest first
 * @param items feed items
 * @param window from previousDay
 */
export const itemsInWindow = (items: FeedItem[], { start, end }: { start: Date; end: Date }) =>
  items
    .filter((item) => item.published >= start && item.published < end)
    .sort((a, b) => a.published.getTime() - b.published.getTime());

// A feed with nothing new in this long is flagged in the weekly check
const staleDays = 180;

export type FeedHealth =
  | { status: "ok"; latest: Date; items: number }
  | { status: "stale"; latest: Date; items: number }
  | { status: "empty" }
  | { status: "dead"; reason: string };

/**
 * Judge a feed by its newest item
 * @param items parsed items
 * @param now current time
 */
export const feedHealth = (items: FeedItem[], now: Date): FeedHealth => {
  if (items.length === 0) return { status: "empty" };
  const latest = new Date(Math.max(...items.map((item) => item.published.getTime())));
  const ageDays = (now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000);
  return { status: ageDays > staleDays ? "stale" : "ok", latest, items: items.length };
};

// Slack mrkdwn treats these as formatting
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The Slack message for a new post
 * @param item the post
 * @param author who wrote it
 * @param authorUrl their latina.dev profile or site
 */
export const postMessage = (item: FeedItem, author: string, authorUrl: string) => {
  const link = item.link.replace(/[<>|]/g, encodeURIComponent);
  return {
    text: `${item.title} by ${author}`,
    unfurl_links: true,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📝 *<${link}|${escape(item.title)}>*\nby <${authorUrl}|${escape(author)}>`,
        },
      },
    ],
  };
};
