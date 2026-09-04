#!/usr/bin/env python3
"""
check_rewrite.py — vocab-leaf checks that lint.py cannot reach.

`lint.py` only reads `data/grammar/blocks/`, so the vocab leaves have never had
a machine check at all. These two both come from James playing b1_travel on
2026-09-04.

**Rewrite reconstruction.** In `use_mode: "rewrite"` the student replaces the
underlined words with the lemma. If replacing the underline does not produce
the target sentence, a CORRECT rewrite is marked wrong. He hit four of these in
one unit: "long wait" underlined but "long" required in the answer; "a cheap
place to stay" leaving a stranded article on uncountable *accommodation*;
"never know where we are" needing a silent never->always flip; "tell the hotel
we are not happy" underlining the hotel the answer then demanded back.

**C57 for leaves.** A sequel leaf (Travel 2, Work 3, Personality 2 …) opens
with a "You already know" card recapping its predecessor — the F8 pattern the
A2 leaves already use. lint.py's C57 cannot see vocab packs.

Read-only. Changes nothing.

    py -X utf8 codex/check_rewrite.py              # every leaf, ranked
    py -X utf8 codex/check_rewrite.py b1_travel    # one leaf, with the items
    py -X utf8 codex/check_rewrite.py --brief      # counts only
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOCAB = ROOT / "data/vocab/blocks"

ARTICLE = re.compile(r"\b(a|an|the)\s+", re.I)
PARENS = re.compile(r"\s*\([^)]*\)\s*")
RECAP_TITLE = re.compile(r"already know|you know|recap|už (znáš|víš)|opakov", re.I)


def bare(s: str) -> str:
    return PARENS.sub(" ", str(s or "")).strip()


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "").strip().rstrip(".?!").lower())


def cards_of(d: dict) -> list:
    intro = d.get("intro")
    if isinstance(intro, dict):
        return intro.get("cards") or []
    if isinstance(intro, list):
        return intro
    return []


def check_rewrites(d: dict) -> list:
    """Items where replacing the underline does not yield the answer."""
    out = []
    for u in d.get("use_sentences") or []:
        prompt, under = str(u.get("prompt") or ""), str(u.get("underline") or "")
        en, lemma = str(u.get("en") or ""), bare(u.get("lemma"))
        if not (prompt and under and en and lemma):
            continue
        if under.lower() not in prompt.lower():
            out.append((lemma, "underline is not in the prompt", prompt, en))
            continue
        i = prompt.lower().index(under.lower())
        built = norm(prompt[:i] + lemma + prompt[i + len(under):])
        target = norm(en)
        if built == target:
            continue
        # supplying an article the swap cannot carry is the student's job, not a fault
        if ARTICLE.sub("", built) == ARTICLE.sub("", target):
            continue
        out.append((lemma, "swap gives %r" % built, prompt, en))
    return out


def check_recap(d: dict, by_title: dict) -> list:
    """C57 for leaves: a sequel opens on what the student already has."""
    title = str(d.get("title") or "")
    m = re.match(r"^(.*?)\s*(?:([2-9])|\(?advanced\)?)\s*$", title, re.I)
    if not (m and m.group(1).strip()):
        return []
    base = m.group(1).strip().lower()
    prior = [t for t in by_title
             if t != title.lower()
             and re.sub(r"\s*(?:[1-9]|\(?advanced\)?)\s*$", "", t).strip() == base]
    if not prior:
        return []
    for i, c in enumerate(cards_of(d)[:3]):
        ttl = "%s %s" % (c.get("title") or "", c.get("title_cz") or "")
        if RECAP_TITLE.search(ttl):
            return []
        if i > 0 and base in ttl.lower():
            return []
    return [("C57", "no recap card for %r" % by_title[prior[0]], "", "")]


def main() -> int:
    brief = "--brief" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("-")]

    packs = {}
    for f in sorted(VOCAB.glob("*.json")):
        try:
            packs[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
    by_title = {str(d.get("title") or "").lower(): str(d.get("title") or "")
                for d in packs.values() if d.get("title")}

    rows = []
    for uid, d in packs.items():
        if only and uid not in only:
            continue
        hits = check_rewrites(d) + check_recap(d, by_title)
        if hits:
            rows.append((len(hits), uid, d.get("title"), hits))

    rows.sort(key=lambda r: -r[0])
    total = sum(r[0] for r in rows)
    if not rows:
        print("check_rewrite: clean")
        return 0

    print("VOCAB LEAVES — rewrite swaps that do not reconstruct, and missing recaps\n")
    for n, uid, title, hits in rows:
        lvl = str(packs[uid].get("level") or "?").upper()
        tag = "  [PROTECTED — do not touch]" if lvl in ("A1", "A2") else ""
        print("  %3d  %-2s  %-28s %s%s" % (n, lvl, uid, title or "", tag))
        if brief or (only and len(only) == 0):
            continue
        if only:
            for lemma, why, prompt, en in hits:
                print("        %-16s %s" % (lemma, why))
                if prompt:
                    print("           prompt: %s" % prompt)
                    print("           answer: %s" % en)
    print("\ncheck_rewrite: %d packs · %d findings" % (len(rows), total))
    return 1 if total else 0


if __name__ == "__main__":
    raise SystemExit(main())
