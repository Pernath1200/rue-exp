# Essential units — the ones to make really good

Built 2026-08-10 from the note sweeps of **Martin** and **Tomas** (~31 logged
errors between them). This is not a generic syllabus: every unit below is here
because a real student actually made that mistake, and the student sentence is
quoted so you can see what you're fixing.

**Scope: A1/A2 grammar.** That's James's call and the evidence supports it —
even Tomas, who talks at B1, makes A1/A2 errors. Vocab leaves and B1+ are a
separate question. 15 units, so at ~20–30 min of careful review each this is
roughly 5–7 hours — three or four sittings, not one.

**How to work through it:** take one unit, run it as a student would
(`python -m http.server 8097`, then walk the whole ladder), then fix. Tick it
here. Don't batch — one unit properly beats five skimmed.

---

## Tier 1 — both students, highest frequency. Do these first.

### 1. `a1_agreement` — Subject–verb agreement · A1 step 9
**The single most-evidenced error in the whole sweep. Both students.**
- Tomas: *"we was"* · *"we was grilling"* · *"my father have"* · *"he have every week"*
- Martin: *"we was"* (self-flagged, and he wrote "verb subject agreement" himself)
- James's own note in Tomas's file: *"verb subject agreement drill"*
- [ ] Reviewed
- **Worked 2026-08-11 (`2d8c76d`), 26 → 28 items.** Fixed: 26/26 distractor
  sets drawn from untaught tenses (`lived` was a correct answer to
  "She ____ in Prague"); three subject-less Czech prompts, two of them 3sg/3pl
  ambiguous, in the unit about singular vs plural; two missing possessives;
  *hlídá* glossed as "watches". Added `My brother has a car.` /
  `My parents have a car.` — `has`/`have` only ever sat on bare pronouns, so
  ***"my father have"* was never actually drilled**. Both quoted Tomas
  sentences are now covered except *"we was"*, which is past `be` and lives
  in #5.

### 2. `a1_word_order` — Word order · A1 step 4
**Textbook Czech-L1 interference** — Czech word order is free, English isn't.
Expect this in every Czech student, not just Tomas.
- *"for me is it"* → for me it is
- *"very difficult was the weather"* → the weather was very difficult
- *"I think that important is …"* → I think what's important is…
- *"we have still any problems"* → we still have some problems
- *"when born our second son"* → when our second son was born
- [ ] Reviewed

### 3. `a1_articles` — Articles · A1 step 18
- *"I like long trip"* · *"I go to the cycling"* · *"I go to the my office"*
- *"I am modern people"* → I am a modern person
- [ ] Reviewed

