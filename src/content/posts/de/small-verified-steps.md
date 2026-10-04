---
ref: small-verified-steps
lang: de
title: "Kleine geprüfte Schritte schlagen einen großen Prompt"
description: Inkrementelle Agent-Workflows zerlegen Arbeit in kleine Schritte mit Abnahmeprüfung, Fortschrittsnotiz und sauberem Zustand. Das Muster im Überblick.
date: 2026-04-14T09:00:00Z
tags: [quality, harness, how-to]
---

**Inkrementelle Agent-Workflows** ersetzen den einen großen „Bau das ganze Ding“-Prompt durch eine Schleife aus
kleinen Schritten. Jeder Schritt macht eine Änderung, führt eine ausdrückliche Abnahmeprüfung aus, hält eine Notiz
fest und hinterlässt die Arbeit in sauberem Zustand, bevor der nächste beginnt. Der Grund ist praktisch: Agenten,
die alles auf einmal versuchen, erklären den Erfolg gern zu früh und lassen Halbfertiges zurück, und ein Fehler
tief in einem langen Lauf ist schwer zu finden.

## Das Fehlerbild: zu viel auf einmal

Anthropics Beitrag zu langlaufenden Agenten räumt offen ein, dass das im Allgemeinen ungelöst ist (Zitate im
englischen Original):

> However, getting agents to make consistent progress across multiple context windows remains an open problem.
>
> [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Anthropic, 2025)

Sinngemäß: Gleichmäßigen Fortschritt über mehrere Kontextfenster hinweg zu erreichen, bleibt ein offenes Problem.
Derselbe Artikel berichtet, was in ihrem Aufbau half:

> This incremental approach turned out to be critical to addressing the agent’s tendency to do too much at once.
>
> [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Anthropic, 2025)

Sinngemäß: Der inkrementelle Ansatz war entscheidend gegen die Neigung des Agenten, zu viel auf einmal zu tun.
Typische Symptome: ein Feature, das „fertig“ ist, aber nie ausgeführt wurde; ein Refactoring über vierzig Dateien
ohne Tests dazwischen; eine Zusammenfassung, die Absichten statt Ergebnisse beschreibt; und ein Arbeitsverzeichnis
voller halb angewandter Änderungen, die die nächste Sitzung entwirren muss.

## Das Schrittmuster

Das Muster hat fünf Teile und ist absichtlich langweilig.

1. **Nur den nächsten Schritt planen.** Wählen Sie die kleinste prüfbare Einheit: ein Endpunkt, eine Migration,
   eine Funktion mit ihrem Test.
2. **Eine Änderung machen.** Widerstehen Sie „wenn ich schon dabei bin“-Änderungen.
3. **Die Abnahmeprüfung ausführen.** Ein Befehl, der besteht oder scheitert, keine Meinung.
4. **Eine Fortschrittsnotiz schreiben.** Was sich geändert hat, was geprüft wurde, was als Nächstes kommt.
5. **Sauberen Zustand hinterlassen.** Committet oder zurückgesetzt, nie halb angewandt, damit der nächste Schritt
   von einem bekannten Punkt startet.

![Schleife aus kleinen Schritten, auf die jeweils eine Prüfung folgt](/images/blog/small-verified-steps-1.svg)

Anthropics Artikel zum Claude Agent SDK beschreibt dieselbe Form als Feedback-Schleife:

> Agents often operate in a specific feedback loop: gather context -> take action -> verify work -> repeat.
>
> [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) (Anthropic, 2025)

Sinngemäß: Agenten arbeiten oft in einer Schleife aus Kontext sammeln, handeln, Arbeit prüfen und wiederholen.
Das Schlüsselwort ist *prüfen*. Ein Schritt ohne Prüfung ist eine Vermutung mit zusätzlichen Schritten.

## Abnahmeprüfungen vor dem Schritt schreiben

Eine Abnahmeprüfung ist eine ausführbare Aussage darüber, was „fertig“ heißt. Schreiben Sie sie zuerst, am besten
als Teil der Aufgabendefinition, damit der Agent den Erfolg nicht nachträglich umdefinieren kann. Gute Prüfungen
sind:

- **Deterministisch**: Gleicher Zustand, gleiches Ergebnis.
- **Schnell**: Sekunden, damit die Schleife eng bleibt.
- **Spezifisch**: Sie scheitern aus dem richtigen Grund.
- **Unabhängig von den Aussagen des Agenten**: Sie lesen Repository, Datenbank oder Testausgabe.

```yaml
steps:
  - id: add-health-endpoint
    change: "Add GET /health returning 200 and {status: ok}"
    check: "pytest tests/test_health.py -q"
    on_fail: revert
  - id: wire-health-into-compose
    change: "Add healthcheck to docker-compose.yml"
    check: "docker compose config -q && grep -q healthcheck docker-compose.yml"
    on_fail: revert
```

Prüfungen können Tests, Linter, Typprüfungen, Schema-Validierung oder eine Abfrage gegen die Umgebung sein. Bei
Arbeit ohne Code, etwa einem Dokumententwurf, kann eine Prüfung eine Strukturvalidierung sein (Pflichtabschnitte
vorhanden, Links lösen auf) plus eine menschliche Durchsicht an festgelegten Punkten. Zur systematischeren
Bewertung von Ergebnissen siehe [Agent-Evals 101](/de/posts/agent-evals-101/).

