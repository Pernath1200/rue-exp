# SMOKE NEXT — moved to the vault 2026-08-25

The running top-5 list lives at `Documents\original\TA\smoke-next.md` (Obsidian
Sync carries it to the home PC, where the Telegram bot reads it).

**Telegram is the tick.** `<unit_id> tested` appends `TA/smoke-done-log.md`.
That log is the inspect register. `INSPECTED.md` is generated from it — do not
hand-tick the first box. After a bot tick, run
`python codex/reconcile_inspected.py` (copies the log into the register and
rebuilds Top 5). Undo with `<unit_id> untested`.

Bot contract (home PC): `TA/smoke-bot.md`. Full unit id; never rewrite the ranking;
`units to test` re-reads the file.
