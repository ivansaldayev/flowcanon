# Common part of tasks — work form, gates, measurement rules

> **This file is not a task.** The place's task lies separately and refers here in its first line.
> Here is what is the same for ANY place of ANY run in the regeneration form: how a round is built,
> what the gates measure with, which claims are accepted, what counts as a norm read, how to object.
> Roles between rounds — `roles.md` next to this file; everything that belongs to a specific run (the place's home entry,
> primary sources, exceptions) lives in its run descriptor and reaches the prompts from there, not from here.
>
> **This file is edited by the owner and the team lead.** The rounds analyst edits THE PLACE'S TASK and only it: the common
> part describes how the run works, not what to do at a specific place, and by nature it is closer to a
> norm than to a task. A divergence of the common part between places is a defect — the file exists
> to make one impossible.
>
> The executor reads BOTH files whole: this one and its place's task. Nothing beyond them is passed to it.

## ⚠ Work form — REGENERATION, not a patch

If review finds a defect, the files with findings will be **rolled back**, the task corrected, and what was rolled back written anew. Nobody will append on top.

Hence the requirement that outweighs all others: **write so that no explaining is needed.** Not «so that it passes review», but so that the code reads as the task, not as the history of its discussion.

## Gates

**The comparison base is always FILE-BASED, by name over every path of the place.** The prompt gives the command with your place's paths verbatim. Without `HEAD` the command takes the index. Give the delta in the report as the same `--numstat` lines, one per path — so review-lead checks it term by term. The file base is mandatory because the tree may hold others' uncommitted items (norm edits by the team lead, run documents): the place's paths are named in the base one by one, and others' changes do not enter the delta. `numstat` is authoritative: `grep -c` over the diff does not count deleted empty lines and diverges from it by exactly one. `git diff HEAD` does not see a new file — its size comes from `wc -l`; the prompt names the command.

**The exit code is read without a pipeline.** `cmd > file 2>&1; echo $?` — then look at the file. Any `| head`, `| tail`, `| grep` in a gate command returns the status of the PIPELINE, not of the check: `tsc … | head` gives `EXIT=0` with non-empty error output, and the green looks plausible. The output is taken by the same rule: first whole into a file, then read as much as needed.

**A gate not shown red is not a gate.** Before accepting a green result, check the gate with a positive control: create the condition it must catch and make sure it turns red. A ban-grep pattern contains the **actual name** of the symbol being checked, not generic words of the same meaning — assembled from generic words, it misses a symbol named otherwise, and the report is honestly green all the same.

**Run the gate command from the project directory or by absolute path — and never via `cd`.** A relative path to a binary from another directory gives `command not found` with code 127, and a targeted linter — «No files were processed»: both forms of failure are easy to mistake for the absence of errors. `npx tsc` from a directory where TypeScript is not installed pulls the decoy package `tsc` from the registry and checks no types. `cd` makes the result of any following command unreliable: only `git -C` and absolute paths.

**Read norms from the WORKING TREE, not via `git show HEAD:`** — by the same rule you take code by. Norm files may diverge from `HEAD` by the owner's uncommitted edits, and a chain taken from `HEAD` arrives without them. Take them with `cat` by absolute path.

## ⚠ Address gate — your first action

**The place's subject is named by NAME** — a function, hook, component, prop, constant, dictionary key — not by a line number. A name survives a rewrite of the place, greps, and breaks loudly: no grep hit — no subject, and that is visible at once. A line number breaks silently: it points to a line that exists and contains something, and the edit goes to the wrong place unnoticed.

**Gate:** grep the name over the contents, make sure there is **one** hit, fill `addressGate` — the pattern, the universe boundary, the hit count, matched or not.

- More than one hit — the name is not enough: name the distinguishing fragment you told them apart by, and say so in one line in `questions`, so the task names the subject more precisely.
- Zero hits — **the subject is not touched**, however much the task asserts.

**Line numbers, if the task gives them, are a landmark and nothing more.** Checking them is not your job; a mismatch between number and name is not a finding. Your own edits shift the lines below them, and within one round a number goes stale twice. In the report name the address taken by **your** grep at the time of sending: a line is an OUTPUT of the measurement, not an input of the task.

**Several edits in one file go by address in DESCENDING order, from the larger number to the smaller.** Then each next edit works at an address the previous ones did not touch. The paired technique: before writing, assert the exact content of the target line and check it — a shift is detected before the edit, not after.

**In a third-party library** there may be no name — then the subject is named by a code fragment plus the version of the installed package. A line number in `node_modules` lives until the first update.

## Rules for claims

