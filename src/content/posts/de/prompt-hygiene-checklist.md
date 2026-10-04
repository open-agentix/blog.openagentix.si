---
ref: prompt-hygiene-checklist
lang: de
title: "Prompt-Hygiene: eine Prüfliste für Teams, die in Prompts ertrinken"
description: "Prompt management für Teams: eine Prüfliste zu Verantwortlichen, Version, Eval, Geltungsbereich und Review, plus die Regel: Wiederholtes in Skills."
date: 2026-07-30T09:00:00Z
tags: [quality, prompts, checklist]
---

Prompt-Management läuft darauf hinaus, Prompts wie Code zu behandeln, von dem andere abhängen: Jeder Prompt bekommt Verantwortliche, eine Version, einen Test, einen klaren Geltungsbereich und ein Review-Datum, und jeder Text, der an mehr als einer Stelle steht, wandert in einen gemeinsamen Skill. Teams, die das auslassen, landen bei Dutzenden fast gleicher, herrenloser und ungetesteter Prompts, der Agentenversion von kopiertem Code. Dieser Beitrag liefert eine Prüfliste, die sich an einem Nachmittag anwenden lässt.

## Wie sich Prompts anhäufen

Niemand plant ein Prompt-Chaos. Es wächst aus vernünftigen Schritten: Jemand schreibt einen System-Prompt, der funktioniert; eine Kollegin kopiert ihn und ändert zwei Zeilen; ein Dritter ergänzt nach einem Vorfall einen Absatz; die ursprüngliche Autorin verlässt das Team. Ein Jahr später gibt es vierzig Varianten, niemand weiß, welche aktuell ist, und eine Korrektur in einer erreicht die anderen nie. Unser früherer Beitrag zu [Prompt-Wildwuchs und KI-Schrott](/de/posts/prompt-sprawl-and-ai-slop/) beschreibt, wie das minderwertige Ausgaben in großer Zahl nährt.

Die Kosten sind real:

- **Uneinheitliches Verhalten.** Zwei Agenten mit „denselben“ Anweisungen verhalten sich verschieden.
- **Langsame Korrekturen.** Eine Korrektur muss in jeder Kopie gefunden und angewendet werden.
- **Verstecktes Risiko.** Alte Prompts behalten Berechtigungen und Anweisungen, die niemand geprüft hat.
- **Verschwendeter Kontext.** Lange, repetitive Prompts verbrauchen Aufmerksamkeit. Anthropics Hinweise zum Kontext sagen:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.

Quelle: [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29). Sinngemäß: Kontext ist eine endliche Ressource mit abnehmendem Grenznutzen.

Hygiene ist die Gewohnheit, die verhindert, dass der Haufen wächst.

## Die Prüfliste

![Prüfliste zur Prompt-Hygiene](/images/blog/prompt-hygiene-checklist-1.svg)

Wenden Sie diese fünf Prüfungen auf jeden Prompt an, der in Produktion läuft. Ein Prompt, der eine davon nicht besteht, ist nicht fertig oder reif für die Außerbetriebnahme.

### 1. Verantwortliche

- [ ] Eine benannte Person oder ein Team steht für diesen Prompt ein.
- [ ] Die Verantwortlichen sind neben dem Prompt festgehalten, nicht in jemandes Kopf.
- [ ] Wenn die Verantwortlichen gehen, wird die Zuständigkeit neu vergeben oder der Prompt außer Betrieb genommen.

Ein herrenloser Prompt ist eine Last: Niemand merkt, wenn er abdriftet.

### 2. Version

- [ ] Der Prompt liegt in der Versionsverwaltung, nicht in einem UI-Feld oder einer Chatnachricht.
- [ ] Jede Änderung hat eine Nachricht, die sagt, warum sie gemacht wurde.
- [ ] Laufende Agenten referenzieren eine bestimmte Version, damit erkennbar ist, welcher Text welches Verhalten erzeugt hat.

Für Skills beschreibt [Skills versionieren](/de/posts/versioning-agent-skills/) ein Schema, das auch für Prompts taugt.

### 3. Eval

- [ ] Es gibt mindestens eine Handvoll Testfälle: Eingaben mit dem erwarteten Ergebnis.
- [ ] Sie laufen automatisch, wenn sich der Prompt ändert.
- [ ] Ein fehlschlagender Fall blockiert die Änderung, oder die Verantwortlichen akzeptieren ihn ausdrücklich.

Sie brauchen keine Hunderte Fälle. Fünf bis zehn, die die Hauptaufgabe und die bekannten Fehlerbilder abdecken, fangen schon die meisten Rückschritte ab. Wie Ausgaben geprüft werden, bevor sie Nutzende erreichen, behandelt [Qualitätsschranken für Agentenausgaben](/de/posts/quality-gates-for-agent-output/).

### 4. Geltungsbereich

- [ ] Der Prompt sagt, wofür der Agent da ist und was er nicht tun darf.
- [ ] Er nennt nur Tools, die dieser Agent tatsächlich hat.
- [ ] Er enthält keine Anweisungen für andere Aufgaben „für alle Fälle“.

Schmale Prompts sind kürzer, billiger und leichter zu testen. Dieselbe Logik gilt für Tool-Namen: Anthropics Hinweise zum Schreiben von Tools halten fest:

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.

