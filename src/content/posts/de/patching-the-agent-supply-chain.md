---
ref: patching-the-agent-supply-chain
lang: de
title: "Betriebsreihe: AI Supply Chain Security und Patchen für Agenten"
description: "AI Supply Chain Security für Agenten: Modelle, MCP-Server, Skills, SDKs und Images inventarisieren und patchen. Checkliste für gepinnte, geprüfte Artefakte."
date: 2026-06-23T09:00:00Z
tags: [operations, supply-chain, checklist]
---

AI Supply Chain Security beginnt bei einer Agentenplattform mit einer schlichten Liste: jede Modellversion,
jeder MCP-Server, jeder Skill, jedes SDK und jedes Container-Image, von denen die Plattform abhängt, mit
Quelle, gepinnter Version, Update-Kanal und Verantwortlichem. Die meisten Vorfälle in diesem Bereich
kommen von Dingen, die niemand aufgelistet hatte, deshalb kommt die Inventur vor dem Scannen. Danach ist
die Regel einfach zu sagen und schwerer einzuhalten: Artefakte pinnen und prüfen, und die Produktion
nicht zur Laufzeit neue herunterladen und ausführen lassen. Dieser Beitrag liefert eine Patch-Checkliste je
Artefakttyp.

## Warum die Lieferkette von Agenten breiter ist

Ein gewöhnlicher Dienst hat Code-Abhängigkeiten und ein Basisimage. Eine Agentenplattform hat diese und
dazu mehrere Teile, die Verhalten ändern, ohne dass sich Code ändert.

- **Modelle.** Eine Modellversion ist eine Abhängigkeit, deren Verhalten Sie nicht lesen können. Ein Alias,
  der auf einen neuen Snapshot springt, kann Ausgaben über Nacht verändern.
- **MCP-Server.** Programme, die mit Zugriff auf Ihre Systeme laufen und zugleich Text liefern
  (Werkzeugnamen und -beschreibungen), den das Modell liest. Warum die zweite Rolle zählt, steht in
  [MCP-Tool-Poisoning](/de/posts/mcp-tool-poisoning/).
- **Skills und Anweisungen.** Dateien, die einem Agenten sagen, wie er arbeitet, sind ausführbarer
  Einfluss. Die Risiken behandelt
  [Skills von Drittanbietern und die Lieferkette](/de/posts/third-party-skills-supply-chain/).
- **SDKs und Bibliotheken.** Das übliche Paket-Ökosystem, inzwischen mit schnell wechselnden
  Agent-Frameworks.
- **Container-Images und Laufzeiten.** Der Ort, an dem all das läuft.

Das Risikobild entspricht jeder Software-Lieferkette, die OWASP auch für LLM-Anwendungen aufführt. Zu
Modellen heißt es (englisches Originalzitat; sinngemäß: Nur Modelle aus überprüfbaren Quellen verwenden und
Integritätsprüfungen mit Signaturen und Datei-Hashes einsetzen):

> Only use models from verifiable sources and use third-party model integrity checks with signing and file hashes

Quelle: [OWASP LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/). Dieselbe
Idee gilt für jedes Artefakt der Liste: Wissen, woher es kommt, und prüfen können, dass es das ist, was Sie
annehmen.

## Schritt 1: Die Inventur aufbauen

Legen Sie eine Tabelle an und halten Sie sie dort, wo das Plattformteam sie sieht. Jede Zeile ist ein
Artefakt.

![Inventar der Artefakte einer Agentenplattform und ihrer Update-Kanäle](/images/blog/patching-the-agent-supply-chain-1.svg)

Spalten, die sich lohnen:

| Spalte | Beispiel |
| --- | --- |
| Artefakttyp | Modell, MCP-Server, Skill, SDK, Image |
| Name und Quelle | woher es geholt wird und wer es veröffentlicht |
| Gepinnte Version | eine datierte Modell-ID, eine Version oder ein Digest, ein Commit-Hash |
| Update-Kanal | Anbieter-Mitteilungen, Release-Feed, Dependency-Bot, manuelle Prüfung |
| Verantwortlich | ein Team, das dafür einsteht |
| Genutzt von | welche Agenten oder Pipelines davon abhängen |

Die Spalte „Genutzt von“ macht das Patchen schnell: Wird eine Schwachstelle oder Abkündigung bekannt,
können Sie die betroffenen Agenten in Minuten nennen.

Erzeugen Sie die Inventur wenn möglich, statt sie von Hand zu pflegen. Eine Software-Stückliste (SBOM)
deckt Bibliotheken und Images gut ab; für Modelle, Server und Skills müssen Sie sie vermutlich um eigene
Einträge erweitern. Als Anker für die umgebende Praxis eignet sich das Secure Software Development
Framework des NIST (englisches Originalzitat; sinngemäß: ein Kernsatz übergeordneter Praktiken für sichere
Softwareentwicklung, der in jeden Entwicklungszyklus integriert werden kann):

> a core set of high-level secure software development practices that can be integrated into each SDLC implementation.

Quelle: [NIST SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final).
Es wurde für Softwarehersteller allgemein geschrieben. Auf Agenten-Artefakte angewandt heißt das: Einen
Skill oder MCP-Server behandeln Sie wie jede andere Komponente, die Sie in Ihren Build holen.

## Schritt 2: Alles pinnen

Pinnen macht aus „was gerade neu ist“ ein „genau dies“.

- **Modelle:** In der Produktion datierte oder versionierte Kennungen statt wandernder Aliase verwenden.
  Auf eine neue Version bewusst wechseln, nachdem die Evaluierungen bestanden sind.