- **Absolutes.** «All», «none», «the only», «unreachable», «reaches here» — only together with the exact search pattern and the universe boundary. A completeness claim is stated together with its universe: not «the list is closed», but «N addresses of such-and-such class; such-and-such class is not covered by this measurement».
- **Reachability.** A claim about an executable path must name the entry point and **all** validation between the entry and the address. Reading the address itself confirms the mechanism, not the path; the check «validation exists» does not replace reading what it validates.
- **The measurement universe covers the subject's source**, not a convenient layer: the absence of a branch is a property of the text, the absence of a behavior — a property of execution. A grep over `.ts` does not refute a value born in a native module, in a library or in a server response.
- **The extension filter** in any grep is taken **by the subject's source**: code — `--include=*.ts --include=*.tsx`, a dictionary or config — `--include=*.json`, and so on. The filter is needed because norm files are sometimes laid out next to code, and without it their examples count as call sites; but taken not by the source, it destroys the address gate — at a place whose subject lives in a dictionary, an unconditional `*.ts` gives zero hits for every name and looks normal while doing so.
- **A claim about what the code prints or returns is measured on the real path, not on a bench**, and the report names where exactly it was measured.
- **A bench for measuring semantics** (running node primitives, checking a function's shape on a set of values) is placed **outside the repositories** — in the session scratchpad, its path named in `method` so that review can reproduce it. Such a bench is not a project test: it does not enter the tree and is not added to the project.
- **A correct conclusion from a wrong basis is not a verified conclusion.** When accepting someone else's conclusion, check not only «did the same come out» but also «was it derived from the right basis»: a conclusion reached by the wrong reasoning lives until the first change of circumstances and breaks silently.
- **Removing code whose unreachability is proven does not change observable behavior** — by the definition of unreachability. It may make a neighboring path visible, but not the only one: it was the only one before too.

## Libraries are read from their documentation

**Work with a third-party library starts with its documentation, not with a search for a sample in this project.** A sample in the project shows how it was already done here — including what was done wrong; the documentation shows how the authors intended it. Replicating the sample, you replicate the error too.

**Before relying on the documentation tool (`context7`), check your tool set by measurement and name the result plainly.** Available (`resolve-library-id`, then `query-docs`) — take the documentation from there and name the section in `method`. Unavailable — say so in one line in `method` and narrow the claim to the source you have: the library's official page plus the sources of the INSTALLED version in `node_modules`, with the version and the file named.

This holds especially for libraries with a rich built-in set of techniques (a query client, a state manager): homemade state next to a ready mechanism is not a neutral choice but a debt. If you apply a library technique, name in `method` the documentation section it is taken from.

## Norms

Build the list of directories you touch **mechanically**, and check `CLAUDE.md` in each — including every directory up the chain to the superproject root **inclusive**: each level may carry its own rules for everything below it. Also read what the norms declare mandatory: a project `CLAUDE.md` may require reading a rules file and every rules file of the levels you touch — **of the writer and of the checker alike**.

What counts as read is what was found by the list, not what was remembered.

**Two roles of a norm — do not mix them up.** A norm by which the place **is judged** — the lens checks the code against it. A norm the place **makes false** (its statements about the state of the code stop being true through the place's own work) — is not filed as a finding: the task names such norms one by one within the place's bounds, and the edit goes within the place's bounds in one move. If the task did not name such a norm and you ran into it — one line in `questions`.

**The candidates reading round does not run by default.** `CLAUDE_CANDIDATES.md` is read only when the norm ran out on a specific case or a convergence run is underway. A candidate is neither a norm nor grounds for an action. If you still come across a candidate that fits the case — name it in one line in `questions` and work by the norm. The place's task may say that the candidates reading round runs at this place; the task's silence means it does not.

## Texts that arrive in the task ready-made

A user-facing text passed by the task verbatim is checked by the executor twice and independently: **for style** — against the project's norms on user-facing texts, when they exist, showing the check against each item; **for truth** — at **every** call site this text will serve, reading the conditions for entering the branch, not only the response line. A divergence on the first axis is an objection in `disputed` with the rule the text fails: the tree gets your own corrected text that passes these norms — texts in tasks and entries are sometimes written before the norms. A divergence on the second axis is a vision gap, not an on-the-spot edit: the text is placed as prescribed, the question is raised in `questions`.

## ⚠ Integrity requirement

Where a norm set the form, the runs' delta had no comments; where the decision was left to the hand, the code explained itself instead of being obvious, and two screens turned out to be verbatim copies of each other, comment included. The comments rule: a comment is written only where it cannot be done without — complex code that cannot be simplified; a non-obvious «why»; a «magic» value or algorithm. A comment usually means the code should be simplified, renamed or split, not explained. The project's norm on comments, when it exists, applies on top.

- Do not retell a norm in a comment at the place — the norm lives in its own file.
- If the same failure class is handled somewhere nearby, the form must match **in substance**, not by copying the block.
- In the `integrity` field name: how many lines you added, how many of them are comments, and why **each** comment is necessary.

## Objection mechanism

You consider a task instruction wrong — **dispute** it in the `disputed` field with grounds, rather than carry it out silently or silently do the opposite. An objection does not stop the run: you do what you consider right and name the divergence; review-lead settles the dispute.

In runs of this form almost all correct objections **turned out to be findings against the task, not the code**: the team lead's and the analyst's measurements and readings in the task are the most likely target of a correct objection.

**A prescription of the task not backed by a verbatim quote of the owner with an address — you may dispute it.** The analyst must mark the source of each prescription: either a quote and an address, or an explicit mark «the analyst's reading». Read an unmarked prescription as a reading.

## Two fields for questions — do not mix them up

- **`questions`** — a question for the future: a norm gap, a doubt about adjacent code, anything that does not prevent finishing the work. It does not stop the run; carry the work through to the end.
- **`blocked` + `blockingQuestions`** — only what the work physically cannot be done without an answer to: it is unknown **what** to write, two incompatible norms, no decision on a behavior.

Set `blocked` sparingly: a false `blocked` costs the owner a visit. When you set it, still take the work as far as possible and describe what remains.
