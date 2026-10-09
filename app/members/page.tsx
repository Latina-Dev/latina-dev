import JsonLd from "@/components/JsonLd/JsonLd";
import MemberCard from "@/components/MemberCard/MemberCard";

import { getMembers } from "@/lib/getMembers";
import { breadcrumbJsonLd, membersCollectionJsonLd } from "@/lib/jsonLd";

import type { Metadata } from "next";
import { MemberInterface } from "@/types/members";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Members",
  description:
    "Browse our directory of Latina software engineers at the student, individual contributor, and leadership levels. Find and connect with Latina engineers across the industry.",
  alternates: { canonical: "/members" },
  openGraph: {
    title: "Members | Latina Dev",
    description:
      "Browse our directory of Latina software engineers at the student, IC, and leadership levels.",
  },
};

export default async function MembersPage() {
  const members: MemberInterface[] = await getMembers();
  const memberCount = members.length;
  return (
    <div className={styles.center}>
      <JsonLd
        data={[
          membersCollectionJsonLd(members),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Members", path: "/members" },
          ]),
        ]}
      />
      <div className={styles.heading}>
        <h1 className="text-5xl sm:text-6xl">Members ({memberCount})</h1>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-y-12 md:grid md:grid-cols-2 md-grid-rows md:gap-x-12 lg:grid lg:grid-cols-3 lg:grid-rows lg:gap-x-10">
        {members.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  );
}
