---
ref: air-gapped-agents-checklist
lang: de
title: "Agenten ohne Internet: eine Prüfliste für den Air-Gap-Betrieb"
description: "Air-gapped AI heißt: keine Downloads zur Laufzeit. Prüfliste: was einzupflegen, festzulegen und zu verifizieren ist und wie Updates laufen."
date: 2026-07-16T09:00:00Z
tags: [self-hosted, security, checklist]
---

Air-gapped AI heißt: Die Agentenplattform funktioniert ohne Verbindung ins Internet und darf deshalb zur Laufzeit nichts nachladen, weder Modelle noch Skills, Preislisten oder Anweisungen. Alles, was sie braucht, wird vor der Überquerung der Luftlücke eingepflegt, festgelegt und verifiziert, und Aktualisierungen kommen über einen geprüften Importweg. Dieser Beitrag ist eine Prüfliste für Aufbau und Betrieb.

## Was „Air Gap“ von einer Agentenplattform verlangt

Die meisten Agenten-Stacks sind von Haus aus gesprächig. Sie lösen Paketversionen beim Start auf, laden beim ersten Gebrauch ein Modell herunter, ziehen einen Modellkatalog für Preise, suchen nach Updates, senden Telemetrie und laden im schlimmsten Fall Anweisungen von einer URL. Jedes davon ist eine Laufzeitabhängigkeit von etwas außerhalb Ihrer Kontrolle, und in einem abgeschotteten Netz scheitert jedes entweder oder fällt, schlimmer, stillschweigend auf etwas Unbeabsichtigtes zurück.

Das Ziel lässt sich einfach sagen: **Plattformstart, Agentenlauf und Neustart müssen auch bei gezogenem Netzwerkkabel funktionieren.** Alles Weitere folgt aus diesem Satz.

Ein Rahmenwerk hilft beim Ordnen. Die Leitlinien des britischen National Cyber Security Centre zur sicheren Entwicklung von KI-Systemen teilen den Lebenszyklus in vier Bereiche:

> four key areas within the AI system development life cycle: secure design, secure development, secure deployment, and secure operation and maintenance

Quelle: [NCSC, Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development) (2023-11-27). Sinngemäß: vier Schlüsselbereiche im Lebenszyklus eines KI-Systems: sicherer Entwurf, sichere Entwicklung, sicherer Einsatz sowie sicherer Betrieb und sichere Wartung.

Der Air Gap betrifft vor allem die letzten beiden: wie Artefakte ausgerollt werden und wie sie danach aktualisiert werden.

## Die Architektur: ein geprüfter Importweg

![Abgeschottete Bereitstellung mit geprüftem Importweg](/images/blog/air-gapped-agents-checklist-1.svg)

Air Gap bedeutet nicht, dass sich nie etwas ändert. Es bedeutet, dass Änderungen durch eine kontrollierte Tür hereinkommen:

1. Eine **Importstation** außerhalb der Lücke lädt Artefakte von ihren Herausgebern.
2. Sie prüft **Signaturen und Hashes**, scannt und hält die Herkunft fest (Quelle, Version, Datum).
3. Eine Person **prüft** den Änderungssatz.
4. Freigegebene Artefakte werden über die Lücke übertragen, etwa auf einmal beschreibbaren Medien oder über einen Einwegtransfer, in eine **interne Registry**.
5. Innen zieht die Plattform nur aus dieser Registry, nach exakter Version oder Digest.

Nichts innerhalb der Lücke sollte je mit dem öffentlichen Internet sprechen müssen, und nichts außerhalb sollte hineinschieben können.

## Prüfliste: Was eingepflegt und festgelegt sein muss

Gehen Sie jede Kategorie durch und beantworten Sie: „Woher kommt das zur Laufzeit?“ Akzeptabel ist nur: „aus unserer internen Registry oder aus einer Datei im Deployment.“

