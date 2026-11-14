import { MemberFrontmatter } from "@/lib/memberSchema";
import { siteUrl } from "@/lib/site";

/**
 * Site-to-Slack announcements: when a new member, answered question or guide lands on
 * latina.dev, the bot says so in #announcements, so members see the community growing and come
 * back. scripts/slack-announce.ts finds what a push to main added and posts these messages.
 */

export type Announcement =
  | { kind: "member"; slug: string; profile: Pick<MemberFrontmatter, "name" | "affiliation"> }
  | { kind: "question"; title: string; url: string; answers: number }
  | { kind: "guide"; title: string; description: string; path: string };

// Slack mrkdwn treats these as formatting, so site text has them escaped
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Data files whose addition is announced, and what kind each is
const announcedPaths: [RegExp, Announcement["kind"]][] = [
  [/^data\/members\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/, "member"],
  [/^data\/questions\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/, "question"],
  [/^data\/guides\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/, "guide"],
];

/**
 * Sort the files a push added into things to announce
 * @param paths repo paths from `git diff --name-only --diff-filter=A`
 * @returns kind and slug of each new member, question and guide, in that order
 */
export const announcedFiles = (paths: string[]) =>
  announcedPaths.flatMap(([pattern, kind]) =>
    paths.flatMap((path) => {
      const match = pattern.exec(path.trim());
      return match ? [{ kind, slug: match[1] }] : [];
    })
  );

/**
 * The Slack message for one announcement
 * @param item what was added
 */
export const announcementMessage = (item: Announcement) => {
  let text: string;
  switch (item.kind) {
    case "member": {
      const url = `${siteUrl}/members/${item.slug}`;
      const who = item.profile.affiliation ? ` (${escape(item.profile.affiliation)})` : "";
      text = `👋 *<${url}|${escape(item.profile.name)}>*${who} just joined the Latina Dev directory. Say hi!`;
      break;
    }
    case "question":
      text = `💬 New on latina.dev/questions: *<${item.url}|${escape(item.title)}>* (${item.answers} ${item.answers === 1 ? "answer" : "answers"}). Have something to add? Reply in the thread in #ask.`;
      break;
    case "guide":
      text = `📘 New guide: *<${siteUrl}${item.path}|${escape(item.title)}>*\n${escape(item.description)}`;
      break;
  }
  return { text, unfurl_links: false, unfurl_media: false };
};

/**
 * One message for a push that added more than a run should post one by one, e.g. a first sync
 * that copies a backlog of questions
 * @param counts how many of each kind were added
 */
export const summaryMessage = (counts: Partial<Record<Announcement["kind"], number>>) => {
  const parts = [
    counts.member &&
      `${counts.member} new ${counts.member === 1 ? "member" : "members"} (<${siteUrl}/members|directory>)`,
    counts.question &&
      `${counts.question} answered ${counts.question === 1 ? "question" : "questions"} (<${siteUrl}/questions|questions>)`,
    counts.guide &&
      `${counts.guide} new ${counts.guide === 1 ? "guide" : "guides"} (<${siteUrl}/guides|guides>)`,
  ].filter(Boolean);
  return {
    text: `✨ Just added to latina.dev: ${parts.join(", ")}.`,
    unfurl_links: false,
    unfurl_media: false,
  };
};
