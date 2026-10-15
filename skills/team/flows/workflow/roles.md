# Roles inside a run

Read by the agents the script raises between rounds: the intake analyst and the rounds analyst. The executor, the lenses and review-lead read `common.md` and the place's task — they do not need this file. The team lead reads the «Intake analyst» section when taking the investigation upon itself.

## Place and edit radius

A place is the subject of one decision. Its bounds are set by the edit radius, not by the file and not by the repository:

- while the edit stays on a path owned by this place alone (its own file, its own hook with a single consumer, its own screen), the case is **local**, even if there are two halves and two repositories;
- as soon as the edit enters code owned by someone else (a shared query client, a hook of several screens, a shared contract), the place is **systemic** — escalation at intake, no task is written;
- an instance of a systemic class does not by itself make the place systemic: at zero radius it is local, however many places of the same class live in other files;
- consumers are read only when behavior changes — a contract, a status, a body shape, a key, the set of response branches. Adding a log does not change behavior: the response half need not be investigated;
- the number of consumers is a measurement with a pattern and a universe boundary, not an impression.

A place that changes a status or a body shape must carry its call sites: a screen branching on the status goes silent when it changes; a screen reading a body field fires and lies when the shape changes. A place across the project boundary — one hand for both halves, if the contract changes and the client reads it; the order within the hand — producer, then consumer; the client half is written against the server's actual response after the edit. The emptiness of the client half is proven by three universes: calls of the helper that shows server text; branching on a bare status; reading of the body shape. The third matters more than the others.

A file shared by several places (a dictionary, a registry, an enumeration): the place stays the home of the decision — which entry and on what basis — while the write into such a file is done in one move paired with its consumer: break them apart and a reference to a missing entry silently degrades to a default.

## Intake analyst

There is no ready-made draft: the analyst assembles the vision itself from the descriptor's primary sources, the common part, the project's records (the place's home entry and the class's home entry found by its own search — whole, with all addenda; all candidates whole, not summaries) and the project's screen docs, if the descriptor names them. It answers three questions: **what is actually wrong** (the symptom in the source versus the defect — a live example: «no `await`» turned out to be a swallowed startup error, and the place became two entries); **local or systemic** by radius — consumers are searched only in a checked-out repository: if the measurement needs a descriptor repository absent from the tree, the radius is not measurable, and that is an escalation with reason `unmeasurable`, not a zero radius; **what the design requires**. It declares the place's files as a complete and minimal list, separately naming those absent from HEAD: gates, delta and rollback are built from the list; a file beyond the list is a stop of the run, not a finding.

**The place's task must carry:** the subject by symbol names with the grep hit count; what is there now — an excerpt from HEAD with the command that took it; what should result — as a positive prescription, never a ban; what to watch for in implementation — the understanding gained by the investigation, which would otherwise die with the analyst; the bounds — what we do not do and why, including by name the norms the place makes false. **Each prescription is marked with its source:** a verbatim quote of the owner with an address, or the mark «the analyst's reading, not an owner decision, open to dispute»; an unmarked reading is a forgery of grounds, even a correct one. A decision younger than a day or still under discussion is cited by address, not by text. A prescription relies only on the tools of the executor role: a step requiring a tool the role lacks (for example, a database) is addressed to whoever has it and reaches the executor as a fact with the name of who measured it — or goes as a question to the owner before the start. The analyst does not edit the norms and the common part — it puts candidates into `normCandidates`.

## Three destinations of a finding

| Finding | Where it goes |
|---|---|
| a decision class living outside the place | `normFixes` — a candidate for a norm or for the owner decisions (the analysts call the same field `normCandidates`) |
| a particular of this place | `promptFixes` — into the task, as a positive prescription |
| correct, but out of scope | `recordItems` — its own home entry (the rounds analyst's `recordCandidates`) |

A finding that fits two rows goes by the upper one. A finding goes as a prescription, not a ban: a list of exceptions does not replace a positive basis.

## Rounds analyst

The task lives in a file, not as a string in the script: an agent cannot change a string, it can change a file. The next round's executor reads the already corrected task; only the final one goes up. After RETURN the analyst reads the task, the registry of all rounds, the verdict and the history; **compares decision classes**, not addresses — rolled-back code is written anew each round.

**A contradiction** (a finding requires the opposite of what the previous round prescribed for the same class) is an escalation, and escalation is not failure: neither the norm, nor the owner decisions, nor the task answer the question the code asks; until the gap is closed, any round is right and any next one will overturn it. Papering over a contradiction with a task edit is the worst thing possible: the oscillation goes on, and its cause hides. It also escalates if a decision class is covered neither by a norm nor by the owner decisions, or the cure goes beyond the place's bounds. It may escalate on these grounds even in round 1; the motive «the task is weak, and I am forbidden to edit it» is not grounds.

Otherwise — `REWRITE`: it edits **only the task**, by positive prescription, each with a source; appends to the registry (what it changed and on what basis — without the record the next analyst goes blind); rolls back **only the files with findings**: a particular finding rolls back its own file, an architectural one (changes a contract between the place's files — a signature, a data shape, the layout across modules) — all files producing and consuming that contract; a file without findings passed the round's review and stays, the executor does not rewrite it. Findings in all files give a full rollback. The analyst does not touch others' paths: uncommitted norm edits and run documents in the tree are not subject to rollback.

**A premise dispute** (review-lead's `premiseDispute`: there is no defect at the named place, or it is an instance of a systemic mechanism) is not a dispute about precision: precision is fixed by the rounds analyst through `promptFixes`, the premise is revisited by whoever wrote the task. In a run with recon the premise is revisited by the intake analyst, raised anew: if it wrote a new task, the place is rolled back entirely and the rounds go anew from the first; if it escalated, the run stops, the round's edits stay in the tree until the owner's answer, after the answer the analyst is raised once more, and the rollback follows the new task.

**Ceiling** — the analyst works truncated: registry and rollback, it does not edit the task; the decision to continue is the owner's.

**The same symptom from the other side:** mass agreement of the lenses on a false finding diagnoses a gap in the source just as a contradiction between rounds does. Review-lead must open the source, not accept the agreement.

## Stops for the owner

Point A (the executor's question) — a stop before review, point B (review-lead's question) — a stop after consolidation. The stop gate is **only `blocked`**, never `questions`: a question for the future goes up together with the verdict and does not hold the run. The owner's answer is recorded in the place's home entry with a date before resumption: without the record neither the executor nor review can verify it against the primary source.
