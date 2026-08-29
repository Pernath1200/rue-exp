#!/usr/bin/env python
"""Generate the vault's smoke-next.md from data already in the repo.

Laptop is the only writer of this ranking. The Telegram bot on the home PC
must ONLY append smoke-done-log.md and re-read this file. If the bot rewrites
Top 5 itself, the two machines fight (2026-08-29: bot still served b1_used_to
and already-smoked A2 units after the laptop had moved on).

Nothing here needs a human. The ranking is derivable:
  ticks        codex/INSPECTED.md
  error lists  codex/marking_topic_map.json  (marking-sheet label -> unit id)
  path order   data/tree.json                (path_order + _a2 + _b1)

Priority, James 2026-08-26:
  1. units that appear in the marking sheets, B1 and below
  2. then A1 grammar from the beginning of the path
  within each, path order — foundation upward.

Scope: GRAMMAR ONLY, A1-B1. B2/C1 are hidden from the rail; vocab and trunk_*
sit outside the beta.

    python codex/build_smoke_next.py            # print it
    python codex/build_smoke_next.py --write    # write it to the vault
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAULT = Path.home() / "Documents" / "original" / "TA"
OUT = VAULT / "smoke-next.md"
ORDER_JSON = VAULT / "smoke-order.json"

# Parked id → live id. Bot and log both use this.
ALIASES = {
    "b1_used_to": "a2_used_to",
}

LEVELS = ("A1", "A2", "B1")
TOP_N = 5
BENCH_N = 10


def level_of(unit: str) -> str:
    return unit.split("_")[0].upper()


def main() -> int:
    tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
    tmap = json.loads(
        (ROOT / "codex" / "marking_topic_map.json").read_text(encoding="utf-8")
    )["map"]

    inspected, labels = set(), {}
    row = re.compile(r"^- \[(?P<a>[ x])\]\[[ x]\]\s+`(?P<u>[a-z0-9_]+)`\s+—\s+(?P<l>[^·]+)")
    for line in (ROOT / "codex" / "INSPECTED.md").read_text(encoding="utf-8").splitlines():
        m = row.match(line.strip())
        if m:
            labels[m.group("u")] = m.group("l").strip()
            if m.group("a") == "x":
                inspected.add(m.group("u"))

    seen, path = set(), []
    for key in ("path_order", "path_order_a2", "path_order_b1"):
        for u in tree.get(key, []):
            if u not in seen:
                seen.add(u)
                path.append(u)
    pos = {u: i for i, u in enumerate(path)}

    def in_scope(u: str) -> bool:
        return (
            bool(u)
            and not u.startswith("trunk_")          # vocab spine, outside the beta
            and level_of(u) in LEVELS               # B2/C1 hidden from the rail
            and u not in inspected
            and u in pos                            # must be on a live path
        )

    err = {v for v in tmap.values() if in_scope(v)}
    todo = sorted(
        (u for u in path if in_scope(u)),
        key=lambda u: (0 if u in err else 1, pos[u]),
    )

    def line(u: str) -> str:
        bits = [f"`{u}`", labels.get(u, ""), level_of(u)]
        if u in err:
            bits.append("error list")
        return " · ".join(b for b in bits if b)

    top = todo[:TOP_N]
    bench = todo[TOP_N : TOP_N + BENCH_N]
    counts = {lv: sum(1 for u in todo if level_of(u) == lv) for lv in LEVELS}

    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    doc = f"""# SMOKE NEXT — the five units to test first

**GENERATED {stamp} (laptop).** Do not hand-edit. Rebuild with
`python codex/build_smoke_next.py --write` in the rue-exp repo. Everything it
needs is in the repo (INSPECTED.md, marking_topic_map.json, tree.json), so the
ranking never has to be maintained by hand or on a particular machine.

Priority (James, 2026-08-26): units that appear in the marking sheets, B1 and
below, first; then A1 grammar from the beginning of the path. Within each,
path order — foundation upward.

Scope: **grammar only, A1–B1.** B2 and C1 are hidden from the rail; vocab and
`trunk_*` stay built and linkable but sit outside the beta.

Tick by telling the bot `<unit_id> tested` (full id, no list number). The bot
**only appends** [[smoke-done-log]] and **replies with this file's Top 5**,
hiding ids already in the log. It must **never rewrite this file**. That log
line is the inspect tick. `python codex/reconcile_inspected.py` copies it into
INSPECTED.md and --writes this file. Undo with `<unit_id> untested`.
If Telegram's Top 5 does not match this file, the home bot is stale — send
`units to test` after Obsidian Sync, and paste `codex/smoke_list.py` onto the
home PC listener.

Remaining: **{len(todo)} grammar units** — A1 {counts['A1']} · A2 {counts['A2']} · B1 {counts['B1']}.

## Top 5

"""
    doc += "\n".join(f"{i}. {line(u)}" for i, u in enumerate(top, 1))
    doc += "\n\n## Bench\n\n"
    doc += "\n".join(f"- {line(u)}" for u in bench)
    doc += f"\n\n_{len(todo) - len(top) - len(bench)} further units behind the bench._\n"

    if "--write" in sys.argv:
        OUT.write_text(doc, encoding="utf-8", newline="\r\n")
        payload = {
            "generated": stamp,
            "remaining": len(todo),
            "aliases": ALIASES,
            "order": [
                {
                    "id": u,
                    "label": f"{labels.get(u, u)} · {level_of(u)}",
                    "level": level_of(u),
                }
                for u in todo
            ],
        }
        ORDER_JSON.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\r\n",
        )
        print(f"written: {OUT}")
        print(f"written: {ORDER_JSON} ({len(todo)} remaining)")
        print(f"top: {', '.join(top)}")
    else:
        print(doc)
        print("--- not written. Re-run with --write ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
