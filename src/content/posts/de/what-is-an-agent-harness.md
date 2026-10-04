---
ref: what-is-an-agent-harness
lang: de
title: "Was ist ein Agent-Harness, und warum werden Harnesses immer schlanker?"
description: Ein Agent-Harness ist die Schleife um ein Modell. Je besser Modelle werden, desto mehr wandert in die API. Governance bleibt, daher ist der Harness austauschbar.
date: 2026-10-04T14:00:00Z
tags: [architecture, harness, governance]
---

Wer mit Sprachmodellen baut, stößt bald auf das Wort „Harness“. Es wird locker verwendet. Hier
deshalb eine einfache Definition, ein ehrlicher Blick darauf, warum Harnesses tendenziell
schlanker werden, und eine Einschätzung dazu, was nicht schlanker wird. Wo etwas Meinung statt
Tatsache ist, steht es im Text.

## Was ein Harness ist

Ein Modell allein nimmt Text (und vielleicht Bilder) entgegen und liefert Text. Ein
**Agent-Harness** ist das Programm drumherum, das daraus etwas macht, das handeln kann. Es läuft in
einer Schleife: Eingabe aufbauen, Modell aufrufen, lesen, was es tun möchte, das ausführen, das
Ergebnis zurückgeben und wiederholen, bis die Aufgabe erledigt oder ein Limit erreicht ist.
Typische Bestandteile:

- **Prompt- und Kontextaufbau:** Systemprompt, Anweisungen, Dateien, frühere Ergebnisse.
- **Werkzeugdefinitionen und deren Ausführung:** welche Werkzeuge das Modell kennt und der Code,
  der sie ausführt, wenn es danach fragt.
- **Berechtigungen und Sandbox:** was ein Werkzeug anfassen darf und wann ein Mensch bestätigen muss.
- **Gedächtnis und Kontextverdichtung:** was behalten, zusammengefasst oder verworfen wird, wenn das
  Kontextfenster voll läuft.
- **Planung und Sub-Agenten:** Arbeit aufteilen und Teile delegieren.
- **Wiederholungen und Fehlerbehandlung:** was passiert, wenn ein Aufruf scheitert oder ein
  Ergebnis unbrauchbar ist.
- **Ausgabe-Parsing:** die Antwort des Modells in etwas verwandeln, das der nächste Schritt nutzen kann.

Coding-Agenten wie Claude Code und OpenCode sind Harnesses für Softwarearbeit. Hermes und OpenClaw
sind Beispiele für allgemeinere. Ihre Interna beschreiben wir hier nicht: Sie unterscheiden sich,
sie ändern sich, und die Aussage hängt nicht an den Details.

## Warum Harnesses schrumpfen

Tatsache: Viel Gerüst, das früher nötig war, wurde geschrieben, um auszugleichen, was Modelle nicht
zuverlässig konnten. Starre Prompt-Ketten, handgebaute Router, die entschieden, welcher Schritt als
Nächstes kommt, lange Prompt-Vorlagen, die jeden Handgriff vorschrieben, und eigene
Wiederholungslogik für fehlerhafte Ausgaben gibt es, weil man dem Modell nicht zutraute, zu planen,
Werkzeuge zu wählen oder eigene Fehler zu bemerken.

Genau darin sind Modelle besser geworden: Planung über viele Schritte, Auswahl und Aufruf von
Werkzeugen, Arbeit mit langem Kontext und Selbstkorrektur nach einem Fehler. Außerdem haben Anbieter
Teile in die API oder ein SDK verlagert: natives Tool-Calling, strukturierte Ausgabe, Computer Use
sowie Agenten-SDKs und verwaltete Agentenangebote, die die Schleife gleich mitbringen. Code, der
Freitext in einen Werkzeugaufruf zerlegte oder eine feste Reihenfolge erzwang, lässt sich oft
löschen.

Meinung: Das wird so weitergehen. Als Faustregel finden wir nützlich: Jedes Stück Gerüst ist eine
Wette gegen die aktuelle Schwäche des Modells, und solche Wetten laufen ab. Wer das Modell
wechselt, sollte prüfen, ob jede Schicht ihren Platz noch verdient. Viele Teams berichten, dass
eine einfachere Schleife mit einem besseren Modell eine aufwendige mit einem älteren schlägt. Das
ist ein Muster, das wir so gelesen haben, und eine erwartete Richtung, kein Gesetz.

Ein dünner Harness bleibt wichtig. Werkzeugdesign, was in den Kontext gehört, wann verdichtet wird
und wie Ergebnisse bewertet werden, bleibt echte Ingenieursarbeit. „Dünn“ heißt: weniger
Ausgleich für das Modell, nicht: keine Technik.

## Was nicht schrumpft

Manche Teile eines Harness sind gar keine Modellfähigkeiten, ein klügeres Modell macht sie also
nicht überflüssig:

