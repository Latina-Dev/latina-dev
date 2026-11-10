import { WebClient } from "@slack/web-api";
import { getDemoUser } from "~/lib/madrina/store";
import { runFocusCheck } from "~/lib/slack/checkin";

/**
 * Vercel Cron hits this weekly, Fridays at 23:00 UTC (vercel.json), and runs the same focus check
 * as the Home button. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET;
  const auth = getHeader(event, "authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    setResponseStatus(event, 401);
    return { ok: false, error: "unauthorized" };
  }

  const user = getDemoUser();
  if (!user) {
    return { ok: true, skipped: "No user yet. Open Madrina's Home tab once, or set MADRINA_DEMO_USER_ID." };
  }

  const token = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_CLI_XOXB;
  const client = new WebClient(token);
  const { channel, ts } = await runFocusCheck(client, user);
  return { ok: true, user, channel, ts };
});
