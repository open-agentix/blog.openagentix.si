---
ref: open-source-tools-around-claude-code
lang: de
title: "Fünf offene Werkzeuge rund um Claude Code: Alternativen, Begleiter und was sie wirklich sind"
description: "OpenCode, OpenRouter, Open WebUI, openagentix und Ollama ehrlich eingeordnet: Harness, Router, Chat-Oberfläche, Plattform oder Laufzeit. Wo sie passen und wie sie zusammenspielen."
date: 2026-10-13T07:00:00+02:00
tags: [harness, comparison, self-hosted, open-source]
---

Listen mit „Open-Source-Alternativen zu Claude Code“ stellen meist sehr verschiedene Dinge nebeneinander.
Von den fünf Werkzeugen in diesem Beitrag ist nur eines eine direkte Alternative: OpenCode ist wie Claude
Code ein Harness für Coding-Agenten. Die anderen gehören zu anderen Schichten. OpenRouter ist ein
gehosteter Modell-Router, Open WebUI eine Chat-Oberfläche, Ollama eine lokale Laufzeit für Modelle, und
openagentix ist eine Plattform, die Agenten auf Ereignisse hin hinter einer Policy-Schranke ausführt.
Mehrere davon sind eher Begleiter, und eines ist gar keine Open-Source-Software. Dieser Beitrag ordnet sie
nach Schichten, sagt, wo sie passen und wo nicht, und zeigt, wie sie sich kombinieren lassen.

Vorweg eine Einschränkung: Alle fünf Projekte ändern sich schnell. Aussagen über Produkte Dritter beruhen
auf öffentlicher Dokumentation und den Repositories mit Stand 2026-10 und sollten an der Version geprüft
werden, die Sie tatsächlich einsetzen. openagentix ist unser eigenes Projekt; es ist Open Source, noch vor
1.0 und in Arbeit, und Geplantes kennzeichnen wir als geplant.

## Fünf Schichten, nicht fünf Konkurrenten

![Fünf Werkzeuge auf den Schichten eines Agenten-Stacks](/images/blog/open-source-tools-around-claude-code-1.svg)

Ein Agenten-Aufbau hat einige getrennte Aufgaben, die der Beitrag [Was ist ein
Agenten-Harness?](/de/posts/what-is-an-agent-harness/) ausführlicher beschreibt:

- **Oberfläche:** wo ein Mensch tippt und liest (Terminal, IDE, Chatfenster).
- **Harness:** die Schleife, die Kontext an ein Modell schickt, Tool-Aufrufe empfängt, Berechtigungen
  prüft und Tools ausführt. Hier sitzt Claude Code.
- **Modellzugang:** wie Anfragen ein Modell erreichen, mit welchem Schlüssel und über welchen Anbieter.
- **Modell-Laufzeit:** wo die Inferenz läuft, wenn Sie das Modell selbst betreiben.
- **Plattform:** wer Agenten ohne Menschen an der Tastatur auslöst und wer Policy, Audit und Budgets über
  viele Läufe und Teams hinweg durchsetzt.

Claude Code deckt Oberfläche und Harness ab und nutzt Anthropic-Modelle (direkt oder über die
Cloud-Plattformen, die Anthropic unterstützt). Es ist ein proprietäres Produkt und nicht unter einer
Open-Source-Lizenz veröffentlicht. Die fünf Werkzeuge unten füllen eine oder mehrere der anderen
Schichten.

## OpenCode: die eigentliche Alternative (Harness)

OpenCode ist ein quelloffener Coding-Agent für das Terminal unter MIT-Lizenz. Es ist das einzige Werkzeug
in dieser Liste, das dieselbe Aufgabe erfüllt wie Claude Code: das Repository lesen, planen, Dateien
ändern, Befehle ausführen und nach Regeln um Erlaubnis fragen. Einen Vergleich der beiden bei den
Steuerungsmöglichkeiten finden Sie in [Claude Code vs OpenCode](/de/posts/claude-code-vs-opencode/).

