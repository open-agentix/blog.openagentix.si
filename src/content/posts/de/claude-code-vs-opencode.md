---
ref: claude-code-vs-opencode
lang: de
title: "Claude Code vs OpenCode: ein Vergleich aus Governance-Sicht"
description: "Claude Code vs OpenCode bei den Kontrollen eines Plattformteams: Berechtigungen, Auto-Modi, Subagenten, MCP, Anbieter, Konfiguration. Ohne Benchmarks."
date: 2026-06-16T09:00:00Z
tags: [harness, comparison, governance]
---

Claude Code vs OpenCode wird meist über Benchmarks und Geschmack diskutiert. Ein Plattformteam fragt
anderes: Was darf der Agent ohne Rückfrage, lässt sich eine Deny-Regel übersteuern, können Subagenten
weniger bekommen als der Hauptagent, welche Modellanbieter sind möglich und wer kontrolliert die
Konfiguration? Bei den Kontrollen, die für Governance zählen, sind sich die beiden Harnesses ähnlicher,
als man denkt, mit einigen Unterschieden, die Sie testen sollten, bevor Sie sich auf eines festlegen.
Dieser Beitrag vergleicht sie genau an diesen Kontrollen und lässt Benchmarks bewusst weg.

Zuerst ein Vorbehalt. Beide Werkzeuge ändern sich schnell, und die Dokumentation beider ist live. Die
Aussagen unten beruhen auf der Dokumentation, wie sie am 2026-10-04 gelesen wurde, und jeder Punkt sollte
gegen die Version geprüft werden, die Sie tatsächlich einsetzen. Wo hier „prüfen“ steht, ist genau das
gemeint.

## Warum überhaupt Harnesses vergleichen

Wenn Sie [Was ist ein Agent-Harness](/de/posts/what-is-an-agent-harness/) gelesen haben, wissen Sie: Der
Harness, nicht das Modell, entscheidet, welche Werkzeuge es gibt, was dem Modell gezeigt wird und welche
Aufrufe laufen dürfen. Dort sitzt die Governance. Das Modell lässt sich austauschen; die
Berechtigungsengine müssen Sie vertrauen, testen und konfigurieren.

Claude Code wurde von Anthropic Anfang 2025 als Terminal-Werkzeug vorgestellt, in den Worten der
Ankündigung (englisches Originalzitat; sinngemäß: Claude Code ist als begrenzte Forschungsvorschau
verfügbar und lässt Entwickler umfangreiche Engineering-Aufgaben direkt vom Terminal aus an Claude
delegieren):

> Claude Code is available as a limited research preview, and enables developers to delegate substantial engineering tasks to Claude directly from their terminal.

Quelle: [Anthropic, Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet).
Das ist eine Beschreibung zum Start; das Produkt ist seitdem stark gewachsen. OpenCode ist ein
quelloffener Coding-Agent mit eigener Dokumentation, die unten herangezogen wird.

![Funktionsmatrix zweier Coding-Agent-Harnesses für Governance-Kontrollen](/images/blog/claude-code-vs-opencode-1.svg)

## Berechtigungen: erlauben, fragen, verbieten

Beide Werkzeuge modellieren Berechtigungen als Regeln, die zu „erlauben“, „fragen“ oder „verbieten“
führen und gegen Werkzeug und Argumente geprüft werden (etwa ein Shell-Befehlsmuster oder ein Dateipfad).
Beide können in autonomeren Modi laufen, in denen weniger Aktionen nachfragen. Die Governance-Frage ist,
wie diese Modi mit Deny-Regeln zusammenspielen.

Die OpenCode-Dokumentation ist dazu eindeutig (englische Originalzitate; sinngemäß: Ausdrückliche
Deny-Regeln gelten weiterhin; der Auto-Modus ändert nur Anfragen, die sonst nachfragen würden):

> Explicit "deny" rules are still enforced.

> Auto mode only changes requests that would otherwise ask for approval.

