import { after } from "next/server";

import { approvePull, rejectPull } from "@/lib/profiles/github";
import {
  closeReviewMessage,
  isApprover,
  isValidSlackSignature,
  replyInThread,
} from "@/lib/profiles/slack";

interface BlockActionPayload {
  type: string;
  user: { id: string };
  channel: { id: string };
  message: { ts: string; blocks?: { type: string; text?: { text: string } }[] };
  actions: { action_id: string; value: string }[];
}

/**
 * Handles the Approve and Reject buttons on profile review messages in Slack.
 * Slack needs an answer within three seconds, so the GitHub work runs after responding.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const valid = isValidSlackSignature(
    process.env.SLACK_SIGNING_SECRET ?? "",
    request.headers.get("x-slack-request-timestamp"),
    body,
    request.headers.get("x-slack-signature")
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const raw = new URLSearchParams(body).get("payload");
  if (!raw) return new Response("Missing payload", { status: 400 });
  let payload: BlockActionPayload;
  try {
    payload = JSON.parse(raw) as BlockActionPayload;
  } catch {
    return new Response("Malformed payload", { status: 400 });
  }
  const action = payload.actions?.[0];
  if (payload.type !== "block_actions" || !action) return new Response(null, { status: 200 });

  const channel = payload.channel.id;
  const ts = payload.message.ts;
  if (!isApprover(payload.user.id)) {
    after(() =>
      replyInThread(channel, ts, `<@${payload.user.id}> isn't set up to review profiles.`)
    );
    return new Response(null, { status: 200 });
  }

  // Buttons carry "<pull number>:<head sha>" for the commit the reviewer was shown
  const match = /^([1-9]\d*):([0-9a-f]{40})$/.exec(action.value ?? "");
  if (!match) return new Response("Invalid pull request", { status: 400 });
  const pullNumber = Number(match[1]);
  const headSha = match[2];
  const summary = payload.message.blocks?.find((block) => block.type === "section")?.text?.text;

  after(async () => {
    try {
      let outcome: string;
      if (action.action_id === "approve_profile") {
        outcome = `Approved by <@${payload.user.id}>: ${await approvePull(pullNumber, headSha)}.`;
      } else if (action.action_id === "reject_profile") {
        outcome = `Rejected by <@${payload.user.id}>: ${await rejectPull(pullNumber, headSha)}.`;
      } else {
        return;
      }
      await closeReviewMessage(channel, ts, summary ?? `Pull request #${pullNumber}`, outcome);
    } catch (error) {
      console.error(error);
      await replyInThread(
        channel,
        ts,
        `That didn't work: ${error instanceof Error ? error.message.slice(0, 300) : "unknown error"}`
      );
    }
  });

  return new Response(null, { status: 200 });
}
