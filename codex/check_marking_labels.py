#!/usr/bin/env python3
"""check_marking_labels.py — the drift guard for marking-sheet topic labels.

Two failures this catches, both of which actually happened:

1. A label mapped to a unit that is not reachable. `b2_emphasis_fronting` is an
   authored pack that is NOT on the path, so a link to it 404s. Six packs are
   stranded that way. A mapping is only valid if its target is on-path.
2. A sheet inventing a new label. Martina's 8 sheets used 30 distinct labels for
   ~15 real topics — Articles alone appeared three ways. Unmapped labels are
   reported so they get a decision instead of silently losing their link.

    py -X utf8 codex/check_marking_labels.py                  # gate the map
    py -X utf8 codex/check_marking_labels.py <sheet.docx> ... # + audit sheets

Exit 1 on a dangling target. Unknown labels found in sheets are warnings.
"""
from __future__ import annotations

import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / "codex" / "marking_topic_map.json"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

PATH_KEYS = ("path_order", "path_order_a2", "path_order_b1",
             "path_order_b2", "path_order_c1")


def live_nodes() -> set[str]:
    tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
    out: set[str] = set()
    for key in PATH_KEYS:
        out.update(tree.get(key) or [])
    return out


def sheet_labels(path: Path) -> set[str]:
    try:
        with zipfile.ZipFile(path) as z:
            root = ET.fromstring(z.read("word/document.xml"))
    except Exception as exc:  # noqa: BLE001
        print(f"  !! {path.name}: {exc}")
        return set()

    def text(el) -> str:
        return "".join(t.text or "" for t in el.iter(f"{W}t")).strip()

    found: set[str] = set()
    for tbl in root.iter(f"{W}tbl"):
        rows = list(tbl.iter(f"{W}tr"))
        if not rows:
            continue
        header = [text(tc) for tc in rows[0].iter(f"{W}tc")]
        idx = next((i for i, h in enumerate(header) if "topic" in h.lower()), None)
        if idx is None:
            continue
        for tr in rows[1:]:
            cells = [text(tc) for tc in tr.iter(f"{W}tc")]
            if len(cells) > idx:
                v = cells[idx].strip()
                if v and v not in {"—", "-", "–"}:
                    found.add(v)
    return found


def main() -> int:
    data = json.loads(MAP.read_text(encoding="utf-8"))
    mapping = data["map"]
    live = live_nodes()
    errors: list[str] = []

    linked = {k: v for k, v in mapping.items() if v}
    for label, node in linked.items():
        if node not in live:
            errors.append(
                f"{label!r} -> {node!r} is NOT on the path — the link would 404"
            )

    print(
        f"marking labels: {len(mapping)} mapped "
        f"({len(linked)} linked, {len(mapping) - len(linked)} deliberately unlinked) "
        f"· {len(set(linked.values()))} distinct units"
    )

    for arg in sys.argv[1:]:
        p = Path(arg)
        if not p.exists():
            print(f"  !! missing {p}")
            continue
        unknown = sorted(lbl for lbl in sheet_labels(p) if lbl not in mapping)
        status = "OK" if not unknown else f"{len(unknown)} UNKNOWN"
        print(f"  {status:>12}  {p.name}")
        for u in unknown:
            print(f"                 · {u!r} — add it to marking_topic_map.json")

    for e in errors:
        print(f"ERROR: {e}")
    if errors:
        print(f"FAILED: {len(errors)} dangling target(s)")
        return 1
    print("PASSED: every mapped label points at a live on-path unit.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
