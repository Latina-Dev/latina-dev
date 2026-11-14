import { readdirSync, readFileSync } from "fs";

import { checkInMessage, isDueForCheckIn } from "@/lib/freshness";
import { readMemberFiles } from "@/lib/getMembers";
import { hasFullGitHistory, memberLastModified } from "@/lib/memberDates";
import { callSlack } from "@/lib/profiles/slack";
import { slackReader } from "@/lib/slack/client";
import { slackKey } from "@/lib/slackLinks";

// The yearly "still accurate?" check-in (lib/freshness.ts). Run weekly by
// .github/workflows/slack-check-ins.yml, or by hand:
//
//   npx tsx scripts/slack-check-ins.ts            DM every linked member due this week
//   npx tsx scripts/slack-check-ins.ts --dry-run  only list who is due
//
// Needs SLACK_BOT_TOKEN, the profile app's bot token, with users:read (to find linked members:
// the repo stores only a hash of each Slack id) and chat:write. Without it the run is a dry run.

const dryRun = process.argv.includes("--dry-run") || !process.env.SLACK_BOT_TOKEN;
// More DMs than this in one week means something is off, e.g. dates lost in a shallow clone
const maxCheckIns = 40;

const linksPath = "data/owners/slack";

/** Link hash → profile slug, from data/owners/slack */
const readLinks = () => {
  const links = new Map<string, string>();
  try {
    for (const file of readdirSync(linksPath).filter((name) => name.endsWith(".txt"))) {
      links.set(readFileSync(`${linksPath}/${file}`, "utf8").trim(), file.replace(/\.txt$/, ""));
    }
  } catch {
    // No links yet
  }
  return links;
};

interface SlackUser {
  id: string;
  deleted?: boolean;
  is_bot?: boolean;
}

async function main() {
  const links = readLinks();
  if (links.size === 0) {
    console.log("No members have linked Slack yet.");
    return;
  }
  if (!hasFullGitHistory()) {
    throw new Error("Needs full git history to know when each profile last changed");
  }

  const now = new Date();
  const profiles = new Map(readMemberFiles().map((file) => [file.slug, file.data]));
  const due = [...links.values()].filter((slug) => {
    const profile = profiles.get(slug);
    return profile && isDueForCheckIn(memberLastModified({ slug, ...profile }, true), now);
  });
  console.log(`${due.length} of ${links.size} linked members are due: ${due.join(", ") || "none"}`);
  if (due.length === 0 || dryRun) return;
  if (due.length > maxCheckIns) {
    throw new Error(`${due.length} check-ins is more than ${maxCheckIns}; check the dates first`);
  }

  // Find each due member's Slack id by hashing everyone in the workspace
  const slack = slackReader(process.env.SLACK_BOT_TOKEN!);
  const { team_id: teamId } = await slack.call<{ team_id: string }>("auth.test", {});
  const dueSlugs = new Set(due);
  const recipients = new Map<string, string>();
  let cursor = "";
  do {
    const page = await slack.call<{
      members: SlackUser[];
      response_metadata?: { next_cursor?: string };
    }>("users.list", { limit: "200", ...(cursor ? { cursor } : {}) });
    for (const user of page.members) {
      if (user.deleted || user.is_bot) continue;
      const slug = links.get(slackKey(teamId, user.id));
      if (slug && dueSlugs.has(slug)) recipients.set(slug, user.id);
    }
    cursor = page.response_metadata?.next_cursor ?? "";
  } while (cursor);

  let failures = 0;
  for (const [slug, userId] of recipients) {
    try {
      await callSlack("chat.postMessage", {
        channel: userId,
        ...checkInMessage(slug, profiles.get(slug)!),
      });
      console.log(`Asked ${slug}`);
    } catch (error) {
      failures++;
      console.error(`Couldn't ask ${slug}:`, error);
    }
  }
  const missing = due.filter((slug) => !recipients.has(slug));
  if (missing.length) console.log(`Not in Slack anymore: ${missing.join(", ")}`);
  if (failures) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
