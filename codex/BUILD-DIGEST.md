# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-07 · cloud run 10 (RUE build, claude-opus-5)

### Headline: the B2 course path is COMPLETE (21/21 on-path) and C1 is open — `c1_narrative_mastery` is the first C1 unit ever to go live. Every A1/A2 offender I touched turned out to be a forward reference, not a missing word. The P0 is ten runs old.

**`b2_discourse_markers` was the last on-path B2 sketch and it is now live.**
Nothing else was buildable at B2: `craft` is *parked* (your decision — I did
not unpark it), and `b2_future_in_the_past` / `b2_clear_claims` are in no
`path_order` at all, so students never reach them. So the run carried on
into C1 and opened the level: **C1 is 1/22, next is `c1_time_aspect_edge`.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `afff4b0` | `trunk_verbs_daily_a1` re-lexified, 9/12 items — 10 types → 1 |
| 2 | `8f9c4f7` | `a1_to_for_with` re-lexified, 8/24 items — 9 types → 1 |
| 3 | `7415f23` | **`b2_discourse_markers`** built + live — 10 → **48** items |
| 4 | `8676220` | **`c1_narrative_mastery`** built + live — 10 → **48** items · **C1 opens** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 412 unknown types · 60 units | **412** · 60 units · baseline tightened 429 → 412 |

Net **−17** unknown types while adding **96** new items. Both new units are
**100 % pool-clean — they contribute 0 violations between them and neither
appears in the report at all.** The 12 warnings are the pre-existing
`b2_clear_claims` ones, unchanged. Both gates run green before every
commit; commit and push per unit.

### The finding I would most like you to read

**Every single offender in both repaired units was a word the course
teaches *later*, not a word the course never teaches.** I wrote a throwaway
diagnostic that, for each flagged word, reports the path position where it
is first taught:

```
trunk_verbs_daily_a1  (pos 6)   home pos 8 · well pos 10 · office/school pos 14
                                breakfast/bread/water pos 16 · early pos 20 · ticket pos 22
a1_to_for_with        (pos 33)  wait pos 37 · give pos 38 · gift pos 62 · send pos 81
```

That reframes the whole 412. A large part of the audit total is probably
not "sloppy authoring" but **course ordering** — units reaching forward for
vocabulary that arrives a few positions later. Re-lexifying is the right
fix when the sentence survives it, but for `trunk_verbs_daily_a1` the real
answer may be to move `leaf_food_a1` earlier: it sits **ten positions after
the daily-verbs unit that needs bread and water.** Worth ~20 lines in
`codex/` as a permanent report if you want it — I did not ship it, since
tooling is not this lane.

### Judgment calls and forks for you

**1. I left one violation in each repaired unit on purpose, rather than
wreck the teaching.** In `trunk_verbs_daily_a1` I kept *I drink water.* —
there is no drinkable noun anywhere in the 61-word pool at position 6, and
every alternative I tried ("I don't drink." / "I drink with my friends.")
taught the verb worse than the honest sentence does. In `a1_to_for_with` I
kept *Wait for me.* / *I wait for the bus.* — the intro card teaches
`wait for` as a fixed chunk, so deleting it from the items would have
deleted a teaching point to dodge a number. Both are one type each.

**2. Czech first names count as untaught vocabulary.** `Roman` in
`a1_to_for_with` was a violation because `audit.py`'s GLUE name list has
`petr, pavel, jana, eva, honza`-less coverage — it lists `anna martina tom
tomas petr pavel jana eva jan david peter mary john` and nothing else. The
same hits `honza` (a1_prepositions_place), `homare` (a1_and_but_because),
`patrik` / `ondřej` (b1_reported_speech) and **`james`**
(a1_questions_negatives — your own name is flagged as untaught vocabulary).
I took the conservative path and renamed Roman → Petr in the item.
**I deliberately did NOT add names to GLUE**: that would drop the audit
total by several types without improving a single sentence, which is
exactly the kind of gate-gaming the ratchet exists to prevent. Your call —
but if you do want it, it should be a separate, clearly-labelled commit so
the ratchet history stays honest.

