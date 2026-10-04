---
ref: agent-evals-101
lang: en
title: "Agent evals 101: tasks, graders and transcripts"
description: AI agent evaluation checks the outcome in the environment, not just the final message. Learn tasks, trials, graders, transcripts and pass@k vs pass^k.
date: 2026-04-09T09:00:00Z
tags: [evaluation, quality, explainer]
---

**AI agent evaluation** means running an agent on defined tasks, many times, and scoring what actually
happened in the environment, not just what the agent said at the end. A chatbot eval compares an answer
with a reference. An agent eval has to check side effects: was the file changed, does the row exist,
was the right ticket created, and were forbidden actions avoided? This post defines the vocabulary and
a minimal setup you can build in a day.

## The vocabulary

A small set of terms covers most agent evals.

- **Task**: one test case with an input, an environment and a success condition.
- **Trial**: one attempt by the agent at a task. Agents are non-deterministic, so one task usually
  needs several trials.
- **Transcript**: the full record of a trial: messages, tool calls, tool results and final answer.
- **Grader**: the logic that scores a trial.
- **Environment state**: what is true in the world after the trial, such as database rows or files.
- **Score**: the aggregate over graders and trials.

Anthropic's engineering team defines the grader in one sentence:

> A grader is logic that scores some aspect of the agent’s performance.
>
> [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Anthropic, 2026)

Note "some aspect". A single trial usually has several graders, each looking at a different property.

![Agent evaluation loop with tasks, trials and graders](/images/blog/agent-evals-101-1.svg)

## Grade the outcome, not the message

An agent that says "I have booked your flight" has not necessarily booked a flight. The reliable check
looks at the world. The same article illustrates this with a booking scenario:

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Anthropic, 2026)

Apply the idea to your own tasks. If the agent should open a pull request, query the repository. If it
should file a ticket, read the tracker. If it should not touch a system, check that the system is
unchanged. The transcript is still valuable, but as evidence for debugging and for grading *how* the
agent worked, such as whether it called a forbidden tool, rather than as the main success signal.

## Three kinds of graders

| Grader | Good for | Watch out for |
| --- | --- | --- |
| Code | State checks, schema validation, tests passing, forbidden-call detection | Brittle if it checks wording instead of outcome |
| Model (LLM) | Rubric-based judgement of text quality, tone, completeness | Needs calibration against human labels; can be biased or inconsistent |
| Human | Calibrating the other graders, ambiguous or high-stakes cases | Slow and expensive; sample, do not grade everything |

Prefer code graders wherever the outcome can be checked deterministically. Use an LLM grader with an
explicit rubric where judgement is unavoidable, and spot-check it with humans so you know whether its
scores track yours. Never let a model grade its own work without a rubric and some independent check.

## A minimal task definition

Keep tasks in version control, next to the agent definition they test:

```yaml
id: refund-small-order
input: "Customer asks for a refund on order 1042 (EUR 19.90)."
environment: fixtures/shop-seed.sql
graders:
  - type: code
    check: "refunds table has one row for order 1042 with amount 19.90"
  - type: code
    check: "no call to tool payments.refund_large"
  - type: model
    rubric: "Reply is polite, states the refund amount, promises no timeline"
trials: 5
```

Start with 10 to 20 tasks drawn from real failures and real requests. Include negative tasks, where
the right behaviour is to refuse or ask a question. An eval that only contains success cases rewards
agents that never say no.

## Reliability: pass@k versus pass^k

Because trials vary, one number is not enough. Two aggregates answer different questions:

- **pass@k**: the probability that at least one of k trials succeeds. It measures capability: can the
  agent do this at all, given a few tries?
- **pass^k**: the probability that all k trials succeed. It measures reliability: can you depend on it
  every time?

The pass^k metric comes from the τ-bench paper on tool-using agents:

> We also propose a new metric (pass^k) to evaluate the reliability of agent behavior over multiple trials.
>
> [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045) (arXiv, 2024)

If a task succeeds 80 % of the time per trial, and the trials are independent, pass@3 is high but
pass^3 is about 51 %, and pass^8 is about 17 %. For a customer-facing process that runs thousands of
times, pass^k is the number that matches how users experience the agent. Use pass@k for exploration
and pass^k for release gates.

## Public benchmarks and your own evals

Public benchmarks are useful for comparing models, and their authors state why a realistic task source
matters. The SWE-bench paper puts it this way:

> We find real-world software engineering to be a rich, sustainable, and challenging testbed for evaluating the next generation of language models.
>
> [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770) (arXiv, 2023)

The lesson for your own evals is the data source: real issues, not invented puzzles. A public score does
not tell you whether *your* agent, with *your* tools and *your* policies, handles *your* tickets. Build
a private suite from your own history and keep it fresh as the process changes.

## Running evals as part of the harness

Evals belong in the agent harness, not in a notebook: the harness resets the environment, runs the
trials, stores transcripts and gates releases on the scores. See [what is an agent
harness](/posts/what-is-an-agent-harness/) for the surrounding pieces. When a prompt or skill changes,
the eval suite should run before the change ships; this is also the cure for the habit described in
[prompt sprawl and AI slop](/posts/prompt-sprawl-and-ai-slop/), where prompts grow with nothing
checking that they help. A sound structure, as argued in [architecture before
prompts](/posts/architecture-before-prompts/), also makes evals easier because each component has a
testable contract.

## Common mistakes

- Grading the final message only, so side effects go unchecked.
- Running one trial per task and reporting a single pass rate.
- Fixtures that leak the answer into the environment.
- Model graders without a rubric or human calibration.
- Never retiring tasks that every version passes; they no longer tell you anything.

## Key takeaways

- Score the state of the environment after the run; the transcript is evidence, not proof.
- Use code graders first, model graders with a rubric second, humans to calibrate.
- Run several trials; report pass@k for capability and pass^k for reliability.
- Build tasks from real requests and real failures, including cases where the agent should refuse.
- Run the suite in the harness before every prompt, skill or policy change ships.

## Sources

- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), Anthropic, 2026-01-09.
- [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045), arXiv, 2024.
- [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770), arXiv, 2023.
