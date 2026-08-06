#!/usr/bin/env python3
"""
Sync EN content into rue-exp and rebuild unified tree from data/spine.json.

Sources (lab):
  - Grammar: projects/rue-auto/grammar
  - Vocab:   projects/rue3-exp

Does not touch rue2-grok-v1.0 student site or progress keys of other apps.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = ROOT.parent
GRAMMAR_SRC = PROJECTS / "rue-auto" / "grammar"
VOCAB_SRC = PROJECTS / "rue3-exp"

OUT_G = ROOT / "data" / "grammar" / "blocks"
OUT_V = ROOT / "data" / "vocab" / "blocks"
OUT_TREE = ROOT / "data" / "tree.json"
SPINE_PATH = ROOT / "data" / "spine.json"

# Map RUE2 root ids → tree_part seats (portrait)
GRAMMAR_ROOT_TO_PART = {
    "verb_phrase": "verbs",
    "noun_phrase": "forms",
    "sentence_syntax": "sentence",
    "clause_linking": "links",
    "verb_complementation": "chunks",
    "prepositions_particles": "links",
    "tap_root": "tap_root",
}

VOCAB_ID_TO_PART = {
    "trunk_frames_a1": "trunk",
    "trunk_prepositions_a1": "trunk",
    "trunk_adjectives_a1": "trunk",
    "trunk_can_like_want_a1": "trunk",
    "trunk_there_time_a1": "trunk",
    "trunk_verbs_daily_a1": "trunk",
    "trunk_verbs_say_a1": "trunk",
    "trunk_verbs_action_a1": "trunk",
    "trunk_social_a1": "trunk",
    "trunk_glue_questions_a1": "trunk",
    "trunk_glue_quantity_a1": "trunk",
    "trunk_glue_linkers_a1": "trunk",
    "trunk_glue_modals_a1": "trunk",
    "trunk_glue_pronouns_a1": "trunk",
    "trunk_verbs_more_a1": "trunk",
    "trunk_verbs_more2_a1": "trunk",
    "trunk_verbs_more3_a1": "trunk",
    "leaf_home_family": "home_family",
    "leaf_food_a1": "food_shopping",
    "leaf_freetime_a1": "free_time",
    "leaf_places": "travel_city",
    "leaf_work_a1": "work_routine",
    "leaf_health_a1": "health_body",
    "leaf_body_a1": "self_body",
    "leaf_shopping_a1": "food_shopping",
    "leaf_school_a1": "knowledge",
    "leaf_time_a1": "free_time",
    "leaf_colours_a1": "self_body",
    "leaf_clothes_a1": "self_body",
    "leaf_animals_a1": "nature",
    "leaf_tech_a1": "tech",
    "leaf_nature_a1": "nature",
    "leaf_ideas_a1": "knowledge",
}


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def side(step: dict, which: str) -> dict:
    """Prefer grammar/vocab; accept legacy rue2/rue3/RUE2/RUE3 keys."""
    if which == "grammar":
        return (
            step.get("grammar")
            or step.get("rue2")
            or step.get("RUE2")
            or step.get("rupl2")
            or {}
        )
    return (
        step.get("vocab")
        or step.get("rue3")
        or step.get("RUE3")
        or step.get("rupl3")
        or {}
    )


def copy_blocks():
    OUT_G.mkdir(parents=True, exist_ok=True)
    OUT_V.mkdir(parents=True, exist_ok=True)
    g_src = GRAMMAR_SRC / "data" / "blocks"
    v_src = VOCAB_SRC / "data" / "blocks"
    if not g_src.is_dir():
        raise SystemExit(f"Missing grammar blocks: {g_src}")
    if not v_src.is_dir():
        raise SystemExit(f"Missing vocab blocks: {v_src}")
    for f in g_src.glob("*.json"):
        shutil.copy2(f, OUT_G / f.name)
    for f in v_src.glob("*.json"):
        shutil.copy2(f, OUT_V / f.name)
    print(f"grammar blocks: {len(list(OUT_G.glob('*.json')))} from {g_src}")
    print(f"vocab blocks:   {len(list(OUT_V.glob('*.json')))} from {v_src}")


def content_grammar(n: dict) -> str | None:
    c = n.get("content")
    if not c:
        return None
    c = str(c).replace("\\", "/").lstrip("./")
    if c.startswith("blocks/"):
        return "grammar/" + c
    if c.startswith("grammar/"):
        return c
    return "grammar/blocks/" + Path(c).name


def content_vocab(n: dict) -> str | None:
    c = n.get("content")
    if not c:
        return None
    c = str(c).replace("\\", "/").lstrip("./")
    if c.startswith("blocks/"):
        return "vocab/" + c
    if c.startswith("vocab/"):
        return c
    return "vocab/blocks/" + Path(c).name


def node_from_grammar(n: dict, partner: str | None) -> dict:
    out = {
        "id": n["id"],
        "domain": "grammar",
        "label": n.get("label"),
        "kind": n.get("kind", "topic"),
        "root": n.get("root"),
        "tree_part": GRAMMAR_ROOT_TO_PART.get(n.get("root") or "", "forms"),
        "codex_unit": n.get("codex_unit"),
        "levels": n.get("levels") or ["A1"],
        "status": n.get("status", "coming"),
        "foundation": n.get("foundation", False),
        "content": content_grammar(n),
        "practice": "grammar",
        "note": n.get("note"),
        "partner_id": partner,
        "related": n.get("related"),
    }
    return {k: v for k, v in out.items() if v is not None and v != []}


def node_from_vocab(n: dict, partner: str | None) -> dict:
    kind = n.get("kind", "leaf")
    out = {
        "id": n["id"],
        "domain": "vocab",
        "label": n.get("label"),
        "kind": kind,
        "parent": n.get("parent"),
        "tree_part": VOCAB_ID_TO_PART.get(n["id"])
        or ("trunk" if kind == "trunk" else "free_time"),
        "codex_unit": n.get("codex_unit") or n.get("codex_unit_id"),
        "levels": n.get("levels") or ["A1"],
        "status": n.get("status", "coming"),
        "content": content_vocab(n),
        "practice": "vocab",
        "note": n.get("note"),
        "partner_id": partner,
    }
    return {k: v for k, v in out.items() if v is not None and v != []}


def build_tree(spine: dict):
    g_tree = load(GRAMMAR_SRC / "data" / "tree.json")
    v_tree = load(VOCAB_SRC / "data" / "tree.json")
    g_by_id = {n["id"]: n for n in g_tree.get("nodes", [])}
    v_by_id = {n["id"]: n for n in v_tree.get("nodes", [])}

    g2v: dict[str, str] = {}
    v2g: dict[str, str] = {}
    path_order: list[str] = []

    for step in spine.get("steps", []):
        gs = side(step, "grammar")
        vs = side(step, "vocab")
        gid, gstat = gs.get("node_id"), gs.get("status")
        vid, vstat = vs.get("node_id"), vs.get("status")
        if gid and gstat == "live" and vid and vstat == "live":
            g2v[gid] = vid
            v2g[vid] = gid
        if gid and gstat == "live":
            path_order.append(gid)
        if vid and vstat == "live":
            path_order.append(vid)

    # Dedupe path
    deduped: list[str] = []
    seen_p: set[str] = set()
    for nid in path_order:
        if nid in seen_p:
            continue
        seen_p.add(nid)
        deduped.append(nid)
    path_order = deduped

    nodes: list[dict] = []
    seen: set[str] = set()

    def add_g(nid: str):
        if nid in seen or nid not in g_by_id:
            if nid not in g_by_id:
                print(f"  WARN missing grammar node: {nid}")
            return
        seen.add(nid)
        nodes.append(node_from_grammar(g_by_id[nid], g2v.get(nid)))

    def add_v(nid: str):
        if nid in seen or nid not in v_by_id:
            if nid not in v_by_id:
                print(f"  WARN missing vocab node: {nid}")
            return
        seen.add(nid)
        nodes.append(node_from_vocab(v_by_id[nid], v2g.get(nid)))

    for nid in path_order:
        if nid in g_by_id:
            add_g(nid)
        elif nid in v_by_id:
            add_v(nid)

    # Include remaining live A1 units on map (full list / topics) but not path
    for n in g_tree.get("nodes", []):
        lv = n.get("levels") or []
        if n.get("status") == "live" and "A1" in lv and n["id"] not in seen:
            add_g(n["id"])
    for n in v_tree.get("nodes", []):
        lv = n.get("levels") or []
        if n.get("status") == "live" and "A1" in lv and n["id"] not in seen:
            add_v(n["id"])

    # Higher levels: coming shells on map (grammar B2/C1 from lab; vocab if any)
    for n in g_tree.get("nodes", []):
        lv = n.get("levels") or []
        if n["id"] in seen:
            continue
        if any(x in lv for x in ("A2", "B1", "B2", "C1")):
            gn = node_from_grammar(n, None)
            # Force coming if not live for weekend honesty
            if gn.get("status") == "live" and "A1" not in lv:
                pass  # keep live A2+ if any
            nodes.append(gn)
            seen.add(n["id"])

    for n in v_tree.get("nodes", []):
        lv = n.get("levels") or []
        if n["id"] in seen:
            continue
        if any(x in lv for x in ("A2", "B1", "B2", "C1", "C2")):
            nodes.append(node_from_vocab(n, None))
            seen.add(n["id"])

    all_g = [n["id"] for n in nodes if n.get("domain") == "grammar"]
    all_v = [n["id"] for n in nodes if n.get("domain") == "vocab"]

    tree = {
        "version": 1,
        "app": "rue-exp",
        "title": "English · RUE-exp",
        "levels": ["A1", "A2", "B1", "B2", "C1"],
        "levels_locked": ["A2", "B1", "B2", "C1"],
        "levels_locked_note": "Weekend draft: A1 path live. Higher levels visible as coming on map.",
        "default_direction": "cz_to_en",
        "path_order": path_order,
        "path_order_note": "A1 zigzag from data/spine.json (grammar then vocab per step).",
        "spine": "data/spine.json",
        "show_full_canopy_ids": {"grammar": all_g, "vocab": all_v},
        "roots": g_tree.get("roots", []),
        "tap_root": g_tree.get("tap_root")
        or {"id": "tap_root", "label": "Foundation"},
        "nodes": nodes,
        "synced_from": {
            "grammar": str(GRAMMAR_SRC),
            "vocab": str(VOCAB_SRC),
            "spine": str(SPINE_PATH),
        },
    }
    OUT_TREE.write_text(
        json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"tree nodes: {len(nodes)} · path: {len(path_order)}")
    for p in path_order:
        dom = "G" if p in g_by_id else "V"
        print(f"  [{dom}] {p}")


def main():
    assert GRAMMAR_SRC.is_dir(), f"need {GRAMMAR_SRC}"
    assert VOCAB_SRC.is_dir(), f"need {VOCAB_SRC}"
    assert SPINE_PATH.is_file(), f"need {SPINE_PATH}"
    copy_blocks()
    spine = load(SPINE_PATH)
    build_tree(spine)
    print("OK ->", ROOT)


if __name__ == "__main__":
    main()
