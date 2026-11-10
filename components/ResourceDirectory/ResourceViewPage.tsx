import { notFound } from "next/navigation";

import ResourceDirectory from "@/components/ResourceDirectory/ResourceDirectory";

import { pageMetadata } from "@/lib/pageMetadata";
import { resourcesPath } from "@/lib/resources";
import { getResourceView, ResourceView, resourceViewPages } from "@/lib/resourceViews";

import type { Metadata } from "next";

type Kind = ResourceView["kind"];

export const resourceViewParams = (kind: Kind) =>
  resourceViewPages.filter((view) => view.kind === kind).map((view) => view.slug);

export const resourceViewMetadata = (kind: Kind, slug: string): Metadata => {
  const view = getResourceView(kind, slug);
  if (!view) return {};
  return pageMetadata({ title: view.heading, description: view.summary, path: view.path });
};

/** A page listing every resource of one type or for one career stage */
const ResourceViewPage = ({ kind, slug }: { kind: Kind; slug: string }) => {
  const view = getResourceView(kind, slug);
  if (!view) notFound();

  return (
    <ResourceDirectory
      heading={view.heading}
      title={view.heading}
      intro={view.summary}
      path={view.path}
      groups={view.groups}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Resources", path: resourcesPath },
        { name: view.title, path: view.path },
      ]}
    />
  );
};

export default ResourceViewPage;
