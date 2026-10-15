# Flowcanon

Agent workflow canon for Claude Code: proven forms of work (flows), each with an
independent gate — whoever produces an artifact never judges it. A `team` skill holds the
flows and the manuals for the lead, the teammate and the executor; a roster of agent roles
they draw from comes with it.

## Install

Add the plugin to Claude Code, then set one environment variable in your
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "2"
  }
}
```

**A plugin manifest cannot supply this — you have to set it yourself.** The team is a
two-level hierarchy: the session lead spawns named teammates, and a teammate spawns
unnamed sub-agents of its own. That second level is what the variable has to allow.

`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` is not covered by the Claude Code settings
documentation; `2` is the value this plugin is developed and run against.

## Hooks

The plugin ships two hooks:

- **SessionStart** (`inject-session-id.sh`) — puts `session_id: <id>` into the context on
  startup, resume, clear and compact. The `wal` skill records this id in a WAL's frontmatter.
- **PreToolUse on `Agent|Task`** (`require-root-cwd.py`) — denies a subagent spawn when the
  session's cwd is not the project root (`CLAUDE_PROJECT_DIR`): the subagent would inherit
  that cwd and resolve `.claude/` and `.mcp.json` from the subfolder. It also denies a named
  spawn (a teammate) coming from a sub-agent: teammates are spawned by the main session only.
  Without `CLAUDE_PROJECT_DIR` the hook denies nothing.

Both hooks need `python3`. If your project or user settings already wire the same hooks,
they fire twice: the outcome is the same, but `session_id` lands in the context twice —
remove one of each pair.

## Optional dependencies

The plugin runs without these; here is what changes when one is missing.

- **The `context7` plugin** — `developer`, `reviewer` and `review-lead` list its tools for
  library documentation. Without it an agent of a workflow script says so in its `method` and
  narrows its claim to the library's official page and the installed sources in `node_modules`.
- **tmux** — teammates get `Agent`/`Task` and `Workflow` only when the main session runs
  under tmux. Without it `sage-pool` degrades to one tier, `workflow-streams` stops with
  BLOCKED, and teammates cannot run the workflow scripts; the main session keeps `Workflow`.
- **The `skill-creator` skill** — the `S1` check of `deep-review` reviews a skill against its
  guidelines. The check lists the points it applies, so without the skill the reviewer works
  from that list alone.

## MongoDB

The `mongo-mcp` skill needs a MongoDB MCP server registered under the name `mongo` —
the skill addresses its tools by the `mcp__mongo__` prefix. Give the server the
connection string in its own configuration, e.g. `mongodb-mcp-server` in `.mcp.json`:

```json
{
  "mcpServers": {
    "mongo": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "<connection string>"
      }
    }
  }
}
```

The server then holds the connection under the id `preconfigured`, and agents pass that
id in every call instead of connecting themselves.

## Project conventions

The skills and agents rely on a few things the project provides:

- **The project docs** — the project's product documentation: screens, data, flows. Agents
  take design facts from its screen-level descriptions, and decomposition entries link only
  to it. Name its location in your root `CLAUDE.md`, e.g. «The project docs live in `docs/`».
- **Records** — the decomposition records (the epic list, an epic's feature set, a feature's
  task set) and the places' home entries live either in a task tracker or as files in the
  repository; an entry links to its parent and to the entries it depends on. Name in your
  root `CLAUDE.md` where they live and how an entry is read.
- **A superproject** — the `workflow-solo`, `workflow-own-intake` and `workflow-streams`
  flows expect a root git repository whose projects are git submodules. `root` is that
  repository, the run descriptor's `repos` names the submodules, and every file path is
  `<submodule>/<path from the submodule's root>`.
- **One submodule per stream** — in `workflow-streams` each stream works in its own worktree
  of the superproject with only its submodule initialized; the code is committed in the
  submodule's branch and the new submodule pointer in the worktree's branch.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Ivan Saldayev.
