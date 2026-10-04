---
ref: secrets-for-agents
lang: de
title: "Betriebsreihe: Geheimnisse gehören nie in das Kontextfenster eines Agenten"
description: "Secrets Management für KI-Agenten in der Praxis: Zugangsdaten bleiben auf der Tool-Seite, das Modell sieht nur Handles, Token-Passthrough entfällt."
date: 2026-04-02T09:00:00Z
tags: [operations, secrets, security]
---

**Secrets Management für KI-Agenten** lässt sich auf eine Regel verkürzen: Ein Zugangsdatum darf nie in das
Kontextfenster des Modells gelangen. Alles, was das Modell lesen kann, kann in einer Ausgabe, einer Logzeile,
einem Tool-Argument oder einem exportierten Transkript landen. Zugangsdaten leben deshalb auf der Tool-Seite
und werden beim Aufruf von einem Tresor oder der Laufzeit eingesetzt. Das Modell sieht nur Namen und Handles
wie `crm.read`. Der Beitrag gehört zur Betriebsreihe, die Agenten als gewöhnliche Workloads behandelt, wie in
[Agent-Betrieb ist einfach Betrieb](/de/posts/agent-ops-is-just-ops/) eingeführt.

## Warum ein Geheimnis im Prompt ein verlorenes Geheimnis ist

Viele Teams kopieren zunächst „nur für den Prototyp“ einen API-Schlüssel in den Systemprompt. Schauen Sie, wohin
der Text von dort aus wandert:

- Er geht mit jeder Anfrage an den Modellanbieter.
- Er erscheint in Logs, Traces und Evaluations-Transkripten.
- Das Modell kann ihn wiederholen, etwa auf die Bitte „Zeige die Konfiguration“ oder nach einer eingeschleusten
  Anweisung. Ein Agent, der nicht vertrauenswürdige Inhalte liest, wie in [Das tödliche
  Trifecta](/de/posts/the-lethal-trifecta/) beschrieben, kann dazu gebracht werden, seinen Kontext
  irgendwohin zu senden.
- Er wird in jeden Sub-Agent-Prompt kopiert, der den Kontext erbt.

Den Schlüssel danach zu rotieren behebt einen Vorfall, nicht die Gewohnheit. Das sichere Design macht den
Abfluss strukturell unmöglich, weil das Geheimnis nie im Text stand.

## Konfiguration von Code trennen, beides vom Modell

Die Twelve-Factor-Methodik fordert seit Langem, dass umgebungsspezifische Werte nicht in den Code gehören:

