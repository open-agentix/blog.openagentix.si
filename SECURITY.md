# Security Policy

## Reporting a vulnerability

**Please do not open public issues for security problems.**

Report privately through
[GitHub Security Advisories](https://github.com/open-agentix/blog.openagentix.si/security/advisories/new)
("Report a vulnerability") or write to github@openagentix.si. Include the affected page or file, a
description, steps to reproduce and the impact you expect. We acknowledge reports within 3 working
days and coordinate disclosure with you.

Vulnerabilities in the platform itself belong to the
[platform repository](https://github.com/open-agentix/open-agentix/security/advisories/new).

## Scope

This repository builds a static blog. Interesting findings include:

- any request from the built site to a third-party host (the blog must not make any),
- cookies, analytics or other tracking (the blog must not use any),
- cross-site scripting through post content or translation files,
- supply-chain issues in the build (dependencies, GitHub Actions),
- personal data in posts, feeds or metadata (the blog publishes none).

## Hardening in place

- No third-party requests: fonts and scripts are self-hosted; a test scans every built file.
- No cookies and no analytics; the language and theme choices live in the browser's local storage
  and never leave it.
- Dependencies are pinned to exact versions with a committed lockfile; install scripts of
  dependencies are disabled (`pnpm-workspace.yaml`).
- GitHub Actions are pinned by commit SHA and run with read-only permissions; only the deploy job
  holds the Pages and OIDC token permissions.
- Dependabot watches npm packages and Actions.
