// In-memory state for the demo. No database: this resets when the server restarts.
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

/** DM channel + thread of the last focus check, so replies there can be read as wins. */
const lastCheckin = new Map<string, { channel: string; ts: string }>();

export const setLastCheckin = (userId: string, channel: string, ts: string) =>
  lastCheckin.set(userId, { channel, ts });
export const getLastCheckin = (userId: string) => lastCheckin.get(userId);

/** Last Slack user who used Madrina, so the cron knows whom to check in with. */
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
