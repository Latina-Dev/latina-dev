import { MemberFrontmatter } from "@/lib/memberSchema";
import { ProfileFormValues } from "@/lib/profiles/memberFile";
import { siteUrl } from "@/lib/site";

import { openToOptions } from "@/types/members";

/**
 * Slack Block Kit views for the profile app: the App Home tab, the /latinadev reply and the
 * profile editor. Pure functions, so they're tested without Slack.
 */

type Block = Record<string, unknown>;

const text = (value: string) => ({ type: "mrkdwn", text: value });
const plain = (value: string) => ({ type: "plain_text", text: value, emoji: true });

// Slack mrkdwn treats these as formatting, so profile text has them escaped
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The links a member can add, in the order the meter fills up, with a nudge for each */
const profileLinks = [
  {
    key: "github",
    label: "GitHub",
    nudge: "Add your GitHub so members can see what you build.",
    href: (v: string) => `https://github.com/${v}`,
  },
  {
    key: "blog",
    label: "Blog",
    nudge: "Add your blog and your new posts show up in #member-posts.",
    href: (v: string) => v,
  },
  {
    key: "bluesky",
    label: "Bluesky",
    nudge: "Add your Bluesky so members can follow you there.",
    href: (v: string) => `https://bsky.app/profile/${v}`,
  },
  {
    key: "twitter",
    label: "X",
    nudge: "Add your X handle so members can follow you there.",
    href: (v: string) => `https://x.com/${v}`,
  },
  {
    key: "website",
    label: "Website",
    nudge: "Add your website so people can find your work.",
    href: (v: string) => v,
  },
] as const satisfies readonly {
  key: keyof MemberFrontmatter;
  label: string;
  nudge: string;
  href: (value: string) => string;
}[];

/**
 * How many of the optional links a profile has, as a little meter
 * @param profile the member's frontmatter
 */
export const linkMeter = (profile: MemberFrontmatter) => {
  const added = profileLinks.filter((link) => profile[link.key]);
  const missing = profileLinks.filter((link) => !profile[link.key]);
  const meter = "🌟".repeat(added.length) + "☆".repeat(missing.length);
  const summary =
    missing.length === 0
      ? `${meter}  All ${profileLinks.length} links added. Your profile is fully loaded! 🎉`
      : `${meter}  ${added.length} of ${profileLinks.length} links added. ${missing[0].nudge}`;
  return { added: added.length, total: profileLinks.length, summary };
};

const profileUrl = (slug: string) => `${siteUrl}/members/${slug}`;

/**
 * Blocks describing a member's profile, with buttons to edit it
 * @param slug profile slug
 * @param profile the member's frontmatter
 */
export const profileBlocks = (slug: string, profile: MemberFrontmatter): Block[] => {
  const about = [profile.affiliation, profile.location].filter(Boolean).map((v) => escape(v!));
  const links = [
    `<https://www.linkedin.com/in/${encodeURIComponent(profile.linkedin)}|LinkedIn>`,
    ...profileLinks.flatMap((link) => {
      const value = profile[link.key];
      return value ? [`<${link.href(value)}|${link.label}>`] : [];
    }),
  ];

  return [
    {
      type: "section",
      text: text(
        [
          `*<${profileUrl(slug)}|${escape(profile.name)}>*`,
          about.join(" · "),
          profile.openTo ? `Open to: ${profile.openTo.join(", ")}` : undefined,
        ]
          .filter(Boolean)
          .join("\n")
      ),
    },
    { type: "context", elements: [text(links.join("  •  "))] },
    { type: "section", text: text(linkMeter(profile).summary) },
    {
      type: "context",
      elements: [
        text(
          profile.featureMilestones
            ? "📣 You're opted in to having your milestones featured on Latina Dev's social accounts."
            : "📣 Want your new job, talk or launch shared on Latina Dev's social accounts? Turn on milestones in your profile."
        ),
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: plain("✏️ Edit my profile"),
          style: "primary",
          action_id: "open_profile_editor",
          value: slug,
        },
        { type: "button", text: plain("View on latina.dev"), url: profileUrl(slug) },
      ],
    },
  ];
};

