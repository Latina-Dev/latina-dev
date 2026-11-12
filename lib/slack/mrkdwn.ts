// Slack's message format (mrkdwn) to Markdown, shared by every sync that copies a Slack channel
// to latina.dev. Rules that only apply to one channel, such as what makes a question publishable,
// live with that sync (lib/questionSync.ts).

/** A message as Slack's conversations.history and conversations.replies return it */
export interface SlackMessage {
  ts: string;
  thread_ts?: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  text?: string;
  reply_count?: number;
  reactions?: { name: string; users: string[] }[];
}

/** Names to show for user and channel mentions */
export interface MentionNames {
  people: Map<string, { name: string }>; // Slack user id to name
  channels: Map<string, string>; // Slack channel id to name
}

const entityDecode = (text: string) =>
  text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/**
 * Whether a message is a member's own words, not a join notice, bot post or other event
 * @param message a Slack message
 */
export const isMemberMessage = (message: SlackMessage) =>
  Boolean(message.user) &&
  !message.bot_id &&
  (!message.subtype || message.subtype === "thread_broadcast") &&
  Boolean(message.text?.trim());

const blockStart = /^(- |\d+\. |> )/;

/**
 * End a line the way Slack shows it: a hard break before more text, or a blank line after a list
 * item or quote so the next line isn't folded into it
 */
const breakLine = (line: string, i: number, lines: string[]) => {
  const next = lines[i + 1];
  const trimmed = line.trimEnd();
  if (next === undefined || !trimmed || !next.trim() || blockStart.test(next)) return trimmed;
  return blockStart.test(trimmed) ? `${trimmed}\n` : `${trimmed}\\`;
};

/**
 * Convert Slack's mrkdwn to Markdown. Slack already escapes <, > and &, and the escapes are kept
 * outside code so a member's "<div>" shows as text instead of being read as HTML
 * @param text message text from the Slack API
 * @param context names for user and channel mentions
 */
export const slackToMarkdown = (text: string, context: MentionNames) => {
  // Code first, so nothing inside it is reformatted
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith("```")) {
          const code = entityDecode(part.slice(3, -3)).replace(/^\n+|\n+$/g, "");
          return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
        }
        return entityDecode(part);
      }
      return (
        part
          .replace(/<@([A-Z0-9]+)(?:\|[^>]*)?>/g, (_, id: string) =>
            context.people.has(id) ? `@${context.people.get(id)!.name}` : "@member"
          )
          .replace(
            /<#([A-Z0-9]+)(?:\|([^>]*))?>/g,
            (_, id: string, name?: string) => `#${name || context.channels.get(id) || "channel"}`
          )
          // @here, @channel and user group mentions mean nothing on the site
          .replace(/<![^>]*>/g, "")
          // Email links are dropped so an address isn't turned into a link to harvest
          .replace(/<mailto:[^|>]+(?:\|([^>]*))?>/g, (_, label?: string) => label ?? "")
          .replace(
            /<(https?:\/\/[^|>]+)\|([^>]+)>/g,
            (_, url: string, label: string) => `[${label}](${entityDecode(url)})`
          )
          .replace(/<(https?:\/\/[^|>]+)>/g, (_, url: string) => {
            const decoded = entityDecode(url);
            return `[${decoded}](${decoded})`;
          })
          // Anything else in angle brackets is a Slack-only link, e.g. tel: or slack://
          .replace(/<[^>\s|]+\|([^>]+)>/g, "$1")
          // Slack escapes < and > in what members type, so any left over are escaped too. The
          // page also sanitizes when rendering; this keeps the stored Markdown free of tags
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1**$2**")
          .replace(/(^|[\s(])~([^~\n]+)~(?=[\s).,!?:;]|$)/g, "$1$2")
          .replace(/^[•◦▪]\s*/gm, "- ")
          .replace(/^&gt;\s?/gm, "> ")
          // Slack keeps single line breaks, Markdown joins them
          .split("\n")
          .map(breakLine)
          .join("\n")
      );
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/** ISO date and time of a Slack message timestamp */
export const tsToIso = (ts: string) =>
  new Date(Math.floor(Number(ts) * 1000)).toISOString().replace(/\.\d{3}Z$/, "Z");
