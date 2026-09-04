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

Priority: **one circle at a time**, that band's path_order from the top down
to the checks. Grammar and vocab zigzag. Hide already-ticked ids. Other bands
stay off the rail.

The band was hardcoded to A2 (James 2026-09-02). It became a flag on
2026-09-04, when James finished A1 and A2 and the rail had to move to B1 —
so the next move is a flag, not a code edit.

    python codex/build_smoke_next.py                    # print it (B1)
    python codex/build_smoke_next.py --write            # write it to the vault
    python codex/build_smoke_next.py --band a2 --write  # go back to a finished band
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

BANDS = ("a1", "a2", "b1", "b2", "c1")
DEFAULT_BAND = "b1"


def band_from_argv(argv) -> str:
    """`--band b1` / `--band=b1`. Defaults to the band currently being smoked."""
    for i, a in enumerate(argv):
        v = None
        if a == "--band" and i + 1 < len(argv):
            v = argv[i + 1].lower()
        elif a.startswith("--band="):
            v = a.split("=", 1)[1].lower()
        if v is not None:
            if v not in BANDS:
                raise SystemExit("--band must be one of: %s" % ", ".join(BANDS))
            return v
    return DEFAULT_BAND


BAND = band_from_argv(sys.argv)
LEVEL = BAND.upper()
# A1 sits on the bare `path_order`; every later band has its own key.
PATH_KEY = "path_order" if BAND == "a1" else f"path_order_{BAND}"
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

    # One circle, top to bottom. Splice sitting_vocab halves after
    # their grammar parent so the zigzag matches the tree.
    band_ids = list(tree.get(PATH_KEY) or [])
    path = []
    seen: set[str] = set()
    for nid in band_ids:
        if not nid or nid in seen:
            continue
        seen.add(nid)
        path.append(nid)
        vid = (by_id.get(nid) or {}).get("sitting_vocab")
        if vid and vid not in seen:
            vn = by_id.get(vid) or {}
            if vn.get("status") == "live" and node_level(vn) == LEVEL:
                seen.add(vid)
                path.append(vid)
    def is_live_band(u: str) -> bool:
        n = by_id.get(u) or {}
        return bool(n) and n.get("status") == "live" and node_level(n) == LEVEL

    def is_grammar(u: str) -> bool:
        return (by_id.get(u) or {}).get("domain") == "grammar"

    def is_vocab(u: str) -> bool:
        return (by_id.get(u) or {}).get("domain") == "vocab"

    rail = [u for u in path if is_live_band(u)]
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

    # Whole band rail (live, on PATH_KEY). Inspected units stay in
    # `total` so "N down, M to go (of T)" rises when a unit is ticked.
    rail_total = len(rail)

    remaining_line = (
        f"Remaining: **{len(todo)} units** — "
        f"{LEVEL} grammar {g_left} · {LEVEL} vocab {v_left} "
        f"(rail {rail_total})."
    )

    doc = f"""# SMOKE NEXT — the five units to test first

**GENERATED {stamp} (laptop).** Do not hand-edit. Rebuild with
`python codex/build_smoke_next.py --write` in the rue-exp repo. Everything it
needs is in the repo (INSPECTED.md, marking_topic_map.json, tree.json), so the
ranking never has to be maintained by hand or on a particular machine.

Priority: **{LEVEL} circle only**, `{PATH_KEY}` from the top down, grammar and
vocab zigzag. Already-ticked ids are hidden. Other bands stay off the rail.
Rebuild another band with `--band a2`.
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
