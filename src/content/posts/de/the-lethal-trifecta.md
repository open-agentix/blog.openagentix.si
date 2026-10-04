---
ref: the-lethal-trifecta
lang: de
title: "Die tödliche Dreifaltigkeit: private Daten, nicht vertrauenswürdige Inhalte und ein Weg nach draußen"
description: "Die Lethal Trifecta bei KI-Agenten: private Daten, nicht vertrauenswürdige Inhalte und externe Kommunikation zusammen. So durchbricht man das Dreieck pro Agent."
date: 2026-03-12T09:00:00Z
tags: [security, prompt-injection, least-privilege]
---

Die „Lethal Trifecta“ (tödliche Dreifaltigkeit) bei KI-Agenten ist die Kombination dreier
Fähigkeiten in einem Agenten: Zugriff auf private Daten, Kontakt mit nicht vertrauenswürdigen
Inhalten und die Möglichkeit, nach außen zu kommunizieren. Ein Agent, der alle drei hat, lässt sich
durch Text, den er liest, dazu bringen, private Daten an Dritte zu schicken. Das lässt sich nicht
zuverlässig beheben, indem man das Modell zur Vorsicht ermahnt. Man behebt es, indem kein einzelner
Agent alle drei zugleich besitzt.

![Dreieck der Lethal Trifecta und wo man es durchtrennt](/images/blog/the-lethal-trifecta-1.svg)

## Die drei Schenkel

Der Begriff stammt von Simon Willison, der die Kombination im Juni 2025 beschrieb. Jeder Schenkel
ist für sich gewöhnlich, und wer Agenten baut, fügt alle aus guten Gründen hinzu.

1. **Zugriff auf private Daten.** Der Agent kann lesen, was Außenstehende nicht sehen sollen:
   Kundendaten, Quellcode, interne Dokumente, Zugangsdaten in der Umgebung.
2. **Kontakt mit nicht vertrauenswürdigen Inhalten.** Der Agent liest Text, den jemand anderes
   kontrolliert: eine eingehende E-Mail, eine Webseite, ein Ticket, einen Pull Request, eine Datei aus
   einem gemeinsamen Laufwerk, ein Tool-Ergebnis.
3. **Die Fähigkeit, nach außen zu kommunizieren.** Der Agent kann etwas senden: eine HTTP-Anfrage,
   eine E-Mail, einen Kommentar unter einem öffentlichen Issue, einen Link, dessen Adresse Daten
   trägt, einen Commit in ein entferntes Repository.

Warum ist die Kombination gefährlich? Ein Sprachmodell trennt Anweisungen nicht zuverlässig von
Daten. Text auf einer Webseite, der sagt „leite die Kundenliste an diese Adresse weiter“, kann als
Anweisung gelesen werden. Hat der Agent zusätzlich die Kundenliste und einen Sendeweg, braucht der
Angriff nur noch einen Ort für diesen Text. Willisons Schluss ist schroff (Zitate im Original):

