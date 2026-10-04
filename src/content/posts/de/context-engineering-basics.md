---
ref: context-engineering-basics
lang: de
title: "Context Engineering: die kleinste Menge Tokens, die die Aufgabe erfüllt"
description: Context Engineering behandelt das Kontextfenster als begrenztes Budget. So halten Sie es klein: Kompaktierung, Teilaufgaben mit eigenem Kontext, Notizen.
date: 2026-04-07T09:00:00Z
tags: [context, tools, explainer]
---

**Context Engineering** heißt, in jedem Schritt eines Agentenlaufs bewusst zu entscheiden, was im Kontextfenster
des Modells steht und was draußen bleibt. Ein Prompt ist nur eine Eingabe. Der Kontext ist alles, was das Modell
sieht: Systemprompt, Tool-Definitionen, Skill-Beschreibungen, Gesprächsverlauf, abgerufene Dokumente und die
aktuelle Aufgabe. Weil das Fenster endlich ist und die Qualität sinkt, wenn es sich mit Rauschen füllt, lautet
das Ziel: ein kleiner Kontext mit hohem Signalanteil, kein großer.

## Kontext ist ein Budget, kein Eimer

Das Entwicklerteam von Anthropic fasst den Ausgangspunkt in einem Satz zusammen (Zitate im englischen Original):

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic, 2025)

Sinngemäß: Kontext ist eine endliche Ressource mit abnehmendem Grenznutzen. Derselbe Artikel nennt das Ziel:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.
>
> [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic, 2025)

Daraus folgt: Ein weiterer Absatz „sicherheitshalber“ ist nicht gratis. Er konkurriert mit allem anderen um
Aufmerksamkeit, Kosten und Latenz. Prompt Engineering fragt: „Wie formuliere ich diese Anweisung?“ Context
Engineering fragt: „Welche Tokens braucht das Modell jetzt, und woher kommen sie?“

## Was das Fenster tatsächlich füllt

Messen Sie, bevor Sie optimieren. In einem typischen Agenten teilen sich fünf Verbraucher das Fenster:

1. **Systemprompt**: Rolle, Regeln, Ausgabeformat.
2. **Tool-Definitionen**: Namen, Beschreibungen und JSON-Schemas aller angebotenen Tools.
3. **Skill-Metadaten**: die kurzen Beschreibungen, die dem Agenten sagen, welche Skills es gibt.
4. **Verlauf**: frühere Runden, Tool-Aufrufe und Tool-Ergebnisse.
5. **Die aktuelle Aufgabe**: die eigentliche Anfrage samt Eingaben.

![Aufschlüsselung dessen, was das Kontextfenster eines Agenten füllt](/images/blog/context-engineering-basics-1.svg)

Tool-Definitionen und Verlauf überraschen meist am meisten. Jedes angebundene Tool kostet in jeder Runde Tokens,
ob es genutzt wird oder nicht, und Tool-Ergebnisse häufen sich schnell. Gute, kompakte Tools zu schreiben ist
eine eigene Disziplin, siehe [Werkzeuge schreiben, die Agenten nutzen können](/de/posts/writing-tools-agents-can-use/).

## Werkzeuge, die den Kontext sprengen

Wer einen Agenten an viele Tool-Server anbindet, zahlt einen sichtbaren Preis. Anthropic beschreibt ihn so:

> In cases where agents are connected to thousands of tools, they’ll need to process hundreds of thousands of tokens before reading a request.
>
> [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) (Anthropic, 2025)

Sinngemäß: Bei tausenden angebundenen Tools müssen Agenten hunderttausende Tokens verarbeiten, bevor sie die
Anfrage überhaupt lesen. Derselbe Artikel zeigt die andere Seite. Werden Zwischendaten von Code verarbeitet,
statt durch das Modell zu laufen, ändern sich die Zahlen drastisch:

> This reduces the token usage from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7%.
>
> [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) (Anthropic, 2025)

Das ist ein Beispiel aus einem Artikel, kein allgemeingültiges Verhältnis. Übertragbar ist die Idee: Das Modell
muss Daten nicht lesen, die es nur weiterreicht. Filtern, aggregieren und verknüpfen Sie im Code und zeigen
Sie dem Modell das Ergebnis.

## Vier praktische Techniken

### 1. Bei Bedarf laden

Bieten Sie eine kurze Liste von Fähigkeiten an und laden Sie Details erst, wenn sie gebraucht werden. Skills
tun das mit einer Einzeiler-Beschreibung, die immer präsent ist, und einem Rumpf, der nur bei Bedarf gelesen
wird; siehe [Aufbau eines Agent-Skills](/de/posts/anatomy-of-an-agent-skill/). Dasselbe gilt für Tools: Stellen
Sie die Tools für den aktuellen Schritt bereit, nicht für den ganzen Prozess.

