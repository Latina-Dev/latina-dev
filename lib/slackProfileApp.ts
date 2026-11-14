import fs from "fs";

import { setUpdatedDate } from "@/lib/freshness";
import { parseFrontmatter } from "@/lib/frontmatter";
import { MemberFrontmatter, validateMemberFrontmatter } from "@/lib/memberSchema";
import {
  applyChanges,
  compactChanges,
  describeChanges,
  ProfileChanges,
  profileValues,
  proposalMessage,
  proposeEdit,
} from "@/lib/profileAgent";
import {
  commitToBranch,
  createIssue,
  enableAutoMerge,
  findOpenPull,
  openOrUpdatePull,
  readMainFile,
} from "@/lib/profiles/github";
import { memberPath, readMemberProfile } from "@/lib/profiles/memberData";
import {
  buildMemberProfile,
  ProfileFormValues,
  serializeMemberFile,
} from "@/lib/profiles/memberFile";
import { ownerBranch, ownerFile } from "@/lib/profiles/owners";
import { callSlack } from "@/lib/profiles/slack";
import { submitForReview } from "@/lib/profiles/submit";
import { siteUrl } from "@/lib/site";
import { postedChannels } from "@/lib/slack/channels";
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
import {
  checkLink,
  Suggestion,
  suggestionIssue,
  suggestionReviewMessage,
  suggestionView,
} from "@/lib/suggestions";

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
  return buildEdit(slug, userId, hash, readEditor(state, frontmatter), frontmatter);
};

/**
 * Validate an edited profile and prepare it for review
 * @param slug profile slug
 * @param userId Slack member sending it
 * @param hash the profile's LinkedIn owner hash
 * @param values the edited form values
 * @param frontmatter the profile's current frontmatter
 */
const buildEdit = (
  slug: string,
  userId: string,
  hash: string,
  values: ProfileFormValues,
  frontmatter: MemberFrontmatter
): { errors: Record<string, string> } | { send: () => Promise<{ html_url: string }> } => {
  const profile = buildMemberProfile(values, frontmatter, new Date().toISOString().slice(0, 10));
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

/**
 * A linked member pressed "Still accurate" on her yearly check-in: record today as her profile's
 * `updated` date. This is the bot's own one-line change, not anything she typed, so it skips
 * organizer review and merges itself once checks pass
 * @param teamId Slack workspace id
 * @param userId Slack member who pressed the button
 * @param slug profile the check-in was about
 * @returns false if her Slack account isn't linked to that profile
 */
export const confirmProfileCurrent = async (teamId: string, userId: string, slug: string) => {
  if (linkedSlug(teamId, userId) !== slug) return false;
  const path = `${memberPath}/${slug}.md`;
  const today = new Date().toISOString().slice(0, 10);
  const current = await readMainFile(path);
  const content = setUpdatedDate(current, today);
  if (content === current) return true;

  const parsed = validateMemberFrontmatter(`${slug}.md`, parseFrontmatter(content).data);
  if (!parsed.success) throw new Error(parsed.error);
  const title = `Confirm profile is current: ${parsed.data.name}`;
  const branch = `freshness/${slug}`;
  await commitToBranch(branch, [{ path, content }], title);
  const pull = await openOrUpdatePull(
    branch,
    title,
    `${parsed.data.name} confirmed from the yearly Slack check-in that her profile is still accurate, so this records \`updated: "${today}"\`. Nothing else changes, so it merges itself once checks pass.`
  );
  await enableAutoMerge(pull);
  return true;
};

/**
 * Open the /latinadev suggest modal. Anyone in the workspace may suggest; linking isn't needed
 * @param triggerId trigger_id from the slash command, valid for 3 seconds
 */
export const openSuggestion = (triggerId: string) =>
  callSlack("views.open", { trigger_id: triggerId, view: suggestionView() });

/**
 * Check a suggested link, open a GitHub issue for organizers and post it in the review channel
 * @param teamId Slack workspace id
 * @param userId Slack member who suggested it
 * @param suggestion the checked modal values
 */
export const sendSuggestion = async (teamId: string, userId: string, suggestion: Suggestion) => {
  const link = await checkLink(suggestion.url);
  const issue = suggestionIssue(suggestion, link, linkedSlug(teamId, userId));
  const { html_url: issueUrl } = await createIssue(issue.title, issue.body);
  const channel = process.env[postedChannels.review.envVar];
  if (channel) {
    await callSlack("chat.postMessage", {
      channel,
      ...suggestionReviewMessage(suggestion, link, userId, issueUrl),
    });
  }
  await dmMember(
    userId,
    `Thanks for suggesting *${suggestion.name.replace(/[<>&]/g, "")}*! An organizer will check it and add it to latina.dev if it fits. You can follow along here: ${issueUrl}`
  );
};

/**
 * The profile agent: a member DMed the app. If her Slack account is linked, Claude reads what she
 * wants changed and the bot replies with the edit and a "Send for review" button
 * @param teamId Slack workspace id
 * @param userId Slack member who sent the DM
 * @param text what she wrote
 */
export const answerDirectMessage = async (teamId: string, userId: string, text: string) => {
  const slug = linkedSlug(teamId, userId);
  if (!slug) {
    await callSlack("chat.postMessage", {
      channel: userId,
      text: "Link your Latina Dev profile first, then I can update it for you.",
      blocks: await profileBody(teamId, userId),
    });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    await dmMember(
      userId,
      "I can't make changes from messages yet. Type `/latinadev edit` to open your profile editor."
    );
    return;
  }

  const { frontmatter, bio } = readMemberProfile(slug);
  const proposal = await proposeEdit(text, frontmatter, bio);
  if (!proposal) {
    await dmMember(
      userId,
      "Sorry, I couldn't work that out. Type `/latinadev edit` to open your profile editor."
    );
    return;
  }
  const before = profileValues(frontmatter, bio);
  const after = applyChanges(before, proposal);
  const lines = describeChanges(before, after);
  if (lines.length === 0) {
    await dmMember(userId, proposal.reply);
    return;
  }
  const check = buildMemberProfile(after, frontmatter, new Date().toISOString().slice(0, 10));
  if (!check.success) {
    await dmMember(
      userId,
      `I couldn't use that: ${check.error.replace(/\s+/g, " ").slice(0, 300)}. Try again, or type \`/latinadev edit\` to open the editor.`
    );
    return;
  }
  await callSlack("chat.postMessage", {
    channel: userId,
    ...proposalMessage(slug, proposal.reply, lines, compactChanges(proposal)),
  });
};

/**
 * Send an edit the agent proposed, after the member pressed "Send for review". Rebuilt from her
 * profile as it is now, so nothing else she changed since is undone
 * @param teamId Slack workspace id
 * @param userId Slack member who pressed the button
 * @param changes the change carried in the button
 */
export const checkAgentEdit = (teamId: string, userId: string, changes: ProfileChanges) => {
  const slug = linkedSlug(teamId, userId);
  if (!slug) return { errors: { bio: "Your Slack account isn't linked to a profile anymore." } };
  const hash = profileOwner(slug);
  if (!hash) return { errors: { bio: "This profile isn't linked to a LinkedIn account." } };
  const { frontmatter, bio } = readMemberProfile(slug);
  return buildEdit(
    slug,
    userId,
    hash,
    applyChanges(profileValues(frontmatter, bio), changes),
    frontmatter
  );
};