**Stärke:** die Wahl des Anbieters. OpenCode ist darauf ausgelegt, mit vielen Modellanbietern zu
arbeiten, auch mit lokalen Modellen hinter einem OpenAI-kompatiblen Endpunkt. Damit ist es die naheliegende
Wahl, wenn ein Team aus Gründen der Datenhaltung ein selbst betriebenes Modell braucht oder Modelle mit
einem Harness an eigenen Aufgaben vergleichen will.

**Schwäche:** Der Harness ist nur so gut wie das Modell dahinter. Mit einem kleinen lokalen Modell werden
lange Tool-Schleifen und Änderungen über mehrere Dateien spürbar unzuverlässiger, und das liegt am
Modell, nicht an OpenCode. Zentrale Konfiguration und Audit für eine ganze Organisation sind außerdem
nicht das, wofür ein Terminal-Werkzeug für einzelne Personen gebaut ist; prüfen Sie, was Ihre Version
bietet, bevor Sie es annehmen.

## OpenRouter: ein Router, und kein Open Source

OpenRouter ist ein gehosteter Dienst, der eine API, einen Schlüssel und eine Rechnung für Modelle vieler
Anbieter bereitstellt, mit OpenAI-kompatibler Schnittstelle. Er gehört zur Schicht Modellzugang. Es ist ein
kommerzieller Dienst, kein Open-Source-Werkzeug: Sie können ihn nicht selbst betreiben. Er steht in dieser
Liste, weil er oft in einem Atemzug genannt wird, und das sollte man offen sagen.

