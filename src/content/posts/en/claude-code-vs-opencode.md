---
ref: claude-code-vs-opencode
lang: en
title: "Claude Code vs OpenCode: a governance comparison"
description: "Claude Code vs OpenCode on the controls a platform team needs: permission rules, auto modes, subagents, MCP, providers and managed config. No benchmarks."
date: 2026-06-16T09:00:00Z
tags: [harness, comparison, governance]
---

Claude Code vs OpenCode is usually argued on benchmarks and taste. A platform team asks different
questions: what can the agent do without asking, can a deny rule be overridden, can subagents be given
less than the main agent, which model providers are possible, and who controls the configuration. On the
controls that matter for governance the two harnesses are more alike than different, with a few
differences that are worth testing before you standardise on either. This post compares them on those
controls and deliberately skips benchmarks.

A caution first. Both tools change quickly and the documentation of both is live. The statements below are
based on the documentation as read on 2026-10-04, and every point should be verified against the version
you actually deploy. Where this post says "check", it means exactly that.

## Why compare harnesses at all

If you have read [what an agent harness is](/posts/what-is-an-agent-harness/), you know that the harness,
not the model, decides which tools exist, what is shown to the model and which calls are allowed to run.
Governance lives there. The model can be swapped; the permission engine is the part you have to trust,
test and configure.

Claude Code was introduced by Anthropic in early 2025 as a terminal tool, in the words of the launch
announcement:

> Claude Code is available as a limited research preview, and enables developers to delegate substantial engineering tasks to Claude directly from their terminal.

Source: [Anthropic, Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet).
That is a launch-time description; the product has grown a lot since. OpenCode is an open-source coding
agent with its own documentation site, covered below.

![Feature matrix of two coding agent harnesses for governance controls](/images/blog/claude-code-vs-opencode-1.svg)

## Permissions: allow, ask, deny

Both tools model permissions as rules that resolve to allow, ask or deny, matched against the tool and
its arguments (for example a shell command pattern or a file path). Both can run in more autonomous modes
where fewer actions ask for approval. The governance question is how those modes interact with deny
rules.

OpenCode's documentation is explicit about it:

> Explicit "deny" rules are still enforced.

> Auto mode only changes requests that would otherwise ask for approval.

Source: [OpenCode docs, Permissions](https://opencode.ai/docs/permissions/) (live documentation, quoted as
fetched on 2026-10-04). Read it as a design principle you want from any harness: **a deny rule is a floor
that autonomy settings cannot lower**, and an autonomous mode should only convert "ask" into "allow". That
makes deny rules the right place to put your hard limits (no writes outside the workspace, no access to
credential paths, no destructive commands).

For Claude Code, check the same property for your version: does an autonomous or bypass-style mode still
respect deny rules and managed-policy rules? Write a test that sets a deny rule, switches to the most
autonomous mode available, and tries the denied action. A control you have not tested is an assumption.
The relation to human approvals is covered in [human in the loop that
works](/posts/human-in-the-loop-that-works/): with good deny rules and a boundary around the process,
autonomous modes become much less frightening.

## Subagents

Both harnesses support delegating work to subagents with their own instructions. The details differ in a
way that matters for least privilege. Claude Code describes subagents as isolated:

> Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions.

Source: [Claude Code docs, Create custom subagents](https://code.claude.com/docs/en/sub-agents) (live
documentation, as fetched on 2026-10-04). OpenCode distinguishes two kinds of agents:

> There are two types of agents in OpenCode; primary agents and subagents.

Source: [OpenCode docs, Agents](https://opencode.ai/docs/agents/) (live documentation, as fetched on
2026-10-04). For governance, the questions are the same in both: can a subagent be given a smaller tool
set than its parent, can its permissions be set independently, and does a deny rule on the parent apply to
children? Treat "a subagent holds only what its step needs" as a requirement and test for it.

## MCP and tools

Both tools can connect MCP servers, which means both inherit the MCP supply-chain and tool-poisoning
risks. What to compare is not whether MCP exists but how servers are configured and approved: are servers
listed in project files that anyone with commit access can change, can the organisation restrict which
servers are allowed, and can individual MCP tools be matched by permission rules like built-in tools? Test
that a denied MCP tool is actually blocked, not only hidden.

## Provider choice

This is the clearest practical difference. Claude Code is built around Anthropic models, with routes
through cloud platforms for organisations that need a particular contract or region. OpenCode is designed
to work with many model providers, including local models, which matters if you need to run a self-hosted
model for data-residency reasons or want to compare models on your own tasks. From a governance view, the
provider decides where your prompts and code go, so the choice is a data-protection decision first and a
quality decision second. Check which providers each tool supports in the version you deploy, and how
credentials for them are stored.

## Configuration and central control

A platform team needs settings that individual developers cannot quietly weaken. Questions to check for
both tools:

- Is there an organisation-level configuration layer that takes precedence over user and project files?
- Can that layer lock permission rules, MCP servers and hooks?
- Can project files (a repository's own settings) widen permissions? If yes, treat a cloned repository as
  untrusted input.
- Where is the audit trail, and can it be exported?

Neither tool replaces a central gate. Hooks and local rules run on the developer's machine; for
enforcement across everyone, put a central policy gate and a [sandbox](/posts/sandboxing-agents/) around
the tools and keep the harness rules as a second layer.

## A comparison checklist for your own evaluation

Run these on both tools with the same repository and the same tasks.

1. Set a deny rule for a file path; ask the agent to read it through a shell command as well as through
   the file tool.
2. Switch to the most autonomous mode; repeat step 1.
3. Create a subagent with read-only tools; ask it to write a file.
4. Add an MCP server; deny one of its tools; call it.
5. Clone a repository whose settings file widens permissions; see what takes effect.
6. Point the tool at a network host you have not allowed; see what is shown and logged.
7. Export telemetry or logs; check that tool name, arguments and decision are present.

Record the results with the versions. They will change.

## Key takeaways

- Governance lives in the harness's permission engine; compare that, not benchmark scores.
- A deny rule should be a floor that autonomous modes cannot lower. OpenCode's docs state this; verify the
  equivalent for any tool you adopt.
- Subagents need independent tool sets and permissions to support least privilege.
- Provider choice is the biggest practical difference and is a data-protection decision.
- Test all of it on the version you deploy, and keep a central gate beyond local rules.

## Sources

- Anthropic, [Create custom subagents (Claude Code docs)](https://code.claude.com/docs/en/sub-agents) (live documentation).
- OpenCode, [Permissions](https://opencode.ai/docs/permissions/) and [Agents](https://opencode.ai/docs/agents/) (live documentation).
- Anthropic, [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet) (2025).
