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

export type ReviewKind = "new" | "claim" | "edit";

export interface ReviewRequest {
  kind: ReviewKind;
  pullNumber: number;
  pullUrl: string;
  profileName: string;
  profileUrl?: string; // the live profile, for claims and edits
  linkedinName: string; // name on the LinkedIn account that signed in
  linkedinHandle: string; // handle the member typed, for opening their LinkedIn
  email?: string; // for the Slack invite; never written to the repo
  note?: string; // anything the reviewer should know, e.g. no photo was found
}

const kindLabels: Record<ReviewKind, string> = {
  new: "New profile",
  claim: "Profile claim",
  edit: "Profile edit",
};

// Slack mrkdwn treats these as formatting, so user text has them escaped
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Build the Slack message asking a maintainer to approve or reject a profile change
 * @param request details of the change
 */
export const reviewMessage = (request: ReviewRequest) => {
  const label = kindLabels[request.kind];
  const lines = [
    `*${label}: ${escape(request.profileName)}*`,
    `Signed in with LinkedIn as *${escape(request.linkedinName)}*${
      request.email ? ` (${escape(request.email)})` : ""
    }`,
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
            value: String(request.pullNumber),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Reject" },
            style: "danger",
            action_id: "reject_profile",
            value: String(request.pullNumber),
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
const callSlack = async (method: string, payload: Record<string, unknown>) => {
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
  const result = (await response.json()) as { ok: boolean; error?: string };
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
