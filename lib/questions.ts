import fs from "fs";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { z } from "zod";

import { parseFrontmatter } from "@/lib/frontmatter";
import { siteName, siteUrl } from "@/lib/site";

// Questions members ask in the Latina Dev Slack's Q&A channel, with the answers from each thread.
// scripts/sync-slack-questions.ts copies them from Slack into data/questions, one file per thread,
// and Slack stays the source of truth: a message deleted there, or hidden by an organizer with a
// 🚫 reaction, leaves the site on the next sync. These pages only display them.

export const questionsDataPath = "data/questions";

export const questionsPath = "/questions";

export const questionsTitle = "Questions from Latina software engineers";
export const questionsDescription =
  "Career questions asked and answered by Latina software engineers in the Latina Dev community: job hunting, negotiating, promotions, leadership and more.";

// Where members go to ask or answer: the Slack channel, which needs a Slack account. Everyone
// else joins through the directory, which comes with a Slack invite
export const askChannelName = "#ask";
export const joinPath = "/add-member";
export const slackUrl = "https://latinadev.slack.com";

const text = z
  .string()
  .min(1, "must not be empty")
  .refine((value) => value === value.trim(), "must not start or end with a space");

const slackTs = z.string().regex(/^\d+\.\d+$/, "must be a Slack message timestamp");

const isoDate = z.iso.datetime({
  message: "must be an ISO date and time, e.g. 2026-11-12T15:00:00Z",
});

const memberSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a member profile slug")
  .optional();

const answerSchema = z.strictObject({
  ts: slackTs,
  date: isoDate,
  author: text,
  authorSlug: memberSlug, // set when the Slack account matches a directory profile
  text,
});

/** Frontmatter of each file in data/questions. Unknown keys fail the build */
const questionSchema = z.strictObject({
  title: text,
  asked: isoDate,
  slackTs,
  author: text,
  authorSlug: memberSlug,
  answers: z.array(answerSchema).min(1, "a question is only published once it has an answer"),
});

export type QuestionFrontmatter = z.infer<typeof questionSchema>;

interface Answer extends z.infer<typeof answerSchema> {
  id: string; // anchor on the page, e.g. answer-1731423600-000100
}

export interface Question extends Omit<QuestionFrontmatter, "answers"> {
  slug: string;
  path: string;
  url: string;
  body: string; // Markdown of the question itself
  answers: Answer[];
  updated: string; // the latest answer's date
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Anchor id for an answer, from its Slack timestamp */
const answerId = (ts: string) => `answer-${ts.replace(".", "-")}`;

/**
 * Validate one question file
 * @param file e.g. how-do-i-negotiate.md
 * @param markdown the file's contents
 */
export const parseQuestionFile = (file: string, markdown: string): Question => {
  const slug = file.replace(/\.md$/, "");
  if (!file.endsWith(".md") || !slugPattern.test(slug)) {
    throw new Error(
      `${questionsDataPath}/${file}: file names must be lowercase words joined by dashes`
    );
  }
  const { data, content } = parseFrontmatter(markdown);
  const result = questionSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`${questionsDataPath}/${file}\n${z.prettifyError(result.error)}`);
  }
  const answers = result.data.answers.map((answer) => ({ ...answer, id: answerId(answer.ts) }));
  const path = `${questionsPath}/${slug}`;
  return {
    ...result.data,
    slug,
    path,
    url: `${siteUrl}${path}`,
    body: content.trim(),
    answers,
    updated:
      answers
        .map((answer) => answer.date)
        .sort()
        .at(-1) ?? result.data.asked,
  };
};

