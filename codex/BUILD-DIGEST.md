# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-06 · cloud run 6 (RUE build, claude-opus-5)

### Headline: B2 is over half live, and the ratchet now bites — every new unit had to be authored 100 % pool-clean

B2 went from **10/24 to 13/24 live** — `b2_modal_perfect`,
`b2_passives_advanced` and `b2_causative`, the next three sketches in
`path_order_b2`. Before them, the two worst-sequenced A2 units on the report
were repaired to **zero** and dropped off it.

The two repairs tightened the baseline **531 → 503** *before* the builds
started, which changed the job: with no slack left, all three new units had to
contribute **zero** unknown types or the ratchet would have failed. They do.
Every `en`, every `accepts` string and every quiz distractor was checked
against `make_pool --before <node>` before the pack was written, and the audit
total is unchanged at **503** with three more live units in it.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `da951c5` | `a2_will_going_to` re-lexified, 16/48 items (15 types → 0, off the report) |
| 2 | `3dceb13` | `a2_present_continuous` re-lexified, 14/54 items (13 types → 0, off the report) |
| 3 | `f5692a1` | **`b2_modal_perfect`** built + flipped live — 30 → **60** items |
| 4 | `98e8d51` | **`b2_passives_advanced`** built + flipped live — 10 → 48 items |
| 5 | `5452687` | **`b2_causative`** built + flipped live — 30 → 48 items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 531 unknown types · 68 units | **503** · 66 units · baseline tightened 531 → 503 |

Net **−28** unknown types while adding **156 new items** across three units.
Both gates green before every commit; commits and pushes are per unit.

### Repair queue — 4 open items reviewed, 0 newly ticked

Same conclusion as runs 1–5, and again nothing was manufactured to produce a
tick. The P0 (grammar practice never reads `blocks[].items`, so all live
grammar nodes ask zero questions) and the hardcoded `A1` vocab badge are both
**engine code this lane must not ship**. `zero_article` stays blocked on the
P0 decision, and `b2_clear_claims` is a style call that is James's.

This run added **three more grammar units** to the population sitting behind
that dead stage. B2 grammar is now **thirteen** units deep behind a Check →
Type → Use sequence that never runs. Six runs old.

### Judgment calls and forks for James

**1. `b2_modal_perfect` is 60 items, not the house 48 — deliberate, and the one
call worth overruling if you disagree.** The node registry calls it a "Mega
unit" and lists eight sub-topics (ability, permission, obligation, advice,
possibility, deduction, perfect modals, semi-modals). Packing eight into 48
items would give roughly six items per point — thinner than any live B2 pack.
I read the house invariant as **12 items per strand** rather than 48 per pack
(the live B2 units are 4 × 12 because they each have four patterns), so this
one is 5 × 12: obligation, permission/ability, advice, deduction-now, and the
modal perfect. The conservative alternative was 48 with the perfect modals
squeezed to 12; say the word and it drops to four strands.

**2. Weather verbs are exposed at A2 but taught nowhere — this is a real gap in
the vocab spine, not an audit artefact.** Repairing the two A2 units meant
deleting *It is raining*, *Is it snowing?* and *It will rain later*, because no
unit anywhere teaches `rain` or `snow` as targets (`rains` is taught inside
`a1_agreement`, which does not license the base form). A2 grammar currently
cannot talk about the weather at all. Conservative path taken: the sentences
were re-lexified onto taught vocabulary rather than kept as violations. The fix
belongs in a vocab node, not in grammar — suggest adding rain / snow / sun /
cloud to an A2 vocab unit, after which these examples can come back.

**3. Two packs carried explanations belonging to a different unit.** Content
bugs, not sequencing ones, both fixed in passing:
`a2_will_going_to` item 43 explained the **passive voice** inside a
future-forms pack, and all six stative-slice items in `a2_present_continuous`
(48–53) carried the pack's generic "am/is/are + -ing" line — which directly
contradicts the simple-form answer those items teach. The stative items now
state the actual rule.

**4. `codex/audit.py` prints a misleading line when run without `--check`.**
When the total *exceeds* the baseline it still prints `ratchet ok: 527 <=
baseline 503`. The `--check` path fails correctly, so the gate itself is sound
— but a future run that eyeballs the bare `audit.py` output could conclude it
passed when it did not. I hit this exact case mid-run. Not touched: changing a
gate script is your call, not this lane's. One-line fix in the `else` branch.

