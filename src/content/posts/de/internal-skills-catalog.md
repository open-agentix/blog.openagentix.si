---
ref: internal-skills-catalog
lang: de
title: "Einen internen Skill-Katalog aufbauen: Prüfung, Zuständigkeit und Auffindbarkeit"
description: "Einen Skills-Katalog für Ihre Organisation aufbauen: einreichen, prüfen, mit Verantwortlichem und Version veröffentlichen, ausmustern. Mit Ideen aus Registries."
date: 2026-09-17T09:00:00Z
tags: [skills, governance, how-to]
---

Sobald mehr als ein Team Agent-Skills schreibt, tauchen die Probleme auf, die jedes Ökosystem mit geteiltem Code kennt: Niemand weiß, welcher Skill aktuell ist, zwei Teams bauen dasselbe, und ein alter Skill läuft weiter, lange nachdem sein Autor die Stelle gewechselt hat. Ein **Skill-Katalog** ist die Antwort: ein Ort, an dem geprüfte, versionierte Skills mit benanntem Verantwortlichen veröffentlicht werden, an dem Agenten und Menschen sie finden und an dem alte Skills gezielt ausgemustert werden. Dieser Beitrag beschreibt einen Ablauf, den Sie mit einem Git-Repository und einem CI-Job betreiben können, und was sich von öffentlichen Registries übernehmen lässt.

![Ablauf eines internen Skill-Katalogs](/images/blog/internal-skills-catalog-1.svg)

## Was ein Skill ist und warum ein Katalog hilft

Das offene Format beschreibt sich in einem Satz:

> Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

Quelle: [Agent Skills Overview](https://agentskills.io/home), Live-Dokumentation (Wortlaut Stand 2026-10-04). Sinngemäß: Agent Skills sind ein schlankes, offenes Format, um KI-Agenten um Fachwissen und Abläufe zu erweitern.

In der Praxis ist ein Skill ein Ordner mit einer Datei `SKILL.md` und optionalen Skripten und Referenzen. Der Engineering-Beitrag von Anthropic erklärt, warum das skaliert:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.

Quelle: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), Anthropic, 16.10.2025. Sinngemäß: Schrittweises Offenlegen ist das Kernprinzip, das Skills flexibel und skalierbar macht.

Ein Agent sieht von jedem Skill zunächst nur Namen und kurze Beschreibung und lädt den Rest erst, wenn er ihn für relevant hält. Viele Skills sind dadurch billig, und die Qualität von Name und Beschreibung wird entscheidend: Auf ihnen beruht die Auffindbarkeit. Ein Katalog kann außerdem groß werden, ohne in jedem Lauf Tokens zu kosten.

## Von öffentlichen Registries lernen

Das Model Context Protocol hat eine Registry für Server eingeführt und beschrieben, wie sie in Organisationen genutzt werden kann:

> The MCP Registry is now available in preview.

> organizations can choose to create sub-registries based on custom criteria.

Quelle: [Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), Model Context Protocol Blog, 08.09.2025. Sinngemäß: Die Registry ist als Vorschau verfügbar, und Organisationen können nach eigenen Kriterien Unter-Registries anlegen.

Skills sind keine MCP-Server, aber die Struktur lässt sich übertragen. Eine öffentliche Registry enthält breite Einträge von schwankender Qualität; Ihre Organisation kuratiert daraus eine engere Teilmenge nach eigenen Kriterien (geprüft, unterstützt, für bestimmte Datenklassen freigegeben). Ihr Katalog ist diese Unter-Registry für Skills. Nicht alles automatisch spiegeln, sondern Einträge einzeln aufnehmen.

## Der Ablauf in vier Stufen

### 1. Einreichen

Ein Team schlägt einen Skill per Pull Request an das Katalog-Repository vor. Die Einreichung enthält den Skill-Ordner, einen Verantwortlichen (ein Team, nicht nur eine Person), einen Absatz zum Zweck, die berührten Tools und Daten und mindestens eine **Eval**: ein paar Beispielaufgaben mit erwarteten Ergebnissen. Ein minimaler Metadatenblock könnte so aussehen:

```yaml
name: invoice-triage
version: 1.0.0
owner: finance-automation
data_classes: [internal]
tools: [erp:read, tickets:comment]
review_due: 2027-03-01
status: active
```

Die Feldnamen sind ein Beispiel; behalten Sie, was Ihre Werkzeuge validieren können.

### 2. Prüfen

Die Prüfung hat zwei Teile. Eine **Sicherheitsprüfung** untersucht Skripte, Netzzugriff, angeforderte Tools und alles, was Geheimnisse liest. Anthropic ist bei fremdem Material deutlich:

> When installing a skill from a less-trusted source, thoroughly audit it before use.

