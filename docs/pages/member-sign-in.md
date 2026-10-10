# Member Sign-in

Members sign in at [latina.dev/profile](https://latina.dev/profile) with LinkedIn, the only sign-in method, to add a profile, claim an existing one, or edit their own. An organizer approves every submission in Slack before it goes live.

## How it works

1. A member signs in with LinkedIn. The session is an encrypted cookie; there is no database.
2. They either fill in the profile form (new members), pick their name from the list of existing profiles (claiming), or edit the profile they own.
3. The site commits the change to a branch named `profile/<id>` and opens a pull request, so CI validates the profile and Vercel builds a preview. Each member has one branch, so sending another change replaces the pending one.
4. A message with **Approve** and **Reject** buttons is posted to the review channel in Slack. It shows the LinkedIn name and email the member signed in with, their LinkedIn handle, and links to the pull request.
5. **Approve** merges the pull request, or sets it to merge as soon as required checks pass. **Reject** closes it and deletes the branch.

Ownership lives in [`data/owners`](https://github.com/Latina-Dev/latina-dev/tree/main/data/owners): one file per profile, named by its slug and holding a hash of the owner's LinkedIn account id. Because the file is named by profile, two pending claims on the same profile conflict and only one can merge. A new profile adds its owner file in the same pull request; a claim adds only the owner file. Delete a file to unlink an account.

New profiles use the member's LinkedIn photo as `public/img/members/<slug>.jpg`. When editing, members can tick a box to refresh it from LinkedIn.

## Setup

These are set as environment variables in Vercel (Production, plus Preview if you want to test on previews).

### LinkedIn

1. Create an app at [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps), linked to the Latina Dev company page.
2. Under **Products**, add **Sign In with LinkedIn using OpenID Connect**.
3. Under **Auth**, add the redirect URL `https://latina.dev/api/auth/callback/linkedin`.
4. Set `AUTH_LINKEDIN_ID` and `AUTH_LINKEDIN_SECRET` to the app's client id and secret.
5. Set `AUTH_SECRET` to a random value, e.g. from `openssl rand -base64 33`.

### GitHub

Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) for `Latina-Dev/latina-dev` only, with **Contents** and **Pull requests** set to read and write. Set it as `PROFILE_BOT_GITHUB_TOKEN`.

So that **Approve** can queue a pull request whose checks are still running, turn on **Allow auto-merge** in the repository's general settings.

### Slack

1. Create an app at [api.slack.com/apps](https://api.slack.com/apps) in the Latina Dev workspace.
2. Under **OAuth & Permissions**, add the `chat:write` bot scope, install the app, and set `SLACK_BOT_TOKEN` to the bot token (`xoxb-…`).
3. Under **Basic Information**, set `SLACK_SIGNING_SECRET` to the signing secret.
4. Under **Interactivity & Shortcuts**, turn interactivity on with the request URL `https://latina.dev/api/slack/interactions`.
5. Invite the app to a private review channel and set `SLACK_REVIEW_CHANNEL_ID` to that channel's id.
6. Optional: set `SLACK_APPROVER_IDS` to a comma-separated list of Slack member ids allowed to press the buttons. Without it, anyone in the channel can.

Until these are set, the sign-in page shows but signing in fails, and nothing else on the site is affected.
