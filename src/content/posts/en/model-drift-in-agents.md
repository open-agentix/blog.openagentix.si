---
ref: model-drift-in-agents
lang: en
title: "Detecting and handling model drift in agents"
description: "Agents change behaviour when models, prompts, tools or inputs change. How to notice it with golden runs and run metrics, and how to contain it with pinning, canaries and rollback."
date: 2026-10-20T07:00:00+02:00
tags: [evaluation, operations, reliability]
---

An agent that worked last month can behave differently today without anyone touching its definition.
The model behind an alias was updated, a tool's API returns a new field, the inputs look different, or a
small prompt edit had a larger effect than expected. In agent systems this rarely shows up as an error.
It shows up as more steps per run, higher cost, more retries, more rejected outputs, or answers that are
subtly worse. Detecting drift therefore means measuring behaviour, not only uptime, and handling it means
being able to say exactly what changed and go back.

This post covers where drift comes from, how to detect it with golden runs and run metrics, and how to
contain it with pinning, canaries and rollback.

## Four sources of drift

"Model drift" is used loosely. For agents it helps to separate four sources, because each needs a
different response:

1. **Provider-side model changes.** An alias such as "latest" moves to a new model, a hosted model is
   retired, or serving infrastructure changes. Providers have published incident reports where response
   quality degraded for a period without an outage; [deploying agent changes
   safely](/posts/deploying-agent-changes-safely/) quotes one. Local runtimes are not immune: a model tag
   can be re-pointed to new weights.
2. **Your own changes.** System prompts, instruction files, skills, tool descriptions, policies and
   budgets. Each one can change outcomes, and they change more often than the model.
3. **Environment changes.** A tool returns a different format, an MCP server adds tools, a dependency
   behind a tool changes its behaviour.
4. **Input drift.** The events the agent receives change: new ticket types, longer documents, a new
   language. The agent did not change, the work did.

The first two are under release control if you set it up. The last two are not, which is why detection
cannot rely on release notes alone.

## Detection 1: golden runs

![Drift detection loop with golden runs, run metrics, canary and rollback](/images/blog/model-drift-in-agents-1.svg)

A golden run is a fixed task with a known good outcome that you re-run on purpose. A set of them is the
agent equivalent of a regression test suite, and the basics are covered in [agent evals
101](/posts/agent-evals-101/). For drift, three properties matter:

- **Taken from real work.** Use past inputs (anonymised, or with fictional data) and the outcome a person
  accepted, not invented examples that the agent was tuned on.
- **Graded on the outcome.** Check what the agent did in the environment (the ticket state, the diff,
  the structured output), not how its final message reads. Where you need a model as grader, mind its
  [known biases](/posts/llm-as-judge-pitfalls/).
- **Re-run on every change and on a schedule.** On every change you control (model identifier, prompt,
  skill, tool version), and periodically even when nothing changed, because the provider and the
  environment can change without telling you.

Agent runs are not deterministic, so a single pass or fail says little. Run each case several times and
compare pass rates, and remember the difference between "passes at least once in k tries" and "passes in
all k tries"; for unattended agents the second is usually the one that matters.

A minimal golden case might look like this (fictional data):

```yaml
id: triage-007
input:
  finding: { cveId: CVE-2026-00000, package: example-lib, severity: HIGH }
  ticket: SEC-123
expect:
  output.severity: HIGH
  output.action: comment
  tools_called: [cve-db.lookup_cve, tickets.add_comment]
  max_steps: 6
trials: 5
pass_rule: all   # every trial must pass
```

## Detection 2: run metrics against a baseline

Golden runs catch drift on cases you know. Production metrics catch drift on cases you do not. Useful
signals, per agent version and per model:

| Metric | What a shift can indicate |
| --- | --- |
| Cost and tokens per run | Longer reasoning, more retries, larger context |
| Steps and tool calls per run | Loops, a different plan, a tool that stopped working |
| Tool-call error rate | Changed tool API, malformed arguments |
| Schema validation failures of outputs | The model no longer follows the output format |
| Budget or loop stops | Runs that no longer converge |
| Approval rejections and human edits | Output quality dropped where people can see it |
| Run duration | Slower provider, more steps, retries |

