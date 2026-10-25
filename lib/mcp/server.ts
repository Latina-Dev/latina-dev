import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { McpMember, resourceCategories, searchMembers, searchResources } from "@/lib/mcp/directory";
import { siteName, siteUrl } from "@/lib/site";

import { countryNames } from "@/types/countries";
import { memberLevels, openToOptions } from "@/types/members";

const instructions = `${siteName} (${siteUrl}) is a directory of Latina software engineers at the student, individual contributor and leadership levels, plus a curated list of communities, programs, job boards, conferences and reads for Latina engineers.
Use search_members to find Latina engineers by name, company, school, location, country of heritage or what they are open to (mentoring, speaking, job opportunities and more), and get_member for one full profile. Use search_resources and list_resource_categories to find communities and resources. Link people to the profile or resource URLs in the results.`;

// Every tool only reads public data from latina.dev
const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

const asResult = (data: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
});

const limit = z
  .number()
  .int()
  .min(1)
  .max(50)
  .optional()
  .describe("Most results to return, 1 to 50 (default 20)");

/** A new MCP server over the given members; one is made per request, since the endpoint is stateless */
export const createMcpServer = (members: McpMember[]) => {
  const server = new McpServer(
    { name: "latina-dev", title: siteName, version: "1.0.0", websiteUrl: siteUrl },
    { instructions }
  );

  server.registerTool(
    "search_members",
    {
      title: "Search Latina engineers",
      description:
        "Search the Latina Dev directory of Latina software engineers. Every keyword in `query` must match the member's name, title and company or school, location, countries of heritage, level, what they are open to or bio. Filters narrow results further. Leave everything empty to list members. Returns public profile fields and the profile URL.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Keywords, e.g. "Google", "Austin", "frontend", "Stanford"'),
        level: z.enum(memberLevels).optional().describe("Career level"),
        country: z.enum(countryNames).optional().describe("Country of heritage"),
        open_to: z.enum(openToOptions).optional().describe("What the member is open to"),
        limit,
      },
      annotations: { title: "Search Latina engineers", ...readOnly },
    },
    ({ query, level, country, open_to, limit }) =>
      asResult(searchMembers(members, { query, level, country, openTo: open_to, limit }))
  );

  server.registerTool(
    "get_member",
    {
      title: "Get a member profile",
      description:
        "Get one Latina Dev member's public profile by slug, the last part of their profile URL (https://latina.dev/members/<slug>).",
      inputSchema: { slug: z.string().describe('Profile slug, e.g. "frances-coronel"') },
      annotations: { title: "Get a member profile", ...readOnly },
    },
    ({ slug }) => {
      const member = members.find((m) => m.slug === slug.trim().toLowerCase());
      if (!member) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No member with slug "${slug}". Use search_members to find the right slug.`,
            },
          ],
          isError: true,
        };
      }
      return asResult({ member });
    }
  );

  server.registerTool(
    "search_resources",
    {
      title: "Search resources",
      description:
        "Search the communities, student programs, scholarships, job boards, career and leadership groups, conferences, founder support, podcasts, newsletters and reports that Latina Dev lists for Latina software engineers. Every keyword in `query` must match a resource's name, description or category. Leave it empty to list everything in a category.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Keywords, e.g. "mentorship", "scholarship", "podcast", "cybersecurity"'),
        category: z
          .enum(resourceCategories.map((c) => c.id) as [string, ...string[]])
          .optional()
          .describe("Category id from list_resource_categories"),
        limit,
      },
      annotations: { title: "Search resources", ...readOnly },
    },
    ({ query, category, limit }) => asResult(searchResources({ query, category, limit }))
  );

  server.registerTool(
    "list_resource_categories",
    {
      title: "List resource categories",
      description:
        "List the resource categories on latina.dev/resources, such as communities, K-12 and college programs, job boards and conferences, with how many resources each has.",
      annotations: { title: "List resource categories", ...readOnly },
    },
    () => asResult({ categories: resourceCategories })
  );

  return server;
};