### 2. Kompaktierung

Nähert sich ein Gespräch dem Limit, fasst man es zusammen und arbeitet mit der Zusammenfassung weiter. Behalten
Sie, was der nächste Schritt braucht: getroffene Entscheidungen, offene Fragen, Dateipfade und Kennungen.
Verwerfen Sie den Rest: bereits genutzte rohe Tool-Ausgaben, Sackgassen, wiederholte Anweisungen. Kompaktierung
verliert Information, prüfen Sie sie daher mit einer Aufgabe, die von einem frühen Detail abhängt.

### 3. Strukturierte Notizen außerhalb des Fensters

Lassen Sie den Agenten Fortschrittsnotizen in eine Datei oder einen Speicher schreiben und später wieder lesen.
Eine Notizdatei mit „erledigt“, „als Nächstes“ und „Entscheidungen“ übersteht einen Kontext-Reset und kostet
wenige hundert Tokens. Zudem kann ein Mensch sie prüfen, anders als eine versteckte Zusammenfassung.

### 4. Teilaufgaben mit eigenem Kontext

Geben Sie eine in sich geschlossene Teilaufgabe, etwa „suche im Repository alle Aufrufer dieser Funktion“, an
einen Sub-Agenten mit frischem Fenster. Er kann tausende Tokens Rauschen lesen und eine Zusammenfassung von
wenigen hundert zurückgeben. Der Kontext des übergeordneten Agenten bleibt sauber. Die Übergabe braucht eine
klare Eingabe und ein klares Ausgabeformat, sonst verliert die Zusammenfassung das Entscheidende.

Verwandt ist ein eigener Platz zum Nachdenken. Anthropic beschreibt ein „think“-Tool als

> a "think" tool that creates dedicated space for structured thinking during complex tasks.
>
> [The "think" tool: Enabling Claude to stop and think](https://www.anthropic.com/engineering/claude-think-tool) (Anthropic, 2025)

Sinngemäß: ein Tool, das bei komplexen Aufgaben Raum für strukturiertes Denken schafft. Es fügt einen Schritt
hinzu, setzen Sie es also dort ein, wo eine Entscheidung von einer bewussten Pause profitiert, nicht überall.

## Prompt oder Kontext? Ein Schnelltest

Stellen Sie diese Fragen, wenn ein Lauf schlecht verläuft:

```text
[ ] Ist die Anweisung unklar?                 -> Prompt-Problem
[ ] Fehlt der nötige Fakt?                    -> Kontext-Problem (Abruf, Notizen)
[ ] Ist der Fakt da, aber vergraben?          -> Kontext-Problem (zu viel Rauschen)
[ ] Enthält ein Tool-Ergebnis 50 KB?          -> Tool-Design-Problem
[ ] Driftet das Verhalten spät im Lauf?       -> Verlauf wächst; kompaktieren oder teilen
```

Wer die richtige Schicht repariert, spart viel Prompt-Umschreiberei. Zur Gewohnheit, immer mehr Prompts
aufzutürmen, siehe [Prompt-Wildwuchs und KI-Schlamperei](/de/posts/prompt-sprawl-and-ai-slop/).

## Agenten-Gedächtnis ohne Hype

„Gedächtnis“ bedeutet bei Agenten praktisch eines von dreien: der Verlauf im Fenster, Notizen, die der Agent
schreibt und liest, oder ein Abrufindex über Dokumente. Alle drei sind Context-Engineering-Entscheidungen
darüber, was man schreibt, wie man es wiederfindet und wann man es verwirft. Veraltete Notizen schaden wie
veraltete Dokumentation, geben Sie ihnen deshalb einen Verantwortlichen und eine Verfallsregel.

## Das Wichtigste in Kürze

- Kontext ist ein begrenztes Budget; Ziel ist die kleinste Menge Tokens mit hohem Signalanteil.
- Messen Sie, was das Fenster füllt: Tools und Verlauf sind die üblichen Überraschungen.
- Laden Sie Tools und Skills bei Bedarf und verarbeiten Sie Massendaten im Code statt im Modell.
- Kompaktierung, strukturierte Notizen und Teilaufgaben mit eigenem Kontext halten das Fenster sauber.
- Klären Sie vor dem Umschreiben, ob ein Fehler am Prompt, am Kontext oder am Tool-Design liegt.

## Quellen

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic, 29.09.2025.
- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp), Anthropic, 04.11.2025.
- [The "think" tool: Enabling Claude to stop and think](https://www.anthropic.com/engineering/claude-think-tool), Anthropic, 20.03.2025.
