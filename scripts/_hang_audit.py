"""One-shot hang audit. Not a gate. Run: py -X utf8 scripts/_hang_audit.py"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
nodes = json.loads((ROOT / "data/nodes-grammar.json").read_text(encoding="utf-8"))
nby = {n["id"]: n for n in nodes.get("nodes", [])}


def pack_cu(n):
    p = n.get("content") or ""
    for c in [
        ROOT / "data" / p,
        ROOT / "data/grammar" / p,
        ROOT / "data/grammar/blocks" / Path(p).name,
    ]:
        if c.exists():
            return json.loads(c.read_text(encoding="utf-8")).get("codex_unit")
    return None


n = next(x for x in tree["nodes"] if x["id"] == "b1_degree_adverbs")
ng = nby["b1_degree_adverbs"]
print("DEGREE")
print(" tree ", n.get("root"), n.get("tree_part"), n.get("codex_unit"), n.get("related"))
print(" nodes", ng.get("root"), ng.get("tree_part"), ng.get("codex_unit"), ng.get("related"))
print(" pack ", pack_cu(n))

live = [
    x
    for x in tree["nodes"]
    if x.get("domain") == "grammar"
    and x.get("kind") == "topic"
    and x.get("status") == "live"
]
print("live grammar topics", len(live))
missing = [x for x in live if not x.get("codex_unit")]
print("MISSING CODEX", len(missing))
for x in missing:
    print(" ", x["id"], "hang", x.get("root"), "label", x.get("label"))

print("SPLITS")
splits = 0
for n in live:
    ng = nby.get(n["id"], {})
    pc = pack_cu(n)
    issues = []
    if ng.get("root") and ng.get("root") != n.get("root"):
        issues.append(f"root tree={n.get('root')} nodes={ng.get('root')}")
    if (
        ng.get("codex_unit")
        and n.get("codex_unit")
        and ng.get("codex_unit") != n.get("codex_unit")
    ):
        issues.append("codex tree vs nodes")
    if pc and n.get("codex_unit") and pc != n.get("codex_unit"):
        issues.append(f"pack={pc} tree={n.get('codex_unit')}")
    if issues:
        splits += 1
        print(n["id"], issues)
if not splits:
    print(" (none)")
print("HANG COUNTS", dict(Counter(n.get("root") for n in live)))
