import { ergsPath } from "@/lib/ergs";
import { getMembers } from "@/lib/getMembers";
import { getGuides } from "@/lib/guides";
import { hasFullGitHistory, memberLastModified } from "@/lib/memberDates";
import { getCountryViews, levelViews } from "@/lib/memberViews";
import { getQuestions, questionsPath } from "@/lib/questions";
import { resourceGroups, resourcesPath } from "@/lib/resources";
import { resourceViewPages } from "@/lib/resourceViews";
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
    resourcesPath,
    ...resourceGroups.map((group) => `${resourcesPath}/${group.id}`),
    ...resourceViewPages.map((view) => view.path),
    ergsPath,
    ...getGuides().map((guide) => guide.path),
    "/find-support",
    "/conference",
    "/survey",
    "/add-member",
    "/privacy",
  ].map((path) => ({ url: `${siteUrl}${path}` }));

  const memberPages: MetadataRoute.Sitemap = members
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => ({
      url: `${siteUrl}${member.path}`,
      lastModified: memberLastModified(member, useGit),
    }));

  // Each question page changes when an answer is added, so its latest answer is its date
  const questions = getQuestions();
  const questionPages: MetadataRoute.Sitemap = questions.length
    ? [
        {
          url: `${siteUrl}${questionsPath}`,
          // The list changes whenever any question gets an answer, not only the newest one
          lastModified: new Date(
            questions.map((question) => question.updated).reduce((a, b) => (a > b ? a : b))
          ),
        },
        ...questions.map((question) => ({
          url: question.url,
          lastModified: new Date(question.updated),
        })),
      ]
    : [];

  return [...pages, ...questionPages, ...memberPages];
}
