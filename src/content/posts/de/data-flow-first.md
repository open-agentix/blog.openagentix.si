---
ref: data-flow-first
lang: de
title: "Erst den Datenfluss zeichnen, dann den ersten Prompt schreiben"
description: "Ein agent data flow diagram zeigt, wo unsichere Daten eintreten, wo private liegen und wo etwas hinausgeht. Eine Vorlage, die Trifecta-Risiken früh zeigt."
date: 2026-05-21T09:00:00Z
tags: [architecture, security, how-to]
---

Ein Datenflussdiagramm für Agenten ist eine einseitige Zeichnung davon, wo Daten in ein Agentensystem eintreten, wo private Daten liegen, wo etwas hinausgehen kann und welchen Teilen Sie vertrauen. Zeichnen Sie es, bevor Sie den ersten Prompt schreiben. Die Sicherheit von Agentensystemen entscheidet sich zum großen Teil an diesem Bild: Treffen nicht vertrauenswürdige Inhalte, private Daten und ein ausgehender Kanal in einem Agenten zusammen, kann kein Prompt das zuverlässig beheben. Sind sie per Entwurf getrennt, wird aus einer Prompt-Injection ein Ärgernis statt eines Vorfalls. Dieser Beitrag liefert eine Vorlage und Fragen, die Sie an das Diagramm stellen.

## Warum der Datenfluss die Sicherheit bestimmt

Agenten mischen Anweisungen und Daten im selben Kanal: dem Kontext des Modells. Alles, was in den Kontext gelangt, kann das Verhalten beeinflussen, auch Text von einer Webseite, aus einer E-Mail oder einem Ticket. Damit wird die Frage „Was kann das Modell erreichen, und was erreicht das Modell?“ zur zentralen.

Simon Willison hat die gefährliche Kombination benannt, und sein Fazit zur Folge ist deutlich:

> Failing to understand this can let an attacker steal your data.
>
> — Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

Sinngemäß: Wer das nicht versteht, ermöglicht Angreifern, die eigenen Daten zu stehlen. Die drei Zutaten sind Zugriff auf private Daten, Kontakt mit nicht vertrauenswürdigen Inhalten und die Fähigkeit, nach außen zu kommunizieren. Jede ist für sich nützlich. Zusammen erlauben sie einem Angreifer, der ein Stück Inhalt kontrolliert, den Agenten dazu zu bringen, Ihre Daten zu lesen und zu versenden. Sein Rat für den Fall, dass alle drei vorliegen, ist ebenso klar:

> The only way to stay safe there is to avoid that lethal trifecta combination entirely.
>
> — Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

Sinngemäß: Sicher ist man dort nur, wenn man diese Kombination ganz vermeidet. Der Beitrag zur [tödlichen Dreierkombination](/de/posts/the-lethal-trifecta/) in diesem Blog geht tiefer. Das Datenflussdiagramm ist der Weg, systematisch danach zu suchen, statt sich auf das Gedächtnis zu verlassen.

## Die Vorlage auf einer Seite

Nutzen Sie eine einfache Zeichnung aus Kästen und Pfeilen mit fünf Elementtypen.

![Datenfluss-Vorlage mit Vertrauensgrenzen für einen Agentenentwurf](/images/blog/data-flow-first-1.svg)

1. **Quellen.** Alles, was Daten einspeist: Nutzereingaben, Tickets, E-Mails, Webseiten, Dateien, Datenbanken, Tool-Ergebnisse. Markieren Sie jede als vertrauenswürdig oder nicht vertrauenswürdig. Faustregel: Kann jemand außerhalb Ihrer Organisation dort schreiben, ist sie nicht vertrauenswürdig.
2. **Agenten und Modelle.** Jeder Agent, mit dem Modell und den Tools, die er hält. Ein Kasten pro Agent, nicht einer für „die KI“.
3. **Speicher.** Wo private Daten liegen: Datenbanken, Dokumentenspeicher, Secrets, Gedächtnis, in das der Agent schreibt. Vermerken Sie die Sensibilität (öffentlich, intern, personenbezogen, geheim).
4. **Ausgangspunkte.** Jeder Weg, auf dem etwas hinausgehen kann: ausgehende E-Mails, HTTP-Anfragen, Git-Pushes, Chat-Nachrichten, Datei-Uploads, sogar Links, die der Agent ausgibt und die ein Browser abruft. Existiert ein Kanal, ist er ein Ausgang.
5. **Vertrauensgrenzen.** Gestrichelte Linien zwischen Zonen: außerhalb der Organisation, innerhalb, die Agenten-Laufzeit, die Datenzone. Jeder Pfeil, der eine Grenze überquert, braucht einen Grund und eine Prüfung.

