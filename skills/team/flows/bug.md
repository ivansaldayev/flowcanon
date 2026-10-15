# bug

**When to use:** bug fixes of any size — one-liners to bugs needing investigation. All routing happens INSIDE the flow (below); there is no lighter or heavier bug form, and a bug never switches class to a feature flow — the heavy branch covers architecture-level fixes.

**Participants:** dev-lead (developer sub-agents), review-lead (reviewer sub-agents), architect (investigation + heavy branch); on-call by need/request: sage, scout (light research). Names — registry in `SKILL.md`.

## Entry routing (team lead, by formulation)

A mechanical oracle test — not a complexity judgment: is how-it-SHOULD-be stated in the documentation or the prompt (a clear oracle)?

- **Oracle present** → straight to dev-lead — attempt 1 of the ladder. This direct path needs no owner signal — the oracle criterion routes it.
- **No oracle** → architect investigates → the heavy branch.

## Escalation ladder

The ladder is driven by the owner's own verification — never by confidence numbers.

1. **Attempt 1**: dev-lead implements the fix via developer sub-agents → review-lead code review to convergence → APPROVE — ready, waiting for the owner.
2. The owner verifies the fix in the running app. «Not fixed» → **attempt 2**: rerun via dev-lead → code review → APPROVE → the owner verifies again.
3. «Not fixed» again → **architect investigates** → the heavy branch.

Each attempt terminates at review APPROVE; the ladder spans the owner's verification runs. The owner's «not fixed» verdict re-enters the flow at the next ladder step — the verification itself is never an in-flow gate.

## Heavy branch (self-contained)

1. Architect delivers an investigation report: SEVERAL hypotheses, each with a confidence % (report interface only — nothing routes on the numbers; the team lead relays the report as usual).
2. Architect plans the fix for its recommended hypothesis → plan review to APPROVE.
3. Dev-lead implements → code review to APPROVE — ready, waiting for the owner.
4. «Not fixed» after the heavy branch → back to the architect with the new evidence (repeat from step 1).

## BLOCKED exit

Dev-lead reports BLOCKED (an architecture-level change surfaced) → the team lead re-routes the bug to the architect (heavy branch).

## Gates

Gate semantics (severity, returns, rebuttal, convergence, verdict vocabulary) — [../teammate.md](../teammate.md). Terminal state of every path: review-lead's APPROVE — ready, waiting for the owner; behavior verification is always the owner's own step, outside the flow.

## Watch-outs

- Ground the hypothesis in the actual runtime before theorizing; probe first.
- Owner decisions (shared-component edits, product choices) arrive via AskUserQuestion — explain first, then ask.
- Developers stay dev-lead's sub-agents — never spawn a developer at the team-lead level.
