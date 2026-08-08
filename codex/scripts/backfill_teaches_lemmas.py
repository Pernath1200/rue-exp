# -*- coding: utf-8 -*-
"""Backfill teaches_lemmas onto grammar packs (AGENTS.md B1 step 2).

Text insertion, not a JSON re-dump: run 30's phantom-diff trap was caused by
re-serialising a whole pack to change one field. The field is inserted on its
own line immediately before the top-level "blocks" line, and every file is
re-parsed and compared field-by-field against its pre-edit parse afterwards.

Rule (see digest run 36 for the fork):
  - derive from every item's gap_answer, verbatim, lowercased, deduped,
    insertion-ordered (matches RUPL's ["work","works","live","lives"] shape:
    real drilled FORMS, not lemmatised bases)
  - MULTIWORD gap answers are SKIPPED (740 of 3772). Most are construction
    templates, not lemmas: b1_it_subject alone drills "it is important",
    "it is easy", "it was nice" - a lemma list containing those would be
    misleading to read. A minority are genuine multiword lexemes ("next to",
    "in front of", "have to"), and separating the two needs per-pack
    judgement, so the conservative cut is single words only. This costs the
    coverage measure nothing: rue_oxford.py reads grammar gap_answer
    directly, so multiword lexemes are still credited. Adding them later is
    purely additive.
"""
import json, glob, os, re, sys, collections

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 0
files = sorted(glob.glob('data/grammar/**/*.json', recursive=True))

done = skipped = 0
report = []
for p in files:
    raw = open(p, encoding='utf-8').read()
    before = json.loads(raw)
    if not isinstance(before, dict):
        continue
    if 'teaches_lemmas' in before:
        skipped += 1
        continue

    lem, dropped = [], []
    for b in before.get('blocks', []):
        for it in b.get('items', []):
            ga = (it.get('gap_answer') or '').strip()
            if not ga:
                continue
            if len(ga.split()) > 1:
                if ga not in dropped:
                    dropped.append(ga)
                continue
            w = ga.lower()
            if w not in lem:
                lem.append(w)
    if not lem:
        report.append((p, 0, len(dropped), 'NO LEMMAS - left alone'))
        skipped += 1
        continue

    m = re.search(r'^(?P<ind>[ \t]*)"blocks"\s*:', raw, re.M)
    assert m, p
    ind = m.group('ind')
    field = ind + '"teaches_lemmas": ' + json.dumps(lem, ensure_ascii=False) + ',\n'
    assert raw.count('\n' + ind + '"blocks"') == 1, f'ambiguous blocks anchor in {p}'
    new = raw.replace('\n' + ind + '"blocks"', '\n' + field.rstrip('\n') + '\n' + ind + '"blocks"', 1)

    after = json.loads(new)                      # must still parse
    assert after.get('teaches_lemmas') == lem, p
    a2 = {k: v for k, v in after.items() if k != 'teaches_lemmas'}
    assert a2 == before, f'{p}: a field other than teaches_lemmas changed'
    assert list(a2) == list(before), f'{p}: key order changed'

    open(p, 'w', encoding='utf-8', newline='').write(new)
    done += 1
    report.append((p, len(lem), len(dropped), ''))
    if LIMIT and done >= LIMIT:
        break

for p, n, d, note in report:
    print(f"  {os.path.basename(p):<42} {n:>3} lemmas  {d:>2} constructions skipped  {note}")
have = sum(1 for f in files if 'teaches_lemmas' in json.load(open(f, encoding='utf-8')))
print(f"\nwrote {done} packs this pass · skipped {skipped} · TOTAL {have}/{len(files)} backfilled")
