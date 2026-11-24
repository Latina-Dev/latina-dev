import type {
  AllMiddlewareArgs,
  BlockAction,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import type { KnownBlock } from "@slack/web-api";

export const FEEDBACK_ACTION = "madrina_reply_feedback";

/** 👍 / 👎 under a coaching reply (Slack's AI feedback buttons). */
export const feedbackBlock = (): KnownBlock => ({
  type: "context_actions",
  elements: [
    {
      type: "feedback_buttons",
      action_id: FEEDBACK_ACTION,
      positive_button: {
        text: { type: "plain_text", text: "👍" },
        value: "positive",
        accessibility_label: "This advice helped",
      },
      negative_button: {
        text: { type: "plain_text", text: "👎" },
        value: "negative",
        accessibility_label: "This advice missed",
      },
    },
  ],
});

const THANKS = {
  positive: ":seedling: Glad that helped. Keep going.",
  negative:
    ":compass: Thanks for telling me. Reply in this thread with what missed and I'll try again.",
} as const;

/** Ack fast, then a private thank-you in the same thread. */
export const handleFeedback = async ({
  ack,
  body,
  client,
  logger,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();
  const value = (body.actions[0] as { value?: string } | undefined)?.value;
  const channel = body.channel?.id;
  const thread_ts = body.message?.thread_ts ?? body.message?.ts;
  logger.info(`reply feedback: ${value} from ${body.user.id}`);
  if (!channel || (value !== "positive" && value !== "negative")) return;
  try {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: THANKS[value],
      thread_ts,
    });
  } catch (error) {
    logger.error("feedback ephemeral failed:", error);
  }
};
