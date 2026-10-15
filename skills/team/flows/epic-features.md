# epic-features (epic → features)

**When to use:** cutting ONE epic into a feature set — produces the input feature-tasks consumes. Zero implementation. The epic list itself — [epic-list.md](epic-list.md); realized-% assessment, when the run includes it — [realization-check.md](realization-check.md).

**Participants:** architect (author — researches and cuts), review-lead (reviewer sub-agents), scout (code/docs research). The team lead holds the epic's completeness contract (= the epic's scope and source load list) and relays owner questions.

## Records

The decomposition levels and their records — shared by epic-list, epic-features and feature-tasks:

- **Epic** — the global functionality to build: WHAT must be done, bounded by its own scope; work on one epic never expands into another's. Cross-epic dependencies — functionality without which this epic cannot be built — are recorded as dependencies on the other epics.
- **Feature** — a small completed piece of an epic that a build can demo after implementation. Production functionality with its architectural details: contracts between its tasks live in the feature, tasks reference them. No implementation details.
- **Task** — the unit for one implementing agent: what to build, what to reuse, boundaries, a short DoD at the «functionality works» level. HOW to implement is the implementer's question, HOW to verify is the implementer's-reviewer's — neither belongs to decomposition. Genre guard: a task fatter than its parent feature means the genre is broken.
- **One record per run** — the epic list, the epic's feature set, the feature's task set — is the single autonomous source of truth: entries, findings, decisions, and dependencies live there; no authoritative duplicate; coordination goes through the record, never through SendMessage relays.
- **Entry autonomy** — an entry's text links ONLY to the project docs — never to code (file:line), WALs, or other files.
- **Scope** — decomposition is architecture at maximum: effort goes to how the new functionality lands on what exists with the least change to it, and how the parts stitch together. Code research serves UNDERSTANDING only — never problem-hunting: a defect met on the way = a one-line tech-debt proposal to the owner, not an investigation; stubs and preparation for future features are not tech debt.
- The project docs are the frozen design target; the code is the current fact. Docs coverage is uneven — where the docs are silent (server/runtime is the regular case), the question goes to the owner, and the answer is obtained before the feature is specified.
- The epic entries already exist — never created or edited here.

## Granularity (standing rule)

- **A feature = one unit of functionality.** Features are never cut by project: one feature legitimately carries edits across several projects; a `<name>-server` / `<name>-client` split is a granularity error, not a decomposition choice.
- **A pipeline is one functionality**: its stages (e.g. submit → moderation → result delivery) live inside one feature, not as separate features — consolidation over stage-splitting.
- **Gating on a status is its own functionality** — cut as its own feature, distinct from the pipeline that produces the status (a gate spans its consumers' surfaces, not the producer).

## Order

1. Architect establishes the fact by the code (file:line evidence, scout research in parallel) against the project docs, and writes feature entries ONLY for the unimplemented remainder — the docs↔code gap IS the work. All file:line evidence is collected in ONE evidence file of the run (working notes, e.g. `notes-code-fact.md`) — it lives there and only there, never in entry text; review verifies claims against it. Parent = the epic; description: what / scope (client/server/both, net-new vs reuse) / the scenarios it covers — with project-docs links only. The fact/mechanics is stated ONCE, in the what — other sections reference it, never restate it, so a review fix lands in one place instead of drifting across mirrors. A cross-epic obligation is a separate entry + a dependency, never prose «→ there» — and only onto a living target: the target's status is checked at transfer time; a canceled or nonexistent target is a coverage hole, re-homed via an owner question.
2. Traceability lives in the record: «already implemented (excluded from features)» and «moved to another epic» — with reasons, so the omitted stays distinguishable from the lost. Architect separates its own judgments from the owner's decisions and review findings.
3. Review-lead — two axes: each feature as a document (clear, scope honest — nothing net-new that already exists in code; autonomous, project-docs-only links; granularity per the rule above) and set completeness — every unit of the epic's load is covered by a feature / listed as implemented / explicitly moved; anything in no bucket is a coverage hole, orphan pieces included — plus dependency sanity. The decomposition bug-class catalog (deep-review check D1) runs against the full set every review round. Findings — against the entries, by name.
4. Convergence loop (gate semantics — [../teammate.md](../teammate.md)). Owner questions — the answer is obtained before proceeding.
5. Dependencies: each feature → its epic (parent); dependencies between features (implementation order), propagating the existing inter-epic order.
6. Terminal state: every feature entry of the epic at review APPROVE with its dependencies — the decomposition is ready, waiting for the owner.

## Watch-outs

- The epic entry may lag reality. Staleness signs — a bare counter, an unexpanded ID, addenda layers, a decision known from elsewhere but absent from the entry — go to the owner as a question, never silently built to the letter.
- The code is an instrument for establishing fact — never content of an entry.
- Not to be confused with the levels around it: the epic list above ([epic-list.md](epic-list.md)), feature → tasks below ([feature-tasks.md](feature-tasks.md)).
