# SMOKE NEXT — generated into the vault

The running Top 5 lives at `Documents\original\TA\smoke-next.md`.
The bot ranks from `Documents\original\TA\smoke-order.json` (the **full**
remaining list, not five lines) minus `smoke-done-log.md`.
Rebuild: `py -X utf8 codex\build_smoke_next.py --write` then
`py -X utf8 codex\reconcile_inspected.py`.

**Laptop is the only writer of that file.** The Telegram bot on the home PC
must only append `TA/smoke-done-log.md` and re-read Top 5. If it rewrites
the ranking, the two machines fight.

Canonical bot handler: `codex/smoke_list.py` — copy onto
`C:\Users\james\reminders\smoke_list.py` and restart the listener.

Tick: `<unit_id> tested`. Parked ids alias (`b1_used_to` → `a2_used_to`).
Vocab ticks use the **tree id** (`leaf_home_family tested`). Pack filenames
(`a1_home_family tested`) alias to the same id.
Undo: `<unit_id> untested`. Ask: `units to test`.

Rail (2026-08-30): leftover A1–B1 grammar, then **A1 vocab then A2 vocab**
in path order (leaves, trunk, and `a1_vocab_match` + `a1_vocab_type`). B1 vocab stays off.

The count line is `N down, M to go (of T)`. `T` is the whole current rail
in `smoke-order.json` (`total`), not a baked 53. If Telegram still says
`of 53`, the home listener is the old handler — copy `codex/smoke_list.py`
onto `reminders\smoke_list.py` (or the trampoline) and restart.

If Telegram's Top 5 is not this ranking, the home bot is stale.
