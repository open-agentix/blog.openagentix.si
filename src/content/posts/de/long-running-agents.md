---
ref: long-running-agents
lang: de
title: "Lang laufende KI-Agenten: Fortschrittsdateien, Zustände, Checkpoints"
description: "Lang laufende KI-Agenten verlieren zwischen Sitzungen den Kontext. Zustand in Featureliste, Fortschrittsnotizen und Git macht Läufe fortsetzbar und prüfbar."
date: 2026-08-20T09:00:00Z
tags: [harness, patterns, explainer]
---

Lang laufende KI-Agenten brauchen ein Gedächtnis außerhalb des Modells. Erstreckt sich Arbeit über viele Kontextfenster, beginnt jede neue Sitzung leer. Der Harness muss ihr deshalb eine Featureliste, eine Fortschrittsdatei und die Versionshistorie zum Lesen geben und verlangen, dass sie beim Beenden einen sauberen Zustand hinterlässt. Dieses Muster macht Arbeit nach einem Absturz fortsetzbar, für Menschen prüfbar und im Nachhinein nachvollziehbar. Der Beitrag erklärt das Muster und wie sich anpassen lässt.

## Das Problem: viele Sitzungen, kein Gedächtnis

Ein Kontextfenster ist endlich. Aufgaben wie "baue diese Anwendung" oder "migriere diese Codebasis" brauchen weit mehr Schritte, als in eines passen. Der Agent arbeitet, bis das Fenster voll ist, dann beginnt eine neue Sitzung ohne Erinnerung an das Geschehene. Das Engineering-Team von Anthropic benennt die Schwierigkeit offen:

> However, getting agents to make consistent progress across multiple context windows remains an open problem.

Quelle: [Effective harnesses for long-running agents, Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). Sinngemäß: Agenten dazu zu bringen, über mehrere Kontextfenster hinweg stetig voranzukommen, bleibt ein ungelöstes Problem. Daraus ergeben sich zwei Fehlerbilder. Der Agent versucht, alles auf einmal zu erledigen, und geht auf halber Strecke der Kontext aus, es bleibt halbfertige Arbeit zurück. Oder eine spätere Sitzung sieht das Teilergebnis, hält die Aufgabe für erledigt und hört zu früh auf. Beides folgt aus fehlendem Zustand, nicht aus einem schwachen Modell.

## Das Muster: Zustand in Dateien und Commits

![Kette von Agenten-Sitzungen, die Zustand über Dateien und Commits teilen](/images/blog/long-running-agents-1.svg)

Das Muster kennt zwei Arten von Sitzungen.

**Sitzung 1 (Einrichtung).** Eine Initialisierungssitzung legt das Gerüst an, auf das spätere Sitzungen bauen:

- Eine **Featureliste**: eine strukturierte Datei mit allen Anforderungen, jeweils als offen oder erledigt markiert.
- Eine **Fortschrittsdatei**: kurze Notizen dazu, was versucht wurde, was funktioniert und was als Nächstes ansteht.
- Ein **erster Commit** und ein Skript, das das Projekt startet und seine Tests ausführt.

**Sitzungen 2 bis n (Arbeit).** Jede spätere Sitzung folgt derselben Schleife:

1. Fortschrittsdatei und aktuelles Git-Log lesen.
2. Startskript und Tests ausführen, um den aktuellen Zustand zu prüfen.
3. **Einen** unerledigten Punkt der Featureliste auswählen.
4. Ihn umsetzen und verifizieren.
5. Committen, Fortschrittsdatei aktualisieren und den Punkt erst nach der Verifikation als erledigt markieren.

Derselbe Artikel erklärt, warum die Regel "ein Punkt pro Sitzung" wichtig ist:

> This incremental approach turned out to be critical to addressing the agent’s tendency to do too much at once.

Sinngemäß: Dieses schrittweise Vorgehen erwies sich als entscheidend gegen die Neigung des Agenten, zu viel auf einmal zu tun. Das passt zu [kleinen, verifizierten Schritten](/de/posts/small-verified-steps/): Je kleiner die Arbeitseinheit, desto günstiger lässt sie sich prüfen, zurücknehmen und fortsetzen.

## Was in die Dateien gehört

Halten Sie die Featureliste maschinenlesbar und schwer zu missbrauchen. Eine JSON- oder YAML-Datei mit festen Feldern funktioniert gut:

```json
{
  "features": [
    {
      "id": "F-012",
      "description": "User can reset their password by e-mail",
      "steps": ["open reset form", "submit address", "follow link", "set new password"],
      "passes": false
    }
  ]
}
```

Regeln für die Datei, die der Harness durchsetzen kann:

- Sitzungen dürfen `passes` erst auf `true` setzen, nachdem der Verifikationsschritt gelaufen ist.
- Sitzungen dürfen Punkte weder löschen noch umformulieren; neue hinzufügen dürfen sie.
- Der Harness, nicht das Modell, validiert das Schema der Datei, bevor ein Commit akzeptiert wird.

Die Fortschrittsdatei darf Freitext sein, sollte aber kurz und datiert bleiben. Die Einträge beantworten drei Fragen: Was hat sich geändert, was ist bekanntermaßen kaputt, was kommt als Nächstes. Behandeln Sie sie wie eine Übergabenotiz an einen Kollegen, der das Projekt nie gesehen hat.

## Die Regel vom sauberen Zustand

