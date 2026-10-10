# Adding a New Member

> The easiest way to join is [latina.dev/add-member](https://latina.dev/add-member): sign in with LinkedIn and fill in the form, and it opens this pull request for you. See [Member Sign-in](/pages/member-sign-in). The steps below are for adding a profile by hand.

There should be **two changes** in the PR you open, one for the Markdown file and the other for the image.

## Markdown File

### 1. Add a new file to the `data/members` directory with the following format: `firstname-lastname.md`.

### 2. You can use the template below to get started:

```md
---
name: Frances Coronel # first and last name
added: "2023-01-25" # date you were added
level: "Individual Contributor" # see member levels for more info
linkedin: "francescoronel" # your LinkedIn handle
countries: ["Peru"] # your country or countries of origin
---
```

There are various **optional** fields that you can add as well.

```md
---
github: "FrancesCoronel" # your GitHub handle
twitter: "FrancesCoronel" # your Twitter handle
website: "https://francescoronel.com" # your personal website
affiliation: "Senior Software Engineer at XYZ" # your current title and org
location: "San Francisco, CA" # where you are based now
openTo: ["Mentoring", "Speaking"] # see the list below
---

Brief bio about yourself. You can use Markdown here.
```

`openTo` can include any of these values, spelled exactly as shown:

- `Mentoring`: you are happy to mentor other members
- `Being mentored`: you are looking for a mentor
- `Job opportunities`: you are open to new roles
- `Speaking`: you are open to talks, panels and podcasts
- `Hiring`: you are hiring or can refer people to open roles

Leave out any field you don't want to share. Location and open to are shown on your profile page.

## Your profile page

Every member gets a profile page at `https://latina.dev/members/firstname-lastname`, using the same name as your Markdown file. Member cards on the home page and the members page link to it, and it shows your links (LinkedIn, GitHub, X and website), your level, affiliation and countries, and a few other members at the same level.

Profile pages are listed in the [sitemap](https://latina.dev/sitemap.xml) so search engines and AI search tools can find and cite them.

### Opting out of search engines

If you would rather your profile page not appear in search results, add this to your front matter:

```md
noindex: true
```

Your profile stays in the directory on latina.dev, but its page tells search engines not to index it, and it is left out of the sitemap, the [members data feed](/pages/members-feed) and the "more members" suggestions on other profiles. You can also tick "Keep my profile page out of search engines" on the [Add Your Profile](https://latina.dev/add-member) form.

### 3. Check your file

Run `npm run validate:members`. It lists any problem in your file, such as a full LinkedIn URL instead of just the handle, a website missing `https://`, an unknown country or a misspelled field. CI runs the same check on every pull request.

## Image

### 4. Add an image of yourself in the `public/img/members` folder

- the image must be at least 250px by 250px
- the image must have the same width and height
- the image must have the same name as the file you created in step 1, formatted as `firstname-lastname.jpg`
