import Link from "next/link";
// Styles live with the members page, which owns the directory layout
import styles from "@/app/members/page.module.css";

import JsonLd from "@/components/JsonLd/JsonLd";
import MemberCard, { levelTags } from "@/components/MemberCard/MemberCard";
import DirectorySearch from "@/components/MemberDirectory/DirectorySearch";
import PageHero from "@/components/PageHero/PageHero";

import { getMembers } from "@/lib/getMembers";
import { breadcrumbJsonLd, membersCollectionJsonLd } from "@/lib/jsonLd";
import { CountryView, levelViews } from "@/lib/memberViews";

import { MemberInterface } from "@/types/members";

interface MemberDirectoryProps {
  heading: string; // the page's h1
  title: string; // name of the collection for structured data
  intro: string; // opening paragraph, written to answer the page's query directly
  path: string; // e.g. /members/leaders
  members: MemberInterface[];
  countryViews: CountryView[];
  lastUpdated: Date;
  breadcrumb: { name: string; path: string }[];
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

// Text the search box matches against, lowercased once on the server
const searchText = (member: MemberInterface) =>
  [
    member.name,
    member.affiliation,
    member.level,
    levelTags[member.level],
    member.location,
    ...(member.countries ?? []),
    ...(member.skills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

interface Filter {
  label: string;
  path: string;
  count: number;
}

const FilterList = ({ filters, current }: { filters: Filter[]; current: string }) => (
  <ul>
    {filters.map((filter) => (
      <li key={filter.path}>
        <Link
          href={filter.path}
          aria-current={filter.path === current ? "page" : undefined}
          className={filter.path === current ? styles.current : undefined}>
          <span>{filter.label}</span>
          <span className={styles.count}>{filter.count}</span>
        </Link>
      </li>
    ))}
  </ul>
);

/**
 * The member directory and its filtered views. Everything is rendered on the server so crawlers
 * see the full list, and the filters are plain links to their own URLs. The search box only hides
 * cards that are already on the page.
 */
const MemberDirectory = async ({
  heading,
  title,
  intro,
  path,
  members,
  countryViews,
  lastUpdated,
  breadcrumb,
}: MemberDirectoryProps) => {
  const allMembers = await getMembers();

  const levelFilters: Filter[] = [
    { label: "All members", path: "/members", count: allMembers.length },
    ...levelViews.map((view) => ({
      label: view.label,
      path: `/members/${view.segment}`,
      count: allMembers.filter((member) => member.level === view.level).length,
    })),
  ];
  const countryFilters: Filter[] = countryViews.map((view) => ({
    label: view.country,
    path: `/members/country/${view.slug}`,
    count: view.members.length,
  }));

  return (
    <>
      <JsonLd
        data={[
          membersCollectionJsonLd(members, { name: title, path, description: intro }),
          breadcrumbJsonLd(breadcrumb),
        ]}
      />
      <PageHero
        eyebrow="Directory"
        title={`${heading} (${members.length})`}
        lede={
          <>
            <p>{intro}</p>
            <p className={styles.updated}>
              Last updated{" "}
              <time dateTime={lastUpdated.toISOString()}>{formatDate(lastUpdated)}</time>
            </p>
          </>
        }>
        <DirectorySearch gridId="member-grid" countId="member-count" total={members.length} />
      </PageHero>
      <div className={`page-width ${styles.layout}`}>
        <nav aria-label="Filter members" className={styles.filters}>
          <h2 className={styles.filterLabel}>Career level</h2>
          <FilterList filters={levelFilters} current={path} />
          {countryFilters.length > 0 && (
            <>
              <h2 className={styles.filterLabel}>Roots</h2>
              <FilterList filters={countryFilters} current={path} />
            </>
          )}
        </nav>
        <div>
          <div className={styles.resultsBar}>
            <p aria-live="polite">
              <span id="member-count">{members.length}</span>{" "}
              {members.length === 1 ? "engineer" : "engineers"}
            </p>
            {path !== "/members" && (
              <Link href="/members" className={styles.clear}>
                Clear filters
              </Link>
            )}
          </div>
          <ul id="member-grid" className={styles.grid}>
            {members.map((member) => (
              <li key={member.slug} data-search={searchText(member)}>
                <MemberCard member={member} />
              </li>
            ))}
          </ul>
          <p id="member-grid-empty" className={styles.empty} hidden>
            Nobody matches that search yet.
          </p>
        </div>
      </div>
    </>
  );
};

export default MemberDirectory;
