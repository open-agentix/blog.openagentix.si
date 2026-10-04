---
ref: workflows-vs-agents
lang: en
title: "Workflows or agents? Choosing how much autonomy a step needs"
description: "Workflows vs agents is a per-step choice: fixed code paths are cheaper and easier to govern, loops are flexible. Pick the least autonomy that works."
date: 2026-05-28T09:00:00Z
tags: [architecture, comparison, patterns]
---

Workflows vs agents is not a choice you make once for a whole system. It is a decision you make for each step: how much freedom does this step need? The answer that holds up best in practice is to use the least autonomy that solves the task. Fixed code paths are cheaper, easier to test and easier to govern. Model-directed loops are flexible but cost more and are harder to predict. Reach for the loop only where the path cannot be known in advance.

## The two ends of the scale

Anthropic's engineering guide on building agents draws the line between the two:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

In an agent, by contrast, the model decides the next step and which tool to use, and keeps going until it judges the task done. The guide's advice on how to build either is modest:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

The term "agent" covers a wide range, so think of a scale rather than two boxes.

![Scale of autonomy from workflow to agent](/images/blog/workflows-vs-agents-1.svg)

1. **A single model call** with a good prompt and perhaps retrieval. Many tasks end here.
2. **A fixed chain of calls.** The code decides the order; each model call does one job.
3. **Routing.** One model call chooses which fixed path to take; the paths themselves are code.
4. **Parallel or looped workflows.** The code fans out or retries according to fixed rules.
5. **An open agent loop.** The model chooses the next action from the observations so far.

Moving right gains flexibility and loses predictability. The reasoning-and-acting loop that underlies the right end was described in the ReAct paper, which lets a model

> generate both reasoning traces and task-specific actions in an interleaved manner
>
> — [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629), arXiv

That interleaving is exactly what makes an agent adaptive, and exactly what makes its path unknowable before it runs.

## What autonomy costs

Every step you hand to the model's judgement has a price.

**Money.** Loops make many calls, and each call carries a growing context. Anthropic's write-up of its multi-agent research system measured this:

> In our data, agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats.
>
> — Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

The same article explains why spending can be worth it for some tasks:

> Multi-agent systems work mainly because they help spend enough tokens to solve the problem.
>
> — Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

For a high-value research question, 15 times the tokens may be cheap. For a routine classification that runs 10,000 times a day, it is not. Read the figures as measurements from one system, not as constants.

**Predictability.** A fixed path produces the same sequence of steps each time; you can write a test for each step. A loop can take 3 steps or 30, and the same input can produce different paths. Latency and cost become distributions, not numbers.

**Governance.** With a fixed path, you know before running which tools can be called and in what order, so permissions can be narrow. With a loop, the agent needs every tool it might choose, which widens the blast radius. See [least privilege for agents](/posts/least-privilege-for-agents/).

**Debuggability.** A failing workflow points to a step. A failing agent loop points to a long transcript and a judgement call.

## Criteria for each step

Ask these questions step by step, not for the system as a whole.

1. **Is the sequence known in advance?** If you can write the steps down, write them as code. Use a model inside a step if the step needs language understanding.
2. **Does the next action depend on what was just found?** If the decision is a small branch with few outcomes, use routing. If it is open-ended, a loop may be justified.
3. **How bad is a wrong action?** Irreversible or high-impact actions favour fixed paths with approvals. Reversible, read-only steps tolerate more freedom.
4. **What is the cost and latency budget?** A step that must finish in a second at a fraction of a cent cannot be a loop.
5. **Can you verify the result?** Autonomy is easier to accept where a check exists, such as tests for generated code. Where you cannot verify, constrain.
6. **How often does the task run?** Rare, high-value tasks can afford exploration. Frequent, low-value tasks need cheap, predictable paths.

A worked example: a support process that extracts fields from a ticket, routes it, drafts a reply and creates an issue.

| Step | Pattern | Why |
| --- | --- | --- |
| Extract fields | Single model call with a schema | Known input, known output |
| Route by category | Routing | A few fixed outcomes |
| Look up customer data | Code | A deterministic API call |
| Draft a reply | Single model call, human review | Language task, checked by a person |
| Investigate an odd failure | Agent loop, read-only tools | Path unknown, nothing irreversible |
| Create the issue | Code with approval | One write, high impact |

Only one of six steps is an agent, and it has read-only tools. Most of the "agentic" behaviour of the process comes from well-placed model calls inside a fixed frame.

## Start low, move right with evidence

A practical order of work:

1. **Build the single call or fixed chain first.** Measure it with a small eval set.
2. **Find the failures.** Are they caused by missing information, wrong ordering or tasks that really need exploration?
3. **Add autonomy only where failures need it**, in the narrowest form: a router before a loop, a loop with a small tool set before a general one.
4. **Re-measure.** Compare success, cost and latency to the simpler version. If the loop does not clearly win, keep the simple one.
5. **Constrain the loop** with step limits, a token budget and a stop condition, and keep logs to see what it did.

This is the same discipline as in [architecture before prompts](/posts/architecture-before-prompts/): decide the structure on purpose and let prompts fill the gaps. Where steps pass work to each other, define the interface explicitly, as described in [handovers and contracts](/posts/handovers-and-contracts/).

## Limits

The scale is a mental model, not a taxonomy; real systems mix patterns. Model capabilities also change, and a step that needed a loop last year may be solvable by a single call now. Revisit the choice when you change models. And a simple design is not automatically safe: a fixed chain that passes untrusted text to a model with write access is still exposed.

## Key takeaways

- Choose autonomy per step, not per system.
- Fixed code paths are cheaper, testable and easier to govern; loops are flexible but costlier and less predictable.
- Agents can use several times more tokens than chat, and multi-agent systems far more, so use them where the value justifies it.
- Use criteria: known sequence, impact of errors, verifiability, budget and frequency.
- Start with the simplest design, measure, and add autonomy only where evidence demands it.

## Sources

- Anthropic: [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- arXiv: [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- Anthropic: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
