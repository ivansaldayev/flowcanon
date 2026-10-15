---
name: deep-review
description: Review check catalog for plan review, code review, skill review, feature-set review, and flow-fidelity checks. Reviewer sub-agents read their assigned check from checks/ and run it on the reviewed material. Invoke only when explicitly referenced by name.
---

# Deep Review

Catalog of review checks. Each check runs as an independent sub-agent in parallel.

To run one check: read your check file from the table below, then run it on the reviewed material. For code review, first read Project Context (next section) — it says where a check takes project knowledge from.

## Input

$ARGUMENTS

## Checks

| Check | File | Use for |
|---|---|---|
| P1 — Scope Completeness | `checks/P1.md` | plan review |
| P2 — Requirements Quality | `checks/P2.md` | plan review |
| P3 — Traps & Risks | `checks/P3.md` | plan review |
| C1 — State Machine + Runtime Simulation | `checks/C1.md` | code review |
| C2 — Coherence | `checks/C2.md` | code review |
| C3 — Scale Projection | `checks/C3.md` | code review |
| C4 — Linter Gap | `checks/C4.md` | code review |
| C5 — Cross-Project Consistency | `checks/C5.md` | code review |
| C6 — CLAUDE.md Compliance | `checks/C6.md` | code review |
| C7 — Trust Boundaries & Data Exposure | `checks/C7.md` | code review |
| D1 — Decomposition Bug-Class Catalog | `checks/D1.md` | feature-set review (epic decomposition) |
| F1 — Flow Fidelity | `checks/F1.md` | any review with governing decisions |
| S1 — Skill Guidelines Compliance | `checks/S1.md` | skill review |

## Project Context

Checks are written in technology-neutral terms. The project-specific knowledge a check needs is taken from the project at review time, never assumed:

- **Stack, layering, conventions** — the `CLAUDE.md` chain of the changed files (closest first) and the package manifest. Read them before any code check.
- **Library semantics** — what the libraries the changed code relies on actually do, from their docs or source (C1 says which questions to answer).
- **Tooling** — what the project's linter and type check already cover (C4 and the Noise Filter).

Where the project holds none of this in writing, say so in the report; the check still runs on what the code itself shows.

## Output Format (per check)

For each issue found:

- **Where**: file, line or block
- **What**: concrete description, not a generic rule
- **Why it matters**: what will go wrong and under what conditions
- **Severity**: 🔴 will cause bugs, 🟡 will cause pain, 🟢 improvement

If the check finds nothing, state that explicitly.

A finding that prescribes a fix naming a concrete code primitive or a navigation target ("reuse X", "route to Y") is itself a claim: read the named primitive/target first and verify it does what your prescription assumes. An unverified prescription is not reportable.

## Noise Filter

- Do not report style issues, naming preferences, or best-practice violations unless they directly cause a 🔴/🟡 problem. Exception: violations of rules codified in CLAUDE.md files or rule files they mark as mandatory are real findings (C6's territory), not style preferences.
- The project's linter and type check run before review reaches you (the developer's fix/check scripts) — do not report anything they catch. What the linter was deliberately told not to check — rules switched off in its config — is C4's territory and nobody else's. A project with no linter has nothing pre-caught: lint-class findings are reportable there, still under the style rule above.
