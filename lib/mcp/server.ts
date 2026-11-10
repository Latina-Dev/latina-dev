import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ergGuidePath, ergsMarkdown, ergsPath } from "@/lib/ergs";
import {
  McpMember,
  resourceCategories,
  resourceTags,
  searchErgs,
  searchMembers,
  searchResources,
} from "@/lib/mcp/directory";
import { resourcesPath } from "@/lib/resources";
import { resourcesMarkdown } from "@/lib/resourcesMarkdown";
import { siteName, siteUrl } from "@/lib/site";

import { countryNames } from "@/types/countries";
import { memberLevels, openToOptions } from "@/types/members";
import { resourceAudiences, resourceStages, resourceTypes } from "@/types/resources";

const instructions = `${siteName} (${siteUrl}) is a directory of Latina software engineers at the student, individual contributor and leadership levels, plus a curated list of communities, programs, job boards, conferences and reads for Latina engineers, and a list of Latinx employee resource groups (ERGs) by company.
Use search_members to find Latina engineers by name, company, school, location, country of heritage or what they are open to (mentoring, speaking, job opportunities and more), and get_member for one full profile. Use search_resources when someone asks for help with a career as a Latina in tech: learning to code, college and scholarships, finding a job, growing into leadership or starting a company. Filter by \`stage\` (where they are in their career) and \`type\` (community, program, scholarship, job board and more); list_resource_categories shows every category, stage and type with counts. Use search_ergs when someone asks whether a company has a Latinx ERG, or which companies do. Link people to the profile, resource or ERG URLs in the results.`;

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
    { name: "latina-dev", title: siteName, version: "1.2.0", websiteUrl: siteUrl },
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
        "Search the communities, student programs, scholarships, job boards, career and leadership groups, conferences, founder support, podcasts, newsletters and reports that Latina Dev lists for Latina software engineers. Use it for career questions from or about Latinas in tech at any stage, from K-12 students to engineering leaders and founders. Every keyword in `query` must match a resource's name, description, category, type, stage or audience. Filters narrow results further. Leave everything empty to list resources. Each result says what the resource is (`types`), the career stages it helps most (`stages`) and who it is built for (`serves`).",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Keywords, e.g. "mentorship", "scholarship", "podcast", "cybersecurity"'),
        category: z
          .enum(resourceCategories.map((c) => c.id) as [string, ...string[]])
          .optional()
          .describe("Category id from list_resource_categories"),
        type: z.enum(resourceTypes).optional().describe("What the resource is"),
        stage: z.enum(resourceStages).optional().describe("Career stage it helps most"),
        serves: z
          .enum(resourceAudiences)
          .optional()
          .describe(
            'Who the resource is built for, e.g. "Latinas" for groups made only for Latinas. Every resource is useful to Latinas, so leave this out unless asked'
          ),
        limit,
      },
      annotations: { title: "Search resources", ...readOnly },
    },
    ({ query, category, type, stage, serves, limit }) =>
      asResult(searchResources({ query, category, type, stage, serves, limit }))
  );

  server.registerTool(
    "list_resource_categories",
    {
      title: "List resource categories",
      description:
        "List the resource categories on latina.dev/resources, such as communities, K-12 and college programs, job boards and conferences, plus the career stages and types resources are tagged with. Each comes with how many resources it has and the page that lists them.",
      annotations: { title: "List resource categories", ...readOnly },
    },
    () => asResult({ categories: resourceCategories, ...resourceTags })
  );

  server.registerTool(
    "search_ergs",
    {
      title: "Search Latinx ERGs",
      description:
        "Search the Latinx employee resource groups (ERGs) that Latina Dev lists by company. Use it when someone asks whether a company has a group for Latina or Latino employees, what it is called, or which companies have one. Every keyword in `query` must match the company or the group's name. Leave `query` empty to list every company. The list is not complete and names can change, so a company missing here may still have an ERG. The result includes a guide to starting one.",
      inputSchema: {
        query: z.string().optional().describe('Company or group name, e.g. "Netflix", "Somos"'),
        limit,
      },
      annotations: { title: "Search Latinx ERGs", ...readOnly },
    },
    ({ query, limit }) =>
      asResult({
        ...searchErgs({ query, limit }),
        page: `${siteUrl}${ergsPath}`,
        guide: `${siteUrl}${ergGuidePath}`,
      })
  );

  // The whole list in one read, for assistants that load context instead of calling tools
  const markdownUrl = `${siteUrl}${resourcesPath}.md`;
  server.registerResource(
    "resources",
    markdownUrl,
    {
      title: "Resources for Latina software engineers",
      description:
        "Every community, program, job board, conference and read Latina Dev lists, as Markdown, with each one's type, career stage and audience.",
      mimeType: "text/markdown",
    },
    () => ({
      contents: [{ uri: markdownUrl, mimeType: "text/markdown", text: resourcesMarkdown() }],
    })
  );

  const ergsUrl = `${siteUrl}${ergsPath}.md`;
  server.registerResource(
    "ergs",
    ergsUrl,
    {
      title: "Latinx employee resource groups at tech companies",
      description:
        "Every company Latina Dev lists with an employee resource group for Latina and Latino employees, as Markdown, with the name each group goes by.",
      mimeType: "text/markdown",
    },
    () => ({ contents: [{ uri: ergsUrl, mimeType: "text/markdown", text: ergsMarkdown() }] })
  );

  return server;
};
