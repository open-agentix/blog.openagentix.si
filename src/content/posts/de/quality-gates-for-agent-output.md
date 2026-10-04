---
ref: quality-gates-for-agent-output
lang: de
title: "Qualitätsschranken für Agenten-Ergebnisse: eine Prüfliste gegen Ausschuss"
description: "AI code quality gates lassen Maschinen aussortieren, was Menschen nie lesen sollten. Prüfliste vor dem Review: Tests, Evals, Größenlimits, Policy, Herkunft."
date: 2026-05-14T09:00:00Z
tags: [quality, evaluation, checklist]
---

Quality Gates für KI-generierten Code sind automatische Prüfungen, die Agenten-Ergebnisse bestehen müssen, bevor ein Mensch sie ansieht. Es geht um Kapazität: Agenten erzeugen Änderungen schneller, als Menschen sie prüfen können, und Review-Zeit ist die knappe Ressource. Maschinen sollen deshalb aussortieren, was ein Mensch nie lesen müsste. Dieser Beitrag ist eine Prüfliste solcher Schranken in der Reihenfolge, in der sie laufen sollten, mit dem, was jede findet und was nicht.

## Von der knappen Ressource ausgehen

Eröffnet ein Agent zehn Pull Requests am Tag, ist nicht die Erzeugung der Engpass, sondern die Aufmerksamkeit. Geht jedes Ergebnis direkt an einen Reviewer, passiert eines von zwei Dingen: Die Warteschlange wächst, bis nichts mehr sorgfältig geprüft wird, oder Reviewer winken auf Vertrauen durch. Beides führt zu dem, was dieser Blog „Slop“ nennt: Ergebnisse, die plausibel wirken und unterschwellig falsch oder überflüssig sind. Die Idee steht in [Prompt-Wildwuchs und KI-Slop](/de/posts/prompt-sprawl-and-ai-slop/).

Ein Branchenbericht von 2025 macht einen verwandten Punkt zu Werkzeugen allgemein:

> AI doesn't fix a team; it amplifies what's already there.
>
> — Google Cloud, [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)

Sinngemäß: KI repariert kein Team, sie verstärkt, was schon da ist. Teams mit schnellen Tests, kleinen Änderungen und klarer Verantwortung gewinnen mehr durch Agenten. Teams ohne diese bekommen mehr vom Gleichen, nur schneller. Quality Gates sind der Weg, das erste Team bewusst aufzubauen.

![Trichter automatischer Schranken vor dem menschlichen Review](/images/blog/quality-gates-for-agent-output-1.svg)

## Die Prüfliste in der richtigen Reihenfolge

Ordnen Sie die Schranken von billig und eindeutig zu teuer und unscharf. Scheitern Sie früh, und geben Sie jeder Ablehnung einen Grund mit, auf den der Agent reagieren kann.

### 1. Baut es, und laufen die Tests durch?

Die billigste Schranke ist auch das stärkste Signal. Führen Sie Build, Linter, Typprüfung und Unit-Tests des Projekts aus. Verlangen Sie, dass neues Verhalten neue Tests mitbringt und dass bestehende Tests nicht gelöscht oder aufgeweicht wurden, um grün zu werden. Eine einfache Regel fängt einen häufigen Fehler: Ein Diff, der Assertions entfernt oder Skip-Markierungen hinzufügt, wird automatisch abgelehnt.

### 2. Besteht die Eval-Suite?

Tests prüfen Code. Evals prüfen Verhalten, besonders wo die Ausgabe nicht deterministisch ist. Anthropics Leitfaden zu Agenten-Evals definiert das zentrale Stück:

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Sinngemäß: Ein Grader ist Logik, die einen Aspekt der Leistung des Agenten bewertet. Bevorzugen Sie Grader, die Ergebnisse in der Umgebung prüfen, statt das Transkript zu lesen. Derselbe Artikel zeigt das Muster an einem Buchungsbeispiel:

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Dass der Agent „gebucht“ sagt, ist nicht das Ergebnis; die Zeile in der Datenbank ist es. Für Codeänderungen zeigen öffentliche Benchmarks, wie weit diese Idee reicht: SWE-bench baut Aufgaben aus echten Repositories und prüft sie mit Tests.

> We find real-world software engineering to be a rich, sustainable, and challenging testbed for evaluating the next generation of language models.
>
> — [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770), arXiv

Sie brauchen keinen öffentlichen Benchmark. Ein Satz von 20 bis 50 repräsentativen Aufgaben aus Ihren eigenen Repositories, der bei jeder Änderung an Prompts, Skills oder Modellen läuft, ist ein guter Anfang. Siehe [Agent-Evals 101](/de/posts/agent-evals-101/).

