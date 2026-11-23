import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";

import { readMemberFiles } from "@/lib/getMembers";
import { parseQuestionFile, questionsDataPath } from "@/lib/questions";
import {
  buildQuestion,
  matchMember,
  questionSlug,
  serializeQuestion,
  SlackPerson,
  SyncContext,
} from "@/lib/questionSync";
import { moderatorIds, syncedChannels } from "@/lib/slack/channels";
import { slackReader } from "@/lib/slack/client";
import { SlackMessage } from "@/lib/slack/mrkdwn";

// Copies the Slack Q&A channel into data/questions, so each answered question gets a public page
// on latina.dev/questions. Run hourly by .github/workflows/questions.yml, or by hand:
//
//   SLACK_QUESTIONS_TOKEN=xoxb-… SLACK_QUESTIONS_CHANNEL_ID=C… npm run questions:sync
//
// Environment:
//   SLACK_QUESTIONS_TOKEN       bot token with channels:history and users:read
//   SLACK_QUESTIONS_CHANNEL_ID  the public channel members ask in, e.g. #ask
//   SLACK_MODERATOR_IDS         comma-separated Slack user ids whose 🚫 reaction hides a message
//   QUESTIONS_SYNC_DAYS         how far back to read, 60 by default. Slack's free plan hides
//                               messages after 90 days, so this stays well inside that: a question
//                               older than the window is left as it is, never removed because
//                               Slack stopped showing it
//
// Slack is the source of truth for everything inside that window: a question or answer that was
// deleted, edited or hidden there is removed or updated here. Writes a summary to
// questions-sync.md for the pull request body.

const token = process.env.SLACK_QUESTIONS_TOKEN ?? "";
const channel = process.env[syncedChannels.questions.envVar] ?? "";
if (!token || !channel) {
  throw new Error("Set SLACK_QUESTIONS_TOKEN and SLACK_QUESTIONS_CHANNEL_ID");
}
const days = Number(process.env.QUESTIONS_SYNC_DAYS ?? 60);
if (!Number.isFinite(days) || days < 1) throw new Error("QUESTIONS_SYNC_DAYS must be 1 or more");
const moderators = moderatorIds();
// More removals than this at once looks like a wrong channel or token, so nothing is removed
const maxRemovals = 10;

const slack = slackReader(token);

async function main() {
  const cutoff = Date.now() / 1000 - days * 24 * 60 * 60;
  const history = await slack.history(channel, cutoff);
  // Top-level messages only: a reply also sent to the channel shows up in history too
  const questions = history.filter((m) => !m.thread_ts || m.thread_ts === m.ts);

  const threads = new Map<string, SlackMessage[]>();
  for (const question of questions) {
    if (!question.reply_count) continue;
    threads.set(question.ts, await slack.replies(channel, question.ts));
  }

  // Names for everyone who asked, answered or was mentioned
  const userIds = new Set<string>();
  for (const message of [...questions, ...[...threads.values()].flat()]) {
    if (message.user) userIds.add(message.user);
    for (const [, id] of (message.text ?? "").matchAll(/<@([A-Z0-9]+)/g)) userIds.add(id);
  }
  const members = readMemberFiles().map(({ slug, data }) => ({ slug, name: data.name }));
  const people = new Map<string, SlackPerson>();
  for (const id of userIds) {
    try {
      const name = await slack.userName(id);
      const slug = matchMember(name, members);
      people.set(id, { name, ...(slug ? { slug } : {}) });
    } catch (error) {
      console.warn(`Couldn't look up Slack user ${id}: ${(error as Error).message}`);
    }
  }

  const context: SyncContext = { people, channels: new Map(), moderators };

  // Existing files, by the Slack message they came from, so a question keeps its URL when edited
  if (!existsSync(questionsDataPath)) mkdirSync(questionsDataPath, { recursive: true });
  const existing = new Map<string, { slug: string; asked: string; content: string }>();
  for (const file of readdirSync(questionsDataPath).filter((f) => f.endsWith(".md"))) {
    const content = readFileSync(`${questionsDataPath}/${file}`, "utf8");
    const question = parseQuestionFile(file, content);
    existing.set(question.slackTs, { slug: question.slug, asked: question.asked, content });
  }
  const taken = new Set([...existing.values()].map((q) => q.slug));

  const added: string[] = [];
  const updated: string[] = [];
  const published = new Set<string>();
  for (const question of questions) {
    const built = buildQuestion(question, threads.get(question.ts) ?? [], context);
    if (!built) continue;
    published.add(question.ts);
    const previous = existing.get(question.ts);
    const slug = previous?.slug ?? questionSlug(built.frontmatter.title, taken);
    taken.add(slug);
    const content = serializeQuestion(built.frontmatter, built.body);
    if (previous?.content === content) continue;
    // Check the file before writing it, so a bad conversion fails here rather than in the build
    parseQuestionFile(`${slug}.md`, content);
    writeFileSync(`${questionsDataPath}/${slug}.md`, content);
    (previous ? updated : added).push(
      `[${built.frontmatter.title}](https://latina.dev/questions/${slug})`
    );
  }

  // Gone from Slack, hidden or no longer answered: only judged inside the window Slack returned
  const removals = [...existing.entries()].filter(
    ([ts, question]) => !published.has(ts) && new Date(question.asked).getTime() / 1000 >= cutoff
  );
  if (removals.length > maxRemovals) {
    throw new Error(
      `${removals.length} questions would be removed at once, more than ${maxRemovals}. Check the channel and token, then remove them by hand if that's right`
    );
  }
  for (const [, question] of removals) rmSync(`${questionsDataPath}/${question.slug}.md`);

  const section = (title: string, items: string[]) =>
    items.length ? [`### ${title}`, "", ...items.map((item) => `- ${item}`), ""] : [];
  const report = [
    "Questions and answers from the Slack Q&A channel, copied by the hourly sync.",
    "",
    "This merges on its own once checks pass. To take something off the site, delete it in Slack or react to it with :no_entry_sign: (organizers, or whoever wrote it), and the next sync removes it.",
    "",
    ...section("New", added),
    ...section("Updated", updated),
    ...section(
      "Removed",
      removals.map(([, q]) => q.slug)
    ),
  ].join("\n");
  writeFileSync("questions-sync.md", report);
  console.log(
    `${questions.length} messages read, ${added.length} added, ${updated.length} updated, ${removals.length} removed`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
