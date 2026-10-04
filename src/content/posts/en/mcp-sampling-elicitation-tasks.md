---
ref: mcp-sampling-elicitation-tasks
lang: en
title: "Beyond tools: MCP sampling, elicitation and tasks"
description: "MCP sampling lets servers request model calls; elicitation asks users for input; tasks track long work. Each moves control and needs its own policy."
date: 2026-09-08T09:00:00Z
tags: [mcp, explainer, governance]
---

Most teams meet the Model Context Protocol (MCP) as a way to expose tools. The protocol does more: a server can ask the client for a model call (**MCP sampling**), ask the user for input (**MCP elicitation**) and, since the November 2025 release, track long-running work as **tasks**. Each of these reverses the usual direction of control, so each needs its own policy. In short: sampling spends your model budget on a server's behalf, elicitation puts a server's question in front of a person, and tasks keep work alive after the request that started it.

![MCP sampling, elicitation and tasks with their control points](/images/blog/mcp-sampling-elicitation-tasks-1.svg)

If you have not used MCP yet, start with [what MCP is](/posts/what-is-mcp/). This post assumes you know clients, servers and tools.

## Sampling: the server asks for a model call

Normally the client's model calls tools on the server. With sampling, the server sends a request back: "please run this prompt through a model and return the answer". The specification describes the point of this design:

> This flow allows clients to maintain control over model access, selection, and permissions while enabling servers to leverage AI capabilities—with no server API keys necessary.

Source: [Sampling, MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling).

That has two consequences. The upside: a server does not need its own model credentials, and the client decides which model answers. The risk: the server's prompt now runs on your account, with your budget, and the answer flows back to a component you may not control.

Questions to answer before enabling it:

- **Which servers may sample at all?** Default to none; allow per server.
- **Who sees the prompt?** A human approval step, or at least a logged copy, makes a server's request visible instead of silent.
- **Which model and which limits?** Pick the model on the client, cap tokens per request and requests per run, and count the spend against the calling agent's budget.
- **What goes back?** Treat the response as untrusted text from a server, not as a trusted instruction. A server can craft prompts that make the model write something that is then used elsewhere.

## Elicitation: the server asks the user

Elicitation lets a server request structured input from the person using the client, for example a missing parameter or a confirmation. It is useful where a tool call lacks a detail only the user knows. It is also a way for a server to put a question in front of a person with the client's credibility attached. The specification draws a hard line:

> Servers MUST NOT use elicitation to request sensitive information.

Source: [Elicitation, MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation).

Practical rules:

- **Show who is asking.** The prompt must name the server, so users can tell a question from your platform from a question from a third-party tool.
- **Refuse requests for secrets.** Passwords, API keys and payment data do not belong in an elicitation form; a client can add a simple check and block fields that look like them.
- **Allow decline and cancel.** A user who says no must not be asked again in a loop.
- **Do not use it as an approval mechanism.** Approvals belong to your policy layer, with roles and a record; see [human in the loop that works](/posts/human-in-the-loop-that-works/).

## Tasks: long-running work as a first-class object

Not every tool call finishes in seconds. Indexing a repository, running a build or waiting for a person to approve something can take minutes or hours. The November 2025 release of the specification added tasks for this. The project's anniversary post puts it briefly:

> Tasks provide a new abstraction in MCP for tracking the work being performed by an MCP server.

Source: [One Year of MCP: November 2025 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/), published 2025-11-25.

Instead of holding a connection open, the client starts work, receives a handle and checks status later. Governance questions follow from that:

- **Identity over time.** Whose authority applies when the task finishes an hour later? If the token has expired or the user has left, the answer should be "stop", not "continue with a stale grant". See [MCP authorization with OAuth](/posts/mcp-authorization-oauth/).
- **Budgets and timeouts.** A task needs its own deadline and spend limit, otherwise a forgotten task is a slow leak.
- **Cancellation.** There must be a way to stop it, and a record that it was stopped.
- **Visibility.** List running tasks per agent and per tenant, the same way you list running agent runs.

## A policy table you can start from

| Feature | Who initiates | What moves | Minimum control |
| --- | --- | --- | --- |
| Sampling | Server | Model spend and prompt content | Per-server allowlist, token cap, logged prompt, spend counted to the caller |
| Elicitation | Server | A question to a person | Server named in the prompt, no sensitive fields, decline allowed |
| Tasks | Client, work lives on server | Time and authority | Deadline, budget, cancel, status listing |

Treat the three features as capabilities that are off until a policy turns them on. If your client library enables them by default, check the defaults.

## What to log

For each sampling request: server, requesting agent, model, token counts, and whether a person approved. For each elicitation: server, the fields asked, the answer or "declined". For each task: id, owner, start, status changes, end and the identity used. These records are what lets you answer "why did this server spend our tokens?" a week later.

## Version and compatibility notes

The links above point to the 2025-06-18 specification pages for sampling and elicitation, and to the project's own post for the 2025-11-25 release, which introduced tasks. Features and wording may differ between spec versions, and not every client or server supports all three. Check what your client implements before designing around it, and test the decline and cancel paths, not only the happy path.

## Key takeaways

- Sampling, elicitation and tasks let servers ask for model calls, user input and long-running work; each shifts control.
- Sampling spends your budget: allowlist servers, cap tokens, log prompts, treat answers as untrusted.
- Elicitation must never request sensitive information, must name the asking server and must allow decline.
- Tasks outlive the request: give them deadlines, budgets, cancellation and an identity that expires.
- Keep all three off by default and enable them per server with a written policy.

## Sources

- Model Context Protocol, [Sampling (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling).
- Model Context Protocol, [Elicitation (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation).
- Model Context Protocol Blog, [One Year of MCP: November 2025 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/), 2025-11-25.
