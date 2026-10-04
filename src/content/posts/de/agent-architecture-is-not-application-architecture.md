---
ref: agent-architecture-is-not-application-architecture
lang: de
title: "Agentenarchitektur ist keine Anwendungsarchitektur: das agentix-Muster"
description: Anwendungsarchitektur ordnet Code. Agentenarchitektur entscheidet, wer zur Laufzeit was darf. Unsere Antwort ist das agentix-Muster - ein MCP-Server pro System, ein Agent pro Schritt.
date: 2026-02-24T09:00:00Z
tags: [architecture, patterns, mcp, governance]
---

Vor Kurzem haben wir ein Setup gesehen, in dem ein einziger MCP-Server mit rund zehn
verschiedenen Anwendungen sprach. Ein Schweizer Taschenmesser: ein Prozess, alle Zugangsdaten,
alle Werkzeuge, geschrieben für genau einen Agenten und für niemanden sonst wiederverwendbar. Es
funktionierte, aber dafür ist MCP nicht gedacht. Dieser Beitrag erklärt, warum, trennt zwei Arten
von Architektur, die man leicht verwechselt, und schlägt für die zweite ein Muster vor. Wo etwas
Meinung und nicht Tatsache ist, steht das dabei.

## Zwei Fragen, nicht eine

**Anwendungsarchitektur** legt fest, wie Code aufgebaut ist: Schichten, Services, wem welche Daten
gehören, Ports und Adapter, wer wen aufruft. Diese Aufrufe stehen zur Entwurfszeit fest, werden im
Pull Request geprüft und als Einheiten ausgeliefert, die unabhängig voneinander ausfallen.

**Agentenarchitektur** legt fest, wer zur Laufzeit was tun darf, wenn ein Modell den nächsten
Schritt wählt und diese Wahl nicht deterministisch ist. Ihre Gegenstände sind Fähigkeitsgrenzen,
Wirkungsradius, die Vertrauensgrenze zwischen Modellausgabe und echter Wirkung, Übergabeverträge,
Freigaben und Kosten.

