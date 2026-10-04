---
ref: owasp-agentic-top-10
lang: en
title: "Reading the OWASP Top 10 for Agentic Applications as a platform team"
description: "How a platform team can turn the OWASP agentic top 10 and related LLM Top 10 entries into controls: least privilege, sandboxing, approvals and audit."
date: 2026-07-21T09:00:00Z
tags: [governance, security, owasp]
---

The OWASP agentic top 10 names the biggest security risks of agent systems; a platform team's job is to turn each risk into a control that holds even when the model is wrong or manipulated. This post shows a practical way to read the list: group the risks by what they let an attacker or a mistake do, then map each group to a control a platform can enforce, with pointers to earlier posts that cover the controls in detail.

## What the list is

OWASP's Gen AI Security Project published a list aimed at agents rather than plain chat models. It describes its purpose like this:

> identifies the most critical security risks facing autonomous and agentic AI systems.

Source: [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) (published 2025-12-09).

The difference from the earlier LLM list matters. A chatbot can say something wrong. An agent can *do* something wrong: call tools, change records, spend money, delegate to other agents. The risks therefore concentrate on what the system is allowed to do and on what can steer it.

A note on method. This post does not reproduce the individual entries or their numbering; use the OWASP page for the exact names and wording. Instead it groups risks into themes that recur in agent incidents, so a platform team can plan controls without memorising a list. Check the mapping against the current text of the list before you use it in an audit.

## A control mapping

![Map from OWASP agentic risks to platform controls](/images/blog/owasp-agentic-top-10-1.svg)

| Theme | What can go wrong | Platform control |
| --- | --- | --- |
| Manipulated goals and instructions | Hostile text in a document, ticket or web page steers the agent | Injection-aware design patterns, separation of trusted and untrusted input |
| Excessive agency | The agent holds more tools, permissions or autonomy than its task needs | Least privilege per agent, tool allowlists |
| Tool misuse | Valid tools called with harmful arguments | Argument constraints, call limits, a policy check before execution |
| Unsafe code and command execution | Generated code or shell commands run with real access | Sandboxing, no ambient credentials |
| Privileged actions without oversight | Irreversible actions happen with nobody looking | Human approval for risky steps |
| Opaque behaviour | Nobody can tell what ran, as whom, and why | Identity per run, complete audit trail |

Each row is covered by a control that does not depend on the model behaving. That is the point.

## Excessive agency and least privilege

The LLM Top 10 entry on excessive agency gives a clear diagnosis:

> The root cause of Excessive Agency is typically one or more of: excessive functionality; excessive permissions; excessive autonomy.

Source: [OWASP, LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).

Each of the three has a platform answer:

- **Excessive functionality** is solved by showing the agent only the tools its step needs.
- **Excessive permissions** is solved by credentials scoped to one tool and one purpose, never a shared admin token.
- **Excessive autonomy** is solved by approval gates and limits on how long and how far a run can go.

[Least privilege for agents](/posts/least-privilege-for-agents/) describes decomposing one powerful agent into several small ones, each with only the capabilities of its step. That is the main structural defence against this whole group.

## Manipulated instructions and prompt injection

The prompt injection entry gives two recommendations that map straight onto platform features:

> Restrict the model’s access privileges to the minimum necessary for its intended operations.

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.

Source: [OWASP, LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).

A platform cannot reliably detect every hostile instruction in text, so it designs for the case where one gets through. [Prompt injection design patterns](/posts/prompt-injection-design-patterns/) lists structural options, such as splitting reading from acting and passing only structured data between steps. [The lethal trifecta](/posts/the-lethal-trifecta/) gives a quick test for the worst case: an agent that combines access to private data, exposure to untrusted content and a way to send data out. Remove one of the three and the most damaging attacks lose their route.

## Code execution and sandboxing

Agents that run code or shell commands extend the attack surface to everything the process can reach. The control is isolation: run such steps in a sandbox with no network by default, a read-only filesystem except a scratch area, no inherited credentials, and resource limits. [Sandboxing agents](/posts/sandboxing-agents/) covers the options and their trade-offs. Treat a sandbox as one layer, not the only one; it limits damage, it does not make bad code good.

## Human approval where it counts

Approval is the control people reach for first and use worst. Asking for confirmation on every step trains reviewers to click through. Use it selectively:

- required for irreversible or externally visible actions (payments, deletions, outbound messages, production changes),
- shown with the exact arguments, not a summary,
- decided by someone with the authority to decide, and recorded,
- absent for read-only steps.

## Making behaviour visible

Several themes share a precondition: you must be able to reconstruct what happened. That needs an identity for every run, a record of every tool call and policy decision, and a way to prove the record was not edited afterwards. The audit side is covered by posts on policy and audit in this blog; the principle is that policy decides before an action and the audit trail proves afterwards.

## How to use the list in practice

1. **Inventory your agents.** For each: tools, credentials, data it can read, actions it can take, who approves.
2. **Walk the themes.** For each agent and each theme, write down the control, who owns it and how you would know it failed.
3. **Mark gaps honestly.** "No control yet" is a useful entry; a vague "covered by the model's training" is not.
4. **Turn controls into tests.** Write a few adversarial test cases per theme, such as a ticket with hostile text or a tool call with an out-of-range argument, and run them on every change.
5. **Review on a schedule.** The list will change, and so will your agents.

## What a top 10 list does not do

A list of risks is a starting point. It does not rank risks for your environment, it does not describe controls in detail, and it does not substitute for testing. Two agents with the same risk can need very different controls depending on the data and actions involved.

## Key takeaways

- The agentic top 10 is about what agents can do and what can steer them, not only what they say.
- Group risks into themes and map each to a control that does not rely on the model behaving.
- Least privilege, argument constraints, sandboxing and approvals cover most of the list structurally.
- Reconstructable behaviour (identity, audit trail) is a precondition for responding to anything.
- Turn the mapping into adversarial tests and review it regularly.

## Sources

- [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), OWASP Gen AI Security Project, 2025-12-09.
- [LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), OWASP Gen AI Security Project.
- [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), OWASP Gen AI Security Project.
