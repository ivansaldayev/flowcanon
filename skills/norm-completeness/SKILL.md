---
name: norm-completeness
description: Norm-completeness review of a normative document — simulates minimal implementation of every rule and proposes missing counterparts. Invoke only when explicitly referenced by name.
---

# Norm Completeness

The caller's input — where the changes are, or the input file(s) to run on — is where assembly starts; the run is on what it assembles, never on the input unassembled. Handed no input, you have nothing to assemble: stop at «not applicable», its note naming the reason, the files read with their depth, and the missing input in «could not resolve» (open question).

Runs on a normative DOCUMENT as a whole — never on a diff. A document is one logical unit of norm (e.g. «the logging instruction») and may span several files. Normative texts are STANDING norms — they govern every future performance of an operation. What decides is content alone: material is normative when it carries standing rules binding an implementer — requirements violable on their own (the rule test below) — whatever its form, name or location; rule files (a CLAUDE.md section, `codingRules.md`), agent instructions (a prompt / spawn template / agent definition / skill text) and flow rules are examples, not a gate. Where a file mixes rules with description, the document is the norm inside it — such a section is a document of its own — not the whole file.

The scope test takes its verdict from what the assembly finds, never from what the input is. An input that is itself a one-off — a plan, a task, a spec, a one-off prompt — is a seed like any other, and one-off material is never the document; reading the input to find norms is no scope call — the input is your pointer to them. Assembly rules:

- Assemble from the normative files the input touches — modifies, creates, deletes, or itself is.
- A norm the input deletes — its file removed, or its rules cut from a surviving file — cannot be read anew; assemble its survivors instead.
- The pre-deletion text may be consulted as evidence — declare the read; it is not corpus and closes no axis.
- A survivor is a standing file — it carries standing rules of its own — that still references the deleted norm or still consumes it. Reference — the test below, taken from the survivor's side: the survivor's own text requires the implementer to open what was deleted. Consume — the survivor's rules presuppose what the deleted norm mandated: its outputs, its artifacts, or its defined terms.
- No standing file references or consumes it → its survivors are instead the standing files, among what else still binds the same implementer, that govern the operations the deleted norm governed. With the norm dead, that pool is gathered from the instruction set the implementer's environment injects (auto-memory included) and the files the pre-deletion text operationally references. Name the operations from the pre-deletion text — they bound the search; the kept set is taken whole.
- A candidate survivor you cannot confirm → boundary gap in «could not resolve».
- Note alongside the standing norms the input addresses without touching and the rules it merely drafts — they feed outcome 2 (and stay noted in a run).

Then take the first outcome that applies:

1. the assembly finds a standing norm — files carrying standing rules, by whichever rule above → run on what it assembled;
2. it finds a norm only proposed — an untouched standing file the input asks to change or remove, or rules drafted toward a new one → «not applicable», naming that norm (the standing file; the file the draft is to become; or, when the draft names no file, a one-line description of the norm): this skill meets it when the change lands;
3. it finds neither — nothing assembled to run on, nothing proposed → «not applicable»: when the input deleted a norm, the note says the norm was removed and left no survivor; otherwise, nothing here for this skill to check.

