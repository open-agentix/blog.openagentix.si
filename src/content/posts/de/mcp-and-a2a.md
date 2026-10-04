---
ref: mcp-and-a2a
lang: de
title: "MCP vs A2A: Tools für Agenten gegenüber Agenten im Gespräch"
description: "MCP vs A2A: MCP verbindet einen Agenten mit Tools und Daten, A2A Agenten untereinander. Wo was passt, was fehlt und warum Governance darüber liegen muss."
date: 2026-08-18T09:00:00Z
tags: [mcp, multi-agent, comparison]
---

MCP und A2A lösen unterschiedliche Probleme und konkurrieren nicht. Das Model Context Protocol (MCP) verbindet einen Agenten mit Werkzeugen und Daten. Das Agent2Agent-Protokoll (A2A) ist für die Kommunikation zwischen Agenten gedacht, auch wenn diese auf unterschiedlichen Stacks gebaut sind. Stellen Sie sich MCP als senkrechte Verbindung vom Agenten hinunter zu dem vor, was er nutzen kann, und A2A als waagerechte Verbindung zwischen Agenten. Keines von beiden entscheidet, wer was darf; diese Richtlinienschicht muss über beiden liegen. Der Beitrag erklärt, wo was passt, was keines abdeckt und wie man Governance einordnet.

## Wofür MCP gedacht ist

Anthropic hat MCP im November 2024 so beschrieben:

> It provides a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol.