**Stärke:** viele Modelle ausprobieren, ohne bei jedem Anbieter ein Konto zu eröffnen, und einen Harness
wie OpenCode durch Ändern einer Modellkennung zwischen Modellen wechseln. Routing- und
Ausweichoptionen beschreibt die [Anleitung zur Anbieterauswahl](https://openrouter.ai/docs/guides/routing/provider-selection)
(laufend aktualisierte Dokumentation; prüfen Sie die aktuellen Optionen).

**Schwäche:** Er fügt Ihrem Datenfluss eine weitere Partei hinzu. Prompts, Code und Tool-Ergebnisse gehen
durch den Router und durch den Modellanbieter, die Datenschutzprüfung umfasst also zwei Unternehmen statt
eines. Routing kann außerdem bedeuten, dass derselbe Modellname von verschiedenen Anbietern im Hintergrund
bedient wird; das zählt, wenn Sie ein Ergebnis reproduzieren wollen. Wenn Sie routen, legen Sie die
Anbieterwahl fest, auf die Sie sich verlassen, und protokollieren Sie sie je Lauf. Die Schlüsselseite
behandelt [BYOK erklärt](/de/posts/byok-explained/).

## Open WebUI: eine Chat-Oberfläche (mit lesenswerter Lizenz)

Open WebUI ist eine selbst betriebene Weboberfläche zum Chatten mit Modellen. Sie verbindet sich mit
Ollama und OpenAI-kompatiblen APIs und bringt Funktionen wie Dokument-Upload, Wissensdatenbanken und
Benutzerverwaltung mit. Sie gehört zur Schicht Oberfläche. Für Menschen, die Fragen stellen wollen, ist
sie ein gutes Frontend; ein Coding-Agenten-Harness, der ein Repository in einer Schleife ändert, ist sie
nicht.

Die Lizenz verdient einen Satz. Seit Version 0.6.6 (April 2025) nutzt das Projekt eine eigene „Open WebUI
License“: Bedingungen im Stil von BSD-3 plus eine Klausel, die das Entfernen oder Ändern des Open-WebUI-
Brandings bei Installationen mit mehr als 50 Nutzern verbietet, sofern keine Erlaubnis oder
Enterprise-Lizenz vorliegt. Die Zusammenfassung des Projekts selbst:

> our license remains permissive, but now adds a fair-use branding protection clause

Quelle: [Open WebUI documentation, License](https://docs.openwebui.com/license/) (laufend aktualisierte
Dokumentation, gelesen 2026-10). Sinngemäß: Die Lizenz bleibt freizügig, ergänzt aber eine
Schutzklausel für das Branding. Ob das noch „Open Source“ im Sinne der OSI-Definition ist, wird
diskutiert; lesen Sie die Lizenz selbst, bevor Sie umbenennen oder weiterverteilen.

**Stärke:** einem Team ein privates Chat-Frontend für lokale oder gehostete Modelle geben, ohne eines zu
bauen. **Schwäche:** als Ersatz für Claude Code. Chat mit Tools ist nicht dasselbe wie ein Agent, der
Tests ausführt und Dateien unter Berechtigungsregeln ändert.

## Ollama: eine lokale Modell-Laufzeit

Ollama führt Modelle mit offenen Gewichten auf Ihrem eigenen Rechner oder Server aus und stellt sie über
eine HTTP-API bereit, auch über OpenAI-kompatible Endpunkte. Es steht unter MIT-Lizenz. Es gehört zur
Schicht Laufzeit: Es plant nicht, ändert nichts und fragt nicht um Erlaubnis; es beantwortet
Modellanfragen.

**Stärke:** Prompts und Code bleiben auf Ihrer Hardware, Arbeit ohne Netz, einfache Experimente.
Zusammen mit OpenCode ergibt es einen vollständig lokalen Coding-Aufbau, zusammen mit Open WebUI einen
lokalen Chat. **Schwäche:** Modellgröße und Hardware. Was auf eine Workstation-GPU passt, ist meist
deutlich kleiner als gehostete Spitzenmodelle, und bei Agentenarbeit zeigt sich das in mehr
fehlgeschlagenen Tool-Aufrufen und Wiederholungen. Modell-Tags können außerdem an Ort und Stelle
aktualisiert werden; legen Sie das Modell per Digest fest, wenn Reproduzierbarkeit zählt. Die
Betriebsseite behandelt [selbst betriebene Modelle für Agenten](/de/posts/self-hosted-models-for-agents/).

## openagentix: eine Plattform für unbeaufsichtigte Läufe (in Arbeit)

openagentix ist unsere quelloffene (Apache-2.0), selbst betreibbare Agentenplattform. Sie ist kein
interaktiver Coding-Assistent. Ereignisse kommen herein (Webhook, Cron, Kafka, Mail), Agenten, die in
versionierten `agents.md`-Dateien definiert sind, handeln über MCP-Tools darauf, und eine deterministische
Policy-Schranke prüft jeden Tool-Aufruf, bevor er läuft. Läufe landen in einem hashverketteten Audit-Trail,
Tokens und Kosten werden je Schritt erfasst, und Budgets stoppen einen Lauf.

Zum Verhältnis zu den anderen vier: Die Plattform kann einen Schritt über Claude Code als externen Harness
hinter der Policy-Schranke ausführen (auf `main`, erscheint mit 0.2, im direkten Modus mit einem echten
Lauf geprüft). Ein OpenCode-Adapter ist implementiert und gegen ein nachgebildetes Kommandozeilenwerkzeug
getestet; die Prüfung mit einem echten Lauf steht noch aus, ebenso die Prüfung beider Harnesses in
isolierten Run-Nodes mit festgelegten Binärdateien. Modelle können von Anthropic, Bedrock, OpenAI, Azure
OpenAI, OpenRouter, vLLM, Ollama oder jedem OpenAI-kompatiblen Server kommen. Die
[Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) zeigt, was fertig und was
geplant ist.

**Wo sie passt:** geplante oder ereignisgesteuerte Agentenjobs, die minimale Rechte, Freigaben, einen
Audit-Trail und Kostengrenzen brauchen, etwa die Einordnung eines Schwachstellenfunds oder der Entwurf
eines Ticket-Updates. **Wo sie (heute) nicht passt:** die interaktive Pair-Programming-Sitzung einer
Entwicklerin oder eines Entwicklers; dafür gibt es Harnesses. Außerdem ist sie Software vor 1.0;
bewerten Sie sie entsprechend.

## Entscheidungstabelle

| Werkzeug | Schicht | Lizenz (Stand 2026-10) | Alternative zu Claude Code? | Passt gut | Passt schlecht |
| --- | --- | --- | --- | --- | --- |
| OpenCode | Harness (Terminal-Agent) | MIT | Ja | Gleicher Arbeitsablauf mit freier Anbieterwahl, lokale Modelle | Spitzenergebnisse von einem kleinen lokalen Modell erwarten |
| OpenRouter | Modellzugang (gehosteter Router) | Proprietärer Dienst | Nein | Viele gehostete Modelle mit einem Schlüssel testen und wechseln | Strenge Vorgaben zum Datenfluss, exakte Reproduzierbarkeit |
| Open WebUI | Oberfläche (Web-Chat) | Open WebUI License (BSD-3 plus Branding-Klausel) | Nein | Privater Team-Chat über lokale oder gehostete Modelle | Agentenarbeit, die Repositories ändert |
| Ollama | Modell-Laufzeit (lokal) | MIT | Nein | Prompts und Code bleiben auf eigener Hardware | Große Modelle auf kleiner Hardware |
| openagentix | Plattform (ereignisgesteuert, mit Governance) | Apache-2.0, vor 1.0 | Nein, sie kann Harnesses ausführen | Unbeaufsichtigte Jobs mit Policy, Audit und Budgets | Interaktive Coding-Sitzungen |

## Wie sie zusammenspielen

Die Schichten lassen sich stapeln; die sinnvolle Frage ist also, welche Kombination zu einer Aufgabe passt:

- **Vollständig lokales Coding:** OpenCode als Harness, Ollama als Laufzeit. Nichts verlässt den Rechner;
  die Qualität begrenzt das lokale Modell.
- **Modelle vergleichen:** OpenCode mit OpenRouter. Ein Harness, viele gehostete Modelle; nehmen Sie den
  Router in Ihre Datenschutzprüfung auf.
- **Team-Chat:** Open WebUI vor Ollama (und optional einer gehosteten API). Fragen und Dokumente, keine
  Änderungen an Repositories.
- **Unbeaufsichtigte Jobs mit Governance:** openagentix löst einen Schritt auf ein Ereignis hin aus, führt
  ihn nativ oder über einen Harness hinter der Policy-Schranke aus und nutzt ein gehostetes oder selbst
  betriebenes Modell. Die interaktive Arbeit bleibt bei Claude Code oder OpenCode auf dem Rechner der
  Entwickler.

Keine dieser Kombinationen nimmt Ihnen die Entscheidung ab, was ein Agent tun darf. Berechtigungsregeln im
Harness, [minimale Rechte](/de/posts/least-privilege-for-agents/) für Tools und eine zentrale Schranke, wo
es darauf ankommt, gelten unabhängig von der Werkzeugwahl.

## Das Wichtigste in Kürze

- Nur OpenCode ist eine direkte Alternative zu Claude Code; die anderen sind Router, Chat-Oberfläche,
  Laufzeit und Plattform.
- OpenRouter ist ein gehosteter kommerzieller Dienst, kein Open Source, und fügt dem Datenfluss eine
  Partei hinzu.
- Open WebUI nutzt eine eigene Lizenz mit Branding-Klausel; lesen Sie sie vor einer Weiterverteilung.
- Ollama hält die Inferenz lokal; Modellgröße und Hardware setzen die Qualitätsgrenze.
- openagentix führt Agenten auf Ereignisse hin hinter einer Policy-Schranke aus und kann Harnesses als
  Schritte ausführen; es ist Open Source und vor 1.0.
- Wählen Sie nach Schicht, kombinieren Sie, und prüfen Sie jede Aussage an der eingesetzten Version.

## Quellen

- OpenCode, [Dokumentation](https://opencode.ai/docs/) und [Repository](https://github.com/anomalyco/opencode) (MIT).
- OpenRouter, [Quickstart](https://openrouter.ai/docs/quickstart) und [Anbieterauswahl](https://openrouter.ai/docs/guides/routing/provider-selection) (laufend aktualisierte Dokumentation).
- Open WebUI, [Dokumentation](https://docs.openwebui.com/), [License](https://docs.openwebui.com/license/) und [Repository](https://github.com/open-webui/open-webui).
- Ollama, [Website](https://ollama.com/) und [Repository](https://github.com/ollama/ollama) (MIT).
- openagentix, [Repository](https://github.com/open-agentix/open-agentix) und [Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md) (Apache-2.0).
