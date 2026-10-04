---
ref: agents-md-project-context
lang: de
title: "AGENTS.md: ein vorhersehbarer Ort für Projektkontext"
description: "AGENTS.md ist eine Markdown-Datei im Repository-Root mit Build-Schritten, Konventionen und Grenzen für Coding-Agenten. Was hineingehört und was in Skills."
date: 2026-07-02T09:00:00Z
tags: [harness, skills, context]
---

AGENTS.md ist eine einfache Markdown-Datei im Wurzelverzeichnis eines Repositorys. Sie sagt einem Coding-Agenten, wie das Projekt funktioniert: wie man es baut und testet, welche Konventionen gelten und was tabu ist. Die Datei sollte kurz sein und das Projekt als Ganzes beschreiben; Schritt-für-Schritt-Abläufe gehören in Skills. Diese Aufteilung ist der Kern der Idee, und der Rest dieses Beitrags zeigt, wie man sie anwendet.

## Was AGENTS.md ist

Die Projektseite beschreibt das Format in einem Satz (hier im englischen Original):

> Think of AGENTS.md as a README for agents: a dedicated, predictable place to provide the context and instructions

Quelle: [agents.md](https://agents.md/). Sinngemäß: AGENTS.md ist die README für Agenten, ein eigener, vorhersehbarer Ort für Kontext und Anweisungen.

Das entscheidende Wort ist *vorhersehbar*. Eine README ist für Menschen geschrieben und sieht in jedem Projekt anders aus. Ein Agent, der in einem unbekannten Repository startet, müsste sonst raten, wo der Build-Befehl steht, ob Tests eine Datenbank brauchen und welche Verzeichnisse generiert sind. Eine Datei mit festem Namen an festem Ort nimmt ihm dieses Raten ab, in jedem Werkzeug, das sie liest.

Das Format ist längst kein Nebenprojekt eines einzelnen Anbieters mehr. Als die Linux Foundation die Agentic AI Foundation ankündigte, nannte sie AGENTS.md unter den ersten Projekten:

> Its inaugural projects, AGENTS.md, goose and MCP, lay the groundwork for a shared ecosystem of tools, standards, and community-driven innovation.

Quelle: [Linux Foundation, 2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation). Sinngemäß: Die ersten Projekte, darunter AGENTS.md, goose und MCP, legen die Grundlage für ein gemeinsames Ökosystem aus Werkzeugen, Standards und Community-Innovation.

Die Datei hat kein vorgeschriebenes Schema. Es ist Markdown, und der Agent liest sie als Text. Das ist eine Stärke (jeder schreibt eine in fünf Minuten) und eine Schwäche (nichts hindert sie daran, zu einer Textwüste zu wachsen).

## Wo sie im Repository liegt

![Wo AGENTS.md, Skills und README in einem Repository liegen](/images/blog/agents-md-project-context-1.svg)

Drei Artefakte haben drei Zielgruppen:

- **README.md** richtet sich an Menschen, die wissen wollen, was das Projekt ist und wozu es existiert.
- **AGENTS.md** richtet sich an Agenten, die im Repository arbeiten sollen. Die Datei wird zu Beginn einer Sitzung in den Kontext geladen, also kostet jede Zeile darin jedes Mal Token.
- **Skills** sind für Abläufe, die nur manchmal wichtig sind, etwa ein Release oder eine Datenbankmigration. Sie werden bei Bedarf geladen. Den Aufbau beschreibt [die Anatomie eines Agenten-Skills](/de/posts/anatomy-of-an-agent-skill/).

Wenn unklar ist, wohin eine Information gehört, hilft die Frage, wie oft der Agent sie braucht. „Bei jeder Aufgabe“ heißt AGENTS.md. „Manchmal, dann aber im Detail“ heißt Skill. „Nie, aber ein Mensch vielleicht“ heißt README.

## Warum kurz besser ist als vollständig

Alles in AGENTS.md konkurriert mit der eigentlichen Aufgabe um dieselbe begrenzte Aufmerksamkeit. Das Engineering-Team von Anthropic formuliert es so:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.

Sinngemäß: Kontext ist eine endliche Ressource mit abnehmendem Grenznutzen. Und das daraus folgende Ziel:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.

Sinngemäß: Gutes Context Engineering heißt, die kleinstmögliche Menge aussagekräftiger Token zu finden, die die Chance auf das gewünschte Ergebnis maximiert.

Quelle: [Anthropic, Effective context engineering for AI agents, 2025-09-29](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

Für eine Anweisungsdatei folgt daraus ein Test für jede Zeile: Würde der Agent ohne sie etwas falsch machen? „Schreibe sauberen Code“ besteht den Test nicht. „Vor dem Commit `pnpm test:unit` ausführen; die Integrationstests brauchen Docker und dauern zehn Minuten, also nur auf Anfrage“ besteht ihn. Unsere [Grundlagen des Context Engineering](/de/posts/context-engineering-basics/) erklären genauer, warum dieses Budget zählt.

## Was in AGENTS.md gehört

Eine brauchbare Datei hat meist fünf kurze Abschnitte.

1. **Projekt in einem Absatz.** Was der Code tut und die wichtigsten Bestandteile.
2. **Befehle.** Installieren, bauen, testen, linten und einen einzelnen Test ausführen. Exakte Befehle in Codeblöcken.
3. **Konventionen.** Sprachversion, Formatierung, Namen, Format der Commit-Nachrichten, wohin neue Dateien gehören.
4. **Grenzen.** Generierte Verzeichnisse, Dateien, die nicht von Hand geändert werden dürfen, Dienste, die Tests nicht aufrufen dürfen.
5. **Stolpersteine.** Die zwei oder drei Dinge, an denen schon jemand gescheitert ist: ein instabiler Test, eine zwingend gesetzte Umgebungsvariable, eine Migrationsreihenfolge.

Ein kompaktes Beispiel:

```markdown
# AGENTS.md

Abrechnungsdienst (TypeScript, Node 22). API in `src/api`, Jobs in `src/jobs`.

## Commands
- Install: `pnpm install --frozen-lockfile`
- Unit tests: `pnpm test:unit` (single file: `pnpm test:unit path/to/file`)
- Lint and types: `pnpm check`

## Conventions
- Conventional Commits, English, imperative.
- New endpoints need a test in `test/api` and an entry in `openapi.yaml`.

## Boundaries
- `src/generated/` is produced by `pnpm codegen`; never edit it.
- Tests must not call the real payment provider; use `test/fakes`.

## Gotchas
- `DATABASE_URL` must point at the test database or migrations will run on dev data.
```

Das sind weniger als zwanzig Zeilen, und sie decken das meiste ab, was ein Agent am ersten Tag braucht.

## Was stattdessen in einen Skill gehört

Der naheliegende Fehler ist, immer neue Abschnitte anzuhängen: Release-Prozess, Störungsbehandlung, Changelog schreiben, Datenbank migrieren. Jeder davon ist nützlich, und keiner wird für die meisten Aufgaben gebraucht. Zusammen machen sie aus zehn Zeilen ein Dokument, das der Agent vor jeder Änderung lesen muss.

Verschieben Sie jeden Block in einen Skill, wenn alles Folgende zutrifft:

- er ist ein **Ablauf** mit Schritten, keine Tatsache oder Regel,
- er gilt für **eine Art von Aufgabe**,
- er braucht womöglich **Skripte oder Referenzdateien** daneben.

In AGENTS.md bleibt dann eine einzige Zeile mit dem Verweis, etwa „Releases: den Skill `release` verwenden“. Den vollen Text bezahlt der Agent nur, wenn er ein Release baut. Wer für etwas Neues zwischen Skill, Tool und Prompt abwägt, findet in [Tool, Skill oder Prompt](/de/posts/tool-skill-or-prompt/) eine Entscheidungshilfe.

## Die Datei ehrlich halten

Eine Anweisungsdatei ist Code, den niemand kompiliert, und sie veraltet. Einige Gewohnheiten halten sie nützlich:

- **Änderungen wie Code behandeln.** Per Pull Request prüfen. Ein falscher Befehl in AGENTS.md führt jeden Agentenlauf in die Irre.
- **Streichen, was nicht mehr gebraucht wird.** Ist ein Stolperstein im Code behoben, fliegt der Eintrag raus.
- **Testen.** Eine frische Sitzung mit einer kleinen Aufgabe starten und prüfen, ob der Agent die Befehle ohne weitere Hinweise befolgt. Jede nötige Korrektur ist ein Kandidat für eine neue Zeile.
- **Keine Geheimnisse hineinschreiben.** Die Datei liegt im Repository und wird von Werkzeugen gelesen. Beschreiben Sie, woher Zugangsdaten kommen, nie die Daten selbst.
- **Die README nicht kopieren.** Für Hintergründe verlinken.
- **Die Grenzen kennen.** Die Datei ist ein Rat und erzwingt nichts. Was nie passieren darf, etwa Schreiben in die Produktion, gehört in Berechtigungen und Sandboxing, nicht in einen Satz.

## Das Wichtigste in Kürze

- AGENTS.md ist die README für Agenten: fester Name, fester Ort, einfaches Markdown.
- Kontext ist begrenzt, also die kleinste Menge an Zeilen schreiben, die Fehler verhindert.
- Projektweite Fakten gehören in AGENTS.md: Befehle, Konventionen, Grenzen, Stolpersteine.
- Abläufe für eine Art von Aufgabe gehören in Skills, verlinkt in einer Zeile.
- Die Datei wie Code prüfen, regelmäßig kürzen und nie zur Durchsetzung verwenden.

## Quellen

- [AGENTS.md](https://agents.md/), die Startseite des Formats.
- [Linux Foundation announces the formation of the Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation), 2025-12-09.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic, 2025-09-29.
