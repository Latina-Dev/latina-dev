import Link from "next/link";

import fs from "fs";

import ButtonLink from "@/components/ButtonLink/ButtonLink";
import JsonLd from "@/components/JsonLd/JsonLd";
import DirectorySearch from "@/components/MemberDirectory/DirectorySearch";
import PageHero from "@/components/PageHero/PageHero";
import cards from "@/components/ResourceDirectory/ResourceDirectory.module.css";

import {
  ergGuidePath,
  ergs,
  ergsDescription,
  ergsJsonLd,
  ergsPath,
  ergsTitle,
  membersAt,
} from "@/lib/ergs";
import { getMembers } from "@/lib/getMembers";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import { outboundLinkProps } from "@/lib/referral";
import { resourcesPath } from "@/lib/resources";

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: ergsTitle,
  description: ergsDescription,
  path: ergsPath,
});

const newErgUrl =
  "https://github.com/Latina-Dev/latina-dev/issues/new?title=ERG%3A+&body=Company%3A%0AERG+name%3A%0APublic+link+%28if+any%29%3A";

const logoDir = "public/img/ergs";

// Company logos fetched by scripts/fetch-resource-logos.ts, named by ERG slug. The path is built
// from the slug and a fixed list of extensions, never from a filename read off the disk
const logoExtensions = ["png", "jpg", "webp", "ico"] as const;
const logoFor = (slug: string) => {
  const ext = logoExtensions.find((ext) => fs.existsSync(`${logoDir}/${slug}.${ext}`));
  return ext ? `/img/ergs/${slug}.${ext}` : undefined;
};

const initials = (company: string) =>
  company
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

/**
 * Latinx employee resource groups by company. Every card is rendered on the server so crawlers
 * and AI agents see the whole list; the search box only hides cards already on the page.
 */
// The most recent check across the list, e.g. "November 2026"
const checkedMonth = new Date(
  `${ergs
    .map((erg) => erg.checked)
    .sort()
    .at(-1)}T00:00:00Z`
).toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" });

export default async function ErgsPage() {
  const members = await getMembers();

  return (
    <>
      <JsonLd
        data={[
          ergsJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: resourcesPath },
            { name: "ERGs", path: ergsPath },
          ]),
        ]}
      />
      <PageHero
        eyebrow={<Link href={resourcesPath}>Resources</Link>}
        title="Latinx employee resource groups at tech companies"
        lede={
          <p>
            An employee resource group (ERG) is a group run by employees inside a company. These{" "}
            {ergs.length} companies have one for Latina and Latino employees. Join for the peers,
            mentors and sponsors. Running one can be worth it too, as long as you know it usually
            doesn&apos;t count toward promotion.
          </p>
        }>
        <DirectorySearch
          gridId="erg-list"
          countId="erg-count"
          total={ergs.length}
          label="Search ERGs"
          placeholder="Company or group name"
        />
      </PageHero>
      <div className={`page-width ${styles.page}`}>
        <p className={styles.count} aria-live="polite">
          <span id="erg-count">{ergs.length}</span> companies
        </p>
        <ul id="erg-list" className={`${cards.grid} ${styles.grid}`}>
          {ergs.map((erg) => {
            const colleagues = membersAt(erg, members);
            const logo = logoFor(erg.slug);
            return (
              <li
                key={erg.slug}
                id={erg.slug}
                className={cards.card}
                data-search={`${erg.company} ${erg.name}`.toLowerCase()}>
                {logo ? (
                  // Small, already-sized images; next/image would need every source domain configured
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    className={cards.logo}
                  />
                ) : (
                  <span className={`${cards.logo} ${cards.monogram}`} aria-hidden="true">
                    {initials(erg.company)}
                  </span>
                )}
                <div>
                  <h2 className={styles.company}>{erg.company}</h2>
                  <p>
                    <a
                      {...outboundLinkProps("erg", erg.company, erg.url)}
                      target="_blank"
                      rel="noopener noreferrer">
                      {erg.name}
                    </a>
                    {erg.description ? `: ${erg.description}` : ", its Latinx ERG"}
                  </p>
                  {colleagues.length > 0 && (
                    <p className={styles.members}>
                      In the directory:{" "}
                      {colleagues.map((member, i) => (
                        <span key={member.slug}>
                          {i > 0 && ", "}
                          <Link href={member.path}>{member.name}</Link>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p id="erg-list-empty" className={styles.empty} hidden>
          No company matches. The list is not complete, so yours may still have one.
        </p>
        <p className={styles.note}>
          Each name links to a public page from the company that mentions the group. Most recent
          check: {checkedMonth}. The list is not complete. Is something missing or out of date?{" "}
          <a href={newErgUrl} target="_blank" rel="noopener noreferrer">
            Tell us on GitHub
          </a>
          .
        </p>
        <section className={styles.start} aria-labelledby="start-heading">
          <div>
            <h2 id="start-heading">Asked to lead an ERG?</h2>
            <p>
              It can be good work to do. It also usually doesn&apos;t count toward promotion, and
              women are asked to do it more. Read what to know and ask for before you say yes.
            </p>
          </div>
          <ButtonLink text="Read the guide" url={ergGuidePath} />
        </section>
      </div>
    </>
  );
}
