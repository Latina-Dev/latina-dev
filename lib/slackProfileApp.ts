import fs from "fs";

import { findOpenPull } from "@/lib/profiles/github";
import { memberPath, readMemberProfile } from "@/lib/profiles/memberData";
import { buildMemberProfile, serializeMemberFile } from "@/lib/profiles/memberFile";
import { ownerBranch, ownerFile } from "@/lib/profiles/owners";
import { callSlack } from "@/lib/profiles/slack";
import { submitForReview } from "@/lib/profiles/submit";
import { siteUrl } from "@/lib/site";
import { createLinkToken, linkedSlug, slackLinkBranch } from "@/lib/slackLinks";
import {
  editorErrors,
  editorView,
  homeView,
  linkBlocks,
  manageBlocks,
  pendingLinkBlocks,
  profileBlocks,
  readEditor,
} from "@/lib/slackProfileViews";

/**
 * What a Slack member sees from the profile app: their profile if they've linked one, their
 * pending link, or a personal "Link with LinkedIn" button
 * @param teamId Slack workspace id
 * @param userId Slack member id
 */
export const profileBody = async (teamId: string, userId: string) => {
  const slug = linkedSlug(teamId, userId);
  if (slug) {
    const { frontmatter } = readMemberProfile(slug);
    return [...profileBlocks(slug, frontmatter), ...manageBlocks()];
  }
  const pending = await findOpenPull(slackLinkBranch(teamId, userId)).catch(() => undefined);
  if (pending) return pendingLinkBlocks();
  return linkBlocks(`${siteUrl}/slack/link?t=${createLinkToken(teamId, userId)}`);
};

/**
 * Refresh a member's App Home tab
 * @param teamId Slack workspace id
 * @param userId Slack member id
 */
export const publishHome = async (teamId: string, userId: string) =>
  callSlack("views.publish", {
    user_id: userId,
    view: homeView(await profileBody(teamId, userId)),
  });

/**
 * Open the profile editor for a linked member
 * @param teamId Slack workspace id
 * @param userId Slack member id
 * @param triggerId trigger_id from the button press or slash command, valid for 3 seconds
 * @returns false if they haven't linked a profile yet
 */
export const openEditor = async (teamId: string, userId: string, triggerId: string) => {
  const slug = linkedSlug(teamId, userId);
  if (!slug) return false;
  const { frontmatter, bio } = readMemberProfile(slug);
  await callSlack("views.open", {
    trigger_id: triggerId,
    view: editorView(slug, frontmatter, bio),
  });
  return true;
};

/** LinkedIn owner hash of a profile, from data/owners */
const profileOwner = (slug: string) => {
  try {
    const hash = fs.readFileSync(ownerFile(slug), "utf8").trim();
    return /^[a-f0-9]{64}$/.test(hash) ? hash : undefined;
  } catch {
    return undefined;
  }
};

type EditorState = Record<string, Record<string, { value?: string | null }>>;

/**
 * Check a submitted profile editor
 * @param teamId Slack workspace id
 * @param userId Slack member id who submitted it
 * @param slug profile slug the editor was opened for
 * @param state view.state.values
 * @returns Slack's per-field errors, or the change to send for review
 */
export const checkEditor = (
  teamId: string,
  userId: string,
  slug: string,
  state: EditorState
): { errors: Record<string, string> } | { send: () => Promise<{ html_url: string }> } => {
  // Only the member linked to this profile may edit it, whatever the modal's metadata says
  if (linkedSlug(teamId, userId) !== slug) {
    return { errors: { bio: "Your Slack account isn't linked to this profile anymore." } };
  }
  const hash = profileOwner(slug);
  if (!hash) return { errors: { bio: "This profile isn't linked to a LinkedIn account." } };

  const { frontmatter } = readMemberProfile(slug);
  const profile = buildMemberProfile(readEditor(state, frontmatter), frontmatter, "");
  if (!profile.success) return { errors: editorErrors(profile.error) };

  return {
    send: () =>
      submitForReview({
        kind: "edit",
        branch: ownerBranch(hash),
        slackUserId: userId,
        slug,
        profileName: profile.data.name,
        linkedinHandle: profile.data.linkedin,
        files: [
          {
            path: `${memberPath}/${slug}.md`,
            content: serializeMemberFile(profile.data, profile.bio),
          },
        ],
      }),
  };
};

/**
 * Tell a member in their DMs with the app how their edit went
 * @param userId Slack member id
 * @param message what to say
 */
export const dmMember = (userId: string, message: string) =>
  callSlack("chat.postMessage", { channel: userId, text: message });
