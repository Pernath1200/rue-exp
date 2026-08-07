#!/usr/bin/env python3
"""
verify_pack.py — HARD lint for every pack in data/*/blocks/.

Exit 1 on any ERROR (routine must not commit). Warnings are informational.

Checks:
  - valid JSON, required top-level fields, unique pack ids
  - default_direction == "cz_to_en" (the app's locked direction)
  - NO `pl` keys anywhere (RUPL leftovers are forbidden by AGENTS.md)
  - every item: en + cz non-empty strings
  - gap items: gap contains a blank (___), gap_answer non-empty,
    gap_answer's words appear in en (frame must reconstruct)
  - accepts / gap_accepts / quiz_options are lists of non-empty strings
  - tree cross-check: every live tree node's content file exists;
    every pack's tree_node exists in tree.json (warning if not)

Usage:  py -X utf8 codex/verify_pack.py            # lint everything
        py -X utf8 codex/verify_pack.py <pack.json> [...]   # specific packs
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
BLANK_RE = re.compile(r"_{2,}")
WORD_RE = re.compile(r"[a-zA-Z']+")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def find_pl_keys(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "pl" or k.endswith("_pl"):
                yield f"{path}.{k}"
            yield from find_pl_keys(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from find_pl_keys(v, f"{path}[{i}]")


def norm_words(s: str) -> list[str]:
    return [w.lower() for w in WORD_RE.findall(s)]


def check_str_list(pack_id, where, name, val):
    if val is None:
        return
    if not isinstance(val, list) or any(
        not isinstance(x, str) or not x.strip() for x in val
    ):
        err(f"{pack_id} {where}: {name} must be a list of non-empty strings")


def lint_pack(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f"{rel}: invalid JSON — {e}")
        return

    pid = d.get("id") or rel
    for field in ("id", "title", "level", "tree_node", "blocks"):
        if not d.get(field):
            err(f"{rel}: missing top-level `{field}`")
    if d.get("level") not in LEVELS:
        err(f"{pid}: bad level {d.get('level')!r}")
    if d.get("default_direction") not in ("cz_to_en", "en_gap"):
        err(f"{pid}: default_direction must be 'cz_to_en' (or 'en_gap' for gap-only packs)")

    for hit in find_pl_keys(d):
        err(f"{pid}: forbidden `pl` field at {hit}")

    n_items = 0
    for bi, b in enumerate(d.get("blocks") or []):
        where = f"blocks[{bi}]"
        if not isinstance(b, dict) or not isinstance(b.get("items"), list):
            err(f"{pid} {where}: block must have items[]")
            continue
        for ii, it in enumerate(b["items"]):
            w = f"{where}.items[{ii}]"
            n_items += 1
            if not isinstance(it, dict):
                err(f"{pid} {w}: item is not an object")
                continue
            for f in ("en", "cz"):
                if not isinstance(it.get(f), str) or not it[f].strip():
                    err(f"{pid} {w}: `{f}` missing or empty")
            gap, ga = it.get("gap"), it.get("gap_answer")
            if gap is not None or ga is not None:
                if not (isinstance(gap, str) and BLANK_RE.search(gap)):
                    err(f"{pid} {w}: gap must contain a ___ blank")
                # zero_article items teach "no word here" — empty answer is the point
                if not (isinstance(ga, str) and ga.strip()) and not it.get("zero_article"):
                    err(f"{pid} {w}: gap_answer missing/empty")
                elif isinstance(it.get("en"), str):
                    en_words = set(norm_words(it["en"]))
                    missing = [
                        x for x in norm_words(ga) if x not in en_words
                    ]
                    if missing:
                        warn(
                            f"{pid} {w}: gap_answer words {missing} not in en "
                            f"(frame may not reconstruct)"
                        )
            for name in ("accepts", "gap_accepts", "quiz_options"):
                check_str_list(pid, w, name, it.get(name))
    if n_items == 0:
        warn(f"{pid}: pack has zero items")

    # Use-stage sentence bank (leaf vocab packs). Prompt is cz, answer is en.
    sents = d.get("sentences")
    if sents is not None:
        if not isinstance(sents, list):
            err(f"{pid}: `sentences` must be a list")
        else:
            item_lemmas = {
                " ".join(norm_words(it["en"]))
                for b in d.get("blocks") or []
                for it in (b.get("items") or [])
                if isinstance(it, dict) and isinstance(it.get("en"), str)
            }
            for si, s in enumerate(sents):
                w = f"sentences[{si}]"
                if not isinstance(s, dict):
                    err(f"{pid} {w}: not an object")
                    continue
                for f in ("en", "cz"):
                    if not isinstance(s.get(f), str) or not s[f].strip():
                        err(f"{pid} {w}: `{f}` missing or empty")
                check_str_list(pid, w, "accepts", s.get("accepts"))
                check_str_list(pid, w, "lemmas", s.get("lemmas"))
                # lemmas drive guaranteed exposure — they must be words this
                # pack actually teaches, or Use demands an untaught word.
                for lem in s.get("lemmas") or []:
                    if item_lemmas and " ".join(norm_words(lem)) not in item_lemmas:
                        warn(
                            f"{pid} {w}: lemma {lem!r} is not an item in this pack"
                        )


def cross_check_tree(pack_ids_by_file: dict[str, str]) -> None:
    tree_path = DATA / "tree.json"
    if not tree_path.is_file():
        err("data/tree.json missing")
        return
    tree = json.loads(tree_path.read_text(encoding="utf-8"))
    node_ids = {n["id"] for n in tree.get("nodes") or []}
    for n in tree.get("nodes") or []:
        c = n.get("content")
        if n.get("status") == "live" and c and not (DATA / c).is_file():
            err(f"tree: live node {n['id']} content missing on disk: {c}")
    # path integrity: every id on every path resolves to a node
    for key in ("path_order", "path_order_a2", "path_order_b1",
                "path_order_b2", "path_order_c1"):
        for nid in tree.get(key) or []:
            if nid not in node_ids:
                err(f"tree: {key} references unknown node {nid}")
    # every pack's tree_node should exist
    for rel, tn in pack_ids_by_file.items():
        if tn and tn not in node_ids:
            warn(f"{rel}: tree_node {tn!r} not present in tree.json")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    files = (
        [Path(a) for a in args]
        if args
        else sorted(DATA.glob("*/blocks/*.json"))
    )
    seen_ids: dict[str, str] = {}
    pack_tree_nodes: dict[str, str] = {}
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            pid = d.get("id", "")
            if pid in seen_ids:
                err(f"duplicate pack id {pid!r}: {rel} and {seen_ids[pid]}")
            elif pid:
                seen_ids[pid] = rel
            pack_tree_nodes[rel] = d.get("tree_node", "")
        except Exception:  # noqa: BLE001
            pass  # lint_pack reports the JSON error
        lint_pack(f)
    if not args:
        cross_check_tree(pack_tree_nodes)

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(
        f"\nverify_pack: {len(files)} packs · "
        f"{len(errors)} errors · {len(warnings)} warnings"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
