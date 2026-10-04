---
ref: handovers-and-contracts
lang: de
title: "Übergaben sind Verträge: die Nahtstellen zwischen Agenten gestalten"
description: Die Agent-Übergabe ist die Bruchstelle von Multi-Agent-Systemen. Behandeln Sie jede als typisierten Vertrag mit Schema, Verantwortlichem und Abnahmeprüfung.
date: 2026-04-21T09:00:00Z
tags: [architecture, multi-agent, patterns]
---

**Eine Agent-Übergabe** (Handover) ist der Moment, in dem ein Agent Arbeit, Kontext oder ein Ergebnis an einen
anderen weitergibt. Hier scheitern die meisten Multi-Agent-Systeme: Eingaben sind unklar, niemand prüft, was
ankommt, und stille Annahmen überqueren die Grenze ungeprüft. Das Gegenmittel ist alt und unglamourös: Jede
Übergabe wird als Vertrag behandelt, mit Schema, Verantwortlichem, Abnahmeprüfung und definiertem Fehlerpfad.

## Warum die Nahtstellen reißen

Scheitert ein einzelner Agent, gibt es ein Transkript zu lesen. Reichen drei Agenten Arbeit weiter, kann der
Fehler in jedem von ihnen oder dazwischen liegen. Typische Probleme an der Naht:

- **Unklare Eingabe.** Agent B erhält „das Anliegen des Kunden“ als Absatz Fließtext und muss raten, was Fakten
  sind, was die Interpretation des ersten Agenten ist und was Anweisungen sind.
- **Fehlende Prüfung.** B vertraut der Ausgabe von A, weil sie von einem „Kollegen“ kommt, auch wenn A verwirrt oder
  manipuliert war.
- **Stille Annahmen.** A nimmt an, B prüfe das Erstattungslimit; B nimmt an, A habe es schon getan. Niemand tut es.
- **Kein Verantwortlicher.** Ist das Gesamtergebnis falsch, ist niemand für die Naht zuständig.
- **Verlorener Kontext.** A lässt ein Detail fallen, das B brauchte, und B kann nicht nachfragen.

Eine Studie, die Fehler von Multi-Agent-Systemen mit Sprachmodellen analysiert, beginnt mit einer ernüchternden
Beobachtung (Zitate im englischen Original):

> Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal.
>
> [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) (arXiv, 2025)

Sinngemäß: Trotz der Begeisterung für solche Systeme sind die Leistungsgewinne auf gängigen Benchmarks oft gering.
Das heißt nicht, dass Multi-Agent-Entwürfe falsch sind. Es heißt, dass zusätzliche Agenten zusätzliche
Schnittstellen bedeuten, und Schnittstellen brauchen Ingenieurarbeit. Warum man Arbeit überhaupt aufteilt, etwa um
die Rechte jedes Agenten zu verkleinern, steht in [Architektur vor Prompts](/de/posts/architecture-before-prompts/).

## Der Übergabevertrag

Ein Übergabevertrag ist kurz und hat fünf Teile.

1. **Schema.** Die genauen Felder und Typen, die die Grenze überqueren. Benannte Felder statt Fließtext.
2. **Verantwortlicher.** Eine Rolle oder ein Team, zuständig für die Naht samt ihren Änderungen.
3. **Vorbedingungen.** Was der Sender zusichert (zum Beispiel „alle Beträge in Cent“).
4. **Abnahmeprüfung.** Was der Empfänger prüft, bevor er die Eingabe nutzt.
5. **Fehlerpfad.** Was bei fehlgeschlagener Prüfung geschieht: Wiederholung, Rückfall, Eskalation an einen Menschen.

![Übergabe zwischen zwei Agenten als Vertrag dargestellt](/images/blog/handovers-and-contracts-1.svg)

Ein Vertrag kann als Datei neben den Agentendefinitionen liegen:

```yaml
handover: research-to-analysis
owner: support-platform-team
schema:
  ticket_key:   { type: string, pattern: "^SEC-\\d+$" }
  facts:        { type: array, items: string, maxItems: 20 }
  open_questions: { type: array, items: string }
  source_ids:   { type: array, items: string }   # woher jeder Fakt stammt
accept:
  - "ticket_key resolves in the tracker"
  - "every fact has a source_id"
on_reject: return_to_sender_once_then_escalate
```

Die Trennung von `facts` und `open_questions` und die Pflicht zu `source_ids` adressieren die zwei häufigsten
Nahtprobleme zugleich: Mehrdeutigkeit und nicht prüfbare Behauptungen.

## Workflows bevorzugen, wo der Weg bekannt ist

Nicht jede Naht braucht auf beiden Seiten einen Agenten. Anthropics Leitfaden zum Bau von Agenten unterscheidet
Workflows von Agenten und beschreibt die ersten so:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths.
>
> [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic, 2024)

