---
ref: deploying-agent-changes-safely
lang: de
title: "Betriebsreihe: KI-Agenten ausrollen mit Canaries und Rollbacks"
description: "KI-Agenten ausrollen wie jeden Dienst: neues Modell, Prompt oder Skill zuerst an wenige Läufe, Evals und SLOs entscheiden, ein Rollback bleibt bereit."
date: 2026-08-27T09:00:00Z
tags: [operations, deployments, how-to]
---

Wer KI-Agenten sicher ausrollen will, behandelt jede Änderung an Modellversion, Prompt, Skill oder Werkzeug als Release: Sie geht zuerst an einen kleinen Anteil der Läufe (ein Canary), Evals und Service-Level-Ziele werden gegen die stabile Version verglichen, dann wird befördert oder zurückgerollt. Die Praxis stammt aus dem normalen Dienstbetrieb und lässt sich gut übertragen, mit einer Besonderheit: Die Qualität eines Agenten kann sinken, ohne dass ein einziger Fehler im Log steht. Ihr Canary muss daher Qualitätssignale beobachten, nicht nur die Verfügbarkeit. Dieser Beitrag aus unserer Betriebsreihe überträgt Canary-Releases und Rollback-Disziplin auf Agenten-Artefakte.

## Warum Agenten-Änderungen Release-Disziplin brauchen

Ein Agent ist mehr als Code. Sein Verhalten hängt von mehreren Artefakten ab, die sich unabhängig voneinander ändern:

- dem **Modell** und seiner Version (von Ihnen fixiert oder vom Anbieter geändert),
- dem **Systemprompt** und den Anweisungsdateien,
- **Skills** und ihren Skripten,
- **Tool-Definitionen** und den Diensten dahinter,
- **Richtlinien** und Budgets.

Jede Änderung kann Ergebnisse auf eine Weise verschieben, die Unit-Tests nicht erfassen. Auch Anbieter liefern Fehler aus. Anthropics Postmortem zum Spätsommer 2025 ist eine nützliche Erinnerung:

> Between August and early September, three infrastructure bugs intermittently degraded Claude's response quality.

Quelle: [A postmortem of three recent issues, Anthropic](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues). Sinngemäß: Zwischen August und Anfang September beeinträchtigten drei Infrastrukturfehler zeitweise die Antwortqualität. Beachten Sie das Wort *beeinträchtigt*: Die Qualität sank, ohne dass der Dienst ausgefallen wäre. Ist Ihr einziges Signal "Anfragen gelingen", sehen Sie das nicht. Enthält Ihr Release-Prozess Qualitätsprüfungen an einem kleinen Teil des Verkehrs, haben Sie eine Chance, es früh zu bemerken.

## Was zu versionieren und festzuschreiben ist

Bevor Sie zurückrollen können, müssen Sie wissen, wohin. Fixieren und erfassen Sie pro Lauf:

- die exakte Modellkennung (keinen Alias, der sich verschiebt),
- den Hash der Prompt- oder Anweisungsdatei,
- Skill- und Tool-Versionen (siehe [Versionierung von Agenten-Skills](/de/posts/versioning-agent-skills/)),
- die Richtlinienversion.

Fassen Sie diese in einem **Release-Manifest** zusammen, auf das ein Deployment verweist:

```yaml
release: support-triage@2026.08.27-1
model: model-x-2026-05-01        # pinned identifier, not "latest"
prompt: prompts/triage.md@3f9a1c2
skills:
  - runbook-lookup@1.4.2
tools:
  - tickets@2.1.0
policy: policies/support@7
rollout:
  canary_percent: 5
  min_runs: 200
  hold: 24h
```

Kann Ihr Anbieter ein Modell hinter einem Alias ändern, fixieren Sie datierte Kennungen, wo es sie gibt, und testen Sie erneut, wenn Sie wechseln.

## Der Canary-Ablauf

![Canary-Rollout für eine neue Agentenversion](/images/blog/deploying-agent-changes-safely-1.svg)

1. **Daneben ausrollen.** Die neue Version läuft neben der stabilen. Nichts wird ersetzt.
2. **Kleinen Anteil zuleiten.** Beginnen Sie mit etwa 5 Prozent der Läufe, ausgewählt über einen stabilen Schlüssel (zum Beispiel einen Hash der Lauf- oder Mandanten-ID), damit ein Mandant nicht mitten im Prozess zwischen Versionen wechselt. Schließen Sie Abläufe aus, bei denen ein falsches Ergebnis teuer ist, oder beschränken Sie den Canary zunächst auf lesende oder geprüfte Workflows.
3. **Auf genug Daten warten.** Agentenläufe sind langsam und schwanken. Legen Sie eine Mindestzahl an Läufen und eine Mindestzeit fest, etwa 200 Läufe und 24 Stunden, bevor Sie urteilen.
4. **Mit der stabilen Version vergleichen.** Dieselben Signale auf beiden Armen auswerten (siehe unten).
5. **Entscheiden.** In Stufen befördern (5, 25, 100 Prozent) oder zurückrollen. Entscheidung und Zahlen festhalten.

## Was zu vergleichen ist

Nutzen Sie Ihre [Service-Level-Ziele](/de/posts/slos-for-agents/) als primäres Gate. Das SRE-Buch von Google definiert den Begriff:

> An SLO is a service level objective: a target value or range of values for a service level that is measured by an SLI.

