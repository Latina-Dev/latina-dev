import { isIP } from "net";

import { siteUrl } from "@/lib/site";

/**
 * `/latinadev suggest`: any member can suggest a resource or an event from Slack. It replaces the
 * web submission forms the hub plan had for phase 4. A suggestion never goes straight onto the
 * site: the bot checks the link, opens a GitHub issue with everything an organizer needs to vet
 * it (resources must be health-checked and their description checked against the live site, see
 * docs/pages/resources.md), and posts it in the review channel.
 */

export const suggestionKinds = { resource: "Resource", event: "Event" } as const;

export type SuggestionKind = keyof typeof suggestionKinds;

export interface Suggestion {
  kind: SuggestionKind;
  name: string;
  url: string;
  description: string;
  when?: string; // YYYY-MM-DD, events only
  where?: string; // city or "Online", events only
  notes?: string; // who it's for, who runs it, anything else
}

export interface LinkCheck {
  ok: boolean;
  status?: number;
  finalUrl?: string;
  title?: string;
  error?: string;
}

const plain = (value: string) => ({ type: "plain_text", text: value, emoji: true });

const field = (
  id: keyof Suggestion,
  label: string,
  element: Record<string, unknown>,
  { optional = false, hint }: { optional?: boolean; hint?: string } = {}
) => ({
  type: "input",
  block_id: id,
  optional,
  label: plain(label),
  ...(hint ? { hint: plain(hint) } : {}),
  element: { ...element, action_id: "value" },
});

/** The suggestion modal */
export const suggestionView = () => ({
  type: "modal",
  callback_id: "suggestion",
  title: plain("Suggest something"),
  submit: plain("Send"),
  close: plain("Cancel"),
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Know a community, program, scholarship, job board, conference or event that helps Latina engineers in the U.S.? An organizer checks every suggestion before it goes on latina.dev.",
      },
    },
    field("kind", "What is it?", {
      type: "static_select",
      initial_option: { text: plain(suggestionKinds.resource), value: "resource" },
      options: Object.entries(suggestionKinds).map(([value, text]) => ({
        text: plain(text),
        value,
      })),
    }),
    field("name", "Name", { type: "plain_text_input", max_length: 120 }),
    field("url", "Link", {
      type: "url_text_input",
      placeholder: plain("https://"),
    }),
    field(
      "description",
      "What is it, in a sentence?",
      { type: "plain_text_input", multiline: true, max_length: 400 },
      { hint: "The organizer checks this against the site before publishing it." }
    ),
    field("when", "Date (events)", { type: "datepicker" }, { optional: true }),
    field(
      "where",
      "Where (events)",
      { type: "plain_text_input", max_length: 120, placeholder: plain("City, or Online") },
      { optional: true }
    ),
    field(
      "notes",
      "Anything else?",
      { type: "plain_text_input", multiline: true, max_length: 600 },
      { optional: true, hint: "Who it's for, who runs it, how you know it." }
    ),
  ],
});

type StateValue = {
  value?: string | null;
  selected_date?: string | null;
  selected_option?: { value: string } | null;
};

/**
 * Check a submitted suggestion modal
 * @param state view.state.values
 * @returns the suggestion, or Slack's per-field errors
 */
export const readSuggestion = (
  state: Record<string, Record<string, StateValue>>
): { suggestion: Suggestion } | { errors: Record<string, string> } => {
  const read = (id: keyof Suggestion) => {
    const value = state[id]?.value;
    return (value?.selected_option?.value ?? value?.selected_date ?? value?.value ?? "").trim();
  };
  const errors: Record<string, string> = {};

  const kind = read("kind");
  if (!(kind in suggestionKinds)) errors.kind = "Pick a resource or an event.";
  const name = read("name").replace(/\s+/g, " ");
  if (!name) errors.name = "Add its name.";
  const url = read("url");
  if (!isPublicHttpUrl(url)) errors.url = "Add a full public link starting with https://";
  const description = read("description").replace(/\s+/g, " ");
  if (description.length < 10) errors.description = "Add a sentence about what it is.";
  const when = read("when");
  if (when && !/^\d{4}-\d{2}-\d{2}$/.test(when)) errors.when = "Pick a date.";
  if (kind === "event" && !when) errors.when = "Events need a date.";

  if (Object.keys(errors).length) return { errors };
  const where = read("where");
  const notes = read("notes");
  return {
    suggestion: {
      kind: kind as SuggestionKind,
      name,
      url,
      description,
      ...(when ? { when } : {}),
      ...(where ? { where } : {}),
      ...(notes ? { notes } : {}),
    },
  };
};

/**
 * Whether a link is a plain http(s) URL on a public host name, so the link check never reaches
 * a private address
 * @param value the URL
 */
