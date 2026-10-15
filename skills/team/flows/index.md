# Team flows — index

Canon of proven team forms. The flowmaker (see [../flowmaker.md](../flowmaker.md)) picks 1–2 nearest by when-to-use and reads the finalists in full; the team lead reads the chosen flow in full. Gate semantics shared by all flows (severity, returns, rebuttal) live in [../teammate.md](../teammate.md). An independent gate (author ≠ gatekeeper; review-lead by default, substitutions only owner-approved) exists in EVERY flow — forms scale plan depth, roles, and the gatekeeper, never the gate itself; switching a task class to a lighter form is the owner's call. (Mirrors the invariants in flowmaker.md — a conscious duplicate for the team-lead's reading path.)

- **feature-standard** — features and refactoring WITHOUT ready specs; full plan → review → code → review cycle. Default when in doubt.
- **feature-lite** — an epic feature with READY architect-grade specs (a plan file or a detailed plan in the prompt); dev-lead works straight from the specs (the specs are the plan), whole-feature review, architect on-call as arbiter.
- **bug** — bug fixes of any size; the team lead routes INSIDE the flow by a mechanical oracle test; escalation ladder driven by the owner's verification; self-contained heavy branch.
- **docs** — documentation work: docs-standard (architect plan → sage owns and applies) and docs-edit (sage edits → text-quality review); terminal APPROVE.
- **epic-list** — composing the epic list from vision sources; sage + review-lead.
- **epic-features** — cutting one epic into a feature set; architect + review-lead (+scout); the input feature-tasks consumes.
- **feature-tasks** — cutting one feature into a task set; a fresh architect+review-lead pair per feature; the input feature-lite consumes.
- **realization-check** — realized-% assessment of epics over the codebase: N read-only dev-leads over disjoint groups; group-swap cross-check gate; report to the team lead.
- **sage-pool** — mass docs production/verification over disjoint zones: domain sage teammates fan out with own sub-agents; gate = verify pass + owner decision package.
- **workflow-solo** — places (one home entry = one place) fixed or built by regeneration through the Workflow tool: the team lead runs the script one place at a time, investigation inside the run, stops handled by the team lead.
- **workflow-streams** — the same regeneration at scale, in two sessions: a planning session recons the whole pool and cuts it into disjoint streams, each inside ONE submodule, recorded in a WAL; a run session raises one teammate runner per stream in its own worktree; the team lead never opens a place; the owner answers stops in the teammates' chats; work touching several submodules only with justification to the owner; requires tmux.
- **workflow-own-intake** — the same regeneration where the team lead investigates the place himself, presents the vision to the owner and settles decisions before code, then runs the script without intake.
