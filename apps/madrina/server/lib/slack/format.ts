import type { KnownBlock } from "@slack/web-api";

// Cumulative cap for all `markdown` blocks in one message is 12,000 chars.
// Leave headroom for the truncation marker.
const MARKDOWN_LIMIT = 11_900;
const TRUNCATED = "\n\n_…trimmed for length. Ask me for the rest._";
const EMPTY_REPLY = "Hmm, I lost my train of thought. Ask me again?";

/**
 * Madrina's emoji palette: one shortcode per coaching moment. The prompt
 * lists these and the formatter drops any other shortcode, so a made-up
 * name never shows up as literal `:text:`. Add workspace custom emoji here.
 */
export const MADRINA_EMOJI = {
  compass: "a focus check or a change of direction",
  dart: "the one next step or top priority",
  tada: "celebrating a win she logged",
  sparkles: "getting credit for work that was invisible",
  memo: "a draft she can copy and send herself",
  mega: "making work visible in a public channel",
  books: "a resource from the curated shelf",
  seedling: "a skill she is growing toward the next level",
  chart_with_upwards_trend: "promotion progress or the level she is aiming for",
  handshake: "mentors, sponsors, advocates and coaches",
  muscle: "encouragement when something is hard",
  hourglass_flowing_sand: "time, focus hours or a deadline",
} as const;

const ALLOWED_EMOJI = new Set<string>(Object.keys(MADRINA_EMOJI));

/** Shortcodes need a letter, so times like 10:30:45 are left alone. */
const SHORTCODE = /:([a-z0-9_+-]*[a-z][a-z0-9_+-]*):/g;

const keepPaletteEmoji = (md: string): string =>
  md
    .replace(SHORTCODE, (match, name: string) =>
      ALLOWED_EMOJI.has(name) ? match : "",
    )
    // Tidy gaps a dropped shortcode leaves, without touching list indents.
    .replace(/(\S)[ \t]{2,}/g, "$1 ")
    .replace(/[ \t]+$/gm, "");

/**
 * Clean up common LLM habits that render badly inside a markdown block:
 * leftover Slack mrkdwn links, dashes and curly quotes (humanizer tells),
 * off-palette emoji, and runaway blank lines.
 * Mentions like <@U123>, <#C123> and <!here> are left alone.
 */
const normalize = (md: string): string =>
  keepPaletteEmoji(md)
    .replace(/\r\n?/g, "\n")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // en dash between numbers is a range: 2–3 → 2-3
    .replace(/(\d)\s*–\s*(\d)/g, "$1-$2")
    // <https://x.com|text> → [text](https://x.com)
    .replace(/<((?:https?|mailto):[^|>\s]+)\|([^>]+)>/g, "[$2]($1)")
    // bare <https://x.com> → https://x.com
    .replace(/<((?:https?|mailto):[^|>\s]+)>/g, "$1")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Cut at a paragraph or line boundary so we never split mid-list or mid-link. */
const truncate = (md: string): string => {
  if (md.length <= MARKDOWN_LIMIT) return md;
  const budget = MARKDOWN_LIMIT - TRUNCATED.length;
  const head = md.slice(0, budget);
  const cut = Math.max(head.lastIndexOf("\n\n"), head.lastIndexOf("\n"));
  let out = cut > budget * 0.6 ? head.slice(0, cut) : head;
  // Don't leave a code fence open.
  if ((out.match(/```/g) ?? []).length % 2 === 1) out += "\n```";
  return out.trimEnd() + TRUNCATED;
};

/**
 * Turn a Claude reply (standard Markdown) into Block Kit for
 * chat.postMessage / chat.update / say. Always pair with a `text` fallback.
 *
 * Uses Slack's `markdown` block, which is built for LLM output: Slack does the
 * translation, so bold, lists, links, quotes, code, headings and tables render
 * as written. Contract used across listeners: markdownToBlocks(md) => KnownBlock[].
 */
export const markdownToBlocks = (md: string): KnownBlock[] => [
  { type: "markdown", text: truncate(normalize(md)) || EMPTY_REPLY },
];
