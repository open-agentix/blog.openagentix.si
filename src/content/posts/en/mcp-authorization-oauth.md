---
ref: mcp-authorization-oauth
lang: en
title: "MCP authorization: OAuth 2.1, audiences and why passthrough is forbidden"
description: "MCP authorization builds on OAuth 2.1, protected resource metadata and resource indicators. How the flow works and why token passthrough is forbidden."
date: 2026-05-12T09:00:00Z
tags: [mcp, security, identity]
---

MCP authorization is OAuth with strict rules about who a token is for. A remote MCP server acts as an OAuth resource server, the MCP client acts as an OAuth client, and a separate authorization server issues tokens. The rule that matters most for security is the audience: a server must accept only tokens that were issued for it, and must never pass a token it received on to another service. This post walks through the flow for remote servers and the rules that stop a token from being replayed elsewhere. The details below follow the 2025-06-18 version of the specification; check the current version before you implement.

## The roles

Three parties take part:

- **MCP client.** The application that talks to the server on behalf of a user. The specification puts it plainly:

> An MCP client acts as an OAuth 2.1 client, making protected resource requests on behalf of a resource owner.
>
> — Model Context Protocol, [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

- **MCP server.** The protected resource. It validates tokens and serves tools.
- **Authorization server.** Authenticates the user, asks for consent and issues access tokens. It can be a separate system you already run, such as your identity provider.

Splitting the roles means an MCP server does not have to store passwords or implement login. It only has to say where to get a token and check the token it receives. For how identities and delegation relate to agents, see [agent identity and delegation](/posts/agent-identity-and-delegation/).

## The flow for a remote server

![OAuth flow for a remote MCP server with audience validation](/images/blog/mcp-authorization-oauth-1.svg)

1. **The client calls the server without a token** and receives a `401` response that points to metadata about the server.
2. **The client discovers the authorization server.** For this, the server must publish protected resource metadata:

> MCP servers MUST implement OAuth 2.0 Protected Resource Metadata (RFC9728).
>
> — Model Context Protocol, [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

   The metadata document names one or more authorization servers. The client then reads that server's own metadata to find its endpoints.
3. **The client starts an authorization request** with PKCE and names the target server with a `resource` parameter.
4. **The user signs in and consents** at the authorization server.
5. **The authorization server issues a token** whose audience is the named MCP server.
6. **The client calls the MCP server** with the token in the `Authorization` header on every request.
7. **The server validates the token**, including its audience, before doing any work.

The `resource` parameter in step 3 comes from RFC 8707 on resource indicators. Its purpose is stated in one sentence:

> an access token must only be valid for use at a specific protected resource and for a specific scope of access.
>
> — IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)

Without it, an authorization server issues a generic token, and any server that receives it can try to use it somewhere else.

## Audience binding and the passthrough ban

Imagine an agent connected to a calendar server and a payments server. If the calendar server accepted any valid token from your identity provider, a malicious or compromised calendar server could take the token it received and call the payments server with it. This is the confused-deputy problem: a service with some authority is tricked into using it for someone else.

The specification closes this with two rules in its security best practices:

> MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.
>
> — Model Context Protocol, [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)

The same section forbids the server from forwarding the client's token to an upstream API, which is the "token passthrough" in the title. If your MCP server needs to call a downstream service, it must obtain a separate token for that service, typically as a client of that service's own authorization server. That keeps responsibility, scopes and audit trails separate: the downstream service can see who it is talking to.

A minimal check on the server side looks like this:

```ts
// Reject tokens that were not issued for this server.
const claims = await verifyJwt(token, { issuer: AUTH_SERVER });
const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
if (!audiences.includes("https://mcp.example.org")) {
  return unauthorized("wrong audience");
}
if (!hasScope(claims, "tickets:read")) {
  return forbidden("missing scope");
}
```

Use a maintained library for signature and expiry checks. The audience and scope checks are the part that is easy to forget.

## Sessions are not authentication

MCP transports can maintain a session ID. A session is for continuity, not identity. The same document is blunt about it:

> MCP Servers MUST NOT use sessions for authentication.
>
> — Model Context Protocol, [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)

Verify the token on every request. A session ID that is guessed or leaked should never be enough to act as a user.

## Refresh tokens and the OAuth security baseline

MCP relies on the broader OAuth security baseline rather than replacing it. RFC 9700, the current best practice for OAuth 2.0 security, has a rule that matters for clients that run on user machines, which many MCP clients do:

> Refresh tokens for public clients MUST be sender-constrained or use refresh token rotation as described in Section 4.14.
>
> — IETF, [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)

In practice: prefer short-lived access tokens, rotate refresh tokens on every use, and revoke them when a client is removed. Store tokens in the platform's credential store and not in plain configuration files; the secrets post covers this in more detail: [secrets for agents](/posts/secrets-for-agents/).

## Checklist for operators

- Run or choose an authorization server that supports PKCE, resource indicators and metadata discovery.
- Publish protected resource metadata for every remote MCP server.
- Validate issuer, signature, expiry, audience and scope on every request.
- Never forward a received token; get a separate token for downstream calls.
- Issue narrow scopes per server and per action class, such as read versus write.
- Rotate refresh tokens and set short access token lifetimes.
- Log authorisation failures with the reason, and alert on spikes.

## Limits

The authorization part of MCP is about remote servers over HTTP. Local servers that run as a child process usually rely on the operating system user and environment instead. Also, authorization says who may call a server; it does not say whether the tool's description is honest or whether a call is wise, which is why the other controls in this series still apply. If you are new to the protocol itself, start with [what is MCP](/posts/what-is-mcp/).

## Key takeaways

- An MCP client is an OAuth 2.1 client; the MCP server is a protected resource; a separate authorization server issues tokens.
- Servers publish protected resource metadata so clients can find the right authorization server.
- Clients request tokens for a specific resource, and servers accept only tokens issued for them.
- Token passthrough is forbidden; use a separate token for each downstream service.
- Do not use sessions for authentication; check the token on every request.

## Sources

- Model Context Protocol: [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- Model Context Protocol: [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- IETF: [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)
- IETF: [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
