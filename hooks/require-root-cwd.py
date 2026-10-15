#!/usr/bin/env python3
"""A sub-agent inherits the session cwd: a spawn from a child folder moves the resolution of .claude/ and .mcp.json there too.
A named spawn (teammate) — only from the main session: subs spawn only unnamed subs."""
import json, os, sys

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR")
if not PROJECT_DIR:
    sys.exit(0)
ROOT = os.path.realpath(PROJECT_DIR)


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    sys.exit(0)


try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cwd = payload.get("cwd") or ""
if os.path.realpath(cwd) != ROOT:
    deny(
        f"Sub-agent spawn blocked: the session cwd is {cwd}, not the project root {ROOT}. "
        f"The sub-agent would inherit this cwd, and .claude/ and .mcp.json would resolve from the child folder. "
        f"Fix: run `cd {ROOT}` via Bash, then repeat this same Agent call with the same parameters. "
        f"Do not ask the user — just fix the cwd and repeat."
    )

name = (payload.get("tool_input") or {}).get("name")
agent_id = payload.get("agent_id")
if name and agent_id:
    deny(
        f"Named teammate spawn `{name}` blocked: teammates (Agent with the `name` parameter) are spawned only by the team lead — the main session, "
        f"and this call came from sub-agent {agent_id}. Subs spawn only unnamed subs. "
        f"Fix: repeat this same Agent call without the `name` parameter. Do not ask the user."
    )
