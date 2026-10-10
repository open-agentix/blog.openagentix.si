# Topic backlog

Input of the [blog-writer agent](../agents/blog-writer.md). Titles and notes only: no drafts, no
claims. The agent takes the **first row with status `idea`** (top to bottom), so the order is the
priority. Edit freely in a normal pull request.

Status: `idea` (not started), `in-review` (draft pull request open), `published` (merged and live),
`dropped` (will not be written). The agent sets `in-review` and fills `ref`; a maintainer sets
`published` or `dropped`.

| ID | Status | Ref | Working title | Notes for the research step |
| --- | --- | --- | --- | --- |
| T-001 | published | open-source-tools-around-claude-code | Five open tools around Claude Code | Harness vs. router vs. UI vs. runtime; licences from the repositories |
| T-002 | published | playbooks-for-agentic-work | What a playbook is for | Deterministic steps, skills, runbooks, checks |
| T-003 | published | model-drift-in-agents | Detecting and handling model drift in agents | Golden runs, run metrics, pinning, canary, rollback |
| T-004 | published | classifier-models-and-autonomy-levels | Does a classifier model always make sense, and how autonomous may an agent be? | Routing and policy, misclassification, human in the loop, autonomy levels |
| T-005 | idea | | Hands-on: an agent with a local LLM | Local runtimes (Ollama docs), what a small model can and cannot do, cost and privacy. Only describe runs that exist in the repositories; no invented numbers |
| T-006 | idea | | Ten to twenty agent skills worth having | Topics only, in our own words. Inspired by public skill catalogues whose licence is unclear or absent: do not reuse their text, name them only if their terms allow it. Candidates: evidence research, skill authoring, reviewing third-party skills, permission review, MCP integration checklist, token budget review, context hygiene |
| T-007 | idea | | Git guardrails for coding agents | Own branch prefix, draft pull requests only, signed commits, secret and dependency scan before the pull request; GitHub documentation on branch protection and rulesets |
| T-008 | idea | | Invisible characters in agent input | Hidden Unicode in issue text and tool results as an injection route; OWASP LLM guidance, Unicode standard on tag and format characters; a deterministic filter and its limits |
| T-009 | idea | | Tracing agent runs with OpenTelemetry | GenAI semantic conventions (status: check at research time), one span per step and tool call, policy decisions and cost as attributes |
| T-010 | idea | | Stateful policy conditions: "at most N", "A before B" | Why per-call rules are not enough; examples from vendor policy documentation; what openagentix has built vs. planned |
| T-011 | idea | | Running agents behind an LLM gateway | Gateway as upstream of a model proxy; what stays the platform's job (budgets, audit, grants); vendor docs only |
| T-012 | idea | | Budgets that bite: per day, per token, per use case | Budget windows, clear errors, reservations; compare documented behaviour of providers' spend limits |
| T-013 | idea | | Replaying an agent run: what is deterministic and what is not | Replay for debugging, what an audit chain can reproduce, role of a simulated provider |
| T-014 | idea | | Vetting a plugin before an agent may use it | Static review, pinned versions, provenance file, isolated trial run; relation to the existing supply-chain posts |
| T-015 | idea | | A free model for homelabs: what you give up | Free hosted tiers and local models, terms and data handling read from the providers' own pages; opinion piece |
| T-016 | idea | | Case study: what one bug-fix run costs | Needs real run data (cost, steps, audit) from the dogfooding setup; do not start without it |
| T-017 | idea | | Registry and review status for MCP servers and agent templates | Catalogue governance, who may add what; MCP registry documentation |
