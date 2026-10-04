---
ref: byok-explained
lang: de
title: "BYOK für Agentenplattformen: eigene Schlüssel, eigene Anbieter, eigene Rechnung"
description: "BYOK LLM erklärt: Die Plattform ruft Modellanbieter mit Ihren Schlüsseln und Verträgen auf. Gateways, Kataloge, Kosten pro Schlüssel und die Grenzen von BYOK."
date: 2026-07-09T09:00:00Z
tags: [byok, self-hosted, costs]
---

BYOK bei einer LLM-Plattform heißt „Bring your own key“: Die Plattform ruft Modellanbieter mit Zugangsdaten und Verträgen auf, die Ihnen gehören, nicht dem Plattformanbieter. Sie wählen die Anbieter, Sie halten die Schlüssel, Sie erhalten die Rechnung, und die Plattform leitet Anfragen weiter, erzwingt Grenzen und zeigt, wohin das Geld floss. Dieser Beitrag erklärt die Bausteine und, ebenso wichtig, was BYOK nicht löst.

## Was BYOK in der Praxis bedeutet

In einem verwalteten Angebot sitzt der Anbieter zwischen Ihnen und den Modellanbietern. Er kauft Token im Großen, schlägt etwas auf oder bündelt sie in einen Tarif, und Sie sehen nie einen Anbieterschlüssel. Das ist bequem, aber Sie erben die Anbieterauswahl, die Ratenlimits und die Datenschutzbedingungen des Plattformanbieters.

Bei BYOK ist die Plattform ein Client der Anbieter und handelt in Ihrem Auftrag:

- **Ihr Vertrag.** Auftragsverarbeitung, regionale Endpunkte, Aufbewahrungseinstellungen und Rabatte sind die, die Sie verhandelt haben.
- **Ihr Kontingent.** Ratenlimits und Ausgabengrenzen hängen an Ihrem Konto und werden nicht mit anderen Kunden geteilt.
- **Ihre Wahl.** Sie können einen gehosteten Anbieter, einen Endpunkt aus einem Cloud-Marktplatz oder ein selbst betriebenes Modell nutzen und wechseln, ohne die Agenten zu ändern.
- **Ihre Rechnung.** Die Nutzung erscheint direkt beim Anbieter und lässt sich mit den Zahlen der Plattform vergleichen.

Der Preis für diese Kontrolle ist Verantwortung. Sie müssen die Schlüssel schützen, die Ausgaben beobachten und die Anbieterliste aktuell halten.

## Das Problem mit dem Anbieterkatalog

Jeder Anbieter benennt Modelle, bepreist Token und beschreibt Fähigkeiten anders. Eine Plattform mit vielen Anbietern braucht einen Katalog: welche Modelle es gibt, was sie kosten, welche Kontextgröße und Funktionen sie bieten. Von Hand ist das nicht zu pflegen, daher stützen sich die meisten Setups auf eine offene Datenbank. Ein solches Projekt beschreibt sich so (englisches Original):

> Models.dev is a comprehensive open-source database of AI model specifications, pricing, and features.

