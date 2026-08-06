# REPAIR QUEUE — James's channel into the cloud lane

Cloud routine: process up to 3 unticked items per run, BEFORE building.
Tick with commit hash. James (or local Claude) adds items; smoke-flag exports
paste in at the bottom.

Conversion rules for smoke-flag items: fix accepts/cues/content only — no
drive-by refactors. If a fix needs a design decision, log the fork in
BUILD-DIGEST.md, take the conservative path, and leave the box unticked with
a note.

---

## P0 — grammar practice is not wired to grammar packs

- [ ] **BLOCKER (found 2026-08-06, cloud run 1).** `js/practice-grammar.js`
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

- [ ] `zero_article` items (a1_articles, 8 items): verify the grammar engine's
  type mode handles an EMPTY gap_answer sanely (typing nothing = correct?).
  If it doesn't, propose the minimal engine-side fix in the digest — do NOT
  ship engine code for this without James seeing the proposal first.
  → **Answered, still open (blocked on P0).** Two findings: (a) the Type
  stage never runs at all today (see P0), so these 8 items are currently
  unreachable; (b) once wired, they would still be ungradeable —
  `isCorrect()` in practice-grammar.js does `if (!u) return false;` for both
  modes, so an empty answer can never be marked correct. Minimal fix
  proposed in the digest. Unticked: needs the P0 decision first.
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