Compare distributions over a window (median and a high percentile), not individual runs, and compare
the same agent version on the same kind of input. A rise in steps per run with a flat error rate is a
different story from a rise in tool errors. Set alert thresholds from your own baseline; there is no
universal number. [SLOs for agents](/posts/slos-for-agents/) and [observability for
agents](/posts/observability-for-agents/) describe how to collect these signals.

## Handling 1: pin and record

You can only reason about drift if every run records what it ran with:

- the exact model identifier (a dated version where the provider offers one, a digest for local models),
- the provider or route that served it (relevant when a router may pick different upstream providers),
- the version of the agent definition, prompt, skills, tools and policy.

Pinning does not prevent provider-side changes, and dated versions are eventually retired. What it
gives you is a clear moment of change: a model upgrade becomes a release you plan and evaluate, not
something that happens to you.

## Handling 2: canary, compare, roll back

Treat a model or prompt change like any other release: run the new version on a small share of runs next
to the stable one, compare golden-run pass rates and the metrics above, then promote or roll back. The
flow is described step by step in [deploying agent changes safely](/posts/deploying-agent-changes-safely/).
Two points specific to drift:

- **Rollback needs something to roll back to.** If the old model version has been retired, rollback
  means moving to another pinned model and re-running the golden set, so keep at least one evaluated
  fallback.
- **Not all drift is a rollback case.** Input drift needs new golden cases and maybe a changed playbook,
  not an older model. Environment drift needs a fix in the tool or its contract.

When drift slipped through and caused harm, handle it as an incident: stop the agent, preserve the
trail, review. See [incident response for agents](/posts/incident-response-for-agents/).

## What openagentix records today and what is planned

openagentix is open source and pre-1.0, so a short, honest status:

- **Available:** published `agents.md` versions are immutable, so the definition behind a run is fixed.
  Each run step records provider, model, tokens, cost and duration. Typed handovers fail a run when an
  output does not match its schema, and the failure is recorded. Budgets stop runs that exceed tokens,
  cost, steps or time. Model prices come from a pinned, vendored models.dev snapshot (this pins catalog
  data, not model behaviour).
- **Planned:** agent test suites and an eval runner on every publish (W2-4), golden datasets with
  graders and a promotion gate on every new version and model (W6-2), and approval of a version bound to
  its model, evaluation set and policy, with re-evaluation when any of them changes (W6-3). See the
  [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md).

Until those exist, the signals above can be read from the run step records and the cost lines (which
export as CSV or JSON), and golden runs can be scripted with the `oax run` command against fixed event files.

## A checklist

1. Write down every artefact that shapes the agent's behaviour, and pin each one.
2. Record model, provider and artefact versions on every run.
3. Build a golden set from real, accepted outcomes; run each case several times.
4. Re-run it on every change and on a schedule.
5. Baseline cost, steps, tool errors, schema failures, budget stops and human rejections per version.
6. Ship model and prompt changes as canaries; keep an evaluated fallback model.
7. Add new golden cases whenever input drift shows up in production.

## Key takeaways

- Drift comes from provider models, your own changes, the environment and the inputs; separate them.
- It usually appears as changed behaviour and cost, not as errors, so measure behaviour.
- Golden runs catch drift on known cases; run metrics against a baseline catch the rest.
- Pin and record everything that shapes a run, so a change becomes a release.
- Canary and rollback work for changes you control; input and environment drift need new cases and
  fixes instead.

## Sources

- openagentix, [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) (items W2-4, W6-2, W6-3) and [repository](https://github.com/open-agentix/open-agentix).
- Related posts on this blog: [agent evals 101](/posts/agent-evals-101/), [deploying agent changes safely](/posts/deploying-agent-changes-safely/), [SLOs for agents](/posts/slos-for-agents/).
