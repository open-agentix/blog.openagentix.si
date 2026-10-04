---
ref: change-management-for-agents
lang: de
title: "Betriebsreihe: Change-Management und Prompt-Versionierung für Agenten"
description: "Prompt-Versionierung und Change-Management für KI-Agenten: Prompts, Skills und Policies wie Code behandeln, mit SemVer, Review und Rollback."
date: 2026-04-23T09:00:00Z
tags: [operations, change-management, governance]
---

**Prompt-Versionierung** ist der erste Schritt des Change-Managements für KI-Agenten. Ein geänderter Prompt, Skill
oder eine geänderte Policy verändert das Verhalten in Produktion genau wie eine Codeänderung. Deshalb braucht sie eine
Versionsnummer, eine Prüfung und einen Rollback-Pfad. Dieser Beitrag gehört zur Betriebsreihe, die mit [Agent-Betrieb
ist einfach Betrieb](/de/posts/agent-ops-is-just-ops/) beginnt, und wendet Semantic Versioning und sichere
Entwicklungspraxis auf die Artefakte an, die Agenten steuern.

## Was als Änderung zählt

Teams verfolgen Codeänderungen sorgfältig und behandeln „nur eine Prompt-Korrektur“ nebenbei. Alles, was ändert,
was ein Agent tut, gehört unter Änderungskontrolle:

- **Prompts und Anweisungen**: Systemprompts, Rollenbeschreibungen, Ausgabeformate.
- **Skills**: die Anweisungsordner und Skripte, die ein Agent bei Bedarf lädt; siehe [Aufbau eines
  Agent-Skills](/de/posts/anatomy-of-an-agent-skill/).
- **Tool-Definitionen**: Namen, Beschreibungen und Argumentschemas.
- **Policies**: welche Tools, Argumente, Identitäten und Budgets erlaubt sind; siehe [Policy entscheidet, Audit
  beweist](/de/posts/policy-decides-audit-proves/).
- **Modell- und Parameterwahl**: Modellversion, Temperatur, Token-Limits.

Eine Ein-Wort-Änderung in einer Tool-Beschreibung kann ändern, welches Tool das Modell wählt. Behandeln Sie sie
als Release.

## Versionieren mit SemVer, angepasst

Semantic Versioning wurde für APIs geschrieben, und Agenten-Artefakte sind ebenfalls Schnittstellen: Aufrufer
(Menschen, Pipelines, andere Agenten) hängen von ihrem Verhalten ab. Die Kernregel von SemVer lässt sich gut übertragen
(Zitat im englischen Original):

