import { dump } from "js-yaml";

import { QuestionFrontmatter, slugPattern } from "@/lib/questions";
import { isModerator } from "@/lib/slack/channels";
import {
  isMemberMessage,
  MentionNames,
  SlackMessage,
  slackToMarkdown,
  tsToIso,
} from "@/lib/slack/mrkdwn";

export type { SlackMessage } from "@/lib/slack/mrkdwn";
export { slackToMarkdown, tsToIso } from "@/lib/slack/mrkdwn";

// Turns Slack threads from the Q&A channel into files for data/questions. Pure functions, so the
// rules about what gets published are tested without Slack: scripts/sync-slack-questions.ts does
// the API calls.

export interface SlackPerson {
  name: string;
  slug?: string; // directory profile, when the Slack account matches one
}

export interface SyncContext extends MentionNames {
  people: Map<string, SlackPerson>; // Slack user id to name and profile
  moderators: Set<string>; // Slack user ids whose 🚫 hides a message
}

/** Organizers hide a question or answer by reacting with this, without deleting it in Slack */
const hideReaction = "no_entry_sign";

/**
 * Whether a message has been hidden with 🚫 by an organizer or by the person who wrote it. Slack
 * can leave people out of a reaction's user list, so when the list is shorter than the count the
 * message is hidden rather than risk showing something an organizer took down
 * @param message a Slack message
 * @param moderators Slack user ids of organizers
 */
export const isHidden = (message: SlackMessage, moderators: Set<string>) =>
  (message.reactions ?? []).some(
    (reaction) =>
      reaction.name === hideReaction &&
      ((reaction.count ?? 0) > reaction.users.length ||
        reaction.users.some((user) => isModerator(user, moderators) || user === message.user))
  );

/**
 * A title for a question: its first sentence that ends in "?", or else its first line, shortened
 * @param markdown the question as Markdown
 */
export const questionTitle = (markdown: string) => {
  const firstLine =
    markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>\\]/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "Question";
  const question = /^(.*?\?)(\s|$)/.exec(firstLine)?.[1];
  if (question && question.length <= 150) return question;
  if (firstLine.length <= 100) return firstLine;
  return `${firstLine.slice(0, 99).replace(/\s+\S*$/, "")}…`;
};

/**
 * A URL slug for a new question, unique among the slugs already taken
 * @param title the question's title
 * @param taken slugs in use
 */
export const questionSlug = (title: string, taken: Set<string>) => {
  const full = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Long titles are cut at the last whole word that fits
  const base = (full.length > 60 ? full.slice(0, 61).replace(/-[^-]*$/, "") : full) || "question";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  if (!slugPattern.test(slug)) throw new Error(`Bad question slug: ${slug}`);
  return slug;
};

const personFor = (id: string | undefined, context: SyncContext): SlackPerson =>
  (id && context.people.get(id)) || { name: "A Latina Dev member" };

/**
 * Build the frontmatter for a thread, or nothing when it shouldn't be on the site: the question
 * is hidden, or no one other than the asker has answered yet
 * @param question the thread's first message
 * @param replies the rest of the thread
 * @param context names and moderators
 */
export const buildQuestion = (
  question: SlackMessage,
  replies: SlackMessage[],
  context: SyncContext
): { frontmatter: QuestionFrontmatter; body: string } | undefined => {
  if (!isMemberMessage(question) || isHidden(question, context.moderators)) return undefined;

  const answers = replies
    .filter((reply) => reply.ts !== question.ts)
    .filter((reply) => isMemberMessage(reply) && !isHidden(reply, context.moderators))
    .sort((a, b) => Number(a.ts) - Number(b.ts))
    .map((reply) => {
      const person = personFor(reply.user, context);
      return {
        ts: reply.ts,
        date: tsToIso(reply.ts),
        author: person.name,
        ...(person.slug ? { authorSlug: person.slug } : {}),
        text: slackToMarkdown(reply.text!, context),
        user: reply.user,
      };
    })
    .filter((answer) => answer.text);
  if (!answers.some((answer) => answer.user !== question.user)) return undefined;

  const body = slackToMarkdown(question.text!, context);
  const asker = personFor(question.user, context);
  return {
    frontmatter: {
      title: questionTitle(body),
      asked: tsToIso(question.ts),
      slackTs: question.ts,
      author: asker.name,
      ...(asker.slug ? { authorSlug: asker.slug } : {}),
      answers: answers.map(({ user: _user, ...answer }) => answer),
    },
    body,
  };
};

/**
 * The contents of a question file
 * @param frontmatter from buildQuestion
 * @param body the question as Markdown
 */
export const serializeQuestion = (frontmatter: QuestionFrontmatter, body: string) =>
  `---\n${dump(frontmatter, { lineWidth: -1 })}---\n\n${body}\n`;

/**
 * Normalize a person's name so a Slack name can be matched to a directory profile
 * @param name e.g. "Frances Coronel"
 */
const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The directory profile for a Slack name, only when exactly one member has that full name
 * @param name the Slack account's full name
 * @param members name and slug of every member
 */
export const matchMember = (name: string, members: { name: string; slug: string }[]) => {
  const target = normalizeName(name);
  if (!target.includes(" ")) return undefined;
  const matches = members.filter((member) => normalizeName(member.name) === target);
  return matches.length === 1 ? matches[0].slug : undefined;
};
