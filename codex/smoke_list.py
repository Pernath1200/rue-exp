# smoke_list.py — Telegram smoke-next handler.
#
# Rank comes from the vault file (generated on the laptop).
# This process NEVER writes smoke-next.md. It only appends smoke-done-log.md.
# `units to test` re-reads both files and hides ids already in the log.
#
# Copy to the home PC listener (`C:\Users\james\reminders\smoke_list.py`)
# and restart that process. Canonical copy: rue-exp/codex/smoke_list.py
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

CANDIDATE_VAULTS = [
    Path.home() / "Documents" / "original" / "TA",
    Path(r"C:\Users\james\Documents\original\TA"),
    Path(r"C:\Users\ADMIN\Documents\original\TA"),
]

TOP_RE = re.compile(r"^(\d+)\.\s+`([a-z0-9_]+)`\s+·\s+(.+?)\s*$")
BENCH_RE = re.compile(r"^-\s+`([a-z0-9_]+)`\s+·\s+(.+?)\s*$")
TESTED_NUM = re.compile(r"^(\d+)\s+(.+?)\s+tested$", re.I)
TESTED_ID = re.compile(r"^([a-z][a-z0-9_]*)\s+tested$", re.I)
LOG_RE = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?\s*·\s*"
    r"(?P<unit>[a-z0-9_]+)\s*·\s*(?P<verdict>tested|approved|untested)\b"
)
REMAINING_RE = re.compile(r"Remaining:\s+\*\*(\d+)\s+grammar units\*\*", re.I)

# Live id after a move. Telegram may still send the parked id.
ALIASES = {
    "b1_used_to": "a2_used_to",
}


def _vault() -> Path:
    for p in CANDIDATE_VAULTS:
        if (p / "smoke-next.md").exists() or (p / "smoke-done-log.md").exists():
            return p
    return CANDIDATE_VAULTS[0]


def _paths():
    v = _vault()
    return v / "smoke-next.md", v / "smoke-done-log.md"


def _parse(text: str):
    top, bench = [], []
    in_top = in_bench = False
    for line in text.splitlines():
        if line.startswith("## Top 5"):
            in_top, in_bench = True, False
            continue
        if line.startswith("## Bench"):
            in_top, in_bench = False, True
            continue
        if line.startswith("## "):
            in_top = in_bench = False
            continue
        if in_top:
            m = TOP_RE.match(line.strip())
            if m:
                top.append((m.group(2), m.group(3).strip()))
        elif in_bench:
            m = BENCH_RE.match(line.strip())
            if m:
                bench.append((m.group(1), m.group(2).strip()))
    return top, bench


def _canon(uid: str) -> str:
    return ALIASES.get(uid, uid)


def _tested_ids(done_text: str) -> set[str]:
    """Last verdict wins. Aliases apply both ways."""
    last: dict[str, str] = {}
    for ln in done_text.splitlines():
        m = LOG_RE.search(ln.replace("~~", ""))
        if not m:
            continue
        last[_canon(m.group("unit"))] = m.group("verdict")
    out = set()
    for uid, v in last.items():
        if v in ("tested", "approved"):
            out.add(uid)
            for parked, live in ALIASES.items():
                if live == uid:
                    out.add(parked)
    return out


def _filter(top, bench, done: set[str]):
    rest = [(u, lab) for u, lab in top + bench if _canon(u) not in done and u not in done]
    return rest[:5], rest[5:]


def _format_top(top) -> str:
    lines = [f"{i} {uid} — {label}" for i, (uid, label) in enumerate(top[:5], 1)]
    return "\n".join(lines) if lines else "(no units left in Top 5)"


def _footer(raw: str, top, bench) -> str:
    m = REMAINING_RE.search(raw)
    n = len(top) + len(bench)
    if m:
        # File remaining minus anything the log already ticked that the
        # snapshot still listed.
        listed = n
        file_n = int(m.group(1))
        n = min(file_n, listed) if listed else file_n
    return f"\n{n} left on this list. Laptop reconcile is source of truth."


def _matches_slot(query: str, uid: str, label: str) -> bool:
    q = query.strip().lower().replace(" ", "_")
    u = uid.lower()
    lab = label.lower()
    if q == u or q in u or _canon(q) == _canon(u):
        return True
    if q.replace("_", " ") in lab:
        return True
    return False


def _tick(uid: str, next_path: Path, done_path: Path) -> str:
    uid = _canon(uid.strip().lower())
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    prev = done_path.read_text(encoding="utf-8") if done_path.exists() else ""
    done_path.write_text(
        prev.rstrip() + f"\n{stamp} · {uid} · tested\n",
        encoding="utf-8",
    )
    raw = next_path.read_text(encoding="utf-8") if next_path.exists() else ""
    top, bench = _parse(raw)
    done = _tested_ids(done_path.read_text(encoding="utf-8"))
    new_top, new_bench = _filter(top, bench, done)
    note = ""
    ids = [_canon(u) for u, _ in top + bench]
    if uid not in ids and uid not in done:
        note = f"{uid} logged (was not on the snapshot)\n"
    elif uid not in ids:
        note = f"{uid} logged\n"
    else:
        note = f"{uid} logged\n"
    return note + _format_top(new_top) + _footer(raw, new_top, new_bench)


def handle_smoke(text: str) -> str | None:
    """Return a Telegram reply, or None if this is not a smoke command."""
    msg = " ".join(text.strip().split())
    low = msg.lower()
    next_path, done_path = _paths()

    if low in ("units to test", "unit to test", "next unit", "smoke next"):
        if not next_path.exists():
            return "smoke-next.md not found on this machine."
        raw = next_path.read_text(encoding="utf-8")
        top, bench = _parse(raw)
        done = _tested_ids(done_path.read_text(encoding="utf-8")) if done_path.exists() else set()
        top, bench = _filter(top, bench, done)
        return _format_top(top) + _footer(raw, top, bench)

    if not low.endswith("tested"):
        return None
    if not next_path.exists():
        return "smoke-next.md not found on this machine."

    raw = next_path.read_text(encoding="utf-8")
    top, bench = _parse(raw)

    m = TESTED_NUM.match(msg)
    if m:
        n = int(m.group(1))
        query = m.group(2).strip()
        if n < 1 or n > len(top):
            return f"No slot {n} on the list.\n" + _format_top(top)
        uid, label = top[n - 1]
        if not _matches_slot(query, uid, label):
            return (
                f"Slot {n} is {uid} ({label}), not “{query}”. "
                f"Send `{uid} tested`.\n" + _format_top(top)
            )
        return _tick(uid, next_path, done_path)

    m = TESTED_ID.match(msg)
    if m:
        return _tick(m.group(1).lower(), next_path, done_path)

    return (
        "Say `a2_comparatives tested` (the unit id) "
        "or `1 present_perfect tested` only if slot 1 matches.\n"
        + _format_top(top)
    )
