---
ref: agent-identity-and-delegation
lang: de
title: "Betriebsreihe: Identität für Agenten, oder wer handelt in wessen Auftrag"
description: "KI-Agenten-Identität: Jeder Agent braucht eine eigene Identität und den Vermerk, für wen er handelt. Delegation statt Impersonation, zielgebundene Tokens."
date: 2026-03-24T09:00:00Z
tags: [operations, identity, security]
---

KI-Agenten-Identität beantwortet zwei Fragen, die jede Logzeile beantworten sollte: Welcher Agent hat
das getan, und in wessen Auftrag. Der klassische Betrieb gab jedem Dienst eine eigene Identität.
Agenten brauchen dasselbe, dazu den Vermerk der Person oder des Systems, für die sie handeln. Die
praktischen Regeln sind kurz: eine Identität pro Agent, Delegation statt Impersonation, an einen
bestimmten Empfänger gebundene Tokens und keine geteilten API-Schlüssel. Dieser Beitrag gehört
zur Betriebsreihe, die mit [Agenten betreiben ist Betrieb](/de/posts/agent-ops-is-just-ops/) begann.

![Token-Delegationskette vom Nutzer über den Agenten zum Tool-Server](/images/blog/agent-identity-and-delegation-1.svg)

## Warum geteilte Schlüssel alles andere aushebeln

Viele Agenten-Setups beginnen mit einem API-Schlüssel in einer Umgebungsvariable, den jeder Agent für
jeden Aufruf nutzt. Das funktioniert und unterläuft stillschweigend andere Kontrollen:

- **Audit.** Das Log sagt „der Dienstschlüssel war es“. Welcher Agent, für welchen Nutzer, in welchem
  Lauf? Das kann niemand sagen.
- **Minimale Rechte.** Ein Schlüssel bedeutet einen Rechtesatz, nämlich die Vereinigung dessen, was
  alle Agenten brauchen. Der frühere Beitrag zu [minimalen Rechten](/de/posts/least-privilege-for-agents/)
  argumentiert für das Gegenteil.
- **Entzug.** Einen fehlerhaften Agenten zu stoppen heißt, den Schlüssel zu rotieren, den alle nutzen.
- **Policy.** Eine Regel wie „dieser Agent darf lesen, jener schreiben“ lässt sich nicht ausdrücken,
  wenn der Aufrufer nicht unterscheidbar ist.

Jedes davon ist derselbe Fehler: Die Identität ist zu grob, um eine Entscheidung zu tragen.

## Zwei Identitäten, nicht eine

Ein Agent handelt in einer Kette. Ein Nutzer fragt die Plattform, die Plattform startet einen Agenten,
der Agent ruft einen Tool-Server auf, und der Tool-Server berührt ein Backend-System. An jeder Stelle
zählen zwei Dinge:

1. **Wer ruft auf?** Der Agent, als Workload mit eigener Identität. Dasselbe Prinzip wie die
   Dienstidentität im klassischen Betrieb.
2. **Für wen handelt er?** Der Nutzer oder das System, das die Arbeit angestoßen hat.

Beides gehört in die Aufzeichnung und in die Entscheidung. Eine Anfrage, Kundendaten zu lesen, kann in
Ordnung sein, wenn sie vom Support-Agenten im Auftrag einer Support-Mitarbeiterin kommt, und falsch,
wenn derselbe Agent für einen anonymen Besucher handelt.

## Delegation und Impersonation

OAuth 2.0 Token Exchange (RFC 8693) benennt die zwei Arten, für jemanden zu handeln. Bei der
Impersonation wird der Handelnde für den Empfänger zur anderen Partei. Bei der Delegation sieht der
Empfänger beide. Die Definition des zweiten Falls im RFC ist kurz (Zitat im Original):

> any actions taken are being taken by A representing B.
>
> — IETF, [RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)

Sinngemäß: Alle Handlungen werden von A im Namen von B ausgeführt. Für Agenten ist Delegation die
bessere Voreinstellung. Tool-Server oder Backend sehen, dass Agent A für Nutzer B handelt, können
Regeln für beide anwenden und beide ins Log schreiben. Bei Impersonation zeigt das Log nur B, und der
Nachweis, dass ein Agent gehandelt hat und welcher, ist weg. Ab da kann das Audit die Frage „war es
der Mensch oder das Modell?“ nicht mehr beantworten.

In Token-Begriffen trägt das ausgetauschte Token den Nutzer als Subjekt und den Agenten in einem
Claim für die handelnde Partei, sodass jede Station beide Fakten behält.

## Tokens an einen Empfänger binden

Ein Token, das überall funktioniert, ist ein Generalschlüssel. Resource Indicators for OAuth 2.0
(RFC 8707) existieren, um es einzuengen:

> an access token must only be valid for use at a specific protected resource and for a specific scope of access.
>
> — IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)

