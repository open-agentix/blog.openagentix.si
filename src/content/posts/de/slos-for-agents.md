---
ref: slos-for-agents
lang: de
title: "Betriebsreihe: SLOs für Agenten, von Aufgabenerfolg bis Zeit bis zur Freigabe"
description: "Ein SLO für AI agents wird wie für jeden Dienst definiert: Aufgabenerfolg, Konsistenz, Latenz, Kosten pro Aufgabe und ein Error Budget als Rollout-Steuerung."
date: 2026-05-19T09:00:00Z
tags: [operations, reliability, evaluation]
---

Ein SLO für KI-Agenten ist ein messbares Ziel dafür, wie gut ein Agentendienst arbeitet, und wird genauso definiert wie für jeden anderen Dienst: Indikatoren wählen, Ziele setzen, über ein Zeitfenster messen und mit dem verbleibenden Error Budget entscheiden, wie schnell man Änderungen ausrollt. Die Indikatoren unterscheiden sich. Bei Agenten sind es die Erfolgsrate pro Aufgabe, die Konsistenz über wiederholte Versuche, die Latenz, die Kosten pro Aufgabe und, wo Menschen Aktionen freigeben, die Zeit bis zur Freigabe. Dieser Beitrag zeigt, wie man sie aus Eval- und Trace-Daten ableitet und wie ein Error Budget Rollout-Entscheidungen verändert.

## SLI, SLO und Error Budget in einem Absatz

Das Google-SRE-Buch definiert die Begriffe genau:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.
>
> — [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), Google

Sinngemäß: Ein SLO ist ein Zielwert oder Wertebereich für ein Service-Niveau, das über einen SLI gemessen wird. Ein SLI (Service Level Indicator) ist die Messgröße, etwa der Anteil korrekt erledigter Aufgaben. Das SLO ist das Ziel dafür, etwa 90 % über 28 Tage. Das Error Budget ist die Differenz zu 100 %: das Maß an Fehlern, das Sie sich leisten können. Ist noch Budget da, dürfen Änderungen ausgeliefert werden; ist es verbraucht, stoppen Sie und beheben Zuverlässigkeitsprobleme. Daran ist nichts agentenspezifisch, und genau das sagt [Agentenbetrieb ist einfach Betrieb](/de/posts/agent-ops-is-just-ops/).

## Indikatoren wählen, die zählen, was Nutzern wichtig ist

Beginnen Sie damit, was ein gutes Ergebnis bedeutet, und arbeiten Sie dann rückwärts zu einer Kennzahl. Vier Indikatoren decken die meisten Agentendienste ab.

### Erfolgsrate pro Aufgabe

Der Anteil der Aufgaben mit korrektem Ergebnis. Dafür braucht es eine Definition von „korrekt“, die ein Programm prüfen kann. Der Anthropic-Artikel zu Agenten-Evals trennt die Ausgabe des Agenten vom Zustand der Welt und definiert das Bewertungsstück:

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Und er nennt ein Beispiel für ein prüfbares Ergebnis:

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Sinngemäß: Das Ergebnis ist, ob in der SQL-Datenbank der Umgebung eine Reservierung existiert. In der Produktion lässt sich oft nicht jeder Lauf bewerten. Kombinieren Sie drei Quellen: automatische Ergebnisprüfungen, wo möglich (hat das Ticket das richtige Label, existiert der Datensatz), stichprobenartige menschliche Prüfung für den Rest und Nutzersignale wie Rücknahmen oder Beschwerden. Nennen Sie die Stichprobenmethode zusammen mit der Zahl.

### Konsistenz über Versuche: pass^k

Ein Modell, das eine Aufgabe neun von zehn Mal löst, scheitert trotzdem einmal von zehn, und Nutzer, die die Aufgabe wiederholen, treffen auf diese Fehler. Das τ-bench-Paper schlägt dafür eine Kennzahl vor:

> We also propose a new metric (pass^k) to evaluate the reliability of agent behavior over multiple trials.
>
> — [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045), arXiv

Sinngemäß: eine neue Kennzahl (pass^k), die die Zuverlässigkeit des Agentenverhaltens über mehrere Versuche bewertet. Grob ist pass^k die Wahrscheinlichkeit, dass ein Agent in allen k unabhängigen Versuchen derselben Aufgabe erfolgreich ist. Sie fällt mit wachsendem k schnell, wenn der Erfolg je Versuch unter 100 % liegt. Für eine Aufgabe, die Nutzer täglich ausführen, sagt ein hohes pass^5 mehr als eine hohe Erfolgsrate pro Einzellauf. Sie messen es offline, indem Sie jede Eval-Aufgabe mehrfach ausführen.

### Latenz

Die Zeit von der Anfrage bis zum brauchbaren Ergebnis als Perzentil (p50 und p95), nicht als Mittelwert. Teilen Sie sie in Modellzeit, Tool-Zeit und Warten auf Menschen auf, mit den Spans aus [Observability für Agenten](/de/posts/observability-for-agents/). Setzen Sie das SLO auf den Teil, den Sie kontrollieren. Gehört ein menschlicher Freigabeschritt zum Prozess, verfolgen Sie die **Zeit bis zur Freigabe** getrennt: Das ist ein fachliches SLO, das den Freigebenden gehört.