Sinngemäß: Workflows sind Systeme, in denen Modelle und Tools über vordefinierte Codepfade orchestriert werden.
Ist die Schrittfolge bekannt, gehört sie in Code: Der Orchestrator ruft Agent A auf, validiert die Ausgabe gegen
das Schema und ruft dann Agent B auf. Code ist der bessere Prüfer einer Naht als ein weiteres Modell. Derselbe
Artikel nennt ein allgemeines Entwurfsprinzip, das hier gilt:

> Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks.
>
> [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic, 2024)

Eine typisierte, im Code validierte Übergabe ist genau so ein einfaches, kombinierbares Muster.

## Übergaben über Organisationen und Protokolle hinweg

Stammen Agenten aus verschiedenen Teams oder von verschiedenen Anbietern, muss der Vertrag ausdrücklich sein,
denn die Prompts der Gegenseite kann man nicht lesen. Agent-zu-Agent-Protokolle standardisieren den Transport.
Googles Ankündigung des A2A-Protokolls nennt das Ziel:

> The A2A protocol will allow AI agents to communicate with each other, securely exchange information, and coordinate actions
>
> [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) (Google for Developers Blog, 2025)

Sinngemäß: Das Protokoll soll KI-Agenten ermöglichen, miteinander zu kommunizieren, Informationen sicher
auszutauschen und Aktionen zu koordinieren. Ein Protokoll liefert Nachrichtenformate und Auffindbarkeit, aber keine
Bedeutung: was ein Feld zusichert, wem es gehört, wie es geprüft wird. Das bleibt Aufgabe des Vertrags. Egal
welcher Transport: Authentifizieren Sie den Sender und behandeln Sie die Nutzlast als nicht vertrauenswürdige
Eingabe, bis die Abnahmeprüfung bestanden ist.

## Prüfung an der Naht

Drei Prüfungen zahlen sich am meisten aus:

- **Strukturell**: Passt die Nutzlast zum Schema? Bei Abweichung ablehnen, nicht stillschweigend „reparieren“.
- **Referenziell**: Lösen sich Kennungen auf echte Objekte auf (Ticket existiert, Bestellung gehört dem Kunden)?
- **Policy**: Darf der nächste Agent tun, was die Nutzlast verlangt, unter der Identität, für die er handelt?

Verbinden Sie das mit den inkrementellen Gewohnheiten aus [Kleine geprüfte Schritte](/de/posts/small-verified-steps/):
Jede Übergabe ist ein natürlicher Kontrollpunkt, an dem die Arbeit committet, geprüft oder abgelehnt wird, bevor
der nächste Agent startet.

## Prüfliste für jede Übergabe

```text
[ ] Ist das Schema aufgeschrieben und versioniert?
[ ] Stehen Fakten, Interpretationen und Anweisungen in getrennten Feldern?
[ ] Trägt jede Behauptung eine prüfbare Quelle?
[ ] Gibt es einen benannten Verantwortlichen für diese Naht?
[ ] Validiert der Empfänger, bevor er handelt?
[ ] Ist der Fehlerpfad definiert und getestet (Wiederholungslimit, Eskalation)?
[ ] Wird die vollständige Nutzlast für Untersuchungen protokolliert?
```

## Grenzen

Verträge fangen strukturelle und referenzielle Fehler ab, keine falschen Urteile. Eine perfekt typisierte
Übergabe kann trotzdem eine schlechte Schlussfolgerung tragen. Dafür braucht es die Bewertung des Ergebnisses von
Anfang bis Ende und bei riskanten Schritten eine menschliche Freigabe. Verträge machen auch Pflegeaufwand: Jede
Schemaänderung ist ein koordinierter Release. Halten Sie Verträge deshalb klein und stabil und versionieren Sie sie
wie APIs. Zum weiteren Entwurfskontext siehe [Agent-Architektur ist nicht
Anwendungsarchitektur](/de/posts/agent-architecture-is-not-application-architecture/).

## Das Wichtigste in Kürze

- Die meisten Multi-Agent-Fehler passieren an den Nahtstellen, entwerfen Sie sie bewusst.
- Ein Übergabevertrag hat Schema, Verantwortlichen, Vorbedingungen, Abnahmeprüfung und Fehlerpfad.
- Bekannte Abläufe gehören in Code; validieren Sie jede Nutzlast, bevor der nächste Agent handelt.
- Trennen Sie Fakten, Interpretationen und Anweisungen; verlangen Sie Quellen für Behauptungen.
- Versionieren Sie Verträge wie APIs und bewerten Sie Ergebnisse von Anfang bis Ende, nicht nur die Nähte.

## Quellen

- [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657), arXiv, 2025.
- [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents), Anthropic, 19.12.2024.
- [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/), Google for Developers Blog, 09.04.2025.
