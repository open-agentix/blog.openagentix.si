---
ref: agent-governance-operating-model
lang: de
title: "KI-Governance-Betriebsmodell für Agenten: wer wofür zuständig ist"
description: "Ein AI Governance Operating Model scheitert, wenn niemand Agentenregister, Richtlinien oder Budget verantwortet. Rollen, RACI für Plattform, Security, Prüfer."
date: 2026-09-01T09:00:00Z
tags: [governance, enterprise, explainer]
---

Ein Betriebsmodell für KI-Governance (englisch: AI governance operating model) weist klare Verantwortliche für das zu, was sonst zwischen Teams liegen bleibt: das Agentenregister, die Richtlinien, das Budget, die Freigabe riskanter Aktionen und die Prüfung der Audit-Daten. Governance scheitert, wenn alle annehmen, ein anderer sei zuständig. Dieser Beitrag schlägt vier Rollen vor (Plattform, Security, Prozessverantwortliche, Prüfer), eine RACI-Matrix für fünf wiederkehrende Tätigkeiten und eine kurze Startcheckliste. Die Rollen sind ein Vorschlag zum Anpassen, kein Standard.

## Warum Governance ein Betriebsmodell braucht

Rahmenwerke und Leitlinien sagen, was zu bedenken ist. Wer es an einem Dienstag tut, sagen sie selten. Das AI Risk Management Framework des NIST beschreibt sich selbst bescheiden:

> The NIST AI Risk Management Framework (AI RMF) is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations

