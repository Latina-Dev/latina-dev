import { after } from "next/server";

import { isValidSlackSignature } from "@/lib/profiles/slack";
import { answerDirectMessage, dmMember, publishHome } from "@/lib/slackProfileApp";

// Claude can take a few seconds to read a DM, and that work runs after Slack gets its answer
export const maxDuration = 60;

type SlackEvent =
  | { type: "url_verification"; challenge: string }
  | {
      type: "event_callback";
      team_id: string;
      event: {
        type: string;
        user?: string;
        tab?: string;
        channel_type?: string;
        subtype?: string;
        bot_id?: string;
        text?: string;
      };
    };

/**
 * Slack Events API: draws the profile app's Home tab when a member opens it, and answers DMs to
 * the app with the profile agent (lib/profileAgent.ts).
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

  let payload: SlackEvent;
  try {
    payload = JSON.parse(body) as SlackEvent;
  } catch {
    return new Response("Malformed payload", { status: 400 });
  }

  // Slack checks the URL once when it's saved in the app settings
  if (payload.type === "url_verification") {
    return new Response(payload.challenge, { headers: { "Content-Type": "text/plain" } });
  }

  if (payload.type === "event_callback") {
    const { event, team_id: teamId } = payload;
    // Slack resends an event it thinks timed out; answering twice would send two proposals
    if (request.headers.get("x-slack-retry-num")) return new Response(null, { status: 200 });
    // A member's own message in her DM with the app; never the bot's own or an edit
    if (
      event.type === "message" &&
      event.channel_type === "im" &&
      !event.subtype &&
      !event.bot_id &&
      event.user &&
      event.text?.trim()
    ) {
      const userId = event.user;
      const text = event.text;
      after(async () => {
        try {
          await answerDirectMessage(teamId, userId, text);
        } catch (error) {
          console.error(error);
          await dmMember(
            userId,
            "Sorry, something went wrong. Type `/latinadev edit` to open your profile editor."
          ).catch(console.error);
        }
      });
    }
    if (event.type === "app_home_opened" && event.tab === "home" && event.user) {
      const userId = event.user;
      after(() => publishHome(teamId, userId).catch((error: unknown) => console.error(error)));
    }
  }
  return new Response(null, { status: 200 });
}
