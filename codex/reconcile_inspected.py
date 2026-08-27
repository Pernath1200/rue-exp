#!/usr/bin/env python
"""Apply James's bot ticks to codex/INSPECTED.md.

He messages the Telegram bot "<unit_id> tested"; the bot appends a line to the
vault's smoke-done-log.md and must not rewrite smoke-next.md. This script
carries ticks into INSPECTED.md and rebuilds the generated list from that.

    python codex/reconcile_inspected.py            # show what would change
    python codex/reconcile_inspected.py --apply    # write it

Only James ticks. This script does not decide anything — every tick it writes
already exists in the done-log because he put it there.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / "codex" / "INSPECTED.md"
DONE_LOG = Path.home() / "Documents" / "original" / "TA" / "smoke-done-log.md"

# "2026-08-26 13:56 · a2_countable · tested"  (date, optional time, id, verdict)
LOG_RE = re.compile(
    r"^(?P<date>\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?\s*·\s*"
    r"(?P<unit>[a-z0-9_]+)\s*·\s*(?P<verdict>tested|approved)\s*$"
)
ROW_RE = re.compile(r"^(?P<pre>- \[)(?P<a>[ x])(?P<mid>\]\[)(?P<b>[ x])(?P<post>\]\s+`(?P<unit>[a-z0-9_]+)`.*)$")


def main() -> int:
    apply = "--apply" in sys.argv
    if not DONE_LOG.exists():
        print(f"done-log not found: {DONE_LOG}")
        return 1

    log_lines = DONE_LOG.read_text(encoding="utf-8").splitlines()
    pending: list[tuple[int, str, str]] = []  # (line index, unit, verdict)
    for i, ln in enumerate(log_lines):
        s = ln.strip()
        if s.startswith("~~"):
            continue  # already reconciled
        m = LOG_RE.match(s)
        if m:
            pending.append((i, m.group("unit"), m.group("verdict")))

    if not pending:
        print("nothing to reconcile — every done-log line is already struck.")
        return 0

    reg_lines = REGISTER.read_text(encoding="utf-8").splitlines()
    rows = {}
    for i, ln in enumerate(reg_lines):
        m = ROW_RE.match(ln)
        if m:
            rows[m.group("unit")] = i

    changes, missing = [], []
    for li, unit, verdict in pending:
        ri = rows.get(unit)
        if ri is None:
            missing.append(unit)
            continue
        m = ROW_RE.match(reg_lines[ri])
        a, b = ("x", "x") if verdict == "approved" else ("x", m.group("b"))
        new = f"{m.group('pre')}{a}{m.group('mid')}{b}{m.group('post')}"
        changes.append((unit, verdict, reg_lines[ri], new, ri, li))

    for unit, verdict, old, new, _, _ in changes:
        print(f"  {verdict:8} {unit}")
        print(f"      was  {old.strip()}")
        print(f"      now  {new.strip()}")
    for unit in missing:
        print(f"  !! {unit} is in the done-log but has no row in INSPECTED.md")

    if not apply:
        print(f"\n{len(changes)} tick(s) pending. Re-run with --apply to write.")
        return 0

    for _, _, _, new, ri, _ in changes:
        reg_lines[ri] = new

    # Header tally: "**7 inspected · 0 approved · 92 unseen** of 99 live units"
    insp = sum(1 for ln in reg_lines if re.match(r"^- \[x\]\[[ x]\]", ln))
    appr = sum(1 for ln in reg_lines if re.match(r"^- \[x\]\[x\]", ln))
    total = sum(1 for ln in reg_lines if ROW_RE.match(ln))
    for i, ln in enumerate(reg_lines):
        if re.match(r"^\*\*\d+ inspected · \d+ approved · \d+ unseen\*\*", ln):
            reg_lines[i] = (
                f"**{insp} inspected · {appr} approved · {total - insp} unseen** "
                f"of {total} live units"
            )
            break
    REGISTER.write_text("\n".join(reg_lines) + "\n", encoding="utf-8")

    for _, _, _, _, _, li in changes:
        log_lines[li] = (
            f"~~{log_lines[li].strip()}~~ — reconciled into INSPECTED.md "
            f"by codex/reconcile_inspected.py"
        )
    DONE_LOG.write_text("\n".join(log_lines) + "\n", encoding="utf-8")

    print(f"\napplied {len(changes)} tick(s) · register now "
          f"{insp} inspected · {appr} approved · {total - insp} unseen")

    # Rank lives in INSPECTED.md. Rebuild the vault list so the Telegram bot
    # never has to rewrite it (that rewrite was the drift).
    import subprocess
    builder = ROOT / "codex" / "build_smoke_next.py"
    subprocess.run(
        [sys.executable, str(builder), "--write"],
        check=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
