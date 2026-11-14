import { createHash, createHmac, timingSafeEqual } from "crypto";
import fs from "fs";

import { ownersPath } from "@/lib/profiles/owners";

/**
 * Links a Slack member to the LinkedIn account they sign in with on latina.dev, so they can see
 * and edit their profile from Slack. LinkedIn stays the only identity: a Slack account is only
 * ever linked by signing in with LinkedIn on the site, through a short-lived link the bot hands
 * that one Slack member.
 *
 * Links live in the repo like profile owners do, with no database: data/owners/slack/<slug>.txt
 * holds the SHA-256 of the Slack member's workspace and user id, never the raw id. A link is added
 * by a pull request that an organizer approves in Slack, the same as any profile change, and
 * deleting the file unlinks it.
 */

// Long enough to sign in with LinkedIn, short enough that a forwarded link soon stops working
const linkTokenSeconds = 15 * 60;

const slackIdPattern = /^[A-Z0-9]{2,20}$/;

const linkSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
};

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`slack-link:${payload}`).digest("base64url");

/**
 * Make the token in a member's "Link with LinkedIn" button
 * @param teamId Slack workspace id
 * @param userId Slack member id
 * @param now current time in seconds
 * @param secret signing secret, AUTH_SECRET by default
 */
export const createLinkToken = (
  teamId: string,
  userId: string,
  now = Math.floor(Date.now() / 1000),
  secret = linkSecret()
) => {
  if (!slackIdPattern.test(teamId) || !slackIdPattern.test(userId)) {
    throw new Error("Invalid Slack id");
  }
  const payload = `${teamId}.${userId}.${now + linkTokenSeconds}`;
  return `${payload}.${sign(payload, secret)}`;
};

/**
 * Check a link token
 * @param token from the link's ?t= parameter
 * @param now current time in seconds
 * @param secret signing secret, AUTH_SECRET by default
 * @returns the Slack member it was made for, or undefined if it's forged or expired
 */
export const verifyLinkToken = (
  token: string | undefined,
  now = Math.floor(Date.now() / 1000),
  secret = linkSecret()
) => {
  const match = /^([A-Z0-9]{2,20})\.([A-Z0-9]{2,20})\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(
    token ?? ""
  );
  if (!match) return undefined;
  const [, teamId, userId, expires, signature] = match;
  const expected = Buffer.from(sign(`${teamId}.${userId}.${expires}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return undefined;
  if (Number(expires) < now) return undefined;
  return { teamId, userId };
};

const slackLinksPath = `${ownersPath}/slack`;

/**
 * Hash a Slack member into the key stored in their link file
 * @param teamId Slack workspace id
 * @param userId Slack member id
 */
export const slackKey = (teamId: string, userId: string) => {
  if (!slackIdPattern.test(teamId) || !slackIdPattern.test(userId)) {
    throw new Error("Invalid Slack id");
  }
  return createHash("sha256").update(`slack:${teamId}:${userId}`).digest("hex");
};

/** Link file for a profile, e.g. data/owners/slack/frances-coronel.txt */
export const slackLinkFile = (slug: string) => `${slackLinksPath}/${slug}.txt`;

/**
 * Branch holding a member's pending Slack link. It starts with profile/ so the existing Approve
 * and Reject buttons accept it, and differs from their profile branch so a pending profile edit
 * isn't replaced
 * @param teamId Slack workspace id
 * @param userId Slack member id
 */
export const slackLinkBranch = (teamId: string, userId: string) =>
  `profile/slack-${slackKey(teamId, userId).slice(0, 12)}`;

/**
 * Profile slug a Slack member is linked to, if any. Reads the files deployed with the site, so
 * a newly approved link works once the site redeploys. Also usable from scripts in CI, e.g. to
 * credit a Slack answer to the right profile
 * @param teamId Slack workspace id
 * @param userId Slack member id
 */
export const linkedSlug = (teamId: string, userId: string) => {
  const key = slackKey(teamId, userId);
  try {
    return fs
      .readdirSync(slackLinksPath)
      .filter((file) => file.endsWith(".txt"))
      .find((file) => fs.readFileSync(`${slackLinksPath}/${file}`, "utf8").trim() === key)
      ?.replace(/\.txt$/, "");
  } catch {
    return undefined;
  }
};
