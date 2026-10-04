---
ref: architecture-before-prompts
lang: de
title: "Architektur vor Prompts: warum das Fundament alles entscheidet"
description: "KI-Agenten-Architektur legt Grenzen, Verträge, Übergaben und Datenflüsse fest, bevor ein Prompt läuft. Warum Fehler meist an fehlenden Grenzen liegen."
date: 2026-03-17T09:00:00Z
tags: [architecture, opinion, patterns]
---

KI-Agenten-Architektur ist die Menge der Entscheidungen, die vor dem ersten Prompt fallen: Wo liegen
die Grenzen zwischen Schritten, was darf jeder Schritt anfassen, welchem Vertrag folgt eine Übergabe
und wie fließen Daten durch das System. Prompts stimmen das Verhalten innerhalb dieser Grenzen ab.
Eine Grenze, die nicht existiert, können sie nicht erzeugen. Dieser Beitrag ist eine Meinung, mit
einem praktischen Test am Ende: Wenn ein Agent in Produktion versagt, liegt die Ursache meist an
einer fehlenden Grenze, und den Prompt zu ändern behandelt nur das Symptom.

![Pyramide mit Architektur als Basis und Prompts an der Spitze](/images/blog/architecture-before-prompts-1.svg)

## Was Prompts können und was nicht

Ein Prompt ist eine Anweisung an eine probabilistische Komponente. Er kann das durchschnittliche
Verhalten deutlich verbessern: Ton, Format, Reihenfolge der Schritte, Umgang mit häufigen Randfällen.
Er kann Verhalten nicht garantieren. Was ein Prompt nicht kann:

- Er kann einen Agenten nicht daran hindern, ein Tool aufzurufen, das der Agent hält.
- Er kann nicht beweisen, dass eine Anweisung befolgt wurde.
- Er kann vertrauenswürdige Anweisungen nicht von nicht vertrauenswürdigem Text in der Eingabe trennen.
- Er kann die Kosten einer Schleife nicht begrenzen, die das Modell weiterlaufen lässt.

Jedes davon ist eine Eigenschaft des umgebenden Systems: welche Tools vergeben sind, was
protokolliert wird, woher Eingaben kommen und wie lange ein Lauf dauern darf. Das sind
Architekturentscheidungen. Ein Team, das nur an Prompts arbeitet, stimmt das Innere einer Kiste ab,
deren Wände niemand gebaut hat.

## Workflows, Agenten und wo die Grenze verläuft

Anthropics Leitfaden zum Bau von Agenten zieht eine nützliche Linie zwischen zwei Formen:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

Sinngemäß: Workflows sind Systeme, in denen LLMs und Tools über vordefinierte Codepfade orchestriert
werden. In einem Workflow bestimmt Ihr Code die Reihenfolge, und das Modell füllt Schritte aus. In
einem Agenten bestimmt das Modell die Reihenfolge. Der erste hat besser vorhersehbare Grenzen, weil
der Kontrollfluss Code ist, den man lesen und testen kann. Der zweite bietet mehr Flexibilität und
mehr, das man eingrenzen muss. Die Wahl zwischen beiden ist die erste Architekturentscheidung und
sollte bewusst fallen: so wenig Autonomie wie nötig und die Grenze dorthin, wo sich ein Fehler sonst
ausbreiten würde.

Derselbe Artikel macht eine Beobachtung, die für eine schlichte, unspektakuläre Architektur spricht:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> — Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

(Die Seite wurde seit der Erstveröffentlichung geändert; die zitierten Sätze stammen aus dem
Kerntext.) Einfach und zusammensetzbar heißt auch: Jedes Stück kann eigene Grenzen bekommen.

## Ein Agent ist Modell plus Gerüst

Anthropics Beitrag zu den SWE-bench-Ergebnissen sagt in einem Satz, was ein Agent ist:

