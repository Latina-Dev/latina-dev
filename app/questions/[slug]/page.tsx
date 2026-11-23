import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import {
  formatQuestionDate,
  getQuestion,
  getQuestions,
  questionDescription,
  questionJsonLd,
  questionsPath,
  renderMarkdown,
} from "@/lib/questions";

import type { Metadata } from "next";

import AskCallout from "../AskCallout";
import styles from "../questions.module.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getQuestions().map((question) => ({ slug: question.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = getQuestion((await params).slug);
  if (!question) return {};
  return pageMetadata({
    title: question.title,
    description: questionDescription(question),
    path: question.path,
  });
}

/** A member's name, linked to their profile when the Slack account matched one */
const Author = ({ name, slug }: { name: string; slug?: string }) =>
  slug ? <Link href={`/members/${slug}`}>{name}</Link> : <>{name}</>;

export default async function QuestionPage({ params }: Props) {
  const question = getQuestion((await params).slug);
  if (!question) notFound();
  const body = await renderMarkdown(question.body);
  const answers = await Promise.all(
    question.answers.map(async (answer) => ({ ...answer, html: await renderMarkdown(answer.text) }))
  );

  return (
    <>
      <JsonLd
        data={[
          questionJsonLd(question),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Questions", path: questionsPath },
            { name: question.title, path: question.path },
          ]),
        ]}
      />
      <PageHero
        eyebrow={<Link href={questionsPath}>Questions</Link>}
        title={question.title}
        lede={
          <p>
            Asked by <Author name={question.author} slug={question.authorSlug} /> on{" "}
            <time dateTime={question.asked}>{formatQuestionDate(question.asked)}</time>
          </p>
        }
      />
      <article className={`page-width ${styles.page}`}>
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: body }} />
        <h2 className={styles.answersHeading}>
          {answers.length} {answers.length === 1 ? "answer" : "answers"}
        </h2>
        <ol className={styles.answers}>
          {answers.map((answer) => (
            <li key={answer.id} id={answer.id} className={styles.answer}>
              <p className={styles.meta}>
                <Author name={answer.author} slug={answer.authorSlug} /> ·{" "}
                <time dateTime={answer.date}>{formatQuestionDate(answer.date)}</time>
              </p>
              <div className={styles.body} dangerouslySetInnerHTML={{ __html: answer.html }} />
            </li>
          ))}
        </ol>
        <AskCallout heading="Have something to add?" />
        <p className={styles.back}>
          <Link href={questionsPath}>More questions</Link>
        </p>
      </article>
    </>
  );
}
