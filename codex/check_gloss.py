#!/usr/bin/env python3
"""
check_gloss.py — C6 and C58 on intro cards.

**C6: a gloss must not be harder than the word it glosses.** James, 2026-09-05,
playing `b1_past_modals`: the Job column defined *had to* as *"you were obliged
to do it"* — "defines must/have to as 'you were obliged to do it' · uses complex
word to define a simple word · bad pedagogy · use simpler words and give an
example sentence". *obliged* is not in the Oxford 5000 at all. The same card set
also said *"not that it was forbidden"*, which is the same fault a card later.

Levels come from `codex/vocab/oxford-5k-cefr.csv`. A word is flagged when its
easiest listed sense is above the pack's own level, or when no form of it is in
the 5000 at all.

**C58: a meaning table shows the form in a sentence.** Same flag: "use simpler
words **and give an example sentence**". A table whose column glosses a form
needs an Example column, or examples under the card.

Both are noisy by nature — grammar teaching needs grammar words, and a pack
quotes Czech and shows affixes. Everything the filters below drop is a class of
false positive found by reading the output, not a guess:

  * the unit's own material — a word the pack teaches or shows in an example is
    not a gloss of itself (*spite* in `in spite of`, *tag* in question tags)
  * emphasis — `*navzdory*`, `**zvyknout si**`, `**tak… jako**`: an off-list word
    inside bold or italic is being quoted, not used to explain
  * affixes — `-ing`, `-est`, `dis-`, `pre-`
  * grammar metalanguage — participle, phrasal, uncountable (C22 governs whether
    A1 metalanguage needs a Czech gloss; that is lint's `a1meta`, not this)
  * proper nouns, and the Czech column of a table (C19 governs that)

Ratchet, like C9 and C10: the count may fall, never rise.

    py -X utf8 codex/check_gloss.py               # every A1-B1 grammar pack
    py -X utf8 codex/check_gloss.py b1_past_modals
    py -X utf8 codex/check_gloss.py --level b1    # one level
    py -X utf8 codex/check_gloss.py --check       # non-zero exit if the count rose
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAMMAR = ROOT / "data/grammar/blocks"
CEFR = ROOT / "codex/vocab/oxford-5k-cefr.csv"
REFERENCE = ROOT / "data/reference.json"
BASELINE = ROOT / "audit/gloss-baseline.json"

ORDER = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5}

# A column whose header names a meaning is a gloss column; C58 asks it for an example.
MEANING_HEAD = re.compile(r"^(job|meaning|use|used for|what it (does|means)|which|why|sense|idea)$", re.I)
EXAMPLE_HEAD = re.compile(r"(example|sentence|say this|shape)", re.I)
CZECH_HEAD = re.compile(r"cz|czech|česk", re.I)
# a column that carries the material itself, not a gloss of it
MATERIAL_HEAD = re.compile(r"^(root|base|stem|word|verb|noun|suffix|prefix|form|shape|type|activity.*)$", re.I)
CZECH_LETTER = re.compile(r"[áčďéěíňóřšťúůýž]", re.I)

META = set("""
noun nouns verb verbs adjective adjectives adverb adverbs pronoun pronouns article articles
preposition prepositions conjunction conjunctions modal modals participle participles infinitive
gerund plural plurals singular countable uncountable uncountables subject subjects object objects
clause clauses tense tenses form forms base comparative comparatives superlative superlatives
negative positive question questions statement contraction contractions vowel consonant syllable
syllables auxiliary determiner quantifier quantifiers possessive reflexive reflexives relative
conditional conditionals passive passives active continuous perfect simple separable inseparable
prefix prefixes suffix suffixes root stem ending endings tag tags comma commas apostrophe hyphen
capital letter letters spelling word words phrase phrases irregular irregulars regular phrasal
particle particles doer agent backshift stress unstressed article-free wh adj adv
modality obligation speculation deduction certainty possibility impossibility ability permission
command commands request requests statement statements grammar vocabulary
""".split())

# Czech quoted in an English point without diacritics to catch it
CZECH_BARE = set("""
tak jako moc budu bude byl byla bylo jsem jsi jsme jste pod nad vedle tady kdy kde
proto protoze ale nebo ani uz jeste musim muze mit byt to ten ta ti se si ne ano
""".split())

GLUE = set("""
the this that these those you him her his its our their they them
never always often sometimes usually because than another same please
something anything someone somebody nothing everything everyone nobody
here there now then when where why how what who which whose
one two three four five six seven eight nine ten first second third
am is are was were be been being have has had do does did done doing
go goes going gone went get gets got getting say says said
not never no yes and or but for with from about into over under
more most much many few less least own such very quite really just only also even still yet
english czech
""".split())


def load_levels() -> dict:
    out = {}
    with CEFR.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            w = (r.get("word") or "").strip().lower()
            l = (r.get("level") or "").strip().lower()
            if not w or l not in ORDER:
                continue
            if w not in out or ORDER[l] < ORDER[out[w]]:
                out[w] = l
    return out


def load_irregulars() -> dict:
    """past/participle -> base, from the app's own reference tables."""
    out = {}
    try:
        ref = json.loads(REFERENCE.read_text(encoding="utf-8"))
    except Exception:
        return out
    for tab in ref.get("tabs") or []:
        for sec in tab.get("sections") or []:
            for row in sec.get("rows") or []:
                if not isinstance(row, dict):
                    continue
                base = row.get("base") or row.get("verb")
                if not (base and row.get("past")):
                    continue
                for k in (row.get("past"), row.get("participle"), row.get("pp")):
                    if k:
                        out[str(k).strip().lower()] = str(base).strip().lower()
    return out


