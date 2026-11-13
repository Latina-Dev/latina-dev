/**
 * Seeds synthetic demo channels into Frances's personal workspace from data/slack-seed.json.
 *
 *   pnpm tsx scripts/seed-slack.ts          # dry run: prints every channel and message
 *   pnpm tsx scripts/seed-slack.ts --post   # creates channels and posts as bot personas
 *
 * Needs bot scopes: chat:write, chat:write.customize, channels:manage, groups:write,
 * channels:read, groups:read. Token from SLACK_BOT_TOKEN or SLACK_CLI_XOXB.
 * Refuses to run against any team other than the seed's team_id.
 * Skips channels that already exist (pass --force to post into them anyway).
 * --reset renames existing seeded channels to <name>-old-<n>, archives them, then reseeds.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WebClient } from "@slack/web-api";

type Persona = {
  name: string;
  role: string;
  icon_emoji: string;
  icon_url?: string;
};
type Message = { id: string; from: string; text: string; thread?: string };
type Channel = {
  name: string;
  private: boolean;
  topic: string;
  purpose?: string;
  messages: Message[];
};
type Seed = {
  team_id: string;
  invite_user_ids: string[];
  personas: Record<string, Persona>;
  channels: Channel[];
};

const seed: Seed = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "..", "data", "slack-seed.json"),
    "utf8",
  ),
);
const post = process.argv.includes("--post");
const force = process.argv.includes("--force");
const reset = process.argv.includes("--reset");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function printPlan() {
  for (const ch of seed.channels) {
    console.log(
      `\n#${ch.name}${ch.private ? " (private)" : ""}\n  topic: ${ch.topic}\n  purpose: ${ch.purpose ?? "(none)"}`,
    );
    for (const m of ch.messages) {
      const who = seed.personas[m.from]?.name ?? `UNKNOWN(${m.from})`;
      console.log(
        `${m.thread ? "    ↳ " : "  "}${who}: ${m.text.replace(/\n/g, "\n      ")}`,
      );
    }
  }
  console.log(`\nInvite: ${seed.invite_user_ids.join(", ")}`);
}

async function findChannel(client: WebClient, name: string) {
  let cursor: string | undefined;
  do {
    const res = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });
    const hit = res.channels?.find((c) => c.name === name);
    if (hit?.id) return { id: hit.id, creator: hit.creator };
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return undefined;
}

async function main() {
  for (const ch of seed.channels)
    for (const m of ch.messages)
      if (!seed.personas[m.from])
        throw new Error(`Unknown persona "${m.from}" in ${m.id}`);

  printPlan();
  if (!post) {
    console.log("\nDry run. Re-run with --post to create channels and post.");
    return;
  }

  const token = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_CLI_XOXB;
  if (!token)
    throw new Error("Set SLACK_BOT_TOKEN (xoxb-...) for the Madrina dev app");
  const client = new WebClient(token);

  const auth = await client.auth.test();
  if (auth.team_id !== seed.team_id) {
    throw new Error(
      `Token is for team ${auth.team_id} (${auth.team}), expected ${seed.team_id}. Aborting.`,
    );
  }
  console.log(`\nPosting to ${auth.team} (${auth.team_id}) as ${auth.user}`);

  if (reset) {
    const suffix = Date.now().toString().slice(-4);
    for (const ch of seed.channels) {
      const old = await findChannel(client, ch.name);
      if (!old) continue;
      // Only archive channels this bot created. A same-named channel someone else made
      // may hold real conversations, so leave it alone and stop.
      if (old.creator !== auth.user_id) {
        throw new Error(
          `#${ch.name} exists but wasn't created by this bot, so --reset won't archive it. Rename or archive it by hand, then run again.`,
        );
      }
      const oldId = old.id;
      await client.conversations.rename({
        channel: oldId,
        name: `${ch.name}-old-${suffix}`,
      });
      await client.conversations.archive({ channel: oldId });
      console.log(`archived old #${ch.name} as #${ch.name}-old-${suffix}`);
    }
  }

  for (const ch of seed.channels) {
    let channelId: string | undefined;
    let existed = false;
    try {
      const res = await client.conversations.create({
        name: ch.name,
        is_private: ch.private,
      });
      channelId = res.channel?.id;
    } catch (err) {
      if ((err as { data?: { error?: string } }).data?.error !== "name_taken")
        throw err;
      channelId = (await findChannel(client, ch.name))?.id;
      existed = true;
    }
    if (!channelId)
      throw new Error(`#${ch.name} exists but the bot can't see it`);
    if (existed && !force) {
      console.log(
        `#${ch.name} already exists, skipping (use --force to post anyway)`,
      );
      continue;
    }

    try {
      await client.conversations.setTopic({
        channel: channelId,
        topic: ch.topic,
      });
    } catch (err) {
      console.warn(`  topic not set on #${ch.name}: ${(err as Error).message}`);
    }
    if (ch.purpose) {
      try {
        await client.conversations.setPurpose({
          channel: channelId,
          purpose: ch.purpose,
        });
      } catch (err) {
        console.warn(
          `  purpose not set on #${ch.name}: ${(err as Error).message}`,
        );
      }
    }
    try {
      await client.conversations.invite({
        channel: channelId,
        users: seed.invite_user_ids.join(","),
      });
    } catch (err) {
      const code = (err as { data?: { error?: string } }).data?.error;
      if (code !== "already_in_channel")
        console.warn(`  invite failed on #${ch.name}: ${code}`);
    }

    const tsById: Record<string, string> = {};
    for (const m of ch.messages) {
      const persona = seed.personas[m.from];
      const thread_ts = m.thread ? tsById[m.thread] : undefined;
      if (m.thread && !thread_ts)
        throw new Error(`Thread parent ${m.thread} not posted before ${m.id}`);
      const res = await client.chat.postMessage({
        channel: channelId,
        text: m.text,
        username: persona.name,
        ...(persona.icon_url
          ? { icon_url: persona.icon_url }
          : { icon_emoji: persona.icon_emoji }),
        thread_ts,
        unfurl_links: false,
        // Lets Madrina tell which persona posted, so she only flags asks from someone other than Ana.
        metadata: {
          event_type: "madrina_seed",
          event_payload: { persona: m.from },
        },
      });
      if (res.ts) tsById[m.id] = res.ts;
      await sleep(1100); // stay under chat.postMessage's ~1/sec per-channel limit
    }
    console.log(`#${ch.name}: posted ${ch.messages.length} messages`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