Beschriften Sie jeden Pfeil mit dem, was in welche Richtung fließt. Tragen Sie die Prüfung am Pfeil ein: Validierung, Policy-Gate, Freigabe oder nichts. „Nichts“ ist ein Befund.

Auch eine Textfassung funktioniert und lässt sich im Review gut vergleichen:

```text
source:  ticket-body        trust: untrusted   -> agent: research
source:  runbook            trust: trusted     -> agent: research
agent:   research           tools: tickets.read, crm.read
store:   crm                sensitivity: personal
agent:   research           -> agent: action  via: typed JSON handover
agent:   action             tools: jira.create_issue (approval required)
egress:  jira.create_issue  destination: internal tracker
```

## Fragen an das Diagramm

Gehen Sie das Diagramm mit diesen Fragen durch.

1. **Wo treten nicht vertrauenswürdige Daten ein?** Listen Sie jeden Eintrittspunkt auf, auch indirekte wie ein hochgeladenes Dokument oder eine Seite, die ein Tool abruft.
2. **Welche Agenten sehen nicht vertrauenswürdige Daten?** Das sind die Agenten, mit denen ein Angreifer sprechen kann.
3. **Erreicht einer davon auch private Daten?** Falls ja, hält dieser Agent zwei Teile der Dreierkombination.
4. **Hat einer davon auch einen Ausgang?** Falls ja, haben Sie alle drei an einem Ort. Teilen Sie den Agenten, entfernen Sie ein Element oder legen Sie eine Freigabe auf den Ausgang.
5. **Was trägt jeder Ausgang, und wohin geht er?** Nehmen Sie es wörtlich: Ein Tool „URL abrufen“ ist ein Ausgang, denn die URL kann Daten enthalten.
6. **Was überquert jede Vertrauensgrenze, und wer prüft es?** Bevorzugen Sie Prüfungen im Code gegenüber Prüfungen im Prompt.
7. **Wie groß ist der Wirkungsradius jedes Agenten?** Nehmen Sie an, er ist kompromittiert: Was wäre das Schlimmste, das er mit seinen Tools tun könnte?

Frage 4 findet am häufigsten ein Entwurfsproblem. Ein typisches Muster ist ein „Recherche-Assistent“, der das Web liest, für den Kontext Zugriff auf Firmendokumente hat und zur Zusammenfassung E-Mails versenden kann. Alle drei Elemente in einem Agenten.

## Was man mit einem Befund tut

Sie haben vier Möglichkeiten, grob nach Stärke geordnet:

- **Ein Element entfernen.** Der Agent, der nicht vertrauenswürdige Inhalte liest, bekommt keine privaten Daten oder keinen Ausgang.
- **Den Agenten teilen.** Ein Agent liest nicht vertrauenswürdige Inhalte und gibt ein typisiertes, validiertes Ergebnis aus. Ein zweiter Agent, der den Rohinhalt nie sieht, verwendet es. Das entspricht [minimalen Rechten durch Zerlegung](/de/posts/least-privilege-for-agents/).
- **Den Fluss einschränken.** Ein Entwurfsmuster nutzen, das nicht vertrauenswürdige Daten aus dem Kontrollfluss heraushält, wie in [Entwurfsmuster gegen Prompt-Injection](/de/posts/prompt-injection-design-patterns/) beschrieben.
- **Ein menschliches Gate ergänzen.** Eine Freigabe auf den Ausgang legen, die genau den Inhalt zeigt, der hinausgeht.

