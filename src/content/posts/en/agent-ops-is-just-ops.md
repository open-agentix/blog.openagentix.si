---
ref: agent-ops-is-just-ops
lang: en
title: "Running agents is operations: the old disciplines still apply"
description: "AI agent operations is not a new field: identity, least privilege, change management, SLOs, cost and audit all still apply. The opening of an operations series."
date: 2026-03-03T09:00:00Z
tags: [operations, governance, series]
---

AI agent operations sounds like a new discipline with a new vocabulary. It is mostly the old one. A
model does the work instead of a person or a script, but the questions a platform team has to answer
are the ones operations teams have been answering for decades: who is acting, what are they allowed
to touch, how do we change it safely, how do we know it is healthy, what does it cost, and what
happens when it breaks at 03:00. This post opens a recurring series. Each later post takes one
classic discipline and maps it to an agent platform.

![Map of classic operations disciplines to agent platform concerns](/images/blog/agent-ops-is-just-ops-1.svg)

## Why this framing helps

Teams that treat agents as magic reinvent operations badly. They ship a prompt, give it a shared API
key and discover the missing parts one incident at a time. Teams that treat agents as a new kind of
service, with a probabilistic component inside, can reuse almost everything they already know.

That does not mean nothing is different. Three properties of model-driven workers change how the
old disciplines are applied:

- **Behaviour is not fully predictable.** The same input can lead to different steps. Controls
  therefore have to sit outside the model, where they are deterministic.
- **Input is instructions.** Text from a ticket, a web page or a tool result can steer the model.
  Every input channel is a trust boundary.
- **Cost is usage-shaped.** A loop that retries costs money with every turn. Budgets are an
  operational control, not a finance afterthought. We covered this in
  [Cost is a platform concern](/posts/cost-is-a-platform-concern/).

## Twelve disciplines, mapped

The diagram above is the index for the series. In words:

1. **Identity.** Every service has its own identity. An agent needs one too, plus a record of whom
   it acts for, so that a log line answers "who did this, for whom".
2. **Least privilege.** Tool allowlists per agent instead of one powerful agent. Splitting work into small agents with narrow grants is the starting point.
3. **Change management.** Agent definitions, prompts, skills and policies are code. They are
   versioned, reviewed and rolled back like code.
4. **Deployments.** A new agent version goes out gradually, not to everything at once, and can be
   switched off quickly.
5. **Observability.** Traces of runs, tool calls with arguments, token use and decisions, so that
   behaviour can be reconstructed without guessing.
6. **Incident response.** A kill switch, a way to revoke a grant, a replayable record and a blameless
   review afterwards.
7. **SLOs.** Targets for success rate, latency and, for agents, how long human review takes.
8. **Cost.** Budgets per agent and per run, with a hard stop.
9. **Audit.** A tamper-evident record of decisions. See
   [Policy decides, audit proves](/posts/policy-decides-audit-proves/).
10. **Runbooks.** Documented procedures with owners; for agents, often packaged as skills.
11. **Patching.** Model versions, dependencies, tool servers and images all age and need an update path.
12. **Secrets.** Credentials are handed to tools by the platform and never written into prompts.

## What the classics say

None of this is new, and the primary sources are worth reading. Google's SRE book defines toil as

> Toil is the kind of work tied to running a production service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value
>
> — Google, [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/)

An agent platform will create new toil if nobody watches for it: approvals that are always clicked
through, alerts nobody reads, manual restarts. The same definition applies.

For service level objectives, the book is equally direct:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.
>
> — Google, [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

For agents the measured thing changes (task success, tool-call error rate, time to review) but the
structure, a target for something you can measure, does not. Both book chapters are online editions
of a 2016 book; the web pages themselves are undated.

On trust, NIST's zero trust architecture is a good fit for agents, because an agent's network
location says nothing about whether it should be trusted:

> Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location
>
> — NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

And the UK National Cyber Security Centre's guidance on AI systems already uses a life-cycle view,
which includes operation:

> four key areas within the AI system development life cycle: secure design, secure development, secure deployment, and secure operation and maintenance
>
> — UK NCSC, [Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development)

The fourth of those areas, operation and maintenance, is the topic of this series.

## A starter checklist

If you run agents today and want to know where you stand, answer these without looking anything up:

- Can you list every agent in production, its owner and the tools it holds?
- Does each agent have its own identity, or do several share one key?
- Can you stop one agent within a minute without stopping the others?
- Can you show the last ten tool calls of any run, with arguments?
- Is there a budget with a hard stop per run and per day?
- Are prompts, skills and policies in version control with review?
- Is there a runbook for the three most likely failures?
- Who patches the model version, the tool servers and the images, and how often?

If you could answer fewer than half of these, the gap is operations, not model quality. Better
prompts will not close it.

## What this series will and will not do

It will map each discipline to concrete controls on an agent platform, say which part is solved by
mature practice and which part is genuinely new, and name limits honestly. It will not claim that
any platform, including open-agentix, makes these problems disappear. Operations is work. The point
of a platform is that the work is visible, repeatable and enforced in code instead of in habits.

## Key takeaways

- Agent operations is operations: identity, least privilege, change, deployment, observability,
  incidents, SLOs, cost, audit, runbooks, patching, secrets.
- What is new is that behaviour is probabilistic and input is instructions, so controls must sit
  outside the model.
- Existing sources such as the SRE book, NIST SP 800-207 and the NCSC guidelines apply with little
  translation.
- Use the checklist to find gaps; most are operational, not model-related.
- This post is the index for a series that goes through the twelve disciplines one by one.

## Sources

- Google, [Site Reliability Engineering, Chapter 5: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/) (book published 2016)
- Google, [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) (book published 2016)
- NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) (2020-08-11)
- UK NCSC, [Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development) (2023-11-27)
- Earlier posts on this blog: [Why open-agentix](/posts/why-open-agentix/)
