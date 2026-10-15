# Teammate norms

Shared norms for a teammate or a team sub-agent — a mandatory read at spawn (routed here by [SKILL.md](SKILL.md)): how review gates work, how to escalate honestly, how to address sub-agent replies, and the working discipline for facts, fixes, and cross-owner seams.

## Gate semantics (shared by ALL flows)

- 🔴 RED / 🟡 YELLOW — auto-return to the artifact's current owner; 🟢 GREEN — the team lead decides; an accepted 🟢 returns to the artifact's current owner as a changed assignment.
- Return goes to the artifact's CURRENT owner, one step back. Plan review → architect, code review → dev-lead, text audit → the document's author — typical cases, not the rule: when ownership has moved (e.g. a terminated author's artifact adopted by another agent), the CURRENT owner receives the return.
- Right of rebuttal: whoever receives a review report MAY dispute any finding with arguments instead of applying it blindly; the team lead restates this right when relaying a report. Unresolved disagreement → escalate to the owner.
- Write-lock: while a review round is in flight, the artifact under review is frozen — fixes are batched and applied between rounds, never mid-pool, so every reviewer of the round sees the same artifact. Reporting the assignment done ends it — after that, no edits until a new or changed assignment hands the artifact back. A fix that cannot wait is a blocker — escalate it (Honesty & Escalation) instead of writing; other assignments continue. What the terminal APPROVE approved is what ships — a later edit re-enters review.
- Loops run to genuine convergence: don't economize rounds, never pre-declare a round "final"; the only pathology is the same finding circling — argued rebuttal is the anti-loop.
- Verdict vocabulary: RETURN / APPROVE with 🔴🟡🟢 severities.

## Sub-agent replies

Give every sub-agent you spawn an explicit return address: «reply as your final text» or a SendMessage addressee named in the prompt (usually you). Without one, a background sub-agent's report routes to "main" — the session lead — not to you. Name a SendMessage addressee when you want mid-run signals from it (a gate ack, a count line): «reply as your final text» carries none. Everything you spawn is an unnamed sub-agent — named spawns (teammates) are the team lead's alone. Two traps of being a NAMED spawn (a teammate): your final text is delivered to no one — report via SendMessage; and with no SendMessage among your tools you can hear but never reply — write to the file drop-point given in your prompt.

Before every batch spawn, tell your requester (for teammates — the team lead) how many background agents you are about to raise — the count disambiguates idle notifications.

## Fact discipline

A claim does not become verified by sounding plausible, by arriving with the authority of a gate role, by riding inside an approved decision, or by surviving many rounds. Before a claim becomes load-bearing — before it enters a decision, an edit to an artifact, a batch you freeze, or a package you hand onward — read it from its primary source, and read it again whenever it becomes load-bearing anew. What counts as the primary source depends on the kind of claim:

- **about code** — the code itself: not a summary, not a task entry, not another agent's report.
- **about design** — for what is actually on the screen (an element's presence, its icon, its geometry) the most granular screen-level description in the project docs decides — not data or summary docs — because a summary can present a hidden layer of the design as if it were rendered.
- **about an owner decision** — the record itself, verbatim, not a retelling of it, and not the record stretched onto content it does not cover.
- **about someone else's work** — that work's own source. This is a rule of attribution, not a ban on delegation: read first-hand what your conclusion hinges on, and say plainly which parts came from their reports.

Alongside, four habits that make the rule operational: a load-bearing fact carries two signatures — author and reviewer each read the source themselves, neither inherits the other's reading. An absolute ("exactly N", "the only", "does not exist") states the date and method of its check; without a method it reads as a completed exhaustive check and goes stale silently. When a finding travels through a summary — a WAL, an owner package, a prompt — its load-bearing formulation travels verbatim, because a compressed paraphrase can invert it. And a signature is given for the USE, not for the declaration: when a claim names a constant, a flag or a list, grep it and read every consumer — a mechanism inferred from correct facts can still fail at one of them.

## Fix propagation

- A fix counts as applied only when every surface of the artifact it touches is walked and the sibling task is checked. Editing one paragraph is half a fix.
- Three companion rules: a moved obligation updates its receiver in the same pass; a new surface is diffed back against the body clause it implements (check it didn't narrow an allowed choice); two fixes touching adjacent lines are verified together, after both.

## Cross-owner seams

- An edit that moves an obligation between entries of different owners is applied by ONE side only, after the other side's explicit confirmation — parallel application is forbidden: both polite versions are equally plausible and differ only in write order.
- Never assert the content of another owner's body in your edit — reference it, don't describe it; such assertions go stale the moment they are written.
- The freeze (Write-lock above) precedes the review dump; an edit after the dump invalidates the dump.

## Honesty & Escalation

**NEVER fabricate data.** If a tool fails, MCP is unavailable, a file can't be read, or any other problem prevents you from getting real data — say so immediately. Do NOT guess, approximate, invent values, or use cached/remembered data from previous reads.

Escalate to your requester — whoever handed you the current assignment; the team lead escalates to the owner. Escalate when:

- MCP tools fail to load, return errors, or lose their connection
- Sub-agent returns unexpected or empty results
- You are unsure about data accuracy
- Any blocker prevents completing the task

Format: **"BLOCKED: [what failed] — [what I need to continue]"**
