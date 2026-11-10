import type { KnownBlock, WebClient } from "@slack/web-api";
import { getGaps, getProfile, matchedShelf } from "~/lib/madrina/data";
import { listGlue } from "~/lib/madrina/glue";
import { getShelfCursor, listWins } from "~/lib/madrina/store";
import { EXPORT_BRAG_ACTION } from "~/lib/slack/brag";

export const RUN_CHECKIN_ACTION = "run_weekly_checkin";
export const SHELF_NEXT_ACTION = "shelf_next";

const TYPE_EMOJI: Record<string, string> = {
  book: "📖",
  talk: "🎤",
  "blog post": "✍️",
  course: "🎓",
  newsletter: "📬",
  community: "🤝",
};

const TRACK_LABEL: Record<string, string> = {
  IC: "IC track (Staff, Principal)",
  Management: "Management track",
  "Not sure yet": "Track: not sure yet, and that's fine",
};

const SUPPORT_ROLES: { key: string; label: string; hint: string }[] = [
  { key: "mentor", label: "Mentor", hint: "advice" },
  {
    key: "sponsor",
    label: "Sponsor",
    hint: "says your name in rooms you're not in",
  },
  { key: "advocate", label: "Advocate", hint: "backs you in the moment" },
  { key: "coach", label: "Coach", hint: "helps you see your own patterns" },
];

export const buildHomeBlocks = (userId = ""): KnownBlock[] => {
  const profile = getProfile();
  const gaps = getGaps(profile).slice(0, 3);
  const shelf = matchedShelf(profile);
  const pick = shelf.length
    ? shelf[getShelfCursor(userId) % shelf.length]
    : undefined;
  const wins = listWins(profile.id);
  const glue = listGlue(profile.id);
  const support = profile.support_system as Record<string, string>;
  const firstName = profile.name.split(" ")[0];
  const emptyRoles = SUPPORT_ROLES.filter((r) => support[r.key] !== "filled");

  const gapLines = gaps.length
    ? gaps
        .map(
          (g, i) =>
            `*${i + 1}. ${g.competency}*${g.managerFocus ? "  ·  _your manager named this_" : ""}\n` +
            `You: ${g.current}  →  ${g.target}: ${g.expectation}`,
        )
        .join("\n\n")
    : "No gaps against the ladder. Time to talk about your promo case.";

  const supportLine = SUPPORT_ROLES.map(
    (r) => `${support[r.key] === "filled" ? "✅" : "⬜"} *${r.label}*`,
  ).join("     ");

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Hi ${firstName}, it's Madrina :madrina:`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${profile.current_level}  →  ${profile.target_level}*\n${TRACK_LABEL[profile.track] ?? profile.track}  ·  ${profile.team}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: RUN_CHECKIN_ACTION,
          style: "primary",
          text: {
            type: "plain_text",
            text: "Run my weekly check-in",
            emoji: true,
          },
          value: profile.id,
        },
        {
          type: "button",
          action_id: EXPORT_BRAG_ACTION,
          text: { type: "plain_text", text: "Export my brag doc", emoji: true },
          value: profile.id,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🎯 Your top ${gaps.length} gaps to ${profile.target_level}*`,
      },
    },
    { type: "section", text: { type: "mrkdwn", text: gapLines } },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: "*📚 From women who've done it*" },
    },
    ...(pick
      ? ([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `${TYPE_EMOJI[pick.resource.type] ?? "📚"} *<${pick.resource.url}|${pick.resource.title}>*\n` +
                `by ${pick.resource.author}  ·  ${pick.resource.type}\n` +
                (pick.gap
                  ? `_Why this one:_ it speaks to your *${pick.gap.competency}* gap. ${profile.target_level} expects: "${pick.gap.expectation}"`
                  : `_Why this one:_ it fits your ${profile.track} track.`),
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                action_id: "shelf_open",
                text: { type: "plain_text", text: "Open", emoji: true },
                url: pick.resource.url,
              },
              {
                type: "button",
                action_id: SHELF_NEXT_ACTION,
                text: {
                  type: "plain_text",
                  text: "Show me another",
                  emoji: true,
                },
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `${(getShelfCursor(userId) % shelf.length) + 1} of ${shelf.length} on your shelf, matched to your gaps. Every author publicly identifies as a woman.`,
              },
            ],
          },
        ] as KnownBlock[])
      : ([
          {
            type: "section",
            text: { type: "mrkdwn", text: "Nothing on the shelf matches yet." },
          },
        ] as KnownBlock[])),
    { type: "divider" },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*:promo-ready: Wins logged*\n${wins.length === 0 ? "0 so far. Reply to my check-in with one and I'll make it promo-ready." : `${wins.length} promo-ready ${wins.length === 1 ? "bullet" : "bullets"}`}`,
        },
        {
          type: "mrkdwn",
          text: `*:yarn: Glue work*\n${glue.length} ${glue.length === 1 ? "task" : "tasks"} on record. Useful, and none of it counts toward ${profile.target_level} unless you claim it.`,
        },
        {
          type: "mrkdwn",
          text: `*🤝 Support system*\n${SUPPORT_ROLES.filter((r) => support[r.key] === "filled").length} of 4 filled`,
        },
      ],
    },
    { type: "section", text: { type: "mrkdwn", text: supportLine } },
  ];

  if (emptyRoles.length) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Open: ${emptyRoles.map((r) => `*${r.label}* (${r.hint})`).join(", ")}. For Staff, a sponsor matters most.`,
        },
      ],
    });
  }

  if (wins.length) {
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Latest wins*\n${wins
            .slice(-3)
            .reverse()
            .map((w) => `• ${w.bullet}  _(${w.competency})_`)
            .join("\n")}`,
        },
      },
    );
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Demo profile: Ana Rivera (synthetic). Ladder is a simplified public-style example.",
      },
    ],
  });

  return blocks;
};

export const publishHome = async (client: WebClient, userId: string) =>
  client.views.publish({
    user_id: userId,
    view: { type: "home", blocks: buildHomeBlocks(userId) },
  });
