import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { askCoach } from "~/lib/ai/coach";
import { feedbackBlock } from "~/lib/slack/feedback";
import { markdownToBlocks } from "~/lib/slack/format";

const appMentionCallback = async ({
  event,
  say,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"app_mention">) => {
  const thread_ts = event.thread_ts || event.ts;
  const question = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();
  try {
    const reply = await askCoach(question, event.user);
    await say({
      text: reply,
      blocks: [...markdownToBlocks(reply), feedbackBlock()],
      thread_ts,
    });
  } catch (error) {
    logger.error("app_mention handler failed:", error);
    await say({
      text: "Sorry, I hit a snag. Try me again in a moment?",
      thread_ts,
    });
  }
};

export default appMentionCallback;