**3. `b2_discourse_markers` strand 4 is the reason this unit exists.**
`b1_linkers` already owns the *meanings* (however, although, despite,
therefore, because of). So the B2 unit takes the *grammar*: sentence adverb
vs conjunction vs preposition, and the punctuation that follows. Strand 4
runs minimal pairs over one situation so the choice cannot be made on
meaning alone:

> Although the cost was high, we bought the car. · Despite the high cost,
> we bought the car. · The cost was high. However, we bought the car.

If you would rather this unit had been sequencing/summarising markers
(*first of all, in short, for instance, in other words*), say so and I will
rebuild strand 4 — that was the live fork and I took the grammar path
because it is what B1 does not already cover.

**4. `beside` appears in two quiz distractors and is not pool-legal.**
Deliberate: intro card 4 teaches "besides is the adverb; beside means next
to — two different words", which is a real Czech-learner trap, and the
distractor is the point of teaching it. Every other distractor in all 48
items is either pool-legal or a marker this unit teaches. Flagging it
because it is the one place I knowingly left an out-of-pool token in
student-facing material.

**5. Honest `gap_accepts`, single-answer quizzes.** Where several markers
genuinely work (*therefore / consequently / thus*, *despite / in spite of*,
*even so / nevertheless / however*) I listed them all in `gap_accepts` so a
typed answer is not marked wrong — then checked mechanically that **no quiz
item has two correct options on screen.** It does not; 0/48.

**6. NEW AND STRUCTURAL — `audit.py` cannot stem irregular past forms, so
every past-tense unit is penalised for using them.** Building
`c1_narrative_mastery` I had to throw away good sentences because **`sat`,
`gave`, `stood`, `shone` and `knew` read as untaught even though `sit`,
`give`, `stand`, `shine` and `know(s)` are all in the pool.** The stemmer in
`variants()` only strips regular suffixes, so `sat → sit` is invisible to
it. Casualties this run: *"By the time we sat down…"* became *"By the time
we walked in…"*, *"They gave us the room we had booked"* became *"The room
we had booked was much smaller"*, and *"so I knew the story"* became *"so I
started a new one."* Every one of those is a worse sentence.

This is not a one-off — **it will hit `c1_time_aspect_edge`,
`c1_narrative_mastery`'s neighbours and every remaining past-tense unit**,
and it silently pushes narrative units toward regular verbs, which is the
opposite of what a C1 narrative unit should be teaching. The honest fix is
a small irregular-verb table in `audit.py` (about 60 pairs covers
everything the course uses). **I did not write it** — same reasoning as
fork 2: it drops the audit total without improving a sentence, so it should
be your decision and a separate labelled commit. But unlike the names
issue, this one is actively degrading new content, and I would push for it.
Also worth noting: `grandmother's` is flagged because the apostrophe blocks
the `s`-stem, so possessives are penalised the same way.

**7. The seed-list backlog grew again.** Words this run proved are taught
nowhere in 122 units, on top of run 8's `know`/`answer`/`want`/`see` and
run 9's `feel`/`enough`: **`talk`, `test`, `pen`, `email`, `homework`,
`turn`, `weather`, `nobody`**. `answer` and `email` have now blocked
authoring in three separate runs. `talk` is the one that stings — I had to
write *I speak to my teacher* because `talk` does not exist in the course,
while `talk to` is on the intro card of the very unit I was repairing.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged from runs 1–9, and again nothing was manufactured to produce a
tick. All four sit outside this lane: the **P0**, the hardcoded `A1` vocab
badge, `zero_article` (blocked on the P0), and the `b2_clear_claims` style
call. I re-verified the P0 mechanically rather than trusting the queue
text: **`js/practice-grammar.js` contains zero occurrences of the string
`blocks`**, and still reads `pack.match` / `pack.quiz` / `pack.type_items` /
`pack.use_items`, none of which exist in any of the 160 packs.

**This run put two more grammar units behind that dead sequence — and one
of them opened a whole new level.** Fifty-two grammar nodes when the P0 was
found; it is more now, and the count only goes up. The content side of this
course is in good shape and getting better every hour — and a student
practising grammar today still answers zero questions and is told
"Check: 100 %". The adapter proposal has been sitting in this digest since
run 1. **It needs about twenty lines of `js/` and a decision from you; it
does not need more content.** I am going to keep building units into a
practice engine that never asks them, because content is the lane I have —
but you should know that is what is happening.

