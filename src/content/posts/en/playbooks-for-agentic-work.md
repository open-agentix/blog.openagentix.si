---
ref: playbooks-for-agentic-work
lang: en
title: "What is a playbook for in agentic work?"
description: "A playbook makes a recurring agent task run the same way every time: fixed steps, typed handovers, checks and stop rules. How it relates to AGENTS.md, skills and runbooks."
date: 2026-10-15T07:00:00+02:00
tags: [skills, operations, how-to]
---

A playbook is for the tasks you do again and again and want done the same way each time. In agentic work
it is the written, versioned procedure that fixes the order of steps, says which steps are plain code
and which need a model's judgement, defines what each step hands to the next, and names the checks and
stop conditions. Without one, a recurring task is re-planned by the model on every run, and every run is
a little different. With one, the model's freedom is limited to the steps that actually need it.

This post explains what a playbook contains, how it differs from project context files, skills and
runbooks, and how the idea maps to `agents.md` pipelines in openagentix.

## The problem a playbook solves

Agents are good at open tasks: "find out why the build fails". Many tasks in a team are not open. Triage
a vulnerability finding, prepare a release note, check a backup, answer a standard request. These tasks
have a known shape. When an agent re-derives that shape from scratch on every run, three things happen:

- **Variance.** Two runs on the same input take different paths, call different tools and produce
  differently structured results. Downstream steps and people have to cope with that.
- **Cost.** Planning tokens are spent on a plan that was already known. Loops and retries add more.
- **Weak checks.** If the steps are not fixed, it is hard to say in advance what "done" looks like, so
  checks become vague ("looks fine").

A playbook moves the known part out of the model's hands. That is the same idea as in [workflows or
agents](/posts/workflows-vs-agents/): pick the least autonomy that solves each step.

## What a playbook contains

![A playbook as fixed steps with typed handovers, a judgement step, a check and a stop rule](/images/blog/playbooks-for-agentic-work-1.svg)

A useful playbook answers six questions:

1. **Trigger and input.** What starts it, and what data does it receive? Ideally a schema, not prose.
2. **Steps in order.** For each step: is it deterministic (a script, a query, a fixed tool call) or a
   judgement step (summarise, classify, draft)?
3. **Handovers.** What exactly each step passes on, in a structure the next step can validate.
4. **Permissions per step.** Which tools a step may call, read-only or write, and which need approval.
5. **Checks.** How each step and the whole run are verified: tests, schema validation, a health probe,
   a diff that must be empty outside an allowed path.
6. **Stop and escalate.** When the run must stop and hand over to a person, and what it must leave
   behind (the evidence, not just "failed").

Budgets belong in the list too: a maximum number of steps, tool calls, tokens and wall time. A recurring
task has a known size; a run that exceeds it by a wide margin is a signal, not a reason to keep going.

## Playbook, AGENTS.md, skill, runbook: who does what

These terms overlap in everyday use. A practical split:

| Artefact | Answers | Loaded | Example |
| --- | --- | --- | --- |
| [AGENTS.md](/posts/agents-md-project-context/) | How does this repository work? | Always, at the start of a session | Build command, test command, conventions |
| [Skill](/posts/anatomy-of-an-agent-skill/) | How do I do this kind of thing well? | On demand, when it applies | How to read a vulnerability scanner report |
| Runbook | What does a person do when X happens? | When the situation occurs | Disk full on a database host |
| Playbook | In which order, with which checks, does this recurring task run? | Every run of that task | Weekly dependency update with tests and a draft pull request |

A playbook usually *uses* the others. Its judgement steps may load a skill; its checks call the commands
named in AGENTS.md; an ops runbook can be turned into a playbook by splitting knowledge from actions,
as described in [turning runbooks into skills](/posts/runbooks-as-skills/). The difference is the level:
a skill is knowledge for one kind of step, a playbook is the procedure for a whole task.

## Deterministic where possible

The most common mistake is to write a playbook as a long prompt. "First run the scanner, then check the
results, then update the ticket" in prose is still a plan the model may follow or not. The steps that do
not need judgement should not go through a model at all:

- Fetching data, running a scanner, applying a known fix command, validating a schema: code or a fixed
  tool call.
- Choosing a severity from a free-text advisory, writing a summary, drafting a comment: a model step,
  with its output constrained to a schema.
- Deciding whether to continue: a condition over the structured output, not a sentence the model writes.

