---
ref: cost-is-a-platform-concern
lang: de
title: "Kosten sind Aufgabe der Plattform: Budgets, Zuordnung je Agent und Mandant, Export"
description: Agentensysteme können finanziell scheitern, obwohl sie technisch laufen. open-agentix bepreist jeden Schritt, ordnet ihn Mandant, Agent und Anwendungsfall zu, stoppt Läufe am Budget und exportiert die Zeilen.
date: 2026-02-12T09:00:00Z
tags: [costs, governance, architecture]
---

Ein Agent in einer Schleife kann an einem Nachmittag ein Monatsbudget verbrennen, ohne dass ein
einziger Fehler im Log steht. Kosten sind deshalb eine eigene Art des Versagens, und in
open-agentix gehören sie zur Ausführungskontrolle statt zu einem Bericht, der später ankommt.

## Was erfasst wird

Für jeden Modell- und Werkzeugaufruf erfasst die Plattform Tokens ein und aus, Provider und Modell,
die Zahl der Werkzeugaufrufe und einen Preis. Preise werden in Mikro-USD aus einer konfigurierbaren
Preistabelle geführt; die Tabelle kann mit einem festgeschriebenen Schnappschuss des öffentlichen
models.dev-Katalogs starten. Der Schnappschuss liegt im Repository und wird durch eine geprüfte
Änderung aktualisiert, nie zur Laufzeit abgerufen. Lokale Überschreibungen decken private und
Ollama-Modelle ab.

Jede Kostenzeile trägt, wem und wofür sie gehört:

```text
Mandant, Team, Agent, Anwendungsfall, Lauf, Schritt, Provider, Modell, Monat,
Tokens ein, Tokens aus, Kosten (Mikro-USD)
```

Das ermöglicht die Zuordnung im Nachhinein. Die Fragen, die man stellen will, müssen nicht vorab
festgelegt werden.

## Zuordnung

Der Endpunkt für die Kostenübersicht gruppiert nach Lauf, Agent, Team, Mandant, Anwendungsfall,
Monat, Provider oder Modell, optional mit Monatsbereich. Eine Frage der Finanzabteilung wie „Was hat
der Anwendungsfall Schwachstellenmanagement letzten Monat gekostet, und auf welchen Modellen?“ ist
eine Abfrage und keine Tabellenkalkulation. Nutzer sehen nur die Zeilen ihres eigenen Mandanten,
Plattformbetreiber können Mandanten ausdrücklich übergreifend auswerten.

## Budgets, die Läufe stoppen

Budgets werden während der Ausführung durchgesetzt, nicht nachträglich addiert:

- **Je Lauf**, in der Agentendatei: maximale Tokens, Kosten, Schritte, Werkzeugaufrufe und ein
  Zeitlimit. Der Control Agent prüft sie vor jedem Modellaufruf und nach jedem Werkzeugaufruf und
  stoppt den Lauf mit einem Audit-Eintrag, sobald eines überschritten ist.
- **Je Agent sowie je Team und Monat.** Ein Team über seinem Monatsbudget bekommt Läufe, die sofort
  per Policy blockiert werden.

```yaml
budget:
  maxTokens: 50000
  maxCostUsd: 0.5
  maxSteps: 12
  maxToolCalls: 6
  timeoutSeconds: 300
```

Der Stopp ist ein harter Stopp. Er ist eine Entscheidung der Plattform, ein Modell, das weitermachen
will, kann ihn also nicht wegdiskutieren.

## Die Zahlen herausholen

Kostenzeilen lassen sich als CSV oder JSON exportieren, nach Monat gefiltert, mit allen
Zuordnungsspalten. Sie können damit in eine Weiterverrechnung oder eigene Auswertungen einfließen.
Für das Monitoring gibt es einen Prometheus-Zähler, `oax_cost_micro_usd_total`, der nur nach Provider
beschriftet ist. Die Labels sind bewusst begrenzt: Labels je Lauf oder je Agent würden den
Metrikspeicher unbegrenzt wachsen lassen, daher liegt das Detail im Ledger und im Export, nicht in
den Metriken.

## Grenzen, die Sie kennen sollten

- **Kosten sind Schätzungen.** Sie stammen aus Ihrer Preistabelle und den Tokenzahlen, die der
  Provider meldet. Sie sind nicht Ihre Rechnung, und Rabatte, gestaffelte Preise oder verhandelte
  Konditionen sind darin nicht abgebildet.
- **Budgets je Anwendungsfall und je Mandant** sind für das nächste Release geplant, zusammen mit
  Warnschwellen bei 50, 80 und 100 Prozent eines Monatsbudgets. Heute gelten die harten Stopps je
  Lauf, Agent und Team. Berichte zur Kostenweiterverrechnung je Kostenstelle stehen für 1.0 auf der
  Roadmap.
- **Ein harter Stopp ist ein grobes Werkzeug.** Er schützt das Budget, aber ein auf halber Strecke
  gestoppter Lauf kann Arbeit unfertig hinterlassen. Entwerfen Sie Agenten so, dass ein Stopp an
  jedem Schritt unkritisch ist, und sichern Sie alles, was nicht halb fertig bleiben darf, mit
  Freigaberegeln ab.
- **Werkzeugkosten** sind nur so gut wie die Preise, die Sie dafür hinterlegen.

Das Prinzip ist einfach: Kann ein Agent Geld ausgeben, sollte die Plattform wissen, wie viel, für wen
und wofür, und Nein sagen können.
