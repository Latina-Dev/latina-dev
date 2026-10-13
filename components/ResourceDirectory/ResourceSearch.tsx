"use client";

import { useEffect, useState } from "react";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Same look as the member directory's search box
import styles from "@/components/MemberDirectory/DirectorySearch.module.css";

interface Props {
  listId: string; // wrapper whose sections hold items with a data-search attribute
  countId: string; // element showing how many resources match
  total: number;
}

/**
 * Filters the server-rendered resource list as you type, hiding sections with no matches.
 * Without JavaScript the full list still shows. A ?q= in the URL fills the box on load.
 */
export default function ResourceSearch({ listId, countId, total }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = document.getElementById(listId);
    if (!list) return;
    let shown = 0;
    list.querySelectorAll<HTMLElement>("section").forEach((section) => {
      let shownInSection = 0;
      section.querySelectorAll<HTMLElement>("[data-search]").forEach((item) => {
        const text = item.dataset.search ?? "";
        const match = terms.every((term) => text.includes(term));
        item.hidden = !match;
        if (match) shownInSection++;
      });
      section.hidden = shownInSection === 0;
      shown += shownInSection;
    });
    const count = document.getElementById(countId);
    if (count) count.textContent = terms.length ? `${shown} of ${total}` : `${total}`;
    const empty = document.getElementById(`${listId}-empty`);
    if (empty) empty.hidden = shown > 0;
  }, [query, listId, countId, total]);

  return (
    <form role="search" className={styles.search} onSubmit={(e) => e.preventDefault()}>
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
    </form>
  );
}
