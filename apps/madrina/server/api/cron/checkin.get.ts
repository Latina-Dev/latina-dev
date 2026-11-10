import { timingSafeEqual } from "node:crypto";
import { WebClient } from "@slack/web-api";
import { listSubscribers, unsubscribe } from "~/lib/madrina/subscribers";
import { runFocusCheck } from "~/lib/slack/checkin";

/** Slack errors that mean this person can never be DMed again, so stop trying. */
const GONE = new Set(["user_not_found", "account_inactive", "user_disabled"]);

const slackError = (error: unknown): string =>
  (error as { data?: { error?: string } })?.data?.error ??
  (error instanceof Error ? error.message : "unknown_error");

const sameSecret = (given: string | undefined, expected: string) => {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Vercel Cron hits this weekly, Fridays at 23:00 UTC (vercel.json), and sends the focus check
 * to everyone who turned on weekly check-ins in App Home. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET;
  if (
    !secret ||
    !sameSecret(getHeader(event, "authorization"), `Bearer ${secret}`)
  ) {
    setResponseStatus(event, 401);
    return { ok: false, error: "unauthorized" };
  }

  const users = await listSubscribers();
  if (!users.length) {
    return {
      ok: true,
      sent: 0,
      failed: 0,
      skipped:
        "Nobody has opted in yet. Turn on weekly check-ins in Madrina's Home tab.",
    };
  }

  const token = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_CLI_XOXB;
  // The default policy retries for about half an hour, far past a function's time limit.
  const client = new WebClient(token, {
    retryConfig: { retries: 2 },
    timeout: 10_000,
  });

  // One at a time: a slow or failed DM for one person must not stop the rest, and it keeps
  // us well inside Slack's rate limits.
  let sent = 0;
  const failures: { user: string; error: string }[] = [];
  for (const user of users) {
    try {
      await runFocusCheck(client, user);
      sent += 1;
    } catch (error) {
      const code = slackError(error);
      failures.push({ user, error: code });
      if (GONE.has(code)) await unsubscribe(user).catch(() => {});
    }
  }

  if (failures.length)
    console.error("[madrina] weekly check-in failures:", failures);
  return { ok: failures.length === 0, sent, failed: failures.length, failures };
});
