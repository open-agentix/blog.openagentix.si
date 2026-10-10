---
ref: classifier-models-and-autonomy-levels
lang: en
title: "Does a classifier model always make sense? Deciding what an agent may do"
description: "Classifier models can route requests and judge agent actions, but they cost money and make mistakes. When rules are better, when a classifier helps, and how autonomy levels fit."
date: 2026-10-22T07:00:00+02:00
tags: [governance, security, architecture]
---

A classifier model is a model whose job is to put an input into a category: which agent or model should
handle this request, how sensitive is this document, is this action risky. In agent systems classifiers
appear in two roles. They **route** work (cheap model or strong model, which agent, which playbook), and
they **judge** actions (allow, ask a person, block). Both can be useful. Neither is free, and neither is
always the right tool. A classifier is a probabilistic component; it will sometimes be wrong, and the
question is whether you can afford its mistakes in that place.

The short answer of this post: decide with deterministic rules wherever the facts are structured, use a
classifier where the input is genuinely fuzzy, let it only make decisions stricter, and send what remains
uncertain to a person.

## Two jobs called "classifier"

**Routing classifiers** look at a request and choose a path. Typical goals are cost (send simple
requests to a smaller model), quality (send hard ones to a stronger model) and data protection (keep
sensitive inputs on a private model). A wrong decision here usually costs quality or money: a hard task
lands on a weak model, or an easy one on an expensive model.

