// Kept apart from lib/jobSearch.ts, which reads files, so the browser can use it too

export const jobSearchPath = "/job-search";

/**
 * The old engjobsearch.com site was docsify, so its links look like
 * engjobsearch.com/#/03-apply/cover-letters/README. Browsers keep that hash through the domain
 * redirect, so map it to the new step anchor or page.
 */
export const legacyHashTargets: Record<string, string> = {
  "01-prepare/README": "#prepare",
  "01-prepare/product-manager": "/product-manager",
  "02-search/README": "#search",
  "02-search/research": "/company-research",
  "02-search/conference-scholarships": "/conference-scholarships",
  "03-apply/README": "#apply",
  "03-apply/online-presence": "/online-presence",
  "03-apply/skills": "/listing-skills",
  "03-apply/cover-letters/README": "/cover-letters",
  "03-apply/replying": "/replying-to-recruiters",
  "04-interview/README": "#interview",
  "04-interview/checklist": "/interview-checklist",
  "04-interview/intros": "/introducing-yourself",
  "04-interview/answering": "/answering-questions",
  "04-interview/asking": "/asking-questions",
  "04-interview/follow-up": "/following-up",
  "05-accept/README": "#accept",
  "05-accept/salary": "/negotiating-salary",
};

/** Where an old docsify hash such as "#/03-apply/skills?id=x" should go, if anywhere */
export const legacyHashTarget = (hash: string) => {
  const match = /^#\/(.+?)(?:\.md)?(?:\?.*)?$/.exec(hash);
  if (!match) return undefined;
  const target = legacyHashTargets[match[1].replace(/\/$/, "")];
  if (!target) return undefined;
  return `${jobSearchPath}${target}`;
};
