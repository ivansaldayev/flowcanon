#!/usr/bin/env bash
exec python3 -c '
import json, sys
sid = json.load(sys.stdin)["session_id"]
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": f"session_id: {sid}"
    }
}))
'
