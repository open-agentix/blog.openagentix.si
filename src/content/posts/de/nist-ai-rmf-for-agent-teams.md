---
ref: nist-ai-rmf-for-agent-teams
lang: de
title: "NIST AI RMF für Agenten-Teams: Govern, Map, Measure, Manage in der Praxis"
description: "Das NIST AI RMF ist freiwillig und hat vier Funktionen. Wie Registry, Datenflusskarten, Evals, Traces und Richtlinien zu Govern, Map, Measure, Manage passen."
date: 2026-07-23T09:00:00Z
tags: [governance, risk, compliance]
---

Das NIST AI RMF ist ein freiwilliges Rahmenwerk, das Teams eine gemeinsame Sprache für KI-Risiken gibt, gegliedert in vier Funktionen: Govern, Map, Measure und Manage. Für ein Team, das Agenten betreibt, ist es vor allem eine Liste von Fragen, und die meisten Antworten erzeugt eine Plattform ohnehin: ein Verzeichnis der Agenten, eine Karte der Datenflüsse, Bewertungsergebnisse, Traces und durchgesetzte Richtlinien. Dieser Beitrag zeigt die Zuordnung und wie man klein anfängt.

## Was das Rahmenwerk ist und was nicht

NIST beschreibt das AI RMF als optionale Orientierung:

> The NIST AI Risk Management Framework (AI RMF) is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations

Quelle: [NIST, AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) (AI RMF 1.0, veröffentlicht 2023-01-26). Sinngemäß: Das AI RMF ist für die freiwillige Nutzung gedacht und soll helfen, Aspekte der Vertrauenswürdigkeit besser einzubeziehen.

Daraus folgen drei Dinge. Es ist kein Gesetz und keine Zertifizierung; niemand prüft Sie dagegen, solange Sie oder ein Kunde das nicht wollen. Es ist bewusst allgemein gehalten und gilt für einen Spamfilter ebenso wie für einen Agenten. Und genau diese Allgemeinheit verlangt die Übersetzung in Ihre Umgebung: Das Rahmenwerk sagt, *welche Art* von Arbeit nötig ist, Ihre Plattform entscheidet, *wie*.

NIST hat zudem ein Profil für generative KI veröffentlicht, [NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), das das Rahmenwerk auf generative Systeme anwendet (veröffentlicht 2024-07-26). Lesen Sie es zusammen mit dem Kernrahmenwerk, wenn Ihre Agenten auf generativen Modellen beruhen. Dieser Beitrag nutzt nur die Struktur der vier Funktionen und gibt den Inhalt des Profils nicht wieder.

## Die vier Funktionen in Agentensprache

![Funktionen des NIST AI RMF, zugeordnet zu Artefakten einer Agentenplattform](/images/blog/nist-ai-rmf-for-agent-teams-1.svg)

| Funktion | Kernfrage | Artefakt der Agentenplattform |
| --- | --- | --- |
| Govern | Wer entscheidet, nach welchen Regeln? | Richtlinien, Verantwortliche, Freigaberegeln, Rollen |
| Map | Was haben wir, wo läuft es, was kann es berühren? | Agenten-Registry, Datenflusskarte, Inventar von Tools und Kontext |
| Measure | Woran erkennen wir, dass es funktioniert und wie es scheitert? | Evals, Traces, Kosten- und Fehlermetriken |
| Manage | Was tun wir mit den gefundenen Risiken? | Gates, Rollbacks, Incident Response, Außerbetriebnahme |

Die vier sind keine Abfolge. Sie laufen fortlaufend und speisen sich gegenseitig: Die Messung findet ein Problem, das Management behebt es, die Steuerung passt die Regel an, die Kartierung hält den neuen Stand fest.

## Govern: Entscheidungen, Verantwortliche und Regeln

Steuerung (Governance) handelt von Verantwortlichkeit. Für eine Agentenplattform wird sie konkret als:

- **Verantwortliche für jeden Agenten.** Ein benanntes Team, das für Verhalten, Kosten und Änderungen einsteht.
- **Schriftliche Richtlinien** dazu, welche Datenklassen Agenten verarbeiten dürfen, welche Tools eine Freigabe brauchen und welche Aktionen nie automatisch laufen.
- **Rollen.** Wer einen Agenten ausrollen, wer eine riskante Aktion freigeben und wer eine Richtlinie ändern darf.
- **Durchsetzung statt nur Dokumente.** Eine Richtlinie, die ein Gate vor einem Tool-Aufruf prüft, ist stärker als eine im Wiki. Das Muster beschreibt [Die Richtlinie entscheidet, das Audit belegt](/de/posts/policy-decides-audit-proves/).

Ein Schnelltest: Wählen Sie einen beliebigen Agenten und fragen Sie, wer heute Nacht alarmiert würde, wenn er sich falsch verhält. Kann das niemand beantworten, hat Govern eine Lücke.

## Map: wissen, was man betreibt

Was nicht aufgelistet ist, lässt sich nicht steuern. Die Kartierungsarbeit für Agenten ist weitgehend eine Bestandsaufnahme:

- **Registry.** Jeder Agent mit Zweck, Verantwortlichen, Version, Modell, Tools, Zugangsdaten und Umgebung.
- **Datenfluss.** Welche Daten hineinkommen (Dokumente, Tickets, Nutzernachrichten), was an welchen Modellanbieter gesendet wird, was hinausgeht (Nachrichten, Schreibzugriffe auf Systeme).
- **Kontext.** Welche Anweisungen, Skills und abgerufenen Materialien das Verhalten prägen.
- **Auswirkung.** Was ein Versagen für Menschen und das Geschäft bedeuten würde, je Agent.

Ein Registry-Eintrag kann klein sein:

