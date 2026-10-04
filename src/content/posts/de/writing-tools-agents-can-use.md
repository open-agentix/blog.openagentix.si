---
ref: writing-tools-agents-can-use
lang: de
title: "Tools schreiben, die Agenten wirklich nutzen können: Namen, Schemas und Fehler"
description: "Tool-Design für KI-Agenten ist Schnittstellen-Design für ein Modell als Leser. Checkliste zu Namen, Namespaces, Schemas, Fehlern und kleinen Tools."
date: 2026-03-19T09:00:00Z
tags: [tools, mcp, how-to]
---

Tool-Design für KI-Agenten ist Schnittstellen-Design für einen ungewöhnlichen Leser: ein Sprachmodell,
das nur den Namen des Tools, seine Beschreibung, sein Eingabeschema und das sieht, was das Tool
zurückgibt. Es kann weder Ihren Quellcode lesen noch Kolleginnen fragen. Sind diese vier Dinge klar,
ruft der Agent das Tool korrekt auf. Sind sie vage, rät er. Dieser Beitrag ist eine Checkliste für
Namen, Namespaces, enge Eingaben und Fehlermeldungen, die dem Modell sagen, was als Nächstes zu tun
ist, plus der Nebeneffekt: Kleine, präzise Tools machen Policy-Entscheidungen deutlich einfacher.

![Vorher und nachher: eine Tool-Definition, aufgeteilt in enge Tools](/images/blog/writing-tools-agents-can-use-1.svg)

## Warum ein Tool mehr ist als ein API-Wrapper

Ein Tool sitzt zwischen einem probabilistischen Aufrufer und einem deterministischen System. Daraus
folgen zwei Dinge. Erstens wird der Aufrufer gelegentlich das falsche Tool wählen oder seltsame
Argumente senden; die Schnittstelle sollte den richtigen Aufruf naheliegend und den falschen
unmöglich oder billig machen. Zweitens muss, wer Aufrufe freigibt (ein Mensch oder eine Policy), allein
aus Name und Argumenten verstehen, was ein Aufruf tut. Ein Tool namens `do_anything` mit einem
freien `payload` ist für das Modell schwer und lässt sich nicht steuern.

Das Muster aus Denken und Handeln, dem viele Agentenschleifen folgen, beschrieb das ReAct-Paper
so, dass Modelle (Zitat im Original)

> generate both reasoning traces and task-specific actions in an interleaved manner
>
> — arXiv, [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)

also sinngemäß Denkspuren und aufgabenspezifische Aktionen verschränkt erzeugen. Jede Aktion in dieser
Schleife ist ein Tool-Aufruf, und jedes Ergebnis geht zurück in den Kontext des Modells. Deshalb
zählen Tool-Ergebnisse so viel wie Tool-Eingaben.

## 1. Namen, die sagen, was passiert

- Verb und Substantiv verwenden: `read_ticket`, `add_comment`, `open_pull_request`.
- Sagen, was es tut, nicht wie: `search_customers`, nicht `run_sql_query`.
- Beinahe-Duplikate vermeiden (`get_user`, `fetch_user`, `lookup_user`). Das Modell kann sie nicht
  unterscheiden, und Prüfende auch nicht.
- Nebenwirkungen im Namen sichtbar machen. Ein lesendes und ein schreibendes Tool sollten nicht einen
  Namen teilen, bei dem ein Flag den Modus umschaltet.

## 2. Namespaces für zusammengehörige Tools

Sobald ein Agent Dutzende Tools sieht, kollidieren Namen und die Aufmerksamkeit verdünnt sich.
Anthropics Artikel zum Schreiben von Tools für Agenten empfiehlt Präfixe (Zitat im Original):