**5. Dropped from the drafts, deliberately.** `b2_modal_perfect`'s
"I can't have left my keys there" (its Czech glossed a past deduction as
present ability) and `b2_causative`'s "Do not have your luggage left
unattended" (not a natural causative). Neither was replaced by a weaker item —
both strands were rebuilt from scratch around the teaching point.

### Smoke-check list

- **`b2_modal_perfect`** — the 60-item length is the fork above; also worth
  checking that five strands read as one unit rather than two.
- **`b2_causative` `person` strand** — *have + person + base form* vs *get +
  person + to + infinitive* is the part the draft did not have at all.
- **`a2_present_continuous` items 48–53** — the stative explanations changed;
  the answers did not.
- **`a2_will_going_to`** — 16 of 48 items have new sentences. Gap targets and
  teaching points are unchanged, but the lexis is all new.

---

## 2026-08-06 · cloud run 5 (RUE build, claude-opus-5)

### Headline: three more B2 units live, and every gap frame in the repo now rebuilds its own sentence

B2 went from **7/24 to 10/24 live** — `b2_mixed_conditionals`,
`b2_wish_if_only` and `b2_hypothetical_past`, the next three sketches in
`path_order_b2`. All three came out at **48 items in 4 strands of 12**, the
shape run 4 settled on. None contributes a single unknown type to the audit.

Alongside that, `a1_agreement` — the worst-sequenced A1/A2 unit on the report —
went to **zero** and dropped off it, and a repo-wide sweep closed out the last
five items whose canonical `en` did not match its own gap frame.

Net: audit **567 -> 531**, lint warnings **31 -> 12**. Every remaining warning
is `b2_clear_claims`, which is the open style decision that belongs to James.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `0304551` | `b1_relative_clauses` — 14 gap_answers + 5 Czech prompts repaired |
| 2 | `6273dd4` | `a1_agreement` re-lexified, 22/26 items (19 -> 0, off the report) |
| 3 | `d9e1264` | `a2_past_continuous` re-lexified, 15/48 items (17 -> 1) |
| 4 | `88f13ce` | **`b2_mixed_conditionals`** built + flipped live — 30 -> 48 items |
| 5 | `4053005` | **`b2_wish_if_only`** built + flipped live — 30 -> 48 items |
| 6 | `13f968d` | **`b2_hypothetical_past`** built + flipped live — 10 -> 48 items |
| 7 | `2f601ba` | last 5 frame-mismatched items repo-wide |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 31 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 567 unknown types · 69 units | **531** · 68 units · baseline tightened 567 -> 531 |

Net **-36** unknown types and **-19** warnings. Both gates green before every
commit; commits and pushes are per unit, not batched.

### Repair queue — 4 open items reviewed, 0 newly ticked

Fifth run running, same conclusion, and again nothing was manufactured to
produce a tick. Every unticked item is either engine code this lane may not
ship or a style call that is James's.

**P0 re-verified independently for the fifth time** (I did not trust runs 1-4):
`grep -c blocks js/practice-grammar.js` -> **0**, and no pack anywhere in the
repo has a top-level `match` / `quiz` / `type_items` / `use_items` field —
checked by parsing all 160 packs, not by grepping, because a naive grep hits
those words nested inside `blocks` and looks like a false positive. Every live
grammar node still asks the student **zero questions** before Done. This run
added three more grammar units to that population; **B2 grammar is now ten
units deep behind a stage that never runs**, and this is five runs old.

### Sequencing repair — 2 units

**`a1_agreement` (A1 grammar): 19 -> 0.** The worst A1/A2 unit on the report.
22 of 26 items re-lexified; **no `gap_answer` changed**, so every subject-verb
agreement contrast survives untouched — only the nouns and adverbs around the
verb moved (shop/office -> Anna/Tom, coffee/tea -> dogs/cars, football/tennis
-> friends/dogs, bus -> car, maths -> English, ice cream -> books, Sara ->
Eva). The pool at this position is tiny (69 targets, 6 units), so the
replacements had to come from a very short list. Explanations and the intro's
Quick check were re-aligned to the new lexis rather than left pointing at
sentences that no longer exist.

Worth noting on its own: items 20 and 21 previously shared the **identical**
Czech prompt, `"Jezdí do školy autobusem."`, for *He goes…* and *They go…*.
Czech pro-drop made the target person unrecoverable from the prompt, so the
student could not know which English sentence was wanted. Now `"On jezdí…"`
and `"Oni jezdí…"`.

**`a2_past_continuous` (A2 grammar): 17 -> 1.** 15 of 48 items re-lexified,
incidental lexis only. The interrupted-action and when-clause shapes are all
preserved.

### Forks and judgment calls

