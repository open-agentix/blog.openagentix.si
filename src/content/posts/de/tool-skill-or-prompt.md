---
ref: tool-skill-or-prompt
lang: de
title: "Tool, Skill oder Prompt? Drei Wege, einem Agenten das Nötige zu geben"
description: "Agent Skills vs. Tools vs. Prompts: Ein Tool handelt, ein Skill bündelt Know-how zum Nachladen, ein Prompt ist Dauertext. Mit Entscheidungstabelle."
date: 2026-02-26T09:00:00Z
tags: [skills, tools, mcp, architecture]
---

Die Frage „Agent Skills vs. Tools“ klingt akademisch, bis ein Kontextfenster voller Anweisungen
steckt, die niemand mehr kennt, oder bis ein Agent etwas tut, das niemand erlauben wollte. Die kurze
Antwort: Ein **Tool** führt eine Aktion aus, ein **Skill** bündelt Know-how, das bei Bedarf
nachgeladen wird, und ein **Prompt** ist Dauertext, der immer vorhanden ist. Sie lösen
unterschiedliche Probleme, scheitern auf unterschiedliche Weise und brauchen unterschiedliche
Kontrollen. Nur Tools brauchen ein Policy-Gate. Skills brauchen eine Herkunftsprüfung. Prompts
brauchen jemanden, der sie verantwortet und liest.

![Vergleich von Tool, Skill und Prompt nach Zweck, Laden und Kontrolle](/images/blog/tool-skill-or-prompt-1.svg)

## Was was ist

**Ein Tool** ist eine aufrufbare Fähigkeit mit Namen, Eingabeschema und Ergebnis. Das Modell fordert
es an, ein Harness führt es aus, und in der Außenwelt kann sich etwas ändern: Ein Ticket entsteht,
eine Datei wird geschrieben, eine Abfrage läuft. Im Model Context Protocol stellen Server solche
Tools einer Host-Anwendung bereit, und die Spezifikation ist beim Risiko deutlich. Sinngemäß: Es
soll immer ein Mensch beteiligt sein, der Tool-Aufrufe ablehnen kann.

> there SHOULD always be a human in the loop with the ability to deny tool invocations.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

**Ein Skill** ist Know-how, keine Aktion. Anthropic beschreibt das Format so (die Quelle ist
englisch, das Zitat bleibt im Original):

> Skills are folders that include instructions, scripts, and resources that Claude can load when needed.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Ein Skill sagt dem Modell, *wie* es etwas gut macht: die Schritte eines Reviews, den Aufbau eines
Berichts, die Prüfungen vor einem Release. Er kann Skripte enthalten, aber er verleiht dem Modell
selbst keine neue Berechtigung. Was ein Agent tun kann, hängt weiter von den Tools ab, die er hält.

**Ein Prompt** meint hier Dauertext: den System-Prompt, die Projektregeln, die Rollenbeschreibung.
Er steht in jedem Zug im Kontext. Das ist seine Stärke (er prägt das Verhalten zuverlässig) und
sein Preis (jedes Token wird bei jedem Aufruf bezahlt und konkurriert um Aufmerksamkeit).

## Warum die Unterscheidung zählt: Kontext ist begrenzt

Skills gibt es wegen der Kontext-Ökonomie. Anthropics Engineering-Team nennt das Entwurfsprinzip
direkt:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

„Progressive disclosure“ heißt: schrittweise offenlegen. Nur eine kurze Beschreibung jedes Skills
liegt dauerhaft im Kontext. Die vollständigen Anweisungen werden gelesen, wenn die Aufgabe passt,
verlinkte Dateien nur bei Bedarf. Ein Prompt kann das nicht, er ist immer aktiv. Ein System-Prompt,
der vierzig Abläufe abdeckt, ist eine Skill-Bibliothek in der falschen Form.

Derselbe Autorenkreis erklärt im Artikel zu Context Engineering, warum das wichtig ist:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Auch Tool-Definitionen zählen zu diesem Budget. Fünfzig Tool-Schemas, die in jedem Zug angeboten
werden, sind ein verkappter Dauer-Prompt. Die erste praktische Regel lautet deshalb: Jede
Anleitung gehört dorthin, wo ihr Ladeverhalten zur Häufigkeit des Bedarfs passt.

## Eine Entscheidungstabelle

| Frage | Tool | Skill | Prompt |
| --- | --- | --- | --- |
| Ändert es etwas außerhalb des Modells? | Ja | Nein, es leitet an | Nein |
| Wird es in jedem Zug gebraucht? | Nur die Definition | Nein, bei Bedarf | Ja |
| Kann es Geld oder Daten kosten? | Ja, direkt | Indirekt, über die empfohlenen Schritte | Indirekt |
| Wer prüft es? | Sicherheit und Systemverantwortliche | Wer das Know-how verantwortet | Wer den Agenten verantwortet |
| Was kontrolliert es zur Laufzeit? | Ein Policy-Gate bei jedem Aufruf | Herkunft, Review und Versionierung | Versionskontrolle und Review |

