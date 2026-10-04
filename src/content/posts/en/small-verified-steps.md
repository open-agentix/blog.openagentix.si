---
ref: small-verified-steps
lang: en
title: "Small verified steps beat one big prompt: incremental agent workflows"
description: Incremental agent workflows break work into small steps with acceptance checks, progress notes and a clean state after each one. Here is the pattern.
date: 2026-04-14T09:00:00Z
tags: [quality, harness, how-to]
---

**Incremental agent workflows** replace one large "build the whole thing" prompt with a loop of small
steps. Each step makes one change, runs an explicit acceptance check, records a note and leaves the
work in a clean state before the next step starts. The reason is practical: agents that try to do
everything at once tend to declare success early and leave half-finished work behind, and a failure
deep inside a long run is hard to locate.

## The failure mode: too much at once

Anthropic's write-up on long-running agents is candid that this is unsolved in general:

> However, getting agents to make consistent progress across multiple context windows remains an open problem.
>
> [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Anthropic, 2025)

The same article reports what helped in their setup:

> This incremental approach turned out to be critical to addressing the agent’s tendency to do too much at once.
>
> [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Anthropic, 2025)

Symptoms you may recognise: a feature that is "done" but was never run, a refactor that touches forty
files with no tests in between, a summary that describes intentions instead of results, and a working
directory full of half-applied edits that the next session has to untangle.

## The step pattern

The pattern has five parts. It is deliberately boring.

1. **Plan the next step only.** Pick the smallest unit that can be checked: one endpoint, one
   migration, one function with its test.
2. **Make one change.** Resist bundling "while I'm here" edits.
3. **Run the acceptance check.** A command that passes or fails, not an opinion.
4. **Write a progress note.** What changed, what was verified, what is next.
5. **Leave a clean state.** Committed or reverted, never half-applied, so the next step starts from a
   known point.

![Loop of small steps each followed by a verification check](/images/blog/small-verified-steps-1.svg)

Anthropic's article on the Claude Agent SDK describes the same shape as a feedback loop:

> Agents often operate in a specific feedback loop: gather context -> take action -> verify work -> repeat.
>
> [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) (Anthropic, 2025)

The key word is *verify*. A step without a check is a guess with extra steps.

## Write acceptance checks before the step

An acceptance check is an executable statement of "done". Write it first, ideally as part of the task
definition, so the agent cannot redefine success afterwards. Good checks are:

- **Deterministic**: the same state gives the same result.
- **Fast**: seconds, so the loop stays tight.
- **Specific**: they fail for the right reason.
- **Independent of the agent's own claims**: they read the repository, database or test output.

```yaml
steps:
  - id: add-health-endpoint
    change: "Add GET /health returning 200 and {status: ok}"
    check: "pytest tests/test_health.py -q"
    on_fail: revert
  - id: wire-health-into-compose
    change: "Add healthcheck to docker-compose.yml"
    check: "docker compose config -q && grep -q healthcheck docker-compose.yml"
    on_fail: revert
```

Checks can be tests, linters, type checks, schema validation or a query against the environment. For
non-code work, such as a drafted document, a check can be a structural validation (required sections
present, links resolve) plus a human review at defined points. For how to score outcomes in a more
systematic way, see [agent evals 101](/posts/agent-evals-101/).

## Progress notes and clean state

Long runs span several context windows. The notes are what carry the work across them. Keep a short
file in the repository, for example `PROGRESS.md`:

```text
## Done
- health endpoint added, tests pass (commit a1b2c3d)
## Next
- compose healthcheck
## Decisions
- no auth on /health, internal network only
```

A fresh session reads the notes, runs the checks and continues. Because each step ends in a commit or a
revert, "where were we?" always has a precise answer. This also gives humans a review point after
every step, not only at the end.

## What to do when a check fails

The loop needs an exit that is not "keep trying forever". A workable rule:

- On failure, the agent may attempt a bounded number of fixes within the same step, such as two.
- If the check still fails, revert to the last clean state, write the failure into the notes and stop
  or escalate.
- Never edit the check to make it pass unless a human approved the change to the definition of done.

That last rule matters most. An agent that quietly weakens its own tests will report green and mean
nothing.

## Do small steps make you faster?

Not automatically. Verification costs time, and measured productivity effects of AI tools are mixed
and context-dependent. One widely discussed study of experienced open-source developers
reported:

> Surprisingly, we find that when developers use AI tools, they take 19% longer than without—AI makes them slower.
>
> [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) (METR, 2025)

Treat that result with care. The METR page now carries a banner stating that its results are out of
date and that a 2026 continuation of the work exists, so read the current page before drawing
conclusions. The relevant point for this post is narrower: time lost to review, rework and unverified
output is real, which is why the checks belong inside the loop rather than after a big delivery. A
tight loop with cheap checks finds problems when they are small. The opposite approach, one huge
prompt and a long review at the end, concentrates that cost in the worst place. For teams that aim at
fully autonomous pipelines, [the dark factory, MVP only](/posts/dark-factory-mvp-only/) discusses how
far that can be trusted today, and [prompt sprawl and AI slop](/posts/prompt-sprawl-and-ai-slop/)
covers what happens when nothing verifies the output.

## A starter checklist

```text
[ ] Each task is split into steps that take minutes, not hours
[ ] Every step has a runnable acceptance check written beforehand
[ ] The agent may not change checks without approval
[ ] Each step ends in a commit or a revert
[ ] A progress file records done, next and decisions
[ ] A failed step is retried a bounded number of times, then escalated
```

## Key takeaways

- One big prompt invites early "done" claims and hard-to-locate failures.
- Use a loop: plan one step, change one thing, check, note, leave a clean state.
- Write executable acceptance checks before the step and forbid the agent from editing them.
- Progress notes carry long runs across context windows; commits and reverts keep state clean.
- Verification has a cost; keep checks fast and put them inside the loop.

## Sources

- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), Anthropic, 2025-11-26.
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk), Anthropic, 2025-09-29.
- [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), METR, 2025-07-10 (page marked as outdated by METR).
