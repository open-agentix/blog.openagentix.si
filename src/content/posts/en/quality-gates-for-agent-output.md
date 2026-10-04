---
ref: quality-gates-for-agent-output
lang: en
title: "Quality gates for agent output: a checklist against slop"
description: "AI code quality gates let machines reject what humans should never read. A checklist of gates before review: tests, evals, size limits and policy checks."
date: 2026-05-14T09:00:00Z
tags: [quality, evaluation, checklist]
---

AI code quality gates are automated checks that agent output must pass before a person looks at it. The reasoning is about capacity: agents can produce changes faster than people can review them, and review time is the scarce resource. So let machines reject what a human should never have to read. This post is a checklist of gates, in the order to run them, with what each one catches and what it cannot.

## Start from the scarce resource

When an agent opens ten pull requests a day, the limiting factor is not generation but attention. If every output goes straight to a reviewer, one of two things happens: the queue grows until nothing is reviewed carefully, or reviewers start approving on trust. Both lead to what this blog calls slop, output that looks convincing and is subtly wrong or unnecessary; the idea is introduced in [prompt sprawl and AI slop](/posts/prompt-sprawl-and-ai-slop/).

A 2025 industry report makes a related point about tooling in general:

> AI doesn't fix a team; it amplifies what's already there.
>
> — Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)

Teams that already have fast tests, small changes and clear ownership get more from agents. Teams without them get more of the same problems, faster. Quality gates are how you build the first kind of team on purpose.

![Funnel of automated gates before human review](/images/blog/quality-gates-for-agent-output-1.svg)

## The checklist, in order

Order gates from cheap and certain to expensive and fuzzy. Fail fast, and give every rejection a reason the agent can act on.

### 1. Does it build and do the tests pass?

The cheapest gate is also the strongest signal. Run the project's build, linters, type checks and unit tests. Require that new behaviour comes with new tests, and that existing tests were not deleted or weakened to get green. A simple rule catches a common failure: a diff that removes assertions or adds skip markers is rejected automatically.

### 2. Does the eval suite pass?

Tests check code. Evals check behaviour, especially where output is not deterministic. Anthropic's guide to agent evals defines the central piece:

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Prefer graders that check outcomes in the environment over graders that read the transcript. The same article gives the pattern with a booking example:

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

The agent saying "booked" is not the outcome; the row in the database is. For code changes, public benchmarks show how far this idea can go: SWE-bench builds tasks from real repositories and checks them with tests.

> We find real-world software engineering to be a rich, sustainable, and challenging testbed for evaluating the next generation of language models.
>
> — [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770), arXiv

You do not need a public benchmark. A set of 20 to 50 representative tasks from your own repositories, run on every change to prompts, skills or models, is a good start. See [agent evals 101](/posts/agent-evals-101/).

### 3. Is the change small enough to review?

Set a size limit and reject larger changes with an instruction to split them. A threshold such as "no more than 400 changed lines, no more than 10 files" is arbitrary but useful, because review quality drops sharply with size. This also supports the habit described in [small verified steps](/posts/small-verified-steps/): the agent works in increments that can each be checked.

### 4. Does it pass the policy checks?

Policy gates look at what the change touches, not whether it works:

- Files and paths the agent may not modify (CI configuration, lockfiles, secrets, license files).
- New dependencies, which need a separate approval and a licence and vulnerability check.
- Secret scanning of the diff.
- Generated or vendored files that should not be edited by hand.

### 5. Is the provenance recorded?

Attach to each change the run ID, agent and skill versions, model, and the task that triggered it. When something goes wrong in production, "which agent produced this and under which instructions?" must have an answer. Provenance also helps reviewers decide how much attention a change needs.

### 6. Then a human reviews

What reaches a person has already built, passed the tests and evals, stayed within size and policy limits, and carries its history. The reviewer can spend their time on design, intent and risk, which only people can judge. Humans also own the decision for high-impact changes; gates reduce the workload and do not replace accountability.

A minimal CI sketch for the first few gates:

```yaml
jobs:
  agent-gates:
    steps:
      - run: make build lint typecheck test
      - run: ./scripts/check-no-removed-tests.sh origin/main
      - run: ./scripts/run-evals.sh --suite smoke --min-pass 0.9
      - run: ./scripts/check-diff-size.sh --max-lines 400 --max-files 10
      - run: ./scripts/check-protected-paths.sh origin/main
```

## Tune the gates, not just add them

Every gate has a false-positive and a false-negative rate. Track them:

- **Rejection reasons by gate.** If one gate rejects nearly everything, either the agent instructions or the gate need work.
- **Escapes.** Defects found after review show which gate was missing. Add one.
- **Review time per change.** It should fall as gates mature.
- **Flaky checks.** A gate that fails randomly teaches people to ignore it. Fix or remove it.

Changing a gate is itself a change that deserves care; [change management for agents](/posts/change-management-for-agents/) covers how to roll out new instructions, skills and checks safely.

## What gates cannot do

Gates catch what you can specify. They will not tell you that the feature is the wrong one, that the design is awkward, or that a test passes for the wrong reason. Evals can be gamed or can drift out of date. A green pipeline lowers the cost of review but does not remove the need for it.

## Key takeaways

- Review capacity is the scarce resource; let automated gates reject what humans should not read.
- Order gates from cheap and certain (build, tests) to fuzzy (evals) to policy, size and provenance.
- Grade outcomes in the environment, not what the agent says it did.
- Reject deleted tests, oversized diffs and changes to protected paths automatically.
- Track rejections and escapes, and tune the gates over time.

## Sources

- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- Google Cloud: [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
- arXiv: [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770)
