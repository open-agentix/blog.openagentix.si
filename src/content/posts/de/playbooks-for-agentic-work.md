---
ref: playbooks-for-agentic-work
lang: de
title: "Wofür braucht man in der Agentenarbeit ein Playbook?"
description: "Ein Playbook lässt eine wiederkehrende Agentenaufgabe jedes Mal gleich ablaufen: feste Schritte, typisierte Übergaben, Prüfungen und Stoppregeln. Abgrenzung zu AGENTS.md, Skills und Runbooks."
date: 2026-10-15T07:00:00+02:00
tags: [skills, operations, how-to]
---

Ein Playbook ist für Aufgaben da, die immer wieder anfallen und jedes Mal gleich erledigt werden sollen.
In der Agentenarbeit ist es das geschriebene, versionierte Verfahren, das die Reihenfolge der Schritte
festlegt, sagt, welche Schritte einfacher Code sind und welche das Urteil eines Modells brauchen, festlegt,
was jeder Schritt an den nächsten übergibt, und die Prüfungen und Abbruchbedingungen benennt. Ohne
Playbook plant das Modell eine wiederkehrende Aufgabe bei jedem Lauf neu, und jeder Lauf fällt ein wenig
anders aus. Mit Playbook bleibt die Freiheit des Modells auf die Schritte beschränkt, die sie wirklich
brauchen.

Dieser Beitrag erklärt, was ein Playbook enthält, wie es sich von Projektkontext-Dateien, Skills und
Runbooks unterscheidet und wie sich die Idee auf `agents.md`-Pipelines in openagentix abbilden lässt.

## Welches Problem ein Playbook löst

Agenten sind gut in offenen Aufgaben: „Finde heraus, warum der Build fehlschlägt.“ Viele Aufgaben im Team
sind aber nicht offen: einen Schwachstellenfund einordnen, Release Notes vorbereiten, ein Backup prüfen,
eine Standardanfrage beantworten. Diese Aufgaben haben eine bekannte Form. Leitet ein Agent diese Form bei
jedem Lauf neu her, passieren drei Dinge:

- **Streuung.** Zwei Läufe mit derselben Eingabe nehmen verschiedene Wege, rufen verschiedene Tools auf und
  liefern unterschiedlich aufgebaute Ergebnisse. Nachgelagerte Schritte und Menschen müssen damit umgehen.
- **Kosten.** Tokens fließen in einen Plan, der schon bekannt war. Schleifen und Wiederholungen kommen
  hinzu.
- **Schwache Prüfungen.** Sind die Schritte nicht festgelegt, lässt sich vorab kaum sagen, wie „fertig“
  aussieht; Prüfungen werden vage („sieht gut aus“).

Ein Playbook nimmt dem Modell den bekannten Teil ab. Das ist dieselbe Idee wie in [Workflows oder
Agenten?](/de/posts/workflows-vs-agents/): Wählen Sie für jeden Schritt so wenig Autonomie wie möglich.

## Was ein Playbook enthält

![Ein Playbook als feste Schritte mit typisierten Übergaben, einem Urteilsschritt, einer Prüfung und einer Stoppregel](/images/blog/playbooks-for-agentic-work-1.svg)

Ein brauchbares Playbook beantwortet sechs Fragen:

1. **Auslöser und Eingabe.** Was startet es, und welche Daten erhält es? Am besten ein Schema, keine Prosa.
2. **Schritte in Reihenfolge.** Für jeden Schritt: Ist er deterministisch (ein Skript, eine Abfrage, ein
   fester Tool-Aufruf) oder ein Urteilsschritt (zusammenfassen, einordnen, entwerfen)?
3. **Übergaben.** Was genau jeder Schritt weitergibt, in einer Struktur, die der nächste Schritt prüfen
   kann.
4. **Berechtigungen je Schritt.** Welche Tools ein Schritt aufrufen darf, nur lesend oder schreibend, und
   welche eine Freigabe brauchen.
5. **Prüfungen.** Wie jeder Schritt und der ganze Lauf geprüft werden: Tests, Schemavalidierung, ein
   Health-Check, ein Diff, der außerhalb eines erlaubten Pfads leer sein muss.
6. **Stoppen und eskalieren.** Wann der Lauf anhalten und an einen Menschen übergeben muss und was er dabei
   hinterlässt (die Belege, nicht nur „fehlgeschlagen“).

Budgets gehören ebenfalls dazu: eine Höchstzahl an Schritten, Tool-Aufrufen, Tokens und Laufzeit. Eine
wiederkehrende Aufgabe hat eine bekannte Größe; ein Lauf, der sie weit überschreitet, ist ein Signal und
kein Grund weiterzumachen.

