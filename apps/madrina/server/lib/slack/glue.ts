import type { KnownBlock, WebClient } from "@slack/web-api";
import { classifyAsk, draftHandOff, draftTrade } from "~/lib/ai/glue";
import { DEMO_PROFILE_ID, getProfile } from "~/lib/madrina/data";
import {
  acceptGlue,
  firstTimeSeen,
  type GlueAsk,
  getGlueAsk,
  listGlue,
  ordinal,
  saveGlueAsk,
} from "~/lib/madrina/glue";
import { getDemoUser } from "~/lib/madrina/store";
import { markdownToBlocks } from "~/lib/slack/format";
import seed from "../../../data/slack-seed.json";

export const GLUE_ACTIONS = {
  handOff: "glue_draft_hand_off",
  trade: "glue_trade_visible",
  accept: "glue_happy_to_do_it",
} as const;

type Persona = { name: string; role: string };
const personas = seed.personas as Record<string, Persona>;

/** Loose shape of a message event: seed personas arrive as bot messages, people as user messages. */
export type GroupMessage = {
  channel: string;
  channel_type?: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
  text?: string;
  user?: string;
  bot_id?: string;
  username?: string;
  metadata?: { event_type?: string; event_payload?: { persona?: string } };
};

/** The Slack user who is the profile user (Ana) in the demo workspace. */
const profileSlackUser = () => getDemoUser() ?? seed.invite_user_ids[0];

/**
 * Who sent this, if it's someone other than the profile user.
 * Seed personas are posted by Madrina's bot with a persona name, so match those by
 * metadata or username. Any other bot message (including Madrina's own) is ignored.
 */
const resolveAsker = (
  m: GroupMessage,
): { name: string; role?: string } | undefined => {
  if (m.bot_id || m.subtype === "bot_message") {
    const key =
      m.metadata?.event_payload?.persona ??
      Object.entries(personas).find(([, p]) => p.name === m.username)?.[0];
    if (!key || key === DEMO_PROFILE_ID || !personas[key]) return undefined;
    return { name: personas[key].name, role: personas[key].role };
  }
  if (m.subtype || !m.user || m.user === profileSlackUser()) return undefined;
  return { name: `<@${m.user}>` };
};

const firstName = (name: string) =>
  name.startsWith("<@") ? name : name.split(" ")[0];

const flagBlocks = (a: GlueAsk, footer?: string): KnownBlock[] => {
  const profile = getProfile(a.profileId);
  const onRecord = listGlue(a.profileId).length;
  const mapsTo = a.competency
    ? `it only loosely touches *${a.competency}* at ${profile.target_level}.`
    : `it maps to no ${profile.target_level} competency.`;
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:yarn: *Quick flag: this one is glue work*\n${firstName(a.askerName)} is asking you to ${a.ask}. Useful, and non-promotable: ${mapsTo}\n_${a.reason}_`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `This would be your ${ordinal(onRecord + 1)} glue task on record. Only you can see this.`,
        },
      ],
    },
  ];
  if (footer) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: footer }],
    });
    return blocks;
  }
  blocks.push(
    {
      type: "section",
      text: { type: "mrkdwn", text: "*How do you want to handle it?*" },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: GLUE_ACTIONS.handOff,
          style: "primary",
          value: a.id,
          text: {
            type: "plain_text",
            text: "Draft a hand-off reply",
            emoji: true,
          },
        },
        {
          type: "button",
          action_id: GLUE_ACTIONS.trade,
          value: a.id,
          text: {
            type: "plain_text",
            text: "Trade it for something visible",
            emoji: true,
          },
        },
        {
          type: "button",
          action_id: GLUE_ACTIONS.accept,
          value: a.id,
          text: { type: "plain_text", text: "Happy to do it", emoji: true },
        },
      ],
    },
  );
  return blocks;
};

/**
 * Watch private channels Madrina was invited to. When someone else asks the profile
 * user to do something non-promotable, show her an ephemeral flag right under it.
 */
export const maybeFlagGlue = async (client: WebClient, m: GroupMessage) => {
  if (m.channel_type !== "group" || !m.text?.trim()) return;
  const asker = resolveAsker(m);
  if (!asker) return;
  if (!firstTimeSeen(`${m.channel}:${m.ts}`)) return;

  const c = await classifyAsk(
    m.text,
    asker.role ? `${asker.name} (${asker.role})` : "a teammate",
  );
  if (!c.isAsk || c.isPromotable) return;

  const ask: GlueAsk = {
    id: `${m.channel}-${m.ts}`,
    profileId: DEMO_PROFILE_ID,
    channel: m.channel,
    ts: m.ts,
    thread_ts: m.thread_ts,
    userId: profileSlackUser(),
    askerName: asker.name,
    askerRole: asker.role,
    text: m.text,
    ask: c.ask || "take this on",
    reason: c.reason,
    competency: c.competency,
  };
  saveGlueAsk(ask);
  const blocks = flagBlocks(ask);
  await client.chat.postEphemeral({
    channel: ask.channel,
    user: ask.userId,
    thread_ts: ask.thread_ts,
    text: `Quick flag: ${firstName(ask.askerName)} is asking you to ${ask.ask}. That's glue work: useful, and non-promotable.`,
    blocks,
  });
};

type Respond = (msg: {
  replace_original?: boolean;
  response_type?: "ephemeral";
  text: string;
  blocks?: KnownBlock[];
}) => Promise<unknown>;

const DRAFT_FOOTER =
  "📝 Draft only. I won't post it. Copy it into the thread if it feels right.";

const replaceWithDraft = async (
  respond: Respond,
  a: GlueAsk,
  pending: string,
  intro: string,
  produce: (a: GlueAsk) => Promise<string>,
) => {
  await respond({
    replace_original: true,
    text: pending,
    blocks: flagBlocks(a, pending),
  });
  try {
    const draft = await produce(a);
    const quoted = draft
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    await respond({
      replace_original: true,
      text: `${intro}\n\n${draft}`,
      blocks: [
        ...flagBlocks(a, DRAFT_FOOTER),
        { type: "divider" },
        { type: "section", text: { type: "mrkdwn", text: `*${intro}*` } },
        ...markdownToBlocks(quoted),
      ],
    });
  } catch (error) {
    await respond({
      replace_original: true,
      text: "Sorry, I hit a snag.",
      blocks: flagBlocks(a),
    });
    throw error;
  }
};

export const handOffReply = (respond: Respond, a: GlueAsk) =>
  replaceWithDraft(
    respond,
    a,
    "✍️ Drafting a hand-off reply...",
    "Here's a hand-off reply you could post:",
    draftHandOff,
  );

export const tradeForVisible = (respond: Respond, a: GlueAsk) =>
  replaceWithDraft(
    respond,
    a,
    "🔁 Finding a trade that gets you seen...",
    "Here's a trade you could offer:",
    draftTrade,
  );

export const acceptGlueAsk = async (respond: Respond, a: GlueAsk) => {
  acceptGlue(a.profileId, {
    title: a.ask,
    date: new Date().toISOString().slice(0, 10),
    where: `<#${a.channel}>`,
  });
  const n = listGlue(a.profileId).length;
  const note = `:madrina-vouched: Logged as glue. That's ${n} on record, and it's on your Home tab so it shows up in your promo conversation, not just your calendar.`;
  await respond({
    replace_original: true,
    text: note,
    blocks: [
      ...flagBlocks(a, note).slice(0, 1),
      { type: "context", elements: [{ type: "mrkdwn", text: note }] },
    ],
  });
};

export { getGlueAsk };
