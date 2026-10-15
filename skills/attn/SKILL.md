---
name: attn
description: Audit text for problems that hurt comprehension or action — conflicts, ambiguity, gaps, duplicates, priorities, order, noise, bloat. For any text: plans, skills, docs, etc.
---

Audit the source below. Each lens points your attention at a class of problem; use judgment, these are not rigid checklists.

$ARGUMENTS

## Lenses

**Conflicts** — parts that fight each other: contradictory rules, inconsistent definitions, steps that cannot both be followed, examples that violate what they illustrate, tone that clashes with intent. A declared exception or precedence is not a conflict.

**Ambiguity** — where a reader must guess: vague terms, fuzzy thresholds, undefined scope, unclear referents, rules that do not say when they apply, decisions punted back without criteria.

**Gaps** — what the text needs but never provides, judged from the text alone: a case in an enumerated set left unhandled, a term used but never defined, a reference to a section or item that does not exist, an input no step produces. Domain completeness beyond the text is out of scope.

**Duplicates** — content stated more than once without adding anything new: repeated rule, restated definition, example echoing prose, overlapping items with different labels.

**Priorities** — unequal items presented as equal: no ranking, severity, or required/optional markers where importance differs. Flat lists of unequal items count.

**Order** — content sequenced against the reader's needs: terms used before they are defined, exceptions or stop conditions placed after the action they modify, steps out of dependency order.

**Noise** — content removable without loss: motivational framing, restated goals, decorative metaphors, boilerplate preambles, examples illustrating nothing new, formatting without information.

**Bloat** — beyond specific noise, text longer than it needs to be: verbose prose, redundant structure, over-explained points, tables where a sentence would do.

## Output

Do not edit the source.

If the source is only a few sentences, skip the per-lens structure: report findings directly, then the verdict.

Otherwise, for each lens: quote the text and explain, or write "clean". Include the section or line when the source has them. If a problem is diffuse, describe the pattern with 2–3 examples instead of one quote. Report each finding once, under whichever lens fits best.

Mark any finding that meets the revise bar.

End with: `**Verdict:** clean | minor | revise`

- **clean** — no findings worth reporting
- **minor** — findings exist, but none meets the revise bar
- **revise** — at least one finding likely to cause misinterpretation, wrong action, or serious attention drain — or an accumulation of minor findings with the same effect
