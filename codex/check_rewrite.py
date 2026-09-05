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

**F9 recap page.** A vocab leaf whose topic was taught earlier opens on one
page of those earlier words — some as picture tiles, the rest as a list — then
introduces the new words. The predecessors are named by the pack's own
`recaps` field, so nothing here guesses from a title.

The first version of this check guessed, and was green on six breaches. It
only fired on a numbered title (so "Knowledge & travel" was invisible); it
passed on a matching card title alone (so Travel's four tiles passed, and
three of those four were words the unit then teaches); and it took any of the
first three card titles containing the theme word as a recap (so Work 3
passed on a card called "The working day"). James, 2026-09-05: *"for each
vocab unit the first page does some review, showing previously covered words
in that topic, then it introduces the new words — I have already told you to
do this."*

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
WANT_SHOWN = 6          # one page: some tiles, the rest in a list
SPLIT_CELL = re.compile("[·,;/|]")
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


def lemmas_of(d: dict) -> list:
    """Every word this pack teaches as new."""
    out = []
    for b in d.get("blocks") or []:
        for it in b.get("items") or []:
            en = str(it.get("en") or "").strip()
            if en:
                out.append(en)
    return out


def sentence_text(d: dict) -> str:
    parts = []
    for s in d.get("sentences") or []:
        parts.append(str(s.get("en") or s.get("sentence") or ""))
    for s in d.get("use_sentences") or []:
        parts += [str(s.get("en") or ""), str(s.get("prompt") or "")]
    return " ".join(parts).lower()


def card_columns(c: dict) -> list:
    """The card's word groups: the picture board, then each table column.

    Columns matter because a recap page is allowed to pair old with new
    ("you know (A2)" beside "now you add"). Only the columns that are mostly
    earlier words are read as review; the new column is the unit's own job.
    """
    groups = [[norm(bare(p.get("en"))) for p in c.get("pictures") or []]]
    tables = ([c["table"]] if c.get("table") else []) + list(c.get("tables") or [])
    for t in tables:
        rows = t.get("rows") or []
        width = max((len(r) for r in rows), default=0)
        for i in range(width):
            col = []
            for r in rows:
                if i < len(r):
                    for w in re.split(SPLIT_CELL, str(r[i])):
                        w = norm(bare(w))
                        if w:
                            col.append(w)
            groups.append(col)
    return [g for g in groups if g]


def path_index(packs: dict) -> dict:
    """pack stem -> position on the teaching path, so "earlier" is the real order."""
    try:
        sys.path.insert(0, str(ROOT / "codex"))
        from tree_path import teaching_path
        tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
        order = teaching_path(tree)
    except Exception:
        return {}
    by_node = {}
    for k, d in packs.items():
        n = d.get("tree_node")
        if n:
            by_node[n] = k
    out = {}
    for i, nid in enumerate(order):
        k = by_node.get(nid)
        if k and k not in out:
            out[k] = i
    return out


def taught_earlier(d: dict, packs: dict, order: dict) -> set:
    """Every word a pack earlier on the path taught.

    Earlier means earlier on the teaching path, not merely a lower level: Money
    sits after Travel 2 and News, so reviewing *deposit* or *tax* is legitimate.
    """
    here = order.get(str(d.get("id") or ""), None)
    out = set()
    for k, pd in packs.items():
        pos = order.get(k)
        if pos is None:
            if str(pd.get("level") or "").upper() not in ("A1", "A2") and k not in (d.get("recaps") or []):
                continue
        elif here is not None and pos >= here:
            continue
        for w in lemmas_of(pd):
            out.add(norm(bare(w)))
    return out


