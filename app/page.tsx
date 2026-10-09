import About from "@/components/Homepage/About/About";
import Faq from "@/components/Homepage/Faq/Faq";
import Hero from "@/components/Homepage/Hero/Hero";
import MemberPreview from "@/components/Homepage/MemberPreview/MemberPreview";
import JsonLd from "@/components/JsonLd/JsonLd";

import { getMembers } from "@/lib/getMembers";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonLd";
import { siteDescription } from "@/lib/site";

import type { Metadata } from "next";
import { MemberInterface } from "@/types/members";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Latina Dev | Directory of Latina Software Engineers" },
  description: siteDescription,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const members: MemberInterface[] = await getMembers();

  return (
    <div className={styles.center}>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <hr className={styles.heroBorder} />
      <About />
      <MemberPreview members={members} />
      <Faq />
      {/* Removing Maintainers for now since it feels a little redundant  but once we have more, it should be fine */}
      {/* <Maintainers /> */}
    </div>
  );
}
