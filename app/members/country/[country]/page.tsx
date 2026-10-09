import { notFound } from "next/navigation";

import MemberDirectory from "@/components/MemberDirectory/MemberDirectory";

import { getMembers } from "@/lib/getMembers";
import { directoryLastUpdated } from "@/lib/memberDates";
import { getCountryViews } from "@/lib/memberViews";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ country: string }>;
}

// Only countries with enough members get a page; anything else is a 404
export const dynamicParams = false;

const intro = (count: number, country: string) =>
  `${count} Latina software engineers in the Latina Dev directory list ${country} as a country of origin.`;

const findView = async (slug: string) => {
  const members = await getMembers();
  const countryViews = getCountryViews(members);
  return { view: countryViews.find((v) => v.slug === slug), countryViews };
};

export async function generateStaticParams() {
  return getCountryViews(await getMembers()).map((view) => ({ country: view.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view } = await findView((await params).country);
  if (!view) return {};
  return {
    title: `Latina Software Engineers with Roots in ${view.country}`,
    description: intro(view.members.length, view.country),
    alternates: { canonical: `/members/country/${view.slug}` },
  };
}

export default async function CountryPage({ params }: Props) {
  const { view, countryViews } = await findView((await params).country);
  if (!view) notFound();

  const path = `/members/country/${view.slug}`;

  return (
    <MemberDirectory
      heading={view.country}
      title={`Latina Software Engineers with Roots in ${view.country}`}
      intro={intro(view.members.length, view.country)}
      path={path}
      members={view.members}
      countryViews={countryViews}
      lastUpdated={directoryLastUpdated()}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Members", path: "/members" },
        { name: view.country, path },
      ]}
    />
  );
}