**1. `while` stays in `a2_past_continuous` — the one residual violation.**
Item 37 (`While she was cooking, I opened the window.`) is the unit's only
occurrence of `while`, and I could have deleted it to reach zero. I did not.
`while` is the subordinator that expresses two simultaneous past actions,
which is half of what past continuous is *for*; a unit that teaches the form
but is forbidden from saying `while` teaches worse. **Conservative path: kept,
logged, floor of 1.** Swapping it to `when` would have scored better and
taught less. **For James:** the structural fix is the same one flagged in run
4 — a first-class `teaches` list read by `targets_of` — which is a gate
change, not a content change.

**2. I took `b1_relative_clauses` off the "found, not fixed" list without
waiting for it to be queued.** Run 4 found it, offered to take it, and left it
for James to add to the queue; it was not added. It was 14 of the 31 lint
warnings and a live-content correctness bug, so I fixed it rather than report
it a second time. It is a content-lane fix, which is this lane's job — but the
queue's rule is that James adds items, so flagging that I acted first.
All 14 items now have `gap_answer` `"that"`, matching the word actually in
`en`; `gap_accepts` is untouched so `which`/`who` still grade correct wherever
they are legal. Five Czech prompts that had dropped the relative clause
entirely (items 7, 11, 17, 44) or read unnaturally (43) were rewritten — since
`cz` is the prompt, a student reading `"Klíče na stole jsou moje."` had no way
to know a relative clause was wanted.

**3. The frame sweep: 259 mismatches, 5 real.** After finding one item in
`a2_past_continuous` whose `gap` did not rebuild its own `en`, I checked all
160 packs. 259 items fail that test, which looks alarming and mostly is not:
**234** are cue-style drill items where `en` *is* the answer (`en: "me"`,
`gap: "I → ____"`) — a legitimate pack style in `a1_object_pronouns`,
`a1_word_classes`, `b1_it_subject`, `b1_modals_speculation` and
`b1_verb_patterns_advanced`, not a defect — and **20** are the label-style
answers already sitting in the queue (`zero_article`, `b2_clear_claims`). That
left **5** genuine ones, all fixed in `2f601ba`. The direction of each fix came
from the item's own `explanation` (`"I → am."` keeps the full form,
`"is + not → isn't."` keeps the contraction), and in every case the new `en`
was already in that item's `accepts`, so nothing changed about grading.
**Genuine frame defects remaining repo-wide: 0.**

**4. `b2_mixed_conditionals` absorbs the if-alternatives.** The sketch node's
own note says it should, and there is no separate unit for them anywhere on
the path — so strand C is `unless` / `provided that` / `as long as` / `in case`,
three items each. Same reasoning as run 4's `b2_future_forms` absorbing
future-in-the-past. Note that `unless` is not in the pool at that position and
only becomes legal *because* this unit gaps it; that is the audit working as
intended, not a loophole.

**5. Quiz distractors: one stemmer artifact, no real leak.** Across the three
new units the distractor sets are all inflections of the verb already in the
item's own `en` (told/tell/telling, knew/know, missed/miss). A handful fail a
naive pool check — most visibly `know` as the distractor for `knew` — purely
because `audit.py`'s suffix stemmer cannot connect irregular pairs. No
distractor introduces a word the student has not just read in the same
sentence. Same conclusion as run 4's fork 4; noted so nobody re-derives it.

**6. `en` is uncontracted in all three new units**, per `c6d7d80`, with
contractions in `accepts` / `gap_accepts`. `b2_hypothetical_past` is the case
where this matters most: the sketch wrote `I'd rather` and `It's time`
throughout, and `audit.py` tokenises `I'd` as a single unknown token, so
uncontracting was worth roughly a dozen violations on that unit alone.

### Czech quality

Three sketch translations were wrong rather than merely stiff, and were
rewritten rather than patched:

- `b2_wish_if_only` item 21: `"Přála by si, že nemusí pracovat o víkendech."`
  is ungrammatical — now `"Přála by si nemuset pracovat o víkendech."`
- `b2_hypothetical_past`: `"Co když řekne ne?"` for *What if she said no?*
  loses the hypothetical — now `"Co kdyby řekla ne?"`
- Three `would rather + past perfect` items had archaic pluperfect Czech
  (`"kdybys mu to byl neřekl"`); now the ordinary modern form.

I also wrote one myself and then caught it: `"Kéž by nás byli pozvali."` went
in for *If only they had invited us.* and was corrected to `"Kéž by nás
pozvali."` before the commit.

### Smoke-check list for James

