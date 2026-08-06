#!/usr/bin/env python3
"""
make_pool.py — position-aware taught-vocabulary pool for authoring agents.

The pool for a unit is everything taught STRICTLY BEFORE it on the full
course path (A1 zigzag → A2 → B1 → B2 → C1) — not everything taught anywhere.
Regenerate IMMEDIATELY before authoring each unit. (RUPL lesson: a stale or
whole-course pool caused real sequencing bugs both ways.)

What counts as taught:
  - vocab packs: every item's `en` target (slash-split, parens stripped) and
    every `lemma` field
  - all packs: every `gap_answer` (taught forms)

Usage:
    py -X utf8 codex/make_pool.py POOL.md                 # whole course
    py -X utf8 codex/make_pool.py POOL.md --before <node_id>
JSON twin is written next to the output (POOL.json).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

PARENS_RE = re.compile(r"\([^)]*\)")


def full_path(tree: dict) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for key in ("path_order", "path_order_a2", "path_order_b1",
                "path_order_b2", "path_order_c1"):
        for nid in tree.get(key) or []:
            if nid not in seen:
                seen.add(nid)
                out.append(nid)
    return out


def targets_of(pack: dict, domain: str) -> list[str]:
    out: list[str] = []

    def add(s: str) -> None:
        s = PARENS_RE.sub(" ", s)
        for part in s.split("/"):
            part = part.strip().lower()
            if part:
                out.append(part)

    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if not isinstance(it, dict):
                continue
            ga = it.get("gap_answer")
            if isinstance(ga, str) and ga.strip():
                add(ga)
            if isinstance(it.get("lemma"), str):
                add(it["lemma"])
            # vocab word items (no gap): the en side IS the taught target
            if domain == "vocab" and not it.get("gap") and isinstance(it.get("en"), str):
                add(it["en"])
    return sorted(set(out))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    out_path = Path(sys.argv[1])
    before = None
    if "--before" in sys.argv:
        before = sys.argv[sys.argv.index("--before") + 1]

    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree.get("nodes") or []}
    order = full_path(tree)

    cutoff = len(order)
    if before:
        if before not in order:
            print(f"ERROR: {before} is not on the course path")
            return 1
        cutoff = order.index(before)

    per_node: dict[str, list[str]] = {}
    flat: set[str] = set()
    for nid in order[:cutoff]:
        node = by_id.get(nid)
        if not node or node.get("status") != "live" or not node.get("content"):
            continue
        pack_file = DATA / node["content"]
        if not pack_file.is_file():
            continue
        pack = json.loads(pack_file.read_text(encoding="utf-8"))
        t = targets_of(pack, node.get("domain", "vocab"))
        if t:
            per_node[nid] = t
            flat.update(t)

    payload = {
        "before": before,
        "nodes": per_node,
        "all": sorted(flat),
    }
    out_path.with_suffix(".json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    lines = [
        f"# POOL — taught before `{before or 'END'}` "
        f"({len(flat)} targets from {len(per_node)} live units)",
        "",
        "Only material below is legally available to a new unit at this "
        "position. Function words (glue) are always available — see "
        "codex/audit.py GLUE.",
        "",
    ]
    for nid, t in per_node.items():
        lines.append(f"## {nid} ({len(t)})")
        lines.append(", ".join(t))
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"pool: {len(flat)} targets · {len(per_node)} units -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
