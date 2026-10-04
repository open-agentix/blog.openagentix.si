---
ref: agent-security-checklist
lang: en
title: "The agent security checklist: twenty questions before production"
description: "AI agent security checklist: twenty yes/no questions on identity, permissions, data flow, injection, sandboxing, supply chain and audit, each with a link."
date: 2026-09-03T09:00:00Z
tags: [security, checklist, governance]
---

Before an agent goes to production, answer twenty questions. If any answer is "no" or "we do not know", that is the work item. This **AI agent security checklist** condenses the security posts of this blog into seven areas: identity, permissions, data flow, injection, sandboxing, supply chain and audit. It is a threat model in question form, not a certification, and it will not replace a review by someone who knows your environment.

![Agent security checklist grouped by area](/images/blog/agent-security-checklist-1.svg)

How to use it: print the list, answer each question per agent (not per platform), and write the evidence next to the answer, such as a config file, a policy rule or a log query. "Probably" is a "no".

## 1. Identity

1. **Does every agent run under its own identity?** Shared service accounts make it impossible to tell which agent did what. One identity per agent, and per environment.
2. **Is it clear on whose behalf the agent acts?** An agent acting for a user should carry that user's authority at most, never more. Record both the agent and the user in every call.
3. **Are tokens short-lived and scoped to one audience?** A token issued for one server must not work against another. The MCP specification is blunt about this:

> MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.

Source: [Security Best Practices, MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices). The same page also says how a session must not be used:

> MCP Servers MUST NOT use sessions for authentication.

The details of the authorization flow are in [MCP authorization with OAuth](/posts/mcp-authorization-oauth/).

## 2. Permissions

4. **Does each agent hold only the tools its step needs?** Split broad agents into small ones; see [least privilege for agents](/posts/least-privilege-for-agents/).
5. **Are tool arguments constrained, not just tool names?** "May call `add_comment`" is weak; "may add one comment of at most 2000 characters to tickets matching `SEC-<number>`" is a rule you can test.
6. **Do irreversible or external actions require approval?** Sending mail, deleting data, moving money and publishing should pause for a person with the right role.

## 3. Data flow

7. **Can you draw where data enters and leaves each agent?** Sources, sinks and the trust level of each. If you cannot draw it, you cannot reason about leaks.
8. **Are secrets kept out of prompts and out of tool results?** Credentials belong in the tool layer, not in the model's context. The MCP spec also forbids using elicitation to ask users for sensitive data (see [MCP sampling, elicitation and tasks](/posts/mcp-sampling-elicitation-tasks/)).
9. **Is there a rule for what may leave the organisation?** Outbound domains, attachments and logs sent to third parties need an explicit allowlist.

## 4. Injection

10. **Is all external text treated as untrusted?** Web pages, tickets, emails and tool results can contain instructions. The model cannot reliably tell data from commands.
11. **Does any single agent combine private data, untrusted content and an outbound channel?** That combination is the pattern described in [the lethal trifecta](/posts/the-lethal-trifecta/). Remove one leg.
12. **Does a deterministic gate sit between model output and side effects?** The model proposes, policy decides; see [policy decides, audit proves](/posts/policy-decides-audit-proves/). Claude Code's documentation says the same in plain words:

> Servers that fetch external content can expose you to prompt injection risk.

Source: [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) (live documentation, wording as fetched on 2026-10-04).

## 5. Sandboxing

13. **Does code execution happen in a sandbox with no ambient credentials?** No home directory, no cloud metadata endpoint, no inherited environment variables.
14. **Is network egress denied by default?** Allow named hosts only. See [sandboxing agents](/posts/sandboxing-agents/).
15. **Are CPU, memory, time and spend limited per run?** A looping agent should hit a ceiling before it hits your invoice.

## 6. Supply chain

16. **Do you know every MCP server and skill an agent can load, and who owns it?** The same docs give the rule in one line:

> Verify you trust each server before connecting it.

17. **Are versions pinned and changes reviewed?** A server or skill that changes silently is a new, unreviewed dependency.
18. **Do you know which model and provider handle which data?** Include the region, retention and the fallback model if the primary fails.

## 7. Audit

19. **Is every tool call recorded with arguments, decision and acting identity?** A plain log is a start; an append-only, tamper-evident record is better.
20. **Can you stop an agent and reconstruct what it did?** A kill switch and a replayable record are the minimum for incident response.

## Mapping to the OWASP list

The checklist is not a copy of any standard. If you need to map it, the [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) is the natural reference; it describes itself like this:

> identifies the most critical security risks facing autonomous and agentic AI systems.

A walk-through of the list is in [the OWASP agentic top 10](/posts/owasp-agentic-top-10/). For terminology on attacks and mitigations, NIST's [adversarial machine learning taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) is a useful vocabulary:

> provides a taxonomy of concepts and defines terminology in the field of adversarial machine learning (AML).

## An example of a policy decision

In the current demo, a policy decision shows the requested tool, its arguments, the rule that matched and the outcome, for example "require approval" for a write to an example ticket. That is the shape question 12 asks for: a visible rule, a visible decision, no model discretion.

<!-- screenshot-slot: Policy decision detail in the current demo: requested tool, arguments, rule matched, decision 'require approval', all with example.org data -->

## Scoring and next steps

Count the answers you can back with evidence. Fewer than fifteen means the agent is a pilot, not a production service. Fix questions 6, 11 and 12 first: they limit the damage of the failures you cannot predict. Then repeat the review when tools, skills or models change; a checklist answered once is a snapshot.

## Key takeaways

- Twenty questions in seven areas: identity, permissions, data flow, injection, sandboxing, supply chain, audit.
- Answer per agent and keep evidence; "probably" counts as "no".
- The most valuable controls are structural: remove a leg of the trifecta, gate side effects, deny egress.
- Re-run the checklist whenever a tool, skill, server or model changes.

## Sources

- OWASP Gen AI Security Project, [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), published 2025-12-09.
- Model Context Protocol, [Security Best Practices (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices).
- NIST, [AI 100-2 E2025, Adversarial Machine Learning](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), published 2025-03-24.
- Anthropic, [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp), live documentation.
