---
ref: versioning-agent-skills
lang: de
title: "Agent-Skills versionieren wie jede andere Abhängigkeit"
description: "Skill versioning behandelt Agent-Skills wie Abhängigkeiten: SemVer, Changelog, Pinning und Evals für Upgrades. Was in Anweisungen als Breaking Change gilt."
date: 2026-05-26T09:00:00Z
tags: [skills, change-management, how-to]
---

Skill-Versionierung heißt, jedem Agent-Skill eine Versionsnummer, einen Changelog und eine festgeschriebene Referenz zu geben und Upgrades zu testen, bevor sie die Produktion erreichen. Ein Skill verändert das Verhalten eines Agenten so sicher wie Code und verdient dieselbe Disziplin wie eine Bibliothek: Semantic Versions, die sagen, was zu erwarten ist, Pins gegen überraschende Updates und Evals, die zeigen, ob eine neue Version besser oder nur anders ist. Dieser Beitrag wendet Semantic Versioning auf Skills an, definiert, was in Anweisungen eine Breaking Change ist, und zeigt, wie Evals Upgrades absichern.

## Warum Skills Versionen brauchen

Anthropic beschreibt Skills in einem Satz:

> Skills are folders that include instructions, scripts, and resources that Claude can load when needed.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Sinngemäß: Skills sind Ordner mit Anweisungen, Skripten und Ressourcen, die Claude bei Bedarf laden kann. Ein Ordner aus Anweisungen, Skripten und Ressourcen ist ein Paket. Pakete werden aktualisiert, zwischen Teams kopiert und von anderen übernommen. Dieselbe Ankündigung betont, dass das Format wandern soll:

