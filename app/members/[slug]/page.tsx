import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import JsonLd from "@/components/JsonLd/JsonLd";
import MemberCard from "@/components/MemberCard/MemberCard";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

import { getMemberBySlug, getMembers } from "@/lib/getMembers";
import { breadcrumbJsonLd, personJsonLd } from "@/lib/jsonLd";
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

  return (
    <div className="w-full pt-12">
      {!member.noindex && (
        <JsonLd
          data={[
            personJsonLd(member),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Members", path: "/members" },
              { name, path: member.path },
            ]),
          ]}
        />
      )}
      <div className={styles.topBar} />
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
      <article className="relative py-16 lg:max-w-screen-lg lg:mx-auto lg:flex lg:gap-12 lg:items-start">
        <div className="flex flex-col items-center lg:shrink-0">
          <Image
            src={`/img/members/${slug}.jpg`}
            alt={name}
            width="250"
            height="250"
            className="rounded-xl my-8 w-40 h-40 sm:w-52 sm:h-52 md:w-[250px] md:h-[250px]"
          />
          <SocialLinks member={member} />
        </div>
        <div className="text-center px-4 py-6 sm:px-8 sm:py-8 lg:p-0 lg:pt-8 lg:text-left">
          <h1 className={`mt-3 ${styles.name}`}>{name}</h1>
          <h3>{affiliation}</h3>
          <h3 className={styles.affiliation}>{level}</h3>
          {countries && <CountryFlags countries={countries} />}
          {location && <p className="text-muted">{location}</p>}
          {openTo && <p className={styles.openTo}>Open to: {openTo.join(", ")}</p>}
          {skills && (
            <ul className={styles.skills} aria-label="Skills">
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          )}
          {bio && <div className={styles.bio} dangerouslySetInnerHTML={{ __html: bio }} />}
        </div>
      </article>
      {relatedMembers.length > 0 && (
        <section className={styles.related} aria-labelledby="related-members">
          <h2 id="related-members">{relatedHeadings[level]}</h2>
          <div className="mt-10 grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-12 lg:grid-cols-3 lg:gap-x-10">
            {relatedMembers.map((related) => (
              <MemberCard key={related.slug} member={related} />
            ))}
          </div>
          <p className="mt-12">
            <Link href="/members">See all members</Link>
          </p>
        </section>
      )}
    </div>
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
    title: member.name,
    description: `${member.name} is a Latina software engineer${member.affiliation ? ` — ${member.affiliation}` : ""}. Find her on Latina Dev.`,
    alternates: { canonical: member.path },
    // Members who opt out stay reachable from the directory but out of search results
    ...(member.noindex ? { robots: { index: false } } : {}),
  };
}