### 3. Ist die Änderung klein genug für ein Review?

Setzen Sie ein Größenlimit und lehnen Sie größere Änderungen mit der Anweisung ab, sie aufzuteilen. Eine Grenze wie „höchstens 400 geänderte Zeilen, höchstens 10 Dateien“ ist willkürlich, aber nützlich, denn die Review-Qualität sinkt mit der Größe stark. Das stützt auch die Gewohnheit aus [kleine geprüfte Schritte](/de/posts/small-verified-steps/): Der Agent arbeitet in Schritten, die sich einzeln prüfen lassen.

### 4. Besteht es die Policy-Prüfungen?

Policy-Schranken schauen darauf, was die Änderung berührt, nicht ob sie funktioniert:

- Dateien und Pfade, die der Agent nicht ändern darf (CI-Konfiguration, Lockfiles, Secrets, Lizenzdateien).
- Neue Abhängigkeiten, die eine eigene Freigabe sowie eine Lizenz- und Schwachstellenprüfung brauchen.
- Secret-Scanning des Diffs.
- Generierte oder mitgelieferte Dateien, die nicht von Hand bearbeitet werden sollen.

### 5. Ist die Herkunft festgehalten?

Hängen Sie an jede Änderung die Run-ID, die Versionen von Agent und Skill, das Modell und die auslösende Aufgabe. Geht in der Produktion etwas schief, muss „welcher Agent hat das mit welchen Anweisungen erzeugt?“ beantwortbar sein. Die Herkunft hilft Reviewern auch einzuschätzen, wie viel Aufmerksamkeit eine Änderung braucht.

### 6. Erst dann prüft ein Mensch

Was bei einem Menschen ankommt, hat bereits gebaut, Tests und Evals bestanden, Größen- und Policy-Grenzen eingehalten und trägt seine Geschichte mit sich. Die Reviewer können ihre Zeit auf Entwurf, Absicht und Risiko verwenden, was nur Menschen beurteilen können. Menschen verantworten auch Entscheidungen bei folgenreichen Änderungen; Schranken verringern die Arbeit und ersetzen nicht die Verantwortung.

Eine minimale CI-Skizze für die ersten Schranken:

```yaml
jobs:
  agent-gates:
    steps:
      - run: make build lint typecheck test
      - run: ./scripts/check-no-removed-tests.sh origin/main
      - run: ./scripts/run-evals.sh --suite smoke --min-pass 0.9
      - run: ./scripts/check-diff-size.sh --max-lines 400 --max-files 10
      - run: ./scripts/check-protected-paths.sh origin/main
```

## Schranken justieren, nicht nur hinzufügen

Jede Schranke hat eine Rate falsch positiver und falsch negativer Ergebnisse. Messen Sie sie:

- **Ablehnungsgründe je Schranke.** Lehnt eine Schranke fast alles ab, brauchen entweder die Agentenanweisungen oder die Schranke Arbeit.
- **Durchgerutschtes.** Fehler, die nach dem Review gefunden werden, zeigen, welche Schranke fehlte. Fügen Sie eine hinzu.
- **Review-Zeit pro Änderung.** Sie sollte mit reifenden Schranken sinken.
- **Instabile Prüfungen.** Eine Schranke, die zufällig scheitert, bringt Menschen bei, sie zu ignorieren. Reparieren oder entfernen.

Eine Schranke zu ändern ist selbst eine Änderung, die Sorgfalt verdient; [Änderungsmanagement für Agenten](/de/posts/change-management-for-agents/) beschreibt, wie man neue Anweisungen, Skills und Prüfungen sicher ausrollt.

## Was Schranken nicht leisten

Schranken fangen, was sich spezifizieren lässt. Sie sagen nicht, dass das Feature das falsche ist, dass der Entwurf umständlich ist oder dass ein Test aus dem falschen Grund besteht. Evals lassen sich austricksen oder veralten. Eine grüne Pipeline senkt die Kosten des Reviews, beseitigt aber nicht die Notwendigkeit.

## Das Wichtigste in Kürze

- Review-Kapazität ist die knappe Ressource; lassen Sie automatische Schranken aussortieren, was Menschen nicht lesen sollten.
- Ordnen Sie Schranken von billig und eindeutig (Build, Tests) über unscharf (Evals) bis zu Policy, Größe und Herkunft.
- Bewerten Sie Ergebnisse in der Umgebung, nicht das, was der Agent über sein Tun sagt.
- Lehnen Sie gelöschte Tests, übergroße Diffs und Änderungen an geschützten Pfaden automatisch ab.
- Messen Sie Ablehnungen und Durchgerutschtes und justieren Sie die Schranken laufend.

## Quellen

- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- Google Cloud: [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
- arXiv: [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770)