Quelle: [Anthropic, Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (2025-09-11). Sinngemäß: Namensräume (verwandte Tools unter gemeinsamen Präfixen) können Grenzen zwischen vielen Tools verdeutlichen; MCP-Clients tun das teils von sich aus.

Klare Grenzen helfen dem Modell und den Menschen, die den Prompt lesen.

### 5. Letztes Review

- [ ] Ein Review-Datum ist festgehalten.
- [ ] Prompts, die innerhalb der vereinbarten Frist (etwa sechs Monate) nicht geprüft wurden, werden markiert.
- [ ] Reviews prüfen den Prompt gegen aktuelles Modell, aktuelle Tools und Richtlinien.

Ein Prompt, der für das Modell und die Tools des Vorjahres geschrieben wurde, kann Umgehungen enthalten, die nicht mehr nötig sind, oder Fähigkeiten übersehen, die er nutzen sollte.

Ein einfacher Datensatz, der alle fünf erfüllt:

```yaml
prompt: support-triage-system
owner: support-platform
version: 1.4.0
scope: classify incoming tickets; no replies, no account changes
tools: [tickets.read, kb.search]
eval: evals/support-triage.yaml   # 12 cases, runs in CI
last-reviewed: <date>
```

## Die Regel für wiederholten Text: in einen Skill verschieben

Die wirksamste Hygieneregel lautet: **Kommt dasselbe Know-how in mehr als einem Prompt vor, gehört es nicht in Prompts.** Legen Sie es in einen Skill und lassen Sie Prompts darauf verweisen.

Typische Kandidaten:

- wie ein Bericht oder ein Ticket formatiert wird,
- wie ein bestimmtes Log oder ein Datensatz zu lesen ist,
- Ihre Eskalationsregeln,
- die Prüfliste für eine Art von Änderung.

Ein Skill ist eine Stelle zum Korrigieren, Versionieren und Prüfen. Die Agent-Skills-Spezifikation gibt die Grundform vor:

> The SKILL.md file must contain YAML frontmatter followed by Markdown content.

Quelle: [Agent Skills specification](https://agentskills.io/specification). Sinngemäß: Die Datei SKILL.md muss YAML-Frontmatter enthalten, gefolgt von Markdown-Inhalt.

Sie enthält auch den Rat, der Skills schlank hält:

> Consider splitting longer SKILL.md content into referenced files.

Sinngemäß: Längeren SKILL.md-Inhalt in referenzierte Dateien aufteilen.

Das Ziel entspricht dem, was die Hinweise zum Kontext allgemein über Prompts sagen:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.

Quelle: [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). Sinngemäß: Gutes Context Engineering heißt, die kleinstmögliche Menge aussagekräftiger Token zu finden, die die Chance auf das gewünschte Ergebnis maximiert.

Der Prompt bleibt kurz und agentenspezifisch; das gemeinsame Verfahren steht einmal da und wird bei Bedarf geladen. Für die projektweite Fassung derselben Idee eine AGENTS.md-Datei hält Fakten fest, die für das ganze Repository gelten.

## Ein Aufräumplan für einen Nachmittag

1. **Bestandsaufnahme.** Jeden Produktions-Prompt auflisten: wo er liegt, wer ihn nutzt, wer ihn geschrieben hat. Rechnen Sie mit Überraschungen.
2. **Duplikate finden.** Nach wiederholten Sätzen und Absätzen suchen. Cluster bilden.
3. **Herauslösen.** Jeden wiederholten Block in einen Skill oder ein gemeinsames Snippet verschieben und die Kopien durch einen Verweis ersetzen.
4. **Verantwortliche zuweisen.** Jeder Übriggebliebene bekommt einen Namen. Prompts, die niemand beansprucht, bekommen eine Frist und werden dann entfernt.
5. **Die fünf Felder ergänzen** (Verantwortliche, Version, Geltungsbereich, Eval, letztes Review) bei jedem Prompt.
6. **Eine erste Eval schreiben** für die drei wichtigsten Prompts.
7. **Die Erinnerung automatisieren.** Ein geplanter Job listet Prompts, deren Review überfällig ist.

## Was Hygiene nicht behebt

- Sie macht einen schwachen Prompt nicht stark; ob er es ist, zeigen die Evals.
- Eine bestandene Eval garantiert kein gutes Verhalten außerhalb der geschriebenen Fälle.
- Prozess kostet. Für ein einmaliges Experiment ist ein vollständiger Eintrag übertrieben. Wenden Sie die Prüfliste an, wenn ein Prompt für andere wichtig wird.
- Das Verschieben in Skills fügt einen Zwischenschritt hinzu. Halten Sie Skills klein und lösen Sie nichts heraus, was nur einmal vorkommt.

## Das Wichtigste in Kürze

- Prompts wie Code behandeln, von dem andere abhängen: Verantwortliche, Version, Eval, Geltungsbereich, letztes Review.
- Prompts in der Versionsverwaltung halten und bestimmte Versionen referenzieren.
- Eine Handvoll Eval-Fälle fängt die meisten Rückschritte ab; bei jeder Änderung ausführen.
- Wiederholtes Know-how wandert in Skills; Prompts bleiben kurz und spezifisch.
- Planmäßig prüfen und Prompts ohne Verantwortliche außer Betrieb nehmen.

## Quellen

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic, 2025-09-29.
- [Specification - Agent Skills](https://agentskills.io/specification), agentskills.io.
- [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents), Anthropic, 2025-09-11.