Quelle: [Site Reliability Engineering, Chapter 4: Service Level Objectives, Google](https://sre.google/sre-book/service-level-objectives/). Sinngemäß: Ein SLO ist ein Zielwert oder Wertebereich für ein Service-Level, das über einen SLI gemessen wird. Für Agenten eignen sich als Indikatoren (SLIs) unter anderem:

- **Erfolgsquote der Aufgaben,** gemessen durch eine automatische Prüfung oder eine stichprobenartige menschliche Durchsicht,
- **Richtlinien-Ablehnungen und Tool-Fehler** pro Lauf,
- **Kosten pro Lauf** und Token pro Lauf,
- **Latenz** bis zum Abschluss,
- **Eskalationsquote** an einen Menschen,
- **Eval-Score** auf einem festen Szenariensatz, vor dem Canary gegen beide Versionen ausgeführt und danach auf echtem Canary-Verkehr, wo sich Ergebnisse beurteilen lassen.

Legen Sie die Rollback-Regel vorab in Zahlen fest: "Zurückrollen, wenn die Erfolgsquote um mehr als 3 Punkte fällt, die Kosten pro Lauf um mehr als 25 Prozent steigen oder eine Sicherheits-Eval fehlschlägt". Regeln, die nach dem Blick auf die Daten entstehen, entschuldigen diese gern. Bei wenigen Läufen sind Unterschiede verrauscht; vergrößern Sie das Fenster, statt im Kaffeesatz zu lesen, und nennen Sie im Bericht, wie klein die Stichprobe war.

## Rollback-Disziplin

Ein Rollback ist nur schnell, wenn er vorbereitet wurde:

- **Ein Schalter.** Den Verkehr auf das stabile Manifest zurückzulegen, ist eine Konfigurationsänderung, kein Neubau.
- **Die vorherige Version deploybar halten,** für einen festgelegten Zeitraum nach der Beförderung.
- **Zustand beachten.** Hat die neue Version Daten (Memory-Dateien, Tickets, Datensätze) in neuem Format geschrieben, muss ein Rollback sie lesen können, oder die Migration muss umkehrbar sein. Nutzen Sie bei Schemas Expand-and-Contract-Änderungen.
- **Laufende Läufe zu Ende bringen.** Laufende Sitzungen auf ihrer Version beenden oder sauber neu starten; wechseln Sie Versionen nicht mitten im Lauf, außer die Übergabe ist dafür ausgelegt.
- **Üben.** Rollen Sie regelmäßig in einer Testumgebung zurück, damit der erste echte Versuch nicht der erste Versuch ist.

Koppeln Sie das Rollback mit einer Vorfallnotiz: was sich geändert hat, welches Signal ausgelöst hat, wie lange es bis zu sicherem Verkehr dauerte. Mit der Zeit zeigen diese Notizen, welche Signale fehlen.

## Änderungen jenseits des Modells

Prompt- und Skill-Änderungen sind ebenfalls Releases und oft riskanter, weil sie klein wirken. Eine Zeile in einer Anweisung kann das Verhalten über alle Workflows verschieben. Führen Sie sie durch denselben Ablauf, mit Eval-Läufen in der CI und einem Canary in der Produktion. Ihr Prozess für [Änderungsmanagement bei Agenten](/de/posts/change-management-for-agents/) sollte regeln, wer welche Änderungsklasse genehmigt; der Canary ist der letzte Schritt vor dem vollen Rollout, kein Ersatz für die Prüfung.

Das Secure Software Development Framework des NIST beschreibt die Praktiken, auf denen das aufbaut:

> a core set of high-level secure software development practices that can be integrated into each SDLC implementation.

Quelle: [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1, NIST](https://csrc.nist.gov/pubs/sp/800/218/final). Sinngemäß: ein Kernsatz übergeordneter Praktiken für sichere Softwareentwicklung, der sich in jeden Entwicklungsprozess integrieren lässt. Seine Praktiken (Änderungen prüfen, vor dem Release testen, auf Schwachstellen vorbereitet sein) gelten für die Artefakte eines Agenten wie für Anwendungscode.

## Grenzen

- Ein Canary von wenigen Prozent kann seltene Fehler übersehen. Kombinieren Sie ihn mit Offline-Evals, die bekannte Randfälle abdecken.
- Qualitätsmetriken, bei denen ein Modell ein Modell bewertet, können gemeinsam driften; kalibrieren Sie sie an menschlichen Stichproben.
- Manche Änderungen lassen sich nicht nach Verkehr aufteilen, etwa eine Richtlinie, die für einen ganzen Mandanten gilt. Nutzen Sie stattdessen Stufen je Mandant oder Umgebung.
- Änderungen auf Anbieterseite geschehen außerhalb Ihres Release-Prozesses. Lassen Sie Qualitätsprüfungen in der Produktion laufend mitlaufen, nicht nur beim Deployment.

## Das Wichtigste in Kürze

- Änderungen an Modell, Prompt, Skill, Werkzeug und Richtlinie als Releases mit Manifest und fixierten Versionen behandeln.
- Zuerst etwa 5 Prozent der Läufe an die neue Version leiten und auf genug Läufe warten, bevor geurteilt wird.
- Mit SLOs und Evals entscheiden, Rollback-Schwellen vorher aufschreiben.
- Rollback vorbereiten: ein Schalter, vorherige Version behalten, kompatible Zustandsformate, regelmäßig üben.
- Nach dem vollen Rollout die Qualität weiter beobachten; Verschlechterung kann ohne ein Deployment Ihrerseits kommen.

## Quellen

- [A postmortem of three recent issues (Anthropic, 2025-09-17)](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues)
- [Site Reliability Engineering, Chapter 4: Service Level Objectives (Google)](https://sre.google/sre-book/service-level-objectives/)
- [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1 (NIST, 2022-02-03)](https://csrc.nist.gov/pubs/sp/800/218/final)
