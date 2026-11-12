import { after } from "next/server";

import { isValidSlackSignature } from "@/lib/profiles/slack";
import { openEditor, profileBody } from "@/lib/slackProfileApp";

const ephemeral = (text: string) =>
  new Response(JSON.stringify({ response_type: "ephemeral", text }), {
    headers: { "Content-Type": "application/json" },
  });

const help =
  "*/latinadev* shows your Latina Dev profile, and *`/latinadev edit`* opens the editor. You can also open the Latina Dev app's Home tab.";

/**
 * The /latinadev slash command. Replies only to the member who typed it.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const valid = isValidSlackSignature(
    process.env.SLACK_SIGNING_SECRET ?? "",
    request.headers.get("x-slack-request-timestamp"),
    body,
    request.headers.get("x-slack-signature")
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const form = new URLSearchParams(body);
  const teamId = form.get("team_id") ?? "";
  const userId = form.get("user_id") ?? "";
  const responseUrl = form.get("response_url") ?? "";
  const triggerId = form.get("trigger_id") ?? "";
  const subcommand = (form.get("text") ?? "").trim().toLowerCase();

  if (subcommand === "help") return ephemeral(help);

  if (subcommand === "edit") {
    // trigger_id expires after three seconds, so the editor opens before responding
    const opened = await openEditor(teamId, userId, triggerId).catch((error: unknown) => {
      console.error(error);
      return false;
    });
    if (opened) return new Response(null, { status: 200 });
  }

  // Only Slack's own response URL is ever called back
  if (!/^https:\/\/hooks\.slack\.com\//.test(responseUrl)) {
    return ephemeral("Something went wrong. Please try again.");
  }
  // Finding a pending link asks GitHub, so the answer is sent after acknowledging
  after(async () => {
    try {
      const blocks = await profileBody(teamId, userId);
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "ephemeral",
          text: "Your Latina Dev profile",
          blocks,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  });
  return new Response(null, { status: 200 });
}
