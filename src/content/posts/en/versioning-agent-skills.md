---
ref: versioning-agent-skills
lang: en
title: "Versioning agent skills like any other dependency"
description: "Skill versioning treats agent skills as dependencies: semantic versions, changelog, pinning and evals that guard upgrades. What counts as a breaking change."
date: 2026-05-26T09:00:00Z
tags: [skills, change-management, how-to]
---

Skill versioning means giving every agent skill a version number, a changelog and a pinned reference, and testing upgrades before they reach production. A skill changes how an agent behaves as surely as code does, so it deserves the same discipline as a library: semantic versions that tell users what to expect, pins that stop surprise updates, and evals that show whether a new version is better or just different. This post applies semantic versioning to skills, defines what counts as a breaking change in instructions and shows how evals guard upgrades.

## Why skills need versions

Anthropic describes skills in one sentence:

> Skills are folders that include instructions, scripts, and resources that Claude can load when needed.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

A folder of instructions, scripts and resources is a package. Packages get updated, copied between teams and installed from other people. The same announcement stresses that the format is meant to travel:

> Portable: Skills use the same format everywhere.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Portability is a feature, and it creates a dependency problem. If three teams copy a skill and each edits it, nobody knows which behaviour is running where. If a skill is updated in place, an agent that worked yesterday behaves differently today, with no record of what changed. Versions answer both: "which skill, which version, which behaviour".

For the structure of a skill, see [anatomy of an agent skill](/posts/anatomy-of-an-agent-skill/). For the supply-chain risk of skills you did not write, see [third-party skills as a supply chain](/posts/third-party-skills-supply-chain/).

## Apply semantic versioning to skills

Semantic Versioning has a short core rule for the major number:

> MAJOR version when you make incompatible API changes
>
> — [Semantic Versioning 2.0.0](https://semver.org/)

The full scheme is `MAJOR.MINOR.PATCH`: major for incompatible changes, minor for backwards-compatible additions, patch for backwards-compatible fixes. A skill has an interface even though it is written in prose. That interface is what callers and the agents around it rely on: what inputs it expects, what it outputs, which tools it may use and how it behaves in the cases it covers.

![Semantic versioning applied to an agent skill](/images/blog/versioning-agent-skills-1.svg)

## What counts as a breaking change in instructions

Prose is fuzzy, so write down your rules. A workable set:

**Major (breaking):**

- A new required input, or a removed or renamed input.
- A changed output format that downstream agents or code parse.
- A new or removed tool requirement, or a change in the permissions the skill needs.
- A changed default behaviour on a covered case, for example "ask before deleting" becoming "delete".
- A change in scope: the skill now handles different situations than before.

**Minor (compatible addition):**

- A new optional step, example or reference file.
- Support for an additional case that did not exist before.
- A new optional input with a safe default.

**Patch (compatible fix):**

- Typos, clearer wording, better examples that do not change the behaviour you tested.
- Fixing a script bug where the documented behaviour was already the intent.

When in doubt, treat it as the larger bump. A reworded paragraph can change behaviour, and only evals can tell you whether it did.

## Put the version where it can be read

Keep metadata in the skill's front matter or manifest, and keep a changelog next to it:

```yaml
---
name: ticket-triage
version: 1.1.0
description: Label and route incoming support tickets.
requires-tools: [tickets.read, crm.read]
---
```

```markdown
## 1.1.0 - 2026-05-12
### Added
- Optional step: check the runbook for known incidents.

## 1.0.1 - 2026-04-20
### Fixed
- Clarified the escalation rule for payment-related tickets.
```

Tag releases in version control and publish them as immutable. A version number that can be silently rewritten is worth nothing.

## Pin what you depend on

Agents and workflows should reference a skill by exact version or a content hash, not by "latest":

```yaml
skills:
  - name: ticket-triage
    version: 1.1.0
    sha256: "<digest of the skill folder>"
```

Pinning gives you three things. Reproducibility: you can re-run an old task with the old skill. Review: an upgrade is a visible change in a pull request. Safety: a compromised or careless upstream update does not reach production on its own. Use ranges, such as "any 1.x", only in development.

## Let evals guard the upgrade

Version numbers are a promise; evals check whether it was kept. Before moving from 1.1.0 to a new version, run the same eval suite against both and compare. Anthropic's guide to agent evals gives the vocabulary: a grader scores part of the agent's performance, and the best graders check the outcome in the environment.

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

An upgrade policy that works in practice:

1. **Patch.** Run the smoke suite. If results are equal within noise, upgrade.
2. **Minor.** Run the full suite and check that old cases did not regress. Review the diff.
3. **Major.** Treat it as a migration. Update callers, re-baseline the evals, roll out to a small share of runs first and keep the old version available for rollback.

If the evals disagree with the version number, the evals win: a "patch" that fails the suite is a major change, and you should release it as one. The wider process around approvals, rollouts and rollback is in [change management for agents](/posts/change-management-for-agents/).

## Limits

Semantic versioning was designed for code with machine-checkable interfaces. Skills are interpreted by a model, so compatibility is statistical: a minor release can change behaviour on rare inputs. The model underneath also changes, which can alter how an unchanged skill behaves, so record the model version alongside the skill version in run metadata. Treat the version number as a communication tool backed by tests, not as a guarantee.

## Key takeaways

- A skill is a package of instructions, scripts and resources; version it like a dependency.
- Use MAJOR.MINOR.PATCH, and define in writing what is breaking for instructions: inputs, outputs, tools, defaults and scope.
- Keep a changelog and publish immutable releases.
- Pin exact versions or hashes in agents and workflows; use ranges only in development.
- Run evals on old and new versions before upgrading, and let the results overrule the version label.

## Sources

- Semantic Versioning: [Semantic Versioning 2.0.0](https://semver.org/)
- Anthropic: [Introducing Agent Skills](https://www.anthropic.com/news/skills)
- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
