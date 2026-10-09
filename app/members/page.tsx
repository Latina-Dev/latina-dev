import MemberCard from "@/components/MemberCard/MemberCard";

import { getMembers } from "@/lib/getMembers";

import type { Metadata } from "next";
import { MemberInterface } from "@/types/members";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Members",
  description:
    "Browse our directory of Latina software engineers at the student, individual contributor, and leadership levels. Find and connect with Latina engineers across the industry.",
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
      <div className={styles.heading}>
        <h1 className="text-5xl sm:text-6xl">Members ({memberCount})</h1>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:mt-20 sm:gap-y-12 md:gap-x-12 lg:grid-cols-3 lg:gap-x-10">
        {members.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  );
}