- **`a1_agreement` had 22 of its 26 sentences rewritten** — by far the biggest
  student-visible change this run, and it is unit 7 of A1, so almost every
  student sees it. Worth a read for Czech feel.
- The three new B2 units are **grammar** units, so under P0 they render their
  intro cards and then skip straight to Done. The intros are the only part a
  student can see today, and all three are new: `b2_mixed_conditionals` has a
  two-pattern table plus a time-word cue table, `b2_wish_if_only` a
  one-step-back table and an Avoid/Say table, `b2_hypothetical_past` three
  tables including blame-vs-no-blame for `it is time`.
- `b1_relative_clauses` items 7, 11, 17, 43, 44 have new Czech prompts.
- B2 path is now unbroken for the first 10 nodes. Next sketches in order:
  `b2_modal_perfect`, `b2_passives_advanced`, `b2_causative`.

---

## 2026-08-06 · cloud run 4 (RUE build, claude-opus-5)

### Headline: three B2 grammar units live, and the two worst A2 units repaired

B2 went from **4/24 to 7/24 live**. All three units were sketches that had
never been sized or Czech-carded properly — two 10-item `thin_shell`s and one
30-item `first_draft` — and each came out at **48 items** with a full Czech
intro, matching the nearest live good_draft packs (`b2_present_perfect_continuous`,
`b1_*`). No new node ids were invented; all three were already registered.

On the repair side, `a2_quantifiers` — the worst unit on the whole sequencing
report — went to **zero** and dropped off it entirely.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `516c613` | `a2_quantifiers` re-lexified, 18/54 items (20 -> 0, off the report) |
| 2 | `ca98d3b` | `a2_verb_patterns` re-lexified, 13/48 items (19 -> 10) |
| 3 | `7a7de37` | **`b2_narrative_tenses`** built + flipped live — 30 -> 48 items |
| 4 | `9f69695` | **`b2_future_forms`** built + flipped live — 10 -> 48 items |
| 5 | `39f5330` | **`b2_be_get_used_to`** built + flipped live — 10 -> 48 items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 31 warnings | **160 packs · 0 errors · 31 warnings** |
| `audit` | 596 unknown types · 70 units | **567** · 69 units · baseline tightened 596 -> 567 |

Net **-29** unknown types. Both gates green before every commit; commits and
pushes are per unit, not batched. All three new units contribute **0** to the
audit total — every one of their 144 `en` sentences is pool-legal.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged conclusion, fourth run running: every unticked item is either engine
code this lane may not ship, or a style decision that is James's. Nothing was
manufactured to produce a tick.

**P0 re-verified independently again** (I did not trust runs 1-3):
`grep -c blocks js/practice-grammar.js` -> **0**. The file's only `pack.*`
reads are `pack.use_items` (x3), `pack.quiz` (x2), `pack.match` (x2),
`pack.type_items` (x1) — none of which exists in any pack. Every live grammar
node still asks a student **zero questions** before landing on Done. This run
added three more grammar units to that population; B2 grammar content is now
seven units deep behind a stage that never runs. **This is still the single
highest-value thing James can unblock, and it is now four runs old.**

### Sequencing repair — 2 units

**`a2_quantifiers` (A2 grammar): 20 -> 0.** The worst unit on the report.
18 of 54 items re-lexified; **no `gap_answer` changed**, so every quantifier
contrast the unit drills is untouched — only the nouns around them moved
(questions -> minutes, TV -> football, snow -> juice, seats -> buses, effort ->
time, patience -> bread, noise -> salt, and so on). Each new `cz` is a fresh
natural translation, not a patch of the old one. First A2 grammar unit to
reach zero.

**`a2_verb_patterns` (A2 grammar): 19 -> 10.** 13 of 48 items re-lexified,
incidental lexis only: medicine, rest, stay, win, podcasts, practise, move,
join, learn. The `stop + to` / `stop + -ing` minimal pair (items 43/44) was
moved from *rest* to *eat* **as a pair**, so the contrast that is the whole
point of those two items survives intact.

### Forks and judgment calls

**1. `a2_verb_patterns`: the 10 residual violations are the teaching point.**
They are the matrix verbs themselves — enjoy(s) x5, plan x3, hope(s) x4,
hate x2, love(s) x2, decide(d) x3, agreed. A verb-patterns unit cannot teach
"which verbs take `to` and which take `-ing`" without naming those verbs, and
they are never the `gap_answer`, so `audit.py`'s `targets_of()` cannot see the
unit as teaching them. **Conservative path taken: left in place, nothing
swapped, nothing deleted.**

