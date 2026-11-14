# Community Questions

Members ask career questions in the **#ask** channel of the Latina Dev Slack and answer each other in threads. Every hour, a GitHub Action copies each answered thread to [latina.dev/questions](https://latina.dev/questions), so the answers help Latina engineers who aren't in the Slack yet, and the search engines and AI assistants they use.

## How it works

1. A member posts a question in #ask. Other members answer in its thread.
2. Once someone other than the asker has answered, the next hourly run of [`.github/workflows/questions.yml`](https://github.com/Latina-Dev/latina-dev/blob/main/.github/workflows/questions.yml) writes the thread to `data/questions/<slug>.md`.
3. The run opens (or updates) one pull request from the `automation/questions` branch, which merges itself once checks pass. There's no approval step: moderation happens in Slack.
4. Each question gets a page with [QAPage structured data](https://developers.google.com/search/docs/appearance/structured-data/qapage). Questions are also in `/sitemap.xml`, `llms.txt`, [`/questions.json`](https://latina.dev/questions.json), [`/questions.md`](https://latina.dev/questions.md) and the MCP server's `search_questions` tool.

Answers are credited with the name on the member's Slack account. When that full name matches exactly one directory profile, it links to the profile.

## Moderation

Slack is the source of truth. On the next run:

- A question or answer **deleted** in Slack is removed from the site.
- An **edit** in Slack updates the site.
- A **🚫 (`:no_entry_sign:`) reaction** from an organizer listed in `SLACK_MODERATOR_IDS`, or from whoever wrote the message, hides it from the site without deleting it in Slack. 🚫 on a question hides the whole thread.

Each run reads the last 60 days of the channel. Slack's free plan hides messages after 90 days, so older questions are never removed just because Slack stopped showing them. To take down an older question, delete its file in `data/questions`. If a run would remove more than 10 questions at once, it stops instead, since that usually means the channel or token is wrong.

Pin a note in #ask so members know: _Questions and answers here are published on latina.dev/questions once someone answers. React with 🚫 to your own message, or delete it, to take it off the site._

## Setup

1. Create a public channel called `#ask` and add the note above to its description.
2. In the Latina Dev Slack app (the one that posts profile reviews), go to **OAuth & Permissions** and add the `channels:history` and `users:read` bot scopes. Reinstall the app, then invite it to #ask (`/invite @Latina Dev`).
3. In the repository's **Settings → Secrets and variables → Actions**:
   - Secret `SLACK_QUESTIONS_TOKEN`: the app's bot token (`xoxb-…`).
   - Variable `SLACK_QUESTIONS_CHANNEL_ID`: the #ask channel id (in Slack, open the channel details; the id is at the bottom). Runs are skipped until this is set.
   - Variable `SLACK_MODERATOR_IDS` (optional): comma-separated Slack member ids of organizers whose 🚫 hides a message.
   - Secret `QUESTIONS_SYNC_TOKEN` (optional if `MEMBER_LINKS_TOKEN` is already set): a fine-grained GitHub token with contents and pull request write access to this repo. Pull requests opened with the default token don't start the required checks, so they would never merge.
4. Run **Community questions** once from the Actions tab to check it works.

To run the sync locally, set the same values and run `npm run questions:sync`.

## File format

Each file in `data/questions` is one thread, named after its question. The sync writes these files; don't edit them by hand except to remove one, because the next run overwrites them from Slack.

```yaml
---
title: How did you negotiate your first senior offer?
asked: 2026-11-12T15:00:00Z
slackTs: "1762959600.000100"
author: Ana Pérez
authorSlug: ana-perez # only when the Slack name matches one directory profile
answers:
  - ts: "1762960000.000200"
    date: 2026-11-12T15:06:40Z
    author: Luz Ortiz
    text: Ask what the range is before you give a number.
---
I have an offer from a startup and want to ask for more.
```
