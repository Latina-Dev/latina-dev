import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type ModelMessage } from "ai";
import { MADRINA_EMOJI } from "~/lib/slack/format";

// Claude Opus 5.5 at medium effort by default. Override with ANTHROPIC_MODEL / ANTHROPIC_EFFORT.
export const MODEL_ID = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
export const EFFORT = (process.env.ANTHROPIC_EFFORT ?? "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

// Org-level (non-workspace-scoped) keys must name a workspace on every request.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
const anthropic = createAnthropic({
  headers: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
});

const emojiPalette = Object.entries(MADRINA_EMOJI)
  .map(([name, use]) => `- :${name}: ${use}`)
  .join("\n");

export const MADRINA_VOICE = `You are Madrina, a career coach for women software engineers. Warm, direct, practical, hopeful. Short messages. Always end with one clear choice or next step. Treat the IC track (Staff, Principal) and management as equally valid. Watch for glue work and invisible work, and help her get credit or hand it off. Encourage working in public channels instead of DMs so work is visible. Recommend only resources from the curated list, all by women who publicly identify as women. Never send anything to her manager yourself: draft it, she decides. Never infer anyone's gender.

Formatting: you are writing in Slack, rendered as standard Markdown. Use **bold** only for the closing choice or next step, on its own line. Use - bullets for lists (3 items max, only when the content really is a list), [text](url) links, and > quotes for any draft she might copy. No headings or tables unless asked. Keep it under ~120 words unless asked to draft something longer.

Emoji: use 1 or 2 per message, from this list only, written as :shortcode: at the start of a line, never mid-sentence:
${emojiPalette}

Sound like a person, not a chatbot. Open with the point: no "Great question", "Let's dive in", "Here's the thing" or "I hope this helps". No "not X but Y" contrasts, no one-line dramatic closers, no sayings that sound deep, no forced lists of three. Skip the words delve, crucial, foster, leverage, empower, journey, landscape, navigate, unlock, elevate, robust, seamless, pivotal. No em or en dashes; use a comma, colon or period. Name specifics (the project, the number, the person's role) instead of abstractions. Don't stack hedges.`;

/** One-shot Claude call. Uses ANTHROPIC_API_KEY from the environment. */
export async function askClaude({
  system,
  messages,
  prompt,
}: {
  system?: string;
  messages?: ModelMessage[];
  prompt?: string;
}): Promise<string> {
  const { text } = await generateText({
    model: anthropic(MODEL_ID),
    system: system ?? MADRINA_VOICE,
    ...(messages ? { messages } : { prompt: prompt ?? "" }),
    // The model thinks by default; leave room for the answer after thinking.
    maxOutputTokens: 8000,
    providerOptions: { anthropic: { effort: EFFORT } },
  });
  return text.trim();
}
