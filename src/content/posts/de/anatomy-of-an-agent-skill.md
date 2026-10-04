---
ref: anatomy-of-an-agent-skill
lang: de
title: "Aufbau eines Agent-Skills: SKILL.md, schrittweises Laden und Umfang"
description: "SKILL.md ist der Einstieg eines Agent-Skills: Die kurze Beschreibung entscheidet, wann der Rest lädt. Progressive Disclosure, Minimal-Skill und Umfangsregeln."
date: 2026-03-26T09:00:00Z
tags: [skills, how-to, context]
---

Ein Skill ist ein Ordner mit einer Datei `SKILL.md` im Wurzelverzeichnis. Die Datei beginnt mit einem
kurzen Namen und einer Beschreibung, danach folgen Anweisungen. Ein Agent hält nur Name und
Beschreibung im Kontext und liest den Rest, wenn die Aufgabe passt. Dieses Ladeverhalten heißt
„Progressive Disclosure“ (schrittweises Offenlegen), und es ist der Grund, warum es Skills gibt.
Dieser Beitrag geht den Aufbau eines minimalen Skills durch, erklärt die drei Ladestufen und gibt
Regeln, einen Skill bei einer Aufgabe zu halten.

![Ladestufen eines Agent-Skills nach dem Prinzip des schrittweisen Offenlegens](/images/blog/anatomy-of-an-agent-skill-1.svg)

## Was ein Skill ist

Anthropic beschreibt das Format in einem Satz (Zitate im Original):

> Skills are folders that include instructions, scripts, and resources that Claude can load when needed.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Dieselbe Ankündigung nennt Portabilität als Entwurfsziel:

> Portable: Skills use the same format everywhere.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Ein Skill ist Know-how, keine Aktion: Er sagt dem Agenten, wie er eine Art von Aufgabe gut erledigt.
Er gewährt keine neuen Berechtigungen. Zum Unterschied zwischen Skills, Tools und Prompts siehe
[Tool, Skill oder Prompt?](/de/posts/tool-skill-or-prompt/).

## Der minimale Skill

Ein Ordner mit einer Datei ist ein gültiger Skill. Die Datei hat YAML-Front-Matter mit Name und
Beschreibung, danach Markdown-Anweisungen:

```text
release-notes/
└── SKILL.md
```

```markdown
---
name: release-notes
description: Draft release notes from merged pull requests. Use when asked to prepare a changelog or release announcement for a version.
---

# Release notes

1. List pull requests merged since the last tag, using the repository's own tooling.
2. Group them under Added, Changed, Fixed and Security.
3. Write one sentence per entry, in the imperative, without internal ticket numbers.
4. Mark breaking changes explicitly and put them first.
5. Output Markdown only. Do not publish or tag anything.
```

Drei Details sind wichtig. Der **Name** identifiziert den Skill. Die **Beschreibung** ist der Auslöser:
Sie ist der Text, den der Agent ständig sieht, also muss sie sagen, was der Skill tut und wann man ihn
nutzt. Und die letzte Zeile nennt, was der Skill nicht tun darf. Ein Skill, der Release Notes
entwirft, sollte sie nicht auch veröffentlichen; dafür bräuchte er Tools und eine Freigabe, die er
nicht hat.

## Progressive Disclosure: drei Stufen

Anthropics Engineering-Team nennt das die zentrale Idee:

> Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

In der Praxis gibt es drei Stufen, wie im Diagramm oben gezeigt.

1. **Metadaten, immer im Kontext.** Name und Beschreibung jedes installierten Skills, je einige
   Dutzend Token. Bei vielen installierten Skills ist das der einzige Teil, der dauerhaft Kontext
   kostet.
2. **Der Rumpf der SKILL.md, geladen, wenn der Skill passt.** Passt die Aufgabe zu einer Beschreibung,
   liest der Agent die Anweisungen. Erst jetzt kosten sie Kontext.
3. **Verlinkte Dateien, bei Bedarf geladen.** Längere Referenzen, Vorlagen und Skripte liegen neben der
   `SKILL.md`, und die Anweisungen verweisen darauf: „Das Schema steht in `reference/schema.md`.“ Der
   Agent liest sie nur, wenn ein Schritt sie braucht.

Warum ist das wichtig? Kontext ist eine begrenzte Ressource. Anthropics Artikel zu Context Engineering
sagt es so:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

und beschreibt das Ziel:

> good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Progressive Disclosure ist dieses Ziel, auf Anleitungen angewandt: Der Agent hält ein
Inhaltsverzeichnis und schlägt das Kapitel auf, das er braucht. Es ist auch das Mittel gegen ein
Problem aus [Zu viele Prompts](/de/posts/prompt-sprawl-and-ai-slop/), bei dem jeder Vorfall einen Absatz
zu einem Dauer-Prompt hinzufügt. Verschiebt man den Absatz in einen Skill, kostet er nur dann Kontext,
wenn er relevant ist.

