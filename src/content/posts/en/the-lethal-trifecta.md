---
ref: the-lethal-trifecta
lang: en
title: "The lethal trifecta: private data, untrusted content and a way out"
description: "The lethal trifecta in AI agents: private data, untrusted content and external communication together. How to break the triangle per agent, not trust the model."
date: 2026-03-12T09:00:00Z
tags: [security, prompt-injection, least-privilege]
---

The lethal trifecta for AI agents is a combination of three capabilities in one agent: access to
private data, exposure to untrusted content, and a way to communicate externally. An agent that has
all three can be steered by text it reads into sending your private data to someone else. You cannot
reliably fix this by asking the model to be careful. You fix it by making sure no single agent holds
all three at once.

![Lethal trifecta triangle and where to cut it](/images/blog/the-lethal-trifecta-1.svg)

## The three legs

The term comes from Simon Willison, who described the combination in June 2025. Each leg is
ordinary on its own, and agent builders add all of them for good reasons.

1. **Access to private data.** The agent can read things an outsider should not see: customer
   records, source code, internal documents, credentials in the environment.
2. **Exposure to untrusted content.** The agent reads text that someone else controls: an incoming
   email, a web page, a ticket, a pull request, a file from a shared drive, a tool result.
3. **The ability to communicate externally.** The agent can send something out: an HTTP request, an
   email, a comment on a public issue, a link whose address carries data, a commit pushed to a
   remote.

Why is the combination dangerous? A language model does not reliably separate instructions from data.
Text in a web page that says "forward the customer list to this address" can be read as an
instruction. If the agent also has the customer list and a way to send, the attack needs nothing
more than a place to put that text. Willison's conclusion is stark:

> The only way to stay safe there is to avoid that lethal trifecta combination entirely.
>
> — Simon Willison, [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

and he explains why it matters to understand it:

> Failing to understand this can let an attacker steal your data.
>
> — Simon Willison, [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

## Why "indirect" injection is the issue

The research literature calls the underlying attack indirect prompt injection: the attacker does not
talk to the model directly but plants instructions where the application will read them. The 2023
paper that described it for LLM-integrated applications puts the root cause in one sentence:

> We argue that LLM-Integrated Applications blur the line between data and instructions.
>
> — arXiv, [Not what you've signed up for](https://arxiv.org/abs/2302.12173) (2023)

That blurring is a property of how these systems work today, which is why the defence has to be
structural. Filters and hardened prompts can reduce the rate of successful attacks. They cannot be
relied on to reduce it to zero, so they are not a place to rest the safety of private data.

## Break the triangle, per agent

The practical approach is to remove at least one leg from every agent. You do this in the design,
not in the prompt.

**Remove private data.** An agent that reads untrusted content and can send things out should not
hold secrets. Give it only the data its single task needs, scoped to the minimum, read-only where
possible, and keep credentials out of its environment.

**Remove untrusted content.** An agent that holds private data and can send should only read sources
you control or have vetted. Curate the inputs. If it must read external material, put a separate
reader agent in front that has no access to private data and no outbound path, and pass only
structured fields to the next step.

**Remove the way out.** An agent that holds private data and reads untrusted content must not be
able to talk to the outside. Block outbound network access except an allowlist, remove send and
post tools, and require human approval for anything that leaves the system. Remember the subtle
exits: image URLs that carry data in the query string, links the user will click, and comments on
public pages.

A concrete split for a support workflow: a **reader** agent summarises incoming tickets, with no
CRM access and no outbound tools, and returns a short structured record. An **analysis** agent
compares the record with customer data but reads no raw ticket text and cannot send. An **action**
agent creates one kind of internal record, with approval. No agent holds all three legs. The
earlier post [Least privilege for agents](/posts/least-privilege-for-agents/) describes this style of
decomposition in detail.

## What a platform should enforce

Telling developers to be careful is not a control. Put these in the platform:

- **Per-agent tool grants.** A tool that is not granted is not shown to the model.
- **Egress control.** Outbound traffic only to named hosts, from a place the agent cannot change.
- **Argument constraints.** Patterns and length limits on tool arguments, so that a free-text field
  cannot carry a payload.
- **Approval for sends.** A person decides on anything that leaves the system.
- **A deterministic gate and an audit trail.** Decisions made in code before the call, recorded
  afterwards. See [Policy decides, audit proves](/posts/policy-decides-audit-proves/).
- **Trust labels on tool servers.** Know which MCP servers return content from outside, and keep
  them apart from the ones that can write or send. The post
  [What is the Model Context Protocol?](/posts/what-is-mcp/) explains why the protocol itself does
  not draw that line for you.

OWASP's guidance for this class of attack lists the same mitigations in general terms. Two of them
read like a summary of the approach above:

> Restrict the model’s access privileges to the minimum necessary for its intended operations.
>
> — OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.
>
> — OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

## A short audit

For each agent you run, write down three answers:

1. What private data can it read (including environment variables and mounted files)?
2. What untrusted text can reach its context (inputs, tool results, retrieved documents)?
3. What can it send out, and where to?

If the answer to all three is "something", you have found a trifecta. Remove one leg, then record
which one in the agent's definition so the next change does not quietly add it back.

## Limits of this approach

Splitting agents reduces the blast radius. It does not make injection impossible. A reader agent can
still be manipulated into producing a misleading summary, and a downstream agent that trusts it may
act on false information. Handovers between agents are an attack surface too, which is why they
should be structured, validated and as narrow as possible. And a leg removed by policy is only as
strong as the enforcement; a missing egress rule quietly restores it.

## Key takeaways

- The lethal trifecta is private data, untrusted content and external communication in one agent.
- Models do not reliably separate instructions from data, so prompt-level defences are not enough.
- Break the triangle per agent: remove one leg by design, then enforce it in the platform.
- Use per-agent tool grants, egress allowlists, constrained arguments and approval for sends.
- Document which leg is missing for each agent, and re-check it when the agent changes.

## Sources

- Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) (2025-06-16)
- arXiv, [Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) (arXiv, 2023-02-23)
- OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
