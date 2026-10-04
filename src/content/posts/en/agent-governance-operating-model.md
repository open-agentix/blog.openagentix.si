---
ref: agent-governance-operating-model
lang: en
title: "An AI governance operating model for agents: who owns what"
description: "An AI governance operating model fails when nobody owns the agent registry, policies or budget. Roles and a RACI for platform, security, owners and reviewers."
date: 2026-09-01T09:00:00Z
tags: [governance, enterprise, explainer]
---

An AI governance operating model assigns clear owners to the things that otherwise fall between teams: the agent registry, the policies, the budget, the approval of risky actions and the review of audit data. Governance fails when everyone assumes someone else owns these. This post proposes four roles (platform, security, process owner, reviewer), a RACI matrix for five recurring activities, and a short checklist to start. The roles are a starting proposal to adapt, not a standard.

## Why governance needs an operating model

Frameworks and guidelines tell you what to consider. They rarely tell you who does it on a Tuesday. NIST's AI Risk Management Framework describes itself modestly:

> The NIST AI Risk Management Framework (AI RMF) is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations

Source: [AI Risk Management Framework, NIST](https://www.nist.gov/itl/ai-risk-management-framework). Voluntary frameworks only work when someone is accountable for applying them. For a practical walk-through for teams, see [the NIST AI RMF for agent teams](/posts/nist-ai-rmf-for-agent-teams/).

The UK National Cyber Security Centre structures its guidelines around the life cycle of an AI system:

> four key areas within the AI system development life cycle: secure design, secure development, secure deployment, and secure operation and maintenance

Source: [Guidelines for secure AI system development, NCSC](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development). An operating model maps those life-cycle stages to people: who signs off the design, who deploys, who watches operation. Without that mapping, each stage has a policy document and no owner.

## Four roles

**Platform team.** Runs the infrastructure agents execute on: the harness, tool connections, the registry, budgets, logging. Owns availability and the technical enforcement of rules.

**Security.** Defines the rules for data, identity, tool access and risky actions, assesses new agents and tools, and responds to incidents. Owns the policy content, not the machinery that applies it.

**Process owner.** The business person accountable for the outcome of the process the agent supports, for example the head of support operations. Owns the purpose, the acceptable risk for that process and the budget request.

**Reviewer.** A qualified person who decides on high-risk actions that need human approval and who samples runs for quality. Reviewers must have the competence and the time to say no.

A small organisation can combine roles in fewer people; the point is that each activity below has exactly one accountable name.

## The RACI matrix

![RACI matrix for agent governance roles](/images/blog/agent-governance-operating-model-1.svg)

R = responsible (does the work), A = accountable (answers for the result, one per row), C = consulted, I = informed.

| Activity | Platform | Security | Process owner | Reviewer |
| --- | --- | --- | --- | --- |
| Register an agent | R | C | A | I |
| Change a policy | C | A | C | I |
| Approve a high-risk action | I | C | C | A |
| Set a budget | R | I | A | I |
| Review audit data | C | R | I | A |

Read the rows as follows:

- **Register an agent.** The process owner is accountable for the purpose and scope; the platform team records it in the registry; security is consulted on tools and data.
- **Change a policy.** Security is accountable. Platform advises on feasibility, process owners on business impact. Reviewers learn about changes that affect what they approve.
- **Approve a high-risk action.** A reviewer decides, case by case. The process owner and security shaped the rule that triggers the approval; neither should be the person clicking "approve" on their own process.
- **Set a budget.** The process owner decides how much the process is worth; the platform team configures and enforces the limits. Admin-side spend controls are a normal part of business offerings, for example:

> Admins have control over the maximum amount a user can spend with extra usage

Source: [Claude Code and new admin controls for business plans, Anthropic](https://www.anthropic.com/news/claude-code-on-team-and-enterprise). Whatever product you use, someone must be named as the person who sets those limits.
- **Review audit data.** Security does the routine analysis; a reviewer is accountable for acting on findings and for the periodic sign-off. See [audit trails versus logs](/posts/audit-trails-vs-logs/) for what makes records fit for this purpose.

## The registry is the centre

The agent registry is the list of every agent in operation. Treat it as the source of truth that links the other activities. For each agent record at least:

```yaml
agent: support-triage
purpose: classify incoming support tickets and draft a reply
process_owner: head-of-support
platform_contact: agent-platform-team
risk_tier: medium
tools: [tickets.read, tickets.comment]
data_classes: [customer-contact]
approval_required_for: [tickets.close]
budget_monthly: 400
status: production
review_due: 2026-12-01
```

Without a registry you cannot answer the first audit question: which agents exist, who is responsible for them and what may they do? An agent that is not in the registry should not be able to obtain credentials or tool access.

## How runs and policy decisions reach each role

Roles only work if they can see what happens. A governance setup should surface, per run, its status, its cost and the policy decisions made during it (allowed, denied, waiting for approval). The current open-agentix demo shows this kind of overview in its runs list, using invented example data; see the screenshot slot below. Each role then has a natural view: the platform team looks at failures and cost, security at denials, process owners at outcomes and spend, reviewers at pending approvals.

![Runs list in the openagentix demo with example data: status, steps, tokens and cost per run, plus one run awaiting approval](/images/blog/agent-governance-operating-model-2.png)

*Screenshot of the current demo (fake data).*

Do not rely on a screenshot of one product to judge your own setup. Check that, whatever tooling you use, a reviewer can find every run that waited for approval and see who decided.

## Starting checklist

1. Name the four roles and, for each, a person and a deputy.
2. Create the registry and register every agent that is live today; accept that the first list will be incomplete and fix it.
3. Write down which actions need human approval and who the reviewers are.
4. Assign a budget owner per agent and set limits with alerts. Pilot-style rollout order is covered in [pilot first, then scale](/posts/enterprise-rollout-pilot-first/).
5. Schedule a recurring review of audit data and registry entries (monthly is a reasonable start).
6. Define the escalation path for incidents: who is called, who decides to pause an agent.

## Limits and caveats

- A RACI describes intent, not behaviour. Check regularly that the named people actually do the work.
- Single accountable owners can become bottlenecks. Delegate within the role and keep decisions logged.
- Regulation and sector rules may require additional roles or evidence, such as a data protection officer's involvement. This post does not replace legal advice.
- Separation of duties costs time. Apply it where risk is high and keep low-risk agents on a lighter path.

## Key takeaways

- Governance fails when nobody owns the registry, policies, budget, approvals and audit review.
- Four roles cover most cases: platform, security, process owner, reviewer; each activity has exactly one accountable role.
- The agent registry links everything; unregistered agents should get no access.
- Make runs, costs and policy decisions visible to each role.
- Treat the RACI as a living document and test that people really do what it says.

## Sources

- [AI Risk Management Framework (NIST, AI RMF 1.0 released 2023-01-26)](https://www.nist.gov/itl/ai-risk-management-framework)
- [Guidelines for secure AI system development (UK National Cyber Security Centre, 2023-11-27)](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development)
- [Claude Code and new admin controls for business plans (Anthropic, 2025-08-20)](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