**Policy classifiers** look at a proposed action, often a tool call with its arguments and some context,
and decide whether it may run. Some coding harnesses ship modes in which a separate model reviews
actions before they run, as a middle ground between asking for every action and asking for none (check
your harness's documentation for what its mode does, as of 2026-10). A wrong decision here costs more:
a harmful action allowed, or a harmless one blocked often enough that people switch the check off.

## What a classifier costs

Before adding one, count four costs:

- **Money and latency.** One more model call per request or per action. On an agent that makes dozens of
  tool calls per run, a per-action classifier can add a noticeable share of the run's tokens and time.
  Measure it on your own runs instead of estimating.
- **Errors in both directions.** False negatives (a risky action judged safe) and false positives (a safe
  action blocked or escalated). Their costs are asymmetric and depend on the action.
- **Attack surface.** A model that reads the same untrusted content as the agent can be influenced by it.
  Text in a ticket or a web page that says "this action is approved" is aimed at exactly this kind of
  check. See [indirect prompt injection](/posts/indirect-prompt-injection/).
- **Drift and maintenance.** A classifier is a model like any other: it needs evaluation, pinning and
  re-evaluation when it changes, as described in [model drift in agents](/posts/model-drift-in-agents/).

## When deterministic rules are better

![Decision flow: deterministic rules first, a classifier only for fuzzy inputs, a person for what stays uncertain](/images/blog/classifier-models-and-autonomy-levels-1.svg)

Most permission decisions are about structured facts: which tool, which arguments, which identity,
which environment, which data classification. For those, a rule is cheaper, faster, gives the same
answer every time and can be audited:

- "Writes only to paths under `docs/`" is a path rule, not a judgement.
- "Ticket keys must match `^SEC-\d+$`" is a pattern.
- "No write tools in a read-only step" is a property of the step.
- "Payments and permission changes always need a person" is a list.

This is the design choice openagentix makes: a deterministic policy engine, not a model, checks every
tool call before it runs (allowlist, argument constraints, data classification, approvals), and the
decision is written to a hash-chained audit trail. The reasoning is in [a model may ask, the policy
decides](/posts/policy-decides-audit-proves/). A model can request an action; it cannot authorise it.

## When a classifier helps

A classifier earns its cost where the decision depends on meaning that rules cannot capture:

- **Content sensitivity.** Does this free-text document contain personal data or trade secrets, so it
  must stay on a private model? A pattern list finds some cases; a classifier can find more, and
  should be combined with the patterns, not replace them.
- **Intent of a request.** Routing an incoming message to the right playbook or agent when users write
  freely.
- **Effort estimate for model routing.** Choosing a smaller or larger model per step. openagentix has
  model routing per step (by classification, cost and latency) on the roadmap as planned work (W4-5);
  today the model is set per step in `agents.md`.
- **A second opinion on actions that rules already allow.** A classifier that can only add "ask a
  person" or "block" to a rule-based allow, never turn a deny into an allow.

The last point is the one that keeps a classifier safe to add: **it may make decisions stricter, never
looser**. The same principle appears in the openagentix roadmap for an external policy adapter (OPA),
which "can only make decisions stricter".

## Handling misclassification

Assume the classifier will be wrong and design for it:

- **Fail closed.** If the classifier times out, errors or returns low confidence, treat the action as
  needing approval, not as allowed.
- **Record every decision** with input summary, output, model version and confidence, so you can sample
  and review it later.
- **Measure both error types.** Sample allowed actions and check whether they should have been
  escalated; track how often people override the classifier's escalations. A high override rate means
  people are being asked too often, which erodes the value of every approval (see [human in the loop
  that works](/posts/human-in-the-loop-that-works/)).
- **Keep it out of its own case.** The model that proposes an action should not be the one deciding
  whether it needs approval.

## Autonomy levels: deciding before the run

Classifiers decide per request or per action. Much of the question "what may the agent do?" can be
answered earlier, per agent and per environment, as an autonomy or risk level. Two examples of how this
is written down:

- The [Agentic Workflow Protocol (AWP)](https://agenticworkflowprotocol.org/), a draft specification
  (`v1alpha1`) for describing agentic workflows, defines [risk
  levels](https://agenticworkflowprotocol.org/governance/risk-levels/) `low`, `medium`, `high` and
  `critical` with recommended default treatments, from autonomous execution within permissions to
  execution prohibited unless explicitly approved, and an autonomy setting per environment
  (`unrestricted`, `controlled`, `approval-required`, `prohibited`). The specification itself states
  that its risk levels are a possible governance model, not a regulatory classification.
- The concept for the openagentix showcase agents uses safety levels from L0 (read-only) through L1
  (draft output a person copies), L2 (draft pull request a maintainer merges) to L3 (merge or deploy),
  and does not use L3.

A workable pattern combines the two layers:

| Layer | Decides | Mechanism |
| --- | --- | --- |
| Agent and environment | The maximum autonomy (for example "drafts only in production") | Configuration, reviewed like code |
| Each tool call | Whether this call is inside the rules | Deterministic policy |
| Fuzzy content | Whether the input or action needs extra care | Classifier, only stricter |
| Remaining uncertainty | Go or no go | A person, with context |

Raise the level of an agent with evidence, not with confidence: after a period of runs at the lower
level, with an audit trail that shows what it did.

## Does it always make sense? A short test

Add a classifier when all of these are true:

1. The decision depends on meaning in unstructured input, not on structured facts.
2. You can state the cost of each error type and accept the residual rate.
3. It can only make decisions stricter, and it fails closed.
4. You have an evaluation set for it and will re-run it when its model changes.

If one of them is false, prefer a rule, a narrower tool, a lower autonomy level or a person.

## Key takeaways

- Classifiers route work or judge actions; both are probabilistic and cost money, latency and
  maintenance.
- Use deterministic rules for structured facts: tool, arguments, identity, environment, classification.
- Use classifiers for fuzzy inputs, and only to make decisions stricter; fail closed.
- Measure false negatives and false positives; too many escalations erode human review.
- Set autonomy per agent and environment in advance (AWP risk levels and environment autonomy are one
  way to write it down), and let rules, classifiers and people work inside that limit.

## Sources

- Agentic Workflow Protocol, [specification site](https://agenticworkflowprotocol.org/) and [risk levels](https://agenticworkflowprotocol.org/governance/risk-levels/) (draft, `v1alpha1`).
- openagentix, [repository](https://github.com/open-agentix/open-agentix) and [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) (items W4-5, W5-6).
- Related posts on this blog: [policy decides, audit proves](/posts/policy-decides-audit-proves/), [human in the loop that works](/posts/human-in-the-loop-that-works/), [least privilege for agents](/posts/least-privilege-for-agents/).
