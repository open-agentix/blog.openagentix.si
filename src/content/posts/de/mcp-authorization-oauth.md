---
ref: mcp-authorization-oauth
lang: de
title: "MCP-Autorisierung: OAuth 2.1, Audiences und warum Durchreichen verboten ist"
description: "MCP authorization baut auf OAuth 2.1, Protected Resource Metadata und Resource Indicators auf. So läuft der Ablauf, und warum Token Passthrough verboten ist."
date: 2026-05-12T09:00:00Z
tags: [mcp, security, identity]
---

MCP-Autorisierung ist OAuth mit strengen Regeln dazu, für wen ein Token gilt. Ein entfernter MCP-Server ist ein OAuth-Resource-Server, der MCP-Client ein OAuth-Client, und ein getrennter Autorisierungsserver stellt Tokens aus. Die wichtigste Regel für die Sicherheit betrifft die Audience: Ein Server darf nur Tokens akzeptieren, die für ihn ausgestellt wurden, und ein erhaltenes Token nie an einen anderen Dienst weiterreichen. Dieser Beitrag geht den Ablauf für entfernte Server durch und die Regeln, die verhindern, dass ein Token anderswo wiederverwendet wird. Die Angaben folgen der Spezifikationsversion 2025-06-18; prüfen Sie vor der Umsetzung die aktuelle Version.

## Die Rollen

Drei Parteien sind beteiligt:

- **MCP-Client.** Die Anwendung, die im Auftrag eines Nutzers mit dem Server spricht. Die Spezifikation sagt es klar:

