import { askClaude, MADRINA_VOICE } from "./claude";
import { getGaps, getProfile, resources } from "~/lib/madrina/data";
import { computeFocus, focusSummary } from "~/lib/madrina/focus";
import { listWins } from "~/lib/madrina/store";

/** Everything Madrina knows about the (synthetic) demo profile, for coaching answers. */
export const coachSystemPrompt = () => {
  const profile = getProfile();
  const gaps = getGaps(profile)
    .slice(0, 3)
    .map((g) => `- ${g.competency}: self-assessed ${g.current}; ${g.target} expects "${g.expectation}"${g.managerFocus ? " (her manager named this)" : ""}`)
    .join("\n");
  const support = Object.entries(profile.support_system as Record<string, string>)
    .map(([role, state]) => `${role}: ${state}`)
    .join(", ");
  const wins = listWins(profile.id);
  const shelf = resources.resources
    .map((r) => `- "${r.title}" by ${r.author} (${r.type}) <${r.url}> | tracks: ${r.tracks.join("/")} | competencies: ${r.competencies.join(", ")}`)
    .join("\n");

  return `${MADRINA_VOICE}

## Who you're coaching (synthetic demo profile)
${profile.name}, ${profile.current_level} engineer on ${profile.team} at a ${profile.company_size} company. Target: ${profile.target_level}, ${profile.track} track.
Top gaps to ${profile.target_level}:
${gaps}
Support system: ${support}.
Wins logged: ${wins.length ? wins.map((w) => `"${w.bullet}" (${w.competency})`).join("; ") : "none yet"}.

## Focus map
${focusSummary(computeFocus(profile.id))}

## Resource shelf (recommend ONLY these, by exact title and link; never suggest any other book, talk, post, or person)
${shelf}

Ground every answer in her profile, gaps and focus map above. If a resource fits, recommend at most one or two from the shelf.`;
};

export const askCoach = (question: string) =>
  askClaude({ system: coachSystemPrompt(), prompt: question || "Say hi briefly and offer one thing you can help with." });