LEVELS = load_levels()
IRREGULAR = load_irregulars()


def variants(w: str) -> set:
    out = {w}
    if w in IRREGULAR:
        out.add(IRREGULAR[w])
    for suf, base in (("ies", "y"), ("ied", "y"), ("es", ""), ("s", ""), ("ed", ""), ("ed", "e"),
                      ("ing", ""), ("ing", "e"), ("ly", ""), ("er", ""), ("er", "e"),
                      ("est", ""), ("est", "e"), ("ier", "y"), ("iest", "y")):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            out.add(w[:-len(suf)] + base)
    for v in list(out):
        if len(v) > 3 and v[-1] == v[-2] and v[-1] not in "aeiou":
            out.add(v[:-1])
    return out


def word_level(w: str):
    """The EASIEST level any form of this word carries, or None if off-list.

    "means" is a b2 noun and an a2 verb; "used" is b1 as an adjective and a1 as
    a verb. Taking the first hit out of an unordered set flagged both.
    """
    best = None
    for v in variants(w):
        l = LEVELS.get(v)
        if l and (best is None or ORDER[l] < ORDER[best]):
            best = l
    return best


def cards_of(d: dict) -> list:
    intro = d.get("intro")
    if isinstance(intro, dict):
        return intro.get("cards") or []
    return intro or []


def material(d: dict) -> set:
    """Every word the unit teaches or shows: not a gloss of itself."""
    out = set()

    def add(t):
        for w in re.findall(r"[A-Za-z']+", str(t or "").lower()):
            w = w.strip("'")
            if w:
                out.update(variants(w))

    for b in d.get("blocks") or []:
        for it in b.get("items") or []:
            for k in ("en", "gap", "gap_answer", "wrong"):
                add(it.get(k))
            for a in it.get("accepts") or []:
                add(a)
            for o in it.get("quiz_options") or []:
                add(o)
    add(d.get("title"))
    for c in cards_of(d):
        add(c.get("title"))
        for e in c.get("examples") or []:
            add(e.get("en") if isinstance(e, dict) else e)
        for fr in c.get("frames") or []:
            add(fr)
    return out


def surfaces(card: dict) -> list:
    """(where, text) for every surface that explains rather than exemplifies."""
    out = []
    for i, p in enumerate(card.get("points") or []):
        out.append(("point %d" % i, p))
    for ti, t in enumerate(tables_of(card)):
        heads = t.get("headers") or []
        for row in t.get("rows") or []:
            for ci, cell in enumerate(row):
                head = str(heads[ci]) if ci < len(heads) else "col%d" % ci
                if CZECH_HEAD.search(head) or EXAMPLE_HEAD.search(head):
                    continue          # C19 owns the Czech column; examples are not glosses
                if MATERIAL_HEAD.match(head.strip()):
                    continue          # the Root / Form column IS the material
                out.append((head, str(cell)))
    return out


def tables_of(card: dict) -> list:
    return ([card["table"]] if card.get("table") else []) + list(card.get("tables") or [])


def decontract(t: str) -> str:
    t = re.sub(r"n['’]t\b", " not", t, flags=re.I)
    t = re.sub(r"['’](re|ve|ll|m|d|s)\b", r" \1", t, flags=re.I)
    return t


def emphasised(text: str) -> set:
    """Words inside ** ** or * * — quoted material, not the gloss."""
    out = set()
    for m in re.findall(r"\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~", text):
        for part in m:
            for w in re.findall(r"[A-Za-z']+", part.lower()):
                out.add(w.strip("'"))
    return out