### 4. `a1_possessives` — Possessives (my / your / 's) · A1 step 20
**Martin's recurring weak area — surfaced four separate times** in his notes
(full paradigm block, "my phone, mine", "more focus on drills relating to
possessive and pronouns", "someone (pron)"). Either being recycled on purpose
or not sticking.
- [ ] Reviewed

---

## Tier 2 — direct error evidence, fewer instances

### 5. `a2_agreement` — Subject–verb agreement (A2) · A2 step 3
The continuation of #1. Do it in the same sitting while the material is fresh.
- **This is where *"we was"* belongs** — both students, and `we were` is **not
  in the pack**. It has *he was*, *they were*, *you were* only. Add it.
- **10 of 26 items carry the same distractor defect** fixed in #1 — `lived`,
  `worked`, `had`, `liked`, `going`, `having` offered on present-tense items.
  The `was`/`were` items are fine; this unit legitimately teaches them.
- [ ] Reviewed

### 6. `a1_object_pronouns` — Object pronouns · A1 step 22
Martin's pronoun thread; also *"my physio said me that…"* (Tomas) sits near here.
- [ ] Reviewed

### 7. `a2_countable` — Countable and uncountable · A2 step 19
- Tomas: *"equipments"* → equipment · *"there is necessary to have equipments"*
- [ ] Reviewed

### 8. `a2_quantifiers` — Much / many / a lot · A2 step 21
- Tomas: *"much people"* · *"very much tourists"*
- His own jotting lists "several, meaning, a few, many" as a set to teach
- One dropped-subject prompt already fixed in passing 2026-08-11 (*O víkendech
  nikam nechodí* → *On o víkendech…*); the rest of the unit is unreviewed.
- [ ] Reviewed

### 9. `a2_verb_patterns` — Verb patterns (to / -ing) · A2 step 27
- Tomas: *"we try go"* → we try to go
- [ ] Reviewed

### 10. `a1_prepositions_time` — Prepositions of time · A1 step 40
- Tomas: *"I go there 7.30"* → at 7.30
- Martin: "half past eleven" recurs twice, and "in on at for time as well as place" is his own note
- [ ] Reviewed

### 11. `a1_prepositions_place` — Prepositions of place · A1 step 33
- Tomas: *"we worked to our garden"* → in our garden
- [ ] Reviewed

---

## Tier 3 — foundational; the above depend on these being solid

### 12. `a1_be_have` — Be / have · A1 step 2
- Tomas: *"we don't afraid"* → we aren't afraid (uses *do* where English needs *be*)
- [ ] Reviewed

### 13. `a1_questions_negatives` — Questions & negatives · A1 step 13
Same root cause as #12 — negation with *be* vs *do*.
- [ ] Reviewed

### 14. `a2_past_simple` — Past simple · A2 step 5
- Tomas: *"when born our second son"* (also a word-order error, #2)
- [ ] Reviewed

### 15. `a2_present_perfect` — Present perfect · A2 step 9
The gateway structure into B1. Martin is already being fed it in scaffolded
chunks (*"since then I have been more careful"*), so the unit needs to be good
before he meets it productively.
- [ ] Reviewed

---

## What "really good" means — check each of these per unit

Use this as the review checklist so "good" is a test, not a feeling.

1. **The intro actually teaches.** Grammar packs use `intro.cards`. Does a
   student who doesn't know this structure understand it after reading? Read it
   as them, not as the author.
   > **Before 2026-08-11 you could not test this.** `points[]` was never
   > rendered — 403 of 557 grammar intro cards carry it, and 43 had nothing
   > else, so those drew a title and no content. `**bold**` printed as literal
   > asterisks. Fixed in `03c0137`. Any intro judged "thin" before that date
   > was judged on a truncated render — look again.
2. **Explanation prose is level-appropriate** (AGENTS.md rule): A1/A2 gets
   simple plain-English metalanguage — short sentences, no subordinate clauses
   *in the explanation itself*. The explanation must not be harder than the
   thing it explains.
3. **Plain grammar terms.** Name the real category. No baby-talk.
4. **Every stage is populated and playable** — Check, Type, Use. `check_playable.py`
   proves stages exist; only you can tell whether they're *worth doing*.
5. **Enough items to rotate.** `DEFAULT_PASS` is 12 — a bank of exactly 12 hands
   the student the identical pass every time.
6. **The Czech is right.** The traps are all in `codex/CZECH-TRAPS.md` —
   dropped subject, gender leaks on past tense and predicate adjectives, gloss
   collisions. This is the one thing no gate can check for you.
   > **Do not trust that file's "extinct — 0 in 946".** That sweep covered the
   > **vocab sentence banks only**; grammar pack `cz` fields had never been
   > swept, and `a1_agreement` had three defects in it. Where it bites: **Use
   > grades a whole English sentence from the Czech alone**, so if the Czech
   > doesn't determine the subject, a correct answer is marked wrong.
   > **Past tense is immune** — Czech marks gender and number on the verb
   > (*šla* = she, *byli* = they). **Present and future 3rd person is exposed** —
   > *bydlí* is he, she *and* they. Check those; skip the rest.
7. **It targets the error above.** Open this file's quoted student sentences
   next to the unit: could a student who did this unit properly still write
   that sentence? If yes, the unit isn't finished.

---

## Notes

- **The flag button is back** (2026-08-11, `03c0137`) — restored behind a
  **hostname gate**: it appears automatically on `localhost:8097` and cannot
  appear on Pages, so there is no unlock state to leave switched on by
  accident. `smoke-flags.js` had survived `7ec4bd1` untouched and
  `setSmokeContext` was left as a no-op stub with all its call sites intact, so
  this was re-wiring, not rebuilding. Flag duds as you go; no scratch list.
- **B2/C1 is untouched by this list.** 38 live units there have never been
  checked by a human, and Jan (C1), Václav (C1) and Homare (B2, FCE in
  November) work at exactly those levels. Separate job, separate decision.
  **Four known grading defects already sit there**, found by the 2026-08-11
  sweep and deliberately not fixed: dropped-subject Czech in `b2_modal_perfect`
  (×2 — *musí*/*nemusí* are 3sg **and** 3pl), `b2_future_forms`
  (*V září nastupuje…*) and `c1_article_nuance` (*V centru města vede firmu*).
  Also worth knowing: `b2_clear_claims` puts a task question in the `cz` slot
  by design, which makes its Use stage unanswerable — not a defect of the same
  kind, but it will look like one.
- **Two units off this list were fixed in passing** on 2026-08-11 for the same
  Czech defect: `a1_present_simple` and `a2_will_going_to`.
- **The remaining sweeps** (Martina, Patrik, Jan) will likely add evidence to
  these same units rather than new ones — the Czech-L1 error profile is
  consistent. If a new cluster appears, add it here.
