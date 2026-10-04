---
ref: one-mcp-server-per-system
lang: de
title: "Ein MCP-Server pro System: MCP-Server-Design, das sich steuern lässt"
description: "Regeln für MCP-Server-Design, das sich steuern lässt: ein kleiner Server pro System, Tool-Namensräume und getrennte Lese- und Schreibrechte statt Mega-Gateway."
date: 2026-04-16T09:00:00Z
tags: [mcp, architecture, how-to]
---

**MCP-Server-Design** hat eine Regel, die sich mehr auszahlt als jede andere: ein kleiner Server pro System. Ein
Server, der zehn Anwendungen umhüllt, bündelt alle Zugangsdaten in einem Prozess, verwischt jede
Berechtigungsgrenze und gibt dem Modell eine riesige Tool-Liste zur Auswahl. Kleine Ein-System-Server mit
Tool-Namensräumen und sauberer Trennung von Lese- und Schreibwerkzeugen lassen sich leichter absichern, prüfen,
versionieren und abschalten. Wer das Protokoll noch nicht kennt, beginnt mit [Was ist MCP](/de/posts/what-is-mcp/).

## Der „Schweizer Taschenmesser“-Server und warum er schmerzt

Es ist verlockend, einen Integrationsserver zu schreiben, der mit CRM, Ticket-Tracker, Wiki, Repository-Host,
Kalender und Mailsystem spricht: ein Deployment, eine Konfiguration, ein Anschluss. Die Kosten zeigen sich später:

- **Gebündelte Zugangsdaten.** Der Server hält zehn Sätze Zugangsdaten. Ein Fehler oder eine Injection, die ihn
  erreicht, legt alle offen.
- **Verwischte Berechtigungen.** Das Tool `search` könnte Tickets lesen oder Mail senden. Die Policy kann das
  nicht unterscheiden, ohne die Argumente zu verstehen.
- **Große Tool-Listen.** Dutzende Tools mit überlappenden Beschreibungen kosten in jeder Runde Kontext-Tokens und
  machen falsche Tool-Wahl wahrscheinlicher. Siehe [Werkzeuge schreiben, die Agenten nutzen
  können](/de/posts/writing-tools-agents-can-use/).
- **Gekoppelte Releases.** Eine Änderung an den Mail-Tools erzwingt ein Redeployment der CRM-Tools.
- **Kein sauberer Ausschalter.** Das Wiki abzuschalten heißt, einen gemeinsamen Server zu bearbeiten.

![Monolithischer MCP-Server im Vergleich zu einem Server pro System](/images/blog/one-mcp-server-per-system-1.svg)

## Entwurfsregeln für steuerbare Server

### 1. Ein Server, ein System, ein Zugangsdatum

Jeder Server steht vor genau einem Backend, hält genau ein Zugangsdatum dafür und läuft als eigener Prozess oder
Container. Ein Leck kostet dann ein System. Außerdem können Sie jedem Server eigene Netzwerkregeln,
Ressourcengrenzen und einen eigenen Verantwortlichen geben. Den Umgang mit Secrets solcher Server behandelt
[Geheimnisse gehören nie in das Kontextfenster eines Agenten](/de/posts/secrets-for-agents/).

### 2. Tools mit Namensräumen versehen

