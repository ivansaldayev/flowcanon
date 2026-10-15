# epic-list (vision → epic list)

**When to use:** turning the product vision sources (roadmap, backlog, the project docs) into the epic list — the level above epic-features. Epics only: no feature or task breakdown, zero implementation.

**Participants:** sage (composer), review-lead (reviewer sub-agents); the team lead relays owner questions.

## Order

1. Sage composes the epic list — the run's record (levels and record invariants — [epic-features.md](epic-features.md), Records): an entry per epic — scope and boundaries, text links only to the project docs — plus inter-epic dependencies (what cannot start before what).
2. Review-lead checks: completeness against the named vision sources, epic boundaries (no overlaps, no orphan load), dependency sanity. Findings — against the entries, by name.
3. Convergence loop (gate semantics — [../teammate.md](../teammate.md)). Product forks (what is an epic, what is out of scope) go to the owner — the answer is obtained before proceeding.
4. Terminal state: every epic entry at review APPROVE with its dependencies — the epic list is ready, waiting for the owner.

## Watch-outs

- The record is the single source of truth — no authoritative duplicate (roadmap-style files are history, not coordination); never relay lists through SendMessage.
- Not to be confused with the level below: cutting an epic into features — [epic-features.md](epic-features.md).
