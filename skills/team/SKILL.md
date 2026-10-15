---
name: team
description: Agent teamwork — create and operate a team of agents. Use when the user asks to create a team, run a task through the team, pick a team flow, wind down a team session, or work on team flows.
---

Role router — start with the file for your role:

- **You are the team lead** (operating the team) → read [teamlead.md](teamlead.md), the team-lead operations manual.
- **You are the flowmaker** (sage selecting or parameterizing a team flow for a task) → read [flowmaker.md](flowmaker.md) — the role procedure — then [flows/index.md](flows/index.md); read finalist flows in full.
- **You are any other teammate or team sub-agent** → read [teammate.md](teammate.md) — a mandatory read at spawn: the shared gate semantics, how to address sub-agent replies, the working discipline for facts, fixes and cross-owner seams, and the Honesty & Escalation norms. Then read [executor.md](executor.md) — the requester term, the pre-work vision gate and the requester seat; review-lead and its reviewer sub-agents are not bound by the gate but read the whole file — the requester seat binds them.

Role unassigned? Don't pick one — ask whoever spawned you and wait for the answer.

## Input contract (teamlead → flowmaker)

The team lead hands the flowmaker ONLY a shape-brief — never the task itself: type hypothesis (a HINT, not a decision — the only OPTIONAL field), size/risk, projects affected, ready-specs status (does a reviewer-accepted plan already exist, and where), environment (external tooling availability, tmux for teammate-run scripts, active user-gates), constraints. Any OTHER missing field → the flowmaker returns **"BLOCKED: [what failed] — [what I need to continue]"**; the flowmaker never researches the task.

Registry below is names only — agent descriptions are already in the system prompt of every agent with the Agent tool.

## Team agents

architect, dev-lead, review-lead, sage

## Subordinate agents (spawned by their leads)

developer ← dev-lead, reviewer ← review-lead, sage ← sage

## On-call specialists

scout

Intentionally in both lists: sage — spawns sages for parallelizable or multi-source work.