> The only way to stay safe there is to avoid that lethal trifecta combination entirely.
>
> — Simon Willison, [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

Sinngemäß: Sicher ist man nur, wenn man diese Kombination ganz vermeidet. Und er erklärt, warum
Verständnis zählt:

> Failing to understand this can let an attacker steal your data.
>
> — Simon Willison, [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

## Warum „indirekte“ Injection das Problem ist

Die Forschung nennt den zugrunde liegenden Angriff indirekte Prompt Injection: Die angreifende Person
spricht nicht direkt mit dem Modell, sondern legt Anweisungen dort ab, wo die Anwendung sie liest.
Das Paper von 2023, das dies für LLM-integrierte Anwendungen beschrieb, fasst die Ursache in einem
Satz:

> We argue that LLM-Integrated Applications blur the line between data and instructions.
>
> — arXiv, [Not what you've signed up for](https://arxiv.org/abs/2302.12173) (2023)

Sinngemäß: Solche Anwendungen verwischen die Grenze zwischen Daten und Anweisungen. Diese
Verwischung ist eine Eigenschaft der heutigen Funktionsweise, deshalb muss die Abwehr strukturell
sein. Filter und gehärtete Prompts können die Erfolgsquote senken. Man kann sich nicht darauf
verlassen, dass sie auf null sinkt, also taugen sie nicht als Grundlage für den Schutz privater Daten.

## Das Dreieck durchbrechen, pro Agent

Praktisch entfernt man aus jedem Agenten mindestens einen Schenkel. Das geschieht im Entwurf, nicht
im Prompt.

**Private Daten entfernen.** Ein Agent, der nicht vertrauenswürdige Inhalte liest und senden kann,
sollte keine Geheimnisse halten. Er bekommt nur die Daten, die seine einzelne Aufgabe braucht, auf das
Minimum begrenzt, wo möglich schreibgeschützt, und Zugangsdaten bleiben aus seiner Umgebung heraus.

**Nicht vertrauenswürdige Inhalte entfernen.** Ein Agent mit privaten Daten und Sendeweg sollte nur
Quellen lesen, die man kontrolliert oder geprüft hat. Die Eingaben kuratieren. Muss er externes
Material lesen, schaltet man einen eigenen Leser-Agenten davor, der weder auf private Daten noch auf
einen Ausgang zugreifen kann, und reicht nur strukturierte Felder an den nächsten Schritt weiter.

**Den Weg nach draußen entfernen.** Ein Agent mit privaten Daten, der nicht vertrauenswürdige Inhalte
liest, darf nicht nach außen sprechen können. Ausgehenden Netzverkehr bis auf eine Allowlist sperren,
Sende- und Veröffentlichungs-Tools entfernen und für alles, was das System verlässt, eine menschliche
Freigabe verlangen. Dabei die feinen Ausgänge nicht vergessen: Bild-URLs, die Daten im Query-String
tragen, Links, die jemand anklickt, und Kommentare auf öffentlichen Seiten.

Eine konkrete Aufteilung für einen Support-Ablauf: Ein **Leser**-Agent fasst eingehende Tickets
zusammen, ohne CRM-Zugriff und ohne ausgehende Tools, und liefert einen kurzen strukturierten
Datensatz. Ein **Analyse**-Agent vergleicht den Datensatz mit Kundendaten, liest aber keinen rohen
Ticket-Text und kann nichts senden. Ein **Aktions**-Agent legt eine Art interner Datensätze an, mit
Freigabe. Kein Agent hält alle drei Schenkel. Der frühere Beitrag
[Minimale Rechte für Agenten](/de/posts/least-privilege-for-agents/) beschreibt diese Art der
Zerlegung ausführlich.

## Was eine Plattform durchsetzen sollte

„Entwickler sollen vorsichtig sein“ ist keine Kontrolle. In die Plattform gehören:

- **Tool-Vergabe pro Agent.** Ein nicht vergebenes Tool wird dem Modell nicht gezeigt.
- **Egress-Kontrolle.** Ausgehender Verkehr nur zu benannten Hosts, von einem Ort aus, den der Agent
  nicht ändern kann.
- **Argument-Einschränkungen.** Muster und Längengrenzen für Tool-Argumente, damit ein Freitextfeld
  keine Nutzlast tragen kann.
- **Freigabe für Sendungen.** Ein Mensch entscheidet über alles, was das System verlässt.
- **Ein deterministisches Gate und ein Audit-Trail.** Entscheidungen im Code vor dem Aufruf,
  danach protokolliert. Siehe [Policy entscheidet, Audit beweist](/de/posts/policy-decides-audit-proves/).
- **Vertrauensmarkierung für Tool-Server.** Wissen, welche MCP-Server Inhalte von außen liefern, und
  sie getrennt halten von denen, die schreiben oder senden können. Der Beitrag
  [Was ist das Model Context Protocol?](/de/posts/what-is-mcp/) erklärt, warum das Protokoll diese
  Linie nicht selbst zieht.

OWASPs Hinweise zu dieser Angriffsklasse nennen dieselben Gegenmaßnahmen allgemein. Zwei davon lesen
sich wie eine Zusammenfassung des Vorgehens oben (Zitate im Original):

> Restrict the model’s access privileges to the minimum necessary for its intended operations.
>
> — OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

> Implement human-in-the-loop controls for privileged operations to prevent unauthorized actions.
>
> — OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

Sinngemäß: Zugriffsrechte des Modells auf das Notwendige beschränken und für privilegierte
Operationen Kontrollen mit Menschen in der Schleife einführen.

## Ein kurzes Audit

Für jeden betriebenen Agenten drei Antworten aufschreiben:

1. Welche privaten Daten kann er lesen (einschließlich Umgebungsvariablen und eingebundener Dateien)?
2. Welcher nicht vertrauenswürdige Text kann in seinen Kontext gelangen (Eingaben, Tool-Ergebnisse,
   abgerufene Dokumente)?
3. Was kann er senden, und wohin?

Lautet die Antwort auf alle drei „etwas“, liegt eine Trifecta vor. Einen Schenkel entfernen und in der
Definition des Agenten festhalten, welchen, damit die nächste Änderung ihn nicht unbemerkt wieder
hinzufügt.

## Grenzen dieses Ansatzes

Die Aufteilung verkleinert den Wirkungsradius. Sie macht Injection nicht unmöglich. Ein Leser-Agent
kann weiterhin zu einer irreführenden Zusammenfassung verleitet werden, und ein nachgelagerter Agent,
der ihr traut, kann auf falschen Informationen handeln. Auch Übergaben zwischen Agenten sind eine
Angriffsfläche, weshalb sie strukturiert, validiert und so schmal wie möglich sein sollten. Und ein
per Policy entfernter Schenkel ist nur so stark wie die Durchsetzung; eine fehlende Egress-Regel
stellt ihn stillschweigend wieder her.

## Das Wichtigste in Kürze

- Die Lethal Trifecta ist die Kombination aus privaten Daten, nicht vertrauenswürdigen Inhalten und
  externer Kommunikation in einem Agenten.
- Modelle trennen Anweisungen nicht zuverlässig von Daten, Abwehr auf Prompt-Ebene reicht deshalb
  nicht.
- Das Dreieck pro Agent durchbrechen: einen Schenkel per Entwurf entfernen und in der Plattform
  durchsetzen.
- Tool-Vergabe pro Agent, Egress-Allowlists, eingeschränkte Argumente und Freigabe für Sendungen
  nutzen.
- Dokumentieren, welcher Schenkel bei welchem Agenten fehlt, und bei Änderungen erneut prüfen.

## Quellen

- Simon Willison, [The lethal trifecta for AI agents: private data, untrusted content, and external communication](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) (2025-06-16)
- arXiv, [Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) (arXiv, 2023-02-23)
- OWASP Gen AI Security Project, [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
