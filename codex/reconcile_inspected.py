#!/usr/bin/env python
"""Telegram is the tick. Copy the done-log into INSPECTED.md and rebuild Top 5.

James messages `<unit_id> tested`. The bot appends TA/smoke-done-log.md.
This command is the only other step — it does not ask him to tick a second file.

    python codex/reconcile_inspected.py

Undo a premature tick with `<unit_id> untested` on Telegram, then re-run this.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    from smoke_ticks import DONE_LOG, ticks_from_done_log
    from build_inspected_register import ROW_RE, read_existing

    if not DONE_LOG.exists():
        print(f"done-log not found: {DONE_LOG}")
        return 1

    before = read_existing()
    log = ticks_from_done_log()
    changed = []
    for unit, tick in sorted(log.items()):
        old = before.get(unit, (False, False))
        if old != tick:
            changed.append((unit, old, tick))

    builder = ROOT / "codex" / "build_inspected_register.py"
    r = subprocess.run([sys.executable, str(builder)], check=False)
    if r.returncode:
        return r.returncode

    next_builder = ROOT / "codex" / "build_smoke_next.py"
    subprocess.run(
        [sys.executable, str(next_builder), "--write"],
        check=False,
    )

    if not changed:
        print("register already matches the Telegram log.")
        return 0
    print(f"{len(changed)} unit(s) from Telegram:")
    for unit, old, tick in changed:
        def box(t):
            return f"[{'x' if t[0] else ' '}][{'x' if t[1] else ' '}]"
        print(f"  {unit}: {box(old)} → {box(tick)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
