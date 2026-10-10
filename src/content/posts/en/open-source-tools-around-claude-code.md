---
ref: open-source-tools-around-claude-code
lang: en
title: "Five open tools around Claude Code: alternatives, companions and what they really are"
description: "OpenCode, OpenRouter, Open WebUI, openagentix and Ollama sorted honestly: harness, router, chat UI, platform or runtime. Where each fits and how they combine."
date: 2026-10-13T07:00:00+02:00
tags: [harness, comparison, self-hosted, open-source]
---

Lists of "open-source alternatives to Claude Code" usually put very different things side by side.
Of the five tools in this post, only one is a direct alternative: OpenCode is a coding agent harness
like Claude Code. The others sit in different layers. OpenRouter is a hosted model router, Open WebUI
is a chat interface, Ollama is a local model runtime, and openagentix is a platform for running agents
on events under a policy gate. Several of them are better described as companions, and one of them is
not open source at all. This post sorts them by layer, says where each one fits and where it does not,
and shows how they combine.

A caution first. All five projects change quickly. Statements about third-party products below reflect
public documentation and repositories as of 2026-10 and should be checked against the version you
actually deploy. openagentix is our own project; it is open source, pre-1.0 and still in progress, and
we mark what is planned as planned.

## Five layers, not five competitors

![Five tools placed on the layers of an agent stack](/images/blog/open-source-tools-around-claude-code-1.svg)

An agent setup has a few distinct jobs, which the post on [what an agent harness
is](/posts/what-is-an-agent-harness/) covers in more depth:

- **Interface:** where a person types and reads (terminal, IDE, chat window).
- **Harness:** the loop that sends context to a model, receives tool calls, checks permissions and runs
  tools. This is where Claude Code lives.
- **Model access:** how requests reach a model, with which key and which provider.
- **Model runtime:** where inference actually runs if you host the model yourself.
- **Platform:** who triggers agents without a person at the keyboard, and who enforces policy, audit and
  budgets across many runs and teams.

Claude Code covers the interface and the harness, and uses Anthropic models (directly or through the
cloud platforms Anthropic supports). It is a proprietary product, not published under an open-source
licence. The five tools below fill one or more of the other layers.

## OpenCode: the actual alternative (harness)

OpenCode is an open-source coding agent for the terminal, published under the MIT licence. It is the
only tool in this list that does the same job as Claude Code: read the repository, plan, edit files, run
commands, ask for permission according to rules. We compared the two on governance controls in [Claude
Code vs OpenCode](/posts/claude-code-vs-opencode/).

**Where it shines:** provider choice. OpenCode is designed to work with many model providers, including
local models behind an OpenAI-compatible endpoint. That makes it the natural choice when a team needs a
self-hosted model for data-residency reasons or wants to compare models on its own tasks with one
harness.

**Where it falls short:** the harness is only as good as the model behind it. With a small local model,
long tool loops and multi-file changes get noticeably less reliable, and that is a property of the
model, not of OpenCode. Central configuration and audit for a whole organisation are also not what a
single-user terminal tool is built for; check what your version offers before assuming it.

## OpenRouter: a router, and not open source

OpenRouter is a hosted service that gives you one API, one key and one bill for models from many
providers, with an OpenAI-compatible interface. It belongs in the model-access layer. It is a commercial
service, not an open-source tool: you cannot self-host it. It is in this list because it is often named
in the same breath, and it is fair to say so plainly.