### Smoke-check list

- `b2_discourse_markers` intro cards — five of them, and card 1 is a
  three-row table (adverb / conjunction / preposition). Check it reads as
  *grammar* and not as a vocabulary list.
- `trunk_verbs_daily_a1` — "I make cars." replaced "I make breakfast."
  Deliberate (Czech *Vyrábím auta.* is clean), but it shifts the unit's
  daily-life flavour slightly toward work. Reject it if you dislike it.
- `a1_to_for_with` — the instrument item is now "I open the door with my
  key." (*Otevírám dveře klíčem.*). Czech instrumental mirrors English
  `with` there exactly as well as *perem* did for the old pen item.
- **`c1_narrative_mastery` is the first C1 unit — it sets the pattern for
  the other 21, so it is the one to smoke properly.** Two things to look at
  in particular: intro card 2 ("Past perfect is a signal, not a rule")
  teaches a *negative* skill — when to leave the form out — which no
  earlier unit does; and strand 4 mixes habit forms (`used to` / `would`)
  with that leave-it-out skill under one heading. If you would rather those
  were two separate strands, say so before I build more C1 and I will split
  them across the level.

---

## 2026-08-07 · cloud run 9 (RUE build, claude-opus-5)

### Headline: B2 grammar is 20/24 and one sketch off complete on-path; the two worst A2 units are clean; every remaining A1/A2 offender is now an ordinary untaught word

Three B2 sketches went live — **`b2_preposition_ing`**,
**`b2_articles_genericity`** and **`b2_quantifiers_advanced`** — 144 new
items, all three authored 100 % pool-clean. Two A2 repairs took the two
worst remaining A2 units to zero. Total **457 → 429**, four units off the
report. **`b2_discourse_markers` is the last on-path B2 sketch.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `108ac38` | `a2_ed_ing_adjectives` re-lexified, 12/24 items — 10 types → 0 |
| 2 | `3d273d1` | `a2_verb_patterns` teaches its own pattern verbs — 10 types → 0, and 8 more downstream |
| 3 | `edf78d5` | **`b2_preposition_ing`** built + live — 10 → **48** items |
| 4 | `2da7131` | **`b2_articles_genericity`** built + live — 10 → **48** items |
| 5 | `77b8f65` | **`b2_quantifiers_advanced`** built + live — 10 → **48** items |

B2 is **20/24 live**. On the B2 path only **`b2_discourse_markers`**
remains; off-path, `b2_future_in_the_past` and `b2_clear_claims` are still
sketches and `craft` (B1 vocab) is parked. A1, A2 and B1 grammar are fully
live. C1 is 0/22.

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 457 unknown types · 62 units | **429** · 60 units · baseline tightened 457 → 429 |

Net **−28** unknown types while adding **144 new items**. Both gates green
before every commit; commit and push per unit. The 12 warnings are the
pre-existing `b2_clear_claims` ones, unchanged.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged from runs 1–8, and again nothing was manufactured to produce a
tick. All four are outside this lane: the P0 (grammar practice never reads
`blocks[].items`) and the hardcoded `A1` vocab badge are engine code;
`zero_article` is blocked on the P0 decision; `b2_clear_claims` style is
your call. **This run put three more grammar units behind the dead
Check → Type → Use sequence. B2 grammar is now twenty units deep behind a
stage that never runs, and the P0 is nine runs old.** Every hour this lane
runs, the gap between "content that passes the gate" and "content a student
can actually practise" gets one unit wider.

### Judgment calls and forks for James

**1. I made an error and caught it — logging it so the next run trusts the
process, not the prose.** I wrote `codex_unit: "G_NP-B1B2-02"` into
`b2_quantifiers_advanced` — an id that does not exist. The node registry
says `G_NP-B1B2-01`. Neither gate checks `codex_unit`, so it would have
shipped silently; I found it on a cross-check against
`data/nodes-grammar.json` before the commit and restored the registered id.
All three new packs were then verified pack-vs-registry and match.
**Worth a gate**: `verify_pack.py` could assert
`pack.codex_unit == node.codex_unit` and `pack.tree_node == node.id` in
about five lines. That is engine-adjacent tooling rather than content, so I
have not written it — say the word.

