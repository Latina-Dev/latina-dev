import Link from "next/link";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import {
  askChannelName,
  formatQuestionDate,
  getQuestions,
  plainText,
  questionsDescription,
  questionsPath,
  questionsTitle,
} from "@/lib/questions";

import type { Metadata } from "next";

import AskCallout from "./AskCallout";
import styles from "./questions.module.css";

const questions = getQuestions();

export const metadata: Metadata = {
  ...pageMetadata({
    title: questionsTitle,
    description: questionsDescription,
    path: questionsPath,
  }),
  // An empty list has nothing for search engines yet
  ...(questions.length ? {} : { robots: { index: false, follow: true } }),
};

const excerpt = (markdown: string) => {
  const text = plainText(markdown);
  return text.length > 200 ? `${text.slice(0, 197).replace(/\s+\S*$/, "")}…` : text;
};

/** Every answered question from the members' Slack, newest first, rendered on the server */
export default function QuestionsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Questions", path: questionsPath },
        ])}
      />
      <PageHero
        eyebrow="Community"
        title="Questions from Latina software engineers"
        lede={
          <p>
            Real questions about careers in tech, asked and answered by Latina Dev members in our
            Slack&apos;s {askChannelName} channel. Read them all here, no account needed.
          </p>
        }
      />
      <div className={`page-width ${styles.page}`}>
        {questions.length ? (
          <>
            <p className={styles.count}>
              {questions.length} {questions.length === 1 ? "question" : "questions"}
            </p>
            <ol className={styles.list}>
              {questions.map((question) => (
                <li key={question.slug} className={styles.item}>
                  <h2>
                    <Link href={question.path}>{question.title}</Link>
                  </h2>
                  <p className={styles.excerpt}>{excerpt(question.body)}</p>
                  <p className={styles.meta}>
                    Asked by {question.author} ·{" "}
                    <time dateTime={question.asked}>{formatQuestionDate(question.asked)}</time> ·{" "}
                    {question.answers.length} {question.answers.length === 1 ? "answer" : "answers"}
                  </p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className={styles.empty}>
            No answered questions yet. The first ones will show up here as soon as members answer
            them in Slack.
          </p>
        )}
        <AskCallout />
      </div>
    </>
  );
}
