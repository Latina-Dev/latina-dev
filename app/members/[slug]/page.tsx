import Image from "next/image";
import { notFound } from "next/navigation";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

import { getMemberBySlug, getMembers } from "@/lib/getMembers";

import styles from "./page.module.css";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Member({ params }: Props) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);

  if (!member) notFound();

  const { name, affiliation, level, bio, countries, linkedin, github, twitter, website } = member;

  const clean = (value?: string) => {
    const v = value?.trim();
    return v ? v : null;
  };
  const linkedinHandle = clean(linkedin);
  const githubHandle = clean(github);
  const twitterHandle = clean(twitter);
  const websiteUrl = clean(website);

  const sameAs = [
    linkedinHandle ? `https://www.linkedin.com/in/${encodeURIComponent(linkedinHandle)}` : null,
    githubHandle ? `https://github.com/${encodeURIComponent(githubHandle)}` : null,
    twitterHandle ? `https://twitter.com/${encodeURIComponent(twitterHandle)}` : null,
    websiteUrl,
  ].filter((v): v is string => typeof v === "string");

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(affiliation ? { jobTitle: affiliation } : {}),
    url: `https://latina.dev/members/${slug}`,
    image: `https://latina.dev/img/members/${slug}.jpg`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <div className="w-full pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <div className={styles.topBar} />
      <article className="relative py-16 lg:max-w-screen-lg lg:mx-auto lg:flex lg:gap-12 lg:items-start">
        <div className="text-center lg:shrink-0">
          <Image
            src={`/img/members/${slug}.jpg`}
            alt={name}
            width="250"
            height="250"
            className="rounded-xl my-8"
          />
          <SocialLinks member={member} />
        </div>
        <div className="text-center p-10 lg:p-0 lg:pt-8 lg:text-left">
          <h2 className="mt-3 text-3xl lg:text-4xl">{name}</h2>
          <h3>{affiliation}</h3>
          <h3 className={styles.affiliation}>{level}</h3>
          {countries && <CountryFlags countries={countries} />}
          {bio && <div className={styles.bio} dangerouslySetInnerHTML={{ __html: bio }} />}
        </div>
      </article>
    </div>
  );
}

export async function generateStaticParams() {
  const members = await getMembers();
  return members.map((member) => ({ slug: member.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) return {};
  return {
    title: `${member.name} | Members`,
    description: `${member.name} is a Latina software engineer${member.affiliation ? ` — ${member.affiliation}` : ""}. Find her on Latina Dev.`,
  };
}
