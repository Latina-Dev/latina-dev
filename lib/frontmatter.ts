import { load } from "js-yaml";

// An opening --- line, optional YAML, then a closing --- line
const FRONTMATTER = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

/**
 * Split a Markdown file into its YAML frontmatter and body
 * @param markdown file contents
 * @returns parsed frontmatter (empty when there is none) and the Markdown after it
 * @throws if the frontmatter isn't valid YAML or isn't a key/value map
 */
export const parseFrontmatter = (markdown: string) => {
  const match = FRONTMATTER.exec(markdown);
  if (!match) return { data: {} as Record<string, unknown>, content: markdown };

  const yaml = match[1] ?? "";
  const data = yaml.trim() ? (load(yaml) ?? {}) : {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a YAML map of keys to values");
  }
  return { data: data as Record<string, unknown>, content: markdown.slice(match[0].length) };
};
