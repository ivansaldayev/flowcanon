---
name: wal
description: Saves, restores, and archives session continuation state (WAL — write-ahead log) for multi-session tasks. Use when a session ends with active work, when continuing previous work, when tracked work completes, or when the user mentions a WAL.
argument-hint: "write [name] | read [name] | done [name] | list (default)"
---

# WAL (Write-Ahead Log)

## Operations

- **No arguments** (or `list`) — list active WALs; if the session is ending with unfinished work, follow up with **write**
- **write \<name\>** — create or update a WAL; if no name is given, first check active WALs for one covering the same task and reuse its exact name (spelling may differ from what you would derive), otherwise derive a short kebab-case name from the task. A given name that is not a short filename-style token — normalize to kebab-case and mention the change.
- **read \<name\>** — restore a WAL
- **done \<name\>** — archive a WAL
- Unknown arguments, or **read**/**done** without a name — say so, then run **list**. A missing `<name>.md` is handled inside each operation: **write** creates, **read** and **done** have their own missing-file steps.
- For **write**, **read**, and **done** — whether the name was given, reused, or derived: a target `<name>.md` that exists but has no `session` key in frontmatter is not a WAL (a plan, brief, companion, or legacy frontmatter-less file) — say so and stop; do not modify, reformat, or archive it without explicit user confirmation. If the colliding name was derived (not user-given), pick a non-colliding variant instead and mention it.

Arguments: $ARGUMENTS

## Session Tracking (on every write and read of an active WAL)

The current session ID is injected at session start as `session_id: <id>` in context (the plugin's SessionStart hook; covers startup/resume/clear/compact). Fallback: `echo $CLAUDE_CODE_SESSION_ID`. Never invent an ID — a fabricated ID corrupts the continuation chain; if none is available, keep `session`/`session-history` unchanged (on a new WAL, write `session: unknown`) and say so.

1. If frontmatter `session` exists and differs from the current session ID — append it to `session-history` (create the key if absent; skip if already listed; never append `unknown`)
2. Set `session` to the current session ID

## Archive Lookup (shared by write, read, done)

A name counts as archived if `ai/current/archive/` has `<name>.md`, a date-suffixed `<name>_YYYY-MM-DD.md` (a trailing numeric suffix allowed), a subdirectory named `<name>` (a tree match), or `<name>.md` directly inside one of its immediate subdirectories. Whole session/working trees are archived as-is — files deeper inside them are stage artifacts, not WALs.

## write

Before creating or updating, check the target:

- exists and its WAL covers a different task — say so and confirm before updating
- does not exist and the name was given (the unnamed path already checked at dispatch): check active WALs for one already covering the task — if found, update it instead and mention the name mismatch
- does not exist and the Archive Lookup finds the name: mention the archived version before creating anew

Create or update `ai/current/<name>.md`. Apply Session Tracking; set `date` to today (`date` = date of last write).

### WAL Format

```markdown
---
session: <current session id>
session-history: []
date: <YYYY-MM-DD>
---

## Current Phase
<one line: which stage of the overall task>

## Completed
<what is done, brief>

## In Progress
<concrete items mid-flight: step + exact next action>

## Blocked / Decisions Pending
<what awaits decision>

## Watch Out
<what not to touch, important context>
```

`session-history: []` stays empty on first write; updates append the previous ID per Session Tracking. Sections are a baseline — when updating, preserve the file's existing custom sections; add or rename sections when the task needs it.

### Rules

- Max ~3000 tokens. Only status for continuation, not implementation details.
- Include task names and file paths in progress, but not full diffs or analysis.
- If a plan exists (in `ai/plans/` or alongside in `ai/current/`) — reference it by path, don't duplicate content.
- If a WAL outgrows the budget — move the overflow you are adding to a companion `ai/current/<name>Archive.md` (plain markdown, no frontmatter) and link it from the WAL. For text already in the file, propose the move first; don't re-propose for a WAL that already has a companion (its remainder is deliberate). Companions are archived together on **done**.

## read

Read `ai/current/<name>.md`; apply Session Tracking and write the updated frontmatter back (skip the write if nothing changed; `date` unchanged — it tracks writes), then display contents.

If the file is missing — run the Archive Lookup and report what you found; if nothing is found, say so and run **list**. An archived WAL: display it read-only — no Session Tracking, no un-archiving unless the user asks; if several versions match, list all and display the newest. A tree match: report the path — nothing to display.

## done

Use when all tasks from the WAL are complete. If the WAL still lists unfinished work — In Progress or Blocked items, or open items in any section (e.g. unchecked `- [ ]`, not-committed/file-pending lists) — point that out and ask before archiving.

1. Read the WAL. Companions = `<name>Archive.md`-named files with no `session` key, linked or not; archive ONLY those together with the WAL — never any other linked file (plans, briefs, other WALs stay live).
2. Move `ai/current/<name>.md` and its companions to `ai/current/archive/` (create the directory if missing); if a same-named file already exists there, suffix the incoming name with today's date (`_YYYY-MM-DD`) before `.md` — never overwrite (if that name is taken too, append a numeric suffix: `_YYYY-MM-DD-2`).

If `<name>.md` is missing — run the Archive Lookup; if found, report it as already archived; otherwise say so and run **list**.

## list

List top-level `.md` files in `ai/current/` (no recursion into `archive/` or other subdirectories) whose frontmatter has a `session` key — the directory also holds plans, briefs, and companion files; skip those. Show filename and frontmatter `date`.