## Playbook, AGENTS.md, Skill, Runbook: wer was macht

Im Alltag überschneiden sich diese Begriffe. Eine praktische Aufteilung:

| Artefakt | Beantwortet | Geladen | Beispiel |
| --- | --- | --- | --- |
| [AGENTS.md](/de/posts/agents-md-project-context/) | Wie funktioniert dieses Repository? | Immer, zu Beginn einer Sitzung | Build-Befehl, Testbefehl, Konventionen |
| [Skill](/de/posts/anatomy-of-an-agent-skill/) | Wie mache ich so etwas gut? | Bei Bedarf, wenn er passt | Wie man den Bericht eines Schwachstellenscanners liest |
| Runbook | Was tut ein Mensch, wenn X passiert? | Wenn die Lage eintritt | Platte voll auf einem Datenbank-Host |
| Playbook | In welcher Reihenfolge und mit welchen Prüfungen läuft diese wiederkehrende Aufgabe? | Bei jedem Lauf dieser Aufgabe | Wöchentliches Abhängigkeits-Update mit Tests und Entwurfs-Pull-Request |

Ein Playbook *nutzt* meist die anderen. Seine Urteilsschritte laden vielleicht einen Skill; seine
Prüfungen rufen die Befehle auf, die in AGENTS.md stehen; ein Betriebs-Runbook lässt sich zu einem Playbook
machen, indem man Wissen und Aktionen trennt, wie in [Runbooks zu Skills machen](/de/posts/runbooks-as-skills/)
beschrieben. Der Unterschied ist die Ebene: Ein Skill ist Wissen für eine Art von Schritt, ein Playbook
das Verfahren für eine ganze Aufgabe.

## Deterministisch, wo es geht

Der häufigste Fehler ist, ein Playbook als langen Prompt zu schreiben. „Führe zuerst den Scanner aus,
prüfe dann die Ergebnisse, aktualisiere dann das Ticket“ ist in Prosa immer noch ein Plan, dem das Modell
folgen kann oder nicht. Schritte, die kein Urteil brauchen, sollten gar nicht über ein Modell laufen:

- Daten abrufen, einen Scanner ausführen, einen bekannten Fix-Befehl anwenden, ein Schema prüfen: Code
  oder ein fester Tool-Aufruf.
- Aus einem Freitext-Advisory einen Schweregrad wählen, eine Zusammenfassung schreiben, einen Kommentar
  entwerfen: ein Modellschritt, dessen Ausgabe an ein Schema gebunden ist.
- Entscheiden, ob es weitergeht: eine Bedingung über die strukturierte Ausgabe, kein Satz, den das Modell
  schreibt.

So bleibt der teure und schwankende Teil klein, und jeder Schritt lässt sich für sich testen. [Kleine,
geprüfte Schritte](/de/posts/small-verified-steps/) argumentiert allgemein für Agentenarbeit genauso.

## Wie sich das in openagentix abbildet

In openagentix wird ein Agent oder eine Pipeline in einer versionierten `agents.md`-Datei definiert. (Das ist
eine Definitionsdatei der Plattform, nicht die Konvention `AGENTS.md` für Repository-Kontext; die Namen
sind ähnlich, die Aufgaben verschieden.) Eine veröffentlichte Version ist unveränderlich, das Verfahren
vom letzten Dienstag ist also genau das, das Sie heute lesen können. Mehrere der Playbook-Elemente oben
sind Felder dieser Datei:

- `pipeline` legt die Reihenfolge der Schritte fest.
- `input.from` und `output.schema` machen Übergaben typisiert: Ein Schritt erhält nur, was er benennt,
  und seine JSON-Ausgabe wird geprüft, bevor der nächste Schritt startet; ein Verstoß lässt den Lauf
  scheitern.
- `when` ist eine Bedingung über frühere Ausgaben; ist sie falsch, wird der Schritt übersprungen und als
  übersprungen protokolliert, und ein Auswertungsfehler lässt den Lauf scheitern, statt als „falsch“ zu
  gelten.
- `access: read-only` und benannte Tool-Profile begrenzen, was ein Schritt aufrufen darf;
  `approval: required` stellt einen Menschen vor ein bestimmtes Tool.
- `budget` setzt Höchstwerte für Tokens, Kosten, Schritte, Tool-Aufrufe und Laufzeit.

