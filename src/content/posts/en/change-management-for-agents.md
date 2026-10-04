---
ref: change-management-for-agents
lang: en
title: "Ops series: change management and prompt versioning for agents"
description: Prompt versioning and change management for AI agents: apply semantic versioning, review and rollback to prompts, skills and policies like code.
date: 2026-04-23T09:00:00Z
tags: [operations, change-management, governance]
---

**Prompt versioning** is the first step of change management for AI agents. A changed prompt, skill or
policy changes production behaviour exactly like a code change does, so it needs a version number, a
review and a rollback path. This post, part of the operations series that begins with [agent ops is just
ops](/posts/agent-ops-is-just-ops/), applies semantic versioning and secure development practice to the
artefacts that steer agents.

## What counts as a change

Teams track code changes carefully and treat "just a prompt tweak" casually. Anything that alters what
an agent does belongs under change control:

- **Prompts and instructions**: system prompts, role descriptions, output formats.
- **Skills**: the instruction folders and scripts an agent loads on demand; see [anatomy of an agent
  skill](/posts/anatomy-of-an-agent-skill/).
- **Tool definitions**: names, descriptions and argument schemas.
- **Policies**: which tools, arguments, identities and budgets are allowed; see [policy decides, audit
  proves](/posts/policy-decides-audit-proves/).
- **Model and parameter choices**: model version, temperature, token limits.

A one-word edit in a tool description can change which tool the model picks. Treat it as a release.

## Version with SemVer, adapted

Semantic Versioning was written for APIs, and agent artefacts are interfaces too: callers (people,
pipelines, other agents) depend on their behaviour. The core rule of SemVer translates well:

> MAJOR version when you make incompatible API changes
>
> [Semantic Versioning 2.0.0](https://semver.org/) (semver.org)

One workable mapping for agent artefacts:

| Bump | When | Example |
| --- | --- | --- |
| MAJOR | Output format, tool names or required inputs change in a way callers must adapt to | Renaming a field in the structured result |
| MINOR | New capability that existing callers can ignore | A new optional tool or a new section in a skill |
| PATCH | Wording fixes that must not change behaviour | Typo fixes, clearer examples |

Be honest about the limit: for natural-language instructions the line between PATCH and MINOR is fuzzy,
because even a wording change can shift behaviour. That is exactly why the eval suite, not the version
number, is the real safety net. The number tells consumers what to expect; the evals tell you whether it
is true.

## A change pipeline

![Change pipeline for agent prompts, skills and policies](/images/blog/change-management-for-agents-1.svg)

1. **Edit in a branch.** Prompts, skills and policies live in the repository, not in a web form.
2. **Open a pull request.** A reviewer reads the diff and the stated intent. For policy changes, a
   person with authority over the affected systems approves.
3. **Run the eval suite.** The change must not regress existing tasks. Add or adjust tasks when the
   intended behaviour changes. See the vocabulary in [agent evals 101](/posts/agent-evals-101/).
4. **Cut a versioned release.** Tag it, update the changelog and record which model it was tested
   against.
5. **Keep a rollback tag.** The previous release stays deployable. Rolling back means redeploying
   a tag, not editing text under pressure.

## Secure development applies to agent artefacts

NIST's Secure Software Development Framework describes the idea behind such a pipeline:

> a core set of high-level secure software development practices that can be integrated into each SDLC implementation.
>
> [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) (NIST, 2022)

Read it as a prompt to reuse what your organisation already does for software: code review, protected
branches, signed or pinned dependencies, provenance, vulnerability handling. Prompts and skills that
come from third parties are dependencies and deserve the same scrutiny as libraries. Changes to a policy
file deserve more, because a loosened policy widens what every agent may do.

A review checklist that fits on one screen:

```text
[ ] What behaviour is meant to change? Is it written in the PR?
[ ] Which tools, data and identities does the change touch?
[ ] Does the change widen any permission? (Needs an extra approver.)
[ ] Did the eval suite run, and were tasks added for the new behaviour?
[ ] Is the version bumped and the changelog updated?
[ ] Is the rollback target named and still deployable?
```

## Why quality can drift without any change of yours

Change management also covers changes you did not make. Model providers update models and
infrastructure. Anthropic's public postmortem of an incident period begins:

> Between August and early September, three infrastructure bugs intermittently degraded Claude's response quality.
>
> [A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues) (Anthropic, 2025)

The lesson is not about one provider. Any component you depend on can shift behaviour under you. Pin
model versions where the provider allows it, record the model identifier with every run, re-run your
evals on a schedule and not only on your own changes, and alert when scores move. A drop with no
change in your repository points outside your repository.

## Rollout and rollback in practice

- **Canary**: route a small share of runs, or a single low-risk workflow, to the new version first.
- **Feature flags for behaviour**: switch a new skill on per agent rather than for everyone.
- **Record the version in the audit trail**: every run should say which prompt, skill, policy and model
  versions were active, so an incident can be matched to a release.
- **Define rollback triggers up front**: for example, eval pass rate below a threshold or an alert on
  denied-call rate.
- **Practise the rollback.** A rollback that has never been run is a hope, not a plan.

## Limits

Versioning does not make behaviour deterministic, and evals cover only the tasks you wrote. A small
suite gives false comfort. Keep it growing from real incidents, and keep humans in the loop for
high-impact changes.

## Key takeaways

- Prompts, skills, tool definitions and policies are production artefacts and need change control.
- Use SemVer-style versions to tell consumers what to expect; use evals to check whether it is true.
- Pull request, review, eval suite, versioned release and a named rollback tag form the minimum pipeline.
- Treat third-party prompts and skills as dependencies; treat policy loosening as the riskiest change.
- Record versions in the audit trail and re-run evals on a schedule, because behaviour can drift without your change.

## Sources

- [Semantic Versioning 2.0.0](https://semver.org/), semver.org.
- [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), NIST, 2022-02-03.
- [A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues), Anthropic, 2025-09-17.
