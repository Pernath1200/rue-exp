# REPAIR QUEUE — James's channel into the cloud lane

Cloud routine: process up to 3 unticked items per run, BEFORE building.
Tick with commit hash. James (or local Claude) adds items; smoke-flag exports
paste in at the bottom.

Conversion rules for smoke-flag items: fix accepts/cues/content only — no
drive-by refactors. If a fix needs a design decision, log the fork in
BUILD-DIGEST.md, take the conservative path, and leave the box unticked with
a note.

---

## P0 — grammar practice is not wired to grammar packs · **FIXED 3c94e84**

**Fixed 2026-08-07 (local lane).** `js/pack-adapt.js` translates the real pack
shape into the ladder's banks: `intro.cards` → cards, `blocks[].items[]` →
match (en↔cz) · quiz (frame + options; authored `quiz_options` where present,
else sibling answers, never an option the item itself accepts) · type (gap,
Czech as the hint) · use (whole-sentence CZ→EN). `check.sequence` is honoured.
All 72 live grammar units on path now produce a real ladder, gated by
`codex/check_playable.py` (in smoke). Original report kept below.

- [x] **BLOCKER (found 2026-08-06, cloud run 1).** `js/practice-grammar.js`
  reads `pack.match`, `pack.quiz`, `pack.type_items`, `pack.use_items`.
  **No pack in the repo has ever had any of those four fields** — every
  authored grammar pack stores its material in `blocks[].items`. Result:
  all 52 live grammar nodes render the intro cards, then Check → Type → Use
  each hit their `if (!items.length)` early-return, call `completeMode(...)`
  and skip. The student lands on **"Done · Fruit earned · Check: 100 % ·
  Type: 100 %"** having answered **zero** questions.
  Verified in a real browser (Chromium, app served on :8097) against all 52
  live grammar nodes — 52/52 zero questions asked, 52/52 reach Done.
  `git log -p -- js/practice-grammar.js` shows the file has **never**
  referenced `pack.blocks`, so this dates to the original scaffold
  (`5c3884f`), not a recent regression. Vocab is unaffected (a1_home_family
  drives a correct 12-pair Match board).
  **Engine code — cloud lane must not ship this.** Adapter proposal is in
  BUILD-DIGEST.md (2026-08-06 · cloud run 1). Needs James.

---

- [ ] **Vocab level badge is hardcoded `A1`** (found 2026-08-06, cloud run 2).
  `js/practice-vocab.js` lines 628–631 build the deck header meta as a literal
  `"… · A1"` / `"… frames · A1 · trunk"`. Every one of the 41 live vocab nodes
  therefore announces itself as A1 — verified in Chromium on :8097 against
  `leaf_work_b1`, `leaf_money_b1`, `leaf_communication_b1` (all show
  "36 words · A1") and against the pre-existing `leaf_work_a2`
  ("33 words · A1"). Pre-existing, not a regression from this run.
  Fix is one line: pass the node's level through `opts` in `openNode`
  (`js/app.js` ~line 615 already has `node.levels[0]`) and interpolate it
  instead of the literal. **Engine code — cloud lane must not ship this.**
  Cosmetic only; nothing is mis-taught.

- [x] `zero_article` items (a1_articles, 8 items) — **resolved in 3c94e84**
  by routing rather than engine surgery. Your finding (b) stands: `isCorrect()`
  can never pass an empty answer. So the adapter keeps these 8 items out of
  Quiz and Type, and puts them in Match and Use, where the missing article
  shows naturally in a whole sentence. No ungradeable item ships.

- [ ] **`order_click` stage is not implemented.** `a1_word_order` declares
  `check.sequence: ["order_click"]` and its items carry `tokens[]` for a
  word-order builder no engine has. It plays intro → Use today, so SVO is
  taught by translation rather than by ordering. `check_playable.py` warns
  until it exists. **Engine work — local lane, cloud must not build it.**
- [x] `b2_future_forms` item 2: gap_answer "am" not present in `en` — check
  the frame reconstructs; fix the item if not. → **c6d7d80** — `en`
  uncontracted to "I am meeting the client at three." so the frame rebuilds
  exactly; both forms kept in `accepts`. Also fixed Czech "V tři" → "Ve tři".
- [ ] `b2_clear_claims`: gap_answers are judgment labels ("overgeneral",
  "clear claim") not sentence words — decide (digest fork) whether this
  pack's style is legal or should be restyled; conservative = leave, flag.
  → **Conservative path taken: style left as-is, fork logged in the digest.**
  Left unticked per the rules above — the style decision is James's.
  Separately fixed in **c6d7d80**: all 12 items had an *English* question in
  the `cz` field, a straight language-contract violation; now Czech.
