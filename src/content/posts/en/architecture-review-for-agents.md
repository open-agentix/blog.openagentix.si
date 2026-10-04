---
ref: architecture-review-for-agents
lang: en
title: "An architecture review for agent systems in one page"
description: "An AI architecture review template for agents on one page: purpose, boundaries, data flow, contracts, autonomy and failure paths, with questions for each."
date: 2026-09-22T09:00:00Z
tags: [architecture, checklist, governance]
---

A one-page **AI architecture review** catches most design errors before an agent goes live, because most of those errors are not about the model. They are about unclear boundaries, undefined hand-offs, data that flows where nobody drew it and failure paths nobody walked through. This post gives a template with seven sections, the questions to ask in each, and a way to record the outcome so the review becomes an artefact the team keeps, not a meeting that is forgotten.

![One-page architecture review template for agent systems](/images/blog/architecture-review-for-agents-1.svg)

Use it as a conversation guide of 45 to 60 minutes with the people who built the system and someone who did not. One page forces choices; if a section needs three pages, that is the finding.

## Start from the simplest thing that works

Anthropic's guidance on building agents makes the case for restraint:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.

Source: [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents), Anthropic, 2024-12-19 (the page has been updated since; the sentence is from the core text).

The same article separates two kinds of system:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.

The rest, where the model directs its own steps, are agents. A review should start by asking which one you are building and why; see [workflows vs agents](/posts/workflows-vs-agents/). If a fixed workflow does the job, the review gets shorter, because the control flow is code you can read.

Multi-agent designs deserve extra scepticism. A study of failures in such systems opens with a sober observation:

> Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal.

Source: [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657), arXiv (first posted 2025-03-17; the quote is from the latest version's abstract).

That is not an argument against decomposition for safety, as in [least privilege for agents](/posts/least-privilege-for-agents/). It is a reason to ask what each extra agent buys you.

## The one-page template

### 1. Purpose

One sentence on what the system does, and one measurable outcome. If you cannot write the outcome, you cannot tell later whether the system works. The background is in [architecture before prompts](/posts/architecture-before-prompts/).

Questions: Who is the user? What happens if the system does nothing? What is explicitly out of scope?

### 2. Boundaries

What the system may touch and what it may not: tools, systems, data classes, networks, tenants. Draw a box and list what crosses it.

Questions: Which credentials does each component hold? What is the blast radius of the worst single component? Which parts are third-party?

### 3. Data flow

Sources, sinks and the trust level of each. Mark where untrusted text enters the model's context and where output leaves the system. The method is described in [data flow first](/posts/data-flow-first/).

Questions: Where does personal or confidential data go? Can any path combine private data, untrusted input and an outbound channel? Where is data stored, and for how long?

### 4. Contracts

Typed interfaces between agents and tools: inputs, outputs, errors, limits. A hand-off in free text is a contract nobody can test; see [interface contracts for agents](/posts/interface-contracts-for-agents/).

Questions: Is every hand-off a schema? Who validates it, and what happens on a violation? Are tool arguments constrained?

### 5. Autonomy level

Who decides what. Mark each action as automatic, approved by a person or forbidden. Irreversible and externally visible actions should not be automatic by default.

Questions: Which actions need approval, from whom, within what time? What does the system do while waiting? Can a person take over?

### 6. Failure paths

For each external dependency and each step: timeout, retry limit, fallback, and what the user sees. Include the model: provider outage, rate limits, a refusal, a malformed answer.

Questions: What stops a loop? What is the maximum cost of one run? How do you stop the system, and how do you know it stopped?

### 7. Owners

A named team for the system, for each tool and for each skill, plus on-call, a review date and the place where decisions are recorded.

Questions: Who is paged? Who may change prompts, skills and models, and through which review?

## Record decisions, not just opinions

The review's output is a short list of decisions with reasons. Keep them as architecture decision records in the repository: title, context, decision, consequences, date. When the agent changes, the ADR shows what was decided and why, which is more useful than a diagram that has drifted.

## Fit with secure development guidance

If you already follow secure-development guidance, map the review onto it. The UK NCSC guidelines are organised around four areas:

> four key areas within the AI system development life cycle: secure design, secure development, secure deployment, and secure operation and maintenance

Source: [Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development), UK National Cyber Security Centre, 2023-11-27.

Sections 1 to 5 of the template are mostly *secure design*; section 6 straddles *deployment* and *operation*; section 7 is *operation and maintenance*. Re-run the review when you change a tool, a model or an autonomy level, not only at launch.

## An example artefact

A handover graph is a good companion to the page: agents as nodes, handovers as edges labelled with contract names. In the current demo such a graph is generated for an example process, and the review asks of it the same question as of any diagram: does it match what actually runs?

<!-- screenshot-slot: Handover graph of an example process in the current demo: agents as nodes, handovers as edges with contract names -->

## Key takeaways

- A one-page review of purpose, boundaries, data flow, contracts, autonomy, failure paths and owners catches most design errors.
- Start with the question whether a fixed workflow is enough; add agents only where they earn their place.
- Free-text hand-offs are untestable contracts; use schemas.
- Write down decisions as short ADRs and re-run the review when tools, models or autonomy change.

## Sources

- Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents), 2024-12-19.
- arXiv, [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657), 2025.
- UK National Cyber Security Centre, [Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development), 2023-11-27.