def recycled_set(d: dict, packs: dict) -> tuple:
    """Earlier words this pack's own sentences still use and does not re-teach.

    F8's definition of the review set, minus anything the pack teaches as new:
    a word cannot be both "you already know this" and this unit's new material.
    """
    preds = d.get("recaps")
    if preds is None:
        return None, []
    text = sentence_text(d)
    own = {norm(bare(w)) for w in lemmas_of(d)}
    seen, out = set(), []
    for p in preds:
        pd = packs.get(p)
        if pd is None:
            out.append(("?" + p, p))
            continue
        for w in lemmas_of(pd):
            base = norm(bare(w))
            if not base or base in own or base in seen:
                continue
            raw = str(w).strip()
            if raw[-1:] in ".?!" or raw.count(" ") > 2:
                continue                       # a chunk pack's sentence, not a word
            if re.search(r"\b" + re.escape(base) + r"\b", text):
                seen.add(base)
                out.append((w, p))
    return preds, out


def check_recap(d: dict, packs: dict) -> list:
    """F9: the first page reviews the topic's earlier words, and only those."""
    if not lemmas_of(d):
        return []                      # a pooled check shell teaches nothing
    preds, recycled = recycled_set(d, packs)
    if preds is None:
        # A1/A2 are hand-checked and protected; the field is only asked of B1 and up
        if str(d.get("level") or "").upper() in ("", "A1", "A2"):
            return []
        return [("F9", "no `recaps` field — nothing can check this leaf's first page", "", "")]
    missing = [w for w, p in recycled if w.startswith("?")]
    if missing:
        return [("F9", "recaps names %s, which is not a pack" % ", ".join(missing), "", "")]
    if len(recycled) < 3:
        return []                      # F8: fewer than three tiles, skip the page

    cs = cards_of(d)
    first = cs[0] if cs else {}
    ttl = "%s %s" % (first.get("title") or "", first.get("title_cz") or "")
    if not RECAP_TITLE.search(ttl):
        later = [i for i, c in enumerate(cs)
                 if RECAP_TITLE.search("%s %s" % (c.get("title") or "", c.get("title_cz") or ""))]
        where = "on card %d, not first" % later[0] if later else "nowhere in the intro"
        return [("F9", "no recap page (%s); %d earlier words come back here: %s"
                 % (where, len(recycled), ", ".join(w for w, _ in recycled[:8])), "", "")]

    groups = card_columns(first)
    own = {norm(bare(w)) for w in lemmas_of(d)}
    pics = set(groups[0]) if first.get("pictures") else set()
    review, out = set(pics), []

    # a table column that is mostly this unit's own words is the "now you add"
    # side of an old/new pairing, not part of the review
    for col in (groups[1:] if first.get("pictures") else groups):
        if len(set(col) & own) * 2 < len(set(col)):
            review |= set(col)

    claimed = sorted(review & own)
    if claimed:
        out.append(("F9", "recap page shows %s — this unit teaches %s as new"
                    % (", ".join(claimed), "them" if len(claimed) > 1 else "it"), "", ""))

    # the page has to SHOW earlier words, not just be titled as if it did
    earlier = taught_earlier(d, packs, path_index(packs))
    named = sorted(w for w in review if w in earlier)
    if len(named) < WANT_SHOWN:
        out.append(("F9", "recap page shows %d word%s an earlier unit taught (wants %d); "
                          "%d earlier words come back in this pack"
                    % (len(named), "" if len(named) == 1 else "s", WANT_SHOWN, len(recycled)), "", ""))
    return out


def main() -> int:
    brief = "--brief" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("-")]

    packs = {}
    for f in sorted(VOCAB.glob("*.json")):
        try:
            packs[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
    rows = []
    for uid, d in packs.items():
        if only and uid not in only:
            continue
        hits = check_rewrites(d) + check_recap(d, packs)
        if hits:
            rows.append((len(hits), uid, d.get("title"), hits))

    rows.sort(key=lambda r: -r[0])
    total = sum(r[0] for r in rows)
    if not rows:
        print("check_rewrite: clean")
        return 0

    print("VOCAB LEAVES — rewrite swaps that do not reconstruct, and F9 recap pages\n")
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