- **Berechtigungen und minimale Rechte.** Was ein Agent darf, ist eine Entscheidung der
  Organisation, keine Frage der Modellqualität. Ein leistungsfähigeres Modell mit weitreichenden
  Rechten ist ein größeres Risiko, kein kleineres.
- **Policy-Entscheidungen.** Ob ein Aufruf erlaubt ist, muss deterministischer Code beantworten,
  den man lesen und testen kann.
- **Audit-Trail.** Später muss jemand belegen können, was geschah und wer es erlaubt hat.
- **Kostenlimits und Budgets.** Ein fähiges Modell kann sehr effizient viel Geld ausgeben.
- **Identität und Geheimnisse.** Wer handelt, und welche Zugangsdaten er nutzen darf.
- **Menschliche Freigabe** dort, wo sie nötig ist.
- **Isolation und Sandbox** für ausgeführten Code.
- **Observability und Mandantentrennung.** Sehen, was läuft, und Teams voneinander trennen.

Unser Grundsatz: *Ein Modell darf fragen, die Policy entscheidet.* Ein besseres Modell stellt
bessere Fragen. Die Antwort gibt es sich trotzdem nicht selbst. Je fähiger die Modelle werden,
desto mehr schrumpft das Gerüst, während die Kontrollschicht bleibt: Man kann mehr übergeben,
solange die Grenzen an einer Stelle durchgesetzt werden, die das Modell nicht erreicht.

## Wo open-agentix hineinpasst

open-agentix ist eine Kontrollschicht und kein weiterer Harness, und es soll laufzeitneutral sein.
Die eigenen Runner führen Agenten schon mit Policy-Gate, Budgets und dem hash-verketteten
Audit-Trail aus, den ein [früherer Beitrag](/de/posts/policy-decides-audit-proves/) beschreibt.

Für externe Harnesses ist der Stand mit Release 0.1.0 so:

- **Umgesetzt:** ein Invocation-Builder für Claude Code, und das Policy-Gate als MCP-Proxy, über den
  ein externer Harness seine Werkzeugaufrufe schicken kann. Das ist früh und noch in Verifikation.
- **Nur Stubs:** Adapter für OpenCode, Hermes und OpenClaw existieren als typisierte Stubs.
- **Geplant:** einen bestehenden Harness vollständig unter openagentix laufen zu lassen, sodass
  seine Werkzeugaufrufe wie native Läufe geprüft, protokolliert und mit Kosten erfasst werden. Das
  steht für v0.3 in der [Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md),
  ist also nicht ausgeliefert.

Die Idee dahinter, eine Designwette und damit teilweise Meinung: Der Harness wird eine austauschbare
Komponente. Man bringt den mit, den man bevorzugt, heute oder nächstes Jahr, und die Governance
drumherum bleibt gleich.

```text
        +-----------------------------------------------+
        |  Kontrollschicht: Identität, Policy, Budgets, |
        |  Freigaben, Geheimnisse, Audit, Observability |
        +-----------------------+-----------------------+
                                |  Werkzeugaufrufe passieren das Gate
        +-----------------------+-----------------------+
        |  Harness (austauschbar): Schleife, Kontext,   |
        |  Werkzeuge                                    |
        +-----------------------+-----------------------+
                                |
        +-----------------------+-----------------------+
        |  Modell-API (beliebiger Anbieter)             |
        +-----------------------------------------------+
```

## Checkliste: Was bleiben muss, wenn der Harness dünner wird

1. Ein deterministisches Gate vor jedem Werkzeugaufruf, außerhalb von Modell und Prompt.
2. Minimale Rechte pro Agent; nicht erweitern, nur weil das Modell „sorgfältig wirkt“.
3. Budgets und Aufruflimits per Code durchgesetzt, mit hartem Stopp.
4. Geheimnisse nicht im Modellkontext, sondern erst im Werkzeug auflösen, nicht im Prompt.
5. Menschliche Freigabe bei zerstörerischen oder unumkehrbaren Aktionen.
6. Ein Audit-Trail, der Entscheidungen festhält, nicht nur Ausgaben.
7. Tests, die ohne Modell laufen, damit sich ein Harness-Wechsel prüfen lässt.
8. Das Gerüst bei jedem Modellwechsel neu testen und löschen, was nicht mehr hilft.

## Wie man einen Harness auswählt

Meinung, nach Gewicht geordnet: Erstens, lassen sich seine Werkzeugaufrufe abfangen, sodass Policy
und Audit außerhalb sitzen können? Zweitens, kann man Modell und Anbieter wählen? Drittens, ist er
offen genug, um zu prüfen, was er sendet? Viertens, passt er zur Arbeit: ein Coding-Harness für
Code, etwas Allgemeineres für anderes. Nicht danach auswählen, wie viel Gerüst er mitbringt. Nach
dem Trend oben ist weniger oft ein Vorteil.

Wenn Sie widersprechen oder eine falsche Aussage finden, eröffnen Sie bitte ein Issue. Wir
korrigieren den Beitrag lieber, als ihn zu verteidigen.
