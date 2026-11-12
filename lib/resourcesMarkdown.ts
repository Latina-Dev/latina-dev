import { ergs, ergsFeedPath, ergsPath } from "@/lib/ergs";
import { resourceCount, resourceGroups, resourcesPath } from "@/lib/resources";
import { resourceViewPages } from "@/lib/resourceViews";
import { siteUrl } from "@/lib/site";

/**
 * Every resource as plain Markdown, the easiest format for an AI assistant to read and quote.
 * Served at /resources.md and as a resource on the MCP server.
 */
export const resourcesMarkdown = () =>
  [
    "# Resources for Latina software engineers",
    "",
    `${resourceCount} communities, programs, job boards, conferences and reads for Latina software engineers, curated by Latina Dev (${siteUrl}${resourcesPath}). Each entry says what it is, the career stage it helps most and who it is built for.`,
    "",
    ...resourceGroups.flatMap((group) => [
      `## ${group.title}`,
      "",
      `${group.summary} More at ${siteUrl}${resourcesPath}/${group.id}`,
      "",
      ...group.resources.map(
        (r) =>
          `- [${r.name}](${r.url}): ${r.description} (Type: ${r.types.join(", ")}. Stage: ${r.stages.join(", ")}. Built for: ${r.serves.join(", ")}.)`
      ),
      "",
    ]),
    "## Browse by career stage or type",
    "",
    ...resourceViewPages.map(
      (view) => `- [${view.heading}](${siteUrl}${view.path}): ${view.count} resources`
    ),
    "",
    "## Employee resource groups",
    "",
    `- [Latinx ERGs at companies](${siteUrl}${ergsPath}): ${ergs.length} companies, each with a public source. As Markdown: ${siteUrl}${ergsFeedPath}.md`,
    "",
  ].join("\n");
