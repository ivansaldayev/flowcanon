# sage-pool (mass docs production/verification)

**When to use:** mass production or verification of documentation across DISJOINT zones (e.g. per-domain doc slices) — too many units for one sage, no code involved.

**Participants:** team-lead (slices the work); domain sage teammates, one per zone, each spawning its OWN sub-agents (two tiers — requires tmux); architect — cross-zone integrator and arbiter of conventions; NO review-lead — the independent gate here is the verify pass + the owner decision package (an owner-approved gatekeeper substitution; verdict vocabulary — [../teammate.md](../teammate.md)).

## Order

1. The team-lead slices the work into phased tasks with gates BEFORE spawning the pool (e.g. phase 0 skeleton/conventions → phase 1 domain fan-out → phase 2 consolidation → phase 3 analytics).
2. Domain sages run in parallel within a phase; each fans out sub-agents over its zone; self-fixes within the zone's own files are allowed.
3. Architect consolidates cross-zone conventions and arbitrates; ratified rules propagate point-wise to the affected zones.
4. Verify pass — same pool composition, respawned FRESH: the fresh respawn is what preserves author ≠ gatekeeper — the new instances (not the live producers) re-walk each zone via sub-agents and verify the data; unresolvable questions accumulate for the owner. Reusing live producers as verifiers of their own zones puts the author in the gatekeeper seat — allowed only with cross-zone swaps and the owner's explicit sign-off.
5. Terminal gate: the owner decision package — questions go to the owner ONE at a time (AskUserQuestion); each decision propagates point-wise to the affected zones and is recorded in the target docs.

## Watch-outs

- Two tiers REQUIRE tmux: outside tmux, teammates get no Agent/Task tools and the pool silently degrades to one tier.
- Double-assignment noise (spawn prompt + TaskUpdate as two channels) — teammates burn a turn on «already done»; assign via one channel.
- Zones must be disjoint in files AND topics — that is what makes mass teammate parallelism safe here.
- Cross-session hand-over via WAL/files, not messages.
