---
ref: prompt-caching-and-token-budgets
lang: en
title: "LLM cost optimization for agents: caching, code execution and budgets"
description: "LLM cost optimization for agents: where prompt caching pays off, when code execution beats tool calls, and why hard per-run token budgets protect security too."
date: 2026-06-25T09:00:00Z
tags: [costs, how-to, tools]
---

LLM cost optimization for agents comes down to three levers: stop paying full price for context you send
again and again (prompt caching), stop pushing large intermediate results through the model (code execution
and compact tool results), and put a hard ceiling on what any single run may spend (token budgets). The
first two lower the bill. The third protects you when the first two are not enough, and it doubles as a
security control. This post shows where each lever helps, with numbers from the providers' own
documentation and what to measure on your side.

## Where agent cost actually comes from

An agent run is a loop. Every step sends the whole conversation so far, plus tool definitions, to the
model, and receives a new message. Two things grow the bill:

1. **Repeated context.** System prompt, tool definitions, instructions and the early part of the
   conversation are sent again on every step. A twenty-step run pays for the system prompt twenty times.
2. **Large intermediate results.** A tool returns a ten-thousand-row table or a whole file; the model reads
   it, uses a fraction, and the rest stays in context for every later step.

If you want the broader framing, [cost is a platform concern](/posts/cost-is-a-platform-concern/) argues
that attribution and limits belong in the platform and not in each agent's author. The practical
techniques below are the tools for that.

## Lever 1: prompt caching

Prompt caching lets a provider reuse the processed form of a stable prompt prefix, so you pay less to send
it again and wait less for the response. Anthropic's announcement summarises the trade:

> reducing costs by up to 90% and latency by up to 85% for long prompts.

There is a catch on the write side, stated in the same announcement:

> Writing to the cache costs 25% more than our base input token price for any given model

Source: [Anthropic, Prompt caching with Claude](https://www.anthropic.com/news/prompt-caching). Pricing and
terms change, so check the current figures for your model. The structure of the trade is what lasts:
writing to the cache costs a little more once, and reading from it costs much less on every later use.
Caching therefore pays when the same prefix is reused several times within the cache lifetime, and loses
when each prefix is used once.

What this means in practice:

- **Put stable content first and variable content last.** Caching works on a prefix. Place system
  instructions, tool definitions and reference documents at the start, and the changing user turn at the
  end. A timestamp or request id near the top defeats the cache.
- **Keep tool definitions stable.** Reordering or editing tools between steps invalidates what follows.
  Load the same set for a whole run rather than reshuffling per step.
- **Do not edit earlier turns.** Rewriting history to "clean up" context breaks the prefix. Append instead,
  and compact deliberately at defined points.
- **Measure hit rate.** Most APIs report cache reads and writes in the usage block. Log them per run and
  alert if the hit rate falls, which usually means someone changed a prompt prefix.

See [context engineering basics](/posts/context-engineering-basics/) for how to structure the context so
that the stable part really is stable.

## Lever 2: keep large intermediate results out of the model

Direct tool calling has a built-in inefficiency: every tool result passes through the model's context,
whether or not the model needs all of it. Anthropic describes the problem with large tool sets:

> In cases where agents are connected to thousands of tools, they’ll need to process hundreds of thousands of tokens before reading a request.

and shows what changes when the agent writes code that calls tools and processes data outside the model:

> This reduces the token usage from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7%.

Source: [Anthropic, Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp).
That figure comes from one example in which data moves between services, and it is not a general
guarantee. The mechanism is what you can reuse: **let code, not the model, handle bulk data.** The model
writes a small script that fetches, filters and summarises, and only the summary returns to its context.

When code execution beats direct tool calls:

- A tool returns far more data than the model needs (filtering, aggregation, joins).
- You chain several tool calls where intermediate results are only inputs to the next call.
- You need loops or conditions over many items.

When direct calls are better:

- One call, small result, and the model needs to read the result.
- The code execution environment would be a bigger risk than the data it saves you. Running generated code
  needs isolation, usually a sandbox.

Even without code execution, you can make tools cheaper:

- **Return compact, structured results.** Fields the model needs, not full records.
- **Paginate with sensible defaults.** Ten rows and a "more" token instead of ten thousand rows.
- **Offer a "summary" or "count" variant** of expensive list operations.
- **Truncate with a visible marker.** The model should know that the output was cut.

![Token reduction from caching, compact results and budget caps](/images/blog/prompt-caching-and-token-budgets-1.svg)

## Lever 3: hard token budgets

Caching and compaction lower the expected cost. A budget caps the worst case. Set limits at several
levels:

| Level | Limit | What it prevents |
| --- | --- | --- |
| Per step | maximum output tokens | runaway generations |
| Per run | total tokens or cost, plus maximum steps | loops, endless retries |
| Per agent per day | cost ceiling | a popular or broken agent draining the budget |
| Per tenant or user | quota | one party consuming shared capacity |

Enforce budgets in the platform that proxies model calls, not in the prompt. A prompt that says "be
economical" is a suggestion. A gateway that refuses the next call once the run reaches its cap is a
control. When a limit is hit, fail clearly: stop the run, record why, and report it, so that a person can
decide whether to raise the limit or fix the cause.

## Why budgets are a security control

An attacker, or simply a confused agent, can make your system consume resources without taking any
forbidden action. OWASP names this class of problem:

> Unbounded Consumption occurs when a Large Language Model (LLM) application allows users to conduct excessive and uncontrolled inferences

Source: [OWASP LLM10:2025 Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).
The financial form is sometimes called denial of wallet: crafted inputs that trigger long loops, huge
contexts or fan-out to many sub-agents, so that you pay for the attacker's traffic. A per-run ceiling,
a step limit and a fan-out cap bound the damage. The same limits stop a harmless but buggy agent from
looping all weekend. This is also why a [multi-agent design](/posts/when-multi-agent-is-worth-it/) needs a
budget passed down to its workers: unbounded fan-out multiplies every other cost.

## A practical order of work

1. **Measure first.** Log input, output, cache read and cache write tokens per step and per run. Find the
   top five runs by cost and read them.
2. **Fix the prefix.** Reorder prompts so the stable part leads; remove volatile values from the top.
3. **Trim tool results.** Look for steps where a large result was used for a small fact.
4. **Consider code execution** for the data-heavy workflows, behind a sandbox.
5. **Set budgets** at step, run and daily level. Start generous, tighten with data.
6. **Alert** on budget hits and on a falling cache hit rate.

## Key takeaways

- Most agent cost is repeated context and bulky tool results.
- Prompt caching trades a small premium on writes for large savings on reads; structure prompts so the
  prefix is stable and verify hits in the usage data.
- Letting code process bulk data can cut token use dramatically; the cited 98.7% is one example, not a
  promise.
- Hard per-run and per-day budgets, enforced outside the model, cap the worst case and defend against
  unbounded consumption.

## Sources

- Anthropic, [Prompt caching with Claude](https://www.anthropic.com/news/prompt-caching) (2025).
- Anthropic, [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) (2025).
- OWASP Gen AI Security Project, [LLM10:2025 Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).
