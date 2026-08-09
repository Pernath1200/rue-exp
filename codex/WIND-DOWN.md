# WIND-DOWN — plan and run counter

James decided 2026-08-09: RUE is workable, wind down unattended work rather
than start the B1 vocab extension (see AGENTS.md — parked, not cancelled).
Same shape as RUPL's 2026-08-08 wind-down: a few more bounded sessions, then
one handoff document, then both routines self-terminate.

**Exit condition: `codex/HANDOFF.md` exists.** Once it does, every run of
either routine checks for it FIRST and stops immediately — no work, no
commit. This file is retired at that point; do not edit it further.

## Scope for the remaining sessions

- Close out `codex/REPAIR-QUEUE.md` (one-time items + standing-rule progress)
- Finish the A2 Use-bank backlog (`sentences[]` on remaining A2 leaf packs)
- **No new C1 units. No B1 vocab work. No other new content.** This is a
  close-out, not a final sprint — if the backlog above clears early, don't
  invent replacement work, just let the run counter finish.
- The **build** routine writes `codex/HANDOFF.md` once BOTH the backlog above
  is genuinely clear AND its run counter below is exhausted — whichever
  comes first. Model it on `rupl-exp/codex/HANDOFF.md`: verified-fresh state
  (re-count from `data/tree.json`, don't copy old digest numbers), everything
  deliberately not done and why, every open question in one place, the
  standing hard rules, how to restart.

## Run counter — each routine updates its own line after every run

Format: `<n> / <cap>`. Increment `<n>` by 1 at the end of every run that did
NOT hit the HANDOFF.md exit check (i.e. every run that did real work).

- **build routine runs used: 0 / 6**
- **Czech-review routine runs used: 0 / 6**

The build routine stops (writes HANDOFF.md) at 6, or earlier if the backlog
clears first. The Czech-review routine should get to review build's actual
final commits, so it keeps running until it sees `codex/HANDOFF.md` exist,
then does exactly ONE more pass (a final consolidation — every unanswered
"For James" item gathered in one place, which packs were never reviewed) and
stops for good, capped at 6 of its own routine runs of real review work
either way (the final consolidation pass doesn't count against this cap).