Quelle: [OpenCode-Dokumentation, Permissions](https://opencode.ai/docs/permissions/) (Live-Dokumentation,
Wortlaut Stand 2026-10-04). Lesen Sie das als Entwurfsprinzip, das Sie von jedem Harness erwarten sollten:
**Eine Deny-Regel ist ein Boden, den Autonomie-Einstellungen nicht absenken können**, und ein autonomer Modus
sollte nur „fragen“ in „erlauben“ verwandeln. Deshalb gehören harte Grenzen in Deny-Regeln (keine
Schreibzugriffe außerhalb des Arbeitsbereichs, kein Zugriff auf Pfade mit Zugangsdaten, keine
zerstörerischen Befehle).

Prüfen Sie dieselbe Eigenschaft für Claude Code in Ihrer Version: Respektiert ein autonomer oder
Bypass-artiger Modus weiterhin Deny-Regeln und Regeln der verwalteten Konfiguration? Schreiben Sie einen
Test, der eine Deny-Regel setzt, in den autonomsten verfügbaren Modus wechselt und die verbotene Aktion
versucht. Eine Kontrolle, die Sie nicht getestet haben, ist eine Annahme. Das Verhältnis zu menschlichen
Freigaben behandelt [Mensch in der Schleife, der funktioniert](/de/posts/human-in-the-loop-that-works/):
Mit guten Deny-Regeln und einer Grenze um den Prozess verlieren autonome Modi viel von ihrem Schrecken.

## Subagenten

Beide Harnesses unterstützen die Delegation an Subagenten mit eigenen Anweisungen. Die Details
unterscheiden sich auf eine Weise, die für minimale Rechte wichtig ist. Claude Code beschreibt Subagenten
als isoliert (englisches Originalzitat; sinngemäß: Jeder Subagent läuft in einem eigenen Kontextfenster
mit eigenem System-Prompt, eigenem Werkzeugzugriff und eigenen Berechtigungen):

> Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions.

