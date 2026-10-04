---
ref: llm-as-judge-pitfalls
lang: en
title: "LLM as a judge: a useful grader with known biases"
description: "LLM as a judge scales evaluation but has position, verbosity and self-enhancement bias. Which grader to use and how to calibrate a model grader."
date: 2026-06-30T09:00:00Z
tags: [evaluation, quality, explainer]
---

Using an LLM as a judge means asking one model to score the output of another, and it is useful because it
scales where human review does not. It is also biased in documented ways: it can favour the answer in a
certain position, favour longer answers, and favour answers written by itself. The practical rule is to use
the cheapest grader that can actually decide the question, to reserve model graders for judgments that code
cannot make, and to calibrate any model grader against human labels before you trust its scores. This post
explains the three grader types, the known biases and a calibration routine.

## What a grader is

Evaluation needs something that turns an agent's behaviour into a score. Anthropic's guide to agent
evaluations defines it in one sentence:

> A grader is logic that scores some aspect of the agent’s performance.

Source: [Anthropic, Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).
"Logic" is the useful word. A grader can be a few lines of code, a prompt to a model, or a person with a
rubric. The choice should follow from what you are checking, not from what is fashionable. If you are new
to the area, [agent evals 101](/posts/agent-evals-101/) covers the basic vocabulary of tasks, trials and
graders.

## Three grader types

![Code, model and human graders compared, with calibration loop](/images/blog/llm-as-judge-pitfalls-1.svg)

### Code graders

A deterministic check: exact match, a regular expression, a schema validation, a unit test, a query
against the system the agent changed. For agents, the best graders often look at the *outcome in the
environment* rather than at what the agent said. The same Anthropic article gives an example:

> the outcome is whether a reservation exists in the environment’s SQL database.

That check is cheap, instant and exact. It cannot be argued with, and it does not drift.

- **Use when:** the correct result can be stated as a condition on state or output.
- **Limit:** it only measures what you thought to check. Style, helpfulness and reasoning quality are
  mostly out of reach.

### Model graders (LLM as a judge)

A model receives the task, the output and a rubric, and returns a score or a verdict. It can handle open
text, summaries, tone and partial credit, and it can read reasoning that code cannot parse.

- **Use when:** the criterion is semantic and cannot be reduced to a rule.
- **Limit:** it is itself a model, with all the variability and bias that implies.

### Human graders

A person reads and scores. Expensive and slow, but the reference for anything subjective, and the only way
to know whether a model grader is any good.

- **Use when:** you calibrate model graders, evaluate high-stakes outputs, or define what "good" means.
- **Limit:** cost, latency, and disagreement between humans.

A sensible stack: code graders for everything checkable, a model grader for the semantic remainder, and a
small, regular human sample to keep both honest. The tooling does not decide this for you. An open
evaluation framework such as Inspect describes its scope this way:

> Inspect can be used for a broad range of evaluations that measure coding, agentic tasks, reasoning, knowledge, behavior, and multi-modal understanding.

Source: [Inspect, UK AI Security Institute](https://inspect.aisi.org.uk/) (live documentation, quoted as
fetched on 2026-10-04). Such a framework gives you the harness for running graders; the mix of code,
model and human graders is still your design.

## The known biases

The paper that popularised the approach, which compared model judgments with human preferences on
multi-turn questions and chatbot battles, is candid about its limits:

> We examine the usage and limitations of LLM-as-a-judge, including position, verbosity, and self-enhancement biases

Source: [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)
(arXiv, 2023). Those three biases are the ones to design around.

- **Position bias.** In pairwise comparison, the judge prefers the answer shown first (or second) more
  often than it should. Mitigation: run each comparison twice with the order swapped and count only
  consistent verdicts, treating inconsistent ones as ties.
- **Verbosity bias.** Longer answers score higher regardless of quality. Mitigation: state in the rubric
  that length is not a virtue, compare length against score in your data, and consider length-controlled
  comparisons.
- **Self-enhancement bias.** A model tends to rate its own outputs (or those of its own family) more
  favourably, sometimes called self-preference. Mitigation: use a judge from a different model family than
  the generator, or at least a different model than the one under test.

Other effects show up in practice, though they are not covered by the quote: sensitivity to prompt
wording, to the scale used (a ten-point scale invites noise), and to superficial formatting. Treat the
judge prompt as code that needs versioning and tests.

## How to calibrate a model grader

Calibration answers one question: does this grader agree with people often enough, on cases like mine, to
be useful? The routine is short.

1. **Build a labelled set.** Take 50 to 200 real outputs, covering good, bad and borderline cases, and have
   at least two people label them with the same rubric. Where they disagree, resolve it and refine the
   rubric.
2. **Write the rubric as criteria.** Prefer specific, checkable statements ("cites a source for each
   claim") to vague ones ("is high quality"). Use small scales, ideally pass/fail per criterion.
3. **Ask for reasoning before the score.** Having the judge write a short justification first tends to
   make verdicts more consistent and gives you something to audit.
4. **Run the judge on the labelled set.** Measure agreement with humans, using a chance-corrected measure
   such as Cohen's kappa, not only raw percentage. Look at the disagreements; they show which criteria the
   judge misreads.
5. **Test for bias on purpose.** Swap answer order, pad answers with irrelevant text, and compare a
   model's own outputs against others. If scores move when quality has not, you have found a bias.
6. **Pin and monitor.** Record the judge model version and the prompt. Re-run the labelled set whenever
   either changes, and every so often regardless, to catch drift.
7. **Keep humans in a sampling loop.** Review a small random sample of production grades each week, and
   feed disagreements back into the labelled set.

## Using judge scores responsibly

- **Prefer pass/fail per criterion to a single overall score.** It is easier to calibrate and to act on.
- **Report uncertainty.** A score from a judge that agrees with people 80 percent of the time is a signal, not a measurement.
- **Do not gate releases on a single judge number without a human check** until the grader has a track
  record. The [quality gates for agent output](/posts/quality-gates-for-agent-output/) work best with code
  checks as hard gates and model grades as softer signals.
- **Connect it to service levels.** If you commit to a quality target, define it on graders you trust; see
  [SLOs for agents](/posts/slos-for-agents/).
- **Keep the judge away from the generator's secrets.** The judge sees outputs, not credentials or private
  context it does not need.

## Key takeaways

- A grader is just logic that scores behaviour; pick code, model or human by what the question needs.
- Use code graders for anything checkable, especially outcomes in the environment.
- LLM judges are biased by position, verbosity and self-enhancement; swap order, control length and use a
  different model family.
- Calibrate against human labels, with agreement measured, and re-calibrate when the judge or prompt changes.
- Treat judge scores as signals with uncertainty, not as ground truth.

## Sources

- arXiv, [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) (2023).
- Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2026).
- UK AI Security Institute, [Inspect](https://inspect.aisi.org.uk/) (live documentation).
