# smoke_list.py — Telegram smoke-next handler. Lives in the vault AND the repo.
#
# Hard rules (2026-08-29 rewind: remaining went 10 → 14, tested units came back):
#   1. NEVER write smoke-next.md or smoke-order.json.
#   2. ONLY append smoke-done-log.md.
#   3. Rank from smoke-order.json (full remaining list) minus the log.
#      A 5-line snapshot is how already-tested units resurrected.
#   4. Remaining = how many of that order are still untested.
#      Total = whole rail in smoke-order.json (`total`). Never a baked 53.
#   5. Parked ids alias (b1_used_to → a2_used_to). Pack-stem aliases
#      (a1_home_family → leaf_home_family) live in smoke-order.json.
#
# Canonical: rue-exp/codex/smoke_list.py
# Live copy:  Documents/original/TA/smoke_list.py  (Obsidian Sync)
# Vocab pack stems alias from smoke-order.json (a1_home_family → leaf_home_family).
# The listener should load THIS vault file every message, not a cached copy
# in reminders/.
from __future__ import annotations

import json
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

DEFAULT_ALIASES = {
    "b1_used_to": "a2_used_to",
}


def _vault() -> Path:
    for p in CANDIDATE_VAULTS:
        if (p / "smoke-order.json").exists() or (p / "smoke-next.md").exists():
            return p
    return CANDIDATE_VAULTS[0]


def _canon(uid: str, aliases: dict) -> str:
    return aliases.get(uid, uid)


def _tested_ids(done_text: str, aliases: dict) -> set[str]:
    last: dict[str, str] = {}
    for ln in done_text.splitlines():
        m = LOG_RE.search(ln.replace("~~", ""))
        if not m:
            continue
        last[_canon(m.group("unit"), aliases)] = m.group("verdict")
    out = set()
    for uid, v in last.items():
        if v in ("tested", "approved"):
            out.add(uid)
            for parked, live in aliases.items():
                if live == uid:
                    out.add(parked)
    return out


def _load_order(vault: Path):
    """Full remaining list from the laptop. Markdown Top 5 is display-only.

    Returns order, aliases, stamp, total. `total` is the whole smoke rail
    (inspected + remaining). Never a baked 53 — that is how '-5 down,
    58 to go (of 53)' happened once the rail grew past A1–B1 grammar.
    """
    aliases = dict(DEFAULT_ALIASES)
    stamp = "unknown"
    order = []
    total = 0
    jpath = vault / "smoke-order.json"
    if jpath.exists():
        data = json.loads(jpath.read_text(encoding="utf-8"))
        aliases.update(data.get("aliases") or {})
        stamp = str(data.get("generated") or stamp)
        total = int(data.get("total") or 0)
        for row in data.get("order") or []:
            uid = str(row.get("id") or "").strip()
            if uid:
                order.append((uid, str(row.get("label") or uid)))
        if not total:
            total = int(data.get("remaining") or 0) or len(order)
        if order:
            return order, aliases, stamp, total
    # Fallback: markdown snapshot (legacy). Worse if the file is only 5+bench.
    md = vault / "smoke-next.md"
    if not md.exists():
        return [], aliases, stamp, total
    raw = md.read_text(encoding="utf-8")
    m = re.search(r"GENERATED\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})", raw, re.I)
    if m:
        stamp = m.group(1)
    rm = re.search(r"Remaining:\s+\*\*(\d+)\s+units\*\*", raw, re.I)
    if rm:
        total = int(rm.group(1))
    top, bench = [], []
    in_top = in_bench = False
    for line in raw.splitlines():
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
            mm = TOP_RE.match(line.strip())
            if mm:
                top.append((mm.group(2), mm.group(3).strip()))
        elif in_bench:
            mm = BENCH_RE.match(line.strip())
            if mm:
                bench.append((mm.group(1), mm.group(2).strip()))
    order = top + bench
    if not total:
        total = len(order)
    return order, aliases, stamp, total


