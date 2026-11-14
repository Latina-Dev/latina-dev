import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { creatorFeeds } from "@/lib/creatorFeeds";
import {
  discoverFeedUrl,
  FeedHealth,
  feedHealth,
  FeedItem,
  isFeed,
  itemsInWindow,
  parseFeed,
  postMessage,
  previousDay,
  WritingFile,
  writingFile,
} from "@/lib/feeds";
import { readMemberFiles } from "@/lib/getMembers";
import { siteUrl } from "@/lib/site";

// Shares new posts from Latina engineers in Slack, and checks that their feeds still work.
//
//   npx tsx scripts/slack-feeds.ts          post yesterday's (UTC) new posts
//   npx tsx scripts/slack-feeds.ts --check  report each feed's health; exits 1 if a curated
//                                           creator's feed is dead, empty or stale
//   npx tsx scripts/slack-feeds.ts --write-data
//                                           also save each member's posts to
//                                           data/writing/<slug>.json for the site's writing pages
//
// Members' blogs (the `blog` field) go to SLACK_MEMBER_POSTS_CHANNEL_ID and curated creators
// (lib/creatorFeeds.ts) to SLACK_CREATOR_FEED_CHANNEL_ID, posted by the site's Slack bot
// (SLACK_BOT_TOKEN). Without a token or channel, posts are printed instead of sent.

interface Source {
  kind: "member" | "creator";
  /** profile slug, for members */
  slug?: string;
  name: string;
  /** latina.dev profile for members, their site for creators */
  url: string;
  /** blog or feed URL; a web page is searched for its feed */
  feed: string;
}

const check = process.argv.includes("--check");
const writeData = process.argv.includes("--write-data");
const writingDir = path.join(process.cwd(), "data", "writing");

/** Save a member's posts, keeping posts already saved and anything an organizer hid */
const saveWriting = (slug: string, blog: string, items: FeedItem[]) => {
  // The site only accepts https feeds and posts
  if (!blog.startsWith("https://")) return;
  const file = path.join(writingDir, `${slug}.json`);
  const existing = existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as WritingFile)
    : undefined;
  const next = writingFile(blog, items, existing);
  if (next.posts.length === 0 && !existing) return;
  mkdirSync(writingDir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
};
const maxPostsPerSource = 5;

const sources: Source[] = [
  ...readMemberFiles()
    .filter(({ data }) => data.blog)
    .map(({ slug, data }) => ({
      kind: "member" as const,
      slug,
      name: data.name,
      url: `${siteUrl}/members/${slug}`,
      feed: data.blog!,
    })),
  ...creatorFeeds.map((creator) => ({
    kind: "creator" as const,
    name: creator.name,
    url: creator.site,
    feed: creator.feed,
  })),
];

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LatinaDevFeeds/1.0 (+https://latina.dev)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: await response.text(), url: response.url };
};

/** Fetch a source's feed, following a blog page to the feed it advertises */
const readSource = async (source: Source): Promise<{ feedUrl: string; items: FeedItem[] }> => {
  let { body, url } = await fetchText(source.feed);
  if (!isFeed(body)) {
    const feedUrl = discoverFeedUrl(body, url);
    if (!feedUrl) throw new Error("no RSS or Atom feed found on the page");
    ({ body, url } = await fetchText(feedUrl));
    if (!isFeed(body)) throw new Error("the advertised feed isn't RSS or Atom");
  }
  return { feedUrl: url, items: parseFeed(body) };
};

const slack = async (method: string, payload: Record<string, unknown>) => {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(`Slack ${method} failed: ${result.error ?? response.status}`);
};

// Feed text goes in code spans in the report, so markup or an @mention can't render
const code = (text: string) =>
  `\`${text.replaceAll("`", "'").replace(/\s+/g, " ").slice(0, 200)}\``;

async function runCheck() {
  const now = new Date();
  const rows: { source: Source; health: FeedHealth; feedUrl?: string }[] = [];
  for (const source of sources) {
    try {
      const { feedUrl, items } = await readSource(source);
      rows.push({ source, feedUrl, health: feedHealth(items, now) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      rows.push({ source, health: { status: "dead", reason } });
    }
  }

  const describe = (health: FeedHealth) =>
    health.status === "dead"
      ? `❌ dead: ${code(health.reason)}`
      : health.status === "empty"
        ? "❌ no dated posts"
        : `${health.status === "ok" ? "✅" : "⚠️ stale,"} ${health.items} posts, latest ${health.latest.toISOString().slice(0, 10)}`;

  const table = (kind: Source["kind"]) => {
    const list = rows.filter((row) => row.source.kind === kind);
    if (list.length === 0) return "_None yet._\n";
    return [
      "| Who | Feed | Health |",
      "| --- | --- | --- |",
      ...list.map(
        ({ source, health, feedUrl }) =>
          `| ${code(source.name)} | ${code(feedUrl ?? source.feed)} | ${describe(health)} |`
      ),
    ].join("\n");
  };

  const report = [
    "# Slack feeds",
    "",
    `## #creator-feed (lib/creatorFeeds.ts)\n\n${table("creator")}`,
    "",
    `## #member-posts (members' blog field)\n\n${table("member")}`,
    "",
    "A feed is stale when its newest post is more than 180 days old. Dead or stale creators should be removed from lib/creatorFeeds.ts; members' blogs are only listed.",
  ].join("\n");
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

  const failing = rows.filter((row) => row.source.kind === "creator" && row.health.status !== "ok");
  if (failing.length) {
    console.error(
      `Creator feeds need attention: ${failing.map((row) => row.source.name).join(", ")}`
    );
    process.exit(1);
  }
}

async function runPost() {
  const window = previousDay(new Date());
  const channels = {
    member: process.env.SLACK_MEMBER_POSTS_CHANNEL_ID,
    creator: process.env.SLACK_CREATOR_FEED_CHANNEL_ID,
  };
  const dryRun = !process.env.SLACK_BOT_TOKEN;
  console.log(
    `Posting items published ${window.start.toISOString()} to ${window.end.toISOString()}${dryRun ? " (dry run)" : ""}`
  );

  let failures = 0;
  for (const source of sources) {
    let items: FeedItem[];
    try {
      const all = (await readSource(source)).items;
      if (writeData && source.slug) saveWriting(source.slug, source.feed, all);
      items = itemsInWindow(all, window).slice(0, maxPostsPerSource);
    } catch (error) {
      // A broken feed is reported by the weekly check; keep posting the others
      console.warn(`Skipped ${source.name}: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    const channel = channels[source.kind];
    for (const item of items) {
      const message = postMessage(item, source.name, source.url);
      if (dryRun || !channel) {
        console.log(`[${source.kind}] ${message.text} ${item.link}`);
        continue;
      }
      try {
        await slack("chat.postMessage", { channel, ...message });
      } catch (error) {
        failures++;
        console.error(error);
      }
    }
  }
  if (failures) process.exit(1);
}

(check ? runCheck() : runPost()).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