Quelle: [AI Risk Management Framework, NIST](https://www.nist.gov/itl/ai-risk-management-framework). Sinngemäß: Das Rahmenwerk ist für freiwillige Nutzung gedacht und soll die Fähigkeit verbessern, Aspekte der Vertrauenswürdigkeit einzubeziehen. Freiwillige Rahmenwerke wirken nur, wenn jemand für ihre Anwendung verantwortlich ist. Einen praktischen Durchgang für Teams bietet [das NIST AI RMF für Agenten-Teams](/de/posts/nist-ai-rmf-for-agent-teams/).

Das britische National Cyber Security Centre gliedert seine Leitlinien entlang des Lebenszyklus eines KI-Systems:

> four key areas within the AI system development life cycle: secure design, secure development, secure deployment, and secure operation and maintenance

Quelle: [Guidelines for secure AI system development, NCSC](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development). Sinngemäß: vier Schwerpunkte im Entwicklungslebenszyklus eines KI-Systems, nämlich sicherer Entwurf, sichere Entwicklung, sichere Bereitstellung sowie sicherer Betrieb und Wartung. Ein Betriebsmodell ordnet diese Phasen Menschen zu: wer den Entwurf abnimmt, wer ausrollt, wer den Betrieb beobachtet. Ohne diese Zuordnung hat jede Phase ein Richtliniendokument und keinen Verantwortlichen.

## Vier Rollen

**Plattform-Team.** Betreibt die Infrastruktur, auf der Agenten laufen: Harness, Tool-Anbindungen, Register, Budgets, Logging. Verantwortet Verfügbarkeit und die technische Durchsetzung der Regeln.

**Security.** Legt die Regeln für Daten, Identitäten, Werkzeugzugriff und riskante Aktionen fest, bewertet neue Agenten und Werkzeuge und reagiert auf Vorfälle. Verantwortet den Inhalt der Richtlinien, nicht die Technik, die sie anwendet.

**Prozessverantwortliche.** Die fachliche Person, die für das Ergebnis des vom Agenten unterstützten Prozesses geradesteht, zum Beispiel die Leitung des Support-Betriebs. Verantwortet Zweck, akzeptables Risiko für diesen Prozess und den Budgetantrag.

**Prüfer.** Eine qualifizierte Person, die über risikoreiche Aktionen mit menschlicher Freigabe entscheidet und Läufe stichprobenartig auf Qualität prüft. Prüfer brauchen Kompetenz und Zeit, um Nein zu sagen.

Eine kleine Organisation kann Rollen auf weniger Personen bündeln; entscheidend ist, dass jede der folgenden Tätigkeiten genau einen Rechenschaftspflichtigen hat.

## Die RACI-Matrix

![RACI-Matrix für Rollen der Agenten-Governance](/images/blog/agent-governance-operating-model-1.svg)

R = Responsible (führt aus), A = Accountable (steht für das Ergebnis ein, genau eine Person je Zeile), C = Consulted (wird gefragt), I = Informed (wird informiert).

| Tätigkeit | Plattform | Security | Prozessverantwortliche | Prüfer |
| --- | --- | --- | --- | --- |
| Agent registrieren | R | C | A | I |
| Richtlinie ändern | C | A | C | I |
| Risikoreiche Aktion freigeben | I | C | C | A |
| Budget festlegen | R | I | A | I |
| Audit-Daten prüfen | C | R | I | A |

Die Zeilen im Einzelnen:

- **Agent registrieren.** Die Prozessverantwortlichen stehen für Zweck und Umfang ein; das Plattform-Team trägt ihn ins Register ein; Security wird zu Werkzeugen und Daten gefragt.
- **Richtlinie ändern.** Security verantwortet das Ergebnis. Die Plattform berät zur Machbarkeit, Prozessverantwortliche zu den fachlichen Folgen. Prüfer erfahren von Änderungen, die ihre Freigaben betreffen.
- **Risikoreiche Aktion freigeben.** Ein Prüfer entscheidet im Einzelfall. Prozessverantwortliche und Security haben die Regel geprägt, die die Freigabe auslöst; keiner von beiden sollte die Person sein, die für den eigenen Prozess auf "Freigeben" klickt.
- **Budget festlegen.** Die Prozessverantwortlichen entscheiden, was der Prozess wert ist; das Plattform-Team konfiguriert und erzwingt die Limits. Administrative Ausgabenkontrollen gehören bei Business-Angeboten zum Standard, zum Beispiel:

> Admins have control over the maximum amount a user can spend with extra usage

Quelle: [Claude Code and new admin controls for business plans, Anthropic](https://www.anthropic.com/news/claude-code-on-team-and-enterprise). Sinngemäß: Administratoren bestimmen, wie viel eine Person für zusätzliche Nutzung höchstens ausgeben darf. Bei jedem Produkt muss jemand als die Person benannt sein, die solche Limits setzt.
- **Audit-Daten prüfen.** Security übernimmt die Routineanalyse; ein Prüfer verantwortet, dass auf Befunde reagiert wird, und die regelmäßige Abnahme. Was Aufzeichnungen dafür tauglich macht, steht in [Audit-Trails gegenüber Logs](/de/posts/audit-trails-vs-logs/).

## Das Register ist der Mittelpunkt

Das Agentenregister ist die Liste aller im Betrieb befindlichen Agenten. Behandeln Sie es als Quelle der Wahrheit, die die anderen Tätigkeiten verbindet. Pro Agent festhalten, mindestens:

```yaml
agent: support-triage
purpose: classify incoming support tickets and draft a reply
process_owner: head-of-support
platform_contact: agent-platform-team
risk_tier: medium
tools: [tickets.read, tickets.comment]
data_classes: [customer-contact]
approval_required_for: [tickets.close]
budget_monthly: 400
status: production
review_due: 2026-12-01
```

Ohne Register lässt sich die erste Audit-Frage nicht beantworten: Welche Agenten gibt es, wer ist für sie verantwortlich und was dürfen sie? Ein Agent, der nicht im Register steht, sollte keine Zugangsdaten oder Werkzeugzugriffe erhalten können.

## Wie Läufe und Richtlinienentscheidungen jede Rolle erreichen

Rollen funktionieren nur, wenn sie sehen, was geschieht. Ein Governance-Aufbau sollte pro Lauf Status, Kosten und die währenddessen getroffenen Richtlinienentscheidungen (erlaubt, abgelehnt, wartet auf Freigabe) sichtbar machen. Die aktuelle open-agentix-Demo zeigt eine solche Übersicht in ihrer Laufliste, mit erfundenen Beispieldaten; siehe den Screenshot-Platz unten. Jede Rolle hat dann ihre natürliche Sicht: das Plattform-Team auf Fehler und Kosten, Security auf Ablehnungen, Prozessverantwortliche auf Ergebnisse und Ausgaben, Prüfer auf offene Freigaben.

<!-- screenshot-slot: Runs list of the current demo with invented tenants and agents, showing status, cost and policy decision count per run (alt: "Laufliste in der openagentix-Demo mit Beispieldaten"; capture later from demo.openagentix.si; invented example.org data only; caption as "the current demo") -->

Beurteilen Sie Ihren eigenen Aufbau nicht anhand eines Screenshots eines Produkts. Prüfen Sie, dass bei jedem Werkzeug ein Prüfer jeden Lauf finden kann, der auf Freigabe gewartet hat, und sieht, wer entschieden hat.

## Startcheckliste

1. Die vier Rollen benennen, jeweils mit einer Person und einer Vertretung.
2. Das Register anlegen und jeden heute produktiven Agenten eintragen; die erste Liste wird unvollständig sein, korrigieren Sie sie.
3. Aufschreiben, welche Aktionen eine menschliche Freigabe brauchen und wer die Prüfer sind.
4. Pro Agent einen Budgetverantwortlichen bestimmen und Limits mit Warnungen setzen. Die Reihenfolge eines Pilot-Rollouts steht in [erst Pilot, dann skalieren](/de/posts/enterprise-rollout-pilot-first/).
5. Eine wiederkehrende Prüfung von Audit-Daten und Registereinträgen terminieren (monatlich ist ein vernünftiger Anfang).
6. Den Eskalationsweg für Vorfälle festlegen: wer wird gerufen, wer entscheidet, einen Agenten anzuhalten.

## Grenzen und Vorbehalte

- Eine RACI beschreibt Absicht, nicht Verhalten. Prüfen Sie regelmäßig, dass die benannten Personen die Arbeit tatsächlich tun.
- Einzelne Rechenschaftspflichtige können zum Engpass werden. Delegieren Sie innerhalb der Rolle und protokollieren Sie Entscheidungen.
- Regulierung und Branchenregeln können zusätzliche Rollen oder Nachweise verlangen, etwa die Beteiligung einer oder eines Datenschutzbeauftragten. Dieser Beitrag ersetzt keine Rechtsberatung.
- Funktionstrennung kostet Zeit. Wenden Sie sie dort an, wo das Risiko hoch ist, und lassen Sie risikoarme Agenten einen leichteren Weg gehen.

## Das Wichtigste in Kürze

- Governance scheitert, wenn niemand Register, Richtlinien, Budget, Freigaben und Audit-Prüfung verantwortet.
- Vier Rollen decken die meisten Fälle ab: Plattform, Security, Prozessverantwortliche, Prüfer; jede Tätigkeit hat genau eine rechenschaftspflichtige Rolle.
- Das Agentenregister verbindet alles; nicht registrierte Agenten sollten keinen Zugriff bekommen.
- Läufe, Kosten und Richtlinienentscheidungen für jede Rolle sichtbar machen.
- Die RACI als lebendes Dokument behandeln und prüfen, dass Menschen wirklich tun, was dort steht.

## Quellen

- [AI Risk Management Framework (NIST, AI RMF 1.0 veröffentlicht 2023-01-26)](https://www.nist.gov/itl/ai-risk-management-framework)
- [Guidelines for secure AI system development (UK National Cyber Security Centre, 2023-11-27)](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development)
- [Claude Code and new admin controls for business plans (Anthropic, 2025-08-20)](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