This keeps the expensive and variable part small, and it makes each step testable on its own. [Small,
verified steps](/posts/small-verified-steps/) makes the same argument for agent work in general.

## How this maps to openagentix

In openagentix an agent or a pipeline is defined in one versioned `agents.md` file. (This is a
platform definition file, not the `AGENTS.md` convention for repository context; the names are similar,
the jobs are different.) A published version is immutable, so the procedure that ran last Tuesday is
the procedure you can read today. Several of the playbook elements above are fields in that file:

- `pipeline` fixes the order of steps.
- `input.from` and `output.schema` make handovers typed: a step receives only what it names, and its
  JSON output is validated before the next step starts; a violation fails the run.
- `when` is a condition over earlier outputs; if it is false the step is skipped and recorded as skipped,
  and an evaluation error fails the run instead of being treated as false.
- `access: read-only` and named tool profiles limit what a step may call; `approval: required` puts a
  person in front of a specific tool.
- `budget` sets the maximum tokens, cost, steps, tool calls and wall time.

A shortened example of a weekly dependency check (fictional names; the full field reference is in the
[agents.md documentation](https://github.com/open-agentix/open-agentix/blob/main/docs/agents-md.md)):

```yaml
apiVersion: openagentix.io/v1alpha1
kind: AgentPipeline
name: weekly-dependency-check
version: 1.0.0
owner: team-platform
classification: internal
triggers:
  - type: cron
    schedule: "0 6 * * 1"
budget: { maxTokens: 40000, maxCostUsd: 0.4, maxSteps: 12, maxToolCalls: 8, timeoutSeconds: 600 }
schemas:
  Assessment:
    type: object
    required: [risk, summary]
    additionalProperties: false
    properties:
      risk: { enum: [none, low, high] }
      summary: { type: string, maxLength: 1000 }
agents:
  - id: assess
    provider: ollama
    model: example-model
    access: read-only
    outputs: [{ format: json }]
    output: { schema: { $ref: "#/schemas/Assessment" }, onInvalid: retry }
    tools:
      - { server: deps, profile: read }
  - id: report
    provider: ollama
    model: example-model
    access: write
    when: 'steps.assess.output.risk == "high"'
    input: { from: [assess] }
    tools:
      - { server: tickets, profile: write, approval: required }
pipeline: [assess, report]
```

What is not there yet: scripted test cases inside `agents.md` and an eval runner that replays them on
every publish are planned (W2-4 on the
[roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md)). Until then, the checks of a
playbook live in its tools and in your CI.

## Writing your first playbook

Pick a task that runs at least weekly and has a clear "done". Then:

1. Write down the last three times a person did it, step by step, including what they checked.
2. Mark each step as deterministic, judgement or check. Most will be deterministic.
3. Give every judgement step a schema for its output and a short instruction; move background knowledge
   into a skill.
4. Give every step only the tools it needs; put approval on anything that writes outside a draft.
5. Add a stop rule for each judgement step ("if the advisory names more than one package, stop and
   escalate") and a budget for the run.
6. Run it in a mode that cannot write (draft or dry run) until the results match what the person would
   have done.

Expect the exercise to improve the procedure itself. A step that nobody can describe precisely was never
a step; it was a judgement call, and now it is visible.

## When a playbook is the wrong tool

Not everything should be a playbook. One-off investigations, exploratory debugging and design work need
an agent that can choose its own path. Writing a playbook for them adds rigidity without adding
reliability. A good test: if you cannot name the checks in advance, it is not yet a playbook task.

## Key takeaways

- A playbook fixes the shape of a recurring task: steps, handovers, permissions, checks, stop rules and
  budget.
- Use code for deterministic steps and constrain model steps to structured output; decide on
  continuation with conditions, not prose.
- AGENTS.md gives project context, skills give knowledge for a kind of step, runbooks describe responses
  to situations; a playbook orchestrates them for one task.
- In openagentix, `pipeline`, typed handovers, `when`, read-only access, approvals and budgets in a
  versioned `agents.md` express most of a playbook today; built-in test cases are planned.
- If you cannot say in advance what "done" looks like, the task is not ready to be a playbook.

## Sources

- openagentix, [agents.md reference: data flow and isolation fields](https://github.com/open-agentix/open-agentix/blob/main/docs/agents-md.md) and [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md).
- Related posts on this blog: [runbooks as skills](/posts/runbooks-as-skills/), [AGENTS.md](/posts/agents-md-project-context/), [workflows or agents](/posts/workflows-vs-agents/).
