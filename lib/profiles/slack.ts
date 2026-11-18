import { createHmac, timingSafeEqual } from "crypto";

// Slack recommends rejecting requests older than five minutes to stop replays
const maxRequestAgeSeconds = 60 * 5;

/**
 * Check that a request really came from Slack
 * https://api.slack.com/authentication/verifying-requests-from-slack
 * @param signingSecret the Slack app's signing secret
 * @param timestamp X-Slack-Request-Timestamp header
 * @param body raw request body
 * @param signature X-Slack-Signature header
 * @param now current time in seconds
 */
export const isValidSlackSignature = (
  signingSecret: string,
  timestamp: string | null,
  body: string,
  signature: string | null,
  now = Math.floor(Date.now() / 1000)
) => {
  if (!signingSecret || !timestamp || !signature) return false;
  const sentAt = Number(timestamp);
  if (!Number.isInteger(sentAt) || Math.abs(now - sentAt) > maxRequestAgeSeconds) return false;

  const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Whether a Slack user may press Approve or Reject. SLACK_APPROVER_IDS is required:
 * with no list, nobody can, so a missing setting never opens review to the whole channel
 * @param userId Slack user id from the button press
 * @param allowlist comma-separated Slack user ids
 */
export const isApprover = (userId: string, allowlist = process.env.SLACK_APPROVER_IDS ?? "") =>
  allowlist
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);

export type ReviewKind = "new" | "claim" | "edit" | "link";

export interface ReviewRequest {
  kind: ReviewKind;
  pullNumber: number;
  headSha: string; // commit under review, so Approve can't merge a later resubmission
  pullUrl: string;
  profileName: string;
  profileUrl?: string; // the live profile, for claims and edits
  linkedinName?: string; // name on the LinkedIn account that signed in on the site
  slackUserId?: string; // Slack member who sent an edit from Slack, or who is being linked
  linkedinHandle: string; // handle the member typed, for opening their LinkedIn
  email?: string; // for the Slack invite; never written to the repo
  note?: string; // anything the reviewer should know, e.g. no photo was found
}

const kindLabels: Record<ReviewKind, string> = {
  new: "New profile",
  claim: "Profile claim",
  edit: "Profile edit",
  link: "Slack link",
};

// Slack mrkdwn treats these as formatting, so user text has them escaped
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Build the Slack message asking a maintainer to approve or reject a profile change
 * @param request details of the change
 */
export const reviewMessage = (request: ReviewRequest) => {
  if (request.slackUserId && !/^[A-Z0-9]{2,20}$/.test(request.slackUserId)) {
    throw new Error("Invalid Slack user id");
  }
  const label = kindLabels[request.kind];
  const lines = [
    `*${label}: ${escape(request.profileName)}*`,
    request.slackUserId && request.kind !== "link"
      ? `Sent from Slack by <@${request.slackUserId}>, whose Slack account is linked to this profile`
      : `Signed in with LinkedIn as *${escape(request.linkedinName ?? "Unknown")}*${
          request.email ? ` (${escape(request.email)})` : ""
        }`,
    request.kind === "link" && request.slackUserId
      ? `Wants to edit this profile from Slack as <@${request.slackUserId}>. They signed in with the LinkedIn account that owns it`
      : undefined,
    `LinkedIn: <https://www.linkedin.com/in/${encodeURIComponent(request.linkedinHandle)}|linkedin.com/in/${escape(request.linkedinHandle)}>`,
    request.profileUrl ? `Current profile: <${request.profileUrl}>` : undefined,
    `Changes: <${request.pullUrl}|pull request #${request.pullNumber}> (the Vercel preview shows the page)`,
    request.note ? `Note: ${escape(request.note)}` : undefined,
  ].filter(Boolean);

  return {
    text: `${label}: ${request.profileName}`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Approve" },
            style: "primary",
            action_id: "approve_profile",
            value: `${request.pullNumber}:${request.headSha}`,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Reject" },
            style: "danger",
            action_id: "reject_profile",
            value: `${request.pullNumber}:${request.headSha}`,
          },
        ],
      },
    ],
  };
};

/**
 * Call a Slack Web API method with the bot token
 * @param method e.g. chat.postMessage
 * @param payload JSON body
 */
export const callSlack = async <T extends object = object>(
  method: string,
  payload: Record<string, unknown>
) => {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { ok: boolean; error?: string } & T;
  if (!result.ok) throw new Error(`Slack ${method} failed: ${result.error ?? response.status}`);
  return result;
};

/**
 * Post a review request to the review channel
 * @param request details of the change
 */
export const postReviewRequest = (request: ReviewRequest) => {
  const channel = process.env.SLACK_REVIEW_CHANNEL_ID;
  if (!channel) throw new Error("SLACK_REVIEW_CHANNEL_ID is not set");
  return callSlack("chat.postMessage", { channel, ...reviewMessage(request) });
};

/**
 * Reply in a review message's thread, e.g. with the outcome of a button press
 * @param channel channel id
 * @param threadTs the review message's ts
 * @param text reply text
 */
export const replyInThread = (channel: string, threadTs: string, text: string) =>
  callSlack("chat.postMessage", { channel, thread_ts: threadTs, text });

/**
 * Replace a review message's buttons with its outcome so it can't be pressed twice
 * @param channel channel id
 * @param ts the review message's ts
 * @param summary the message's original first section text
 * @param outcome e.g. "Approved by @frances"
 */
export const closeReviewMessage = (channel: string, ts: string, summary: string, outcome: string) =>
  callSlack("chat.update", {
    channel,
    ts,
    text: outcome,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: summary } },
      { type: "context", elements: [{ type: "mrkdwn", text: outcome }] },
    ],
  });
