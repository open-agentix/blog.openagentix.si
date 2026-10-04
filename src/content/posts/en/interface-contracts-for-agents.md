---
ref: interface-contracts-for-agents
lang: en
title: "Structured output for agents: schemas, contracts and ownership"
description: "Structured output agents hand over typed data, not free text. Define JSON schemas for tool results and outputs, version them and name an owner per contract."
date: 2026-08-25T09:00:00Z
tags: [architecture, tools, how-to]
---

Free text between agents is where errors hide. If one agent passes a paragraph to the next, nobody can test the handover, and a changed phrasing can silently break the consumer. The fix is the same one software engineering found long ago: a contract. Define typed inputs and outputs with JSON Schema, validate them at every boundary, version them with semantic versioning and name an owner for each contract. This post shows how to make structured output for agents testable and who decides when a contract changes.

## What a contract contains

![Interface contract card for an agent handover](/images/blog/interface-contracts-for-agents-1.svg)

A contract for one handover (agent to agent, or agent to tool) needs five things:

1. **Input schema.** What the receiver accepts.
2. **Output schema.** What the receiver promises to return, including error shapes.
3. **Owner.** The team that can change it and answers questions.
4. **Version.** A number that tells consumers whether a change can break them.
5. **Compatibility rule.** What kinds of change are allowed within a version line.

This is the same idea as an API contract, applied to a boundary where a model sits on one or both sides. For the wider picture of how work is passed between agents, see [handovers and contracts](/posts/handovers-and-contracts/).

## Step 1: describe results with a schema

Start with the output of one agent, such as a triage step that classifies a security finding. Write the schema first, then the prompt.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CveFinding",
  "type": "object",
  "required": ["cve_id", "severity", "affected", "rationale"],
  "additionalProperties": false,
  "properties": {
    "cve_id": { "type": "string", "pattern": "^CVE-\\d{4}-\\d{4,}$" },
    "severity": { "enum": ["low", "medium", "high", "critical"] },
    "affected": { "type": "boolean" },
    "rationale": { "type": "string", "maxLength": 500 }
  }
}
```

Design choices that pay off:

- **Enums over free strings** wherever a fixed set exists.
- **Patterns and length limits** for identifiers and text fields, so an oversized or malformed value is rejected rather than passed on.
- **`additionalProperties: false`** so unexpected fields fail loudly instead of travelling on.
- **A separate field for free-text reasoning** (`rationale` above), kept short and treated by consumers as display text, never as instructions.
- **An explicit error shape**, for example `{"error": {"code": "...", "retryable": true}}`, so consumers do not guess from prose.

## Step 2: validate at every boundary

A schema that nobody checks is documentation. Validate output when it leaves the producer and again when it enters the consumer, in code and outside the model:

```python
from jsonschema import Draft202012Validator

validator = Draft202012Validator(CVE_FINDING_SCHEMA)
errors = sorted(validator.iter_errors(candidate), key=lambda e: e.path)
if errors:
    raise HandoverRejected(
        contract="cve-finding", version="2.1.0",
        problems=[e.message for e in errors],
    )
```

On failure you have three options: retry the producer once with the validation errors in the prompt, route to a human, or fail the run. Choose per contract and log the decision. Many model APIs can constrain output to a schema directly; use that where available, but still validate on your side, because a constrained decoder guarantees shape, not meaning or truth.

## Step 3: tool results and tool input are contracts too

The same discipline applies to tools. The Model Context Protocol specification defines how tools declare their input and output shapes, and it adds guidance about trust and oversight:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.

and

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.

Source for both: [Tools, MCP specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools). Two lessons follow. A schema describes shape, but a tool's description and annotations are text supplied by whoever runs the server, so they are not a safety guarantee. And contracts for tools that change the world should include an approval rule next to the schema.

For good tool schemas in general, including naming and error messages, see [writing tools agents can use](/posts/writing-tools-agents-can-use/). Anthropic's engineering guidance adds a point about organisation:

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.

Source: [Writing effective tools for AI agents—using AI agents, Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents). A prefix such as `tickets.` or `crm.` is a cheap way to make ownership visible: every tool under a prefix has the same owner and the same contract conventions.

## Step 4: version the contract

Contracts change. Semantic Versioning gives a shared vocabulary; its rule for the major number is:

> MAJOR version when you make incompatible API changes

Source: [Semantic Versioning 2.0.0, semver.org](https://semver.org/). Applied to schemas:

| Change | Version bump | Why |
| --- | --- | --- |
| Add an optional output field | minor | Existing consumers ignore it |
| Fix a description or example | patch | No behavioural change |
| Make an optional field required | major | Producers must change |
| Remove or rename a field, narrow an enum | major | Consumers may break |
| Widen an enum on the output side | major or minor, by agreement | Consumers with exhaustive switches break |

Put the version in the contract file and in every message (`"contract": "cve-finding@2.1.0"`) so logs show which version a run used. When a model or prompt changes, re-run the contract tests even if the schema did not change, because the same schema can be satisfied worse. Instruction files and skills evolve the same way; see [versioning agent skills](/posts/versioning-agent-skills/).

## Step 5: assign ownership

A contract without an owner decays. Write the rules down:

- **One owning team per contract**, listed in the contract file.
- **The producer proposes changes; consumers review.** A change that breaks a consumer needs that consumer's sign-off or a migration period with both versions supported.
- **Breaking changes get a deprecation window** and a date.
- **Contract tests live with the contract.** Each consumer contributes at least one example message it relies on; the producer's build runs them.

A compact contract file keeps all of this in one place:

```yaml
contract: cve-finding
version: 2.1.0
owner: security-platform
producer: triage
consumers: [notify, report]
input_schema: schemas/finding-input.json
output_schema: schemas/cve-finding.json
compatibility: minor adds optional fields only; major for anything else
approval: none            # read-only handover
```

## Limits

- Schemas check shape, not correctness. A valid `severity: "low"` can still be wrong; keep evaluations for content quality.
- Strict schemas can make a model fail more often. Measure retry rates and loosen only deliberately.
- Free-text fields remain a channel for injected instructions. Keep them short, display them as data, and never pass them to another agent as instructions without a gate.
- Contracts add process. For a single agent with two tools, a schema and a test may be all you need.

## Key takeaways

- Replace free text between agents with typed contracts: input schema, output schema, owner, version, compatibility rule.
- Validate in code at both ends of every handover, outside the model.
- Treat tool descriptions and annotations as untrusted text; put approval rules next to schemas.
- Use Semantic Versioning for contracts and run contract tests when models or prompts change.
- Name one owner per contract and require consumer review for breaking changes.

## Sources

- [Tools, Model Context Protocol specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [Writing effective tools for AI agents—using AI agents (Anthropic, 2025-09-11)](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Semantic Versioning 2.0.0 (semver.org)](https://semver.org/)
