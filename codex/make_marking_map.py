#!/usr/bin/env python3
"""make_marking_map.py — regenerate the marking-sheet orientation doc from live data.

The doc this writes is what the TA project on Claude.ai reads when it generates
a feedback sheet. On 2026-08-13 it was found to be STALE in a way that broke the
thing it exists to enable: it said "Never write a URL for an app unit. The app
has no per-unit links yet", which stopped being true when deep linking landed on
2026-08-12. A hand-maintained list of 154 units against a repo that changes every
session will go stale again, so it is generated instead.

    py -X utf8 codex/make_marking_map.py

Writes to the vault (canonical) and Desktop (working copy). Nothing else in the
repo reads its output — it is an export, not a gate.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SITE = "https://pernath1200.github.io/rue-exp/"

OUTPUTS = [
    Path.home() / "Documents" / "original" / "English app — orientation for marking.md",
    Path.home() / "Desktop" / "English app — orientation for marking.md",
]

PATH_KEYS = (
    "path_order", "path_order_a2", "path_order_b1",
    "path_order_b2", "path_order_c1",
)

# Error types that have NO unit and must NOT be invented one. The marking AI
# flags these for James instead of force-mapping to the nearest topic — that
# decision is from the marking-sheet spec (2026-08-08) and it is what makes the
# gaps visible rather than hidden.
NO_UNIT = [
    ("Plural -s after a number", "No plurals unit exists at any level.", "*three day → three days*"),
    ("Degree adverbs / intensifiers", "No grammar unit. `a2_adverbs` (vocab) carries some.", "*not so much relaxing → not very relaxing*"),
    ("Collocation above B1", "Only `b1_collocations` (24 items). Nothing at B2/C1.", "*enjoy fun → have fun*"),
    ("Idioms and fixed phrases", "Nothing at any level.", "*strong nerves → nerves of steel*"),
    ("Vocabulary at B2 or C1", "0 vocab units above B1. Use Padlet, or a lower unit if it genuinely fits.", "—"),
    ("Proper-noun conventions", "Not unit-shaped. Correct in the note, don't link.", "*Etna volcano → Mount Etna*"),
    ("Spelling and BrE/AmE", "Not unit-shaped. Correct in the note, don't link.", "*meters → metres*"),
    ("Whole-sentence naturalness", "Not unit-shaped — a rewrite, not a rule.", "—"),
]

CODES = [
    ("GR", "Grammar", "grammar units"),
    ("WF", "Word form", "grammar units"),
    ("PR", "Preposition", "grammar units — prepositions of place / time / movement, dependent prepositions"),
    ("VO", "Vocabulary", "vocab units"),
    ("SP", "Spelling", "no unit — correct in the note"),
    ("PU", "Punctuation", "no unit — correct in the note"),
    ("DI", "Discourse", "grammar units at B1+ (Linkers, Discourse markers, Discourse grammar). No Padlet home."),
]


def load_units() -> list[dict]:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    order: list[str] = []
    seen: set[str] = set()
    for key in PATH_KEYS:
        for nid in tree.get(key) or []:
            if nid not in seen:
                seen.add(nid)
                order.append(nid)

    by_node: dict[str, dict] = {}
    for domain in ("grammar", "vocab"):
        for p in (DATA / domain / "blocks").glob("*.json"):
            d = json.loads(p.read_text(encoding="utf-8"))
            node = d.get("tree_node") or d.get("id")
            by_node[node] = {
                "id": d.get("id"),
                "node": node,
                "title": d.get("title") or d.get("id"),
                "level": d.get("level"),
                "domain": domain,
                "items": sum(len(b.get("items") or []) for b in d.get("blocks") or []),
            }

    return [by_node[n] for n in order if n in by_node]


def table(units: list[dict]) -> str:
    rows = ["| Unit (say it to the student like this) | Link |",
            "|---|---|"]
    for u in units:
        rows.append(f"| **{u['title']} ({u['level']})** | `{SITE}#{u['node']}` |")
    return "\n".join(rows)


def build() -> str:
    units = load_units()
    by_level: dict[tuple, list[dict]] = defaultdict(list)
    for u in units:
        by_level[(u["level"], u["domain"])].append(u)

    counts = " · ".join(
        f"{lvl} {dom} {len(v)}"
        for (lvl, dom), v in sorted(by_level.items())
    )

    out = [
        "# The English app — orientation for marking",
        "",
        "**Generated** by `rue-exp/codex/make_marking_map.py`. Do not hand-edit —",
        "re-run the script instead. The previous hand-maintained version went stale",
        "and told the marking AI not to write unit links, three weeks after unit",
        "links started working.",
        "",
        f"{len(units)} live units on the path: {counts}.",
        "",
        "## What exists now",
        "",
        "**One app.** A single site covering grammar and vocabulary on one path, A1",
        "to C1, live at " + SITE + ". RUE2 and RUE3 were merged into it and are frozen",
        "archives — never name them to a student, never link them, never present them",
        "as alternatives. As far as any student is concerned there is one app.",
        "",
        "**Padlet is separate and still current.** The Grammar Hub and Vocab Hub remain",
        "the self-study destination for marked work, and their per-card `/wish/<id>`",
        "links work. Keep using them.",
        "",
        "## Unit links — THIS IS THE PART THAT CHANGED",
        "",
        "**Deep links work.** Every unit has a stable address:",
        "",
        "```",
        f"{SITE}#<node_id>",
        "```",
        "",
        "Optionally add `&review=1` to open the unit straight at the Type stage for a",
        "student who has already done it once.",
        "",
        "Write the unit **as a real hyperlink on its student-facing name**:",
        "",
        f"> **Practise:** [Subject–verb agreement (A1)]({SITE}#a1_agreement)",
        "",
        "Verified working in a live lesson, 13 August 2026 (Tomáš). The old rule —",
        "*\"never write a URL for an app unit\"* — is **withdrawn**. It was correct when",
        "written on 11 August and wrong by the 12th.",
        "",
        "### Naming",
        "",
        "Use the label exactly as it appears in the table below, with the level in",
        "brackets. Never show a student an internal id (`a1_agreement`) or a codex tag",
        "(`G_VP-A1B1-01`) — those go in the URL, never in the text.",
        "",
        "### Only link a unit that is on the list",
        "",
        "If an error does not map to a listed unit, **flag it rather than inventing**",
        "one. The gaps below are known and deliberate; a flagged gap is a suggestion",
        "for a unit to build, which is how ESSENTIAL-UNITS was written in the first",
        "place. Point at Padlet alone, or leave the reference blank.",
        "",
        "### Quality, honestly",
        "",
        "- **A1 and A2** are being reviewed and corrected unit by unit against real",
        "  student errors. These are the ones to lean on.",
        "- **B1, B2 and C1 have never been checked by a human.** Linking them is fine,",
        "  but it is not the same guarantee. Say so to yourself, not to the student.",
        "",
        "## Marking codes → where they point",
        "",
        "| Code | Meaning | Points at |",
        "|---|---|---|",
    ]
    for code, meaning, points in CODES:
        out.append(f"| **{code}** | {meaning} | {points} |")

    out += [
        "",
        "## Error types with NO unit — flag, do not invent",
        "",
        "| Error type | Why there is no unit | Example |",
        "|---|---|---|",
    ]
    for kind, why, eg in NO_UNIT:
        out.append(f"| {kind} | {why} | {eg} |")

    out += ["", "## The units", ""]
    for level in ("A1", "A2", "B1", "B2", "C1"):
        for domain in ("grammar", "vocab"):
            group = by_level.get((level, domain))
            if not group:
                out += [
                    f"### {level} — {domain.title()} (0)",
                    "",
                    "**None exist.** Do not invent one; flag the error instead.",
                    "",
                ]
                continue
            out += [f"### {level} — {domain.title()} ({len(group)})", "", table(group), ""]

    return "\n".join(out) + "\n"


def main() -> int:
    doc = build()
    for path in OUTPUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(doc, encoding="utf-8", newline="\n")
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