> Portable: Skills use the same format everywhere.
>
> — Anthropic, [Introducing Agent Skills](https://www.anthropic.com/news/skills)

Portabilität ist ein Vorzug und erzeugt ein Abhängigkeitsproblem. Kopieren drei Teams einen Skill und ändert ihn jedes, weiß niemand, welches Verhalten wo läuft. Wird ein Skill an Ort und Stelle aktualisiert, verhält sich ein Agent, der gestern funktionierte, heute anders, ohne Aufzeichnung, was sich geändert hat. Versionen beantworten beides: „welcher Skill, welche Version, welches Verhalten“.

Zum Aufbau eines Skills siehe [Anatomie eines Agent-Skills](/de/posts/anatomy-of-an-agent-skill/). Zum Lieferkettenrisiko bei Skills, die Sie nicht selbst geschrieben haben, siehe [Drittanbieter-Skills als Lieferkette](/de/posts/third-party-skills-supply-chain/).

## Semantic Versioning auf Skills anwenden

Semantic Versioning hat für die Major-Nummer eine kurze Kernregel:

> MAJOR version when you make incompatible API changes
>
> — [Semantic Versioning 2.0.0](https://semver.org/)

Sinngemäß: MAJOR erhöhen, wenn inkompatible API-Änderungen vorgenommen werden. Das volle Schema ist `MAJOR.MINOR.PATCH`: Major für inkompatible Änderungen, Minor für abwärtskompatible Ergänzungen, Patch für abwärtskompatible Korrekturen. Ein Skill hat eine Schnittstelle, obwohl er in Prosa geschrieben ist. Auf sie verlassen sich Aufrufer und die Agenten drumherum: welche Eingaben er erwartet, was er ausgibt, welche Tools er nutzen darf und wie er sich in den abgedeckten Fällen verhält.

![Semantic Versioning, angewandt auf einen Agent-Skill](/images/blog/versioning-agent-skills-1.svg)

## Was in Anweisungen eine Breaking Change ist

Prosa ist unscharf, also schreiben Sie Ihre Regeln auf. Ein brauchbarer Satz:

**Major (inkompatibel):**

- Eine neue Pflichteingabe oder eine entfernte oder umbenannte Eingabe.
- Ein geändertes Ausgabeformat, das nachgelagerte Agenten oder Code auswerten.
- Eine neue oder entfernte Tool-Anforderung oder eine Änderung der Berechtigungen, die der Skill braucht.
- Ein geändertes Standardverhalten in einem abgedeckten Fall, etwa wenn aus „vor dem Löschen fragen“ ein „löschen“ wird.
- Eine Änderung des Geltungsbereichs: Der Skill behandelt jetzt andere Situationen als zuvor.

**Minor (kompatible Ergänzung):**

- Ein neuer optionaler Schritt, ein Beispiel oder eine Referenzdatei.
- Unterstützung für einen zusätzlichen Fall, den es vorher nicht gab.
- Eine neue optionale Eingabe mit sicherem Standardwert.

**Patch (kompatible Korrektur):**

- Tippfehler, klarere Formulierungen, bessere Beispiele, die das getestete Verhalten nicht ändern.
- Die Korrektur eines Skriptfehlers, bei dem das dokumentierte Verhalten schon die Absicht war.

Im Zweifel gilt der größere Sprung. Ein umformulierter Absatz kann das Verhalten ändern, und nur Evals zeigen, ob er es tat.

## Die Version dort ablegen, wo man sie lesen kann

Halten Sie Metadaten im Front Matter oder Manifest des Skills und führen Sie daneben einen Changelog:

```yaml
---
name: ticket-triage
version: 1.1.0
description: Label and route incoming support tickets.
requires-tools: [tickets.read, crm.read]
---
```

```markdown
## 1.1.0 - 2026-05-12
### Added
- Optional step: check the runbook for known incidents.

## 1.0.1 - 2026-04-20
### Fixed
- Clarified the escalation rule for payment-related tickets.
```

Taggen Sie Releases in der Versionskontrolle und veröffentlichen Sie sie unveränderlich. Eine Versionsnummer, die sich stillschweigend umschreiben lässt, ist nichts wert.

## Festschreiben, wovon man abhängt

Agenten und Workflows sollten einen Skill über eine exakte Version oder einen Inhalts-Hash referenzieren, nicht über „latest“:

```yaml
skills:
  - name: ticket-triage
    version: 1.1.0
    sha256: "<digest of the skill folder>"
```

Pinning bringt drei Dinge. Reproduzierbarkeit: Sie können eine alte Aufgabe mit dem alten Skill erneut ausführen. Prüfbarkeit: Ein Upgrade ist eine sichtbare Änderung in einem Pull Request. Sicherheit: Ein kompromittiertes oder nachlässiges Upstream-Update erreicht die Produktion nicht von allein. Bereiche wie „jede 1.x“ gehören nur in die Entwicklung.

## Evals das Upgrade absichern lassen

Versionsnummern sind ein Versprechen; Evals prüfen, ob es gehalten wurde. Bevor Sie von 1.1.0 auf eine neue Version wechseln, führen Sie dieselbe Eval-Suite gegen beide aus und vergleichen. Anthropics Leitfaden zu Agenten-Evals liefert das Vokabular: Ein Grader bewertet einen Teil der Leistung des Agenten, und die besten Grader prüfen das Ergebnis in der Umgebung.

> A grader is logic that scores some aspect of the agent’s performance.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

> the outcome is whether a reservation exists in the environment’s SQL database.
>
> — Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Sinngemäß: Ein Grader ist Logik, die einen Aspekt der Leistung bewertet, und das Ergebnis ist, ob in der SQL-Datenbank der Umgebung eine Reservierung existiert. Eine Upgrade-Regel, die sich in der Praxis bewährt:

1. **Patch.** Smoke-Suite ausführen. Sind die Ergebnisse im Rahmen des Rauschens gleich, upgraden.
2. **Minor.** Volle Suite ausführen und prüfen, dass alte Fälle nicht schlechter wurden. Den Diff durchsehen.
3. **Major.** Als Migration behandeln. Aufrufer anpassen, die Evals neu festlegen, zuerst an einem kleinen Anteil der Läufe ausrollen und die alte Version für den Rückweg bereithalten.

Widersprechen die Evals der Versionsnummer, gewinnen die Evals: Ein „Patch“, der die Suite nicht besteht, ist eine Major-Änderung und sollte als solche veröffentlicht werden. Den weiteren Prozess rund um Freigaben, Rollouts und Rückweg beschreibt [Änderungsmanagement für Agenten](/de/posts/change-management-for-agents/).

## Grenzen

Semantic Versioning wurde für Code mit maschinell prüfbaren Schnittstellen entworfen. Skills interpretiert ein Modell, also ist Kompatibilität statistisch: Ein Minor-Release kann das Verhalten bei seltenen Eingaben ändern. Auch das Modell darunter ändert sich und kann das Verhalten eines unveränderten Skills verschieben; halten Sie deshalb die Modellversion neben der Skill-Version in den Metadaten jedes Laufs fest. Verstehen Sie die Versionsnummer als Kommunikationsmittel mit Tests dahinter, nicht als Garantie.

## Das Wichtigste in Kürze

- Ein Skill ist ein Paket aus Anweisungen, Skripten und Ressourcen; versionieren Sie ihn wie eine Abhängigkeit.
- Nutzen Sie MAJOR.MINOR.PATCH und legen Sie schriftlich fest, was bei Anweisungen inkompatibel ist: Eingaben, Ausgaben, Tools, Standardwerte und Geltungsbereich.
- Führen Sie einen Changelog und veröffentlichen Sie unveränderliche Releases.
- Schreiben Sie in Agenten und Workflows exakte Versionen oder Hashes fest; Bereiche nur in der Entwicklung.
- Führen Sie Evals auf alter und neuer Version aus, bevor Sie upgraden, und lassen Sie die Ergebnisse das Versionslabel überstimmen.

## Quellen

- Semantic Versioning: [Semantic Versioning 2.0.0](https://semver.org/)
- Anthropic: [Introducing Agent Skills](https://www.anthropic.com/news/skills)
- Anthropic: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
