#!/usr/bin/env python3
"""
Sync EN content into rue-exp and rebuild unified tree.

Sources:
  - Grammar: projects/rue-auto/grammar  (full A1–C1 map)
  - Vocab:   projects/rue3-exp         (A1–B2 catalogue)

Builds:
  - path_order      from spine.json steps (A1 zigzag)
  - path_order_a2   from spine.json steps_a2 (A2 zigzag) + leftover A2 vocab
  - path_order_b1   grammar path_order_b1 interleaved with B1 vocab nodes
  - path_order_b2 / path_order_c1 from lab grammar paths (+ any higher vocab)

All source nodes are included (live / coming / planned / parked).
levels_locked: [] — A1–C1 selectable; practice only when status==live + content.
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

GRAMMAR_ROOT_TO_PART = {
    "verb_phrase": "verbs",
    "noun_phrase": "forms",
    "sentence_syntax": "sentence",
    "clause_linking": "links",
    "verb_complementation": "chunks",
    "prepositions_particles": "links",
    "tap_root": "tap_root",
}

# Fallback house seats when codex/tree_part missing
def vocab_part(n: dict) -> str:
    vid = n.get("id") or ""
    kind = n.get("kind", "leaf")
    if n.get("tree_part"):
        return n["tree_part"]
    if kind in ("trunk", "craft"):
        return "trunk"
    # heuristics from id
    for key, part in (
        ("home", "home_family"),
        ("family", "home_family"),
        ("food", "food_shopping"),
        ("shop", "food_shopping"),
        ("money", "money"),
        ("free", "free_time"),
        ("sport", "free_time"),
        ("work", "work_routine"),
        ("routine", "work_routine"),
        ("travel", "travel_city"),
        ("place", "travel_city"),
        ("health", "health_body"),
        ("body", "self_body"),
        ("self", "self_body"),
        ("cloth", "self_body"),
        ("colour", "self_body"),
        ("school", "knowledge"),
        ("know", "knowledge"),
        ("idea", "knowledge"),
        ("tech", "tech"),
        ("media", "tech"),
        ("nature", "nature"),
        ("animal", "nature"),
        ("feel", "inner_life"),
        ("society", "public_life"),
        ("commun", "communication"),
        ("describ", "self_body"),
        ("adverb", "trunk"),
        ("verb", "trunk"),
        ("misc", "trunk"),
        ("abstract", "trunk"),
        ("chunk", "trunk"),
        ("colloc", "trunk"),
        ("core", "trunk"),
        ("lexis", "trunk"),
        ("recycle", "trunk"),
    ):
        if key in vid:
            return part
    return "free_time"


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def side(step: dict, which: str) -> dict:
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
    out = {
        "id": n["id"],
        "domain": "vocab",
        "label": n.get("label"),
        "kind": n.get("kind", "leaf"),
        "parent": n.get("parent"),
        "tree_part": vocab_part(n),
        "codex_unit": n.get("codex_unit") or n.get("codex_unit_id"),
        "levels": n.get("levels") or ["A1"],
        "status": n.get("status", "coming"),
        "content": content_vocab(n),
        "practice": "vocab",
        "note": n.get("note"),
        "partner_id": partner,
    }
    return {k: v for k, v in out.items() if v is not None and v != []}


def dedupe(ids: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for i in ids:
        if not i or i in seen:
            continue
        seen.add(i)
        out.append(i)
    return out


def path_from_steps(steps: list[dict], *, include_non_live: bool = True) -> tuple[list[str], dict[str, str], dict[str, str]]:
    """Build path ids from spine steps. Returns path, g2v, v2g partners."""
    path: list[str] = []
    g2v: dict[str, str] = {}
    v2g: dict[str, str] = {}
    for step in steps:
        gs, vs = side(step, "grammar"), side(step, "vocab")
        gid, gstat = gs.get("node_id"), gs.get("status")
        vid, vstat = vs.get("node_id"), vs.get("status")
        if gid and gstat not in (None, "skip"):
            if include_non_live or gstat == "live":
                path.append(gid)
        if vid and vstat not in (None, "skip"):
            if include_non_live or vstat == "live":
                path.append(vid)
        if (
            gid
            and vid
            and gstat not in (None, "skip")
            and vstat not in (None, "skip")
        ):
            g2v[gid] = vid
            v2g[vid] = gid
    return dedupe(path), g2v, v2g


def nodes_for_level(nodes: list[dict], level: str) -> list[dict]:
    return [n for n in nodes if level in (n.get("levels") or [])]


def build_tree(spine: dict):
    # Local registries (lab snapshots, 2026-08-06) — the labs are frozen and
    # no longer read. New nodes are registered HERE, in these two files.
    g_tree = load(ROOT / "data" / "nodes-grammar.json")
    v_tree = load(ROOT / "data" / "nodes-vocab.json")
    g_by_id = {n["id"]: n for n in g_tree.get("nodes", [])}
    v_by_id = {n["id"]: n for n in v_tree.get("nodes", [])}

    # --- A1 path from spine.steps ---
    path_a1, g2v, v2g = path_from_steps(spine.get("steps") or [], include_non_live=True)

    # --- A2 path from spine.steps_a2 ---
    path_a2, g2v_a2, v2g_a2 = path_from_steps(
        spine.get("steps_a2") or [], include_non_live=True
    )
    g2v.update(g2v_a2)
    v2g.update(v2g_a2)

    # Append any A2 grammar/vocab not yet on path_a2 (full catalogue)
    for nid in g_tree.get("path_order_a2") or []:
        if nid not in path_a2:
            path_a2.append(nid)
    a2_v = [
        n["id"]
        for n in v_tree.get("nodes", [])
        if "A2" in (n.get("levels") or [])
    ]
    for nid in a2_v:
        if nid not in path_a2:
            path_a2.append(nid)
    path_a2 = dedupe(path_a2)

    # --- B1: grammar path + all B1 vocab (live/planned/parked) ---
    path_b1 = list(g_tree.get("path_order_b1") or [])
    b1_v = [
        n["id"]
        for n in v_tree.get("nodes", [])
        if "B1" in (n.get("levels") or [])
    ]
    # Interleave lightly: after each 2 grammar units, insert next vocab if any
    inter: list[str] = []
    vi = 0
    for i, gid in enumerate(path_b1):
        inter.append(gid)
        if (i + 1) % 2 == 0 and vi < len(b1_v):
            inter.append(b1_v[vi])
            vi += 1
    while vi < len(b1_v):
        inter.append(b1_v[vi])
        vi += 1
    path_b1 = dedupe(inter)

    # --- B2 / C1 grammar spines (+ any B2 vocab) ---
    path_b2 = list(g_tree.get("path_order_b2") or [])
    for n in v_tree.get("nodes", []):
        if "B2" in (n.get("levels") or []) and n["id"] not in path_b2:
            path_b2.append(n["id"])
    path_b2 = dedupe(path_b2)

    path_c1 = dedupe(list(g_tree.get("path_order_c1") or []))

    # --- Collect ALL nodes ---
    nodes: list[dict] = []
    seen: set[str] = set()

    def add_g(nid: str):
        if nid in seen or nid not in g_by_id:
            if nid not in g_by_id and nid:
                print(f"  WARN missing grammar: {nid}")
            return
        seen.add(nid)
        nodes.append(node_from_grammar(g_by_id[nid], g2v.get(nid)))

    def add_v(nid: str):
        if nid in seen or nid not in v_by_id:
            if nid not in v_by_id and nid:
                print(f"  WARN missing vocab: {nid}")
            return
        seen.add(nid)
        nodes.append(node_from_vocab(v_by_id[nid], v2g.get(nid)))

    for path in (path_a1, path_a2, path_b1, path_b2, path_c1):
        for nid in path:
            if nid in g_by_id:
                add_g(nid)
            elif nid in v_by_id:
                add_v(nid)

    # Any remaining source nodes (full catalogue — nothing dropped)
    for n in g_tree.get("nodes", []):
        if n["id"] not in seen:
            add_g(n["id"])
    for n in v_tree.get("nodes", []):
        if n["id"] not in seen:
            add_v(n["id"])

    # Verify packs exist; demote missing content live → coming note
    for n in nodes:
        c = n.get("content")
        if not c:
            continue
        disk = ROOT / "data" / c
        if not disk.is_file() and n.get("status") == "live":
            print(f"  WARN missing pack file for live {n['id']}: {c}")

    all_g = [n["id"] for n in nodes if n.get("domain") == "grammar"]
    all_v = [n["id"] for n in nodes if n.get("domain") == "vocab"]

    def count_level(level: str) -> dict:
        nn = [n for n in nodes if level in (n.get("levels") or [])]
        return {
            "total": len(nn),
            "grammar": sum(1 for n in nn if n.get("domain") == "grammar"),
            "vocab": sum(1 for n in nn if n.get("domain") == "vocab"),
            "live": sum(1 for n in nn if n.get("status") == "live"),
            "coming": sum(
                1
                for n in nn
                if n.get("status") in ("coming", "planned", "parked")
            ),
        }

    tree = {
        "version": 2,
        "app": "rue-exp",
        "title": "English · RUE",
        "levels": ["A1", "A2", "B1", "B2", "C1"],
        "levels_locked": [],
        "levels_locked_note": "All CEFR levels open for browse. Practice when status is live + pack exists.",
        "default_direction": "cz_to_en",
        "path_order": path_a1,
        "path_order_a2": path_a2,
        "path_order_b1": path_b1,
        "path_order_b2": path_b2,
        "path_order_c1": path_c1,
        "path_order_note": "A1/A2 zigzag spines · B1 G path + all B1 vocab · B2/C1 grammar spines (+ higher vocab). Topics list uses per-level path.",
        "spine": "data/spine.json",
        "level_stats": {
            lv: count_level(lv) for lv in ["A1", "A2", "B1", "B2", "C1"]
        },
        "show_full_canopy_ids": {"grammar": all_g, "vocab": all_v},
        "roots": g_tree.get("roots", []),
        "tap_root": g_tree.get("tap_root")
        or {"id": "tap_root", "label": "Foundation"},
        "nodes": nodes,
        "synced_from": {
            "grammar": "data/nodes-grammar.json (lab snapshot 2026-08-06)",
            "vocab": "data/nodes-vocab.json (lab snapshot 2026-08-06)",
            "spine": "data/spine.json",
        },
    }
    OUT_TREE.write_text(
        json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"tree nodes: {len(nodes)}")
    for lv in ["A1", "A2", "B1", "B2", "C1"]:
        st = count_level(lv)
        po = tree.get(f"path_order_{lv.lower()}" if lv != "A1" else "path_order")
        if lv == "A1":
            po = tree["path_order"]
        print(
            f"  {lv}: path {len(po or [])} · nodes {st['total']} "
            f"(G {st['grammar']} V {st['vocab']} · live {st['live']} sketch {st['coming']})"
        )


def main():
    assert GRAMMAR_SRC.is_dir(), f"need {GRAMMAR_SRC}"
    assert VOCAB_SRC.is_dir(), f"need {VOCAB_SRC}"
    assert SPINE_PATH.is_file(), f"need {SPINE_PATH}"
    copy_blocks()
    spine = load(SPINE_PATH)
    build_tree(spine)
    print("OK ->", ROOT)


def rebuild_tree_only():
    """Rebuild data/tree.json from spine + local node registries (no lab access)."""
    assert SPINE_PATH.is_file(), f"need {SPINE_PATH}"
    assert (ROOT / "data" / "nodes-grammar.json").is_file(), "need data/nodes-grammar.json"
    assert (ROOT / "data" / "nodes-vocab.json").is_file(), "need data/nodes-vocab.json"
    build_tree(load(SPINE_PATH))
    print("OK (tree only) ->", OUT_TREE)


if __name__ == "__main__":
    import sys

    if "--rebuild-tree" in sys.argv:
        rebuild_tree_only()
        raise SystemExit(0)
    raise SystemExit(
        "RETIRED 2026-08-06: rue-exp is the one canonical repo; labs "
        "rue-auto/grammar and rue3-exp are FROZEN archives. Edit packs in "
        "rue-exp/data/ directly. To rebuild data/tree.json after pack or "
        "spine edits, run:  py scripts/sync_from_stable.py --rebuild-tree\n"
        "Full lab copy is intentionally disabled (it would overwrite "
        "canonical content). Only James may re-enable it."
    )
