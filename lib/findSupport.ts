// The "Find support" picker on /find-support: a Latina engineer says where she is in her career
// and what she needs, and gets matching resources, guides, mentors and community answers. No file
// reads here, so the page's client component can run the matching in the browser.

import { resourceStages, resourceTypes } from "@/types/resources";

type ResourceStage = (typeof resourceStages)[number];
type ResourceType = (typeof resourceTypes)[number];

export const supportStages = [
  { id: "k-12", label: "In middle or high school", stage: "K-12", guides: ["k-12-students"] },
  { id: "college", label: "In college", stage: "College", guides: ["workplace-advice"] },
  {
    id: "working",
    label: "Working as an engineer",
    stage: "Workplace",
    guides: ["workplace-advice", "erg-work-and-promotion"],
  },
  {
    id: "leading",
    label: "Leading a team",
    stage: "Leadership",
    guides: ["workplace-advice", "erg-work-and-promotion", "hiring-diverse-engineers"],
  },
  { id: "founding", label: "Starting a company", stage: "Founders", guides: [] },
] as const satisfies readonly {
  id: string;
  label: string;
  stage: ResourceStage;
  guides: readonly string[];
}[];

export const supportNeeds = [
  {
    id: "community",
    label: "People who get it",
    types: ["Community", "Professional association"],
  },
  { id: "mentor", label: "A mentor", types: ["Program", "Community"], mentors: true },
  { id: "job", label: "A job", types: ["Job board", "Directory"] },
  {
    id: "programs",
    label: "Programs and scholarships",
    types: ["Program", "Scholarship", "Accelerator"],
  },
  { id: "events", label: "Events and conferences", types: ["Conference"] },
  {
    id: "read",
    label: "Things to read or listen to",
    types: ["Newsletter", "Podcast", "Report", "Guide"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  types: readonly ResourceType[];
  mentors?: boolean;
}[];

export type SupportStageId = (typeof supportStages)[number]["id"];
export type SupportNeedId = (typeof supportNeeds)[number]["id"];

interface SupportResource {
  name: string;
  url: string;
  description: string;
  types: string[];
  stages: string[];
  page: string; // where it's listed on latina.dev
}

export interface SupportData {
  resources: SupportResource[];
  guides: { slug: string; title: string; path: string; description: string }[];
  mentors: { name: string; path: string; level: string; affiliation?: string }[];
  questions: { title: string; path: string }[];
}

export const isStageId = (value: unknown): value is SupportStageId =>
  supportStages.some((stage) => stage.id === value);

export const isNeedId = (value: unknown): value is SupportNeedId =>
  supportNeeds.some((need) => need.id === value);

/**
 * What to show for a stage and a need
 * @param data everything the page can suggest
 * @param stageId where she is in her career
 * @param needId what she's looking for
 * @returns resources tagged with both the stage and one of the need's types (or, when none are,
 *   with one of the types at any stage, marked `broadened`), plus guides, mentors and questions
 */
export const matchSupport = (data: SupportData, stageId: SupportStageId, needId: SupportNeedId) => {
  const stage = supportStages.find((s) => s.id === stageId)!;
  const need = supportNeeds.find((n) => n.id === needId)!;
  const types = new Set<string>(need.types);
  const ofType = data.resources.filter((resource) => resource.types.some((t) => types.has(t)));
  const exact = ofType.filter((resource) => resource.stages.includes(stage.stage));
  const guideSlugs = new Set<string>(stage.guides);

  const wantsMentor = "mentors" in need && need.mentors;
  // Leaders first for people leading a team; otherwise everyone open to mentoring, by name
  const mentors = wantsMentor
    ? [...data.mentors].sort(
        (a, b) =>
          Number(stageId === "leading" && b.level === "Leader") -
            Number(stageId === "leading" && a.level === "Leader") || a.name.localeCompare(b.name)
      )
    : [];

  return {
    stage,
    need,
    resources: exact.length ? exact : ofType,
    broadened: !exact.length && ofType.length > 0,
    guides: data.guides.filter((guide) => guideSlugs.has(guide.slug)),
    mentors,
    questions: data.questions.slice(0, 3),
  };
};
