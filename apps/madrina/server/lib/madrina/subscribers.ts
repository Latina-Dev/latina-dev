// Saved state for the weekly check-in: who opted in, and each person's last check-in thread.
// Backed by Nitro storage (see plugins/storage.ts), so it survives restarts and is shared
// between the cron invocation and the Slack events invocation.

type Subscriber = { since: string };
export type LastCheckin = { channel: string; ts: string };

const store = () => useStorage("madrina");

/** Slack member IDs look like U012ABCDEF or W012ABCDEF. Anything else is not stored. */
const isSlackUserId = (userId: string) => /^[UW][A-Z0-9]{2,}$/.test(userId);

const subscriberKey = (userId: string) => `subscribers:${userId}`;
const checkinKey = (userId: string) => `last-checkin:${userId}`;

export const subscribe = async (userId: string) => {
  if (!isSlackUserId(userId)) return;
  await store().setItem<Subscriber>(subscriberKey(userId), {
    since: new Date().toISOString(),
  });
};

export const unsubscribe = async (userId: string) => {
  await store().removeItem(subscriberKey(userId));
};

export const isSubscribed = async (userId: string) =>
  isSlackUserId(userId) && (await store().hasItem(subscriberKey(userId)));

/**
 * Everyone the weekly cron should check in with: people who opted in from App Home, plus
 * MADRINA_DEMO_USER_ID when it is set (handy for a demo workspace).
 */
export const listSubscribers = async (): Promise<string[]> => {
  const keys = await store().getKeys("subscribers");
  const ids = keys.map((k) => k.slice(k.lastIndexOf(":") + 1));
  const demo = process.env.MADRINA_DEMO_USER_ID;
  if (demo) ids.push(demo);
  return [...new Set(ids.filter(isSlackUserId))].sort();
};

/** DM channel + thread of the last focus check, so replies there can be read as wins. */
export const setLastCheckin = async (
  userId: string,
  channel: string,
  ts: string,
) => {
  await store().setItem<LastCheckin>(checkinKey(userId), { channel, ts });
};

export const getLastCheckin = async (
  userId: string,
): Promise<LastCheckin | undefined> =>
  (await store().getItem<LastCheckin>(checkinKey(userId))) ?? undefined;
