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
    let observer: IntersectionObserver | undefined;
    const intersecting = new Set<string>();

    const observe = () => {
      observer?.disconnect();
      intersecting.clear();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) intersecting.add(entry.target.id);
            else intersecting.delete(entry.target.id);
          });
          // The last step, in page order, that reaches the band is the one being read
          const inBand = steps.filter((step) => intersecting.has(step.slug));
          if (inBand.length) setCurrent(inBand[inBand.length - 1].slug);
        },
        // A step counts as current once its top reaches the upper third of the screen.
        // Percentages here are of the width, so the margin is in pixels of the height.
        { rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.66)}px 0px` }
      );
      sections.forEach((section) => observer?.observe(section));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
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
