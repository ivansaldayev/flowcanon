# feature-lite (epic feature by ready specs)

**When to use:** a feature whose tasks already exist as ready specs — a plan already accepted by a reviewer, in any form: a plan file on disk, a detailed plan in the prompt (e.g. the product of feature-tasks). No ready specs → feature-standard. This is the "epic → dev-lead per feature → review-lead on the whole feature" scenario.

**Participants:** dev-lead + review-lead (core); architect — ONLY as arbiter of a dev-lead vs review-lead dispute; sage.

## Order

1. Team-lead reads the epic + feature, hands ONE feature to dev-lead.
2. Dev-lead reads the feature + the project docs + project `CLAUDE.md`s and works straight from the specs — the specs ARE the plan: no architect, no plan-review, no plan of the dev-lead's own.
3. Dev-lead implements via developer sub-agents and delivers ONE message when the WHOLE feature is code-complete and checks pass.
4. Review-lead reviews the feature as a whole.
5. 🔴/🟡 → auto-return to dev-lead (fixes via developers) → re-review to convergence. 🟢 — team lead decides. (Gate semantics — [../teammate.md](../teammate.md).)
6. Dispute: dev-lead may contest a finding → architect-arbiter verdict + confidence % → team-lead shows the owner; the owner decides.
7. Docs/design questions unresolved from the project docs → sage researches; found → back to the asker, not found → the owner. Design values are never invented.
8. Terminal state: review-lead's APPROVE — the feature is ready, waiting for the owner; verification in the running app is the owner's own step, outside the team's flow.

## Scaling variant (a stream of units): disposable pairs

For a stream of epics/features by ready specs: a fresh dev-lead+review-lead pair per unit, terminated after the unit's review APPROVE; pipeline — spawn the next pair while the previous shuts down; cross-unit sync via the units' spec files and seam notes, not messages.

## Watch-outs

- Blind spot without an architect: cross-component reuse can pass both dev-lead and review-lead unnoticed; reuse doubts → arbiter.
- Coordination artifacts live in files/WAL — never relay lists through SendMessage.