> MAJOR version when you make incompatible API changes
>
> [Semantic Versioning 2.0.0](https://semver.org/) (semver.org)

Sinngemäß: Die MAJOR-Version erhöht man bei inkompatiblen API-Änderungen. Eine brauchbare Zuordnung für
Agenten-Artefakte:

| Stufe | Wann | Beispiel |
| --- | --- | --- |
| MAJOR | Ausgabeformat, Tool-Namen oder Pflichteingaben ändern sich so, dass Aufrufer anpassen müssen | Umbenennung eines Felds im strukturierten Ergebnis |
| MINOR | Neue Fähigkeit, die bestehende Aufrufer ignorieren können | Ein neues optionales Tool oder ein neuer Abschnitt in einem Skill |
| PATCH | Formulierungskorrekturen, die das Verhalten nicht ändern dürfen | Tippfehler, klarere Beispiele |

Seien Sie ehrlich über die Grenze: Bei natürlichsprachlichen Anweisungen ist die Linie zwischen PATCH und MINOR
unscharf, weil schon eine Formulierung das Verhalten verschieben kann. Genau deshalb ist die Eval-Suite das
eigentliche Sicherheitsnetz, nicht die Versionsnummer. Die Nummer sagt Nutzern, was sie erwarten dürfen; die Evals
sagen Ihnen, ob es stimmt.

## Eine Änderungs-Pipeline

![Änderungs-Pipeline für Prompts, Skills und Policies von Agenten](/images/blog/change-management-for-agents-1.svg)

1. **Im Branch bearbeiten.** Prompts, Skills und Policies liegen im Repository, nicht in einem Webformular.
2. **Pull Request öffnen.** Eine Reviewerin liest den Diff und die genannte Absicht. Bei Policy-Änderungen
   genehmigt eine Person mit Verantwortung für die betroffenen Systeme.
3. **Eval-Suite laufen lassen.** Die Änderung darf bestehende Aufgaben nicht verschlechtern. Ergänzen oder
   ändern Sie Aufgaben, wenn sich das beabsichtigte Verhalten ändert. Das Vokabular steht in [Agent-Evals
   101](/de/posts/agent-evals-101/).
4. **Versionierten Release erstellen.** Taggen, Changelog aktualisieren und festhalten, gegen welches Modell
   getestet wurde.
5. **Rollback-Tag behalten.** Der vorherige Release bleibt auslieferbar. Rollback heißt, ein Tag neu auszurollen,
   nicht unter Druck Text zu ändern.

## Sichere Entwicklung gilt auch für Agenten-Artefakte

NISTs Secure Software Development Framework beschreibt die Idee hinter einer solchen Pipeline:

> a core set of high-level secure software development practices that can be integrated into each SDLC implementation.
>
> [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) (NIST, 2022)

Sinngemäß: ein Kernsatz übergeordneter Praktiken sicherer Softwareentwicklung, der sich in jede
Entwicklungsprozess-Umsetzung einbauen lässt. Lesen Sie es als Aufforderung, wiederzuverwenden, was Ihre
Organisation für Software ohnehin tut: Code-Review, geschützte Branches, signierte oder fixierte Abhängigkeiten,
Herkunftsnachweise, Schwachstellenmanagement. Prompts und Skills von Dritten sind Abhängigkeiten und verdienen
dieselbe Sorgfalt wie Bibliotheken. Änderungen an einer Policy-Datei verdienen mehr, denn eine gelockerte Policy
erweitert, was jeder Agent darf.

Eine Prüfliste für den Review, die auf einen Bildschirm passt:

```text
[ ] Welches Verhalten soll sich ändern? Steht es im PR?
[ ] Welche Tools, Daten und Identitäten berührt die Änderung?
[ ] Erweitert die Änderung eine Berechtigung? (Braucht eine zusätzliche Genehmigung.)
[ ] Lief die Eval-Suite, und wurden Aufgaben für das neue Verhalten ergänzt?
[ ] Ist die Version erhöht und das Changelog aktualisiert?
[ ] Ist das Rollback-Ziel benannt und noch auslieferbar?
```

## Warum Qualität ohne eigene Änderung driften kann

Change-Management umfasst auch Änderungen, die Sie nicht gemacht haben. Modellanbieter aktualisieren Modelle und
Infrastruktur. Anthropics öffentliche Nachbetrachtung eines Störungszeitraums beginnt so:

> Between August and early September, three infrastructure bugs intermittently degraded Claude's response quality.
>
> [A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues) (Anthropic, 2025)

Sinngemäß: Zwischen August und Anfang September verschlechterten drei Infrastrukturfehler zeitweise die
Antwortqualität. Die Lehre betrifft nicht nur einen Anbieter. Jede Komponente, von der Sie abhängen, kann ihr
Verhalten unter Ihnen verschieben. Fixieren Sie Modellversionen, wo der Anbieter es erlaubt, halten Sie die
Modellkennung bei jedem Lauf fest, führen Sie Ihre Evals nach Zeitplan aus und nicht nur bei eigenen Änderungen,
und alarmieren Sie, wenn Scores sich bewegen. Ein Einbruch ohne Änderung in Ihrem Repository weist auf etwas
außerhalb hin.

## Rollout und Rollback in der Praxis

- **Canary**: Leiten Sie zuerst einen kleinen Anteil der Läufe oder einen risikoarmen Workflow auf die neue Version.
- **Feature-Flags für Verhalten**: Schalten Sie einen neuen Skill pro Agent ein statt für alle.
- **Version im Audit-Trail festhalten**: Jeder Lauf sollte sagen, welche Versionen von Prompt, Skill, Policy und
  Modell aktiv waren, damit sich ein Vorfall einem Release zuordnen lässt.
- **Rollback-Auslöser vorab festlegen**: etwa Eval-Erfolgsrate unter einem Schwellwert oder ein Alarm auf die Rate
  abgelehnter Aufrufe.
- **Den Rollback üben.** Ein Rollback, der nie ausgeführt wurde, ist eine Hoffnung, kein Plan.

## Grenzen

Versionierung macht Verhalten nicht deterministisch, und Evals decken nur die Aufgaben ab, die Sie geschrieben
haben. Eine kleine Suite wiegt in falscher Sicherheit. Lassen Sie sie aus echten Vorfällen wachsen und halten Sie
bei folgenreichen Änderungen Menschen in der Schleife.

## Das Wichtigste in Kürze

- Prompts, Skills, Tool-Definitionen und Policies sind Produktionsartefakte und brauchen Änderungskontrolle.
- SemVer-artige Versionen sagen Nutzern, was sie erwarten dürfen; Evals prüfen, ob es stimmt.
- Pull Request, Review, Eval-Suite, versionierter Release und ein benannter Rollback-Tag sind die Mindest-Pipeline.
- Prompts und Skills von Dritten sind Abhängigkeiten; das Lockern einer Policy ist die riskanteste Änderung.
- Versionen im Audit-Trail festhalten und Evals regelmäßig neu laufen lassen, weil Verhalten ohne Ihre Änderung driften kann.

## Quellen

- [Semantic Versioning 2.0.0](https://semver.org/), semver.org.
- [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), NIST, 03.02.2022.
- [A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues), Anthropic, 17.09.2025.
