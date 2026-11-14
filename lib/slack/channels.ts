// Slack channels whose messages are copied to latina.dev, and who may hide messages from the site.
// Each sync reads its channel id from the environment, so ids stay out of the repo.

export interface SyncedChannel {
  key: string;
  name: string; // as members see it in Slack
  envVar: string; // holds the channel id, e.g. C0123456789
  publishesTo: string; // path on latina.dev
}

export const syncedChannels = {
  questions: {
    key: "questions",
    name: "#ask",
    envVar: "SLACK_QUESTIONS_CHANNEL_ID",
    publishesTo: "/questions",
  },
} as const satisfies Record<string, SyncedChannel>;

/**
 * Slack user ids of organizers whose 🚫 reaction takes a message off the site. Kept apart from
 * SLACK_APPROVER_IDS, who approve profiles, so moderating can be shared without approving
 * @param list comma-separated Slack user ids
 */
export const moderatorIds = (list = process.env.SLACK_MODERATOR_IDS ?? "") =>
  new Set(
    list
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

/** Whether a Slack user is an organizer who can hide messages */
export const isModerator = (userId: string, moderators = moderatorIds()) => moderators.has(userId);
