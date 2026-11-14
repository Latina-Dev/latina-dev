import Link from "next/link";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import {
  formatWritingDate,
  getWriting,
  writingDescription,
  writingFeedPath,
  writingJsonLd,
  writingPath,
  writingTitle,
} from "@/lib/writing";

import type { Metadata } from "next";

import styles from "./writing.module.css";

const posts = getWriting();

export const metadata: Metadata = {
  ...pageMetadata({ title: writingTitle, description: writingDescription, path: writingPath }),
  alternates: {
    canonical: writingPath,
    types: { "application/rss+xml": [{ url: writingFeedPath, title: writingTitle }] },
  },
  // An empty list has nothing for search engines yet
  ...(posts.length ? {} : { robots: { index: false, follow: true } }),
};

/** Every member's newest blog posts, linking out to the author's own site */
export default function WritingPage() {
  const authors = new Set(posts.map((post) => post.authorSlug)).size;

  return (
    <>
      <JsonLd
        data={[
          writingJsonLd(posts),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Writing", path: writingPath },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Community"
        title={writingTitle}
        lede={
          <p>
            What Latina Dev members are writing about engineering, careers and life in tech. Every
            post lives on the author&apos;s own site, so give her a read there.
          </p>
        }
      />
      <div className={`page-width ${styles.page}`}>
        {posts.length ? (
          <>
            <p className={styles.count}>
              {posts.length} {posts.length === 1 ? "post" : "posts"} by {authors}{" "}
              {authors === 1 ? "member" : "members"} · <a href={writingFeedPath}>RSS feed</a>
            </p>
            <ol className={styles.list}>
              {posts.map((post) => (
                <li key={post.url} className={styles.item}>
                  <h2>
                    <a href={post.url} target="_blank" rel="noopener">
                      {post.title}
                      <span className={styles.external} aria-hidden="true">
                        {" "}
                        ↗
                      </span>
                    </a>
                  </h2>
                  {post.summary && <p className={styles.summary}>{post.summary}</p>}
                  <p className={styles.meta}>
                    By <Link href={post.authorPath}>{post.author}</Link> ·{" "}
                    <time dateTime={post.published}>{formatWritingDate(post.published)}</time>
                  </p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className={styles.empty}>
            No posts yet. The first ones will show up here as soon as members add their blog to
            their profile.
          </p>
        )}
        <aside className={styles.callout} aria-labelledby="get-listed">
          <h2 id="get-listed">Write a blog? Get it listed</h2>
          <p>
            Add your blog or its RSS feed to your <Link href="/profile">Latina Dev profile</Link>.
            Your new posts show up here, on your profile and in the members&apos; Slack. Not in the
            directory yet? <Link href="/add-member">Add your profile</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}
