"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { readMemberProfile } from "@/lib/profiles/memberData";
import { readOwnedSlug } from "@/lib/profiles/owners";
import { callSlack } from "@/lib/profiles/slack";
import { submitForReview } from "@/lib/profiles/submit";
import {
  linkedSlug,
  slackKey,
  slackLinkBranch,
  slackLinkFile,
  verifyLinkToken,
} from "@/lib/slackLinks";

/**
 * Ask to link the Slack member a link was made for to the profile the signed-in LinkedIn
 * account owns. Like any profile change, it opens a pull request for an organizer to approve.
 */
export async function linkSlackAccount(formData: FormData) {
  const token = formData.get("t");
  const slack = verifyLinkToken(typeof token === "string" ? token : undefined);
  if (!slack) redirect("/slack/link");

  const session = await auth();
  const slug = session?.ownerHash ? readOwnedSlug(session.ownerHash) : undefined;
  if (!session?.user || !slug) redirect(`/slack/link?t=${token}`);
  if (linkedSlug(slack.teamId, slack.userId) === slug) redirect(`/slack/link?t=${token}`);

  const { frontmatter } = readMemberProfile(slug);
  try {
    await submitForReview({
      kind: "link",
      branch: slackLinkBranch(slack.teamId, slack.userId),
      user: session.user,
      slackUserId: slack.userId,
      slug,
      profileName: frontmatter.name,
      linkedinHandle: frontmatter.linkedin,
      files: [{ path: slackLinkFile(slug), content: `${slackKey(slack.teamId, slack.userId)}\n` }],
    });
  } catch (error) {
    console.error(error);
    redirect(`/slack/link?t=${token}&status=error`);
  }

  // Best effort: a note in the member's DMs with the app, so they know what happens next
  await callSlack("chat.postMessage", {
    channel: slack.userId,
    text: "Thanks! 🙌 An organizer will approve your Slack link soon. Once it's live, open this app's Home tab or type `/latinadev` to edit your profile from Slack.",
  }).catch((error: unknown) => console.error(error));

  redirect(`/slack/link?t=${token}&status=sent`);
}
