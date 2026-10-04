---
ref: human-in-the-loop-that-works
lang: en
title: "Human in the loop for AI agents that works: fewer approvals, better ones"
description: "Human in the loop for AI agents fails when every call needs approval. Reserve people for high-risk actions, show context, and let policy handle the rest."
date: 2026-06-09T09:00:00Z
tags: [governance, policy, opinion]
---

Human in the loop for AI agents works when approvals are rare, specific and informed, and it fails when a
person is asked to approve every tool call. The first design keeps a person in control of the actions that
matter. The second trains people to click "approve" without reading, which is worse than having no prompt
at all, because it looks like a control while delivering none. This post argues for a different split:
deterministic policy for the routine, a human decision for the high-risk, and enough context at the
moment of decision to make that decision real.

## What the standards actually ask for

The Model Context Protocol specification is often quoted as requiring a person to approve every tool call.
Read it carefully. The sentence is about the *ability to deny*:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.

Source: [MCP specification 2025-06-18, Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools).
That is a recommendation about keeping control available, not a demand that every call be confirmed. The
same page is also candid about where tool metadata comes from:

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.

A tool that claims "read-only" or "harmless" in its own description has not earned that label. Your risk
classification therefore has to be yours, not copied from the tool.

OWASP's guidance for prompt injection points the same way, with two sentences that belong together:

> Restrict the model’s access privileges to the minimum necessary for its intended operations.

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.

Source: [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/). Note
the structure: first shrink what the model can do, then put a human on the *privileged* operations. Not
on everything.

## Why approving everything backfires

Approval fatigue is not a character flaw; it is predictable.

- **Frequency erodes attention.** When 95 of 100 prompts are harmless, the hundredth gets the same
  reflex as the first 99.
- **Prompts are low-information.** "Run `curl https://...`? [y/n]" gives a person almost nothing to judge
  with, so they judge by habit.
- **The cost of "no" is visible, the cost of "yes" is not.** Declining stalls the task and an annoyed
  colleague; approving costs nothing today.
- **It scales badly.** A team with ten agents and three approvers cannot read every request.

A control that people systematically defeat is a liability. It also moves blame to the person who clicked,
which is the opposite of the blameless approach you want in [incident response](/posts/incident-response-for-agents/).

## Route by risk instead

Decide in advance which actions need which handling, and make the routing deterministic.

| Risk | Examples | Handling |
| --- | --- | --- |
| Low | Read-only queries within scope, formatting, local calculations | Allow by policy, no prompt |
| Medium | Scoped writes that can be undone, creating a draft, adding a comment | Allow by policy and write an audit record; review in aggregate |
| High | Irreversible or external effects: payments, deleting data, sending messages, changing permissions, production deploys | Human approval with context |

![Risk-based routing of agent actions to policy or human approval](/images/blog/human-in-the-loop-that-works-1.svg)

The routing is a policy question, not a model question. A deterministic gate that evaluates the tool, the
arguments and the acting identity gives the same answer every time and leaves a record, which is the
argument made in [policy decides, audit proves](/posts/policy-decides-audit-proves/). The model should
never be the one deciding whether its own action needs approval.

## Make the approvals that remain good

When a high-risk action does reach a person, the approval screen should answer five questions without
requiring a trip to the logs:

1. **What exactly will happen?** The concrete change as a diff, a rendered message or the exact record,
   not a function name.
2. **Why now?** The task and the step that led to this call, in a sentence.
3. **What is the blast radius?** How many records, which environment, whether it can be undone.
4. **Where did the inputs come from?** Whether untrusted text (a web page, an inbound email) influenced
   the arguments.
5. **What are the options?** Approve, deny with a reason that goes back to the agent, or approve with a
   narrower scope.

Two more practices help. Give approvers a **time limit and a safe default**: if nobody decides within the
window, the action does not run. And **separate the approver from the requester** for sensitive actions,
so that the person who started the run is not the only check on it.

A related trap is using the approval channel to collect secrets. The MCP specification is explicit that
this is not what such interactions are for:

> Servers MUST NOT use elicitation to request sensitive information.

Source: [MCP specification 2025-06-18, Elicitation](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation).
Passwords and tokens belong in a credential mechanism, not in a prompt that the model or a server controls.

## Shrink the prompt volume with boundaries

Most approval prompts exist because the system cannot tell safe from unsafe. A sandbox gives it a way to
tell. In [sandboxing agents](/posts/sandboxing-agents/) we covered filesystem and network isolation; the
approval angle is that actions inside the boundary need no prompt. Anthropic's measurement from its own use:

> In our internal usage, we've found that sandboxing safely reduces permission prompts by 84%.

Source: [Anthropic, Making Claude Code more secure and autonomous with sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing).
That figure is one team's experience, and your numbers will differ, but the direction is the point. The
same article notes that effective sandboxing requires both filesystem and network isolation. Together
with narrow tool grants, it makes "ask a human" the exception, which is the only way it keeps its meaning.

## How to measure whether your approvals work

Treat the approval flow like any other control and measure it.

- **Approval rate.** If 99 percent of requests are approved, the prompt is probably not carrying risk;
  convert it to a policy rule or an audited allow.
- **Time to decision.** Approvals decided in a second or two are reflexes.
- **Denials and edits.** A healthy flow has some. Zero denials in months means either perfect agents or
  nobody reading.
- **Post-approval incidents.** Which approved actions later caused trouble, and did the approval screen
  show the relevant fact?

Run a periodic review: take twenty recent approvals and ask the approver whether they could say, without
looking, what they had approved.

## When not to remove the human

Some actions should always have a person: irreversible deletions, money movement, changes to permissions
and policy itself, and anything touching regulated data where a person must be accountable. For these,
invest in the approval experience rather than trying to automate it away. The goal is not to remove
people but to spend their attention where it changes the outcome.

## Key takeaways

- The MCP specification asks for the ability to deny, not for confirmation of every call.
- Approving everything trains people to approve without reading; that is worse than no prompt.
- Route actions by risk: allow low risk by policy, allow medium risk with audit, send high risk to a person.
- Show approvers the concrete change, the reason, the blast radius, the input origin and the options.
- Use sandboxing and narrow grants to cut the prompt volume, and measure approval rate and time to decision.

## Sources

- Model Context Protocol, [Tools, specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools).
- Model Context Protocol, [Elicitation, specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation).
- OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
- Anthropic, [Making Claude Code more secure and autonomous with sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing) (2025).
