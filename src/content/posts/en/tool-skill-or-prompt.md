---
ref: tool-skill-or-prompt
lang: en
title: "Tool, skill or prompt? Three ways to give an agent what it needs"
description: "Agent skills vs tools vs prompts: a tool acts, a skill packages know-how loaded on demand, a prompt is standing text. Includes a decision table."
date: 2026-02-26T09:00:00Z
tags: [skills, tools, mcp, architecture]
---

Agent skills vs tools is a question that sounds academic until a context window fills up with
instructions nobody remembers writing, or until an agent does something nobody meant to permit. The
short answer: a **tool** performs an action, a **skill** packages know-how that is loaded on
demand, and a **prompt** is standing instruction text that is always present. They solve different
problems, they fail in different ways, and they need different controls. Only tools need a policy
gate. Skills need provenance checks. Prompts need an owner who reads them.

![Comparison of tool, skill and prompt by purpose, loading and control](/images/blog/tool-skill-or-prompt-1.svg)

## What each one is

**A tool** is a callable capability with a name, an input schema and a result. The model asks for
it, a harness runs it, and something in the outside world may change: a ticket is created, a file
is written, a query is executed. In the Model Context Protocol, servers expose such tools to a
host application, and the specification is blunt about the risk. It puts it this way:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

**A skill** is know-how, not an action. Anthropic describes the format like this:

> Skills are folders that include instructions, scripts, and resources that Claude can load when needed.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

A skill tells the model *how* to do something well: the steps of a review, the structure of a
report, the checks before a release. It may include scripts, but the skill itself does not give the
model a new permission. What it can do still depends on the tools the agent holds.

**A prompt**, here, means standing instruction text: the system prompt, the project rules file, the
role description. It is present in every turn. That is its strength (it reliably shapes behaviour)
and its cost (every token is paid for on every call and competes for attention).

## Why the distinction matters: context is finite

The reason skills exist is context economy. Anthropic's engineering team states the design principle
plainly:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

Only a short description of each skill sits in the context all the time. The full instructions are
read when the task matches, and linked files only when they are needed. A prompt cannot do that: it
is always on. A system prompt that has grown to cover forty procedures is a skill library that
someone forced into the wrong shape.

The same team's article on context engineering explains why this matters:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Tool definitions count toward that budget too. Fifty tool schemas offered on every turn are a
standing prompt in disguise. So the first practical rule is to place each piece of guidance where
its loading behaviour matches how often it is needed.

## A decision table

| Question | Tool | Skill | Prompt |
| --- | --- | --- | --- |
| Does it change something outside the model? | Yes | No, it guides | No |
| Is it needed on every turn? | Only the definition | No, on demand | Yes |
| Can it be wrong in a way that costs money or data? | Yes, directly | Indirectly, through the steps it suggests | Indirectly |
| Who has to review it? | Security and the system owner | The owner of the know-how | The agent owner |
| What controls it at run time? | A policy gate on every call | Provenance, review and versioning | Version control and review |

Two questions settle most cases. Does anything happen in the world when this is used? Then it is a
tool, or a skill that calls tools, and the tools carry the risk. Is it needed on every turn? If not,
it probably does not belong in the prompt.

## Different artefacts, different controls

This is where mixing them up becomes a governance problem rather than a style problem.

**Tools need a policy gate.** A tool call is the moment where intent becomes effect. The decision to
allow it should not depend on the model's good behaviour. A deterministic gate checks the identity,
the tool and the arguments before the call runs and records the decision, as described in
[Policy decides, audit proves](/posts/policy-decides-audit-proves/). Granting a tool to an agent
should also be narrow: the principle in [Least privilege for agents](/posts/least-privilege-for-agents/)
applies to every tool, and a tool that is not granted should not even be shown to the model. The MCP
specification adds a warning that belongs in every tool review:

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

A tool's own description of how safe it is cannot be the control.

**Skills need provenance checks.** A skill is text that will steer the model and may ship scripts
that run. Installing one is closer to adding a dependency than to reading an article. Anthropic's
guidance is short:

> When installing a skill from a less-trusted source, thoroughly audit it before use.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

In practice that means: know where it came from, pin a version or commit, read the instructions and
every script, and keep the copy in your own repository. A skill cannot grant itself a permission
that policy withholds, but it can steer an agent toward misusing the permissions it has, so the
review matters.

**Prompts need an owner.** Prompts have no gate and no loading logic. Their control is the boring
one: they live in version control, a named person owns them, and changes are reviewed like code.
The most common prompt failure is accretion, where every incident adds another paragraph.

## Common mistakes

- **A skill hidden in the system prompt.** Forty procedures, loaded every turn. Move each into a
  skill with a precise description.
- **A tool that is really a skill.** A "tool" that only returns a block of instructions performs no
  action. Make it a skill and the policy surface shrinks.
- **A skill that smuggles in permissions.** If a skill's script needs network access or write
  access, that need belongs in the tool grants and the policy, not in a README.
- **One broad tool instead of several narrow ones.** A tool that accepts any action and target
  cannot be governed with a short rule. Narrow tools make allow and deny decisions easy.

## A short checklist

1. List what the agent can do (tools), what it knows how to do (skills) and what it is told on every
   turn (prompts). Three lists, not one.
2. For each tool: is it granted per agent, is its argument shape constrained, is every call decided
   by policy?
3. For each skill: where did it come from, which version is pinned, who reviewed the scripts?
4. For each prompt paragraph: is it needed on every turn? If not, move it into a skill.
5. Watch the standing context. If it keeps growing, something is in the wrong box.

A harness can gate tool calls, but it cannot judge a paragraph in a prompt, which is one more
reason to keep the three apart. For the harness itself, see
[What is an agent harness](/posts/what-is-an-agent-harness/).

## Key takeaways

- A tool acts, a skill teaches, a prompt instructs on every turn.
- Put guidance where its loading behaviour fits: needed rarely means skill, needed always means prompt.
- Only tools need a policy gate; granting them narrowly is the main safety lever.
- Skills are supply chain: check provenance, pin versions, read the scripts.
- Prompts need an owner and version control, and they should stay small.

## Sources

- Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (2025-10-16)
- Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills) (2025-10-16)
- Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29)
