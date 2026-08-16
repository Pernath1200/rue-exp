#!/usr/bin/env python3
"""check_links.py — validate every rue-exp deep link in a document.

The generators (link_marking_sheets, build_student_practice_page) only emit
links to units that exist, so their output cannot drift. Hand-made material
can: an error summary written in the TA project links to #a1_agreement, a
unit is later renamed, and the report rots silently. This is the gate to run
on any artifact BEFORE it goes to a student:

    py -X utf8 codex/check_links.py "Feedback_Tomas.pdf" [more files ...]

Verdicts per link:
    BUILT     unit id resolves to a playable block — link is good
    PLANNED   id is in the tree but has no live content — link opens the
              app's not-built-yet notice; fine for James, not for a student
    UNKNOWN   id matches nothing — the link is broken (typo or rename);
              nearest built ids are suggested

Exit 0 when every link is BUILT; 1 otherwise.

Formats: .docx (hyperlink rels + typed text), .pdf (link annotations +
best-effort text from decompressed streams), and any text format
(.html .md .txt). PDF text extraction is best-effort — hex-encoded text
streams can hide a typed address, so the .docx master is the better target.
"""
from __future__ import annotations

import difflib
import json
import re
import sys
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# rue-exp deep links, wherever they are hosted:
#   https://pernath1200.github.io/rue-exp/#a1_agreement
#   http://localhost:8097/#a1_agreement       (dev)
#   rue-exp/#a1_agreement                     (typed-address table)
LINK = re.compile(
    r"(?:rue-exp/|localhost:8097/)(?:index\.html)?#/?"
    r"(?:unit=|id=|node=)?([A-Za-z][A-Za-z0-9_]*)"
)


def known_units() -> tuple[set[str], set[str]]:
    """(built ids, all tree ids)."""
    built: set[str] = set()
    for domain in ("grammar", "vocab"):
        for p in (ROOT / "data" / domain / "blocks").glob("*.json"):
            d = json.loads(p.read_text(encoding="utf-8"))
            built.add(d.get("tree_node") or d.get("id"))
    tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
    all_ids = {n["id"] for n in tree.get("nodes", [])}
    return built, all_ids


def text_of(path: Path) -> str:
    suf = path.suffix.lower()
    if suf == ".docx":
        out = []
        with zipfile.ZipFile(path) as z:
            for name in z.namelist():
                if name.startswith("word/") and name.endswith((".xml", ".rels")):
                    out.append(z.read(name).decode("utf-8", "replace"))
        return "\n".join(out)
    if suf == ".pdf":
        raw = path.read_bytes()
        blob = bytearray(raw)
        for m in re.finditer(rb"stream\r?\n", raw):
            s = m.end()
            e = raw.find(b"endstream", s)
            try:
                blob += zlib.decompress(raw[s:e])
            except Exception:  # noqa: BLE001
                pass
        return bytes(blob).decode("latin-1", "replace")
    return path.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2

    built, all_ids = known_units()
    bad = 0

    for a in args:
        p = Path(a)
        if not p.exists():
            print(f"!! missing file: {p}")
            bad += 1
            continue
        ids = sorted(set(LINK.findall(text_of(p))))
        if not ids:
            print(f"{p.name}: no rue-exp links found")
            continue
        print(f"{p.name}: {len(ids)} linked unit(s)")
        for uid in ids:
            if uid in built:
                print(f"  BUILT    {uid}")
            elif uid in all_ids or uid.lower() in {i.lower() for i in all_ids}:
                print(f"  PLANNED  {uid} — in the tree, not playable yet")
                bad += 1
            else:
                near = difflib.get_close_matches(uid, sorted(built), n=3, cutoff=0.6)
                hint = f"  — nearest: {', '.join(near)}" if near else ""
                print(f"  UNKNOWN  {uid}{hint}")
                bad += 1

    if bad:
        print(f"\n{bad} problem link(s) — do not send until fixed")
    else:
        print("\nall links good")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
