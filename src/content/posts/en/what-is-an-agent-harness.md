---
ref: what-is-an-agent-harness
lang: en
title: "What is an agent harness, and why do harnesses keep shrinking?"
description: An agent harness is the loop and scaffolding around a model. As models improve, much of it moves into the model or the API. What stays is governance, and that is why open-agentix treats the harness as replaceable.
date: 2026-02-19T09:00:00Z
tags: [architecture, harness, governance]
---

Anyone building with language models soon meets the word "harness". It is used loosely, so here is
a plain definition, an honest look at why harnesses tend to get thinner, and a view on what does
not get thinner. Where something is opinion rather than fact, the text says so.

## What a harness is

A model on its own takes text (and perhaps images) in and returns text out. An **agent harness** is
the program around it that turns this into something that can act. It runs a loop: build the
input, call the model, read what it wants to do, perform that, feed the result back, and repeat
until the task is done or a limit is hit. Typical parts:

- **Prompt and context assembly:** system prompt, instructions, files, earlier results.
- **Tool definitions and execution:** which tools the model is told about, and the code that runs
  them when it asks.
- **Permissions and sandboxing:** what a tool may touch, and when a person must confirm.
- **Memory and context compaction:** what to keep, summarise or drop when the context window fills.
- **Planning and sub-agents:** splitting work and delegating pieces.
- **Retries and error handling:** what happens when a call fails or a result is unusable.
- **Output parsing:** turning the model's answer into something the next step can use.

Coding agents such as Claude Code and OpenCode are harnesses for software work. Hermes and
OpenClaw are examples of more general ones. We will not describe their internals here; they differ,
they change, and the point does not depend on the details.

## Why harnesses keep shrinking

Fact: a lot of scaffolding that used to be necessary was written to compensate for what models
could not do reliably. Rigid chains of prompts, hand-built routers that decided which step comes
next, long prompt templates that spelled out every move, and custom retry logic for malformed
output all exist because the model could not be trusted to plan, pick tools or notice its own
mistakes.

Models have improved at exactly those things: planning over many steps, choosing and calling
tools, working with long context, and correcting themselves after an error. Providers have also
moved pieces into the API or an SDK: native tool calling, structured output, computer use, and
agent SDKs or managed agent offerings that bring the loop itself. Code that parsed free text into
a tool call, or forced a fixed sequence, can often be deleted.

Opinion: this will continue. A rule of thumb we find useful is that every piece of scaffolding is
a bet against the model's current weakness, and bets like that expire. When you upgrade a model,
re-test whether each layer still earns its place. Many teams find that a simpler loop with a
better model beats an elaborate one with an older model. That is a pattern we have seen reported
and a direction we expect, not a law.

A thin harness still matters. Tool design, what goes into the context, when to compact, and how to
evaluate results remain real engineering work. "Thin" means less compensation for the model, not
no engineering.

## What does not shrink

Some parts of a harness are not model capabilities at all, so a smarter model does not make them
obsolete:

- **Permissions and least privilege.** What an agent is allowed to do is a decision about your
  organisation, not about the model's skill. A more capable model with broad rights is a bigger
  risk, not a smaller one.
- **Policy decisions.** Whether a call is allowed has to be answered by deterministic code you
  can read and test.
- **Audit trail.** Someone must be able to show later what happened and who allowed it.
- **Cost limits and budgets.** A capable model can spend a lot very efficiently.
- **Identity and secrets.** Who is acting, and which credentials they may use.
- **Human approval** for actions that need it.
- **Isolation and sandboxing** for code that runs.
- **Observability and multi-tenancy.** Seeing what runs, and keeping teams apart.

The principle we use is: *a model may ask, the policy decides.* A better model asks better
questions. It still does not get to grant itself the answer. So as models grow more capable, the
scaffolding shrinks while the control layer stays: you can hand over more, as long as the
boundaries are enforced somewhere the model cannot reach.

## Harness or framework?

The two words get mixed up, so plainly:

- A **harness** is the runtime that runs one agent safely: the loop, the tools, the permissions
  and the context handling described above. It is the thing that executes.
