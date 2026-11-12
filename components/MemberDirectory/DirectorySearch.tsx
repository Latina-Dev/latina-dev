"use client";

import { useEffect, useState } from "react";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useUrlQuery } from "@/lib/hooks/useUrlQuery";

import styles from "./DirectorySearch.module.css";

interface Props {
  gridId: string; // list whose items carry a data-search attribute
  countId: string; // element showing how many members match
  total: number;
  label?: string; // what the box searches, for screen readers
  placeholder?: string;
}

/**
 * Filters a server-rendered list (members, ERGs) as you type. Without JavaScript the full list still
 * shows. A ?q= in the URL (the homepage search) fills the box on load.
 */
export default function DirectorySearch({
  gridId,
  countId,
  total,
  label = "Search members",
  placeholder = "Name, role or country",
}: Props) {
  // The ?q= fills the box after hydration, then typing takes over.
  const urlQuery = useUrlQuery();
  const [typed, setQuery] = useState<string | null>(null);
  const query = typed ?? urlQuery;

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
        {label}
      </label>
      <input
        id="directory-search"
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