def hard_words(d: dict, level: str) -> list:
    """C6 findings: a gloss word above the pack's level."""
    cap = ORDER[level]
    mine = material(d)
    out = []
    for ci, card in enumerate(cards_of(d)):
        for where, text in surfaces(card):
            quoted = emphasised(text)
            plain = re.sub(r"\([^)]*\)", " ", text)
            if CZECH_LETTER.search(plain):
                continue                                   # a Czech cell
            # emphasis inside a word (informa**tion**) is one word, not two fragments
            plain = decontract(re.sub(r"[*~_`]", "", plain))
            built = set()
            for m in re.finditer(r"[A-Za-z]*\*\*[A-Za-z]+\*\*[A-Za-z]*", text):
                frag = re.sub(r"[*]", '', m.group(0)).lower()
                if frag:
                    built.add(frag)
            if not str(where).startswith("point") and re.match(r"^[A-Z].*[.!?…]$", plain.strip()):
                continue                                   # the cell is an example sentence
            for k, tok in enumerate(re.findall(r"[A-Za-z']+", plain)):
                w = tok.lower().strip("'")
                if len(w) < 3 or w in GLUE or w in META or w in CZECH_BARE:
                    continue
                if w in quoted or w in mine or w in built:
                    continue
                if tok[0].isupper() and k > 0:
                    continue                               # proper noun mid-string
                if re.search(r"[-‑–]\s*%s\b|\b%s\s*[-‑–]" % (re.escape(w), re.escape(w)),
                             plain, re.I):
                    continue                               # an affix being taught
                lvl = word_level(w)
                if lvl is None:
                    out.append(("C6", ci, card.get("title"), where, w, "off-list", text))
                elif ORDER[lvl] > cap:
                    out.append(("C6", ci, card.get("title"), where, w, lvl, text))
    return out


def tables_without_examples(d: dict) -> list:
    """C58 findings: a meaning table that never shows the form in a sentence."""
    out = []
    for ci, card in enumerate(cards_of(d)):
        has_examples = bool(card.get("examples") or card.get("frames"))
        for t in tables_of(card):
            heads = [str(h) for h in (t.get("headers") or [])]
            if not any(MEANING_HEAD.match(h.strip()) for h in heads):
                continue
            if any(EXAMPLE_HEAD.search(h) for h in heads) or has_examples:
                continue
            rows = t.get("rows") or []
            # a column of full sentences IS the example, whichever column it is:
            # second conditional's Phrase column already reads
            # "**If I** were you, I would take the job."
            width = max((len(r) for r in rows), default=0)
            shown = False
            for i in range(width):
                cells = [str(r[i]).strip() for r in rows if i < len(r)]
                if cells and all(re.search(r"[.!?…]$", c) for c in cells):
                    shown = True
            if shown:
                continue
            out.append(("C58", ci, card.get("title"), " / ".join(heads), "", "",
                        "meaning table with no example"))
    return out


def main() -> int:
    argv = sys.argv[1:]
    check = "--check" in argv
    want_level = None
    if "--level" in argv:
        i = argv.index("--level")
        want_level = argv[i + 1].lower()
        argv = argv[:i] + argv[i + 2:]          # the level is not a pack name
    args = [a for a in argv if not a.startswith("-")]

    packs = {}
    for f in sorted(GRAMMAR.glob("*.json")):
        try:
            packs[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue

    rows, total = [], 0
    for uid, d in packs.items():
        lvl = str(d.get("level") or "").lower()
        if lvl not in ("a1", "a2", "b1"):
            continue
        if want_level and lvl != want_level:
            continue
        if args and uid not in args:
            continue
        hits = hard_words(d, lvl) + tables_without_examples(d)
        if hits:
            rows.append((len(hits), uid, lvl, hits))
            total += len(hits)

    rows.sort(key=lambda r: -r[0])
    if not rows:
        print("check_gloss: clean")
    else:
        print("INTRO GLOSSES — C6 too hard for the level, C58 meaning table with no example\n")
        for n, uid, lvl, hits in rows:
            protect = "  [PROTECTED — do not touch]" if lvl in ("a1", "a2") else ""
            print("  %3d  %s  %-28s%s" % (n, lvl.upper(), uid, protect))
            if args or len(rows) == 1:
                for rule, ci, title, where, w, wl, text in hits:
                    if rule == "C6":
                        print("        %-4s card %d · %-14s · %s (%s) :: %s"
                              % (rule, ci, str(where)[:14], w, wl, str(text)[:66]))
                    else:
                        print("        %-4s card %d · %s :: %s" % (rule, ci, where, text))
        print("\ncheck_gloss: %d packs · %d findings" % (len(rows), total))

    if args or want_level:
        return 0

    if not BASELINE.is_file():
        BASELINE.write_text(json.dumps({"total": total}) + "\n", encoding="utf-8")
        print("baseline written: %d" % total)
        return 0
    base = json.loads(BASELINE.read_text(encoding="utf-8")).get("total", 0)
    if total > base:
        print("RATCHET FAIL: %d > baseline %d" % (total, base))
        return 1 if check else 0
    if total < base:
        BASELINE.write_text(json.dumps({"total": total}) + "\n", encoding="utf-8")
        print("baseline tightened: %d -> %d" % (base, total))
    else:
        print("ratchet ok: %d vs baseline %d" % (total, base))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
