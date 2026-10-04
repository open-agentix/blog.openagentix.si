---
ref: agent-architecture-is-not-application-architecture
lang: en
title: "Agent architecture is not application architecture: the agentix pattern"
description: Application architecture structures code. Agent architecture decides who may do what at run time. The agentix pattern - one MCP server per system, one agent per step - is our answer.
date: 2026-02-24T09:00:00Z
tags: [architecture, patterns, mcp, governance]
---

Recently we saw a setup in which one MCP server talked to about ten different applications. It
was a Swiss army knife: one process, every credential, every tool, written for exactly one agent
and reusable by nobody. It worked, and it is not what MCP is meant for. This post explains why,
separates two kinds of architecture that are easy to mix up, and proposes a pattern for the second
one. Where something is opinion rather than fact, the text says so.

## Two questions, not one

**Application architecture** decides how code is structured: layers, services, data ownership,
ports and adapters, who calls whom. Those calls are fixed at design time, reviewed in a pull
request and deployed as units that fail independently.

**Agent architecture** decides who may do what at run time, when a model chooses the next step
and that choice is not deterministic. Its subjects are capability boundaries, blast radius, the
trust boundary between model output and real effects, handover contracts, approvals and cost.

The two are orthogonal. A well-layered application can host one agent that holds every
credential, and a messy monolith can sit behind well-scoped agents. They meet at the **MCP
server**: in application terms an adapter that translates a protocol into calls on a system, in
agent terms a capability boundary where a model's request becomes an effect.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd3-en-t oaxd3-en-d" viewBox="0 0 600 452" width="600" height="452"><title id="oaxd3-en-t">Agent architecture and application architecture meet at the MCP server</title><desc id="oaxd3-en-d">Upper band: agent architecture, decided at run time; agents, one per step, call tools through a policy gate with audit. Lower band: application architecture, decided at design time; each system has its own layers. The MCP servers sit on the line between the bands: an adapter in application terms and a capability boundary in agent terms.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd3-en-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><rect x="5" y="5" width="590" height="140" rx="12" class="bx ac dash"/><text x="20" y="30" text-anchor="start" class="h act">agent architecture: who may do what, at run time</text><text x="20" y="52" text-anchor="start" class="s">capabilities, blast radius, approvals, handovers, cost</text><rect x="20" y="68" width="170" height="40" rx="8" class="bx"/><text x="105" y="93" text-anchor="middle" class="s">agents, one per step</text><rect x="210" y="68" width="170" height="40" rx="8" class="bx ac"/><text x="295" y="93" text-anchor="middle" class="s">policy gate + audit</text><line x1="190" y1="88" x2="208" y2="88" class="ln" marker-end="url(#oaxd3-en-a)"/><line x1="5" y1="175" x2="375" y2="175" class="ln dash"/><line x1="295" y1="108" x2="105" y2="153" class="ln" marker-end="url(#oaxd3-en-a)"/><line x1="295" y1="108" x2="285" y2="153" class="ln" marker-end="url(#oaxd3-en-a)"/><rect x="30" y="155" width="150" height="40" rx="8" class="op"/><rect x="30" y="155" width="150" height="40" rx="8" class="bx ac"/><text x="105" y="180" text-anchor="middle" class="h">jira MCP</text><rect x="210" y="155" width="150" height="40" rx="8" class="op"/><rect x="210" y="155" width="150" height="40" rx="8" class="bx ac"/><text x="285" y="180" text-anchor="middle" class="h">crm MCP</text><text x="590" y="170" text-anchor="end" class="s">MCP server: an adapter (app view)</text><text x="590" y="190" text-anchor="end" class="s">and a capability boundary (agent view)</text><rect x="5" y="236" width="590" height="210" rx="12" class="bx dash"/><line x1="105" y1="195" x2="105" y2="270" class="ln" marker-end="url(#oaxd3-en-a)"/><text x="105" y="290" text-anchor="middle" class="h">Jira</text><rect x="30" y="300" width="150" height="24" rx="4" class="bx"/><text x="105" y="317" text-anchor="middle" class="s">API / port</text><rect x="30" y="328" width="150" height="24" rx="4" class="bx"/><text x="105" y="345" text-anchor="middle" class="s">domain</text><rect x="30" y="356" width="150" height="24" rx="4" class="bx"/><text x="105" y="373" text-anchor="middle" class="s">data</text><line x1="285" y1="195" x2="285" y2="270" class="ln" marker-end="url(#oaxd3-en-a)"/><text x="285" y="290" text-anchor="middle" class="h">CRM</text><rect x="210" y="300" width="150" height="24" rx="4" class="bx"/><text x="285" y="317" text-anchor="middle" class="s">API / port</text><rect x="210" y="328" width="150" height="24" rx="4" class="bx"/><text x="285" y="345" text-anchor="middle" class="s">domain</text><rect x="210" y="356" width="150" height="24" rx="4" class="bx"/><text x="285" y="373" text-anchor="middle" class="s">data</text><text x="20" y="410" text-anchor="start" class="h">application architecture: how code is built, at design time</text><text x="20" y="432" text-anchor="start" class="s">layers, services, data ownership, deploy units</text></svg><figcaption>Two orthogonal questions. They meet at the MCP server.</figcaption></figure>

