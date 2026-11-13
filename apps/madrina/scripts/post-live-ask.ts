/**
 * Posts one synthetic ask from data/slack-seed.json `live_asks` into its (already seeded)
 * channel as the persona, so Madrina's glue-work flag fires live during the demo.
 *
 *   pnpm tsx scripts/post-live-ask.ts             # dry run: lists the live asks
 *   pnpm tsx scripts/post-live-ask.ts dana-swag   # posts that ask
 *
 * Token from SLACK_BOT_TOKEN or SLACK_CLI_XOXB. Refuses any team other than the seed's team_id.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WebClient } from "@slack/web-api";

type Persona = { name: string; icon_emoji: string; icon_url?: string };
type LiveAsk = { id: string; channel: string; from: string; text: string };
type Seed = {
  team_id: string;
  personas: Record<string, Persona>;
  live_asks: LiveAsk[];
};

const seed: Seed = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "..", "data", "slack-seed.json"),
    "utf8",
  ),
);

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
    if (hit?.id) return hit.id;
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return undefined;
}

async function main() {
  const id = process.argv[2];
  const ask = seed.live_asks.find((a) => a.id === id);
  if (!ask) {
    for (const a of seed.live_asks)
      console.log(
        `${a.id}  #${a.channel}  ${seed.personas[a.from]?.name}: ${a.text}`,
      );
    console.log(id ? `\nNo live ask "${id}".` : "\nPass an id to post it.");
    return;
  }
  const persona = seed.personas[ask.from];
  if (!persona) throw new Error(`Unknown persona "${ask.from}"`);

  const token = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_CLI_XOXB;
  if (!token)
    throw new Error("Set SLACK_BOT_TOKEN (xoxb-...) for the Madrina dev app");
  const client = new WebClient(token);
  const auth = await client.auth.test();
  if (auth.team_id !== seed.team_id)
    throw new Error(
      `Token is for team ${auth.team_id}, expected ${seed.team_id}. Aborting.`,
    );

  const channel = await findChannel(client, ask.channel);
  if (!channel)
    throw new Error(
      `#${ask.channel} not found. Run scripts/seed-slack.ts --post first.`,
    );
  await client.chat.postMessage({
    channel,
    text: ask.text,
    username: persona.name,
    ...(persona.icon_url
      ? { icon_url: persona.icon_url }
      : { icon_emoji: persona.icon_emoji }),
    unfurl_links: false,
    metadata: {
      event_type: "madrina_seed",
      event_payload: { persona: ask.from },
    },
  });
  console.log(`Posted ${ask.id} to #${ask.channel} as ${persona.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
