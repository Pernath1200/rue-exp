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

# Grammar tree_part == codex root seat (rue-codex Curriculum_Codex_Grammar):
# tap_root + six laterals. An earlier 5-way collapse (prepositions→links,
# verb_complementation→chunks) hid two roots on the tree; removed 2026-08-23.
GRAMMAR_ROOT_TO_PART = {
    "verb_phrase": "verb_phrase",
    "noun_phrase": "noun_phrase",
    "sentence_syntax": "sentence_syntax",
    "clause_linking": "clause_linking",
    "verb_complementation": "verb_complementation",
    "prepositions_particles": "prepositions_particles",
    "tap_root": "tap_root",
    "word_craft": "word_craft",
}

# Vocab tree_part = one of the 12 codex houses (rue-codex Curriculum_Codex_Vocab,
# B2C1 band) or "trunk". The registry's explicit tree_part always wins; the
# id heuristics below are a fallback for an unregistered node and default to
# trunk, because at A1–B1 vocab is trunk-building (codex Band 1), not branches.
CODEX_HOUSES = (
    "self_body", "money_possessions", "communication", "home_family",
    "creativity_love", "work_routine", "partnerships", "change_transformation",
    "knowledge_travel", "public_life", "community", "inner_life_belief",
)


def vocab_part(n: dict) -> str:
    vid = n.get("id") or ""
    kind = n.get("kind", "leaf")
    if n.get("tree_part"):
        return n["tree_part"]
    if kind in ("trunk", "craft"):
        return "trunk"
    cu = n.get("codex_unit") or n.get("codex_unit_id") or ""
    for code, house in (
        ("V_SEL", "self_body"), ("V_MON", "money_possessions"), ("V_COM", "communication"),
        ("V_HOM", "home_family"), ("V_CRE", "creativity_love"), ("V_WRK", "work_routine"),
        ("V_PAR", "partnerships"), ("V_CHA", "change_transformation"), ("V_KNO", "knowledge_travel"),
        ("V_PUB", "public_life"), ("V_CMT", "community"), ("V_INN", "inner_life_belief"),
    ):
        if cu.startswith(code + "-"):
            return house
    # heuristics from id (theme leaves → nearest codex house)
    for key, part in (
        ("home", "home_family"),
        ("family", "home_family"),
        ("food", "home_family"),
        ("animal", "home_family"),
        ("shop", "money_possessions"),
        ("money", "money_possessions"),
        ("free", "creativity_love"),
        ("sport", "creativity_love"),
        ("work", "work_routine"),
        ("routine", "work_routine"),
        ("travel", "knowledge_travel"),
        ("place", "knowledge_travel"),
        ("school", "knowledge_travel"),
        ("know", "knowledge_travel"),
        ("nature", "knowledge_travel"),
        ("health", "self_body"),
        ("body", "self_body"),
        ("self", "self_body"),
        ("cloth", "self_body"),
        ("tech", "communication"),
        ("media", "communication"),
        ("commun", "communication"),
        ("feel", "inner_life_belief"),
        ("society", "public_life"),
    ):
        if key in vid:
            return part
    return "trunk"


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


def node_from_grammar(n: dict, partner: str | None, sitting_vocab: str | None = None) -> dict:
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
        "practice": n.get("practice") or "grammar",
        "fruit": n.get("fruit"),
        "note": n.get("note"),
        "partner_id": partner,
        "sitting_vocab": sitting_vocab,
        "related": n.get("related"),
        # Exam Practice tag (word_formation) — was dropped on rebuild until 2026-08-23.
        "exam": n.get("exam"),
    }
    return {k: v for k, v in out.items() if v is not None and v != []}


def node_from_vocab(n: dict, partner: str | None, sitting_of: str | None = None) -> dict:
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
        "practice": n.get("practice") or "vocab",
        "fruit": n.get("fruit"),
        "note": n.get("note"),
        "partner_id": partner,
        "sitting_of": sitting_of,
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


