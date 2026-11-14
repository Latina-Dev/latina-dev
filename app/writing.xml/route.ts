import { getWriting, writingRss } from "@/lib/writing";

// Built once at build time; data/writing only changes through a merged pull request
export const dynamic = "force-static";

/** RSS feed of members' newest blog posts */
export function GET() {
  return new Response(writingRss(getWriting()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