I considered registering them via the `lemma` field (which `targets_of` does
read) and rejected it: in all three packs that use `lemma` today
(`b1_present_perfect_vs_past`, `b1_reported_speech`,
`b2_present_perfect_continuous`) it means "base form of the *gapped* verb",
i.e. the cue shown to the student. Repurposing it as a general "this unit
teaches this word" register would be gaming the gate with off-label data.
**For James:** the clean structural fix is a first-class `teaches` list on a
pack (or on the node), read by `targets_of` alongside `gap_answer`/`lemma`.
That is a gate change, not a content change, so this lane did not ship it.
Until then this unit's floor is 10, and the same will be true of any future
"which verb takes what" unit.

**2. `b2_future_forms` absorbs future-in-the-past.** The sketch's own note
said it should, and `b2_future_in_the_past` is registered but **not on
`path_order_b2`** — a student never reaches it. I built the full 8-meaning
unit including `would` / `was going to` / `was about to` (6 items). **For
James:** either retire `b2_future_in_the_past`, or put it on the path and I
will thin `b2_future_forms` back to 7 meanings on a later run. Conservative
default = the on-path unit is complete on its own.

**3. Contractions stay out of `en`.** Every new item's `en` is uncontracted so
the gap frame reconstructs exactly; contractions live in `accepts` and
`gap_accepts`. This follows the precedent set by the ticked queue item
`c6d7d80` and by `b2_present_perfect_continuous`. Side benefit: `audit.py`
tokenises `I'll` / `we're` as single unknown tokens, so this also keeps the
new units off the report.

**4. `b2_narrative_tenses` quiz distractors — checked, no leak.** 15 distractor
tokens fail a naive pool check: *discussed, sat, slept, talked, ran, escaping,
turning*. Every one is a different inflection of a lexeme already present in
that same item's own `en` (discussing, sitting, sleeping, talking, running,
escaped, turned off). No distractor introduces a word the student has not just
read. Left as-is; noted so nobody re-derives it.

**5. `b2_be_get_used_to` strand tagging is uneven, coverage is not.** The
`form` tags came out be_ing 6 / be_noun 6 / get_ing 3 / get_noun 9 / habit 12 /
choice 12 rather than a clean split, because `get used to` attaches to a noun
more often than to `-ing` in natural sentences. The **pedagogical** split is
the intended 12 be / 12 get / 12 used-to / 12 forced-choice. Flagging it in
case the tag counts get read as coverage counts later.

### Found, not fixed — queue candidate for James

**`b1_relative_clauses` (live, B1): 14 items have `gap_answer` that is not the
word in `en`.** Items 1, 4, 7, 11, 17, 20, 26, 28, 31, 33, 36, 39, 43, 44 all
read `en: "The book that I bought…"` while `gap_answer` is `"which"` (or
`"who"` at 28/33). `gap_accepts` allows both, so the item is answerable, but
the canonical frame does not rebuild its own `en` — these are 14 of the 31
`verify_pack` warnings. Two of them (39 `"the only ticket that…"`, and 33
`"Anyone that…"`) are cases where `which` would actually be the *worse*
answer, so the fix is almost certainly "set `gap_answer` to `that`, keep
`gap_accepts`".

Separately, four of those items have a `cz` that drops the relative clause
altogether — item 7 `"Klíče na stole jsou moje."`, item 11 `"Autobus do Brna
odjíždí v devět."`, item 17 `"Obchod s nářadím je zavřený."`, item 44 `"Cesta
k řece je blátivá."`. Since `cz` is the prompt and `en` is the graded target,
a student reading those cannot know a relative clause is wanted. Item 43's
`cz` (`"…, ze kterého jsme se smáli"`) is also not natural Czech for "a story
that made us laugh".

I did **not** touch it: this run's sequencing quota (2 units) and build quota
(3 units) were both full, and the queue's rules say James adds items. It is a
content-lane fix, roughly one commit. Put it on the queue and I will take it.

### Smoke-check list for James

- Nothing student-visible changed for A1/A2 beyond example sentences — but
  `a2_quantifiers` and `a2_verb_patterns` had 31 sentences rewritten between
  them, so those two are worth a read for Czech feel.
- The three new B2 units are **grammar** units, so under P0 they will render
  their intro cards and then skip straight to Done. The intros are the only
  part a student can actually see today; all three were rewritten and are
  worth a look on their own terms (`b2_future_forms` has a 7-row meaning->form
  table, `b2_be_get_used_to` a 3-row what-follows-`to` table).
- B2 path is now unbroken for the first 7 nodes.

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
