---
ref: workflows-vs-agents
lang: de
title: "Workflows oder Agenten? Wie viel Autonomie ein Schritt braucht"
description: "Workflows vs agents ist eine Entscheidung je Schritt: feste Codepfade sind günstiger und besser steuerbar, Schleifen flexibel. Wählen Sie wenig Autonomie."
date: 2026-05-28T09:00:00Z
tags: [architecture, comparison, patterns]
---

Workflows oder Agenten ist keine Entscheidung, die man einmal für ein ganzes System trifft. Man trifft sie für jeden Schritt: Wie viel Freiheit braucht dieser Schritt? Die Antwort, die sich in der Praxis am besten hält, lautet: so wenig Autonomie wie möglich, die die Aufgabe löst. Feste Codepfade sind günstiger, leichter zu testen und leichter zu steuern. Modellgesteuerte Schleifen sind flexibel, kosten aber mehr und sind schwerer vorhersagbar. Greifen Sie nur dort zur Schleife, wo sich der Pfad nicht vorab kennen lässt.

## Die beiden Enden der Skala

Anthropics Engineering-Leitfaden zum Bau von Agenten zieht die Linie zwischen beiden:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

Sinngemäß: Workflows sind Systeme, in denen LLMs und Tools über vordefinierte Codepfade orchestriert werden. Bei einem Agenten dagegen entscheidet das Modell über den nächsten Schritt und das passende Tool und macht weiter, bis es die Aufgabe für erledigt hält. Der Rat des Leitfadens, wie man beides baut, ist bescheiden:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

Sinngemäß: Die erfolgreichsten Umsetzungen nutzen einfache, kombinierbare Muster statt komplexer Frameworks. Der Begriff „Agent“ deckt eine große Bandbreite ab, also denken Sie in einer Skala statt in zwei Kästen.

![Skala der Autonomie vom Workflow zum Agenten](/images/blog/workflows-vs-agents-1.svg)

1. **Ein einzelner Modellaufruf** mit gutem Prompt und gegebenenfalls Retrieval. Viele Aufgaben enden hier.
2. **Eine feste Kette von Aufrufen.** Der Code bestimmt die Reihenfolge; jeder Modellaufruf erledigt eine Aufgabe.
3. **Routing.** Ein Modellaufruf wählt, welchen festen Pfad man nimmt; die Pfade selbst sind Code.
4. **Parallele oder wiederholte Workflows.** Der Code verzweigt oder wiederholt nach festen Regeln.
5. **Eine offene Agentenschleife.** Das Modell wählt die nächste Aktion anhand der bisherigen Beobachtungen.

Nach rechts gewinnt man Flexibilität und verliert Vorhersagbarkeit. Die Schleife aus Denken und Handeln, die das rechte Ende trägt, beschrieb das ReAct-Paper; es lässt ein Modell

> generate both reasoning traces and task-specific actions in an interleaved manner
>
> — [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629), arXiv

Sinngemäß: Denkspuren und aufgabenspezifische Aktionen verschränkt erzeugen. Genau diese Verschränkung macht einen Agenten anpassungsfähig, und genau sie macht seinen Pfad vor dem Lauf unbekannt.

## Was Autonomie kostet

Jeder Schritt, den Sie dem Urteil des Modells überlassen, hat einen Preis.

**Geld.** Schleifen machen viele Aufrufe, und jeder trägt einen wachsenden Kontext. Anthropics Bericht über sein Multi-Agenten-Recherchesystem hat das gemessen:

> In our data, agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats.
>
> — Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

Derselbe Artikel erklärt, warum sich der Aufwand für manche Aufgaben lohnen kann:

> Multi-agent systems work mainly because they help spend enough tokens to solve the problem.
>
> — Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

Sinngemäß: Agenten brauchen typischerweise etwa das Vierfache an Tokens eines Chats, Multi-Agenten-Systeme etwa das Fünfzehnfache, und sie funktionieren vor allem, weil sie helfen, genug Tokens für das Problem aufzuwenden. Bei einer wertvollen Rechercheaufgabe kann das Fünfzehnfache günstig sein. Bei einer Routine-Klassifikation, die 10.000-mal am Tag läuft, nicht. Lesen Sie die Zahlen als Messwerte eines Systems, nicht als Konstanten.

**Vorhersagbarkeit.** Ein fester Pfad erzeugt jedes Mal dieselbe Schrittfolge; für jeden Schritt lässt sich ein Test schreiben. Eine Schleife kann 3 Schritte brauchen oder 30, und dieselbe Eingabe kann verschiedene Pfade nehmen. Latenz und Kosten werden zu Verteilungen statt zu Zahlen.

**Steuerbarkeit.** Bei einem festen Pfad wissen Sie vor dem Lauf, welche Tools in welcher Reihenfolge aufgerufen werden können, die Rechte lassen sich also eng halten. Bei einer Schleife braucht der Agent jedes Tool, das er wählen könnte, was den Wirkungsradius vergrößert. Siehe [minimale Rechte für Agenten](/de/posts/least-privilege-for-agents/).

**Fehlersuche.** Ein scheiternder Workflow zeigt auf einen Schritt. Eine scheiternde Agentenschleife zeigt auf ein langes Transkript und eine Ermessensentscheidung.

## Kriterien für jeden Schritt

Stellen Sie diese Fragen Schritt für Schritt, nicht für das ganze System.

