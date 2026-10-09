import ButtonLink from "@/components/ButtonLink/ButtonLink";
import About from "@/components/Homepage/About/About";
import Faq from "@/components/Homepage/Faq/Faq";
import Hero from "@/components/Homepage/Hero/Hero";
import MemberPreview from "@/components/Homepage/MemberPreview/MemberPreview";
import JsonLd from "@/components/JsonLd/JsonLd";

import { getMembers } from "@/lib/getMembers";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import { siteDescription } from "@/lib/site";

import type { Metadata } from "next";
import { MemberInterface } from "@/types/members";

import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Latina Dev | Directory of Latina Software Engineers",
  absolute: true,
  description: siteDescription,
  path: "/",
});

export default async function Home() {
  const members: MemberInterface[] = await getMembers();
  const countryCount = new Set(members.flatMap((member) => member.countries ?? [])).size;

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero memberCount={members.length} countryCount={countryCount} />
      <About />
      <MemberPreview members={members} />
      <Faq />
      <section className={styles.join} aria-labelledby="join-heading">
        <div className={styles.joinInner}>
          <h2 id="join-heading">You belong in this directory.</h2>
          <p>
            Add your profile and we&apos;ll add you to the directory and invite you to our Slack
            community.
          </p>
          <ButtonLink text="Add your profile" url="/add-member" />
        </div>
      </section>
      {/* Removing Maintainers for now since it feels a little redundant  but once we have more, it should be fine */}
      {/* <Maintainers /> */}
    </>
  );
}
