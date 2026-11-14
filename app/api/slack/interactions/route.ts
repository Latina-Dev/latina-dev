import { after } from "next/server";

import {
  approvePull,
  NotMergeableError,
  OutdatedReviewError,
  rejectPull,
} from "@/lib/profiles/github";
import {
  closeReviewMessage,
  isApprover,
  isValidSlackSignature,
  replyInThread,
} from "@/lib/profiles/slack";
import { checkEditor, dmMember, openEditor, publishHome } from "@/lib/slackProfileApp";

interface BlockActionPayload {
  type: "block_actions";
  team: { id: string };
  user: { id: string };
  trigger_id: string;
  channel: { id: string };
  message: { ts: string; blocks?: { type: string; text?: { text: string } }[] };
  actions: { action_id: string; value: string }[];
}

interface ViewSubmissionPayload {
  type: "view_submission";
  team: { id: string };
  user: { id: string };
  view: {
    callback_id: string;
    private_metadata: string;
    state: { values: Record<string, Record<string, { value?: string | null }>> };
  };
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

// What the modal turns into once the edit is sent
const sentView = {
  type: "modal",
  title: { type: "plain_text", text: "Sent for review" },
  close: { type: "plain_text", text: "Done" },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "🎉 Thanks! An organizer will review your changes, and they'll go live on latina.dev once approved. I'll DM you if anything goes wrong.",
      },
    },
  ],
};

/**
 * The member profile app: the "Edit my profile" button opens the editor, and sending the editor
 * turns the change into a pull request reviewed like any other
 */
const handleProfileApp = async (payload: BlockActionPayload | ViewSubmissionPayload) => {
  const teamId = payload.team?.id;
  const userId = payload.user.id;

  if (payload.type === "view_submission") {
    if (payload.view.callback_id !== "profile_editor") return new Response(null, { status: 200 });
    const result = checkEditor(
      teamId,
      userId,
      payload.view.private_metadata,
      payload.view.state.values
    );
    if ("errors" in result) return json({ response_action: "errors", errors: result.errors });
    after(async () => {
      try {
        await result.send();
      } catch (error) {
        console.error(error);
        await dmMember(
          userId,
          "Sorry, your profile changes didn't send. Please try again in a few minutes, or update your profile at latina.dev/profile."
        ).catch((dmError: unknown) => console.error(dmError));
      }
    });
    return json({ response_action: "update", view: sentView });
  }

  const action = payload.actions[0];
  if (action.action_id === "open_profile_editor") {
    // trigger_id expires after three seconds, so the modal opens before responding
    const opened = await openEditor(teamId, userId, payload.trigger_id).catch((error: unknown) => {
      console.error(error);
      return false;
    });
    if (!opened) after(() => publishHome(teamId, userId).catch(console.error));
  }
  // Link buttons open a URL in the browser; Slack still expects an answer
  return new Response(null, { status: 200 });
};

/**
 * Handles buttons and modals from the Slack app: Approve and Reject on profile review messages,
 * and the member profile app. Slack needs an answer within three seconds, so the GitHub work runs
 * after responding.
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
  let parsed: BlockActionPayload | ViewSubmissionPayload;
  try {
    parsed = JSON.parse(raw) as BlockActionPayload | ViewSubmissionPayload;
  } catch {
    return new Response("Malformed payload", { status: 400 });
  }
  if (parsed.type === "view_submission") return handleProfileApp(parsed);
  const payload = parsed as BlockActionPayload;
  const action = payload.actions?.[0];
  if (payload.type !== "block_actions" || !action) return new Response(null, { status: 200 });
  // Approve and Reject are the only review actions; everything else belongs to the profile app
  if (action.action_id !== "approve_profile" && action.action_id !== "reject_profile") {
    return handleProfileApp(payload);
  }

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
      try {
        // A stale message can never act, so retire its buttons rather than keep offering them
        if (error instanceof OutdatedReviewError) {
          await closeReviewMessage(
            channel,
            ts,
            summary ?? `Pull request #${pullNumber}`,
            error.message
          );
          return;
        }
        // Expected while checks run; keep the buttons so the organizer can press Approve again
        if (error instanceof NotMergeableError) {
          await replyInThread(channel, ts, error.message);
          return;
        }
        console.error(error);
        await replyInThread(
          channel,
          ts,
          `That didn't work: ${error instanceof Error ? error.message.slice(0, 300) : "unknown error"}`
        );
      } catch (slackError) {
        // Slack itself failed, so there's nowhere to tell the organizer; keep it in the logs
        console.error(slackError);
      }
    }
  });

  return new Response(null, { status: 200 });
}