> In this context, an "agent" refers to the combination of an AI model and the software scaffolding around it.
>
> — Anthropic, [Claude SWE-Bench Performance](https://www.anthropic.com/engineering/swe-bench-sonnet)

Das Gerüst („Scaffolding“) ist die Architektur. Es bestimmt, welche Tools es gibt, wie Ergebnisse
zurückfließen, wann Schluss ist und was gemerkt wird. Zwei Teams mit demselben Modell und
unterschiedlichem Gerüst erhalten unterschiedliche Agenten. Deshalb sagt ein Vergleich von „Modellen“
ohne den Blick auf das System drumherum wenig über das Verhalten in Produktion.

## Vier Architekturfragen vor dem Prompten

1. **Grenzen.** Was ist die kleinste Einheit, die allein ausfallen sollte? Welche Tools, Daten und
   Netzziele braucht jede Einheit? Der Beitrag zu [minimalen Rechten](/de/posts/least-privilege-for-agents/)
   zeigt den Ansatz: kleine Agenten mit engen Rechten statt eines Agenten mit allem.
2. **Verträge.** Was geht in jeden Schritt hinein und heraus, in welcher Form? Eine strukturierte,
   gegen ein Schema geprüfte Ausgabe ist ein Vertrag. Freitext, der an den nächsten Agenten
   weitergereicht wird, ist Hoffnung.
3. **Übergaben.** Wer entscheidet, dass ein Schritt fertig ist, und wer erhält das Ergebnis? Über eine
   Übergabe wandern Fehler und eingeschleuster Text, sie braucht also ein definiertes Format und eine
   Prüfung.
4. **Datenfluss.** Woher kommt jedes Datum, wohin darf es, und wer darf es sehen? Zeichnen Sie es auf.
   Hat die Zeichnung einen Pfeil von nicht vertrauenswürdiger Eingabe zu einem Tool, das schreiben
   kann, ist dieser Pfeil der Befund.

Der bestehende Beitrag
[Agentenarchitektur ist keine Anwendungsarchitektur](/de/posts/agent-architecture-is-not-application-architecture/)
beschreibt dafür ein konkretes Muster: ein MCP-Server je System und ein Agent je Schritt. Hier geht
es allgemeiner darum: Jedes Muster, das diese vier Fragen beantwortet, schlägt einen besseren Prompt
auf einem System, das keine davon beantwortet.

## Warum das auch für die Qualität zählt

Architektur entscheidet auch, ob man erkennen kann, was schiefging. Hat jeder Schritt einen Vertrag,
zeigt ein verletzter Vertrag auf einen Schritt. Ist alles ein langer Prompt mit einer langen
Ausgabe, hat ein schlechtes Ergebnis keine Adresse. Der DORA-Bericht 2025, zusammengefasst im
Google-Cloud-Blog, enthält einen Satz, der für Agentensysteme so gilt wie für Teams:

> AI doesn't fix a team; it amplifies what's already there.
>
> — Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)

Sinngemäß: KI repariert kein Team, sie verstärkt, was schon da ist. Ein System mit klaren Grenzen wird
zu klarem Verhalten verstärkt, eines ohne zu Verwirrung. Das verwandte Argument zu Menge und
Prüfkapazität steht in [Zu viele Prompts](/de/posts/prompt-sprawl-and-ai-slop/).

## Ein Test für Ihre Vorfallanalysen

Wenn sich ein Agent das nächste Mal falsch verhält, stellen Sie diese Fragen, bevor Sie den Prompt
anfassen:

- Welche Grenze hätte das stoppen sollen, und gab es sie?
- Konnte der Agent das tun, weil er ein Tool hielt, das er für die Aufgabe nicht brauchte?
- Ist nicht vertrauenswürdige Eingabe bis zu einem Schritt gelangt, der darauf handeln konnte?
- Wurde die Übergabe validiert, oder hat der nächste Schritt Freitext vertraut?
- Gibt es eine Aufzeichnung der Schritte, nicht nur der Endantwort?

Zählen Sie, wohin die Antworten zeigen. Weisen die meisten auf Struktur, ändern Sie die Struktur.
Waren die Grenzen richtig und der Schritt tat trotzdem das Falsche, ist es ein Prompt-Problem, und
zwar ein ehrliches.

## Grenzen des Arguments

Das ist kein Argument gegen Prompt-Arbeit. Ein guter Prompt senkt, wie oft die Grenzen auf die Probe
gestellt werden. Es ist auch kein Argument für schwere Frameworks; die zitierte Empfehlung weist in
die andere Richtung. Und Architektur nimmt nicht die Notwendigkeit, das Modellverhalten zu bewerten.
Sie macht die Bewertung kleiner, weil jeder Schritt eine engere Aufgabe hat.

## Das Wichtigste in Kürze

- Prompts stimmen Verhalten innerhalb einer Grenze ab; Architektur legt die Grenzen fest.
- Workflow oder Agent bewusst wählen und so wenig Autonomie wie nötig einsetzen.
- Ein Agent ist Modell plus Gerüst. Das Gerüst ist die Architektur.
- Vor dem Prompten vier Fragen beantworten: Grenzen, Verträge, Übergaben, Datenfluss.
- In Vorfallanalysen zuerst die fehlende Grenze suchen, dann den Prompt ändern.

## Quellen

- Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (2024-12-19; die Seite wurde seitdem aktualisiert)
- Anthropic, [Claude SWE-Bench Performance](https://www.anthropic.com/engineering/swe-bench-sonnet) (2025-01-06)
- Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) (2025-09-23)