def path_from_steps(
    steps: list[dict], *, include_non_live: bool = True
) -> tuple[list[str], dict[str, str], dict[str, str], dict[str, str]]:
    """Build path ids from spine steps.

    Returns path, g2v, v2g partners, and chained grammar→vocab sittings.
    A `chain: true` step is one circle slot (grammar on the path); the vocab
    half stays a pack + tree knot via sitting_vocab / sitting_of.
    """
    path: list[str] = []
    g2v: dict[str, str] = {}
    v2g: dict[str, str] = {}
    chained: dict[str, str] = {}
    for step in steps:
        gs, vs = side(step, "grammar"), side(step, "vocab")
        gid, gstat = gs.get("node_id"), gs.get("status")
        vid, vstat = vs.get("node_id"), vs.get("status")
        chain = bool(step.get("chain"))
        grammar_on = bool(gid and gstat not in (None, "skip"))
        vocab_on = bool(vid and vstat not in (None, "skip"))
        if grammar_on:
            if include_non_live or gstat == "live":
                path.append(gid)
        if vocab_on:
            if include_non_live or vstat == "live":
                if not (chain and grammar_on):
                    path.append(vid)
        if grammar_on and vocab_on:
            g2v[gid] = vid
            v2g[vid] = gid
            if chain:
                chained[gid] = vid
    return dedupe(path), g2v, v2g, chained


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
    path_a1, g2v, v2g, chained = path_from_steps(
        spine.get("steps") or [], include_non_live=True
    )

    # --- A2 path from spine.steps_a2 ---
    path_a2, g2v_a2, v2g_a2, chained_a2 = path_from_steps(
        spine.get("steps_a2") or [], include_non_live=True
    )
    g2v.update(g2v_a2)
    v2g.update(v2g_a2)
    chained.update(chained_a2)

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

    # --- The live tree.json path order is the maintained truth (James, 2026-08-23).
    # spine.json only seeds: units already on a level's path keep their existing
    # position; only genuinely new units are appended, in spine order. Without
    # this, hand placements (articles 5th at A1, etc.) were pushed to the end.
    def keep_existing_order(key: str, rebuilt: list[str]) -> list[str]:
        if not OUT_TREE.is_file():
            return rebuilt
        try:
            existing = json.loads(OUT_TREE.read_text(encoding="utf-8")).get(key) or []
        except (OSError, ValueError):
            return rebuilt
        kept = [nid for nid in existing if nid in rebuilt]
        return dedupe(kept + [nid for nid in rebuilt if nid not in kept])

    path_a1 = keep_existing_order("path_order", path_a1)
    path_a2 = keep_existing_order("path_order_a2", path_a2)
    path_b1 = keep_existing_order("path_order_b1", path_b1)
    path_b2 = keep_existing_order("path_order_b2", path_b2)
    path_c1 = keep_existing_order("path_order_c1", path_c1)

    # --- Collect ALL nodes ---
    nodes: list[dict] = []
    seen: set[str] = set()

    def add_g(nid: str):
        if nid in seen or nid not in g_by_id:
            if nid not in g_by_id and nid:
                print(f"  WARN missing grammar: {nid}")
            return
        seen.add(nid)
        nodes.append(
            node_from_grammar(g_by_id[nid], g2v.get(nid), chained.get(nid))
        )

    def add_v(nid: str):
        if nid in seen or nid not in v_by_id:
            if nid not in v_by_id and nid:
                print(f"  WARN missing vocab: {nid}")
            return
        seen.add(nid)
        parent = v2g.get(nid)
        sitting_of = parent if parent and chained.get(parent) == nid else None
        nodes.append(node_from_vocab(v_by_id[nid], parent, sitting_of))

    for path in (path_a1, path_a2, path_b1, path_b2, path_c1):
        for nid in path:
            if nid in g_by_id:
                add_g(nid)
                vid = chained.get(nid)
                if vid:
                    add_v(vid)
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
        nn = [
            n
            for n in nodes
            if level in (n.get("levels") or []) and not n.get("sitting_of")
        ]
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
        "path_order_note": "A1/A2 zigzag spines · B1 G path + all B1 vocab · B2/C1 grammar spines (+ higher vocab). Topics list uses per-level path. Chained sitting halves (sitting_of) are not circle slots.",
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
    # indent=1 matches the committed tree.json, so git diffs show real changes only.
    OUT_TREE.write_text(
        json.dumps(tree, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
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
