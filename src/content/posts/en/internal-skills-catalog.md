---
ref: internal-skills-catalog
lang: en
title: "Building an internal skills catalog: review, ownership and discovery"
description: "Build a skills catalog for your organisation: submit, review, publish with owner and version, then deprecate. Borrows ideas from public registries."
date: 2026-09-17T09:00:00Z
tags: [skills, governance, how-to]
---

Once more than one team writes agent skills, the same problems appear that every shared-code ecosystem has: nobody knows which skill is current, two teams build the same thing, and an old skill keeps running long after its author moved on. A **skills catalog** is the answer: one place where reviewed, versioned skills are published with a named owner, where agents and people can find them, and where old skills are retired on purpose. This post describes a workflow you can run with a Git repository and a CI job, and what to borrow from public registries.

![Workflow of an internal skills catalog](/images/blog/internal-skills-catalog-1.svg)

## What a skill is, and why a catalog helps

The open format describes itself in one sentence:

> Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

Source: [Agent Skills Overview](https://agentskills.io/home), live documentation (wording as fetched on 2026-10-04).

In practice a skill is a folder with a `SKILL.md` file and optional scripts and references. Anthropic's engineering post explains why that scales:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.

Source: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), Anthropic, 2025-10-16.

An agent sees only a short name and description for each skill until it decides one is relevant, then loads the rest. That makes it cheap to have many skills, and it makes the quality of the name and description critical: they are what discovery runs on. It also means a catalog can grow large without costing tokens in every run.

## Borrow from public registries

The Model Context Protocol project launched a registry for servers and described how it is meant to be used inside organisations:

> The MCP Registry is now available in preview.

> organizations can choose to create sub-registries based on custom criteria.

Source: [Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), Model Context Protocol Blog, 2025-09-08.

Skills are not MCP servers, but the structure carries over. A public registry holds broad, uneven-quality entries; your organisation then curates a narrower sub-set on its own criteria (reviewed, supported, approved for certain data classes). Your catalog is that sub-registry for skills. Do not mirror everything automatically; admit entries one at a time.

## The workflow: four stages

### 1. Submit

A team proposes a skill through a pull request to the catalog repository. The submission contains the skill folder, an owner (a team, not only a person), a one-paragraph purpose, the tools and data the skill touches, and at least one **eval**: a few example tasks with expected outcomes. A minimal metadata block could look like this:

```yaml
name: invoice-triage
version: 1.0.0
owner: finance-automation
data_classes: [internal]
tools: [erp:read, tickets:comment]
review_due: 2027-03-01
status: active
```

The field names are an example; keep whatever your tooling can validate.

### 2. Review

Review has two parts. A **security check** looks at scripts, network access, requested tools and anything that reads secrets. Anthropic's post is direct about third-party material:

> When installing a skill from a less-trusted source, thoroughly audit it before use.

Treat every submission, even internal ones, as coming from a source you have to check: the code may be fine and the instructions may still push an agent towards actions beyond its remit. The second part is an **eval run** in CI. A skill that cannot show it works on its sample tasks does not get published. For wider supply-chain guidance see [third-party skills and the supply chain](/posts/third-party-skills-supply-chain/).

### 3. Publish

On approval, tag a version and publish an entry that includes name, description, version, owner, data classes and review date. Version rules matter: a change to instructions can change behaviour as much as a code change, so use the practices in [versioning agent skills](/posts/versioning-agent-skills/). Consumers pin versions, and upgrades go through the same review as any dependency.

### 4. Deprecate

Every skill gets a review date. At that date the owner either renews, replaces or retires it. Deprecation has steps: mark the entry, name its replacement, notify consumers, set a removal date and then remove it. Unowned skills, where the owner team no longer exists, are deprecated automatically.

## Discovery

A catalog nobody can search will be bypassed. Make it findable:

- **Good descriptions.** Say what the skill does and when to use it, in the words a user would type.
- **Tags** by domain, tool and data class.
- **A "who uses this" view,** so owners know the impact of a change.
- **Runbooks as skills.** Operational procedures are an obvious first content; see [runbooks as skills](/posts/runbooks-as-skills/).
- **A listing per agent,** showing which reviewed skills and tools that agent would load before its first run.

![Agent overview in the openagentix demo with example data: toolbox, tools and budget limits of an example agent](/images/blog/internal-skills-catalog-2.png)

*Screenshot of the current demo (fake data).*

## Ownership rules that hold up

1. Every skill has an owner team and an on-call contact in the catalog entry.
2. Only the owner merges changes; the catalog team reviews but does not own content.
3. Skills that touch sensitive data classes need an additional approver.
4. Ownership transfers are explicit pull requests, never silent.
5. A skill with a failing eval is suspended from discovery until fixed.

## Limits

A catalog reduces duplicate and orphaned skills, but it does not prove a skill is safe: reviews miss things, and evals cover only the cases someone wrote. Keep least privilege for the agents that load skills, and monitor what they actually do.

## Key takeaways

- A skills catalog is a curated sub-registry: submit, review, publish with owner and version, deprecate.
- Treat every submission, internal or not, as an item to audit, and require an eval.
- Descriptions drive discovery; invest in them.
- Give every skill an owner team and a review date, and retire skills on purpose.
- Pin versions in consumers and review upgrades like any dependency.

## Sources

- Model Context Protocol Blog, [Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), 2025-09-08.
- agentskills.io, [Agent Skills Overview](https://agentskills.io/home), live documentation.
- Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), 2025-10-16.
