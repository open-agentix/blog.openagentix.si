---
ref: agent-platform-readiness-checklist
lang: en
title: "Agent platform readiness: the checklist that ties the series together"
description: "AI agent production readiness checklist across architecture, skills, security, operations, cost and evaluation, each item linked to the post behind it."
date: 2026-10-01T09:00:00Z
tags: [governance, checklist, series]
---

Readiness for production is not one question; it is six. Is the architecture reviewed, are skills governed, is security checked, can you operate it, do you control cost and can you tell whether it works? This **AI agent production readiness** checklist puts one set of items across all six areas, each linked to the post in this series that explains it. Use it as the final gate before a first run in production, and as a periodic review afterwards. It does not replace a formal risk process; it makes sure the basic questions were asked.

![Readiness radar across six areas](/images/blog/agent-platform-readiness-checklist-1.svg)

Score each area from 0 (nothing in place) to 4 (in place, tested and owned), plot the six values on the radar, and look at the weakest axis, not the average. A platform that is excellent at evaluation and has no incident response is not ready.

## How this fits larger frameworks

Frameworks exist for organisations that need one. The NIST AI Risk Management Framework describes itself as voluntary:

> The NIST AI Risk Management Framework (AI RMF) is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations

Source: [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST (AI RMF 1.0 released 2023-01-26).

And for the security side, the OWASP agentic list is the natural companion:

> identifies the most critical security risks facing autonomous and agentic AI systems.

Source: [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), OWASP Gen AI Security Project, 2025-12-09.

The checklist below is practical and narrower: it is about whether a platform team can run agents safely day to day.

## 1. Architecture

- [ ] The system has a one-page review covering purpose, boundaries, data flow, contracts, autonomy and failure paths. See [an architecture review for agent systems in one page](/posts/architecture-review-for-agents/).
- [ ] A fixed workflow was considered before choosing an agent.
- [ ] Hand-offs between agents and tools are schemas, not prose.
- [ ] Decisions are recorded with reasons, and the review has a date for repetition.

## 2. Skills

- [ ] Skills come from a catalog with owners, versions and review dates. See [building an internal skills catalog](/posts/internal-skills-catalog/).
- [ ] Every skill was reviewed for security and has at least one eval.
- [ ] Consumers pin versions; upgrades are reviewed like dependencies.
- [ ] Unowned or outdated skills are deprecated on a schedule.

## 3. Security

- [ ] The twenty questions of [the agent security checklist](/posts/agent-security-checklist/) are answered per agent, with evidence.
- [ ] No single agent combines private data, untrusted input and an outbound channel.
- [ ] A deterministic gate stands between model output and side effects; see [policy decides, audit proves](/posts/policy-decides-audit-proves/).
- [ ] Each agent holds only the tools its step needs; see [least privilege for agents](/posts/least-privilege-for-agents/).

## 4. Operations

- [ ] The row-by-row comparison in [agent platforms are not that different from classic operations](/posts/agent-platforms-are-ops-platforms/) was walked through and gaps have owners.
- [ ] A stop switch, credential revocation and run replay were tested, not just documented.
- [ ] Observability covers model calls, tool calls, errors and saturation.
- [ ] Changes to prompts, skills and models go through review and staged rollout.

## 5. Cost

- [ ] Budgets exist per run, per agent and per tenant, and a run that hits a budget stops with a visible status.
- [ ] Spend is attributed per use case, and someone reviews it regularly.
- [ ] Provider rate limits and local capacity are known and monitored.
- [ ] A cost per accepted change can be computed.

## 6. Evaluation

- [ ] There is an eval set for the agent's main tasks, run on every change to prompts, skills or model. A grader is defined in plain terms:

> A grader is logic that scores some aspect of the agent’s performance.

Source: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), Anthropic, 2026-01-09.

- [ ] Outcomes are checked in the environment, not only in the transcript. The same article gives an example of what that means:

> the outcome is whether a reservation exists in the environment’s SQL database.

- [ ] Objectives are written as SLOs with a measured indicator. The SRE book gives the definition:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.

Source: [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) (the book appeared in 2016; the web page is undated).

- [ ] A baseline exists to compare against, so improvement can be shown.

## Worked example: the check before the first run

The current demo has an agent check or plan view: for an example process it lists the tools, policies and budget the agent would use before its first run. That is the readiness idea in miniature: before anything runs, a reader can see what the agent may touch and what limits apply, and then decide.

![Agent overview in the openagentix demo with example data: tools, required human approval, approvers and budget limits before the first run](/images/blog/agent-platform-readiness-checklist-2.png)

*Screenshot of the current demo (fake data).*

## Using the checklist

1. **Score honestly.** If you cannot show evidence for an item, it is a 0.
2. **Set a threshold.** For a production launch, require at least 3 of 4 on security, operations and evaluation, and a plan for the rest.
3. **Assign owners and dates** to every unchecked box.
4. **Repeat** after any change of model, tool set or autonomy level, and at least quarterly.
5. **Keep the record** with the architecture decision records, so the next reviewer sees what was accepted and why.

## Key takeaways

- Readiness spans six areas: architecture, skills, security, operations, cost and evaluation.
- Judge by the weakest axis, not the average.
- Every item needs evidence; "probably" is a zero.
- Test the stop switch, revocation and replay; documentation alone is not readiness.
- Re-run the checklist when the model, tools or autonomy change.

## Sources

- OWASP Gen AI Security Project, [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), 2025-12-09.
- NIST, [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework).
- Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-01-09.
- Google, [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/).
