---
ref: sandboxing-agents
lang: de
title: "AI Agent Sandboxing: Dateisystem- und Netzwerkisolation zusammen"
description: "AI Agent Sandboxing wirkt nur, wenn Dateizugriff und Netzverkehr nach außen begrenzt sind. Warum eine Grenze nicht reicht und wie Allow-Lists Freigaben sparen."
date: 2026-06-04T09:00:00Z
tags: [security, sandboxing, how-to]
---

AI Agent Sandboxing braucht zwei Grenzen statt einer: eine Dateisystemgrenze, die begrenzt, was der Agent
lesen und schreiben darf, und eine Netzwerkgrenze, die begrenzt, wohin er Daten senden darf. Mit nur der
ersten kann ein gekaperter Agent lesen, was er lesen darf, und es an jeden Server schicken. Mit nur der
zweiten erreicht er nichts außerhalb, kann aber trotzdem Ihre SSH-Konfiguration überschreiben oder die
Geheimnisse eines anderen Projekts lesen. Dieser Beitrag erklärt, warum beide zusammengehören, wie Sie
eine Egress-Erlaubnisliste bauen und warum eine gute Sandbox auch die beste Antwort auf Freigabemüdigkeit
ist.

## Warum eine Grenze nicht reicht

Überlegen Sie, was eine Prompt-Injection für echten Schaden braucht: Daten (Lesezugriff) und einen Weg
nach draußen, oder die Möglichkeit, etwas Wichtiges zu verändern (Schreibzugriff). Jede Grenze nimmt eine
Hälfte weg.

| Aufbau | Was ein gekaperter Agent noch kann |
| --- | --- |
| Keine Sandbox | Alles lesen, was der Nutzer lesen darf, überallhin senden, alles ändern |
| Nur Dateisystem | Die Dateien im Geltungsbereich lesen und an beliebige Hosts senden |
| Nur Netzwerk | Dateien außerhalb des Projekts lesen oder ändern, aber nicht direkt abfließen lassen |
| Beides | Nur das Projektverzeichnis berühren und nur mit gelisteten Hosts sprechen |

Das ist dieselbe Form wie bei der [tödlichen Dreierkombination](/de/posts/the-lethal-trifecta/): nicht
vertrauenswürdige Eingaben, Zugriff auf private Daten und ein Weg nach außen. Eine Sandbox ist eine der
wenigen Kontrollen, die das dritte Glied entfernt, egal was das Modell entscheidet. Das Engineering-Team
von Anthropic formuliert die Anforderung direkt (englisches Originalzitat; sinngemäß: Wirksames Sandboxing
braucht Dateisystem- und Netzwerkisolation):

> It is worth noting that effective sandboxing requires both filesystem and network isolation.

Quelle: [Anthropic, Making Claude Code more secure and autonomous with sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing).

![Dateisystem- und Netzwerkisolation um einen Agentenprozess](/images/blog/sandboxing-agents-1.svg)

## Die Dateisystemgrenze

Die Regel ist einfach: Der Agent schreibt im Arbeitsverzeichnis und liest, was seine Aufgabe braucht,
sonst nichts.

- **Schreibzugriff auf das Projekt oder ein Scratch-Verzeichnis begrenzen.** Alles andere ist
  schreibgeschützt oder unsichtbar.
- **Orte mit Zugangsdaten verbergen.** Dotfiles im Home-Verzeichnis, Cloud-Credential-Dateien, SSH-Schlüssel
  und Browserprofile sollten gar nicht lesbar sein. Verbergen ist stärker als Verbieten, weil der Agent
  nicht einmal erfährt, dass der Pfad existiert. Wie Sie Zugangsdaten übergeben, ohne sie auf die Platte zu
  legen, steht in [Geheimnisse für Agenten](/de/posts/secrets-for-agents/).
- **Die eigene Konfiguration schützen.** Kann der Agent seine Einstellungen, Hooks oder Startdateien
  bearbeiten, kann er beim nächsten Lauf seine Rechte erweitern. Diese Pfade gehören auf schreibgeschützt.
- **Wegwerf-Arbeitsbereiche nutzen.** Ein frischer Checkout oder Container pro Lauf begrenzt, was eine
  unbemerkte Änderung hinterlassen kann.

Unter Linux geschieht das meist mit Namespaces, Bind-Mounts und seccomp oder mit einem Container, unter
macOS mit der System-Sandbox. Sie müssen das selten selbst bauen, sollten aber wissen, welche Technik Ihr
Werkzeug nutzt und was sie nicht abdeckt.

## Die Netzwerkgrenze und Egress-Erlaubnislisten

Die Netzwerkgrenze macht aus „jeder Host“ ein „diese Hosts“. Praktisch am besten ist ein Proxy als
einziger Weg nach draußen, mit einer Liste, die standardmäßig verbietet.

```yaml
# Beispielhafte Egress-Policy, nicht an ein bestimmtes Produkt gebunden
egress:
  default: deny
  allow:
    - host: api.example.org          # Modellanbieter oder Gateway
    - host: registry.example.org     # Paketspiegel, nur lesend
    - host: git.example.org
      methods: [GET]                 # holen ja, aber kein Push aus der Sandbox
  log: denied                        # jeder blockierte Versuch wird zum Ereignis
```

Einige praktische Hinweise:

- **Mit „verbieten“ anfangen und Hosts nach Bedarf ergänzen.** Offen zu starten und später zu schließen
  führt nie zum Ziel.
- **Eigene Paketspiegel bevorzugen** statt der öffentlichen Registries, damit die Liste kurz und prüfbar
  bleibt.