Stellen Sie Tool-Namen das System und die Art der Operation voran: `tickets_search`, `tickets_add_comment`,
`wiki_read_page`. Anthropics Leitfaden zum Tool-Design empfiehlt das (Zitate im englischen Original):

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.
>
> [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (Anthropic, 2025)

Sinngemäß: Namensräume über gemeinsame Präfixe helfen, Grenzen zwischen vielen Tools zu ziehen, und manche
MCP-Clients tun das ohnehin. Namensräume helfen dem Modell bei der Wahl und der Policy ebenso: Eine Regel wie
„erlaube die lesenden `tickets_*`-Tools für den Recherche-Agenten“ ist leicht zu schreiben und leicht zu prüfen.

### 3. Lesen und Schreiben trennen

Teilen Sie jedes System in einen Lese-Server (oder eine Lese-Tool-Gruppe) und eine Schreib-Tool-Gruppe mit
unterschiedlichen Rechten. Lesen lässt sich meist gefahrlos automatisieren; Schreiben braucht Argumentgrenzen,
Aufrufgrenzen und manchmal eine Freigabe.

```text
tickets-read    tickets_search, tickets_get            Nur-Lese-Token, keine Freigabe
tickets-write   tickets_add_comment, tickets_create    enger Token, Freigabe für create
```

Mit dieser Trennung kann der Agent, der Tickets sichtet, nur `tickets-read` halten. Ein gekaperter
Sichtungs-Agent kann dann nichts schreiben. Das ist dieselbe Zerlegungsidee wie in [Minimale Rechte für
Agenten](/de/posts/least-privilege-for-agents/).

### 4. Tools klein und typisiert halten

Bevorzugen Sie viele schmale Tools mit strengen JSON-Schemas gegenüber einem Tool mit freiem `query`-String.
Geben Sie jedem Argument einen Typ, ein Muster oder eine Längengrenze. Ein Tool, das nur einen Ticket-Schlüssel
der Form `SEC-123` akzeptiert, lässt sich nicht überreden, etwas anderes zu lesen.

### 5. Gefährliche Tools erkennbar machen

Die Protokollspezifikation ist beim Risiko deutlich:

> Tools represent arbitrary code execution and must be treated with appropriate caution.
>
> [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18) (Model Context Protocol)

Sinngemäß: Tools stehen für beliebige Codeausführung und sind mit angemessener Vorsicht zu behandeln. Kennzeichnen
Sie Tools, die löschen, senden oder bezahlen, in Namen und Beschreibung, verlangen Sie in der Policy eine Freigabe
dafür und verlassen Sie sich nie darauf, dass das Modell das Risiko einer Aktion selbst einschätzt.

## Einwilligung und Transparenz

Dieselbe Spezifikation nennt Grundsätze für Hosts, darunter diesen:

> Users must explicitly consent to and understand all data access and operations
>
> [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18) (Model Context Protocol)

Sinngemäß: Nutzer müssen allen Datenzugriffen und Operationen ausdrücklich zustimmen und sie verstehen. Kleine
Server machen das praktikabel. Berührt ein Server ein System, kann die Zustimmungsabfrage genau sagen, was er tut
(„Tickets im Projekt SEC lesen“), und eine Administratorin prüft eine kurze Tool-Liste statt einer ausufernden.
Wenn ein Agent zudem von den anderen isoliert sein soll, knüpft das an den größeren Gedanken aus [Agent-Architektur
ist nicht Anwendungsarchitektur](/de/posts/agent-architecture-is-not-application-architecture/) an: Agenten sind
eigene Prinzipale mit eigenen Berechtigungen, keine Funktionen einer großen Anwendung.

## Lebenszyklus: jeden Server als verwaltetes Gut behandeln

Eine Übersichtsarbeit zur MCP-Landschaft beschreibt Server als Dinge mit eigenem Lebenslauf:

> We first define the full lifecycle of an MCP server, comprising four phases (creation, deployment, operation, and maintenance)
>
> [Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions](https://arxiv.org/abs/2503.23278) (arXiv, 2025)

Sinngemäß: Der volle Lebenszyklus eines MCP-Servers umfasst Erstellung, Bereitstellung, Betrieb und Wartung. Ein
Server pro System passt gut dazu. Jeder hat einen Verantwortlichen, eine Version, ein Changelog, ein Deployment
und ein Abschaltdatum. Ein Monolith verwischt alle vier.

## Eine kurze Entwurfs-Checkliste

```text
[ ] Spricht dieser Server mit genau einem System?
[ ] Gibt es genau ein Zugangsdatum, zugeschnitten auf das, was die Tools brauchen?
[ ] Tragen die Tool-Namen das System als Präfix?
[ ] Sind Lese- und Schreib-Tools getrennt, mit getrennten Rechten?
[ ] Haben alle Argumente Typen, Muster oder Grenzen?
[ ] Sind zerstörerische Tools gekennzeichnet und hinter einer Freigabe?
[ ] Hat der Server einen Verantwortlichen, eine Version und einen Ausschalter?
```

## Abwägungen

Mehr Server bedeuten mehr Prozesse zum Ausrollen und Überwachen, und manche Aufgaben überspannen Systeme. Die
Antwort ist, über Server hinweg in der Agentenschicht zu orchestrieren, mit ausdrücklichen Übergaben zwischen
Agenten, die jeweils ein oder zwei Server halten, statt die Server zu verschmelzen. Gemeinsamer Code, etwa eine
Auth-Bibliothek, gehört in ein Paket, nicht in einen gemeinsamen Prozess. Für ein sehr kleines Setup genügt ein
einzelner Server mit zwei oder drei Tools; die Regel handelt davon, nicht unverwandte Systeme und Zugangsdaten an
einer Stelle anzuhäufen.

## Das Wichtigste in Kürze

- Ein MCP-Server pro System mit einem Zugangsdatum hält Lecks und Fehler klein.
- Tool-Namen mit Namensräumen versehen, Lese- und Schreib-Tools mit verschiedenen Rechten trennen.
- Strenge Argumentschemas und Freigaben für zerstörerische Tools leisten die eigentliche Steuerung.
- Kleine Server machen Zustimmungsabfragen, Prüfungen und Ausschalter praktikabel.
- Jeder Server bekommt einen Verantwortlichen, eine Version und einen Lebenszyklus.

## Quellen

- [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents), Anthropic, 11.09.2025.
- [Model Context Protocol Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18), Model Context Protocol.
- [Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions](https://arxiv.org/abs/2503.23278), arXiv, 2025.
