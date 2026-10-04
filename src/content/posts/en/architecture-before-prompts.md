---
ref: architecture-before-prompts
lang: en
title: "Architecture before prompts: why the foundation decides everything"
description: "AI agent architecture sets boundaries, contracts, handovers and data flows before any prompt runs. Why most production failures trace to a missing boundary."
date: 2026-03-17T09:00:00Z
tags: [architecture, opinion, patterns]
---

AI agent architecture is the set of decisions that exist before the first prompt is written: where
the boundaries between steps are, what each step may touch, what contract a handover follows and how
data flows through the system. Prompts tune behaviour inside those boundaries. They cannot create a
boundary that is not there. This post is an opinion, with a practical test at the end: when an agent
fails in production, most of the time the cause is a missing boundary, and editing the prompt treats
the symptom.

![Pyramid with architecture at the base and prompts at the top](/images/blog/architecture-before-prompts-1.svg)

## What prompts can and cannot do

A prompt is an instruction to a probabilistic component. It can improve the average behaviour a lot:
tone, format, the order of steps, what to do in common edge cases. It cannot make behaviour
guaranteed. Consider what a prompt cannot do:

- It cannot stop an agent from calling a tool that the agent holds.
- It cannot prove that an instruction was followed.
- It cannot separate trusted instructions from untrusted text in the input.
- It cannot limit the cost of a loop that the model decides to continue.

Each of these is a property of the surrounding system: which tools are granted, what is logged,
where inputs come from and how long a run may last. Those are architectural decisions. A team that
only works on prompts is tuning the inside of a box whose walls nobody has built.

## Workflows, agents and where the boundary goes

Anthropic's guide to building agents draws a useful line between two shapes:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

In a workflow, your code decides the sequence and the model fills in steps. In an agent, the model
decides the sequence. The first has more predictable boundaries, because the control flow is code you
can read and test. The second has more flexibility and more to contain. Choosing between them is the
first architectural decision, and it should be made on purpose: use the least autonomy that solves
the problem, and put the boundary where a failure would otherwise spread.

The same article makes an observation that supports a plain, boring architecture:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

(The page has been modified since its original publication; the sentences quoted here are from its
core text.) Simple and composable also means that each piece can be given its own limits.

## An agent is a model plus scaffolding

Anthropic's write-up on the SWE-bench results states what an agent is in one sentence:

> In this context, an "agent" refers to the combination of an AI model and the software scaffolding around it.
>
> — Anthropic, [Claude SWE-Bench Performance](https://www.anthropic.com/engineering/swe-bench-sonnet)

The scaffolding is the architecture. It decides which tools exist, how results are fed back, when to
stop and what to remember. Two teams using the same model with different scaffolding get different
agents. That is why comparing "models" without looking at the system around them says little about
production behaviour.

## Four architectural questions to answer before prompting

1. **Boundaries.** What is the smallest unit that should fail alone? Which tools, data and network
   destinations does each unit need? The post on
   [least privilege](/posts/least-privilege-for-agents/) shows the approach: small agents with narrow
   grants instead of one agent with everything.
2. **Contracts.** What goes in and out of each step, in what shape? A structured output validated
   against a schema is a contract. Free-form prose passed to the next agent is hope.
3. **Handovers.** Who decides that a step is finished, and who receives the result? A handover is
   where errors and injected text travel, so it needs a defined format and a check.
4. **Data flow.** Where does each piece of data come from, where may it go and who may see it? Draw
   it. If the drawing has an arrow from untrusted input to a tool that can write, that arrow is the
   finding.

The existing post [Agent architecture is not application architecture](/posts/agent-architecture-is-not-application-architecture/)
describes one concrete pattern for this: one MCP server per system and one agent per step. The point
here is more general: any pattern that answers these four questions beats a better prompt on a
system that answers none of them.

## Why this matters for quality, too

Architecture also determines whether you can tell what went wrong. If each step has a contract, a
failed contract points at a step. If everything is one long prompt with one long output, a bad
result has no address. The 2025 DORA report, summarised by Google Cloud, offers a sentence that
applies to agent systems as much as to teams:

> AI doesn't fix a team; it amplifies what's already there.
>
> — Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)

A system with clear boundaries gets amplified into clear behaviour. A system without them gets
amplified into confusion. The related argument about volume and review capacity is in
[Too many prompts](/posts/prompt-sprawl-and-ai-slop/).

## A test for your incident reviews

Next time an agent misbehaves, ask these questions before touching the prompt:

- Which boundary should have stopped this, and did it exist?
- Could the agent do this because it held a tool it did not need for the task?
- Did untrusted input reach a step that could act on it?
- Was the handover validated, or did the next step trust free text?
- Is there a record that shows the steps, not just the final answer?

Count where the answers land. If most point at structure, change the structure. If the boundaries
were right and the step still did the wrong thing, then it is a prompt problem, and an honest one.

## Limits of the argument

This is not an argument against prompt work. A good prompt reduces how often the boundaries are
tested. It also is not an argument for heavy frameworks; the quoted guidance points the other way.
And architecture does not remove the need to evaluate the model's behaviour. It makes the evaluation
smaller, because each step has a narrower job.

## Key takeaways

- Prompts tune behaviour inside a boundary; architecture decides the boundaries.
- Choose workflow or agent on purpose and use the least autonomy that solves the problem.
- An agent is a model plus scaffolding. The scaffolding is the architecture.
- Answer four questions before prompting: boundaries, contracts, handovers, data flow.
- In incident reviews, look for the missing boundary before editing the prompt.

## Sources

- Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (2024-12-19; the page has been updated since)
- Anthropic, [Claude SWE-Bench Performance](https://www.anthropic.com/engineering/swe-bench-sonnet) (2025-01-06)
- Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) (2025-09-23)