**2. `feel` is not taught anywhere in the course, and that cost
`a2_ed_ing_adjectives` its two best sentences.** *I feel tired after work*
→ *I am always tired after work*; *I feel relaxed after a walk* → *I am
relaxed after a long walk*. The grammar is untouched and the Czech is
natural, but "how do you feel" is the single most useful thing an A2
student can say about `-ed` adjectives, and the honest fix is to teach
`feel`, not to route around it. This is run 8's fork 1 again, with a new
name on the list. The other nine words that unit was leaking — `storm`,
`history`, `ending`, `mistake`, `question`, `result`, `rule`, `exam`,
`situation` — are all in the same category.

**3. `enough` is not pool-legal at B2.** I went to write *We have enough
time* in the quantifiers unit and the checker refused it. `enough` is a
core quantifier and it is taught nowhere in 121 units. It belongs on the
seed list with `know`, `answer`, `want` and `see` from run 8.

**4. The choose-the-verb technique is now a house pattern, used three runs
running.** Run 7 (reporting verbs), run 8 (remember/forget/mean/regret),
and this run `a2_verb_patterns`, where all ten violations *were* the unit's
own pattern verbs — `enjoy`, `hate`, `love`, `plan`, `hope`, `decide`,
`agree` appeared in twenty-odd sentences and were never once a gap answer.
Seven items now gap the first verb, with the Czech prompt disambiguating;
41 of 48 still gap the to/-ing form and every moved verb is still gapped
for its pattern elsewhere, so no teaching point was lost. It also cleared 8
violations downstream (`trunk_core_b1` went 4 → 2). **This is no longer a
one-off and should probably be written into the house style — or ruled out
if you dislike it.**

**5. Zero-article items gap the bare noun, not an empty answer.** In
`b2_articles_genericity` the generic items are *"\_\_\_\_ are expensive
in this country."* → `Cars`, with `["Cars", "The cars", "A car", "Car"]` as
the options. The student still chooses the article; they just type the
noun. This keeps every item gradeable and deliberately steers clear of the
open `zero_article` question in the repair queue — no new items depend on
that decision. Conservative, and reversible if the engine ever grades an
empty gap.

**6. Function-word units repeat their answers, and I let them.** In the
preposition and article strands the answer alphabet is `at/in/of/for/about`
and `The/the` — twelve items cannot have twelve distinct answers when the
teaching point *is* the small closed set. I kept every *content-word*
answer distinct within its strand (all 12 `plain_prep` answers differ, all
12 `to_prep_or_infinitive` answers differ, all 24 zero-article nouns
differ) and let prepositions and `The` repeat where they are the point.
Same shape as the live `b2_gerunds_infinitives_advanced`, which repeats
`to` throughout.

**7. `b2_preposition_ing`'s fourth strand is the one to smoke first.** It
is the `to` trap — `be used to` / `look forward to` + -ing against
`want/need/decide/agree` + base form — built around the minimal pair *"She
is used to working at night."* / *"She used to work at night."* That is the
highest-frequency B2 error Czech speakers make and the strand lives or dies
on whether the Czech prompts disambiguate cleanly. I think they do
(*Je zvyklá pracovat v noci* vs *Dřív pracovala v noci*), but it is a
judgment call about Czech, so it is yours.

**8. One Czech ambiguity found and fixed by re-reading my own output.**
`b2_preposition_ing` had *"He worries about losing his job."* cued as
*"Bojí se, že přijde o práci."* — but *"Bojí se létat."* is already the cue
for `afraid of` two strands earlier, so one Czech prompt pointed at two
different English adjectives. Now *"Dělá si starosti, že přijde o práci."*
Mentioning it because the structural checks passed it happily; only reading
all 48 pairs end to end caught it.

**9. Next run's worst A1/A2 units, for whoever picks this up.**
`trunk_verbs_daily_a1` (10 types) is the worst, but it is an A1 *vocab
trunk* sitting fifth in the course — almost nothing is pool-legal that
early, so repairing it means seeding words, not re-lexifying, and that is a
spine decision. The best *repairable* targets are `a1_to_for_with` (9) and
`a2_past_simple` (8).

---

## 2026-08-07 · cloud run 8 (RUE build, claude-opus-5)