Quelle: [Claude-Code-Dokumentation, Create custom subagents](https://code.claude.com/docs/en/sub-agents)
(Live-Dokumentation, Stand 2026-10-04). OpenCode unterscheidet zwei Arten von Agenten (englisches
Originalzitat; sinngemäß: Es gibt zwei Arten, Primäragenten und Subagenten):

> There are two types of agents in OpenCode; primary agents and subagents.

Quelle: [OpenCode-Dokumentation, Agents](https://opencode.ai/docs/agents/) (Live-Dokumentation, Stand
2026-10-04). Die Governance-Fragen sind bei beiden gleich: Kann ein Subagent einen kleineren Werkzeugsatz
als sein Elternteil bekommen, lassen sich seine Berechtigungen unabhängig setzen, und gilt eine
Deny-Regel des Elternteils auch für Kinder? Behandeln Sie „ein Subagent hält nur, was sein Schritt braucht“
als Anforderung und testen Sie sie.

## MCP und Werkzeuge

Beide Werkzeuge binden MCP-Server an und erben damit die Risiken der MCP-Lieferkette und der
Werkzeugvergiftung. Zu vergleichen ist nicht, ob MCP existiert, sondern wie Server konfiguriert und
freigegeben werden: Stehen Server in Projektdateien, die jeder mit Commit-Recht ändern kann, kann die
Organisation die erlaubten Server einschränken, und lassen sich einzelne MCP-Werkzeuge wie eingebaute
Werkzeuge durch Berechtigungsregeln erfassen? Prüfen Sie, dass ein verbotenes MCP-Werkzeug wirklich
blockiert und nicht nur ausgeblendet wird.

## Anbieterwahl

Das ist der deutlichste praktische Unterschied. Claude Code ist um Anthropic-Modelle gebaut, mit Wegen über
Cloud-Plattformen für Organisationen, die einen bestimmten Vertrag oder eine Region brauchen. OpenCode ist
darauf ausgelegt, mit vielen Modellanbietern zu arbeiten, auch mit lokalen Modellen. Das zählt, wenn Sie
aus Gründen der Datenhaltung ein selbst betriebenes Modell brauchen oder Modelle an eigenen Aufgaben
vergleichen wollen. Aus Governance-Sicht entscheidet der Anbieter, wohin Ihre Prompts und Ihr Code gehen;
die Wahl ist also zuerst eine Datenschutzentscheidung und erst dann eine Qualitätsentscheidung. Prüfen Sie,
welche Anbieter jedes Werkzeug in Ihrer Version unterstützt und wie Zugangsdaten dafür gespeichert werden.

## Konfiguration und zentrale Kontrolle

Ein Plattformteam braucht Einstellungen, die einzelne Entwickler nicht heimlich abschwächen können.
Fragen, die Sie bei beiden Werkzeugen prüfen:

- Gibt es eine Konfigurationsebene auf Organisationsebene, die Vorrang vor Nutzer- und Projektdateien hat?
- Kann diese Ebene Berechtigungsregeln, MCP-Server und Hooks sperren?
- Können Projektdateien (die eigenen Einstellungen eines Repositorys) Berechtigungen erweitern? Wenn ja,
  behandeln Sie ein geklontes Repository als nicht vertrauenswürdige Eingabe.
- Wo liegt der Audit-Trail, und lässt er sich exportieren?

Keines der Werkzeuge ersetzt ein zentrales Gate. Hooks und lokale Regeln laufen auf dem Rechner der
Entwickler; für Durchsetzung bei allen setzen Sie ein zentrales Policy-Gate und eine
[Sandbox](/de/posts/sandboxing-agents/) um die Werkzeuge und behalten die Harness-Regeln als zweite
Schicht.

## Eine Prüfliste für Ihre eigene Bewertung

Führen Sie diese Schritte mit beiden Werkzeugen am selben Repository und mit denselben Aufgaben aus.

1. Setzen Sie eine Deny-Regel für einen Dateipfad; lassen Sie den Agenten ihn sowohl über das
   Dateiwerkzeug als auch über einen Shell-Befehl lesen.
2. Wechseln Sie in den autonomsten Modus und wiederholen Sie Schritt 1.
3. Legen Sie einen Subagenten mit nur lesenden Werkzeugen an und lassen Sie ihn eine Datei schreiben.
4. Binden Sie einen MCP-Server an, verbieten Sie eines seiner Werkzeuge und rufen Sie es auf.
5. Klonen Sie ein Repository, dessen Einstellungsdatei Berechtigungen erweitert, und sehen Sie, was
   wirkt.
6. Richten Sie das Werkzeug auf einen nicht erlaubten Netzwerk-Host und sehen Sie, was angezeigt und
   protokolliert wird.
7. Exportieren Sie Telemetrie oder Logs und prüfen Sie, ob Werkzeugname, Argumente und Entscheidung
   enthalten sind.

Halten Sie die Ergebnisse mit den Versionen fest. Sie werden sich ändern.

## Wichtigste Punkte

- Governance sitzt in der Berechtigungsengine des Harness; vergleichen Sie diese, nicht Benchmark-Werte.
- Eine Deny-Regel sollte ein Boden sein, den autonome Modi nicht absenken. Die OpenCode-Dokumentation
  sagt das; prüfen Sie das Gegenstück bei jedem Werkzeug, das Sie einführen.
- Subagenten brauchen unabhängige Werkzeugsätze und Berechtigungen, um minimale Rechte zu stützen.
- Die Anbieterwahl ist der größte praktische Unterschied und eine Datenschutzentscheidung.
- Testen Sie alles in der eingesetzten Version und behalten Sie ein zentrales Gate über lokale Regeln
  hinaus.

## Quellen

- Anthropic, [Create custom subagents (Claude Code docs)](https://code.claude.com/docs/en/sub-agents) (Live-Dokumentation).
- OpenCode, [Permissions](https://opencode.ai/docs/permissions/) und [Agents](https://opencode.ai/docs/agents/) (Live-Dokumentation).
- Anthropic, [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet) (2025).
