# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-06 · cloud run 3 (RUE build, claude-opus-5)

### Headline: B1 is finished, and the two worst-sequenced units are clean

`leaf_home_b1` was the last unbuilt B1 sketch. **B1 is now 22 of 23 live**;
the only node left is `craft`, which is *parked*, not planned. The course
path is unbroken from A1 unit 1 to the end of B1.

Alongside that, the two units at the top of the sequencing report were
re-lexified. `a2_prepositions_movement` went to **zero** and dropped off the
report entirely — the first grammar unit in the course to do so.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `bd36af1` | `a1_present_simple` re-lexified, 19/31 items (22 -> 6) |
| 2 | `c34d496` | `a2_prepositions_movement` re-lexified, 20/48 items (21 -> 0) |
| 3 | `079d448` | **`leaf_knowledge_b1`** built + flipped live — 3x12 = 36 items |
| 4 | `510e063` | **`leaf_self_b1`** built + flipped live — 3x12 = 36 items |
| 5 | `660929e` | **`leaf_home_b1`** built + flipped live — 3x12 = 36 items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 157 packs · 0 errors · 31 warnings | **160 packs · 0 errors · 31 warnings** |
| `audit` | 637 unknown types · 71 units | **596** · 70 units · baseline tightened 637 -> 596 |

Net **-41** unknown types. Both gates green before every commit; commits are
per unit, not batched. `scripts/smoke.py` passes.

### Repair queue — 4 open items reviewed, 0 newly ticked

Same conclusion as run 2, and for the same reason: every unticked item is
either engine code (which this lane may not ship) or a style decision that
is James's. Nothing was manufactured to produce a tick.

I did **independently re-verify the P0** rather than trust run 1's report:
`grep -c blocks js/practice-grammar.js` returns **0**, while the file reads
`pack.match`, `pack.quiz`, `pack.type_items` and `pack.use_items` at lines
314, 482, 513, 786, 905, 927. The claim holds — no grammar pack in the repo
has any of those four fields, so all 52 live grammar nodes still ask a
student zero questions. **This is the single highest-value thing James can
unblock**, and it is now three runs old.

### Sequencing repair — 2 units

**`a1_present_simple` (A1 grammar): 22 -> 6.** The worst unit on the report.
19 of 31 items re-lexified. Every teaching point kept and still drilled:
base verb vs `-s`, `don't` / `doesn't` + base verb, and indefinite pronouns
taking `-s`. The pool at this position is only **42 targets from 4 units**,
which is what makes this unit hard rather than careless.

**`a2_prepositions_movement` (A2 grammar): 21 -> 0.** 20 of 48 items. Every
preposition and every teaching point kept — only the props and the motion
verbs moved. Also fixed a real defect while in there: item 42's Czech
support carried a stray English gloss (`"... ze stolu. (on)"`), which is a
language-contract violation, not a typo.

### Forks and judgment calls for James

**1. The A1 pool is too thin to describe daily life — the real finding.**
Rewriting `a1_present_simple` honestly, I could not say *coffee*, *tea*,
*day*, *morning*, *school*, *home*, *office*, *shop*, *bus*, *TV*, or
*football* — none of them is taught anywhere in the first four units, and
several are taught nowhere before A2. A present-simple unit is *about*
habits, and the words for the things people habitually do are missing at
exactly the position where they are needed.

Conservative path taken: I re-lexified onto what exists (`work`, `live`,
`like`, `study`, day names, cities, `dogs`, `books`, `car`, `house`,
`brother`) and **deliberately kept `coffee` and `TV`** — there is nothing
drinkable and nothing watchable in the pool at that position, and inventing
a way around that would have produced worse English than admitting it.
`everybody / everyone / somebody / nobody` were also kept: they are not
decoration, they *are* the teaching point of items 26-30.

**The fix is not in this pack.** It is a handful of concrete nouns in
`trunk_verbs_daily_a1` or an earlier leaf: day, morning, evening, coffee,
tea, home, school, shop. Adding them would clear residual violations across
`a1_present_simple`, `a1_agreement`, `a1_frequency` and
`a1_questions_negatives` at once. Flagging rather than doing it: adding
teaching material to a *different* unit than the one being repaired is a
curriculum decision, not a repair.

**2. Irregular past forms are invisible to the pool.** `drove`, `ran`,
`threw`, `swam`, `flew` all read as untaught even where the base verb is
taught, because `audit.py`'s stemmer only strips regular suffixes. In
`a2_prepositions_movement` I routed around it (`travelled`, `walked`,
`went ... by car`, present-tense `throws`). Worth knowing before someone
reads a future report and concludes an A2 pack is teaching wild vocabulary:
it may just be an irregular past. Not proposing an `audit.py` change — the
blind spot is documented in its own docstring, and widening the stemmer
could hide real violations.