### Headline: A2's two worst units are clean, B2 gained two units — and ten ordinary words explain an eighth of everything left on the report

The two worst remaining A1/A2 units were both A2 and both sat at **12
unknown types**: `a2_present_perfect` and `a2_comparatives`. Both are now at
**zero**. Two more B2 sketches went live: **`b2_participle_clauses`** and
**`b2_gerunds_infinitives_advanced`**, both authored 100 % pool-clean, so
the audit total ended exactly where the repairs left it despite 96 new
items. Total **483 → 457**, four units off the report.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `40365b6` | `a2_present_perfect` re-lexified, 11/48 items — 12 types → 0 |
| 2 | `5553cc3` | `a2_comparatives` re-lexified, 11/48 items — 12 types → 0 |
| 3 | `04a2fba` | **`b2_participle_clauses`** built + flipped live — 10 → **48** items |
| 4 | `bbe3ed8` | **`b2_gerunds_infinitives_advanced`** built + live — 10 → **48** items |

B2 is now **17/24 live**; 6 grammar sketches remain in path order
(`b2_preposition_ing`, `b2_articles_genericity`, `b2_quantifiers_advanced`,
`b2_discourse_markers`) plus two off-path (`b2_future_in_the_past`,
`b2_clear_claims`). A1, A2 and B1 are fully live. C1 is 0/22.

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 483 unknown types · 64 units | **457** · 62 units · baseline tightened 483 → 457 |

Net **−26** unknown types while adding **96 new items**. Both gates green
before every commit; commit and push per unit, so every commit on the
branch is independently gate-green. The 12 warnings are the pre-existing
`b2_clear_claims` ones, unchanged.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged from runs 1–7, and again nothing was manufactured to produce a
tick. All four are outside this lane: the P0 (grammar practice never reads
`blocks[].items`) and the hardcoded `A1` vocab badge are engine code;
`zero_article` is blocked on the P0 decision; `b2_clear_claims` style is
your call. This run put **two more grammar units** behind the dead
Check → Type → Use sequence — B2 grammar is now seventeen units deep behind
a stage that never runs, and the P0 is eight runs old.

### Judgment calls and forks for James

**1. Ten ordinary words account for ~60 of the remaining 457 types. This is
the highest-leverage thing on the board and it is a spine decision, so I did
not take it.** Counting how many *separate units* each untaught word breaks:

| word | units it breaks | word | units it breaks |
|------|-----|------|-----|
| `email` | 9 | `see` | 5 |
| `answer` | 8 | `summer` | 5 |
| `rain` | 7 | `missed` | 5 |
| `know` | 7 | `plan` | 5 |
| `tv` | 5 | `want` | 4 |

None of these is exotic — `know`, `answer`, `want`, `see` are among the most
frequent verbs in English, and **no unit anywhere in the course teaches any
of them as a target**. They are used constantly from A1 onward and taught
never. Seeding these ten into early A1/A2 vocab units would dissolve roughly
**an eighth of the entire report** in one pass. That is the same shape as
run 7's adjective fork, and bigger. One run can do it if you want it.

**2. `since` was a teaching point of `a2_present_perfect` that the unit
never actually taught.** for/since is named in the unit's `note` and has its
own intro card, but `since` was never a gap answer, so the audit correctly
called it untaught. I changed *"She has lived here since March."* to gap
`since` instead of `lived` — which fixed the unit, retired a duplicate
`lived` gap in the same stage, and cleared `since` out of
`b1_present_perfect_vs_past` and `b2_present_perfect_continuous` downstream.
**Worth a mechanical sweep**: any other unit whose own headline teaching
word is never a gap answer has the same silent hole. I have not added this
to `REPAIR-QUEUE.md` — that file is your channel, so this is a proposal.

**3. `remember`, `forget`, `mean` and `regret` are not pool-legal, and a
unit about those verbs cannot omit them.** Same fork as run 7's reporting
verbs, resolved the same way: `b2_gerunds_infinitives_advanced` has a
`choose_verb` strand where the meaning-change verb **is** the gap answer, so
the unit genuinely teaches them rather than assuming them. Conservative and
consistent with precedent, but flagging it because it is the second time
this pattern has come up — it is becoming a house technique rather than a
one-off.