/** Every published question, newest first */
export const getQuestions = (): Question[] => {
  let files: string[];
  try {
    files = fs.readdirSync(questionsDataPath).filter((file) => file.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map((file) => parseQuestionFile(file, fs.readFileSync(`${questionsDataPath}/${file}`, "utf8")))
    .sort((a, b) => b.asked.localeCompare(a.asked));
};

export const getQuestion = (slug: string) => getQuestions().find((q) => q.slug === slug);

/** Member text from Slack, so raw HTML is stripped */
export const renderMarkdown = async (markdown: string) =>
  String(await unified().use(remarkParse).use(remarkHtml, { sanitize: true }).process(markdown));

/**
 * Plain text of a member's Markdown, for structured data, feeds and search. Code and link
 * destinations are set aside first, so formatting marks are only removed from prose and
 * `_private_` or https://a.com/?t=_x_ come through unchanged
 */
export const plainText = (markdown: string) => {
  const kept: string[] = [];
  const keep = (text: string) => `\u0000${kept.push(text) - 1}\u0000`;
  return (
    markdown
      .replace(/```\w*\n?([\s\S]*?)```/g, (_, code: string) => keep(code))
      .replace(/`([^`\n]+)`/g, (_, code: string) => keep(code))
      // A destination may hold one level of parentheses, as Slack links to Wikipedia often do
      .replace(
        /!?\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g,
        (_, label: string, url: string) => `${label} (${keep(url)})`
      )
      .replace(/\\\n/g, "\n")
      .replace(/^(- |> ?|#+ )/gm, "")
      // Underscores only in pairs that mark emphasis, so my_repo stays whole
      .replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, "$1$2")
      .replace(/[*~]/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\u0000(\d+)\u0000/g, (_, i: string) => kept[Number(i)])
      .replace(/\s+/g, " ")
      .trim()
  );
};

/** A date for readers, e.g. "November 12, 2026" */
export const formatQuestionDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

/** A short description of a question for search results and link previews */
export const questionDescription = (question: Question) => {
  const answers = question.answers.length === 1 ? "1 answer" : `${question.answers.length} answers`;
  const summary = plainText(question.body);
  const lead = summary.length > 140 ? `${summary.slice(0, 137).replace(/\s+\S*$/, "")}…` : summary;
  return `${lead} ${answers} from Latina software engineers in the ${siteName} community.`;
};

const person = (name: string, slug?: string) => ({
  "@type": "Person",
  name,
  ...(slug
    ? { "@id": `${siteUrl}/members/${slug}#person`, url: `${siteUrl}/members/${slug}` }
    : {}),
});

/** A question page as schema.org QAPage, with every answer as a suggested answer */
export const questionJsonLd = (question: Question) => ({
  "@context": "https://schema.org",
  "@type": "QAPage",
  "@id": question.url,
  url: question.url,
  inLanguage: "en",
  isPartOf: { "@id": `${siteUrl}/#website` },
  publisher: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: siteName },
  mainEntity: {
    "@type": "Question",
    name: question.title,
    text: plainText(question.body) || question.title,
    answerCount: question.answers.length,
    dateCreated: question.asked,
    author: person(question.author, question.authorSlug),
    suggestedAnswer: question.answers.map((answer) => ({
      "@type": "Answer",
      text: plainText(answer.text),
      dateCreated: answer.date,
      url: `${question.url}#${answer.id}`,
      author: person(answer.author, answer.authorSlug),
    })),
  },
});

/** One question with its answers in plain text, for the feeds and the MCP server */
export const questionForAgents = (question: Question) => ({
  title: question.title,
  url: question.url,
  asked: question.asked,
  updated: question.updated,
  author: question.author,
  ...(question.authorSlug ? { authorProfile: `${siteUrl}/members/${question.authorSlug}` } : {}),
  question: plainText(question.body),
  answers: question.answers.map((answer) => ({
    author: answer.author,
    ...(answer.authorSlug ? { authorProfile: `${siteUrl}/members/${answer.authorSlug}` } : {}),
    date: answer.date,
    url: `${question.url}#${answer.id}`,
    text: plainText(answer.text),
  })),
});

/** Every question and answer in one Markdown file, the easiest format for an assistant to read */
export const questionsMarkdown = (questions = getQuestions()) =>
  [
    `# ${questionsTitle}`,
    "",
    `${questionsDescription} Members ask and answer in the ${siteName} Slack; each answered thread is published at ${siteUrl}${questionsPath}.`,
    "",
    ...questions.flatMap((question) => [
      `## [${question.title}](${question.url})`,
      "",
      `Asked by ${question.author} on ${question.asked.slice(0, 10)}`,
      "",
      question.body,
      "",
      ...question.answers.flatMap((answer) => [
        `### Answer from ${answer.author} (${answer.date.slice(0, 10)})`,
        "",
        answer.text,
        "",
      ]),
    ]),
  ].join("\n");
