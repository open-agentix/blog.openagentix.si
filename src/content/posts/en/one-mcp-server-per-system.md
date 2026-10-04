---
ref: one-mcp-server-per-system
lang: en
title: "One MCP server per system: MCP server design you can govern"
description: MCP server design rules for governable agents. One small server per system, namespaced tools, and read/write separation instead of one giant gateway.
date: 2026-04-16T09:00:00Z
tags: [mcp, architecture, how-to]
---

**MCP server design** has one rule that pays off more than any other: build one small server per
system. A server that wraps ten applications concentrates every credential in one process, blurs every
permission boundary and gives the model a huge tool list to choose from. Small single-system servers
with namespaced tools and a clean split between read and write tools are easier to secure, review,
version and switch off. If you are new to the protocol, start with [what is MCP](/posts/what-is-mcp/).

## The "Swiss army knife" server and why it hurts

It is tempting to write one integration server that talks to the CRM, the ticket tracker, the wiki, the
repository host, the calendar and the mail system. One deployment, one config, one thing to connect.
The costs show up later:

- **Credential concentration.** The server holds ten sets of credentials. One bug or one injection that
  reaches it exposes all of them.
- **Blurred permissions.** The tool `search` might read tickets or send mail. Policy cannot tell which
  without understanding the arguments.
- **Large tool lists.** Dozens of tools with overlapping descriptions cost context tokens on every turn
  and make wrong tool choices more likely. See [writing tools agents can
  use](/posts/writing-tools-agents-can-use/).
- **Coupled releases.** A change to the mail tools forces a redeploy of the CRM tools.
- **No clean off switch.** Disabling the wiki means editing a shared server.

![Monolithic MCP server versus one server per system](/images/blog/one-mcp-server-per-system-1.svg)

## Design rules for governable servers

### 1. One server, one system, one credential

Each server fronts exactly one backend, holds exactly one credential for it, and runs as its own
process or container. A leak then costs one system. You can also give each server its own network
policy, resource limits and owner. Secrets handling for such servers is covered in [secrets for
agents never belong in the context window](/posts/secrets-for-agents/).

### 2. Namespace the tools

Prefix tool names with the system and the kind of operation: `tickets_search`, `tickets_add_comment`,
`wiki_read_page`. Anthropic's guidance on tool design recommends this:

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.
>
> [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (Anthropic, 2025)

Namespaces help the model choose, and they help policy too: a rule such as "allow `tickets_*` read tools
for the research agent" is easy to write and easy to audit.

### 3. Separate read from write

Split each system into a read server (or a read tool set) and a write tool set with different
grants. Reading is usually safe to automate; writing needs argument constraints, call limits and
sometimes approval.

```text
tickets-read    tickets_search, tickets_get            read-only token, no approval
tickets-write   tickets_add_comment, tickets_create    narrow token, approval for create
```

With this split, the agent that triages tickets can hold only `tickets-read`, so a hijacked triage
agent cannot write anything. This is the same decomposition idea as in [least privilege for
agents](/posts/least-privilege-for-agents/).

### 4. Keep tools small and typed

Prefer many narrow tools with strict JSON schemas over one tool with a free-form `query` string. Give
every argument a type, a pattern or a length limit. A tool that accepts only a ticket key in the form
`SEC-123` cannot be talked into reading something else.

### 5. Make dangerous tools obvious

The protocol specification is blunt about the risk:

> Tools represent arbitrary code execution and must be treated with appropriate caution.
>
> [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18) (Model Context Protocol)

Mark tools that delete, send or pay in their names and descriptions, require approval for them in your
policy, and never rely on the model to decide whether an action is risky.

## Consent and visibility

The same specification lists principles for hosts, including this one:

> Users must explicitly consent to and understand all data access and operations
>
> [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18) (Model Context Protocol)

Small servers make that practical. When a server touches one system, the consent prompt can say
precisely what it does ("read tickets in project SEC"), and an administrator can review a short tool
list rather than a sprawling one. When an agent also needs to be isolated from the others, that
connects to the broader point in [agent architecture is not application
architecture](/posts/agent-architecture-is-not-application-architecture/): agents are separate
principals with their own permissions, not features of one big application.

## Lifecycle: treat each server as a managed asset

A research survey of the MCP landscape frames servers as things with a life of their own:

> We first define the full lifecycle of an MCP server, comprising four phases (creation, deployment, operation, and maintenance)
>
> [Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions](https://arxiv.org/abs/2503.23278) (arXiv, 2025)

One server per system maps neatly onto that lifecycle. Each has an owner, a version, a changelog, a
deployment and a retirement date. A monolith blurs all four.

## A short design checklist

```text
[ ] Does this server talk to exactly one system?
[ ] Is there exactly one credential, scoped to what the tools need?
[ ] Are tool names prefixed with the system?
[ ] Are read and write tools separate, with separate grants?
[ ] Do all arguments have types, patterns or limits?
[ ] Are destructive tools marked and behind approval?
[ ] Does the server have an owner, a version and a way to turn it off?
```

## Trade-offs

More servers mean more processes to deploy and monitor, and some tasks span systems. The answer is to
orchestrate across servers in the agent layer, with explicit hand-offs between agents that each hold
one or two servers, instead of merging the servers. Shared code, such as an auth library or a schema
helper, belongs in a package, not in a shared process. For a very small setup, a single server with
two or three tools is fine; the rule is about not accumulating unrelated systems and credentials in
one place.

## Key takeaways

- One MCP server per system, with one credential, keeps leaks and mistakes small.
- Namespace tool names and separate read from write tools with different grants.
- Strict argument schemas and approvals for destructive tools do the real governance work.
- Small servers make consent prompts, reviews and off switches practical.
- Give every server an owner, a version and a lifecycle.

## Sources

- [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents), Anthropic, 2025-09-11.
- [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18), Model Context Protocol.
- [Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions](https://arxiv.org/abs/2503.23278), arXiv, 2025.
