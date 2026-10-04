---
ref: agent-platforms-are-ops-platforms
lang: en
title: "Ops series recap: agent platforms are not that different from classic operations"
description: "AI platform operations recap: a table of twelve disciplines showing what carries over from DevOps and SRE and what is genuinely new for agents."
date: 2026-09-24T09:00:00Z
tags: [operations, comparison, series]
---

**AI platform operations** looks new from the outside and familiar from the inside. Most of what keeps an agent platform healthy is what keeps any production service healthy: identity, least privilege, controlled change, observability, incident response, objectives, cost control, audit, runbooks, patching and secrets. Some things are genuinely different, mainly because the system's behaviour depends on text and on a model you do not control. This recap closes the ops series with a side-by-side table, and for each row says what carries over and what is new.

![Recap table of classic operations versus agent operations](/images/blog/agent-platforms-are-ops-platforms-1.svg)

The short version: if your organisation operates services well, you are most of the way there; if it does not, agents will expose that faster. The series opened with the argument in [agent ops is just ops](/posts/agent-ops-is-just-ops/); this is the check against what followed.

## Side by side

| Discipline | Classic operations | What is new for agents |
| --- | --- | --- |
| Identity | Service accounts, workload identity | An agent acts for a user and on its own; both must be recorded per call |
| Least privilege | Roles and scopes per service | Limits on tool arguments, not just on which tool, and per-step decomposition |
| Change management | Code review, CI, staged rollout | Prompts, skills, tool descriptions and model versions are changes too |
| Deployment | Immutable artefacts, canaries | Behaviour can change without a deploy when a provider updates a model |
| Observability | Logs, metrics, traces | Traces of model calls and tool calls, token and cost metrics, content-aware review |
| Incidents | Pager, runbook, postmortem | Stop switch, credential revocation, replay of what the agent did |
| SLOs | Availability, latency, error rate | Task success and quality objectives alongside latency |
| Cost | Capacity planning, budgets | Variable, usage-driven spend; budgets per run, agent and tenant |
| Audit | Append-only logs, access records | Evidence of what the model was asked, what it proposed and what policy decided |
| Runbooks | Documented procedures | Procedures an agent may follow, written as skills with approvals |
| Patching | OS and dependency updates | Also skills, MCP servers, model versions and prompt libraries |
| Secrets | Vault, rotation | Keep secrets out of model context; credentials live in the tool layer |

Several rows have a dedicated post: [deploying agent changes safely](/posts/deploying-agent-changes-safely/), [audit trails vs logs](/posts/audit-trails-vs-logs/), and [capacity and rate limits](/posts/capacity-and-rate-limits/).

## What carries over unchanged

**Toil still hurts.** The SRE book defines it precisely:

> Toil is the kind of work tied to running a production service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value

Source: [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/) (the book appeared in 2016; the web page is undated).

Agent platforms create new toil unless you prevent it: approving the same safe action by hand every day, re-running evals manually, rotating tokens on a calendar reminder. The cure is the usual one: automate it or remove the need. Agents can also help remove toil, but an agent that automates toil without limits is a new risk to operate.

**Incident response is a discipline, not a tool.** NIST's incident response recommendations make the point that preparation pays off:

> Doing so can help organizations prepare for incident responses, reduce the number and impact of incidents that occur

Source: [SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://csrc.nist.gov/pubs/sp/800/61/r3/final), NIST, 2025-04-03.

The agent-specific preparation is small and concrete: who can stop a run, how credentials are revoked in minutes, how the record of a run is preserved, and which actions an agent could have taken that need to be undone.

## What is genuinely new

1. **Behaviour comes from text.** Prompts, skill instructions and tool descriptions steer actions, so a wording change can alter what the system does. Version and review them like code.
2. **The input can attack the system.** Untrusted content processed by the model can contain instructions. Normal input validation does not remove this; you need structural controls such as gates between model output and side effects.
3. **Outputs are probabilistic.** The same input may produce different results, so an objective such as "success rate on this task set" replaces "the function returns the right value".
4. **A vendor can change the component.** A hosted model may be updated or retired on the provider's schedule. Pin versions where possible and keep an eval set to detect drift.
5. **Cost scales with behaviour.** A loop or a verbose prompt shows up directly on the bill.

## Telemetry standards are catching up

You need not invent your own telemetry shape. The OpenTelemetry project describes the direction:

> establish standards around the shape of the telemetry generated by agent apps to avoid lock-in

Source: [AI Agent Observability - Evolving Standards and Best Practices](https://opentelemetry.io/blog/2025/ai-agent-observability/), OpenTelemetry, 2025-03-06.

Emit traces with spans for model calls and tool calls in a vendor-neutral format, so you can change backends later. Standards are still evolving, so isolate the mapping in one place.

## An illustration for one row

For the audit row, the current demo shows an audit chain: hash-linked entries for an example run with a verification badge. The idea carries to any stack: records that cannot be silently edited, so that "what happened" has an answer you can verify.

![Audit trail in the openagentix demo with example data: hash-chained entries and the hash chain verified as intact](/images/blog/agent-platforms-are-ops-platforms-2.png)

*Screenshot of the current demo (fake data).*

## A self-test

Pick any row of the table and ask three questions. Do we do the classic version well? Have we added the agent-specific part? Who owns it? Rows where the answer to the first question is "no" are the cheapest improvements, because the agent part builds on them.

## Key takeaways

- Agent platforms are operated with the same disciplines as other services; the foundations carry over.
- New parts: behaviour from text, hostile input, probabilistic output, vendor-changed components and usage-driven cost.
- Treat prompts, skills, tool descriptions and models as changes with review and rollout.
- Prepare incident response before the first incident: stop, revoke, replay.
- Use vendor-neutral telemetry and keep toil under control.

## Sources

- Google, [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/).
- NIST, [SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), 2025-04-03.
- OpenTelemetry, [AI Agent Observability - Evolving Standards and Best Practices](https://opentelemetry.io/blog/2025/ai-agent-observability/), 2025-03-06.
