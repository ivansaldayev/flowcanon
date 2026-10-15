# docs (documentation work)

**When to use:** producing or editing documentation — data-schema docs, the project docs, skills, prompts, plans-as-text. No dev-lead: sage executes. Two weight profiles below; pick by whether a new plan is needed.

**Participants:** sage (executor / plan owner), review-lead; architect — plan phase of profile A only. No code gates; the terminal gate is the apply/audit APPROVE (vocabulary — [../teammate.md](../teammate.md)).

## Profile A — docs-standard (multi-step production with apply)

1. Architect writes the plan (one-shot) and terminates — from here sage OWNS the plan and applies review returns himself.
2. Plan-review loop to convergence (honestly — not ritually).
3. Sage applies.
4. Apply-review → fixes → terminal APPROVE.

Returns always go to the CURRENT plan owner (sage), not the terminated architect.

## Profile B — docs-edit (direct edit of existing texts)

1. Sage reads the target files + reality sources himself (no retellings) and edits. `.claude/**` edits require explicit permission per file (explain → ask).
2. Review-lead reviews the edits as documentation — a text-quality audit against the governing decisions (WAL/owner rulings); the review request carries the settled owner decisions (a «Settled — do NOT flag» list); iterations to convergence.
3. Author's right of rebuttal as usual; the team lead only relays and escalates. (Gate semantics — [../teammate.md](../teammate.md).)

## Watch-outs

- Plan-file lifecycle operations (rename/merge/delete) mid-review cause BLOCKED chaos — freeze plan files while a review runs.
- Batch doc generation → a mandatory post-batch audit (writers do not reliably self-correct).
