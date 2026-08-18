#!/usr/bin/env python3
"""
check_playable.py — would a student actually get a practice ladder?

This gate exists because 100+ grammar units shipped authored-but-unplayable:
the engine read `pack.match/quiz/type_items/use_items` and `pack.intro` as an
array, while every pack stores `blocks[].items[]` and `intro.cards`. Lint was
green, the audit was green, and the ladder rendered empty while reporting a
pass. Content correctness gates cannot see this class of defect — only a gate
that simulates the engine can.

It mirrors js/pack-adapt.js. If that file changes shape, change this too.

Checks, per live pack on a course path:
  - intro cards resolve (warn if none)
  - match bank non-empty
  - quiz bank non-empty AND every quiz item has exactly ONE correct option
  - type bank non-empty
  - use bank non-empty

Also runs the quiz single-answer check: an option that any accept-form of the
item would also grade correct is a second correct answer.

Exit 1 on any ERROR.
Usage: py -X utf8 codex/check_playable.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

PUNCT_RE = re.compile(r"[!?.,;:\"'()]")

errors: list[str] = []
warnings: list[str] = []


def key(s) -> str:
    if s is None:
        return ""
    return re.sub(r"\s+", " ", PUNCT_RE.sub("", str(s).lower())).strip()


def flat_items(pack: dict) -> list[dict]:
    out = []
    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if isinstance(it, dict):
                out.append(it)
    return out


def accepted_keys(it: dict) -> set[str]:
    out = set()
    vals = [it.get("gap_answer")] + list(it.get("gap_accepts") or []) + list(
        it.get("accepts") or []
    )
    for v in vals:
        k = key(v)
        if k:
            out.add(k)
    return out


def choices_for(it: dict, siblings: list[dict]):
    answer = it.get("gap_answer")
    if not key(answer):
        return None
    qo = it.get("quiz_options")
    if isinstance(qo, list) and len(qo) >= 2:
        seen, opts = set(), []
        for o in qo:
            k = key(o)
            if not k or k in seen:
                continue
            seen.add(k)
            opts.append(o)
        if any(key(o) == key(answer) for o in opts) and len(opts) >= 2:
            return opts
        return None
    banned = accepted_keys(it)
    seen = {key(answer)}
    distractors = []
    for s in siblings:
        if len(distractors) >= 3:
            break
        cand = s.get("gap_answer")
        k = key(cand)
        if not k or k in seen or k in banned:
            continue
        seen.add(k)
        distractors.append(cand)
    if not distractors:
        return None
    return [answer] + distractors


def check_pack(pid: str, pack: dict) -> None:
    items = flat_items(pack)
    intro = pack.get("intro")
    cards = intro if isinstance(intro, list) else (intro or {}).get("cards") or []
    seq = (pack.get("check") or {}).get("sequence")
    ladder = pack.get("ladder") or {}

    # Word-formation packs (2026-08-18): typeModeOf returns "root_word" and the
    # engine renders the capitalised root beside the gap in Quiz AND Type. An
    # item without a root still *renders* — as a bare cloze no student can
    # answer — which is exactly the authored-but-unplayable class this gate
    # exists for.
    if pack.get("kind") == "word_formation":
        for i, it in enumerate(items):
            if not str(it.get("root") or "").strip():
                errors.append(
                    f"{pid} item {i}: word_formation item has no `root` — "
                    f"renders as an unanswerable bare cloze"
                )

    def wants_check(phase: str) -> bool:
        """match / quiz — the phases inside Check."""
        if ladder.get(phase) is False:
            return False
        return not isinstance(seq, list) or phase in seq

    def wants(stage: str) -> bool:
        """type / use — whole stages, governed by `ladder` only."""
        return ladder.get(stage) is not False

    with_gap = [it for it in items if key(it.get("gap_answer")) and it.get("gap")]
    orderable = [
        it for it in items
        if isinstance(it.get("tokens"), list) and len(it["tokens"]) >= 2
    ]

    if not cards:
        warnings.append(f"{pid}: no intro cards")

    pairs_n = len([it for it in items if it.get("en") and it.get("cz")])
    match_n = pairs_n if wants_check("match") else 0
    use_n = pairs_n if wants("use") else 0
    type_n = len(with_gap) if wants("type") else 0
    order_n = len(orderable) if wants_check("order_click") else 0

    quiz_n = 0
    if wants_check("quiz"):
        for i, it in enumerate(with_gap):
            ch = choices_for(it, [s for s in with_gap if s is not it])
            if ch is None:
                continue
            quiz_n += 1
            # single-answer check: no NON-answer option may also be accepted
            acc = accepted_keys(it)
            ans_k = key(it.get("gap_answer"))
            extra = [o for o in ch if key(o) != ans_k and key(o) in acc]
            if extra:
                errors.append(
                    f"{pid} quiz item {i}: {len(extra) + 1} correct options "
                    f"({it.get('gap_answer')!r} + {extra!r})"
                )

    # Stages the engine actually implements. A pack asking for anything else
    # silently loses that drill.
    IMPLEMENTED = {"match", "quiz", "order_click"}
    if isinstance(seq, list):
        for s in seq:
            if s not in IMPLEMENTED:
                warnings.append(
                    f"{pid}: check.sequence asks for {s!r} — engine has no such "
                    f"stage; that drill is silently skipped"
                )

    if wants_check("match") and match_n == 0 and items:
        errors.append(f"{pid}: match bank EMPTY — stage renders nothing")
    if wants_check("quiz") and with_gap and quiz_n == 0:
        errors.append(f"{pid}: quiz bank EMPTY despite {len(with_gap)} gap items")
    if wants_check("order_click") and items and order_n == 0:
        errors.append(
            f"{pid}: order_click bank EMPTY — no item has tokens[] with 2+ entries"
        )
    if use_n == 0 and ladder.get("use") is not False:
        warnings.append(f"{pid}: Use bank empty")
    if match_n == 0 and quiz_n == 0 and order_n == 0 and type_n == 0 and use_n == 0:
        errors.append(f"{pid}: UNPLAYABLE — every stage empty")


def main() -> int:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree.get("nodes") or []}
    on_path: set[str] = set()
    for k in ("path_order", "path_order_a2", "path_order_b1",
              "path_order_b2", "path_order_c1"):
        on_path.update(tree.get(k) or [])

    checked = 0
    for nid in sorted(on_path):
        node = by_id.get(nid)
        if not node or node.get("status") != "live" or not node.get("content"):
            continue
        if node.get("domain") != "grammar":
            continue  # vocab engine reads blocks[] natively
        f = DATA / node["content"]
        if not f.is_file():
            errors.append(f"{nid}: content missing on disk")
            continue
        check_pack(nid, json.loads(f.read_text(encoding="utf-8")))
        checked += 1

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(
        f"\ncheck_playable: {checked} live grammar units on path · "
        f"{len(errors)} errors · {len(warnings)} warnings"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