Quelle: [Models.dev](https://models.dev/). Sinngemäß: eine umfassende Open-Source-Datenbank mit Modellspezifikationen, Preisen und Funktionen.

Coding-Werkzeuge nutzen dieselbe Idee. Die OpenCode-Dokumentation sagt:

> OpenCode uses the AI SDK and Models.dev to support 75+ LLM providers and it supports running local models.

Quelle: [OpenCode docs, Providers](https://opencode.ai/docs/providers/). Sinngemäß: OpenCode unterstützt über das AI SDK und Models.dev mehr als 75 Anbieter sowie lokale Modelle.

Zwei Vorbehalte. Erstens ist ein Katalogeintrag Daten, und Daten veralten: Preise ändern sich, Modelle werden abgekündigt. Behandeln Sie Katalogaktualisierungen als geprüfte Änderungen, nicht als etwas, das zur Laufzeit live geholt wird. Das gilt besonders in abgeschotteten Netzen, in denen zur Laufzeit nichts nachgeladen werden darf. Zweitens beschreibt „unterstützt 75+ Anbieter“ die Reichweite eines Clients, nicht die Zusage, dass sich jeder Anbieter bei Tool-Nutzung oder langen Kontexten gleich verhält. Testen Sie die, auf die Sie sich verlassen.

## Gateways: eine Tür vor vielen Anbietern

![BYOK-Routing über ein Gateway zu mehreren Modellanbietern](/images/blog/byok-explained-1.svg)

Ein Gateway ist ein Dienst, der Anfragen in einem Format annimmt und an den passenden Anbieter weiterleitet. Für BYOK bringt er drei Dinge:

1. **Eine Integrationsstelle.** Agenten sprechen mit einem Endpunkt; das Gateway kennt die Anbieterdetails.
2. **Zentrale Schlüssel.** Anbieterschlüssel liegen im Gateway oder im Secret-Store, nicht in jeder Agentendefinition. Wie man sie vom Modell fernhält, steht in [Geheimnisse für Agenten](/de/posts/secrets-for-agents/).
3. **Zentrale Richtlinien.** Erlaubte Modelle, Ratenlimits, Budgets und Protokollierung werden an einer Stelle durchgesetzt.

Sie können ein eigenes Gateway betreiben oder ein Produkt nutzen. Beachten Sie, dass Herstellerdokumentation hier eine Grenze zieht. In der Claude-Code-Dokumentation von Anthropic steht:

> Anthropic doesn’t endorse, maintain, or audit third-party gateway products

Quelle: [Claude Code docs, Other LLM gateways](https://code.claude.com/docs/en/llm-gateway). Sinngemäß: Anthropic empfiehlt, pflegt oder prüft Gateway-Produkte Dritter nicht.

Praktisch heißt das: Ein Gateway sieht jeden Prompt und jede Antwort und ist damit eine Komponente mit hohem Vertrauensbedarf. Wählen Sie es wie jede Infrastruktur, die sensible Daten verarbeitet: Code oder Vertrag lesen, Versionen festlegen, Administratoren begrenzen.

## Kostenverfolgung pro Schlüssel

BYOK nützt nur, wenn erkennbar ist, wer was ausgegeben hat. Üblich sind virtuelle Schlüssel: Das Gateway erzeugt eigene Schlüssel, jeweils einem Team, Projekt oder Agenten zugeordnet, und rechnet die Nutzung darauf ab. Die Dokumentation von LiteLLM etwa sagt:

> Spend is automatically tracked for the key

Quelle: [LiteLLM docs, Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys). Sinngemäß: Die Ausgaben werden automatisch je Schlüssel erfasst.

Mit einem virtuellen Schlüssel pro Agent oder Team können Sie:

- pro Schlüssel ein Budget setzen und Läufe stoppen, wenn es aufgebraucht ist,
- den einen Agenten finden, der den Großteil der Rechnung verursacht,
- einen einzelnen Schlüssel sperren, ohne den dahinterliegenden Anbieterschlüssel anzufassen.

Anbieterschlüssel bleiben hinter dem Gateway; die virtuellen Schlüssel geben Sie an Teams aus. Verbinden Sie das mit den Budgetideen aus [Kosten sind Sache der Plattform](/de/posts/cost-is-a-platform-concern/) und den Maßnahmen auf Token-Ebene in [Prompt-Caching und Token-Budgets](/de/posts/prompt-caching-and-token-budgets/).

Eine knappe Skizze der Schichtung:

```yaml
providers:
  - name: provider-a
    key_ref: secret://llm/provider-a      # stays in the secret store
    models: [model-large, model-small]
virtual_keys:
  - name: support-agents
    models: [model-small]
    monthly_budget: 200                   # in your billing currency
```

Die Syntax ist beispielhaft. Entscheidend ist die Indirektion: Agenten sehen den Schlüssel von `provider-a` nie, und ein virtueller Schlüssel hat eine Modell-Allowlist und ein Budget.

## Was BYOK nicht löst

- **Datenumgang beim Anbieter.** BYOK ändert, wessen Vertrag gilt, nicht, was der Anbieter mit den Daten tut. Darf ein Prompt das eigene Netz nicht verlassen, hilft nur ein selbst betriebenes Modell.
- **Schlüsselabfluss.** Mehr Schlüssel an mehr Orten heißt mehr zu schützen. Ein abgeflossener Anbieterschlüssel wird Ihnen berechnet.
- **Kostenkontrolle von selbst.** Ohne Budgets verlagert BYOK die böse Überraschung nur auf Ihr eigenes Konto.
- **Qualität und Sicherheit.** Ein Anbieterwechsel ändert das Verhalten. Bewerten Sie, bevor Sie Produktionsverkehr auf ein neues Modell leiten.
- **Betriebsaufwand.** Anbieterausfälle, Abkündigungen und Quota-Mails beobachten Sie nun selbst.

## Eine kurze BYOK-Prüfliste

- Anbieterschlüssel liegen in einem Secret-Store; nur das Gateway kann sie lesen.
- Agenten verwenden virtuelle oder eng begrenzte Schlüssel, einen je Team oder Agent.
- Jeder Schlüssel hat eine Modell-Allowlist und ein Budget.
- Der Modellkatalog wird geprüft und versioniert, nicht live geholt.
- Die Ausgaben werden exportiert und monatlich mit der Anbieterrechnung abgeglichen.
- Ein Schlüssel lässt sich sperren und ein Anbieterschlüssel rotieren, ohne Agenten neu auszurollen.

## Das Wichtigste in Kürze

- BYOK heißt: Die Plattform nutzt Ihre Anbieterschlüssel und -verträge; Sie gewinnen Kontrolle und übernehmen Verantwortung.
- Modellkatalog und Gateway halten viele Anbieter beherrschbar.
- Virtuelle Schlüssel liefern Kostenverfolgung und Budgets je Team und Agent.
- Ein Gateway ist eine Komponente mit hohem Vertrauensbedarf; Hersteller stehen für Gateways Dritter nicht ein.
- BYOK ändert nichts am Umgang der Anbieter mit Ihren Daten und begrenzt Kosten nicht von allein.

## Quellen

- [Models.dev](https://models.dev/), eine Open-Source-Datenbank für KI-Modelle.
- [Providers](https://opencode.ai/docs/providers/), OpenCode-Dokumentation.
- [Other LLM gateways](https://code.claude.com/docs/en/llm-gateway), Claude-Code-Dokumentation.
- [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys), LiteLLM-Dokumentation.
