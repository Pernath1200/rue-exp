# Policy locks — James (2026-08-09)

Interactive Grok session after Claude wind-down. Apply every auto run.
Do not re-ask unless James reopens.

| ID | Decision | Effect |
|----|----------|--------|
| **P-hour** | **`a1_articles` / `hour` permanently accepted** | Last A1 sequencing “violation” is a silent-h teaching point; `hour` is taught later on the path. **Do not re-lexify, re-pick, or “fix” this unit.** Log only if the report still lists it. |
| **P-lemma** | **Item-level `lemma` is an allowed tool** | Use when a gapped item teaches a word the student meets with Czech but `targets_of()` cannot see the non-gap tokens. Prefer honest taught-in-place over papering random audit noise. Do not invent lemmas for words never shown. |
| **P-b1-vocab** | **B1 vocabulary extension = interactive only** | Parked multi-week build. **Auto must not start** new B1 thematic packs, `teaches_lemmas` mass backfill as a program, or reopen `vocab/b1-build` work unattended. |
| **P-tokenizer** | **Open — not authorised** | Hyphen / non-ASCII tokenizer fixes in `audit.py` still James-only (not locked this session). Do not edit the gate to lower the ratchet. |
| **P-deploy** | **A1+A2 polish before deploy** | No Pages / student cutover until James smokes and says go. |
| **P-engine** | **Shell = interactive / James** | Auto never edits `js/`, `css/`, `index.html` unless an item is explicitly listed on `REPAIR-QUEUE.md` **and** marked engine-ok by James. |
| **P-b2c1-stub** | **Auto B2/C1 banks are stubs** (2026-08-29) | Title-only: node `parked`, pack `status: stub`, empty items. **Keep live:** `b2_second_conditional`, `b2_third_conditional`, `b2_present_perfect_continuous`, `b2_past_perfect`, `b2_word_formation`, `c1_word_formation`, `b2_clear_claims`. Auto must not refill stubs. Rebuild by hand before any student play. |

## Product goal (near-term)

Polish **A1 + A2** (trunk intros, sequencing honesty on B1 leads only as secondary, repair queue) until lesson-true; then deploy conversation.
