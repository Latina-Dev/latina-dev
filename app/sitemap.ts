import { ergsPath } from "@/lib/ergs";
import { getMembers } from "@/lib/getMembers";
import { getGuides } from "@/lib/guides";
import { hasFullGitHistory, memberLastModified } from "@/lib/memberDates";
import { getCountryViews, levelViews } from "@/lib/memberViews";
import { resourceGroups, resourcesPath } from "@/lib/resources";
import { resourceViewPages } from "@/lib/resourceViews";
import { siteUrl } from "@/lib/site";
import { getWriting, writingPath } from "@/lib/writing";

import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const members = await getMembers();
  const useGit = hasFullGitHistory();

  // No lastModified on these: we don't have a reliable date for them, and a wrong one is worse
  // than none
  const pages: MetadataRoute.Sitemap = [
    "",
    "/members",
    ...levelViews.map((view) => `/members/${view.segment}`),
    ...getCountryViews(members).map((view) => `/members/country/${view.slug}`),
    resourcesPath,
    ...resourceGroups.map((group) => `${resourcesPath}/${group.id}`),
    ...resourceViewPages.map((view) => view.path),
    ergsPath,
    ...getGuides().map((guide) => guide.path),
    "/conference",
    "/add-member",
    "/privacy",
  ].map((path) => ({ url: `${siteUrl}${path}` }));

  const memberPages: MetadataRoute.Sitemap = members
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => ({
      url: `${siteUrl}${member.path}`,
      lastModified: memberLastModified(member, useGit),
    }));

  // Listed only once there are posts; the newest one dates the page
  const writing = getWriting();
  const writingPages: MetadataRoute.Sitemap = writing.length
    ? [{ url: `${siteUrl}${writingPath}`, lastModified: new Date(writing[0].published) }]
    : [];

  return [...pages, ...writingPages, ...memberPages];
}
