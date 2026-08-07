# -*- coding: utf-8 -*-
"""RUE coverage against the CEFR-banded Oxford 5000 (word, level, pos)."""
import csv, json, glob, os, collections

RUE = r"C:/Users/ADMIN/Documents/projects/rue-exp"
OX = r"C:/Users/ADMIN/AppData/Local/Temp/ox5k.csv"
SCRATCH = os.path.dirname(os.path.abspath(__file__))

# Oxford list: word -> lowest CEFR band it appears at
ORDER = ["a1", "a2", "b1", "b2", "c1"]
band = {}
pos_of = collections.defaultdict(set)
for row in csv.DictReader(open(OX, encoding="utf-8")):
    w, lv, p = row["word"].strip().lower(), row["level"].strip().lower(), row["pos"].strip()
    if lv not in ORDER:
        continue
    pos_of[w].add(p)
    if w not in band or ORDER.index(lv) < ORDER.index(band[w]):
        band[w] = lv

# what RUE teaches
taught = set()
by_level = collections.defaultdict(set)
for path in sorted(glob.glob(os.path.join(RUE, "data/vocab/blocks/*.json"))):
    d = json.load(open(path, encoding="utf-8"))
    lvl = (d.get("level") or "?").upper()
    for b in d.get("blocks", []):
        for it in b.get("items", []):
            v = (it.get("en") or "").strip().lower()
            if v:
                taught.add(v)
                by_level[lvl].add(v)
                for tok in v.replace("/", " ").split():
                    taught.add(tok.strip(".,!?()"))

print(f"RUE taught surface strings: {len(taught):,}\n")
print(f"{'Oxford band':<14}{'size':>7}{'taught':>9}{'%':>7}{'missing':>10}")
cum_missing = []
for lv in ORDER:
    words = [w for w, b in band.items() if b == lv]
    hit = [w for w in words if w in taught]
    miss = [w for w in words if w not in taught]
    print(f"{lv.upper():<14}{len(words):>7}{len(hit):>9}{100*len(hit)/len(words):>6.0f}%{len(miss):>10}")
    if lv in ("a1", "a2", "b1"):
        cum_missing += [(lv, w) for w in miss]

print(f"\n=== to finish B1: {len(cum_missing):,} Oxford words untaught ===")
for lv in ("a1", "a2", "b1"):
    ws = sorted(w for l, w in cum_missing if l == lv)
    print(f"\n{lv.upper()} missing ({len(ws)}):")
    for i in range(0, min(len(ws), 96), 12):
        print("   ", " ".join(ws[i:i+12]))
    if len(ws) > 96:
        print(f"    ... +{len(ws)-96} more")

out = os.path.join(SCRATCH, "rue_missing_oxford_b1.txt")
with open(out, "w", encoding="utf-8") as fh:
    for lv, w in sorted(cum_missing, key=lambda x: (ORDER.index(x[0]), x[1])):
        fh.write(f"{lv}\t{w}\t{'/'.join(sorted(pos_of[w]))}\n")
print(f"\nwrote {os.path.basename(out)}")
