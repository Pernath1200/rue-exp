"""Circle path vs teaching path.

The 60-slot rail (`path_order*`) lists sittings. A chained vocab half
(`sitting_of`) is a real pack and tree knot, but not a circle slot.
Pool/audit walk the teaching path, which splices those halves in after
their grammar parent so the words stay taught at that position.
"""
from __future__ import annotations

PATH_KEYS = (
    "path_order",
    "path_order_a2",
    "path_order_b1",
    "path_order_b2",
    "path_order_c1",
)


def circle_ids(tree: dict) -> list[str]:
    """Sittings only — the 60-slot rail."""
    seen: set[str] = set()
    out: list[str] = []
    for key in PATH_KEYS:
        for nid in tree.get(key) or []:
            if not nid or nid in seen:
                continue
            seen.add(nid)
            out.append(nid)
    return out


def teaching_path(tree: dict) -> list[str]:
    """Circle path with sitting halves spliced after their parent."""
    by_id = {n["id"]: n for n in tree.get("nodes") or [] if n.get("id")}
    seen: set[str] = set()
    out: list[str] = []
    for nid in circle_ids(tree):
        if nid in seen:
            continue
        seen.add(nid)
        out.append(nid)
        vid = (by_id.get(nid) or {}).get("sitting_vocab")
        if vid and vid not in seen:
            seen.add(vid)
            out.append(vid)
    return out