**Where it shines:** trying many models without opening an account with every provider, and switching a
harness such as OpenCode between models by changing one model identifier. Provider routing and fallback
options are documented in its [provider selection guide](https://openrouter.ai/docs/guides/routing/provider-selection)
(live documentation; check the current options).

**Where it falls short:** it adds a party to your data flow. Prompts, code and tool results pass through
the router as well as through the model provider, so the data-protection review now covers two
companies, not one. Routing can also mean that the same model name is served by different upstream
providers, which matters when you try to reproduce a result. If you route, pin the provider choices you
depend on and record them per run. [BYOK explained](/posts/byok-explained/) covers the key side of this.

## Open WebUI: a chat interface (with a licence to read)

Open WebUI is a self-hosted web interface for chatting with models. It connects to Ollama and to
OpenAI-compatible APIs and adds features such as document upload, knowledge bases and user management.
It belongs in the interface layer. It is a good front end for people who want to ask questions; it is
not a coding agent harness that edits a repository in a loop.

Its licence deserves a sentence. Since version 0.6.6 (April 2025) the project uses its own "Open WebUI
License": BSD-3-style terms plus a clause that forbids removing or altering the Open WebUI branding in
deployments above 50 users, unless you have permission or an enterprise licence. The project's own
summary:

> our license remains permissive, but now adds a fair-use branding protection clause

Source: [Open WebUI documentation, License](https://docs.openwebui.com/license/) (live documentation,
read 2026-10). Whether that still counts as "open source" in the sense of the OSI definition is debated;
read the licence yourself before you rebrand or redistribute it.

**Where it shines:** giving a team a private chat front end for local or hosted models without building
one. **Where it falls short:** as a substitute for Claude Code. Chat with tools is not the same as an agent
that runs tests and edits files under permission rules.

## Ollama: a local model runtime

Ollama runs open-weight models on your own machine or server and exposes them over an HTTP API,
including OpenAI-compatible endpoints. It is MIT-licensed. It belongs in the runtime layer: it does not
plan, edit or ask for permission; it answers model requests.

**Where it shines:** keeping prompts and code on your own hardware, offline work, and low-effort
experiments. Combined with OpenCode it gives a fully local coding setup; combined with Open WebUI, a local
chat. **Where it falls short:** model size and hardware. What fits on a workstation GPU is usually much
smaller than hosted frontier models, and for agent work that shows up as more failed tool calls and more
retries. Model tags can also be updated in place, so pin by digest if reproducibility matters. The
operational side is covered in [self-hosted models for agents](/posts/self-hosted-models-for-agents/).

## openagentix: a platform for unattended runs (in progress)

openagentix is our open-source (Apache-2.0), self-hostable agent platform. It is not an interactive
coding assistant. Events come in (webhook, cron, Kafka, mail), agents defined in versioned `agents.md`
files act on them through MCP tools, and a deterministic policy gate checks every tool call before it
runs. Runs are recorded in a hash-chained audit trail, and tokens and costs are tracked per step with
budgets that stop a run.

Its relation to the other four: it can run a step through Claude Code as an external harness behind the
policy gate (on `main`, shipping with 0.2, verified with a real run in the direct mode). An OpenCode
adapter is implemented and tested against a fake command-line tool; its real-run verification is still
pending, as is the verification of both harnesses inside isolated run nodes with pinned binaries. Models can come from Anthropic, Bedrock,
OpenAI, Azure OpenAI, OpenRouter, vLLM, Ollama or any OpenAI-compatible server. The
[roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) shows what is done and what
is planned.

**Where it fits:** scheduled or event-driven agent jobs that need least privilege, approvals, an audit
trail and cost limits, such as triaging a vulnerability finding or drafting a ticket update. **Where it
does not fit (today):** a developer's interactive pair-programming session; that is what a harness is
for. It is also pre-1.0 software; evaluate it as such.

## Decision table

| Tool | Layer | Licence (as of 2026-10) | Alternative to Claude Code? | Good fit | Poor fit |
| --- | --- | --- | --- | --- | --- |
| OpenCode | Harness (terminal agent) | MIT | Yes | Same workflow with free provider choice, local models | Expecting frontier results from a small local model |
| OpenRouter | Model access (hosted router) | Proprietary service | No | Trying and switching many hosted models with one key | Strict data-flow requirements, exact reproducibility |
| Open WebUI | Interface (web chat) | Open WebUI License (BSD-3 plus branding clause) | No | Private team chat over local or hosted models | Repository-editing agent work |
| Ollama | Model runtime (local) | MIT | No | Prompts and code stay on your hardware | Large models on small hardware |
| openagentix | Platform (event-driven, governed) | Apache-2.0, pre-1.0 | No, it can run harnesses | Unattended jobs with policy, audit and budgets | Interactive coding sessions |

## How they combine

The layers stack, so the useful question is which combination fits a task:

- **Fully local coding:** OpenCode as harness, Ollama as runtime. Nothing leaves the machine; quality is
  bounded by the local model.
- **Model shopping:** OpenCode with OpenRouter. One harness, many hosted models; add the router to your
  data-protection review.
- **Team chat:** Open WebUI in front of Ollama (and optionally a hosted API). Questions and documents, not
  repository changes.
- **Unattended, governed jobs:** openagentix triggers a step on an event, runs it natively or through a
  harness behind the policy gate, and uses a hosted or self-hosted model. The interactive work stays in
  Claude Code or OpenCode on the developer's machine.

What none of these combinations removes is the need to decide what an agent may do. Permission rules in
the harness, [least privilege](/posts/least-privilege-for-agents/) for tools and a central gate where it
matters apply whichever tools you pick.

## Key takeaways

- Only OpenCode is a direct alternative to Claude Code; the others are a router, a chat UI, a runtime and
  a platform.
- OpenRouter is a hosted commercial service, not open source, and adds a party to your data flow.
- Open WebUI uses its own licence with a branding clause; read it before redistributing.
- Ollama keeps inference local; model size and hardware set the quality ceiling.
- openagentix runs agents on events under a policy gate and can run harnesses as steps; it is open
  source and pre-1.0.
- Choose by layer and combine, and check every statement against the version you deploy.

## Sources

- OpenCode, [documentation](https://opencode.ai/docs/) and [repository](https://github.com/anomalyco/opencode) (MIT).
- OpenRouter, [quickstart](https://openrouter.ai/docs/quickstart) and [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection) (live documentation).
- Open WebUI, [documentation](https://docs.openwebui.com/), [License](https://docs.openwebui.com/license/) and [repository](https://github.com/open-webui/open-webui).
- Ollama, [website](https://ollama.com/) and [repository](https://github.com/ollama/ollama) (MIT).
- openagentix, [repository](https://github.com/open-agentix/open-agentix) and [roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) (Apache-2.0).
