import Link from "next/link";
// Layout and filter rail are shared with the member directory
import directory from "@/app/members/page.module.css";

import fs from "fs";

import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";
import ResourceSearch from "@/components/ResourceDirectory/ResourceSearch";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import {
  Resource,
  resourceCount,
  ResourceGroup,
  resourceGroups,
  resourcesJsonLd,
  resourceSlug,
  resourcesPath,
} from "@/lib/resources";

import styles from "./ResourceDirectory.module.css";

const logoDir = "public/img/resources";

// Logos fetched by scripts/fetch-resource-logos.ts, keyed by resource slug
const logos: Map<string, string> = new Map(
  (fs.existsSync(logoDir) ? fs.readdirSync(logoDir) : [])
    .filter((file) => /\.(png|jpe?g|webp|ico)$/.test(file))
    .map((file) => [file.replace(/\.[a-z]+$/, ""), `/img/resources/${file}`])
);

const initials = (name: string) =>
  name
    .replace(/^[^A-Za-z0-9]+/, "")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const ResourceLogo = ({ resource }: { resource: Resource }) => {
  const src = logos.get(resourceSlug(resource));
  return src ? (
    // Small, already-sized images; next/image would need every source domain configured
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={44} height={44} loading="lazy" className={styles.logo} />
  ) : (
    <span className={`${styles.logo} ${styles.monogram}`} aria-hidden="true">
      {initials(resource.name)}
    </span>
  );
};

// Text the search box matches against, lowercased once on the server
const searchText = (resource: Resource, group: ResourceGroup) =>
  [resource.name, resource.description, group.title, group.heading].join(" ").toLowerCase();

interface Props {
  heading: string; // the page's h1
  title: string; // collection name for structured data
  intro: string;
  path: string;
  groups: ResourceGroup[];
  breadcrumb: { name: string; path: string }[];
  after?: React.ReactNode; // shown below the lists, e.g. guides and the FAQ
  extraJsonLd?: Record<string, unknown>[];
}

/**
 * The resources page and its category pages. Everything is rendered on the server so crawlers and
 * AI agents see every resource; the category filters are plain links to their own URLs, and the
 * search box only hides cards already on the page.
 */
const ResourceDirectory = ({
  heading,
  title,
  intro,
  path,
  groups,
  breadcrumb,
  after,
  extraJsonLd = [],
}: Props) => {
  const count = groups.reduce((n, group) => n + group.resources.length, 0);
  const filters = [
    { label: "All resources", path: resourcesPath, count: resourceCount },
    ...resourceGroups.map((group) => ({
      label: group.title,
      path: `${resourcesPath}/${group.id}`,
      count: group.resources.length,
    })),
  ];

  return (
    <>
      <JsonLd
        data={[
          resourcesJsonLd({ name: title, path, description: intro, groups }),
          breadcrumbJsonLd(breadcrumb),
          ...extraJsonLd,
        ]}
      />
      <PageHero eyebrow="Resources" title={heading} lede={<p>{intro}</p>}>
        <ResourceSearch listId="resource-list" countId="resource-count" total={count} />
      </PageHero>
      <div className={`page-width ${directory.layout}`}>
        <nav aria-label="Filter resources" className={directory.filters}>
          <h2 className={directory.filterLabel}>Category</h2>
          <ul>
            {filters.map((filter) => (
              <li key={filter.path}>
                <Link
                  href={filter.path}
                  aria-current={filter.path === path ? "page" : undefined}
                  className={filter.path === path ? directory.current : undefined}>
                  <span>{filter.label}</span>
                  <span className={directory.count}>{filter.count}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={`${resourcesPath}#guides`}>
                <span>Guides</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <div className={directory.resultsBar}>
            <p aria-live="polite">
              <span id="resource-count">{count}</span> {count === 1 ? "resource" : "resources"}
            </p>
            {path !== resourcesPath && (
              <Link href={resourcesPath} className={directory.clear}>
                Clear filters
              </Link>
            )}
          </div>
          <div id="resource-list">
            {groups.map((group) => (
              <section
                key={group.id}
                id={group.id}
                className={styles.group}
                aria-labelledby={`${group.id}-heading`}>
                <div className={styles.groupHeader}>
                  <h2 id={`${group.id}-heading`}>{group.title}</h2>
                  <p>{group.intro}</p>
                </div>
                <ul className={styles.grid}>
                  {group.resources.map((resource) => (
                    <li
                      key={resource.url}
                      id={resourceSlug(resource)}
                      className={styles.card}
                      data-search={searchText(resource, group)}>
                      <ResourceLogo resource={resource} />
                      <div>
                        <h3>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            {resource.name}
                          </a>
                        </h3>
                        <p>{resource.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p id="resource-list-empty" className={directory.empty} hidden>
            Nothing matches that search yet.
          </p>
          {after}
        </div>
      </div>
    </>
  );
};

export default ResourceDirectory;
