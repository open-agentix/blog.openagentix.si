---
ref: agent-identity-and-delegation
lang: en
title: "Ops series: identity for agents, or who is acting on whose behalf"
description: "AI agent identity: each agent needs its own identity plus a record of whom it acts for. Delegation vs impersonation, audience-bound tokens, no shared API keys."
date: 2026-03-24T09:00:00Z
tags: [operations, identity, security]
---

AI agent identity answers two questions that every log line should answer: which agent did this, and
on whose behalf. Classic operations gave every service its own identity. Agents need the same, plus a
record of the person or system they act for. The practical rules are short: one identity per agent,
delegation instead of impersonation, tokens bound to a specific audience, and no shared API keys.
This post belongs to the operations series that began with
[Running agents is operations](/posts/agent-ops-is-just-ops/).

![Token delegation chain from user to agent to tool server](/images/blog/agent-identity-and-delegation-1.svg)

## Why shared keys break everything else

Many agent setups start with one API key in an environment variable, used by every agent for every
call. It works, and it quietly defeats other controls:

- **Audit.** The log says "the service key did it". Which agent, for which user, in which run? Nobody
  can tell.
- **Least privilege.** One key means one set of permissions, which is the union of what all agents
  need. The earlier post on [least privilege](/posts/least-privilege-for-agents/) argues for the
  opposite.
- **Revocation.** Stopping one misbehaving agent means rotating the key everyone uses.
- **Policy.** A rule such as "this agent may read, that one may write" cannot be expressed when the
  caller is indistinguishable.

Each of these is the same failure: the identity is too coarse to carry a decision.

## Two identities, not one

An agent acts in a chain. A user asks the platform, the platform runs an agent, the agent calls a
tool server, and the tool server touches a back-end system. At each hop two things matter:

1. **Who is the caller?** The agent, as a workload with its own identity. This is the same idea as a
   service identity in classic operations.
2. **For whom is it acting?** The user or system that started the work.

Both belong in the record, and both belong in the decision. A request to read customer records can be
fine when it comes from the support agent acting for a support employee, and wrong when the same agent
acts for an anonymous visitor.

## Delegation versus impersonation

OAuth 2.0 Token Exchange (RFC 8693) names the two ways of acting for someone. In impersonation, the
acting party becomes the other party as far as the receiver can tell. In delegation, the receiver can
see both. The RFC's definition of the second case is short:

> any actions taken are being taken by A representing B.
>
> — IETF, [RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)

For agents, delegation is the better default. The tool server or back end can see that agent A is
acting for user B, can apply rules for both, and can write both into its log. With impersonation, the
log shows only B, and the evidence that an agent acted, and which one, is gone. That is the point at
which audit stops being able to answer the question "was this the person or the model?".

In token terms, the exchanged token carries the user as its subject and the agent in an "acting party"
claim, so that every hop keeps both facts.

## Bind tokens to an audience

A token that works everywhere is a master key. Resource Indicators for OAuth 2.0 (RFC 8707) exist to
narrow it:

> an access token must only be valid for use at a specific protected resource and for a specific scope of access.
>
> — IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)

For an agent platform this means: when the agent needs to call tool server X, the platform issues a
token for X with the scope that this call needs, for a short time. A stolen token for X is useless at
Y. A token obtained for one task is useless for the next.

## The MCP angle

If your tools are exposed over the Model Context Protocol (MCP),
the specification already uses OAuth for protected servers. It describes the client's role like this:

> An MCP client acts as an OAuth 2.1 client, making protected resource requests on behalf of a resource owner.
>
> — Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

and requires servers to publish metadata so that clients can find the right authorization server:

> MCP servers MUST implement OAuth 2.0 Protected Resource Metadata (RFC9728).
>
> — Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

The practical consequence is that the standard path for remote servers already assumes tokens and a
resource owner. A platform that uses it can keep one identity per agent and pass the user's
authority through as a delegated, audience-bound token, instead of storing a shared secret in a config
file.

## Zero trust, applied to agents

NIST's zero trust architecture states the principle that makes identity the centre of the design:

> Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location
>
> — NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

An agent running inside your network is not trusted for that reason. Every call is authenticated,
every call is authorised against policy, and the identity is the thing the policy looks at.

## A practical design

1. **One identity per agent definition**, issued by the platform, not shared across agents and not
   stored in prompts.
2. **A subject on every run**: the user or system the run is for, recorded at the start.
3. **Token exchange at each hop** that keeps the subject and adds the agent as the acting party.
4. **Audience and scope per call**: a token for one tool server and the minimum scope.
5. **Short lifetimes**, so a leaked token expires on its own.
6. **Policy decisions on both identities**: the agent's grants and the user's rights. The effective
   permission is the intersection, not the larger of the two.
7. **Audit entries that carry both**: agent, subject, tool, arguments, decision. See
   [Policy decides, audit proves](/posts/policy-decides-audit-proves/).
8. **Revocation per agent**: switching off one identity stops that agent only.

## Common mistakes

- **One service account for all agents.** Breaks audit and revocation.
- **Impersonating the user to the back end.** Hides the agent from the log.
- **Long-lived tokens in prompts or environment variables.** A model can be asked to print them.
- **Broad scopes "to make it work".** Turns every token into a master key.
- **Using the user's full rights.** An agent acting for an administrator should not automatically
  hold administrator rights; grant what the task needs.

## Limits

Identity does not solve prompt injection. A correctly identified agent can still be manipulated into
misusing legitimate rights; that is the job of grants, argument constraints and approvals. Token
exchange also adds moving parts: an authorisation server, clock skew, expiry handling and failure
modes when it is down. The rules above are a direction, and details such as which claim names to use
depend on the authorisation server and the tool servers in your environment.

## Key takeaways

- Every agent needs its own identity, plus a record of whom it acts for.
- Prefer delegation (A acts for B, both visible) over impersonation (A becomes B).
- Bind tokens to a specific resource and scope, and keep them short-lived.
- Shared API keys defeat audit, least privilege and revocation at once.
- Identity is necessary and not sufficient: combine it with policy, constraints and approvals.

## Sources

- IETF, [RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html) (January 2020)
- IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html) (February 2020)
- NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) (2020-08-11)
- Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