## Ein realistischer Ordner

Wächst ein Skill, teilt man nach Stufen auf, nicht zufällig:

```text
release-notes/
├── SKILL.md              # short procedure, links to the rest
├── reference/
│   └── style-guide.md    # tone and wording rules, read when writing entries
├── templates/
│   └── notes.md          # output template
└── scripts/
    └── list_prs.sh       # deterministic helper the procedure calls
```

Die `SKILL.md` bleibt kurz und sagt, wann welche Datei zu öffnen ist. Alles Deterministische (Auflisten,
Sortieren, Validieren) kommt in ein Skript, denn Code ist für mechanische Schritte zuverlässiger als
Prosa, und seine Ausgabe ist kleiner als der Text, der das Vorgehen beschreibt. Skripte machen den
Skill allerdings sicherheitstechnisch sensibler, dazu unten mehr.

## Regeln für den Umfang: ein Skill, eine Aufgabe

1. **Eine Aufgabe, eine Beschreibung.** Braucht die Beschreibung zweimal „und“, den Skill aufteilen.
2. **Die Beschreibung fürs Zuordnen schreiben.** Aufgabe, Eingabe und die Stichwörter nennen, die
   Nutzende verwenden würden. Eine vage Beschreibung lädt zur falschen Zeit oder nie.
3. **Sagen, wann man ihn nicht nutzt.** Ein Satz zu Nachbaraufgaben verhindert falsche Treffer.
4. **Den Rumpf kurz halten.** Ein Ablauf, der auf eine Bildschirmseite passt; für Details verlinken.
5. **Varianten in Dateien, nicht in Verzweigungen.** Statt eines Rumpfes für fünf Formate je Format
   eine Referenzdatei führen und im Rumpf sagen, welche zu lesen ist.
6. **Ergebnisse festlegen.** Format, Ablageort und was der Skill nicht tun darf.
7. **Keine versteckten Berechtigungen.** Braucht ein Schritt ein Tool, Netzzugriff oder Schreibzugriff,
   steht das im Skill, und die Plattform muss es ausdrücklich vergeben. Ein Satz in einer README ist
   keine Vergabe.
8. **Verantwortliche und Version benennen.** Skills werden wie Code gepflegt.

## Skills sind Lieferkette

Ein Skill ist Text, der das Modell lenkt, und kann Skripte enthalten, die laufen. Ihn zu installieren
gehört in dieselbe Kategorie wie eine neue Abhängigkeit. Anthropics Hinweis ist direkt:

> When installing a skill from a less-trusted source, thoroughly audit it before use.
>
> — Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

Eine kurze Prüfroutine:

- Woher stammt er, und wer pflegt ihn?
- Version oder Commit festlegen und eine geprüfte Kopie im eigenen Repository halten.
- `SKILL.md` und jede verlinkte Datei auf Anweisungen lesen, die über die genannte Aufgabe hinausgehen.
- Jedes Skript lesen. Auf Netzaufrufe, Schreibzugriffe außerhalb des Arbeitsverzeichnisses und
  Downloads achten.
- Prüfen, ob die Beschreibung zu dem passt, was der Rumpf tut.
- Bei Änderungen erneut prüfen.

Weil ein Skill sich keine Berechtigungen geben kann, ist der Schaden eines schlechten Skills durch das
begrenzt, was die Tools des Agenten erlauben. Das ist ein Grund, Tools eng zu vergeben, wie in
[Was ist ein Agent-Harness](/de/posts/what-is-an-agent-harness/) beschrieben, und kein Grund, die
Prüfung zu überspringen.

## Einen Skill testen

Schreiben Sie drei oder vier realistische Anfragen, darunter eine, die den Skill nicht auslösen soll.
Prüfen Sie, dass der Skill lädt, wenn er soll, sonst nicht lädt und dass das Befolgen die erwartete
Ausgabe liefert. Lädt er nicht, zuerst die Beschreibung korrigieren. Ist die Ausgabe falsch, den
Rumpf oder die verlinkte Datei korrigieren, die der fehlerhafte Schritt liest.

## Das Wichtigste in Kürze

- Ein Skill ist ein Ordner mit einer `SKILL.md`; nur Name und Beschreibung sind immer im Kontext.
- Progressive Disclosure hat drei Stufen: Metadaten, Rumpf bei Treffer, verlinkte Dateien bei Bedarf.
- Die Beschreibung ist der Auslöser. Für das Zuordnen schreiben und sagen, wann man ihn nicht nutzt.
- Einen Skill bei einer Aufgabe halten, den Rumpf kurz halten, Deterministisches in Skripte auslagern.
- Skills als Lieferkette behandeln: festlegen, lesen, prüfen. Sie können keine Berechtigungen vergeben,
  aber einen Agenten dazu lenken, vorhandene falsch zu nutzen.

## Quellen

- Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (2025-10-16)
- Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills) (2025-10-16)
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29)
