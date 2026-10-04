---
ref: handovers-and-contracts
lang: en
title: "Handovers are contracts: designing the seams between agents"
description: An agent handover is where multi-agent systems break. Treat each one as a typed contract with an owner, a schema and an acceptance check, not a prompt.
date: 2026-04-21T09:00:00Z
tags: [architecture, multi-agent, patterns]
---

**An agent handover** is the moment one agent passes work, context or a result to another. It is where
most multi-agent systems fail: inputs are unclear, nobody verifies what arrives and silent assumptions
cross the boundary unchecked. The fix is old and unglamorous: treat every handover as a contract with a
schema, an owner, an acceptance check and a defined failure path.

## Why the seams break

When a single agent fails, you have one transcript to read. When three agents pass work along, the
failure can sit in any of them or between them. Typical seam problems:

- **Unclear input.** Agent B receives "the customer's issue" as a paragraph of prose and has to guess
  which parts are facts, which are the first agent's interpretation and which are instructions.
- **Missing verification.** B trusts A's output because it came from "a colleague", even if A was
  confused or manipulated.
- **Silent assumptions.** A assumes B will check the refund limit; B assumes A already did. Nobody does.
- **No owner.** When the combined result is wrong, nobody is responsible for the seam.
- **Lost context.** A drops a detail that B needed, and B has no way to ask.

A study that analysed failures of multi-agent LLM systems starts from a sobering observation:

> Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal.
>
> [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) (arXiv, 2025)

That does not mean multi-agent designs are wrong. It means that adding agents adds interfaces, and
interfaces need engineering. For the case for splitting work at all, for example to shrink each agent's
permissions, see [architecture before prompts](/posts/architecture-before-prompts/).

## The handover contract

A handover contract is short and has five parts.

1. **Schema.** The exact fields and types that cross the boundary. Prefer named fields over prose.
2. **Owner.** One role or team accountable for the seam, including its changes.
3. **Preconditions.** What the sender guarantees (for example "all amounts are in cents").
4. **Acceptance check.** What the receiver verifies before using the input.
5. **Failure path.** What happens if the check fails: retry, fall back, escalate to a human.

![Handover between two agents shown as a contract](/images/blog/handovers-and-contracts-1.svg)

A contract can live in a file next to the agent definitions:

```yaml
handover: research-to-analysis
owner: support-platform-team
schema:
  ticket_key:   { type: string, pattern: "^SEC-\\d+$" }
  facts:        { type: array, items: string, maxItems: 20 }
  open_questions: { type: array, items: string }
  source_ids:   { type: array, items: string }   # where each fact came from
accept:
  - "ticket_key resolves in the tracker"
  - "every fact has a source_id"
on_reject: return_to_sender_once_then_escalate
```

Separating `facts` from `open_questions` and requiring `source_ids` addresses the two most common seam
problems at once: ambiguity and unverifiable claims.

## Prefer workflows where the path is known

Not every seam needs an agent on both sides. Anthropic's guidance on building agents distinguishes
workflows from agents and describes the first as

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic, 2024)

If the sequence of steps is known, put it in code: the orchestrator calls agent A, validates the output
against the schema, then calls agent B. Code is a better reviewer of a seam than another model. The
same article gives a general design principle that applies here:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic, 2024)

A typed handover validated in code is exactly that kind of simple, composable pattern.

## Handovers across organisations and protocols

When agents come from different teams or vendors, the contract has to be explicit because you cannot
read the other side's prompts. Agent-to-agent protocols standardise the transport. Google's
announcement of the A2A protocol states the aim:

> The A2A protocol will allow AI agents to communicate with each other, securely exchange information, and coordinate actions
>
> [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) (Google for Developers Blog, 2025)

A protocol gives you message formats and discovery. It does not give you meaning: what a field
promises, who owns it, how it is verified. That is still the contract's job. Whatever the transport,
authenticate the sender and treat the payload as untrusted input until the acceptance check passes.

## Verification at the seam

Three checks pay off most:

- **Structural**: does the payload match the schema? Reject on mismatch, do not "repair" silently.
- **Referential**: do identifiers resolve to real objects (ticket exists, order belongs to the customer)?
- **Policy**: is the next agent allowed to do what the payload asks, under the identity it acts for?

Pair this with the incremental habits in [small verified steps](/posts/small-verified-steps/): every
handover is a natural checkpoint where the work is committed, reviewed or rejected before the next
agent starts.

## Review checklist for each handover

```text
[ ] Is the schema written down and versioned?
[ ] Are facts, interpretations and instructions in separate fields?
[ ] Does every claim carry a source that can be checked?
[ ] Is there a named owner for this seam?
[ ] Does the receiver validate before acting?
[ ] Is the failure path defined and tested (retry limit, escalation)?
[ ] Is the full payload logged for investigation?
```

## Limits

Contracts catch structural and referential errors, not wrong judgements. A perfectly typed handover can
still carry a bad conclusion. For that you need evaluation of the end-to-end outcome and, for risky
steps, human approval. Contracts also add maintenance: every schema change is a coordinated release, so
keep contracts small and stable, and version them like APIs. For the wider design context, see
[agent architecture is not application architecture](/posts/agent-architecture-is-not-application-architecture/).

## Key takeaways

- Most multi-agent failures happen at the seams, so design them deliberately.
- A handover contract has a schema, an owner, preconditions, an acceptance check and a failure path.
- Put known sequences in code and validate every payload before the next agent acts.
- Separate facts, interpretations and instructions; require sources for claims.
- Version contracts like APIs, and evaluate end-to-end outcomes as well as seams.

## Sources

- [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657), arXiv, 2025.
- [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents), Anthropic, 2024-12-19.
- [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/), Google for Developers Blog, 2025-04-09.
