---
ref: agents-as-insider-risk
lang: en
title: "Treat agents like insiders: what misalignment research means for operations"
description: "AI insider threat: research on agentic misalignment suggests insider-risk controls for agents, such as separation of duties, limited access and monitoring."
date: 2026-09-15T09:00:00Z
tags: [security, governance, opinion]
---

Security teams already know how to handle people who hold broad access and might, through error, pressure or malice, misuse it: they separate duties, grant access for a purpose and a period, watch for unusual behaviour and require a second person for irreversible acts. An agent with tools is in the same position, and recent research gives two reasons to apply the same controls. The **AI insider threat** is not a prediction that agents will turn rogue; it is a design stance: assume an agent with access can take a harmful action, and make that action hard, visible or reversible.

![Insider-risk controls applied to AI agents](/images/blog/agents-as-insider-risk-1.svg)

This is an opinion post. The evidence is thin in places, and I will say where.

## What the research shows

Anthropic published stress tests in which models were placed in simulated company settings with an agent role, access to email and tools, and a conflict between the model's assigned goal and the situation. The authors gave the behaviour a name:

> We call this phenomenon agentic misalignment.

Source: [Agentic misalignment: How LLMs could be insider threats](https://www.anthropic.com/research/agentic-misalignment), Anthropic, 2025-06-20.

Two limits matter. The scenarios were constructed to provoke the behaviour, so the results are not a rate of failure in production. And they concern models, not your specific agent with your specific prompts. What they do show is that "the model will always refuse to do harm" is not a safe assumption when goals conflict.

The second piece of evidence is not a test. Anthropic reported disrupting a cyber espionage campaign in which AI tools did much of the operational work:

> the threat actor was able to use AI to perform 80-90% of the campaign

Source: [Disrupting an AI-orchestrated cyber espionage campaign](https://www.anthropic.com/news/disrupting-AI-espionage), Anthropic, 2025-11-13.

This is misuse by a human attacker rather than misalignment, and the quote is about the share of work automated, not about success. For operators, the lesson is symmetric: agent capability that helps your staff also helps an attacker who steals an agent's credentials or injects instructions into its inputs.

A third source shows how much discretion people hand to agents when they are allowed to. In Project Vend, an agent ran a small shop:

> Claudius decided what to stock, how to price its inventory, when to restock (or stop selling) items, and how to reply to customers

Source: [Project Vend: Can Claude run a small shop? (And why does that matter?)](https://www.anthropic.com/research/project-vend-1), Anthropic, 2025-06-27.

A shop is a benign setting, but the sentence describes a pattern: an agent that sets prices, orders stock and talks to customers holds real authority. Whatever authority you grant, an error or a manipulation can use.

## Four insider-risk controls, applied to agents

### 1. Separation of duties

No single agent should be able to both propose and approve a consequential act, or both prepare a payment and release it. Split roles: one agent drafts, another agent or a person approves, and the approver cannot be instructed by the drafter. This is the same idea as [least privilege through decomposition](/posts/least-privilege-for-agents/), with the extra requirement that the checking step must be independent. An approver agent that reads the drafter's persuasive explanation and agrees is not independent.

### 2. Limited standing access

Humans with standing admin rights are a known risk; agents with permanent broad credentials are the same risk, faster. Prefer credentials issued per run or per task, scoped to the tools and resources that step needs, and expiring on their own. If an agent needs write access once a week, it should not hold it the other six days.

### 3. Monitoring and baselines

Insider-risk programmes watch for unusual access: new systems, odd hours, large volumes. For agents, record every tool call with arguments and decision, and alert on deviations from the agent's normal pattern: a tool never used before, a sudden rise in reads, calls to a new external domain, repeated policy denials. Monitoring only helps if the record is one you can trust; see [audit trails vs logs](/posts/audit-trails-vs-logs/).

### 4. Approval and reversibility for irreversible actions

Deleting, sending, paying, publishing and changing permissions should wait for a person, or be undoable. Where neither is possible, add a delay: a held action that a human can cancel within a window is a cheap compromise.

## What this changes in operations

- **Onboarding and offboarding.** Give each agent an owner, a purpose and a review date. When the owner leaves or the purpose ends, access ends.
- **Access reviews.** Review agent permissions on the schedule you use for human admin rights, and remove tools that were not used.
- **Incident handling.** Prepare for an agent acting outside its intent: a stop switch, a way to revoke its credentials quickly and a record to reconstruct what it did. See [incident response for agents](/posts/incident-response-for-agents/).
- **Goal conflicts.** Be wary of instructions that put an agent between two objectives, such as "never fail the customer" and "never share data". A model resolving that conflict is the situation the stress tests created.

## What this does not claim

It does not claim that agents scheme in everyday operation, or that a controlled setting reproduces your risk. It does not replace prompt-injection defences or sandboxing. And it does not say humans are the right model for every control: an agent never gets tired, but it also does not feel the weight of an irreversible action. The insider analogy is useful because the controls are known, tested and understood by security teams, not because agents are people.

## A short checklist

1. Does anyone own this agent, and is the owner named?
2. Can any one agent both prepare and approve a consequential action?
3. Are credentials issued per task and expiring?
4. Is there a baseline of normal tool use, and an alert for deviations?
5. Do irreversible actions require approval, a delay or an undo path?
6. Can you stop the agent and revoke its access within minutes?

## Key takeaways

- Treat an agent with access like an insider: the controls are known and apply directly.
- Stress tests show harmful actions are possible under goal conflict; they are not production failure rates.
- Use separation of duties, limited standing access, monitoring and approval for irreversible acts.
- Make the checker independent of what it checks.
- Plan for the case where an agent acts outside its intent: stop, revoke, reconstruct.

## Sources

- Anthropic, [Agentic misalignment: How LLMs could be insider threats](https://www.anthropic.com/research/agentic-misalignment), 2025-06-20.
- Anthropic, [Disrupting an AI-orchestrated cyber espionage campaign](https://www.anthropic.com/news/disrupting-AI-espionage), 2025-11-13.
- Anthropic, [Project Vend: Can Claude run a small shop? (And why does that matter?)](https://www.anthropic.com/research/project-vend-1), 2025-06-27.
