---
ref: capacity-and-rate-limits
lang: en
title: "Ops series: capacity, rate limits and runaway agents"
description: "LLM rate limiting for agents: nested run, agent, tenant and provider limits stop one looping agent from starving the rest. With a config sketch and alerts."
date: 2026-09-10T09:00:00Z
tags: [operations, costs, reliability]
---

One agent stuck in a retry loop can use a whole day's tokens in an hour, and take every other agent's rate limit with it. **LLM rate limiting** for agents therefore needs layers: a budget per run, a quota per agent, a quota per tenant and, outside your control, the provider's own limit. Each layer stops a different failure, and together they make saturation visible before it becomes an outage. This post is part of the ops series; it assumes you already track spend as described in [FinOps for agents](/posts/finops-for-agents/).

![Nested limits from run to provider](/images/blog/capacity-and-rate-limits-1.svg)

## Saturation is a golden signal for agents, too

Google's SRE book lists what to watch on any service:

> The four golden signals of monitoring are latency, traffic, errors, and saturation.

Source: [Site Reliability Engineering, Chapter 6: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) (the book appeared in 2016; the web page is undated).

For an agent platform, map them like this:

| Signal | Agent platform meaning |
| --- | --- |
| Latency | Time per model call and per run, split into queueing and generation |
| Traffic | Runs, model calls and tokens per minute |
| Errors | Provider 429 and 5xx responses, tool failures, policy denials |
| Saturation | How close you are to the provider limit, the GPU's capacity or a quota |

Saturation is the signal people forget, because with a hosted model it looks like someone else's problem. It is not: a 429 from the provider is your agents failing.

## The failure the layers prevent

OWASP lists this class of problem as LLM10:

> Unbounded Consumption occurs when a Large Language Model (LLM) application allows users to conduct excessive and uncontrolled inferences

Source: [LLM10:2025 Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/), OWASP Gen AI Security Project.

With agents the "user" is often another piece of software, and a loop needs no attacker: a tool that returns an error the model keeps retrying is enough. The result is the same: excessive, uncontrolled inference, a bill nobody planned, and neighbours starved of capacity.

## Four layers of limits

**1. Per-run budget.** Cap tokens, model calls, tool calls and wall-clock time for one run. When a run hits the cap, stop it with a clear status and keep the partial record. This is the cheapest control and catches most loops.

**2. Per-agent quota.** A daily or hourly ceiling for one agent, across all its runs. A new agent version that loops will hit this before it harms anyone else.

**3. Per-tenant quota.** A ceiling per team, product or customer, usually a share of what you hold at the provider. This is the layer that keeps one team from starving another.

**4. Provider rate limit.** Requests and tokens per minute, set by the provider and plan. Treat it as a shared pool and allocate it down through layers 3 to 1. The sum of tenant quotas should be at or below the pool, or you must queue and prioritise.

A sketch of how this could look in configuration. The keys are illustrative, not a specific product's schema:

```yaml
provider:
  anthropic:
    tokens_per_minute: 400000
    requests_per_minute: 1000
tenants:
  support:
    share: 0.5            # of the provider pool
    daily_budget_usd: 120
agents:
  triage:
    tenant: support
    daily_tokens: 8000000
    run:
      max_tokens: 200000
      max_model_calls: 40
      max_tool_calls: 25
      max_seconds: 300
```

## Local GPU capacity is a limit, too

If you run models yourself, the limit is memory and throughput rather than a quota. The vLLM paper starts from this point:

> High throughput serving of large language models (LLMs) requires batching sufficiently many requests at a time.

Source: Kwon et al., [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180), arXiv, 2023-09-12.

The operational reading: a serving stack gets more efficient with enough concurrent requests, but each request holds memory, so there is a ceiling where latency climbs sharply. Measure it with your own prompts, set the concurrency limit below that point and put a queue in front. Rate limits then protect your own hardware instead of a provider's.

## Behaviour under pressure

Limits need defined behaviour, otherwise they only move the failure:

- **Retry with backoff and jitter** on 429, honouring the provider's retry hint. Cap the number of retries; unlimited retries are the loop again.
- **Queue by priority.** Interactive runs ahead of batch work, and a tenant over quota waits instead of failing others.
- **Degrade deliberately.** Name a fallback model for non-critical work, and decide in advance which agents must not fall back.
- **Fail fast and visibly.** A run stopped by a budget should say so in its status, and the owner should be told.
- **Stop, do not throttle forever.** A run that has used 80 percent of its budget without progress is a candidate for early stop.

## What to alert on

- Provider 429 rate above a small threshold for five minutes.
- Any tenant above 80 percent of its quota before the period ends.
- A run that hit its budget cap, grouped by agent version, so a bad release is obvious.
- Queue wait time above your latency objective; see [SLOs for agents](/posts/slos-for-agents/).
- Spend per hour compared with the same hour last week.

Caching and prompt design reduce the load before limits apply; see [prompt caching and token budgets](/posts/prompt-caching-and-token-budgets/).

## An example view

In the current demo, a budgets view shows spend against budget per agent for invented example tenants, including a run that was stopped by its limit. The point of such a view is that a stop is an expected, recorded outcome, not a mystery.

<!-- screenshot-slot: Budgets view of the current demo with invented tenants: spend versus budget per agent and a stopped run -->

## Key takeaways

- Use four nested limits: run, agent, tenant and provider.
- Saturation is a golden signal; a provider 429 means your agents are failing.
- Loops need no attacker, only a retryable error: cap retries and run length.
- Define behaviour under pressure: backoff, priority queues, deliberate fallback, visible stops.
- Local GPU serving has a concurrency ceiling; measure it and queue in front.

## Sources

- OWASP Gen AI Security Project, [LLM10:2025 Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).
- Google, [Site Reliability Engineering, Chapter 6: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/).
- Kwon et al., [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180), arXiv.
