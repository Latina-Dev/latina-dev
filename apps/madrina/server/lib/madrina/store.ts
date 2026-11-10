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

const wins = new Map<string, Win[]>();

// A month of synthetic wins for Ana so the brag-doc export has something to show.
// MADRINA_SEED_WINS=0 starts with an empty store instead.
if (process.env.MADRINA_SEED_WINS !== "0") {
  wins.set(
    winsSeed.profile_id,
    winsSeed.wins.map((w) => ({ ...w })),
  );
}

export const listWins = (profileId: string): Win[] => wins.get(profileId) ?? [];

export const addWin = (profileId: string, win: Win) => {
  wins.set(profileId, [...listWins(profileId), win]);
};

/** Last Slack user who used Madrina: in the demo workspace, that person is treated as Ana. */
let demoUser: string | undefined = process.env.MADRINA_DEMO_USER_ID;
export const rememberDemoUser = (userId: string) => {
  demoUser = userId;
};
export const getDemoUser = () => process.env.MADRINA_DEMO_USER_ID ?? demoUser;

/** Which shelf card each user is looking at in App Home. */
const shelfCursor = new Map<string, number>();
export const getShelfCursor = (userId: string) => shelfCursor.get(userId) ?? 0;
export const nextShelfCursor = (userId: string) =>
  shelfCursor.set(userId, getShelfCursor(userId) + 1);
