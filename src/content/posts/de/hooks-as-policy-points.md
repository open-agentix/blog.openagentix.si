---
ref: hooks-as-policy-points
lang: de
title: "Claude Code Hooks als Durchsetzungspunkte für Policies in Coding-Agenten"
description: "Claude Code Hooks führen Code vor einem Werkzeugaufruf aus; ein PreToolUse-Hook setzt Policy lokal durch. Aufbau, Grenzen und warum ein zentrales Gate bleibt."
date: 2026-06-18T09:00:00Z
tags: [harness, policy, how-to]
---

Claude Code Hooks sind kleine Programme, die der Harness an festen Punkten im Lebenszyklus eines Agenten
ausführt, und ein `PreToolUse`-Hook kann einen Werkzeugaufruf prüfen und blockieren, bevor er läuft. Damit
sind Hooks ein praktischer lokaler Durchsetzungspunkt für Policies: deterministischer Code außerhalb des
Modells, der Ja oder Nein sagt. Sie sind aber auch lokal, und das setzt ihre Grenze. Ein Hook läuft dort,
wo der Agent läuft, unter der Kontrolle dessen, der den Rechner kontrolliert. Er ergänzt deshalb ein
zentrales Policy-Gate und ersetzt es nicht. Dieser Beitrag zeigt, wie Sie Hooks gut einsetzen und wo Sie
sich nicht mehr auf sie verlassen sollten.

## Was ein Hook ist

Die Claude-Code-Dokumentation beschreibt Hooks als Befehle, die bei Ereignissen laufen (englisches
Originalzitat; sinngemäß: Sie werden automatisch an bestimmten Punkten im Lebenszyklus von Claude Code
ausgeführt):

> execute automatically at specific points in Claude Code’s lifecycle.

Quelle: [Claude-Code-Dokumentation, Hooks reference](https://code.claude.com/docs/en/hooks)
(Live-Dokumentation, Wortlaut Stand 2026-10-04). Für Governance zählen *automatisch* und *außerhalb des
Modells*. Ein Prompt, der sagt „führe nie `rm -rf` aus“, ist eine Bitte. Ein Hook, der den Befehl
ablehnt, ist eine Regel, weil das Modell ein Skript nicht überreden kann, das die Unterhaltung nicht liest.

Die Ereignisse unterscheiden sich darin, was sie können. Am häufigsten für Policy genutzt:

- **Vor einem Werkzeugaufruf** (`PreToolUse`): Werkzeugname und Argumente prüfen, erlauben, ablehnen oder
  nachfragen.
- **Nach einem Werkzeugaufruf** (`PostToolUse`): Ergebnisse aufzeichnen, Ausgaben scannen, Auffälliges
  melden. Die Aktion ist schon passiert, das ist also Erkennung, keine Verhinderung.
- **Beim Absenden eines Prompts oder Sitzungsstart**: Kontext ergänzen, Bedingungen prüfen, protokollieren.

Prüfen Sie in der Referenz Ihrer Version die genauen Ereignisnamen, das Eingabeformat und wie ein Hook
seine Entscheidung signalisiert, denn diese Details entwickeln sich weiter.

## Ein minimaler PreToolUse-Hook

Die Konfiguration registriert einen Befehl für einen Werkzeug-Matcher. Eine Skizze:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/check-bash.py" }
        ]
      }
    ]
  }
}
```

Der Hook erhält eine JSON-Beschreibung des anstehenden Aufrufs über die Standardeingabe und antwortet über
Exit-Code und Ausgabe. Ein einfaches Skript, das einige eindeutig gefährliche Muster blockiert:

```python
#!/usr/bin/env python3
import json, re, sys

call = json.load(sys.stdin)
command = call.get("tool_input", {}).get("command", "")

DENY = [
    r"\brm\s+-rf\s+(/|~)",          # recursive delete of root or home
    r"\bcurl\b.*\|\s*(sh|bash)",    # pipe a download into a shell
    r"\bgit\s+push\b.*--force",     # history rewrite
]

