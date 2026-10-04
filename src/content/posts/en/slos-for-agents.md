---
ref: slos-for-agents
lang: en
title: "Ops series: SLOs for agents, from task success to time to approval"
description: "Define an SLO for AI agents like for any service: task success rate, consistency over trials, latency and cost per task, plus an error budget for rollouts."
date: 2026-05-19T09:00:00Z
tags: [operations, reliability, evaluation]
---

An SLO for AI agents is a measurable target for how well an agent service performs, defined the same way as for any other service: pick indicators, set targets, measure over a window and use the remaining error budget to decide how fast to change things. The indicators differ. For agents they are task success rate, consistency across repeated trials, latency, cost per task and, where people approve actions, the time to approval. This post shows how to derive them from eval and trace data and how an error budget changes rollout decisions.

## SLI, SLO and error budget in one paragraph

The Google SRE book defines the terms precisely:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.
>
> — [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), Google

An SLI (service level indicator) is the measurement, such as the share of tasks completed correctly. The SLO is the target for it, such as 90 % over 28 days. The error budget is the difference between 100 % and the target: the amount of failure you can afford. If you have budget left, you may ship changes; if you have burned it, you stop and fix reliability. Nothing about this is specific to agents, which is the point made in [agent ops is just ops](/posts/agent-ops-is-just-ops/).

## Choose indicators that match what users care about

Start with what a good outcome means, then work backwards to a metric. Four indicators cover most agent services.

### Task success rate

The share of tasks where the outcome is correct. This needs a definition of "correct" that a program can check. The Anthropic article on agent evals separates the agent's output from the state of the world and defines the scoring piece:

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

and gives an example of an outcome that can be checked:

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

In production, you often cannot grade every run. Combine three sources: automated outcome checks where possible (did the ticket get the right label, does the record exist), sampled human review for the rest, and user signals such as reversals or complaints. Report the sampling method with the number.

### Consistency across trials: pass^k

A model that succeeds on a task nine times out of ten still fails one in ten, and users who repeat the task meet the failures. The τ-bench paper proposes a metric for this:

> We also propose a new metric (pass^k) to evaluate the reliability of agent behavior over multiple trials.
>
> — [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045), arXiv

Roughly, pass^k is the probability that an agent succeeds on all k independent trials of the same task. It falls quickly as k grows when per-trial success is below 100 %. For a task a user will run every day, a high pass^5 says more than a high single-run success rate. Measure it offline by running each eval task several times.

### Latency

Time from request to useful result, as a percentile (p50 and p95), not an average. Split it into model time, tool time and waiting for a human, using the spans from [observability for agents](/posts/observability-for-agents/). Set the SLO on the part you control. If a human approval step is part of the process, track **time to approval** separately: it is a business SLO, owned by the approvers.

### Cost per task

Tokens and money per completed task, as a percentile. A cost SLO prevents a quiet regression where a prompt change doubles the spend, and it catches loops. Cost per successful task is a better figure than cost per run, because a cheap run that fails is not cheap.

## A worked example

Suppose a triage agent labels and routes incoming tickets.

| SLI | How it is measured | SLO |
| --- | --- | --- |
| Task success | Label matches a sampled human label, 200 tickets per week | at least 90 % over 28 days |
| pass^5 | Offline suite of 40 tasks, each run 5 times, nightly | at least 70 % |
| p95 latency | Trace duration excluding approval wait | at most 120 s |
| Cost per task | Token cost from spans, p90 | at most 0.40 USD |

![Example SLO board for an agent service](/images/blog/slos-for-agents-1.svg)

The numbers are illustrative; derive yours from what users need and what the system can do today. A target you cannot reach on day one is fine if you track the gap, but a target nobody checks is decoration.

A small definition file keeps the objectives next to the code:

```yaml
service: ticket-triage-agent
window: 28d
objectives:
  - name: task_success
    target: 0.90
    source: eval.sampled_review
  - name: latency_p95_seconds
    target: 120
    source: traces.agent_run.duration_excluding_approval
  - name: cost_per_task_p90_usd
    target: 0.40
    source: traces.cost
```

## Use the error budget to decide

With a 90 % success SLO over 28 days, the budget is 10 % of tasks. Track how fast it burns:

- **Budget healthy.** Ship prompt, skill and model changes at the normal pace, each behind its evals.
- **Burning fast.** Slow down. Require extra eval coverage, canary a small share of traffic and watch the SLIs before widening.
- **Budget spent.** Freeze feature changes. Only reliability fixes ship until the SLO recovers.

This turns a vague argument ("is the new model good enough?") into a rule that was agreed beforehand. It also gives a reason to say no to risky changes that is not personal.

## Pitfalls

- **Measuring only what is easy.** Latency and cost are easy; correctness is hard. Do not let the easy numbers stand in for it.
- **Too many SLOs.** Three to five per service is enough. More dilutes attention.
- **Small samples.** With 20 graded tasks a week, a 90 % target is mostly noise. Say how wide your uncertainty is, or lengthen the window.
- **Eval drift.** Evals that never change stop representing the workload. Refresh them from real incidents.
- **Gaming.** If the agent or the team can change the grader, the SLI is worthless. Keep graders under change control; see [agent evals 101](/posts/agent-evals-101/).

## Key takeaways

- Define SLIs, SLOs and an error budget for agents the same way you do for other services.
- Use task success, pass^k, latency (with time to approval tracked separately) and cost per task as the core indicators.
- Derive them from eval results, sampled review and traces.
- Let the error budget control rollout speed, not opinion.
- Watch sample sizes, drift and graders that can be gamed.

## Sources

- Google: [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- arXiv: [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045)
- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