/**
 * Blocks asking a member to link their Slack account by signing in with LinkedIn
 * @param linkUrl personal, short-lived link from createLinkToken
 */
export const linkBlocks = (linkUrl: string): Block[] => [
  {
    type: "section",
    text: text(
      "*Bienvenida!* 👋 Link your Slack account to your Latina Dev profile to update your links, " +
        "what you're open to and more without leaving Slack.\n\n" +
        "You'll sign in with LinkedIn on latina.dev. It's the only sign-in we use, so every profile is real."
    ),
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: plain("🔗 Link with LinkedIn"),
        style: "primary",
        url: linkUrl,
        action_id: "open_link_page",
      },
    ],
  },
  {
    type: "context",
    elements: [text("This link is just for you and works for 15 minutes.")],
  },
];

/** Blocks for a member whose link is waiting for an organizer's approval */
export const pendingLinkBlocks = (): Block[] => [
  {
    type: "section",
    text: text(
      "⏳ Your link is waiting for an organizer's approval. Once it's live, you'll see your profile here."
    ),
  },
];

/** Footer for linked members */
export const manageBlocks = (): Block[] => [
  { type: "divider" },
  {
    type: "context",
    elements: [
      text(
        "Tip: type `/latinadev` in any channel to see your profile, or `/latinadev edit` to update it. To unlink Slack, email hola@latina.dev."
      ),
    ],
  },
];

/**
 * The App Home tab
 * @param body blocks from one of the builders above
 */
export const homeView = (body: Block[]) => ({
  type: "home",
  blocks: [
    { type: "header", text: plain("Your Latina Dev profile ✨") },
    ...body,
    { type: "divider" },
    {
      type: "context",
      elements: [
        text(
          `<${siteUrl}/members|Browse the directory>  •  <${siteUrl}/resources|Resources>  •  Every profile change is reviewed by an organizer before it goes live.`
        ),
      ],
    },
  ],
});

// Fields the Slack editor shows; name, level, roots and LinkedIn stay on the website form
const editorFields = [
  "affiliation",
  "location",
  "github",
  "twitter",
  "bluesky",
  "website",
  "blog",
  "openTo",
  "featureMilestones",
  "bio",
] as const;

type EditorField = (typeof editorFields)[number];

const input = (
  field: EditorField,
  label: string,
  initial: string | undefined,
  placeholder: string,
  hint?: string
): Block => ({
  type: "input",
  block_id: field,
  optional: true,
  label: plain(label),
  ...(hint ? { hint: plain(hint) } : {}),
  element: {
    type: "plain_text_input",
    action_id: "value",
    placeholder: plain(placeholder),
    ...(initial ? { initial_value: initial } : {}),
  },
});

const option = (value: string, label = value) => ({ text: plain(label), value });

/**
 * The profile editor modal
 * @param slug profile slug, carried in private_metadata
 * @param profile current frontmatter
 * @param bio current bio
 */
