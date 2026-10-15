# The `Workflow` tool and the scripts — for whoever edits the scripts

Three scripts sit next to this file: `solo.js` and `streams.js` match in body and differ only in `meta.name` and in the script path inside the example-launch comment; `own-intake.js` — the same body without recon. An edit to the shared body lands in all three; any other divergence of the bodies is a defect, review checks it by diff.

## How the tool works — established by probes, do not re-check

- `opts.agentType` is honored: the agent receives the real role definition from the role's agent file, including preloaded skills (`review-lead` gets the `deep-review` catalog in context). The model and effort from the role's frontmatter beat the session's, there is no inheritance — so the run's lineup is set in the script explicitly, in one `LINEUP` block, and inside a workflow effort is taken only from `opts.effort`.
- There are **no** `Agent`, `Workflow`, `AskUserQuestion` tools — for anyone inside. Asking the owner from inside is impossible; a pause does not exist, the needed behavior is assembled from `blocked` in the schema and a check by the script.
- `SendMessage` is available via `ToolSearch`; the addressee `"main"` is the session that spawned the run; the channel is one-way. MCP tools are raised in two steps: `Skill <the server's skill>`, then `ToolSearch` by the prefix of its tools — verified in practice.
- With a `schema` set the agent must answer via `StructuredOutput`; the script does not read a text answer.
- The script is JavaScript, not TypeScript; `Date.now()`, `Math.random()`, an argumentless `new Date()` throw; there is no filesystem and no Node API — so the descriptor and both absolute paths come as arguments. A prompt is assembled as **an array of strings**, not a template literal: backticks inside a literal break the string, and the parser fails at launch.
- Concurrency — `min(16, CPU−2)` per run; up to 1000 agents in total; one `parallel` up to 4096 elements. One round is about eleven agents, four rounds — up to fifty: that is more than the default «up to 15 agents per workflow», and it is intended.
- Whether **teammates** have `Workflow` depends on how the main session was launched: under tmux they do, in a plain terminal they do not (`echo $TMUX`). The main session always has the tool.
- `cd` moves the session's working directory: it breaks sub-agent spawning, gets `Workflow` refused with a text about a classifier and, worse, silently puts the persisted script into someone else's project directory (`transcript dir` and `script path` in different directories — check in the result of every launch). The prevention — do not use `cd` at all.

## Stops and resumption

- Returning after the owner's answer — the same call with `resumeFromRunId` and `args.ownerAnswer`; the longest unchanged prefix of `agent()` calls is cached, so the descriptor and the other arguments are passed byte-for-byte as before. `resumeFromRunId` works only in the same session.
- The stop condition must be a **clearable flag**, not an inference from a phase result: a cached result carries its questions forever, and a run with the gate «`if (questions.length)`» returns in milliseconds with the same result (`duration_ms` in the tens, `subagent_tokens: 0`). The `ownerAnswer` flag clears stop A, the escalation at intake and the analyst's escalation; stop B (review-lead's blocked) has no resume.
- An empty or strange run result is investigated through `journal.jsonl` in the transcript directory — it holds the actual returns of each agent.

## Other properties

- Place files absent from HEAD are not rolled back by `git checkout HEAD`, which aborts the command with a pathspec error — so new files are declared separately and rolled back with `git clean -f`.
- In the script the prompts do not retell the project's norms (`CLAUDE.md`): sub-agents get the same files as the main session. Two exceptions: the ban on git commands in the header of every prompt, and the comments rule in the subject of judgment — the integrity verdict stands on it.
