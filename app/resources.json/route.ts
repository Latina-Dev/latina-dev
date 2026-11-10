import { resourceTags } from "@/lib/mcp/directory";
import { resourceCount, resourceGroups, resourceSlug, resourcesPath } from "@/lib/resources";
import { siteUrl } from "@/lib/site";

// Build this feed once at build time, like /members.json
export const dynamic = "force-static";

/** Machine-readable list of every resource on /resources, for agents and integrations */
export async function GET() {
  return Response.json({
    site: siteUrl,
    url: `${siteUrl}${resourcesPath}`,
    count: resourceCount,
    // How many resources carry each tag, with the page that lists them when there is one
    ...resourceTags,
    categories: resourceGroups.map((group) => ({
      id: group.id,
      title: group.title,
      question: group.question,
      summary: group.summary,
      url: `${siteUrl}${resourcesPath}/${group.id}`,
      resources: group.resources.map((resource) => ({
        name: resource.name,
        url: resource.url,
        description: resource.description,
        type: resource.schemaType ?? "Organization",
        types: resource.types,
        stages: resource.stages,
        serves: resource.serves,
        page: `${siteUrl}${resourcesPath}/${group.id}#${resourceSlug(resource)}`,
      })),
    })),
  });
}
