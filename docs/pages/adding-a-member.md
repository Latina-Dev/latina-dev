# Adding a New Member

There should be **two changes** in the PR you open, one for the Markdown file and the other for the image.

## Markdown File

### 1. Add a new file to the `data/members` directory with the following format: `firstname-lastname.md`.

### 2. You can use the template below to get started:

```md
---
name: Frances Coronel // first and last name
added: "2023-01-25" // date you were added
level: "Individual Contributor" // see member levels for more info
linkedin: "francescoronel" // your LinkedIn handle
countries: ["Peru"] // your country or countries of origin
---
```

There are various **optional** fields that you can add as well.

```md
---
github: "FrancesCoronel" // your GitHub handle
twitter: "FrancesCoronel" // your Twitter handle
website: "https://francescoronel.com" // your personal website
affiliation: "Senior Software Engineer at XYZ" // your current title and org
skills: ["React", "TypeScript", "Accessibility"] // up to 10 skills or technologies
location: "San Francisco, CA" // where you are based now
openTo: ["Mentoring", "Speaking"] // see the list below
---

Brief bio about yourself. You can use Markdown here.
```

`openTo` can include any of these values, spelled exactly as shown:

- `Mentoring`: you are happy to mentor other members
- `Being mentored`: you are looking for a mentor
- `Job opportunities`: you are open to new roles
- `Speaking`: you are open to talks, panels and podcasts
- `Hiring`: you are hiring or can refer people to open roles

Leave out any field you don't want to share. Skills, location and open to are shown on your profile page.

### 3. Check your file

Run `npm run validate:members`. It lists any problem in your file, such as a full LinkedIn URL instead of just the handle, a website missing `https://`, an unknown country or a misspelled field. CI runs the same check on every pull request.

## Image

### 4. Add an image of yourself in the `public/img/members` folder

- the image must be at least 250px by 250px
- the image must have the same width and height
- the image must have the same name as the file you created in step 1, formatted as `firstname-lastname.jpg`