**4. `a2_present_perfect` lost every `email` sentence, and I think that is a
loss.** *She has written three emails* → *three books*; *She hasn't sent the
email* → *hasn't opened the door*. The teaching points and gap answers are
identical, but writing emails is exactly what present perfect is for in real
life. This is fork 1 in miniature: the honest fix is to teach `email`, not
to route around it. Say the word and I will put the email sentences back.

**5. Two A2 items changed what they gap, nothing else changed teaching
point.** Beyond `since` above, no gap answer moved in either repair — all 22
other rewrites keep the identical gap answer and swap only the surrounding
lexis. In `a2_comparatives` every comparative/superlative form is untouched.

**6. Replacements were checked against the pack, not just the gate.** In
`a2_comparatives` the obvious swaps would have produced a third
*"Today … than yesterday"* item, a second *"the old one"*, and a third
*"expensive"*. I picked around them, so no near-duplicate sentences were
introduced. Both packs verify 48/48 distinct English sentences and Czech
prompts.

**7. Quiz distractors in the two new packs deliberately contain
out-of-scope strings, and the gate is right to ignore them.** `sat`,
`stood`, `ran`, `felt`, `stole`, `smoke` appear in `quiz_options` only,
never in `en`. For a *which form?* question the distractor set should be the
verb's own other forms — that is the exercise. The audit scores `en` only,
so nothing is affected. Same call as run 7 note 6.

### Smoke-check

- `b2_participle_clauses` and `b2_gerunds_infinitives_advanced` — new intro
  cards, 5 each, both ending in a Common mistakes table. Worth reading the
  Czech on the intro bodies; they are longer than the item-level Czech.
- `a2_present_perfect` item *"She has lived here ____ March."* — this is the
  one item in the course where I moved a gap onto a different word.
- Both new units sit behind the P0 dead stage, so in the browser they will
  show intro cards then jump to Done. That is the P0, not these packs.

---

## 2026-08-06 · cloud run 7 (RUE build, claude-opus-5)

### Headline: the worst unit in the course is now clean, and the reason it was dirty is a spine problem, not a content problem

`a1_be_have` — the first grammar unit a student ever opens, and the worst
entry on the sequencing report at **13 unknown types** — is at **zero**. So is
its partner `trunk_frames_a1`. The audit total went **503 → 483** and two units
dropped off the report. Two more B2 sketches were then built to live:
**`b2_reported_speech_advanced`** and **`b2_relative_clauses_advanced`**, both
authored 100 % pool-clean so the tightened baseline still holds.

The interesting part is *why* unit 1 was dirty. Six of its thirteen violations
were adjectives — *tired, cold, old, ready, happy, right*. **A1 teaches no
adjective at all until path position 40** (`trunk_adjectives_a1`, which holds
36 of them). Every be + adjective example anywhere in the first two-thirds of
A1 is therefore premature by construction. That is a fork for you, below.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `1a55691` | `trunk_frames_a1` repaired — 3 types → 0 |
| 2 | `4fe86c8` | `a1_be_have` re-lexified, 11/26 items — 13 types → 0 |
| 3 | `8d99a73` | **`b2_reported_speech_advanced`** built + flipped live — 10 → **48** items |
| 4 | `9463710` | **`b2_relative_clauses_advanced`** built + flipped live — 10 → **48** items |

B2 is now **15/24 live**. B1 is **finished** — 22/23, and the 23rd (`craft`)
is `parked`, a side door, not a sketch. Nothing in B1 is left to build.

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 503 unknown types · 66 units | **483** · 64 units · baseline tightened 503 → 483 |

Net **−20** unknown types while adding **76 new items**. Both gates green
before every commit; commits and pushes are per unit. The two repairs were
committed separately, each with its own correctly-tightened baseline, so every
commit on the branch is independently gate-green.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged from runs 1–6, and again nothing was manufactured to produce a tick.
The P0 (grammar practice never reads `blocks[].items`) and the hardcoded `A1`
vocab badge are engine code this lane must not ship; `zero_article` stays
blocked on the P0 decision; `b2_clear_claims` is a style call that is yours.

