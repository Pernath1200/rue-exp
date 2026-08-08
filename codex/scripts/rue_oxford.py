# -*- coding: utf-8 -*-
"""RUE coverage against the CEFR-banded Oxford 5000.

Run from anywhere:  py -X utf8 codex/scripts/rue_oxford.py [--write]

Paths are repo-relative (they used to be hardcoded to James's laptop, and the
Oxford list was read out of Windows %TEMP%, so the script could not be re-run
by the cloud lane at all). The word list now lives in the repo at
codex/vocab/oxford-5k-cefr.csv.

THREE MEASURES, and the difference between them is the whole story
------------------------------------------------------------------
The "336 vs 591" disagreement in AGENTS.md was never a coverage regression.
It is two different methods run on the same tree:

  A  items      a word counts only if a VOCAB pack drills it as an item.
                Undercounts: ignores grammar packs entirely, so every word
                the course teaches through a grammar gap is invisible.

  B  taught     a word counts if any pack teaches it as content: a vocab
                item `en`/`gap_answer`/`lemma`, a vocab sentence-bank lemma,
                a grammar `gap_answer`/`lemma`, or a grammar `teaches_lemmas`
                entry. THIS IS THE NUMBER TO TRUST, and the one that drives
                the B1 pack plan.

  C  anyfield   a word counts if the token appears anywhere in any pack file,
                including explanations, intro cards and translator notes.
                This is the old 336 "floor". It is badly inflated: it credits
                the course for words that only ever appear as METALANGUAGE.
                Hand-checked 14 of its "covered" words — `hers` is credited
                from an intro card that literally reads "Not yet: mine /
                yours / hers", `quit` from a gloss explaining "stop + -ing",
                `medium` from a size analogy, `attach`/`careless` from
                explanation prose. None is taught. Do not plan against C.

B rises as `teaches_lemmas` lands on the 93 grammar packs (AGENTS.md step 2):
that field is read here, so the count sharpens from a range into a count
exactly as the plan predicts.

--write regenerates codex/vocab/oxford-b1-gap.tsv from measure B.
"""
import csv, json, glob, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OX = os.path.join(ROOT, "codex", "vocab", "oxford-5k-cefr.csv")
GAP = os.path.join(ROOT, "codex", "vocab", "oxford-b1-gap.tsv")
ORDER = ["a1", "a2", "b1", "b2", "c1"]
CORE = ("a1", "a2", "b1")

# ---- Oxford list: word -> lowest CEFR band it appears at ----------------
band, pos_of = {}, collections.defaultdict(set)
for row in csv.DictReader(open(OX, encoding="utf-8")):
    w, lv, p = row["word"].strip().lower(), row["level"].strip().lower(), row["pos"].strip()
    if lv not in ORDER:
        continue
    pos_of[w].add(p)
    if w not in band or ORDER.index(lv) < ORDER.index(band[w]):
        band[w] = lv


def toks(s):
    return re.findall(r"[a-z']+", (s or "").lower())


# Two classes of false positive the token-set test cannot see on its own.
# Both were found by hand-checking the first run of this script and both
# inflate the gap if left alone.
#
#  1. MULTIWORD Oxford entries ("have to", "ice cream", "next to", "t-shirt").
#     A phrase is never a member of a token set, so every one of them counted
#     as missing. Nine of the eleven were in fact taught. They are matched
#     against the taught STRINGS instead.
#  2. BrE/AmE SPELLING VARIANTS. The course teaches `practice` and `apologise`;
#     Oxford lists `practise` and `apologize`. Same word, different spelling.
SPELLING = {
    "organization": "organisation", "organisation": "organization",
    "apologize": "apologise", "apologise": "apologize",
    "analyse": "analyze", "analyze": "analyse",
    "practise": "practice", "practice": "practise",
    "kilometre": "kilometer", "metre": "meter", "theatre": "theater",
    "centre": "center", "colour": "color", "favourite": "favorite",
    "realize": "realise", "recognize": "recognise", "travelling": "traveling",
}


vocab_files = sorted(glob.glob(os.path.join(ROOT, "data/vocab/blocks/*.json")))
gram_files = sorted(glob.glob(os.path.join(ROOT, "data/grammar/**/*.json"), recursive=True))

# ---- A: vocab items only ------------------------------------------------
items = set()
# ---- B: everything actually taught, as content --------------------------
taught = set()
phrases = set()          # taught surface strings, for multiword Oxford entries
n_teaches_lemmas = 0


