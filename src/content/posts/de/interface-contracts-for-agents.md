---
ref: interface-contracts-for-agents
lang: de
title: "Strukturierte Ausgaben für Agenten: Schemas, Verträge, Zuständigkeit"
description: "Structured output agents übergeben typisierte Daten statt Freitext. JSON-Schemas für Tool-Ergebnisse definieren, versionieren und Verantwortliche nennen."
date: 2026-08-25T09:00:00Z
tags: [architecture, tools, how-to]
---

Freitext zwischen Agenten ist der Ort, an dem sich Fehler verstecken. Reicht ein Agent einen Absatz an den nächsten weiter, kann niemand die Übergabe testen, und eine geänderte Formulierung kann den Empfänger unbemerkt kaputt machen. Die Lösung kennt die Softwaretechnik seit Langem: ein Vertrag. Definieren Sie typisierte Ein- und Ausgaben mit JSON Schema, validieren Sie sie an jeder Grenze, versionieren Sie sie mit Semantic Versioning und benennen Sie für jeden Vertrag eine verantwortliche Stelle. Dieser Beitrag zeigt, wie strukturierte Ausgaben für Agenten testbar werden und wer über Vertragsänderungen entscheidet.

## Was ein Vertrag enthält

![Vertragskarte einer Agenten-Übergabe](/images/blog/interface-contracts-for-agents-1.svg)

Ein Vertrag für eine Übergabe (Agent an Agent oder Agent an Werkzeug) braucht fünf Dinge:

1. **Eingabeschema.** Was der Empfänger akzeptiert.
2. **Ausgabeschema.** Was der Empfänger zurückzugeben verspricht, einschließlich der Form von Fehlern.
3. **Verantwortliche Stelle.** Das Team, das ihn ändern darf und Fragen beantwortet.
4. **Version.** Eine Nummer, die Konsumenten sagt, ob eine Änderung sie brechen kann.
5. **Kompatibilitätsregel.** Welche Änderungen innerhalb einer Versionslinie erlaubt sind.

Das ist dieselbe Idee wie ein API-Vertrag, angewandt auf eine Grenze, an der auf einer oder beiden Seiten ein Modell sitzt. Das größere Bild, wie Arbeit zwischen Agenten weitergegeben wird, steht in [Übergaben und Verträge](/de/posts/handovers-and-contracts/).

## Schritt 1: Ergebnisse mit einem Schema beschreiben

Beginnen Sie mit der Ausgabe eines Agenten, etwa eines Triage-Schritts, der einen Sicherheitsbefund klassifiziert. Schreiben Sie zuerst das Schema, dann den Prompt.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CveFinding",
  "type": "object",
  "required": ["cve_id", "severity", "affected", "rationale"],
  "additionalProperties": false,
  "properties": {
    "cve_id": { "type": "string", "pattern": "^CVE-\\d{4}-\\d{4,}$" },
    "severity": { "enum": ["low", "medium", "high", "critical"] },
    "affected": { "type": "boolean" },
    "rationale": { "type": "string", "maxLength": 500 }
  }
}
```

Entwurfsentscheidungen, die sich auszahlen:

- **Aufzählungen statt freier Strings,** wo es eine feste Menge gibt.
- **Muster und Längenlimits** für Bezeichner und Textfelder, damit überlange oder fehlerhafte Werte abgelehnt statt weitergereicht werden.
- **`additionalProperties: false`,** damit unerwartete Felder laut scheitern, statt weiterzuwandern.
- **Ein eigenes Feld für freie Begründung** (`rationale` oben), kurz gehalten und von Konsumenten als Anzeigetext behandelt, nie als Anweisung.
- **Eine ausdrückliche Fehlerform,** etwa `{"error": {"code": "...", "retryable": true}}`, damit Konsumenten nicht aus Prosa raten müssen.

## Schritt 2: An jeder Grenze validieren

Ein Schema, das niemand prüft, ist Dokumentation. Validieren Sie die Ausgabe, wenn sie den Erzeuger verlässt, und erneut, wenn sie beim Konsumenten ankommt, im Code und außerhalb des Modells:

```python
from jsonschema import Draft202012Validator

validator = Draft202012Validator(CVE_FINDING_SCHEMA)
errors = sorted(validator.iter_errors(candidate), key=lambda e: e.path)
if errors:
    raise HandoverRejected(
        contract="cve-finding", version="2.1.0",
        problems=[e.message for e in errors],
    )
