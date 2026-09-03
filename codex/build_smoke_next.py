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

Priority (James 2026-09-02): the **A2 circle only**, path_order_a2
from the top (`a2_present_continuous`) down to the checks. Grammar and
vocab zigzag. Hide already-ticked ids. A1 and B1+ stay off the rail.

    python codex/build_smoke_next.py            # print it
    python codex/build_smoke_next.py --write    # write it to the vault
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

from smoke_ticks import ALIASES as PARKED_ALIASES, vocab_pack_aliases

ROOT = Path(__file__).resolve().parents[1]
VAULT = Path.home() / "Documents" / "original" / "TA"
OUT = VAULT / "smoke-next.md"
ORDER_JSON = VAULT / "smoke-order.json"

A2_LEVEL = "A2"
TOP_N = 5
BENCH_N = 10


def node_level(n: dict) -> str:
    lv = n.get("levels") or []
    if lv:
        return str(lv[0]).upper()
    uid = str(n.get("id") or "")
    return uid.split("_")[0].upper() if uid else ""


def main() -> int:
    tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
    tmap = json.loads(
        (ROOT / "codex" / "marking_topic_map.json").read_text(encoding="utf-8")
    )["map"]
    by_id = {n["id"]: n for n in (tree.get("nodes") or []) if n.get("id")}

    inspected = set()
    row = re.compile(r"^- \[(?P<a>[ x])\]\[[ x]\]\s+`(?P<u>[a-z0-9_]+)`")
    for line in (ROOT / "codex" / "INSPECTED.md").read_text(encoding="utf-8").splitlines():
        m = row.match(line.strip())
        if m and m.group("a") == "x":
            inspected.add(m.group("u"))

    # Tree labels, not INSPECTED titles — those truncate at the first ·
    # (`I am · I have` became `I am`).
    labels = {uid: (n.get("label") or uid) for uid, n in by_id.items()}

    # A2 circle only, top to bottom. Splice sitting_vocab halves after
    # their grammar parent so the zigzag matches the tree.
    a2_ids = list(tree.get("path_order_a2") or [])
    path = []
    seen: set[str] = set()
    for nid in a2_ids:
        if not nid or nid in seen:
            continue
        seen.add(nid)
        path.append(nid)
        vid = (by_id.get(nid) or {}).get("sitting_vocab")
        if vid and vid not in seen:
            vn = by_id.get(vid) or {}
            if vn.get("status") == "live" and node_level(vn) == A2_LEVEL:
                seen.add(vid)
                path.append(vid)
    def is_live_a2(u: str) -> bool:
        n = by_id.get(u) or {}
        return bool(n) and n.get("status") == "live" and node_level(n) == A2_LEVEL

    def is_grammar(u: str) -> bool:
        return (by_id.get(u) or {}).get("domain") == "grammar"

    def is_vocab(u: str) -> bool:
        return (by_id.get(u) or {}).get("domain") == "vocab"

    rail = [u for u in path if is_live_a2(u)]
    todo = [u for u in rail if u not in inspected]
    err = {v for v in tmap.values() if v in todo}

    def track_of(u: str) -> str:
        return "vocab" if is_vocab(u) else "grammar"

    def line(u: str) -> str:
        lv = node_level(by_id.get(u) or {})
        tag = f"{lv} {track_of(u)}"
        bits = [f"`{u}`", labels.get(u, ""), tag]
        if u in err:
            bits.append("error list")
        return " · ".join(b for b in bits if b)

    top = todo[:TOP_N]
    bench = todo[TOP_N : TOP_N + BENCH_N]
    g_left = sum(1 for u in todo if is_grammar(u))
    v_left = sum(1 for u in todo if is_vocab(u))

    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    aliases = dict(PARKED_ALIASES)
    aliases.update(vocab_pack_aliases(tree))

    # Whole A2 rail (live, on path_order_a2). Inspected units stay in
    # `total` so "N down, M to go (of T)" rises when a unit is ticked.
    rail_total = len(rail)

    remaining_line = (
        f"Remaining: **{len(todo)} units** — "
        f"A2 grammar {g_left} · A2 vocab {v_left} "
        f"(rail {rail_total})."
    )

    doc = f"""# SMOKE NEXT — the five units to test first

**GENERATED {stamp} (laptop).** Do not hand-edit. Rebuild with
`python codex/build_smoke_next.py --write` in the rue-exp repo. Everything it
needs is in the repo (INSPECTED.md, marking_topic_map.json, tree.json), so the
ranking never has to be maintained by hand or on a particular machine.

Priority: **A2 circle only**, `path_order_a2` from the top
(`a2_present_continuous`) down, grammar and vocab zigzag (James 2026-09-02).
Already-ticked ids are hidden. A1 and B1+ stay off the rail.
Vocab ticks use the tree id (`leaf_routine_a2 tested`). Pack filenames
(`a2_routine tested`) alias to the same id.

Tick by telling the bot `<unit_id> tested` (full id, no list number). The bot
**only appends** [[smoke-done-log]] and **replies with this file's Top 5**,
hiding ids already in the log. It must **never rewrite this file**. That log
line is the inspect tick. `python codex/reconcile_inspected.py` copies it into
INSPECTED.md and --writes this file. Undo with `<unit_id> untested`.
If Telegram's Top 5 does not match this file, the home bot is stale — send
`units to test` after Obsidian Sync, and paste `codex/smoke_list.py` onto the
home PC listener.

{remaining_line}

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
            "total": rail_total,
            "aliases": aliases,
            "order": [
                {
                    "id": u,
                    "label": f"{labels.get(u, u)} · {node_level(by_id.get(u) or {})} {track_of(u)}",
                    "level": node_level(by_id.get(u) or {}),
                    "track": track_of(u),
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
