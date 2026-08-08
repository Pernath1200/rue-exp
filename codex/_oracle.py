#!/usr/bin/env python3
"""Authoring oracle — replays audit.main()'s `legal` set for one node.

Not a gate; a scratch tool for the authoring lane. Imports audit.py and calls
its own variants()/tokens_of()/GLUE/targets_of()/full_path() so it can never
drift from the real check.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import audit  # noqa: E402

DATA = audit.DATA


def legal_at(node_id: str) -> set[str]:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree.get("nodes") or []}
    order = audit.full_path(tree)

    def node_targets(nid: str) -> set[str]:
        node = by_id.get(nid)
        if not node or not node.get("content"):
            return set()
        f = DATA / node["content"]
        if not f.is_file():
            return set()
        return audit.targets_of(
            json.loads(f.read_text(encoding="utf-8")),
            node.get("domain", "vocab"),
        )

    pool: set[str] = set()
    for nid in order:
        node = by_id.get(nid)
        if not node or node.get("status") != "live" or not node.get("content"):
            continue
        pack_file = DATA / node["content"]
        if not pack_file.is_file():
            continue
        pack = json.loads(pack_file.read_text(encoding="utf-8"))
        own = audit.targets_of(pack, node.get("domain", "vocab"))
        if nid == node_id:
            partner = (node_targets(node["partner_id"])
                       if node.get("partner_id") else set())
            return pool | own | partner | audit.GLUE
        pool |= own
    raise SystemExit(f"node not found / not live: {node_id}")


def illegal_tokens(text: str, legal: set[str]) -> list[str]:
    bad = []
    for tok in audit.tokens_of(audit.PARENS_RE.sub(" ", text)):
        if not any(v in legal for v in audit.variants(tok)):
            bad.append(tok)
    return bad


def selftest() -> None:
    cases = [
        ("a1_word_order", "new", False),
        ("a1_word_order", "nice", True),
        ("a1_articles", "hour", False),
        ("a1_articles", "honest", False),
        ("b1_indirect_questions", "whether", False),
        ("b1_indirect_questions", "wonder", False),
    ]
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_pack = {}
    for n in tree.get("nodes") or []:
        c = n.get("content")
        if c:
            by_pack.setdefault(Path(c).stem, n["id"])
    ok = 0
    for pack_stem, word, expect in cases:
        nid = by_pack[pack_stem]
        legal = legal_at(nid)
        got = not illegal_tokens(word, legal)
        flag = "OK " if got == expect else "FAIL"
        if got == expect:
            ok += 1
        print(f"{flag} {pack_stem}/{word}: legal={got} expected={expect}")
    print(f"selftest {ok}/{len(cases)}")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--selftest"]:
        selftest()
    else:
        node_id = sys.argv[1]
        legal = legal_at(node_id)
        print(f"legal set for {node_id}: {len(legal)} entries",
              file=sys.stderr)
        for line in sys.stdin:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            bad = illegal_tokens(line, legal)
            if bad:
                print(f"ILLEGAL {bad} :: {line}")
        print("done", file=sys.stderr)