- A **framework** is a library of abstractions and building blocks, plus orchestration tooling,
  that you assemble into your own application: chains or graphs of steps, memory and retrieval
  abstractions, integrations with models, stores and tools, and patterns for several agents
  working together. What you ship is your application, built with it.

They overlap: a framework usually contains a loop and a tool interface, and a harness often ships
a few building blocks such as sub-agents. The difference is the centre of gravity: a harness runs
one agent under control, a framework composes many parts. We do not describe any particular
framework's internals or versions here.

The trade-offs below are opinion:

- **Control versus convenience.** A framework gets you integrations and patterns quickly. A thin
  harness gives you a loop you can read in an afternoon and change without asking anyone.
- **Lock-in and upgrade churn.** A framework's abstractions become your team's vocabulary, and
  more surface means more to migrate when the library or the models change. A small loop with a
  plain tool interface is cheap to replace, and changes when you decide.
- **Observability.** Layers can hide what was sent to the model and which tool ran. In a thin
  harness every step passes through one place.
- **Orchestration is real work.** Retrieval, long workflows and cooperating agents are where a
  framework may save you time. Nothing here says not to use one.

Also opinion: a thin harness plus a policy layer changes the calculus. Permissions, policy,
audit and budgets then sit in a layer around the loop, not inside a framework's abstractions, so
the choice is less either-or: use whichever loop or framework you like, as long as every tool call
passes the gate. The question to ask of a framework becomes the one we ask of a harness below: can
its tool calls be intercepted? That is a design bet, not a proven result.

## See it in code

