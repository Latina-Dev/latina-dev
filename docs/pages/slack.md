# Slack Community

The [Latina Dev Slack](https://latinadev.slack.com) is where members meet, ask questions and share their work. This page covers the channels, the Latina Dev app that members use to manage their profile from Slack, the feed channels, and the setup only a workspace admin can do.

## Channels

Rename these to match channels that already exist rather than making duplicates. Organizers post in #announcements; everything else is open to members.

| Channel          | What it's for                                                                                                                            | Who posts          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `#announcements` | News from organizers, plus new members, answered questions and guides on latina.dev, posted automatically                                | Organizers and app |
| `#introductions` | Say hola when you join                                                                                                                   | Everyone           |
| `#ask`           | Questions for the community, answered by anyone. Questions and answers are published at latina.dev/questions so they can help others too | Everyone           |
| `#jobs`          | Roles and referrals. Include the location or remote, the level and a salary range                                                        | Everyone           |
| `#wins`          | New job, promotion, talk, launch, first PR merged. Members who opted in to milestones may be featured on Latina Dev's social accounts    | Everyone           |
| `#events`        | Conferences, meetups and talks. Scholarships and tickets especially welcome                                                              | Everyone           |
| `#member-posts`  | New posts from members' blogs, shared automatically                                                                                      | The Latina Dev app |
| `#creator-feed`  | New posts from Latina engineers outside the directory, shared automatically                                                              | The Latina Dev app |
| `#website`       | Feedback and ideas for latina.dev                                                                                                        | Everyone           |
| `#cafecito`      | Everything else                                                                                                                          | Everyone           |

Profile reviews stay in their own private channel (`SLACK_REVIEW_CHANNEL_ID`).

### Pinned message for #introductions

> **Bienvenida! 👋** Tell us:
>
> 1. Your name and where you're based
> 2. What you work on, or what you're learning
> 3. Your roots (e.g. 🇵🇪 🇲🇽)
> 4. One thing you'd love help with, and one thing you can help others with
>
> Then type `/latinadev` to link your Slack account to your directory profile, or add one at latina.dev/profile.

### Settings worth turning on

- **Default channels** for new members: #announcements, #introductions, #ask, #jobs, #wins.
- **Posting permissions** on #announcements, #member-posts and #creator-feed: organizers and the app only.
- **Welcome message** from Slackbot pointing to #introductions and `/latinadev`.

## The Latina Dev app

The same Slack app that posts profile reviews also lets members manage their profile from Slack.

- **`/latinadev`** shows your profile, with your links, a meter for how many of your five links you've added (GitHub, blog, Bluesky, X, website) and a nudge toward the next one.
- **`/latinadev edit`**, or **Edit my profile**, opens a form for your title, location, links, what you're open to, milestone opt-in and bio. Name, level and roots stay on [latina.dev/profile](https://latina.dev/profile).
- The app's **Home tab** shows the same profile card.
- **DM the app a change**, like "I'm a Staff Engineer at Acme now" or "add Speaking to what I'm open to". The profile agent (Claude, `lib/profileAgent.ts`) replies with the exact change and a **Send for review** button. It can change the same fields as the editor, never name, level, roots or LinkedIn, and the change goes through the same review as any edit.
- **`/latinadev suggest`** lets any member suggest a resource or an event. The app checks the link loads, opens a GitHub issue with the details and a vetting checklist, posts it in the review channel and DMs the member the issue link. Nothing goes on the site until an organizer vets it and adds it (resources still need the health check and a description checked against the live site). This replaces the web submission forms the hub plan had for phase 4.
- **Yearly check-in.** Once a year the app DMs each linked member her profile and asks "still accurate?". **Still accurate** records today's date as `updated`, shown as "Updated <month year>" on her profile, through a one-line pull request that merges itself once checks pass, since the bot wrote the change, not the member. **Update my profile** opens the editor. A weekly [GitHub Action](https://github.com/Latina-Dev/latina-dev/blob/main/.github/workflows/slack-check-ins.yml) asks each member in the week of the anniversary of her profile's last change, so nothing has to remember who was asked. Any approved edit also sets `updated`.

LinkedIn is still the only identity. To link Slack, a member presses **Link with LinkedIn**, which opens a personal, 15-minute link on latina.dev. They sign in with the LinkedIn account that owns their profile, and that opens a pull request adding `data/owners/slack/<slug>.txt`, which holds a hash of their Slack id, never the id itself. An organizer approves it in Slack like any other change. Members without an approved profile are sent to add one first.

Every edit sent from Slack opens a pull request on the member's usual profile branch and posts the normal review message, so an organizer still approves every change. To unlink, delete the member's file in `data/owners/slack`.

## Announcements

When a push to main adds a member profile, an answered question or a guide, a [GitHub Action](https://github.com/Latina-Dev/latina-dev/blob/main/.github/workflows/slack-announcements.yml) posts it in #announcements, so members see the community grow and come back. A push that adds more than five at once (say, the first #ask sync) posts one summary instead.

The Slack channels the app posts to are listed in [`lib/slack/channels.ts`](https://github.com/Latina-Dev/latina-dev/blob/main/lib/slack/channels.ts).

## Feed channels

A [daily GitHub Action](https://github.com/Latina-Dev/latina-dev/blob/main/.github/workflows/slack-feeds.yml) posts what was published the previous day (UTC):

- **#member-posts:** every member with a `blog` on their profile. The profile form says "Where you write, so we can share your posts", so adding a blog is the opt-in. A blog URL can be the feed itself or a page that advertises one.
- **#creator-feed:** Latina software engineers outside the directory, listed in [`lib/creatorFeeds.ts`](https://github.com/Latina-Dev/latina-dev/blob/main/lib/creatorFeeds.ts). Only add someone whose own bio says she's a Latina software engineer (or engineer-turned-educator or DevRel), and whose feed has posted in the last six months.

A weekly check lists every feed's health in the run summary and fails if a creator's feed is dead or stale, so a dead feed gets noticed. Pull requests that change the creator list run the same check.

### Creator candidates to confirm

These have active feeds, but their own bios don't say whether they're Latina, so they aren't listed yet:

- **Estefania Cassingena Navone**: "programadora, escritora y creadora de contenido para freeCodeCamp" who runs the freeCodeCamp.org Español YouTube channel. Feed: `https://www.freecodecamp.org/news/author/estefaniacn/rss/` (posted June 2026).
- **Pachi Parra**: developer relations and community builder in Brazil. Feed: `https://dev.to/feed/pachicodes` (posted October 2026). Recent posts are mostly about her employer's product.

## Setup only an admin can do

### Slack app ([api.slack.com/apps](https://api.slack.com/apps), the app from [Member Sign-in](member-sign-in.md))

1. **OAuth & Permissions → Bot Token Scopes:** keep `chat:write` and add `commands`, `users:read` (the yearly check-in finds linked members by hashing workspace members) and `im:history` (the profile agent reads DMs sent to the app). The member Q&A sync also needs `channels:history`, so add it now to reinstall only once.
2. **App Home:** turn on the **Home Tab**, and under **Messages Tab** allow messages, so the app can DM members.
3. **Slash Commands:** create `/latinadev` with the request URL `https://latina.dev/api/slack/commands`, description "Your Latina Dev profile" and usage hint `[edit | suggest]`.
4. **Event Subscriptions:** turn on with the request URL `https://latina.dev/api/slack/events` and subscribe to the bot events `app_home_opened` and `message.im`.
5. **Interactivity** keeps its request URL, `https://latina.dev/api/slack/interactions`. It now handles the profile editor, suggestions, check-ins and the agent's buttons too.
6. **Reinstall** the app to the workspace to grant the new scopes. The bot token stays the same.

### Workspace

1. Create the channels above, set posting permissions and default channels, and pin the #introductions message.
2. Invite the app to #announcements, #member-posts and #creator-feed (`/invite @Latina Dev`), and to #ask for the Q&A sync.

### GitHub ([repository settings → Secrets and variables → Actions](https://github.com/Latina-Dev/latina-dev/settings/secrets/actions))

1. Secret `SLACK_BOT_TOKEN`: the same `xoxb-…` bot token set in Vercel.
2. Variables `SLACK_ANNOUNCEMENTS_CHANNEL_ID`, `SLACK_MEMBER_POSTS_CHANNEL_ID` and `SLACK_CREATOR_FEED_CHANNEL_ID`: each channel's id, from the channel's details in Slack.
3. The fine-grained token in `PROFILE_BOT_GITHUB_TOKEN` also needs **Issues: read and write**, so suggestions can open issues.

### Vercel

1. `ANTHROPIC_API_KEY`: an API key from [platform.claude.com](https://platform.claude.com) for the profile agent. Without it, the app answers DMs by pointing to `/latinadev edit`.

Everything else is already set: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_REVIEW_CHANNEL_ID`, `AUTH_SECRET` and the LinkedIn settings that profile sign-in uses.
