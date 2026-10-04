---
ref: what-is-mcp
lang: de
title: "Was ist das Model Context Protocol? Eine einfache Erklärung für Plattform-Teams"
description: "Was ist MCP? Das Model Context Protocol standardisiert, wie ein Agent-Host Tools, Ressourcen und Prompts von Servern findet und aufruft. Einfach erklärt."
date: 2026-03-05T09:00:00Z
tags: [mcp, explainer, architecture]
---

Was ist MCP? Das Model Context Protocol ist ein offener Standard dafür, wie eine KI-Anwendung
Fähigkeiten findet und nutzt, die außerhalb des Modells liegen: Tools, die sie aufrufen kann, Daten,
die sie lesen kann, und Prompt-Vorlagen, die sie anbietet. Eine Anwendung (der **Host**) betreibt je
**Server** einen **Client**, und beide tauschen JSON-RPC-Nachrichten aus. MCP ist ein Transportweg
und ein Vokabular. Es ist keine Sicherheitsgrenze, und genau das wird am häufigsten missverstanden.

![Architektur des Model Context Protocol mit Host, Client und Server](/images/blog/what-is-mcp-1.svg)

## Das Problem, das MCP löst

Ohne gemeinsames Protokoll schrieb jede KI-Anwendung für jedes System einen eigenen Anschluss: eine
Integration für den Issue-Tracker, eine für die Datenbank, eine für den Dateispeicher, und das für
jede Anwendung erneut. Anthropic stellte MCP im November 2024 genau mit diesem Argument vor (das
Zitat bleibt im Original):

