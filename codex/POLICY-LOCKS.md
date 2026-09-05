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
| **P-b2c1-stub** | **B2/C1 drafting — amended 2026-09-05** | *Was (2026-08-29): auto must not refill B2/C1 stubs.* That ban answered the August routine shipping 36 unread units behind green gates — the incident `INSPECTED.md` exists to prevent. **Now:** automation **may** draft B2/C1, but only to `codex/DRAFTING.md`'s method, only onto `b2/auto`, only at node status `coming`, and only passing the full gate order (`verify_pack` · `audit` unknown CLEAN · `check_rewrite` clean · `lint`). The original ban stands unchanged for anything that skips those gates. **Nothing reaches a student without James's Telegram tick** — an agent's report is still not a tick, and `INSPECTED.md` is still the record. James 2026-09-05, setting the home-machine lane running. |
| **P-fce-shapes** | **B2/C1 exercise shapes spec'd** (2026-09-05) | `codex/FCE-EXERCISES.md` — Open Cloze (grammar-word Type stage, retrofit, no engine change) and Key Word Transformation (new `use_mode: "transformation"`, needs `js/practice-grammar.js` work — **P-engine**, interactive-only, cloud loop must not attempt). Spec only; nothing built yet. B1 explicitly out of scope until B2 pilot units are played. |

## Product goal (near-term)

Polish **A1 + A2** (trunk intros, sequencing honesty on B1 leads only as secondary, repair queue) until lesson-true; then deploy conversation.
