---
ref: agent-operations-platform-view
lang: de
title: "Agenten für die Zukunft planen: was eine Plattform für den Dauerbetrieb braucht"
description: "Laufprotokoll, kurzer Morgenbericht, überwachender Review-Agent, Freigabefenster mit Veto und Vier-Augen-Freigabe: was eine Plattform für Agenten braucht und was es gibt."
date: 2026-10-27T07:00:00+01:00
tags: [operations, governance, architecture]
---

Die meisten Texte über Agenten handeln vom Bauen. Dieser Beitrag nimmt die Sicht der Plattform ein und fragt etwas anderes: Was muss vorhanden sein, damit ein Agent, den Sie heute starten, in sechs Monaten noch läuft, noch nützt und noch sicher ist, ohne dass jemand täglich seine Logs liest? Der Beitrag ist zum Teil ein Meinungsstück. Wir beschreiben fünf Muster, angeregt von öffentlich diskutierter Praxis im Agentenbetrieb (wir haben keinen Code übernommen), und sagen genau, was openagentix gebaut hat, was geplant ist und was nur unser Entwurfsdenken ist.

## Das Fehlerbild: Agenten hören leise auf

Fällt ein Webdienst aus, klingelt jemand. Fällt ein zeitgesteuerter Agent aus, meist nicht. Die Routine, die jeden Morgen Abhängigkeitsmeldungen zusammenfasst, hört einfach auf, nachdem ein Zugang abgelaufen ist, ein Modell abgeschaltet wurde oder ein Zeitplan versehentlich geändert wurde. Nichts stürzt ab, das Ergebnis kommt nur nicht mehr, und niemand merkt es wochenlang. Ein verwandter Fehler ist das Gegenteil: Der Agent läuft, liefert aber jedes Mal ein leeres Ergebnis, was nach „alles ruhig“ aussieht und es nicht ist.

Beides hat dieselbe Abhilfe: Die Plattform, nicht der Agent, hält einheitlich fest, was passiert ist, und etwas beobachtet diese Aufzeichnungen.

## Muster 1: ein einheitliches Laufprotokoll je Routine

Jede Routine (ein zeit- oder ereignisgesteuerter Agentenjob) schreibt pro Lauf einen Eintrag in immer gleicher Form, egal was der Agent tut:

| Feld | Bedeutung |
| --- | --- |
| `routine` | stabile Kennung der Routine |
| `started_at`, `ended_at` | Zeitstempel mit Offset |
| `duration_ms` | abgeleitet, zur einfachen Abfrage gespeichert |
| `outcome` | `ok`, `empty` oder `error` |
| `cost` | Modell- und Tool-Kosten des Laufs in einer Währung |
| `artifacts` | Verweise auf das Ergebnis: Pull Request, Bericht, Datei, Ticket |

Zwei Einzelheiten wiegen schwerer als die Feldliste.

- **`empty` ist ein eigenes Ergebnis.** Ein Lauf, der durchlief, aber nichts fand, ist nicht dasselbe wie ein Lauf, der Arbeit geleistet hat. So lässt sich fragen „hat diese Routine in 14 Tagen etwas geliefert?“, ohne zu raten.
- **Das Protokoll ist nur anfügbar (append-only).** Weder der Agent noch ein Aufräumjob ändert oder löscht Einträge. Eine Korrektur ist ein neuer Eintrag, der auf den alten verweist. Nur so sind die folgenden Muster belastbar: Ein Aufseher, der ein vom Agenten umschreibbares Protokoll liest, beaufsichtigt nichts.

