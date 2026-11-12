"use client";

import { useEffect, useState } from "react";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Same look as the member directory's search box
import styles from "@/components/MemberDirectory/DirectorySearch.module.css";

import { useUrlQuery } from "@/lib/hooks/useUrlQuery";

import filters from "./ResourceSearch.module.css";

interface Props {
  listId: string; // wrapper whose sections hold items with data-search, data-types and data-stages
  countId: string; // element showing how many resources match
  total: number;
  types: string[]; // resource types on this page, e.g. "Job board"
  stages: string[]; // career stages on this page, e.g. "College"
}

// A chosen option only counts if this page offers it, so a stale link can't hide everything
const valid = (value: string, options: string[]) => (options.includes(value) ? value : "");

/**
 * Filters the server-rendered resource list as you type or pick a type or stage, hiding sections
 * with no matches. Without JavaScript the full list still shows. ?q=, ?type= and ?stage= in the
 * URL fill the controls on load, and the URL follows the controls so a filtered list can be shared.
 */
export default function ResourceSearch({ listId, countId, total, types, stages }: Props) {
  // The URL fills each control after hydration, then the visitor's choice takes over.
  const urlQuery = useUrlQuery();
  const urlType = useUrlQuery("type");
  const urlStage = useUrlQuery("stage");
  const [typed, setQuery] = useState<string | null>(null);
  const [pickedType, setType] = useState<string | null>(null);
  const [pickedStage, setStage] = useState<string | null>(null);
  const query = typed ?? urlQuery;
  const type = valid(pickedType ?? urlType, types);
  const stage = valid(pickedStage ?? urlStage, stages);
  const touched = typed !== null || pickedType !== null || pickedStage !== null;

  useEffect(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = document.getElementById(listId);
    if (!list) return;
    let shown = 0;
    list.querySelectorAll<HTMLElement>("section").forEach((section) => {
      let shownInSection = 0;
      section.querySelectorAll<HTMLElement>("[data-search]").forEach((item) => {
        const text = item.dataset.search ?? "";
        const match =
          terms.every((term) => text.includes(term)) &&
          (!type || (item.dataset.types ?? "").split("|").includes(type)) &&
          (!stage || (item.dataset.stages ?? "").split("|").includes(stage));
        item.hidden = !match;
        if (match) shownInSection++;
      });
      section.hidden = shownInSection === 0;
      shown += shownInSection;
    });
    const filtered = terms.length > 0 || Boolean(type) || Boolean(stage);
    const count = document.getElementById(countId);
    if (count) count.textContent = filtered ? `${shown} of ${total}` : `${total}`;
    const empty = document.getElementById(`${listId}-empty`);
    if (empty) empty.hidden = shown > 0;
  }, [query, type, stage, listId, countId, total]);

  // Keep the URL in step once the visitor changes something, without adding history entries
  useEffect(() => {
    if (!touched) return;
    const url = new URL(window.location.href);
    for (const [name, value] of [
      ["q", query.trim()],
      ["type", type],
      ["stage", stage],
    ]) {
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    window.history.replaceState(window.history.state, "", url);
  }, [touched, query, type, stage]);

  return (
    <form role="search" className={filters.form} onSubmit={(e) => e.preventDefault()}>
      <div className={`${styles.search} ${filters.search}`}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.icon} aria-hidden="true" />
        <label htmlFor="resource-search" className={styles.label}>
          Search resources
        </label>
        <input
          id="resource-search"
          name="q"
          type="search"
          placeholder="Try mentorship, AI, scholarships or jobs"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className={filters.selects}>
        <label className={filters.select}>
          <span>Type</span>
          <select
            id="resource-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            {types.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={filters.select}>
          <span>Stage</span>
          <select
            id="resource-stage"
            name="stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}>
            <option value="">Any stage</option>
            {stages.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
