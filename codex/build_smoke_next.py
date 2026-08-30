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

Priority:
  1. remaining A1–B1 grammar that appears in the marking sheets
  2. remaining A1–B1 grammar in path order
  3. live A1 vocab, then live A2 vocab, in path order (James 2026-08-30)

Scope: grammar A1–B1, then vocab A1–A2 (leaves + trunk + a1_vocab_match + a1_vocab_type).
B2/C1 grammar and B1+ vocab stay off the rail.

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

GRAMMAR_LEVELS = ("A1", "A2", "B1")
VOCAB_LEVELS = ("A1", "A2")
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

    seen, path = set(), []
    for key in ("path_order", "path_order_a2", "path_order_b1"):
        for u in tree.get(key, []):
            if u not in seen:
                seen.add(u)
                path.append(u)
    pos = {u: i for i, u in enumerate(path)}

    # James, 2026-08-30: do not start a1_finale unless he asks.
    hold = {"a1_finale"}

    def is_live_on_path(u: str) -> bool:
        n = by_id.get(u)
        return (
            bool(n)
            and n.get("status") == "live"
            and u in pos
            and u not in inspected
            and u not in hold
        )

    def is_grammar(u: str) -> bool:
        n = by_id.get(u) or {}
        return n.get("domain") == "grammar" and node_level(n) in GRAMMAR_LEVELS

    def is_vocab(u: str) -> bool:
        n = by_id.get(u) or {}
        return n.get("domain") == "vocab" and node_level(n) in VOCAB_LEVELS

    grammar_scope = [u for u in path if is_live_on_path(u) and is_grammar(u)]
    err = {v for v in tmap.values() if v in grammar_scope}
    grammar_todo = sorted(
        grammar_scope,
        key=lambda u: (0 if u in err else 1, pos[u]),
    )
    vocab_todo = [u for u in path if is_live_on_path(u) and is_vocab(u)]
    todo = grammar_todo + vocab_todo

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
    g_counts = {
        lv: sum(1 for u in grammar_todo if node_level(by_id[u]) == lv)
        for lv in GRAMMAR_LEVELS
    }
    v_counts = {
        lv: sum(1 for u in vocab_todo if node_level(by_id[u]) == lv)
        for lv in VOCAB_LEVELS
    }

    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    aliases = dict(PARKED_ALIASES)
    aliases.update(vocab_pack_aliases(tree))

    # Whole smoke rail (live, on path, in scope). Inspected units stay in
    # `total` so "N down, M to go (of T)" rises when a unit is ticked.
    # Never bake 53 — that was A1–B1 grammar only.
    rail = [
        u
        for u in path
        if u not in hold
        and u in pos
        and (by_id.get(u) or {}).get("status") == "live"
        and (is_grammar(u) or is_vocab(u))
    ]
    rail_total = len(rail)

    remaining_line = (
        f"Remaining: **{len(todo)} units** — "
        f"grammar A1 {g_counts['A1']} · A2 {g_counts['A2']} · B1 {g_counts['B1']}; "
        f"vocab A1 {v_counts['A1']} · A2 {v_counts['A2']} "
        f"(rail {rail_total})."
    )

    doc = f"""# SMOKE NEXT — the five units to test first

**GENERATED {stamp} (laptop).** Do not hand-edit. Rebuild with
`python codex/build_smoke_next.py --write` in the rue-exp repo. Everything it
needs is in the repo (INSPECTED.md, marking_topic_map.json, tree.json), so the
ranking never has to be maintained by hand or on a particular machine.

Priority: leftover A1–B1 grammar on the marking sheets first, then that grammar
in path order; then **A1 vocab, then A2 vocab**, path order (James 2026-08-30).
Vocab ticks use the tree id (`leaf_home_family tested`). Pack filenames
(`a1_home_family tested`) alias to the same id.

Scope: **grammar A1–B1, then vocab A1–A2** (leaves, trunk, and
`a1_vocab_match` + `a1_vocab_type`). B2/C1 grammar and B1+ vocab stay off the rail.

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
