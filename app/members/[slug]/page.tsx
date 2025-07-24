import Image from "next/image";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

import { getMemberBySlug, getMembers } from "@/lib/getMembers";

import styles from "./page.module.css";

interface Props {
  params: {
    slug: string;
  };
}

// TODO: Update styling for this single member page view
export default async function Member({ params }: Props) {
  // get member data from slug
  const member = await getMemberBySlug(params.slug);
  // if no member, return 404
  if (!member) return <article>404</article>;
  // otherwise, destructure member data
  const { name, affiliation, level, bio, countries } = member;
  return (
    <div className="w-full pt-20">
      <div className={styles.topBar} />
      <article className="relative py-16 lg:max-w-screen-lg lg:mx-auto">
        <div className="text-center lg:inline-block">
          <Image
            src={`/img/members/${params.slug}.jpg`}
            alt={name}
            width="250"
            height="250"
            className="rounded-xl y-8 "
          />
          <SocialLinks member={member} />
        </div>
        <div className="text-center p-10 lg:p-0 lg:text-left">
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

// Generate a list of paths for Next.js to pre-render, based on the members
export async function generateStaticParams() {
  const members = await getMembers();

  return members.map((member) => ({
    slug: member.slug,
  }));
}

// Set the page title based on the member name
export async function generateMetadata({ params }: Props) {
  const member = await getMemberBySlug(params.slug);
  return {
    title: `${member?.name} | Members`,
  };
}
