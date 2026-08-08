#!/usr/bin/env python3
"""
audit.py — advisory sequencing audit with a RATCHET baseline.

For every live unit in course-path order, checks that the English words its
items expose were taught before that unit (make_pool semantics), taught by the
unit itself, or are function-word GLUE. Unknown tokens are VIOLATIONS.

The existing course was not authored against this gate, so violations exist.
The contract is a ratchet, not a wall:

    py -X utf8 codex/audit.py            # report only (writes audit/ files)
    py -X utf8 codex/audit.py --check    # exit 1 if total violations EXCEED
                                         # audit/sequencing-baseline.json;
                                         # if lower, baseline auto-tightens

Blind spots (documented, not solved): naive suffix stemming; homographs
(string match is not meaning match); multi-word expressions are checked
word-by-word. Treat reports as leads, not verdicts.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
AUDIT_DIR = ROOT / "audit"

WORD_RE = re.compile(r"[a-z']+")
PARENS_RE = re.compile(r"\([^)]*\)")

# Function words + ultra-core always legally available (never "untaught").
GLUE = set("""
a an the this that these those here there
i you he she it we they me him her us them my your his its our their mine yours
who what where when why how which whose whom
be am is are was were been being have has had do does did done doing
will would can could may might must shall should ought need
not no yes n't never always often sometimes usually
and or but so because if then than as of to in on at by for with from about
into over under between through during before after up down out off around
again once too very really quite just only also even still already yet
one two three four five six seven eight nine ten eleven twelve twenty thirty
forty fifty sixty seventy eighty ninety hundred thousand first second third
some any all every each both few many much more most other another same
please let 's am o'clock ok okay
monday tuesday wednesday thursday friday saturday sunday
january february march april may june july august september october november
december english czech polish french german spanish
prague brno vienna london ostrava
anna martina tom tomas petr pavel jana eva jan david peter mary john
""".split())

SUFFIXES = ("ing", "ed", "es", "s", "er", "est", "ly", "d")

# Contractions the tokenizer sees as ONE token (WORD_RE includes apostrophe,
# so "it's" never splits into "it" + "is"). Expand to what they mean; genuinely
# unlisted 's forms fall through to the generic genitive strip below.
CONTRACTIONS = {
    "i'm": ("i", "am"), "i'd": ("i", "would", "had"), "i'll": ("i", "will"),
    "i've": ("i", "have"),
    "you're": ("you", "are"), "you'd": ("you", "would", "had"),
    "you'll": ("you", "will"), "you've": ("you", "have"),
    "we're": ("we", "are"), "we'd": ("we", "would", "had"),
    "we'll": ("we", "will"), "we've": ("we", "have"),
    "they're": ("they", "are"), "they'd": ("they", "would", "had"),
    "they'll": ("they", "will"), "they've": ("they", "have"),
    "he's": ("he", "is", "has"), "he'd": ("he", "would", "had"),
    "he'll": ("he", "will"),
    "she's": ("she", "is", "has"), "she'd": ("she", "would", "had"),
    "she'll": ("she", "will"),
    "it's": ("it", "is", "has"), "it'll": ("it", "will"),
    "that's": ("that", "is", "has"), "that'll": ("that", "will"),
    "there's": ("there", "is", "has"), "there'll": ("there", "will"),
    "who's": ("who", "is", "has"), "what's": ("what", "is", "has"),
    "where's": ("where", "is", "has"), "when's": ("when", "is"),
    "how's": ("how", "is"), "let's": ("let", "us"),
    "isn't": ("is", "not"), "aren't": ("are", "not"),
    "wasn't": ("was", "not"), "weren't": ("were", "not"),
    "haven't": ("have", "not"), "hasn't": ("has", "not"),
    "hadn't": ("had", "not"), "don't": ("do", "not"),
    "doesn't": ("does", "not"), "didn't": ("did", "not"),
    "won't": ("will", "not"), "can't": ("can", "not"),
    "couldn't": ("could", "not"), "shouldn't": ("should", "not"),
    "wouldn't": ("would", "not"), "mustn't": ("must", "not"),
}

# Irregular past / past participle -> base. Suffix stripping cannot reach these,
# so without the table every `sat`, `knew`, `said` reads as untaught and agents
# rewrite good sentences to dodge words the course already teaches.
IRREGULAR = {}
for _base, _forms in {
    "be": "was were been", "become": "became become", "begin": "began begun",
    "break": "broke broken", "bring": "brought", "build": "built",
    "buy": "bought", "catch": "caught", "choose": "chose chosen",
    "come": "came", "cost": "cost", "cut": "cut", "do": "did done",
    "drink": "drank drunk", "drive": "drove driven", "eat": "ate eaten",
    "fall": "fell fallen", "feel": "felt", "find": "found", "fly": "flew flown",
    "forget": "forgot forgotten", "get": "got gotten", "give": "gave given",
    "go": "went gone", "grow": "grew grown", "have": "had", "hear": "heard",
    "hold": "held", "keep": "kept", "know": "knew known", "learn": "learnt",
    "leave": "left", "lend": "lent", "let": "let", "lose": "lost",
    "make": "made", "mean": "meant", "meet": "met", "pay": "paid",
    "put": "put", "read": "read", "ride": "rode ridden", "ring": "rang rung",
    "run": "ran", "say": "said", "see": "saw seen", "sell": "sold",
    "send": "sent", "shut": "shut", "sing": "sang sung", "sit": "sat",
    "sleep": "slept", "speak": "spoke spoken", "spend": "spent",
    "stand": "stood", "swim": "swam swum", "take": "took taken",
    "teach": "taught", "tell": "told", "think": "thought", "throw": "threw thrown",
    "understand": "understood", "wake": "woke woken", "wear": "wore worn",
    "win": "won", "write": "wrote written",
}.items():
    for _f in _forms.split():
        IRREGULAR.setdefault(_f, set()).add(_base)


def variants(tok: str) -> list[str]:
    out = [tok]
    out.extend(IRREGULAR.get(tok, ()))
    if tok in CONTRACTIONS:
        out.extend(CONTRACTIONS[tok])
    elif tok.endswith("'s") and len(tok) > 3:
        # Unlisted 's forms are genitive nouns (father's, sister's) — the
        # bare noun is what matters; strip and let normal suffix rules run
        # on the result too (father's -> father -> already handled below).
        out.append(tok[:-2])
    for suf in SUFFIXES:
        if tok.endswith(suf) and len(tok) > len(suf) + 2:
            stem = tok[: -len(suf)]
            out.append(stem)
            out.append(stem + "e")           # making -> make
            if len(stem) > 2 and stem[-1] == stem[-2]:
                out.append(stem[:-1])        # running -> run
            if stem.endswith("i"):
                out.append(stem[:-1] + "y")  # studies -> study
    return out


def tokens_of(text: str) -> list[str]:
    return WORD_RE.findall(text.lower().replace("’", "'"))


def full_path(tree: dict) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for key in ("path_order", "path_order_a2", "path_order_b1",
                "path_order_b2", "path_order_c1"):
        for nid in tree.get(key) or []:
            if nid not in seen:
                seen.add(nid)
                out.append(nid)
    return out


def targets_of(pack: dict, domain: str) -> set[str]:
    out: set[str] = set()

    def add(s: str) -> None:
        s = PARENS_RE.sub(" ", s)
        for part in s.split("/"):
            for w in tokens_of(part):
                out.add(w)

    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if not isinstance(it, dict):
                continue
            if isinstance(it.get("gap_answer"), str):
                add(it["gap_answer"])
            if isinstance(it.get("lemma"), str):
                add(it["lemma"])
            if domain == "vocab" and not it.get("gap") and isinstance(it.get("en"), str):
                add(it["en"])
    return out


def exposed_text(pack: dict) -> list[str]:
    """Every English string a student is shown — items AND the Use sentence
    bank. Sentence banks are production targets, so they expose vocabulary
    exactly like items do and must be audited the same way.

    Parenthetical content ("free (time)") is a disambiguating gloss note, not
    vocabulary in its own right — targets_of() already excludes it from what
    a pack teaches, so it must be excluded here too, or the note reads as an
    untaught word inside the very item that glosses it."""
    texts: list[str] = []
    for b in pack.get("blocks") or []:
        for it in b.get("items") or []:
            if isinstance(it, dict) and isinstance(it.get("en"), str):
                texts.append(PARENS_RE.sub(" ", it["en"]))
    for s in pack.get("sentences") or []:
        if isinstance(s, dict) and isinstance(s.get("en"), str):
            texts.append(PARENS_RE.sub(" ", s["en"]))
    return texts


def main() -> int:
    check = "--check" in sys.argv
    tree = json.loads((DATA / "tree.json").read_text(encoding="utf-8"))
    by_id = {n["id"]: n for n in tree.get("nodes") or []}
    order = full_path(tree)

    pool: set[str] = set()
    report: dict[str, dict] = {}
    total = 0

    def node_targets(nid: str) -> set[str]:
        node = by_id.get(nid)
        if not node or not node.get("content"):
            return set()
        f = DATA / node["content"]
        if not f.is_file():
            return set()
        return targets_of(
            json.loads(f.read_text(encoding="utf-8")),
            node.get("domain", "vocab"),
        )

    for nid in order:
        node = by_id.get(nid)
        if not node or node.get("status") != "live" or not node.get("content"):
            continue
        pack_file = DATA / node["content"]
        if not pack_file.is_file():
            continue
        pack = json.loads(pack_file.read_text(encoding="utf-8"))
        own = targets_of(pack, node.get("domain", "vocab"))
        # Zigzag pairs teach together: the partner unit's targets are legal
        # (grammar examples may use words its same-step vocab unit teaches).
        partner = node_targets(node["partner_id"]) if node.get("partner_id") else set()
        legal = pool | own | partner | GLUE
        unknown: dict[str, int] = {}
        for text in exposed_text(pack):
            for tok in tokens_of(text):
                if any(v in legal for v in variants(tok)):
                    continue
                unknown[tok] = unknown.get(tok, 0) + 1
        if unknown:
            report[nid] = {
                "level": node.get("levels", ["?"])[0],
                "domain": node.get("domain"),
                "unknown": dict(sorted(unknown.items(), key=lambda kv: -kv[1])),
            }
            total += len(unknown)
        pool |= own

    AUDIT_DIR.mkdir(exist_ok=True)
    (AUDIT_DIR / "sequencing-report.json").write_text(
        json.dumps({"total_unknown_types": total, "units": report},
                   ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    lines = [
        "# Sequencing audit (advisory — leads, not verdicts)",
        "",
        f"**{total} unknown word types** across {len(report)} live units "
        f"(of {sum(1 for n in by_id.values() if n.get('status') == 'live')}).",
        "",
        "A word is *unknown* at a unit if no earlier live unit taught it, the "
        "unit doesn't teach it itself, and it isn't function-word GLUE.",
        "",
    ]
    for nid, r in report.items():
        words = ", ".join(f"{w}×{c}" if c > 1 else w for w, c in r["unknown"].items())
        lines.append(f"- **{nid}** ({r['level']} {r['domain']}): {words}")
    (AUDIT_DIR / "SEQUENCING-REPORT.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    print(f"audit: {total} unknown types across {len(report)} units")

    baseline_path = AUDIT_DIR / "sequencing-baseline.json"
    if not baseline_path.is_file():
        baseline_path.write_text(
            json.dumps({"total_unknown_types": total}) + "\n", encoding="utf-8"
        )
        print(f"baseline written: {total}")
        return 0
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    base_total = baseline.get("total_unknown_types", 0)
    if check and total > base_total:
        print(f"RATCHET FAIL: {total} > baseline {base_total}")
        return 1
    if total < base_total:
        baseline_path.write_text(
            json.dumps({"total_unknown_types": total}) + "\n", encoding="utf-8"
        )
        print(f"baseline tightened: {base_total} -> {total}")
    else:
        print(f"ratchet ok: {total} vs baseline {base_total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
