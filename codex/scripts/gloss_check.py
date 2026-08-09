#!/usr/bin/env python3
"""gloss_check.py — candidate screening for a new vocab pack.

Not a gate; a scratch tool for the authoring lane, like codex/_oracle.py.
Runs 39, 40 and 41 each re-derived this check by hand and run 41 found a real
bug in the hand version (see COMPOUND GLOSSES below), so it lives here now.

What it catches, all four the same defect in the end — one Czech prompt with
two defensible English answers, which grades a right answer wrong:

  1. EN ALREADY TAUGHT   the word is already an item in some other pack
  2. GLOSS COLLISION     the Czech gloss is already the gloss of another word
  3. SELF-GLOSS          the gloss equals its own English word (free Match
                         answer — the `album`/`studio` trap, run 40)
  4. COGNATE             the gloss is not identical but close enough to give
                         the tile away once accents are stripped
                         (hurricane/hurikan, bomb/bomba — run 41). A warning,
                         not a verdict: `portrait`/`portret` is a cognate that
                         run 41 shipped on purpose, because the only native
                         alternative was less known to the student.
  5. NEAR PAIR           two candidates in the same pack whose glosses or
                         English are near-identical strings (socha/socharstvi,
                         jed/jedovaty — run 41)

COMPOUND GLOSSES: existing packs gloss with slashes ("sila / moc",
"vyrobek / produkt"). Comparing whole strings misses that *sila* is the head of
both `strength` and `power`, so a candidate glossed plainly *sila* looks free
and is not. This splits on "/" and compares heads as well as wholes — that is
the bug run 41 hit on `force` and caught only by hand.

Usage:
    py -X utf8 codex/scripts/gloss_check.py EN=CZ [EN=CZ ...]
    py -X utf8 codex/scripts/gloss_check.py --file candidates.tsv   # en<TAB>cz
    py -X utf8 codex/scripts/gloss_check.py --pack b1_arts          # audit a
                                                                    # written pack
Exit status is always 0 — this reports, it does not gate.
"""
from __future__ import annotations

import difflib
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BLOCKS = ROOT / "data" / "vocab" / "blocks"

PARENS_RE = re.compile(r"\([^)]*\)")
NEAR = 0.80
COGNATE = 0.68


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if not unicodedata.combining(c))


def heads(gloss: str) -> list[str]:
    """Whole gloss plus each slash- or comma-separated head, normalised."""
    g = PARENS_RE.sub(" ", gloss).strip().lower()
    parts = [p.strip() for p in re.split(r"[/,]", g) if p.strip()]
    out = [g] + parts
    return [x for x in dict.fromkeys(out) if x]


def load(exclude: set[str]) -> tuple[dict, dict]:
    """en -> [packs], gloss-head -> [(pack, en)] across every vocab pack."""
    en_taught: dict[str, list[str]] = defaultdict(list)
    cz_gloss: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for f in sorted(BLOCKS.glob("*.json")):
        pack = json.loads(f.read_text(encoding="utf-8"))
        if pack.get("id") in exclude:
            continue
        for block in pack.get("blocks") or []:
            for it in block.get("items") or []:
                en = (it.get("en") or "").strip()
                cz = (it.get("cz") or "").strip()
                if en:
                    en_taught[en.lower()].append(pack["id"])
                for h in heads(cz):
                    cz_gloss[h].append((pack["id"], en))
    return en_taught, cz_gloss


def check(cands: list[tuple[str, str]], exclude: set[str]) -> int:
    en_taught, cz_gloss = load(exclude)
    print(f"corpus: {len(en_taught)} taught items · "
          f"{len(cz_gloss)} gloss heads · excluding {sorted(exclude) or '-'}\n")
    bad = 0
    for en, cz in cands:
        notes = []
        if en.lower() in en_taught:
            notes.append(f"EN ALREADY TAUGHT in {en_taught[en.lower()]}")
        for h in heads(cz):
            if h in cz_gloss:
                notes.append(f"GLOSS COLLISION '{h}' -> {cz_gloss[h][:3]}")
        if en.strip().lower() in {h for h in heads(cz)}:
            notes.append("SELF-GLOSS (free Match answer)")
        else:
            for h in heads(cz):
                r = difflib.SequenceMatcher(
                    None, strip_accents(en), strip_accents(h)).ratio()
                if r >= COGNATE:
                    notes.append(f"COGNATE '{h}' ({r:.2f}) — check it does not "
                                 f"give the tile away")
                    break
        print(f"  {en:14s} {cz:24s} {' | '.join(notes) if notes else 'clean'}")
        bad += bool(notes)

    for i in range(len(cands)):
        for j in range(i + 1, len(cands)):
            for a, b, what in (
                (cands[i][1].split("/")[0].strip(),
                 cands[j][1].split("/")[0].strip(), "gloss"),
                (cands[i][0], cands[j][0], "EN"),
            ):
                r = difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()
                if r >= NEAR:
                    print(f"  !! NEAR PAIR ({what}, {r:.2f}): {a} ~ {b} "
                          f"[{cands[i][0]} / {cands[j][0]}]")
                    bad += 1
    print(f"\n{bad} thing(s) to look at across {len(cands)} candidates.")
    return bad


def main() -> None:
    argv = sys.argv[1:]
    if not argv:
        raise SystemExit(__doc__)
    if argv[0] == "--pack":
        stem = argv[1]
        pack = json.loads((BLOCKS / f"{stem}.json").read_text(encoding="utf-8"))
        cands = [(it["en"], it.get("cz", ""))
                 for b in pack.get("blocks") or [] for it in b.get("items") or []]
        check(cands, exclude={pack.get("id")})
        return
    if argv[0] == "--file":
        rows = Path(argv[1]).read_text(encoding="utf-8").splitlines()
        cands = [tuple(r.split("\t")[:2]) for r in rows
                 if r.strip() and not r.startswith("#")]
    else:
        cands = [tuple(a.split("=", 1)) for a in argv]
    check([(a.strip(), b.strip()) for a, b in cands], exclude=set())


if __name__ == "__main__":
    main()
