import { MemberFrontmatter } from "@/lib/memberSchema";
import { siteUrl } from "@/lib/site";

/**
 * The yearly "still accurate?" check-in. Once a year the Slack bot DMs each member who linked
 * Slack to her profile, shows what her profile says, and offers two buttons: one confirms it's
 * current, which records today's date as `updated`, and one opens the profile editor.
 *
 * There's no database, so nothing remembers who was asked. Instead a member is due in the one
 * week each year that falls on the anniversary of her last change: a weekly run asks each member
 * once a year, and confirming or editing moves her next check-in a year on.
 */

const dayMs = 24 * 60 * 60 * 1000;

export const checkInDays = 365;

// The weekly run's window; a member is asked by exactly one run each year
export const checkInWindowDays = 7;

/**
 * Whether a member is due for her yearly check-in this week
 * @param lastConfirmed when she last edited or confirmed her profile
 * @param now when the weekly run starts
 */
export const isDueForCheckIn = (lastConfirmed: Date, now: Date) => {
  const days = Math.floor((now.getTime() - lastConfirmed.getTime()) / dayMs);
  return days >= checkInDays && (days - checkInDays) % checkInDays < checkInWindowDays;
};

// Slack mrkdwn treats these as formatting, so profile text has them escaped
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The check-in DM
 * @param slug profile slug
 * @param profile the member's frontmatter
 */
export const checkInMessage = (slug: string, profile: MemberFrontmatter) => {
  const facts = [
    profile.affiliation && `*Role:* ${escape(profile.affiliation)}`,
    profile.location && `*Based in:* ${escape(profile.location)}`,
    `*Level:* ${profile.level}`,
    profile.openTo && `*Open to:* ${profile.openTo.join(", ")}`,
  ].filter(Boolean);
  const greeting = `Hi ${escape(profile.name.split(" ")[0])}! Once a year we check that every <${siteUrl}/members/${slug}|Latina Dev profile> is still accurate, so people who find you there get the right picture. Here's what yours says:`;

  return {
    text: "Is your Latina Dev profile still accurate?",
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: greeting } },
      { type: "section", text: { type: "mrkdwn", text: facts.join("\n") } },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "✅ Still accurate" },
            style: "primary",
            action_id: "confirm_profile_current",
            value: slug,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "✏️ Update my profile" },
            action_id: "open_profile_editor",
            value: slug,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Confirming adds an “Updated” date to your profile. You can also DM me a change, like “I'm a Staff Engineer at Acme now”.",
          },
        ],
      },
    ],
  };
};

/**
 * Record the date a member confirmed her profile, changing only the `updated` line so a
 * hand-written file keeps its formatting
 * @param file the profile file's text
 * @param date YYYY-MM-DD
 */
export const setUpdatedDate = (file: string, date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date: ${date}`);
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(file);
  if (!match) throw new Error("Profile has no frontmatter");
  const frontmatter = match[1];
  const line = `updated: "${date}"`;
  let next: string;
  if (/^updated:.*$/m.test(frontmatter)) {
    next = frontmatter.replace(/^updated:.*$/m, line);
  } else if (/^added:.*$/m.test(frontmatter)) {
    next = frontmatter.replace(/^(added:.*)$/m, `$1\n${line}`);
  } else {
    throw new Error("Profile has no added date");
  }
  return file.replace(frontmatter, () => next);
};
