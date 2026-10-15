# realization-check (realized-% assessment)

**When to use:** estimating how much of an epic/roadmap is ALREADY realized in the codebase — read-only assessment, zero implementation. Runs standalone, or as the assessment step epic-features references.

**Participants:** N dev-leads (developer sub-agents) — parallel read-only assessors, one per epic group; the team lead slices the groups.

## Order

1. The team lead slices the epics into DISJOINT groups — disjoint groups + read-only access are what make mass teammate parallelism safe here.
2. N dev-leads in parallel, one group each: read-only code research through their developer sub-agents — the dev-lead's normal pipeline, not personal work outside it — and each integrates its epics' realized-% estimates with reasoning.
3. Gate — group swap (a NAMED gatekeeper substitution, owner-approved per the gate invariant: author ≠ gatekeeper at zero extra agents): on completion the dev-leads SWAP groups and sample-verify each other's assessments; disputed estimates are argued to convergence (gate semantics — [../teammate.md](../teammate.md)).
4. Terminal state: the verified report is delivered to the team lead; what happens next (hand to the owner, file it somewhere) is per-prompt — outside the flow.

## Watch-outs

- Read-only means read-only: no fixes or doc edits en route — everything found goes into the report.
- Coordination artifacts live in files/WAL — never relay assessment lists through SendMessage.
