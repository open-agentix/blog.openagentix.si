---
ref: self-hosted-models-for-agents
lang: en
title: "Self-hosted models for agents: what changes when inference is yours"
description: "Self-hosted LLM for agents: prompts stay in house, but you own capacity, updates and evaluation. Local runtimes versus batched servers and the ops work."
date: 2026-07-14T09:00:00Z
tags: [self-hosted, operations, how-to]
---

Running a self-hosted LLM keeps prompts and data inside your own infrastructure, and in exchange you become the model provider: you size the hardware, choose and update the weights, watch latency and judge quality. For a single developer a local runtime is enough. For many agents running at once you need a serving layer that batches requests. Either way, the operational work does not disappear; it moves to your team.

## Why teams self-host

The reasons are usually concrete, not ideological:

- **Data stays put.** Prompts, tool outputs and documents never leave your network.
- **Predictable cost.** After the hardware is paid for, a token costs electricity and operations time rather than an invoice line.
- **Network independence.** The platform keeps working when an external provider has an outage or when there is no route to the internet at all (for example in a fully isolated network).
- **Control over versions.** A model does not change underneath you unless you change it.

On the privacy point, Ollama's documentation is direct about what running locally means:

> We don’t see your prompts or data when you run locally.

Source: [Ollama docs, FAQ](https://docs.ollama.com/faq).

Note what the sentence says: the vendor of the runtime does not see your data. It does not say that nothing else can. Your own logs, your own gateway and your own backups still hold the prompts, and they need the same protection as any other sensitive store.

## Two deployment shapes

![Local runtime versus batched serving for self-hosted models](/images/blog/self-hosted-models-for-agents-1.svg)

**A local runtime** runs a model on one machine, typically with a simple API on top. Tools like Ollama fit here. It is quick to set up, works on a workstation or a single server, and is a good fit for experiments, for small teams and for agents that run occasionally. Its limit is concurrency: one machine, a limited number of simultaneous requests.

**A batched serving system** is built for many parallel requests. The key problem is that generating text for many requests at once uses the GPU far better than one request at a time, but only if memory is managed well. The paper behind vLLM states the starting point:

> High throughput serving of large language models (LLMs) requires batching sufficiently many requests at a time.

Source: [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) (arXiv, 2023-09-12).

Servers in this class, vLLM among them, exist to keep the GPU busy across many agents. They typically need more GPU memory, more tuning and more monitoring than a local runtime, and you size them for peak concurrency, not for average use.

A rough way to choose:

| Question | Leans local runtime | Leans batched serving |
| --- | --- | --- |
| Simultaneous agent runs | a handful | dozens or more |
| Who operates it | the developers themselves | a platform or ops team |
| Latency target | "good enough" | an agreed service level |
| Hardware | one workstation or server | one or more GPU nodes |

Many teams start with the first and move to the second when queueing becomes visible.

## The operational work you take on

Hosting your own inference adds a list of chores that a hosted API quietly handles. Plan for each.

### Capacity and queueing

Agents are bursty: a pipeline can start dozens of runs at once, each making several model calls. Decide what happens when the queue is full. Options are to wait, to fall back to another model or to fail fast with a clear error. Measure time to first token and total time per request, not just throughput.

### Model selection and updates

Choose models for the job: a smaller model for routing and extraction, a larger one for planning. When a better model appears, treat the swap as a release. Run your evaluation set against it before it takes traffic, and keep the previous version available for rollback. A model update is a behaviour change even when the prompts stay the same.

### Evaluation, always

A hosted provider evaluates its own models; you must evaluate the one you run, for your tasks. Keep a small set of representative runs, with expected outcomes, and rerun it on every model, quantization or runtime change. Quantization saves memory and can cost quality in ways that only your own tests show.

### Supply chain of weights and runtimes

Model files are binary artefacts from the internet, and the serving software is a dependency like any other. OWASP lists this under supply chain risks and gives a clear rule:

> Only use models from verifiable sources and use third-party model integrity checks with signing and file hashes

Source: [OWASP, LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/).

In practice: download from the publisher, record the hash, store the file in an internal registry, and let the serving nodes pull only from there. Patch the runtime and its libraries on a schedule; the process is the same one described in [patching the agent supply chain](/posts/patching-the-agent-supply-chain/).

### Observability and service levels

If agents depend on your inference service, it needs targets like any other service: availability, latency percentiles and error rate. [SLOs for agents](/posts/slos-for-agents/) shows how to define them at the agent level and trace failures back to the model layer. At the serving layer, watch GPU memory, queue depth and time to first token.

### Security of the endpoint itself

An inference endpoint is an internal API that executes expensive work for whoever calls it. Put authentication in front, limit who can reach it, and log requests. A local runtime bound to a network interface with no authentication is an easy way to give every machine on the network a free GPU.

## Combining self-hosted and hosted models

Self-hosting does not have to be all or nothing. A common pattern is to run a self-hosted model for sensitive data and routine tasks and to route hard problems to a hosted provider through a gateway, as described in [BYOK for agent platforms](/posts/byok-explained/). The gateway makes the choice per agent, and a policy decides which data classes may leave the network.

## What self-hosting does not give you

- **Better quality by default.** Open-weight models vary; the best hosted models may still outperform what you can run.
- **Lower cost at low volume.** Idle GPUs are expensive. Count hardware, power, staff time and the cost of being wrong.
- **Less work.** The work changes from vendor management to operations.

## Key takeaways

- Self-hosting keeps data in house and makes you responsible for capacity, updates and evaluation.
- Use a local runtime for one team and occasional runs; use batched serving for many parallel agents.
- Treat model changes as releases with an evaluation run and a rollback path.
- Verify weights with hashes and signatures; patch runtimes on a schedule.
- Put authentication and service-level targets on the inference endpoint.

## Sources

- [FAQ](https://docs.ollama.com/faq), Ollama documentation.
- [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180), arXiv, 2023.
- [LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/), OWASP Gen AI Security Project.
