---
ref: enterprise-rollout-pilot-first
lang: en
title: "Enterprise AI agent rollout: pilot, baseline, then scale"
description: "An enterprise AI agent rollout works best with a small pilot, telemetry from day one, spend limits and written exit criteria for each wider step."
date: 2026-08-04T09:00:00Z
tags: [enterprise, governance, how-to]
---

An enterprise AI agent rollout should start with a small pilot group, record a baseline from the first day, cap spend with admin limits and pass explicit review gates before it grows. Without a baseline you cannot tell whether agents help, and you will learn about cost surprises from the invoice instead of from a dashboard. This post describes a phased plan you can adapt, with checklists for each phase.

## Why "give everyone a licence" fails

The tempting plan is to buy seats for the whole organisation and announce it. Three things go wrong. First, nobody can say afterwards what changed, because nothing was measured before. Second, usage is uneven: a handful of enthusiasts consume most of the budget while others never try it. Third, the early problems (flaky tool permissions, unclear rules about data, missing support) hit hundreds of people at once instead of ten.

Anthropic's cost documentation for Claude Code gives the same advice for exactly this situation:

> start with a small pilot group and use the tracking tools below to establish a baseline before wider rollout

Source: [Manage costs effectively, Claude Code docs](https://code.claude.com/docs/en/costs). This is live documentation; the wording is as fetched on 2026-10-04 and may change.

The 2025 DORA report makes the organisational point behind this:

> AI doesn't fix a team; it amplifies what's already there.

Source: [Announcing the 2025 DORA Report, Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report). If a team already has weak review habits or unclear ownership, agents make that visible faster. A pilot is where you find out, cheaply.

## The phased plan

![Phased enterprise rollout with review gates](/images/blog/enterprise-rollout-pilot-first-1.svg)

The plan has three phases separated by review gates: pilot, department, organisation. Each gate has written exit criteria, and "not yet" is a legitimate outcome.

### Phase 1: pilot with about ten people

Pick a group that is representative, not just keen. Mix experienced and junior people and at least two different kinds of work. Keep it small enough that you can talk to every participant weekly.

Before anyone starts, set up:

- **Telemetry from day one.** Usage, cost and tool activity per user and per team. See [observability for agents](/posts/observability-for-agents/) for what to capture and how to keep it useful.
- **A baseline.** Record the numbers you care about before agents are involved: cycle time for a typical change, review turnaround, defect or rework rate, and the time spent on a recurring chore. Two to four metrics are enough. More metrics mean more arguments.
- **Spend limits.** Decide the maximum per user and per team before the first prompt, not after the first surprise.
- **Written rules.** Which data may be sent to a model, which tools agents may use, who approves exceptions.
- **A feedback channel.** One place where participants report problems, and a person who answers within a day.

### The review gate

At the end of the pilot, hold a short review with the same agenda every time:

1. Compare the pilot metrics against the baseline. Report the numbers, including the ones that did not move.
2. Look at cost per user and the spread. Is the spend explainable, and does it fit the limit you set?
3. Review incidents and near misses: leaked data, wrong changes that reached review, tools that were denied for good reasons.
4. Check that support can handle the load of the next phase.
5. Decide: proceed, repeat the pilot with changes, or stop.

Write the exit criteria down before the pilot starts, for example "no data-handling incident, spend within the agreed limit, review turnaround not worse than baseline". Criteria written after the fact tend to match whatever happened.

### Phase 2: one department at a time

Expand to a whole team or department, not to everyone. The goal is to find out what breaks when people who did not volunteer use the system: onboarding gaps, tools missing from the allowlist, repositories with unusual structure. Keep the same telemetry and compare with the new department's own baseline, not with the pilot's.

### Phase 3: organisation-wide

Only now scale. By this point you should have a documented onboarding path, a budget per team and an owner for operations. Treat the agents as a service with [service level objectives](/posts/slos-for-agents/), not as a licence. The mindset in [agent ops is just ops](/posts/agent-ops-is-just-ops/) applies: on-call, incident review and change control exist for this service too.

## Budgets and admin controls

Spend limits belong to the platform, not to the goodwill of users. Anthropic describes this control for its business plans:

> Admins have control over the maximum amount a user can spend with extra usage

Source: [Claude Code and new admin controls for business plans, Anthropic](https://www.anthropic.com/news/claude-code-on-team-and-enterprise). Whatever product you use, look for the same three levers: a per-user cap, a per-team or per-project budget, and an alert before the cap is reached. Alerts at 50, 80 and 100 percent of the budget are a reasonable default. Decide in advance who is notified and what happens at 100 percent: stop, or ask for approval.

A simple configuration sketch in a neutral format shows the idea:

```yaml
rollout:
  phase: pilot
  users: 10
  budget:
    per_user_monthly: 100      # currency units, set by finance
    per_team_monthly: 800
    alert_at: [0.5, 0.8, 1.0]
    at_limit: require_approval
  exit_criteria:
    - no data-handling incident
    - spend within budget
    - review turnaround not worse than baseline
```

The numbers are placeholders. The point is that they are written down, versioned and reviewed like any other change.

## Common pitfalls

- **Measuring only enthusiasm.** Satisfaction surveys are useful, but they are not a baseline.
- **Counting lines or prompts.** Output volume is easy to measure and rarely tells you whether the work got better.
- **No owner.** A pilot that nobody operates ends quietly. Name an owner for the platform and one for the business outcome.
- **Skipping the stop option.** If every review ends in "proceed", it is not a gate.
- **Ignoring the limits of the data.** Ten users over four weeks is a small sample. Say so in the report, and avoid presenting a percentage improvement as a forecast.

## Key takeaways

- Start with a small pilot and record a baseline before agents are involved.
- Turn on telemetry and spend limits before the first user, not after the first surprise.
- Write exit criteria down in advance; each gate allows proceed, repeat or stop.
- Expand department by department, with the same measurements each time.
- Run agents as a service: owner, objectives, on-call and change control.

## Sources

- [Manage costs effectively, Claude Code docs (Anthropic)](https://code.claude.com/docs/en/costs), live documentation, wording as fetched 2026-10-04.
- [Claude Code and new admin controls for business plans (Anthropic, 2025-08-20)](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
- [Announcing the 2025 DORA Report (Google Cloud Blog, 2025-09-23)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
