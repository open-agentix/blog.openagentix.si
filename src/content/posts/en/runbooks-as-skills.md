---
ref: runbooks-as-skills
lang: en
title: "Ops series: turning runbooks into skills without losing control"
description: "Runbook automation AI done safely: turn a runbook into a skill plus narrowly scoped tools with approvals. A step-by-step conversion guide for ops teams."
date: 2026-07-07T09:00:00Z
tags: [operations, skills, how-to]
---

Runbook automation with AI works best when you split the runbook into two parts: the knowledge goes into a skill, and the actions go into a small set of narrowly scoped tools with approvals where it matters. A skill alone only tells the agent what to do. The tools decide what it can do. Keeping those two apart is how you gain speed without handing an agent the keys to production.

## Why runbooks are a good fit

Operations teams carry a lot of procedural knowledge: how to respond to a disk alert, how to rotate a certificate, how to drain a node. Much of it is written down as runbooks and much of it is boring. The Google SRE book has a precise name for the kind of work that should not stay manual:

> Toil is the kind of work tied to running a production service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value

Source: [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/) (Google, 2016).

A runbook step that a person follows by rote is a candidate for automation. A step that needs judgement is not, at least not without a person in the loop. The conversion below helps you tell them apart.

## What a skill is, and what it is not

The Agent Skills format describes itself like this:

> Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

Source: [Agent Skills overview](https://agentskills.io/home).

That is a good description of a runbook: specialised knowledge and a workflow. A skill is mostly Markdown instructions, optionally with scripts and reference files. It has no authority of its own. If the skill says "restart the pod" and the agent has no tool that can restart a pod, nothing happens. For the file structure, see [the anatomy of an agent skill](/posts/anatomy-of-an-agent-skill/).

This is also why skills load cheaply. Anthropic describes the design principle behind that:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.

Source: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (Anthropic, 2025-10-16).

In practice: a short description is always visible, and the full runbook is read only when the agent decides it applies.

## Converting a runbook, step by step

![Runbook converted into a skill and a scoped toolset](/images/blog/runbooks-as-skills-1.svg)

Take a runbook for a failing service and convert it in five steps.

1. **Classify every step.** Mark each as *read* (look at logs, metrics, status), *act* (change something) or *verify* (check that the change worked). Most runbooks are two thirds read.
2. **Write the skill from the read and decision steps.** What to check first, how to interpret the output, when to stop and escalate. Write stop conditions explicitly: "if more than one node is affected, do not continue; page a person."
3. **Turn each action into a tool, not into prose.** "SSH to the host and run systemctl restart" becomes a tool `restart_service(name)` limited to a named list of services. The skill refers to the tool by name.
4. **Scope each tool to the narrowest useful shape.** One service, one environment, bounded arguments, a maximum number of calls per run. Read tools get read-only credentials. Act tools get their own, separate credentials.
5. **Add a verify tool and make the skill call it.** The run is not finished until the check passes or the skill escalates.

The result for a restart runbook might look like this:

```yaml
skill: restart-failing-service
tools:
  - name: read_service_status      # read: status, logs, metrics; read-only credentials
  - name: restart_service          # act: allowlisted services only
    approval: required
    maxCallsPerRun: 1
    args:
      service: { enum: [checkout, search, notifier] }
  - name: check_health             # verify: HTTP health endpoint, no side effects
```

The exact syntax depends on your platform; the shape is what matters. Reads are free, the single act is approved by a person, and a verify step closes the loop.

## Approvals: where a person stays in the loop

Not every action needs a human. A reasonable starting rule:

| Action type | Example | Approval |
| --- | --- | --- |
| Read | fetch logs, list pods | none |
| Reversible, small blast radius | restart one stateless pod | automatic after a trial period |
| Reversible, wider impact | scale a deployment, flush a cache | required |
| Irreversible | delete data, rotate keys, change DNS | required, with named approvers |

Start with approval on every act tool. After the skill has run correctly for a while and you have the audit trail to prove it, relax the rules for the low-risk rows. Never relax the last row.

## Treat skills like code you deploy

A skill that can steer production is part of production. Two rules follow.

First, **version and review it**. Changes to the runbook text change what the agent does, so they need the same review as a script change. See [versioning agent skills](/posts/versioning-agent-skills/) for a workable scheme.

Second, **trust only what you reviewed**. Anthropic's guidance on skills is blunt about sources:

> When installing a skill from a less-trusted source, thoroughly audit it before use.

Source: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills).

A skill copied from the internet could contain instructions or scripts you never intended to run with production credentials. Read it, pin it, and give it only the tools it needs.

## Testing before you trust it

Run the converted skill in three ways before it gets near a real incident:

- **Replay.** Feed it logs and metrics from a past incident and compare its diagnosis with what the team concluded.
- **Dry run.** Give it act tools that only log what they would do.
- **Game day.** Trigger a harmless fault in a staging environment and let the agent handle it while an engineer watches.

When something goes wrong in a real run, the same discipline applies as for any automated change: stop it, preserve the trail, review. [Incident response for agents](/posts/incident-response-for-agents/) covers that side.

## What this does not solve

Honest limits: a skill cannot make up for a missing tool, and a tool cannot make up for a vague runbook. If your runbook says "investigate and fix", the conversion will expose that nobody wrote down what investigating means. Expect the first conversion to improve the runbook itself. Also expect that some steps stay manual, and that is fine; the goal is less toil, not zero people.

## Key takeaways

- Split a runbook into a skill (knowledge, decisions, stop rules) and tools (actions).
- Classify steps as read, act or verify; most are reads.
- Scope every tool narrowly and put approvals on anything that changes state, at least at first.
- Version and review skills like deployable code; audit anything from a less-trusted source.
- Test with replays, dry runs and game days before a real incident.

## Sources

- [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/), Google, 2016.
- [Agent Skills overview](https://agentskills.io/home), agentskills.io.
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), Anthropic, 2025-10-16.
