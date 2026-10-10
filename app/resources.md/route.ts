import { resourceCount, resourceGroups, resourcesPath } from "@/lib/resources";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Every resource as plain Markdown, the easiest format for an AI assistant to read and quote */
export async function GET() {
  const body = [
    "# Resources for Latina software engineers",
    "",
    `${resourceCount} communities, programs, job boards, conferences and reads for Latina software engineers, curated by Latina Dev (${siteUrl}${resourcesPath}).`,
    "",
    ...resourceGroups.flatMap((group) => [
      `## ${group.title}`,
      "",
      `${group.summary} More at ${siteUrl}${resourcesPath}/${group.id}`,
      "",
      ...group.resources.map((r) => `- [${r.name}](${r.url}): ${r.description}`),
      "",
    ]),
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
