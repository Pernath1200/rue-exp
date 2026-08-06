# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-06 · cloud run 1 (RUE build, claude-opus-5)

### Headline: grammar practice has never been wired to the grammar packs

**All 52 live grammar nodes award full marks without asking a single
question.** Found while working repair-queue item 1; verified in a real
browser (Chromium against the app on :8097), not just by reading code.

- `js/practice-grammar.js` sources its stages from `pack.match`,
  `pack.quiz`, `pack.type_items`, `pack.use_items`.
- **No pack in `data/*/blocks/` has any of those four fields** (checked all
  154). Every authored pack keeps its material in `blocks[].items`.
- So `beginCheck()` → `hasMatch` false and `quizItems` empty → `completeMode`
  + `beginType()`; `beginType()` → `type_items` empty → `completeMode` +
  `beginUse()`; `beginUse()` → `use_items` empty → `completeMode` + done.
  The student sees the intro cards, then **"Done · Fruit earned ·
  Check: 100 % · Type: 100 %"**.
- Drove all 52 live grammar nodes in the browser: **52/52 asked zero
  questions, 52/52 reached Done.** (A1 20 · A2 15 · B1 13 · B2 4.)
- `git log -p -- js/practice-grammar.js` shows the file has **never**
  referenced `pack.blocks` in its history — this dates to the original
  scaffold `5c3884f`, it is not a recent regression.
- **Vocab is unaffected.** Drove `a1_home_family` the same way: correct
  12-pair Match board, real questions.
- Both gates were green throughout. That is the lesson: the gates check that
  pack *data* is well formed, not that the *engine consumes it*. A gate that
  asserts "every live node produces ≥1 graded question" would have caught
  this on day one.

**Not shipped — engine code is out of the cloud lane** (AGENTS.md). Filed as
P0 at the top of `codex/REPAIR-QUEUE.md`. Proposal for James below.

#### Proposed fix (adapter, ~30 lines, no pack edits)

Map `blocks[].items` onto the four arrays inside `startPractice`, before the
state object is built. The packs already carry everything needed:

| engine field | build from | notes |
|---|---|---|
| `pack.match` | all items | reads `p.en \|\| p.prompt` for the left row and `p.cz` for the chip — items already have both, so pass them straight through |
| `pack.quiz` | items with `quiz_options` | needs `{prompt, choices, answer}`; `answer` must be one of `choices` — compared with `===` at line 849, so exact strings |
| `pack.type_items` | items with a `gap` | needs `{prompt, answer}` (or `{stem, ending}` for `ending_gap`) |
| `pack.use_items` | items without a `gap` | full-sentence production |

**Two traps worth stating before anyone writes the adapter:**

1. **Prompt direction.** `renderTypedStage` picks its prompt as
   `item.prompt_en || item.prompt || item.en` (line 1046). Feeding pack items
   straight in would print the **English answer as the prompt** — the exact
   CZ→EN violation AGENTS.md forbids. The adapter must set `prompt` from
   `cz`, and put the gap frame in `hint`/`stem`.
2. **Empty answers.** `isCorrect()` does `if (!u) return false;` for both
   modes (lines 123, 127), so the 8 `zero_article` items in `a1_articles`
   can never be marked correct once the Type stage does run. Minimal fix:
   in `isCorrect`, when `item.zero_article` is set, treat an empty/`-`/`0`
   answer as correct and everything else as wrong. That answers repair-queue
   item 1 — but it only matters after the P0 lands, so both stay unticked.

`order_click` / `order_type` packs (a1_word_order) are a third shape the
adapter has to handle: their items carry `tokens[]`, not `gap`.

Sanity check that the shape is workable: I rendered `a1_word_order` through
`practice-vocab.js`, which *does* read `blocks[].items` — it produced a
correct 26-frame Match board straight off the current data.

### What landed

| # | Commit | What |
|---|---|---|
| 1 | `c6d7d80` | repair-queue #2 + `cz` contract violation in `b2_clear_claims` |
| 2 | `efc084b` | `a1_word_order` re-authored on pool-legal lexis |
| 3 | `3cba730` | `a2_first_conditional` re-lexified (29/48 items) |

**Repair queue** — 3 processed, 1 ticked:

- item 1 (`zero_article`): answered, left unticked — blocked on the P0, fix
  proposed above.
