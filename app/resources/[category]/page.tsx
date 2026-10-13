import { notFound } from "next/navigation";

import ResourceDirectory from "@/components/ResourceDirectory/ResourceDirectory";

import { pageMetadata } from "@/lib/pageMetadata";
import { getResourceGroup, resourceGroups, resourcesPath } from "@/lib/resources";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ category: string }>;
}

// One page per category, e.g. /resources/jobs, so each can rank for its own question
export const dynamicParams = false;

export function generateStaticParams() {
  return resourceGroups.map((group) => ({ category: group.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = getResourceGroup((await params).category);
  if (!group) return {};
  return pageMetadata({
    title: group.heading,
    description: group.summary,
    path: `${resourcesPath}/${group.id}`,
  });
}

export default async function ResourceCategoryPage({ params }: Props) {
  const group = getResourceGroup((await params).category);
  if (!group) notFound();
  const path = `${resourcesPath}/${group.id}`;

  return (
    <ResourceDirectory
      heading={group.heading}
      title={group.heading}
      intro={group.summary}
      path={path}
      groups={[group]}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Resources", path: resourcesPath },
        { name: group.title, path },
      ]}
    />
  );
}
