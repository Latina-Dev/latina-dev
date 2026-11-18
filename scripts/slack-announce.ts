import { execFileSync } from "child_process";
import { readFileSync } from "fs";

import { readMemberFiles } from "@/lib/getMembers";
import { getGuides } from "@/lib/guides";
import { callSlack } from "@/lib/profiles/slack";
import { parseQuestionFile, questionsDataPath } from "@/lib/questions";
import {
  announcedFiles,
  Announcement,
  announcementMessage,
  summaryMessage,
} from "@/lib/slack/announcements";
import { postedChannels } from "@/lib/slack/channels";

// Announces new members, answered questions and guides in Slack after a push to main. Run by
// .github/workflows/slack-announcements.yml, or by hand:
//
//   npx tsx scripts/slack-announce.ts <before sha> <after sha>
//
// Needs SLACK_BOT_TOKEN and SLACK_ANNOUNCEMENTS_CHANNEL_ID; without them it prints instead.

// Above this, one summary message is posted instead of one per item
const maxMessages = 5;

const [before, after] = process.argv.slice(2);
const shaPattern = /^[0-9a-f]{40}$/;
if (!shaPattern.test(before ?? "") || !shaPattern.test(after ?? "")) {
  throw new Error("Usage: slack-announce.ts <before sha> <after sha>");
}

const added = execFileSync(
  "git",
  [
    "diff",
    "--name-only",
    "--diff-filter=A",
    before,
    after,
    "--",
    "data/members",
    "data/questions",
    "data/guides",
  ],
  { encoding: "utf8" }
)
  .split("\n")
  .filter(Boolean);

const files = announcedFiles(added);
const members = new Map(readMemberFiles().map((file) => [file.slug, file.data]));
const guides = new Map(getGuides().map((guide) => [guide.slug, guide]));

const items: Announcement[] = files.flatMap(({ kind, slug }): Announcement[] => {
  if (kind === "member") {
    const profile = members.get(slug);
    return profile ? [{ kind, slug, profile }] : [];
  }
  if (kind === "question") {
    const file = `${slug}.md`;
    const question = parseQuestionFile(file, readFileSync(`${questionsDataPath}/${file}`, "utf8"));
    return [{ kind, title: question.title, url: question.url, answers: question.answers.length }];
  }
  const guide = guides.get(slug);
  return guide
    ? [{ kind, title: guide.title, description: guide.description, path: guide.path }]
    : [];
});

async function main() {
  if (items.length === 0) {
    console.log("Nothing new to announce.");
    return;
  }
  const messages =
    items.length > maxMessages
      ? [
          summaryMessage(
            items.reduce<Partial<Record<Announcement["kind"], number>>>(
              (counts, item) => ({ ...counts, [item.kind]: (counts[item.kind] ?? 0) + 1 }),
              {}
            )
          ),
        ]
      : items.map(announcementMessage);

  const channel = process.env[postedChannels.announcements.envVar];
  if (!process.env.SLACK_BOT_TOKEN || !channel) {
    for (const message of messages) console.log(`[dry run] ${message.text}`);
    return;
  }
  for (const message of messages) await callSlack("chat.postMessage", { channel, ...message });
  console.log(`Posted ${messages.length} announcement(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