for pattern in DENY:
    if re.search(pattern, command):
        # Message goes back to the agent so it can choose another approach.
        print(f"Blocked by policy: matches {pattern}", file=sys.stderr)
        sys.exit(2)   # a blocking exit code in Claude Code; verify for your version

sys.exit(0)
```

Drei Details machen das in der Praxis nützlich. Die Meldung sagt dem Agenten, *warum*, damit er sich anpasst,
statt es erneut zu versuchen. Der Hook ist dort **fail-closed**, wo es zählt: Schlägt das Parsen fehl,
entscheiden Sie bewusst, ob blockiert oder erlaubt wird. Und der Hook liegt in der Versionsverwaltung, sodass
Policy-Änderungen wie Code geprüft werden.

## Muster, die gut funktionieren

- **Erlaubnisliste statt Verbotsliste bei riskanten Werkzeugen.** Verbotsmuster lassen sich mit Quoting,
  Aliasen oder einer Skriptdatei umgehen. Für Shell-Zugriff ist „diese Befehle sind erlaubt“ besser als
  „diese sind verboten“, oder Sie schränken das Werkzeug ganz ein.
- **Argumente prüfen, nicht nur Namen.** Dasselbe Werkzeug kann je nach Pfad, Host oder Flags harmlos oder
  gefährlich sein. Prüfen Sie gegen die erwarteten Formen.
- **Konfigurationspfade schützen.** Blockieren Sie Änderungen an den Hook-Skripten und Einstellungen selbst.
  Ein Agent, der seine eigene Policy ändern kann, hat keine Policy.
- **Vor dem Vergleich normalisieren.** Pfade auflösen und offensichtliche Umwege entfernen, damit
  `./a/../../etc/passwd` als das erkannt wird, was es ist.
- **Jede Entscheidung protokollieren.** Schreiben Sie Erlauben und Ablehnen mit Argumenten und Zeitstempel
  in einen nur anhängbaren Eintrag. Bei einem Vorfall lesen Sie zuerst das; siehe
  [Policy entscheidet, Audit beweist](/de/posts/policy-decides-audit-proves/).
- **Hooks schnell halten.** Ein langsamer Hook bremst jeden Werkzeugaufruf. Machen Sie billige lokale
  Prüfungen im Hook und schicken Sie teure an einen Dienst.

## Wo Hooks aufhören

Hooks sind wertvoll, und sie haben Grenzen, die Ihr Bedrohungsmodell klar benennen sollte.

1. **Sie laufen dort, wo der Agent läuft.** Wer den Rechner kontrolliert, kann einen lokalen Hook
   abschalten oder ändern, sofern die Konfiguration nicht zentral verwaltet und gesperrt ist. Ein Hook ist
   also eine Leitplanke gegen ehrliche Fehler und gegen einen gekaperten Agenten, keine Kontrolle gegen
   einen böswilligen lokalen Nutzer.
2. **Sie gelten je Harness.** Ein Hook für ein Werkzeug gilt nicht für ein anderes. Nutzt Ihre Organisation
   mehr als einen Coding-Agenten, pflegen Sie parallele Policies; der
   [Vergleich von Claude Code und OpenCode](/de/posts/claude-code-vs-opencode/) zeigt, wie sich die
   Berechtigungsmodelle unterscheiden.
3. **Sie sehen nur, was der Harness offenlegt.** Aktionen eines vom Werkzeug gestarteten Unterprozesses
   oder eines aufgerufenen entfernten Dienstes liegen außerhalb ihres Blicks, sofern Sie sie nicht
   zusätzlich mit einer Sandbox begrenzen.
4. **Mustererkennung ist unvollständig.** Ein regulärer Ausdruck über einen Shell-Befehl versteht nicht
   jede Art, eine Aktion auszudrücken.
5. **Sie sind keine Wahrheitsquelle für Audit.** Jeder Rechner führt sein eigenes Protokoll. Zentrales
   Reporting verlangt, dass Sie diese Logs übertragen und schützen.

Die Dokumentation des OpenAI Agents SDK erinnert daran, dass Guardrails überall einen begrenzten Geltungsbereich
haben. In diesem SDK gilt (englisches Originalzitat; sinngemäß: Output-Guardrails laufen nur für den Agenten,
der die endgültige Ausgabe erzeugt):

> Output guardrails run only for the agent that produces the final output.

Quelle: [OpenAI Agents SDK, Guardrails](https://openai.github.io/openai-agents-python/guardrails/)
(Live-Dokumentation, Wortlaut Stand 2026-10-04). Egal welches Framework: Fragen Sie bei jedem Guardrail, für
welche Agenten, welche Schritte und welche Daten er tatsächlich läuft.

## Lokaler Hook plus zentrales Gate

Die tragfähige Anordnung sind zwei Schichten mit verschiedenen Aufgaben.

![Lokaler Hook und zentrales Policy-Gate im Pfad des Werkzeugaufrufs](/images/blog/hooks-as-policy-points-1.svg)

- **Der lokale Hook** gibt Entwicklern sofortiges Feedback mit geringer Latenz, blockiert das Offensichtliche
  und hält den Harness auch offline in Ordnung.
- **Das zentrale Gate** wertet jeden Aufruf jedes Clients gegen eine Policy aus, anhand der handelnden
  Identität, und schreibt den maßgeblichen Audit-Eintrag. Es lässt sich nicht vom Laptop des Entwicklers aus
  ändern.

Das ist dieselbe Idee wie Zero Trust, das NIST in Worten beschreibt, die gut zu Agenten passen (englisches
Originalzitat; sinngemäß: Zero Trust unterstellt kein implizites Vertrauen allein aufgrund des physischen
oder Netzwerkstandorts):

> Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location

Quelle: [NIST SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final). Auch ein
Agent in Ihrem Netz, auf dem Laptop Ihres Entwicklers, mit Ihren Zugangsdaten, verdient kein implizites
Vertrauen. Jeder Aufruf wird geprüft, und den Prüfungen vertraut man am meisten, die nicht auf dem
geprüften Rechner laufen.

## Was Sie zuerst tun

1. Schreiben Sie fünf Aktionen auf, die nie ohne Person geschehen dürfen, und setzen Sie sie als
   `PreToolUse`-Hook in einem gemeinsamen Repository um.
2. Machen Sie die Hook-Konfiguration zum Teil der verwalteten Einstellungen des Repositorys, damit sie für
   alle der Standard ist.
3. Protokollieren Sie Entscheidungen zentral, anfangs notfalls in einer gemeinsamen Datei oder einem
   Collector.
4. Testen Sie den Hook mit feindlichen Eingaben: Quoting-Tricks, Pfad-Traversal, ein Befehl in einem Skript.
5. Entscheiden Sie, welche der fünf in ein zentrales Gate gehören, und planen Sie diesen Umzug. Wie Sie mit
   den verbleibenden Freigaben umgehen, steht in
   [Mensch in der Schleife, der funktioniert](/de/posts/human-in-the-loop-that-works/).

## Wichtigste Punkte

- Hooks führen deterministischen Code außerhalb des Modells aus, sie setzen Regeln durch, statt sie zu
  erbitten.
- Ein `PreToolUse`-Hook kann einen Aufruf mit einer Begründung blockieren, auf die der Agent reagieren kann;
  halten Sie ihn klein, schnell und in der Versionsverwaltung.
- Erlaubnislisten bevorzugen, Argumente prüfen, die eigenen Dateien des Hooks schützen und jede Entscheidung
  protokollieren.
- Hooks sind lokal und gelten je Harness; kombinieren Sie sie mit einem zentralen Gate und einer Sandbox für
  Durchsetzung, die sich auditieren lässt.

## Quellen

- Anthropic, [Hooks reference (Claude Code docs)](https://code.claude.com/docs/en/hooks) (Live-Dokumentation).
- OpenAI, [Guardrails (OpenAI Agents SDK docs)](https://openai.github.io/openai-agents-python/guardrails/) (Live-Dokumentation).
- NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) (2020).
