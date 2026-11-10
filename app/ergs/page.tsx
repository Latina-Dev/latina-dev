import Link from "next/link";

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

import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: ergsTitle,
  description: ergsDescription,
  path: ergsPath,
});

const newErgUrl =
  "https://github.com/Latina-Dev/latina-dev/issues/new?title=ERG%3A+&body=Company%3A%0AERG+name%3A%0APublic+link+%28if+any%29%3A";

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
export default async function ErgsPage() {
  const members = await getMembers();

  return (
    <>
      <JsonLd
        data={[
          ergsJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "ERGs", path: ergsPath },
          ]),
        ]}
      />
      <PageHero
        eyebrow="ERGs"
        title="Latinx employee resource groups at tech companies"
        lede={
          <p>
            An employee resource group (ERG) is a group run by employees inside a company. These{" "}
            {ergs.length} companies have one for Latina and Latino employees. Ask about it when you
            interview, and join it in your first week.
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
            return (
              <li
                key={erg.slug}
                id={erg.slug}
                className={cards.card}
                data-search={`${erg.company} ${erg.name}`.toLowerCase()}>
                <span className={`${cards.logo} ${cards.monogram}`} aria-hidden="true">
                  {initials(erg.company)}
                </span>
                <div>
                  <h2 className={styles.company}>{erg.company}</h2>
                  <p>
                    {erg.url ? (
                      <a href={erg.url} target="_blank" rel="noopener noreferrer">
                        {erg.name}
                      </a>
                    ) : (
                      <strong>{erg.name}</strong>
                    )}
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
          No company matches yet. If yours has a Latinx ERG, tell us below.
        </p>
        <p className={styles.note}>
          This list started from notes by Frances Coronel, founder of Latina Dev. Group names
          change, so check with the company. Is something missing or out of date?{" "}
          <a href={newErgUrl} target="_blank" rel="noopener noreferrer">
            Tell us on GitHub
          </a>
          .
        </p>
        <section className={styles.start} aria-labelledby="start-heading">
          <div>
            <h2 id="start-heading">No Latinx ERG where you work?</h2>
            <p>
              Start one. The guide walks through finding your first members, an executive sponsor, a
              mission, a budget and a first event.
            </p>
          </div>
          <ButtonLink text="Read the guide" url={ergGuidePath} />
        </section>
      </div>
    </>
  );
}
