import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getGaps, getProfile, ladder, ladderText } from "~/lib/madrina/data";
import { EFFORT, MODEL_ID } from "./claude";

const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
const anthropic = createAnthropic({
  headers: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
});

const WinSchema = z.object({
  is_win: z
    .boolean()
    .describe(
      "True if the message reports something she did or shipped (an accomplishment), not a question or chit-chat.",
    ),
  competency: z
    .enum(ladder.competencies as [string, ...string[]])
    .describe("The ladder competency this win best shows."),
  bullet: z
    .string()
    .describe(
      "Promo-ready bullet: past tense, starts with a strong verb, names the scope and the outcome or impact, one sentence, under 30 words. Use only facts from her message: do not add numbers, systems, or outcomes she did not mention.",
    ),
  coach_note: z
    .string()
    .describe(
      "One warm sentence under 25 words: why this counts at the target level, plus one way to make it visible.",
    ),
});

export type WinRewrite = z.infer<typeof WinSchema>;

/** Rewrite a one-line win as a promo-ready bullet mapped to a ladder competency. */
export const rewriteWin = async (
  raw: string,
  { assumeWin = false } = {},
): Promise<WinRewrite> => {
  const profile = getProfile();
  const track = profile.track in ladder.tracks ? profile.track : "IC";
  const expectations = ladder.competencies
    .map((c) => `- ${c}: ${ladderText(track, profile.target_level, c)}`)
    .join("\n");
  const gaps = getGaps(profile)
    .map((g) => g.competency)
    .join(", ");

  const { object } = await generateObject({
    model: anthropic(MODEL_ID),
    schema: WinSchema,
    maxOutputTokens: 8000,
    providerOptions: { anthropic: { effort: EFFORT } },
    system: `You are Madrina, a career coach for women software engineers. You turn one-line wins into promo-ready bullets for a promotion packet. Be warm and specific. Never infer anyone's gender. Never invent metrics.`,
    prompt: `${profile.name} (synthetic) is a ${profile.current_level} engineer on ${profile.team}, going for ${profile.target_level} (${profile.track}). Her biggest gaps: ${gaps}.
${profile.target_level} expectations:
${expectations}

${assumeWin ? "She is replying to a check-in that asked for a win, so treat this as a win unless it clearly is not." : "Decide whether this DM is a win."}
Message: """${raw}"""`,
  });
  return object;
};
