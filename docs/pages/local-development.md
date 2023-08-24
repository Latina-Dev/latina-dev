# 2. Local Development

## Fork the repo

[Fork](https://github.com/Latina-Dev/latina-dev/fork) this repository and clone it locally.

Connect your local to the original "upstream" repository by adding it as [a remote](https://help.github.com/articles/configuring-a-remote-for-a-fork/).

Pull in changes from "upstream" often so that you stay up to date so that when you submit your pull request, merge conflicts will be less likely.

See more detailed instructions through this GitHub article called ["Syncing a Fork"](https://help.github.com/articles/syncing-a-fork/).

## Installation

> If you've never used [npm](https://docs.npmjs.com/getting-started/what-is-npm#what-is-npm) before, we recommend following [these instructions](https://docs.npmjs.com/getting-started/installing-node#installing-npm-from-the-nodejs-site) to get `npm` up and running properly.

```bash
npm i
```

This will install all the packages needed to run this website locally.

## Live Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

At this point, you are able to preview the website locally and can make changes to the source code.

## Documentation

For documentation, we deploy that to [docs.latina.dev](https://docs.latina.dev).

We run development using Docsify.

```bash
docsify serve docs
```
