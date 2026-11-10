import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getProfile, ladder, ladderText } from "~/lib/madrina/data";
import { listWins, type Win } from "~/lib/madrina/store";
import { EFFORT, MODEL_ID } from "./claude";

const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
const anthropic = createAnthropic({
  headers: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
});

export type BragSection = {
  competency: string;
  expectation: string;
  summary: string;
  wins: Win[];
};
export type BragGap = { competency: string; expectation: string; idea: string };
export type BragDoc = {
  title: string;
  markdown: string;
  sections: BragSection[];
  gaps: BragGap[];
  winCount: number;
};

const BragSchema = z.object({
  summaries: z
    .array(
      z.object({
        competency: z.string(),
        summary: z
          .string()
          .describe(
            "One sentence under 35 words, third person, summarizing what her logged wins for this competency show against the target-level expectation. Only facts from those wins.",
          ),
      }),
    )
    .describe("One entry per competency that has wins, in the order given."),
  gap_ideas: z
    .array(
      z.object({
        competency: z.string(),
        idea: z
          .string()
          .describe(
            "One sentence under 25 words, addressed to her as 'you': a concrete way to get evidence for this competency next month. A suggestion, never a claim about work she did.",
          ),
      }),
    )
    .describe("One entry per gap competency, in the order given."),
});

/** Number tokens in a string, without sentence punctuation stuck to the end ("30." becomes "30"). */
const numbersIn = (s: string) =>
  (s.match(/\d[\d,.%]*/g) ?? []).map((n) => n.replace(/[.,]+$/, ""));

/** Keep Claude's summary only if every number in it already appears in her wins. */
const guardSummary = (summary: string | undefined, wins: Win[]) => {
  const source = wins.map((w) => `${w.raw} ${w.bullet}`).join(" ");
  const fallback = `${wins.length} logged ${wins.length === 1 ? "win" : "wins"} for this competency.`;
  if (!summary?.trim()) return fallback;
  // Whole tokens only, so a made-up "3" can't pass because the wins mention "30".
  const known = new Set(
    numbersIn(source).flatMap((n) => [n, n.replace(/%$/, "")]),
  );
  return numbersIn(summary).every((n) => known.has(n))
    ? summary.trim()
    : fallback;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Group her logged wins by ladder competency and write a brag doc. Only logged wins count as evidence. */
export const buildBragDoc = async (profileId?: string): Promise<BragDoc> => {
  const profile = getProfile(profileId);
  const track = profile.track in ladder.tracks ? profile.track : "IC";
  const wins = listWins(profile.id);
  const expectation = (c: string) => ladderText(track, profile.target_level, c);

  const grouped = ladder.competencies
    .map((competency) => ({
      competency,
      expectation: expectation(competency),
      wins: wins.filter((w) => w.competency === competency),
    }))
    .filter((g) => g.wins.length);
  const gapCompetencies = ladder.competencies.filter(
    (c) => !grouped.some((g) => g.competency === c),
  );

  let object: z.infer<typeof BragSchema> = { summaries: [], gap_ideas: [] };
  if (grouped.length || gapCompetencies.length) {
    ({ object } = await generateObject({
      model: anthropic(MODEL_ID),
      schema: BragSchema,
      maxOutputTokens: 8000,
      providerOptions: { anthropic: { effort: EFFORT } },
      system:
        "You are Madrina, a career coach for women software engineers, writing the summary lines of a brag doc for a promotion packet. Use only the logged wins you are given. Never invent metrics, numbers, names, teams, systems or outcomes. If the wins are thin, say less. Plain words, no em or en dashes, no hype words (crucial, pivotal, leverage, robust, seamless). Never infer anyone's gender.",
      prompt: `${profile.name} (synthetic) is a ${profile.current_level} engineer on ${profile.team}, going for ${profile.target_level} (${profile.track}).

Competencies with logged wins:
${grouped
  .map(
    (g) =>
      `## ${g.competency}\n${profile.target_level} expects: ${g.expectation}\nWins:\n${g.wins.map((w) => `- ${w.bullet}`).join("\n")}`,
  )
  .join("\n\n")}

Competencies with no logged wins yet (gaps):
${gapCompetencies.map((c) => `- ${c}: ${profile.target_level} expects "${expectation(c)}"`).join("\n") || "(none)"}`,
    }));
  }

  const sections: BragSection[] = grouped.map((g) => ({
    ...g,
    summary: guardSummary(
      object.summaries.find((s) => s.competency === g.competency)?.summary,
      g.wins,
    ),
  }));
  const gaps: BragGap[] = gapCompetencies.map((competency) => ({
    competency,
    expectation: expectation(competency),
    idea:
      object.gap_ideas.find((i) => i.competency === competency)?.idea?.trim() ??
      "",
  }));

  const dates = wins.map((w) => w.at).sort();
  const span = dates.length
    ? `${fmtDate(dates[0])} to ${fmtDate(dates[dates.length - 1])}`
    : "no wins yet";
  const title = `${profile.name}: brag doc for ${profile.target_level}`;
  const anySynthetic = wins.some((w) => w._synthetic);

  // No `# title` line: the canvas title already shows it as the header.
  const lines: string[] = [
    `${profile.current_level} → ${profile.target_level} · ${profile.track} track · ${profile.team}`,
    `${wins.length} logged ${wins.length === 1 ? "win" : "wins"}, ${span}. Every line below comes from a win you logged with Madrina. Edit anything, then share it with whoever you choose.`,
    "",
  ];
  for (const s of sections) {
    lines.push(
      `## ${s.competency}`,
      `**${s.summary}**`,
      `> ${profile.target_level} expects: ${s.expectation}`,
      ...s.wins.map((w) => `- ${w.bullet} _(${fmtDate(w.at)})_`),
      "",
    );
  }
  if (gaps.length) {
    lines.push(
      `## Gaps to work on`,
      `No logged evidence yet for these ${profile.target_level} competencies.`,
    );
    for (const g of gaps) {
      lines.push(
        `- **${g.competency}**: ${g.expectation}.${g.idea ? ` ${g.idea}` : ""}`,
      );
    }
    lines.push("");
  }
  lines.push(
    "---",
    anySynthetic
      ? "Demo data: Ana Rivera and these wins are synthetic. Drafted by Madrina from logged wins only, with no added metrics."
      : "Drafted by Madrina from your logged wins only, with no added metrics.",
  );

  return {
    title,
    markdown: lines.join("\n"),
    sections,
    gaps,
    winCount: wins.length,
  };
};
