#!/usr/bin/env python3
"""
check_sentence_texture.py — is a B1 vocab sentence actually a B1 sentence?

The gap no existing gate sees. lint.py checks the pack will not crash, audit.py
checks no word arrives before it is taught, check_pretaught.py checks no
structure is demanded before it is explained. All three pass a bank made
entirely of `The exam was very stressful.` — a B1 word dropped into an A1 frame,
with nothing else in the sentence and nothing recycled from the 36 units behind
it. Found 2026-09-04 smoking B1 vocab: 15 drafted leaves, every sentence the
same shape.

The bar (James, dropdown 2026-09-04) — a sentence passes only if BOTH hold:

  STRUCTURE  it makes one clause move beyond `NP + be + ADJ`: a subordinate or
             relative clause, too/enough + to, a comparative, a verb + to-inf or
             verb + -ing complement, a passive, a perfect, or an explicit
             contrast. Surface-matched, like every check in this folder — crude,
             but the question is only "does the sentence do anything at all".

  RECYCLING  at least two content words besides the target lemma that earlier
             units already taught. Own-unit lemmas do not count: they are being
             learned now, not recycled. GLUE does not count.

The ceiling is path-aware, not level-aware: every non-target content word must
already be taught somewhere earlier on the teaching path (A1 -> A2 -> B1 to this
slot). A word above B1 in the Oxford map that IS taught earlier is fine; a B1
word borrowed from a unit twenty slots later is not.

Read-only. Prints a report; writes nothing.

Usage:
  py -X utf8 codex/check_sentence_texture.py                # all B1 vocab
  py -X utf8 codex/check_sentence_texture.py leaf_crime_b1  # one leaf
  py -X utf8 codex/check_sentence_texture.py --pass         # show passes too
  py -X utf8 codex/check_sentence_texture.py --json         # machine output
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import audit  # GLUE, variants, tokens_of, targets_of, proper_tokens
from tree_path import teaching_path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# --- structure moves ---------------------------------------------------------
# A subordinator followed by something that can start a clause. This is what
# separates "when it was over" (clause) from "before the exam" (prepositional
# phrase) without a parser.
SUBJECTISH = (
    r"(?:i|you|he|she|it|we|they|there|the|a|an|my|your|his|her|our|their|this|"
    r"that|these|those|somebody|someone|everybody|everyone|nobody|people|"
    r"most|some|many|few|all)"
)
SUBORDINATOR = (
    r"(?:when|while|because|although|though|even though|if|unless|until|till|"
    r"before|after|since|whenever|so that|in case|as soon as|as long as)"
)

MOVES = {
    "sub": re.compile(r"\b" + SUBORDINATOR + r"\s+" + SUBJECTISH + r"\b"),
    "rel": re.compile(
        r"\b(?:who|which|whose|where)\b"
        r"|\bthat\s+" + SUBJECTISH + r"\b"
        r"|\bthat\s+(?:is|are|was|were|has|have|had|will|can|could|would)\b"
    ),
    "too_to": re.compile(r"\btoo\b[^.]*?\bto\s+\w+|\benough\b[^.]*?\bto\s+\w+"),
    # NOT_SUPERLATIVE: "the forest covers most of the area" and "thousands joined
    # the protest" both matched `the \w+est` and passed as comparatives.
    # "a bigger variety than the one in town" — the comparative adjective and
    # `than` are not adjacent once a noun sits between them, so allow a short gap.
    "comparative": re.compile(
        r"\b\w{3,}er\b(?:\s+\w+){0,2}\s+than\b|\b(?:more|less)\s+\w+(?:\s+\w+){0,2}\s+than\b"
        r"|\bas\s+\w+\s+as\b|\bthe most \w+"
        r"|\bthe (?!protest|forest|interest|contest|request|guest|harvest|"
        r"conquest|arrest|nest|west|rest|test|best\b)\w{3,}est\b"
        r"|\bbetter than\b|\bworse than\b"
    ),
    # B1 catenatives only. want/need/like/have + to are A1 frames — a bank of
    # "I want to donate money" is the same flatness in a longer coat, so they
    # live in to_inf_basic below and do not satisfy STRUCTURE on their own.
    "to_inf": re.compile(
        r"\b(?:decide|decided|hope|hopes|hoped|plan|plans|planned|promise|"
        r"promised|refuse|refused|manage|managed|offer|offered|agree|agreed|"
        r"seem|seems|seemed|forget|forgot|remember|remembered|afford|afforded|"
        r"expect|expected|pretend|pretended|threaten|threatened|arrange|"
        r"arranged|fail|failed|deserve|deserved|tend|tends|encourage|encouraged|"
        r"persuade|persuaded|allow|allowed|remind|reminded|warn|warned|"
        r"teach|taught|advise|advised|invite|invited)\s+(?:\w+\s+)?to\s+\w+"
    ),
    "to_inf_basic": re.compile(
        r"\b(?:want|wants|wanted|need|needs|needed|try|tries|tried|like|likes|"
        r"liked|love|loves|loved|start|started|begin|began|continue|learn|learnt|"
        r"learned|going|able|have|has|had)\s+to\s+\w+"
    ),
    "ing_comp": re.compile(
        r"\b(?:like|likes|liked|love|loves|loved|hate|hates|hated|enjoy|enjoys|"
        r"enjoyed|mind|minds|minded|avoid|avoids|avoided|finish|finished|stop|"
        r"stopped|keep|keeps|kept|start|started|begin|began|suggest|suggested|"
        r"consider|considered|practise|practised|practice|practiced|worth|"
        r"instead of|good at|before|after|by)\s+\w+ing\b"
    ),
    "contrast": re.compile(
        r"\bbut\b|,\s*not\b|\bnot\s+\w+[^.]*,|\bhowever\b|\binstead\b|\bwhereas\b"
    ),
    "passive": re.compile(
        r"\b(?:is|are|was|were|be|been|being|get|gets|got)\s+(?:\w+ed|born|made|"
        r"found|taken|given|told|sold|built|caught|kept|lost|paid|sent|written|"
        r"stolen|arrested|broken|hurt|put|shut|cut|held|left|beaten|driven|"
        r"chosen|eaten|known|seen|spoken)\b"
    ),
    "perfect": re.compile(
        r"\b(?:have|has|had|'ve|'s|'d)\s+(?:been|\w+ed|gone|done|seen|made|taken|"
        r"given|told|sold|built|caught|kept|lost|paid|sent|written|stolen|broken|"
        r"come|become|begun|known|spoken|got)\b"
    ),
    "modal_perf": re.compile(
        r"\b(?:must|might|may|could|should|would|can't|couldn't)\s+(?:have|not have)\b"
    ),
    "cond": re.compile(r"\bwould\b|\bwouldn't\b|\bcould\b|\bmight\b"),
}

# "while", "before" and "after" appear in two MOVES; harmless, a sentence needs
# only one hit. WEAK moves are reported but do not on their own satisfy
# STRUCTURE: a bare "would" is not a clause, and "I want to X" is an A1 frame
# that a B1 bank can lean on until every sentence sounds identical.
WEAK_MOVES = {"cond", "to_inf_basic"}

PARENS_RE = re.compile(r"\([^)]*\)")

# audit.IRREGULAR has no `steal`, so `stole` reads as a different word from the
# lemma it teaches and a correct sentence flags untaught. Patched locally, NOT in
# audit.py: that file is shared with every level tab and its ratchet baseline is
# a shared number. The upstream gap is real and is written up for the
# coordination tab — this shim goes away if and when audit.py takes the entries.
EXTRA_IRREGULAR = {
    "stole": "steal", "stolen": "steal", "hurt": "hurt", "hit": "hit",
    "fed": "feed", "fought": "fight", "hid": "hide", "hidden": "hide",
    "rose": "rise", "risen": "rise", "shook": "shake", "shot": "shoot",
    "spread": "spread", "stuck": "stick", "struck": "strike",
    "swore": "swear", "tore": "tear", "torn": "tear", "drew": "draw",
    "drawn": "draw", "blew": "blow", "blown": "blow", "bit": "bite",
    "dealt": "deal", "dug": "dig", "led": "lead", "lit": "light",
    "shone": "shine", "showed": "show", "shown": "show", "sank": "sink",
    "slid": "slide", "swung": "swing",
}
for _f, _b in EXTRA_IRREGULAR.items():
    audit.IRREGULAR.setdefault(_f, set()).add(_b)


def pack_of(node):
    rel = node.get("content")
    if not rel:
        return None
    f = DATA / rel
    if not f.is_file():
        return None
    return json.loads(f.read_text(encoding="utf-8"))


def unit_lemmas(pack):
    """Every word this unit itself teaches — legal, but not 'recycled'."""
    out = set()
    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if isinstance(it, dict) and isinstance(it.get("en"), str):
                out.update(audit.tokens_of(PARENS_RE.sub(" ", it["en"])))
    return out


def build_pools(tree):
    """For each node id, the set of words every EARLIER unit taught."""
    by_id = {n["id"]: n for n in tree.get("nodes") or [] if n.get("id")}
    pools = {}
    pool = set()
    for nid in teaching_path(tree):
        node = by_id.get(nid)
        pools[nid] = set(pool)
        if not node or node.get("status") != "live":
            continue
        pack = pack_of(node)
        if pack:
            pool |= audit.targets_of(pack, node.get("domain", "vocab"))
    return pools


def moves_in(text):
    t = text.lower().replace("’", "'")
    return [name for name, rx in MOVES.items() if rx.search(t)]


def check_sentence(sent, prior, own):
    en = PARENS_RE.sub(" ", sent.get("en") or "")
    targets = set()
    for lem in sent.get("lemmas") or []:
        targets.update(audit.tokens_of(lem))
    proper = audit.proper_tokens(en)
    toks = audit.tokens_of(en)

    recycled, untaught, own_hits = [], [], []
    for tok in toks:
        if tok in audit.GLUE or tok in proper or tok in targets:
            continue
        vs = audit.variants(tok)
        if any(v in targets for v in vs):
            continue
        if any(v in own for v in vs):
            own_hits.append(tok)
            continue
        if any(v in prior for v in vs):
            recycled.append(tok)
        else:
            untaught.append(tok)

    found = moves_in(en)
    strong = [m for m in found if m not in WEAK_MOVES]

    flags = []
    if not strong:
        flags.append("FLAT")
    if len(set(recycled)) < 2:
        flags.append("THIN(%d)" % len(set(recycled)))
    for w in sorted(set(untaught)):
        flags.append("UNTAUGHT:" + w)

    return {
        "en": sent.get("en"),
        "lemmas": sent.get("lemmas") or [],
        "moves": found,
        "recycled": sorted(set(recycled)),
        "own": sorted(set(own_hits)),
        "untaught": sorted(set(untaught)),
        "flags": flags,
        "ok": not flags,
    }


def main():
    show_pass = "--pass" in sys.argv
    as_json = "--json" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("-")]

    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree.get("nodes") or [] if n.get("id")}
    pools = build_pools(tree)

    order = tree.get("path_order_b1") or []
    results, tot_s, tot_f = {}, 0, 0

    for slot, nid in enumerate(order, 1):
        if only and nid not in only:
            continue
        node = by_id.get(nid)
        if not node or node.get("domain") == "grammar":
            continue
        pack = pack_of(node)
        if not pack or not pack.get("sentences"):
            continue
        own = unit_lemmas(pack)
        prior = pools.get(nid, set())
        rows = [check_sentence(s, prior, own)
                for s in pack["sentences"] if isinstance(s, dict)]
        if not rows:
            continue
        bad = [r for r in rows if not r["ok"]]
        results[nid] = {"slot": slot, "rows": rows,
                        "fail": len(bad), "total": len(rows)}
        tot_s += len(rows)
        tot_f += len(bad)

    if as_json:
        print(json.dumps(results, ensure_ascii=False, indent=1))
        return 0

    for nid, r in results.items():
        print("\n=== %2d %s — %d/%d fail" % (r["slot"], nid, r["fail"], r["total"]))
        for row in r["rows"]:
            if row["ok"] and not show_pass:
                continue
            mark = "ok  " if row["ok"] else "FAIL"
            print("  %s %s" % (mark, row["en"]))
            if row["flags"]:
                print("       " + " · ".join(row["flags"]))
            print("       moves=%s recycled=%s own=%s"
                  % (row["moves"] or "-", row["recycled"] or "-", row["own"] or "-"))

    print("\ntexture: %d/%d sentences fail across %d B1 vocab units"
          % (tot_f, tot_s, len(results)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
