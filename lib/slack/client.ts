// Read-only Slack Web API calls for scripts that copy Slack channels to the site, such as
// scripts/sync-slack-questions.ts. Messages from the API are SlackMessage (lib/slack/mrkdwn.ts).

import { SlackMessage } from "@/lib/slack/mrkdwn";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Page {
  messages: SlackMessage[];
  response_metadata?: { next_cursor?: string };
}

interface SlackUser {
  name: string;
  real_name?: string;
  profile?: { real_name?: string; display_name?: string };
}

/**
 * A Slack reader for one bot token
 * @param token bot token; channels:history and users:read cover every method here
 */
export const slackReader = (token: string) => {
  /** Call a Web API read method, waiting out rate limits */
  const call = async <T>(method: string, params: Record<string, string>): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(
        `https://slack.com/api/${method}?${new URLSearchParams(params)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 429 && attempt < 5) {
        await sleep(Number(response.headers.get("retry-after") ?? 30) * 1000);
        continue;
      }
      const body = (await response.json()) as T & { ok: boolean; error?: string };
      if (!body.ok) throw new Error(`Slack ${method} failed: ${body.error ?? response.status}`);
      return body;
    }
  };

  /** Every page of a paginated message method */
  const allMessages = async (method: string, params: Record<string, string>) => {
    const messages: SlackMessage[] = [];
    let cursor = "";
    do {
      const page = await call<Page>(method, {
        ...params,
        limit: "200",
        ...(cursor ? { cursor } : {}),
      });
      messages.push(...page.messages);
      cursor = page.response_metadata?.next_cursor ?? "";
    } while (cursor);
    return messages;
  };

  return {
    call,
    /** Top-level messages and thread starters posted since `oldest` (Unix seconds) */
    history: (channel: string, oldest: number) =>
      allMessages("conversations.history", { channel, oldest: String(oldest) }),
    /** A whole thread, its first message included */
    replies: (channel: string, ts: string) => allMessages("conversations.replies", { channel, ts }),
    /** The name a person goes by in Slack: full name first, then display name */
    userName: async (user: string) => {
      const { user: info } = await call<{ user: SlackUser }>("users.info", { user });
      return (
        info.profile?.real_name?.trim() ||
        info.real_name?.trim() ||
        info.profile?.display_name?.trim() ||
        info.name
      );
    },
  };
};