**Modellgewichte**
- [ ] Gewichte liegen in der internen Registry und werden per Digest referenziert.
- [ ] Die Serving-Runtime ist so konfiguriert, dass sie nie ein Modell herunterlädt. Die Ollama-Dokumentation hält fest: „We don’t see your prompts or data when you run locally.“ ([Ollama FAQ](https://docs.ollama.com/faq)), sinngemäß: Beim lokalen Betrieb sehen wir Ihre Prompts und Daten nicht. Das betrifft den Datenschutz; ob eine Runtime außerdem von sich aus Modelle holt oder Updates prüft, ist eine eigene Einstellung, die Sie prüfen und abschalten müssen.
- [ ] Jeder Modellwechsel durchläuft vor dem Import einen Bewertungslauf.

**Container-Images und Pakete**
- [ ] Images werden intern gespiegelt und per Digest festgelegt, nicht per Tag.
- [ ] Sprachabhängigkeiten kommen aus einem internen Mirror mit Lockfile; kein `latest`.
- [ ] Builds sind ohne Netzzugang reproduzierbar (ausdrücklich testen).

**Skills, Prompts und Anweisungen**
- [ ] Skills werden als geprüfte Kopien importiert, mit Herkunftsdatei (Quell-URL, Commit, Datum).
- [ ] Kein Skill, Prompt oder keine Tool-Beschreibung wird zur Laufzeit von einer URL geladen. Entfernte Anweisungen sind schon mit Netz ein Einfallstor für Prompt-Injection; ohne Netz sind sie schlicht defekt.
- [ ] Skills Dritter durchlaufen die Prüfung aus [Skills Dritter als Lieferkette](/de/posts/third-party-skills-supply-chain/).

**Kataloge und Daten**
- [ ] Der Modellkatalog (Namen, Kontextgrößen, Preise) ist eine versionierte Datei im Deployment, keine Live-Abfrage.
- [ ] Preistabellen für die Kostenverfolgung werden über den Importweg aktualisiert.
- [ ] Schwachstellendatenbanken und Lizenzdaten für Scanner werden gespiegelt und planmäßig aufgefrischt.

**Verhalten der Plattform**
- [ ] Update-Prüfungen, Telemetrie, Absturzberichte und Lizenzprüfungen per „nach Hause telefonieren“ sind aus.
- [ ] Ausgehender Verkehr ist auf Netzwerkebene gesperrt, nicht nur in der Konfiguration abgeschaltet. Eine Firewall-Regel ist ein Beleg, ein Konfigurationsschalter eine Hoffnung.
- [ ] Die Uhrzeit stammt aus einer internen Quelle. Zertifikate, Token und Audit-Zeitstempel hängen davon ab.
- [ ] Zertifizierungsstellen, CRLs oder OCSP-Responder sind intern erreichbar.

## Importiertes verifizieren

OWASPs Hinweis zu Lieferkettenrisiken gilt unmittelbar für die Importstation:

> Only use models from verifiable sources and use third-party model integrity checks with signing and file hashes

Quelle: [OWASP, LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/). Sinngemäß: Nur Modelle aus überprüfbaren Quellen verwenden und Integritätsprüfungen Dritter mit Signaturen und Datei-Hashes einsetzen.

Daraus werden Schritte, die die Station immer ausführt:

- Nur vom offiziellen Ort des Herausgebers herunterladen.
- Die Signatur prüfen, wo es eine gibt, und den Datei-Hash mit einem Wert über einen zweiten Kanal vergleichen.
- Das Ergebnis neben dem Artefakt festhalten, damit eine spätere Prüfung sieht, was kontrolliert wurde.
- Images und Pakete auf bekannte Schwachstellen und Lizenzprobleme scannen.
- Die Vorversion behalten, damit ein schlechter Import zurückgenommen werden kann.

Ein Herkunftsnachweis kann so schlicht sein:

```yaml
artifact: model-small-q4.gguf
source: publisher release page
sha256: <value recorded at import>
verified: signature ok, hash matches second channel
imported: <date of import>
reviewed-by: platform team
evaluation: eval-suite run 14, no regressions
```

## Aktualisieren und Patchen ohne Verbindung

Ein Air Gap verzögert Patches, er macht sie nicht überflüssig. Legen Sie einen Rhythmus fest (etwa monatlich, mit einem Notweg für kritische Korrekturen) und üben Sie den ganzen Weg vom Herausgeber bis in die Produktion mindestens einmal, bevor Sie ihn unter Druck brauchen. Es gilt dieselbe Disziplin wie in [Die Lieferkette von Agenten patchen](/de/posts/patching-the-agent-supply-chain/), mit einem zusätzlichen Schritt für die Übertragung. Der Betrieb lokaler Modelle hat eigene Pflege, beschrieben in [Selbst betriebene Modelle für Agenten](/de/posts/self-hosted-models-for-agents/).

## Die Lücke testen

Aussagen zur Isolation sollten getestet statt angenommen werden:

- Die ganze Plattform in einem Netzwerk-Namespace ohne Route nach außen starten und eine Standardmenge an Agentenaufgaben ausführen.
- Ausgehende Verbindungsversuche beim Start und während eines Laufs erfassen; die Liste sollte leer oder vollständig erklärt sein.
- Ein Image auf dem Build-Host mit abgeschaltetem Netzzugang neu bauen.
- Dieselben Prüfungen nach jedem Upgrade wiederholen, denn neue Versionen bringen neues Standardverhalten.

## Was ein Air Gap nicht leistet

- Er macht die Modelle nicht sicher. Prompt-Injection funktioniert ohne Internet über Dokumente, Tickets und Tool-Ausgaben.
- Er schützt nicht vor einem bösartigen Artefakt, das die Prüfung bestanden hat.
- Er ersetzt weder Zugriffskontrolle noch Audit im Netz.
- Er kostet Tempo: Updates dauern länger, und manche Funktionen, die Live-Daten brauchen, fallen aus.

## Das Wichtigste in Kürze

- Das Ziel als „Start, Lauf und Neustart ohne Netz“ definieren und testen.
- Modelle, Images, Pakete, Skills, Kataloge und Preislisten einpflegen und festlegen; per Digest referenzieren.
- Updates kommen nur über eine Importstation, die Signaturen und Hashes prüft, die Herkunft festhält und eine Prüfung verlangt.
- Ausgehenden Verkehr im Netz sperren, nicht nur in der Konfiguration.
- Einen Patch-Rhythmus halten und den Importweg vor dem Ernstfall üben.

## Quellen

- [Guidelines for secure AI system development](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development), UK National Cyber Security Centre, 2023-11-27.
- [LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/), OWASP Gen AI Security Project.
- [FAQ](https://docs.ollama.com/faq), Ollama-Dokumentation.