Im Zweifel helfen zwei Fragen. Erstens: Passiert in der Welt etwas, wenn dies benutzt wird? Wenn ja,
ist es ein Tool oder ein Skill, der Tools aufruft, und die Tools tragen das Risiko. Zweitens: Wird
es in jedem Zug gebraucht? Wenn nicht, gehört es vermutlich nicht in den Prompt.

## Verschiedene Artefakte, verschiedene Kontrollen

Hier wird die Verwechslung vom Stilproblem zum Governance-Problem.

**Tools brauchen ein Policy-Gate.** Der Tool-Aufruf ist der Moment, in dem aus Absicht Wirkung wird.
Die Entscheidung darüber sollte nicht vom guten Verhalten des Modells abhängen. Ein deterministisches
Gate prüft Identität, Tool und Argumente, bevor der Aufruf läuft, und protokolliert die
Entscheidung, wie in [Policy entscheidet, Audit beweist](/de/posts/policy-decides-audit-proves/)
beschrieben. Auch die Vergabe sollte eng sein: Das Prinzip aus
[Minimale Rechte für Agenten](/de/posts/least-privilege-for-agents/) gilt für jedes Tool, und ein
nicht vergebenes Tool sollte dem Modell gar nicht erst gezeigt werden. Die MCP-Spezifikation enthält
eine Warnung, die in jedes Tool-Review gehört:

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

Die Selbstauskunft eines Tools über seine Sicherheit kann also nicht die Kontrolle sein.

**Skills brauchen eine Herkunftsprüfung.** Ein Skill ist Text, der das Modell lenkt, und kann
Skripte mitbringen, die laufen. Ihn zu installieren ähnelt dem Hinzufügen einer Abhängigkeit, nicht
dem Lesen eines Artikels. Anthropics Hinweis ist kurz:

> When installing a skill from a less-trusted source, thoroughly audit it before use.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

In der Praxis heißt das: Herkunft kennen, Version oder Commit festlegen, Anweisungen und jedes
Skript lesen und die Kopie im eigenen Repository halten. Ein Skill kann sich keine Berechtigung
geben, die die Policy verweigert, aber er kann einen Agenten dazu bringen, vorhandene Rechte
falsch zu nutzen. Deshalb zählt das Review.

**Prompts brauchen eine verantwortliche Person.** Prompts haben weder Gate noch Ladelogik. Ihre
Kontrolle ist die unspektakuläre: Sie liegen in der Versionskontrolle, jemand ist zuständig, und
Änderungen werden wie Code geprüft. Der häufigste Prompt-Fehler ist Anhäufung: Jeder Vorfall fügt
einen Absatz hinzu.

## Häufige Fehler

- **Ein Skill im System-Prompt versteckt.** Vierzig Abläufe, in jedem Zug geladen. Jeden in einen
  Skill mit präziser Beschreibung verschieben.
- **Ein Tool, das eigentlich ein Skill ist.** Ein „Tool“, das nur Anweisungstext zurückgibt, führt
  keine Aktion aus. Als Skill modelliert schrumpft die Policy-Fläche.
- **Ein Skill, der Berechtigungen einschmuggelt.** Braucht ein Skript Netz- oder Schreibzugriff,
  gehört dieser Bedarf in Tool-Vergabe und Policy, nicht in eine README.
- **Ein breites Tool statt mehrerer enger.** Ein Tool, das beliebige Aktion und Ziel annimmt, lässt
  sich nicht mit einer kurzen Regel steuern. Enge Tools machen Erlauben und Verbieten einfach.

## Eine kurze Checkliste

1. Auflisten, was der Agent kann (Tools), was er weiß (Skills) und was ihm in jedem Zug gesagt wird
   (Prompts). Drei Listen statt einer.
2. Je Tool: Ist es pro Agent vergeben, ist die Form der Argumente eingeschränkt, entscheidet die
   Policy bei jedem Aufruf?
3. Je Skill: Woher stammt er, welche Version ist festgelegt, wer hat die Skripte geprüft?
4. Je Prompt-Absatz: Wird er in jedem Zug gebraucht? Wenn nicht, in einen Skill verschieben.
5. Den Dauerkontext messen. Wächst er weiter, liegt etwas in der falschen Schublade.

Ein Harness kann Tool-Aufrufe absichern, aber keinen Prompt-Absatz beurteilen, ein weiterer Grund,
die drei zu trennen. Zum Harness selbst siehe
[Was ist ein Agent-Harness](/de/posts/what-is-an-agent-harness/).

## Das Wichtigste in Kürze

- Ein Tool handelt, ein Skill lehrt, ein Prompt weist in jedem Zug an.
- Anleitung dorthin legen, wo das Ladeverhalten passt: selten gebraucht heißt Skill, immer gebraucht
  heißt Prompt.
- Nur Tools brauchen ein Policy-Gate; eng vergeben ist der wichtigste Sicherheitshebel.
- Skills sind Lieferkette: Herkunft prüfen, Versionen festlegen, Skripte lesen.
- Prompts brauchen Verantwortliche und Versionskontrolle und sollten klein bleiben.

## Quellen

- Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (2025-10-16)
- Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills) (2025-10-16)
- Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29)
