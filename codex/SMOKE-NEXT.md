# SMOKE NEXT — generated into the vault

The running Top 5 lives at `Documents\original\TA\smoke-next.md`.
The bot ranks from `Documents\original\TA\smoke-order.json` (the **full**
remaining list, not five lines) minus `smoke-done-log.md`.
Rebuild: `py -X utf8 codex\build_smoke_next.py --write` then
`py -X utf8 codex\reconcile_inspected.py`.

**This laptop is the listener** (`TelegramSweepBot` on `ADMIN\reminders`).
It loads `TA/smoke_list.py` every message. Do not go to the home PC to
patch the bot. If two machines poll, Telegram 409s — this one should win
while it is running.

The bot only appends `TA/smoke-done-log.md` and re-reads the ranking. If it
rewrites `smoke-next.md`, the two writers fight.

Tick: `<unit_id> tested`. Parked ids alias (`b1_used_to` → `a2_used_to`).
Vocab ticks use the **tree id** (`leaf_home_family tested`). Pack filenames
(`a1_home_family tested`) alias to the same id.
Undo: `<unit_id> untested`. Ask: `units to test`.

Rail (2026-08-30): leftover A1–B1 grammar, then **A1 vocab then A2 vocab**
in path order (leaves, trunk, and `a1_vocab_match` + `a1_vocab_type`). B1 vocab stays off.

The count line is `N down, M to go (of T)`. `T` is the whole current rail
in `smoke-order.json` (`total`), never a baked 53. Good reply includes
`Snapshot YYYY-MM-DD HH:MM`. If the phone still says `of 53`, this laptop's
listener is down — re-enable `TelegramSweepBot`. Do not patch the home PC.
