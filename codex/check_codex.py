#!/usr/bin/env python3
"""Codex-tag + hang-integrity gate.

Two layers, one exit code:

1. TAG LAYER (original): every codex_unit tag in data/ must resolve against
   the vendored rue-codex snapshot (codex/codex-units.json).
2. HANG LAYER (2026-08-29): one hang, not two maps. For every grammar topic:
     root == tree_part == nodes-grammar.json root == pack codex_unit's unit
     == that Codex unit's tree_part (from the snapshot).
   Catches WRONG HOUSE (Degree-class: a legal G_* id on the wrong root),
   SPLIT HANG (tree.json vs nodes-grammar.json vs pack disagree), and
   MISSING CODEX (live grammar topic with no codex_unit — tap_root exempt:
   Foundation has no G_* on purpose).

Known findings live in codex/hang-baseline.json with the audit verdicts —
they print as "known" and do not fail the gate. Anything NOT in the baseline
fails. When a baselined finding is fixed, the gate says so: remove the entry
(the baseline only ever shrinks).

Vocab V_* tags get the tag layer only — houses/trunk hang is a different
layer and not checked here.

Usage:  py -X utf8 codex/check_codex.py        (exit 0 = pass)

The snapshot is a vendored copy of rue-codex's unit list — the cloud
routine has no access to the rue-codex repo, so the list travels with the
app. If this gate fails on a unit you genuinely need, the fix is upstream:
add the unit row in rue-codex, rebuild there, then refresh the snapshot.
Do NOT invent unit ids here. Never change a root without the matching G_*.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = Path(__file__).resolve().parent / "codex-units.json"
BASELINE = Path(__file__).resolve().parent / "hang-baseline.json"
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


def load_pack(node):
    """Resolve a topic node's pack file. Returns dict or None (no pack yet)."""
    rel = node.get("content") or ""
    if not rel:
        return None
    for cand in (DATA / rel,
                 DATA / "grammar" / rel,
                 DATA / "grammar" / "blocks" / Path(rel).name):
        if cand.exists():
            return json.loads(cand.read_text(encoding="utf-8"))
    return None


def hang_findings(unit_tree_parts):
    """Yield (key, message) per finding. key = '<check>:<id>' for baselining."""
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    ngrammar = json.loads((DATA / "nodes-grammar.json").read_text(encoding="utf-8"))
    nby = {n["id"]: n for n in ngrammar.get("nodes", [])}

    topics = [n for n in tree["nodes"]
              if n.get("domain") == "grammar" and n.get("kind") == "topic"]
    for n in topics:
        nid = n["id"]
        root = n.get("root")
        unit = n.get("codex_unit")

        # internal: root and tree_part are one field in spirit
        if n.get("tree_part") != root:
            yield ("split:" + nid,
                   f"tree.json root={root} but tree_part={n.get('tree_part')}")

        # wrong house: legal G_* on the wrong root (the Degree bug)
        if unit and unit.startswith("G_"):
            want = unit_tree_parts.get(unit)
            if want is not None and want != root:
                yield ("wrong-house:" + nid,
                       f"root={root} but {unit} lives on {want}")

        # missing codex: live topic, not tap (Foundation is excluded on purpose)
        if (n.get("status") == "live" and root != "tap_root" and not unit):
            yield ("missing-codex:" + nid, f"live on {root} with no codex_unit")

        # split vs nodes-grammar.json — root always; tree_part/codex_unit only
        # when the source record carries the field (the tree build derives
        # tree_part from root, so absence there is not a split)
        m = nby.get(nid)
        if m is None:
            yield ("split:" + nid, "topic absent from nodes-grammar.json")
        else:
            for field in ("root", "tree_part", "codex_unit"):
                if field != "root" and field not in m:
                    continue
                if m.get(field) != n.get(field):
                    yield ("split:" + nid,
                           f"nodes-grammar {field}={m.get(field)} "
                           f"vs tree.json {n.get(field)}")

        # split vs pack
        pack = load_pack(n)
        if pack is not None and unit:
            pcu = pack.get("codex_unit")
            if pcu is None:
                yield ("pack-untagged:" + nid,
                       f"pack has no codex_unit (tree.json says {unit})")
            elif pcu != unit:
                yield ("split:" + nid,
                       f"pack codex_unit={pcu} vs tree.json {unit}")


def main():
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    canonical = set(snap["unit_ids"])
    unit_tree_parts = snap.get("unit_tree_parts")
    baseline = (json.loads(BASELINE.read_text(encoding="utf-8"))
                if BASELINE.exists() else {})
    baseline = {k: v for k, v in baseline.items() if not k.startswith("_")}
    failed = False

    # --- tag layer ---
    found = collect_tags()
    unknown = {t: fs for t, fs in found.items() if t not in canonical}
    print(f"codex-tag gate: {len(found)} distinct tag(s) in data/, "
          f"{len(canonical)} canonical unit(s) (snapshot {snap['snapshot_date']})")
    if unknown:
        failed = True
        for tag in sorted(unknown):
            files = unknown[tag]
            shown = ", ".join(files[:3]) + (" …" if len(files) > 3 else "")
            print(f"  UNKNOWN: {tag}  ({shown})")
        print(f"  {len(unknown)} tag(s) not in rue-codex. Add the unit upstream, "
              f"then refresh codex/codex-units.json.")

    # --- hang layer ---
    if unit_tree_parts is None:
        print("hang gate: SKIPPED — snapshot has no unit_tree_parts; "
              "refresh codex/codex-units.json from rue-codex.")
    else:
        findings = list(hang_findings(unit_tree_parts))
        keys = {k for k, _ in findings}
        new = [(k, msg) for k, msg in findings if k not in baseline]
        known = [(k, msg) for k, msg in findings if k in baseline]
        fixed = [k for k in baseline if k not in keys]
        print(f"hang gate: {len(findings)} finding(s) — "
              f"{len(new)} new, {len(known)} known (baselined)")
        for k, msg in sorted(known):
            print(f"  known  {k}  {msg}  [{baseline[k]}]")
        for k, msg in sorted(new):
            print(f"  NEW    {k}  {msg}")
        for k in sorted(fixed):
            print(f"  fixed  {k} — no longer fails; remove it from "
                  f"codex/hang-baseline.json")
        if new:
            failed = True
            print(f"  {len(new)} new hang finding(s). One hang, not two maps: "
                  f"retag all files together or baseline with a verdict.")

    if failed:
        print("FAILED")
        return 1
    print("PASSED: all codex_unit tags resolve; no new hang findings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
