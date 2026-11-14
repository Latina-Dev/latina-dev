import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { SupportData } from "@/lib/findSupport";
import { getMembers } from "@/lib/getMembers";
import { getGuides } from "@/lib/guides";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";
import { getQuestions } from "@/lib/questions";
import { resourceGroups, resourceSlug, resourcesPath } from "@/lib/resources";

import type { Metadata } from "next";

import FindSupport from "./FindSupport";

const path = "/find-support";

export const metadata: Metadata = pageMetadata({
  title: "Find support as a Latina in tech",
  description:
    "Tell us where you are in your tech career and what you need, and get communities, programs, job boards, mentors and advice picked for Latina software engineers.",
  path,
});

/** A guided way into the resources, guides, mentors and community answers on latina.dev */
export default async function FindSupportPage() {
  const members = await getMembers();
  const data: SupportData = {
    resources: resourceGroups.flatMap((group) =>
      group.resources.map((resource) => ({
        name: resource.name,
        url: resource.url,
        description: resource.description,
        types: [...resource.types],
        stages: [...resource.stages],
        page: `${resourcesPath}/${group.id}#${resourceSlug(resource)}`,
      }))
    ),
    guides: getGuides().map(({ slug, title, path, description }) => ({
      slug,
      title,
      path,
      description,
    })),
    mentors: members
      .filter((member) => member.openTo?.includes("Mentoring"))
      .map(({ name, path, level, affiliation }) => ({
        name,
        path,
        level,
        ...(affiliation ? { affiliation } : {}),
      })),
    questions: getQuestions().map(({ title, path }) => ({ title, path })),
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Find support", path },
        ])}
      />
      <PageHero
        eyebrow="Find support"
        title="Get to the right help, fast."
        lede={
          <p>
            Pick where you are and what you need. We&apos;ll point you to the communities, programs,
            mentors and advice that fit, all chosen for Latina software engineers.
          </p>
        }
      />
      <FindSupport data={data} />
    </>
  );
}
