# Contributing to blog.openagentix.si

Thanks for helping! This repository holds the openagentix blog. Project-wide rules are summarised in
the [documentation](https://openagentix.si/docs/); this file covers what is specific to the blog.

## Ground rules

- **Small, reviewable changes.** One concern per commit and per pull request.
- **Tests come with the code** in the same commit. Coverage of `src/i18n`, `src/lib` and
  `src/scripts` must stay at or above **80 %** (lines, branches, functions, statements).
- **No third-party requests, no cookies, no analytics.** Never add CDN links, remote fonts, embeds,
  tracking pixels or anything else that makes a visitor's browser contact another host.
  `pnpm test:dist` fails if you do.
- **No personal data.** Posts, metadata and feeds never contain real names of private persons,
  addresses or private e-mail addresses. The maintainer is "the project lead"; the contact is
  info@openagentix.si (questions: GitHub Discussions). The blog has no imprint or privacy page because it collects nothing.
- **English** for code, comments, commit messages and pull requests.
- **Interface text** lives in `src/i18n/ui.ts`. English is the source; German must cover every key
  (a test checks this).
- **Accessibility and speed are features.** Keep contrast, focus states, keyboard access and
  `prefers-reduced-motion` working, and stay within the budgets in `lighthouserc.json` and
  `test/dist/budget.test.ts`.

## Writing a post

Posts are Markdown files with YAML front matter, one file per language:

```text
src/content/posts/en/<slug>.md
src/content/posts/de/<slug>.md
```

```yaml
---
ref: least-privilege-for-agents   # same value in every translation of the post
lang: en                          # must match the folder
title: "Title of the post"
description: One or two sentences for search results and link previews (40 to 220 characters).
date: 2026-10-04T10:00:00Z
updated: 2026-10-10T08:00:00Z     # optional
tags: [security, architecture]    # use the same tags in every translation
author: agentix-zero              # optional, default agentix-zero
---
```

- **Every post exists in English and German.** The build fails if a `ref` is missing a language.
  Translations may use different slugs; they are linked through `ref`.
- Each post appears once per language in lists and feeds.
- Posts must be **accurate to what the platform implements**. Mark planned features as planned and
  link the roadmap instead of describing them as finished. Prefer an honest limit over a claim.
- Use fenced code blocks with a language (`yaml`, `ts`, `bash`, `text`). They are highlighted at
  build time; no script runs in the browser.
- Posts are licensed under CC BY 4.0 (see `LICENSE-content`).

## Developer Certificate of Origin (DCO)

Every commit must be signed off, certifying the [Developer Certificate of Origin](https://developercertificate.org/):

```sh
git commit -s -m "docs(posts): fix the audit chain description"
```

Pull requests with unsigned commits cannot be merged.

## Conventional Commits 1.0.0

Format: `<type>(<scope>)<!>: <description>`, imperative, English, at most 100 characters.

| Type | Use for | Release |
| --- | --- | --- |
| `feat` | new pages, post types, features | minor |
| `fix` | bugs, wrong facts, broken links | patch |
| `docs` | posts and documentation | none |
| `perf`, `refactor`, `style`, `test`, `build`, `ci`, `chore` | as named | none |

Breaking changes (for example changed URLs) use `!` or a `BREAKING CHANGE:` footer.

## Semantic Versioning 2.0.0

The blog is versioned with [SemVer](https://semver.org) in `package.json`; the version is shown in
the footer. Releases update the changelog ([Keep a Changelog](https://keepachangelog.com/)) and are
tagged `vX.Y.Z`.

## Local setup

Requirements: Node.js 22 LTS (20.19+ works) and pnpm (version pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:4321
pnpm check               # astro check (types, content)
pnpm test:coverage       # unit tests with coverage gate
pnpm build               # static site in dist/
pnpm test:dist           # third-party requests, tracking, links, feeds, hreflang, budget on dist/
pnpm lhci                # Lighthouse CI against dist/ (needs Chrome or Chromium; set CHROME_PATH)
```

The social card `public/og.png` is rendered from `scripts/og-card.html`:

```sh
chromium --headless=new --allow-file-access-from-files --hide-scrollbars --window-size=1200,630 \
  --screenshot=public/og.png file://$PWD/scripts/og-card.html
```

## Adding dependencies

Avoid them where you can. If you must: exact version, a reason in the pull request, nothing that
downloads code, browsers or instructions at install or run time. Install scripts are disabled by
default (`allowBuilds` in `pnpm-workspace.yaml`). Pin GitHub Actions by commit SHA.
