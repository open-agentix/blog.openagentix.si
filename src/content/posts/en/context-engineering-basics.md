---
ref: context-engineering-basics
lang: en
title: "Context engineering: the smallest set of tokens that does the job"
description: "Context engineering treats the context window as a finite budget. Practical ways to keep it small: compaction, sub-tasks with own context, notes."
date: 2026-04-07T09:00:00Z
tags: [context, tools, explainer]
---

**Context engineering** is the practice of deciding what goes into a model's context window at each
step of an agent run, and what stays out. A prompt is one input; the context is everything the model
sees: system prompt, tool definitions, skill descriptions, conversation history, retrieved documents
and the current task. Because the window is finite and quality degrades as it fills with noise, the
goal is a small, high-signal context rather than a big one.

## Context is a budget, not a bucket

Anthropic's engineering team puts the starting point in one sentence:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic, 2025)

And the same article gives the goal:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.
>
> [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic, 2025)

Notice what this implies. Adding another paragraph "just in case" is not free: it competes with
everything else for attention, cost and latency. Prompt engineering asks "how do I word this
instruction?". Context engineering asks "which tokens does the model need right now, and where do
they come from?".

## What actually fills the window

Before optimising, measure. In a typical agent, the window is shared by five consumers:

1. **System prompt**: role, rules, output format.
2. **Tool definitions**: names, descriptions and JSON schemas of every tool offered.
3. **Skill metadata**: the short descriptions that tell the agent which skills exist.
4. **History**: earlier turns, tool calls and tool results.
5. **The current task**: the actual request and its inputs.

![Breakdown of what fills an agent's context window](/images/blog/context-engineering-basics-1.svg)

Tool definitions and history are usually the surprise. Every tool you connect costs tokens on every
turn, whether or not it is used, and tool results pile up fast. Writing good, compact tools is its own
discipline; see [writing tools agents can use](/posts/writing-tools-agents-can-use/).

## Tools that explode the context

Connecting an agent to many tool servers has a visible price. Anthropic describes it like this:

> In cases where agents are connected to thousands of tools, they’ll need to process hundreds of thousands of tokens before reading a request.
>
> [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) (Anthropic, 2025)

The same article shows the other side of the trade. If intermediate data is processed by code instead
of being routed through the model, the numbers change dramatically:

> This reduces the token usage from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7%.
>
> [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) (Anthropic, 2025)

That is one example from one article, not a universal ratio. The transferable idea is that the model
does not need to read data it only forwards. Filter, aggregate and join in code, and show the model
the result.

## Four practical techniques

### 1. Load on demand

Offer a short list of capabilities and load the details only when needed. Skills do this with a
one-line description that is always present and a body that is read only when the skill applies; see
[anatomy of an agent skill](/posts/anatomy-of-an-agent-skill/). The same logic applies to tools:
expose the tools for the current step, not for the whole process.

### 2. Compaction

When a conversation approaches the limit, summarise it and continue with the summary. Keep what the
next step needs: decisions made, open questions, file paths and identifiers. Drop what it does not:
raw tool output that has already been used, dead ends, repeated instructions. Compaction loses
information, so test it with a task that depends on an early detail.

### 3. Structured notes outside the window

Let the agent write progress notes to a file or store and read them back later. A notes file with
"done", "next" and "decisions" survives a context reset and costs a few hundred tokens. It is also
auditable by a human, which a hidden summary is not.

### 4. Sub-tasks with their own context

Hand a self-contained sub-task, such as "search the repository for all callers of this function", to a
sub-agent with a fresh window. It can read thousands of tokens of noise and return a summary of a few
hundred. The parent context stays clean. The hand-off needs a clear input and a clear output format,
otherwise the summary loses what mattered.

A related tool is a dedicated place for reasoning. Anthropic describes a "think" tool as

> a "think" tool that creates dedicated space for structured thinking during complex tasks.
>
> [The "think" tool: Enabling Claude to stop and think](https://www.anthropic.com/engineering/claude-think-tool) (Anthropic, 2025)

Such a tool adds a step, so use it where a decision benefits from an explicit pause, not everywhere.

## Prompt versus context: a quick test

Ask these questions when a run behaves badly:

```text
[ ] Is the instruction unclear?            -> a prompt problem
[ ] Is the needed fact missing?            -> a context problem (retrieval, notes)
[ ] Is the fact there but buried?          -> a context problem (too much noise)
[ ] Does the tool result contain 50 KB?    -> a tool design problem
[ ] Does behaviour drift late in the run?  -> history growth; compact or split
```

Fixing the right layer saves a lot of prompt rewriting. For the habit of piling on more prompts, see
[prompt sprawl and AI slop](/posts/prompt-sprawl-and-ai-slop/).

## Agent memory without the hype

"Memory" for agents is, in practice, one of three things: the history inside the window, notes the
agent writes and reads, or a retrieval index over documents. All three are context-engineering
decisions about what to write, how to find it again and when to drop it. Stale notes are as harmful as
stale documentation, so give them an owner and an expiry rule.

## Key takeaways

- Treat context as a finite budget; aim for the smallest set of high-signal tokens.
- Measure what fills the window: tools and history are the usual surprises.
- Load tools and skills on demand, and process bulk data in code rather than through the model.
- Use compaction, structured notes and sub-tasks with their own context to keep the window clean.
- Diagnose whether a failure is a prompt, context or tool-design problem before rewriting anything.

## Sources

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic, 2025-09-29.
- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp), Anthropic, 2025-11-04.
- [The "think" tool: Enabling Claude to stop and think](https://www.anthropic.com/engineering/claude-think-tool), Anthropic, 2025-03-20.
