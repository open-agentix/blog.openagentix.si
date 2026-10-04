---
ref: least-privilege-for-agents
lang: en
title: "Least privilege for agents: decomposition instead of one all-powerful agent"
description: One agent with read and write access to everything is a large blast radius. open-agentix splits a process into small agents that each hold only the tools one step needs.
date: 2026-10-04T10:00:00Z
tags: [security, architecture, least-privilege]
---

The simplest way to build an agent for a process is to give it every tool the process touches. A
support workflow might end up with read and write access to the CRM, read and write access to the
issue tracker, read and write access to Git, and an open internet connection. It works in the demo.
It also means that one successful prompt injection, one bad tool argument or one confused model
turn can reach everything at once.

## The principle

> Do not give one agent the permissions of the whole process. Give each agent the minimum
> capabilities its step requires.

Take the example from our concept: a payment-related ticket arrives, the agent should check the
runbook and customer data, decide whether the payment looks suspicious, and create a Jira issue if
necessary. Instead of one agent, the process becomes three:

```text
research   ->   analysis   ->   action
 tickets: read    model only      jira: create issue (approval)
 crm: read        no writes       no CRM, no Git
 runbook: read
```

If the research agent is manipulated by text inside a ticket, it still cannot write anywhere. If
the analysis agent is confused, it holds no tools at all. The action agent can create one kind of
issue and cannot read the CRM. The blast radius of any single agent shrinks to the size of its step.

## How it looks in `agents.md`

An agent definition is a Markdown file with YAML front matter. One file can describe a pipeline of
one or more agents, and each agent lists its own tools with constraints on their arguments. This is
a trimmed version of the `cve-triage` example that ships with the platform:

```yaml
agents:
  - id: triage
    tools:
      - server: cve-db
        tool: lookup_cve
        args:
          cveId:
            type: string
            required: true
            pattern: "^CVE-\\d{4}-\\d{4,}$"
  - id: notify
    tools:
      - server: tickets
        tool: add_comment
        maxCallsPerRun: 1
        args:
          key:
            type: string
            required: true
            pattern: "^SEC-\\d+$"
          comment:
            type: string
            required: true
            maxLength: 2000
pipeline: [triage, notify]
```

The `triage` agent can look up a CVE and nothing else. The `notify` agent can add exactly one
comment, only to tickets whose key matches `SEC-<number>`, and cannot read anything from the CVE
database. A tool that is not granted is not even shown to the model, so there is nothing to talk it
into calling. Calls to a tool with arguments outside the declared shape are denied by the policy
gate, which we describe in the next post.

Dangerous tools can also carry `approval: required`. The run then pauses until a person with the
right role decides.

## Capabilities are not permissions

An agent declaring that it needs a capability does not grant it. In our design, the effective
access is the intersection of what the agent declares, what policy allows, who the acting identity
is and what the environment permits. The platform is the one that decides, not the file that asks.

## What it costs, and what it does not solve

Decomposition is not free.

- **More moving parts.** Three agents mean three sets of instructions, more model calls and more
  places for a hand-off to go wrong. For a task with one tool and one reader, one agent is the
  right answer.
- **Hand-offs are an attack surface.** If the research agent reads hostile text and passes it on as
  free-form prose, the next agent receives that text. Structured hand-offs help: in the example the
  first agent answers with a JSON object of named fields, and the next agent's tool arguments are
  validated by pattern and length. Validation is a mitigation, not a proof.
- **Someone has to choose the split.** The planned *agent check* lets a model propose a
  decomposition, but the proposal is advisory and a human reviews it. A first advisory version is planned for 0.2; the per-agent tool allowlists and argument constraints above exist in version 0.1.0.

Least privilege will not make a bad agent good. It makes a bad day smaller, and it makes the
question "what could this agent have done?" answerable from a file instead of from a guess.