This run added **two more grammar units** to the population behind that dead
stage. B2 grammar is now **fifteen** units deep behind a Check → Type → Use
sequence that never runs. Seven runs old.

### Judgment calls and forks for James

**1. A1's adjectives sit at the end of A1, and that is the single biggest
remaining source of violations — this is the fork worth your attention.**
`trunk_adjectives_a1` (36 adjectives: big, small, old, new, tired, cold,
hungry, ready, nice, kind…) is at **path position 40 of 41**. Everything before
it can only say *be + noun*. Conservative path taken: I seeded exactly **one**
adjective — `tired` — into the partner vocab unit at position 2, and
re-lexified the rest of unit 1 onto nouns. That one word also cleared `tired`
out of `a1_frequency`, `a1_and_but_because` and `trunk_glue_linkers_a1`
downstream, which is a fair measure of the leverage here. **The real fix is to
move a six-to-eight-word adjective seed early in A1** (or move
`trunk_adjectives_a1` itself up the path). That is a spine reorder — a
student-journey decision, so I did not take it. If you want it, one run can
do it and a visible slice of the remaining 483 dissolves with it.

**2. Unit 1 lost its be + adjective examples except one.** *I am not tired.*
survives (that is what the seed bought). *You are right · It is cold today ·
Are you ready? · I am happy · They are at school · She has an old car* are
gone, replaced by noun frames on taught vocabulary. Every gap answer is
unchanged, so no teaching point moved — but the unit is noun-heavy now, and if
you would rather have the adjectives back than have the unit clean, say so and
I will revert it and log the violations instead. Fork 1 is the way to have both.

**3. `trunk_frames_a1` stayed at exactly 12 items — I traded, I did not add.**
All twenty `a1_core_frames_*` packs are 12 items in one block (one is 10), so
12 looks like a house invariant for the Match board and I did not break it. The
item that went is *"I have a bag."*, which taught `bag` a second time —
*"This is my bag."* already covers it. If you want twelve *have*-frames
preserved, that is the line to revert.

**4. `name` is now the gapped target in "My ____ is Anna."** It used to gap
`Anna`. Proper names are in the audit's GLUE list, so the old item taught the
student nothing — and `name` was itself flagged as untaught right below it.

**5. Four core B2 reporting verbs were not pool-legal, so the unit teaches
them itself.** `accuse`, `advise`, `blame`, `congratulate` appear nowhere
earlier in the course. Rather than drop four verbs a B2 reporting unit cannot
sensibly omit, they are introduced in the `choose_verb` strand, where the
reporting verb **is** the gap answer — so the unit genuinely teaches them
rather than assuming them. One drafted item did leak (`discussed`) and was
rewritten onto `mention + -ing`.

**6. A blind spot to be aware of before someone reports it as a leak.** The
audit's stemmer is naive by design (its own docstring says so). It cannot link
irregular pasts to their base (`sat`, `stood`, `stole`), contractions
(`who's`), or British/US spelling pairs (`apologised`/`apologized`). Those
five strings appear in the two new packs **only in `quiz_options` and
`accepts`, never in `en`** — the gate scores `en` only, so nothing is affected.
I kept them deliberately: for a *which form?* question the distractor set
should be the verb's own other forms, and `who's` is the exact error the
`whose` items exist to contrast. Removing them to satisfy the stemmer would
make the exercises worse, not the course cleaner.

**7. A content bug worth a queue item, if you agree it is one.**
`a1_be_have` carried *"She has a dog."* with the Czech *"On má psa."* — wrong
person, sitting in the first grammar unit in the course. I fixed it in passing.
It suggests a mechanical sweep for `cz`/`en` person and gender mismatches
across all 160 packs would be worth doing. I have not added it to
`REPAIR-QUEUE.md` — that file is your channel, so this is a proposal, not a
self-issued ticket.

### Smoke-check

- **`a1_be_have`** — 11 of 26 items changed in the first grammar unit students
  meet. Worth a read-through for tone as much as correctness.
- **`trunk_frames_a1`** — confirm the Match board still draws 12 pairs, and
  that *"I am tired."* reads correctly in the deck.
- **The two new B2 units** — intro cards only, realistically: the P0 means
  Check/Type/Use still ask zero questions, so the 96 new items cannot be
  exercised in the app until the adapter lands.

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