export const isPublicHttpUrl = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  // No sign-in details or custom port: the address must start with the plain host
  if (url.port || !url.href.startsWith(`${url.protocol}//${url.hostname}`)) return false;
  const host = url.hostname.toLowerCase();
  if (isIP(host.replace(/^\[|\]$/g, ""))) return false;
  if (!host.includes(".")) return false;
  return !/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(host);
};

/**
 * Check that a suggested link loads, following up to five redirects and checking each hop
 * @param url a URL that passed isPublicHttpUrl
 */
export const checkLink = async (url: string): Promise<LinkCheck> => {
  let current = url;
  try {
    for (let hop = 0; hop < 5; hop++) {
      if (!isPublicHttpUrl(current)) return { ok: false, error: "redirects to a private address" };
      const response = await fetch(current, {
        redirect: "manual",
        headers: { "User-Agent": "LatinaDevBot/1.0 (+https://latina.dev)", Accept: "text/html" },
        signal: AbortSignal.timeout(8_000),
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current).href;
        continue;
      }
      const html = response.ok ? (await response.text()).slice(0, 200_000) : "";
      const title = /<title[^>]*>([^<]{1,200})<\/title>/i
        .exec(html)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      return {
        ok: response.ok,
        status: response.status,
        finalUrl: current,
        ...(title ? { title } : {}),
      };
    }
    return { ok: false, error: "too many redirects" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "failed" };
  }
};

/** A Markdown table cell or line that can't break out into links, mentions or HTML */
const md = (value: string) => value.replace(/[<>[\]`|@]/g, (c) => `\\${c}`);

/**
 * The GitHub issue for a suggestion. The suggester's Slack id stays out of the public repo;
 * only her public profile is linked, when her Slack account is linked to one
 * @param suggestion what was suggested
 * @param link result of checkLink
 * @param profileSlug the suggester's profile, if linked
 */
export const suggestionIssue = (suggestion: Suggestion, link: LinkCheck, profileSlug?: string) => {
  const label = suggestionKinds[suggestion.kind];
  const health = link.ok
    ? `✅ Loads (HTTP ${link.status})${link.title ? `, page title “${md(link.title)}”` : ""}${link.finalUrl && link.finalUrl !== suggestion.url ? `, ends at ${md(link.finalUrl)}` : ""}`
    : `❌ ${link.status ? `HTTP ${link.status}` : md(link.error ?? "didn't load")}`;
  const checklist =
    suggestion.kind === "resource"
      ? [
          "- [ ] The site loads, has real content and is still active",
          "- [ ] The description matches what the live site says",
          "- [ ] It serves Latinas in the U.S. (not only Latin America)",
          "- [ ] Newsletters and courses are led by a Latina",
          "- [ ] Added to data/resources with an icon (`npm run logos:resources`)",
        ]
      : [
          "- [ ] The event page loads and the date matches",
          "- [ ] It's open to Latina engineers in the U.S.",
          "- [ ] Added to the events calendar once data/events exists (hub plan phase 3)",
        ];
  return {
    title: `${label} suggestion: ${suggestion.name}`,
    body: [
      `A member suggested this ${label.toLowerCase()} in Slack with \`/latinadev suggest\`.`,
      "",
      `| | |`,
      `| --- | --- |`,
      `| Name | ${md(suggestion.name)} |`,
      `| Link | ${md(suggestion.url)} |`,
      `| What it is | ${md(suggestion.description)} |`,
      suggestion.when ? `| Date | ${suggestion.when} |` : undefined,
      suggestion.where ? `| Where | ${md(suggestion.where)} |` : undefined,
      suggestion.notes ? `| Notes | ${md(suggestion.notes)} |` : undefined,
      profileSlug ? `| Suggested by | ${siteUrl}/members/${profileSlug} |` : undefined,
      `| Link check | ${health} |`,
      "",
      "Before adding it:",
      ...checklist,
    ]
      .filter((line) => line !== undefined)
      .join("\n"),
  };
};

// Slack mrkdwn treats these as formatting, so member text has them escaped
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The review channel message for a suggestion
 * @param suggestion what was suggested
 * @param link result of checkLink
 * @param userId Slack member who suggested it
 * @param issueUrl the GitHub issue
 */
export const suggestionReviewMessage = (
  suggestion: Suggestion,
  link: LinkCheck,
  userId: string,
  issueUrl: string
) => {
  if (!/^[A-Z0-9]{2,20}$/.test(userId)) throw new Error("Invalid Slack user id");
  const label = suggestionKinds[suggestion.kind];
  return {
    text: `${label} suggestion: ${suggestion.name}`,
    unfurl_links: false,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*${label} suggestion from <@${userId}>: ${escape(suggestion.name)}*`,
            escape(suggestion.description),
            suggestion.when
              ? `📅 ${suggestion.when}${suggestion.where ? `, ${escape(suggestion.where)}` : ""}`
              : undefined,
            `${link.ok ? "✅ Link loads" : "❌ Link didn't load"}: ${escape(suggestion.url)}`,
            `Vet and add it from <${issueUrl}|the GitHub issue>.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  };
};
