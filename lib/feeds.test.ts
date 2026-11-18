import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  discoverFeedUrl,
  feedHealth,
  isFeed,
  itemsInWindow,
  parseFeed,
  postMessage,
  previousDay,
  writingFile,
} from "@/lib/feeds";

const rss = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Blog</title>
<item><title><![CDATA[Scaling search & <b>indexes</b>]]></title><link>https://ana.dev/search</link>
<pubDate>Wed, 11 Nov 2026 15:00:00 GMT</pubDate></item>
<item><title>Old post</title><link>https://ana.dev/old</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate></item>
<item><title>No date</title><link>https://ana.dev/undated</link></item>
</channel></rss>`;

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom blog</title>
<entry><title type="html">Hola &amp;amp; adi&#243;s</title>
<link rel="self" href="https://ana.dev/feed/1"/><link rel="alternate" href="https://ana.dev/hola"/>
<updated>2026-11-11T09:30:00Z</updated></entry>
</feed>`;

describe("parseFeed", () => {
  it("reads RSS items, decoding CDATA and markup, and skips undated ones", () => {
    const items = parseFeed(rss);
    assert.equal(items.length, 2);
    assert.equal(items[0].title, "Scaling search & indexes");
    assert.equal(items[0].link, "https://ana.dev/search");
    assert.equal(items[0].published.toISOString(), "2026-11-11T15:00:00.000Z");
  });

  it("reads Atom entries using the alternate link", () => {
    const [entry] = parseFeed(atom);
    assert.equal(entry.title, "Hola & adiós");
    assert.equal(entry.link, "https://ana.dev/hola");
  });

  it("tells feeds from pages", () => {
    assert.ok(isFeed(rss));
    assert.ok(isFeed(atom));
    assert.ok(!isFeed("<!doctype html><html></html>"));
  });
});

describe("discoverFeedUrl", () => {
  it("resolves the advertised feed against the page", () => {
    const html = `<head><link rel="stylesheet" href="/a.css"><link rel="alternate" type="application/rss+xml" title="RSS" href="/rss.xml"></head>`;
    assert.equal(discoverFeedUrl(html, "https://ana.dev/blog/"), "https://ana.dev/rss.xml");
    assert.equal(discoverFeedUrl("<head></head>", "https://ana.dev"), undefined);
  });
});

describe("daily window", () => {
  it("covers exactly the previous UTC day, so each post is shared once", () => {
    const window = previousDay(new Date("2026-11-12T15:07:00Z"));
    assert.equal(window.start.toISOString(), "2026-11-11T00:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-11-12T00:00:00.000Z");
    const items = itemsInWindow([...parseFeed(rss), ...parseFeed(atom)], window);
    assert.deepEqual(
      items.map((item) => item.link),
      ["https://ana.dev/hola", "https://ana.dev/search"]
    );
  });
});

describe("feedHealth", () => {
  const now = new Date("2026-11-12T00:00:00Z");
  it("is ok with a recent post and stale after 180 days", () => {
    assert.equal(feedHealth(parseFeed(rss), now).status, "ok");
    assert.equal(feedHealth(parseFeed(rss), new Date("2027-06-01T00:00:00Z")).status, "stale");
    assert.equal(feedHealth([], now).status, "empty");
  });
});

describe("postMessage", () => {
  it("escapes titles and keeps links intact", () => {
    const [item] = parseFeed(rss);
    const message = postMessage(
      { ...item, title: "<!channel> hi" },
      "Ana",
      "https://latina.dev/members/ana"
    );
    const text = (message.blocks[0].text as { text: string }).text;
    assert.ok(text.includes("&lt;!channel&gt; hi"));
    assert.ok(text.includes("<https://ana.dev/search|"));
  });
});

describe("writingFile", () => {
  const item = (title: string, link: string, day: number) => ({
    title,
    link,
    published: new Date(Date.UTC(2026, 10, day)),
  });

  it("keeps saved posts and hidden URLs, adds new ones newest first", () => {
    const existing = {
      feed: "https://ana.dev/blog",
      posts: [{ title: "Old", url: "https://ana.dev/old", published: "2026-10-01T00:00:00.000Z" }],
      hidden: ["https://ana.dev/spam"],
    };
    const file = writingFile(
      "https://ana.dev/blog",
      [
        item("New", "https://ana.dev/new", 2),
        item("Spam", "https://ana.dev/spam", 3),
        item("Insecure", "http://ana.dev/insecure", 4),
      ],
      existing
    );
    assert.deepEqual(file, {
      feed: "https://ana.dev/blog",
      posts: [
        { title: "New", url: "https://ana.dev/new", published: "2026-11-02T00:00:00.000Z" },
        { title: "Old", url: "https://ana.dev/old", published: "2026-10-01T00:00:00.000Z" },
      ],
      hidden: ["https://ana.dev/spam"],
    });
  });

  it("drops saved posts when the member changes blogs", () => {
    const existing = {
      feed: "https://old.dev",
      posts: [{ title: "Old", url: "https://old.dev/a", published: "2026-10-01T00:00:00.000Z" }],
    };
    const file = writingFile("https://new.dev", [item("A", "https://new.dev/a", 1)], existing);
    assert.deepEqual(
      file.posts.map((post) => post.url),
      ["https://new.dev/a"]
    );
    assert.equal("hidden" in file, false);
  });
});
