#!/usr/bin/env python3
"""
preflight.py — every check that can see a unit, in one card, before James plays it.

I10 said pre-smoke is `lint.py` plus an 8-line card. That was right when lint was
the only check. There are now seven, and on 2026-09-05 James hit four faults in one
session that three of them could see. This is the I10 replacement: same shape, same
seconds, all the checks.

    py -X utf8 codex/preflight.py b1_wishes        # one unit, the card
    py -X utf8 codex/preflight.py b1_wishes -v     # with every finding
    py -X utf8 codex/preflight.py --unplayed       # everything not ticked in INSPECTED
    py -X utf8 codex/preflight.py --level b1

Reports. Never blocks, never edits, never ticks.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODEX = ROOT / "codex"
GRAMMAR = ROOT / "data/grammar/blocks"
VOCAB = ROOT / "data/vocab/blocks"
PY = [sys.executable, "-X", "utf8"]

# name, script, how to read a finding out of its output
CHECKS = [
    ("lint",     "lint.py",                   r"^\s*\[\d+\]\s+(EXACT|CANDIDATE)"),
    ("gloss",    "check_gloss.py",            r"^\s+(C6|C58)\s"),
    ("rules",    "check_rules.py",            r"^\s+([A-Z]\d+)\s+(item \d+|pack)\s"),
    ("rewrite",  "check_rewrite.py",          r"^\s+(F9|[a-z].*swap gives|.*underline)"),
    ("texture",  "check_sentence_texture.py", r"^\s*(FLAT|THIN)\b"),
]


def run(script: str, unit: str) -> str:
    try:
        p = subprocess.run(PY + [str(CODEX / script), unit], capture_output=True,
                           text=True, encoding="utf-8", errors="replace", timeout=180)
        return (p.stdout or "") + (p.stderr or "")
    except Exception as exc:
        return "PREFLIGHT-ERROR %s" % exc


def kind(unit: str) -> str:
    if (GRAMMAR / (unit + ".json")).is_file():
        return "grammar"
    if (VOCAB / (unit + ".json")).is_file():
        return "vocab"
    return ""


def pack_of(unit: str):
    for folder in (GRAMMAR, VOCAB):
        f = folder / (unit + ".json")
        if f.is_file():
            return json.loads(f.read_text(encoding="utf-8"))
    return None


def survey(unit: str):
    """(findings by check, lines by check)."""
    counts, lines = {}, {}
    for name, script, pattern in CHECKS:
        out = run(script, unit)
        if "PREFLIGHT-ERROR" in out:
            counts[name], lines[name] = None, [out.strip()[:120]]
            continue
        hits = [l.rstrip() for l in out.splitlines() if re.search(pattern, l)]
        counts[name], lines[name] = len(hits), hits
    return counts, lines


def card(unit: str, verbose=False) -> int:
    d = pack_of(unit)
    if d is None:
        print("preflight: no pack called %r" % unit)
        return 1
    k = kind(unit)
    items = sum(len(b.get("items") or []) for b in (d.get("blocks") or []))
    intro = d.get("intro")
    cards = (intro.get("cards") if isinstance(intro, dict) else intro) or []
    counts, lines = survey(unit)

    print("%s · %s · %s · %d items · %d intro cards"
          % (unit, str(d.get("level") or "?").upper(), k, items, len(cards)))
    for name, _, _ in CHECKS:
        n = counts.get(name)
        if n is None:
            print("  %-9s could not run" % name)
        else:
            print("  %-9s %s" % (name, "clean" if n == 0 else "%d" % n))
        if verbose and n:
            for l in lines[name][:12]:
                print("      %s" % l.strip()[:104])
    total = sum(n for n in counts.values() if n)
    print("  %s" % ("READY" if not total else "%d finding%s before you play"
                    % (total, "" if total == 1 else "s")))
    return 0


def unplayed() -> list:
    """Rows in INSPECTED.md whose first box is not ticked."""
    p = CODEX / "INSPECTED.md"
    if not p.is_file():
        return []
    out = []
    for m in re.finditer(r"^- \[([ x])\]\[[ x]\]\s+`([^`]+)`", p.read_text(encoding="utf-8"), re.M):
        if m.group(1) != "x" and kind(m.group(2)):
            out.append(m.group(2))
    return out


def sweep(units: list) -> int:
    rows, clean = [], 0
    for u in units:
        counts, lines = survey(u)
        total = sum(n for n in counts.values() if n)
        if total:
            rows.append((total, u, counts, lines))
        else:
            clean += 1
    rows.sort(key=lambda r: -r[0])
    if rows:
        print("UNITS WITH FINDINGS BEFORE YOU PLAY THEM\n")
        for total, u, counts, lines in rows:
            named = " · ".join("%s %d" % (n, c) for n, c in counts.items() if c)
            print("  %3d  %-30s %s" % (total, u, named))
    print("\npreflight: %d unit%s · %d with findings · %d clean"
          % (len(units), "" if len(units) == 1 else "s", len(rows), clean))
    return 0


def main() -> int:
    argv = sys.argv[1:]
    verbose = "-v" in argv or "--verbose" in argv
    level = None
    if "--level" in argv:
        i = argv.index("--level")
        level = argv[i + 1].lower()
        argv = argv[:i] + argv[i + 2:]
    names = [a for a in argv if not a.startswith("-")]

    if "--unplayed" in argv:
        units = unplayed()
    elif level:
        units = []
        for folder in (GRAMMAR, VOCAB):
            for f in sorted(folder.glob("*.json")):
                d = json.loads(f.read_text(encoding="utf-8"))
                if str(d.get("level") or "").lower() == level:
                    units.append(f.stem)
    elif names:
        if len(names) == 1:
            return card(names[0], verbose)
        units = names
    else:
        print(__doc__.strip().splitlines()[-6])
        return 1
    return sweep(units)


if __name__ == "__main__":
    raise SystemExit(main())
