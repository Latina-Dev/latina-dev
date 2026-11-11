import { z } from "zod";

import {
  resourceAudiences,
  resourceGroupIds,
  resourceStages,
  resourceTypes,
} from "@/types/resources";

// Rejects values like " https://example.com" that YAML keeps verbatim
const text = z
  .string()
  .min(1, "must not be empty")
  .refine((value) => value === value.trim(), "must not start or end with a space");

// A list with at least one entry and no repeats
const listOf = <T extends readonly [string, ...string[]]>(options: T) =>
  z
    .array(z.enum(options))
    .min(1, "must list at least one option")
    .refine((values) => new Set(values).size === values.length, "must not repeat an option");

/**
 * Schema for the frontmatter of each resource in data/resources/*.md.
 * Unknown keys are rejected so typos (e.g. "stage") fail instead of being ignored.
 */
const resourceFrontmatterSchema = z.strictObject({
  name: text,
  url: text.pipe(z.url({ protocol: /^https?$/, message: "must be a full http(s) URL" })),
  description: text,
  group: z.enum(resourceGroupIds), // the page on /resources that lists it
  types: listOf(resourceTypes),
  stages: listOf(resourceStages),
  serves: listOf(resourceAudiences),
  // schema.org type for the JSON-LD; most entries are organizations
  schemaType: z.enum(["Organization", "Report", "PodcastSeries"]).optional(),
});

export type ResourceFrontmatter = z.infer<typeof resourceFrontmatterSchema>;

/**
 * Validate the frontmatter of one resource
 * @param filename e.g. latinas-in-tech.md
 * @param data frontmatter parsed from the resource file
 * @returns validated frontmatter, or a readable list of problems
 */
export const validateResourceFrontmatter = (
  filename: string,
  data: unknown
): { success: true; data: ResourceFrontmatter } | { success: false; error: string } => {
  const result = resourceFrontmatterSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: `data/resources/${filename}\n${z.prettifyError(result.error)}` };
};
