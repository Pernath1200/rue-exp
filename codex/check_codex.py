#!/usr/bin/env python3
"""Codex-tag gate: every codex_unit tag in data/ must resolve against the
vendored rue-codex snapshot (codex/codex-units.json).

Usage:  py -X utf8 codex/check_codex.py        (0 unknown tags = pass)

The snapshot is a vendored copy of rue-codex's unit-id list — the cloud
routine has no access to the rue-codex repo, so the list travels with the
app. If this gate fails on a unit you genuinely need, the fix is upstream:
add the unit row in rue-codex, rebuild there, then refresh the snapshot.
Do NOT invent unit ids here.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = Path(__file__).resolve().parent / "codex-units.json"
DATA = ROOT / "data"


def collect_tags():
    found = {}  # unit_id -> [files]
    for path in sorted(DATA.rglob("*.json")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if '"codex_unit"' not in text:
            continue
        obj = json.loads(text)
        for tag in walk(obj):
            found.setdefault(tag, []).append(path.relative_to(ROOT).as_posix())
    return found


def walk(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "codex_unit" and isinstance(v, str):
                yield v
            else:
                yield from walk(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from walk(item)


def main():
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    canonical = set(snap["unit_ids"])
    found = collect_tags()

    unknown = {t: fs for t, fs in found.items() if t not in canonical}
    print(f"codex-tag gate: {len(found)} distinct tag(s) in data/, "
          f"{len(canonical)} canonical unit(s) (snapshot {snap['snapshot_date']})")
    if unknown:
        for tag in sorted(unknown):
            files = unknown[tag]
            shown = ", ".join(files[:3]) + (" …" if len(files) > 3 else "")
            print(f"  UNKNOWN: {tag}  ({shown})")
        print(f"FAILED: {len(unknown)} tag(s) not in rue-codex. "
              f"Add the unit upstream in rue-codex, then refresh codex/codex-units.json.")
        return 1
    print("PASSED: all codex_unit tags resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
