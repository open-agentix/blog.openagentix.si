---
ref: least-privilege-for-agents
lang: de
title: "Minimale Rechte für Agenten: Zerlegung statt eines allmächtigen Agenten"
description: Ein Agent mit Lese- und Schreibzugriff auf alles hat einen großen Wirkungsradius. open-agentix zerlegt einen Prozess in kleine Agenten, die nur die Werkzeuge ihres Schritts halten.
date: 2026-02-05T09:00:00Z
tags: [security, architecture, least-privilege]
---

Der einfachste Weg, einen Agenten für einen Prozess zu bauen, ist, ihm jedes Werkzeug zu geben, das
der Prozess berührt. Ein Support-Workflow bekommt dann Lese- und Schreibrechte im CRM, Lese- und
Schreibrechte im Issue-Tracker, Lese- und Schreibrechte in Git und eine offene Internetverbindung.
In der Demo funktioniert das. Es bedeutet aber auch: Eine erfolgreiche Prompt-Injection, ein
fehlerhaftes Werkzeugargument oder ein verwirrter Modellschritt erreicht alles auf einmal.

## Das Prinzip

> Geben Sie nicht einem Agenten die Rechte des ganzen Prozesses. Geben Sie jedem Agenten die
> minimalen Fähigkeiten, die sein Schritt braucht.

Nehmen wir das Beispiel aus unserem Konzept: Ein zahlungsbezogenes Ticket kommt an, der Agent soll
Runbook und Kundendaten prüfen, entscheiden, ob die Zahlung verdächtig aussieht, und gegebenenfalls
ein Jira-Issue anlegen. Statt eines Agenten werden es drei:

```text
research   ->   analysis   ->   action
 Tickets: lesen   nur Modell      Jira: Issue anlegen (Freigabe)
 CRM: lesen       kein Schreiben  kein CRM, kein Git
 Runbook: lesen
```

Wird der Research-Agent durch Text in einem Ticket manipuliert, kann er trotzdem nirgends
schreiben. Ist der Analyse-Agent verwirrt, hält er gar keine Werkzeuge. Der Action-Agent kann eine
Art Issue anlegen und kein CRM lesen. Der Wirkungsradius jedes einzelnen Agenten schrumpft auf die
Größe seines Schritts.

## So sieht es in `agents.md` aus

Eine Agentendefinition ist eine Markdown-Datei mit YAML-Kopf. Eine Datei kann eine Pipeline aus
einem oder mehreren Agenten beschreiben, und jeder Agent listet seine eigenen Werkzeuge mit
Einschränkungen für deren Argumente. Dies ist eine gekürzte Fassung des Beispiels `cve-triage`, das
mit der Plattform ausgeliefert wird:

```yaml
agents:
  - id: triage
    tools:
      - server: cve-db
        tool: lookup_cve
        args:
          cveId:
            type: string
            required: true
            pattern: "^CVE-\\d{4}-\\d{4,}$"
  - id: notify
    tools:
      - server: tickets
        tool: add_comment
        maxCallsPerRun: 1
        args:
          key:
            type: string
            required: true
            pattern: "^SEC-\\d+$"
          comment:
            type: string
            required: true
            maxLength: 2000
pipeline: [triage, notify]
```

Der Agent `triage` kann eine CVE nachschlagen und sonst nichts. Der Agent `notify` kann genau einen
Kommentar hinzufügen, nur an Tickets, deren Schlüssel auf `SEC-<Zahl>` passt, und nichts aus der
CVE-Datenbank lesen. Ein nicht erteiltes Werkzeug wird dem Modell gar nicht erst angezeigt, es gibt
also nichts, wozu man es überreden könnte. Aufrufe mit Argumenten außerhalb der deklarierten Form
lehnt das Policy-Gate ab, das wir im nächsten Beitrag beschreiben.

Gefährliche Werkzeuge können zusätzlich `approval: required` tragen. Der Lauf pausiert dann, bis
eine Person mit der passenden Rolle entscheidet.

## Fähigkeiten sind keine Berechtigungen

Wenn ein Agent erklärt, er brauche eine Fähigkeit, ist sie damit nicht erteilt. In unserem Entwurf
ist der effektive Zugriff die Schnittmenge aus dem, was der Agent deklariert, was die Policy
erlaubt, wer die handelnde Identität ist und was die Umgebung zulässt. Die Plattform entscheidet,
nicht die Datei, die um etwas bittet.

## Was es kostet und was es nicht löst

Zerlegung gibt es nicht umsonst.

- **Mehr bewegliche Teile.** Drei Agenten bedeuten drei Anweisungssätze, mehr Modellaufrufe und
  mehr Stellen, an denen eine Übergabe schiefgehen kann. Für eine Aufgabe mit einem Werkzeug und
  einem Leser ist ein Agent die richtige Antwort.
- **Übergaben sind eine Angriffsfläche.** Liest der Research-Agent feindlichen Text und reicht ihn
  als Fließtext weiter, bekommt der nächste Agent diesen Text. Strukturierte Übergaben helfen: Im
  Beispiel antwortet der erste Agent mit einem JSON-Objekt aus benannten Feldern, und die
  Werkzeugargumente des nächsten Agenten werden nach Muster und Länge geprüft. Validierung ist eine
  Abschwächung, kein Beweis.
- **Jemand muss die Aufteilung wählen.** Der *Agent Check* ist beratend: Auf `main` (erscheint in 0.2)
  prüft er eine vorgeschlagene Aufteilung mit deterministischen Regeln auf minimale Rechte, und ein Mensch
  bewertet das Ergebnis. Ein von einem Modell erzeugter Vorschlag wäre ebenso nur beratend. Die genannten Werkzeug-Allowlists und Argumentbeschränkungen je Agent gibt
  es in Version 0.1.0.

Minimale Rechte machen aus einem schlechten Agenten keinen guten. Sie machen einen schlechten Tag
kleiner, und sie machen die Frage „Was hätte dieser Agent tun können?“ aus einer Datei
beantwortbar statt aus einer Vermutung.
