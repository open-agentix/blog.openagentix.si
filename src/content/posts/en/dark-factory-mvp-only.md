---
ref: dark-factory-mvp-only
lang: en
title: "Dark software factory: only for MVPs and PoCs"
description: Letting agents build software with minimal human touch can be a fast way to a prototype. open-agentix offers it as an opt-in mode with a fixed notice, and keeps approval gates for production.
date: 2026-10-04T13:00:00Z
tags: [dark-factory, governance, security]
---

A "dark factory" is a plant that runs without people on the floor, so the lights can stay off. The
software version is an agent pipeline that takes a specification, writes the code, writes the
tests and opens the pull request with little or no human involvement.

open-agentix supports this as an **opt-in agent mode** with a fixed notice:

> Recommended for MVP and proof-of-concept development only. Not for production changes without
> review.

This short post explains why we wrote that sentence into the product.

## Where it makes sense

A prototype has a short life and a small blast radius. If the goal is to find out in an afternoon
whether an idea works, the cost of a missed edge case is low, and the cost of waiting for review of
every line is high. For a proof of concept, a throwaway internal tool or a first version of
something that will be rewritten, letting agents run from specification to pull request is a
reasonable trade.

## Where it does not

Production software carries obligations that a pipeline without review cannot meet by itself:

- **Nobody has read it.** Tests written by the same agent that wrote the code check what the agent
  understood, not what you meant.
- **Security and maintenance are invisible costs.** A dependency that should not be there, a
  permissive default or an unreadable module all pass the build.
- **Accountability needs a person.** When a change reaches customers, someone has to own it.

For these cases the platform keeps the approval gates. Merge and deploy stay behind a human
decision or an explicit policy that a person wrote and signed off.

## What is in the platform today

In version 0.1.0 the mode exists as an opt-in flag with the fixed notice. Around it sit the pieces
that make an agent-built change reviewable instead of trusted:

- **Development guidelines** as versioned sets (coding standards, branch and commit rules, coverage
  expectations, security rules, forbidden dependencies). They resolve from global to tenant to
  agent, and the stricter rule wins.
- **A hardening review** that checks a development agent's output against those guidelines. It is
  deterministic first, and it can only make a verdict stricter, never weaken a policy. Findings go
  to the audit trail.
- The same policy gate, budgets and audit trail that apply to every other agent.

A ready-made **pipeline template** for the whole path from specification to pull request, with the
approvals described above, is planned for the next release. It does not exist yet.

## An honest comparison

This project is itself written largely by an AI agent, so it is fair to ask whether it is a dark
factory. It is not. Every change goes through a pull request that humans review, the
project lead owns the decisions, and tests, coverage gates and CI run on each change. The agent
writes; people decide what is merged. A dark factory removes that last step, and that is exactly
the step we recommend keeping for anything that matters.

If you try the mode, treat the output as a prototype. When the prototype proves the idea, put a
person and a review in front of the version you intend to run.