To make the comparison concrete we wrote the same small design twice: in Node.js 20+ with no
dependencies, and in Java 21 with only the JDK (JUnit for the tests), in a separate repository,
[open-agentix/blog-examples](https://github.com/open-agentix/blog-examples). It is teaching
material, not production code: the model is a deterministic script by default (no key, no
network), and there is no sandboxing or real authentication. The README lists what it is not.

Each has a loop with step, token and time limits, a tool registry with argument validation, a
policy gate, and a hash-chained audit log. This is the loop from the [Node example](https://github.com/open-agentix/blog-examples/blob/main/harness-node/src/harness.js), abbreviated. Every limit is a hard stop, and
an over-budget reply is not acted on:

```js
export async function runAgent({ model, tools, policy, audit, task, approve = denyAll, limits = {} }) {
  const { maxSteps = 8, maxTokens = 10_000, timeoutMs = 30_000 } = limits;
  const deadline = Date.now() + timeoutMs;
  const messages = [{ role: 'user', content: task }];
  let tokens = 0;
  let step = 0;
  // finish() writes 'run.end'; execute() is the gate, shown below and in harness.js

  audit.append('run.start', { task, limits: { maxSteps, maxTokens, timeoutMs } });
  while (step < maxSteps) {
    const left = deadline - Date.now();
    if (left <= 0) return finish('timeout');
    step++;
    const reply = await model.next(messages, tools.specs(), AbortSignal.timeout(left));
    tokens += reply.usage?.tokens ?? 0;
    if (tokens > maxTokens) return finish('budget'); // stop before acting on an over-budget reply
    messages.push({ role: 'assistant', content: reply.text ?? '', toolCalls: reply.toolCalls ?? [] });
    if (!reply.toolCalls?.length) return finish('done', reply.text);
    for (const call of reply.toolCalls) messages.push(await execute(call));
  }
  return finish('max-steps');
}
```

The gate is a plain function of a small JSON policy file, in
[`policy.js`](https://github.com/open-agentix/blog-examples/blob/main/harness-node/src/policy.js). The model never sees it and cannot
influence it. No matching rule means deny, and the strictest matching effect wins:

```js
const matches = (constraints = {}, args) =>
  Object.entries(constraints).every(([arg, spec]) =>
    Object.entries(spec).every(([kind, want]) => CONSTRAINTS[kind]?.(args[arg], want) ?? false));

export function decide(policy, tool, args) {
  const hits = (policy.rules ?? []).filter((r) => r.tool === tool && matches(r.args, args));
  for (const effect of ['deny', 'approve', 'allow']) { // strictest effect wins
    const rule = hits.find((r) => r.effect === effect);
    if (rule) return { effect, reason: rule.reason ?? `rule: ${effect} ${tool}` };
  }
  return { effect: 'deny', reason: 'no matching rule (deny by default)' };
}
```

The same gate in Java, from
[`Policy.java`](https://github.com/open-agentix/blog-examples/blob/main/harness-java/src/main/java/si/openagentix/harness/Policy.java). The shape is
the same; the Java version is wordier, which is a fair picture of the two languages:

```java
    public Decision decide(String tool, Map<String, Object> args) {
        List<Map<String, Object>> hits = rules.stream().filter(r -> tool.equals(r.get("tool")) && matches(r.get("args"), args)).toList();
        for (Effect effect : Effect.values()) {
            for (Map<String, Object> rule : hits) {
                if (effect.name().equalsIgnoreCase(String.valueOf(rule.get("effect")))) {
                    return new Decision(effect, rule.get("reason") instanceof String r ? r : "rule: " + effect.name().toLowerCase() + " " + tool);
                }
            }
        }
        return new Decision(Effect.DENY, "no matching rule (deny by default)");
    }
```

Both directories have a runnable demo ([`harness-node`](https://github.com/open-agentix/blog-examples/tree/main/harness-node),
[`harness-java`](https://github.com/open-agentix/blog-examples/tree/main/harness-java)). It shows an allowed read, a denied `http_get` (no
rule, so deny by default), an approval-required call that is auto-denied because nothing is
interactive, and then verifies the audit chain. Edit one line of the log and verification fails.

## Where open-agentix fits

open-agentix is a control layer rather than another harness, and it aims to be runtime-neutral. Its native runners already execute agents with the policy gate,
budgets and the hash-chained audit trail described in [an earlier post](/posts/policy-decides-audit-proves/).

For external harnesses the status is as follows (release 0.1.0 plus `main`):

- **On `main` (ships in 0.2):** Claude Code runs fully under openagentix: every tool call goes through the policy gate and is audited and costed, verified with real runs.
- **On `main` (ships in 0.2), real-run verification pending:** the OpenCode adapter is implemented and tested against a fake CLI; it has not yet been verified with a real binary.
- **Stubs only:** Hermes and OpenClaw (0.3) adapters exist as typed stubs.

The idea behind it, which is a design bet and so partly opinion: the harness becomes a replaceable
component. You bring the harness you prefer, today or next year, and the governance around it stays
the same.

```text
        +-----------------------------------------------+
        |  control layer: identity, policy, budgets,    |
        |  approvals, secrets, audit, observability     |
        +-----------------------+-----------------------+
                                |  tool calls pass the gate
        +-----------------------+-----------------------+
        |  harness (replaceable): loop, context, tools  |
        +-----------------------+-----------------------+
                                |
        +-----------------------+-----------------------+
        |  model API (any provider)                     |
        +-----------------------------------------------+
```

## Checklist: what to keep when your harness gets thinner

1. Keep a deterministic gate in front of every tool call, outside the model and outside the prompt.
2. Keep least-privilege grants per agent; do not widen them because the model "seems careful".
3. Keep budgets and call limits enforced by code, with a hard stop.
4. Keep secrets out of the model's context and resolve them at the tool, not in the prompt.
5. Keep human approval for destructive or irreversible actions.
6. Keep an audit trail that records decisions, not only outputs.
7. Keep tests that run without a model, so a harness change can be checked.
8. Re-test your scaffolding on each model upgrade and delete what no longer helps.

## How to choose a harness

Opinion, in order of weight: first, can its tool calls be intercepted, so policy and audit can sit
outside it? Second, does it let you choose the model and the provider? Third, is it open enough to
inspect what it sends? Fourth, does it fit the work: a coding harness for code, something more
general for other tasks. Do not choose by how much scaffolding it ships with. Given the trend
above, less is often a feature.

If you disagree, or find a statement here that is wrong, please open an issue. We would rather
correct the post than defend it.
