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

- [x] **Vocab level badge is hardcoded `A1`** — **FIXED 2026-08-08 (local
  lane).** `js/app.js` now passes `packLevel: node.levels[0]` into
  `startVocabPractice`'s opts; `js/practice-vocab.js` interpolates
  `packLevel` instead of the literal `"A1"` in `metaBits`. Cosmetic fix,
  confirmed no content or grading path touched.

- [x] `zero_article` items (a1_articles, 8 items) — **resolved in 3c94e84**
  by routing rather than engine surgery. Your finding (b) stands: `isCorrect()`
  can never pass an empty answer. So the adapter keeps these 8 items out of
  Quiz and Type, and puts them in Match and Use, where the missing article
  shows naturally in a whole sentence. No ungradeable item ships.

- [x] **`order_click` stage is not implemented.** — **FIXED 2026-08-08 (local
  lane).** `js/pack-adapt.js` builds an `order` bank from `tokens[]`;
  `js/practice-grammar.js` adds a real click-to-order Check phase — shuffled
  token buttons, click in order, auto-checks against `accepts` once every
  token is placed. `beginCheck()` routes match → quiz → order_click → Type.
  `codex/check_playable.py` validates the bank and lists `order_click` as
  implemented — 0 errors, 0 warnings. Verified against the real
  `a1_word_order` pack: 26/26 items produce a valid order item.
- [x] `b2_future_forms` item 2: gap_answer "am" not present in `en` — check
  the frame reconstructs; fix the item if not. → **c6d7d80** — `en`
  uncontracted to "I am meeting the client at three." so the frame rebuilds
  exactly; both forms kept in `accepts`. Also fixed Czech "V tři" → "Ve tři".
- [x] `b2_clear_claims`: gap_answers are judgment labels ("overgeneral",
  "clear claim") not sentence words. **RESOLVED 2026-08-08 (James): formalized
  as permanent, correct.** Teaching argumentation vocabulary via a
  judgment-label gap is pedagogically sound for this pack's subject — this is
  not a defect and must not be re-raised or restyled. Separately fixed in
  **c6d7d80**: all 12 items had an *English* question in the `cz` field, a
  language-contract violation; now Czech.

## Standing rules (not one-time items — apply to every unit, every run)

- [ ] **Dropped-subject Czech grading sweep (James, 2026-08-08).** Czech
  drops the subject pronoun, so a prompt like *Už je tady* is true for
  he/she/it alike — a student who answers correctly with a different subject
  than the author intended currently grades wrong. Run 27 found and fixed
  3 instances in new sentences. **Sweep the 16 already-shipped A1 Use banks**
  for the same defect: any `sentences[]` Czech prompt whose verb form doesn't
  fix the person needs an explicit subject added (a name, "the bus", etc.) —
  same pattern as `a2_routine`'s fix. Do this before A2 banks add more
  unswept units on top. One pack per run is fine; log progress here.

- [ ] **Explanation-language scaling (James, 2026-08-08).** Explanatory prose
  — intro `body`/`note`/`title_cz` text, grammar `explanation`/
  `explanation_cz`, hints — must match the level it explains, not stay at A1
  simplicity throughout the course. **A1/A2: simple, plain-English
  metalanguage** (short sentences, controlled vocabulary). **B1 and up:
  natural, less simplified English** — the explanation's own register may
  rise with the student's. This does not relax the target CONTENT's
  difficulty at any level — only the scaffolding prose around it. Also see
  AGENTS.md.
