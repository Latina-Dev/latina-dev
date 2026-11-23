"use client";

import { useEffect, useRef, useState } from "react";

import { legacyHashTarget } from "@/lib/jobSearchLegacy";

import styles from "./JobSearch.module.css";

interface Props {
  steps: { slug: string; number: number; title: string }[];
}

/**
 * The sticky list of the five steps. It marks the step you are reading, and sends old
 * engjobsearch.com links (#/03-apply/README and so on) to their new place.
 */
export default function StepNav({ steps }: Props) {
  const [current, setCurrent] = useState(steps[0]?.slug);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const target = legacyHashTarget(window.location.hash);
    if (target) window.location.replace(target);
  }, []);

  useEffect(() => {
    const sections = steps
      .map((step) => document.getElementById(step.slug))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setCurrent(visible[0].target.id);
      },
      // A step counts as current once its top reaches the upper third of the screen
      { rootMargin: "0px 0px -66% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [steps]);

  // On narrow screens the steps are a strip that scrolls sideways: keep the current one in view
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: link.offsetLeft - list.offsetLeft - 16, behavior: "smooth" });
  }, [current]);

  return (
    <nav className={styles.nav} aria-label="Steps">
      <ol ref={listRef}>
        {steps.map((step) => (
          <li key={step.slug}>
            <a href={`#${step.slug}`} aria-current={current === step.slug ? "step" : undefined}>
              <span className={styles.navNumber}>{step.number}</span>
              {step.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
