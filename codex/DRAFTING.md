# Drafting a unit from nothing — the method

`AGENT-LOOP.md` is the contract (what you may touch, what the gate is).
**This file is how a new unit actually gets written.** It is the method used to
draft `b2_travel`, `b2_prefixes_1`, `b2_work`, `b2_media` and `b2_home` on
2026-09-05; every one passed its gates first time except for the faults listed
at the bottom, which are the ones to expect.

Read `AUTHORING-RULES.md` first, always. This file assumes you have.

---

## The one thing that makes a bank good

**Sweep the pool before you write a single word.** Not after.

```
py -X utf8 codex/make_pool.py POOL.md --before <unit_id>
```

Then check every candidate word against `POOL.json`'s `all` set. The obvious
vocabulary for a theme is usually **already taught** — Travel 3's first draft
list came back with visa, itinerary, currency, customs, terminal, fare, border
and depart all already in the course. Work 4 lost promotion, overtime, deadline,
pension, freelance and workload to Work 1–3.

Expect to sweep **twice**. The first list will be half-taught; the second finds
the genuinely new layer. A unit that re-teaches its predecessor is the failure
this step exists to prevent, and no gate catches it.

Anchor to Oxford while you are there — `codex/vocab/oxford-5k-cefr.csv` gives a
CEFR band per word. Aim ~75% at the unit's own band, topped with the next one
up and topic-essential words that have no band.

---

## Vocab leaf shape (36 words)

Model: `data/vocab/blocks/b2_travel.json`.

| Card | Job |
|---|---|
| 0 · **You already know** | C57. 4–6 tiles from the predecessor, **not** the full set, plus a note naming what that unit covered and which words genuinely repeat. If only three words repeat, say so — the student needs to know what is actually new. |
| 1–3 · **three boards of 12** | C49: every one of the 36 words is shown. Group by sense, not alphabetically. |
| 4 · **Build the family** | The word-formation bit. 4–6 derived forms, each also a real bank item so it gets drilled. Table is *verb you know → word here*. |
| 5 · **frames** | The `use` frame ids the items reference. |

Then:
- `blocks`: 3 × 12 items, `use` ids drawn from the frames card
- `sentences`: **one per lemma**, 7–9 words, no repeated three-word opening,
  every carrier word already taught
- `use_sentences`: 12 rewrite items, `use_mode: "rewrite"`
- A12 sense-mark any homonym on the item itself: `package (holiday)`,
  `aisle (plane)`, `trail (walking)`

## Word-formation lesson shape

Model: `data/grammar/blocks/b2_prefixes_1.json`, house style cloned from
`b1_suffixes`.

Four blocks: **7 map tiles** (affix → meaning) · **12 choose** (authored
`quiz_options`) · **12 type** · **6 fix-the-sentence** (`use_mode: "correct"`,
each `wrong` a real L1 trap).

Every item is a **gapped sentence with the root in CAPITALS** — never
`person: ____`, which B7 bans. Check every root is taught before you use it:
`view`, `personal`, `social`, `operate`, `organisation` and `politics` all
failed the sweep for Prefixes 2 and were dropped.

**Check what the earlier level actually taught before you scope the affixes.**
`B2-PLAN.md` originally gave Prefixes 2 the negative set — but `b1_prefixes`
already owns all eight of those. Drafting to the plan would have re-taught B1.
All four WF lessons were rescoped for this reason.

---

## Gate order — run these, in this order, before you commit

```
py -X utf8 codex/verify_pack.py              # lemma names, structure
py -X utf8 codex/audit.py                    # then read the unit's `unknown`
py -X utf8 codex/check_rewrite.py <pack>     # vocab: the underline must reconstruct
py -X utf8 codex/lint.py <unit_id>           # grammar only
```

Keep the work only if the unit's `unknown` is **CLEAN**, `check_rewrite` says
**clean**, and neither `verify_pack` errors nor `audit total_unknown_types`
rose. Then check texture by eye: 36 sentences, 6–10 words, no repeated opening.

## The four faults that will happen to you

Every one of these hit the 2026-09-05 batch. They are not hypothetical.

1. **The underline does not cover the grammar.** `"The hospital has too few
   people"` → `understaffed` leaves no room for *is*. `clickbait` and `viral`
   swallowed their own verbs. A correct rewrite then gets marked **wrong** —
   the worst failure in the app. `check_rewrite.py` catches all of them.
2. **Untaught carrier words.** 17 in one batch: *director, scissors, shelves,
   marriage, women, whole, terrible*. The word being taught is fine; the
   sentence around it is not. Reword onto taught vocabulary — do not add the
   word to another unit's bank to make it legal.
3. **Lemma name ≠ item name.** If the item is `package (holiday)`, the
   sentence's `lemmas` must say `package (holiday)` too, gloss included.
4. **Repeated sentence openings.** Two `There is a…` in one pack reads as one
   flat frame. Vary the person and the mood.

## Registry

New nodes go in **three** files — `data/tree.json`, `data/nodes-vocab.json`,
`data/nodes-grammar.json` — and `path_order_*` must be **identical in
`tree.json` and `nodes-grammar.json`**. A node is `coming` until its pack file
exists and passes; then `live`.

**This is coordination-tab work.** A drafting lane may not do it — see
AGENT-LOOP.md's hard nevers, and `rue-path-order-b1-trap` for what happens when
the two copies drift.
