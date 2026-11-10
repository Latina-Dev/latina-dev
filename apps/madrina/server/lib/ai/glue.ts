import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getGaps, getProfile, ladder, ladderText } from "~/lib/madrina/data";
import { computeFocus } from "~/lib/madrina/focus";
import type { GlueAsk } from "~/lib/madrina/glue";
import { askClaude, type EFFORT, MADRINA_VOICE, MODEL_ID } from "./claude";

const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
const anthropic = createAnthropic({
  headers: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
});

// Classification sits between the ask landing and Ana seeing the flag, so favor speed.
const CLASSIFY_EFFORT = (process.env.ANTHROPIC_CLASSIFY_EFFORT ??
  "low") as typeof EFFORT;

const AskSchema = z.object({
  isAsk: z
    .boolean()
    .describe(
      "True only if the message asks the profile user, by name or clearly by context, to do, own, or take on something. Status updates, notes, thanks, and questions to the room are false.",
    ),
  isPromotable: z
    .boolean()
    .describe(
      "True if doing this would count as evidence for the target level on the ladder. Coordination, note-taking, event planning, swag, scheduling, and helping out are usually false, however useful they are.",
    ),
  competency: z
    .enum(ladder.competencies as [string, ...string[]])
    .nullable()
    .describe(
      "The ladder competency the work would show at the target level, or null if it maps to none.",
    ),
  ask: z
    .string()
    .describe(
      "What she is being asked to do, under 12 words, a verb phrase starting with a lowercase verb (keep names and dates capitalized), e.g. 'coordinate team swag before the offsite'. Empty if not an ask.",
    ),
  reason: z
    .string()
    .describe(
      "One sentence under 25 words on why it is or isn't promotable, naming what the target level expects. No gendered pronouns for anyone.",
    ),
});

export type AskClassification = z.infer<typeof AskSchema>;

const ladderContext = () => {
  const profile = getProfile();
  const track = profile.track in ladder.tracks ? profile.track : "IC";
  const expectations = ladder.competencies
    .map((c) => `- ${c}: ${ladderText(track, profile.target_level, c)}`)
    .join("\n");
  return { profile, expectations };
};

/** Is this message an ask aimed at the profile user, and would doing it count toward her promotion? */
export const classifyAsk = async (
  text: string,
  asker: string,
): Promise<AskClassification> => {
  const { profile, expectations } = ladderContext();
  const { object } = await generateObject({
    model: anthropic(MODEL_ID),
    schema: AskSchema,
    maxOutputTokens: 4000,
    providerOptions: { anthropic: { effort: CLASSIFY_EFFORT } },
    system:
      "You classify Slack messages for Madrina, a career coach. You decide whether a message asks the profile user to do something and whether that work is promotable against the ladder. Glue work (coordination, notes, onboarding, event planning, handoffs) is valuable but rarely promotable on its own. Never infer anyone's gender.",
    prompt: `Profile user (synthetic): ${profile.name}, ${profile.current_level} engineer on ${profile.team}, going for ${profile.target_level} (${profile.track} track).
${profile.target_level} expectations:
${expectations}

Message from ${asker}, posted in a private channel she shares with them:
"""${text}"""`,
  });
  return object;
};

const draftContext = (a: GlueAsk) => {
  const profile = getProfile(a.profileId);
  const focus = computeFocus(a.profileId);
  const gaps = getGaps(profile)
    .slice(0, 3)
    .map(
      (g) =>
        `${g.competency} (${profile.target_level} expects: ${g.expectation})`,
    );
  return `Profile (synthetic): ${profile.name}, ${profile.current_level} on ${profile.team}, going for ${profile.target_level}.
Manager's stated priority for her promo case: ${focus.priority}.
Top gaps: ${gaps.join("; ")}.
The ask, from ${a.askerName}${a.askerRole ? ` (${a.askerRole})` : ""}: """${a.text}"""`;
};

const DRAFT_RULES =
  "Write it in first person as her, 2 to 4 sentences, friendly and confident, not apologetic. Refer to the asker by name, never with gendered pronouns. Output only the message body, no quotes, no preamble. Use only facts in the context above: no invented dates, deadlines, numbers, events, or past work.";

/** A reply that hands the ask off: a rotation, or another owner. */
export const draftHandOff = (a: GlueAsk) =>
  askClaude({
    system: `${MADRINA_VOICE}\n\nTask: draft a reply she can post to the ask herself. Decline owning it this time without refusing to help: propose a rotation for this kind of task, or a specific way to pick another owner, and say what she's focused on instead (the manager's stated priority). ${DRAFT_RULES}`,
    prompt: draftContext(a),
  });

/** A reply that says yes, in exchange for something visible tied to her gaps. */
export const draftTrade = (a: GlueAsk) =>
  askClaude({
    system: `${MADRINA_VOICE}\n\nTask: draft a reply she can post that offers a trade: she will take a small, bounded part of the ask (or hand it off after this once), and in exchange asks for one visible, promotable thing tied to her top gap and the manager's priority, like presenting her work at the same event. Make the exchange concrete. ${DRAFT_RULES}`,
    prompt: draftContext(a),
  });