def learn(v, into_items=False):
    if not v:
        return
    phrases.add(v.lower().strip())
    taught.update(toks(v))
    if into_items:
        items.update(toks(v))


for p in vocab_files:
    d = json.load(open(p, encoding="utf-8"))
    for b in d.get("blocks", []):
        for it in b.get("items", []):
            for f in ("en", "gap_answer", "lemma"):
                learn(it.get(f), into_items=True)
    for s in d.get("sentences", []) or []:
        for l in s.get("lemmas", []) or []:
            learn(l)

for p in gram_files:
    try:
        d = json.load(open(p, encoding="utf-8"))
    except Exception:
        continue
    if not isinstance(d, dict):
        continue
    if d.get("teaches_lemmas"):
        n_teaches_lemmas += 1
    for l in d.get("teaches_lemmas", []) or []:
        learn(l)
    for b in d.get("blocks", []):
        for it in b.get("items", []):
            for f in ("gap_answer", "lemma"):
                learn(it.get(f))

PHRASE_BLOB = " | ".join(sorted(phrases))


def is_taught(w):
    """A word counts as taught if the token is drilled, or (for multiword
    entries) the phrase appears in a taught string, or the other standard
    spelling of it is taught."""
    if w in taught:
        return True
    if (" " in w or "-" in w) and w in PHRASE_BLOB:
        return True
    alt = SPELLING.get(w)
    return bool(alt and alt in taught)

# ---- C: any token anywhere in any pack file -----------------------------
anyfield = set()
for p in vocab_files + gram_files:
    anyfield.update(toks(open(p, encoding="utf-8").read()))

print(f"packs scanned      : {len(vocab_files)} vocab · {len(gram_files)} grammar")
print(f"teaches_lemmas on  : {n_teaches_lemmas}/{len(gram_files)} grammar packs")
print(f"tokens  A items {len(items):,} · B taught {len(taught):,} · C anyfield {len(anyfield):,}\n")

print(f"{'band':<6}{'size':>7}{'A items':>10}{'%':>6}{'B taught':>11}{'%':>6}{'C anyfield':>13}{'%':>6}")
tot = collections.Counter()
for lv in ORDER:
    ws = [w for w, b in band.items() if b == lv]
    a = sum(1 for w in ws if w in items)
    b_ = sum(1 for w in ws if is_taught(w))
    c = sum(1 for w in ws if w in anyfield)
    print(f"{lv.upper():<6}{len(ws):>7}{a:>10}{100*a/len(ws):>5.0f}%"
          f"{b_:>11}{100*b_/len(ws):>5.0f}%{c:>13}{100*c/len(ws):>5.0f}%")
    if lv in CORE:
        tot["A"] += len(ws) - a
        tot["B"] += len(ws) - b_
        tot["C"] += len(ws) - c

miss = sorted((band[w], w) for w in band if band[w] in CORE and not is_taught(w))
print(f"\n=== to finish B1 ===  A {tot['A']}  ·  **B {tot['B']}**  ·  C {tot['C']} (old inflated floor)")
by = collections.Counter(l for l, _ in miss)
print("B breakdown:", " ".join(f"{k.upper()} {by[k]}" for k in CORE))
print(f"~{-(-tot['B'] // 12)} packs of 12 to close it fully.\n")

for lv in CORE:
    ws = [w for l, w in miss if l == lv]
    print(f"{lv.upper()} missing ({len(ws)}):")
    for i in range(0, min(len(ws), 60), 12):
        print("   ", " ".join(ws[i:i + 12]))
    if len(ws) > 60:
        print(f"    ... +{len(ws)-60} more")

if "--write" in sys.argv:
    with open(GAP, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("# Oxford A1-B1 words the course does not TEACH (measure B).\n")
        fh.write("# A word counts as taught only from content fields: vocab item\n")
        fh.write("# en/gap_answer/lemma, vocab sentence-bank lemmas, grammar\n")
        fh.write("# gap_answer/lemma, grammar teaches_lemmas. Explanations, intro\n")
        fh.write("# cards and notes do NOT count - that was the old 336 floor's bug.\n")
        fh.write("# Regenerate: py -X utf8 codex/scripts/rue_oxford.py --write\n")
        fh.write("# band\tword\tpos\n")
        for lv, w in miss:
            fh.write(f"{lv}\t{w}\t{'/'.join(sorted(pos_of[w]))}\n")
    print(f"\nwrote {os.path.relpath(GAP, ROOT)} ({len(miss)} rows)")