- item 2 (`b2_future_forms` #2): **fixed** (`c6d7d80`). `en` carried the
  contraction "I'm meeting" so `gap_answer` "am meeting" could not rebuild
  the frame; uncontracted `en`, both forms kept in `accepts`. Also corrected
  the Czech: "V tři" → "Ve tři".
- item 3 (`b2_clear_claims` label style): **conservative path taken** — style
  left as-is, left unticked, fork below.

**Sequencing** — 2 units, the two worst on the report:

- `a1_word_order` (A1): **33 → 1** unknown type. Whole 26-frame bank and all
  4 intro cards re-authored. Its legal pool at position 4 is only 30 targets
  (a1_word_classes, a1_be_have, trunk_frames_a1) + partner trunk_social_a1 +
  GLUE, so the bank now runs on have/has/need/be/meet with pool nouns and
  GLUE place-and-time (Brno, Prague, Vienna, London, Ostrava, weekdays,
  o'clock). All five teaching points kept and still drilled.
- `a2_first_conditional` (A2): **28 → 1** unknown type. 29 of 48 items
  re-lexified; every teaching point kept.

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 154 packs · 0 errors · 32 warnings | 154 packs · **0 errors** · **31 warnings** |
| `audit` | 756 unknown types (= baseline) | **697** · baseline auto-tightened 756 → 697 |

Net **−59** unknown types. Both gates green before every commit.

### Forks for James

1. **`new` in `a1_word_order`.** The pool at that position contains *no
   adjectives at all* (`a1_word_classes` teaches the word "adjective", not
   any actual ones), so the adj+noun teaching point cannot be drilled
   without one untaught word. Rather than delete the teaching point I
   consolidated three adjectives (new, small) down to **one — "new"** — used
   in all three items. Real fix is curricular: an adjective unit before
   `a1_word_order`, or accept "new" as glue.
2. **`rain` in `a2_first_conditional`.** Weather lexis is untaught at that
   position, but "If it rains, I will…" is the canonical example every
   course uses. Kept **one** weather word, "rain", across the five weather
   items and dropped snows/storms/weather. Real fix: a weather vocab unit
   before the conditionals.
3. **`b2_clear_claims` style (queue item 3).** Its `gap_answer`s are judgment
   labels ("overgeneral", "weak claim"), not sentence words, which is what
   produces 12 of the 31 remaining lint warnings. Conservative call: **left
   as-is**. It is a deliberate spot-the-problem pilot and restyling it would
   change the teaching design, which is yours to decide. Separately I *did*
   fix a straight contract violation in it: all 12 items had an **English**
   question in the `cz` field; now Czech ("V čem je hlavní problém tohoto
   tvrzení?").
4. **Order-style packs are invisible to the audit.** `audit.py`'s
   `targets_of()` only harvests `gap_answer` and `lemma`. `a1_word_order`
   has neither (its items carry `tokens[]`), so it contributes **nothing**
   to the pool — which is part of why downstream units flag coffee/tea/home.
   Adding `lemma` fields would register that vocabulary and probably drop
   the audit total sharply, but it changes pool semantics for the whole
   course. **Not done unilaterally** — your call.

### To smoke-check

- Nothing in grammar can be meaningfully smoked until the P0 adapter lands —
  every grammar unit will show intro cards then jump to Done.
- Once it does: `a1_word_order` and `a2_first_conditional` are the two
  re-authored banks; both were verified mechanically (every gap rebuilds its
  `en`, no duplicate sentences, `en` present in `accepts`) but the Czech is
  worth your eye, especially `a1_word_order` items 16, 24, 25 and
  `a2_first_conditional` items 24, 29, 47.

### No new units built this run

Steps 1–2 used the run. Building further sketch nodes was also the wrong
call while the P0 stands: new grammar units would ship into an engine that
cannot practise them. Recommend the next run either lands the adapter (if
you approve it) or builds **vocab** sketches, which do work today.

---

## 2026-08-06 · local (setup)

Gates built and calibrated: verify_pack (hard, 0 errors on 154 packs),
make_pool (position-aware), audit ratchet (baseline **756** unknown types
across 71/113 live units — partner-pair pooling + GLUE incl. names/days).
Node registry localised (labs frozen, snapshot in data/nodes-*.json).
Repair queue seeded with 3 items from first lint pass.
