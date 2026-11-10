import type { App, BlockAction } from "@slack/bolt";
import { ACTIONS, confirmOnPurpose, draftManagerNote, planNextWeek, runFocusCheck } from "~/lib/slack/checkin";
import { publishHome, RUN_CHECKIN_ACTION, SHELF_NEXT_ACTION } from "~/lib/slack/home";
import { FEEDBACK_ACTION, handleFeedback } from "~/lib/slack/feedback";
import { EXPORT_BRAG_ACTION, exportBragDoc } from "~/lib/slack/brag";
import { acceptGlueAsk, GLUE_ACTIONS, getGlueAsk, handOffReply, tradeForVisible } from "~/lib/slack/glue";
import { nextShelfCursor, rememberDemoUser } from "~/lib/madrina/store";

type GlueHandler = (respond: Parameters<typeof handOffReply>[0], ask: NonNullable<ReturnType<typeof getGlueAsk>>) => Promise<void>;

const glueHandler = (fn: GlueHandler) =>
  (async ({ ack, body, client, respond, logger }) => {
    await ack();
    const b = body as BlockAction;
    const action = b.actions[0];
    const ask = getGlueAsk(action && "value" in action ? (action.value ?? "") : "");
    if (!ask) {
      await respond({ replace_original: true, text: "I lost track of that ask (I restarted). Post it again and I'll take another look." });
      return;
    }
    try {
      await fn(respond as Parameters<typeof handOffReply>[0], ask);
      if (action?.action_id === GLUE_ACTIONS.accept) await publishHome(client, b.user.id);
    } catch (error) {
      logger.error(`${action?.action_id} failed:`, error);
    }
  }) satisfies Parameters<App["action"]>[1];

type Handler = (client: Parameters<typeof draftManagerNote>[0], channel: string, ts: string) => Promise<void>;

const threadHandler = (fn: Handler) =>
  (async ({ ack, body, client, logger }) => {
    await ack();
    const b = body as BlockAction;
    const channel = b.channel?.id;
    const ts = b.message?.thread_ts ?? b.message?.ts;
    if (!channel || !ts) return;
    try {
      await fn(client, channel, ts);
    } catch (error) {
      logger.error(`${b.actions[0]?.action_id} failed:`, error);
    }
  }) satisfies Parameters<App["action"]>[1];

const register = (app: App) => {
  app.action(RUN_CHECKIN_ACTION, async ({ ack, body, client, logger }) => {
    await ack();
    rememberDemoUser(body.user.id);
    try {
      await runFocusCheck(client, body.user.id);
    } catch (error) {
      logger.error("run_weekly_checkin failed:", error);
    }
  });
  app.action(EXPORT_BRAG_ACTION, async ({ ack, body, client, logger }) => {
    await ack();
    rememberDemoUser(body.user.id);
    await exportBragDoc(client, body.user.id).catch((e) => logger.error("export_brag_doc failed:", e));
  });
  app.action(SHELF_NEXT_ACTION, async ({ ack, body, client, logger }) => {
    await ack();
    nextShelfCursor(body.user.id);
    await publishHome(client, body.user.id).catch((e) => logger.error("shelf_next failed:", e));
  });
  // URL buttons still send an action; ack it so Slack doesn't show an error.
  app.action("open_one_on_one", async ({ ack }) => {
    await ack();
  });
  app.action("shelf_open", async ({ ack }) => {
    await ack();
  });
  app.action(ACTIONS.draftNote, threadHandler(draftManagerNote));
  app.action(ACTIONS.planWeek, threadHandler(planNextWeek));
  app.action(ACTIONS.onPurpose, threadHandler(confirmOnPurpose));
  app.action(FEEDBACK_ACTION, handleFeedback);
  app.action(GLUE_ACTIONS.handOff, glueHandler(handOffReply));
  app.action(GLUE_ACTIONS.trade, glueHandler(tradeForVisible));
  app.action(GLUE_ACTIONS.accept, glueHandler(acceptGlueAsk));
};

export default { register };