> Namespacing (grouping related tools under common prefixes) can help delineate boundaries between lots of tools; MCP clients sometimes do this by default.
>
> — Anthropic, [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

In der Praxis: `crm.read_ticket`, `crm.add_comment`, `git.open_pr`. Das Präfix sagt dem Modell, zu
welchem System ein Tool gehört, und gibt der Policy eine natürliche Einheit zum Erlauben oder
Verbieten. Ein Agent, der Tickets bearbeitet, bekommt `crm.*` und nichts unter `git.*`.

## 3. Enge Eingaben

Ein Schema ist Dokumentation und Validator zugleich. Nutzen Sie es vor allem als Validator.

- Aufzählungen statt Freitext, wenn die Auswahl bekannt ist.
- Muster und Längengrenzen für Strings: Ein Ticket-Schlüssel passt auf `^SEC-\d+$`, ein Kommentar hat
  höchstens 2000 Zeichen.
- Pflichtfelder als Pflicht kennzeichnen und für den Rest sinnvolle Vorgaben setzen.
- Einheiten und Formate in die Feldbeschreibung schreiben („ISO-8601-Datum“, „Betrag in Cent“).
- Keine rohen Abfragesprachen, Shell-Befehle oder URLs annehmen, außer das ist der ganze Zweck des
  Tools.

Ein kurzes Beispiel in JSON-Schema-Form:

```json
{
  "name": "crm.add_comment",
  "description": "Add one internal comment to an existing ticket. Does not notify the customer.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketKey": { "type": "string", "pattern": "^SEC-\\d+$" },
      "comment":   { "type": "string", "maxLength": 2000 }
    },
    "required": ["ticketKey", "comment"],
    "additionalProperties": false
  }
}
```

Die Beschreibung nennt, was das Tool tut und eine Sache, die es nicht tut. Das Schema weist alles
außerhalb der deklarierten Form zurück, sodass eine deterministische Schicht es durchsetzen kann,
bevor der Aufruf läuft.

## 4. Beschreibungen für einen Leser ohne Kontext

Schreiben Sie die Beschreibung, als hätte der Leser Ihr System nie gesehen:

- Erster Satz: was das Tool tut und wann man es nutzt.
- Zweiter: was es nicht tut oder welches andere Tool stattdessen zu nehmen ist.
- Voraussetzungen nennen („benötigt einen bestehenden Ticket-Schlüssel“).
- Kurz halten. Jede Beschreibung wird in jedem Zug bezahlt, in dem sie angeboten wird.

## 5. Fehler, die dem Modell sagen, was als Nächstes zu tun ist

Ein nacktes `500` oder `error: invalid input` lässt das Modell blind wiederholen. Ein guter Fehler
sagt, was falsch war und wie ein gültiger Aufruf aussieht:

```text
ticketKey "SEC-abc" does not match ^SEC-\d+$. Use the numeric key, for example SEC-1042.
Call crm.search_tickets to find the key.
```

Faustregeln:

- Das Feld und die verletzte Regel nennen.
- Ein Beispiel für einen gültigen Wert geben.
- Auf das Tool verweisen, das das Problem löst.
- „Wiederholen ist sinnvoll“ von „nicht wiederholen“ unterscheiden, damit Schleifen enden.
- Nie Geheimnisse, Stacktraces oder interne Pfade in einen Fehler schreiben; das Modell liest sie, und
  sie landen in Logs.

## 6. Ergebnisse, die klein und strukturiert sind

Tool-Ergebnisse gelangen in den Kontext. Geben Sie zurück, was der nächste Schritt braucht, nicht den
ganzen Datensatz.

- Lieber eine kurze Liste benannter Felder als einen vollständigen Dump.
- Seitenweise liefern und sagen, wie viele Ergebnisse noch ausstehen.
- Kennungen zurückgeben, die das Modell an den nächsten Aufruf weiterreichen kann.
- Daran denken, dass zurückgegebener Text Eingabe für das Modell ist. Enthält ein Ergebnis Inhalte von
  außen, etwa einen Ticket-Text oder eine Webseite, kann es Anweisungen tragen. Solche Inhalte
  kennzeichnen oder trennen, und Tools, die Außeninhalte liefern, von schreibenden Tools getrennt
  halten.

## 7. Kleine Tools machen Policies einfach

Enge Tools sind gut für das Modell und gut für die Steuerung. Eine Entscheidung wie „darf dieser Agent
einen Kommentar zu einem Ticket hinzufügen, dessen Schlüssel mit SEC- beginnt?“ ist leicht zu schreiben
und leicht zu prüfen. Dieselbe Entscheidung für `do_anything(action, target, payload)` erfordert das
Parsen von Freitext, was keine Regel zuverlässig kann. Das Gate aus
[Policy entscheidet, Audit beweist](/de/posts/policy-decides-audit-proves/) funktioniert am besten,
wenn jedes Tool einen klaren Namen, ein typisiertes Schema und eine begrenzte Wirkung hat.

Das Model Context Protocol, erklärt in [Was ist MCP?](/de/posts/what-is-mcp/), bringt zwei Punkte
mit, die Tool-Autoren im Kopf behalten sollten. Die Spezifikation erwartet, dass ein Mensch Aufrufe
ablehnen kann:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

und sie sagt Clients, wie sie behandeln sollen, was ein Tool über sich selbst behauptet:

> clients MUST consider tool annotations to be untrusted unless they come from trusted servers.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

Verlassen Sie sich deshalb nicht auf einen „read-only“-Hinweis als Schutz. Wenn ein Tool nicht
schreiben darf, machen Sie es unfähig zu schreiben: getrennte Zugangsdaten, eine schreibgeschützte
Verbindung, ein enges Schema.

## 8. Tools mit einem Modell testen, nicht nur mit Unit-Tests

Unit-Tests zeigen, dass die Funktion arbeitet. Sie zeigen nicht, dass ein Modell sie richtig wählt.
Lassen Sie eine kleine Menge realistischer Aufgaben laufen, lesen Sie die Verläufe und suchen Sie
falsche Tool-Wahl, fehlerhafte Argumente und Schleifen nach Fehlern. Beheben Sie zuerst Namen,
Beschreibungen und Fehlermeldungen. Werden zwei Tools verwechselt, führen Sie sie zusammen oder
benennen sie um. Wird ein Tool nie gewählt, sagt seine Beschreibung vermutlich nicht, wann man es
nutzt. Zur Frage, wohin eine Anleitung überhaupt gehört, siehe
[Tool, Skill oder Prompt?](/de/posts/tool-skill-or-prompt/).

## Checkliste

- [ ] Verb-Substantiv-Name mit Namespace-Präfix
- [ ] Eine Aufgabe je Tool; Lesen und Schreiben getrennt
- [ ] Schema mit Enums, Mustern und Längengrenzen; `additionalProperties: false`
- [ ] Beschreibung: was, wann, was nicht
- [ ] Fehler nennen das Feld, geben ein Beispiel und zeigen die Abhilfe
- [ ] Ergebnisse klein, strukturiert und seitenweise
- [ ] Pro Agent vergeben, pro Aufruf entschieden, protokolliert
- [ ] Mit echten Modellverläufen getestet

## Das Wichtigste in Kürze

- Name, Beschreibung, Schema und Ergebnisse eines Tools sind die gesamte Schnittstelle, die das Modell
  sieht.
- Klare Verb-Substantiv-Namen und Namespaces gruppieren verwandte Tools, sodass sie gemeinsam vergeben
  werden können.
- Enge Schemas sind Dokumentation, Validierung und Ansatzpunkt für Policies zugleich.
- Fehler schreiben, die sagen, was falsch war, was gültig ist und was als Nächstes aufzurufen ist.
- Die Selbstbeschreibung eines Tools nicht als Kontrolle behandeln; Grenzen außerhalb des Modells
  durchsetzen.

## Quellen

- Anthropic, [Writing effective tools for AI agents—using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (2025-09-11)
- Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- arXiv, [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) (2022-10-06)
