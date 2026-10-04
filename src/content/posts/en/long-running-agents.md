---
ref: long-running-agents
lang: en
title: "Long-running AI agents: progress files, clean states, checkpoints"
description: "Long-running AI agents lose context between sessions. Keep state in a feature list, progress notes and git commits to make runs resumable and auditable."
date: 2026-08-20T09:00:00Z
tags: [harness, patterns, explainer]
---

Long-running AI agents need memory that lives outside the model. When work spans many context windows, each new session starts blank, so the harness must hand it a feature list, a progress file and version-control history to read first, and require it to leave a clean state when it stops. This pattern makes work resumable after a crash, reviewable by a person and auditable afterwards. This post explains the pattern and how to adapt it.

## The problem: many sessions, no memory

A context window is finite. A task such as "build this application" or "migrate this codebase" takes far more steps than fit into one. The agent works until the window fills, then a new session begins with no recollection of what happened. Anthropic's engineering team states the difficulty plainly:

> However, getting agents to make consistent progress across multiple context windows remains an open problem.

Source: [Effective harnesses for long-running agents, Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). Two failure patterns follow. The agent may try to do everything at once and run out of context halfway, leaving half-finished work. Or a later session may look at the partial result, assume the job is done and stop early. Both are consequences of missing state, not of a weak model.

## The pattern: state in files and commits

![Chain of agent sessions sharing state through files and commits](/images/blog/long-running-agents-1.svg)

The pattern has two kinds of sessions.

**Session 1 (setup).** An initialiser session creates the scaffolding that later sessions rely on:

- A **feature list**: a structured file with every requirement, each marked as not done or done.
- A **progress file**: short notes on what has been tried, what works and what to do next.
- A **first commit** and a script to start the project and run its tests.

**Sessions 2 to n (work).** Each later session follows the same loop:

1. Read the progress file and the recent git log.
2. Run the start script and the tests to check the current state.
3. Pick **one** unfinished item from the feature list.
4. Implement it and verify it.
5. Commit, update the progress file, and mark the item done only after verification.

The same article explains why the "one item" rule matters:

> This incremental approach turned out to be critical to addressing the agent’s tendency to do too much at once.

That ties into [small verified steps](/posts/small-verified-steps/): the smaller the unit of work, the cheaper it is to check, to revert and to resume.

## What goes in the files

Keep the feature list machine-readable and hard to misuse. A JSON or YAML file with fixed fields works well:

```json
{
  "features": [
    {
      "id": "F-012",
      "description": "User can reset their password by e-mail",
      "steps": ["open reset form", "submit address", "follow link", "set new password"],
      "passes": false
    }
  ]
}
```

Rules for the file that the harness can enforce:

- Sessions may flip `passes` to `true` only after the verification step ran.
- Sessions must not delete or reword items; they may add new ones.
- The harness, not the model, validates the file's schema before accepting a commit.

The progress file can be free text, but keep it short and dated. Entries answer three questions: what changed, what is known to be broken, what comes next. Treat it as a hand-over note to a colleague who has never seen the project.

## The clean-state rule

A session should end with the repository in a state the next session can work from: tests pass or known failures are recorded, nothing is half-merged, notes are updated. Define this as an exit check in the harness:

```bash
#!/usr/bin/env bash
set -euo pipefail
git diff --quiet || { echo "uncommitted changes"; exit 1; }
./scripts/test.sh
test -s PROGRESS.md
```

If the check fails, the session is not finished. Either the agent continues to fix it, or the harness reverts to the last good commit. Version control gives you cheap checkpoints: each commit is a point you can return to.

## Connection to the agent loop

Anthropic's article on the Claude Agent SDK describes the basic cycle:

> Agents often operate in a specific feedback loop: gather context -> take action -> verify work -> repeat.

Source: [Building agents with the Claude Agent SDK, Anthropic](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk). In a long-running setup, the files and the git log are the "gather context" step at the start of each session, and verification is what allows the next session to trust the previous one. For how context is managed within a single window, see [context engineering basics](/posts/context-engineering-basics/); the harness around all of this is covered in [what is an agent harness](/posts/what-is-an-agent-harness/).

## An example of long-horizon autonomy

Anthropic's Project Vend experiment ran an agent as the operator of a small shop. The write-up describes the agent's remit:

> Claudius decided what to stock, how to price its inventory, when to restock (or stop selling) items, and how to reply to customers

Source: [Project Vend: Can Claude run a small shop? (And why does that matter?), Anthropic](https://www.anthropic.com/research/project-vend-1). Work like this runs for days and involves recurring decisions, which is exactly the setting where state outside the model, clear records and human oversight matter. Read the original for its results; it describes real mistakes as well as successes, which is a useful reminder that long horizons expose weaknesses that short tests do not.

## Making runs resumable and auditable

The same files that help the agent also serve operators:

- **Resumable.** After a crash or a deploy, the harness starts a new session pointing at the same repository. No special recovery code is needed beyond "read the state".
- **Auditable.** Commits, with messages that name the feature id, form a timeline of what changed and why. Store the session id and model version in the commit trailer or the run record.
- **Reviewable.** A person can review one commit per feature instead of one enormous diff.
- **Bounded.** Add a per-session step or token limit and a total budget. A loop that never finishes should stop and ask for help.

## Limits

- The pattern assumes work can be split into verifiable items. Open-ended research or design tasks fit less well; there, a progress file with decisions and open questions plays the role of the feature list.
- Verification quality caps overall quality. If the tests are weak, "passes: true" is weak too.
- Notes can rot. Have sessions prune and rewrite the progress file instead of only appending.
- State files are untrusted input in one respect: if they can be edited by anyone other than the harness and agent, treat their content as data, not instructions.

## Key takeaways

- Sessions start blank; keep state in a feature list, a progress file and git history.
- One item per session, verified before it is marked done.
- End every session in a clean state, enforced by a harness-side exit check.
- Commits are cheap checkpoints that make runs resumable, reviewable and auditable.
- Bound the whole thing with step, token and budget limits.

## Sources

- [Effective harnesses for long-running agents (Anthropic, 2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Building agents with the Claude Agent SDK (Anthropic, 2025-09-29)](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Project Vend: Can Claude run a small shop? (Anthropic, 2025-06-27)](https://www.anthropic.com/research/project-vend-1)
