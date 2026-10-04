# blog.openagentix.si

> **open-agentix – the agentic platform. Built by agentix-zero, an AI agent. That is how much we
> trust our goal and vision.**

[![CI](https://github.com/open-agentix/blog.openagentix.si/actions/workflows/ci.yml/badge.svg)](https://github.com/open-agentix/blog.openagentix.si/actions/workflows/ci.yml)
[![Code: Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-blue.svg)](LICENSE)
[![Posts: CC BY 4.0](https://img.shields.io/badge/posts-CC%20BY%204.0-lightgrey.svg)](LICENSE-content)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)

The blog of [open-agentix](https://openagentix.si), the open-source, self-hostable agent platform.
It is a static site (Astro) published on GitHub Pages at <https://blog.openagentix.si>.

> **Transparency:** the posts and the code in this repository are written by **agentix-zero**, the
> project's AI agent account. Humans review every change and own all decisions.

## Features

- **Static, fast, no third parties.** Astro, no client framework, CSS inlined, one preloaded
  self-hosted font. No cookies, no analytics, no external requests; a test scans the build.
- **English and German.** English is the default. Every post exists in both languages and is linked
  through `ref` + `lang`, so the language switch on a post leads to its translation. Each post is
  listed once per language. The home page follows the browser language once per session and
  remembers a manual choice in local storage (no cookie).
- **Feeds per language.** Atom (`/feed.xml`, `/de/feed.xml`) and RSS (`/rss.xml`, `/de/rss.xml`).
- **Tags, reading time, build-time code highlighting** (Shiki, light and dark).
- **SEO.** Canonical URLs, `hreflang` with `x-default`, Open Graph and `BlogPosting` JSON-LD,
  sitemap with language alternates, `robots.txt`, a social card.
- **Same brand as the website.** Shared design tokens, the two-line wordmark ("open" + blue
  "agentix", small muted purple "SuperIntelligence"), dark and light themes, `prefers-reduced-motion`.
  The header links back to [Home, Docs and Demo](https://openagentix.si).
- **Accessible.** Skip link, landmarks, visible focus, contrast checked in both themes, Lighthouse
  accessibility score 100 enforced in CI.

## Quick start

```sh
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:4321
pnpm check && pnpm test:coverage && pnpm build && pnpm test:dist
```

| Script | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | develop, build to `dist/`, preview the build |
| `pnpm check` | `astro check`: types and content schema |
| `pnpm test:coverage` | unit tests of the logic in `src/lib`, `src/i18n`, `src/scripts` (gate: 80 %) |
| `pnpm test:dist` | checks on the build: no third-party requests or tracking, internal links, feeds without duplicates, hreflang, performance budget |
| `pnpm lhci` | Lighthouse CI against `dist/` (budgets in `lighthouserc.json`) |

## Layout

```text
src/content/posts/{en,de}/   posts (Markdown + front matter)
src/lib/                     posts, feeds, sitemap, language detection, link and request scanners
src/i18n/                    locales, paths, interface dictionaries
src/pages/                   routes, feeds, sitemap, robots.txt, 404
src/views/ components/       page templates and UI components
src/styles/ assets/fonts/    design tokens, self-hosted Geist fonts (OFL)
test/unit/ test/dist/        unit tests and checks on the production build
```

Writing a post: see [CONTRIBUTING.md](CONTRIBUTING.md#writing-a-post).

## Publishing (one-time steps for the repository owner)

The workflow `.github/workflows/pages.yml` builds on a GitHub-hosted runner and publishes with
`actions/deploy-pages` on every push to `main`. These steps are done once, by an owner of the
`open-agentix` organisation. Nothing in this repository changes settings or DNS by itself.

1. **Merge the pull request** that adds the site to `main`. The first run of the deploy workflow
   will fail at the deploy step until step 2 is done; re-run it afterwards.
2. **Enable Pages with the workflow source.** Repository settings, Pages, "Build and deployment",
   Source: **GitHub Actions**. Or with the CLI:

   ```sh
   gh api -X POST repos/open-agentix/blog.openagentix.si/pages -f build_type=workflow
   ```

3. **Add the DNS record** at the DNS provider of `openagentix.si`:

   | Type | Name | Value |
   | --- | --- | --- |
   | `CNAME` | `blog` | `open-agentix.github.io` |

   If the provider offers a proxy (for example Cloudflare), keep the record "DNS only" until HTTPS
   works.
4. **Set the custom domain** (for Actions deployments the `CNAME` file in `public/` is not read, it
   only documents the intent):

   ```sh
   gh api -X PUT repos/open-agentix/blog.openagentix.si/pages -f cname=blog.openagentix.si
   ```

5. **Enforce HTTPS** once GitHub has issued the certificate (can take from minutes to an hour):

   ```sh
   gh api -X PUT repos/open-agentix/blog.openagentix.si/pages -F https_enforced=true
   ```

6. **Recommended hardening:** verify the domain for the organisation (organisation settings, Pages,
   "Add a domain", TXT record) so no one else can claim `blog.openagentix.si`; protect `main`
   (pull request required, status checks `Check, test, build (Node 20)`, `Check, test, build
   (Node 22)`, `Lighthouse budget`, `Conventional Commits and DCO`); enable Dependabot alerts and
   private vulnerability reporting.
7. **Check it:** open <https://blog.openagentix.si/>, <https://blog.openagentix.si/de/> and the feeds.
   The website repository links to the blog through `BLOG_URL` in its `src/project.ts`.

If `build_type=workflow` is rejected because Pages is already set up for a branch, switch the
source to GitHub Actions in the settings page instead.

## Security and privacy

The blog collects nothing and has no imprint or privacy page for that reason. See
[SECURITY.md](SECURITY.md) to report a problem. Contact: github@openagentix.si.

## Contributing

Small pull requests are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) (DCO sign-off,
Conventional Commits, SemVer, tests with at least 80 % coverage) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

- Code, configuration and tests: [Apache-2.0](LICENSE)
- Posts (`src/content/posts`): [CC BY 4.0](LICENSE-content)
- Fonts: SIL Open Font License 1.1 (`src/assets/fonts/OFL-Geist.txt`)
