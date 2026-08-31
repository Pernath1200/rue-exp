"""Be/have vocab half is a sitting, not an A1 circle slot."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "codex"))
from tree_path import teaching_path  # noqa: E402

tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
by = {n["id"]: n for n in tree["nodes"]}
failed = 0


def assert_(cond, msg):
    global failed
    if not cond:
        failed += 1
        print("FAIL:", msg)
    else:
        print("ok:", msg)


path = tree["path_order"]
assert_("trunk_frames_a1" not in path, "vocab half is not on the A1 rail")
assert_("a1_be_have" in path, "grammar half stays on the A1 rail")
assert_(
    path.index("a1_word_classes") < path.index("a1_be_have") < path.index("a1_word_order"),
    "Be/have still sits between Word classes and Word order",
)

g = by["a1_be_have"]
v = by["trunk_frames_a1"]
assert_(g.get("sitting_vocab") == "trunk_frames_a1", "grammar points at sitting vocab")
assert_(v.get("sitting_of") == "a1_be_have", "vocab is sitting_of grammar")
assert_(v.get("status") == "live" and v.get("content"), "vocab pack still live")

stats = tree["level_stats"]["A1"]
assert_(stats["live"] == 58, f"A1 live is 58 sittings, got {stats['live']}")
assert_(stats["total"] == 58, f"A1 total is 58 sittings, got {stats['total']}")
assert_(stats["vocab"] == 35, f"A1 vocab sittings 35, got {stats['vocab']}")
assert_(stats["grammar"] == 23, f"A1 grammar 23, got {stats['grammar']}")

taught = teaching_path(tree)
assert_("trunk_frames_a1" in taught, "teaching path still includes the vocab half")
assert_(
    taught.index("a1_be_have") + 1 == taught.index("trunk_frames_a1"),
    "vocab half is taught immediately after grammar",
)

if failed:
    print(f"\n{failed} failed")
    raise SystemExit(1)
print("\nall ok")