Sinngemäß: Ein Zugriffstoken darf nur für eine bestimmte geschützte Ressource und einen bestimmten
Zugriffsumfang gültig sein. Für eine Agenten-Plattform heißt das: Muss der Agent Tool-Server X
aufrufen, stellt die Plattform ein Token für X aus, mit dem Umfang, den dieser Aufruf braucht, für
kurze Zeit. Ein gestohlenes Token für X nützt bei Y nichts. Ein Token für eine Aufgabe nützt nichts
für die nächste.

## Der MCP-Aspekt

Werden Ihre Tools über das Model Context Protocol (MCP) bereitgestellt, nutzt die Spezifikation für geschützte Server bereits OAuth.
Sie beschreibt die Rolle des Clients so:

> An MCP client acts as an OAuth 2.1 client, making protected resource requests on behalf of a resource owner.
>
> — Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

und verlangt von Servern, Metadaten zu veröffentlichen, damit Clients den richtigen
Autorisierungsserver finden:

> MCP servers MUST implement OAuth 2.0 Protected Resource Metadata (RFC9728).
>
> — Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

Praktisch heißt das: Der Standardweg für entfernte Server setzt Tokens und einen Ressourcenbesitzer
bereits voraus. Eine Plattform, die ihn nutzt, kann eine Identität pro Agent halten und die Befugnis
des Nutzers als delegiertes, zielgebundenes Token durchreichen, statt ein gemeinsames Geheimnis in
einer Konfigurationsdatei abzulegen.

## Zero Trust für Agenten

NISTs Zero-Trust-Architektur nennt das Prinzip, das Identität in den Mittelpunkt des Entwurfs stellt:

> Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location
>
> — NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

Ein Agent im eigenen Netz ist deshalb nicht vertrauenswürdig. Jeder Aufruf wird authentifiziert,
jeder Aufruf gegen die Policy autorisiert, und die Identität ist das, was die Policy ansieht.

## Ein praktischer Entwurf

1. **Eine Identität pro Agentendefinition**, von der Plattform ausgestellt, nicht über Agenten
   geteilt und nicht in Prompts gespeichert.
2. **Ein Subjekt in jedem Lauf**: der Nutzer oder das System, für das der Lauf ist, zu Beginn
   festgehalten.
3. **Token-Austausch an jeder Station**, der das Subjekt behält und den Agenten als handelnde Partei
   ergänzt.
4. **Empfänger und Umfang pro Aufruf**: ein Token für einen Tool-Server mit dem minimalen Umfang.
5. **Kurze Laufzeiten**, damit ein geleaktes Token von selbst abläuft.
6. **Policy-Entscheidungen auf beiden Identitäten**: die Rechte des Agenten und die des Nutzers. Die
   effektive Berechtigung ist die Schnittmenge, nicht die größere von beiden.
7. **Audit-Einträge mit beidem**: Agent, Subjekt, Tool, Argumente, Entscheidung. Siehe
   [Policy entscheidet, Audit beweist](/de/posts/policy-decides-audit-proves/).
8. **Entzug pro Agent**: Das Abschalten einer Identität stoppt nur diesen Agenten.

## Häufige Fehler

- **Ein Dienstkonto für alle Agenten.** Bricht Audit und Entzug.
- **Den Nutzer gegenüber dem Backend imitieren.** Verbirgt den Agenten im Log.
- **Langlebige Tokens in Prompts oder Umgebungsvariablen.** Ein Modell lässt sich bitten, sie
  auszugeben.
- **Breite Umfänge, „damit es läuft“.** Macht jedes Token zum Generalschlüssel.
- **Die vollen Rechte des Nutzers verwenden.** Ein Agent, der für eine Administratorin handelt, sollte
  nicht automatisch Administratorrechte halten; vergeben Sie, was die Aufgabe braucht.

## Grenzen

Identität löst Prompt Injection nicht. Ein korrekt identifizierter Agent kann weiterhin dazu gebracht
werden, legitime Rechte zu missbrauchen; dafür sind Vergabe, Argument-Einschränkungen und Freigaben
zuständig. Der Token-Austausch bringt außerdem bewegliche Teile: einen Autorisierungsserver,
Zeitabweichungen, Ablaufbehandlung und Fehlerfälle bei dessen Ausfall. Die obigen Regeln sind eine
Richtung; Details wie die Namen der Claims hängen vom Autorisierungsserver und den Tool-Servern in
Ihrer Umgebung ab.

## Das Wichtigste in Kürze

- Jeder Agent braucht eine eigene Identität, plus den Vermerk, für wen er handelt.
- Delegation (A handelt für B, beide sichtbar) der Impersonation (A wird zu B) vorziehen.
- Tokens an eine bestimmte Ressource und einen Umfang binden und kurzlebig halten.
- Geteilte API-Schlüssel unterlaufen Audit, minimale Rechte und Entzug zugleich.
- Identität ist notwendig, aber nicht hinreichend: mit Policy, Einschränkungen und Freigaben kombinieren.

## Quellen

- IETF, [RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html) (Januar 2020)
- IETF, [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html) (Februar 2020)
- NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) (2020-08-11)
- Model Context Protocol, [Authorization (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