- **Missbrauch erlaubter Hosts beachten.** Ein breiter Host wie eine Code-Hosting-Seite oder ein
  Paste-Dienst kann trotzdem als Ablage dienen. Erlauben Sie den engsten Hostnamen und Pfad, den es gibt,
  und behandeln Sie breite Hosts als offene Kanäle.
- **Namen am Proxy auflösen.** Direkte IP-Verbindungen und DNS-Tunnel sind Umgehungen; blockieren Sie
  direkte Verbindungen und lassen Sie nur den Proxy Namen auflösen.
- **Ablehnungen sichtbar machen.** Eine blockierte Verbindung ist ein Signal, für die Nutzer wie für das
  Monitoring. Die Claude-Code-Dokumentation beschreibt genau dieses Verhalten (englisches Originalzitat;
  sinngemäß: Blockiert die Sandbox eine Verbindung, nennt Claude Code den abgelehnten Host im Ergebnis des
  Befehls):

> When the sandbox blocks a network connection, Claude Code names the denied host in the command’s result, so Claude sees what was blocked.

Quelle: [Claude-Code-Dokumentation, sandboxed Bash tool](https://code.claude.com/docs/en/sandboxing)
(Live-Dokumentation, Wortlaut Stand 2026-10-04). Das ist wichtig, weil der Agent den Host dann gezielt
anfragen kann und eine Person einmal entscheidet, statt dass der Agent Umwege versucht.

## Sandboxing gegen Freigabemüdigkeit

Rückfragen sind ein Sicherheitsmechanismus mit bekannter Schwäche: Menschen hören auf, sie zu lesen.
Fragt der Agent dreißigmal pro Stunde „Befehl ausführen?“, ist die einunddreißigste Antwort ein Reflex.
Eine Sandbox ändert die Rechnung. Innerhalb der Grenze sind Aktionen risikoarm und können ohne Rückfrage
laufen; außerhalb ist die Anfrage selten genug, um Aufmerksamkeit zu verdienen. Anthropic berichtet den
Effekt aus der eigenen Nutzung (englisches Originalzitat):

> In our internal usage, we've found that sandboxing safely reduces permission prompts by 84%.

Quelle: derselbe Artikel wie oben. Die Zahl stammt aus der Nutzung eines Teams und ist kein Versprechen
für Ihre Arbeitslast, aber der Mechanismus gilt allgemein: weniger und bessere Rückfragen. Wie die
verbleibenden Freigaben gestaltet werden sollten, behandelt ein späterer Beitrag dieser Reihe.

## Wo Sandboxing im Prinzip minimaler Rechte steht

OWASP benennt die Ursache übermäßiger Handlungsfreiheit in drei Teilen (englisches Originalzitat):

> The root cause of Excessive Agency is typically one or more of: excessive functionality; excessive permissions; excessive autonomy.

Quelle: [OWASP LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).
Eine Sandbox adressiert die „permissions“ auf Prozessebene. Die anderen beiden ersetzt sie nicht:
Entfernen Sie Werkzeuge, die der Agent nicht braucht (functionality), und schützen Sie riskante Aktionen
mit Freigaben (autonomy). Das Prinzip steht in
[Minimale Rechte für Agenten](/de/posts/least-privilege-for-agents/), wo jeder Agent einer Pipeline nur
die Werkzeuge seines Schritts hält. Sandbox plus Werkzeugfreigaben je Agent ergibt zwei unabhängige
Schichten.

## Was eine Sandbox nicht leistet

- **Sie verhindert keinen Missbrauch erlaubter Zugriffe.** Ein Agent, der das Projekt beschreiben darf,
  kann dort schlechten Code schreiben. Review und Tests bleiben nötig.
- **Sie schützt keine Daten innerhalb des Geltungsbereichs.** Liegt das Geheimnis im Projektverzeichnis,
  kann der Agent es lesen. Halten Sie Geheimnisse aus dem Arbeitsbereich heraus.
- **Sie ist kein Perimeter gegen alles.** Kernel-Fehler und Fehlkonfigurationen gibt es. Betrachten Sie
  die Sandbox als eine Schicht, nicht als die Schicht.

## Eine kurze Checkliste

1. Schreibzugriff nur im Arbeitsverzeichnis; sensible Pfade verborgen, nicht nur verboten.
2. Die eigene Konfiguration des Agenten ist für ihn schreibgeschützt.
3. Ein einziger Proxy-Weg nach draußen, Standard verbieten, enge Erlaubnisliste, Ablehnungen protokolliert.
4. Keine langlebigen Geheimnisse im Arbeitsbereich oder in der Umgebung.
5. Wo praktikabel ein Wegwerf-Arbeitsbereich pro Lauf.
6. Ein getesteter Weg, die Sandbox für eine Aufgabe zu erweitern, wobei eine Person entscheidet.

## Wichtigste Punkte

- Dateisystemisolation ohne Netzwerkisolation lässt Daten abfließen; Netzwerkisolation ohne
  Dateisystemisolation lässt den Agenten Dateien erreichen, die er nicht berühren sollte.
- Nutzen Sie einen Egress-Proxy mit Standard „verbieten“, kurzer, prüfbarer Erlaubnisliste und sichtbaren
  Ablehnungen.
- Sandboxing senkt die Freigabemüdigkeit und macht die verbleibenden Freigaben aussagekräftiger.
- Es ist eine Schicht neben minimalen Rechten, Geheimnisverwaltung und Review.

## Quellen

- Anthropic, [Making Claude Code more secure and autonomous with sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing) (2025).
- Anthropic, [Configure the sandboxed Bash tool (Claude Code docs)](https://code.claude.com/docs/en/sandboxing) (Live-Dokumentation).
- OWASP Gen AI Security Project, [LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).
