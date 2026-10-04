---
ref: secrets-for-agents
lang: en
title: "Ops series: secrets for agents never belong in the context window"
description: Secrets management for AI agents in practice: keep credentials on the tool side, give the model only handles, and never pass user tokens through to downstream APIs.
date: 2026-04-02T09:00:00Z
tags: [operations, secrets, security]
---

**Secrets management for AI agents** comes down to one rule: a credential must never enter the model's
context window. Anything the model can read can end up in an output, a log line, a tool argument or a
transcript that someone exports. Credentials therefore live on the tool side, are injected at call time
by a vault or the runtime, and the model only sees names and handles such as `crm.read`. This post is
part of the operations series that treats agents as ordinary workloads, as introduced in [agent ops is
just ops](/posts/agent-ops-is-just-ops/).

## Why a secret in the prompt is a leaked secret

Teams often start by pasting an API key into the system prompt or an environment description "just
for the prototype". Look at where the text travels from there:

- It is sent to the model provider with every request.
- It appears in logs, traces and evaluation transcripts.
- The model can repeat it, for example when asked to "show the configuration" or after an injected
  instruction. An agent that reads untrusted content, as described in [the lethal
  trifecta](/posts/the-lethal-trifecta/), can be told to send its context somewhere.
- It is copied into every sub-agent prompt that inherits the context.

Rotating the key afterwards fixes one incident, not the habit. The safer design makes the leak
structurally impossible, because the secret was never in the text.

## Separate config from code, and both from the model

The Twelve-Factor methodology has long argued that deployment-specific values do not belong in the
code base:

> twelve-factor, which requires strict separation of config from code.
>
> [The Twelve-Factor App: III. Config](https://12factor.net/config) (12factor.net)

Agents add a third layer. Prompts, skills and tool descriptions are code-like artefacts that are
versioned and reviewed; credentials are config; and the model's context is neither. A useful mental
model has three zones:

```text
repository         prompts, skills, tool schemas, policies      (no secrets)
runtime config     vault paths, endpoints, per-environment      (references only)
secret store       tokens, keys, certificates                   (injected into tools)
model context      tool names, handles, task text               (never secrets)
```

The repository can be public. The model context can be logged for years. Only the secret store needs
the strict access regime.

![Credentials stay in the tool runtime, outside the model context](/images/blog/secrets-for-agents-1.svg)

## The tool runtime holds the credentials

In practice, the pattern is a thin boundary between the model and the world:

1. The model asks to call a tool by name, with arguments, for example `tickets.add_comment`.
2. The runtime checks the call against policy: tool, arguments, acting identity.
3. If allowed, the runtime fetches the credential for that one tool from the secret store, performs
   the request and returns only the result.
4. The credential is dropped from memory after the call and is never part of the returned text.

A tool definition then references a secret by name rather than carrying its value:

```yaml
tools:
  - server: tickets
    tool: add_comment
    credential: vault://agents/tickets-writer   # a handle, resolved by the runtime
    args:
      key:     { type: string, pattern: "^SEC-\\d+$" }
      comment: { type: string, maxLength: 2000 }
```

If the tool returns an error that echoes an Authorization header, scrub it before it re-enters the
context. Treat error text from tools like any other untrusted tool output.

## One credential per tool, scoped to the job

A shared "agent token" that works everywhere defeats least privilege. Prefer:

- **One credential per tool or system**, so a leak exposes one system, not all.
- **Narrow scopes**: read-only where the step only reads, a single project or repository instead of
  the organisation.
- **Short lifetimes**: tokens that expire in minutes and are minted per run, not static keys that
  live for years.
- **Per-identity grants**: the credential reflects the human or service on whose behalf the agent
  acts; see [agent identity and delegation](/posts/agent-identity-and-delegation/).

OWASP states the underlying principle for prompt-injection defence directly:

> Restrict the model’s access privileges to the minimum necessary for its intended operations.
>
> [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) (OWASP Gen AI Security Project)

The same page also recommends a human check where the stakes are high:

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.
>
> [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) (OWASP Gen AI Security Project)

## Token passthrough is an anti-pattern

A tempting shortcut is to take the token the user presented to your agent and forward it to the
downstream API. The server in the middle then acts without a real identity of its own, audit trails
point at the wrong party, and any server that accepts foreign tokens can be used as a confused
deputy. The Model Context Protocol security guidance is explicit:

> MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.
>
> [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices) (Model Context Protocol)

The same document warns against a related shortcut, using session identifiers as proof of identity:

> MCP Servers MUST NOT use sessions for authentication.
>
> [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices) (Model Context Protocol)

The fix is token exchange: the tool server authenticates the caller, then obtains its own downstream
credential, scoped for this purpose. The agent never holds the downstream token at all.

## An operations checklist

```text
[ ] No secret appears in prompts, skills, tool descriptions or example transcripts
[ ] Secrets are resolved by the runtime at call time, from a vault
[ ] One credential per tool, read-only unless the step writes
[ ] Tokens are short-lived and rotated automatically
[ ] Tool errors and logs are scrubbed for Authorization headers and keys
[ ] A secret scanner runs on the repository and on exported transcripts
[ ] Incident plan: which key to revoke, in which order, who does it
```

Run a scanner over transcripts as well as code. Transcripts are where leaked values show up first.

## Limits

Handles protect the model's context, not the machine. A tool with a broad credential and a sloppy
argument schema can still do damage inside its own scope, which is why argument constraints and
approvals matter. A compromised runtime exposes every credential it can resolve, so isolate it and
give it only the secrets its tools need.

## Key takeaways

- Treat the context window as public: nothing in it should be worth stealing.
- Keep credentials in the tool runtime and inject them from a vault at call time.
- Use one narrow, short-lived credential per tool; never a shared agent token.
- Do not pass user tokens through to downstream services; exchange them.
- Scan code and transcripts for secrets, and scrub tool errors.

## Sources

- [The Twelve-Factor App: III. Config](https://12factor.net/config), 12factor.net.
- [Security Best Practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices), Model Context Protocol, 2025-06-18.
- [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), OWASP Gen AI Security Project.