Quelle: [Introducing the Model Context Protocol, Anthropic](https://www.anthropic.com/news/model-context-protocol). Sinngemäß: ein universeller, offener Standard, der KI-Systeme mit Datenquellen verbindet und fragmentierte Integrationen durch ein einziges Protokoll ersetzt. In der Praxis stellt ein MCP-Server Werkzeuge, Ressourcen und Prompts bereit, und ein MCP-Client im Agenten-Harness entdeckt und ruft sie auf. Der Agent ist der Client; der Server kapselt ein System wie einen Ticket-Tracker, eine Datenbank oder einen Dateispeicher. Zum Auffrischen: [Was ist MCP](/de/posts/what-is-mcp/).

Der entscheidende Punkt für diesen Vergleich: MCP dreht sich darum, dass **ein Agent Fähigkeiten nutzt**. Die Beziehung ist asymmetrisch. Der Server denkt nicht über Ziele nach; er führt den Aufruf aus und liefert ein Ergebnis.

## Wofür A2A gedacht ist

Google hat A2A im April 2025 vorgestellt und den Zweck so beschrieben:

> The A2A protocol will allow AI agents to communicate with each other, securely exchange information, and coordinate actions

Quelle: [Announcing the Agent2Agent Protocol (A2A), Google for Developers Blog](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/). Sinngemäß: Das A2A-Protokoll soll KI-Agenten ermöglichen, miteinander zu kommunizieren, sicher Informationen auszutauschen und Aktionen zu koordinieren. Das Szenario: Ein Agent braucht Hilfe eines anderen Agenten, der womöglich von einem anderen Team oder Anbieter betrieben und mit einem anderen Framework gebaut wurde. Die Gegenseite ist keine einzelne Funktion, sondern ein autonomer Partner mit eigenem Denken, eigenen Werkzeugen und eigenen Richtlinien. Der aufrufende Agent delegiert eine Aufgabe und erhält Ergebnisse, ohne zu wissen, wie der Partner intern arbeitet.

## Gegenüberstellung

| | MCP | A2A |
| --- | --- | --- |
| Verbindet | Agent und Werkzeuge oder Daten | Agent und Agent |
| Richtung im Diagramm | senkrecht (hinunter zu Fähigkeiten) | waagerecht (zwischen Partnern) |
| Gegenstelle | ein Server, der ein System kapselt | ein anderer Agent mit eigenem Denken |
| Typische Arbeitseinheit | ein Aufruf mit Argumenten und Ergebnis | eine delegierte Aufgabe, die dauern kann |
| Hauptrisiko | Werkzeugmissbrauch, vergiftete Werkzeugdaten | delegierte Befugnis, nicht vertrauenswürdige Ausgabe des Partners |

![MCP und A2A als senkrechte und waagerechte Verbindungen](/images/blog/mcp-and-a2a-1.svg)

Das Bild von senkrecht und waagerecht ist vereinfacht. Ein über A2A erreichter Partner nutzt seinerseits MCP-Server für seine Arbeit. Und hinter einem MCP-Server kann ein Modell stecken, was die Grenze verwischt. Die nützliche Frage lautet nicht "Welches Protokoll ist das richtige?", sondern "Gebe ich einem Agenten eine Fähigkeit oder übergebe ich eine Aufgabe an einen anderen Entscheider?"

## Brauchen Sie A2A überhaupt?

Oft nicht. Laufen alle Ihre Agenten innerhalb einer Plattform und einer Organisation, ist ein interner Übergabemechanismus mit typisierten Verträgen womöglich einfacher als ein herstellerübergreifendes Protokoll; siehe [Übergaben und Verträge](/de/posts/handovers-and-contracts/). Und bevor Sie Arbeit überhaupt auf mehrere Agenten verteilen, prüfen Sie, ob sich [Multi-Agent lohnt](/de/posts/when-multi-agent-is-worth-it/); ein einzelner Agent mit guten Werkzeugen genügt häufig.

A2A wird interessant, wenn Agenten verschiedenen Eigentümern gehören: der Agent eines Lieferanten, der Dienst eines Partners, eine Abteilung mit eigenem Stack. Dort spart ein vereinbartes Protokoll für Entdeckung, Aufgabenaustausch und Ergebnisse eine eigene Integration für jedes Paar.

## Ökosystem und Steuerung der Standards

Die Betreuung von MCP ist zu einer neutralen Stiftung gewandert. Die Linux Foundation hat im Dezember 2025 die Agentic AI Foundation angekündigt:

> Its inaugural projects, AGENTS.md, goose and MCP, lay the groundwork for a shared ecosystem of tools, standards, and community-driven innovation.

Quelle: [Linux Foundation Announces the Formation of the Agentic AI Foundation (AAIF)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation). Sinngemäß: Die ersten Projekte (AGENTS.md, goose und MCP) legen die Grundlage für ein gemeinsames Ökosystem aus Werkzeugen, Standards und gemeinschaftlich getragener Innovation. Anthropic, das MCP geschaffen hat, erklärte zeitgleich seine Absicht:

> Since its inception, we’ve been committed to ensuring MCP remains open-source, community-driven and vendor-neutral.

Quelle: [Donating MCP to the Agentic AI Foundation, Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation). Sinngemäß: Man habe sich von Anfang an verpflichtet, MCP quelloffen, gemeinschaftlich getragen und herstellerneutral zu halten. Für Anwender ist das relevant, weil ein Protokoll unter neutraler Steuerung eine sicherere Grundlage ist als eines, das ein einzelner Anbieter kontrolliert. Prüfen Sie den aktuellen Stand jeder Spezifikation selbst, bevor Sie sich festlegen; Protokolle und ihre Steuerung ändern sich schneller als Blogbeiträge.

## Was keines der Protokolle abdeckt

Protokolle legen fest, wie Nachrichten fließen. Sie legen nicht fest, ob eine Nachricht erlaubt sein soll. Diese Entscheidungen überlassen beide Ihnen:

- **Identität und Autorisierung.** Welcher Agent darf im Auftrag welcher Person welches Werkzeug oder welchen Partner mit welchem Umfang aufrufen?
- **Richtlinien für Argumente und Aktionen.** Ist dieser Zahlungsbetrag akzeptabel? Steht dieser Empfänger auf der Freigabeliste? Braucht es eine menschliche Genehmigung?
- **Budgets und Limits.** Wie viele Aufrufe, wie viel Geld, wie viel Zeit pro Lauf oder Partner?
- **Audit.** Welche Aufrufe fanden statt, in welcher Reihenfolge, auf wessen Befugnis, mit welchem Ergebnis?
- **Vertrauen in Inhalte.** Text, den ein Werkzeug oder ein Partner-Agent zurückgibt, ist nicht vertrauenswürdige Eingabe und kann eingeschleuste Anweisungen enthalten. Wer auf Werkzeug- oder Partnerausgaben aufbaut, sollte das berücksichtigen.

Deshalb muss Governance über beiden Protokollen liegen: eine Richtlinien- und Audit-Schicht, durch die jeder MCP-Aufruf und jede Delegation an einen anderen Agenten läuft. So hängen die Regeln nicht davon ab, welches Protokoll die Nachricht gerade trägt.

## Eine praktische Checkliste

Wenn Sie einen Agenten mit etwas verbinden, fragen Sie:

1. Ist die Gegenseite eine **Fähigkeit** (MCP-Art) oder ein **Entscheider** (A2A-Art)?
2. Wem gehört sie, und gibt es eine benannte Kontaktperson?
3. Welche Identität trägt der Aufruf, und ist es die engste, mit der es funktioniert?
4. Wo sitzt das Richtlinien-Gate, das diesen Aufruf sieht, und sieht es beide Protokolle?
5. Werden Aufrufe und Ergebnisse so detailliert protokolliert, dass sich ein Lauf rekonstruieren lässt?
6. Was geschieht, wenn Partner oder Server ausfallen, langsam sind oder falsch liegen?

Eine minimale Richtlinienskizze, die für beide Verbindungsarten gilt:

```yaml
policy:
  applies_to: [mcp_call, agent_delegation]
  rules:
    - match: { target: "tickets.*", action: "write" }
      require: approval
    - match: { target_type: "external_agent" }
      require: [allowlisted_peer, max_budget_per_task]
    - match: { any: true }
      log: full
```

## Grenzen dieses Vergleichs

Die Protokolle sind jung und entwickeln sich weiter. Die Tabelle oben gibt ihre erklärten Zwecke wieder, nicht jede Funktion jeder Version. Prüfen Sie Details an den aktuellen Spezifikationen und testen Sie alles, was als Erweiterung kommt (Authentifizierungsprofile, Streaming, Registries), in Ihrer Umgebung.

## Das Wichtigste in Kürze

- MCP verbindet einen Agenten mit Werkzeugen und Daten; A2A ist für Agenten gedacht, die mit anderen Agenten sprechen.
- Beide ergänzen sich: Ein über A2A erreichter Partner nutzt für seine Arbeit selbst MCP-Server.
- Innerhalb einer Organisation oder Plattform brauchen Sie A2A womöglich gar nicht.
- Keines der Protokolle entscheidet über Autorisierung, Budgets oder Audit; eine Governance-Schicht gehört über beide.
- Werkzeugergebnisse und Ausgaben von Partnern sind nicht vertrauenswürdige Eingaben.

## Quellen

- [Announcing the Agent2Agent Protocol (A2A) (Google for Developers Blog, 2025-04-09)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Introducing the Model Context Protocol (Anthropic, 2024-11-25)](https://www.anthropic.com/news/model-context-protocol)
- [Linux Foundation Announces the Formation of the Agentic AI Foundation (AAIF) (2025-12-09)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Donating MCP to the Agentic AI Foundation (Anthropic, 2025-12-09)](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
