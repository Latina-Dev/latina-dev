import { siteUrl } from "@/lib/site";
import { getWriting, writingForAgents, writingPath } from "@/lib/writing";

// Built once at build time; data/writing only changes through a merged pull request
export const dynamic = "force-static";

/** Every listed post as JSON, for agents and integrations */
export function GET() {
  const posts = getWriting().map(writingForAgents);
  return Response.json({
    site: siteUrl,
    page: `${siteUrl}${writingPath}`,
    count: posts.length,
    posts,
  });
}
