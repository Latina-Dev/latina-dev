"use client";

import { useEffect, useState } from "react";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./DirectorySearch.module.css";

interface Props {
  gridId: string; // list whose items carry a data-search attribute
  countId: string; // element showing how many members match
  total: number;
}

/**
 * Filters the server-rendered member list as you type. Without JavaScript the full list still
 * shows. A ?q= in the URL (the homepage search) fills the box on load.
 */
export default function DirectorySearch({ gridId, countId, total }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const items = document.querySelectorAll<HTMLElement>(`#${gridId} > [data-search]`);
    let shown = 0;
    items.forEach((item) => {
      const text = item.dataset.search ?? "";
      const match = terms.every((term) => text.includes(term));
      item.hidden = !match;
      if (match) shown++;
    });
    const count = document.getElementById(countId);
    if (count) count.textContent = terms.length ? `${shown} of ${total}` : `${total}`;
    const empty = document.getElementById(`${gridId}-empty`);
    if (empty) empty.hidden = shown > 0;
  }, [query, gridId, countId, total]);

  return (
    <form role="search" className={styles.search} onSubmit={(e) => e.preventDefault()}>
      <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.icon} aria-hidden="true" />
      <label htmlFor="directory-search" className={styles.label}>
        Search members
      </label>
      <input
        id="directory-search"
        name="q"
        type="search"
        placeholder="Name, role, country or skill"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
