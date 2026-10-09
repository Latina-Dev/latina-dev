import Link from "next/link";
// Styles live with the members page, which owns the directory layout
import styles from "@/app/members/page.module.css";

import JsonLd from "@/components/JsonLd/JsonLd";
import MemberCard from "@/components/MemberCard/MemberCard";

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

/**
 * The member directory and its filtered views. Everything is rendered on the server so crawlers
 * see the full list, and the filters are plain links to their own URLs.
 */
const MemberDirectory = ({
  heading,
  title,
  intro,
  path,
  members,
  countryViews,
  lastUpdated,
  breadcrumb,
}: MemberDirectoryProps) => {
  const filters = [
    { label: "All members", path: "/members" },
    ...levelViews.map((view) => ({ label: view.label, path: `/members/${view.segment}` })),
    ...countryViews.map((view) => ({
      label: view.country,
      path: `/members/country/${view.slug}`,
    })),
  ];

  return (
    <div className={styles.center}>
      <JsonLd
        data={[
          membersCollectionJsonLd(members, { name: title, path, description: intro }),
          breadcrumbJsonLd(breadcrumb),
        ]}
      />
      <div className={styles.heading}>
        <h1 className="text-5xl sm:text-6xl">
          {heading} ({members.length})
        </h1>
        <p className={styles.intro}>{intro}</p>
        <p className={styles.updated}>
          Last updated <time dateTime={lastUpdated.toISOString()}>{formatDate(lastUpdated)}</time>
        </p>
      </div>
      <nav aria-label="Filter members" className={styles.filters}>
        <ul>
          {filters.map((filter) => (
            <li key={filter.path}>
              <Link
                href={filter.path}
                aria-current={filter.path === path ? "page" : undefined}
                className={filter.path === path ? styles.current : undefined}>
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-20 grid grid-cols-1 gap-y-12 md:grid md:grid-cols-2 md-grid-rows md:gap-x-12 lg:grid lg:grid-cols-3 lg:grid-rows lg:gap-x-10">
        {members.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  );
};

export default MemberDirectory;
