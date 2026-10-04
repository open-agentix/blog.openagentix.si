---
ref: mcp-and-a2a
lang: en
title: "MCP vs A2A: tools for agents versus agents talking to agents"
description: "MCP vs A2A: MCP connects an agent to tools and data, A2A connects agents to each other. Where each fits, what neither covers and why governance sits above both."
date: 2026-08-18T09:00:00Z
tags: [mcp, multi-agent, comparison]
---

MCP and A2A solve different problems and are not competitors. The Model Context Protocol (MCP) connects one agent to tools and data. The Agent2Agent protocol (A2A) is meant for communication between agents, including agents built on different stacks. Picture MCP as the vertical connection from an agent down to what it can use, and A2A as the horizontal connection between agents. Neither one decides who may do what; that policy layer has to sit above both. This post explains where each fits, what neither covers and how to think about governance.

## What MCP is for

Anthropic introduced MCP in November 2024 with this description:

> It provides a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol.

Source: [Introducing the Model Context Protocol, Anthropic](https://www.anthropic.com/news/model-context-protocol). In practice, an MCP server exposes tools, resources and prompts, and an MCP client inside the agent harness discovers and calls them. The agent is the client; the server wraps a system such as a ticket tracker, a database or a file store. If you want a refresher, see [what is MCP](/posts/what-is-mcp/).

The key point for this comparison: MCP is about **an agent using capabilities**. The relationship is asymmetric. The server does not reason about goals; it executes the call and returns a result.

## What A2A is for

Google announced A2A in April 2025 and described its purpose like this:

> The A2A protocol will allow AI agents to communicate with each other, securely exchange information, and coordinate actions

Source: [Announcing the Agent2Agent Protocol (A2A), Google for Developers Blog](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/). The scenario is an agent that needs help from another agent, possibly operated by a different team or vendor and built with a different framework. Instead of exposing a single function, the other side is an autonomous peer with its own reasoning, its own tools and its own policies. The calling agent delegates a task and receives results, without needing to know how the peer works inside.

## Side by side

| | MCP | A2A |
| --- | --- | --- |
| Connects | agent and tools or data | agent and agent |
| Direction in a diagram | vertical (down to capabilities) | horizontal (between peers) |
| Counterpart | a server wrapping a system | another agent with its own reasoning |
| Typical unit of work | one call with arguments and result | a delegated task that may take time |
| Main risk | tool misuse, poisoned tool data | delegated authority, untrusted peer output |

![MCP and A2A shown as vertical and horizontal connections](/images/blog/mcp-and-a2a-1.svg)

The vertical/horizontal picture is a simplification. A peer agent reached through A2A will itself use MCP servers to do its work. And an MCP server can be implemented with a model behind it, which blurs the line. The useful question is not "which protocol is the right one" but "am I giving an agent a capability, or handing a task to another decision-maker?"

## Do you need A2A at all?

Often not. If all your agents run inside one platform and one organisation, an internal handover mechanism with typed contracts may be simpler than a cross-vendor protocol; see [handovers and contracts](/posts/handovers-and-contracts/). And before splitting work across agents at all, check whether [multi-agent is worth it](/posts/when-multi-agent-is-worth-it/) for your case; a single agent with good tools is frequently enough.

A2A becomes interesting when agents belong to different owners: a supplier's agent, a partner's service, a department with its own stack. There, an agreed protocol for discovery, task exchange and results saves you writing a custom integration for every pair.

## Ecosystem and governance of the standards

MCP's stewardship has moved to a neutral foundation. The Linux Foundation announced the Agentic AI Foundation in December 2025:

> Its inaugural projects, AGENTS.md, goose and MCP, lay the groundwork for a shared ecosystem of tools, standards, and community-driven innovation.

Source: [Linux Foundation Announces the Formation of the Agentic AI Foundation (AAIF)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation). Anthropic, which created MCP, stated its intention at the same time:

> Since its inception, we’ve been committed to ensuring MCP remains open-source, community-driven and vendor-neutral.

Source: [Donating MCP to the Agentic AI Foundation, Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation). For adopters this matters because a protocol under neutral governance is a safer thing to build on than one controlled by a single vendor. Check the current state of each specification yourself before committing; protocols and their governance change faster than blog posts.

## What neither protocol covers

Protocols define how messages move. They do not define whether a message should be allowed. Both leave these decisions to you:

- **Identity and authorisation.** Which agent, acting for which person, may call which tool or peer, with what scope?
- **Policy on arguments and actions.** Is this payment amount acceptable? Is this recipient on the allowlist? Does this need human approval?
- **Budgets and limits.** How many calls, how much spend, how much time per run or per peer?
- **Audit.** Which calls happened, in which order, on whose authority, with which result?
- **Trust in content.** Text returned by a tool or by a peer agent is untrusted input and can carry injected instructions. Build on tool or peer output only with that in mind.

This is why governance has to sit above both protocols: one policy and audit layer that every MCP call and every agent-to-agent delegation passes through, so the rules do not depend on which protocol happens to carry the message.

## A practical checklist

When you connect an agent to something, ask:

1. Is the other side a **capability** (MCP-style) or a **decision-maker** (A2A-style)?
2. Who owns it, and is there a named contact?
3. What identity does the call carry, and is it the narrowest one that works?
4. Where is the policy gate that sees this call, and does it see both protocols?
5. Are calls and results logged with enough detail to reconstruct a run?
6. What happens when the peer or server is down, slow or wrong?

A minimal policy sketch that applies to both kinds of connection:

```yaml
policy:
  applies_to: [mcp_call, agent_delegation]
  rules:
    - match: { target: "tickets.*", action: "write" }
      require: approval
    - match: { target_type: "external_agent" }
      require: [allowlisted_peer, max_budget_per_task]
    - match: { any: true }
      log: full
```

## Limits of this comparison

The protocols are young and evolving. The table above reflects their stated purposes, not every feature of every version. Verify details against the current specifications, and treat anything that ships as an extension (authentication profiles, streaming, registries) as something to test in your environment.

## Key takeaways

- MCP connects an agent to tools and data; A2A is for agents talking to other agents.
- They complement each other: a peer reached via A2A uses MCP servers for its own work.
- You may not need A2A inside a single organisation or platform.
- Neither protocol decides authorisation, budgets or audit; put one governance layer above both.
- Treat tool results and peer output as untrusted input.

## Sources

- [Announcing the Agent2Agent Protocol (A2A) (Google for Developers Blog, 2025-04-09)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Introducing the Model Context Protocol (Anthropic, 2024-11-25)](https://www.anthropic.com/news/model-context-protocol)
- [Linux Foundation Announces the Formation of the Agentic AI Foundation (AAIF) (2025-12-09)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Donating MCP to the Agentic AI Foundation (Anthropic, 2025-12-09)](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
