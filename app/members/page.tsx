import MemberDirectory from "@/components/MemberDirectory/MemberDirectory";

import { getMembers } from "@/lib/getMembers";
import { directoryLastUpdated } from "@/lib/memberDates";
import { getCountryViews, levelViews } from "@/lib/memberViews";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Members: Latina Software Engineers",
  description:
    "Browse our directory of Latina software engineers at the student, individual contributor, and leadership levels. Find and connect with Latina engineers across the industry.",
  path: "/members",
});

export default async function MembersPage() {
  const members = await getMembers();
  const levelCounts = levelViews
    .map((view) => {
      const count = members.filter((member) => member.level === view.level).length;
      return `${count} ${view.label.toLowerCase()}`;
    })
    .join(", ");

  return (
    <MemberDirectory
      heading="Members"
      title="Latina Dev members"
      intro={`Latina Dev is an open-source directory of ${members.length} Latina software engineers, from students to engineering leaders: ${levelCounts}.`}
      path="/members"
      members={members}
      countryViews={getCountryViews(members)}
      lastUpdated={directoryLastUpdated()}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Members", path: "/members" },
      ]}
    />
  );
}
