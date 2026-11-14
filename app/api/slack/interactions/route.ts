import { after } from "next/server";

import { parseChanges } from "@/lib/profileAgent";
import {
  approvePull,
  NotMergeableError,
  OutdatedReviewError,
  rejectPull,
} from "@/lib/profiles/github";
import {
  callSlack,
  closeReviewMessage,
  isApprover,
  isValidSlackSignature,
  replyInThread,
} from "@/lib/profiles/slack";
import {
  checkAgentEdit,
  checkEditor,
  confirmProfileCurrent,
  dmMember,
  openEditor,
  publishHome,
  sendSuggestion,
} from "@/lib/slackProfileApp";
import { readSuggestion } from "@/lib/suggestions";

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
    state: {
      values: Record<
        string,
        Record<
          string,
          {
            value?: string | null;
            selected_date?: string | null;
            selected_option?: { value: string } | null;
          }
        >
      >;
    };
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

// What the suggestion modal turns into once it's sent
const suggestionSentView = {
  type: "modal",
  title: { type: "plain_text", text: "Thanks!" },
  close: { type: "plain_text", text: "Done" },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "🙌 Thanks for the suggestion! An organizer will check it, and I'll DM you a link to follow along.",
      },
    },
  ],
};

/**
 * Replace a DM's buttons with what happened, so they can't be pressed twice
 * @param payload the button press
 * @param outcome what to show instead
 */
const settleMessage = (payload: BlockActionPayload, outcome: string) =>
  callSlack("chat.update", {
    channel: payload.channel.id,
    ts: payload.message.ts,
    text: outcome,
    blocks: [
      ...(payload.message.blocks ?? []).filter((block) => block.type === "section"),
      { type: "context", elements: [{ type: "mrkdwn", text: outcome }] },
    ],
  });

/**
 * The member profile app: the "Edit my profile" button opens the editor, and sending the editor
 * turns the change into a pull request reviewed like any other. Also the yearly check-in's
 * "Still accurate" button, the profile agent's "Send for review" button and /latinadev suggest
 */
const handleProfileApp = async (payload: BlockActionPayload | ViewSubmissionPayload) => {
  const teamId = payload.team?.id;
  const userId = payload.user.id;

  if (payload.type === "view_submission" && payload.view.callback_id === "suggestion") {
    const result = readSuggestion(payload.view.state.values);
    if ("errors" in result) return json({ response_action: "errors", errors: result.errors });
    after(async () => {
      try {
        await sendSuggestion(teamId, userId, result.suggestion);
      } catch (error) {
        console.error(error);
        await dmMember(
          userId,
          "Sorry, your suggestion didn't send. Please try `/latinadev suggest` again in a few minutes, or email hola@latina.dev."
        ).catch((dmError: unknown) => console.error(dmError));
      }
    });
    return json({ response_action: "update", view: suggestionSentView });
  }

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
  if (action.action_id === "confirm_profile_current") {
    after(async () => {
      try {
        const confirmed = await confirmProfileCurrent(teamId, userId, action.value);
        await settleMessage(
          payload,
          confirmed
            ? "✅ Thanks! Your profile is marked as up to date."
            : "Your Slack account isn't linked to this profile anymore, so nothing changed."
        );
      } catch (error) {
        console.error(error);
        await dmMember(
          userId,
          "Sorry, I couldn't record that. Please press “Still accurate” again later."
        ).catch(console.error);
      }
    });
    return new Response(null, { status: 200 });
  }

  if (action.action_id === "agent_send_edit") {
    const changes = parseChanges(action.value);
    const result = changes ? checkAgentEdit(teamId, userId, changes) : undefined;
    after(async () => {
      try {
        if (!result || "errors" in result) {
          const reason = result && "errors" in result ? Object.values(result.errors)[0] : undefined;
          await settleMessage(
            payload,
            `That change couldn't be sent${reason ? `: ${reason}` : ""}. Type \`/latinadev edit\` to open the editor.`
          );
          return;
        }
        await result.send();
        await settleMessage(
          payload,
          "🎉 Sent! An organizer will review it, and it goes live on latina.dev once approved."
        );
      } catch (error) {
        console.error(error);
        await dmMember(
          userId,
          "Sorry, your profile change didn't send. Please try again in a few minutes, or type `/latinadev edit`."
        ).catch(console.error);
      }
    });
    return new Response(null, { status: 200 });
  }

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