Eine Sitzung sollte enden, wenn das Repository in einem Zustand ist, von dem die nächste Sitzung ausgehen kann: Tests laufen durch oder bekannte Fehler sind vermerkt, nichts ist halb gemergt, die Notizen sind aktuell. Definieren Sie das als Abschlussprüfung im Harness:

```bash
#!/usr/bin/env bash
set -euo pipefail
git diff --quiet || { echo "uncommitted changes"; exit 1; }
./scripts/test.sh
test -s PROGRESS.md
```

Schlägt die Prüfung fehl, ist die Sitzung nicht beendet. Entweder arbeitet der Agent weiter an der Korrektur, oder der Harness setzt auf den letzten guten Commit zurück. Die Versionsverwaltung liefert günstige Checkpoints: Jeder Commit ist ein Punkt, zu dem Sie zurückkehren können.

## Bezug zur Agentenschleife

Anthropics Artikel zum Claude Agent SDK beschreibt den Grundzyklus:

> Agents often operate in a specific feedback loop: gather context -> take action -> verify work -> repeat.

Quelle: [Building agents with the Claude Agent SDK, Anthropic](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk). Sinngemäß: Agenten arbeiten oft in einer festen Rückkopplungsschleife aus Kontext sammeln, handeln, Arbeit prüfen und wiederholen. In einem lang laufenden Aufbau sind die Dateien und das Git-Log der Schritt "Kontext sammeln" am Anfang jeder Sitzung, und die Verifikation erlaubt der nächsten Sitzung, der vorherigen zu vertrauen. Wie Kontext innerhalb eines einzelnen Fensters verwaltet wird, steht in [Grundlagen des Context Engineering](/de/posts/context-engineering-basics/); den Harness um all das beschreibt [Was ist ein Agent-Harness](/de/posts/what-is-an-agent-harness/).

## Ein Beispiel für Autonomie über lange Zeiträume

Anthropics Experiment Project Vend ließ einen Agenten einen kleinen Laden betreiben. Der Bericht beschreibt den Aufgabenbereich des Agenten:

> Claudius decided what to stock, how to price its inventory, when to restock (or stop selling) items, and how to reply to customers

Quelle: [Project Vend: Can Claude run a small shop? (And why does that matter?), Anthropic](https://www.anthropic.com/research/project-vend-1). Sinngemäß: Claudius entschied, was er führt, wie er Waren bepreist, wann er nachbestellt oder den Verkauf einstellt und wie er Kunden antwortet. Solche Arbeit läuft über Tage und umfasst wiederkehrende Entscheidungen. Genau dort zählen Zustand außerhalb des Modells, klare Aufzeichnungen und menschliche Aufsicht. Lesen Sie für die Ergebnisse das Original; es beschreibt echte Fehler ebenso wie Erfolge, eine nützliche Erinnerung daran, dass lange Zeiträume Schwächen offenlegen, die kurze Tests nicht zeigen.

## Läufe fortsetzbar und prüfbar machen

Dieselben Dateien, die dem Agenten helfen, dienen auch dem Betrieb:

- **Fortsetzbar.** Nach einem Absturz oder Deployment startet der Harness eine neue Sitzung auf demselben Repository. Außer "Zustand lesen" ist kein besonderer Wiederherstellungscode nötig.
- **Nachvollziehbar.** Commits mit Nachrichten, die die Feature-ID nennen, bilden eine Zeitleiste dessen, was sich geändert hat und warum. Legen Sie Sitzungs-ID und Modellversion im Commit-Trailer oder im Laufprotokoll ab.
- **Prüfbar.** Ein Mensch kann einen Commit pro Feature prüfen statt eines riesigen Diffs.
- **Begrenzt.** Ergänzen Sie ein Schritt- oder Token-Limit pro Sitzung und ein Gesamtbudget. Eine Schleife, die nie endet, sollte anhalten und um Hilfe bitten.

## Grenzen

- Das Muster setzt voraus, dass sich Arbeit in prüfbare Punkte zerlegen lässt. Offene Recherche- oder Entwurfsaufgaben passen weniger gut; dort übernimmt eine Fortschrittsdatei mit Entscheidungen und offenen Fragen die Rolle der Featureliste.
- Die Qualität der Verifikation begrenzt die Gesamtqualität. Sind die Tests schwach, ist auch "passes: true" schwach.
- Notizen können verrotten. Lassen Sie Sitzungen die Fortschrittsdatei kürzen und neu schreiben, statt nur anzuhängen.
- Zustandsdateien sind in einer Hinsicht nicht vertrauenswürdige Eingabe: Können sie von anderen als Harness und Agent bearbeitet werden, behandeln Sie ihren Inhalt als Daten, nicht als Anweisungen.

## Das Wichtigste in Kürze

- Sitzungen starten leer; halten Sie Zustand in Featureliste, Fortschrittsdatei und Git-Historie.
- Ein Punkt pro Sitzung, verifiziert, bevor er als erledigt gilt.
- Jede Sitzung in einem sauberen Zustand beenden, durchgesetzt von einer Abschlussprüfung im Harness.
- Commits sind günstige Checkpoints, die Läufe fortsetzbar, prüfbar und nachvollziehbar machen.
- Das Ganze mit Schritt-, Token- und Budgetgrenzen einrahmen.

## Quellen

- [Effective harnesses for long-running agents (Anthropic, 2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Building agents with the Claude Agent SDK (Anthropic, 2025-09-29)](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Project Vend: Can Claude run a small shop? (Anthropic, 2025-06-27)](https://www.anthropic.com/research/project-vend-1)
