# Slack Community

The [Latina Dev Slack](https://latinadev.slack.com) is where members meet, ask questions and share their work. This page covers the channels, the Latina Dev app that members use to manage their profile from Slack, the feed channels, and the setup only a workspace admin can do.

## Channels

Rename these to match channels that already exist rather than making duplicates. Organizers post in #announcements; everything else is open to members.

| Channel          | What it's for                                                                                                                            | Who posts          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `#announcements` | News from organizers: new features, events, the monthly roundup                                                                          | Organizers         |
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

LinkedIn is still the only identity. To link Slack, a member presses **Link with LinkedIn**, which opens a personal, 15-minute link on latina.dev. They sign in with the LinkedIn account that owns their profile, and that opens a pull request adding `data/owners/slack/<slug>.txt`, which holds a hash of their Slack id, never the id itself. An organizer approves it in Slack like any other change. Members without an approved profile are sent to add one first.

Every edit sent from Slack opens a pull request on the member's usual profile branch and posts the normal review message, so an organizer still approves every change. To unlink, delete the member's file in `data/owners/slack`.

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

1. **OAuth & Permissions → Bot Token Scopes:** keep `chat:write` and add `commands`. The member Q&A sync also needs `channels:history` and `users:read`, so add them now to reinstall only once.
2. **App Home:** turn on the **Home Tab**, and under **Messages Tab** allow messages, so the app can DM members.
3. **Slash Commands:** create `/latinadev` with the request URL `https://latina.dev/api/slack/commands`, description "Your Latina Dev profile" and usage hint `[edit]`.
4. **Event Subscriptions:** turn on with the request URL `https://latina.dev/api/slack/events` and subscribe to the bot event `app_home_opened`.
5. **Interactivity** keeps its request URL, `https://latina.dev/api/slack/interactions`. It now handles the profile editor too.
6. **Reinstall** the app to the workspace to grant the new scopes. The bot token stays the same.

### Workspace

1. Create the channels above, set posting permissions and default channels, and pin the #introductions message.
2. Invite the app to #member-posts and #creator-feed (`/invite @Latina Dev`), and to #ask for the Q&A sync.

### GitHub ([repository settings → Secrets and variables → Actions](https://github.com/Latina-Dev/latina-dev/settings/secrets/actions))

1. Secret `SLACK_BOT_TOKEN`: the same `xoxb-…` bot token set in Vercel.
2. Variables `SLACK_MEMBER_POSTS_CHANNEL_ID` and `SLACK_CREATOR_FEED_CHANNEL_ID`: each channel's id, from the channel's details in Slack.

Vercel needs nothing new: the app uses `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `AUTH_SECRET` and the LinkedIn settings that profile sign-in already has.
