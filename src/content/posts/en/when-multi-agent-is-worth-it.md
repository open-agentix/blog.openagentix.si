---
ref: when-multi-agent-is-worth-it
lang: en
title: "When are multi-agent systems worth their tokens?"
description: "Multi-agent systems parallelise work but multiply token use and add hand-off failures. Single agent, orchestrator-worker and pipeline compared."
date: 2026-06-11T09:00:00Z
tags: [multi-agent, cost, comparison]
---

Multi-agent systems are worth their tokens when the task is broad, parallelisable and valuable enough to
pay for several agents' worth of context, and when you can verify the result. For most other tasks, a
single agent with good tools is cheaper, easier to debug and easier to govern. This post compares three
designs, the single agent, the orchestrator-worker pattern and the pipeline, on cost, reliability and
governance, so the choice is made on purpose rather than by fashion.

## What the evidence says about cost

Anthropic published a candid account of its multi-agent research system, including what it costs. Two
statements are worth keeping side by side. The first explains why the approach can work at all:

> Multi-agent systems work mainly because they help spend enough tokens to solve the problem.

The second gives the price:

> In our data, agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats.

Source: [Anthropic, How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
These figures come from one system doing open-ended research, and your ratios will differ. The structural
point survives: a multi-agent design buys capacity by spending tokens, so it only pays when the task's
value exceeds that spend. That is why [cost is a platform concern](/posts/cost-is-a-platform-concern/)
and not something to discover on the invoice.

The research side is just as sober. A study of failures in multi-agent LLM systems opens its abstract with
a caution:

> Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal.

Source: [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) (arXiv). Read together,
the two sources say the same thing: more agents are not automatically better, and where they help, they
help because of parallel context and breadth, not because of magic.

## Three designs

![Single agent, orchestrator-worker and pipeline topologies compared](/images/blog/when-multi-agent-is-worth-it-1.svg)

### Single agent

One agent, one context, a set of tools. It reads, decides and acts in a loop.

- **Cost:** lowest. You pay for one context that grows as the run proceeds.
- **Reliability:** failures stay inside one trace, which makes them easy to read and reproduce.
- **Governance:** one identity, one tool list, one audit trail.
- **Limits:** the context window is the ceiling. Broad tasks (survey twenty sources, review a hundred
  files) get shallow or run out of room.

### Orchestrator-worker

A lead agent plans, spawns workers for sub-tasks in parallel, and merges their results.

- **Cost:** highest. Every worker carries its own context, and the lead pays again to read and merge.
- **Reliability:** failures move to the seams. The lead may split the task badly, workers may duplicate
  effort or return conflicting claims, and the merge may hide the disagreement.
- **Governance:** several identities and tool sets. Each worker needs its own scope; the lead should not
  inherit the union of all of them.
- **Strengths:** breadth. Independent sub-questions run at the same time, and each worker's context stays
  focused. The Claude Code documentation describes the isolation that makes this useful:

> Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions.

Source: [Claude Code docs, Create custom subagents](https://code.claude.com/docs/en/sub-agents) (live
documentation, quoted as fetched on 2026-10-04). Independent permissions are the governance hook:
workers can be given less than the lead.

### Pipeline

Fixed stages, each handled by a specialised agent or a plain function: plan, build, check. Control flow is
in your code or workflow, not in a model's decision.

- **Cost:** moderate and predictable, because the number of stages is fixed.
- **Reliability:** failures concentrate at the stage boundaries. Define each hand-off as a typed record
  and validate it; see [handovers and contracts](/posts/handovers-and-contracts/).
- **Governance:** easiest of the multi-agent options, because each stage has a known tool list and the
  sequence is visible in the definition.
- **Limits:** it only fits tasks whose steps you can name in advance. When the path depends on what is
  found, a pipeline gets awkward.

## A decision guide

Ask these questions in order and stop at the first "no" for a multi-agent design.

1. **Is the task decomposable into independent parts?** If sub-tasks depend on each other's output, extra
   agents add waiting and coordination, not speed.
2. **Is the breadth beyond one context window?** If a single agent can hold the material, split only if
   you need different permissions for different parts.
3. **Is the value high enough?** Estimate tokens per run for each design and compare with what a correct
   answer is worth. A tenfold multiplier on a cheap task is still cheap; on a high-volume task it is a
   budget line.
4. **Can you verify the result?** Merged output from several agents needs a check: tests, a schema, a
   second source. If you cannot check it, you cannot trust the extra complexity.
5. **Can you govern it?** Per-agent scopes, per-run budgets and a trace across hand-offs must exist
   before you add agents.

If the answer to the first question is "no" or the task is a straight line, [workflows beat open-ended
agents](/posts/workflows-vs-agents/) for the same reason: a fixed sequence is cheaper and more
predictable than a model choosing steps.

## Practical rules if you do go multi-agent

- **Give the lead a budget, and pass a share to each worker.** An unbounded fan-out is a denial-of-wallet
  vulnerability as well as a cost problem.
- **Cap depth and fan-out.** Workers spawning workers needs an explicit limit.
- **Scope tools per worker.** A search worker needs search, not write access. Do not let the lead inherit
  everything.
- **Return structured results.** Ask workers for named fields and sources, not prose, so the merge step can
  compare claims.
- **Trace across agents.** One run identifier that links lead and workers makes post-hoc debugging
  possible.
- **Test the single-agent baseline first.** If one agent with better tools solves the task, you have saved
  a lot of money.

## Key takeaways

- Multi-agent designs buy breadth with tokens; the published ratio of about 15× over chat is one team's
  number, but the direction holds.
- Benchmark gains from multi-agent setups are often small, so measure against a single-agent baseline.
- Single agent is cheapest and easiest to govern; orchestrator-worker is broadest and costliest; pipeline
  is predictable and fits known steps.
- Failures live at hand-offs: use typed contracts, budgets, depth limits and per-worker permissions.

## Sources

- Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) (2025).
- arXiv, [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) (2025).
- Anthropic, [Create custom subagents (Claude Code docs)](https://code.claude.com/docs/en/sub-agents) (live documentation).