def _visible(order, done: set[str], aliases: dict):
    rest = [
        (u, lab)
        for u, lab in order
        if _canon(u, aliases) not in done and u not in done
    ]
    return rest


def _format_top(top) -> str:
    lines = [f"{i} {uid} — {label}" for i, (uid, label) in enumerate(top[:5], 1)]
    return "\n".join(lines) if lines else "(no units left)"


def progress_line(left: int, total: int, stamp: str) -> str:
    """Finished count must rise when a unit is ticked.

    `total` = whole rail. `left` = still untested on this snapshot.
    If total is stale and smaller than left (the old baked-53 bug),
    fall back to snapshot length so the line never goes negative.
    """
    left = max(0, int(left or 0))
    total = int(total or 0)
    if total < left:
        total = left
    down = total - left
    return f"{down} down, {left} to go (of {total}). Snapshot {stamp}."


def _reply(order, done, aliases, stamp, note: str = "", total: int = 0) -> str:
    vis = _visible(order, done, aliases)
    n = len(vis)
    body = _format_top(vis)
    foot = progress_line(n, total or len(order), stamp)
    return (note + body + "\n" + foot).strip() + "\n"


def _matches_slot(query: str, uid: str, label: str, aliases: dict) -> bool:
    q = query.strip().lower().replace(" ", "_")
    u = uid.lower()
    lab = label.lower()
    if q == u or q in u or _canon(q, aliases) == _canon(u, aliases):
        return True
    if q.replace("_", " ") in lab:
        return True
    return False


def _append_tick(done_path: Path, uid: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    done_path.parent.mkdir(parents=True, exist_ok=True)
    with done_path.open("a", encoding="utf-8") as f:
        f.write(f"\n{stamp} · {uid} · tested\n")


def handle_smoke(text: str) -> str | None:
    """Return a Telegram reply, or None if this is not a smoke command."""
    msg = " ".join(text.strip().split())
    low = msg.lower()
    is_list = low in ("units to test", "unit to test", "next unit", "smoke next")
    is_tick = low.endswith("tested")
    if not is_list and not is_tick:
        return None

    vault = _vault()
    order, aliases, stamp, total = _load_order(vault)
    done_path = vault / "smoke-done-log.md"
    done = _tested_ids(
        done_path.read_text(encoding="utf-8") if done_path.exists() else "",
        aliases,
    )

    if is_list:
        if not order:
            return "smoke-order.json not found. Run build_smoke_next.py --write on the laptop."
        return _reply(order, done, aliases, stamp, total=total)

    if not order:
        return "smoke-order.json not found. Run build_smoke_next.py --write on the laptop."

    vis = _visible(order, done, aliases)

    m = TESTED_NUM.match(msg)
    if m:
        n = int(m.group(1))
        query = m.group(2).strip()
        if n < 1 or n > min(5, len(vis)):
            return f"No slot {n} on the list.\n" + _reply(
                order, done, aliases, stamp, total=total
            )
        uid, label = vis[n - 1]
        if not _matches_slot(query, uid, label, aliases):
            return (
                f"Slot {n} is {uid} ({label}), not “{query}”. "
                f"Send `{uid} tested`.\n"
                + _reply(order, done, aliases, stamp, total=total)
            )
        live = _canon(uid, aliases)
        _append_tick(done_path, live)
        done = _tested_ids(done_path.read_text(encoding="utf-8"), aliases)
        return _reply(
            order, done, aliases, stamp, note=f"{live} logged\n", total=total
        )

    m = TESTED_ID.match(msg)
    if m:
        live = _canon(m.group(1).lower(), aliases)
        _append_tick(done_path, live)
        done = _tested_ids(done_path.read_text(encoding="utf-8"), aliases)
        return _reply(
            order, done, aliases, stamp, note=f"{live} logged\n", total=total
        )

    return (
        "Say `a2_present_perfect tested` (the unit id).\n"
        + _reply(order, done, aliases, stamp, total=total)
    )