> twelve-factor, which requires strict separation of config from code.
>
> [The Twelve-Factor App: III. Config](https://12factor.net/config) (12factor.net)

Sinngemäß: Twelve-Factor verlangt eine strikte Trennung von Konfiguration und Code. Bei Agenten kommt eine dritte
Schicht hinzu. Prompts, Skills und Tool-Beschreibungen sind codeähnliche Artefakte, die versioniert und geprüft
werden. Zugangsdaten sind Konfiguration. Der Modellkontext ist keines von beiden. Hilfreich ist ein Modell mit
vier Zonen:

```text
Repository        Prompts, Skills, Tool-Schemas, Policies       (keine Secrets)
Laufzeit-Config   Tresorpfade, Endpunkte, je Umgebung            (nur Verweise)
Secret-Store      Token, Schlüssel, Zertifikate                  (in Tools eingesetzt)
Modellkontext     Toolnamen, Handles, Aufgabentext               (nie Secrets)
```

Das Repository darf öffentlich sein. Der Modellkontext darf jahrelang im Log stehen. Nur der Secret-Store
braucht das strenge Zugriffsregime.

![Zugangsdaten bleiben in der Tool-Laufzeit, außerhalb des Modellkontexts](/images/blog/secrets-for-agents-1.svg)

## Die Tool-Laufzeit hält die Zugangsdaten

In der Praxis ist das Muster eine dünne Grenze zwischen Modell und Außenwelt:

1. Das Modell bittet, ein Tool mit Namen und Argumenten aufzurufen, zum Beispiel `tickets.add_comment`.
2. Die Laufzeit prüft den Aufruf gegen die Policy: Tool, Argumente, handelnde Identität.
3. Ist er erlaubt, holt die Laufzeit das Zugangsdatum nur für dieses eine Tool aus dem Secret-Store, führt die
   Anfrage aus und gibt nur das Ergebnis zurück.
4. Das Zugangsdatum wird nach dem Aufruf aus dem Speicher verworfen und ist nie Teil des zurückgegebenen Texts.

Eine Tool-Definition verweist dann per Namen auf ein Secret, statt seinen Wert zu tragen:

```yaml
tools:
  - server: tickets
    tool: add_comment
    credential: vault://agents/tickets-writer   # ein Handle, von der Laufzeit aufgelöst
    args:
      key:     { type: string, pattern: "^SEC-\\d+$" }
      comment: { type: string, maxLength: 2000 }
```

Gibt ein Tool eine Fehlermeldung zurück, die einen Authorization-Header wiedergibt, bereinigen Sie sie, bevor
sie in den Kontext zurückkehrt. Fehlertexte von Tools sind wie jede andere Tool-Ausgabe nicht vertrauenswürdig.

## Ein Zugangsdatum pro Tool, auf die Aufgabe zugeschnitten

Ein gemeinsamer „Agent-Token“, der überall funktioniert, unterläuft das Prinzip minimaler Rechte. Besser:

- **Ein Zugangsdatum pro Tool oder System**, damit ein Leck ein System betrifft, nicht alle.
- **Enge Scopes**: nur lesend, wo der Schritt nur liest; ein einzelnes Projekt oder Repository statt der ganzen
  Organisation.
- **Kurze Laufzeiten**: Token, die nach Minuten ablaufen und pro Lauf ausgestellt werden, statt statischer
  Schlüssel, die Jahre gelten.
- **Zuordnung zur Identität**: Das Zugangsdatum spiegelt die Person oder den Dienst, in deren Auftrag der Agent
  handelt, siehe [Agenten-Identität und Delegation](/de/posts/agent-identity-and-delegation/).

OWASP nennt das zugrunde liegende Prinzip für die Abwehr von Prompt-Injection direkt:

> Restrict the model’s access privileges to the minimum necessary for its intended operations.
>
> [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) (OWASP Gen AI Security Project)

Sinngemäß: Die Zugriffsrechte des Modells auf das für seine Aufgaben nötige Minimum beschränken. Dieselbe Seite
empfiehlt bei hohem Schadenspotenzial eine menschliche Kontrolle:

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.
>
> [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) (OWASP Gen AI Security Project)

## Token-Passthrough ist ein Anti-Pattern

Verlockend ist die Abkürzung, den Token, den der Nutzer dem Agenten vorlegt, an die nachgelagerte API
weiterzureichen. Der Server in der Mitte handelt dann ohne eigene Identität, Audit-Spuren zeigen auf die falsche
Partei, und jeder Server, der fremde Token akzeptiert, lässt sich als „Confused Deputy“ missbrauchen. Die
Sicherheitsempfehlungen des Model Context Protocol sind eindeutig:

> MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.
>
> [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices) (Model Context Protocol)

Sinngemäß: MCP-Server dürfen keine Token akzeptieren, die nicht ausdrücklich für sie ausgestellt wurden. Dasselbe
Dokument warnt vor einer verwandten Abkürzung, Sitzungskennungen als Identitätsnachweis zu nutzen:

> MCP Servers MUST NOT use sessions for authentication.
>
> [Security Best Practices (MCP 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices) (Model Context Protocol)

Die Lösung ist ein Token-Austausch: Der Tool-Server authentifiziert den Aufrufer und beschafft sich dann ein
eigenes nachgelagertes Zugangsdatum, zugeschnitten auf diesen Zweck. Der Agent hält den nachgelagerten Token
gar nicht erst.

## Eine Checkliste für den Betrieb

```text
[ ] Kein Secret in Prompts, Skills, Tool-Beschreibungen oder Beispiel-Transkripten
[ ] Secrets löst die Laufzeit beim Aufruf aus einem Tresor auf
[ ] Ein Zugangsdatum pro Tool, nur lesend, wenn der Schritt nicht schreibt
[ ] Token sind kurzlebig und werden automatisch rotiert
[ ] Tool-Fehler und Logs sind von Authorization-Headern und Schlüsseln bereinigt
[ ] Ein Secret-Scanner läuft über Repository und exportierte Transkripte
[ ] Vorfallplan: welcher Schlüssel wird in welcher Reihenfolge von wem gesperrt
```

Lassen Sie den Scanner auch über Transkripte laufen, nicht nur über Code. Dort tauchen durchgesickerte Werte
zuerst auf.

## Grenzen

Handles schützen den Kontext des Modells, nicht die Maschine. Ein Tool mit breitem Zugangsdatum und lockerem
Argumentschema kann innerhalb seines Geltungsbereichs weiter Schaden anrichten. Deshalb zählen Argumentgrenzen
und Freigaben. Eine kompromittierte Laufzeit legt jedes Zugangsdatum offen, das sie auflösen kann: Isolieren Sie
sie und geben Sie ihr nur die Secrets, die ihre Tools brauchen.

## Das Wichtigste in Kürze

- Behandeln Sie das Kontextfenster als öffentlich: Nichts darin sollte den Diebstahl lohnen.
- Zugangsdaten bleiben in der Tool-Laufzeit und werden beim Aufruf aus einem Tresor eingesetzt.
- Ein enges, kurzlebiges Zugangsdatum pro Tool, nie ein gemeinsamer Agent-Token.
- Nutzer-Token nicht an Folgedienste durchreichen, sondern austauschen.
- Code und Transkripte auf Secrets scannen, Tool-Fehler bereinigen.

## Quellen

- [The Twelve-Factor App: III. Config](https://12factor.net/config), 12factor.net.
- [Security Best Practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices), Model Context Protocol, 2025-06-18.
- [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), OWASP Gen AI Security Project.
