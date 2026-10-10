import { getMembers } from "@/lib/getMembers";
import { hasFullGitHistory, memberLastModified } from "@/lib/memberDates";
import { getCountryViews, levelViews } from "@/lib/memberViews";
import { siteUrl } from "@/lib/site";

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
    "/resources",
    "/conference",
    "/add-member",
  ].map((path) => ({ url: `${siteUrl}${path}` }));

  const memberPages: MetadataRoute.Sitemap = members
    .filter((member) => !member.noindex)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => ({
      url: `${siteUrl}${member.path}`,
      lastModified: memberLastModified(member, useGit),
    }));

  return [...pages, ...memberPages];
}
