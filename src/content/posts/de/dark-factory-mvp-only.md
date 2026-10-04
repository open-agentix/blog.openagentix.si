---
ref: dark-factory-mvp-only
lang: de
title: "Dark Software Factory: nur für MVPs und PoCs"
description: Agenten Software mit minimalem menschlichem Zutun bauen zu lassen, kann ein schneller Weg zum Prototyp sein. open-agentix bietet das als Opt-in-Modus mit festem Hinweis und behält Freigabe-Gates für die Produktion.
date: 2026-02-17T09:00:00Z
tags: [dark-factory, governance, security]
---

Eine „Dark Factory“ ist eine Fabrik, die ohne Menschen in der Halle läuft, sodass das Licht aus
bleiben kann. Die Softwareversion ist eine Agenten-Pipeline, die eine Spezifikation nimmt, den Code
schreibt, die Tests schreibt und den Pull Request eröffnet, mit wenig oder gar keiner menschlichen
Beteiligung.

open-agentix unterstützt das als **Opt-in-Agentenmodus** mit einem festen Hinweis:

> Empfohlen nur für MVP- und Proof-of-Concept-Entwicklung. Nicht für Änderungen an der Produktion
> ohne Review.

Dieser kurze Beitrag erklärt, warum wir diesen Satz ins Produkt geschrieben haben.

## Wo es sinnvoll ist

Ein Prototyp hat ein kurzes Leben und einen kleinen Wirkungsradius. Wenn das Ziel ist, an einem
Nachmittag herauszufinden, ob eine Idee funktioniert, ist der Preis eines übersehenen Randfalls
gering und der Preis des Wartens auf das Review jeder Zeile hoch. Für einen Proof of Concept, ein
Wegwerf-Werkzeug oder eine erste Fassung von etwas, das ohnehin neu geschrieben wird, ist es ein
vernünftiger Tausch, Agenten von der Spezifikation bis zum Pull Request laufen zu lassen.

## Wo nicht

Produktionssoftware bringt Pflichten mit, die eine Pipeline ohne Review nicht von selbst erfüllt:

- **Niemand hat es gelesen.** Tests, die derselbe Agent schreibt wie den Code, prüfen, was der Agent
  verstanden hat, nicht was Sie gemeint haben.
- **Sicherheit und Wartung sind unsichtbare Kosten.** Eine Abhängigkeit, die nicht da sein sollte,
  ein zu offener Standardwert oder ein unlesbares Modul bestehen alle den Build.
- **Verantwortung braucht eine Person.** Erreicht eine Änderung Kunden, muss jemand dafür einstehen.

Für diese Fälle behält die Plattform die Freigabe-Gates. Merge und Deploy bleiben hinter einer
menschlichen Entscheidung oder einer ausdrücklichen Policy, die eine Person geschrieben und
freigegeben hat.

## Was die Plattform heute enthält

In Version 0.1.0 gibt es den Modus als Opt-in-Schalter mit dem festen Hinweis. Drumherum liegen die
Teile, die eine von Agenten gebaute Änderung prüfbar statt vertrauenswürdig machen:

- **Entwicklungsrichtlinien** als versionierte Sätze (Coding-Standards, Branch- und Commit-Regeln,
  Abdeckungserwartungen, Sicherheitsregeln, verbotene Abhängigkeiten). Sie lösen sich von global über
  Mandant zu Agent auf, und die strengere Regel gewinnt.
- **Ein Hardening-Review**, das die Ausgabe eines Entwicklungsagenten gegen diese Richtlinien prüft.
  Es ist zuerst deterministisch und kann ein Urteil nur verschärfen, nie eine Policy abschwächen.
  Befunde gehen in den Audit-Trail. Das Review läuft auf Anforderung über einen API-Endpunkt; eine
  automatische Prüfung von Pull Requests ist geplant.
- Dasselbe Policy-Gate, dieselben Budgets und derselbe Audit-Trail wie bei jedem anderen Agenten.

Eine fertige **Pipeline-Vorlage** für den ganzen Weg von der Spezifikation zum Pull Request, mit den
oben beschriebenen Freigaben, ist für das nächste Release geplant. Es gibt sie noch nicht.

## Ein ehrlicher Vergleich

Dieses Projekt wird selbst überwiegend von einem KI-Agenten geschrieben, also liegt die Frage nahe,
ob es eine Dark Factory ist. Das ist es nicht. Jede Änderung läuft über einen Pull Request, den
Menschen prüfen, die Projektleitung verantwortet die Entscheidungen, und Tests, Abdeckungsschwellen
und CI laufen bei jeder Änderung. Der Agent schreibt, Menschen entscheiden, was gemergt wird. Eine
Dark Factory entfernt genau diesen letzten Schritt, und genau den empfehlen wir für alles, was
zählt, beizubehalten.

Wenn Sie den Modus ausprobieren, behandeln Sie das Ergebnis als Prototyp. Sobald der Prototyp die
Idee belegt, stellen Sie vor die Version, die Sie betreiben wollen, einen Menschen und ein Review.
