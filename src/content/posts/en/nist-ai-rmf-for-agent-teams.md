---
ref: nist-ai-rmf-for-agent-teams
lang: en
title: "NIST AI RMF for agent teams: Govern, Map, Measure, Manage in practice"
description: "The NIST AI RMF is voluntary and has four functions. How agent registries, data-flow maps, evals, traces and policies map to Govern, Map, Measure, Manage."
date: 2026-07-23T09:00:00Z
tags: [governance, risk, compliance]
---

The NIST AI RMF is a voluntary framework that gives teams a shared vocabulary for AI risk, organised into four functions: Govern, Map, Measure and Manage. For a team running agents it is most useful as a checklist of questions, and most of the answers are things a platform already produces: a registry of agents, a map of data flows, evaluation results, traces and enforced policies. This post shows the mapping and how to start small.

## What the framework is, and is not

NIST describes the AI RMF as optional guidance:

> The NIST AI Risk Management Framework (AI RMF) is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations

Source: [NIST, AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) (AI RMF 1.0 released 2023-01-26).

Three things follow from that. It is not a law and not a certification; nobody audits you against it unless you or a customer decide so. It is deliberately general, so it applies to a spam filter as much as to an agent. And that generality is exactly why it needs translation into your own setting: the framework says *what kind of thing* to do, your platform decides *how*.

NIST has also published a profile for generative AI, [NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), which applies the framework to generative systems (published 2024-07-26). Read it alongside the core framework if your agents are built on generative models. This post uses only the four-function structure and does not reproduce the profile's content.

## The four functions in agent terms

![NIST AI RMF functions mapped to agent platform artefacts](/images/blog/nist-ai-rmf-for-agent-teams-1.svg)

| Function | Core question | Agent platform artefact |
| --- | --- | --- |
| Govern | Who decides, and by which rules? | Policies, owners, approval rules, roles |
| Map | What do we have, where does it run, what can it touch? | Agent registry, data-flow map, tool and context inventory |
| Measure | How do we know it works and how it fails? | Evals, traces, cost and error metrics |
| Manage | What do we do about the risks we found? | Gates, rollbacks, incident response, retirement |

The four are not a sequence. They run continuously and feed each other: measurement finds a problem, management fixes it, governance updates the rule, mapping records the new state.

## Govern: decisions, owners and rules

Governance is about accountability. For an agent platform it becomes concrete as:

- **An owner for every agent.** A named team that answers for behaviour, cost and change.
- **Written policies** on which data classes agents may handle, which tools need approval and which actions are never automatic.
- **Roles.** Who may deploy an agent, who may approve a risky action, who may change a policy.
- **Enforcement, not just documents.** A policy that a gate checks before a tool call is stronger than one in a wiki. See [policy decides, audit proves](/posts/policy-decides-audit-proves/) for the pattern.

A quick test: pick any agent and ask who would be paged if it misbehaved tonight. If nobody can answer, Govern has a gap.

## Map: know what you run

You cannot manage what you have not listed. The mapping work for agents is largely an inventory:

- **Registry.** Each agent with purpose, owner, version, model, tools, credentials and environment.
- **Data flow.** What data enters (documents, tickets, user messages), what is sent to which model provider, what leaves (messages, writes to systems).
- **Context.** Which instructions, skills and retrieved material shape behaviour.
- **Impact.** What a failure would mean for people and for the business, per agent.

A registry entry can be small:

```yaml
agent: refund-triage
owner: payments-support
purpose: classify refund requests and draft a response for review
model: provider-a/model-small
tools: [tickets.read, crm.read, tickets.comment]
data: [customer-contact, order-history]
sends-data-to: provider-a (EU region)
human-approval: comment is posted only after review
last-reviewed: <date>
```

Mapping also records what you do not know yet, such as dependencies on third-party skills or on models whose behaviour changes without notice.

## Measure: evidence instead of impressions

Measurement turns "it seems fine" into numbers you can compare over time:

- **Evals** on representative tasks with expected outcomes, run on every change to model, prompt, skill or tool. [Agent evals 101](/posts/agent-evals-101/) explains how to start with a small set.
- **Traces** of real runs: which steps happened, which tools were called, how long they took, what they cost.
- **Operational metrics:** error rate, retries, approval rate and rejection rate, budget use.
- **Security tests**, including adversarial cases for prompt injection and tool misuse. For a catalogue of attack types, NIST also publishes a taxonomy of adversarial machine learning, which it presents as follows: "provides a taxonomy of concepts and defines terminology in the field of adversarial machine learning (AML)." ([NIST AI 100-2 E2025](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), 2025-03-24). It focuses on attacks on machine learning systems and is a useful vocabulary for the test plan, though it is not a list of agent-specific controls.

Be honest about what measurement can show. A passing eval suite says the agent handles the cases you thought of. It does not prove the absence of other failures.

## Manage: act on what you found

Management closes the loop. For each identified risk there should be a response:

- **Prevent** with structural controls: least privilege, sandboxing, approvals. The [OWASP agentic top 10 mapped to platform controls](/posts/owasp-agentic-top-10/) is a good source of candidates.
- **Detect** with alerts on budgets, error spikes, denied actions and unusual tool use.
- **Respond** with a runbook: how to pause an agent, revoke its credentials and roll back its changes.
- **Retire.** Agents and skills that nobody owns or uses are removed, not left running.
- **Accept explicitly.** Some risks stay. Record who accepted them, why and until when.

## A lightweight way to start

Teams often stall because the framework looks large. Start with a one-page version:

1. Build the registry for the agents you already run. One row each.
2. For each agent, assign an owner and list its tools and data.
3. Pick the three agents with the highest impact and write ten eval cases for each.
4. Turn on traces and keep them for a defined period.
5. Write one page of policy: data classes, approval rules, incident contact.
6. Review everything quarterly, and after every incident.

That already covers the four functions in a thin but real form, and you can deepen each part as the number of agents grows.

## Using it for audits and customers

Because the framework is a common vocabulary, it helps in conversations with security teams, auditors and customers: "our agent registry covers Map, our eval suite and traces cover Measure". Present it as a way of organising your evidence, not as a claim of conformance. Unless you have been assessed by someone qualified to do so, say "aligned with" or "uses as a reference", not "compliant with".

## Key takeaways

- The NIST AI RMF is voluntary and general; value comes from translating it to your platform.
- Govern: owners, roles and enforced policies. Map: registry, data flows, context. Measure: evals, traces, metrics. Manage: gates, response, retirement, explicit risk acceptance.
- Most evidence already exists in a good agent platform; the work is collecting and reviewing it.
- Start with a one-page version and deepen it as the agent count grows.
- Describe your use of the framework accurately; alignment is not certification.

## Sources

- [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST, AI RMF 1.0 released 2023-01-26.
- [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1)](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), NIST, 2024-07-26.
- [AI 100-2 E2025, Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), NIST, 2025-03-24.
