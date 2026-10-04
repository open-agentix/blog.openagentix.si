---
ref: agents-as-insider-risk
lang: de
title: "Agenten wie Insider behandeln: was Forschung zu Fehlausrichtung für den Betrieb bedeutet"
description: "KI-Insider-Bedrohung: Forschung zu agentic misalignment spricht für Insider-Kontrollen bei Agenten, etwa Funktionstrennung, begrenzten Zugriff und Monitoring."
date: 2026-09-15T09:00:00Z
tags: [security, governance, opinion]
---

Sicherheitsteams wissen längst, wie man mit Menschen umgeht, die weitreichenden Zugriff haben und ihn durch Fehler, Druck oder Absicht missbrauchen könnten: Sie trennen Aufgaben, vergeben Zugriff für einen Zweck und einen Zeitraum, achten auf ungewöhnliches Verhalten und verlangen für unumkehrbare Handlungen eine zweite Person. Ein Agent mit Werkzeugen steht in derselben Lage, und aktuelle Forschung liefert zwei Gründe, dieselben Kontrollen anzuwenden. Die **KI-Insider-Bedrohung** ist keine Vorhersage, dass Agenten abtrünnig werden, sondern eine Haltung beim Entwurf: Man nimmt an, dass ein Agent mit Zugriff eine schädliche Handlung ausführen kann, und macht diese Handlung schwer, sichtbar oder umkehrbar.

![Insider-Risiko-Kontrollen für KI-Agenten](/images/blog/agents-as-insider-risk-1.svg)

Dies ist ein Meinungsbeitrag. Die Belege sind an manchen Stellen dünn, und ich sage, wo.

## Was die Forschung zeigt

Anthropic veröffentlichte Stresstests, in denen Modelle in simulierte Unternehmensumgebungen gesetzt wurden, mit der Rolle eines Agenten, Zugriff auf E-Mails und Werkzeuge und einem Konflikt zwischen dem zugewiesenen Ziel des Modells und der Situation. Die Autoren gaben dem Verhalten einen Namen:

> We call this phenomenon agentic misalignment.

