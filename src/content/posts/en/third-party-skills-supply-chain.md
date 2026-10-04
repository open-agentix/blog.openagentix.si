---
ref: third-party-skills-supply-chain
lang: en
title: "Third-party skills are supply chain: an agent skill security checklist"
description: Agent skill security starts with treating third-party skills as dependencies. A checklist for provenance, pinning, full review and least privilege.
date: 2026-04-28T09:00:00Z
tags: [skills, security, supply-chain, checklist]
---

**Agent skill security** begins with one reframing: installing a third-party skill is adding a
dependency. A skill is a folder of instructions and often scripts that run with the agent's
permissions, so a malicious or careless one can read data, call tools and execute code on your
behalf. Review it as you would review a library that gets run on your build server, and then some,
because part of it is written in natural language aimed at your agent.

## Why skills are different from documents

A skill looks like documentation: a Markdown file with a name and a description, perhaps some
reference files and scripts. Its design is what makes it powerful. Anthropic's engineering team
describes the mechanism:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.
>
> [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (Anthropic, 2025)

Only a short description sits in the context all the time; the full instructions and files load when
the agent decides the skill is relevant. For security, that has two consequences. First, a reviewer who
reads only the description sees a fraction of what the agent will later read. Second, the content that
loads on demand arrives as trusted-looking instructions, which is the opening for the attacks described
in [indirect prompt injection](/posts/indirect-prompt-injection/). For the structure of a well-formed
skill, see [anatomy of an agent skill](/posts/anatomy-of-an-agent-skill/).

The same article is direct about what to do with skills from less-trusted sources:

> When installing a skill from a less-trusted source, thoroughly audit it before use.
>
> [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (Anthropic, 2025)

The rest of this post turns "thoroughly audit" into a concrete checklist.

## What can go wrong

- **Hidden instructions.** Text in the skill, in a referenced file or in an HTML comment tells the
  agent to ignore rules, send data elsewhere or hide its actions.
- **Malicious scripts.** A bundled script downloads and runs code, reads environment variables or
  writes to credential files.
- **Runtime fetches.** The skill tells the agent to read instructions from a URL at run time. The URL's
  owner can change the content after you reviewed it.
- **Tool poisoning.** Descriptions of tools that a skill relies on carry hidden directions. Invariant Labs
  described this for MCP tools as

> a specialized form of indirect prompt injections
>
> [MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks) (Invariant Labs, 2025)

- **Silent updates.** The upstream repository changes after install and your agent follows the new text.
- **Over-broad permissions.** The skill asks for, or assumes, tools it does not need.

## The review checklist

![Review checklist for third-party agent skills](/images/blog/third-party-skills-supply-chain-1.svg)

### 1. Provenance

Who wrote it, where does it live, and can you verify that? Prefer authors and repositories with a
visible history, signed tags or releases, and a licence. An anonymous snippet from a forum is not a
source. Record the origin (URL, commit, date) in a file next to the copy.

### 2. Pin the version

Never track "latest". Pick an exact commit or release and keep a copy of that version. A skill that
changes upstream should require a new review, in the same way a dependency bump does. This is the
discipline of [change management for agents](/posts/change-management-for-agents/) applied to
inbound artefacts.

### 3. Read the whole folder

Read every file, not just the main instruction file: references, templates, scripts, hidden files,
binary blobs. Search for the usual suspects:

```bash
grep -rniE "curl|wget|http[s]?://|eval|base64|exec|subprocess|\.env|ssh|token|password" skill-folder/
grep -rniE "ignore (all|previous)|do not tell|secretly|without asking" skill-folder/
```

A search is a helper, not a verdict. Read the hits, and read what the search cannot find, such as
text encoded in unusual ways. If a file is a binary or minified blob you cannot read, do not install.

### 4. No runtime fetches

The skill must not instruct the agent to download instructions, scripts or packages when it runs. If
it needs a dependency, vendor it into the pinned copy or install it from a reviewed lockfile. A
rule such as "never load instructions from the internet at runtime" is simple to state and simple to
check by the grep above.

### 5. Review the scripts like code

For each script: what does it read, write, execute and send over the network? Run it in a sandbox
without credentials first. Check that it does not reach outside the skill's own working directory.

### 6. Least privilege

Grant the agent that uses the skill only the tools the skill needs, and restrict their arguments. A
formatting skill needs no network and no write access outside the project. See [least privilege for
agents](/posts/least-privilege-for-agents/) for how to scope tools per agent.

### 7. Keep a pinned copy in your own repository

Install from your own reviewed copy, not from a URL. That gives you a diff for every update, a place
to record the review, and independence from upstream changes or takedowns.

## Verify integrity where you can

OWASP's guidance on LLM supply chain risks is written about models, but the principle transfers to any
artefact you pull in:

> Only use models from verifiable sources and use third-party model integrity checks with signing and file hashes
>
> [LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/) (OWASP Gen AI Security Project)

For skills, the equivalents are signed tags or releases where the author provides them, and a hash of
your reviewed copy recorded in your repository, so a changed file is detected.

## After installation

Review does not end at install. Log which skills were loaded in each run, so an incident can be traced
to a skill version. Watch for behaviour changes after an update. Keep an inventory of installed skills
with owner, version, source and review date, and remove what nobody uses. Limit what a compromised skill
could do by default, using policy gates that do not depend on the model's cooperation.

## Limits

No checklist makes an unknown skill safe, because natural-language instructions can be disguised in
ways no scanner reliably catches. The honest position is: review reduces risk, least privilege limits
the damage, and anything that cannot be reviewed is not installed.

## Key takeaways

- A third-party skill is a dependency that can carry instructions and executable code.
- Establish provenance, pin an exact version and read the entire folder, not just the main file.
- Forbid runtime fetches; vendor or lock what the skill needs.
- Review scripts like code and run them in a sandbox without credentials first.
- Install from a pinned copy in your own repository and give the agent only the tools the skill needs.

## Sources

- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), Anthropic, 2025-10-16.
- [LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/), OWASP Gen AI Security Project.
- [MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks), Invariant Labs, 2025-04-01.
