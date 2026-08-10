# OXFORD-REMEASURE — Q1 verdict (2026-08-10, local session)

**Verdict: measurement artifact. Coverage never fell. Q1 is CLOSED.**

## The anomaly (HANDOFF §4 Q1)

Between 2026-08-07 and 2026-08-08 the Oxford coverage measurement appeared to
move A1 98%→90% and B1 56%→30% after two days of purely additive content
work — impossible if both runs measured the same thing. The leading (wrong)
hypothesis was that audit re-lexify repairs were silently trading
Oxford-listed words for off-list synonyms.

## What actually happened

`codex/scripts/rue_oxford.py` reports **three tiers** per band:

- **A · items** — word is a drilled item (`blocks[].items[].en`)
- **B · taught** — word appears in any taught field
- **C · anyfield** — word appears anywhere, incl. notes/distractors
  (the script itself labels C the "old inflated floor")

Fresh run on `main` (2026-08-10, 67 vocab + 93 grammar packs):

| band | size | A items | B taught | C anyfield |
|---|---|---|---|---|
| A1 | 898 | 806 · **90%** | 844 · 94% | 877 · **98%** |
| A2 | 792 | 766 · 97% | 780 · 98% | 780 · 98% |
| B1 | 690 | 208 · **30%** | 258 · 37% | 389 · **56%** |

The 2026-08-07 numbers (98/56) are **today's tier C exactly**. The
2026-08-08 numbers (90/30) are **today's tier A exactly**. The first run
read tier C, the second read tier A, and neither tier has moved since —
the "drop" was two different rows of the same table compared across days.

Residual check on the re-lexify hypothesis: tier C's gap-to-finish-B1 is
334 today vs 336 when first measured — a 2-word improvement over ~30
re-lexify commits, i.e. the repairs did **not** measurably damage coverage.

## Consequences

1. **Trustworthy gap numbers, by tier.** To finish B1: tier A 600 · tier B
   498 · tier C 334. **The B1 extension should be scoped off tier B (~498
   words, ≈42 packs of 12), not the old 336** — the plan's original number
   was the inflated tier-C floor (a word "covered" by appearing in a
   distractor is not taught).
2. **The parked B1 plan's step 1 ("re-verify the gap") is DONE** — this
   file. Step 2 (`teaches_lemmas` backfill, 0/93) remains the prerequisite
   for authoring; tier B is what the backfill will make precise.
3. **The Oxford-preference re-lexify rule (AGENTS.md) stays** — it costs
   nothing and prevents the failure mode Q1 hypothesised, even though that
   failure mode turned out not to have happened.
4. **Future measurements must name their tier.** Any coverage claim without
   a tier letter is meaningless — that is the entire lesson of Q1.

Lane C of `codex/LESSON-READY-PLAN.md` therefore starts directly at content
work (B1 intros + Use banks); its run-1 Q1 task is discharged by this file.