Ein gekürztes Beispiel für eine wöchentliche Abhängigkeitsprüfung (erfundene Namen; die vollständige
Feldreferenz steht in der [agents.md-Dokumentation](https://github.com/open-agentix/open-agentix/blob/main/docs/agents-md.md)):

```yaml
apiVersion: openagentix.io/v1alpha1
kind: AgentPipeline
name: weekly-dependency-check
version: 1.0.0
owner: team-platform
classification: internal
triggers:
  - type: cron
    schedule: "0 6 * * 1"
budget: { maxTokens: 40000, maxCostUsd: 0.4, maxSteps: 12, maxToolCalls: 8, timeoutSeconds: 600 }
schemas:
  Assessment:
    type: object
    required: [risk, summary]
    additionalProperties: false
    properties:
      risk: { enum: [none, low, high] }
      summary: { type: string, maxLength: 1000 }
agents:
  - id: assess
    provider: ollama
    model: example-model
    access: read-only
    outputs: [{ format: json }]
    output: { schema: { $ref: "#/schemas/Assessment" }, onInvalid: retry }
    tools:
      - { server: deps, profile: read }
  - id: report
    provider: ollama
    model: example-model
    access: write
    when: 'steps.assess.output.risk == "high"'
    input: { from: [assess] }
    tools:
      - { server: tickets, profile: write, approval: required }
pipeline: [assess, report]
```

Was es noch nicht gibt: Skriptbasierte Testfälle in `agents.md` und ein Eval-Runner, der sie bei jeder
Veröffentlichung abspielt, sind geplant (W2-4 in der
[Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md)). Bis dahin liegen die
Prüfungen eines Playbooks in seinen Tools und in Ihrer CI.

## Das erste Playbook schreiben

Wählen Sie eine Aufgabe, die mindestens wöchentlich anfällt und ein klares „fertig“ hat. Dann:

1. Schreiben Sie die letzten drei Male auf, die ein Mensch sie erledigt hat, Schritt für Schritt,
   einschließlich dessen, was geprüft wurde.
2. Markieren Sie jeden Schritt als deterministisch, Urteil oder Prüfung. Die meisten sind deterministisch.
3. Geben Sie jedem Urteilsschritt ein Schema für seine Ausgabe und eine kurze Anweisung; Hintergrundwissen
   gehört in einen Skill.
4. Geben Sie jedem Schritt nur die Tools, die er braucht; alles, was außerhalb eines Entwurfs schreibt,
   bekommt eine Freigabe.
5. Ergänzen Sie für jeden Urteilsschritt eine Stoppregel („nennt das Advisory mehr als ein Paket: anhalten
   und eskalieren“) und ein Budget für den Lauf.
6. Lassen Sie es in einem Modus laufen, der nicht schreiben kann (Entwurf oder Trockenlauf), bis die
   Ergebnisse dem entsprechen, was der Mensch getan hätte.

Rechnen Sie damit, dass die Übung das Verfahren selbst verbessert. Ein Schritt, den niemand genau
beschreiben kann, war nie ein Schritt, sondern eine Ermessensentscheidung, und jetzt ist sie sichtbar.

## Wann ein Playbook das falsche Werkzeug ist

Nicht alles sollte ein Playbook sein. Einmalige Untersuchungen, exploratives Debugging und Entwurfsarbeit
brauchen einen Agenten, der seinen Weg selbst wählt. Ein Playbook dafür macht starr, ohne zuverlässiger zu
machen. Ein guter Test: Wenn Sie die Prüfungen nicht vorab benennen können, ist es noch keine
Playbook-Aufgabe.

## Das Wichtigste in Kürze

- Ein Playbook legt die Form einer wiederkehrenden Aufgabe fest: Schritte, Übergaben, Berechtigungen,
  Prüfungen, Stoppregeln und Budget.
- Nutzen Sie Code für deterministische Schritte und binden Sie Modellschritte an strukturierte Ausgaben;
  entscheiden Sie über das Weitermachen mit Bedingungen, nicht mit Prosa.
- AGENTS.md liefert Projektkontext, Skills Wissen für eine Art von Schritt, Runbooks beschreiben Reaktionen
  auf Lagen; ein Playbook ordnet sie für eine Aufgabe.
- In openagentix drücken `pipeline`, typisierte Übergaben, `when`, nur lesender Zugriff, Freigaben und
  Budgets in einer versionierten `agents.md` heute den Großteil eines Playbooks aus; eingebaute Testfälle
  sind geplant.
- Wenn Sie vorab nicht sagen können, wie „fertig“ aussieht, ist die Aufgabe noch nicht reif für ein
  Playbook.

## Quellen

- openagentix, [agents.md reference: data flow and isolation fields](https://github.com/open-agentix/open-agentix/blob/main/docs/agents-md.md) und [Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md).
- Verwandte Beiträge in diesem Blog: [Runbooks zu Skills machen](/de/posts/runbooks-as-skills/), [AGENTS.md](/de/posts/agents-md-project-context/), [Workflows oder Agenten?](/de/posts/workflows-vs-agents/).
