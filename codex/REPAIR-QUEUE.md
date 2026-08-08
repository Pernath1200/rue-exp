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

- [ ] **Re-lexify repairs structurally erode Oxford coverage (found cloud run
  36, 2026-08-08).** A `fix(unit): re-lexify … onto taught vocabulary` repair
  must replace an *untaught* word with a *taught* one — so it selects against
  exactly the words the B1 Oxford gap is asking for. Measured across **49**
  re-lexify commits: **268** Oxford A1–B1 words removed, **20 still absent
  from the course today** (A1 `ball` `born` `carry` `club` `die` `else`
  `everyone` `happen` `nobody` `practise` `somebody` · A2 `smoke` · B1
  `apologize` `continuous` `fence` `hurry` `mix` `pan` `plot` `pot`). `club`
  was traded away twice. Every individual repair is correct; the aggregate is
  the problem. **Blocked on James** (fork logged in BUILD-DIGEST run 36):
  should re-lexify prefer an Oxford-listed replacement when more than one
  pool-legal option exists, and are those 20 words B1-pack material or an
  A1/A2 patch? Do not change the repair path before that is answered — it
  runs on `build`, which the B1 lane must not touch.

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

  **Progress · cloud run 38 (2026-08-09, `vocab/b1-build`): applied to 3 new
  B1 banks at authoring time** (`b1_materials` 12, `b1_body_health` 12,
  `b1_law_order` 12 — 36 new prompts). **Zero instances of the target
  defect**, by the run 32-35 authoring method: no 3sg prompt was written
  without an explicit subject in the first place, and no 1sg past tense or
  1sg predicate adjective appears anywhere in the 36. Person is fixed by an
  explicit noun subject (*Moje babička*, *Ten hráč*, *Policie*, *Soudce*,
  *Rodiče*, *Město*), by 1sg/1pl/2sg present morphology (*Mám*,
  *potřebujeme*, *vypadáš*), by an explicit oblique pronoun (*Bolí ho na
  hrudi*, *Bolí mě prst u nohy*), or the prompt is existential
  (*Na podlaze je špendlík*, *Pod zemí je hodně uhlí*). Rate over runs
  29-38: 6 in ~762 prompts (~1 %).

  One note for whoever picks this up next, adjacent to this rule rather than
  part of it: **irregular English plurals are a gate defect the eye does not
  catch.** *The police arrested two young **men*** passed every Czech check
  and failed the pool oracle, because `man` is taught but `men` is not
  derived by `variants()`. The same shape waits in `women`, `children`,
  `feet`, `teeth`. Run the oracle over the English before trusting a bank,
  not only over the Czech.

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