### Kosten pro Aufgabe

Tokens und Geld pro erledigter Aufgabe, als Perzentil. Ein Kosten-SLO verhindert eine stille Verschlechterung, bei der eine Prompt-Änderung die Ausgaben verdoppelt, und es fängt Endlosschleifen. Kosten pro erfolgreicher Aufgabe sind eine bessere Zahl als Kosten pro Lauf, denn ein billiger Lauf, der scheitert, ist nicht billig.

## Ein durchgerechnetes Beispiel

Angenommen, ein Triage-Agent versieht eingehende Tickets mit Labels und leitet sie weiter.

| SLI | Messung | SLO |
| --- | --- | --- |
| Aufgabenerfolg | Label stimmt mit einem stichprobenartigen menschlichen Label überein, 200 Tickets pro Woche | mindestens 90 % über 28 Tage |
| pass^5 | Offline-Suite mit 40 Aufgaben, je 5 Läufe, nächtlich | mindestens 70 % |
| p95-Latenz | Trace-Dauer ohne Wartezeit auf Freigaben | höchstens 120 s |
| Kosten pro Aufgabe | Token-Kosten aus Spans, p90 | höchstens 0,40 USD |

![Beispiel-SLO-Übersicht für einen Agentendienst](/images/blog/slos-for-agents-1.svg)

Die Zahlen sind beispielhaft; leiten Sie Ihre aus dem ab, was Nutzer brauchen und was das System heute leistet. Ein Ziel, das am ersten Tag unerreichbar ist, ist in Ordnung, wenn Sie den Abstand verfolgen, aber ein Ziel, das niemand prüft, ist Dekoration.

Eine kleine Definitionsdatei hält die Ziele neben dem Code:

```yaml
service: ticket-triage-agent
window: 28d
objectives:
  - name: task_success
    target: 0.90
    source: eval.sampled_review
  - name: latency_p95_seconds
    target: 120
    source: traces.agent_run.duration_excluding_approval
  - name: cost_per_task_p90_usd
    target: 0.40
    source: traces.cost
```

## Mit dem Error Budget entscheiden

Bei einem Erfolgs-SLO von 90 % über 28 Tage beträgt das Budget 10 % der Aufgaben. Verfolgen Sie, wie schnell es abbrennt:

- **Budget gesund.** Prompt-, Skill- und Modelländerungen im üblichen Tempo ausliefern, jeweils hinter ihren Evals.
- **Schnelles Abbrennen.** Langsamer werden. Zusätzliche Eval-Abdeckung verlangen, einen kleinen Anteil des Verkehrs als Canary laufen lassen und die SLIs beobachten, bevor man ausweitet.
- **Budget verbraucht.** Funktionsänderungen einfrieren. Nur Zuverlässigkeitskorrekturen werden ausgeliefert, bis sich das SLO erholt.

So wird aus einem vagen Streit („Ist das neue Modell gut genug?“) eine vorher vereinbarte Regel. Sie gibt auch einen Grund, riskante Änderungen abzulehnen, der nicht persönlich ist.

## Fallstricke

- **Nur messen, was leicht ist.** Latenz und Kosten sind leicht, Korrektheit ist schwer. Lassen Sie die leichten Zahlen sie nicht ersetzen.
- **Zu viele SLOs.** Drei bis fünf pro Dienst genügen. Mehr verwässert die Aufmerksamkeit.
- **Kleine Stichproben.** Bei 20 bewerteten Aufgaben pro Woche ist ein 90-%-Ziel überwiegend Rauschen. Geben Sie die Unsicherheit an oder verlängern Sie das Fenster.
- **Eval-Drift.** Evals, die sich nie ändern, bilden die Last nicht mehr ab. Erneuern Sie sie anhand echter Vorfälle.
- **Austricksen.** Können Agent oder Team den Grader ändern, ist der SLI wertlos. Halten Sie Grader unter Änderungskontrolle; siehe [Agent-Evals 101](/de/posts/agent-evals-101/).

## Das Wichtigste in Kürze

- Definieren Sie SLIs, SLOs und ein Error Budget für Agenten wie für andere Dienste.
- Nutzen Sie Aufgabenerfolg, pass^k, Latenz (mit getrennt geführter Zeit bis zur Freigabe) und Kosten pro Aufgabe als Kernindikatoren.
- Leiten Sie sie aus Eval-Ergebnissen, stichprobenartiger Prüfung und Traces ab.
- Lassen Sie das Error Budget das Rollout-Tempo steuern, nicht Meinungen.
- Achten Sie auf Stichprobengrößen, Drift und Grader, die sich austricksen lassen.

## Quellen

- Google: [Site Reliability Engineering, Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- arXiv: [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045)
- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
