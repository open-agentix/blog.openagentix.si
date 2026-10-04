---
ref: deploying-agent-changes-safely
lang: en
title: "Ops series: how to deploy AI agents with canaries and rollbacks"
description: "Deploy AI agents like any service: send a new model, prompt or skill to a small share of runs first, let evals and SLOs decide and keep a rollback ready."
date: 2026-08-27T09:00:00Z
tags: [operations, deployments, how-to]
---

To deploy AI agents safely, treat every change to a model version, prompt, skill or tool as a release: send it to a small share of runs first (a canary), compare evals and service level objectives against the stable version, then promote or roll back. The practice comes from ordinary service operations and transfers well, with one twist: agent quality can degrade without a single error in the logs, so your canary must watch quality signals, not just uptime. This post, part of our operations series, adapts canary releases and rollback discipline to agent artefacts.

## Why agent changes need release discipline

An agent is more than code. Its behaviour depends on several artefacts that change independently:

- the **model** and its version (yours to pin, or the provider's to change),
- the **system prompt** and instruction files,
- **skills** and their scripts,
- **tool definitions** and the services behind them,
- **policies** and budgets.

Changing any of them can change outcomes in ways unit tests do not catch. Providers also ship bugs. Anthropic's postmortem for the late summer of 2025 is a useful reminder:

> Between August and early September, three infrastructure bugs intermittently degraded Claude's response quality.

Source: [A postmortem of three recent issues, Anthropic](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues). The word to notice is *degraded*: quality dropped without the service being down. If your only signal is "requests succeed", you will not see it. If your release process includes quality checks on a small slice of traffic, you have a chance of noticing early.

## What to version and pin

Before you can roll back, you must know what you are rolling back to. Pin and record, per run:

- the exact model identifier (not an alias that moves),
- the prompt or instruction file hash,
- skill and tool versions (see [versioning agent skills](/posts/versioning-agent-skills/)),
- the policy version.

Put these in one **release manifest** that a deploy references:

```yaml
release: support-triage@2026.08.27-1
model: model-x-2026-05-01        # pinned identifier, not "latest"
prompt: prompts/triage.md@3f9a1c2
skills:
  - runbook-lookup@1.4.2
tools:
  - tickets@2.1.0
policy: policies/support@7
rollout:
  canary_percent: 5
  min_runs: 200
  hold: 24h
```

If your provider can change a model behind an alias, pin dated identifiers where they exist and test again when you move.

## The canary flow

![Canary rollout for a new agent version](/images/blog/deploying-agent-changes-safely-1.svg)

1. **Deploy alongside.** The new version runs next to the stable one. Nothing is replaced.
2. **Route a small share.** Start with about 5 percent of runs, chosen by a stable key (for example a hash of the run or tenant id), so one tenant does not flip between versions mid-process. Exclude workloads where a wrong result is costly, or restrict the canary to read-only or reviewed workflows first.
3. **Wait for enough data.** Agent runs are slow and variable. Define a minimum number of runs and a minimum time, such as 200 runs and 24 hours, before judging.
4. **Compare against the stable version.** Evaluate the same signals on both arms (below).
5. **Decide.** Promote in steps (5, 25, 100 percent) or roll back. Record the decision and the numbers.

## What to compare

Use your [service level objectives](/posts/slos-for-agents/) as the primary gate. Google's SRE book defines the term:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.

Source: [Site Reliability Engineering, Chapter 4: Service Level Objectives, Google](https://sre.google/sre-book/service-level-objectives/). For agents, useful indicators (SLIs) include:

- **task success rate**, measured by an automated check or a sampled human review,
- **policy denials and tool errors** per run,
- **cost per run** and tokens per run,
- **latency** to completion,
- **escalation rate** to a human,
- **eval suite score** on a fixed set of scenarios, run against both versions before the canary starts and again on real canary traffic where outcomes can be judged.

Set the rollback rule in advance, in numbers: "roll back if success rate drops by more than 3 points, cost per run rises by more than 25 percent, or any security eval fails". Rules written after seeing the data tend to excuse it. With few runs, differences are noisy; widen the window rather than reading tea leaves, and say in the report how small the sample was.

## Rollback discipline

A rollback is only fast if it was prepared:

- **One switch.** Moving traffic back to the stable manifest should be a configuration change, not a rebuild.
- **Keep the previous version deployable** for a defined period after promotion.
- **Mind state.** If the new version wrote data (memory files, tickets, records) in a new format, a rollback must be able to read it, or the migration must be reversible. Use expand-and-contract changes for schemas.
- **Drain in-flight runs.** Let running sessions finish on their version or restart them cleanly; do not switch versions mid-run unless the handover is designed for it.
- **Practise it.** Roll back in a test environment regularly so the first real attempt is not the first attempt.

Pair rollback with an incident note: what changed, what signal fired, how long until traffic was safe. Over time, these notes tell you which signals to add.

## Changes beyond the model

Prompt and skill edits are releases too, and are often riskier because they feel small. A one-line change to an instruction can shift behaviour across all workflows. Route them through the same flow, with eval runs in CI and a canary in production. Your [change management for agents](/posts/change-management-for-agents/) process should say who approves each class of change, and the canary should be the last step before full rollout, not a substitute for review.

NIST's Secure Software Development Framework describes the practices this builds on:

> a core set of high-level secure software development practices that can be integrated into each SDLC implementation.

Source: [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1, NIST](https://csrc.nist.gov/pubs/sp/800/218/final). Its practices (reviewing changes, testing before release, preparing to respond to vulnerabilities) apply to the artefacts of an agent as much as to application code.

## Limits

- A canary of a few percent can miss rare failures. Combine it with offline evals that cover known edge cases.
- Quality metrics based on a model judging a model can drift together; calibrate them against human samples.
- Some changes cannot be split by traffic, for example a policy that applies to a whole tenant. Use per-tenant or per-environment stages instead.
- Provider-side changes happen outside your release process. Keep continuous quality checks running in production, not only at deploy time.

## Key takeaways

- Treat model, prompt, skill, tool and policy changes as releases with a manifest and pinned versions.
- Send about 5 percent of runs to the new version first and wait for enough runs before judging.
- Decide with SLOs and evals, with rollback thresholds written down beforehand.
- Prepare rollback: one switch, previous version kept, state formats compatible, practised regularly.
- Keep watching quality after full rollout; degradation can arrive without any deploy of yours.

## Sources

- [A postmortem of three recent issues (Anthropic, 2025-09-17)](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues)
- [Site Reliability Engineering, Chapter 4: Service Level Objectives (Google)](https://sre.google/sre-book/service-level-objectives/)
- [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1 (NIST, 2022-02-03)](https://csrc.nist.gov/pubs/sp/800/218/final)