export const editorView = (slug: string, profile: MemberFrontmatter, bio: string) => {
  const milestones = option(
    "true",
    "📣 OK to feature my milestones on Latina Dev's social accounts"
  );
  return {
    type: "modal",
    callback_id: "profile_editor",
    private_metadata: slug,
    title: plain("Edit your profile"),
    submit: plain("Send for review"),
    close: plain("Cancel"),
    blocks: [
      {
        type: "context",
        elements: [
          text(
            `An organizer reviews every change before it goes live. To change your name, level or roots, use <${siteUrl}/profile|latina.dev/profile>.`
          ),
        ],
      },
      input(
        "affiliation",
        "Title and company or school",
        profile.affiliation,
        "Senior Software Engineer at Acme"
      ),
      input("location", "Where you're based", profile.location, "San Francisco, CA"),
      input("github", "GitHub username", profile.github, "FrancesCoronel"),
      input("twitter", "X username", profile.twitter, "@FrancesCoronel"),
      input("bluesky", "Bluesky handle", profile.bluesky, "you.bsky.social"),
      input("website", "Website", profile.website, "https://example.com"),
      input(
        "blog",
        "Blog or RSS feed",
        profile.blog,
        "https://example.com/blog",
        "New posts are shared in #member-posts."
      ),
      {
        type: "input",
        block_id: "openTo",
        optional: true,
        label: plain("Open to"),
        element: {
          type: "checkboxes",
          action_id: "value",
          options: openToOptions.map((value) => option(value)),
          ...(profile.openTo?.length
            ? { initial_options: profile.openTo.map((value) => option(value)) }
            : {}),
        },
      },
      {
        type: "input",
        block_id: "featureMilestones",
        optional: true,
        label: plain("Milestones"),
        element: {
          type: "checkboxes",
          action_id: "value",
          options: [milestones],
          ...(profile.featureMilestones ? { initial_options: [milestones] } : {}),
        },
      },
      {
        type: "input",
        block_id: "bio",
        label: plain("Bio"),
        element: {
          type: "plain_text_input",
          action_id: "value",
          multiline: true,
          max_length: 2000,
          ...(bio ? { initial_value: bio } : {}),
        },
      },
    ],
  };
};

type StateValue = { value?: string | null; selected_options?: { value: string }[] };

/**
 * Turn a submitted editor into profile form values, keeping the fields Slack doesn't show
 * @param state view.state.values from the view_submission payload
 * @param profile current frontmatter
 */
export const readEditor = (
  state: Record<string, Record<string, StateValue>>,
  profile: MemberFrontmatter
): ProfileFormValues => {
  const form = new FormData();
  for (const field of editorFields) {
    const value = state[field]?.value;
    if (value?.selected_options) {
      for (const selected of value.selected_options) form.append(field, selected.value);
    } else if (value?.value) {
      form.set(field, value.value);
    }
  }
  return {
    // Fields the editor doesn't show are carried over unchanged
    name: profile.name,
    level: profile.level,
    linkedin: profile.linkedin,
    countries: profile.countries ?? [],
    ...readEditorFields(form),
  };
};

// The same clean-up the website form applies, e.g. a pasted bsky.app URL becomes a handle
const readEditorFields = (form: FormData) => {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    affiliation: text("affiliation"),
    location: text("location"),
    github: text("github").replace(/^@/, ""),
    twitter: text("twitter")
      .replace(/^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/+$/, ""),
    bluesky: text("bluesky")
      .replace(/^(https?:\/\/)?(www\.)?bsky\.app\/profile\//i, "")
      .replace(/^@/, "")
      .replace(/\/+$/, "")
      .toLowerCase(),
    website: text("website"),
    blog: text("blog"),
    openTo: form.getAll("openTo").filter((v): v is string => typeof v === "string"),
    featureMilestones: form.get("featureMilestones") === "true",
    bio: text("bio"),
  };
};

/**
 * Turn a validation error from buildMemberProfile into Slack's per-field modal errors
 * @param error e.g. "✖ must be only the GitHub username\n  → at github"
 */
export const editorErrors = (error: string) => {
  const errors: Record<string, string> = {};
  const lines = error.split("\n");
  lines.forEach((line, i) => {
    const at = /→ at (\w+)/.exec(line);
    if (!at) return;
    const field = at[1];
    const message = lines[i - 1]?.replace(/^✖\s*/, "").trim() || "Please check this field";
    const block = (editorFields as readonly string[]).includes(field) ? field : "bio";
    errors[block] = errors[block] ?? message.slice(0, 150);
  });
  if (Object.keys(errors).length === 0) errors.bio = error.replace(/^Bio:\s*/, "").slice(0, 150);
  return errors;
};
