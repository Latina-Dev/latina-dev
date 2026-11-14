"use client";

import { useState } from "react";
import Link from "next/link";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import {
  isNeedId,
  isStageId,
  matchSupport,
  SupportData,
  SupportNeedId,
  supportNeeds,
  SupportStageId,
  supportStages,
} from "@/lib/findSupport";
import { joinLabel, joinPath } from "@/lib/join";

import styles from "./page.module.css";

const maxResources = 6;

/** Choices as the URL holds them (?stage=…&need=…), so a result can be shared or bookmarked */
const choicesFromUrl = (params: URLSearchParams | ReadonlyURLSearchParams) => {
  const stage = params.get("stage");
  const need = params.get("need");
  return {
    stage: isStageId(stage) ? stage : undefined,
    need: isNeedId(need) ? need : undefined,
  };
};

/**
 * Two questions, then results. The URL is the only place choices are kept, so the page always
 * shows what its link describes, including after the navbar link clears the query
 */
export default function FindSupport({ data }: { data: SupportData }) {
  const fromUrl = choicesFromUrl(useSearchParams());
  // Next.js updates useSearchParams after replaceState in a transition, so the choice is also kept
  // here for the click itself, and taken from the URL again whenever the URL changes
  const urlKey = `${fromUrl.stage}|${fromUrl.need}`;
  const [choice, setChoice] = useState<{ stage?: SupportStageId; need?: SupportNeedId }>(fromUrl);
  const [seenKey, setSeenKey] = useState(urlKey);
  if (urlKey !== seenKey) {
    setSeenKey(urlKey);
    setChoice(fromUrl);
  }
  const choose = (next: { stage?: SupportStageId; need?: SupportNeedId }) => {
    setChoice(next);
    const params = new URLSearchParams();
    if (next.stage) params.set("stage", next.stage);
    if (next.need) params.set("need", next.need);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };
  return <FindSupportView data={data} stage={choice.stage} need={choice.need} onChoose={choose} />;
}

/**
 * The questions and results for given choices. Also the server-rendered page before the URL is
 * read, with nothing chosen
 */
export function FindSupportView({
  data,
  stage,
  need,
  onChoose = () => {},
}: {
  data: SupportData;
  stage?: SupportStageId;
  need?: SupportNeedId;
  onChoose?: (next: { stage?: SupportStageId; need?: SupportNeedId }) => void;
}) {
  const result = stage && need ? matchSupport(data, stage, need) : undefined;

  return (
    <div className={`page-width ${styles.page}`}>
      <form className={styles.questions} onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>
            <span className={styles.step}>01</span> Where are you right now?
          </legend>
          <div className={styles.choices}>
            {supportStages.map((option) => (
              <label key={option.id} className={styles.choice}>
                <input
                  type="radio"
                  name="stage"
                  value={option.id}
                  checked={stage === option.id}
                  onChange={() => onChoose({ stage: option.id, need })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <span className={styles.step}>02</span> What would help most?
          </legend>
          <div className={styles.choices}>
            {supportNeeds.map((option) => (
              <label key={option.id} className={styles.choice}>
                <input
                  type="radio"
                  name="need"
                  value={option.id}
                  checked={need === option.id}
                  onChange={() => onChoose({ stage, need: option.id })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      <section className={styles.results} aria-live="polite" aria-labelledby="results-heading">
        {!result ? (
          <p className={styles.hint} id="results-heading">
            Choose one answer for each question to see where to start. Or browse{" "}
            <Link href="/resources">every resource</Link>, the{" "}
            <Link href="/members">member directory</Link> and{" "}
            <Link href="/questions">questions members answered</Link>.
          </p>
        ) : (
          <>
            <h2 id="results-heading">
              {result.need.label} for when you&apos;re {result.stage.label.toLowerCase()}
            </h2>

            {result.mentors.length > 0 && (
              <div className={styles.block}>
                <h3>Members open to mentoring</h3>
                <p className={styles.note}>
                  Reach out on LinkedIn from their profile, and say you found them on Latina Dev.
                </p>
                <ul className={styles.cards}>
                  {result.mentors.slice(0, maxResources).map((mentor) => (
                    <li key={mentor.path} className={styles.card}>
                      <Link href={mentor.path}>{mentor.name}</Link>
                      <p>{mentor.affiliation ?? mentor.level}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.block}>
              <h3>Where to start</h3>
              {result.broadened && (
                <p className={styles.note}>
                  Nothing is tagged for exactly this stage yet, so these are tagged for other
                  stages.
                </p>
              )}
              {result.resources.length ? (
                <ul className={styles.cards}>
                  {result.resources.slice(0, maxResources).map((resource) => (
                    <li key={resource.url} className={styles.card}>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.name}
                      </a>
                      <p>{resource.description}</p>
                      <Link href={resource.page} className={styles.more}>
                        More like this
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.note}>
                  We don&apos;t list anything for this yet.{" "}
                  <Link href="/resources">Browse every resource</Link>, or ask the community below.
                </p>
              )}
              {result.resources.length > maxResources && (
                <p className={styles.note}>
                  Showing {maxResources} of {result.resources.length}.{" "}
                  <Link href="/resources">See all resources</Link>
                </p>
              )}
            </div>

            {result.guides.length > 0 && (
              <div className={styles.block}>
                <h3>Advice</h3>
                <ul className={styles.cards}>
                  {result.guides.map((guide) => (
                    <li key={guide.path} className={styles.card}>
                      <Link href={guide.path}>{guide.title}</Link>
                      <p>{guide.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.block}>
              <h3>Ask other Latina engineers</h3>
              <p className={styles.note}>
                Members answer each other in the <strong>#ask</strong> channel of our Slack, and
                every answered question is published on{" "}
                <Link href="/questions">latina.dev/questions</Link>.{" "}
                <Link href={joinPath}>{joinLabel}</Link> to get an invite.
              </p>
              {result.questions.length > 0 && (
                <ul className={styles.links}>
                  {result.questions.map((question) => (
                    <li key={question.path}>
                      <Link href={question.path}>{question.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
