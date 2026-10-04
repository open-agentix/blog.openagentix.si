---
ref: mcp-sampling-elicitation-tasks
lang: de
title: "Mehr als Tools: MCP Sampling, Elicitation und Tasks"
description: "MCP Sampling lässt Server Modellaufrufe anfordern, Elicitation fragt Nutzer, Tasks verfolgen lange Arbeit. Jede verschiebt Kontrolle und braucht eine Policy."
date: 2026-09-08T09:00:00Z
tags: [mcp, explainer, governance]
---

Die meisten Teams kennen das Model Context Protocol (MCP) als Weg, Werkzeuge bereitzustellen. Das Protokoll kann mehr: Ein Server kann den Client um einen Modellaufruf bitten (**MCP Sampling**), den Nutzer um eine Eingabe bitten (**MCP Elicitation**) und seit dem Release vom November 2025 lang laufende Arbeit als **Tasks** verfolgen. Jede dieser Funktionen kehrt die übliche Richtung der Kontrolle um und braucht deshalb eine eigene Policy. Kurz gesagt: Sampling verbraucht Ihr Modellbudget im Auftrag eines Servers, Elicitation stellt die Frage eines Servers einer Person, und Tasks halten Arbeit am Leben, die über die auslösende Anfrage hinausgeht.

![MCP Sampling, Elicitation und Tasks mit ihren Kontrollpunkten](/images/blog/mcp-sampling-elicitation-tasks-1.svg)

Wer MCP noch nicht nutzt, beginnt mit [Was ist MCP](/de/posts/what-is-mcp/). Dieser Beitrag setzt voraus, dass Clients, Server und Tools bekannt sind.

## Sampling: der Server verlangt einen Modellaufruf

Normalerweise ruft das Modell des Clients Werkzeuge auf dem Server auf. Beim Sampling schickt der Server eine Anfrage zurück: "Führe diesen Prompt durch ein Modell und gib mir die Antwort." Die Spezifikation beschreibt den Sinn dieses Entwurfs:

> This flow allows clients to maintain control over model access, selection, and permissions while enabling servers to leverage AI capabilities—with no server API keys necessary.

Quelle: [Sampling, MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling). Sinngemäß: Der Client behält die Kontrolle über Modellzugriff, Modellwahl und Berechtigungen, und Server können KI nutzen, ohne eigene API-Schlüssel zu brauchen.

Daraus folgt zweierlei. Der Vorteil: Ein Server braucht keine eigenen Modell-Zugangsdaten, und der Client entscheidet, welches Modell antwortet. Das Risiko: Der Prompt des Servers läuft nun auf Ihrem Konto und Ihrem Budget, und die Antwort geht an eine Komponente zurück, die Sie womöglich nicht kontrollieren.

Fragen, die vor dem Einschalten zu klären sind:

- **Welche Server dürfen überhaupt Sampling nutzen?** Standardmäßig keiner; Freigabe je Server.
- **Wer sieht den Prompt?** Eine menschliche Freigabe oder zumindest eine protokollierte Kopie macht die Anfrage eines Servers sichtbar statt unbemerkt.
- **Welches Modell, welche Grenzen?** Das Modell auf dem Client wählen, Tokens je Anfrage und Anfragen je Lauf begrenzen und die Kosten dem aufrufenden Agenten anrechnen.
- **Was kommt zurück?** Die Antwort gilt als nicht vertrauenswürdiger Text eines Servers, nicht als verlässliche Anweisung. Ein Server kann Prompts so gestalten, dass das Modell etwas schreibt, das anderswo weiterverwendet wird.

## Elicitation: der Server fragt den Nutzer

Mit Elicitation kann ein Server strukturierte Eingaben von der Person verlangen, die den Client nutzt, etwa einen fehlenden Parameter oder eine Bestätigung. Das ist nützlich, wenn einem Tool-Aufruf ein Detail fehlt, das nur der Nutzer kennt. Es ist aber auch eine Möglichkeit, dass ein Server eine Frage mit der Glaubwürdigkeit des Clients stellt. Die Spezifikation zieht eine klare Grenze:

> Servers MUST NOT use elicitation to request sensitive information.

Quelle: [Elicitation, MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation). Sinngemäß: Server dürfen Elicitation nicht nutzen, um sensible Informationen abzufragen.

Praktische Regeln:

- **Zeigen, wer fragt.** Die Abfrage muss den Server nennen, damit Nutzer eine Frage Ihrer Plattform von der Frage eines Drittanbieter-Tools unterscheiden können.
- **Anfragen nach Geheimnissen ablehnen.** Passwörter, API-Schlüssel und Zahlungsdaten gehören nicht in ein Elicitation-Formular; ein Client kann Felder, die danach aussehen, mit einer einfachen Prüfung blockieren.
- **Ablehnen und Abbrechen zulassen.** Wer Nein sagt, darf nicht in einer Schleife erneut gefragt werden.
- **Nicht als Freigabeverfahren missbrauchen.** Freigaben gehören in Ihre Policy-Schicht, mit Rollen und Protokoll; siehe [Human in the Loop, das funktioniert](/de/posts/human-in-the-loop-that-works/).

