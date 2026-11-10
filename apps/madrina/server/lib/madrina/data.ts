// Synthetic demo data. Everything in /data is made up.
import activity from "../../../data/activity.json";
import coaches from "../../../data/coaches.json";
import feedback from "../../../data/feedback.json";
import ladder from "../../../data/ladder.json";
import profiles from "../../../data/profiles.json";
import resources from "../../../data/resources.json";

export type Profile = (typeof profiles)[number];
export type Resource = (typeof resources.resources)[number];
export type Competency = string;

export { activity, coaches, feedback, ladder, resources };

/** For the demo, whoever opens Madrina is Ana. */
export const DEMO_PROFILE_ID = "ana";

export const getProfile = (id = DEMO_PROFILE_ID): Profile => {
  const profile = profiles.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown profile ${id}`);
  return profile;
};

const LEVEL_ORDER: Record<string, string[]> = {
  IC: ["Senior", "Staff", "Principal"],
  Management: ["Senior", "Engineering Manager", "Senior Engineering Manager"],
};

const levelRank = (track: string, level: string) =>
  (LEVEL_ORDER[track] ?? LEVEL_ORDER.IC).indexOf(level);

export const ladderText = (
  track: string,
  level: string,
  competency: string,
) => {
  const tracks = ladder.tracks as Record<
    string,
    Record<string, Record<string, string>>
  >;
  return tracks[track]?.[level]?.[competency] ?? "";
};

export type Gap = {
  competency: Competency;
  current: string;
  target: string;
  size: number;
  /** What the target level expects for this competency. */
  expectation: string;
  /** Does the manager's focus map call this out? */
  managerFocus: boolean;
};

/** Competencies where her self-assessment is below the target level, biggest first. */
export const getGaps = (profile: Profile = getProfile()): Gap[] => {
  const track = profile.track in LEVEL_ORDER ? profile.track : "IC";
  const targetRank = levelRank(track, profile.target_level);
  const focus =
    feedback
      .find((f) => f.profile_id === profile.id)
      ?.focus_map.flatMap((f) => f.competencies) ?? [];
  const selfAssessment = profile.self_assessment as Record<string, string>;

  return ladder.competencies
    .map((competency) => {
      const current = selfAssessment[competency] ?? profile.current_level;
      const size = targetRank - levelRank(track, current);
      return {
        competency,
        current,
        target: profile.target_level,
        size,
        expectation: ladderText(track, profile.target_level, competency),
        managerFocus: focus.includes(competency),
      };
    })
    .filter((g) => g.size > 0)
    .sort((a, b) => {
      if (b.size !== a.size) return b.size - a.size;
      // Tie-break: the manager's stated focus first, in the order she listed it.
      const ai = focus.indexOf(a.competency);
      const bi = focus.indexOf(b.competency);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
};

/** One resource from the curated shelf, matched to her biggest gap. */
export const matchResource = (
  profile: Profile = getProfile(),
  gap = getGaps(profile)[0],
): Resource | undefined => {
  const shelf = resources.resources;
  const fits = (r: Resource) => r.tracks.includes(profile.track);
  const atLevel = (r: Resource) =>
    r.levels.includes(profile.target_level) ||
    r.levels.includes(profile.current_level);
  const forGap = (r: Resource) =>
    gap ? r.competencies.includes(gap.competency) : true;
  return (
    shelf.find((r) => fits(r) && atLevel(r) && forGap(r)) ??
    shelf.find((r) => fits(r) && forGap(r)) ??
    shelf.find(fits)
  );
};

export type ShelfItem = { resource: Resource; gap?: Gap };

/** Resources on her track that speak to one of her top gaps, biggest gap first, then the rest of her track. */
export const matchedShelf = (profile: Profile = getProfile()): ShelfItem[] => {
  const gaps = getGaps(profile).slice(0, 3);
  const onTrack = resources.resources.filter((r) =>
    r.tracks.includes(profile.track),
  );
  const seen = new Set<string>();
  const items: ShelfItem[] = [];
  for (const gap of gaps) {
    for (const r of onTrack) {
      if (!seen.has(r.title) && r.competencies.includes(gap.competency)) {
        seen.add(r.title);
        items.push({ resource: r, gap });
      }
    }
  }
  return items.length ? items : onTrack.map((resource) => ({ resource }));
};
