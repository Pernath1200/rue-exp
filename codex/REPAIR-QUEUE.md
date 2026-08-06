# REPAIR QUEUE — James's channel into the cloud lane

Cloud routine: process up to 3 unticked items per run, BEFORE building.
Tick with commit hash. James (or local Claude) adds items; smoke-flag exports
paste in at the bottom.

Conversion rules for smoke-flag items: fix accepts/cues/content only — no
drive-by refactors. If a fix needs a design decision, log the fork in
BUILD-DIGEST.md, take the conservative path, and leave the box unticked with
a note.

- [ ] `zero_article` items (a1_articles, 8 items): verify the grammar engine's
  type mode handles an EMPTY gap_answer sanely (typing nothing = correct?).
  If it doesn't, propose the minimal engine-side fix in the digest — do NOT
  ship engine code for this without James seeing the proposal first.
- [ ] `b2_future_forms` item 2: gap_answer "am" not present in `en` — check
  the frame reconstructs; fix the item if not.
- [ ] `b2_clear_claims`: gap_answers are judgment labels ("overgeneral",
  "clear claim") not sentence words — decide (digest fork) whether this
  pack's style is legal or should be restyled; conservative = leave, flag.
