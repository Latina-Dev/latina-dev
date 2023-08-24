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
---

Brief bio about yourself. You can use Markdown here.
```

## Image

### 3. Add an image of yourself in the `public/img/members` folder

- the image must be at least 250px by 250px
- the image must have the same width and height
- the image must have the same name as the file you created in step 1, formatted as `firstname-lastname.jpg`
