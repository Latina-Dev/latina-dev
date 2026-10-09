# 3. Opening a Pull Request

## A Good PR

Our [PR template](https://github.com/Latina-Dev/latina-dev/blob/main/.github/PULL_REQUEST_TEMPLATE.md) is filled in for you when you open a PR. A good PR description:

- says what changed in plain language, with a **Before** and **After**
- links the issue it closes (for example, **"Fixes #92"**)
- gives a reviewer steps to verify the change, plus screenshots or output as evidence
- only checks the boxes that are actually true

> Below is an example of what the Markdown for a good PR looks like.

```markdown
## What changed

**Before:** There was no way to contact the Latina Dev team from the website.

**After:** The homepage has a contact form that emails the team.

## Why

Fixes #92

## How to verify

1. Run `npm run dev` and open http://localhost:3000
2. Scroll to the contact form, fill it in and submit it
3. You should see a "Thanks, we'll be in touch" message

**Evidence:** screenshot of the form before and after submitting

## Checklist

- [x] I read the contributing guidelines
- [x] `npm run lint` and `npm run build` pass locally
- [x] Visual changes include before and after screenshots
- [ ] Adding a member? The Markdown file is in `data/members/` and the square photo (at least 250px) is in `public/img/members/` with the same name
```

## Checks

We use several GitHub integrations/bots to make it easy to catch errors for every new PR created. CodeRabbit and Claude both review each PR and leave comments, so read through them before asking for a human review.

> Here's an example of how that would look like for a great PR.

![GitHub Checks](https://i.imgur.com/DSAINaL.png)

## Your PR not reviewed yet?

If after a week you haven't heard from any of the maintainers, please mention `@Latina-Dev/owners` in the PR.
