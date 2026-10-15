# feature-standard

**When to use:** features and refactoring WITHOUT ready architect-grade specs. The default form — when in doubt, start here; switching a task CLASS to a lighter form takes the owner's signal. Bugs have their own home — [bug.md](bug.md).

**Participants:** architect, dev-lead (developer sub-agents), review-lead (reviewer sub-agents); by task type — scout (live data). Names — registry in `SKILL.md`; role definitions — agent descriptions.

## Order

1. Architect analyzes, provides scope + requirements + traps
2. Review-lead checks architect's plan
3. If 🔴/🟡 → return to architect → review-lead re-checks. Iterate until none remain (a first-round RETURN is normal, not a failure).
4. Dev-lead implements the approved plan via developer sub-agents
5. Review-lead checks code
6. If 🔴/🟡 → return to dev-lead (fixes via developer sub-agents) → review-lead re-checks. Iterate until none remain.
7. Terminal state: review-lead's APPROVE — the work is ready, waiting for the owner. Behavior verification (in the running app, on live data) is the owner's own step — an approved code review is not a behavior gate.
8. Team lead reports results

## Gates

Gate semantics shared by all flows (severity, returns, rebuttal, convergence, verdict vocabulary) — [../teammate.md](../teammate.md).

## Watch-outs

- Overthinking spiral: the review loop does not stop itself — findings about "problems that will never occur" → escalate to the owner, don't dig deeper.
- Plan polish without empirics: for R&D or uncertain diagnoses, smoke/probe BEFORE polishing the plan.
- Freeze edits during review: changing a file under review produces false verdicts — review a fixed state.
- "DONE ≠ done on disk": the team lead verifies the artifact, not the report.
- External-world blockers (network, an MCP connection, a build or dev server) are unblocked only by the owner — declare an explicit «BLOCKED — waiting for the owner» state and pipeline other work meanwhile; don't fight infra by respawning agents.