```yaml
agent: refund-triage
owner: payments-support
purpose: classify refund requests and draft a response for review
model: provider-a/model-small
tools: [tickets.read, crm.read, tickets.comment]
data: [customer-contact, order-history]
sends-data-to: provider-a (EU region)
human-approval: comment is posted only after review
last-reviewed: <date>
```

Die Kartierung hält auch fest, was Sie noch nicht wissen, etwa Abhängigkeiten von Skills Dritter oder von Modellen, deren Verhalten sich unangekündigt ändert.

## Measure: Belege statt Eindrücke

Messen macht aus „scheint in Ordnung“ Zahlen, die sich über die Zeit vergleichen lassen:

- **Evals** für repräsentative Aufgaben mit erwarteten Ergebnissen, bei jeder Änderung an Modell, Prompt, Skill oder Tool ausgeführt. [Agent-Evals 101](/de/posts/agent-evals-101/) erklärt, wie man mit einer kleinen Menge beginnt.
- **Traces** echter Läufe: welche Schritte stattfanden, welche Tools aufgerufen wurden, wie lange sie dauerten und was sie kosteten.
- **Betriebsmetriken:** Fehlerrate, Wiederholungen, Freigabe- und Ablehnungsquote, Budgetverbrauch.
- **Sicherheitstests**, auch mit Angriffsfällen für Prompt-Injection und Tool-Missbrauch. Als Katalog von Angriffsarten veröffentlicht NIST außerdem eine Taxonomie des adversarialen maschinellen Lernens, die NIST so beschreibt: „provides a taxonomy of concepts and defines terminology in the field of adversarial machine learning (AML).“ ([NIST AI 100-2 E2025](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), 2025-03-24). Sie bietet eine Taxonomie von Konzepten und definiert Begriffe des Feldes. Sie konzentriert sich auf Angriffe auf Systeme des maschinellen Lernens und ist ein nützliches Vokabular für den Testplan, aber keine Liste agentenspezifischer Kontrollen.

Seien Sie ehrlich, was Messung zeigen kann. Eine bestandene Eval-Suite sagt, dass der Agent die Fälle beherrscht, an die Sie gedacht haben. Sie beweist nicht, dass es keine anderen Fehler gibt.

## Manage: auf Befunde reagieren

Das Management schließt den Kreis. Für jedes erkannte Risiko sollte es eine Reaktion geben:

- **Verhindern** mit strukturellen Kontrollen: minimale Rechte, Sandboxing, Freigaben. Die [OWASP agentic top 10 als Plattformkontrollen](/de/posts/owasp-agentic-top-10/) liefert gute Kandidaten.
- **Erkennen** mit Alarmen bei Budgets, Fehlerspitzen, abgelehnten Aktionen und ungewöhnlicher Tool-Nutzung.
- **Reagieren** mit einem Runbook: wie man einen Agenten pausiert, seine Zugangsdaten widerruft und seine Änderungen zurückrollt.
- **Außer Betrieb nehmen.** Agenten und Skills, die niemand verantwortet oder nutzt, werden entfernt, nicht weiter betrieben.
- **Ausdrücklich akzeptieren.** Manche Risiken bleiben. Halten Sie fest, wer sie akzeptiert hat, warum und bis wann.

## Ein leichter Einstieg

Teams bleiben oft stecken, weil das Rahmenwerk groß wirkt. Beginnen Sie mit einer Ein-Seiten-Fassung:

1. Die Registry für die Agenten aufbauen, die Sie schon betreiben. Eine Zeile je Agent.
2. Je Agent Verantwortliche zuweisen und Tools und Daten auflisten.
3. Die drei Agenten mit der größten Auswirkung wählen und für jeden zehn Eval-Fälle schreiben.
4. Traces einschalten und für einen festgelegten Zeitraum aufbewahren.
5. Eine Seite Richtlinie schreiben: Datenklassen, Freigaberegeln, Ansprechpartner bei Vorfällen.
6. Alles vierteljährlich und nach jedem Vorfall überprüfen.

Das deckt die vier Funktionen schon in dünner, aber echter Form ab, und Sie können jeden Teil vertiefen, wenn die Zahl der Agenten wächst.

## Nutzung für Audits und Kunden

Weil das Rahmenwerk eine gemeinsame Sprache ist, hilft es in Gesprächen mit Sicherheitsteams, Prüfenden und Kunden: „Unsere Agenten-Registry deckt Map ab, unsere Eval-Suite und Traces decken Measure ab.“ Stellen Sie es als Weg dar, Ihre Belege zu ordnen, nicht als Konformitätsbehauptung. Solange Sie nicht von dafür Qualifizierten geprüft wurden, sagen Sie „orientiert sich an“ oder „nutzt als Referenz“, nicht „konform mit“.

## Das Wichtigste in Kürze

- Das NIST AI RMF ist freiwillig und allgemein; der Nutzen entsteht durch die Übersetzung auf Ihre Plattform.
- Govern: Verantwortliche, Rollen, durchgesetzte Richtlinien. Map: Registry, Datenflüsse, Kontext. Measure: Evals, Traces, Metriken. Manage: Gates, Reaktion, Außerbetriebnahme, ausdrückliche Risikoakzeptanz.
- Die meisten Belege liefert eine gute Agentenplattform schon; die Arbeit besteht im Sammeln und Prüfen.
- Mit einer Ein-Seiten-Fassung beginnen und mit der Zahl der Agenten vertiefen.
- Die Nutzung des Rahmenwerks korrekt beschreiben; Orientierung ist keine Zertifizierung.

## Quellen

- [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST, AI RMF 1.0 veröffentlicht 2023-01-26.
- [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1)](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), NIST, 2024-07-26.
- [AI 100-2 E2025, Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), NIST, 2025-03-24.
