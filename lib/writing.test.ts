import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { searchWriting } from "@/lib/mcp/directory";
import {
  collectWriting,
  getWriting,
  parseWritingFile,
  WritingFile,
  writingJsonLd,
  writingRss,
} from "@/lib/writing";

const file = (posts: WritingFile["posts"], extra: Partial<WritingFile> = {}): WritingFile => ({
  feed: "https://ana.dev/rss.xml",
  posts,
  ...extra,
});

const post = (title: string, published: string, url = `https://ana.dev/${title}`) => ({
  title,
  url,
  published,
});

const authors = [
  { slug: "ana-lopez", name: "Ana López", blog: "https://ana.dev/rss.xml" },
  { slug: "bea-ruiz", name: "Bea Ruiz", blog: "https://bea.dev/feed" },
  { slug: "no-blog", name: "Cami Díaz" },
];

describe("parseWritingFile", () => {
  it("accepts a valid file", () => {
    const data = parseWritingFile(
      "ana-lopez.json",
      JSON.stringify(
        file([{ ...post("hello", "2026-11-01T12:00:00Z"), summary: "My first post." }])
      )
    );
    assert.equal(data.posts[0].title, "hello");
  });

  it("rejects files not named after a profile slug", () => {
    assert.throws(() => parseWritingFile("Ana.json", JSON.stringify(file([]))), /member profile/);
  });

  it("rejects unknown keys, http links and bad dates", () => {
    assert.throws(
      () => parseWritingFile("ana-lopez.json", JSON.stringify({ ...file([]), extra: 1 })),
      /ana-lopez\.json/
    );
    assert.throws(
      () =>
        parseWritingFile(
          "ana-lopez.json",
          JSON.stringify(file([post("a", "2026-11-01T12:00:00Z", "http://ana.dev/a")]))
        ),
      /https/
    );
    assert.throws(
      () => parseWritingFile("ana-lopez.json", JSON.stringify(file([post("a", "Nov 1")]))),
      /ISO date/
    );
  });

  it("rejects invalid JSON", () => {
    assert.throws(() => parseWritingFile("ana-lopez.json", "{"), /not valid JSON/);
  });
});

describe("collectWriting", () => {
  it("sorts every member's posts newest first and credits the author", () => {
    const posts = collectWriting(
      [
        { slug: "ana-lopez", data: file([post("old", "2026-01-01T00:00:00Z")]) },
        {
          slug: "bea-ruiz",
          data: file([post("new", "2026-11-01T00:00:00Z", "https://bea.dev/new")]),
        },
      ],
      authors
    );
    assert.deepEqual(
      posts.map((p) => [p.title, p.author, p.authorPath]),
      [
        ["new", "Bea Ruiz", "/members/bea-ruiz"],
        ["old", "Ana López", "/members/ana-lopez"],
      ]
    );
  });

  it("leaves out members who left or cleared their blog, and hidden posts", () => {
    const posts = collectWriting(
      [
        { slug: "gone", data: file([post("a", "2026-01-01T00:00:00Z")]) },
        { slug: "no-blog", data: file([post("b", "2026-01-01T00:00:00Z")]) },
        {
          slug: "ana-lopez",
          data: file([post("c", "2026-01-01T00:00:00Z"), post("d", "2026-01-02T00:00:00Z")], {
            hidden: ["https://ana.dev/d"],
          }),
        },
      ],
      authors
    );
    assert.deepEqual(
      posts.map((p) => p.title),
      ["c"]
    );
  });

  it("lists a URL once", () => {
    const posts = collectWriting(
      [
        {
          slug: "ana-lopez",
          data: file([post("a", "2026-01-01T00:00:00Z"), post("a", "2026-01-01T00:00:00Z")]),
        },
      ],
      authors
    );
    assert.equal(posts.length, 1);
  });
});

describe("feeds and search", () => {
  const posts = collectWriting(
    [
      {
        slug: "ana-lopez",
        data: file([
          { ...post("Testing <React> & you", "2026-11-01T00:00:00Z"), summary: "On tests." },
          post("Kubernetes notes", "2026-10-01T00:00:00Z"),
        ]),
      },
    ],
    authors
  );

  it("escapes the RSS feed and links each post to the author's site", () => {
    const rss = writingRss(posts);
    assert.match(rss, /<title>Testing &lt;React&gt; &amp; you<\/title>/);
    assert.match(rss, /<guid isPermaLink="true">https:\/\/ana\.dev\/Testing/);
    assert.match(rss, /<dc:creator>Ana López<\/dc:creator>/);
    assert.match(rss, /<atom:link href="https:\/\/latina\.dev\/writing\.xml"/);
  });

  it("describes the page as a list of blog posts by members", () => {
    const data = writingJsonLd(posts);
    const first = data.mainEntity.itemListElement[0].item;
    assert.equal(first["@type"], "BlogPosting");
    assert.equal(first.author.url, "https://latina.dev/members/ana-lopez");
  });

  it("searches by keyword and by author, ignoring words every post shares", () => {
    assert.equal(searchWriting({ query: "kubernetes blog post" }, posts).total, 1);
    assert.equal(searchWriting({ query: "react" }, posts).posts[0].summary, "On tests.");
    assert.equal(searchWriting({ author: "bea-ruiz" }, posts).total, 0);
    assert.equal(searchWriting({ author: "Ana-Lopez" }, posts).total, 2);
  });
});

describe("data/writing", () => {
  it("only holds valid files for members who list a blog", () => {
    // Throws on any invalid file
    const posts = getWriting();
    for (const p of posts) assert.match(p.url, /^https:\/\//);
  });

  it("is linked from llms.txt", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const path of ["/writing", "/writing.xml", "/writing.json"]) {
      assert.ok(llms.includes(`https://latina.dev${path})`), path);
    }
  });
});
