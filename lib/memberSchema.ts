import { z } from "zod";

import { countryNames } from "@/types/countries";
import { memberLevels } from "@/types/members";

// Rejects values like " https://example.com" that YAML keeps verbatim
const noSurroundingSpace = (value: string) => value === value.trim();
const surroundingSpaceMessage = "must not start or end with a space";

const text = z
  .string()
  .min(1, "must not be empty")
  .refine(noSurroundingSpace, surroundingSpaceMessage);

/**
 * Schema for the frontmatter of each profile in data/members/*.md.
 * Unknown keys are rejected so typos (e.g. "linkdin") fail instead of being ignored.
 */
export const memberFrontmatterSchema = z.strictObject({
  name: text,
  added: z.iso.date('must be a quoted date like "2023-05-07"'),
  level: z.enum(memberLevels),
  linkedin: text.regex(
    /^[\p{L}\p{N}_-]+$/u,
    'must be only the LinkedIn handle, e.g. "frances-coronel" from linkedin.com/in/frances-coronel'
  ),
  github: text
    .regex(
      /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/,
      'must be only the GitHub username, e.g. "FrancesCoronel"'
    )
    .optional(),
  twitter: text
    .regex(/^[A-Za-z0-9_]{1,15}$/, 'must be only the Twitter username, e.g. "FrancesCoronel"')
    .optional(),
  website: text
    .pipe(z.url({ protocol: /^https?$/, message: "must be a full http(s) URL" }))
    .optional(),
  affiliation: text.optional(),
  countries: z.array(z.enum(countryNames)).min(1, "must list at least one country").optional(),
});

export type MemberFrontmatter = z.infer<typeof memberFrontmatterSchema>;

/**
 * Validate the frontmatter of one member profile
 * @param filename e.g. frances-coronel.md
 * @param data frontmatter parsed by gray-matter
 * @returns validated frontmatter, or a readable list of problems
 */
export const validateMemberFrontmatter = (
  filename: string,
  data: unknown
): { success: true; data: MemberFrontmatter } | { success: false; error: string } => {
  const result = memberFrontmatterSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: `data/members/${filename}\n${z.prettifyError(result.error)}` };
};
