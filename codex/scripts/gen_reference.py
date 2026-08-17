#!/usr/bin/env python3
"""
gen_reference.py — build data/reference.json for RUE's Tables panel.

Ported in spirit from arta-lat/rupl-exp, but English has no declension and no
conjugation worth tabulating. The equivalent closed lists are the irregular
verbs (populated here) plus prepositions / pronouns+tenses / spelling+pairs
(stubbed, wired, empty).

Irregular verbs are grouped by PATTERN — English's nearest thing to a
declension family, and the thing that makes 66 verbs learnable instead of flat.

`by` (the taught-gate) is derived, never invented:
  base form  -> the earliest live unit on the path whose English actually
                contains that word
  past form  -> the LATER of (verb first taught, a2_past_simple)
  participle -> the LATER of (verb first taught, a2_present_perfect)
because a form is only yours once you have met BOTH the verb and the tense.
A verb the path never teaches gets by = null and stays permanently dimmed,
which is honest: the table still answers the lookup.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
DATA = ROOT / "data"
OUT = DATA / "reference.json"

PAST_UNIT = "a2_past_simple"
PP_UNIT = "a2_present_perfect"

# (base, past, participle, note). Authored explicitly — audit.py's table maps
# form->base and cannot say which of two forms is the past.
VERBS = [
    # --- no change: A-A-A ---
    ("cost", "cost", "cost", "aaa", ""),
    ("cut", "cut", "cut", "aaa", ""),
    ("let", "let", "let", "aaa", ""),
    ("put", "put", "put", "aaa", ""),
    ("read", "read", "read", "aaa", "spelled the same, said differently: /riːd/ → /red/"),
    ("shut", "shut", "shut", "aaa", ""),
    # --- base returns: A-B-A ---
    ("become", "became", "become", "aba", ""),
    ("come", "came", "come", "aba", ""),
    ("run", "ran", "run", "aba", ""),
    # --- past = participle: A-B-B ---
    ("bring", "brought", "brought", "abb", ""),
    ("build", "built", "built", "abb", ""),
    ("buy", "bought", "bought", "abb", ""),
    ("catch", "caught", "caught", "abb", ""),
    ("feel", "felt", "felt", "abb", ""),
    ("find", "found", "found", "abb", ""),
    ("have", "had", "had", "abb", ""),
    ("hear", "heard", "heard", "abb", ""),
    ("hold", "held", "held", "abb", ""),
    ("keep", "kept", "kept", "abb", ""),
    ("learn", "learnt", "learnt", "abb", "learned is also correct, and usual in American English"),
    ("leave", "left", "left", "abb", ""),
    ("lend", "lent", "lent", "abb", ""),
    ("lose", "lost", "lost", "abb", ""),
    ("make", "made", "made", "abb", ""),
    ("mean", "meant", "meant", "abb", ""),
    ("meet", "met", "met", "abb", ""),
    ("pay", "paid", "paid", "abb", ""),
    ("say", "said", "said", "abb", ""),
    ("sell", "sold", "sold", "abb", ""),
    ("send", "sent", "sent", "abb", ""),
    ("sit", "sat", "sat", "abb", ""),
    ("sleep", "slept", "slept", "abb", ""),
    ("spend", "spent", "spent", "abb", ""),
    ("stand", "stood", "stood", "abb", ""),
    ("teach", "taught", "taught", "abb", ""),
    ("tell", "told", "told", "abb", ""),
    ("think", "thought", "thought", "abb", ""),
    ("understand", "understood", "understood", "abb", ""),
    ("win", "won", "won", "abb", ""),
    ("get", "got", "got", "abb", "American English uses gotten for the participle"),
    # --- all three different: A-B-C ---
    ("be", "was / were", "been", "abc", "the only verb with two past forms: I/he was, you/we/they were"),
    ("begin", "began", "begun", "abc", ""),
    ("break", "broke", "broken", "abc", ""),
    ("choose", "chose", "chosen", "abc", ""),
    ("do", "did", "done", "abc", ""),
    ("drink", "drank", "drunk", "abc", ""),
    ("drive", "drove", "driven", "abc", ""),
    ("eat", "ate", "eaten", "abc", ""),
    ("fall", "fell", "fallen", "abc", ""),
    ("fly", "flew", "flown", "abc", ""),
    ("forget", "forgot", "forgotten", "abc", ""),
    ("give", "gave", "given", "abc", ""),
    ("go", "went", "gone", "abc", ""),
    ("grow", "grew", "grown", "abc", ""),
    ("know", "knew", "known", "abc", ""),
    ("ride", "rode", "ridden", "abc", ""),
    ("ring", "rang", "rung", "abc", ""),
    ("see", "saw", "seen", "abc", ""),
    ("sing", "sang", "sung", "abc", ""),
    ("speak", "spoke", "spoken", "abc", ""),
    ("swim", "swam", "swum", "abc", ""),
    ("take", "took", "taken", "abc", ""),
    ("throw", "threw", "thrown", "abc", ""),
    ("wake", "woke", "woken", "abc", ""),
    ("wear", "wore", "worn", "abc", ""),
    ("write", "wrote", "written", "abc", ""),
]

GROUPS = [
    ("irr_aaa", "No change", "base = past = participle",
     "cost · cut · put",
     "The easiest group and the trap: the form never changes, so only the "
     "sentence tells you the tense. *I put it here yesterday.*"),
    ("irr_abb", "One change", "past and participle are the same",
     "buy · bought · bought",
     "The biggest group. Learn one new form and you have both — this is where "
     "most of your effort pays off."),
    ("irr_aba", "The base comes back", "past differs, participle = base",
     "come · came · come",
     "Only three verbs do this, and they are three of the commonest. Worth "
     "knowing as its own tiny group."),
    ("irr_abc", "Three different forms", "base, past and participle all differ",
     "write · wrote · written",
     "The ones that must simply be learned. Nearly all follow a vowel change "
     "you start to hear: sing/sang/sung, ring/rang/rung, swim/swam/swum."),
]

WORD_RE = re.compile(r"[a-z']+")

# A pack teaches the VERB, not the bare token. a1_be_have drills "I am a
# student" and never writes the word "be", so token matching alone dated the
# verb to a1_imperatives ("Be quiet."). These are the forms that count as
# having met the lemma; irregular past/participle forms are added
# automatically from the same table audit.py uses.
EXTRA_FORMS = {
    "be": ["am", "is", "are", "being"],
    "have": ["has", "having"],
    "do": ["does", "doing"],
}


def base_forms(base: str, irregular: dict) -> set[str]:
    """base + its regular inflections + its known irregular forms."""
    out = {base}
    out.update(EXTRA_FORMS.get(base, []))
    out.add(base + "s")
    out.add(base + "es")
    if base.endswith("e"):
        out.add(base[:-1] + "ing")
    else:
        out.add(base + "ing")
        out.add(base + base[-1] + "ing")  # stop -> stopping
    for form, bases in irregular.items():
        if base in bases:
            out.add(form)
    return out


def full_path(tree: dict) -> list[str]:
    seen, out = set(), []
    for key in ("path_order", "path_order_a2", "path_order_b1",
                "path_order_b2", "path_order_c1"):
        for nid in tree.get(key) or []:
            if nid not in seen:
                seen.add(nid)
                out.append(nid)
    return out


def pack_words(pack: dict) -> set[str]:
    """Every English word a student actually meets in this pack."""
    texts: list[str] = []
    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if not isinstance(it, dict):
                continue
            for f in ("en", "gap_answer"):
                if isinstance(it.get(f), str):
                    texts.append(it[f])
            for f in ("accepts", "gap_accepts"):
                for v in it.get(f) or []:
                    if isinstance(v, str):
                        texts.append(v)
    for s in pack.get("sentences") or []:
        if isinstance(s, dict) and isinstance(s.get("en"), str):
            texts.append(s["en"])
    out: set[str] = set()
    for t in texts:
        out.update(WORD_RE.findall(t.lower()))
    return out


def main() -> int:
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree["nodes"]}
    order = full_path(tree)
    pos = {nid: i for i, nid in enumerate(order)}

    # word -> earliest path position that teaches it
    first_at: dict[str, int] = {}
    for i, nid in enumerate(order):
        node = by_id.get(nid)
        if not node or node.get("status") != "live" or not node.get("content"):
            continue
        f = DATA / node["content"]
        if not f.is_file():
            continue
        for w in pack_words(json.loads(f.read_text(encoding="utf-8"))):
            first_at.setdefault(w, i)

    def unit_at(i: int | None) -> str | None:
        return order[i] if i is not None and 0 <= i < len(order) else None

    def later(a: int | None, b: int | None) -> int | None:
        if a is None or b is None:
            return None
        return max(a, b)

    past_p = pos.get(PAST_UNIT)
    pp_p = pos.get(PP_UNIT)
    if past_p is None or pp_p is None:
        print(f"ABORT — {PAST_UNIT} / {PP_UNIT} not on the path")
        return 1

    import importlib.util
    spec = importlib.util.spec_from_file_location("audit", ROOT / "codex" / "audit.py")
    audit = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audit)
    irregular = getattr(audit, "IRREGULAR", {})

    rows_by_group: dict[str, list] = {g[0]: [] for g in GROUPS}
    ungated = 0
    for base, past, pp, group, note in VERBS:
        gid = f"irr_{group}"
        cands = [first_at[f] for f in base_forms(base, irregular) if f in first_at]
        b_at = min(cands) if cands else None
        row = {
            "base": base,
            "past": past,
            "pp": pp,
            "base_by": unit_at(b_at),
            "past_by": unit_at(later(b_at, past_p)),
            "pp_by": unit_at(later(b_at, pp_p)),
        }
        if note:
            row["note"] = note
        if b_at is None:
            ungated += 1
        rows_by_group[gid].append(row)

    # Sections are generic: `columns` drives the table, `drill` drives the
    # practice pool. A future tab (prepositions, pronouns) is therefore DATA
    # ONLY — no change to js/reference.js.
    COLUMNS = [
        {"key": "base", "label": "Base"},
        {"key": "past", "label": "Past simple"},
        {"key": "pp", "label": "Past participle"},
    ]
    DRILL = [
        {"from": "base", "to": "past", "label": "past"},
        {"from": "base", "to": "pp", "label": "participle"},
    ]

    sections = []
    for gid, title, sub, exemplar, intro in GROUPS:
        sections.append({
            "id": gid,
            "title": title,
            "sub": sub,
            "exemplar": exemplar,
            "intro": intro,
            "columns": COLUMNS,
            "drill": DRILL,
            "rows": rows_by_group[gid],
        })

    payload = {
        "version": 1,
        "app": "rue-exp",
        "note": ("Tables + free practice. Generated by scratchpad/gen_reference.py — "
                 "`by` fields are derived from what the packs actually teach, never "
                 "hand-set. Practice draws only from taught cells and is untracked "
                 "on purpose: no fruit, no SRS."),
        "past_unit": PAST_UNIT,
        "pp_unit": PP_UNIT,
        "tabs": [
            {"id": "verbs", "label": "Irregular verbs",
             "blurb": "Grouped by pattern — the group is the thing to learn, not 66 separate words.",
             "sections": sections},
            {"id": "preps", "label": "Prepositions",
             "blurb": "One Czech word is often three English ones. Coming next.",
             "sections": []},
            {"id": "pron", "label": "Pronouns & tenses",
             "blurb": "I / me / my / mine / myself, and the tense grid. Coming next.",
             "sections": []},
            {"id": "spell", "label": "Spelling & pairs",
             "blurb": "study → studies, stop → stopping; make/do, say/tell. Coming next.",
             "sections": []},
        ],
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n",
                   encoding="utf-8")
    total = len(VERBS)
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"  {total} irregular verbs in {len(GROUPS)} pattern groups")
    for gid, title, *_ in GROUPS:
        print(f"    {title:26} {len(rows_by_group[gid]):3}")
    print(f"  verbs the path never teaches (permanently dimmed): {ungated}")
    taught_past = sum(1 for g in sections for r in g["rows"] if r["past_by"])
    print(f"  rows whose past form is gated to a real unit: {taught_past}/{total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