## Tasks: lange Arbeit als eigenes Objekt

Nicht jeder Tool-Aufruf endet nach Sekunden. Ein Repository zu indizieren, einen Build zu starten oder auf die Freigabe einer Person zu warten kann Minuten oder Stunden dauern. Das Release der Spezifikation vom November 2025 führte dafür Tasks ein. Der Jubiläumsbeitrag des Projekts fasst es knapp zusammen:

> Tasks provide a new abstraction in MCP for tracking the work being performed by an MCP server.

Quelle: [One Year of MCP: November 2025 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/), veröffentlicht am 25.11.2025. Sinngemäß: Tasks sind eine neue Abstraktion, um die Arbeit eines MCP-Servers zu verfolgen.

Statt eine Verbindung offen zu halten, startet der Client die Arbeit, erhält ein Handle und fragt später den Status ab. Daraus ergeben sich Governance-Fragen:

- **Identität über die Zeit.** Wessen Befugnis gilt, wenn der Task eine Stunde später fertig wird? Ist das Token abgelaufen oder der Nutzer ausgeschieden, sollte die Antwort "stoppen" lauten, nicht "mit veralteter Freigabe weitermachen". Siehe [MCP-Autorisierung mit OAuth](/de/posts/mcp-authorization-oauth/).
- **Budgets und Zeitlimits.** Ein Task braucht eine eigene Frist und ein eigenes Kostenlimit, sonst ist ein vergessener Task ein schleichendes Leck.
- **Abbruch.** Es muss einen Weg geben, ihn zu stoppen, und einen Eintrag, dass er gestoppt wurde.
- **Sichtbarkeit.** Laufende Tasks je Agent und je Mandant auflisten, so wie laufende Agentenläufe.

## Eine Policy-Tabelle als Startpunkt

| Funktion | Wer löst aus | Was verschiebt sich | Mindestkontrolle |
| --- | --- | --- | --- |
| Sampling | Server | Modellkosten und Prompt-Inhalt | Allowlist je Server, Token-Limit, protokollierter Prompt, Kosten beim Aufrufer verbucht |
| Elicitation | Server | Eine Frage an eine Person | Server im Prompt genannt, keine sensiblen Felder, Ablehnen möglich |
| Tasks | Client, Arbeit liegt beim Server | Zeit und Befugnis | Frist, Budget, Abbruch, Statusliste |

Behandeln Sie die drei Funktionen als Fähigkeiten, die aus sind, bis eine Policy sie einschaltet. Aktiviert Ihre Client-Bibliothek sie standardmäßig, sollten Sie die Voreinstellungen prüfen.

## Was protokolliert werden sollte

Bei jeder Sampling-Anfrage: Server, anfragender Agent, Modell, Token-Zahlen und ob eine Person zugestimmt hat. Bei jeder Elicitation: Server, die abgefragten Felder, Antwort oder "abgelehnt". Bei jedem Task: ID, Eigentümer, Start, Statuswechsel, Ende und die verwendete Identität. Mit diesen Einträgen lässt sich eine Woche später beantworten, warum ein Server Ihre Tokens verbraucht hat.

## Hinweise zu Version und Kompatibilität

Die Links oben verweisen auf die Spezifikationsseiten von 2025-06-18 für Sampling und Elicitation und auf den Beitrag des Projekts zum Release vom 25.11.2025, das Tasks einführte. Funktionen und Formulierungen können sich zwischen Spec-Versionen unterscheiden, und nicht jeder Client oder Server unterstützt alle drei. Prüfen Sie, was Ihr Client umsetzt, bevor Sie darauf aufbauen, und testen Sie die Pfade für Ablehnen und Abbrechen, nicht nur den Normalfall.

## Das Wichtigste in Kürze

- Sampling, Elicitation und Tasks lassen Server Modellaufrufe, Nutzereingaben und lange Arbeit anfordern; jede Funktion verschiebt Kontrolle.
- Sampling verbraucht Ihr Budget: Server freigeben, Tokens begrenzen, Prompts protokollieren, Antworten als nicht vertrauenswürdig behandeln.
- Elicitation darf nie sensible Informationen abfragen, muss den fragenden Server nennen und Ablehnen erlauben.
- Tasks überdauern die Anfrage: Fristen, Budgets, Abbruch und eine Identität, die abläuft.
- Alle drei standardmäßig aus lassen und je Server mit schriftlicher Policy einschalten.

## Quellen

- Model Context Protocol, [Sampling (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling).
- Model Context Protocol, [Elicitation (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation).
- Model Context Protocol Blog, [One Year of MCP: November 2025 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/), 25.11.2025.
