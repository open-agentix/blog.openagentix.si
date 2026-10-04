---
ref: what-is-mcp
lang: en
title: "What is the Model Context Protocol? A plain explanation for platform teams"
description: "What is MCP? The Model Context Protocol standardises how an agent host finds and calls tools, resources and prompts on servers. Plain guide for platform teams"
date: 2026-03-05T09:00:00Z
tags: [mcp, explainer, architecture]
---

What is MCP? The Model Context Protocol is an open standard for how an AI application discovers and
uses capabilities that live outside the model: tools it can call, data it can read and prompt
templates it can offer. An application (the **host**) runs one **client** per **server**, and the
two exchange JSON-RPC messages. MCP is a transport and a vocabulary. It is not a security boundary,
and treating it as one is the most common misunderstanding.

![Model Context Protocol architecture with host, client and server](/images/blog/what-is-mcp-1.svg)

## The problem MCP solves

Before a shared protocol, every AI application wrote its own connector for every system: one
integration for the issue tracker, another for the database, another for the file store, repeated
for each application. Anthropic announced MCP in November 2024 with exactly this argument:

> It provides a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol.
>
> — Anthropic, [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

For a platform team the gain is the same as with any standard interface: a connector written once
can serve several agent applications, and an agent application can use connectors it did not write.
The cost is that a connector is now an attack surface shared by many.

## Hosts, clients and servers

Three roles appear in the specification.

- **Host.** The application the user runs: a coding assistant, a chat application or an agent
  platform. It owns the model conversation, the user interface and the decisions about what is
  allowed.
- **Client.** A component inside the host that keeps one connection to one server. A host with three
  servers runs three clients.
- **Server.** A program that exposes capabilities. It can run locally as a child process or remotely
  over HTTP, and it can wrap anything: a database, a ticket system, a search index.

Messages are JSON-RPC. The client asks the server what it offers, the host presents that to the
model, the model asks for a call, and the host (through the client) sends the request and returns
the result.

## The three primitives

Servers expose three kinds of things.

- **Tools** are functions the model can ask to run. They can have side effects.
- **Resources** are data the host can read and add to the context, such as files or records.
- **Prompts** are templates a user can pick, for example a standard review request.

Tools get most of the attention because they act. The sibling post
[Tool, skill or prompt?](/posts/tool-skill-or-prompt/) explains why tools carry the risk that the
other two mostly do not.

## What the specification says about consent

The specification does not stop at the wire format. It states principles about trust and safety,
and the first is about people:

> Users must explicitly consent to and understand all data access and operations
>
> — Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

On tools it is more pointed:

> Tools represent arbitrary code execution and must be treated with appropriate caution.
>
> — Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

And in the tools section:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

Note who these requirements address. The specification says *hosts* should obtain consent and
*clients* should treat annotations with suspicion. The protocol carries the messages. It does not
enforce the rules. Those are obligations on the implementer, and nothing in the wire format stops a
host that ignores them.

## Why MCP is a transport, not a security boundary

Three things follow from that.

1. **Annotations are claims.** A tool can describe itself as read-only. The specification says how
   to read that:

   > clients MUST consider tool annotations to be untrusted unless they come from trusted servers.
   >
   > — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

   A server you did not write can claim anything, so its self-description cannot be the control.
2. **Tool results are input.** Text returned by a tool enters the model's context. A hostile page,
   ticket or document can contain instructions. The protocol does not separate data from commands.
3. **A user prompt is a weak gate.** "Click allow" works for a few calls and fails at scale, because
   people stop reading. A decision that matters has to be made by something deterministic.

So the security work happens around MCP, in the host and the platform: which servers may be
connected, which tools of which server an agent may see, what arguments are acceptable, and what
gets recorded. That is the job of a policy gate in the harness; see
[What is an agent harness](/posts/what-is-an-agent-harness/) for where it sits, and
[Agent architecture is not application architecture](/posts/agent-architecture-is-not-application-architecture/)
for why it has to be designed in rather than bolted on.

## A practical checklist for platform teams

- **Inventory servers.** Know every MCP server in use, who owns it and where it runs. Treat adding
  one like adding a dependency with network access.
- **Pin and review.** Pin the server version, read what its tools do and keep a copy of the review.
- **Grant per agent.** Do not expose all tools of a server to all agents. A tool that is not granted
  should not appear in the model's tool list at all.
- **Constrain arguments.** A tool that accepts any string is harder to govern than one with a
  pattern and a length limit.
- **Separate trust levels.** Keep servers that read untrusted content apart from servers that can
  write or send.
- **Authenticate remote servers.** For remote servers use the authorization mechanisms in the
  specification rather than shared static keys, and keep credentials out of prompts.
- **Log every call.** Server, tool, arguments, decision, result size and who acted for whom.

## What MCP does not give you

- No identity model for agents beyond what you add around it.
- No budget, rate or cost control.
- No guarantee that a server behaves as described.
- No answer to prompt injection. The protocol carries the text that injection lives in.

None of this is a flaw in the protocol. It is a statement of scope. A standard for connecting things
is valuable because it is small, and the controls belong to the platform that uses it. An open
platform such as open-agentix can use MCP servers as tool providers while keeping the decision about
each call in its own gate.

## Key takeaways

- MCP standardises how a host discovers and calls tools, resources and prompts exposed by servers.
- Roles: host (the application), client (one connection per server), server (the capability provider).
- The specification asks for consent and caution, but it places those obligations on implementers.
- MCP is a transport, not a security boundary: treat annotations and results as untrusted input.
- Put server inventory, per-agent grants, argument constraints and logging in the platform.

## Sources

- Anthropic, [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) (2024-11-25)
- Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)
- Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
