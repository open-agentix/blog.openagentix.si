---
ref: policy-decides-audit-proves
lang: de
title: "Ein Modell darf fragen, die Policy entscheidet: deterministische Gates und manipulationssichtbares Audit"
description: In open-agentix kann ein Modell einen Werkzeugaufruf anfordern, aber nie erlauben. Ein deterministisches Policy-Gate entscheidet vor jedem Aufruf, ein hash-verketteter Audit-Trail hält fest, was es entschieden hat.
date: 2026-02-10T09:00:00Z
tags: [security, policy, audit, governance]
---

Leitplanken, die im Prompt stehen, sind Bitten. Ein Modell kann sie ignorieren, falsch verstehen
oder sich durch den Text, den es liest, davon abbringen lassen. open-agentix folgt deshalb einer
Regel:

> Ein Modell darf eine Aktion anfordern. Ein Modell entscheidet nicht, ob die Aktion erlaubt ist.

## Das Policy-Gate

Jeder Werkzeugaufruf läuft vor der Ausführung durch ein Gate. Das Gate ist gewöhnlicher Code, eine
reine Funktion ohne I/O und ohne Modellaufrufe, und antwortet mit einer von drei Entscheidungen:

```text
Agent --tool.call--> Policy-Gate --allow-----> Werkzeug
                          |
                          +--deny------> blockiert und im Audit
                          |
                          +--approval--> eine Person entscheidet
```

Die Prüfungen laufen in fester Reihenfolge, und das Ergebnis nennt alle Gründe, die zutrafen:

1. global verbotene Werkzeuge,
2. die Allowlist des Agenten (exakte Namen oder Präfixmuster),
3. Argumentbeschränkungen: Typ, Pflichtfeld, Muster, Aufzählung, Konstante, Länge und Bereich sowie
   ausdrückliche Deny-Muster; nicht deklarierte Argumente werden standardmäßig abgelehnt,
4. global verbotene Argumentmuster,
5. Aufruflimits je Lauf,
6. Datenklassifizierung von Werkzeug und Policy-Bundle,
7. Freigaberegeln aus der Agentendatei oder dem Bundle.

Werkzeuge, die einem Agenten nicht erteilt wurden, bekommt das Modell gar nicht erst zu sehen. Das
Gate ist die zweite Verteidigungslinie für den Fall, dass ein Modell trotzdem fragt.

Weil das Gate deterministisch ist, lässt sich jede Entscheidung aus dem Audit-Trail nachvollziehen
und ohne Modell testen. Ein Modell darf mitwirken, aber nur, um strenger zu machen: Ein optionaler
Zweitgutachter kann aus einem Allow ein Stopp machen, nie umgekehrt.

## Der Control Agent

Eine zweite Komponente, der Control Agent, beobachtet den Lauf selbst. Vor jedem Modellaufruf und
nach jedem Werkzeugaufruf prüft er Budgets für Tokens, Kosten, Schritte und Werkzeugaufrufe, das
Zeitlimit, die Aufrufrate, identische wiederholte Aufrufe (Schleifen), aufeinanderfolgende Fehler,
wiederholte Policy-Ablehnungen und Versuche verbotener Aktionen. Je nach Befund pausiert oder
stoppt er den Lauf. Auch er ist deterministisch.

## Der Audit-Trail

Gates und Limits überzeugen nur so weit wie der Nachweis dessen, was sie getan haben. Jede wichtige
Aktion landet in einem Append-only-Audit-Trail: Ereignisse, Lauferzeugung, Agentenversionen,
Policy-Entscheidungen, Werkzeugaufrufe und -ergebnisse, Freigaben, Ablehnungen, Fehler und Kosten.

Jeder Eintrag speichert eine Sequenznummer, Zeitstempel, Akteur, Aktion, Ziel, Lauf-ID, einen
Digest seiner Nutzdaten und den Hash des vorherigen Eintrags. Der Hash deckt all diese Felder ab;
wer einen früheren Eintrag ändert, bricht die Verifikation ab dieser Stelle. Die gehashte
JSON-Form ist kanonisch (sortierte Schlüssel, keine Leerzeichen) und für immer festgelegt, damit
alte Einträge prüfbar bleiben.

Auf der Kette setzt eine Signatur auf: In Abständen wird der Kopf des Logs mit einem
Ed25519-Schlüssel signiert. Öffentliche Schlüssel lassen sich unabhängig von der Plattform an
Prüfer verteilen. Ein Verify-Endpunkt und eine Bibliothek prüfen die Kette und erkennen geänderte
Einträge, geänderte Nutzdaten, gelöschte oder eingefügte Einträge und eine Kette, die nach einem
signierten Checkpoint neu geschrieben wurde. Exporte sind NDJSON und lassen sich offline mit
derselben Bibliothek prüfen. Geheimnisse werden vor dem Hashen geschwärzt, ein Export enthält sie
also nie.

Auf Datenbankebene akzeptieren die Audit-Tabellen weder UPDATE noch DELETE noch TRUNCATE, erzwungen
durch einen Trigger und im Produktivbetrieb durch eine Datenbankrolle ohne diese Rechte.

## Was „manipulationssichtbar“ hier heißt

Die Wortwahl zählt. Dieses Design macht Manipulation **erkennbar**. Es macht sie nicht unmöglich.

- Ein Datenbank-Superuser kann die ganze Tabelle neu schreiben. Erkennbar ist das nur, wenn
  mindestens ein Checkpoint existiert, der mit einem Schlüssel signiert wurde, den der Angreifer
  nicht besitzt. Der Signaturschlüssel gehört in ein KMS oder einen Secret Store, Schlüssel-IDs
  sollten rotiert werden.
- Anhänge werden serialisiert, damit die Kette sich nicht verzweigt. Das ist ein einzelner Schreiber;
  die gemessenen Kosten liegen bei wenigen Millisekunden pro Eintrag, und Ketten je Mandant sind
  für sehr hohe Volumen eine spätere Option.
- Policy-Muster sind von Admins geschriebene reguläre Ausdrücke. Eine ReDoS-sichere Engine (RE2)
  steht auf der Roadmap, ist aber nicht in 0.1.0.
- Der Audit-Trail belegt, was die Plattform erlaubt hat und was der Agent über die Plattform getan
  hat. Über Vorgänge außerhalb sagt er nichts.

## Ausprobieren

Die [Live-Demo](https://demo.openagentix.si/de/) enthält eine vorbefüllte Audit-Kette, die Sie
verifizieren können, und die [Dokumentation](https://openagentix.si/de/docs/) beschreibt das
Format der Policy-Bundles. Die Entwurfsentscheidungen stehen als ADRs im Plattform-Repository.
Wenn Sie eine Lücke im Gate finden, melden Sie sie bitte vertraulich über GitHub Security
Advisories.
