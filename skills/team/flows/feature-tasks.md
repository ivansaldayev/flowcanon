# feature-tasks (feature → tasks)

**When to use:** cutting ONE feature into a task set — produces the direct input for feature-lite. The level below epic-features. Zero implementation; dev-lead does NOT participate — its level is the next one.

**Participants:** a FRESH architect + review-lead pair per feature (context hygiene — the owner's explicit design), features of one epic strictly sequentially; scout — code/docs research. The team lead holds the feature's completeness contract (= the feature's scope) and relays owner questions.

## Records

The levels and record invariants of [epic-features.md](epic-features.md) (Records) apply as-is. The feature and epic entries already exist; only tasks — the feature's task set — are written here.

## Order

1. Architect establishes the fact by the code (file:line evidence, scout research in parallel) — not to re-specify the implemented. Research serves UNDERSTANDING only, never problem-hunting; a defect encountered on the way = a one-line tech-debt proposal to the owner, not an investigation.
2. Granularity follows ARCHITECTURAL SEAMS (client / server / sanitize layer / endpoint / UI component), not scenarios — a task need not match one scenario.
3. An entry per task in the feature's task set: title (number + layer/zone); target behavior (project-docs links only); depends-on (the DAG inside the feature + external dependencies); reuse (what existing primitive/pattern to build on); boundaries (what is NOT done here, 1–3 lines); a short DoD at the «functionality works» level. Genre — superficial implementation pointers (Records, Task): HOW to implement is the implementer's question, HOW to verify is the implementer's-reviewer's question; a task body fatter than the feature body = genre broken. Decision provenance: owner rulings and team-lead ratifications are labeled («(owner YYYY-MM-DD)» / «(team lead)»); unlabeled statements are the decomposition author's own decisions — the default authorship.
4. Contracts are fixed BEFORE code: architect sets inter-task interfaces upfront (signatures, shared predicates, payload shapes); epic-wide conventions (error format, pagination, id/date formats) bind all tasks; a contract crossing the feature/epic boundary is a separate entry + a dependency.
5. DAG parallelism is marked (T2 ∥ T3) as a plan for FUTURE execution — no agents are spawned here; file-disjoint waves are the next level's (dev-lead's) concern.
6. Review-lead — the decomposition predicate is CLOSED, four questions only: (1) set completeness — every unit of the feature's scope covered by a task or an explicit external dependency; (2) the DAG is correct; (3) reuse pointers are real — the named primitive/pattern exists and fits; (4) no scope leaks — nothing beyond the feature's functionality, genre per Records. Findings about pre-existing code = a one-line tech-debt proposal to the owner, never a RETURN driver. Findings — against the entries, by name.
7. Convergence loop (gate semantics — [../teammate.md](../teammate.md)). Owner questions — the answer is obtained before proceeding. After a RETURN's fixes land, the re-review is ONE full pool of fresh subs over the live artifact — with the closed predicate the pool IS the delta; no separate delta + terminal stages at this level.
8. Closing note on the feature entry (architect): the resulting vision + the decisions the vision did not cover.
9. Terminal state: the feature's tasks at review APPROVE with their dependencies (parent, DAG, external) — the feature-lite input is ready, waiting for the owner. The pair terminates; the next feature gets a fresh pair.

## Watch-outs

- A cross-feature dependency points to the CONCRETE task of the other feature; a cross-epic one — to the epic, while that side is not yet decomposed. The already-set feature/epic order propagates onto the task DAG.
- Not to be confused with execution ([feature-lite.md](feature-lite.md)) or the level above ([epic-features.md](epic-features.md)).
- Heavy review machinery — deep-review catalog runs over task bodies, multi-lens terminal pools reading the codebase — belongs to implementation-stage review (and a future code-audit flow), not to decomposition.
