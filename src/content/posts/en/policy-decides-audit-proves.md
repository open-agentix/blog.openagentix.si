---
ref: policy-decides-audit-proves
lang: en
title: "A model may ask, the policy decides: deterministic gates and tamper-evident audit"
description: In open-agentix a model can request a tool call but never authorises it. A deterministic policy gate decides before each call, and a hash-chained audit trail records what it decided.
date: 2026-02-10T09:00:00Z
tags: [security, policy, audit, governance]
---

Guardrails written into a prompt are requests. A model can ignore them, misread them or be talked
out of them by the text it reads. open-agentix therefore follows one rule:

> A model may request an action. A model does not decide whether the action is permitted.

## The policy gate

Every tool call passes through a gate before it runs. The gate is ordinary code, a pure function
without I/O or model calls, and it answers with one of three decisions:

```text
agent --tool.call--> policy gate --allow-----> tool
                          |
                          +--deny------> blocked and audited
                          |
                          +--approval--> a person decides
```

The checks run in a fixed order, and the result carries every reason that applied:

1. globally forbidden tools,
2. the agent's allowlist (exact names or a prefix pattern),
3. argument constraints: type, required, pattern, enum, constant, length and range, plus explicit
   deny patterns; arguments that were not declared are rejected by default,
4. globally forbidden argument patterns,
5. per-run call limits,
6. data classification of the tool and of the policy bundle,
7. approval rules from the agent file or the bundle.

Tools an agent was not granted are not shown to the model in the first place. The gate is the
second line of defence for the case where a model asks anyway.

Because the gate is deterministic, a decision can be reproduced from the audit trail and tested
without a model. A model may also take part, but only to make things stricter: the design
provides for an optional second-opinion reviewer that can turn an allow into a stop, never the other
way round. Today the gate and the control agent are purely deterministic; the model review is planned.

## The control agent

A second component, the control agent, watches the run itself. Before each model call and after
each tool call it checks token, cost, step and tool-call budgets, the timeout, the call rate,
identical repeated calls (loops), consecutive errors, repeated policy denials and attempts at
globally forbidden actions. Depending on the finding it pauses or stops the run. It is also
deterministic.

## The audit trail

Gates and limits are only as convincing as the record of what they did. Every important action is
written to an append-only audit trail: events, run creation, agent versions, policy decisions,
tool calls and results, approvals, denials, failures and costs.

Each entry stores a sequence number, timestamp, actor, action, target, run id, a digest of its
payload and the hash of the previous entry. The hash covers all of those fields, so changing any
earlier entry breaks verification from that point onwards. The JSON form that gets hashed is
canonical (sorted keys, no whitespace) and fixed for good, so old entries stay verifiable.

On top of the chain, the head of the log is signed at intervals with an Ed25519 key. Public keys
can be handed to auditors independently of the platform. A verify endpoint and a library check the
chain and detect modified entries, modified payloads, deleted or inserted entries, and a chain that
was rewritten after a signed checkpoint. Exports are NDJSON and can be verified offline with the
same library. Secrets are redacted before hashing, so an export never contains them.

At the database level the audit tables accept no UPDATE, DELETE or TRUNCATE, enforced by a trigger
and, in production, by a database role that lacks those privileges.

## What tamper-evident means here

The wording matters. This design makes tampering **detectable**. It does not make it impossible.

- A database superuser can rewrite the whole table. The rewrite is detectable only if at least one
  checkpoint exists that is signed with a key the attacker does not hold. Keep the signing key in a
  KMS or secret store and rotate key ids.
- Appends are serialised so the chain cannot fork. That is a single writer; the measured cost is a
  few milliseconds per entry, and per-tenant chains are a later option for very high volumes.
- Policy patterns are regular expressions written by admins. A ReDoS-safe engine (RE2) is on the
  roadmap but not in 0.1.0.
- The audit trail proves what the platform allowed and what the agent did through the platform. It
  says nothing about what happened outside it.

## Try it

The demo profile (`docker-compose.demo.yml`) ships a seeded audit chain you can verify, and the
[documentation](https://openagentix.si/docs/) describes the policy bundle format. The design
decisions are written down as ADRs in the platform repository. If you find a hole in the gate,
please report it privately through GitHub security advisories.
