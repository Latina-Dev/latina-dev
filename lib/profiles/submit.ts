import { commitToBranch, openOrUpdatePull, RepoFile } from "@/lib/profiles/github";
import { postReviewRequest, ReviewKind } from "@/lib/profiles/slack";
import { siteUrl } from "@/lib/site";

/**
 * Commit a profile change to the member's branch, open a pull request and ask for review in
 * Slack. Used by the profile page and by the Slack profile editor, so every change gets the same
 * review no matter where it was made.
 */
export const submitForReview = async ({
  kind,
  branch,
  user,
  slackUserId,
  slug,
  profileName,
  linkedinHandle,
  files,
  note,
}: {
  kind: ReviewKind;
  /** The member's branch, from ownerBranch or slackLinkBranch, so a resubmission replaces it */
  branch: string;
  /** The LinkedIn account that signed in on the site; absent for changes sent from Slack */
  user?: { name?: string | null; email?: string | null };
  /** Slack member who sent the change from Slack, after linking their LinkedIn sign-in */
  slackUserId?: string;
  slug: string;
  profileName: string;
  linkedinHandle: string;
  files: RepoFile[];
  note?: string;
}) => {
  const title =
    kind === "link"
      ? `Link Slack account: ${profileName}`
      : `${{ new: "Add", claim: "Claim", edit: "Update" }[kind]} profile: ${profileName}`;
  const where = slackUserId && kind !== "link" ? "Slack" : "latina.dev/profile";

  const headSha = await commitToBranch(branch, files, title);
  const pull = await openOrUpdatePull(
    branch,
    title,
    [
      `${title}, submitted through ${where}.`,
      "",
      "Approve or reject it from the review message in Slack. Approve merges it if its checks have passed.",
      note ? `\nNote: ${note}` : "",
    ].join("\n")
  );

  // Slack is the only place organizers see review requests, so a failure here is thrown for the
  // caller to report. Sending again updates the same pull request and posts a fresh message.
  await postReviewRequest({
    kind,
    pullNumber: pull.number,
    headSha,
    pullUrl: pull.html_url,
    profileName,
    profileUrl: kind === "new" ? undefined : `${siteUrl}/members/${slug}`,
    linkedinName: user?.name ?? undefined,
    slackUserId,
    linkedinHandle,
    email: user?.email ?? undefined,
    note,
  });
  return pull;
};
