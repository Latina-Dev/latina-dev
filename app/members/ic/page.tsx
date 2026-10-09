import MemberDirectory from "@/components/MemberDirectory/MemberDirectory";

import { getMembers } from "@/lib/getMembers";
import { directoryLastUpdated } from "@/lib/memberDates";
import { getCountryViews, levelViewFor } from "@/lib/memberViews";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

const view = levelViewFor("ic")!;

export async function generateMetadata(): Promise<Metadata> {
  const members = (await getMembers()).filter((member) => member.level === view.level);
  return pageMetadata({
    title: view.title,
    description: view.intro(members.length),
    path: `/members/${view.segment}`,
  });
}

export default async function LevelPage() {
  const allMembers = await getMembers();
  const members = allMembers.filter((member) => member.level === view.level);

  return (
    <MemberDirectory
      heading={view.label}
      title={view.title}
      intro={view.intro(members.length)}
      path={`/members/${view.segment}`}
      members={members}
      countryViews={getCountryViews(allMembers)}
      lastUpdated={directoryLastUpdated()}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Members", path: "/members" },
        { name: view.label, path: `/members/${view.segment}` },
      ]}
    />
  );
}