## The agentix pattern

We call it the agentix pattern because open-agentix is built around it, not because its parts are
new. Least privilege, bounded contexts, ports and adapters and workflow orchestration all predate
agents. What we add is a specific combination, written as rules you can check.

> **Definition.** In the agentix pattern every system an agent may touch sits behind exactly one
> MCP server, which owns its credentials and exposes its capabilities as typed tools, separated
> into read and write. Every business process is a versioned plan of steps; each step is executed
> by its own narrowly scoped agent that holds only the tools its step needs, hands over a typed
> artifact, and reaches any system only through a deterministic policy gate that records every
> decision under the run id.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd1-en-t oaxd1-en-d" viewBox="0 0 600 520" width="600" height="520"><title id="oaxd1-en-t">Anti-pattern versus the agentix pattern</title><desc id="oaxd1-en-d">Top: one agent holding every tool talks to one do-everything MCP server that holds the credentials of ten applications. Bottom: the agentix pattern. Three agents, one per step (research reads, analysis has no tools, action writes one thing), reach systems only through a policy gate with audit, and each system sits behind its own MCP server; the Git server is not granted to any step.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd1-en-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><text x="300" y="20" text-anchor="middle" class="h dgt">Anti-pattern: one god agent, one do-everything MCP server</text><rect x="190" y="36" width="220" height="40" rx="8" class="bx"/><text x="300" y="61" text-anchor="middle">one agent, every tool</text><line x1="300" y1="76" x2="300" y2="106" class="ln" marker-end="url(#oaxd1-en-a)"/><rect x="110" y="108" width="380" height="40" rx="8" class="bx dg"/><text x="300" y="133" text-anchor="middle">one MCP server, ten apps, every credential</text><line x1="300" y1="148" x2="38" y2="194" class="ln dim"/><rect x="13" y="196" width="50" height="28" rx="6" class="bx"/><text x="38" y="215" text-anchor="middle" class="s">app 1</text><line x1="300" y1="148" x2="96" y2="194" class="ln dim"/><rect x="71" y="196" width="50" height="28" rx="6" class="bx"/><text x="96" y="215" text-anchor="middle" class="s">app 2</text><line x1="300" y1="148" x2="154" y2="194" class="ln dim"/><rect x="129" y="196" width="50" height="28" rx="6" class="bx"/><text x="154" y="215" text-anchor="middle" class="s">app 3</text><line x1="300" y1="148" x2="212" y2="194" class="ln dim"/><rect x="187" y="196" width="50" height="28" rx="6" class="bx"/><text x="212" y="215" text-anchor="middle" class="s">app 4</text><line x1="300" y1="148" x2="270" y2="194" class="ln dim"/><rect x="245" y="196" width="50" height="28" rx="6" class="bx"/><text x="270" y="215" text-anchor="middle" class="s">app 5</text><line x1="300" y1="148" x2="328" y2="194" class="ln dim"/><rect x="303" y="196" width="50" height="28" rx="6" class="bx"/><text x="328" y="215" text-anchor="middle" class="s">app 6</text><line x1="300" y1="148" x2="386" y2="194" class="ln dim"/><rect x="361" y="196" width="50" height="28" rx="6" class="bx"/><text x="386" y="215" text-anchor="middle" class="s">app 7</text><line x1="300" y1="148" x2="444" y2="194" class="ln dim"/><rect x="419" y="196" width="50" height="28" rx="6" class="bx"/><text x="444" y="215" text-anchor="middle" class="s">app 8</text><line x1="300" y1="148" x2="502" y2="194" class="ln dim"/><rect x="477" y="196" width="50" height="28" rx="6" class="bx"/><text x="502" y="215" text-anchor="middle" class="s">app 9</text><line x1="300" y1="148" x2="560" y2="194" class="ln dim"/><rect x="535" y="196" width="50" height="28" rx="6" class="bx"/><text x="560" y="215" text-anchor="middle" class="s">app 10</text><text x="300" y="270" text-anchor="middle" class="h act">agentix pattern: one agent per step, one MCP server per system</text><rect x="20" y="288" width="170" height="50" rx="8" class="bx"/><text x="105" y="309" text-anchor="middle" class="h">research</text><text x="105" y="328" text-anchor="middle" class="s">reads jira, crm</text><rect x="215" y="288" width="170" height="50" rx="8" class="bx"/><text x="300" y="309" text-anchor="middle" class="h">analysis</text><text x="300" y="328" text-anchor="middle" class="s">model only</text><rect x="410" y="288" width="170" height="50" rx="8" class="bx"/><text x="495" y="309" text-anchor="middle" class="h">action</text><text x="495" y="328" text-anchor="middle" class="s">jira: issue.create</text><line x1="190" y1="313" x2="213" y2="313" class="ln" marker-end="url(#oaxd1-en-a)"/><line x1="385" y1="313" x2="408" y2="313" class="ln" marker-end="url(#oaxd1-en-a)"/><line x1="105" y1="338" x2="105" y2="368" class="ln" marker-end="url(#oaxd1-en-a)"/><line x1="495" y1="338" x2="495" y2="368" class="ln" marker-end="url(#oaxd1-en-a)"/><rect x="20" y="370" width="560" height="36" rx="8" class="bx ac"/><text x="300" y="393" text-anchor="middle" class="s">policy gate (allow / deny / approval) + audit, run id</text><g><rect x="20" y="446" width="170" height="40" rx="8" class="bx"/><text x="105" y="471" text-anchor="middle">jira MCP</text></g><g><rect x="215" y="446" width="170" height="40" rx="8" class="bx"/><text x="300" y="471" text-anchor="middle">crm MCP</text></g><g class="dim"><rect x="410" y="446" width="170" height="40" rx="8" class="bx"/><text x="495" y="471" text-anchor="middle">git MCP</text></g><line x1="105" y1="406" x2="105" y2="444" class="ln" marker-end="url(#oaxd1-en-a)"/><line x1="300" y1="406" x2="300" y2="444" class="ln" marker-end="url(#oaxd1-en-a)"/><text x="495" y="506" text-anchor="middle" class="s dim">not granted</text></svg><figcaption>Top: one agent and one MCP server for everything. Bottom: the agentix pattern, one agent per step, one MCP server per system, a gate in between.</figcaption></figure>

## The rules and why

**R1. One MCP server per system.** One server per system or bounded context, and it is the only
door to that system. Tools have typed schemas, reads and writes are separate tools, credentials
live only there. *Why:* one door means one place to review, rotate a key and look in the audit
trail, and a small server can be reused by every agent that needs that system. One server per
tool, the other extreme, multiplies deployments and credentials without adding a boundary. If one
system has very different risk classes, say reading invoices and issuing refunds, keep one server
but publish separate read and write tool sets and attach policy per tool. Split the server only
when the credentials themselves differ.

**R2. Business logic becomes 1..n agents, one per step.** Express the process as steps. By
default one step is one agent; never build a god agent that holds every server. *Split* when the
risk class, data class, privilege, model, failure handling, cost or approval need differs. *Keep
together* when steps share context and privilege: every split costs latency, tokens and
coordination, and loses context the next agent would have used.

**R3. Agents never talk to systems directly.** Every tool call passes a deterministic policy gate
(allow, deny, approval) and lands in the audit trail. A model may ask; the decision comes from
code you can read and test, outside the prompt.

**R4. Handovers are explicit, typed and minimal.** Agents pass a schema-typed artifact to the next
step, not shared memory and not open chat. A typed handover can be validated, logged and replayed;
free text from a step that read hostile input is a path for prompt injection into the next.

**R5. Orchestration is data.** The order of steps is a versioned plan, not another agent that
knows everything. A plan can be diffed, reviewed and pinned; an orchestrator agent with all tools
is a god agent with extra steps.

**R6. Budgets and identity per step.** Each agent has its own limits (steps, tool calls, tokens,
cost, time) and its own identity in the audit trail, so a loop stops one step and "who did this?"
has a better answer than "the pipeline".

**R7. Observability by run id.** Every model call, tool call, policy decision, approval and cost
line carries the run id and the agent id. Without that, nobody can show that R1 to R6 held.

## A worked example: ticket triage

A ticket about a failed payment arrives. Someone should look up the ticket and the customer,
decide whether this needs an engineering issue, and create one if so.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd2-en-t oaxd2-en-d" viewBox="0 0 600 404" width="600" height="404"><title id="oaxd2-en-t">Worked example: ticket triage</title><desc id="oaxd2-en-d">An event starts the research agent, which may only call read tools of the Jira and CRM MCP servers. It hands typed findings to the analysis agent, which has no tools. The analysis agent hands a typed decision to the action agent, which may call one write tool, issue.create on the Jira MCP server, and only after a human approval. Every call passes the policy gate and is audited.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd2-en-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><rect x="10" y="10" width="200" height="34" rx="8" class="bx"/><text x="110" y="32" text-anchor="middle" class="s">event: ticket.created</text><rect x="10" y="74" width="200" height="52" rx="8" class="bx"/><text x="110" y="96" text-anchor="middle" class="h">research</text><text x="110" y="116" text-anchor="middle" class="s">reads only</text><rect x="10" y="174" width="200" height="52" rx="8" class="bx"/><text x="110" y="196" text-anchor="middle" class="h">analysis</text><text x="110" y="216" text-anchor="middle" class="s">model only, no tools</text><rect x="10" y="274" width="200" height="52" rx="8" class="bx"/><text x="110" y="296" text-anchor="middle" class="h">action</text><text x="110" y="316" text-anchor="middle" class="s">one write, after approval</text><line x1="110" y1="44" x2="110" y2="72" class="ln" marker-end="url(#oaxd2-en-a)"/><line x1="110" y1="126" x2="110" y2="172" class="ln" marker-end="url(#oaxd2-en-a)"/><text x="118" y="154" text-anchor="start" class="s">findings.json</text><line x1="110" y1="226" x2="110" y2="272" class="ln" marker-end="url(#oaxd2-en-a)"/><text x="118" y="254" text-anchor="start" class="s">decision.json</text><rect x="236" y="74" width="36" height="252" rx="6" class="bx ac"/><text x="254" y="200" text-anchor="middle" class="s" transform="rotate(-90 254 200)">policy gate + audit</text><line x1="210" y1="100" x2="234" y2="100" class="ln" marker-end="url(#oaxd2-en-a)"/><line x1="210" y1="300" x2="234" y2="300" class="ln" marker-end="url(#oaxd2-en-a)"/><rect x="320" y="74" width="270" height="124" rx="8" class="bx"/><text x="455" y="96" text-anchor="middle" class="h">jira MCP server</text><text x="334" y="124" text-anchor="start" class="s">read</text><text x="400" y="124" text-anchor="start" class="s">issue.get</text><text x="334" y="148" text-anchor="start" class="s">read</text><text x="400" y="148" text-anchor="start" class="s">issue.search</text><text x="334" y="182" text-anchor="start" class="s act">write</text><text x="400" y="182" text-anchor="start" class="s act">issue.create</text><rect x="320" y="228" width="270" height="98" rx="8" class="bx"/><text x="455" y="250" text-anchor="middle" class="h">crm MCP server</text><text x="334" y="278" text-anchor="start" class="s">read</text><text x="400" y="278" text-anchor="start" class="s">customer.get</text><g class="dim"><text x="334" y="310" text-anchor="start" class="s">write</text><text x="400" y="310" text-anchor="start" class="s">customer.update</text></g><line x1="272" y1="104" x2="318" y2="132" class="ln" marker-end="url(#oaxd2-en-a)"/><line x1="272" y1="112" x2="318" y2="272" class="ln" marker-end="url(#oaxd2-en-a)"/><line x1="272" y1="296" x2="318" y2="182" class="ln ac" marker-end="url(#oaxd2-en-a)"/><path d="M295 231l8 8-8 8-8-8z" class="wn"/><path d="M18 352l8 8-8 8-8-8z" class="wn"/><text x="34" y="365" text-anchor="start" class="s">human approval before the call</text><text x="10" y="392" text-anchor="start" class="s">every call into an MCP server passes the gate and is audited under the run id</text></svg><figcaption>Reads and writes are separate tools. Only the action step may write, once, after approval.</figcaption></figure>

If text in the ticket manipulates the research agent, it can only read. The analysis agent holds
nothing to misuse. The action agent can create one kind of issue, after a person approves, and
cannot read the CRM. As a plan, sketched in the shape of the planned Agent Plan (not a shipped
format):

```yaml
kind: AgentPlan
name: payment-ticket-triage
version: 1.0.0
steps:
  - agent: research
    tools: [jira.issue.get, jira.issue.search, crm.customer.get]
    output: { schema: findings.json }
    budget: { maxToolCalls: 10, maxCostUsd: 0.10 }
  - agent: analysis
    tools: []
    input: findings.json
    output: { schema: decision.json }   # { action: "create" | "none", summary, priority }
  - agent: action
    when: decision.action == "create"
    tools:
      - name: jira.issue.create
        approval: required
        maxCallsPerRun: 1
    input: decision.json
```

## Best practices for MCP server design

Each item says whether the MCP documentation states it (*docs*) or whether it is our
recommendation (*ours*). Sources are listed at the end.

- **Single responsibility:** one system or capability per server (*ours*, consistent with the
  docs, which describe servers that "expose specific capabilities" and give one-system examples).
- **Small, typed tool surface:** every tool has an input schema with types and required fields
  (*docs*: tools are "schema-defined interfaces"; limits and enums are *ours*).
- **Read and write separated:** separate tools, destructive ones named as such (*ours*; the docs
  separate read-only resources from model-controlled tools, but not read from write tools).
- **Idempotent and bounded:** writes safe to retry, results limited in size (*ours*).
- **Explicit errors** the agent and the audit trail can tell apart (*ours*).
- **No ambient credentials:** secrets resolved inside the server, never in prompts; never pass
  a client's token through to a downstream API (*docs* for the token rule, *ours* for the rest).
- **Least privilege on scopes:** start with minimal scopes, elevate when needed (*docs*).
- **Per-tool policy and approval:** approval or pre-approval per tool call (*docs* name approval
  dialogs and permission settings as options; deterministic policy per tool is *ours*).
- **Versioning** of tools and scopes; no silent semantic changes (*docs* for scopes, *ours* for
  tools).
- **Audit:** every call attributable to a run and an agent (*docs* mention activity logs and
  correlation ids; run and agent ids are *ours*).

## Anti-patterns

- **The god agent:** one agent with every server, "because it is simpler", until the first injection.
- **The Swiss army knife server:** one MCP server for many systems. Many credentials, no reuse.
- **MCP-per-endpoint sprawl:** a server for every API call. Many doors, no boundary.
- **Shared credentials:** the audit trail can no longer say who acted.
- **Agent-to-agent free chat:** nothing to validate, nothing to replay.
- **The orchestrator agent that holds everything:** R5 broken in the most common way.
- **Policy in the prompt:** "never delete anything" is a wish, not a control.

## Decision checklist

1. Can I name each step of this process in one sentence?
2. Which tools of which servers does each step need, and which only read?
3. Do neighbouring steps differ in risk, data class, privilege, model, failure handling, cost or
   approval? Then split; otherwise keep them together.
4. What does each step hand over, and can I write a schema for it?
5. Which calls need a person, and who may decide?
6. Can I reconstruct a run from its run id alone?

## What the documentation says, and what is ours

The MCP documentation describes a host that creates one client per server, servers that "expose
specific capabilities" with examples per system (file system, database, GitHub, Slack, calendar),
tools where each "performs a single operation", optional user consent before tool execution, and
security guidance that forbids token passthrough and recommends minimal scopes. The Claude Code
documentation describes subagents that run in their own context window with "specific tool
access", a `tools` allowlist and an optional per-subagent model and MCP server list. R1, R2 and R3
are consistent with that. Neither source prescribes our rules or endorses this pattern.

Where we go further, or differ: the MCP docs do not say one server per system; one of their own
examples is a combined "Calendar/Email Server". Claude Code subagents return a summary to the main
conversation, which itself delegates. Our R4 (typed handovers) and R5 (a plan instead of an
orchestrating agent) are stricter choices for unattended, audited runs, not a correction of those
docs.

## Trade-offs and opinion

More agents mean more handovers, more model calls, more latency and more to maintain. A task with
one tool and one reader does not need three agents. Mitigations: keep steps that share privilege
together, use small models for narrow steps and plain code where no model is needed, and keep
handovers short. The rules borrow from least privilege, microservices, bounded contexts and ports
and adapters without being the same thing: microservices split deploy units, R2 splits authority.
Fact: tool calls can be intercepted, and a smaller grant reaches less. Opinion: that one step per
agent is the right default, one server per system the right granularity, and the extra cost
usually worth paying.

## Where open-agentix stands

Implemented in 0.1.0: `agents.md` pipelines of 1..n agents with immutable versions, tool
allowlists with argument constraints and `approval: required` per agent, model and budget per
agent, the deterministic policy gate, the MCP gateway, the hash-chained audit trail, and steps and
costs per run and agent. On `main`, not yet released: tenants, connections scoped to tenant, team
or agent with secret references only, and role bindings for a single agent.

Not there yet:

- **Typed handovers (R4):** the previous output is passed on as text; `format: json` is parsed
  but not validated against a schema. Input and output schemas are planned for 0.2.
- **Conditional plans (R5):** a pipeline is an ordered list today; `when` is planned for 0.2.
- **Named read/write profiles per server (R1)** are planned for 0.2, ahead of the catalog governance (0.3); until then, per-agent grants and policy patterns give the same effect.
- **Per-step credentials and isolated workers (R6)** are on the
  [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) for v0.2.
- **Agent Check and Agent Plan generation**, where a model proposes the split for human review,
  a first advisory version is planned for 0.2.

## References

All accessed 2026-10-04. We paraphrase; quotes are short.

- Model Context Protocol, [What is MCP?](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)
- Model Context Protocol, [Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- Model Context Protocol, [Understanding MCP servers](https://modelcontextprotocol.io/docs/2026-07-28/learn/server-concepts)
- Model Context Protocol, [Security best practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)
- Claude Code documentation, [Create custom subagents](https://code.claude.com/docs/en/sub-agents)

The short version of the pattern lives in the [docs](https://openagentix.si/docs/concepts/agentix-pattern/).
If you think a rule is wrong, or know a case where a god agent is the better design, tell us in
[GitHub Discussions](https://github.com/open-agentix/open-agentix/discussions). We would rather
correct the pattern than defend it.
