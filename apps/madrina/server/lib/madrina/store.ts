// In-memory state for the synthetic demo profile. This resets when the server restarts.
// Weekly check-in opt-ins and check-in threads are saved for real in ./subscribers.ts.
import winsSeed from "../../../data/wins-seed.json";

export type Win = {
  raw: string;
  bullet: string;
  competency: string;
  at: string;
  /** True for the synthetic demo seed in data/wins-seed.json. */
  _synthetic?: boolean;
};

/** Synthetic seed wins, by profile. Everyone sees these: they are demo data. */
const seedWins = new Map<string, Win[]>();
/** Wins a real person logged, by Slack user ID. Only that person sees them. */
const userWins = new Map<string, Win[]>();

// A month of synthetic wins for Ana so the brag-doc export has something to show.
// MADRINA_SEED_WINS=0 starts with an empty store instead.
if (process.env.MADRINA_SEED_WINS !== "0") {
  seedWins.set(
    winsSeed.profile_id,
    winsSeed.wins.map((w) => ({ ...w })),
  );
}

/** The profile's synthetic wins, plus the wins this Slack user logged (when one is given). */
export const listWins = (profileId: string, userId?: string): Win[] => [
  ...(seedWins.get(profileId) ?? []),
  ...((userId && userWins.get(userId)) || []),
];

export const addWin = (userId: string, win: Win) => {
  userWins.set(userId, [...(userWins.get(userId) ?? []), win]);
};

/**
 * First Slack user who used Madrina: in the demo workspace, that person is treated as Ana.
 * It stays fixed after that, so a second person opening Madrina can't redirect Ana's
 * glue-work flags to themselves. MADRINA_DEMO_USER_ID wins when it is set.
 */
let demoUser: string | undefined = process.env.MADRINA_DEMO_USER_ID;
export const rememberDemoUser = (userId: string) => {
  demoUser ??= userId;
};
export const getDemoUser = () => process.env.MADRINA_DEMO_USER_ID ?? demoUser;

/** Which shelf card each user is looking at in App Home. */
const shelfCursor = new Map<string, number>();
export const getShelfCursor = (userId: string) => shelfCursor.get(userId) ?? 0;
export const nextShelfCursor = (userId: string) =>
  shelfCursor.set(userId, getShelfCursor(userId) + 1);