Beides steht senkrecht zueinander. Eine sauber geschichtete Anwendung kann einen Agenten
beherbergen, der jedes Zugangsdatum besitzt, und ein unordentlicher Monolith kann hinter gut
begrenzten Agenten stehen. Die beiden treffen sich am **MCP-Server**: in der Anwendungssicht ein
Adapter, der ein Protokoll in Aufrufe an ein System übersetzt, in der Agentensicht eine
Fähigkeitsgrenze, an der aus der Bitte eines Modells eine Wirkung wird.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd3-de-t oaxd3-de-d" viewBox="0 0 600 452" width="600" height="452"><title id="oaxd3-de-t">Agentenarchitektur und Anwendungsarchitektur treffen sich am MCP-Server</title><desc id="oaxd3-de-d">Oberes Band: Agentenarchitektur, entschieden zur Laufzeit; Agenten, einer pro Schritt, rufen Werkzeuge über ein Policy-Gate mit Audit auf. Unteres Band: Anwendungsarchitektur, entschieden zur Entwurfszeit; jedes System hat seine eigenen Schichten. Die MCP-Server liegen auf der Linie zwischen den Bändern: in der Anwendungssicht ein Adapter, in der Agentensicht eine Fähigkeitsgrenze.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd3-de-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><rect x="5" y="5" width="590" height="140" rx="12" class="bx ac dash"/><text x="20" y="30" text-anchor="start" class="h act">Agentenarchitektur: wer darf was, zur Laufzeit</text><text x="20" y="52" text-anchor="start" class="s">Fähigkeiten, Wirkungsradius, Freigaben, Übergaben, Kosten</text><rect x="20" y="68" width="170" height="40" rx="8" class="bx"/><text x="105" y="93" text-anchor="middle" class="s">Agenten, einer pro Schritt</text><rect x="210" y="68" width="170" height="40" rx="8" class="bx ac"/><text x="295" y="93" text-anchor="middle" class="s">Policy-Gate + Audit</text><line x1="190" y1="88" x2="208" y2="88" class="ln" marker-end="url(#oaxd3-de-a)"/><line x1="5" y1="175" x2="375" y2="175" class="ln dash"/><line x1="295" y1="108" x2="105" y2="153" class="ln" marker-end="url(#oaxd3-de-a)"/><line x1="295" y1="108" x2="285" y2="153" class="ln" marker-end="url(#oaxd3-de-a)"/><rect x="30" y="155" width="150" height="40" rx="8" class="op"/><rect x="30" y="155" width="150" height="40" rx="8" class="bx ac"/><text x="105" y="180" text-anchor="middle" class="h">jira-MCP</text><rect x="210" y="155" width="150" height="40" rx="8" class="op"/><rect x="210" y="155" width="150" height="40" rx="8" class="bx ac"/><text x="285" y="180" text-anchor="middle" class="h">crm-MCP</text><text x="590" y="170" text-anchor="end" class="s">MCP-Server: Adapter (App-Sicht)</text><text x="590" y="190" text-anchor="end" class="s">und Fähigkeitsgrenze (Agent)</text><rect x="5" y="236" width="590" height="210" rx="12" class="bx dash"/><line x1="105" y1="195" x2="105" y2="270" class="ln" marker-end="url(#oaxd3-de-a)"/><text x="105" y="290" text-anchor="middle" class="h">Jira</text><rect x="30" y="300" width="150" height="24" rx="4" class="bx"/><text x="105" y="317" text-anchor="middle" class="s">API / Port</text><rect x="30" y="328" width="150" height="24" rx="4" class="bx"/><text x="105" y="345" text-anchor="middle" class="s">Domäne</text><rect x="30" y="356" width="150" height="24" rx="4" class="bx"/><text x="105" y="373" text-anchor="middle" class="s">Daten</text><line x1="285" y1="195" x2="285" y2="270" class="ln" marker-end="url(#oaxd3-de-a)"/><text x="285" y="290" text-anchor="middle" class="h">CRM</text><rect x="210" y="300" width="150" height="24" rx="4" class="bx"/><text x="285" y="317" text-anchor="middle" class="s">API / Port</text><rect x="210" y="328" width="150" height="24" rx="4" class="bx"/><text x="285" y="345" text-anchor="middle" class="s">Domäne</text><rect x="210" y="356" width="150" height="24" rx="4" class="bx"/><text x="285" y="373" text-anchor="middle" class="s">Daten</text><text x="20" y="410" text-anchor="start" class="h">Anwendungsarchitektur: wie Code gebaut ist, zur Entwurfszeit</text><text x="20" y="432" text-anchor="start" class="s">Schichten, Services, Datenhoheit, Deploy-Einheiten</text></svg><figcaption>Zwei Fragen, die senkrecht zueinander stehen. Sie treffen sich am MCP-Server.</figcaption></figure>

## Das agentix-Muster

Wir nennen es agentix-Muster, weil open-agentix darum herum gebaut ist, nicht weil seine Teile neu
wären. Minimale Rechte, Bounded Contexts, Ports und Adapter und Workflow-Orchestrierung gab es
lange vor Agenten. Unser Beitrag ist eine bestimmte Kombination, aufgeschrieben als Regeln, die man
prüfen kann.

> **Definition.** Im agentix-Muster liegt jedes System, das ein Agent berühren darf, hinter genau
> einem MCP-Server. Dieser hält die Zugangsdaten und bietet die Fähigkeiten des Systems als
> typisierte Werkzeuge an, getrennt nach Lesen und Schreiben. Jeder Geschäftsprozess ist ein
> versionierter Plan aus Schritten; jeden Schritt führt ein eigener, eng begrenzter Agent aus, der
> nur die Werkzeuge seines Schritts hält, ein typisiertes Ergebnis übergibt und jedes System nur
> über ein deterministisches Policy-Gate erreicht, das jede Entscheidung unter der Run-ID festhält.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd1-de-t oaxd1-de-d" viewBox="0 0 600 520" width="600" height="520"><title id="oaxd1-de-t">Antimuster und agentix-Muster im Vergleich</title><desc id="oaxd1-de-d">Oben: Ein Agent mit allen Werkzeugen spricht mit einem Alles-Könner-MCP-Server, der die Zugangsdaten von zehn Anwendungen hält. Unten: das agentix-Muster. Drei Agenten, einer pro Schritt (Research liest, Analyse hat keine Werkzeuge, Action schreibt genau eine Sache), erreichen Systeme nur über ein Policy-Gate mit Audit, und jedes System liegt hinter einem eigenen MCP-Server; den Git-Server bekommt kein Schritt.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd1-de-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><text x="300" y="20" text-anchor="middle" class="h dgt">Antimuster: ein Gott-Agent, ein Alles-Könner-MCP-Server</text><rect x="190" y="36" width="220" height="40" rx="8" class="bx"/><text x="300" y="61" text-anchor="middle">ein Agent, alle Werkzeuge</text><line x1="300" y1="76" x2="300" y2="106" class="ln" marker-end="url(#oaxd1-de-a)"/><rect x="110" y="108" width="380" height="40" rx="8" class="bx dg"/><text x="300" y="133" text-anchor="middle">ein MCP-Server, zehn Apps, alle Zugangsdaten</text><line x1="300" y1="148" x2="38" y2="194" class="ln dim"/><rect x="13" y="196" width="50" height="28" rx="6" class="bx"/><text x="38" y="215" text-anchor="middle" class="s">App 1</text><line x1="300" y1="148" x2="96" y2="194" class="ln dim"/><rect x="71" y="196" width="50" height="28" rx="6" class="bx"/><text x="96" y="215" text-anchor="middle" class="s">App 2</text><line x1="300" y1="148" x2="154" y2="194" class="ln dim"/><rect x="129" y="196" width="50" height="28" rx="6" class="bx"/><text x="154" y="215" text-anchor="middle" class="s">App 3</text><line x1="300" y1="148" x2="212" y2="194" class="ln dim"/><rect x="187" y="196" width="50" height="28" rx="6" class="bx"/><text x="212" y="215" text-anchor="middle" class="s">App 4</text><line x1="300" y1="148" x2="270" y2="194" class="ln dim"/><rect x="245" y="196" width="50" height="28" rx="6" class="bx"/><text x="270" y="215" text-anchor="middle" class="s">App 5</text><line x1="300" y1="148" x2="328" y2="194" class="ln dim"/><rect x="303" y="196" width="50" height="28" rx="6" class="bx"/><text x="328" y="215" text-anchor="middle" class="s">App 6</text><line x1="300" y1="148" x2="386" y2="194" class="ln dim"/><rect x="361" y="196" width="50" height="28" rx="6" class="bx"/><text x="386" y="215" text-anchor="middle" class="s">App 7</text><line x1="300" y1="148" x2="444" y2="194" class="ln dim"/><rect x="419" y="196" width="50" height="28" rx="6" class="bx"/><text x="444" y="215" text-anchor="middle" class="s">App 8</text><line x1="300" y1="148" x2="502" y2="194" class="ln dim"/><rect x="477" y="196" width="50" height="28" rx="6" class="bx"/><text x="502" y="215" text-anchor="middle" class="s">App 9</text><line x1="300" y1="148" x2="560" y2="194" class="ln dim"/><rect x="535" y="196" width="50" height="28" rx="6" class="bx"/><text x="560" y="215" text-anchor="middle" class="s">App 10</text><text x="300" y="270" text-anchor="middle" class="h act">agentix-Muster: ein Agent pro Schritt, ein MCP-Server pro System</text><rect x="20" y="288" width="170" height="50" rx="8" class="bx"/><text x="105" y="309" text-anchor="middle" class="h">research</text><text x="105" y="328" text-anchor="middle" class="s">liest jira, crm</text><rect x="215" y="288" width="170" height="50" rx="8" class="bx"/><text x="300" y="309" text-anchor="middle" class="h">analysis</text><text x="300" y="328" text-anchor="middle" class="s">nur Modell</text><rect x="410" y="288" width="170" height="50" rx="8" class="bx"/><text x="495" y="309" text-anchor="middle" class="h">action</text><text x="495" y="328" text-anchor="middle" class="s">jira: issue.create</text><line x1="190" y1="313" x2="213" y2="313" class="ln" marker-end="url(#oaxd1-de-a)"/><line x1="385" y1="313" x2="408" y2="313" class="ln" marker-end="url(#oaxd1-de-a)"/><line x1="105" y1="338" x2="105" y2="368" class="ln" marker-end="url(#oaxd1-de-a)"/><line x1="495" y1="338" x2="495" y2="368" class="ln" marker-end="url(#oaxd1-de-a)"/><rect x="20" y="370" width="560" height="36" rx="8" class="bx ac"/><text x="300" y="393" text-anchor="middle" class="s">Policy-Gate (erlauben / ablehnen / Freigabe) + Audit, Run-ID</text><g><rect x="20" y="446" width="170" height="40" rx="8" class="bx"/><text x="105" y="471" text-anchor="middle">jira-MCP</text></g><g><rect x="215" y="446" width="170" height="40" rx="8" class="bx"/><text x="300" y="471" text-anchor="middle">crm-MCP</text></g><g class="dim"><rect x="410" y="446" width="170" height="40" rx="8" class="bx"/><text x="495" y="471" text-anchor="middle">git-MCP</text></g><line x1="105" y1="406" x2="105" y2="444" class="ln" marker-end="url(#oaxd1-de-a)"/><line x1="300" y1="406" x2="300" y2="444" class="ln" marker-end="url(#oaxd1-de-a)"/><text x="495" y="506" text-anchor="middle" class="s dim">nicht freigegeben</text></svg><figcaption>Oben ein Agent und ein MCP-Server für alles. Unten das agentix-Muster: ein Agent pro Schritt, ein MCP-Server pro System, dazwischen ein Gate.</figcaption></figure>

## Die Regeln und ihre Begründung

**R1. Ein MCP-Server pro System.** Ein Server pro System oder Bounded Context, und er ist die
einzige Tür zu diesem System. Werkzeuge haben typisierte Schemas, Lesen und Schreiben sind
getrennte Werkzeuge, die Zugangsdaten liegen nur dort. *Warum:* Eine Tür heißt eine Stelle zum
Prüfen, zum Austauschen eines Schlüssels und zum Nachsehen im Audit-Trail, und ein kleiner Server
lässt sich von jedem Agenten wiederverwenden, der dieses System braucht. Ein Server pro Werkzeug,
das andere Extrem, vervielfacht Deployments und Zugangsdaten, ohne eine Grenze hinzuzufügen. Hat
ein System sehr unterschiedliche Risikoklassen, etwa Rechnungen lesen und Erstattungen auslösen,
bleibt es bei einem Server mit getrennten Lese- und Schreibwerkzeugen und Policy pro Werkzeug.
Aufteilen sollte man den Server erst, wenn sich die Zugangsdaten selbst unterscheiden.

**R2. Geschäftslogik wird zu 1..n Agenten, einer pro Schritt.** Beschreiben Sie den Prozess als
Schritte. Standardmäßig ist ein Schritt ein Agent; einen Gott-Agenten, der alle Server hält, gibt
es nicht. *Trennen* Sie, wenn sich Risikoklasse, Datenklasse, Rechte, Modell, Fehlerbehandlung,
Kosten oder Freigabebedarf unterscheiden. *Zusammenlassen* sollten Sie Schritte, die Kontext und
Rechte teilen: Jede Trennung kostet Latenz, Tokens und Abstimmung und verliert Kontext, den der
nächste Agent gebraucht hätte.

**R3. Agenten sprechen nie direkt mit Systemen.** Jeder Werkzeugaufruf läuft durch ein
deterministisches Policy-Gate (erlauben, ablehnen, Freigabe) und landet im Audit-Trail. Ein Modell
darf fragen; die Entscheidung kommt aus Code, den man lesen und testen kann, außerhalb des Prompts.

**R4. Übergaben sind ausdrücklich, typisiert und knapp.** Agenten reichen dem nächsten Schritt ein
Artefakt mit Schema weiter, keinen gemeinsamen Speicher und keinen offenen Chat. Eine typisierte
Übergabe lässt sich prüfen, protokollieren und erneut abspielen; Freitext aus einem Schritt, der
feindliche Eingaben gelesen hat, ist ein Weg für Prompt-Injection in den nächsten.

**R5. Orchestrierung ist Daten.** Die Reihenfolge der Schritte steht in einem versionierten Plan,
nicht in einem weiteren Agenten, der alles weiß. Einen Plan kann man vergleichen, prüfen und
festschreiben; ein Orchestrator-Agent mit allen Werkzeugen ist ein Gott-Agent mit Umweg.

**R6. Budgets und Identität pro Schritt.** Jeder Agent hat eigene Grenzen (Schritte,
Werkzeugaufrufe, Tokens, Kosten, Zeit) und eine eigene Identität im Audit-Trail. So stoppt eine
Schleife nur ihren Schritt, und auf „Wer war das?“ gibt es eine bessere Antwort als „die Pipeline“.

**R7. Beobachtbarkeit über die Run-ID.** Jeder Modellaufruf, Werkzeugaufruf, jede
Policy-Entscheidung, Freigabe und Kostenzeile trägt Run-ID und Agenten-ID. Ohne das kann niemand
zeigen, dass R1 bis R6 eingehalten wurden.

## Ein durchgerechnetes Beispiel: Ticket-Triage

Ein Ticket zu einer fehlgeschlagenen Zahlung kommt herein. Jemand soll Ticket und Kunde
nachschlagen, entscheiden, ob daraus ein Engineering-Issue werden muss, und es gegebenenfalls
anlegen.

<figure class="oaxd-fig" tabindex="0"><svg class="oaxd" role="img" aria-labelledby="oaxd2-de-t oaxd2-de-d" viewBox="0 0 600 404" width="600" height="404"><title id="oaxd2-de-t">Durchgerechnetes Beispiel: Ticket-Triage</title><desc id="oaxd2-de-d">Ein Ereignis startet den Research-Agenten, der nur Lesewerkzeuge der MCP-Server für Jira und CRM aufrufen darf. Er übergibt typisierte Befunde an den Analyse-Agenten, der keine Werkzeuge hat. Dieser übergibt eine typisierte Entscheidung an den Action-Agenten, der genau ein Schreibwerkzeug aufrufen darf, issue.create am Jira-MCP-Server, und das erst nach Freigabe durch einen Menschen. Jeder Aufruf läuft durch das Policy-Gate und wird protokolliert.</desc><style>.oaxd-fig{margin:2rem 0;overflow-x:auto}.oaxd-fig figcaption{margin-top:.5rem;font-size:.9em;opacity:.85}.oaxd{width:100%;min-width:30rem;height:auto;max-width:40rem;margin:0 auto;font-family:inherit;font-size:15px;color:inherit}.oaxd text{fill:currentColor}.oaxd .s{font-size:13px}.oaxd .h{font-weight:600}.oaxd .bx{fill:currentColor;fill-opacity:.05;stroke:currentColor;stroke-opacity:.6;stroke-width:1.5}.oaxd .ln{fill:none;stroke:currentColor;stroke-opacity:.75;stroke-width:1.5}.oaxd .dash{stroke-dasharray:6 5}.oaxd .dim{opacity:.55}.oaxd .ac{stroke:var(--accent,var(--sl-color-accent-high,#6d28d9));stroke-opacity:1}.oaxd .act{fill:var(--accent,var(--sl-color-accent-high,#6d28d9))}.oaxd .dg{stroke:var(--danger,var(--sl-color-red-high,#be123c));stroke-opacity:1}.oaxd .dgt{fill:var(--danger,var(--sl-color-red-high,#be123c))}.oaxd .wn{fill:var(--warn,var(--sl-color-orange-high,#92400e));stroke:none}.oaxd .op{fill:var(--bg,var(--sl-color-black,Canvas));stroke:none}.oaxd .wnt{fill:var(--warn,var(--sl-color-orange-high,#92400e))}</style><defs><marker id="oaxd2-de-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><rect x="10" y="10" width="200" height="34" rx="8" class="bx"/><text x="110" y="32" text-anchor="middle" class="s">Ereignis: ticket.created</text><rect x="10" y="74" width="200" height="52" rx="8" class="bx"/><text x="110" y="96" text-anchor="middle" class="h">research</text><text x="110" y="116" text-anchor="middle" class="s">liest nur</text><rect x="10" y="174" width="200" height="52" rx="8" class="bx"/><text x="110" y="196" text-anchor="middle" class="h">analysis</text><text x="110" y="216" text-anchor="middle" class="s">nur Modell, keine Werkzeuge</text><rect x="10" y="274" width="200" height="52" rx="8" class="bx"/><text x="110" y="296" text-anchor="middle" class="h">action</text><text x="110" y="316" text-anchor="middle" class="s">schreibt nach Freigabe</text><line x1="110" y1="44" x2="110" y2="72" class="ln" marker-end="url(#oaxd2-de-a)"/><line x1="110" y1="126" x2="110" y2="172" class="ln" marker-end="url(#oaxd2-de-a)"/><text x="118" y="154" text-anchor="start" class="s">findings.json</text><line x1="110" y1="226" x2="110" y2="272" class="ln" marker-end="url(#oaxd2-de-a)"/><text x="118" y="254" text-anchor="start" class="s">decision.json</text><rect x="236" y="74" width="36" height="252" rx="6" class="bx ac"/><text x="254" y="200" text-anchor="middle" class="s" transform="rotate(-90 254 200)">Policy-Gate + Audit</text><line x1="210" y1="100" x2="234" y2="100" class="ln" marker-end="url(#oaxd2-de-a)"/><line x1="210" y1="300" x2="234" y2="300" class="ln" marker-end="url(#oaxd2-de-a)"/><rect x="320" y="74" width="270" height="124" rx="8" class="bx"/><text x="455" y="96" text-anchor="middle" class="h">jira-MCP-Server</text><text x="334" y="124" text-anchor="start" class="s">lesen</text><text x="400" y="124" text-anchor="start" class="s">issue.get</text><text x="334" y="148" text-anchor="start" class="s">lesen</text><text x="400" y="148" text-anchor="start" class="s">issue.search</text><text x="334" y="182" text-anchor="start" class="s act">schreiben</text><text x="400" y="182" text-anchor="start" class="s act">issue.create</text><rect x="320" y="228" width="270" height="98" rx="8" class="bx"/><text x="455" y="250" text-anchor="middle" class="h">crm-MCP-Server</text><text x="334" y="278" text-anchor="start" class="s">lesen</text><text x="400" y="278" text-anchor="start" class="s">customer.get</text><g class="dim"><text x="334" y="310" text-anchor="start" class="s">schreiben</text><text x="400" y="310" text-anchor="start" class="s">customer.update</text></g><line x1="272" y1="104" x2="318" y2="132" class="ln" marker-end="url(#oaxd2-de-a)"/><line x1="272" y1="112" x2="318" y2="272" class="ln" marker-end="url(#oaxd2-de-a)"/><line x1="272" y1="296" x2="318" y2="182" class="ln ac" marker-end="url(#oaxd2-de-a)"/><path d="M295 231l8 8-8 8-8-8z" class="wn"/><path d="M18 352l8 8-8 8-8-8z" class="wn"/><text x="34" y="365" text-anchor="start" class="s">Freigabe durch einen Menschen vor dem Aufruf</text><text x="10" y="392" text-anchor="start" class="s">jeder Aufruf an einen MCP-Server läuft durch das Gate und ins Audit (Run-ID)</text></svg><figcaption>Lesen und Schreiben sind getrennte Werkzeuge. Nur der Action-Schritt darf schreiben, einmal, nach Freigabe.</figcaption></figure>

Manipuliert Text im Ticket den Research-Agenten, kann dieser nur lesen. Der Analyse-Agent hält
nichts, was sich missbrauchen ließe. Der Action-Agent kann eine Art von Issue anlegen, erst nach
Freigabe durch einen Menschen, und kann das CRM nicht lesen. Als Plan, skizziert in der Form eines
Agent Plan (illustrativ, kein verbindliches Format):

```yaml
kind: AgentPlan
name: payment-ticket-triage
version: 1.0.0
steps:
  - agent: research
    tools: [jira.issue.get, jira.issue.search, crm.customer.get]
    output: { schema: findings.json }
    budget: { maxToolCalls: 10, maxCostUsd: 0.10 }
  - agent: analysis
    tools: []
    input: findings.json
    output: { schema: decision.json }   # { action: "create" | "none", summary, priority }
  - agent: action
    when: decision.action == "create"
    tools:
      - name: jira.issue.create
        approval: required
        maxCallsPerRun: 1
    input: decision.json
```

## Best Practices für den Entwurf von MCP-Servern

Bei jedem Punkt steht, ob die MCP-Dokumentation ihn nennt (*Doku*) oder ob er unsere Empfehlung ist
(*unsere*). Die Quellen stehen am Ende.

- **Eine Verantwortung:** ein System oder eine Fähigkeit pro Server (*unsere*, vereinbar mit
  der Doku, die Server beschreibt, die „specific capabilities“ bereitstellen, und Beispiele mit je
  einem System nennt).
- **Kleine, typisierte Werkzeugoberfläche:** jedes Werkzeug mit Eingabeschema, Typen und
  Pflichtfeldern (*Doku*: Werkzeuge sind „schema-defined interfaces“; Grenzen und Enums sind
  *unsere*).
- **Lesen und Schreiben getrennt:** eigene Werkzeuge, zerstörerische heißen auch so (*unsere*;
  die Doku trennt nur lesende Ressourcen von Werkzeugen, die das Modell steuert).
- **Idempotent und begrenzt:** Schreibzugriffe gefahrlos wiederholbar, Ergebnisse in der Größe
  begrenzt (*unsere*).
- **Klare Fehler**, die Agent und Audit-Trail unterscheiden können (*unsere*).
- **Keine Zugangsdaten im Umlauf:** Geheimnisse im Server auflösen, nie im Prompt; das Token
  eines Clients nie an eine nachgelagerte API durchreichen (*Doku* für das Token, *unsere* für den
  Rest).
- **Minimale Scopes:** klein anfangen, bei Bedarf erweitern (*Doku*).
- **Policy und Freigabe pro Werkzeug** (*Doku* nennt Freigabedialoge und Vorab-Erlaubnisse als
  Möglichkeiten; deterministische Policy pro Werkzeug ist *unsere*).
- **Versionierung** von Werkzeugen und Scopes, keine stillen Bedeutungsänderungen (*Doku* für
  Scopes, *unsere* für Werkzeuge).
- **Audit:** jeder Aufruf einem Lauf und einem Agenten zuordenbar (*Doku* nennt
  Aktivitätsprotokolle und Korrelations-IDs; Run- und Agenten-ID sind *unsere*).

## Antimuster

- **Der Gott-Agent:** ein Agent mit allen Servern, „weil es einfacher ist“, bis zur ersten Injection.
- **Der Taschenmesser-Server:** ein MCP-Server für viele Systeme. Viele Zugangsdaten, keine
  Wiederverwendung.
- **Ein MCP-Server pro Endpunkt:** viele Türen, keine Grenze.
- **Geteilte Zugangsdaten:** Der Audit-Trail kann nicht mehr sagen, wer gehandelt hat.
- **Freier Chat zwischen Agenten:** nichts zu prüfen, nichts erneut abzuspielen.
- **Der Orchestrator-Agent, der alles hält:** die häufigste Art, R5 zu brechen.
- **Policy im Prompt:** „Lösche niemals etwas“ ist ein Wunsch, keine Kontrolle.

## Checkliste für die Entscheidung

1. Kann ich jeden Schritt des Prozesses in einem Satz benennen?
2. Welche Werkzeuge welcher Server braucht jeder Schritt, und welche davon lesen nur?
3. Unterscheiden sich benachbarte Schritte in Risiko, Datenklasse, Rechten, Modell,
   Fehlerbehandlung, Kosten oder Freigabe? Dann trennen, sonst zusammenlassen.
4. Was übergibt jeder Schritt, und kann ich dafür ein Schema schreiben?
5. Welche Aufrufe brauchen einen Menschen, und wer darf entscheiden?
6. Kann ich einen Lauf allein aus seiner Run-ID nachvollziehen?

## Was die Dokumentation sagt und was von uns kommt

Die MCP-Dokumentation beschreibt einen Host, der pro Server einen eigenen Client anlegt, Server,
die „specific capabilities“ bereitstellen, mit Beispielen je System (Dateisystem, Datenbank,
GitHub, Slack, Kalender), Werkzeuge, die jeweils „a single operation“ ausführen, eine optionale
Zustimmung des Nutzers vor einem Werkzeugaufruf und Sicherheitshinweise, die das Durchreichen von
Tokens verbieten und minimale Scopes empfehlen. Die Claude-Code-Dokumentation beschreibt Subagenten
mit eigenem Kontextfenster, „specific tool access“, einer `tools`-Allowlist und optional eigenem
Modell und eigener MCP-Server-Liste. R1, R2 und R3 sind damit vereinbar. Keine der Quellen
schreibt unsere Regeln vor oder empfiehlt dieses Muster.

Wo wir weiter gehen oder abweichen: Die MCP-Doku verlangt nicht einen Server pro System; eines
ihrer eigenen Beispiele ist ein kombinierter „Calendar/Email Server“. Subagenten in Claude Code
geben eine Zusammenfassung an die Hauptunterhaltung zurück, die selbst delegiert. Unsere R4
(typisierte Übergaben) und R5 (Plan statt orchestrierendem Agenten) sind strengere Entscheidungen
für unbeaufsichtigte, protokollierte Läufe, keine Korrektur dieser Dokumentation.

## Abwägungen und Meinung

Mehr Agenten bedeuten mehr Übergaben, mehr Modellaufrufe, mehr Latenz und mehr Pflege. Eine Aufgabe
mit einem Werkzeug und einem Leser braucht keine drei Agenten. Was hilft: Schritte mit gleichen
Rechten zusammenlassen, für enge Schritte kleine Modelle und, wo kein Modell nötig ist, schlichten
Code nehmen, Übergaben kurz halten. Die Regeln leihen sich etwas bei minimalen Rechten,
Microservices, Bounded Contexts sowie Ports und Adaptern, sind aber nicht dasselbe: Microservices
trennen Deploy-Einheiten, R2 trennt Befugnisse. Tatsache: Werkzeugaufrufe lassen sich abfangen,
und eine kleinere Berechtigung reicht weniger weit. Meinung: dass ein Schritt pro Agent der
richtige Standard ist, ein Server pro System die richtige Körnung und der Mehraufwand sich
meistens lohnt.

## Wo open-agentix steht

Umgesetzt in 0.1.0: Pipelines aus 1..n Agenten in `agents.md` mit unveränderlichen Versionen,
Werkzeug-Allowlists mit Argumentregeln und `approval: required` pro Agent, Modell und Budget pro
Agent, das deterministische Policy-Gate, das MCP-Gateway, der verkettete Audit-Trail sowie Schritte
und Kosten pro Lauf und Agent. Auf `main`, aber noch nicht veröffentlicht: Mandanten, Verbindungen
mit Geltungsbereich Mandant, Team oder Agent (nur mit Referenzen auf Geheimnisse) und
Rollenbindungen für einzelne Agenten.

Ebenfalls auf `main`, aber noch nicht in einem Release (erscheint in 0.2):

- **Typisierte Übergaben (R4):** Übergaben zwischen Schritten lassen sich mit JSON Schema typisieren.
- **Bedingte Pläne (R5):** Pipeline-Schritte können eine `when`-Bedingung tragen.
- **Benannte Lese- und Schreibprofile pro MCP-Server (R1).**
- **Agent Check und Agent Plan v1:** beratend, mit einer deterministischen Prüfung auf minimale Rechte.

Noch nicht da:

- **Zugangsdaten pro Schritt und isolierte Worker (R6)** stehen für v0.2 auf der
  [Roadmap](https://github.com/open-agentix/open-agentix/blob/main/ROADMAP.md). Ein
  Kubernetes-Job-Runner existiert als Baustein, ein Job pro Schritt, ist aber noch nicht angeschlossen.
- **Von einem Modell erzeugte Planvorschläge:** Der beratende Check lässt noch kein Modell die
  Aufteilung vorschlagen.

## Quellen

Alle abgerufen am 4. Oktober 2026. Wir geben sinngemäß wieder; Zitate sind kurz und englisch.

- Model Context Protocol, [What is MCP?](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)
- Model Context Protocol, [Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- Model Context Protocol, [Understanding MCP servers](https://modelcontextprotocol.io/docs/2026-07-28/learn/server-concepts)
- Model Context Protocol, [Security best practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)
- Claude-Code-Dokumentation, [Create custom subagents](https://code.claude.com/docs/en/sub-agents)

Die Kurzfassung des Musters steht in der [Dokumentation](https://openagentix.si/docs/concepts/agentix-pattern/).
Wenn Sie eine Regel für falsch halten oder einen Fall kennen, in dem ein Gott-Agent die bessere
Lösung ist, schreiben Sie uns in den [GitHub Discussions](https://github.com/open-agentix/open-agentix/discussions).
Wir korrigieren das Muster lieber, als es zu verteidigen.