## Fortschrittsnotizen und sauberer Zustand

Lange Läufe erstrecken sich über mehrere Kontextfenster. Die Notizen tragen die Arbeit über sie hinweg. Führen
Sie im Repository eine kurze Datei, zum Beispiel `PROGRESS.md`:

```text
## Erledigt
- Health-Endpunkt ergänzt, Tests bestehen (Commit a1b2c3d)
## Als Nächstes
- Healthcheck in Compose
## Entscheidungen
- keine Authentifizierung auf /health, nur internes Netz
```

Eine frische Sitzung liest die Notizen, führt die Prüfungen aus und macht weiter. Weil jeder Schritt mit einem
Commit oder einem Revert endet, hat „Wo waren wir?“ immer eine präzise Antwort. Das gibt Menschen außerdem nach
jedem Schritt einen Prüfpunkt, nicht erst am Ende.

## Was bei einer fehlgeschlagenen Prüfung passiert

Die Schleife braucht einen Ausgang, der nicht „ewig weiterprobieren“ heißt. Eine tragfähige Regel:

- Bei einem Fehlschlag darf der Agent innerhalb desselben Schritts eine begrenzte Zahl von Korrekturen
  versuchen, zum Beispiel zwei.
- Scheitert die Prüfung weiter, setzt er auf den letzten sauberen Zustand zurück, hält den Fehler in den Notizen
  fest und stoppt oder eskaliert.
- Die Prüfung wird nie geändert, damit sie besteht, außer ein Mensch hat die geänderte Definition von „fertig“
  freigegeben.

Die letzte Regel ist die wichtigste. Ein Agent, der seine eigenen Tests stillschweigend abschwächt, meldet Grün und
meint nichts.

## Machen kleine Schritte schneller?

Nicht automatisch. Prüfen kostet Zeit, und gemessene Produktivitätseffekte von KI-Werkzeugen sind gemischt und
kontextabhängig. Eine viel diskutierte Studie mit erfahrenen Open-Source-Entwicklern berichtete:

> Surprisingly, we find that when developers use AI tools, they take 19% longer than without—AI makes them slower.
>
> [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) (METR, 2025)

Sinngemäß: Mit KI-Werkzeugen brauchten die Entwickler 19 % länger als ohne. Gehen Sie vorsichtig damit um. Die
METR-Seite trägt inzwischen einen Hinweis, dass die Ergebnisse veraltet sind und eine Fortsetzung der Arbeit aus
2026 existiert; lesen Sie die aktuelle Seite, bevor Sie Schlüsse ziehen. Für diesen Beitrag ist die engere
Aussage relevant: Zeit für Durchsicht, Nacharbeit und ungeprüfte Ausgaben ist real, deshalb gehören die
Prüfungen in die Schleife statt hinter eine große Lieferung. Eine enge Schleife mit billigen Prüfungen findet
Probleme, solange sie klein sind. Der umgekehrte Weg, ein riesiger Prompt und eine lange Durchsicht am Ende,
bündelt diese Kosten an der schlechtesten Stelle. Wie weit man vollautonomen Pipelines heute vertrauen kann,
diskutiert [Dark Factory: nur MVP](/de/posts/dark-factory-mvp-only/), und [Prompt-Wildwuchs und
KI-Schlamperei](/de/posts/prompt-sprawl-and-ai-slop/) beschreibt, was passiert, wenn nichts die Ausgabe prüft.

## Eine Start-Checkliste

```text
[ ] Jede Aufgabe ist in Schritte von Minuten statt Stunden zerlegt
[ ] Jeder Schritt hat eine vorher geschriebene, ausführbare Abnahmeprüfung
[ ] Der Agent darf Prüfungen nicht ohne Freigabe ändern
[ ] Jeder Schritt endet mit Commit oder Revert
[ ] Eine Fortschrittsdatei hält Erledigtes, Nächstes und Entscheidungen fest
[ ] Ein fehlgeschlagener Schritt wird begrenzt wiederholt, dann eskaliert
```

## Das Wichtigste in Kürze

- Ein großer Prompt lädt zu frühen „Fertig“-Meldungen und schwer auffindbaren Fehlern ein.
- Nutzen Sie eine Schleife: einen Schritt planen, eine Sache ändern, prüfen, notieren, sauberen Zustand hinterlassen.
- Schreiben Sie ausführbare Abnahmeprüfungen vor dem Schritt und verbieten Sie dem Agenten, sie zu ändern.
- Fortschrittsnotizen tragen lange Läufe über Kontextfenster hinweg; Commits und Reverts halten den Zustand sauber.
- Prüfen kostet Zeit: Halten Sie die Prüfungen schnell und setzen Sie sie in die Schleife.

## Quellen

- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), Anthropic, 26.11.2025.
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk), Anthropic, 29.09.2025.
- [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), METR, 10.07.2025 (von METR als veraltet markiert).