1. **Steht die Abfolge vorab fest?** Wenn Sie die Schritte aufschreiben können, schreiben Sie sie als Code. Nutzen Sie ein Modell innerhalb eines Schritts, wenn dieser Sprachverständnis braucht.
2. **Hängt die nächste Aktion davon ab, was gerade gefunden wurde?** Ist die Entscheidung eine kleine Verzweigung mit wenigen Ausgängen, nutzen Sie Routing. Ist sie offen, kann eine Schleife gerechtfertigt sein.
3. **Wie schlimm ist eine falsche Aktion?** Unumkehrbare oder folgenreiche Aktionen sprechen für feste Pfade mit Freigaben. Umkehrbare, lesende Schritte vertragen mehr Freiheit.
4. **Wie groß sind Kosten- und Latenzbudget?** Ein Schritt, der in einer Sekunde für einen Bruchteil eines Cents fertig sein muss, kann keine Schleife sein.
5. **Lässt sich das Ergebnis prüfen?** Autonomie ist leichter zu akzeptieren, wo eine Prüfung existiert, etwa Tests für erzeugten Code. Wo Sie nicht prüfen können, schränken Sie ein.
6. **Wie oft läuft die Aufgabe?** Seltene, wertvolle Aufgaben können sich Erkundung leisten. Häufige, geringwertige brauchen günstige, vorhersagbare Pfade.

Ein durchgerechnetes Beispiel: ein Support-Prozess, der Felder aus einem Ticket extrahiert, es weiterleitet, eine Antwort entwirft und ein Issue anlegt.

| Schritt | Muster | Grund |
| --- | --- | --- |
| Felder extrahieren | Einzelner Modellaufruf mit Schema | Bekannte Eingabe, bekannte Ausgabe |
| Nach Kategorie weiterleiten | Routing | Wenige feste Ausgänge |
| Kundendaten abfragen | Code | Deterministischer API-Aufruf |
| Antwort entwerfen | Einzelner Modellaufruf, menschliche Prüfung | Sprachaufgabe, von einem Menschen geprüft |
| Ungewöhnlichen Fehler untersuchen | Agentenschleife, nur lesende Tools | Pfad unbekannt, nichts Unumkehrbares |
| Issue anlegen | Code mit Freigabe | Ein Schreibzugriff, folgenreich |

Nur einer von sechs Schritten ist ein Agent, und er hat nur lesende Tools. Das meiste „agentische“ Verhalten des Prozesses stammt aus gut platzierten Modellaufrufen in einem festen Rahmen.

## Niedrig anfangen, mit Belegen nach rechts gehen

Eine praktische Reihenfolge:

1. **Zuerst den einzelnen Aufruf oder die feste Kette bauen.** Mit einem kleinen Eval-Satz messen.
2. **Die Fehler finden.** Entstehen sie durch fehlende Informationen, falsche Reihenfolge oder Aufgaben, die wirklich Erkundung brauchen?
3. **Autonomie nur dort ergänzen, wo Fehler sie verlangen**, in der engsten Form: ein Router vor einer Schleife, eine Schleife mit kleinem Tool-Satz vor einer allgemeinen.
4. **Neu messen.** Erfolg, Kosten und Latenz mit der einfacheren Version vergleichen. Gewinnt die Schleife nicht klar, bleibt es bei der einfachen.
5. **Die Schleife begrenzen** mit Schrittlimit, Token-Budget und Abbruchbedingung und Logs behalten, um zu sehen, was sie tat.

Das ist dieselbe Disziplin wie in [Architektur vor Prompts](/de/posts/architecture-before-prompts/): die Struktur bewusst festlegen und die Prompts die Lücken füllen lassen. Wo Schritte Arbeit aneinander übergeben, wird die Schnittstelle ausdrücklich definiert, wie in [Übergaben und Verträge](/de/posts/handovers-and-contracts/) beschrieben.

## Grenzen

Die Skala ist ein Denkmodell, keine Taxonomie; echte Systeme mischen Muster. Auch die Fähigkeiten der Modelle ändern sich, und ein Schritt, der letztes Jahr eine Schleife brauchte, lässt sich heute vielleicht mit einem einzigen Aufruf lösen. Überprüfen Sie die Wahl, wenn Sie Modelle wechseln. Und ein einfacher Entwurf ist nicht automatisch sicher: Eine feste Kette, die nicht vertrauenswürdigen Text an ein Modell mit Schreibzugriff weitergibt, ist immer noch angreifbar.

## Das Wichtigste in Kürze

- Wählen Sie die Autonomie je Schritt, nicht je System.
- Feste Codepfade sind günstiger, testbar und leichter zu steuern; Schleifen sind flexibel, aber teurer und weniger vorhersagbar.
- Agenten können ein Mehrfaches der Tokens eines Chats brauchen, Multi-Agenten-Systeme weit mehr; setzen Sie sie dort ein, wo der Wert es rechtfertigt.
- Nutzen Sie Kriterien: bekannte Abfolge, Folgen von Fehlern, Prüfbarkeit, Budget und Häufigkeit.
- Beginnen Sie mit dem einfachsten Entwurf, messen Sie und ergänzen Sie Autonomie nur, wo die Belege es verlangen.

## Quellen

- Anthropic: [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- arXiv: [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- Anthropic: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
