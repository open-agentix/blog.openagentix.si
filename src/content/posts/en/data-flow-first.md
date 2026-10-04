---
ref: data-flow-first
lang: en
title: "Draw the data flow before you write the first prompt"
description: "An agent data flow diagram shows where untrusted data enters, where private data lives and where anything leaves. One-page template for trifecta risks."
date: 2026-05-21T09:00:00Z
tags: [architecture, security, how-to]
---

An agent data flow diagram is a one-page drawing of where data enters an agent system, where private data lives, where anything can leave, and which parts you trust. Draw it before you write the first prompt. Security in agent systems is decided mostly by that picture: if untrusted content, private data and an outbound channel meet in one agent, no prompt can reliably fix it. If they are separated by design, a prompt injection becomes a nuisance instead of an incident. This post gives a template and a set of questions to ask of the diagram.

## Why the data flow decides the security

Agents mix instructions and data in the same channel: the model's context. Anything that reaches the context can influence behaviour, including text from a web page, an email or a ticket. That makes the question "what can reach the model, and what can the model reach?" the central one.

Simon Willison named the dangerous combination, and his summary of the consequence is blunt:

> Failing to understand this can let an attacker steal your data.
>
> — Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

The three ingredients are access to private data, exposure to untrusted content and the ability to communicate externally. Each is useful on its own. Together they allow an attacker who controls a piece of content to make the agent read your data and send it out. His advice for the case where all three are present is just as clear:

> The only way to stay safe there is to avoid that lethal trifecta combination entirely.
>
> — Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

The [lethal trifecta post](/posts/the-lethal-trifecta/) on this blog goes deeper. The data flow diagram is how you check for it systematically instead of relying on memory.

## The one-page template

Use a simple box-and-arrow drawing with five element types.

![Data flow template with trust boundaries for an agent design](/images/blog/data-flow-first-1.svg)

1. **Sources.** Everything that feeds data in: user input, tickets, emails, web pages, files, databases, tool results. Mark each as trusted or untrusted. A rule of thumb: if someone outside your organisation can write to it, it is untrusted.
2. **Agents and models.** Each agent, with the model it uses and the tools it holds. One box per agent, not one for "the AI".
3. **Stores.** Where private data lives: databases, document stores, secrets, memory the agent writes to. Mark sensitivity (public, internal, personal, secret).
4. **Egress points.** Every way anything can leave: outgoing email, HTTP requests, git pushes, chat messages, file uploads, even links the agent renders that a browser will fetch. If a channel exists, it is an exit.
5. **Trust boundaries.** Dashed lines between zones: outside the organisation, inside it, the agent runtime, the data zone. Every arrow that crosses a boundary needs a reason and a check.

Label each arrow with what flows and in which direction. Add the check on the arrow: validation, policy gate, approval or nothing. "Nothing" is a finding.

A text version works too and diffs well in review:

```text
source:  ticket-body        trust: untrusted   -> agent: research
source:  runbook            trust: trusted     -> agent: research
agent:   research           tools: tickets.read, crm.read
store:   crm                sensitivity: personal
agent:   research           -> agent: action  via: typed JSON handover
agent:   action             tools: jira.create_issue (approval required)
egress:  jira.create_issue  destination: internal tracker
```

## Questions to ask of the diagram

Walk the diagram with these questions.

1. **Where does untrusted data enter?** List every entry point. Include indirect ones such as a document a user uploads or a page a tool fetches.
2. **Which agents see untrusted data?** Those are the agents an attacker can talk to.
3. **Do any of them also reach private data?** If yes, that agent holds two legs of the trifecta.
4. **Do any of them also have an egress?** If yes, you have all three in one place. Split the agent, remove a leg, or put an approval on the egress.
5. **What does each egress carry, and where does it go?** Be literal: a "fetch URL" tool is an egress, because the URL can encode data.
6. **What crosses each trust boundary, and who checks it?** Prefer checks in code over checks in prompts.
7. **What is the blast radius of each agent?** Assume it is compromised: what is the worst thing it could do with its tools?

Question 4 is the one that most often finds a design problem. A common pattern is a "research assistant" that reads the web, has access to company documents for context and can send email to summarise. All three legs in one agent.

## What to do with a finding

You have four options, in rough order of strength:

- **Remove a leg.** The agent that reads untrusted content gets no private data, or no egress.
- **Split the agent.** One agent reads untrusted content and outputs a typed, validated result. A second agent, which never sees the raw content, uses it. This matches [least privilege through decomposition](/posts/least-privilege-for-agents/).
- **Constrain the flow.** Use a design pattern that keeps untrusted data out of control flow, as described in [prompt injection design patterns](/posts/prompt-injection-design-patterns/).
- **Add a human gate.** Put an approval on the egress, showing the exact content that leaves.

The second and third options rest on the same idea. The CaMeL research states the property it aims for:

> the untrusted data retrieved by the LLM can never impact the program flow.
>
> — [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813), arXiv

Your diagram shows where that separation has to hold. Document the decision next to the diagram, including what you accepted and why.

## Link the diagram to threat modeling and data security

The diagram is also the input to a normal threat model. Walk each boundary and ask what could go wrong with spoofing, tampering, disclosure and misuse. For the data itself, agencies publish practical guidance. CISA's document on AI data security describes the scope of its advice this way:

> It outlines key risks that may arise from data security and integrity issues across all phases of the AI lifecycle
>
> — CISA, [AI Data Security: Best Practices for Securing Data Used to Train & Operate AI Systems](https://www.cisa.gov/resources-tools/resources/ai-data-security-best-practices-securing-data-used-train-operate-ai-systems)

Use it to check the "stores" part of your diagram: provenance, integrity, access control and handling of sensitive data.

## Keep it alive

A diagram that is drawn once and forgotten is a historical artefact. Keep it in the repository, review it in the same pull request as any change that adds a tool, a source or an egress, and compare it with reality: does the actual configuration match the picture? Architecture work like this belongs before the first prompt, as argued in [architecture before prompts](/posts/architecture-before-prompts/).

## Limits

A diagram shows intended flows. It does not show what a tool really does internally, or side channels such as timing and rendered links. Treat it as a way to find the biggest problems early, not as proof of safety. It also cannot say how likely an attack is, only what an attack could reach.

## Key takeaways

- Draw sources, agents, stores, egress points and trust boundaries on one page before writing prompts.
- Mark every source as trusted or untrusted and every store by sensitivity.
- Look for any agent that combines untrusted content, private data and an egress; split it or remove a leg.
- Prefer checks in code at trust boundaries over instructions in prompts.
- Keep the diagram in version control and update it with every change to tools or sources.

## Sources

- Simon Willison: [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- CISA: [AI Data Security: Best Practices for Securing Data Used to Train & Operate AI Systems](https://www.cisa.gov/resources-tools/resources/ai-data-security-best-practices-securing-data-used-train-operate-ai-systems)
- arXiv: [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813)