Every «not applicable» is reported explicitly — naming its reason, the files read with their depth, and anything you could not resolve (that note is this run's whole closing block) — and stops the run. This skill simulates implementation and is token-expensive.

The target: a norm that says what to forbid or remove but not what must be present — implementers guess toward the prohibition and overshoot. Canonical case: «remove the data from the log entry» — and what the entry must carry is not said. That is the sharpest form; the method sweeps every rule of the document. Gaps only: a contradiction between rules is not this skill's territory — record it in «could not resolve» as a pointer, without analysis.

**Document and corpus.** The implementer is whoever executes the text — a developer following a rule file, an agent executing an instruction. The caller hands you the input — where the changes are, or the input file(s) to run on; the input is a seed, not the boundary. Starting from the normative files it touches, you assemble the document yourself:

- the document's own files are corpus members — read every one of them fully; beyond them, read what else binds the same implementer — the files the norm operationally references (a reference is a file the norm requires the implementer to open; a mention alone is not a reference) and the instruction set the implementer's environment injects (auto-memory included);
- files the corpus marks as mandatory reading are corpus, recursively;
- a file or an injected instruction you suspect is a corpus member — whether a document file or beyond it — but could not confirm → tag it boundary gap in «could not resolve»; a document file you cannot read at all → open question there; its rules stay out of the rules list — the item stands for them;
- anything you cite as corpus must be re-read from its file during this run — an axis is never closed from memory; an injected non-file instruction is declared by quoting its binding fragment instead; when the implementer's injected set is not available to you, name that in «could not resolve» (open question) — never quote your own environment in its place;
- discussion history, author intent and existing implementations are never corpus.

**Declare in the report everything you read assembling the document, executing its procedures, or verifying a proposal, with depth (fully / targeted; an unreadable member is declared as such). Your own tooling — this skill file, the caller's prompt, a Settled / do-not-flag block the caller passes, your own injected environment — is neither declared nor listed, unless it holds corpus membership by the corpus rules above. The declared corpus — members only, defined at the closing block — is the boundary of absence claims: valid exactly over it, at its declared depth, no further.**

A **rule** — one requirement violable on its own (test: a conforming implementation can break it while honoring the rest); declarative text counts only through the requirements it carries. An **axis** — a decision point in the governed operation. A **predicate** — a property the norm asserts or tests about the operation or its result. A delegation written in the corpus («at the executor's discretion») closes an axis — an answer, not a gap.

Method — steps 1–3 collect candidate axes across ALL rules of the document, step 4 verifies; closed-book over the declared corpus:

1. **Polarity.** Every prohibition/removal needs its positive counterpart in the corpus or a written delegation: what must be present instead.
2. **Sketch.** Implement each rule minimally — just enough to conform — from the declared corpus.
   - A procedural rule is sketched by walking its procedure as a simulation: side effects are never performed — a write, send or mutation is recorded as performed, its output assumed as the text declares.
   - Reads the procedure prescribes are not side effects — perform them; declare what they read, with its depth, like any other read — but a simulation read grants no corpus membership and closes no axis: what may answer an axis is governed by the corpus rules above.
   - Keep a **guess journal** — the Sketch record, kept for any document: every time the text forces a guess, record the place (file:line), the decision required, what the text says, and the resolution — invented, or drawn from anything outside the declared corpus. Journaling the invented resolution is the opposite of silent guessing — it is the measurement.
   - A forced guess = a candidate axis.
   - A guess resolved by the caller's assignment rather than the text — the assignment can answer only what it carries: where the changes are, or the input file(s) to run on — is journaled marked DISPATCH, the mark for assignment-resolved guesses: out of the metric, still a candidate axis flowing into steps 3–4.
   - A rule the sketch cannot carry at all is journaled marked FAILED — its candidate axes flow into steps 3–4 like any other.
3. **Axes.** For each operation the rules govern: both polarities of every predicate the norm carries, plus what those predicates make observable in the operation's result (canonical log case: the removal predicate makes content and identification observable — not level).
4. **Verify: materiality.** A delegated axis is closed — skip it. Keep the rest only if the axis lies on the norm's own predicates AND you can name an implementation conforming to the rule under test that goes wrong against the corpus — violates another rule of the declared corpus, or defeats the purpose the norm states or its prohibition implies.

Report — **proposals for addition, not findings: 🟢 by construction, never affecting the verdict.**

- Open by naming the document and the files you assembled into it.
- Each surviving axis becomes a proposal with three parts: the norm line (file:line) whose counterpart is missing or that makes the axis material; what to add; the conforming implementation that goes wrong without it (proof that step 4 ran — an unverified proposal is not reportable).
- Mark each proposal's reach — hits every execution of the operation or some — as a priority hint, not a severity.
- On a clean run state «no proposals» explicitly.

The report ends with ONE closing block:

- the declared corpus — every member: files with depth (fully / targeted — naming what the read covered (e.g. the pattern grepped, the sections or line ranges read) / unreadable — a confirmed member you cannot read), and any injected non-file instruction by its quoted binding fragment;
- reads outside the corpus: any read made in assembly, execution, or proposal verification that carries no corpus membership (e.g. a simulation read, a candidate examined and excluded) — your own tooling aside, per the declaration rule above — is listed alongside with its depth, marked as such: outside the declared corpus and everything quantified over it;
- the rules list — exhaustive over ALL rules of the document, each with its verdict: clean / proposals raised / unresolved / failed — a rule named (file:line) by an item in «could not resolve» is «unresolved», a rule journaled FAILED is «failed», neither is ever «clean»; when several fit, the strongest wins: failed > unresolved > proposals raised > clean;
- the guess journal and the **metric**: forced guesses over rules sketched — report both numbers; FAILED rules stay in the denominator and are counted separately; DISPATCH entries are out of the metric;
- what you could not resolve, each item tagged: contradiction pointer / open question / boundary gap; an item names the norm line (file:line) of each document rule it puts at stake, when there is one — items naming no document rule are corpus-level: they live in this block only and touch no per-rule verdict.
