---
name: mongo-mcp
description: Load before using mcp__mongo__* tools. Enables MongoDB access for agents and teammates.
---

## Usage

**REQUIRED**: Before using any `mcp__mongo__*` tools, load them via `ToolSearch` with query `+mongo`.

MongoDB connection is already established by the MCP server under the id `preconfigured`. Pass `connectionId: "preconfigured"` in every `mcp__mongo__*` call — without it the call fails input validation. Do NOT call `mcp__mongo__connect` — the connection string is owned by the server configuration, not by the agent.

MongoDB access is allowed ONLY through `mcp__mongo__*` tools. Do NOT use Bash, Docker, mongosh, or any other method to connect to MongoDB.

If `mcp__mongo__*` tools are not in the tool list, cannot be loaded via `ToolSearch`, or return errors — report the problem to team-lead. Do not attempt workarounds.