Das ist nichts Exotisches, sondern dieselbe Disziplin wie strukturiertes Logging und Tracing bei Diensten. Das OpenTelemetry-Projekt bespricht in seinem Beitrag zur [Beobachtbarkeit von KI-Agenten](https://opentelemetry.io/blog/2025/ai-agent-observability/) die sich entwickelnden Standards, Agentenläufe zu beschreiben. Der Lauf-Eintrag ist die kleine, dauerhafte Zusammenfassung, Traces sind das Detail für die Fehlersuche. Dazu unser Beitrag zur [Observability für Agenten](/de/posts/observability-for-agents/).

## Muster 2: ein kurzer Morgenbericht je Agent

Rohprotokolle liest täglich niemand, also sollte das niemand müssen. Stattdessen bekommt jeder Agent einen kurzen Bericht aus seinem eigenen Laufprotokoll: was seit dem letzten Bericht lief, Ergebnisse, Gesamtkosten, was entstanden ist und eine Zeile zu Auffälligem. Ziel sind fünf Zeilen, zugestellt an die verantwortliche Person, dort wo sie ohnehin hinschaut.

Damit der Bericht ehrlich bleibt, entsteht er aus dem Laufprotokoll durch eine deterministische Abfrage und höchstens einen Zusammenfassungsschritt. Er ist nie eine freie Behauptung des Agenten über sich selbst. Steht dort „3 Läufe, 1 Fehler“, belegt das Protokoll es. Das ist auch ein natürlicher Ansatzpunkt für eine Service-Level-Sicht, siehe [SLOs für Agenten](/de/posts/slos-for-agents/).

## Muster 3: ein überwachender „Chief of Staff“-Review-Agent

Berichte je Agent zeigen nicht, was in den Berichten fehlt. Dafür liest ein eigener Aufsichtsagent alle Laufprotokolle eines Mandanten und beantwortet drei Fragen:

1. Welche Routinen sind **leise stehen geblieben**: geplante Läufe, die nie starteten, oder wiederholt mit `error` endeten?
2. Welche Routinen sind **zu lange nicht gelaufen**, gemessen am eigenen Zeitplan, oder lieferten auffallend oft hintereinander `empty`?
3. Wo driften **Kosten oder Laufzeit** gegenüber dem eigenen jüngeren Verlauf?

Die Ausgabe ist absichtlich klein: ein kurzer Bericht mit **höchstens drei empfohlenen Schritten**, nach Wichtigkeit geordnet („Verbindung von Routine X erneuern“, „Routine Y pausieren, neunmal in Folge Fehler“). Diese Begrenzung gehört zum Entwurf. Ein Aufseher, der vierzig Befunde nennt, wird so schnell ignoriert wie die Rohlogs. Drei zwingen zum Priorisieren.

Randbedingungen, die wir einem solchen Agenten setzen würden: Er liest Laufprotokolle und nichts sonst, er hat keinen Schreibzugriff auf die beaufsichtigten Routinen (er empfiehlt, eine Person oder eine Richtlinie handelt, was seine Handlungsmacht klein hält, im Sinne des OWASP-Risikos [Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)), und seine eigenen Läufe stehen im selben Laufprotokoll, damit auffällt, wenn der Aufseher selbst stehen bleibt. „Wer überwacht den Überwacher?“ beantwortet eine einfache Totmann-Prüfung außerhalb des Agentensystems, kein dritter Agent.

## Muster 4: ein Freigabefenster mit Veto, bevor etwas live geht

Agenten, die etwas veröffentlichen (einen Blogbeitrag, einen Bericht, einen Pull Request, eine E-Mail), sollten nicht in dem Moment veröffentlichen, in dem sie fertig sind. Anthropic weist in seinem Leitfaden zu [wirksamen Agenten](https://www.anthropic.com/engineering/building-effective-agents) darauf hin, dass Agenten an Kontrollpunkten auf Rückmeldung von Menschen warten können. Ein Freigabefenster legt bewusst Zeit zwischen „der Agent hat es erzeugt“ und „es ist live“:

- **Standard: Es geht zu seinem Termin live.** Das Ergebnis trägt eine geplante Freigabezeit. Tut niemand etwas, wird es dann freigegeben.
- **Die verantwortliche Person kann es vor dem Termin zurückstellen.** Ein Veto **hält nur zurück**; es löscht nichts. Entwurf, Verlauf und Lauf-Eintrag bleiben, und es kann später freigegeben werden.
- **Die verantwortliche Person kann vorzeitig freigeben.** Hat sie hingeschaut und ist zufrieden, überspringt ihre Freigabe das Warten.

Der Standard ist wichtig: Schweigen heißt „zum Termin fortfahren“, nicht „ewig warten“. Eine unbeaufsichtigte Routine arbeitet also weiter, und die Pflicht der verantwortlichen Person ist nur, hinzusehen, wenn sie will. Ein Veto kostet wenig und ist umkehrbar, deshalb wird es auch genutzt.

Dieses Muster setzen wir in diesem Blog selbst ein. Beiträge tragen ein Veröffentlichungsdatum auf einem festen Dienstags- oder Donnerstags-Termin, ein gemergter Beitrag bleibt bis zu seinem Datum unsichtbar, und ein optionales Feld `approval` erlaubt es der verantwortlichen Person, ein Paar früher freizugeben (`approved`) oder zurückzuhalten (`vetoed`); der Agent, der Beiträge entwirft, darf dieses Feld nicht setzen. Der Mechanismus steht im [Content-Plan](https://github.com/open-agentix/blog.openagentix.si/blob/main/content-plan/README.md) des Repositories. Das ist die Build-Logik des Blogs, kein Merkmal der openagentix-Plattform.

## Muster 5: Vier-Augen-Veröffentlichung, Entwicklung gegen veröffentlicht, Secrets mit Geltungsbereich

Das letzte Muster fragen Unternehmen zuerst nach: Eine zweite Person muss freigeben, bevor ein Agent in Produktion geht, so wie bei Software (die [OWASP Top 10 für Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) sind eine gute Checkliste dafür, warum). Der Entwurf in [ADR 0017](https://github.com/open-agentix/open-agentix/blob/main/docs/adr/0017-agent-lifecycle-governance.md) hat diese Teile:

- eine **Vier-Augen-Freigabe zur Veröffentlichung**, die sich mit Review-Kommentaren ablehnen lässt, mit einer **Richtlinie je Mandant**, die sie einschaltet;
- eine klare Trennung zwischen einem Agenten **in Entwicklung** und einem **veröffentlichten** Agenten: Änderungen nur in der Entwicklung, in Produktion erst nach erneuter Veröffentlichung;
- eine **unveränderliche, versionierte Veröffentlichung** mit Version und Inhalts-Digest;
- **verschlüsselte Secrets mit Geltungsbereich** je Team oder Mandant statt persönlicher Tokens, mit Vault und AWS Secrets Manager als geplanten Backends.

### Was openagentix heute kann und was geplant ist

**Gebaut (auf `main`, Stand 2026-10-10):**

- Ein Agent hat einen veränderbaren Entwurf und **unveränderliche veröffentlichte Versionen** mit Inhalts-Digest; anderer Inhalt unter einer bestehenden Versionsnummer wird abgelehnt.
- Eine hashverkettete Audit-Spur und Kostenzeilen je Mandant, Agent, Anwendungsfall, Lauf und Schritt (siehe [Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md)).
- Freigaben zur Laufzeit für Tools.

**Geplant, nicht gebaut:** die Vier-Augen-Freigabe zur Veröffentlichung, die Freigaberichtlinie je Mandant, Review-Kommentare sowie verschlüsselte Secrets mit Geltungsbereich und Vault- und AWS-Secrets-Manager-Backends. ADR 0017 hat den Status „Accepted“, der Roadmap-Punkt (W14) ist „not started“, und heute kann der Autor seinen eigenen Entwurf veröffentlichen; Secrets kommen nur aus vom Betreiber bereitgestellten Umgebungsvariablen oder eingehängten Dateien. „Geplant“ bitte nicht als „verfügbar“ lesen.

**Nur Entwurfsdenken:** das einheitliche Laufprotokoll mit den Ergebnissen `ok`/`empty`/`error`, der Morgenbericht, der Chief-of-Staff-Aufseher und das Freigabefenster mit Veto sind Muster, die eine Plattform unserer Meinung nach braucht. Als Roadmap-Punkte haben wir sie bei der Prüfung am 2026-10-10 nicht gefunden, deshalb machen wir dazu kein Versprechen. Die Plattform erfasst bereits Läufe, Kosten und Audit-Einträge als Rohmaterial, aber das Ergebnis-Feld, die Berichte und der Aufseher existieren nicht als Produktfunktionen.

### Wie Änderungen an openagentix tatsächlich geprüft werden

Weil Vier-Augen das Thema ist, hier unsere eigene Praxis, nüchtern: Unseren Code und unsere Beiträge schreibt ein KI-Agenten-Konto, `agentix-zero`, über Pull Requests. Jeder Pull Request wird vor dem Merge von einem zweiten, unabhängigen Review-Agenten geprüft. Tests, Abdeckungsschwellen und CI laufen bei jeder Änderung. Es gibt **keine Garantie, dass ein Mensch jede Änderung liest**: Die Projektleitung gibt die Richtung vor, kann Änderungen jederzeit einsehen, zurücknehmen und blockieren und verantwortet die Entscheidungen. Das ist etwas anderes als eine von der Plattform erzwungene Vier-Augen-Regel, und deshalb empfehlen wir für alles, was zählt, in Ihrem eigenen Betrieb eine Person und einen Prüfschritt.

## Was Sie jetzt ohne Plattformfunktion tun können

Die ersten vier Muster lassen sich mit Vorhandenem annähern:

1. Die obigen Felder festlegen und pro Lauf einen Eintrag aus Scheduler oder Wrapper in einen nur anfügbaren Speicher schreiben (Bucket mit Versionierung oder Tabelle ohne Update-Recht).
2. Je Routine eine Fünf-Zeilen-Tageszusammenfassung per Abfrage erzeugen, nicht per Prompt.
3. Einen Aufsichtsjob einrichten, der Routinen ohne Lauf, mit wiederholten Fehlern oder wiederholtem `empty` auflistet, auf drei Empfehlungen begrenzt, und ihn testen, indem Sie eine Routine absichtlich anhalten.
4. Vor jeden Veröffentlichungsschritt eine Verzögerung und ein Halte-Flag setzen.
5. Für die Freigabe den Review-Mechanismus Ihres Git-Hosts nutzen und Secrets in einem Secret-Manager halten statt in Prompts. Details im Beitrag [Secrets für Agenten](/de/posts/secrets-for-agents/).

## Das Wichtigste in Kürze

- Agenten fallen meist leise aus; die Plattform muss Läufe einheitlich und nur anfügbar festhalten und diese Aufzeichnungen beobachten.
- `empty` ist ein eigenes Ergebnis neben `ok` und `error`.
- Einen kurzen Tagesbericht aus dem Laufprotokoll ableiten, nicht den Agenten über sich selbst berichten lassen.
- Ein überwachender Review-Agent sollte nur lesen und auf drei empfohlene Schritte begrenzt sein.
- Ein Freigabefenster mit umkehrbarem Veto lässt unbeaufsichtigte Agenten weiterarbeiten und erhält die Kontrolle der verantwortlichen Person.
- In openagentix sind unveränderliche veröffentlichte Versionen gebaut; Vier-Augen-Freigabe und verschlüsselte Secrets mit Geltungsbereich sind geplant (ADR 0017, Accepted), die übrigen Muster hier sind Entwurfsdenken.

## Quellen

- OpenTelemetry, [AI Agent Observability - Evolving Standards and Best Practices](https://opentelemetry.io/blog/2025/ai-agent-observability/)
- OWASP Gen AI Security Project, [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- OWASP Gen AI Security Project, [LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)
- Anthropic, [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- openagentix, [ADR 0017: Agent lifecycle governance](https://github.com/open-agentix/open-agentix/blob/main/docs/adr/0017-agent-lifecycle-governance.md) und [ROADMAP.md](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md)
- openagentix blog, [Content plan and scheduled publishing](https://github.com/open-agentix/blog.openagentix.si/blob/main/content-plan/README.md)

Alle abgerufen am 10. Oktober 2026. Wir geben sinngemäß wieder; Zitate sind kurz und englisch.