> An MCP client acts as an OAuth 2.1 client, making protected resource requests on behalf of a resource owner.
>
> — Model Context Protocol, [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

  Sinngemäß: Ein MCP-Client agiert als OAuth-2.1-Client und stellt im Auftrag eines Ressourcenbesitzers Anfragen an geschützte Ressourcen.

- **MCP-Server.** Die geschützte Ressource. Er prüft Tokens und stellt Tools bereit.
- **Autorisierungsserver.** Authentifiziert die Nutzer, holt die Zustimmung ein und stellt Access Tokens aus. Das kann ein System sein, das Sie ohnehin betreiben, etwa Ihr Identity Provider.

Durch diese Trennung muss ein MCP-Server weder Passwörter speichern noch ein Login bauen. Er muss nur sagen, wo es ein Token gibt, und das erhaltene Token prüfen. Wie Identität und Delegation zu Agenten passen, steht in [Agentenidentität und Delegation](/de/posts/agent-identity-and-delegation/).

## Der Ablauf für einen entfernten Server

![OAuth-Ablauf für einen entfernten MCP-Server mit Audience-Prüfung](/images/blog/mcp-authorization-oauth-1.svg)

1. **Der Client ruft den Server ohne Token auf** und erhält eine `401`-Antwort, die auf Metadaten des Servers verweist.
2. **Der Client findet den Autorisierungsserver.** Dafür muss der Server Protected Resource Metadata veröffentlichen:

> MCP servers MUST implement OAuth 2.0 Protected Resource Metadata (RFC9728).
>
> — Model Context Protocol, [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

   Das Metadatendokument nennt einen oder mehrere Autorisierungsserver. Der Client liest dann dessen eigene Metadaten, um die Endpunkte zu finden.
3. **Der Client startet die Autorisierungsanfrage** mit PKCE und benennt den Zielserver im Parameter `resource`.
4. **Die Nutzer melden sich an und stimmen zu**, beim Autorisierungsserver.
5. **Der Autorisierungsserver stellt ein Token aus**, dessen Audience der benannte MCP-Server ist.
6. **Der Client ruft den MCP-Server auf**, mit dem Token im `Authorization`-Header bei jeder Anfrage.
7. **Der Server prüft das Token**, einschließlich der Audience, bevor er etwas tut.

Der Parameter `resource` aus Schritt 3 stammt aus RFC 8707 zu Resource Indicators. Sein Zweck lässt sich in einem Satz sagen:

> an access token must only be valid for use at a specific protected resource and for a specific scope of access.
>
> — IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)

Sinngemäß: Ein Access Token darf nur an einer bestimmten geschützten Ressource und für einen bestimmten Zugriffsumfang gültig sein. Ohne diesen Parameter stellt der Autorisierungsserver ein allgemeines Token aus, und jeder Server, der es erhält, kann versuchen, es woanders einzusetzen.

## Audience-Bindung und das Durchreich-Verbot

Stellen Sie sich einen Agenten vor, der mit einem Kalender-Server und einem Zahlungs-Server verbunden ist. Würde der Kalender-Server jedes gültige Token Ihres Identity Providers akzeptieren, könnte ein bösartiger oder kompromittierter Kalender-Server das erhaltene Token nehmen und damit den Zahlungs-Server aufrufen. Das ist das Confused-Deputy-Problem: Ein Dienst mit gewisser Autorität wird getäuscht, sie für jemand anderen einzusetzen.

Die Spezifikation schließt das mit Regeln in ihren Sicherheitsempfehlungen:

> MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.
>
> — Model Context Protocol, [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)

Sinngemäß: MCP-Server dürfen keine Tokens akzeptieren, die nicht ausdrücklich für sie ausgestellt wurden. Derselbe Abschnitt verbietet dem Server auch, das Token des Clients an eine vorgelagerte API weiterzugeben; das ist das „Durchreichen“ (Token Passthrough) im Titel. Muss Ihr MCP-Server einen nachgelagerten Dienst aufrufen, braucht er dafür ein eigenes Token, in der Regel als Client des Autorisierungsservers dieses Dienstes. So bleiben Verantwortung, Berechtigungen und Audit-Spuren getrennt: Der nachgelagerte Dienst sieht, mit wem er spricht.

Eine minimale Prüfung auf Serverseite sieht so aus:

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

Nutzen Sie für Signatur und Ablauf eine gepflegte Bibliothek. Die Prüfung von Audience und Scope ist der Teil, den man leicht vergisst.

## Sitzungen sind keine Authentifizierung

MCP-Transporte können eine Sitzungs-ID führen. Eine Sitzung dient der Kontinuität, nicht der Identität. Das Dokument ist dazu deutlich:

> MCP Servers MUST NOT use sessions for authentication.
>
> — Model Context Protocol, [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)

Prüfen Sie das Token bei jeder Anfrage. Eine erratene oder abgeflossene Sitzungs-ID darf nie genügen, um als Nutzer zu handeln.

## Refresh Tokens und die OAuth-Sicherheitsbasis

MCP stützt sich auf die breitere OAuth-Sicherheitsbasis, statt sie zu ersetzen. RFC 9700, die aktuelle Best Current Practice für OAuth-2.0-Sicherheit, enthält eine Regel für Clients, die auf Nutzerrechnern laufen, wie es viele MCP-Clients tun:

> Refresh tokens for public clients MUST be sender-constrained or use refresh token rotation as described in Section 4.14.
>
> — IETF, [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)

Sinngemäß: Refresh Tokens öffentlicher Clients müssen senderbeschränkt sein oder rotiert werden. In der Praxis: kurzlebige Access Tokens bevorzugen, Refresh Tokens bei jeder Nutzung rotieren und sie widerrufen, wenn ein Client entfernt wird. Tokens gehören in den Credential-Speicher der Plattform und nicht in Klartext-Konfigurationsdateien; mehr dazu in [Secrets für Agenten](/de/posts/secrets-for-agents/).

## Checkliste für Betreiber

- Einen Autorisierungsserver betreiben oder wählen, der PKCE, Resource Indicators und Metadaten-Discovery unterstützt.
- Protected Resource Metadata für jeden entfernten MCP-Server veröffentlichen.
- Aussteller, Signatur, Ablauf, Audience und Scope bei jeder Anfrage prüfen.
- Ein erhaltenes Token nie weiterreichen; für nachgelagerte Aufrufe ein eigenes Token holen.
- Enge Scopes je Server und je Aktionsklasse vergeben, etwa Lesen gegen Schreiben.
- Refresh Tokens rotieren und kurze Lebensdauern für Access Tokens setzen.
- Autorisierungsfehler mit Grund protokollieren und bei Spitzen alarmieren.

## Grenzen

Der Autorisierungsteil von MCP betrifft entfernte Server über HTTP. Lokale Server, die als Kindprozess laufen, verlassen sich meist auf den Betriebssystem-Nutzer und die Umgebung. Außerdem sagt Autorisierung, wer einen Server aufrufen darf; sie sagt nicht, ob die Beschreibung eines Tools ehrlich ist oder ob ein Aufruf klug ist. Deshalb gelten die übrigen Maßnahmen dieser Reihe weiter. Wer das Protokoll selbst noch nicht kennt, beginnt mit [Was ist MCP](/de/posts/what-is-mcp/).

## Das Wichtigste in Kürze

- Ein MCP-Client ist ein OAuth-2.1-Client, der MCP-Server eine geschützte Ressource, und ein getrennter Autorisierungsserver stellt Tokens aus.
- Server veröffentlichen Protected Resource Metadata, damit Clients den richtigen Autorisierungsserver finden.
- Clients fordern Tokens für eine bestimmte Ressource an, und Server akzeptieren nur für sie ausgestellte Tokens.
- Token Passthrough ist verboten; für jeden nachgelagerten Dienst gibt es ein eigenes Token.
- Sitzungen sind keine Authentifizierung; das Token wird bei jeder Anfrage geprüft.

## Quellen

- Model Context Protocol: [Authorization (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- Model Context Protocol: [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- IETF: [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)
- IETF: [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
