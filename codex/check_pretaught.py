#!/usr/bin/env python3
"""
check_pretaught.py — is a grammar feature DEMANDED long before it is TAUGHT?

The fourth kind of sequencing bug, and the one no existing gate can see.

audit.py answers "does this unit use a word the path has not taught?" — but
articles, possessives, auxiliaries and pronouns all live in its GLUE set, so
every unit may use them freely and the audit stays silent. That is correct for
lexis and wrong for structure: on 2026-08-17 James found that a1_be_have
(path slot 2) teaches "I am a student" and "They are my friends", while
a1_articles sat at slot 18 and a1_possessives at slot 20. 84 and 64 sentences
respectively demanded a feature the path had not explained.

It matters because the grader is deliberately strict about exactly this:
practice-vocab.js lets a/an/the swap but never lets one be dropped, because
dropping it is the Czech-L1 error the app exists to teach. So a beginner was
being marked wrong for the most predictable error in the language, sixteen
units before anything taught it.

Features are matched by surface marker, which is crude, but the question is
only "is this owed by dozens of sentences or by none".

Ratchet, like audit.py: the total may fall freely and tightens the baseline;
it may not rise.

Usage: py -X utf8 codex/check_pretaught.py [--report]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from tree_path import teaching_path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
AUDIT_DIR = ROOT / "audit"
BASELINE = AUDIT_DIR / "pretaught-baseline.json"

W = re.compile(r"[A-Za-z']+")

# unit id -> (label, marker words). A sentence "demands" the feature if it
# contains any marker.
FEATURES: dict[str, tuple[str, set[str]]] = {
    "a1_articles": ("a / an / the", {"a", "an", "the"}),
    "a1_possessives": ("my / your / 's",
                       {"my", "your", "his", "her", "our", "their"}),
    "a1_object_pronouns": ("me / him / her", {"me", "him", "us", "them"}),
    "a1_can": ("can / can't", {"can", "cannot", "can't"}),
    "a1_there_is": ("there is / are", {"there"}),
    "a1_questions_negatives": ("do / does / don't",
                               {"do", "does", "don't", "doesn't"}),
    "a1_prepositions_place": ("in / on / under",
                              {"under", "behind", "between", "near",
                               "opposite"}),
}


def chunk_waivers(pack: dict) -> set[str]:
    """Feature unit ids this pack presents as fixed chunks.

    A pack early on the path may legitimately use `a` or `my` inside a phrase
    the learner memorises whole — "I am a student" — with the rule itself
    arriving later. That is a teaching choice, not a sequencing bug, and the
    grader stays strict either way: dropping the article is the Czech-L1 error
    the app exists to fix, so it is still marked wrong. Declaring the feature
    here says "chunk now, rule later" and takes the pack out of the count.
    (James, 2026-08-31.)

    Waived sentences are still reported, so a waiver cannot hide a growing
    problem — it only stops it failing the ratchet.
    """
    raw = pack.get("chunk_features")
    return {str(x) for x in raw} if isinstance(raw, list) else set()


def sentences(pack: dict) -> list[str]:
    out = []
    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if isinstance(it, dict) and isinstance(it.get("en"), str):
                out.append(it["en"])
    for s in pack.get("sentences") or []:
        if isinstance(s, dict) and isinstance(s.get("en"), str):
            out.append(s["en"])
    return out


def main() -> int:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by = {n["id"]: n for n in tree["nodes"]}
    later = set(tree.get("path_order_a2") or [])
    path = []
    for nid in teaching_path(tree):
        if nid in later:
            break
        path.append(nid)

    cache: dict[str, list[str]] = {}
    waived_by: dict[str, set[str]] = {}
    for nid in path:
        n = by.get(nid)
        if not n or n.get("status") != "live" or not n.get("content"):
            continue
        f = DATA / n["content"]
        if f.is_file():
            pack = json.loads(f.read_text(encoding="utf-8"))
            cache[nid] = sentences(pack)
            waived_by[nid] = chunk_waivers(pack)

    rows = []
    total = 0
    waived_total = 0
    waived_rows = []
    for unit, (label, markers) in FEATURES.items():
        if unit not in path:
            continue
        pos = path.index(unit)
        owed = 0
        waived = 0
        waived_packs = set()
        first = None
        for k, nid in enumerate(path[:pos]):
            hit = 0
            for s in cache.get(nid, []):
                if markers & {w.lower() for w in W.findall(s)}:
                    hit += 1
                    if unit not in waived_by.get(nid, set()) and first is None:
                        first = (k + 1, nid, s)
            if not hit:
                continue
            if unit in waived_by.get(nid, set()):
                waived += hit
                waived_packs.add(nid)
            else:
                owed += hit
        total += owed
        waived_total += waived
        if waived:
            waived_rows.append((waived, label, sorted(waived_packs)))
        rows.append((owed, pos + 1, unit, label, first))

    rows.sort(reverse=True)
    print(f"{'feature':<24}{'taught':>8}{'needed':>8}{'owed':>7}")
    for owed, pos, unit, label, first in rows:
        fp = first[0] if first else "-"
        print(f"  {label:<22}{pos:>8}{str(fp):>8}{owed:>7}")
        if first and owed >= 20:
            print(f'      first demanded by {first[1]}: "{first[2]}"')

    if waived_rows:
        waived_rows.sort(reverse=True)
        print()
        print("chunk-taught (declared, not counted):")
        for n, label, packs in waived_rows:
            print(f"  {label:<22}{n:>7}   {', '.join(packs)}")

    AUDIT_DIR.mkdir(exist_ok=True)
    prev = None
    if BASELINE.is_file():
        try:
            prev = json.loads(BASELINE.read_text(encoding="utf-8")).get("total")
        except Exception:
            prev = None

    print(f"\npretaught: {total} sentences demand a feature taught later")
    if prev is None:
        BASELINE.write_text(json.dumps({"total": total}, indent=1) + "\n",
                            encoding="utf-8")
        print(f"baseline written: {total}")
        return 0
    if total > prev:
        print(f"FAIL: {total} vs baseline {prev} — a feature moved later, or "
              f"new content demands one earlier. Move the unit, or re-lexify.")
        return 1
    if total < prev:
        BASELINE.write_text(json.dumps({"total": total}, indent=1) + "\n",
                            encoding="utf-8")
        print(f"baseline tightened: {prev} -> {total}")
    else:
        print(f"ratchet ok: {total} vs baseline {prev}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
