---
ref: byok-explained
lang: en
title: "BYOK for agent platforms: your keys, your providers, your bill"
description: "BYOK LLM explained: the platform calls model providers with your own keys and contracts. Gateways, catalogs, per-key spend tracking and BYOK's limits."
date: 2026-07-09T09:00:00Z
tags: [byok, self-hosted, costs]
---

BYOK for an LLM platform means "bring your own key": the platform calls model providers with credentials and contracts that belong to you, not to the platform vendor. You choose the providers, you hold the keys, you receive the invoice, and the platform's job is to route requests, enforce limits and show where the money went. This post explains the moving parts and, just as important, what BYOK does not fix.

## What BYOK means in practice

In a managed setup the vendor sits between you and the model providers. It buys tokens in bulk, marks them up or bundles them into a plan, and you never see a provider key. That is convenient, but you inherit the vendor's provider choices, rate limits and data-handling terms.

With BYOK the platform is a client of the providers, acting on your behalf:

- **Your contract.** Data-processing terms, regional endpoints, retention settings and discounts are the ones you negotiated.
- **Your quota.** Rate limits and spend caps are tied to your account, not shared with other customers.
- **Your choice.** You can use a hosted provider, a cloud marketplace endpoint or a model you run yourself, and switch without changing the agents.
- **Your bill.** Usage appears directly with the provider, and it can be compared with the platform's own numbers.

The price of that control is responsibility. You must keep the keys safe, watch the spend and keep the provider list current.

## The provider catalog problem

Every provider names models, prices tokens and describes capabilities differently. A platform that supports many providers needs a catalog: which models exist, what they cost, what context size and features they offer. Maintaining that by hand does not scale, so most setups rely on an open database. One such project describes itself like this:

> Models.dev is a comprehensive open-source database of AI model specifications, pricing, and features.

Source: [Models.dev](https://models.dev/).

Coding tools use the same idea. The OpenCode documentation says:

> OpenCode uses the AI SDK and Models.dev to support 75+ LLM providers and it supports running local models.

Source: [OpenCode docs, Providers](https://opencode.ai/docs/providers/).

Two cautions apply. First, a catalog entry is data, and data goes stale: prices change, models are retired. Treat catalog updates as reviewed changes, not as something fetched live at run time. This matters most in restricted networks, where nothing may be fetched at run time. Second, "supports 75+ providers" describes a client's reach, not a guarantee that every provider behaves the same under tool use or long contexts. Test the ones you rely on.

## Gateways: one door in front of many providers

![BYOK routing through a gateway to multiple model providers](/images/blog/byok-explained-1.svg)

A gateway is a service that accepts requests in one format and forwards them to the right provider. For BYOK it gives you three things:

1. **One integration point.** Agents talk to one endpoint; the gateway knows the provider details.
2. **Central keys.** Provider keys live in the gateway or in your secret store, not in every agent definition. See [secrets for agents](/posts/secrets-for-agents/) for how to keep them away from the model.
3. **Central policy.** Allowed models, rate limits, budgets and logging are enforced in one place.

You can run your own gateway or use a product. Be aware that vendor documentation draws a line here. Anthropic's Claude Code documentation says:

> Anthropic doesn’t endorse, maintain, or audit third-party gateway products

Source: [Claude Code docs, Other LLM gateways](https://code.claude.com/docs/en/llm-gateway).

The practical meaning: a gateway sees every prompt and every response, so it is a high-trust component. Choose it like any other piece of infrastructure that handles sensitive data: read the code or the contract, pin versions, and limit who can administer it.

## Per-key spend tracking

BYOK is only useful if you can tell who spent what. The common pattern is to issue virtual keys: the gateway creates its own keys, each mapped to a team, a project or an agent, and attributes usage to them. LiteLLM's documentation, for example, states:

> Spend is automatically tracked for the key

Source: [LiteLLM docs, Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys).

With one virtual key per agent or per team you can:

- set a budget per key and stop runs when it is exhausted,
- find the one agent that accounts for most of the bill,
- revoke a single key without touching the provider key behind it.

Provider keys stay hidden behind the gateway; the virtual keys are what you hand to teams. Combine this with the budget ideas in [cost is a platform concern](/posts/cost-is-a-platform-concern/) and the token-level tactics in [prompt caching and token budgets](/posts/prompt-caching-and-token-budgets/).

A minimal sketch of the layering:

```yaml
providers:
  - name: provider-a
    key_ref: secret://llm/provider-a      # stays in the secret store
    models: [model-large, model-small]
virtual_keys:
  - name: support-agents
    models: [model-small]
    monthly_budget: 200                   # in your billing currency
```

The syntax is illustrative. What matters is the indirection: agents never see `provider-a`'s key, and a virtual key has a model allowlist and a budget.

## What BYOK does not solve

- **Provider data handling.** BYOK changes whose contract applies, not what the provider does with the data. If a prompt must not leave your network, only a model you host yourself helps.
- **Key leakage.** More keys in more places means more to protect. A leaked provider key is billed to you.
- **Cost control by itself.** Without budgets, BYOK just moves the surprise invoice to your own account.
- **Quality and safety.** Switching providers changes behaviour. Evaluate before you route production traffic to a new model.
- **Operational load.** You now watch provider outages, deprecations and quota emails yourself.

## A short BYOK checklist

- Provider keys live in a secret store; only the gateway can read them.
- Agents use virtual or scoped keys, one per team or agent.
- Every key has a model allowlist and a budget.
- The model catalog is reviewed and versioned, not fetched live.
- Spend is exported and compared with the provider invoice monthly.
- You can revoke a key and rotate a provider key without redeploying agents.

## Key takeaways

- BYOK means the platform uses your provider keys and contracts; you gain control and take on responsibility.
- A model catalog and a gateway keep many providers manageable.
- Virtual keys give per-team and per-agent spend tracking and budgets.
- A gateway is a high-trust component; vendors do not vouch for third-party ones.
- BYOK does not change what providers do with your data and does not limit cost on its own.

## Sources

- [Models.dev](https://models.dev/), an open-source database of AI models.
- [Providers](https://opencode.ai/docs/providers/), OpenCode documentation.
- [Other LLM gateways](https://code.claude.com/docs/en/llm-gateway), Claude Code documentation.
- [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys), LiteLLM documentation.
