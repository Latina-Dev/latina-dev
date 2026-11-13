// Glue work: asks that keep the team running but don't count toward promotion.
// Seeded backstory lives in data/profiles.json; asks she accepts in Slack are kept in memory.
import { getProfile } from "./data";

export type GlueItem = { title: string; date: string; where?: string };

/** An ask Madrina flagged, kept so the buttons can act on it. */
export type GlueAsk = {
  id: string;
  profileId: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  /** Slack user to show the ephemeral to (the profile user). */
  userId: string;
  /** Who asked, as Madrina should name them. */
  askerName: string;
  askerRole?: string;
  text: string;
  /** The ask in a few words, from the classifier. */
  ask: string;
  reason: string;
  competency: string | null;
};

const asks = new Map<string, GlueAsk>();
export const saveGlueAsk = (a: GlueAsk) => asks.set(a.id, a);
export const getGlueAsk = (id: string) => asks.get(id);

const accepted = new Map<string, GlueItem[]>();

/** Glue work she said yes to in Slack. */
export const acceptGlue = (profileId: string, item: GlueItem) => {
  accepted.set(profileId, [...(accepted.get(profileId) ?? []), item]);
};

/** Everything on record: seeded backstory first, then what she accepted in Slack. */
export const listGlue = (profileId = getProfile().id): GlueItem[] => [
  ...(getProfile(profileId).glue_work as GlueItem[]),
  ...(accepted.get(profileId) ?? []),
];

/** Slack retries events it thinks we missed. Remember what we've already looked at. */
const seen = new Set<string>();
export const firstTimeSeen = (key: string) => {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
};

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
