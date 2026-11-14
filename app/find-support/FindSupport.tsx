"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

import styles from "./page.module.css";

const maxResources = 6;

/**
 * Two questions, then results. Choices are kept in the URL (?stage=…&need=…) so a result can be
 * shared or bookmarked
 */
export default function FindSupport({ data }: { data: SupportData }) {
  const [stage, setStage] = useState<SupportStageId>();
  const [need, setNeed] = useState<SupportNeedId>();

  // Read a shared link's choices once the page is in the browser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = { stage: params.get("stage"), need: params.get("need") };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after hydration
    if (isStageId(fromUrl.stage)) setStage(fromUrl.stage);
    if (isNeedId(fromUrl.need)) setNeed(fromUrl.need);
  }, []);

  // Written when a choice changes, not in an effect, so a shared link's query isn't wiped before
  // the effect above has read it
  const keepInUrl = (next: { stage?: SupportStageId; need?: SupportNeedId }) => {
    const params = new URLSearchParams();
    if (next.stage) params.set("stage", next.stage);
    if (next.need) params.set("need", next.need);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

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
                  onChange={() => {
                    setStage(option.id);
                    keepInUrl({ stage: option.id, need });
                  }}
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
                  onChange={() => {
                    setNeed(option.id);
                    keepInUrl({ stage, need: option.id });
                  }}
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
                  Nothing is tagged for exactly this stage yet, so these work at any stage.
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
                <Link href="/add-member">Add your profile</Link> to get an invite.
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
