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

  **Progress · cloud run 28 (2026-08-08): the bounded A1 sweep is done —
  all 16 shipped A1 banks, plus the 3 A2 banks, 0 defects found.** Method:
  the defect needs a Czech prompt that underdetermines the English subject,
  so I selected every sentence whose English subject is a 3rd-person pronoun
  (`He/She/It/They`) and checked whether the Czech carries a matching
  subject word. 9 such sentences exist across all live banks; 5 have no
  explicit Czech subject, and **all 5 are impersonal** — *Prší* /
  *Je pozdě* / *Je půlnoc* / *Je trochu zima* / *V zimě je zima*, where
  English admits only dummy *it* and no he/she reading exists. The 6th
  (*Jsou šťastný pár*) is 3rd-person **plural**, and English 3pl has no
  gender split, so *they* is forced. Every remaining bank sentence fixes its
  person by verb morphology (1st/2nd person: *Mám*, *Jsme*, *Potřebuji*,
  *Máte*), by an explicit noun subject (*Vlak odjíždí*, *Obchod otevírá*,
  *Kočka spí*), or is an imperative/formula. Run 27's three fixes appear to
  have been the whole population. **Left unticked: this is a standing rule,
  so it still applies to every new bank** — the A1/A2 backlog is what is
  clear, not the rule.

  **Progress · cloud run 29 (2026-08-08): applied to 3 new banks at authoring
  time** (`a2_clothes` 12, `a2_nature` 17, `a2_food` 22 — 51 new prompts).
  Every prompt fixes its person by an explicit subject, by verb morphology,
  or is impersonal/existential. Two authoring traps worth naming for future
  runs, both adjacent to this rule: (1) Czech `mít rád` inflects for the
  **speaker's gender**, so any "I like X" prompt leaks *rád/ráda* — I routed
  all of them through an explicit gendered subject (*Můj syn nemá rád
  fazole*) or a person-fixing ending instead; (2) a 3rd-person prompt with a
  dropped subject (*Smaží vejce*) is the exact defect this rule targets and
  was caught pre-commit — it became *Můj otec smaží vejce*.

  **Progress · cloud run 30 (2026-08-08): applied to 3 new banks at authoring
  time** (`a2_shopping` 22, `a2_sports` 22, `a2_media` 24 — 68 new prompts).
  **Two genuine instances of the target defect were caught pre-commit**, both
  in `a2_media`: *Kupuje si každý týden časopis* and *Má krásný úsměv* are
  3sg with the subject dropped, so each reads *he* **or** *she* and would
  have graded a correct answer wrong. They became *Moje matka si každý týden
  kupuje časopis* and *Moje dcera má krásný úsměv*. So the defect is **not**
  extinct — run 28's clean sweep cleared the shipped backlog, but new
  authoring reproduces it at roughly 3 % of prompts.

  **Progress · cloud run 31 (2026-08-08): applied to 3 new banks at authoring
  time** (`a2_feelings` 25, `a2_society` 27, `a2_freetime` 32 — 84 new
  prompts). **One instance of the target defect caught pre-commit**, in
  `a2_freetime`: *Je slavná celebrita* is 3sg with the subject dropped and
  reads *he* or *she*; it became *Anna je slavná celebrita*. Rate is
  consistent with run 30's ~3 %.

  **Progress · cloud run 32 (2026-08-08): applied to 3 new banks at authoring
  time** (`a2_work` 33, `a2_school` 34, `a2_tech` 35 — 102 new prompts).
  **Zero instances of the target defect**, and that is a result of authoring
  method rather than luck: I wrote no 3sg prompt without an explicit subject
  at all, so there was nothing to catch on review. Every prompt fixes its
  person by an explicit noun subject (*Můj šéf*, *Moje sestra*, *Tahle
  továrna*), by 1sg/1pl present morphology (*Mám*, *Potřebuji*, *Chci*,
  *Máme*, *Mluvíme*), or is a subject-predicate identity with a full noun
  phrase. Rate over runs 29-32: 3 defects in ~305 prompts (~1 %), all caught
  pre-commit.

  **Progress · cloud run 33 (2026-08-08): applied to 2 new banks at authoring
  time** (`a2_home` 39, `a2_health` 41 — 80 new prompts). **Zero instances of
  the target defect**, by the same authoring method run 32 used: no 3sg prompt
  was written without an explicit subject in the first place. Every prompt
  fixes its person by an explicit noun subject (*Moje sestra*, *Náš dům*,
  *Výtah*, *Lékař*, *To dítě*), by 1sg/1pl/2pl present morphology (*Potřebuji*,
  *Platím*, *Máme*, *Musíte*), or is impersonal/existential (*Na střeše je
  pták*, *V tomhle pokoji není teplo*). Rate over runs 29-33: 3 defects in
  ~385 prompts, all caught pre-commit.

  **Progress · cloud run 34 (2026-08-08): applied to 3 new banks at authoring
  time** (`a2_adverbs` 55, `a2_misc` 84, `a2_ideas` 89 — 228 new prompts).
  **Two instances of the target defect caught pre-commit**, both in
  `a2_ideas`, and both were 1sg *past* rather than 3sg dropped-subject:
  *Udělal jsem chybu* and *Měli jsme dlouhou diskusi* leak the speaker's
  gender through the participle. Both were recast to the present with a
  non-speaker subject (*To je velká chyba*, *Diskuse byla velmi dlouhá*).
  A third draft, *Jaký má tvar?*, was the classic 3sg dropped subject and
  became *Jaký to má tvar?*. Rate over runs 29-34: 6 in ~613 prompts (~1 %).

  **Two new traps this run, both worth naming:**

  1. **`a2_adverbs` is the first pack where the rule barely bites but a
     *different* grading defect does.** Czech adverbs do not inflect for
     gender, so the whole gender family of traps is absent. What replaces it
     is **Czech-gloss collision**: 5 of the 66 items share a gloss with
     another item in the same pack (certainly/definitely = *rozhodně*,
     especially/particularly = *zejmena*, finally/eventually = *nakonec*,
     almost/nearly, unfortunately/sadly = *bohužel*). Covering both members
     gives one Czech prompt two correct English answers, which grades a right
     answer wrong — the same *class* of defect as the dropped subject, from a
     different cause. Handled by covering one member per pair. `a2_ideas` had
     3 such pairs and `a2_misc` had 1 near-miss (`page` could not use *na
     straně*, because *strana* is the gloss of the pack's own `side`).
     **Generalisation for the two remaining giants: check for within-pack
     gloss collisions before authoring, not after.** `a2_describing` at 314
     adjectives will have many.

  2. **Reflexives leak gender the way past tense does.** `a2_misc` teaches
     six reflexives; *himself/herself/itself/themselves* are all safe because
     a 3rd-person subject fixes *sám/sama/samy*, but **`myself` and
     `ourselves` cannot be written safely** — *Udělal jsem to sám* leaks
     masculine exactly like a 1sg past. Those two are the only items left
     uncovered in that pack for a gender reason.

  **Progress · cloud run 35 (2026-08-08): applied to the last 2 banks at
  authoring time** (`a2_verbs` 28, `a2_describing` 61 — 89 new prompts), and
  **the A2 leaf backlog is now closed at 22/22.** Zero instances of the
  target defect, by the run 32-34 method: no 3sg prompt was written without
  an explicit subject at all. Rate over runs 29-35: 6 in ~702 prompts (~1 %).

  Two notes for whoever picks this up next:

  1. **`a2_describing` confirms run 34's prediction and then some.** Czech
     predicate adjectives inflect for gender, so on a pack that is 314
     adjectives the rule is not occasional — it is every sentence. The whole
     bank is routed through 3rd-person or inanimate subjects (*Ta láhev*,
     *Ten stůl*, *Moje babička*); **not one prompt is 1sg with a predicate
     adjective**, because there is no gender-safe way to write one. The two
     1sg-flavoured sentences that survive put the adjective on a noun the
     student does not inhabit (*Moje čeština je strašná*), so the agreement
     is with *čeština*, not with the speaker — the same escape `a2_health`
     found for the past tense.
  2. **Gloss collision is the binding constraint on that pack**, exactly as
     run 34 warned: 11 item pairs share an *exact* Czech gloss
     (rich/wealthy, entire/whole, electric/electrical, certain/sure,
     ill/sick, enormous/huge, likely/probable, fast/quick, indoor/inner,
     high/tall, broad/wide), and many more collide loosely
     (clever/smart, stupid/silly, quiet/silent, simple/easy, shut/closed,
     correct/right, special/strange). **A new handling was used here and is
     worth adopting generally: where the Czech genuinely admits the sibling,
     put the sibling in `accepts[]`** rather than only avoiding the pair.
     The audit reads `sentences[].en` and not `accepts[]`, so an accepts
     alternate costs nothing at the gate and stops a right answer grading
     wrong. Run 34 could only drop such items; this is strictly better.
     One pair could not be rescued that way — *zvláštní* is the gloss of
     both `special` and `strange`, and accepting both changes the meaning
     of the sentence, so `special` was dropped and `unique` covered instead.

  **Mechanical re-check of every shipped bank, run 35.** All **38** live
  banks (16 A1 + 22 A2, 946 sentences) were re-verified in one pass, not
  trusted from digests: every `lemmas` entry names a real item in its own
  pack, every sentence carries `cz` and `accepts`, no pack repeats an
  English sentence, and **every English sentence is pool-legal at its own
  node** under audit.py's own `legal` set. **0 problems across 38 banks.**

  A note on trap three (1sg past tense) from `a2_health`: the past tense is
  hard to avoid entirely in a health pack, because accidents and injuries are
  past events. The escape used was to **put the past on an explicit
  non-speaker subject** — *Byla tady nehoda* is past tense but its subject is
  *nehoda*, so the gendered participle agrees with the accident, not with the
  student. That generalises: past tense is only a leak when the subject is
  1st person.

  The gender traps below were the live constraint again, not the subject
  rule. `a2_school` hit trap one squarely: *biology* and *history* both
  invite *I like biology*, which leaks *rád/ráda*. Both were recast — one
  onto a 3rd-person subject (*Moje sestra studuje biologii*), one onto an
  impersonal predicate (*Dějepis je velmi zajímavý*). Worth noting for the
  remaining packs that **the school/subject domain invites "I like X" more
  than any domain so far**, so `mít rád` pressure is highest there.

  A fourth trap, and `a2_feelings` is where it is worst: **Czech predicate
  adjectives inflect for gender** (*naštvaný/naštvaná*,
  *překvapený/překvapená*), so a 1sg prompt like *Jsem naštvaný* leaks the
  speaker's gender exactly the way run 30's 1sg past tense does. This is
  structural for any feelings/describing pack, since almost every item is an
  adjective. Rule of thumb applied: **route every adjective prompt through an
  explicit 3rd-person subject** (*Moje matka je naštvaná*) rather than 1sg.
  Where a 1sg sentence was genuinely wanted, pick a gender-neutral predicate
  — *Jsem v rozpacích* works because it is a prepositional phrase, and soft
  adjectives (*nervózní*) are gender-neutral too. **`a2_describing` (314
  items) will hit this on nearly every sentence** — worth knowing before that
  pack is attempted.

  A third trap to add to run 29's two, and it is the one that bit most often:
  **Czech past-tense verbs inflect for the speaker's gender**, so any 1sg
  past prompt leaks it (*Četl jsem zajímavý článek* vs *Četla*). This is the
  same class as `mít rád` but much easier to write by accident, because the
  English (*I read an interesting article*) looks perfectly neutral. Rule of
  thumb applied this run: **no 1sg past tense in a Czech prompt** — recast to
  the present (*Tenhle článek je velmi zajímavý*) or move the past onto an
  explicit 3rd-person subject. Note 1pl past has the same problem
  (*Dívali* vs *Dívaly*), so it is not a singular-only trap.

  **Progress · cloud run 36 (2026-08-09, wind-down close-out): the rule and
  its whole trap family were swept mechanically across all 38 shipped banks
  (946 sentences), and 2 defects were found and fixed — both in *A1* banks
  that predate the traps' discovery.** Run 28's bounded A1 sweep covered only
  the dropped-subject defect; the gender-leak traps (`mít rád`, 1sg past
  participle, 1sg predicate adjective) were all discovered later, in runs
  29-35, and **no run ever swept the already-shipped A1 banks for them**. That
  gap is now closed.

  Method — four mechanical scans over every `sentences[]` prompt in the repo,
  not a re-read: (A) English subject is `He/She/It/They`, checking whether the
  Czech carries a matching explicit subject; (B) Czech 1sg/1pl past participle
  (`jsem`/`jsme` + `-l/-la/-li/-ly`); (C) `mám/máme + rád/ráda`; (D) `jsem` +
  a gendered predicate adjective (`-ý/-á`).

  - **(A) 16 hits, 0 defects.** 11 are impersonal (*Prší*, *Je pozdě*, *Je
    půlnoc*, *V zimě je zima*, *Je trochu zima*, *Je skoro pět hodin*,
    *Pravděpodobně bude zítra pršet*, *V poušti nikdy neprší*, *Dnes možná
    bude pršet*) or carry the dummy *to* (*Je to každodenní problém*, *Je to
    pravidelná schůzka*, *Je to tvoje volba*, *Byl to obyčejný den*, *Byl to
    takový dobrý den*), where English admits only *it*. One is 3rd-person
    **plural** (*Jsou šťastný pár*), and English 3pl has no gender split. One
    carries an explicit *On* (*On je majitel obchodu*). **The dropped-subject
    grading defect is extinct across the shipped course** — 0 in 946.
  - **(B) 0 hits.** No 1sg/1pl past participle survives in any bank.
  - **(C) 1 hit, 1 defect — `leaf_freetime_a1` #1**, *Mám rád fotbal*.
  - **(D) 1 hit, 1 defect — `leaf_health_a1` #5**, *Jsem nemocný*.

  Both fixed in **a5a8152** by the pack's own established pattern — recast
  onto an explicit 3rd-person subject (*Můj otec má rád fotbal* / *Můj syn je
  nemocný*), replacements checked pool-legal against `audit.py`'s own legal
  set. Audit unmoved at 126.

  **Worth stating plainly for the handoff: (C) and (D) are not grading
  defects.** *Mám rád fotbal* still forces the English answer *I like
  football* whichever gender the student is — unlike the dropped-subject
  defect, nothing grades wrong. What they are is a Czech **support prompt that
  presumes a male student**. Fixed because the cost was two sentences and this
  is the last unattended run; the distinction matters if anyone later finds a
  third instance and has to weigh it.

  **Left unticked deliberately — this is a standing rule, not a task.** What
  is now clear is the shipped population (A1+A2, 38 banks); the rule still
  binds any future bank, and B1's 6 leaf packs have no banks at all yet.

- [ ] **Explanation-language scaling (James, 2026-08-08).** Explanatory prose
  — intro `body`/`note`/`title_cz` text, grammar `explanation`/
  `explanation_cz`, hints — must match the level it explains, not stay at A1
  simplicity throughout the course. **A1/A2: simple, plain-English
  metalanguage** (short sentences, controlled vocabulary). **B1 and up:
  natural, less simplified English** — the explanation's own register may
  rise with the student's. This does not relax the target CONTENT's
  difficulty at any level — only the scaffolding prose around it. Also see
  AGENTS.md.

- [ ] **Sequencing repair (A1/A2 scope) — exhausted, 2026-08-08 (run 35).**
  `audit/SEQUENCING-REPORT.md` now lists exactly **one** A1/A2 unit:
  `a1_articles` / `hour`. That one is genuinely essential — the item teaches
  *an hour* (silent h), so removing `hour` deletes the teaching point — and
  it is already logged as a permanent fork awaiting James. **There is no
  A1/A2 sequencing work left to pick up.** The remaining 18 units are all
  B1/B2 and were out of the wind-down's scope.

  Worth knowing before anyone attacks the B1/B2 remainder: **a visible slice
  of the 126 is tokenizer artifact, not a content defect.** `wi`+`fi` (three
  units) is *Wi-Fi* split on the hyphen; `ond`+`ej` (`b1_reported_speech`)
  is *Ondřej* split on its diacritics; `b` (`b2_present_perfect_continuous`)
  is a fragment. Those are ~7 of the 126 "unknown types" and no rewrite of
  the content will clear them — they need `tokens_of()` to handle hyphens
  and non-ASCII letters. That is gate tooling, so it is James's call, not
  the cloud lane's.

---

## Smoke 2026-08-11 (James, interactive)

- [ ] **DUD — `trunk_glue_pronouns_a1` (`a1_core_frames_glue_pronouns`): the
  Match board cannot test what the pack teaches.** James, smoking it: "it's
  supposed to be about pronouns, but the matching exercise tests other
  things."

  Every item is a full sentence, so Match is decided by the most salient
  CONTENT word — *lampa/okno*, *kniha/stůl*, *láska* — and the pronoun is
  never the feature that distinguishes one card from another. A student can
  score 12/12 without reading *me*, *him* or *them* once.

  On top of that, **3 of the 12 items contain no pronoun at all**: *It is
  about love*, *The book is under the table*, *The lamp is by the window*
  are preposition items. The pack is a grab-bag — object pronouns +
  possessives + demonstratives + prepositions of place — which is also why
  its intro title had to be vague enough to cover everything ("The small
  words that hold a sentence together", rewritten this session to name the
  real categories).

  **This generalises — do not treat it as one bad pack.** Any `frames` pack
  whose target is a FUNCTION word has this defect by construction: sentence
  pairs are matched on content, so the function word is invisible to the
  exercise. Check every glue trunk (`glue_modals`, `glue_linkers`,
  `core_frames_*`) for the same thing before authoring their intros.

  **JAMES RULED 2026-08-11: RE-SCOPE THE PACKS (option a).** Make the function
  word the distinguishing feature; keep the five-stage ladder. Audit all the
  glue trunks for the same defect first, then apply once across the family —
  do not fix pack by pack. Still unticked: not started.

  The options were
  (a) re-scope the pack so the pronoun IS the distinguishing feature — move
  the 3 preposition items out and make the sentence pairs minimal
  (*I see him.* / *I see her.* / *I see them.*), which makes Match test the
  pronoun by elimination; or (b) drop Match for glue trunks and start at
  Quiz, where the gap sits on the target word. (a) is more work but keeps
  the five-stage ladder consistent. Note the overlap with `a1_object_pronouns`
  (A1 step 22) and `a1_possessives` (A1 step 20), both on ESSENTIAL-UNITS —
  decide what belongs in the trunk vs the leaf before rewriting either.

---

## P1 — the blank sits on the half the student already gets right

Found 2026-08-19 reading all 498 items behind the twelve links in Patrik's
error summary. **Three of the four units carrying his top errors blanked the
easy half**, so he could score 100% without ever producing the form the unit
exists to teach. Fixed in `a409e87` for his three; the audit below found the
same fault in three more.

This is the same insight as the 2026-08-11 function-word ruling above, one
level up: there the *exercise* couldn't see the target, here the *blank* isn't
on it. Check both when authoring.

**Test to apply:** for any pack whose point is a verb form, ask whether the
blank ever falls on the lexical verb. If 100% of blanks are the auxiliary or
modal, the pack tests nothing the student gets wrong.

- [x] **`b1_passives` — 48 of 48 blanks on the auxiliary `be`.** — **FIXED 9e0867b (22 of 48 moved onto the participle; explanations 1→9).** `English ____
  spoken here` → *is*. The past participle is the hard part for a Czech
  speaker (*was stole* / *was stolen*), and it is never produced once in the
  bank. Also the worst explanation bank in the corpus: **1 explanation for
  48 items**.
- [x] **`a2_modals_must_should` — 48 of 48 blanks on the modal.** — **FIXED b524cc2 (18 of 48 moved onto the bare verb; explanations 4→8).** `I ____ go
  now` → *must*. Never the bare verb after it, so *must to go* — the exact
  error class as Patrik's *what can we to do* — is untestable. `a1_can` had
  the identical fault and was fixed 2026-08-19 (9 of 24 blanks moved).
- [x] **`b1_used_to` — 48 of 48 blanks on `used to`.** — **FIXED b524cc2 (14 base-verb + 4 use/used blanks; explanations 2→7).** `I ____ live in Brno`
  → *used to*. Never the base verb, so *used to went* is untestable.
  2 explanations for 48 items.

Checked and **cleared** — concentrated for a good reason, the blank is on the
teaching point: `a1_some_any` · `a1_articles` · `a1_be_have` · `a1_there_is` ·
`a1_questions_negatives` · `a1_to_for_with` · `a1_and_but_because` ·
`a1_frequency` · `a2_will_going_to` · `b2_wish_if_only` ·
`b1_modals_speculation`.

Conditional family checked and **already balanced** — blank falls inside the
if-clause on `b2_second_conditional` 53% · `b2_third_conditional` 44% ·
`b2_mixed_conditionals` 25%. `a2_first_conditional` was the outlier at 0% and
is now 23 of 54.

### Explanation poverty (same session)

The explanation is what the student reads when they get it wrong. Banks of
20+ items with the fewest distinct explanations:

- [ ] `a2_adverbs_order` — 50 items, **1** explanation
- [ ] `b1_it_subject` — 48 items, **1**
- [x] `b1_passives` — 48 items, **1** → **9, 9e0867b**
- [ ] `b2_second_conditional` — 72 items, 3
- [ ] `b2_third_conditional` — 72 items, 3
- [ ] `b1_present_perfect_vs_past` — 64 items, 3

Fixed this session: `b1_reported_speech` 1→5 (54 items) · `a2_comparatives`
1→4 (52) · `b1_verb_patterns_advanced` 2→9 (56). The method that worked: group
the bank into families (say/tell, no-shift modals, reported questions, past
perfect) and write one accurate line per family, not one per item.

---

## SMOKE PASS — a2_first_conditional and a1_can · 2026-08-19

The two units whose blanks were rewritten. **23 of 54** blanks in
`a2_first_conditional` and **9 of 24** in `a1_can` are new shapes that have
never been walked. `a2_first_conditional` is the first link in Patrik's PDF,
so it is the one he opens first.

Run `py -m http.server 8097`, hard-refresh, then walk each unit end to end.

### a2_first_conditional — `#a2_first_conditional`

- [ ] **Deep link cold.** Open the hash in a fresh tab with no progress. Unit
  opens on its intro, not the map.
- [ ] **Intro** — 6 cards. Cards 1 and 5 promise *when / until / as soon as*;
  the bank now delivers. Check the `points[]` render.
- [ ] **New shape: if-clause blank.** `If she ____, I will come. (call)` →
  *calls*. The lemma hint in brackets is the convention borrowed from
  verb_patterns — check it reads clearly at A2 and isn't mistaken for part of
  the sentence.
- [ ] **Third-person -s.** `When she ____, we will start. (arrive)` →
  *arrives*, and `When the film ____ (finish)` → *finishes*. Typing *arrive*
  must be marked wrong — that is the point of the item.
- [ ] **Negative in the if-clause.** `If it ____, we will go out. (not rain)`
  → *doesn't rain*. Both *doesn't rain* and *does not rain* must pass.
- [ ] **The six new time-word items** — as soon as ×2, until ×2, after ×1,
  and `When we ____ live, I will send you the link. (be)`, which is his own
  sentence from the PDF.
- [ ] **Explanation on a wrong answer** — if-clause items should say "never
  will", time-clause items should name *when, until, as soon as, after*. Six
  distinct explanations now; check you never see the wrong one.
- [ ] **Match and Quiz** still work — this pack runs `match+quiz`, and the
  quiz distractors are auto-generated from sibling answers, which now include
  present-tense verbs as well as *will*. Watch for a distractor that is
  accidentally also correct.
- [ ] **Type and Use** on a rewritten item — the full sentence is unchanged,
  so `I'll` and `I will` should both pass.

### a1_can — `#a1_can`

- [ ] **Deep link cold**, as above.
- [ ] **New shape: base verb after can.** `I can ____. (swim)` → *swim*.
  Typing *to swim* must fail — that is Patrik's *what can we to do*.
- [ ] **Negative frame.** `I can't ____. (cook)` → *cook*.
- [ ] **Question frame.** `Can you ____? (swim)` and `Can I ____ the window?
  (open)` — the blank is now at the end of a question; check the gap renders
  before the `?` and not after.
- [ ] **Explanation** — the 9 rewritten items should read "After can, the base
  verb — no to and no -s", not the old can/can't line.
- [ ] **Left deliberately lenient:** *I can not swim* is still accepted on the
  five negative items. Accepts are invisible to the student, and marking a
  near-correct answer wrong is the demoralising failure mode (Martina/Tomáš
  ruling, 2026-08-18). Flag if you disagree.

### Both

- [ ] **Flag button** reachable on every screen (`rue_speedrun_flag_button`).
- [ ] **Progress** — finishing a unit earns fruit and it survives a refresh.
- [ ] **Way home** — RUE top left returns to the map from mid-drill.

---

## SMOKE PASS — the three monotonous-blank packs · 2026-08-20

All three had 100% of blanks on the auxiliary or modal, so the form the rule
actually governs was never produced. 58 blanks were moved onto that form and
authored `quiz_options` were added so the choice tests the form, not the verb.
Gates are green but **no one has walked a single one of these in a browser.**

Run `py -m http.server 8097`, hard-refresh, flag anything wrong with the flag
button rather than stopping to write it down.

### b1_passives — `#b1_passives` · 22 of 48 blanks new

- [ ] **Deep link cold.** Fresh tab, no progress — opens on the intro.
- [ ] **Participle blank.** `My bike was ____ yesterday. (steal)` → *stolen*.
  Typing *stole* must fail — that is the whole point of the rewrite.
- [ ] **Same-verb options.** The quiz choices should be *stolen / stole /
  steal / stealing*, never a mix of be-forms. Check none of the four reads as
  also-correct in that frame.
- [ ] **-ing withheld.** Seven frames deliberately have no *-ing* option
  because it is grammatical there (*were breaking*, *is still growing*,
  *will be sending*). Flag if you see one that slipped through.
- [ ] **be-form blanks still work** — 26 of them, unchanged. `The emails ____
  sent every morning` → *are*.
- [ ] **Explanations** — 9 now, by family. On a wrong participle you should
  read the third-form line, on a wrong be-form the agreement line. Check you
  never get the wrong one.
- [ ] **Three fallback items** (`will be finished`, `must be completed`,
  `will be sent`) draw distractors from siblings, so their options are
  be-forms. That is intentional — the discrimination is "a participle goes
  here". Flag if it reads as too easy.

### a2_modals_must_should — `#a2_modals_must_should` · 18 of 48 blanks new

- [ ] **Deep link cold.**
- [ ] **Bare verb after the modal.** `I must ____ now. (go)` → *go*, options
  *go / to go / goes*. This is Patrik's *what can we to do* made testable.
- [ ] **Third person.** `He should ____ his mum. (call)` → *call*, not *calls*.
- [ ] **Question frame.** `Must I ____ now? (pay)` — check the gap renders
  before the `?`.
- [ ] **Negative frame.** `You mustn't ____ here. (park)`.
- [ ] **mustn't vs don't have to** — the explanation now says mustn't is a
  ban. Check it reads right at A2.
- [ ] **Match still works** — this pack runs match+quiz.

### b1_used_to — `#b1_used_to` · 18 of 48 blanks new

- [ ] **Deep link cold.**
- [ ] **Base verb.** `I used to ____ in Brno. (live)` → *live*, options
  *live / lived / to live*. *used to went* is now testable.
- [ ] **be.** `I used to ____ shy. (be)` → *be*, options *be / was / been*.
- [ ] **use vs used — the new half.** `Did you ____ to play tennis?` → *use*,
  options *use / used / uses*. **These four items carry NO lemma hint on
  purpose** — `(use)` would have been the answer. Check the frame still reads
  clearly without it; that is the one judgement call in this batch.
- [ ] **Negative.** `He did not use to ____ in Prague. (work)` → *work*.
- [ ] **Explanations** — 7 now. Wrong *used to went* should get the base-verb
  line; wrong *Did you used to* should get the "did carries the past" line.

### Noted, not fixed — `b1_used_to` content is thin

- [ ] The bank is eight sentences rewritten four ways (I / She / Did you /
  He did not): *live in Brno · play tennis · go there every summer · work in
  Prague · be shy · call every day · cook · watch a lot of TV*. 48 items,
  ≈12 distinct situations. The blanks are now varied but the **content**
  repeats. Not touched — it is authoring, not repair. Your call whether it
  matters in a lesson.

### All three

- [ ] **Flag button** reachable on every screen.
- [ ] **Progress** survives a refresh.
- [ ] **Way home** — RUE top left returns to the map mid-drill.

### Smoke flags — 2026-08-25 (James, testing on the GitHub Pages build)

- [ ] **`a1_agreement` — quiz distractors are different verbs, not verb forms.**
  Authored `quiz_options` mix lemmas: *You ____ English and Czech* offers
  speak / speaks / **teach / teaches**. James's design rule: distractors must
  be typical mistakes, i.e. forms of the TARGET verb — never other verbs.
  **FIXED in working tree 2026-08-25** (same session): all 28 items rewritten
  to [answer, agreement twin, -ing form, past form]. Tick with hash at the
  post-session commit.
- [x] **Same check on `a2_agreement`** (27 items) — **checked 2026-08-25,
  clean, no change**: every option set is same-slot forms (do/does/is/are in
  question items is the typical-mistake set for that slot).

### New-unit ideas — authoring, NOT repair. Do not process in any lane; needs a James build session.

- [ ] **nature / countryside (příroda)** — flagged 2026-08-25 (James, reviewing
  Martina's practice page). *příroda* fans out: **nature** (no article) ·
  **the countryside** (rural area you go to; *v přírodě* mostly lands here or
  as **outdoors**) · **scenery / landscape** (what you look at) · **wildlife**
  (the animals). Evidence: Martina *near of nature*, "the nature"-type slips.
  Frames: *we went to the nature* → out into the countryside · *in nature* →
  outdoors · *beautiful nature* → beautiful scenery. Vocab side, Czech-
  interference (V_IFR) family, sits beside `b2_false_friends`. Codex seat
  needed before content.
- [ ] **come / go · bring / take (deixis)** — flagged 2026-08-25, same review.
  *vrátit se* → *come back* overreach (Martina: *come back to Santorini*,
  written from Prague); Jan adjacent (*attend to Prague*). Pairs: come/go,
  bring/take, anchored to where the speaker is. No unit covers deixis today.
  Codex seat needed before content.