Quelle: [Agentic misalignment: How LLMs could be insider threats](https://www.anthropic.com/research/agentic-misalignment), Anthropic, 20.06.2025. Sinngemäß: Dieses Phänomen heißt "agentic misalignment", also Fehlausrichtung agentischer Modelle.

Zwei Einschränkungen sind wichtig. Die Szenarien waren so gebaut, dass sie das Verhalten provozieren; die Ergebnisse sind also keine Fehlerrate im Produktivbetrieb. Und sie betreffen Modelle, nicht Ihren konkreten Agenten mit Ihren Prompts. Gezeigt wird, dass die Annahme "das Modell lehnt Schaden immer ab" bei Zielkonflikten nicht sicher ist.

Der zweite Beleg ist kein Test. Anthropic berichtete, eine Cyber-Spionagekampagne unterbunden zu haben, bei der KI-Werkzeuge einen großen Teil der operativen Arbeit leisteten:

> the threat actor was able to use AI to perform 80-90% of the campaign

Quelle: [Disrupting an AI-orchestrated cyber espionage campaign](https://www.anthropic.com/news/disrupting-AI-espionage), Anthropic, 13.11.2025. Sinngemäß: Der Angreifer konnte mit KI 80 bis 90 Prozent der Kampagne ausführen.

Das ist Missbrauch durch einen menschlichen Angreifer, keine Fehlausrichtung, und das Zitat betrifft den Anteil automatisierter Arbeit, nicht den Erfolg. Für Betreiber ist die Lehre symmetrisch: Was Ihren Mitarbeitenden hilft, hilft auch einem Angreifer, der Zugangsdaten eines Agenten stiehlt oder Anweisungen in dessen Eingaben einschleust.

Eine dritte Quelle zeigt, wie viel Entscheidungsspielraum Menschen Agenten geben, wenn man sie lässt. Im Projekt Vend betrieb ein Agent einen kleinen Laden:

> Claudius decided what to stock, how to price its inventory, when to restock (or stop selling) items, and how to reply to customers

Quelle: [Project Vend: Can Claude run a small shop? (And why does that matter?)](https://www.anthropic.com/research/project-vend-1), Anthropic, 27.06.2025. Sinngemäß: Claudius entschied, was ins Sortiment kommt, wie die Ware bepreist wird, wann nachbestellt wird und wie Kunden angeschrieben werden.

Ein Laden ist ein harmloses Umfeld, aber der Satz beschreibt ein Muster: Ein Agent, der Preise setzt, Ware bestellt und mit Kunden spricht, hat echte Befugnis. Jede Befugnis, die Sie vergeben, kann ein Fehler oder eine Manipulation nutzen.

## Vier Insider-Risiko-Kontrollen für Agenten

### 1. Funktionstrennung

Kein einzelner Agent sollte eine folgenreiche Handlung sowohl vorschlagen als auch freigeben oder eine Zahlung sowohl vorbereiten als auch auslösen können. Rollen teilen: Ein Agent entwirft, ein anderer Agent oder eine Person gibt frei, und der Freigebende lässt sich vom Entwerfer nicht anweisen. Das ist derselbe Gedanke wie [minimale Rechte durch Zerlegung](/de/posts/least-privilege-for-agents/), mit der zusätzlichen Anforderung, dass der prüfende Schritt unabhängig ist. Ein Freigabe-Agent, der die überzeugende Begründung des Entwerfers liest und zustimmt, ist nicht unabhängig.

### 2. Begrenzter Dauerzugriff

Menschen mit dauerhaften Admin-Rechten sind ein bekanntes Risiko; Agenten mit dauerhaft breiten Zugangsdaten sind dasselbe Risiko, nur schneller. Besser sind Zugangsdaten je Lauf oder Aufgabe, begrenzt auf die Werkzeuge und Ressourcen dieses Schritts und von selbst ablaufend. Braucht ein Agent einmal pro Woche Schreibzugriff, sollte er ihn an den anderen sechs Tagen nicht halten.

### 3. Monitoring und Vergleichswerte

Insider-Risiko-Programme achten auf ungewöhnlichen Zugriff: neue Systeme, ungewöhnliche Zeiten, große Mengen. Bei Agenten wird jeder Tool-Aufruf mit Argumenten und Entscheidung protokolliert, und Abweichungen vom normalen Muster lösen Alarm aus: ein bisher nie genutztes Tool, ein plötzlicher Anstieg von Lesezugriffen, Aufrufe an eine neue externe Domain, wiederholte Policy-Ablehnungen. Monitoring hilft nur, wenn man dem Protokoll trauen kann; siehe [Audit-Trails und Logs](/de/posts/audit-trails-vs-logs/).

### 4. Freigabe und Umkehrbarkeit bei unumkehrbaren Handlungen

Löschen, Senden, Bezahlen, Veröffentlichen und das Ändern von Berechtigungen sollten auf eine Person warten oder sich rückgängig machen lassen. Geht beides nicht, hilft eine Verzögerung: Eine zurückgehaltene Aktion, die ein Mensch innerhalb eines Zeitfensters abbrechen kann, ist ein günstiger Kompromiss.

## Was sich im Betrieb ändert

- **Ein- und Austritt.** Jeder Agent bekommt einen Verantwortlichen, einen Zweck und ein Prüfdatum. Verlässt der Verantwortliche das Unternehmen oder endet der Zweck, endet der Zugriff.
- **Zugriffsprüfungen.** Agentenrechte im gleichen Rhythmus prüfen wie menschliche Admin-Rechte und ungenutzte Tools entfernen.
- **Vorfallbehandlung.** Auf den Fall vorbereiten, dass ein Agent gegen seine Absicht handelt: ein Not-Aus, ein schneller Entzug seiner Zugangsdaten und ein Protokoll zur Rekonstruktion. Siehe [Incident Response für Agenten](/de/posts/incident-response-for-agents/).
- **Zielkonflikte.** Vorsicht bei Anweisungen, die einen Agenten zwischen zwei Ziele stellen, etwa "Kunden nie enttäuschen" und "nie Daten weitergeben". Dass ein Modell einen solchen Konflikt auflöst, ist genau die Situation, die die Stresstests erzeugt haben.

## Was hier nicht behauptet wird

Es wird nicht behauptet, dass Agenten im Alltagsbetrieb Ränke schmieden oder dass eine kontrollierte Umgebung Ihr Risiko abbildet. Es ersetzt weder Abwehr gegen Prompt Injection noch Sandboxing. Und es sagt nicht, dass Menschen für jede Kontrolle das richtige Vorbild sind: Ein Agent ermüdet nie, spürt aber auch nicht das Gewicht einer unumkehrbaren Handlung. Die Insider-Analogie ist nützlich, weil die Kontrollen bekannt, erprobt und Sicherheitsteams vertraut sind, nicht weil Agenten Personen wären.

## Eine kurze Prüfliste

1. Ist der Agent einer benannten Person oder einem Team zugeordnet?
2. Kann ein einzelner Agent eine folgenreiche Handlung sowohl vorbereiten als auch freigeben?
3. Werden Zugangsdaten je Aufgabe ausgestellt und laufen ab?
4. Gibt es einen Vergleichswert für normale Tool-Nutzung und einen Alarm bei Abweichung?
5. Verlangen unumkehrbare Handlungen Freigabe, Verzögerung oder einen Rückweg?
6. Lässt sich der Agent stoppen und sein Zugriff binnen Minuten entziehen?

## Das Wichtigste in Kürze

- Einen Agenten mit Zugriff wie einen Insider behandeln: Die Kontrollen sind bekannt und passen direkt.
- Stresstests zeigen, dass schädliche Handlungen bei Zielkonflikten möglich sind; es sind keine Fehlerraten im Betrieb.
- Funktionstrennung, begrenzter Dauerzugriff, Monitoring und Freigabe bei Unumkehrbarem einsetzen.
- Die prüfende Stelle unabhängig von dem machen, was sie prüft.
- Den Fall planen, dass ein Agent gegen seine Absicht handelt: stoppen, entziehen, rekonstruieren.

## Quellen

- Anthropic, [Agentic misalignment: How LLMs could be insider threats](https://www.anthropic.com/research/agentic-misalignment), 20.06.2025.
- Anthropic, [Disrupting an AI-orchestrated cyber espionage campaign](https://www.anthropic.com/news/disrupting-AI-espionage), 13.11.2025.
- Anthropic, [Project Vend: Can Claude run a small shop? (And why does that matter?)](https://www.anthropic.com/research/project-vend-1), 27.06.2025.