**3. New leaves lower the audit total.** Building `leaf_knowledge_b1` moved
the total 600 -> 597 on its own, because its targets enter the pool and
resolve words that later units were already exposing untaught. Worth
knowing: a falling total is not by itself evidence that repair work happened.

### To smoke-check

All three new units are **vocab**, so unlike the grammar repairs they are
reachable today. Suggested: open `leaf_knowledge_b1`, `leaf_self_b1` and
`leaf_home_b1` and confirm each drives a 12-pair Match board, CZ prompt ->
EN answer, deck 12/36, four graded stages — the same behaviour as
`leaf_work_b1`. Then eyeball the Czech glosses: the ones I would look at
first are `temper` ("vznětlivost / povaha"), `content` (dropped for exactly
this reason — the noun/adjective ambiguity made an honest single gloss
impossible, `frustrated` took its place), `draught`, and `chore`.

Also worth a look: `a1_present_simple` now reads noticeably plainer than it
did. That is the honest consequence of fork 1, not a drafting choice.

---

## 2026-08-06 · cloud run 2 (RUE build, claude-opus-5)

### Headline: B1 vocab is 6 → 3 sketches from done, and it actually works

All three units built this run are **vocab**, and vocab is the half of the
course the P0 does not touch. Drove all three in Chromium against the app on
:8097: each renders a real 12-pair Match board, CZ prompt → EN answer, deck
12/36, four graded stages. Compared side by side with the live `leaf_work_a2`
board — identical behaviour. These are units a student can use today.

That is deliberate. Every remaining B1 sketch is a vocab leaf, so finishing
B1 in path order also happens to be the fastest route to material that is not
blocked behind the grammar engine.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `b6f21e8` | `a1_articles` re-lexified onto pool-legal lexis (26 → 1) |
| 2 | `de36617` | `a2_modals_must_should` re-lexified, 16/48 items (23 → 5) |
| 3 | `45f7a22` | **`leaf_work_b1`** built + flipped live — 3×12 = 36 items |
| 4 | `525f11e` | **`leaf_money_b1`** built + flipped live — 3×12 = 36 items |
| 5 | `802336e` | **`leaf_communication_b1`** built + flipped live — 3×12 = 36 items |

**B1: 16 → 19 of 23 live.** Remaining sketches: `leaf_knowledge_b1`,
`leaf_self_b1`, `leaf_home_b1` (+ `craft`, parked).

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 154 packs · 0 errors · 31 warnings | **157 packs · 0 errors · 31 warnings** |
| `audit` | 697 unknown types (= baseline) | **637** · baseline auto-tightened 697 → 637 |

Net **−60** unknown types. Both gates green before every commit; commits are
per unit, not batched. `scripts/smoke.py` passes.

### Repair queue — 3 open items reviewed, 0 newly ticked

All three unticked items are blocked on a decision that is James's to make,
not work the cloud lane is allowed to do:

- **P0 (grammar engine not wired to grammar packs)** — engine code, proposal
  already written in run 1's entry. Still unshipped, still blocking.
- **`zero_article`** — blocked on the P0 by construction.
- **`b2_clear_claims` style** — conservative path already taken in run 1; the
  style call is James's.

Rather than manufacture a tick, the run spent its budget on sequencing and
build. **One new item filed** (see below).

### Sequencing repair — 2 units, the two worst on the report

**`a1_articles` (A1 grammar): 26 → 1 unknown type.** Whole 32-item bank and
all 6 intro cards re-authored. Every teaching point kept and still drilled:
a/an first mention · a/an + job · an + vowel sound · silent-h *an hour* ·
a + /j/ *a university* · a → the second mention · only-one → the · zero
article for plurals · zero article for uncountables.

**`a2_modals_must_should` (A2 grammar): 23 → 5.** 16 of 48 items re-lexified.
Every item keeps its modal and its teaching point. Replaced words that are
genuinely untaught at that position: seatbelt, smoke, touch, remember, show,
keep, apologise, save, shout, skip, bring, anything, recycle, believe,
online, light, spelling, outside.

**Caveat worth stating plainly:** both of these are grammar packs, so a
student cannot currently practise either of them at all — the P0 means they
render intro cards and jump straight to "Done · 100 %". This work improves
packs that are, today, unreachable. It is still the right work (it is what
the routine is told to do, and it is what the packs will need the moment the
adapter lands) — but it buys nothing for students until the P0 is fixed.

