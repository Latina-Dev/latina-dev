import { after } from "next/server";

import { isValidSlackSignature } from "@/lib/profiles/slack";
import { publishHome } from "@/lib/slackProfileApp";

type SlackEvent =
  | { type: "url_verification"; challenge: string }
  | {
      type: "event_callback";
      team_id: string;
      event: { type: string; user?: string; tab?: string };
    };

/**
 * Slack Events API. Today it only draws the profile app's Home tab when a member opens it;
 * add other events here as more of the app needs them.
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
    if (event.type === "app_home_opened" && event.tab === "home" && event.user) {
      const userId = event.user;
      after(() => publishHome(teamId, userId).catch((error: unknown) => console.error(error)));
    }
  }
  return new Response(null, { status: 200 });
}
