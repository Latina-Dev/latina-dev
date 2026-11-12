import type { App } from "@slack/bolt";
import { askCoach } from "~/lib/ai/coach";
import { rewriteWin } from "~/lib/ai/wins";
import { DEMO_PROFILE_ID } from "~/lib/madrina/data";
import { addWin, listWins, rememberDemoUser } from "~/lib/madrina/store";
import { getLastCheckin } from "~/lib/madrina/subscribers";
import { feedbackBlock } from "~/lib/slack/feedback";
import { markdownToBlocks } from "~/lib/slack/format";
import { type GroupMessage, maybeFlagGlue } from "~/lib/slack/glue";
import { publishHome } from "~/lib/slack/home";

/** Messages already handled, so a Slack retry of the same event can't log a win twice. */
const handled = new Set<string>();
const firstDelivery = (channel: string, ts: string) => {
  const key = `${channel}:${ts}`;
  if (handled.has(key)) return false;
  handled.add(key);
  // Keep the set small: Slack only retries within a few minutes.
  if (handled.size > 500)
    handled.delete(handled.values().next().value as string);
  return true;
};

const register = (app: App) => {
  // Private channels Madrina was invited to (like Ana's 1:1 with her manager): flag glue-work asks.
  app.message(async ({ message, client, logger }) => {
    if (message.channel_type !== "group") return;
    try {
      await maybeFlagGlue(client, message as unknown as GroupMessage);
    } catch (error) {
      logger.error("Glue-work flag failed:", error);
    }
  });

  // Plain DMs to Madrina (Messages tab).
  app.message(async ({ message, say, logger, client }) => {
    if (message.channel_type !== "im") return;
    if (message.subtype || !("text" in message) || !message.text) return;
    if ("bot_id" in message && message.bot_id) return;
    if (!firstDelivery(message.channel, message.ts)) return;

    const thread_ts = "thread_ts" in message ? message.thread_ts : undefined;
    const user = "user" in message ? message.user : undefined;
    if (user) rememberDemoUser(user);

    try {
      // Log a win: a reply in the check-in thread, or a one-line DM that reads like a win.
      const checkin = user ? await getLastCheckin(user) : undefined;
      const inCheckinThread = !!thread_ts && checkin?.ts === thread_ts;
      const looksShort =
        message.text.length <= 280 && !message.text.trim().endsWith("?");
      if (inCheckinThread || looksShort) {
        const win = await rewriteWin(message.text, {
          assumeWin: inCheckinThread,
        });
        if (win.is_win && user) {
          addWin(user, {
            raw: message.text,
            bullet: win.bullet,
            competency: win.competency,
            at: new Date().toISOString(),
          });
          const count = listWins(DEMO_PROFILE_ID, user).length;
          const text = `:madrina-vouched: Logged. Here's your promo-ready bullet:\n> ${win.bullet}\n*${win.competency}*  ·  ${win.coach_note}`;
          await say({
            text,
            thread_ts,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `:madrina-vouched: *Logged. Here's your promo-ready bullet:*\n>${win.bullet}`,
                },
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `*${win.competency}*  ·  ${win.coach_note}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `${count} ${count === 1 ? "win" : "wins"} logged. Your Home tab is updated.`,
                  },
                ],
              },
            ],
          });
          await publishHome(client, user).catch((e) =>
            logger.warn("Home refresh failed", e),
          );
          return;
        }
      }

      const reply = await askCoach(message.text, user);
      await say({
        text: reply,
        blocks: [...markdownToBlocks(reply), feedbackBlock()],
        thread_ts,
      });
    } catch (error) {
      logger.error("DM handler failed:", error);
      await say("Sorry, I hit a snag. Try me again in a moment?");
    }
  });
};

export default { register };
