import { resourceGroups, resourceSlug, resourcesPath } from "@/lib/resources";
import { siteUrl } from "@/lib/site";

import { MemberInterface } from "@/types/members";

// Search over the public member directory and resources, shared by the MCP tools at /mcp.
// Only fields already shown on latina.dev are returned.

export interface McpMember {
  name: string;
  slug: string;
  url: string;
  level: MemberInterface["level"];
  affiliation?: string;
  location?: string;
  countries?: string[];
  openTo?: string[];
  linkedin: string;
  github?: string;
  twitter?: string;
  website?: string;
  added: string;
  bio?: string;
}

export interface McpResource {
  name: string;
  url: string;
  description: string;
  category: string;
  categoryTitle: string;
  page: string;
}

const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** Turn the rendered bio HTML into plain text an assistant can quote */
const htmlToText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    // One pass, so "&amp;lt;" becomes "&lt;" rather than "<"
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => entities[entity])
    .replace(/\s+/g, " ")
    .trim();

/** The public view of a member, without fields the site doesn't show (members opting out are dropped) */
export const toMcpMembers = (members: MemberInterface[]): McpMember[] =>
  members
    .filter((member) => !member.noindex)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => {
      const bio = member.bio ? htmlToText(member.bio) : "";
      return {
        name: member.name,
        slug: member.slug,
        url: `${siteUrl}${member.path}`,
        level: member.level,
        ...(member.affiliation && { affiliation: member.affiliation }),
        ...(member.location && { location: member.location }),
        ...(member.countries && { countries: [...member.countries] }),
        ...(member.openTo && { openTo: [...member.openTo] }),
        linkedin: `https://www.linkedin.com/in/${member.linkedin}`,
        ...(member.github && { github: `https://github.com/${member.github}` }),
        ...(member.twitter && { twitter: `https://x.com/${member.twitter}` }),
        ...(member.website && { website: member.website }),
        added: member.added,
        ...(bio && { bio }),
      };
    });

// Lowercase and strip accents, so "mexico" finds "México" and the other way round
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Words that describe everyone here, or carry no meaning, so they would only filter results out
const ignoredWords = new Set(
  "a an and or the in at of on for to with who is are from latina latinas latino latinos latinx hispanic engineer engineers developer developers dev devs software member members".split(
    " "
  )
);

const tokens = (query?: string) =>
  query
    ? normalize(query)
        .split(/[\s,]+/)
        .filter((word) => word && !ignoredWords.has(word))
    : [];

const sameText = (a: string, b: string) => normalize(a) === normalize(b);

/** True when every word of the query appears somewhere in the given fields */
const matchesAll = (words: string[], fields: (string | undefined)[]) => {
  const haystack = normalize(fields.filter(Boolean).join(" "));
  return words.every((word) => haystack.includes(word));
};

export interface MemberSearch {
  query?: string;
  level?: string;
  country?: string;
  openTo?: string;
  limit?: number;
}

export const searchMembers = (members: McpMember[], search: MemberSearch) => {
  const words = tokens(search.query);
  const matches = members.filter(
    (member) =>
      (!search.level || sameText(member.level, search.level)) &&
      (!search.country || member.countries?.some((c) => sameText(c, search.country!))) &&
      (!search.openTo || member.openTo?.some((o) => sameText(o, search.openTo!))) &&
      matchesAll(words, [
        member.name,
        member.slug,
        member.level,
        member.affiliation,
        member.location,
        member.countries?.join(" "),
        member.openTo?.join(" "),
        member.bio,
      ])
  );
  return { total: matches.length, members: matches.slice(0, search.limit ?? 20) };
};

export const allResources: McpResource[] = resourceGroups.flatMap((group) =>
  group.resources.map((resource) => ({
    name: resource.name,
    url: resource.url,
    description: resource.description,
    category: group.id,
    categoryTitle: group.title,
    page: `${siteUrl}${resourcesPath}/${group.id}#${resourceSlug(resource)}`,
  }))
);

export const resourceCategories = resourceGroups.map((group) => ({
  id: group.id,
  title: group.title,
  summary: group.summary,
  count: group.resources.length,
  url: `${siteUrl}${resourcesPath}/${group.id}`,
}));

export interface ResourceSearch {
  query?: string;
  category?: string;
  limit?: number;
}

export const searchResources = (search: ResourceSearch) => {
  const words = tokens(search.query);
  const matches = allResources.filter(
    (resource) =>
      (!search.category || resource.category === search.category) &&
      matchesAll(words, [resource.name, resource.description, resource.categoryTitle])
  );
  return { total: matches.length, resources: matches.slice(0, search.limit ?? 20) };
};