Sinngemäß: Wer einen Skill aus weniger vertrauenswürdiger Quelle installiert, sollte ihn vorher gründlich prüfen. Behandeln Sie jede Einreichung, auch interne, als Quelle, die zu prüfen ist: Der Code kann in Ordnung sein, und die Anweisungen können einen Agenten trotzdem zu Handlungen jenseits seines Auftrags drängen. Der zweite Teil ist ein **Eval-Lauf** in der CI. Ein Skill, der auf seinen Beispielaufgaben nicht zeigen kann, dass er funktioniert, wird nicht veröffentlicht. Weitere Hinweise zur Lieferkette stehen in [Drittanbieter-Skills und die Lieferkette](/de/posts/third-party-skills-supply-chain/).

### 3. Veröffentlichen

Nach der Freigabe wird eine Version getaggt und ein Eintrag mit Name, Beschreibung, Version, Verantwortlichem, Datenklassen und Prüfdatum veröffentlicht. Versionsregeln sind wichtig: Eine Änderung der Anweisungen kann das Verhalten so stark ändern wie eine Codeänderung; nutzen Sie die Praktiken aus [Versionierung von Agent-Skills](/de/posts/versioning-agent-skills/). Verbraucher legen Versionen fest, und Upgrades durchlaufen dieselbe Prüfung wie jede Abhängigkeit.

### 4. Ausmustern

Jeder Skill bekommt ein Prüfdatum. An diesem Tag erneuert, ersetzt oder beendet der Verantwortliche ihn. Das Ausmustern hat Schritte: Eintrag markieren, Nachfolger nennen, Verbraucher informieren, ein Entfernungsdatum setzen und dann entfernen. Skills ohne Verantwortlichen, weil das zuständige Team nicht mehr existiert, werden automatisch zur Ausmusterung markiert.

## Auffindbarkeit

Ein Katalog, den niemand durchsuchen kann, wird umgangen. So wird er auffindbar:

- **Gute Beschreibungen.** Sagen, was der Skill tut und wann man ihn einsetzt, in den Worten, die Nutzer eintippen würden.
- **Tags** nach Domäne, Tool und Datenklasse.
- **Eine Ansicht "Wer nutzt das"**, damit Verantwortliche die Auswirkung einer Änderung kennen.
- **Runbooks als Skills.** Betriebsabläufe sind ein naheliegender erster Inhalt; siehe [Runbooks als Skills](/de/posts/runbooks-as-skills/).
- **Eine Liste je Agent**, die zeigt, welche geprüften Skills und Tools der Agent vor dem ersten Lauf laden würde.

![Agentenübersicht in der openagentix-Demo mit Beispieldaten: Toolbox, Tools und Budgetgrenzen eines Beispielagenten](/images/blog/internal-skills-catalog-2.png)

*Screenshot der aktuellen Demo (erfundene Daten).*

## Zuständigkeitsregeln, die halten

1. Jeder Skill hat im Katalogeintrag ein Verantwortlichen-Team und einen Bereitschaftskontakt.
2. Nur der Verantwortliche führt Änderungen zusammen; das Katalogteam prüft, besitzt aber den Inhalt nicht.
3. Skills, die sensible Datenklassen berühren, brauchen einen zusätzlichen Freigebenden.
4. Wechsel der Zuständigkeit sind ausdrückliche Pull Requests, nie stillschweigend.
5. Ein Skill mit fehlschlagender Eval wird aus der Suche genommen, bis er repariert ist.

## Grenzen

Ein Katalog verringert doppelte und verwaiste Skills, beweist aber nicht, dass ein Skill sicher ist: Prüfungen übersehen Dinge, und Evals decken nur die Fälle ab, die jemand geschrieben hat. Behalten Sie minimale Rechte für die Agenten bei, die Skills laden, und beobachten Sie, was sie tatsächlich tun.

## Das Wichtigste in Kürze

- Ein Skill-Katalog ist eine kuratierte Unter-Registry: einreichen, prüfen, mit Verantwortlichem und Version veröffentlichen, ausmustern.
- Jede Einreichung, intern oder nicht, als Prüfgegenstand behandeln und eine Eval verlangen.
- Beschreibungen tragen die Auffindbarkeit; investieren Sie in sie.
- Jedem Skill ein Verantwortlichen-Team und ein Prüfdatum geben und Skills gezielt beenden.
- In Verbrauchern Versionen festlegen und Upgrades wie jede Abhängigkeit prüfen.

## Quellen

- Model Context Protocol Blog, [Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), 08.09.2025.
- agentskills.io, [Agent Skills Overview](https://agentskills.io/home), Live-Dokumentation.
- Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), 16.10.2025.
