# SMOKE NEXT — generated into the vault

The running Top 5 lives at `Documents\original\TA\smoke-next.md`.
Rebuild: `py -X utf8 codex\build_smoke_next.py --write` then
`py -X utf8 codex\reconcile_inspected.py`.

**Laptop is the only writer of that file.** The Telegram bot on the home PC
must only append `TA/smoke-done-log.md` and re-read Top 5. If it rewrites
the ranking, the two machines fight.

Canonical bot handler: `codex/smoke_list.py` — copy onto
`C:\Users\james\reminders\smoke_list.py` and restart the listener.

Tick: `<unit_id> tested`. Parked ids alias (`b1_used_to` → `a2_used_to`).
Undo: `<unit_id> untested`. Ask: `units to test`.

If Telegram's Top 5 is not this ranking, the home bot is stale.
