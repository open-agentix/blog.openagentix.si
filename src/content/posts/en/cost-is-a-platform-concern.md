---
ref: cost-is-a-platform-concern
lang: en
title: "Cost is a platform concern: budgets, per-agent and per-tenant attribution, export"
description: Agent systems can fail financially while working technically. open-agentix prices every step, attributes it to tenant, agent and use case, stops runs at their budget and exports the lines.
date: 2026-10-04T12:00:00Z
tags: [costs, governance, architecture]
---

An agent that loops can burn a month of budget in an afternoon without a single error in the logs.
Cost is therefore a failure mode of its own, and in open-agentix it is part of execution control
rather than a report that arrives later.

## What is recorded

For every model call and tool call the platform records tokens in and out, the provider and model,
the number of tool calls and a price. Prices are kept in micro-USD from a configurable price table,
and the table can start from a pinned snapshot of the public models.dev catalog. The snapshot is
vendored in the repository and refreshed by a reviewed change, never fetched at run time. Local
overrides cover private and Ollama models.

Each cost line carries who and what it belongs to:

```text
tenant, team, agent, use case, run, step, provider, model, month,
tokens in, tokens out, cost (micro-USD)
```

That is what makes attribution possible after the fact. You do not have to decide the questions you
want to ask in advance.

## Attribution

The cost summary endpoint groups by run, agent, team, tenant, use case, month, provider or model,
with optional month ranges. A finance question such as "what did the vulnerability-management use
case cost last month, and on which models?" is a query, not a spreadsheet exercise. Users see only
their own tenant's lines, and platform operators can span tenants explicitly.

## Budgets that stop runs

Budgets are enforced during execution, not summed up afterwards:

- **Per run**, in the agent file: maximum tokens, cost, steps, tool calls and a timeout. The
  control agent checks them before each model call and after each tool call, and stops the run
  with an audit entry when one is exceeded.
- **Per agent and per team and month.** A team that is over its monthly budget gets runs that are
  blocked by policy immediately.

```yaml
budget:
  maxTokens: 50000
  maxCostUsd: 0.5
  maxSteps: 12
  maxToolCalls: 6
  timeoutSeconds: 300
```

The stop is a hard stop. It is a platform decision, so a model that wants to keep going cannot
argue its way past it.

## Getting the numbers out

Cost lines can be exported as CSV or JSON, filtered by month, with every attribution column
included, so they can feed a chargeback process or your own analysis. For monitoring there is a
Prometheus counter, `oax_cost_micro_usd_total`, labelled by provider only. The labels are
deliberately bounded: per-run or per-agent labels would grow the metric store without limit, so
detail lives in the ledger and the export, not in the metrics.

## Limits you should know about

- **Costs are estimates.** They come from your price table and the token counts the provider
  reports. They are not your invoice, and discounts, tiered pricing or negotiated rates are not
  reflected.
- **Budgets per use case and per tenant** are planned for the next release, together with alert
  thresholds at 50, 80 and 100 percent of a monthly budget. Today the hard stops are per run, agent
  and team. Cost chargeback reports per cost centre are on the roadmap for 1.0.
- **A hard stop is a blunt tool.** It protects the budget, but a run that is stopped halfway may
  leave work unfinished. Design agents so that a stop at any step is safe, and let approval rules
  guard anything that must not be left half done.
- **Tool costs** are only as good as the prices you configure for them.

The principle is simple: if an agent can spend money, the platform should know how much, for whom
and for what, and should be able to say no.