### New unit shape — the conservative call

The three B1 leaves are authored in the **leaf house style** (`en` / `cz` /
`use[]` word banks, 3 blocks of 12), matching all 38 live leaves at A1 and A2
— *not* the `practice: "frames"` full-sentence style the three B1 *trunks*
use. Rationale: `kind` drives shape in this repo (trunks teach lexis in
frames, leaves are thematic banks), and the vocab engine merges a multi-block
pack into one deck either way. If you want B1 leaves to carry a `sentences[]`
Use bank on top, say so and it is additive — no rewrite needed.

Every word in all three packs was checked against `make_pool.py` output at
its own position: **zero already-taught words, zero duplicate `en`, zero
duplicate `cz`, zero overlap between the three new leaves.**

### Forks for James

1. **`hour` is the only out-of-pool word left in `a1_articles`.** Silent-h is
   a listed teaching point on the "a or an?" card and *hour* is the only
   silent-h word in reach — there is no pool-legal substitute. Kept
   deliberately, rebuilt as "We have an hour." (the old frame needed *wait*
   too, also untaught). Conservative alternative if you dislike it: drop the
   silent-h point until a unit teaches *hour*. I did not, because that would
   be deleting a teaching point to please the gate.

2. **No vowel-initial job noun exists in the pool at `a1_articles`.**
   *engineer*, *artist* and *nurse* are all taught later (`leaf_work_a1`).
   So the six job items became four (teacher, doctor, student, policeman) and
   "an + job" is now taught by composition — the a/an sound rule and the job
   rule are each drilled separately. Real fix is curricular: move a couple of
   vowel-initial jobs earlier, then this item comes back for free.

3. **The sun and the moon are gone from `a1_articles`.** Both were
   out-of-pool. The "only one → the" teaching point is kept in full, moved
   from world-unique to situation-unique ("There is only one bathroom here.
   The bathroom is upstairs." / "…only one station in this village."). Honest
   note: the world-unique flavour is now absent from the pack entirely,
   including the intro card. If you want *the sun* back as the canonical
   example, the clean fix is teaching sun/moon in an early nature leaf.

4. **5 of the `a2_modals_must_should` "violations" are audit stemmer
   artifacts, and I left them in on purpose.** They are *say*, *see*,
   *drive*, *worry*, *forget* — and *said*, *saw*/*seen*, *driver*/*driving*,
   *worried* and *forgotten* are all already taught. `audit.py` stems only
   the **exposed token**, never the **taught set**, so it can never walk
   backwards from a taught inflected form to an untaught base. Rewriting
   "You should see a doctor." or "What should I say?" to dodge that would
   make the course worse to make a number smaller. Proposed fix (not shipped
   — changing a gate to lower its own score is exactly the wrong incentive,
   so this needs your say-so): give `audit.py` a small irregular table
   (said→say, saw/seen→see, forgotten→forget, …) and reverse-derive bases
   when adding to the pool (driving/driver→drive, worried→worry), instead of
   only forward-stemming what it reads.

5. **`email` is exposed all over A2 grammar but never *taught* by anything.**
   `targets_of` only counts vocab `en` and `gap_answer`, and no vocab unit
   has ever listed it. It is a genuine hole in the registry, not a stemmer
   quirk. It does not belong in a B1 communication leaf — it belongs in
   `leaf_tech_a1` / `leaf_tech_a2`. Left alone; flagging it.

### New repair-queue item

**Vocab level badge is hardcoded `A1`.** `js/practice-vocab.js` 628–631
interpolates the literal string `A1` into the deck header, so all 41 live
vocab nodes announce themselves as A1. Verified in Chromium: the three new B1
leaves show "36 words · A1", and the pre-existing `leaf_work_a2` shows
"33 words · A1" — so this is not a regression from this run. One-line fix
(`node.levels[0]` is already to hand in `openNode`). Engine code, so filed
rather than shipped. Cosmetic — nothing is mis-taught.

### Smoke-check list for James

- The three new B1 leaves in the app — Match, Quiz, Type, Use. I verified
  Match renders and is interactive; I did not play all four stages to the end.
- `a1_articles` Czech: I normalised the parenthetical hints in the `cz` field
  to Czech (they were a mix of Czech and English). Worth a skim.
- `a2_modals_must_should` items 2, 4, 6, 24, 25, 27, 30, 32, 34, 35, 37, 42,
  43, 44, 45, 47 — the 16 re-lexified ones.
- The "A1" badge on any vocab unit, to confirm the diagnosis above.

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
