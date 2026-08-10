# -*- coding: utf-8 -*-
"""Lexical coverage audit — measures what a RU* course teaches against a
frequency-ranked lemma list for its target language.

Language-neutral by design: swap the two data sources and the item field.

  usage:  python lex_coverage.py pl
          python lex_coverage.py en

Sources
  freq   hermitdave/FrequencyWords (OpenSubtitles 2018)   form <space> count
  morph  PL: morfologik/polimorfologik 2.1                lemma;form;tags
         EN: michmech/lemmatization-lists                 lemma <TAB> form

Method
  Forms are collapsed to lemmas. An ambiguous form splits its count evenly
  across candidate lemmas (fractional attribution). Capitalised lemmas are
  dropped as proper nouns. Taught strings are lemmatised the same way, so both
  sides of the comparison are measured identically — this is the whole point:
  it counts WORDS, never inflected forms.
"""
import json, glob, os, sys, collections

SCRATCH = os.path.dirname(os.path.abspath(__file__))
TMP = r"C:/Users/ADMIN/AppData/Local/Temp"
TOP_FORMS = 400_000

LANGS = {
    "pl": dict(
        repo=r"C:/Users/ADMIN/Documents/projects/rupl-exp",
        freq=f"{TMP}/pl_full.txt",
        morph=os.path.join(SCRATCH, "polimorfologik-2.1.txt"),
        sep=";", field="pl", name="RUPL (Polish)",
    ),
    "en": dict(
        repo=r"C:/Users/ADMIN/Documents/projects/rue-exp",
        freq=f"{TMP}/en_full.txt",
        morph=f"{TMP}/lemma_en.txt",
        sep="\t", field="en", name="RUE (English)",
    ),
}

lang = (sys.argv[1] if len(sys.argv) > 1 else "pl").lower()
CFG = LANGS[lang]

# ---- 1. frequency list -------------------------------------------------
form_count = {}
with open(CFG["freq"], encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i >= TOP_FORMS:
            break
        p = line.split()
        if len(p) == 2:
            form_count[p[0].lower()] = int(p[1])

# ---- 2. form -> lemmas -------------------------------------------------
form_lemmas = collections.defaultdict(set)
with open(CFG["morph"], encoding="utf-8-sig") as f:
    for line in f:
        p = line.rstrip("\n").split(CFG["sep"])
        if len(p) < 2:
            continue
        lemma, form = p[0].strip(), p[1].strip()
        if not lemma or not form or lemma[:1].isupper():
            continue
        fl = form.lower()
        if fl in form_count:
            form_lemmas[fl].add(lemma.lower())
# a form that is itself a lemma and unlisted maps to itself
for f_ in form_count:
    form_lemmas.setdefault(f_, {f_})

# ---- 3. lemma ranking --------------------------------------------------
score = collections.Counter()
for form, cnt in form_count.items():
    lems = form_lemmas[form]
    share = cnt / len(lems)
    for l in lems:
        score[l] += share
ranked = [l for l, _ in score.most_common()]
rank_of = {l: i for i, l in enumerate(ranked)}

# ---- 4. what the course teaches ---------------------------------------
def lemmatise(s):
    out = set()
    for tok in s.lower().replace("/", " ").split():
        tok = tok.strip(".,!?();:\u2014-")
        if tok:
            out |= form_lemmas.get(tok, {tok})
    return out

taught_by_level, raw_by_level = collections.defaultdict(set), collections.defaultdict(set)
for path in sorted(glob.glob(os.path.join(CFG["repo"], "data/vocab/blocks/*.json"))):
    d = json.load(open(path, encoding="utf-8"))
    lvl = (d.get("level") or os.path.basename(path)[:2]).upper()
    for b in d.get("blocks", []):
        for it in b.get("items", []):
            v = it.get(CFG["field"], "")
            if v:
                raw_by_level[lvl].add(v)
                taught_by_level[lvl] |= lemmatise(v)

gram = set()
for path in glob.glob(os.path.join(CFG["repo"], "data/grammar/**/*.json"), recursive=True):
    try:
        d = json.load(open(path, encoding="utf-8"))
    except Exception:
        continue
    if isinstance(d, dict):
        for l in d.get("teaches_lemmas", []) or []:
            if isinstance(l, str):
                gram |= lemmatise(l)

# ---- 5. report ---------------------------------------------------------
print(f"\n{'='*62}\n{CFG['name']} — lexical coverage\n{'='*62}")
print(f"{'level':<6}{'deck items':>12}{'lemmas':>10}{'cumulative':>13}")
cum, vocab_all = set(), set()
for lvl in ["A1", "A2", "B1", "B2", "C1"]:
    cum |= taught_by_level[lvl]
    vocab_all |= taught_by_level[lvl]
    if raw_by_level[lvl] or taught_by_level[lvl]:
        print(f"{lvl:<6}{len(raw_by_level[lvl]):>12}{len(taught_by_level[lvl]):>10}{len(cum):>13}")
other = {k: v for k, v in taught_by_level.items() if k not in ("A1","A2","B1","B2","C1")}
for k, v in other.items():
    vocab_all |= v
    print(f"{k:<6}{len(raw_by_level[k]):>12}{len(v):>10}{'':>13}")

taught = vocab_all | gram
print(f"\nvocab-pack lemmas : {len(vocab_all):,}")
print(f"grammar adds      : {len(gram - vocab_all):,}")
print(f"TOTAL taught      : {len(taught):,}")

print(f"\n{'band':<14}{'taught':>8}{'%':>7}{'missing':>10}")
for band in (500, 1000, 2000, 3000, 5000, 8000):
    seg = set(ranked[:band])
    hit = len(seg & taught)
    print(f"top {band:<10}{hit:>8}{100*hit/band:>6.0f}%{band-hit:>10}")

missing = [l for l in ranked[:8000] if l not in taught]
print(f"\nto reach top-5000: {len([l for l in ranked[:5000] if l not in taught]):,} new lemmas")
print("highest-frequency untaught:", " ".join(missing[:45]))

out = os.path.join(SCRATCH, f"missing_{lang}.txt")
with open(out, "w", encoding="utf-8") as fh:
    for l in missing:
        fh.write(f"{rank_of[l]+1}\t{l}\n")
print(f"\nwrote {os.path.basename(out)} ({len(missing):,} rows)")
