import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PageHero from "@/components/PageHero/PageHero";

import { memberLevels } from "@/types/members";

import styles from "./Hero.module.css";

interface Props {
  memberCount: number;
  countryCount: number;
}

export default function Hero({ memberCount, countryCount }: Props) {
  const stats = [
    { value: memberCount, label: "Engineers" },
    { value: countryCount, label: "Countries" },
    { value: memberLevels.length, label: "Career levels" },
  ];

  return (
    <PageHero
      eyebrow="Latina Dev"
      title="The roster of Latina software engineers."
      lede={
        <p>
          An open-source directory of Latina software engineers at the student, IC, and leadership
          levels. Our goal is to increase visibility and access to valuable opportunities.
        </p>
      }>
      {/* Searching sends you to the directory, which filters on ?q= */}
      <form action="/members" method="get" role="search" className={styles.search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.icon} aria-hidden="true" />
        <label htmlFor="home-search" className={styles.label}>
          Search the directory
        </label>
        <input
          id="home-search"
          name="q"
          type="search"
          placeholder="Name, role, country"
          autoComplete="off"
        />
        <button type="submit">Search</button>
      </form>
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </PageHero>
  );
}
