import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { faGithub, faLinkedin, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import JsonLd from "@/components/JsonLd/JsonLd";
import MemberCard from "@/components/MemberCard/MemberCard";
import PageHero from "@/components/PageHero/PageHero";

import { getMemberBySlug, getMembers } from "@/lib/getMembers";
import { breadcrumbJsonLd, profilePageJsonLd } from "@/lib/jsonLd";
import { memberLastModified } from "@/lib/memberDates";
import { pageMetadata } from "@/lib/pageMetadata";
import { getRelatedMembers } from "@/lib/relatedMembers";

import type { Metadata } from "next";
import { MemberInterface } from "@/types/members";

import styles from "./page.module.css";

const relatedHeadings: Record<MemberInterface["level"], string> = {
  Student: "More Latina engineering students",
  "Individual Contributor": "More Latina software engineers",
  Leader: "More Latina engineering leaders",
};

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Member({ params }: Props) {
  const { slug } = await params;
  const members = await getMembers();
  const member = members.find((m) => m.slug === slug);

  if (!member) notFound();

  const relatedMembers = getRelatedMembers(member, members);

  const { name, affiliation, level, bio, countries, skills, location, openTo } = member;

  const links = [
    member.linkedin && {
      href: `https://www.linkedin.com/in/${member.linkedin}`,
      label: "LinkedIn",
      icon: faLinkedin,
    },
    member.github && {
      href: `https://www.github.com/${member.github}`,
      label: "GitHub",
      icon: faGithub,
    },
    member.twitter && {
      href: `https://www.twitter.com/${member.twitter}`,
      label: "Twitter",
      icon: faTwitter,
    },
    member.website && { href: member.website, label: "Website", icon: faGlobe },
  ].filter((link) => !!link);

  const facts = [
    { label: "Level", value: level },
    countries?.length && {
      label: "Roots",
      value: <CountryFlags countries={countries} showNames />,
    },
    location && { label: "Based in", value: location },
  ].filter((fact) => !!fact);

  return (
    <>
      {!member.noindex && (
        <JsonLd
          data={[
            profilePageJsonLd(member, memberLastModified(member)),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Members", path: "/members" },
              { name, path: member.path },
            ]),
          ]}
        />
      )}
      <PageHero
        before={
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/members">Members</Link>
              </li>
              <li>
                <span aria-current="page">{name}</span>
              </li>
            </ol>
          </nav>
        }
        eyebrow={level}
        title={<span className={styles.name}>{name}</span>}
        lede={affiliation && <p>{affiliation}</p>}
      />
      <article className={`page-width ${styles.profile}`}>
        <aside className={styles.aside}>
          <div className={styles.photo}>
            <Image
              src={`/img/members/${slug}.jpg`}
              alt={name}
              fill
              priority
              sizes="(max-width: 767px) 140px, (max-width: 1023px) 280px, 380px"
              className={styles.image}
            />
          </div>
          {links.length > 0 && (
            <ul className={styles.links} aria-label={`${name} online`}>
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={link.icon} aria-hidden="true" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className={styles.content}>
          {bio && (
            <>
              <h2 className={styles.label}>About</h2>
              <div className={styles.bio} dangerouslySetInnerHTML={{ __html: bio }} />
            </>
          )}
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className={styles.label}>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {openTo && (
            <section className={styles.section}>
              <h2 className={styles.label}>Open to</h2>
              <ul className={styles.tags}>
                {openTo.map((option) => (
                  <li key={option} className={styles.openTo}>
                    {option}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {skills && (
            <section className={styles.section}>
              <h2 className={styles.label}>Skills</h2>
              <ul className={styles.tags} aria-label="Skills">
                {skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
      {relatedMembers.length > 0 && (
        <section className={`page-width ${styles.related}`} aria-labelledby="related-members">
          <div className={styles.relatedHeader}>
            <h2 id="related-members">{relatedHeadings[level]}</h2>
            <Link href="/members" className={styles.all}>
              See all members <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className={styles.relatedGrid}>
            {relatedMembers.map((related) => (
              <li key={related.slug}>
                <MemberCard member={related} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export async function generateStaticParams() {
  const members = await getMembers();
  return members.map((member) => ({ slug: member.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) return {};
  return {
    ...pageMetadata({
      title: member.name,
      description: `${member.name} is a Latina software engineer${member.affiliation ? ` — ${member.affiliation}` : ""}. Find her on Latina Dev.`,
      path: member.path,
      // The opengraph-image file next to this page supplies the image
      defaultImage: false,
      type: "profile",
    }),
    // Members who opt out stay reachable from the directory but out of search results
    ...(member.noindex ? { robots: { index: false } } : {}),
  };
}
