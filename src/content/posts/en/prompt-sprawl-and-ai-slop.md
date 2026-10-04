---
ref: prompt-sprawl-and-ai-slop
lang: en
title: "Too many prompts: how prompt sprawl turns into AI slop"
description: "AI slop is output that grows faster than anyone can review it. How prompt sprawl lowers quality, and why fewer, smaller, verified steps beat more prompts."
date: 2026-03-10T09:00:00Z
tags: [quality, prompts, opinion]
---

AI slop is output that looks finished and has not been checked: code nobody read, summaries nobody
verified, documents that sound confident and drift from the facts. It rarely comes from one bad
prompt. It comes from prompt sprawl, the habit of answering every problem with another prompt,
another agent run or another paragraph of instructions, until the amount of generated material grows
faster than anyone's ability to review it. This post is an opinion, and it says where the evidence
is thin. The argument: the real bottleneck is review capacity, so design for fewer, smaller,
verified steps.

![Chart showing generated output outgrowing review capacity](/images/blog/prompt-sprawl-and-ai-slop-1.svg)

## How sprawl happens

It starts reasonably. An agent misses an edge case, so a sentence is added to the prompt. A second
agent is added to double-check the first. A third summarises both. Every step makes local sense.
Over weeks the result is a pile: a long standing prompt, overlapping instructions that contradict
each other in corners, and a pipeline in which nobody can say which step is responsible for which
quality property.

Three effects compound.

- **Output volume goes up.** More runs, more drafts, more diffs and more generated tests, because
  generation is cheap.
- **Review capacity does not.** A person reads at human speed. The number of changes a team can
  review properly per day barely moves when the tooling gets better at producing them.
- **Context gets noisy.** Long prompts with overlapping rules dilute the signal the model needs.

The gap between the first two is the quiet part. Nobody decides to stop reviewing. The queue gets
longer, reviews get shorter, and "looks fine" replaces "checked".

## What the evidence says, and what it does not

Be careful with numbers here. In July 2025 METR published a study of experienced open-source
developers working on their own repositories. Its headline finding:

> Surprisingly, we find that when developers use AI tools, they take 19% longer than without—AI makes them slower.
>
> — METR, [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)

Two caveats matter. First, the page now carries a banner saying the results are out of date and that
a 2026 continuation exists, so this is a snapshot of early-2025 tools, not a statement about today.
Second, it is one study of a specific group and setting. Read it as a reminder that perceived speed
and measured speed can differ, not as a verdict on AI assistance.

The 2025 DORA report, summarised by Google Cloud, makes a point that fits the review problem
better than any productivity number:

> AI doesn't fix a team; it amplifies what's already there.
>
> — Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)

A team with strong review habits, small changes and good tests gets more out of generation. A team
without them gets more output of unknown quality, faster.

## Why more prompts make it worse

Anthropic's context engineering article gives the underlying reason for the prompt half of the
problem:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

and states the goal:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Sprawl is the opposite of that: the largest set of tokens, mostly low-signal, accumulated one
incident at a time. The fix for a recurring failure is rarely another sentence in a standing
prompt. Often it is a narrower step, a deterministic check or a skill loaded only for that task. The
post [Tool, skill or prompt?](/posts/tool-skill-or-prompt/) gives a way to decide where a piece of
guidance belongs.

## Principles for fewer, smaller, verified steps

1. **Treat review capacity as the budget.** Before adding a step that generates more, ask who will
   review it and how long that takes. If nobody, do not add it.
2. **Make steps small.** A small change can be checked in minutes by someone who understands it. A
   large one gets skimmed.
3. **Verify with machines first.** Tests, type checks, linters, schema validation and policy checks
   are cheap and tireless. Humans should see what passed the machines.
4. **Prefer a gate over a second model.** A second model reviewing the first inherits similar blind
   spots. A deterministic check does not. Use model review as a supplement, not as the only gate.
5. **Delete before you add.** When the prompt grows, remove or split something. Move rarely needed
   instructions into a skill that loads on demand.
6. **Keep ownership.** Every prompt and every pipeline step has a named owner who reads the output
   now and then, not only the summary.
7. **Measure the outcome, not the volume.** Track defects found after review, time to review and
   rework, not lines or documents generated.

## A quick self-check for your team

- How many AI-generated changes are merged per week, and how many were actually read line by line?
- Has the standing prompt grown in the last quarter? Is anything in it contradictory?
- Can you point to the check, other than a person's impression, that catches each known failure?
- Do reviewers feel they can say no without being a bottleneck?
- When quality drops, is the first reaction a new prompt or a look at the pipeline?

If the last answer is "a new prompt", the team is sprawling.

## An honest limit

None of this argues against using models heavily. It argues against volume as a goal. A platform
can help by making review visible, for instance by showing which runs are waiting, how long reviews
take and what the checks found. It cannot create reviewer attention. That has to be planned and
protected like any other scarce resource. The same reasoning appears in
[the dark factory argument](/posts/dark-factory-mvp-only/): removing humans from the loop is a
decision with a price, not a default. For where the loop and its controls sit, see
[What is an agent harness](/posts/what-is-an-agent-harness/).

## Key takeaways

- AI slop is unchecked output at volume; prompt sprawl is one way to produce it.
- Review capacity, not generation speed, is the bottleneck. Plan for it explicitly.
- The METR study is a dated snapshot (its own page marks it as out of date); DORA's point that AI
  amplifies a team's existing habits is the more durable lesson.
- Prefer fewer, smaller, verified steps and deterministic checks over more prompts and more agents.
- Keep prompts small, owned and under version control; move rarely needed guidance into skills.

## Sources

- METR, [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) (2025-07-10; the page now notes the results are out of date)
- Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) (2025-09-23)
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29)