Die zweite und dritte Möglichkeit beruhen auf derselben Idee. Die CaMeL-Forschung nennt die Eigenschaft, die sie anstrebt:

> the untrusted data retrieved by the LLM can never impact the program flow.
>
> — [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813), arXiv

Sinngemäß: Nicht vertrauenswürdige Daten, die das LLM abruft, können den Programmfluss nie beeinflussen. Ihr Diagramm zeigt, wo diese Trennung gelten muss. Dokumentieren Sie die Entscheidung neben dem Diagramm, einschließlich dessen, was Sie in Kauf genommen haben und warum.

## Das Diagramm mit Threat Modeling und Datensicherheit verbinden

Das Diagramm ist auch die Eingabe für ein normales Threat Model. Gehen Sie jede Grenze durch und fragen Sie, was bei Vortäuschung, Manipulation, Offenlegung und Missbrauch schiefgehen kann. Für die Daten selbst veröffentlichen Behörden praktische Hinweise. Das CISA-Dokument zur Datensicherheit bei KI beschreibt den Umfang seiner Empfehlungen so:

> It outlines key risks that may arise from data security and integrity issues across all phases of the AI lifecycle
>
> — CISA, [AI Data Security: Best Practices for Securing Data Used to Train & Operate AI Systems](https://www.cisa.gov/resources-tools/resources/ai-data-security-best-practices-securing-data-used-train-operate-ai-systems)

Sinngemäß: Es beschreibt zentrale Risiken aus Problemen bei Datensicherheit und -integrität über alle Phasen des KI-Lebenszyklus. Nutzen Sie es, um den Teil „Speicher“ Ihres Diagramms zu prüfen: Herkunft, Integrität, Zugriffskontrolle und Umgang mit sensiblen Daten.

## Das Diagramm lebendig halten

Ein Diagramm, das einmal gezeichnet und vergessen wird, ist ein historisches Artefakt. Halten Sie es im Repository, prüfen Sie es im selben Pull Request wie jede Änderung, die ein Tool, eine Quelle oder einen Ausgang hinzufügt, und vergleichen Sie es mit der Wirklichkeit: Stimmt die tatsächliche Konfiguration mit dem Bild überein? Solche Architekturarbeit gehört vor den ersten Prompt, wie [Architektur vor Prompts](/de/posts/architecture-before-prompts/) begründet.

## Grenzen

Ein Diagramm zeigt beabsichtigte Flüsse. Es zeigt nicht, was ein Tool intern wirklich tut, und auch keine Nebenkanäle wie Timing oder gerenderte Links. Verstehen Sie es als Weg, die größten Probleme früh zu finden, nicht als Sicherheitsbeweis. Es sagt auch nicht, wie wahrscheinlich ein Angriff ist, nur, was ein Angriff erreichen könnte.

## Das Wichtigste in Kürze

- Zeichnen Sie Quellen, Agenten, Speicher, Ausgänge und Vertrauensgrenzen auf eine Seite, bevor Sie Prompts schreiben.
- Markieren Sie jede Quelle als vertrauenswürdig oder nicht und jeden Speicher nach Sensibilität.
- Suchen Sie jeden Agenten, der nicht vertrauenswürdige Inhalte, private Daten und einen Ausgang vereint; teilen Sie ihn oder entfernen Sie ein Element.
- Bevorzugen Sie Prüfungen im Code an Vertrauensgrenzen gegenüber Anweisungen im Prompt.
- Halten Sie das Diagramm in der Versionskontrolle und aktualisieren Sie es bei jeder Änderung an Tools oder Quellen.

## Quellen

- Simon Willison: [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- CISA: [AI Data Security: Best Practices for Securing Data Used to Train & Operate AI Systems](https://www.cisa.gov/resources-tools/resources/ai-data-security-best-practices-securing-data-used-train-operate-ai-systems)
- arXiv: [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813)