```

Bei einem Fehler haben Sie drei Möglichkeiten: den Erzeuger einmal mit den Validierungsfehlern im Prompt wiederholen, an einen Menschen weiterleiten oder den Lauf scheitern lassen. Entscheiden Sie das pro Vertrag und protokollieren Sie es. Viele Modell-APIs können die Ausgabe direkt auf ein Schema beschränken; nutzen Sie das, wo möglich, validieren Sie aber trotzdem auf Ihrer Seite, denn ein beschränktes Decoding garantiert die Form, nicht Bedeutung oder Wahrheit.

## Schritt 3: Tool-Ergebnisse und Tool-Eingaben sind ebenfalls Verträge

Dieselbe Disziplin gilt für Werkzeuge. Die Spezifikation des Model Context Protocol legt fest, wie Werkzeuge ihre Ein- und Ausgabeformen deklarieren, und gibt Hinweise zu Vertrauen und Aufsicht:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.

und

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.

Quelle für beide: [Tools, MCP specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools). Sinngemäß: Es sollte immer einen Menschen in der Schleife geben, der Tool-Aufrufe ablehnen kann; und Clients müssen Tool-Annotationen als nicht vertrauenswürdig behandeln, sofern sie nicht von vertrauenswürdigen Servern stammen. Daraus folgen zwei Lehren. Ein Schema beschreibt die Form, aber Beschreibung und Annotationen eines Werkzeugs sind Text, den liefert, wer den Server betreibt, sie sind also keine Sicherheitsgarantie. Und Verträge für Werkzeuge, die etwas in der Welt verändern, sollten neben dem Schema eine Genehmigungsregel enthalten.

Gute Tool-Schemas im Allgemeinen, einschließlich Benennung und Fehlermeldungen, behandelt [Werkzeuge schreiben, die Agenten nutzen können](/de/posts/writing-tools-agents-can-use/). Anthropics Engineering-Leitfaden ergänzt einen Punkt zur Ordnung:

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.

Quelle: [Writing effective tools for AI agents—using AI agents, Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents). Sinngemäß: Namensräume (zusammengehörige Werkzeuge unter gemeinsamen Präfixen) helfen, Grenzen zwischen vielen Werkzeugen zu markieren. Ein Präfix wie `tickets.` oder `crm.` macht Zuständigkeit billig sichtbar: Alle Werkzeuge unter einem Präfix haben denselben Verantwortlichen und dieselben Vertragskonventionen.

## Schritt 4: Den Vertrag versionieren

Verträge ändern sich. Semantic Versioning liefert ein gemeinsames Vokabular; seine Regel für die Hauptversion lautet:

> MAJOR version when you make incompatible API changes

Quelle: [Semantic Versioning 2.0.0, semver.org](https://semver.org/). Sinngemäß: Die Hauptversion erhöht sich bei inkompatiblen API-Änderungen. Auf Schemas angewandt:

| Änderung | Versionssprung | Grund |
| --- | --- | --- |
| Optionales Ausgabefeld hinzufügen | Minor | Bestehende Konsumenten ignorieren es |
| Beschreibung oder Beispiel korrigieren | Patch | Keine Verhaltensänderung |
| Optionales Feld zur Pflicht machen | Major | Erzeuger müssen sich ändern |
| Feld entfernen oder umbenennen, Aufzählung einengen | Major | Konsumenten können brechen |
| Aufzählung auf der Ausgabeseite erweitern | Major oder Minor, nach Absprache | Konsumenten mit erschöpfenden Fallunterscheidungen brechen |

Tragen Sie die Version in die Vertragsdatei und in jede Nachricht ein (`"contract": "cve-finding@2.1.0"`), damit Logs zeigen, welche Version ein Lauf nutzte. Ändert sich ein Modell oder ein Prompt, führen Sie die Vertragstests erneut aus, auch wenn das Schema gleich blieb, denn dasselbe Schema kann schlechter erfüllt werden. Anweisungsdateien und Skills entwickeln sich genauso; siehe [Versionierung von Agenten-Skills](/de/posts/versioning-agent-skills/).

## Schritt 5: Zuständigkeit festlegen

Ein Vertrag ohne Verantwortliche verfällt. Schreiben Sie die Regeln auf:

- **Ein verantwortliches Team pro Vertrag,** in der Vertragsdatei genannt.
- **Der Erzeuger schlägt Änderungen vor, Konsumenten prüfen.** Eine Änderung, die einen Konsumenten bricht, braucht dessen Zustimmung oder eine Übergangsphase, in der beide Versionen unterstützt werden.
- **Brechende Änderungen erhalten ein Auslaufdatum** und eine Frist.
- **Vertragstests liegen beim Vertrag.** Jeder Konsument steuert mindestens eine Beispielnachricht bei, auf die er sich verlässt; der Build des Erzeugers führt sie aus.

Eine kompakte Vertragsdatei hält alles an einem Ort:

```yaml
contract: cve-finding
version: 2.1.0
owner: security-platform
producer: triage
consumers: [notify, report]
input_schema: schemas/finding-input.json
output_schema: schemas/cve-finding.json
compatibility: minor adds optional fields only; major for anything else
approval: none            # read-only handover
```

## Grenzen

- Schemas prüfen die Form, nicht die Richtigkeit. Ein gültiges `severity: "low"` kann trotzdem falsch sein; für die inhaltliche Qualität bleiben Evaluierungen nötig.
- Strikte Schemas können dazu führen, dass ein Modell häufiger scheitert. Messen Sie Wiederholraten und lockern Sie nur bewusst.
- Freitextfelder bleiben ein Kanal für eingeschleuste Anweisungen. Halten Sie sie kurz, zeigen Sie sie als Daten an und geben Sie sie nie ohne Gate als Anweisung an einen anderen Agenten weiter.
- Verträge bedeuten Prozess. Für einen einzelnen Agenten mit zwei Werkzeugen genügen womöglich ein Schema und ein Test.

## Das Wichtigste in Kürze

- Freitext zwischen Agenten durch typisierte Verträge ersetzen: Eingabeschema, Ausgabeschema, Verantwortliche, Version, Kompatibilitätsregel.
- Im Code an beiden Enden jeder Übergabe validieren, außerhalb des Modells.
- Tool-Beschreibungen und Annotationen als nicht vertrauenswürdigen Text behandeln; Genehmigungsregeln neben die Schemas stellen.
- Semantic Versioning für Verträge nutzen und Vertragstests ausführen, wenn sich Modelle oder Prompts ändern.
- Pro Vertrag eine verantwortliche Stelle benennen und für brechende Änderungen die Prüfung durch Konsumenten verlangen.

## Quellen

- [Tools, Model Context Protocol specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [Writing effective tools for AI agents—using AI agents (Anthropic, 2025-09-11)](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Semantic Versioning 2.0.0 (semver.org)](https://semver.org/)
