import { activity, feedback, getProfile } from "./data";

/** Which repo counts as which project (synthetic). */
const PROJECT_REPOS: Record<string, string[]> = {
  Gateway: ["api-gateway"],
  Billing: ["billing-service"],
};

/** Public channels where each project's asks should live (matches data/slack-seed.json). */
const PROJECT_CHANNELS: Record<string, string> = {
  Gateway: "proj-gateway-migration",
  Billing: "team-billing",
};
export const channelFor = (project: string) =>
  PROJECT_CHANNELS[project] ?? `${project.toLowerCase()}-requests`;

const repoProject = (repo: string) =>
  Object.entries(PROJECT_REPOS).find(([, repos]) =>
    repos.includes(repo),
  )?.[0] ?? repo;

export type FocusReport = {
  priority: string;
  priorityCompetencies: string[];
  managerNotes: string;
  feedbackSource: string;
  totalPrs: number;
  priorityPrs: number;
  /** The project most PRs went to instead. */
  topOther: string;
  topOtherPrs: number;
  /** How many of the topOther PRs were requested by DM. */
  topOtherByDm: number;
  /** Share of PRs that did not go to the priority. 0 to 1. */
  drift: number;
  glue: string[];
  prs: { repo: string; title: string; requested_by: string; project: string }[];
};

export const computeFocus = (profileId = getProfile().id): FocusReport => {
  const fb = feedback.find((f) => f.profile_id === profileId);
  if (!fb) throw new Error(`No feedback for ${profileId}`);
  const top = [...fb.focus_map].sort((a, b) => b.weight - a.weight)[0];

  const prs = activity.pull_requests.map((pr) => ({
    ...pr,
    project: repoProject(pr.repo),
  }));
  const priorityPrs = prs.filter((p) => p.project === top.project).length;

  const counts = new Map<string, number>();
  for (const p of prs)
    if (p.project !== top.project)
      counts.set(p.project, (counts.get(p.project) ?? 0) + 1);
  const [topOther = "other work", topOtherPrs = 0] =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const topOtherByDm = prs.filter(
    (p) => p.project === topOther && p.requested_by.startsWith("DM"),
  ).length;

  return {
    priority: top.project,
    priorityCompetencies: top.competencies,
    managerNotes: fb.notes,
    feedbackSource: fb.source,
    totalPrs: prs.length,
    priorityPrs,
    topOther,
    topOtherPrs,
    topOtherByDm,
    drift: prs.length ? (prs.length - priorityPrs) / prs.length : 0,
    glue: activity.other_work
      .filter((w) => w.type === "glue")
      .map((w) => w.title),
    prs,
  };
};

/** Plain-text summary for Claude prompts. */
export const focusSummary = (f: FocusReport) =>
  [
    `Manager feedback (${f.feedbackSource}): "${f.managerNotes}"`,
    `Top priority: ${f.priority} (competencies: ${f.priorityCompetencies.join(", ")}).`,
    `This week: ${f.topOtherPrs} of ${f.totalPrs} PRs went to ${f.topOther}; ${f.priorityPrs} went to ${f.priority}. ${f.topOtherByDm} of the ${f.topOther} PRs were requested by DM.`,
    `PRs:\n${f.prs.map((p) => `- [${p.project}] ${p.title} (requested by: ${p.requested_by})`).join("\n")}`,
    f.glue.length ? `Glue work this week: ${f.glue.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