> It provides a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol.
>
> — Anthropic, [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

Sinngemäß: ein universeller, offener Standard statt zersplitterter Integrationen. Für ein
Plattform-Team ist der Gewinn derselbe wie bei jeder Standardschnittstelle: Ein einmal geschriebener
Anschluss kann mehrere Agenten-Anwendungen bedienen, und eine Agenten-Anwendung kann Anschlüsse
nutzen, die sie nicht selbst geschrieben hat. Der Preis: Ein Anschluss ist jetzt eine Angriffsfläche,
die viele teilen.

## Hosts, Clients und Server

Die Spezifikation kennt drei Rollen.

- **Host.** Die Anwendung, die der Nutzer startet: ein Coding-Assistent, eine Chat-Anwendung oder
  eine Agenten-Plattform. Sie besitzt die Modell-Unterhaltung, die Oberfläche und die Entscheidung,
  was erlaubt ist.
- **Client.** Eine Komponente im Host, die genau eine Verbindung zu genau einem Server hält. Ein Host
  mit drei Servern betreibt drei Clients.
- **Server.** Ein Programm, das Fähigkeiten bereitstellt. Es kann lokal als Kindprozess oder entfernt
  über HTTP laufen und fast alles kapseln: eine Datenbank, ein Ticketsystem, einen Suchindex.

Die Nachrichten sind JSON-RPC. Der Client fragt den Server, was er anbietet, der Host zeigt das dem
Modell, das Modell fordert einen Aufruf an, und der Host schickt (über den Client) die Anfrage ab und
gibt das Ergebnis zurück.

## Die drei Bausteine

Server stellen drei Arten von Dingen bereit.

- **Tools** sind Funktionen, deren Ausführung das Modell anfordern kann. Sie können Nebenwirkungen
  haben.
- **Ressourcen** sind Daten, die der Host lesen und in den Kontext aufnehmen kann, etwa Dateien oder
  Datensätze.
- **Prompts** sind Vorlagen, die Nutzer auswählen können, zum Beispiel eine Standardanfrage für ein
  Review.

Tools bekommen die meiste Aufmerksamkeit, weil sie handeln. Der Beitrag
[Tool, Skill oder Prompt?](/de/posts/tool-skill-or-prompt/) erklärt, warum Tools das Risiko tragen,
das die beiden anderen größtenteils nicht haben.

## Was die Spezifikation zur Zustimmung sagt

Die Spezifikation beschränkt sich nicht auf das Nachrichtenformat. Sie nennt Grundsätze zu Vertrauen
und Sicherheit, und der erste betrifft Menschen:

> Users must explicitly consent to and understand all data access and operations
>
> — Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

Sinngemäß: Nutzer müssen allen Datenzugriffen und Operationen ausdrücklich zustimmen und sie
verstehen. Bei Tools wird sie deutlicher:

> Tools represent arbitrary code execution and must be treated with appropriate caution.
>
> — Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

Und im Abschnitt zu Tools:

> there SHOULD always be a human in the loop with the ability to deny tool invocations.
>
> — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

Man beachte, an wen sich diese Anforderungen richten. Die Spezifikation sagt, *Hosts* sollen
Zustimmung einholen und *Clients* Annotationen misstrauen. Das Protokoll transportiert die
Nachrichten. Es erzwingt die Regeln nicht. Das sind Pflichten der Umsetzenden, und nichts im
Nachrichtenformat hindert einen Host, sie zu ignorieren.

## Warum MCP ein Transportweg ist und keine Sicherheitsgrenze

Daraus folgen drei Dinge.

1. **Annotationen sind Behauptungen.** Ein Tool kann sich als schreibgeschützt beschreiben. Die
   Spezifikation sagt, wie man das zu lesen hat:

   > clients MUST consider tool annotations to be untrusted unless they come from trusted servers.
   >
   > — Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

   Ein Server, den man nicht selbst geschrieben hat, kann alles behaupten; seine Selbstbeschreibung
   kann deshalb nicht die Kontrolle sein.
2. **Tool-Ergebnisse sind Eingabe.** Text, den ein Tool zurückgibt, gelangt in den Kontext des
   Modells. Eine feindliche Seite, ein Ticket oder ein Dokument kann Anweisungen enthalten. Das
   Protokoll trennt Daten nicht von Befehlen.
3. **Eine Nachfrage beim Nutzer ist ein schwaches Gate.** „Erlauben“ klicken funktioniert bei
   wenigen Aufrufen und versagt im Massenbetrieb, weil Menschen aufhören zu lesen. Eine Entscheidung,
   die zählt, muss etwas Deterministisches treffen.

Die Sicherheitsarbeit findet also rund um MCP statt, in Host und Plattform: Welche Server dürfen
angebunden werden, welche Tools welches Servers darf ein Agent sehen, welche Argumente sind
zulässig, und was wird protokolliert. Das ist die Aufgabe eines Policy-Gates im Harness; wo es
sitzt, steht in [Was ist ein Agent-Harness](/de/posts/what-is-an-agent-harness/), und warum es von
Anfang an eingeplant werden muss, steht in
[Agentenarchitektur ist keine Anwendungsarchitektur](/de/posts/agent-architecture-is-not-application-architecture/).

## Eine praktische Checkliste für Plattform-Teams

- **Server inventarisieren.** Jeden genutzten MCP-Server mit Verantwortlichen und Betriebsort kennen.
  Einen hinzuzufügen behandeln wie eine Abhängigkeit mit Netzzugriff.
- **Festlegen und prüfen.** Die Serverversion festlegen, lesen, was seine Tools tun, und das Ergebnis
  der Prüfung aufbewahren.
- **Pro Agent vergeben.** Nicht alle Tools eines Servers allen Agenten zeigen. Ein nicht vergebenes
  Tool sollte in der Tool-Liste des Modells gar nicht erscheinen.
- **Argumente einschränken.** Ein Tool, das jeden String annimmt, ist schwerer zu steuern als eines
  mit Muster und Längengrenze.
- **Vertrauensstufen trennen.** Server, die nicht vertrauenswürdige Inhalte lesen, getrennt halten
  von Servern, die schreiben oder senden können.
- **Entfernte Server authentifizieren.** Für entfernte Server die Autorisierungsverfahren der
  Spezifikation nutzen statt gemeinsamer statischer Schlüssel und Zugangsdaten aus Prompts
  heraushalten.
- **Jeden Aufruf protokollieren.** Server, Tool, Argumente, Entscheidung, Ergebnisgröße und wer für
  wen gehandelt hat.

## Was MCP nicht liefert

- Kein Identitätsmodell für Agenten über das hinaus, was man darum herum baut.
- Keine Budget-, Raten- oder Kostenkontrolle.
- Keine Garantie, dass sich ein Server wie beschrieben verhält.
- Keine Antwort auf Prompt Injection. Das Protokoll transportiert den Text, in dem sie steckt.

Nichts davon ist ein Fehler des Protokolls, es ist eine Abgrenzung. Ein Standard zum Verbinden ist
wertvoll, weil er klein ist, und die Kontrollen gehören der Plattform, die ihn nutzt. Eine offene
Plattform wie open-agentix kann MCP-Server als Tool-Anbieter nutzen und die Entscheidung über jeden
Aufruf in ihrem eigenen Gate behalten.

## Das Wichtigste in Kürze

- MCP standardisiert, wie ein Host Tools, Ressourcen und Prompts findet und aufruft, die Server
  bereitstellen.
- Rollen: Host (die Anwendung), Client (eine Verbindung je Server), Server (der Anbieter).
- Die Spezifikation verlangt Zustimmung und Vorsicht, legt diese Pflichten aber den Umsetzenden auf.
- MCP ist ein Transportweg, keine Sicherheitsgrenze: Annotationen und Ergebnisse sind nicht
  vertrauenswürdige Eingabe.
- Server-Inventar, Rechte pro Agent, Argument-Einschränkungen und Protokollierung gehören in die
  Plattform.

## Quellen

- Anthropic, [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) (2024-11-25)
- Model Context Protocol, [Specification, version 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)
- Model Context Protocol, [Tools (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