- **MCP-Server:** Paketversion oder Image-Digest pinnen. Startbefehle meiden, die bei jedem Start die
  neueste Version holen.
- **Skills:** Einen Commit-Hash aus einem Repository referenzieren, das Sie kontrollieren, nicht einen
  Branch oder eine URL, die sich ändern kann.
- **SDKs:** Lockfiles einchecken und in CI sowie in Images daraus installieren.
- **Images:** In der Produktion Digests referenzieren und nach Plan neu bauen, damit Basisimage-Fixes
  ankommen.

Die Regel, die alles verbindet: **Keine Downloads von Code oder Anweisungen zur Laufzeit in der
Produktion.** Muss sich eine Komponente ändern, geschieht das über einen geprüften Commit, ein neues
Artefakt und einen Rollout. Das ist das Thema von
[Änderungsmanagement für Agenten](/de/posts/change-management-for-agents/).

## Schritt 3: Herkunft der Artefakte festlegen

Je mehr Stellen Artefakte liefern können, desto größer ist Ihr Prüfaufwand. Zwei Entwicklungen helfen.

Register für MCP-Server entstehen. Das MCP-Projekt hat eines als Vorschau angekündigt (englisches
Originalzitat; sinngemäß: Das MCP Registry ist jetzt als Vorschau verfügbar):

> The MCP Registry is now available in preview.

Quelle: [Model Context Protocol Blog, Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)
(2025). Die Ankündigung zeigt auch, wie eine Organisation es nutzen kann (englisches Originalzitat;
sinngemäß: Organisationen können Unter-Register nach eigenen Kriterien anlegen):

> organizations can choose to create sub-registries based on custom criteria.

Das ist das Muster, das Sie anstreben sollten: Eine öffentliche Quelle ist ein Upstream, und Ihre
Organisation stellt nur eine kuratierte Teilmenge bereit, die Ihre Prüfung bestanden hat. Prüfen Sie den
aktuellen Stand des Registers, bevor Sie sich darauf verlassen, denn das Zitat beschreibt den Stand zur
Ankündigung.

Auch die Verpackung zählt. Anthropic beschreibt Desktop-Erweiterungen so (englisches Originalzitat;
sinngemäß: einen ganzen MCP-Server samt aller Abhängigkeiten in ein einziges installierbares Paket bündeln):

> bundling an entire MCP server—including all dependencies—into a single installable package.

Quelle: [Anthropic, Claude Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions).
Ein einziges installierbares Paket lässt sich leichter hashen, pinnen und prüfen als ein Server, der seine
Abhängigkeiten beim Start auflöst. Bevorzugen Sie, egal welches Format, Artefakte, die ihre Abhängigkeiten
mitbringen und als Einheit verifizierbar sind.

## Schritt 4: Eine Patch-Routine

Fahren Sie diese nach Kalender, nicht wenn jemand daran denkt.

1. **Wöchentlich:** Den Update-Kanal jeder Inventurzeile prüfen. Funde nach Exposition sortieren: Verarbeitet
   die betroffene Komponente nicht vertrauenswürdige Eingaben oder hält sie Zugangsdaten?
2. **Bei einer Warnung:** Über „Genutzt von“ die betroffenen Agenten finden, bei hohem Risiko einfrieren
   oder einschränken und über den normalen Änderungsweg patchen.
3. **Vor jedem Update:** Evaluierungen und einen Smoke-Test jedes betroffenen Agenten ausführen und prüfen,
   dass sich Werkzeuglisten und Beschreibungen nicht unerwartet geändert haben (eine geänderte
   Beschreibung ist ein geänderter Prompt).
4. **Nach jedem Update:** Die neue gepinnte Version in der Inventur festhalten und die alte für den
   Rückweg bereithalten.
5. **Vierteljährlich:** Entfernen, was niemand nutzt. Ungenutzte Server und Skills sind Risiko ohne Nutzen.

## Checkliste

- Eine Inventur existiert, mit Verantwortlichem und Update-Kanal für jedes Artefakt.
- Die Produktion nutzt gepinnte Modelle, Digests und Commit-Hashes, keine wandernden Aliase.
- Keine Komponente lädt zur Laufzeit Code oder Anweisungen nach.
- Neue MCP-Server und Skills durchlaufen dieselbe Prüfung wie eine neue Abhängigkeit.
- Werkzeugnamen und -beschreibungen werden bei Updates per Diff verglichen.
- Der Rückweg auf die vorige gepinnte Version wurde ausprobiert.
- Für jede Zeile gibt es eine benannte Person, die Warnungen erhält.

## Wichtigste Punkte

- Die Lieferkette von Agenten ergänzt gewöhnliche Abhängigkeiten um Modelle, MCP-Server und Skills;
  inventarisieren Sie alle.
- Versionen pinnen und Änderungen prüfen; keine Downloads zur Laufzeit in der Produktion.
- Kuratierte Unter-Register und in sich geschlossene Pakete bevorzugen, die sich hashen und prüfen lassen.
- Nach Plan patchen, mit Evaluierungen davor und einfachem Rückweg danach.
- Eine geänderte Werkzeugbeschreibung ist ein geänderter Prompt.

## Quellen

- OWASP Gen AI Security Project, [LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/).
- Model Context Protocol Blog, [Introducing the MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/) (2025).
- Anthropic, [Claude Desktop Extensions: One-click MCP server installation for Claude Desktop](https://www.anthropic.com/engineering/desktop-extensions) (2025).
- NIST, [SP 800-218, Secure Software Development Framework (SSDF) Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) (2022).
