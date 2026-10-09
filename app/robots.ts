import { siteUrl } from "@/lib/site";

import type { MetadataRoute } from "next";

// Crawlers named explicitly so a blanket rule elsewhere (like a CDN default) can't be read as
// excluding them. Search engines, plus the AI crawlers that power answers in ChatGPT, Claude,
// Perplexity, Gemini and Apple Intelligence.
const crawlers = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  // API routes and the Sentry tunnel have nothing worth indexing
  const disallow = ["/api/", "/monitoring"];

  return {
    rules: [
      ...crawlers.map((userAgent) => ({ userAgent, allow: "/", disallow })),
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
