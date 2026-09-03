#!/usr/bin/env python3
"""
check_dupes.py — is a word introduced twice inside A1+A2?

A word is *introduced* when it appears in a pack's blocks[].items[] as `en`.
Intro tiles are recycling, not introduction ("You already know" exists exactly
to show a word again), so they are ignored. Walking the course in teaching-path
order, the first pack to introduce a word owns it and every later introduction
is a duplicate — the F7 rule, checked instead of remembered.

Four counts, each ratcheted like audit.py: they may fall freely and tighten
the baseline; they may not rise.

  duplicates     two items with the same `en`. A sense mark makes two items
                 different ("watch" vs "watch (wrist)") and is not counted.

  hollow marks   a sense mark that distinguishes nothing: two items whose `en`
                 differs only by the gloss AND whose Czech senses are identical
                 ("dark" = tmavý in a1_nature, "dark (hair)" = tmavý in
                 a2_appearance). A duplicate wearing a disguise.

  off-path live  a live unit with content that no level path lists. The meter
                 (js/progress.js levelUnitStats) counts every live unit at a
                 level; Do next walks path_order_<level>. A unit in one and not
                 the other is unreachable content inflating the denominator —
                 A2 read 60/63 for exactly this reason.

  uncovered cz   two items sharing a Czech prompt with no entry in
                 data/senses.json and no synonym mapping — the student is asked
                 to produce one of two English words with nothing to choose by.
                 Within one pack that board is unanswerable; across packs it is
                 milder, so the two are counted but reported apart.

Scope is A1+A2 by design. B1 and B2 re-teach A2 words deliberately (borrow
arrives again in b2_false_friends as a false friend), so a course-wide version
of this gate would fire on the curriculum working as intended.

Usage: py -X utf8 codex/check_dupes.py [--report]
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from tree_path import teaching_path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
AUDIT_DIR = ROOT / "audit"
BASELINE = AUDIT_DIR / "dupes-baseline.json"

LEVELS = ("A1", "A2")
PATH_KEY = {"A1": "path_order", "A2": "path_order_a2", "B1": "path_order_b1",
            "B2": "path_order_b2", "C1": "path_order_c1"}
PAREN = re.compile(r"\s*\([^)]*\)")


def bare(en: str) -> str:
    return PAREN.sub("", en).strip().lower()


def cz_senses(cz: str) -> set[str]:
    """A slash separates equally-valid senses; a paren gloss is part of the
    prompt the student reads, so it stays."""
    return {s.strip().lower() for s in cz.split("/") if s.strip()}


def load_packs() -> list[tuple[str, dict]]:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree["nodes"]}
    out = []
    for nid in teaching_path(tree):
        n = by_id.get(nid)
        if not n or n.get("status") != "live" or not n.get("content"):
            continue
        if n.get("domain") != "vocab" or (n.get("levels") or ["?"])[0] not in LEVELS:
            continue
        f = DATA / n["content"]
        if f.is_file():
            d = json.loads(f.read_text(encoding="utf-8"))
            out.append((d.get("id", nid), d))
    return out


def off_path_live(tree: dict) -> list[tuple[str, str]]:
    """Live units with content that no path for their own level(s) lists.

    Checked at every level, not just A1+A2: the bug is structural, and a unit
    that is live-but-unlisted is unreachable wherever it sits.
    """
    out = []
    paths = {lv: set(tree.get(key) or []) for lv, key in PATH_KEY.items()}
    for n in tree.get("nodes") or []:
        if n.get("status") != "live" or not n.get("content") or n.get("sitting_of"):
            continue
        levels = [lv for lv in (n.get("levels") or []) if lv in paths]
        if not levels:
            continue
        if not any(n["id"] in paths[lv] for lv in levels):
            out.append((n["id"], "/".join(levels)))
    return out


def items_of(d: dict):
    for b in d.get("blocks") or []:
        for it in b.get("items") or []:
            if isinstance(it, dict) and isinstance(it.get("en"), str) and isinstance(it.get("cz"), str):
                yield it


def sense_map():
    try:
        sj = json.loads((DATA / "senses.json").read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}, {}
    senses = {k.strip().lower(): {str(x).strip().lower() for x in v}
              for k, v in (sj.get("senses") or {}).items()}
    syn = {str(k).strip().lower(): str(v).strip().lower()
           for k, v in (sj.get("synonyms") or {}).items()}
    return senses, syn


def main() -> int:
    report = "--report" in sys.argv
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    stray = off_path_live(tree)
    packs = load_packs()
    senses, syn = sense_map()

    exact: dict[str, list[tuple[str, str]]] = defaultdict(list)   # en -> [(pack, cz)]
    family: dict[str, list[tuple[str, str, str]]] = defaultdict(list)  # bare -> [(pack, en, cz)]
    per_pack_cz: list[tuple[str, str, list[str]]] = []
    course_cz: dict[str, set[tuple[str, str]]] = defaultdict(set)
    n_items = 0

    for pid, d in packs:
        seen_cz: dict[str, list[str]] = defaultdict(list)
        for it in items_of(d):
            n_items += 1
            en, cz = it["en"].strip(), it["cz"].strip()
            exact[en.lower()].append((pid, cz))
            family[bare(en)].append((pid, en, cz))
            for s in cz_senses(cz):
                seen_cz[s].append(en)
                course_cz[s].add((en, pid))
        for s, ens in seen_cz.items():
            if len(set(ens)) > 1:
                per_pack_cz.append((pid, s, sorted(set(ens))))

    dupes = {en: v for en, v in exact.items() if len(v) > 1}

    hollow = []
    for b, v in family.items():
        if len({en for _, en, _ in v}) < 2:
            continue
        by_en = {}
        for pid, en, cz in v:
            by_en.setdefault(en, (pid, cz_senses(cz)))
        forms = list(by_en.items())
        for i in range(len(forms)):
            for j in range(i + 1, len(forms)):
                (en_a, (pid_a, cz_a)), (en_b, (pid_b, cz_b)) = forms[i], forms[j]
                if cz_a == cz_b:
                    hollow.append((b, en_a, pid_a, en_b, pid_b, sorted(cz_a)))

    def covered(cz: str, ens: set[str]) -> bool:
        low = {e.lower() for e in ens}
        if cz in senses and low <= senses[cz]:
            return True
        return len({syn.get(e, e) for e in low}) == 1

    within = [(pid, cz, ens) for pid, cz, ens in per_pack_cz if not covered(cz, set(ens))]
    across = []
    for cz, v in course_cz.items():
        ens = {en for en, _ in v}
        if len(ens) > 1 and not covered(cz, ens):
            across.append((cz, sorted(v)))

    counts = {"duplicates": len(dupes), "hollow_marks": len(hollow),
              "uncovered_cz_within": len(within), "uncovered_cz_across": len(across),
              "off_path_live": len(stray)}

    print(f"check_dupes: {len(packs)} A1+A2 vocab packs · {n_items} introductions")
    if dupes or report:
        for en, v in sorted(dupes.items()):
            print(f"  DUPLICATE  {en!r}: " + " · ".join(f"{pid} ({cz})" for pid, cz in v))
    if hollow or report:
        for b, en_a, pid_a, en_b, pid_b, cz in hollow:
            print(f"  HOLLOW     {en_a!r} [{pid_a}] vs {en_b!r} [{pid_b}] — both {' / '.join(cz)}")
    if within or report:
        for pid, cz, ens in within:
            print(f"  CZ (pack)  {pid}: {cz!r} → {', '.join(ens)}")
    if across or report:
        for cz, v in across:
            print(f"  CZ (course) {cz!r}: " + " · ".join(f"{en} [{pid}]" for en, pid in v))
    if stray or report:
        for nid, lv in stray:
            print(f"  OFF-PATH   {nid} ({lv}) — live with content, no path lists it")

    AUDIT_DIR.mkdir(exist_ok=True)
    prev = None
    if BASELINE.is_file():
        try:
            prev = json.loads(BASELINE.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            prev = None

    summary = " · ".join(f"{k.replace('_', ' ')} {v}" for k, v in counts.items())
    if prev is None:
        BASELINE.write_text(json.dumps(counts, indent=1) + "\n", encoding="utf-8")
        print(f"check_dupes: {summary} — baseline written")
        return 0

    worse = {k: (v, prev.get(k, 0)) for k, v in counts.items() if v > prev.get(k, 0)}
    if worse:
        detail = ", ".join(f"{k} {now} vs baseline {was}" for k, (now, was) in worse.items())
        hint = ("Add it to its level's path_order, or park it."
                if "off_path_live" in worse else
                "The first pack owns the word; recycle it as a "
                "'You already know' tile instead.")
        print(f"check_dupes: FAIL — {detail}. {hint}")
        return 1
    if any(v < prev.get(k, 0) for k, v in counts.items()):
        BASELINE.write_text(json.dumps(counts, indent=1) + "\n", encoding="utf-8")
        print(f"check_dupes: {summary} — baseline tightened")
        return 0
    print(f"check_dupes: {summary} — ratchet ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
