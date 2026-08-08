# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-08 · cloud run 29 (RUE build, claude-opus-5)

### Headline: **three A2 Use banks** — `a2_clothes`, `a2_nature`, `a2_food` — 51 sentences covering **every item in all three packs** (12/12, 18/18, 22/22), plus a sequencing repair that took the audit **129 → 127**. The C1 gate stayed shut: I counted the A2 backlog myself before step 5 and it is non-empty, so **no new unit was started**. All three gates green at start and end; smoke passed.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `bdc11c4` | **`a2_clothes`** `sentences[]` — 12 sentences, all 12 items |
| 2 | `600efb9` | **`a2_nature`** `sentences[]` — 17 sentences, all 18 items |
| 3 | `d90335b` | **`a2_food`** `sentences[]` — 22 sentences, all 22 items |
| 4 | `2eb9e3a` | sequencing repair — 2 A1 trunk items, audit 129 → **127** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 86 live grammar · 0 errors · 0 warnings | **86 · 0 errors · 0 warnings** |
| `audit` | 129 · 22 units · baseline 129 | **127 · 20 units · baseline tightened 129 → 127** |
| `scripts/smoke.py` | — | **SMOKE PASSED** |

My checkout started stale (it was sitting on `b6063a2`, the two-lane commit, with an `AGENTS.md` predating your vocab-intro, sentence-bank and explanation-scaling sections). I re-fetched to `ef94c86` and **re-read AGENTS.md, REPAIR-QUEUE.md and CZECH-REVIEW.md from the fresh tree** rather than working from the copies I had loaded. Flagging it because a run that had not noticed would have authored against a contract three sections out of date. Nothing landed on `build` while I worked, so no rebase was needed.

### Step 5 stayed gated — the count, checked directly

Run 28's digest said 19 A2 leaves were open. I did not take that number on faith: I walked `data/nodes-vocab.json`, opened every live pack, and tested `sentences[]` presence. **22 A2 leaves live, 3 with banks (`a2_family`, `a2_routine`, `a2_travel`) → 19 open at run start, 16 open now.** Backlog non-empty, so `c1_error_patterns` and everything else in step 5 was left untouched. Full picture for planning: A1 16/16 leaves done, A2 6/22, B1 0/6, and the 20 A1/A2 trunks + 3 A2 trunks have no banks at all.

### The three banks

| Pack | Items | Sentences | Coverage |
|---|---|---|---|
| `a2_clothes` | 12 | 12 | 12/12 |
| `a2_nature` | 18 | 17 | 18/18 (one sentence carries storm + disaster) |
| `a2_food` | 22 | 22 | 22/22 |

**Method, because "pool-legal" is easy to assert and easy to get wrong.** I regenerated the pool per node with `--before` immediately before authoring, then checked every draft with a script that imports `codex/audit.py` and reuses **its own** `tokens_of` / `variants` / `GLUE` / `targets_of` — so the answer comes from the gate's logic, not from my reading of it. Two drafted sentences in `a2_food` used untaught words (`pan`, `salty`); both were **re-lexified onto taught vocabulary rather than dropped** — `oil` now rides on `sauce` (*This sauce has too much oil.*), `nut` on a frequency frame (*I eat nuts every day.*). For `a2_nature` I also probed the pool directly for the words most likely to be passing on a lucky stem (`protect`, `village`, `bright`, `favourite`, `wall`, `tonight`) and confirmed each is present as a real base form. Final state: **0 out-of-pool tokens across all 51 sentences**, audit unmoved by the banks.

### Repair queue

**No unticked one-time items** — every one-time entry is ticked; the two open entries are the standing rules, which is what I worked.

- **Dropped-subject rule** — applied at authoring time to all 51 new prompts; progress logged in the queue file. Two traps worth passing on, both adjacent to the rule: Czech **`mít rád` inflects for the speaker's gender**, so every "I like X" prompt leaks *rád/ráda* — I routed all of them through an explicit gendered subject (*Můj syn nemá rád fazole*) or a person-fixing ending. And one genuine instance of the target defect was caught pre-commit: *Smaží vejce* (3sg, subject dropped, reads he **or** she) became *Můj otec smaží vejce*.
- **Explanation-language scaling** — **no-op this run, and I want to be explicit rather than silently tick it.** Sentence banks contain no explanatory prose at all (`en`/`cz`/`lemmas`/`accepts` only), and the sequencing repair added no prose either. Nothing this run had scaffolding text to scale.

### Sequencing repair — one judgment call, and it is the thing to read

`a1_word_order` is the worst A1 unit in the report (new×3), and **I deliberately left it alone.** Run 2 logged `new` as a fork; I re-derived that call instead of inheriting it, and it holds: the pool before `a1_word_order` is **31 words from 3 units**, and the only legal adjective in it is `tired`, which cannot work attributively for an adj+noun drill. The violation is irreducible without moving the unit or teaching an adjective earlier. **Suggest marking it permanently accepted in the report**, so future runs stop re-picking it as "the worst A1 unit" and re-doing this analysis.

That left three A1 units at one violation each. The shape of all three is the same, and it is an **audit blind spot, not a content defect**:

> `targets_of()` credits a vocab item's `en` only when the item is **not** gapped. So for a gapped item, every word except the gap answer is invisible to the pool — even though the student meets it in that very item with a Czech gloss beside it.

*Nice to meet you.* (gap on `meet`) therefore reads as never teaching `nice`; *I drink water.* (gap on `drink`) as never teaching `water`. Both words are taught in place. I declared them with the **existing item-level `lemma` field**, which `make_pool` and `audit` both read as taught, and for which there is precedent in three shipped grammar packs (`b1_reported_speech`, `b1_present_perfect_vs_past`, `b2_present_perfect_continuous`). Before using it I verified two things mechanically: **`js/` never reads item-level `lemma`** (zero hits — the ladder cannot change), and `verify_pack` does not validate it (its `lemma` logic is about `sentences[].lemmas`, a different field). Audit 129 → 127, no teaching point removed, no sentence rewritten.

**Fork for James — this is the one I actually want a ruling on.** Is `lemma` an acceptable general tool for this class of violation? It is honest by my reading (the word *is* taught, the gate just cannot see it), and if you agree it clears several remaining single-word violations cheaply. If you read it as papering over a signal you want kept loud, **reverting is a two-line change** and I would want to know before applying it more widely.

**One process note against myself.** I first fixed all three units (129 → 126) before rereading that step 4 caps me at **2 units per run**. I reverted `a1_articles` (`hour`, the silent-h example — same shape, same fix) to respect the cap, restored the baseline file the auto-tighten had already moved to 126, and regenerated it cleanly at 127. **`a1_articles` is the obvious first pick for next run's step 4** if you bless the mechanism above.

### Czech I am flagging for the review routine

None of these are errors I believe I have made — they are the places where a second opinion is worth most.

- `a2_clothes` — *Tyhle šperky jsou velmi drahé.* glosses uncountable English `jewellery` with a Czech plural, the **same countability mismatch** run 28 flagged for `luggage`/*zavazadla*. Deliberate and I think right, but it is now a pattern rather than a one-off, so it may deserve a house rule.
- `a2_clothes` — *Dnes vypadáš elegantně.* for *You look smart today.* The pack glosses `smart` as "elegantní / chytrý"; I took the clothing sense, which is the one the unit is about. Adverbial *elegantně* after *vypadat* is the correct construction, but the tile's double gloss means a student could reasonably read `smart` as *chytrý* here.
- `a2_clothes` — *Tyhle kalhoty jsou moc velké.* The pack's own intro warns that BrE `pants` = underwear; my prompt uses the American sense the pack teaches, and `accepts` carries *These trousers are too big* so a BrE answer grades correct.
- `a2_nature` — *Dům je ze dřeva.* The pack glosses `wood` as "les / dřevo"; the bank exercises **only the dřevo sense**. Chosen to disambiguate, but the *les* sense now gets no production practice.
- `a2_nature` — *Měsíc je dnes v noci jasný.* is grammatical, but *Měsíc dnes v noci jasně svítí* may be the more natural Czech. Lowest-confidence sentence in the three banks.
- `a2_food` — *Musíš vodu uvařit.* for *You must boil the water.* — perfective *uvařit* over imperfective *vařit*; I believe perfective is right for the one-off instruction, but it is a genuine aspect choice.
- `a2_food` — *Jím chleba s džemem.* uses the colloquial accusative *chleba* rather than standard *chléb*. Natural in speech; a register choice, not an error.
- `a2_food` — *Tahle polévka má výraznou chuť.* — *výrazná chuť* rather than a literal *silná chuť*, which would be calqued.
- `a2_food` — *Moje sestra je vegetariánka.* takes the feminine form to agree with *sestra*, matching the no-speaker-gender rule by putting the gender on an explicit subject.

### Smoke-check list

- **`a2_food` Use stage** — the biggest of the three (22 sentences) and the first A2 bank to cover a pack's items exhaustively. Worth confirming the stage does not feel long next to a 12-sentence bank.
- **`a2_clothes` Use stage** — check the *pants*/*trousers* accept actually passes, since it is the one place a BrE answer differs from the model.
- **`trunk_social_a1` and `trunk_verbs_daily_a1`** — the two `lemma`-declared items. Nothing should have changed on screen; that is the claim to falsify.

---

## 2026-08-08 · cloud run 28 (RUE build, claude-opus-5)

### Headline: **the C1 frontier moved** — `c1_reporting_complementation` built from thin shell to house size (48 items, 6 cards, path 14), the first two A2 sentence banks after `a2_routine` (`a2_family`, `a2_travel`), and **the first two trunk intros under your new rule**, one of each kind. Your `6250d7f` landed mid-run; I rebased onto it, re-read the changed contract, and re-ran everything under the new tokenizer. Audit **129, unchanged** — all six commits add zero violations.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `3e86a99` | **`a2_family`** `sentences[]` — 14 sentences, 14 lemmas |
| 2 | `529ae1c` | **`a2_travel`** `sentences[]` — 14 sentences, 17 items covered |
| 3 | `6e00891` | **`c1_reporting_complementation`** — thin shell → live, 48 items, 6 cards |
| 4 | `48da782` | repair queue — dropped-subject sweep result (16 A1 + 3 A2 banks, 0 defects) |
| 5 | `05f1567` | **`trunk_verbs_action_a1`** intro — concrete trunk, 12 tiles |
| 6 | `9a54c80` | **`trunk_glue_pronouns_a1`** intro — glue trunk, text-only page 1 |

### Gates

| | start of run | after rebase onto `6250d7f` |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar · 0 errors · 1 warning | **86 live grammar · 0 errors · 0 warnings** |
| `audit` | 143 · 32 units | **129 · 22 units · baseline 129, unchanged** |
| `scripts/smoke.py` | — | **SMOKE PASSED** |

All three were green at the start, so step 0 did not consume the run. The audit's drop from 143 to 129 is **yours, not mine** — your tokenizer fix absorbed the contraction and parenthesised-disambiguator artefacts. My six commits moved it by zero.

### The rebase, and what it changed about this run

My push was rejected mid-run: `6250d7f` had landed. I fetched, rebased my three commits onto it (clean, no conflicts), **re-read `AGENTS.md` and `REPAIR-QUEUE.md` rather than assuming my copies were current**, and re-ran all gates under the new `audit.py`. Two of your four decisions changed what I did next:

- **The trunk-intro answer reopened step 2.** Run 27 closed the intro backlog at "38 of 38 leaves" and left the 20 A1/A2 trunks as an open question. Your rule makes them in scope, judged per pack — so the backlog is **27 units, not 0**, and I spent the rest of the run there rather than on a second C1 unit.
- **Explanation-language scaling** — the C1 pack was already written in natural, unsimplified English, so it complies as authored. Nothing to redo.

### Repair queue — the dropped-subject sweep is done, and it found nothing

**All 16 shipped A1 banks plus the 3 A2 banks: 0 defects.** The method matters more than the result, so it is logged in the queue file too. The defect needs a Czech prompt that *underdetermines the English subject*, so I selected every bank sentence whose English subject is a 3rd-person pronoun and asked whether the Czech carries a matching subject. Nine such sentences exist; five have no explicit Czech subject, and **all five are impersonal** — *Prší*, *Je pozdě*, *Je půlnoc*, *Je trochu zima*, *V zimě je zima* — where English admits only dummy *it* and no he/she reading is available. The sixth, *Jsou šťastný pár*, is 3rd-person **plural**, and English 3pl has no gender split. Everything else fixes its person by verb morphology (*Mám*, *Jsme*, *Potřebuji*, *Máte*), by an explicit noun subject (*Vlak odjíždí*, *Obchod otevírá*), or is an imperative or a formula.

**Run 27's three fixes appear to have been the entire population.** I left the box unticked: the bounded A1/A2 backlog is clear, but the rule still governs every new bank, and my own two A2 banks were written to it — all 28 new prompts carry an explicit subject or a person-fixing verb ending.

My first scan was far too crude (it flagged 154 of ~200 sentences by looking for a missing subject *word*, which ignores that Czech verb endings carry person). I rewrote it before drawing any conclusion. Flagging that because the loose version would have "found" 154 defects and sent a future run rewriting correct Czech.

### The C1 unit — what I checked, and the one number that nearly shipped wrong

`c1_reporting_complementation` was a `thin_shell`: 10 items, 1 card. I verified run 27's sizing claim rather than inheriting it — **16 of 16 live C1 packs and 18 of 21 live B2 packs run exactly 48 items**, so house size is a real standard and promotion meant authoring 38 more items, not flipping a status. Four pattern groups of 12, which is the actual C1 taxonomy of this topic:

| Group | Pattern | Gaps on |
|---|---|---|
| `verb_ing` | admit/deny/suggest/recommend + -ing | the -ing form (10), the verb (2) |
| `verb_to_inf` | promise/offer/refuse + to-inf; advise/warn/remind + obj + to-inf | the infinitive, incl. `not to` |
| `verb_that` | report verbs (ordinary tense) vs demand verbs (base form) | tense marker or the verb |
| `verb_prep_ing` | accuse of / congratulate on / prevent from + -ing | the preposition (5), the verb (7) |

**`quiz_options` authored on all 48**, which is what run 27 warned about: with sibling-derived distractors the six items sharing `to`/`of`/`on` would have collided. Verified mechanically — 48/48 gaps reconstruct their `en` exactly, 48/48 produce a real quiz item, 0 items with more than one correct option, 0 duplicate gap answers.

**Three defects I introduced and caught before commit, worth naming because two of them are silent:**

1. **A substring `replace` built the gaps.** For *They congratulated him on winning*, gapping `on` would have produced *They c\_\_\_\_gratulated him …* — a corrupted frame that still passes a naive "is the answer in the sentence" check. Switched to a word-boundary regex with an assertion.
2. **Eleven out-of-scope tokens** — `propose`, `acknowledge`, `witness`, `invoice`, `threaten`, `wires`, `urge`, `committee`, `lying`, `confess`, `extra`. Left in, the unit would have pushed the audit to 154 and **failed the ratchet**. All eleven re-lexified onto pool-legal vocabulary before commit (`witness`→`neighbour`, `invoice`→`letter`, `committee`→`board`, `threatened`→`decided`, `wires`→`machine`, and so on), keeping every pattern intact. Worth knowing: a **gap answer is self-legal** (`targets_of` reads it), so only the non-gap words of `en` constrain you.
3. **HTML entities in authored prose** (`doporu&#269;it`) and two explanations still citing examples I had re-lexified away. Both would have rendered to a student.

Note `lying` is doubly unusable: even where `lie` is taught, the stemmer reduces `lying` to `ly`/`lye`, so it can never match. The item now reads *He accused her of hiding the truth.*

### Trunk intros — one of each kind, as the rule specifies

I read the items before classifying, per your instruction not to guess from the id. **Trunk packs are structurally unlike leaves**: their items are whole sentences and **carry no `use[]` tags at all**, so page 2's frames cannot come from carrier ids. I used the pack's own item sentences as the frames, which is the same principle — the real carrier wording — applied to a pack whose items *are* the carriers.

- **`trunk_verbs_action_a1` · concrete** — 12 tiles, one per verb the pack gaps on, each glyph showing the action rather than a noun. Trap: *take the bus* vs *jet autobusem*.
- **`trunk_glue_pronouns_a1` · glue** — text-only page 1, no `pictures[]`, no `diagram`. Trap: the object form (*I see him*, never *I see he*).

**I verified the engine renders a text-only page before authoring one**: every field in `introSection` is independently optional, and `hasIntro` adds the Intro stage for `practice: "frames"` packs. No engine change, so this stayed inside the content lane.

### Forks for James

**1 · Two tiles I would look at first.** `⬇️` for *put* and `🎁` for *give* are the weakest glyphs on the verbs page — a gift is a thing, not the act of giving. Everything else on that page is unambiguous. If either bothers you, the honest alternative is to drop to 10 tiles and let the body name the two.

**2 · Run 27's stricter tile rule is still unratified, and I did not apply it here.** Run 27 adopted "every tile must be a word its pack is the first in the course to teach" and asked for your nod. You have not answered, and the trunk verbs are taught by earlier leaves in several cases, so applying it would have emptied the page. I took the conservative path — the spec as written — but the two rules are now in visible tension and one of them should win.

**3 · The intro backlog is 27 units, and the shape of the rest is now known.** 15 A1 trunks + 3 A2 + 9 B1. Of the A1 trunks, my reading of the items puts **`verbs_daily`, `verbs_say`, `verbs_more`, `verbs_more2`, `verbs_more3`, `adjectives`** in the concrete branch and **`glue_linkers`, `glue_modals`, `glue_quantity`, `glue_questions`, `prepositions`, `can_like_want`, `frames`, `there_time`, `social`** in the glue branch. `prepositions` is the one genuine toss-up: `js/intro-visuals.js` already ships ball-and-box preposition diagrams, so it could take a schematic page rather than either branch. **That is a third option your rule does not mention — say the word and I will use it.**

**4 · Bank backlog: 25 leaves left** (19 A2 + 6 B1). `a2_describing` (314 items) and `a2_verbs` (112) still have no honest 12-sentence answer and will need a different rule when they come up.

**5 · `c1_error_patterns` is the last unbuilt C1 node** (path 18), also a thin shell. Same 38-item job. The other six non-live C1/B2 nodes must not be promoted — run 27 verified they are absorbed or folded, and I did not re-open that.

### Czech I am confident in but flagging for the review routine

The C1 pack is **grammar**, and the review routine's scope is vocab banks and intro pages — so **38 new C1-register Czech sentences plus 6 card explanations will get no second opinion unless you widen that scope or read them yourself.** That is the single thing I would most like you to look at from this run.

- `a2_family` — *Moje matka má dobrou povahu* (character) and *Můj otec má silnou osobnost* (personality) deliberately use different collocations; *silná osobnost* and *dobrá povaha* are both idiomatic, but the pair is the intro's own trap and worth a glance.
- `a2_family` — *Jsou šťastný pár.* is nominative singular for a plural English subject. Correct Czech, but it reads oddly beside the English if you scan the two columns.
- `a2_travel` — *Kde jsou moje zavazadla?* glosses uncountable English `luggage` with a Czech plural. Deliberate: it is the natural Czech and it teaches the countability mismatch, but a student may type *Where are my luggage*. `accepts` carries *Where are my bags*.
- `a2_travel` — *Let má zpoždění.* for "The flight is delayed" — Czech prefers *má zpoždění* to *je zpožděný*; chosen for naturalness over word-for-word parallelism.
- `c1_reporting_complementation` — the Czech for the mandative items (*Požadovala, aby peníze byly vráceny*, *Vedení doporučilo, aby se kancelář přestěhovala do Brna*) uses *aby* throughout, which is the right signal for the English base form and matches how `c1_subjunctive` already glosses the same construction.
- `c1_reporting_complementation` — *Obvinili vedoucího z toho, že vzal peníze* and *Obvinil ji z toho, že zatajila pravdu* use the *z toho, že* clause rather than a verbal noun. Natural, and it avoids inventing a noun the student has not met.
- No speaker-gender prompts anywhere, continuing run 25's rule. This bit once: *She persuaded me to change my mind* needed *rozmyslel/a*, so the subject became *her brother*.

### Smoke-check list

- **`c1_reporting_complementation`** — the new unit, C1 path 14. Check a few quiz items render four distinct options and that the `not to` item (*They warned us \_\_\_\_ touch the machine.*) reads correctly.
- **`trunk_glue_pronouns_a1`** — the first text-only intro page in the course. Confirm it does not look broken or empty on your device; that page is the whole point of the glue branch.
- **`trunk_verbs_action_a1`** — check `⬇️` and `🎁` render, and see fork 1.

---

## 2026-08-08 · cloud run 27 (RUE build, claude-opus-5)

### Headline: **the A1/A2 picture-intro backlog is finished** (`a2_media`, `a2_misc` — 38 of 38 live A1/A2 leaves now have a two-page intro), **the A1 sentence-bank backlog is finished** (`a1_ideas` — 16 of 16), the first A2 bank landed (`a2_routine`, all 14 items covered), and `a1_to_for_with` was re-lexified off `wait` — **audit 144 → 143**. All three gates green at the start, so step 0 did not consume the run; the repair queue again had no cloud-lane items. **I did not start a C1 unit — reasons and the verified state of that frontier are under Forks.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `f43e7bc` | **`a2_media`** intro — 11 emoji tiles, 5 carrier frames |
| 2 | `f052b89` | **`a2_misc`** intro — 12 emoji tiles, 5 carrier frames |
| 3 | `7eb691c` | **`a1_ideas`** `sentences[]` bank — 14 sentences, 14 lemmas |
| 4 | `51efcee` | **`a2_routine`** `sentences[]` bank — 14 sentences, all 14 items |
| 5 | `c2bb5fd` | `a1_to_for_with` re-lexified off `wait` — 144 → **143** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 144 unknown types · 33 units | **143** · 32 units · baseline tightened 144 → 143 |
| `scripts/smoke.py` | — | **SMOKE PASSED** |

Gates run before every commit; commit and push per unit. Nothing else landed on `build` while I worked, so no rebase was needed. Everything below was re-verified mechanically at the end of the run against the files **as committed**, not as authored.

### Repair queue — nothing to do this run

Re-read item by item rather than taken from the last digest; the file is unchanged. All three unticked items are out of the cloud lane: the vocab level badge and `order_click` are marked engine/local, and `b2_clear_claims` already carries its conservative resolution and is left unticked because the style call is yours.

### Vocab intros — the A1/A2 backlog is done · 38 of 38 leaves

| Unit | Page 1 | Trap | Why that shape |
|---|---|---|---|
| `a2_media` | 11 emoji | **speaker** = mluvčí *and* reproduktor | 11, not 12 — see below |
| `a2_misc` | 12 emoji | **fall** = podzim (amer.) *and* pád | the pack has no theme, so the body carries the tail |

**A finding that changed how I picked tiles, and that you should see.** Run 26 measured that 164 English words are taught by two or more live A1/A2 vocab units. That overlap is not evenly spread — it lands almost entirely on **concrete nouns**, which are exactly what a picture page wants. My first tile list for `a2_media` had **6 of 12 tiles on words an earlier pack already taught** (article, camera, comedy, drama, film, magazine, newspaper, photograph are all repeats — 8 of that pack's 24 items). `a2_misc` is worse: **21 of its 86 items** are repeats, including bag, bottle, bowl, card, cup, glass, key, letter, plate, ticket — the entire container set a picture page would reach for first.

So I re-picked both pages against a per-node "taught strictly before this point" set: **every tile on both pages is a word its pack is the first in the course to teach.** That is a stricter rule than the spec asks for, and I would keep it, but it is a rule change worth your nod.

Three judgment calls:

- **`a2_media` page 1 has 11 tiles, not 12.** The 12th honest candidate was `listener`, and 👂 is an ear, not a person. `magazine` (📖 is the nearest print glyph, and it is a repeat anyway) and `journalist` (no glyph left after ✍ author and 🎤 reporter) were also dropped. The body names them in prose instead.
- **`a2_misc` page 1 is drawn from the picturable quarter, and the body says so.** The pack is the A2 overflow list — `according to`, `whose`, `myself`, `per cent`. I considered a schematic, but no diagram describes a list with no theme; a diagram of the pack's own taxonomy teaches nothing about English. So page 1 shows the twelve most concrete words it genuinely owns and the body names the shape/part, kind/amount and structure-word tail explicitly, so the page is not silently pretending to cover 86 words.
- **`a2_misc` page 2 could have been a table.** `a2_adverbs` already sets the precedent of a table instead of frames on page 2, and this pack's structure-word tail would suit one far better than five carrier frames do. I stayed with frames because AGENTS.md specifies frames for page 2 — **conservative path, your call.**

Four glyphs reuse a glyph an earlier intro page used (🎤 a1_work *singer*, ⭐ a1_nature *star*, 🎬 a1_freetime *film*, 😊 a1_freetime *happy*; 📦 a2_shopping *product*). Each is honest for the new word and the tile label disambiguates, but 🎬 for `scene` next to a1_freetime's 🎬 for `film` is the one I would look at first.

### Use-stage sentence banks — A1 done (16/16), A2 begun (1/22)

Leaf packs still showing *"Use · coming soon"*: **29 → 27** (21 A2 + 6 B1). (Run 26 reported 30 at its close; my own count of leaf packs with no `sentences[]` was 29 before this run, so one of the two is off by one — mine is the measured number.) **No A1 leaf is left.**

Legality was decided by an oracle that **imports `audit.py` and asks it** — real `variants()`, `tokens_of()`, `GLUE`, the real path walk. Before trusting it I made it reproduce `audit.py`'s own published findings: it matched **exactly on all 33 reported units**. All 28 sentences came back legal, and **the audit total did not move when they landed**, which is the independent confirmation. It also caught things I would have shipped: `dog` (singular) is *not* legal at path 42 — only the plural `dogs` is taught — and `big`, `long` and `nice` are taught later than they feel.

**`a2_routine` covers all 14 of its items**, one sentence each — the first bank in the course with no uncovered item, because the pack is small enough.

**Three drafts were rewritten for a defect that is worth naming, because it will recur in every remaining A2 bank.** Czech drops the subject, so *Už je tady*, *Ještě tu není* and *Je stále v práci* each admit **he, she or it**. A student who answers "He is already here" to *Už je tady* is right, and `accepts` would have marked them wrong. All three prompts now carry an explicit subject (*Můj bratr už je tady*, *Autobus tu ještě není*, *Moje matka je stále v práci*). **The general rule: a Czech prompt with a dropped subject is only safe when the verb form or context fixes the person.** I did not audit the existing banks for this — worth a sweep.

**Czech I am confident in but flagging for the review routine:**

- **Register: standard `Potřebuji`**, continuing runs 24–26. `píšu` in *Každý den si píšu do deníku* is the neutral standard form (`píši` is markedly bookish) — deliberate, not a register slip.
- **No speaker-gender prompts**, continuing run 25's rule. This bit twice: *I am not ready yet* would have needed *připravený/á*, and *I am a bit tired* the same, so `yet` took *Autobus tu ještě není* and `bit` took the impersonal *Je trochu zima.* instead.
- `a1_ideas` — *Co je to za věc?* for "What is this thing?". Idiomatic, but *za věc* carries a faint edge of "what on earth is this" that the neutral English does not.
- `a1_ideas` — **the one I am least happy with**: *Je tu jedna osoba.* (person). Grammatical and determinate, but a slightly artificial standalone sentence. `accepts` also carries *There is one person here*, which is the more natural reading of that Czech. If you want one cut, cut this one.
- `a1_ideas` — *Potřebuji radu.* glosses `advice` (uncountable) with a countable Czech accusative; that is correct Czech and is exactly the `i_need_bare` carrier the pack declares, but the English/Czech countability mismatch is the point a student will trip on.
- `a2_routine` — *To je jízdní řád autobusu.* uses the genitive for a noun-noun compound (*bus timetable*), which is the natural Czech and not a calque.
- `a2_routine` — *Zdravý životní styl je důležitý.* `accepts` also takes the article-less "Healthy lifestyle is important", which is what a Czech speaker will type.

### Sequencing — 144 → 143 · one unit, and a correction to the last digest

**`a1_to_for_with` (path 42) — `wait` ×2 removed.** Run 26 listed this as a genuine fork on the grounds that `wait` is untaught. I checked rather than inherited, and **that reading was wrong in a way that matters**: `wait` is not taught *nowhere*, it is taught **later** — `a1_imperatives` and `trunk_verbs_action_a1` both teach it, and both sit after path 42. So this was a real teaching-order defect, not a tokenizer artefact.

It was also **off-spec for the pack's own stated law.** The pack note says *"for = purpose/benefit"*; `wait for` is a dependent preposition, neither purpose nor benefit. Both `wait` items were therefore the two least on-spec `for` items in the unit.

| Path | Was | Now | Gap kept |
|---|---|---|---|
| 42 | Wait **for** me. | Buy a book **for** me. | `for` |
| 42 | I wait **for** the bus. | She works **for** a company. | `for` |

Shapes preserved (imperative + object pronoun; subject + verb + `for` + noun), gap answer unchanged, both gaps reconstruct exactly, six on-spec `for` items untouched. Czech follows (*Kup pro mě knihu.*, *Ona pracuje pro firmu.*). The unit is now clean and gone from the report.

**The cost, logged as a fork:** A1 no longer exposes **`wait for`**, one of the highest-frequency verb+preposition collocations. It is not lost to the course — `a1_imperatives` teaches `wait`, and `b1_dependent_prepositions` covers verb+prep properly — but if you would rather have the collocation than the clean audit line, revert this one commit and I will treat it as a permanent fork instead.

**The other fourteen A1/A2 leads are all genuinely unrepairable, and I verified each rather than inheriting run 26's list:**

- **Six are the parenthesised-disambiguator artefact** (`free (time)`, `watch (wrist)`, `short (height)`, `cold (illness)`, `second (ordinal)`, `leave (depart)`). `targets_of` strips the bracket, `exposed_text` does not — so the gloss is exposed but never taught. Tooling, propose-only, unchanged since run 24.
- **Four are the contraction artefact** (`i'd`, `it's` ×2, `haven't`, `i'm`) — `WORD_RE` makes `it's` one token, so GLUE never matches it. Also tooling.
- **Four are real forks I re-tested this run**: `a1_word_order`/*new* — at path 3 the only adjective taught anywhere in the course so far is `tired`, and *a tired teacher* is not what adj+noun order should be taught on; `trunk_social_a1`/*nice* — the single item is *Nice to meet you.* with the gap on `meet`, a fixed formula that re-lexifying would destroy; `trunk_verbs_daily_a1`/*water* — path 6, no drinkable noun is taught yet and the gap is on `drink`; `a1_articles`/*hour* — *We have an hour.* is the silent-h half of the pair whose other half is *This is a university.*, so removing it deletes a teaching point.

By my count the two tooling artefacts now cover **10 of the remaining 143**.

### Forks for James

**1 · I did not start a C1 unit, and I want you to agree with the reason.** Step 5 was reachable this run. I read the frontier before deciding, and the state is not what "flip the next sketch node" implies:

- The C1 grammar path has **18 nodes: 16 live, 2 unbuilt** — `c1_reporting_complementation` (path 14) and `c1_error_patterns` (path 18).
- Both are `quality: "thin_shell"` with **10 items and 1 intro card**. The four nearest **live** C1 packs (`c1_subjunctive`, `c1_advanced_modality`, `c1_comparative_advanced`, `c1_spoken_vs_written`) all run **48 items** and 2–5 cards. So promoting one means authoring ~38 more items, not flipping a status.
- That is ~38 new C1-register **Czech** sentences — the highest-risk content in the course — landing in the same run as 28 new bank sentences and 2 new intros, all of which the Czech-review routine still has to read.

Starting it and not finishing is the one thing the rules forbid outright, so I stopped instead. **`c1_reporting_complementation` is the right next one** (earlier on the path, and its existing 10 items are sound — correct patterns, natural Czech, honest `accepts`). Watch the quiz distractors there: six of the ten items share `to`/`of`/`on` as the gap answer, so sibling-derived options will collide unless `quiz_options` are authored.

**Also verified, and worth knowing: the other six non-live C1/B2 grammar nodes must NOT be promoted.** `b2_inversion`, `b2_cleft_sentences`, `b2_emphasis_fronting` are marked *absorbed into path unit(s)*; `c1_hedging_stance` folded into `c1_advanced_modality`; `b2_future_in_the_past` into `b2_future_forms`; `b2_clear_claims` is shaded and off the B2 path. None is on a path order list. A future run reading only the status field would mistake all six for backlog.

**2 · The overlap fork (run 26's fork 1) is now blocking picture pages, not just curriculum.** See the intro section: it forced a stricter tile rule on both pages this run. `a2_misc` in particular carries 21 repeats out of 86 items, and `a2_clothes` is still four-twelfths overlap with `a2_shopping`. Your call on (a) intended spiral, (b) A2 drops what A1 taught, (c) A2 keeps the word and changes the sense — but note that (b) would strand tiles on both new pages, so **if you are leaning to (b), say so before the next run.**

**3 · The 17 A1 core-frames trunks + 3 A2 + 3 B1 trunks still have no intro, and I again built leaves only.** Same mechanical reason as run 26, re-verified: trunk packs are `practice: "frames"`, so `js/practice-vocab.js` drives their Use stage from their own items — they never show *"Use · coming soon"*, and a picture-led word intro does not describe what they teach. **Now that the A1/A2 leaf backlog is finished, this is the question that decides what the next intro run does.** One line in AGENTS.md — "leaves only" or "trunks too" — would settle it permanently.

**4 · Bank order from here.** 21 A2 leaves left, then 6 B1. I took `a2_routine` because it is next in path order. It was also the smallest (14 items); the next few are `a2_family` (20), `a2_travel` (72), `a2_freetime` (32). **`a2_describing` has 314 items and `a2_verbs` 112** — a ~12-sentence bank cannot represent those honestly, and they will need a different rule when they come up.

### Smoke-check list

- `a2_media` intro page 1 — check ✍ and 🪧 render on your device (🪧 is the newest glyph on any intro page); page 2 is the speaker = mluvčí/reproduktor trap.
- `a2_misc` intro page 1 — 🛞 and 🛎 are the render risks here; the body is the longest on any intro page, so check it does not read as a wall on a phone.
- `a2_routine` Use stage — first A2 bank; the already/yet/still trio is where the dropped-subject rewrite landed.
- `a1_to_for_with` Check/Type — two items changed; confirm *Buy a book for me.* and *She works for a company.* read naturally next to the six untouched `for` items.



## 2026-08-07 · cloud run 26 (RUE build, claude-opus-5)

### Headline: **3 A2 vocab intros (33 → 36, A2 leaves 17 → 20 of 22), 2 Use-stage sentence banks (`a1_shopping`, `a1_tech` — 28 sentences), and 2 units re-lexified (audit 146 → 144).** All three gates green at the start, so step 0 did not consume the run; the repair queue again had no cloud-lane items. **A1 leaves are now one unit from finished on both backlogs.** Two findings that need your call are under Forks — the bigger one is that **164 English words are taught twice across live A1/A2 vocab units**, which I measured rather than fixed.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `6c38cca` | **`a2_health`** intro — 12 emoji tiles, 5 carrier frames |
| 2 | `55df96e` | **`a2_school`** intro — 12 emoji tiles, 5 carrier frames |
| 3 | `e060f69` | **`a2_clothes`** intro — 8 emoji tiles, 5 carrier frames |
| 4 | `e969a2f` | **`a1_shopping`** `sentences[]` bank — 14 sentences, 15 lemmas |
| 5 | `cf80966` | **`a1_tech`** `sentences[]` bank — 14 sentences, 14 lemmas |
| 6 | `14f80c4` | `a2_modals_must_should` + `a2_countable` re-lexified — 146 → **144** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 146 unknown types · 35 units | **144** · 33 units · baseline tightened 146 → 144 |
| `scripts/smoke.py` | — | **SMOKE PASSED** |

Gates re-run before every commit; commit and push per unit. Nothing else landed on `build` while I worked, so no rebase was needed.

### Repair queue — nothing to do this run

Re-checked item by item rather than taken from the last digest; the file is unchanged. All three unticked items are out of the cloud lane: the vocab level badge and `order_click` are marked engine/local, and `b2_clear_claims` already carries its conservative resolution and is left unticked because the style call is yours.

### Vocab intros — 33 → 36 · A2 leaves 17 → 20 of 22

Built in path order (83, 86, 87). **Remaining A2 leaves: `media`, `misc`** — two, then the A2 intro backlog is done. A1 leaves stay finished at 16/16.

| Unit | Page 1 | Trap | Why that shape |
|---|---|---|---|
| `a2_health` | 12 emoji | **chemist** is the British shop *and* the person | 41 items, concrete enough for honest glyphs (🦴 bone, 🧠 brain, 🩸 blood, 🦠 virus) |
| `a2_school` | 12 emoji | **maths / mathematics** are two entries for one subject | every named subject has a real glyph; the five mental nouns are named in the body instead |
| `a2_clothes` | 8 emoji | **pants** = trousers (AmE) but underwear (BrE) | only 12 items and only 8 with an honest glyph — page 1 runs at the spec minimum |

**Every tile was verified to be an item of its own pack, and every tile's Czech is character-identical to that item's own `cz` gloss** — script, not eyeball, re-run against the files as committed. Same for the frames: each traces to a `use[]` carrier id the pack's items actually declare, worded from the live packs' own precedent.

Three judgment calls worth naming:

- **`a2_clothes` page 1 has 8 tiles, not 12.** `fashion`, `jumper`, `belt` and `button` have no honest single emoji, so the body names them in prose rather than stretching a glyph onto them. `jumper = sweater` (which A1 taught) is stated there too, as a plain fact — the one trap slot went to `pants`, which is the one that can actually embarrass someone.
- **Two glyphs on that page repeat glyphs A1 already used**: 👖 for `pants` (A1 used it for `jeans`) and 👕 for `casual` (A1 used it for `T-shirt`). Both are honest for the new word — a T-shirt *is* the canonical casual garment — and 👖 is precisely what the pants trap is about. Deliberate, but it is the first intro page in the course to reuse an earlier page's glyph, so it is worth a look.
- **`a2_health` and `a1_health` both gloss a shop as *lékárna*** (`chemist` vs A1's `pharmacy`). That is a cross-pack instance of run 25's fork 2. I could not disambiguate it without editing A1 content mid-smoke, so I used the trap note to make the pairing explicit instead.

### Use-stage sentence banks — A1 leaves 13 → 15 of 16

Leaf packs still showing *"Use · coming soon"*: **32 → 30.** **A1 leaves still without a bank: `leaf_ideas_a1` — one.** After that the backlog is all A2 (22 leaves).

Legality was decided by an oracle that **imports `audit.py` and asks it** — `variants()`, `tokens_of()`, `GLUE`, the real path walk. Before trusting it I made it reproduce `audit.py`'s own published findings; it matched exactly on all six A1 units that have one (`freetime`/*time*, `social`/*nice*, `body`/*height*, `clothes`/*wrist*, `health`/*illness*, `time`/*ordinal*), and returned "none" for the two packs I was about to author into. All 28 sentences came back legal, and **the audit total did not move when they landed**, which is the independent confirmation.

**Two candidates were cut by the oracle, not by taste** — both cases where the obvious sentence uses a word the course teaches *later*:

- `a1_shopping` — *There is a long queue.* `long` is not taught before path 43, so **`queue` has no bank sentence at all**. I did not reword it into something artificial.
- `a1_tech` — *The screen is big.* `big` is not taught until path 51 (`trunk_adjectives_a1`, two nodes after tech), so `screen` took *The photo is on the screen.* instead.

**Czech I am confident in but flagging for the review routine:**

- **Register: standard `Potřebuji` / `Poslouchám`**, continuing runs 24–25 and not run 23's colloquial `Potřebuju`. Still inconsistent course-wide; still a one-line convention call that would be a sweep, not a per-run decision.
- **No speaker-gender prompts**, continuing run 25's rule — nothing in either bank forces *rád* vs *ráda*.
- `a1_shopping` — *Obchod je zavřený.* The pack's own gloss for `closed` is the impersonal **zavřeno**, but a sentence with a subject needs the adjective, so the bank uses the agreeing form. Deliberate, and it is the same otevřeno/zavřeno wobble the review routine already flagged on this pack's intro.
- `a1_shopping` — *Máte hotovost?* and *Jakou velikost potřebujete?* use vykání while the rest of the bank is first person. Natural for a shop, but it is a register mix inside one bank.
- `a1_shopping` — *Chci platit kartou.* Instrumental without a preposition; `accepts` also carries *pay with a card*.
- `a1_tech` — *To je fotka mojí rodiny.* Genitive **mojí rodiny** rather than the bookish *mé rodiny*.
- `a1_tech` — **the one I am least happy with**: *Mám pro tebe zprávu.* (message) and *Dívám se na zprávy.* (news) sit in the same bank on the same stem. The singular/plural split plus *dívat se na* makes each prompt determinate, and the contrast is arguably worth teaching, but a tired student could produce *messages* for the second. **If you want one cut, cut the news sentence.**

Everything else — the accusatives (*účtenku, slevu, zprávu, velikost, fotoaparát*), the locatives (*v tašce, na stole, v obývacím pokoji, na obrazovce*), the plurals (*peníze, noviny, zprávy*) and the adjective agreements (*dobrá, drahé, levné, zavřený*) — I am confident in.

**One deliberate exception to the legality discipline, so a later run does not "fix" it:** `a1_tech` carries `"I need your e-mail"` in `accepts`. The audit tokenizer splits that into *e* + *mail*, neither taught — but **`accepts` is never read by `audit.py`** (verified in the source, not assumed; `exposed_text` reads item `en` and sentence `en` only). The pack's own Czech gloss is *e-mail*, so a student who types the Czech spelling would otherwise be marked wrong. Kept on purpose.

### Sequencing — 146 → 144

Six of the ten remaining A1/A2 leads are **not teaching-order defects at all** — they are the parenthesised-disambiguator artefact run 24 flagged: `free (time)`, `watch (wrist)`, `short (height)`, `cold (illness)`, `second (ordinal)`, `leave (depart)`. The bracket is a deliberate gloss, and "repairing" content to satisfy the tokenizer would damage the packs. Still propose-only, still untouched. That leaves four genuine ones; I took the two that substitute cleanly.

| Unit | Path | Was | Now | Gap kept |
|---|---|---|---|---|
| `a2_modals_must_should` | 65 | You shouldn't **worry**. | You shouldn't **wait**. | `shouldn't` |
| `a2_countable` | 71 | He ordered a **pizza**. | He ordered a **salad**. | `a` |

`worry` and `pizza` are taught nowhere in the course; `wait` and `salad` are both taught well before these nodes. Both teaching points are untouched — modal-gap advice, and the article before a singular countable noun. **`salad` rather than the obvious `sandwich`**: item 7 of that same pack is already *He wants a sandwich.* with the same `a` gap answer, so a sandwich swap would have put two near-identical prompts in one Match board. Czech follows (*Neměl bys čekat.*, *Objednal si salát.*). **The old forms are NOT kept in `accepts` here** — unlike run 25's two, the new Czech prompts do not admit the old English, so keeping them would accept a wrong answer. Both units are now clean and both are gone from the report.

The two A1/A2 leads I left: `trunk_social_a1`/*nice* (*Nice to meet you.* is a fixed social formula — re-lexifying it would destroy the chunk, and `nice` is taught nowhere) and `trunk_verbs_daily_a1`/*water* (path 6; almost nothing is taught yet, and the gap is on `drink`, so there is no legal object to swap in). Both are genuine forks, not oversights.

### Forks for James

**1 · 164 English words are taught by two or more live A1/A2 vocab units. Measured, not fixed.** This is redundancy rather than the ambiguity of run 25's fork 2 — a repeated word is not ungradeable, it is just taught twice — but at this scale it is a curriculum question, and it is the reason `a2_clothes` re-teaches `glove` with the identical Czech A1 gave it. The worst pairs:

| Overlap | Units | Words |
|---|---|---|
| 14 | `leaf_freetime_a1` × `leaf_describing_a2` | busy, common, complete, correct, dangerous, great, modern, perfect, popular, quick, quiet, similar, sorry, sure |
| 11 | `leaf_places` × `leaf_travel_a2` | airport, arrive, beach, flight, hotel, journey, map, passport, station, tourist, trip |
| 8 | `leaf_work_a1` × `leaf_work_a2` | boss, career, colleague, company, interview, manager, meeting, salary |
| 8 | `leaf_ideas_a1` × `leaf_ideas_a2` | advice, fact, interest, machine, reason, result, situation, success |
| 6 | `leaf_home_family` × `leaf_home_a2` | apartment, downstairs, neighbour, sofa, stairs, upstairs |
| 4 | `leaf_shopping_a2` × `leaf_clothes_a2` | belt, button, fashion, jewellery |

Roughly two thirds carry **character-identical Czech** in both places, so they are straight repeats rather than deliberate sense-splits. Three readings, and I took none of them because it is your call: (a) intended spiral revision, in which case nothing to do; (b) A2 units should drop what A1 already taught, which is a content sweep; (c) the A2 unit should keep the word but change the *sense* it teaches, which is authoring. Worth noting that `leaf_freetime_a1` is an A1 unit teaching 14 adjectives that `leaf_describing_a2` teaches again — that pairing looks less like spiralling and more like two imports that overlapped.

**2 · `a2_shopping` and `a2_clothes` overlap on four of `a2_clothes`'s twelve items** (belt, button, fashion, jewellery — a third of the smaller pack). `a2_clothes` is the smallest live vocab pack in the course; after the overlap it contributes eight words of its own. **It may not deserve to be a separate unit.** I authored its intro anyway, because leaving a live unit without one is worse, but if you merge it the intro is throwaway work — say so before the next run and I will skip `media`/`misc` ordering assumptions accordingly.

**3 · Still deliberately unrepaired, all re-checked this run**: `a1_to_for_with`/*wait*, `a1_word_order`/*new*, `a1_articles`/*hour*, plus the two named above. Run 24's two audit-tooling findings (contractions, parenthesised disambiguators) are also still open and still propose-only — by my count they now cover **10 of the remaining 144**.

**4 · The 17 A1 core-frames trunks have no intro, and I have again not built one.** AGENTS.md says *every live vocab unit* gets the two-page intro, but every run since the spec landed has built leaves only. The mechanical reason is sound and I verified it rather than inheriting it: trunk packs are `practice: "frames"`, so `js/practice-vocab.js` already drives their Use stage from their own items — they never show *"Use · coming soon"*, and a picture-led word intro does not describe what they teach. **If you want the leaves-only reading to be the rule, one line in AGENTS.md would stop every future run re-deciding it.**

### Smoke-check list

- `a2_clothes` intro — the 8-tile page (first one below 12) and the `pants` trap; also the 👖/👕 glyph reuse from the A1 clothes page.
- `a2_school` intro page 1 — twelve subject glyphs; check ⚛️ and ➗ render on your device.
- `a2_health` intro page 2 — the chemist/pharmacy note, which points back at an A1 word.
- Use stage on `leaf_shopping_a1` and `leaf_tech_a1` — both were "Use · coming soon" before this run. In tech, watch the *zprávu*/*zprávy* pair specifically.
- The two re-lexified grammar items: `a2_modals_must_should` item 21 and `a2_countable` item 44.

---

## 2026-08-07 · cloud run 25 (RUE build, claude-opus-5)

### Headline: **3 A2 vocab intros (30 → 33), 2 Use-stage sentence banks (`a1_time_numbers`, `a1_nature`), 2 units re-lexified (audit 148 → 146), and one flatly wrong Czech gloss corrected.** All three gates green at the start, so step 0 did not consume the run; the repair queue again had no cloud-lane items. One **verified student-facing defect found and deliberately NOT bulk-fixed** — 32 vocab items whose Czech prompt has two equally correct English answers. It needs your call; the write-up is under Forks.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `bd657c0` | **`a2_adverbs`** intro — `scale` schematic, no carrier frames (see fork 1) |
| 2 | `e4f6722` | **`a2_ideas`** intro — `branch` schematic, 5 carrier frames |
| 3 | `79b7d7d` | **`a2_verbs`** intro — `branch` schematic, 2 carrier frames |
| 4 | `67b8c9d` | **`a1_time_numbers`** `sentences[]` bank — 13 sentences, 16 lemmas |
| 5 | `02df3e2` | **`a1_nature`** `sentences[]` bank — 13 sentences, 18 lemmas |
| 6 | `1f5d025` | `a2_past_continuous` + `trunk_recycle_a2` re-lexified — 148 → **146** |
| 7 | `dcc9f69` | `a2_verbs` item `fix` — Czech gloss was the gloss for *form* |

Two commit subjects carry a wrong lemma count (`67b8c9d` says 17, actual 16; `02df3e2` says 16, actual 18). The counts above are the recounted ones; the history is left alone rather than force-pushed.

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 148 unknown types · 37 units | **146** · 35 units · baseline tightened 148 → 146 |
| `scripts/smoke.py` | — | **SMOKE PASSED** |

Gates re-run before every commit, commit and push per unit. Nothing else landed on `build` while I worked, so no rebase was needed.

### Repair queue — nothing to do this run

Unchanged, and re-checked item by item rather than taken from the last digest. All three unticked items are out of the cloud lane: the vocab level badge and `order_click` are marked engine/local, and `b2_clear_claims` already carries its conservative resolution and is left unticked because the style call is yours.

### Vocab intros — 30 → 33 · A2 leaves 14 → 17 of 22

Built in path order (76, 78, 80). Remaining A2 leaves: `health`, `school`, `clothes`, `media`, `misc`. A1 leaves stay finished at 16/16.

| Unit | Page 1 | Trap | Why that shape |
|---|---|---|---|
| `a2_adverbs` | `scale` — hardly · slightly · fairly · completely | **hardly ≠ hard** | 66 adverbs, nothing photographable; the scale is the one real relation in the set |
| `a2_ideas` | `branch` — problem → cause · reason · solution · result | **advice** is uncountable | 92 abstract nouns; the cause/solution chain is the shape they actually make |
| `a2_verbs` | `branch` — verb → repair · invite · improve · solve | **borrow vs lend** | 112 bare lemmas; no honest emoji exists for *accept*, *achieve*, *affect* |

**Every label and tile was checked to be an item of its own pack** (script, not eyeball) — the only label in the three pages that is not a pack item is the root `verb` on `a2_verbs`, which is a category name and is deliberate. Same for the words named in the body text: `method`, `process`, `system`, `evidence`, `example`, `advice`, `opinion` (ideas) and `repair`, `replace`, `remove`, `invite`, `greet`, `complain`, `increase`, `reduce`, `improve` (verbs) are all items.

**Frames are grounded, not invented.** `a2_ideas` shows the five carriers its own items declare — `is_important` (83 of 92 items), `this_is_a`, `i_have_bare`, `i_need_bare`, `i_like_bare`. `a2_verbs` shows exactly two, because **every one of its 112 items declares exactly `i_want_to` and `we_need_to` and nothing else** — so two frames is the whole truth about that unit, not a thin page.

### Use-stage sentence banks — A1 leaves 11 → 13 of 16

Leaf packs without a bank: **33 → 31.** A1 leaves still without one: `leaf_shopping_a1`, `leaf_tech_a1`, `leaf_ideas_a1` (3 left before A2 starts).

Legality was decided by an oracle that **imports `audit.py` and asks it** — `variants()`, `tokens_of()`, `GLUE`, the real path walk — rather than reimplementing the rules. Before trusting it I made it reproduce `audit.py`'s own published findings; it matched exactly on `leaf_freetime_a1` (`time`), `trunk_social_a1` (`nice`) and `leaf_body_a1` (`height`). All 26 sentences came back legal, and the audit total did not move when they landed, which is the independent confirmation.

**`a1_nature` — a rule I applied that no gate enforces: no speaker-gender prompts.** The obvious sentences for a nature unit are *Mám rád moře* / *Nemám rád vítr*, and both force a masculine speaker into the Czech prompt (*rád* vs *ráda*). The course has handled this before by giving both forms (*Jsem unavený. / Jsem unavená.*), but that reads badly as a Use prompt, so I rewrote around it: `The wind is cold.` → *Vítr je studený.*, `We swim in the river.` → *Plaveme v řece.* Every one of the 13 prompts is gender-neutral. **If you would rather have the dual form, that is a convention call and a sweep, not a per-run decision.**

**Two sentences rewritten before shipping, for reasons no gate would catch.** *Jezero je vyschlé* → **The field is dry.** / *Pole je suché.* (a lake is not *suché*, and *vyschlé* is "dried up", so the prompt did not determine its own answer). And `I can see many stars tonight` → **I see many stars tonight**, because the Czech *vidím* has no *can* in it and a student would have produced the shorter sentence and been marked wrong; both forms are now in `accepts`.

**Czech I am confident in but flagging for the review routine:**

- **Register: I used standard `Pracuji` / `Nepiji`**, continuing run 24's choice and not run 23's colloquial `Potřebuju`. Still inconsistent course-wide; still a one-line convention call that would be a sweep.
- `a1_time_numbers` — *Kolik je hodin?* → **What time is it?** The pairing is standard but not literal; `accepts` carries *What is the time* and *What's the time* too.
- `a1_time_numbers` — *Moje narozeniny jsou v květnu.* Chosen over the commoner *Mám narozeniny v květnu* precisely because the commoner one would produce "I have a birthday in May", not the `en`.
- `a1_time_numbers` — *Obchod otevírá v devět.* Intransitive *otevírá* without *se*; I believe this is the normal shop-hours usage.
- `a1_time_numbers` — *Jezdíme do Prahy dvakrát za rok.* *jezdit* (by vehicle) rather than *chodit*; *dvakrát za rok* rather than *dvakrát ročně*.
- `a1_nature` — *Slunce je horké.* Grammatical and clear; *Slunce pálí* is more idiomatic but is a different English sentence.
- `a1_nature` — *Dnes večer vidím hodně hvězd.* Present tense for a tonight-observation.

Everything else — the accusatives (*schůzku, kávu, oblohu*), the locatives (*v týdnu, v květnu, v horách, v lese, v řece, na zahradě, v létě, v zimě*), the genitive plurals after numerals and quantifiers (*pět dní, deset minut, hodně hvězd*), and the adjective agreements (*teplé počasí, horké, studený, studená, suché*) — I am confident in.

### Sequencing — 148 → 146

Every remaining A1/A2 unit sits at exactly **one** unknown type, so "worst unit" is still a tie; I took the two where the offending word is purely incidental to the gap and a taught word substitutes with no loss.

| Unit | Path | Was | Now | Gap kept |
|---|---|---|---|---|
| `a2_past_continuous` | 55 | **While** she was cooking, I opened the window. | **When** she was cooking… | `was` |
| `trunk_recycle_a2` | 90 | There is a pharmacy **nearby**. | There is a pharmacy **near here**. | `pharmacy` |

`when` is GLUE and `while` is taught nowhere in the course; the background-past-continuous + past-simple-event teaching point is untouched, and the Czech follows (*Zatímco* → *Když*). On the recycle item, `near` and `here` are both taught well before path 90, the new primary **was already one of that item's accepted answers**, and the Czech *Je tu blízko lékárna* fits either form. Old forms kept in `accepts` on both. Both units are now clean.

### Forks for James

**1 · `a2_adverbs` page 2 has no frames, because the pack has no carriers.** It is the only live vocab unit whose items declare `use[]` **zero** times — 0 across all 66 items — and the spec says frames come from real carrier ids and forbids inventing them. Conservative path taken: page 2 instead groups the pack's own words by what they tell you (how / how much / how often / how sure), with all 16 words in that table verified to be items of this pack, plus the hardly/hard trap. **If you want a frames page here, the fix is upstream — tag the pack's items with carriers — not a page-2 rewrite.**

**2 · 32 vocab items have a Czech prompt with two equally correct English answers. Verified in the engine, deliberately not bulk-fixed.** This is the same defect class run 22 swept out of the sentence banks, but it is sitting in the **item glosses**, where no gate looks: `check_playable`'s single-correct-answer check covers the 85 grammar units only.

| Pack | Items | Collisions |
|---|---|---|
| `a2_describing` | 22 | bohatý (rich/wealthy) · celý (entire/whole) · elektrický (electric/electrical) · jistý (certain/sure) · nemocný (ill/sick) · obrovský (enormous/huge) · pravděpodobný (likely/probable) · rychlý (fast/quick) · vnitřní (indoor/inner) · vysoký (high/tall) · široký (broad/wide) |
| `a2_adverbs` | 6 | nakonec (finally/eventually) · rozhodně (certainly/definitely) · zejména (especially/particularly) |
| `a2_ideas` | 4 | chyba (mistake/error) · možnost (possibility/option) |

What it does to a student, read out of the engine rather than guessed:

- **Quiz** (`js/practice-vocab.js` ~915): distractors are drawn from items whose English differs from the correct one, so the twin is eligible. Grading is `opts[i] === correct` — a straight string match. When *rozhodně* draws *definitely* into its four options, picking *definitely* is marked **wrong**.
- **Match** (~712): the left column is the Czech, so the board shows **two identical `rozhodně` tiles**; pairing is graded by item id, so the correct-looking pairing is wrong half the time.
- **Type**: one prompt, one accepted spelling, no `accepts` on any of these items.

Three ways out, and choosing between them is a design decision, not a repair, so I took none of them: (a) disambiguate the Czech on one of each pair; (b) give both items an `accepts` carrying the twin — fixes Type but **not** Quiz or Match, since those grade by identity; (c) engine-side, exclude same-support items from the quiz distractor pool and dedupe the match board — which is engine code and therefore not mine to ship. **(c) is the only one that fixes all three modes, and it is one condition in two places.** Say the word and it goes in the repair queue.

**3 · `a2_verbs` item `fix` was glossed `tvořit / formulář` — the Czech for *form*, which the course already teaches at `a1_ideas`.** A prompt reading "tvořit / formulář" was demanding the answer *fix*. Because `form` is already taught elsewhere, the copy-paste is clearly on the Czech side, not the English, so I corrected the Czech and left the graded target alone. Chose **`spravit`** over the more obvious *opravit* because `repair` in this same pack is already glossed *opravit* and I did not want to add a thirty-third collision to fork 2. Found while reading the pack for its intro — **worth asking whether the rest of that import wants a read.**

**4 · Three A1/A2 violations still deliberately unrepaired**, all re-checked this run and all unchanged from run 24's reasoning: `a1_to_for_with`/`wait` (5-step running-order mismatch, spine decision), `a1_word_order`/`new` (no attributive adjective is taught before path 52), `a1_articles`/`hour` (the pack's own deliberate silent-h example). Run 24's two audit-tooling findings (contractions, parenthesised disambiguators — 12 of the remaining 146) are also still open and still propose-only.

### Smoke-check list

- `a2_adverbs` intro page 1 — the `scale` schematic with four labels; and page 2, which is the first intro page in the course with a table and no frames.
- `a2_verbs` intro page 1 — `branch` with the root label `verb`, the first schematic root that is a category name rather than a pack word.
- Use stage on `leaf_time_a1` and `leaf_nature_a1` — both were "Use · coming soon" before this run.
- The two re-lexified items: `a2_past_continuous` item 38 and `trunk_recycle_a2` item 8.
- If you want to see fork 2 live: open `leaf_describing_a2` Quiz and page through — 22 of its 314 items can produce a two-correct-answer question.

---

## 2026-08-07 · cloud run 24 (RUE build, claude-opus-5)

### Headline: **3 A2 vocab intros (27 → 30), 2 Use-stage sentence banks (`a1_work`, `a1_school` — A1 leaves now 11/16), and 2 units re-lexified (audit 150 → 148).** All three gates green at the start, so step 0 did not consume the run. Repair queue had no cloud-lane items. Two *audit tooling* artefacts found and quantified — 12 of the remaining 148 violations are not teaching-order defects at all; both are propose-only, neither shipped.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `a195827` | **`a2_describing`** intro — `contrast` schematic, 4 carrier frames |
| 2 | `78db405` | **`a2_home`** intro — 9 tiles, 5 frames |
| 3 | `9effa46` | **`a2_shopping`** intro — 12 tiles, 5 frames |
| 4 | `69ad29d` | **`a1_work`** `sentences[]` bank — 13 sentences, 16 lemmas |
| 5 | `630475b` | **`a1_school`** `sentences[]` bank — 13 sentences, 14 lemmas |
| 6 | `a6b4c0f` | `trunk_glue_linkers_a1` + `trunk_verbs_more2_a1` re-lexified — 150 → **148** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 150 unknown types · 39 units | **148** · 37 units · baseline tightened 150 → 148 |

Gates re-run before every commit; commit and push per unit. Nothing else pushed to `build` while I worked, so no rebase was needed.

### Repair queue — nothing to do this run

All three unticked items are explicitly out of the cloud lane: the vocab level badge and `order_click` are both marked engine/local-lane, and `b2_clear_claims` already carries its conservative resolution and is left unticked because the style call is yours. Nothing ticked; the file is unchanged.

### Vocab intros — 27 → 30

A1 leaves stay finished at 16/16. **A2 leaves: 11 → 14 of 22.** Built in path order (69, 71, 75). Remaining A2: `adverbs`, `ideas`, `verbs`, `health`, `school`, `clothes`, `media`, `misc`.

| Unit | Page 1 | Trap / note | Why that shape |
|---|---|---|---|
| `a2_describing` | `contrast` schematic, *empty \| tired* | the **un-** prefix | 314 adjectives — an abstract set, so a schematic |
| `a2_home` | 9 tiles | British **flat** = American **apartment** | concrete set, but only 9 honest glyphs exist |
| `a2_shopping` | 12 tiles | **quality** vs **quantity** | money/goods picture-map cleanly |

**`a2_describing` took `contrast`, and the labels come from the `use[]` data rather than from taste.** The pack declares `it_is` 306 times and `the_bag_is` 305 against `i_am_adj` 173 — so almost every one of these words can describe a *thing*, and about half can also describe a *person*. That is the split a student needs before Match starts pairing 314 adjectives, and it is the same two-jobs shape run 23 used for `a2_feelings`. Both label words (`empty`, `tired`) are items in this pack.

**The un- note has four pairs that are both in this pack**: able/unable, fair/unfair, likely/unlikely, usual/unusual (`unhappy` is here too, with `happy` taught back at `a1_freetime`). I preferred it to the *Mám hlad → I am hungry* trap because `a2_feelings` at path 63 already teaches exactly that shape with *Mám strach → I am afraid*, and this unit is six steps later.

**`a2_home` — the words I refused a tile, extending run 22/23's rule.** An emoji that names a *different word the course already teaches* is worse than no tile at all, because the student has the competing answer in memory:

| Word | Glyph | Reads as | Competing word taught at |
|---|---|---|---|
| roof | 🏠 | house | `a1_home_family` |
| shelf | 📚 | books | `a1_home_family` |
| gate | 🚪 | door | `a1_home_family` |
| furniture | 🪑 | chair | `a1_home_family` |
| pillow | 🛏 | bed | `a1_home_family` |
| garage | 🚗 | car | earlier |

`stairs`, `curtain`, `carpet`, `balcony`, `basement`, `rent`, `landlord` and `neighbour` were left off for the plainer reason that no honest glyph exists (🪜 is a ladder, a different object; 🎭 reads "theatre"). That leaves **9**, which is inside the 8–12 the spec allows. I checked each competing word against the pack list rather than assuming.

**`a2_shopping` refusals**: `fashion` (👗 reads "dress", taught in `a1_clothes`), `bar` (🍫 picks only the *tyčinka* sense and silently drops the drinking-bar sense the gloss also carries), `belt`/`button` (no glyph that is not a UI control), `advertisement` (📣 reads "announcement").

**Frames are grounded, not derived.** I rebuilt run 23's inverse carrier table by intersecting the `use[]` id sets of every pack that already shows a given frame — `This is a …` resolves uniquely to `this_is_a` across 24 packs, `I have a …` to `i_have_a` across 17, and `a1_colours` independently confirms `it_is` → "It is …" and `the_bag_is` → "The bag is …". Every frame on all three new pages was then checked to be a carrier id **actually present on that pack's own items**; all 14 pass.

### Use-stage sentence banks — A1 leaves 9 → 11 of 16

Leaf packs without a bank: **35 → 33**. A1 leaves still without one: `leaf_time_a1`, `leaf_nature_a1`, `leaf_shopping_a1`, `leaf_tech_a1`, `leaf_ideas_a1` (5 left before A2 starts).

**Legality was decided by an oracle that imports `audit.py` and asks it** — `variants()`, `tokens_of()`, `GLUE`, and the real path walk — rather than by reimplementing the rules or counting steps. Before trusting it I made it reproduce `audit.py`'s own published per-unit findings; it matched exactly on every unit tested, so its verdicts are the gate's verdicts. All 26 sentences are legal, and the audit total did not move when they landed, which is the independent confirmation.

**Gloss collisions designed out rather than shipped.** Both packs gloss two taught items with one Czech word, so a single prompt had two equally-right answers — the defect run 22 swept out of the older banks. Each is resolved by widening `accepts`, not by dropping the sentence:

| Prompt | Czech word | Both taught here | `accepts` carries |
|---|---|---|---|
| *Potřebuji práci.* | práce | `job` + `work (noun)` | "I need a job" **and** "I need work" |
| *Moje práce je zajímavá.* | práce | same | "My work is …" **and** "My job is …" |
| *Mám hodinu v devět.* | hodina | `class` + `lesson` | "a lesson at nine" **and** "a class at nine" |
| *Mám zkoušku v pondělí.* | zkouška | `exam` + `test` | "an exam on Monday" **and** "a test on Monday" |

**Two sentences I rewrote before shipping, for reasons no gate would have caught.** *Dostávám plat v pátek.* → **I get my salary on Friday** has no possessive in the Czech, so the prompt underdetermines its own answer; replaced with *Mám dobrý plat.* → **I have a good salary.** And *Chci skončit práci v pět* was stiff Czech; replaced with *Začínám pracovat v sedm.* → **I start work at seven.**

**Czech I am confident in but flagging for the review routine:**

- **Register: I used standard `Potřebuji` / `Pracuji`, where run 23's `a1_freetime` used colloquial `Potřebuju`.** Both are correct Czech; the course is now inconsistent across banks. This is a one-line convention call, and if you make it, it is a sweep rather than a per-run decision.
- `a1_work` — *Můj otec je řidič autobusu.* Genitive `autobusu` for "bus driver"; I believe this is the natural form over *autobusový řidič*.
- `a1_work` — *Můj manažer je na schůzce.* `na schůzce` reads as both "in a meeting" and "at a meeting"; both are in `accepts`.
- `a1_work` — *To je můj kolega.* `kolega` is masculine animate but declines like a feminine noun; nominative with `můj` is what I intend.
- `a1_school` — *Chci se učit anglicky.* Adverbial `anglicky` rather than accusative `angličtinu`; both are natural, the adverb is commoner in speech.
- `a1_school` — *Neznám to slovo.* `znát` with a bare noun object, following the review routine's own earlier fix to `a1_ideas` (*nevíte slovo* → *neznáte slovo*).
- `a1_school` — *Učebna je v prvním patře.* Locative `v prvním patře`.

Everything else — the accusatives (*práci, přestávku, schůzku, tužku, hodinu, zkoušku, otázku, větu*), the locatives (*v kanceláři, na schůzce*), and the adjective agreements (*zajímavá, dobrý, zajímavý*) — I am confident in.

### Sequencing — 150 → 148

Every A1 and A2 unit was sitting at exactly **one** unknown type, so "worst unit" was a tie; I took the two where the offending word is purely incidental to the gap and a taught word substitutes cleanly.

| Unit | Path | Was | Now | Gap kept |
|---|---|---|---|---|
| `trunk_glue_linkers_a1` | 47 | **Put** it into the bag. | **Look** into the bag. | `into` |
| `trunk_verbs_more2_a1` | 28 | I run **every day**. | I run **in the park**. | `run` |

`put` is taught at `trunk_verbs_action_a1` (path 49) — two steps too late; `look` at path 15. `day` is taught at `leaf_time_a1` (41); `park` at `leaf_places` (17). Both swaps are pure gain, and both units are now clean.

### Forks for James

**1 · Three A1/A2 violations I deliberately did NOT repair.** Each would have cost a teaching point, which the rules forbid:

- **`a1_to_for_with` / `wait`** — the pack's *own intro card* teaches `wait for = čekat na (chunk)`, and `wait for` appears in four places including a minimal-pair drill (*Wait for me.* vs *Wait to me.*). `wait` is taught at `a1_imperatives` (path 48) but this unit is path 43 — a **5-step running-order mismatch**, the same shape as run 23's `trunk_social_a1`/`help` finding. Cheapest real fix is a spine decision, which is yours: it is content-free.
- **`a1_word_order` / `new`** (3 occurrences) — the unit is **path 4**, and the course teaches **no attributive adjective before `trunk_adjectives_a1` at path 52**. `tired` is the only legal adjective in the whole pool and does not fit *a ___ phone*. Worth noting for its own sake: **`big`, `small`, `new`, `young` and `nice` all first appear at path 52**, so no bank or example anywhere in the first fifty steps can use a basic size/age adjective. That is a curriculum gap, not a pack defect.
- **`a1_articles` / `hour`** — already documented in the pack's own note as the deliberate silent-h example. Left alone.

**2 · `audit.py` counts 12 violations that are tokenizer artefacts, not teaching-order defects. Propose-only — I did not touch the gate.** A gate an agent can edit to lower its own number is not a ratchet, so this needs your word. Both are one-line fixes:

- **Contractions (5).** `GLUE` contains `let`, `'s`, `n't`, `it`, `is`, `i`, `am`, `would`, `have`, `not` — every part — but `WORD_RE = [a-z']+` makes `it's` a **single** token, so it never matches. Affected: `i'd` (`trunk_can_like_want_a1`), `it's` (`trunk_there_time_a1`), `i'm` (`trunk_chunks_a2`, `b1_modals_speculation`), `let's` (`b1_phrasal_verbs`). The practical cost is larger than 5: **`Let's` is currently unwritable in any sentence bank course-wide**, even though `lets_talk_about` is a declared carrier and "Let's talk about …" already appears as a frame on three intro pages. I hit this while authoring and routed around it.
- **Parenthesised disambiguators (7).** `targets_of()` strips `PARENS_RE` before recording what a unit *teaches*, but `exposed_text()` does **not** strip it before recording what a unit *shows*. So `watch (wrist)` exposes `wrist` and teaches only `watch` — the disambiguator becomes a permanent violation of a word the course never intended to use. Verified directly: for `a1_clothes`, `'wrist' in targets_of(...)` is `False` while `exposed_text` contains it. Affected: `time` (`leaf_freetime_a1`), `wrist` (`leaf_clothes_a1`), `height` (`leaf_body_a1`), `illness` (`leaf_health_a1`), `ordinal` (`leaf_time_a1`), `depart` (`leaf_travel_a2`), `extinguished` (`b1_phrasal_verbs`).

Together these are **12 of the 148**, and **7 of the 19** remaining at A1/A2 — so over a third of what still looks broken at A1/A2 is the audit misreading its own packs. Fixing both would drop the total to ~136 genuine violations and make the A1/A2 tail almost entirely real. Say the word and each is a one-line change plus a baseline re-tighten.

### To smoke-check

- The three new intro pages, especially **`a2_describing`'s `contrast` diagram** — it is the first time the schematic carries a full sentence-length idea in the sub-labels ("describes a thing" / "describes a person"), and I sized the labels to the box by hand, not by rendering.
- **`a2_home`'s 9-tile grid** — one short of the usual 10–12; check it does not look sparse next to `a2_shopping`'s 12.
- The `a1_work` and `a1_school` **Use** stages now that they exist — in particular that the widened `accepts` above really do let both right answers through.

---

## 2026-08-07 · cloud run 23 (RUE build, claude-opus-5)

### Headline: **3 A2 vocab intros (24 → 27), 2 more Use-stage sentence banks (`a1_freetime`, `a1_health` — leaf packs still missing one: 37 → 35), and 3 items re-lexified across 2 units (audit 153 → 150). All three gates green at the start, so step 0 did not consume the run.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `ed191e3` | **`a2_feelings`** intro — `contrast` schematic, 4 carrier frames |
| 2 | `27ae76f` | **`a2_work`** intro — 10 tiles, 5 frames |
| 3 | `8cf37dc` | **`a2_society`** intro — `branch` schematic, 5 frames |
| 4 | `ac2ac71` | **`a1_freetime`** `sentences[]` bank — 12 sentences, 14 lemmas |
| 5 | `6a28701` | **`a1_health`** `sentences[]` bank — 12 sentences, 12 lemmas |
| 6 | `b843c30` | `trunk_social_a1` re-lexified, 1 item — 2 types → **1** |
| 7 | `0c1d8ce` | `trunk_verbs_more3_a1` re-lexified, 2 items — 2 types → **0** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 153 unknown types · 40 units | **150** · 39 units · baseline tightened 153 → 150 |

Commit and push per unit, gates re-run before each. Nothing else pushed to `build` while I worked, so no rebase was needed.

> **Correction to four of this run's own commit messages.** I wrote the path
> positions in commits `ac2ac71`, `6a28701` and `b843c30` from a
> vocab-only index instead of the real interleaved path, so they understate
> every position: `leaf_freetime_a1` is path **12**, not 6; `leaf_health_a1`
> is **24**, not 22; `trunk_social_a1` is **5**, not 3; `help` arrives **two**
> steps after social, not one; `important` arrives **28** steps after health,
> not ten. `ac2ac71` also says 13 lemmas where the bank has **14**. The
> numbers in this digest entry are the recomputed ones and are what should be
> trusted. Nothing about the content decisions changes — every legality call
> was made by importing `audit.py` and asking it, not by counting steps — and
> the commits are already pushed, so they stand uncorrected rather than
> force-pushed.

---

### Vocab intros — 24 → 27

A1 leaves stay finished at 16/16. **A2 leaves: 8 → 11 of 22.** Built in path order (63, 65, 67).

| Unit | Page 1 | Trap | Why that shape |
|---|---|---|---|
| `a2_feelings` | `contrast` schematic, *angry \| kind* | Czech *Mám strach* is **have**, English *I am afraid* is **be** | AGENTS.md names Feelings as an abstract set, and the contrast is the pack's real organising principle — see below |
| `a2_work` | 10 tiles | *employer* vs *employee* | 10 honest tiles, not 12; the three I dropped are listed below |
| `a2_society` | `branch` schematic, root *state* → government · law · war · religion | *police* is plural in English | AGENTS.md names Society as an abstract set |

**`a2_feelings` took `contrast` rather than `scale`.** The obvious reading of a feelings pack is intensity (calm → nervous → afraid), which is what `scale` draws. I did not use it, because it would be a lie about this pack: 25 items and only about four of them sit on one intensity axis. What the pack actually splits into is adjectives that say how you feel *at this moment* (angry, nervous, excited, worried, confused) and adjectives that describe *the person* (kind, polite, honest, rude, serious) — same `I am …` frame, two different jobs, and that is a distinction a student needs before Match starts pairing them. `contrast` draws exactly that.

**`a2_work` — the three words I refused to give a tile.** The spec says 8–12 tiles that *genuinely carry meaning in a picture*, and run 22's precedent is that honest tiles beat a full grid:
- **`department`** — the obvious glyph is 🏬, which is a *department store*. Planting a false friend on the intro page of the unit that teaches the word is worse than leaving it off.
- **`wage`** — a second money glyph next to `salary` 💰 distinguishes neither, and the pack teaches them as different things (monthly *plat* vs hourly *mzda*).
- **`officer`** — 👮 is a police officer; this pack glosses the word *úředník / důstojník*. The glyph would fight the gloss.

The **work for / work in** split is in the body rather than in the note, because it is descriptive rather than a trap, and the page-2 frames then show it (`I work for …` / `I work in …`, both real declared carriers of this pack).

**Two defects in my own output, caught on the re-read off disk, not by any gate:**
1. `a2_feelings` body used the phrase *"what kind of person you are"* — in a pack where **`kind` is a tile word meaning laskavý**. Two senses of the same word in one paragraph, one of them the word being taught. Reworded to *"describe the person, not the moment"*.
2. `a2_feelings` `body_cz` read *"Skoro vše jsou přídavná jména…"* — *vše* is singular, *jsou* is plural. Now *"Skoro všechna tato slova jsou…"*.

**The frame check is now grounded in the real carrier ids rather than derived.** Run 20 noted there is no carrier-wording registry (fork still open). I built the inverse table from the 39 ids that actually occur in packs, and it immediately caught that **my derivation was wrong twice**: the id is `it_is`, not `it_is_adj`, and `the_bag_is` is a real id I would have rejected as invented. Run over all 24 existing intros, the check reports **exactly one break — `a1_home_family`'s `"This is my …"`**, which is the one run 20 already logged and deliberately left because you are smoking it. That is a useful independent confirmation that nothing else has drifted.

### Use-stage sentence banks — 2 more

Leaf packs without a bank: **37 → 35.** A1 leaves still without one: `leaf_time_a1`, `leaf_work_a1`, `leaf_school_a1`, `leaf_tech_a1`, `leaf_nature_a1`, `leaf_shopping_a1`, `leaf_ideas_a1` (7 left before A2 starts). Every sentence was checked against `audit.py`'s **own** `variants()` / `tokens_of()` / `GLUE`, by importing the module rather than reimplementing it, by a script that refuses to write.

**`a1_freetime` sits at path 12 — 415 legal tokens, the tightest bank yet.** At that position the only substantial noun source is `leaf_home_family` (path 10), so family subjects dominate the bank (mother, sister, brother). That is the pool, not a stylistic choice; the alternative was to write sentences the audit would reject.

**The carrier-vs-position finding now has a third and fourth instance, and they are worth reading together:**

| Pack | Path | Declares | Word actually taught at | Gap |
|---|---|---|---|---|
| `a1_food` (run 22) | 19 | `i_buy_a` ×14 | `leaf_shopping_a1`, path 44 | 25 steps |
| `a1_freetime` | 12 | `i_want_to` on **all 11 verbs** | `a1_like_want_need`, path 26 | 14 steps |
| `a1_health` | 24 | `is_important` on `health` | `trunk_adjectives_a1`, path 52 | 28 steps |

This is not a data bug and I have not touched the `use[]` tags. It is the consequence of the rule AGENTS.md already states — carriers name the frames a word *fits*, not frames legal at that word's position — and it is now reliable enough to plan around: **assume any carrier may be dead at any given position, and check before authoring rather than after.** One number for scale: `is_important` is declared **224 times** course-wide, but `important` is not taught until path 52, so every declaration below that point is unwritable.

**A collision I designed out rather than shipped:** `a1_health` glosses **both `ill` and `sick` as *nemocný***. Two prompts would have had two equally right answers with nothing to choose between them — the exact defect run 22 swept out of the older banks. One sentence (*Jsem nemocný.*) now carries both in `accepts`. Same reasoning kept the bank to a **single *Bolí mě …* prompt**: *Bolí mě hlava* → **I have a headache** and *Bolí mě břicho* → **My stomach hurts** are the same Czech construction asking for two different English shapes, so the second was dropped rather than written.

**Czech I am confident in but flagging for the review routine:**

- `a1_freetime` — *Mám rád fotbal.* and `a1_health` — *Jsem nemocný.* are **masculine-only**. The Czech is the prompt and the English is what is graded, so nothing is mis-graded; but a female student reads a sentence that is not about her. `a1_core_frames_be_have` solved this with *Jsem unavený. / Jsem unavená.* — **if you want that convention in the banks, say so and it is a sweep, not a per-run decision.**
- `a1_freetime` — *Potřebuju léky.* / *Dívám se na filmy doma.*: colloquial *potřebuju* and the spoken word order, deliberate, matching the *piju / tyhle* register calls of run 22.
- `a1_freetime` — *Oslava je u nás doma.* renders **The party is at our house.** *u nás doma* is closer to "at our place"; **at our home** is in `accepts`.
- `a1_health` — *Mám chřipku.* → **I have flu**, British and article-less. *I have the flu* is in `accepts`.
- `a1_health` — *Potřebujeme si odpočinout.* → **We need to rest.** Reflexive *si* + perfective *odpočinout*; I believe this is the natural form, but it is the only sentence in either bank with a clitic.
- `trunk_verbs_more3_a1` — *Chci se přidat k týmu.* replaced *Chci vstoupit do klubu.* *přidat se k* is the more natural collocation for joining a team than *vstoupit do*; both are correct.

Everything else — the accusatives (*hudbu, knihy, horečku, chřipku*), the locative *v kuchyni*, the genitive *do posilovny*, the instrumental *s rodinou*, and the adjective agreements (*šťastná, nudná, zdravý*) — I am confident in.

### Sequencing — 153 → 150

Both units were the joint-worst A1/A2 entries left (2 types each). **Nothing at A1 or A2 now carries more than one.**

| Unit | Path | Was | Now | Teaching point kept |
|---|---|---|---|---|
| `trunk_verbs_more3_a1` | 35 | I spend **money** on food. | I spend **time** with my family. | gap is still *spend* |
| | | I want to join the **club**. | I want to join the **team**. | gap is still *join* |
| `trunk_social_a1` | 5 | **Please help me.** | **Yes, please.** | gap is still *please* |

*money* is taught later (`leaf_shopping_a1`, path 44) and *club* **is never taught anywhere in the course**; *time* and *team* are both taught earlier, so both swaps are pure gain.

**The `trunk_social_a1` change is a frame move, not a word swap, and it deserves a look.** At path 5 the legal set is **238 tokens, of which only 32 are not GLUE** — the entire taught vocabulary is *adjective, bag, bags, books, brother, bye, car, cars, doctor, dogs, excuse, friend, friends, goodbye, hello, hi, house, meet, name, noun, phone, phones, pronoun, sorry, student, students, teacher, teachers, thank, thanks, tired, verb*. There is **no legal verb** that "Please ___ me." could take, so no word swap exists. *Yes, please.* keeps the gap on `please`, and is the commonest position the word occupies in spoken English. Nothing is lost course-wide: `help` is still taught two steps later at `trunk_verbs_daily_a1` (path 7).

**Which points at the cheaper fix, and it is yours, not mine.** The only reason `help` is illegal at `trunk_social_a1` is running order: social is the vocab side of the word-order step (path 5), `trunk_verbs_daily_a1` the vocab side of the present-simple step (path 7). **Swapping the vocab sides of those two spine steps would clear the violation with no content change at all** — and *Please help me.* is a better survival phrase than *Yes, please.* is. I did not do it: reordering the spine is a path decision and the run's lane is content. Say the word and it is a two-line edit to `data/spine.json`.

---

### Forks and judgment calls

**1. `nice` in "Nice to meet you." — left, logged, per the rule.** It is the last violation in `trunk_social_a1`. `nice` is not taught until `trunk_adjectives_a1` (path 52), and the item is a **fixed social formula** — there is no rewrite that keeps the teaching point, so per the standing prompt it is logged as a fork rather than dodged. **There is a legitimate one-line fix I did not take:** `audit.py`'s `targets_of()` reads an item's `lemma` field, so adding `"lemma": "nice"` to that item would make the pack teach the word and clear the violation. I did not, because it is a real pedagogical claim with downstream consequences — it tells every later unit that `nice` is available when the student has only ever met it inside one frozen phrase. **Conservative path taken: leave it. Your call whether chunk-taught words should count as taught.**

**2. Fork 1 (contraction / genitive tokenising) untouched, still yours.** Nothing this run needed a possessive-'s, so no new evidence. Run 22's recommendation stands: one rule in `variants()` stripping a trailing `'s` clears both the five contractions and the genitive block.

**3. Fork 2 (`a2_clothes`, `a2_home` schematic-or-emoji) untouched, still yours.** Both are still without an intro. I did **not** improvise an answer off the back of using schematics for feelings and society — those two are named in AGENTS.md as abstract sets, so the spec already decides them; clothes and home are concrete units with too few emoji, which is a different question and still open. **11 of 22 A2 leaves are done; those two are among the 11 remaining and will keep being skipped until you answer.**

**4. Repair queue: nothing processed, twelfth consecutive run.** Same three unticked items, all still blocked on you rather than on me — *vocab level badge* and *`order_click`* are both marked **engine work, cloud must not ship**, and `b2_clear_claims` is a style decision with the conservative path already taken. **The queue has still had no content item since it was created.** Three candidates from this run, all one-line-plus-judgment, which is the shape the cloud lane can actually close: the `'s` rule (fork 1), the schematic decision (fork 2), and the social/verbs_daily spine swap above.

**5. Czech-review "For James" items untouched, again.** `CZECH-REVIEW.md` now carries eight open items across four passes — the seven from run 22 plus the new `a1_clothes` *suit at work / do práce* pairing, where the Czech says *to work* and `accepts` only grades *at work*. That last one is an **English** fix (add the to-work form to `accepts`), so it is inside my lane the moment you say yes — but the rule is to act only once you have answered, and you have not.

**6. The 17 A1 `trunk_*` intros remain blocked on you — fifth run asking.** Core-frames packs hold 12 gap items, not a word list, so "8–12 tiles that carry meaning in a picture" does not describe them. **A1 vocab intros are 16/33 and will stay there until you say which page 1 the trunks get.** Noting it so the count is not read as neglect.

**7. Step 5 (new C1 unit) skipped, deliberately.** Steps 2–4 used their full per-run allowance (3 intros, 2 banks, 2 sequencing units — 7 commits), and both content backlogs outrank new units in the standing prompt. C1 remains the frontier, untouched.

### To smoke

- **`a2_feelings` page 1** is the first use of the `contrast` schematic outside a false-friend pair (`a1_home_family`'s home/house). It is being used for a *category* split, not a word pair — worth a look at whether the two-box drawing reads that way, or whether it looks like it is claiming *angry* and *kind* are opposites.
- **`a2_work` page 1 has two multi-codepoint emoji** (🧑‍💼 businessman, 🧑‍🤝‍🧑 team). If either renders as separate glyphs or a tofu box on your machine, say so and I will swap them for single-codepoint tiles.
- **`trunk_social_a1` item 6** now reads *Ano, prosím. → Yes, please.* — it sits two items away from *Ano. → Yes.*, and I would like to know the pair does not feel redundant in Match.

---

## 2026-08-07 · cloud run 22 (RUE build, claude-opus-5)

### Headline: **3 A2 vocab intros (21 → 24), 2 more Use-stage sentence banks (`a1_food`, `a1_clothes` — leaf packs still missing one: 39 → 37), 2 units re-lexified (audit 157 → 153), and run 21's requested Czech-collision sweep over the five existing banks, which found two real grading defects — one of them in run 21's own output.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `4393a62` | **`a2_routine`** intro — `cycle` schematic, 4 carrier frames |
| 2 | `0ed2947` | **`a2_family`** intro — 10 tiles, 5 frames |
| 3 | `e31b96f` | **`a2_freetime`** intro — 12 tiles, 5 frames |
| 4 | `2a5c1f3` | **`a1_food`** `sentences[]` bank — 12 sentences, 14 lemmas |
| 5 | `5efe53f` | **`a1_clothes`** `sentences[]` bank — 12 sentences, 13 lemmas |
| 6 | `eb700ea` | `a2_agreement` re-lexified, 2 items — 2 types → **0** |
| 7 | `8ebb981` | `trunk_glue_quantity_a1` re-lexified, 2 items — 2 types → **0** |
| 8 | `2926bb7` | **Czech-prompt collision sweep** over all 5 existing banks — 4 fixes |
| 9 | `d3aa516` | one defect in this run's own output, caught on re-read |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 157 unknown types · 42 units | **153** · 40 units · baseline tightened 157 → 155 → 153 |

All three green at the start, so step 0 did not consume the run. All three re-run before every commit; commit and push per unit. Nothing else pushed to `build` while I worked, so no rebase was needed.

---

### The collision sweep — run 21's ask, and what it found

Run 21 found that two Czech prompts in one bank can have the same right answer, and asked for a sweep. I read all 60 sentences in the five existing banks against their English. **Two real defects, both of which shipped through every machine gate:**

**1. `a1_places` — two identical Czech constructions, two different English shapes.**

- *Jezdím do školy autobusem.* → **I go to school by bus.**
- *Jezdím do práce vlakem.* → **I take the train to work.**

Same Czech frame, and the student is expected to produce a different English pattern for each with nothing in the prompt to signal which. The second is now **I go to work by train.**, with *I take the train to work* kept in `accepts`. (This is run 21's own sentence — it was rewritten late to dodge the untaught *want*, and the shape drifted away from its sibling.)

**2. `a1_body` — the leg/foot collision is still live in the singleton.** Run 21 removed one of the two *noha* sentences, but the survivor is *Moje noha je pod stolem.* → **My leg is under the table.** *My foot is under the table.* is an equally correct translation of that Czech and was being graded wrong. Added to `accepts`.

Plus two grading-fairness additions where both English forms are genuinely correct for the Czech, not a guess between them: *mapa města* accepts **city** or **town**, and *blond vlasy* accepts **blonde** or **blond**.

**Deliberately not "fixed":** *na stromě / na poli* → **in the tree / in the field** (`a1_animals`). Czech says *on*, English says *in*; that is a real preposition difference the unit should teach, not a grading bug, so adding *on the tree* to `accepts` would grade wrong English as right. **I also left the British spellings alone** — *grey* is accepted, *gray* is not, which matches the course's British stance (trousers, favourite, neighbour). Say the word if you want US spellings tolerated course-wide; it is a one-pass change, not a per-sentence one.

### Vocab intros — 21 → 24

A1 leaves stay finished at 16/16. **A2 leaves: 5 → 8 of 22.** Built in path order (54, 56, 60).

| Unit | Page 1 | Trap | Why that shape |
|---|---|---|---|
| `a2_routine` | `cycle` schematic, labels *daily · regular · usual · habit* | *už* = **already** and **yet** | see the judgment call below |
| `a2_family` | 10 tiles | *character* = **povaha** and **postava** | *sir* and *owner* left off rather than given a stretched glyph — 10 honest tiles beat 12 with two lies in them |
| `a2_freetime` | 12 tiles | *cena* = **price** and **prize** | the pack is watch/read + make + go + win; the tiles take one from each group |

The `a2_freetime` trap is the one I would most like you to look at. Czech *cena* covers both English words, they differ by one letter, and *price* is already taught at `leaf_shopping_a1` — so the student has both halves and no reason to have noticed they are different words.

I kept run 20's refuse-to-write authoring script and its two checks (tile `cz` must be the item's own `cz` or one of its `/`- or parens-variants; every page-2 frame must name a carrier id an item in that pack actually declares), and re-read all three files off disk afterwards. **That re-read caught one defect in my own output**: `a2_routine`'s already/yet note explained *already* with **"I have already eaten"** — present perfect, which is not taught until path 61, seven steps after this unit. Reworded to a present-simple statement and a short-answer negative (`d3aa516`).

### Use-stage sentence banks — 2 more

Leaf packs without a bank: **39 → 37.** Pool regenerated with `--before <node>` for each; every sentence checked against `audit.py`'s own `variants()`/`tokens_of()`/`GLUE` by a script that refuses to write rather than reporting.

**The pool check earned its keep twice more, and one of them is a new failure mode.**

- At `leaf_food_a1` (path 18): the pack declares `i_buy_a` on 14 of its items, but **buy is not taught until `leaf_shopping_a1` at path 43**. Same shape as run 21's *want* finding — a pack's own carriers are frames the word *fits*, not frames legal at that position. Two carriers of this pack (`i_buy_a`, `i_want_to`) are unwritable here; sentences use *need / have / eat* instead.
- At `leaf_clothes_a1` (path 20): **`This is my father's shirt.` was refused.** `audit.py`'s `WORD_RE` is `[a-z']+`, so it tokenises **father's** as one word — and the only genitive forms in the pool are the literal `gap_answer`s of `a1_possessives` (*teacher's*, *ondrej's*, *homare's*). **Every possessive-'s noun in the course is unwritable outside that one pack.** This is the same tokenising fork you already have open as fork 1 (contractions); the genitive is its second, larger half. Rewritten as *My father needs a shirt.* — but see fork 1 below, because this one bites content, not just the count.

**Two sets of Czech I deliberately did not use as Use targets**, on the run-21 collision rule: **shoe / boot** (both *bota*, disambiguated only by the pack's parenthesised gloss) and **hat / cap** (*klobouk / čepice* — the pack glosses *hat* as both). Neither can carry a prompt with one right answer. Both words are still taught in Match and Type; they are just not production targets.

**Czech I am confident in but flagging for the review routine:**

- `a1_food` — *Tento dort je výborný.* *Ten dort…* is the more colloquial demonstrative; *tento* is a shade formal for A1 speech. Either is correct.
- `a1_food` — *Piju kávu v práci.* Colloquial *piju* over standard *piji*, deliberately, to match how the course speaks elsewhere.
- `a1_food` — *Snídám doma.* renders **I have breakfast at home** — one Czech verb against an English noun phrase. *I eat breakfast at home* is in `accepts`.
- `a1_clothes` — *Tyhle kalhoty se mi nelíbí.* Spoken *tyhle* rather than written *tyto*. Same register call as above.
- `a1_clothes` — *Moje sestra má hezké šaty.* → **dress**. In older or formal Czech *šaty* can read as *clothes* generally; sentence 1 of the same bank uses *oblečení* for clothes, so the pair should hold, but it is the weakest disambiguation in either bank.
- `a2_family` intro tile — *kid* = **dítě**, dropping the pack's own *(hovor.)* marker from the tile; the page body carries the register point in prose instead.

Everything else — the locatives (*na stole, v ložnici, na židli, v práci, v kuchyni*), the accusatives (*košili, polévku, nůž a vidličku, rybu, deštník*), *Mám hlad / má žízeň*, and the *do práce / do školy* directionals — I am confident in.

### Sequencing — 157 → 153

Both units were the joint-worst A1/A2 entries left (2 unknown types each). **Nothing at A1 or A2 now carries more than two.**

| Unit | Was | Now | Teaching point kept |
|---|---|---|---|
| `a2_agreement` (path 55) | **Nobody** knows the answer. | **No one** knows the answer. | indefinite pronoun → 3sg *knows* |
| | One of my friends lives **abroad**. | One of my friends lives **in Prague**. | *one of…* → singular *lives* |
| `trunk_glue_quantity_a1` (38) | I don't have any **money**. | I don't have any **water**. | gap is still *any* |
| | Something is **wrong**. | Something is **on the table**. | gap is still *Something* |

*nobody* is untaught but **no one** is two GLUE words, so the swap costs nothing and the item still teaches exactly what it taught; *Nobody knows the answer.* stays in `accepts` so the natural answer passes. The *money → water* swap is a small gain beyond the count: item 0 is *I have some water.*, so the two now sit as a some/any minimal pair on one noun — the same shape run 21 built with *friends*.

---

### Forks and judgment calls

**1. Fork 1 (contraction tokenising) is bigger than it looked — it now blocks content, not just the count.** Run 21 logged five contractions the audit cannot match. The same `WORD_RE` also makes **every possessive genitive unwritable**: *father's*, *sister's*, *mother's* are single tokens that appear in no pool, so a Use sentence cannot say *my father's shirt* anywhere in the course except inside `a1_possessives` itself. That is a real expressive loss in exactly the A1 packs (family, clothes, home) where the genitive is the natural phrasing. **Conservative path taken: content rewritten around it, `audit.py` untouched.** The honest fix is one rule — strip a trailing `'s` in `variants()` before lookup — which would both clear the five contractions and unblock the genitive. It changes what the ratchet measures, so it stays your call; I would take it.

**2. `a2_routine` was built as an abstract set, NOT as a fork-2 case.** Fork 2 (`a2_clothes`, `a2_home`) is about *concrete* units with too few emoji, and it is still yours to answer — I did not touch either. `a2_routine` is different in kind: *habit, lifestyle, daily, regular, usual, already, yet, still, bit* are frequency and time words, which is what AGENTS.md means by an abstract set, and the spec already answers those ("Ideas, Feelings, Society take a schematic"). So it took `cycle`, labelled with the pack's own four adjectives. **If you read routine as a fork-2 case instead, it is a one-page change** — but improvising a schematic answer for `a2_clothes`/`a2_home` off the back of it is exactly what I did not do.

**3. Repair queue: nothing processed, eleventh consecutive run.** Same three unticked items, all still blocked on you, not on me: *vocab level badge* and *`order_click`* are both marked **engine work, cloud must not ship**, and `b2_clear_claims` is a style decision with the conservative path already taken. **The queue has had no content item since it was created.** Two candidates from this run if you want one: the `'s` tokenising rule (fork 1) and the schematic decision (fork 2) — both are one-line-plus-judgment, which is the shape the cloud lane can actually close.

**4. Czech-review "For James" items untouched, again.** `CZECH-REVIEW.md` now carries seven open items across three passes (`a1_shopping` *otevřený/zavřeno*, `a1_food` *nepočitatelná jídla*, `a1_health` *špatně (mi je)*, `b1_work` *podnikající na sebe*, `a2_food` *vegetariánský* and *hranolka*, plus the run-21 smartphone fix which is already applied). The rule is to act only once you have answered them; you have not, so I did not.

**5. Step 5 (new C1 unit) skipped, deliberately.** Steps 2–4 plus the collision sweep filled the run — 9 commits — and both content backlogs outrank new units in the standing prompt. C1 remains the frontier, untouched.

**6. The 17 A1 `trunk_*` intros remain blocked on you — fourth run asking.** Core-frames packs hold 12 gap items, not a word list, so "8–12 tiles that carry meaning in a picture" does not describe them. **A1 vocab intros are 16/33 and will stay there until you say which page 1 the trunks get.** Noting it so the count is not read as neglect.

### Smoke-check list

- **`leaf_places` Use stage** — the changed sentence: *Jezdím do práce vlakem.* now wants **I go to work by train.** It should now feel like the same task as the bus sentence two rows up. This is the one place I overwrote an earlier run's authored English.
- **`leaf_freetime_a2` intro page 2** — the *price / prize* note. If that trap lands, the same shape is worth repeating; Czech has several of these one-letter English pairs.
- **`leaf_routine_a2` intro page 1** — the second `cycle` schematic in the course and the first A2 one. Does *daily · regular · usual · habit* on a loop actually read as "how often", or does it just look like four words on a circle?
- **`leaf_food_a1` / `leaf_clothes_a1` Use stages** — the two new banks, 24 sentences. Particularly *Účet, prosím.* → **The bill, please.**, the only bare-phrase item in either bank.
- **`trunk_glue_quantity_a1`** — items 0 and 1 are now a some/any pair on *water*; check they read as a pair and not as a repeat.

---

### Headline: **3 A2 vocab intros (18 → 21), 2 more Use-stage sentence banks (`a1_body`, `a1_places` — leaf packs still missing one: 41 → 39), and 2 A1 grammar units re-lexified (audit 160 → 157). One of my own sentences was ungradeable and I caught it only on the re-read pass — details below, it is the interesting bit of this run.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `74a4182` | **`a2_travel`** picture-led intro — 12 tiles, 5 carrier frames |
| 2 | `ac022e0` | **`a2_sports`** picture-led intro — 12 tiles, 5 frames |
| 3 | `22f38d0` | **`a2_tech`** picture-led intro — 12 tiles, 5 frames |
| 4 | `1740c7a` | **`a1_body`** `sentences[]` bank — 12 sentences |
| 5 | `736ee26` | **`a1_places`** `sentences[]` bank — 12 sentences, 23 lemmas |
| 6 | `17e9e46` | `a1_question_words` re-lexified, 2 items — 2 types → **0** |
| 7 | `987e6a5` | `a1_some_any` re-lexified, 2 items — audit 158 → **157** |
| 8 | `dcda75e` | three defects in this run's own output, caught on re-reading |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 160 unknown types · 43 units | **157** · 42 units · baseline tightened 160 → 158 → 157 |

All three green at the start, so step 0 did not consume the run. All three re-run before every commit. Commit and push per unit; no rebase needed this run (nothing else pushed to `build` while I worked).

---

### The defect worth reading: two Czech prompts, one answer

`a1_body`'s bank shipped with both

- *Moje noha je pod stolem.* → **My leg is under the table.**
- *Moje noha je v botě.* → **My foot is in my shoe.**

**leg and foot are both *noha*.** The Use stage grades free-typed English against `accepts`, so a student reading the second prompt has no way to know the answer is *foot* and not *leg* — and typing *leg* is marked wrong for a word they translated correctly. Every machine gate passed it: `verify_pack` checks shape, `check_playable` checks the grammar ladder, and the audit checks the English against the pool. **Nothing in the toolchain looks at whether two Czech prompts collide.**

Replaced with *Spím na zádech.* → **I sleep on my back.** (*záda* is unambiguous). `foot` is still taught in Match/Type — it just is not a Use target.

I only found it because I re-read all five files off disk after committing rather than trusting the write. Two smaller things came out of the same pass: `a2_tech`'s `note_cz` mixed a neuter noun with a feminine pronoun (*myš, zvíře i ta u počítače* → *myš zvířecí i počítačová*), and `a2_sports`' body said *"the places they do them"*. All three in `dcda75e`.

**This generalises past this run.** Czech is a smaller vocabulary than English in exactly the places A1 body/family/places packs live — *noha* = leg + foot, *ruka* = hand + arm, *město* = city + town, *cesta* = trip + journey + road + way. Any bank drawing two sentences from a collision pair has the same bug. I did not sweep the existing banks for it this run; **that sweep is a good first item for a future run, or for the Czech-review routine if you would rather it lived there.**

### Vocab intros — 18 → 21

A1 leaves stay finished at 16/16. **A2 leaves: 2 → 5 of 22.**

| Unit | Tiles | Trap | Why that shape |
|---|---|---|---|
| `a2_travel` | 12: what you carry, how you get there, what you go to see | *trip / journey / travel* — all *cesta* | the pack's biggest group is places, so the body says so and page 2 leads with **Where is the …?** |
| `a2_sports` | 12: ten sports + runner + stadium | *football* is *soccer* in the USA | body explains the `-ing` sport vs bare-noun equipment split (*skiing* the sport, *ski* the thing on your foot) — that pattern is most of the pack |
| `a2_tech` | 12: hardware and screen objects | *mouse* — the animal from `leaf_animals_a1` and the one on the desk | the abstract half (*data, media, technology, code*) stays off page 1 deliberately |

**`a2_home` was planned as this run's third unit and dropped after reading it.** Of 39 items the picture-able ones are *sofa, mirror, lift, bin, lock, housework, washing* — seven, against a floor of eight, because the unit is mostly building parts (*ceiling, roof, basement, balcony, stairs, hall*) that have no emoji and would need stretched stand-ins. Same call run 20 made on `a2_clothes`. `a2_tech` took its slot. **Two A2 units are now blocked on the same question** — see fork 2.

I kept run 20's refuse-to-write authoring script and its two checks (tile `cz` must match the item's own `cz` or one of its `/`-variants; every page-2 frame must name a carrier id an item in that pack actually declares), and re-read all three written files independently afterwards.

### Use-stage sentence banks — 2 more

Leaf packs without a bank: **41 → 39.**

Pool regenerated with `--before <node>` for each, and every sentence checked with `audit.py`'s own `variants()`/`tokens_of()`/`GLUE` before writing — the script refuses to write rather than reporting.

**That check earned its keep again.** At `leaf_places` (path position 16, pool only 252 targets) I wrote *"I want to take the train."* — and **want is not taught until `a1_like_want_need` at position 25**, even though the pack itself declares the `i_want_to` carrier on four items. The carriers are curated as *frames these words fit*, not as *frames legal at this position*; where a unit sits early on the path, some of its own carriers are not yet writable. Became *"I take the train to work."* Worth knowing before the next early-position bank.

`a1_body` was constrained differently: **no plural *teeth* or *feet***. The audit reaches *tooth*/*foot* from neither (its `IRREGULAR` table covers verbs only, and suffix-stripping cannot get there), so those plurals read as untaught. Singular throughout. Colour words are also out — `leaf_colours_a1` is later on the path than `leaf_body_a1`.

**Czech I am confident in but flagging for the review routine:**

- `a1_body` — *"Slyším ušima."* Instrumental dual, correct, but bare; *"Slyším svýma ušima."* is also said. I took the shorter one.
- `a1_body` — *"Mám na hlavě čepici."* renders *hat*, and the pack glosses *hat* = "klobouk / čepice", so *čepice* is licensed — but a student who learned *klobouk* may produce *hat* less readily from *čepici*. Deliberate: *čepice* is the everyday word.
- `a1_places` — *"V pátek jdeme do kina."* English *"We go to the cinema on Friday"* is habitual-or-single; *jdeme* commits to the single occasion. *Chodíme* would be the habitual read. Either is defensible from the English.
- `a1_places` — *"Šťastnou cestu!"* for *"Have a good trip!"* — idiom for idiom rather than word for word, which I think is right here.
- `a1_places` — *"Supermarket je blízko mého domu."* Genitive after *blízko* is correct; *"kousek od mého domu"* is more colloquial.

Everything else — the locatives (*v bance, na rameni, na zádech*), genitives after *vedle / do / blízko* (*divadla, kina, školy, mého domu*), instrumentals (*autobusem, vlakem, muzeem, ušima*), and the accusative animate plural in *"On nemá žádné kamarády."* — I am confident in.

### Sequencing — two A1 grammar units

Both are the worst A1/A2 entries left in the report; nothing at A1 or A2 now carries more than two unknown types.

| Unit | Was | Now | Gap kept |
|---|---|---|---|
| `a1_question_words` (path 15) | What do you **want**? | What do you **need**? | still `What` |
| | When does the film **start**? | When does the film **begin**? | still `When` |
| `a1_some_any` (path 37) | He doesn't have any **money**. | He doesn't have any **friends**. | still `any` |
| | She has some **money**. | She has some **chocolate**. | still `some` |

*want* is first taught at path 25 and *start* at 29; *money* at `leaf_shopping_a1`, path 43. The `friends` swap is a small gain beyond the audit: item 3 of the same pack is *"She has some friends here."*, so the two now sit as a + / − pair on one noun, which is what the unit is teaching.

**`haven't` (item 19, "I haven't got any ideas.") was left alone deliberately** — see fork 1.

---

### Forks and judgment calls

**1. New fork: five "unknown" words at A1 are contraction-tokenising, not content.** `haven't` (`a1_some_any`), `it's×2` (`trunk_there_time_a1`), `i'd` (`trunk_can_like_want_a1`), `i'm` (`trunk_chunks_a2`), `let's` (`b1_phrasal_verbs`). `audit.py`'s `WORD_RE` is `[a-z']+`, so it keeps a contraction whole, while `GLUE` lists the pieces (`n't`, `have`, `it`, `is`) separately — the word can never match. Rewriting the content to dodge these would delete real teaching points: *"I haven't got any ideas."* **is** the British *have got* pattern the item exists to show. **Conservative path taken: content untouched, all five left standing in the audit.** The honest fix is one line in `GLUE` — but that would drop the total by ~6 across units I have not otherwise touched, which changes what the ratchet has been measuring, so it is your call, not mine.

**2. Two A2 units want a schematic, not emoji — same question, now twice.** Run 20 flagged `a2_clothes` (only 3 of 12 items picture honestly; its teaching heart is *smart* vs *casual*, which wants `contrast`). This run adds **`a2_home`**: seven picture-able items against a floor of eight, because the unit is building parts. My read is `a2_clothes` → `contrast` labelled smart/casual, and `a2_home` → `circles` or `branch` labelled *outside / inside / the room / the thing in it*. **Both left unbuilt.** One word from you and they are quick; improvising two different answers to the same question is how the A2 set ends up inconsistent.

**3. The 17 A1 `trunk_*` intros are still blocked on you — third run asking.** Core-frames packs hold 12 gap items rather than a word list, so *"8–12 tiles that carry meaning in a picture"* does not describe them. **A1 vocab intros are 16/33 and will stay there until you say which page 1 the trunks get.** Unchanged from run 20; noting it so the count is not read as neglect.

**4. Repair queue: nothing processed, tenth consecutive run.** Same three unticked items. *Vocab level badge* and *`order_click`* are both marked **engine work, cloud must not ship**; `b2_clear_claims` is a style decision reserved for you with the conservative path already taken. **If you want the cloud lane doing repair work, the queue needs a content item.**

**5. Step 5 (new C1 unit) skipped, deliberately.** Steps 1–4 filled the run — 3 intros, 2 banks, 2 sequencing repairs, 8 commits — and both content backlogs outrank new units in the standing prompt. C1 remains the frontier, untouched.

**6. Czech-review "For James" items untouched.** `CZECH-REVIEW.md` carries four open items (`a1_shopping` *otevřený/zavřeno*, `a1_food` *nepočitatelná jídla*, `a1_health` *špatně (mi je)*, `b1_work` *podnikající na sebe*). The rule is to act only once you have answered them; you have not, so I did not.

### Smoke-check list

- **`leaf_body_a1` Use stage** — specifically that no two Czech prompts in a bank can be answered by two different English words. This bank shipped with that bug for three commits. If you see the pattern anywhere else, it is worth a gate rather than a habit.
- **`leaf_travel_a2` intro page 1** — the *passport* tile uses 🛂, which is strictly the passport-control glyph. Closest honest emoji; tell me if it reads as wrong.
- **`leaf_sports_a2` / `leaf_tech_a2` intros** — the second and third A2 intros with a full 12 tiles. `a2_tech`'s trap points back to `leaf_animals_a1` (*mouse*), which is the first intro note to cross-reference an earlier unit by name.
- **`leaf_places` Use stage** — *"Have a good trip!"* is the only idiom-for-idiom pair in either bank (*Šťastnou cestu!*).
- The four re-lexified grammar items, especially **`He doesn't have any friends.`** sitting against item 3's `She has some friends here.`

---

## 2026-08-07 · cloud run 20 (RUE build, claude-opus-5)

### Headline: **3 vocab intros (15 → 18), the first two Use-stage sentence banks since your template (`a1_colours`, `a1_animals`), and two more A1 grammar units re-lexified to zero (audit 164 → 160). Run 19's claim that "all A1 vocab leaves now have intros" was wrong — `leaf_time_a1` was still bare, and it is the first thing this run fixed.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `cd5a61f` | **`a1_time_numbers`** picture-led intro — 12 tiles, 5 carrier frames |
| 2 | `9d42997` | **`a2_nature`** picture-led intro — 10 tiles, 4 frames (first A2 intro) |
| 3 | `c9dc3ae` | **`a2_food`** picture-led intro — 12 tiles, 4 frames |
| 4 | `66d73b7` | **`a1_colours`** `sentences[]` bank — 12 sentences |
| 5 | `c459038` | **`a1_animals`** `sentences[]` bank — 12 sentences |
| 6 | `1ec7bfb` | `a1_there_is` re-lexified, 2 items — 2 types → **0** |
| 7 | `c3634f6` | `a1_can` re-lexified, 2 items — 2 types → **0** |
| 8 | `da971b2` | `codex/__pycache__` untracked + `.gitignore` (raised runs 18, 19) |
| 9 | `2a60865` | two Czech phrasings in this run's own intros, caught on re-read |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 85 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 164 unknown types · 45 units | **160** · 43 units · baseline tightened 164 → 162 → 160 |

All three green at the start of the run, so step 0 did not consume it. All three re-run green before every commit, and again after the mid-run rebase. Commit and push per unit.

Your Czech-review routine pushed `7209558` mid-run; my five commits were rejected, so I fetched, rebased, **re-ran all three gates on the rebased tree** (0 / 0 / 164 vs baseline 164) and pushed again. No conflicts — it touched `CZECH-REVIEW.md` and two B1 packs, I touched A1/A2 packs.

---

### Correction to run 19: `leaf_time_a1` was not done

Run 19's digest says *"The four A1 leaves are now finished; everything left at A1 is a `trunk_*` core-frames unit."* **That is false.** `leaf_time_a1` (`a1_time_numbers`, 84 items) is a leaf, was live, and had no intro. I found it by enumerating the registry rather than trusting the digest, which is the only reason it did not sit unnoticed for another eight runs.

Worth knowing because the same sentence would have told the next run to skip A1 entirely.

### Vocab intros — 15 → 18

**A1 is now genuinely finished at leaf level: 16 of 16.** A2 starts at 2 of 25.

| Unit | Tiles | Trap | Why that shape |
|---|---|---|---|
| `a1_time_numbers` | 12: number keycaps, four parts of a day, clock units | `soon` vs `early` — both *brzy* | days and months are **deliberately absent**; no picture says Monday, and the body says so rather than shipping a stretched emoji |
| `a2_nature` | 10 | Czech *měsíc* = **moon** and **month** | month is already taught in `a1_time_numbers`, so the trap contrasts two words the student has both met |
| `a2_food` | 12 | `soap` = mýdlo, not `soup` | also explains why *soap* is sitting in a food unit at all; `soup` is taught in `a1_food` |

**Words I refused to picture rather than stretch:** *climate, environment, ocean, valley, grass, ground, rock, season* (a2_nature) and *oil, jam, cream, sauce, recipe* (a2_food). An ocean and a planet compete for the same emoji; an olive reads as an olive and a honey pot as honey. `a2_nature` therefore ships **10 tiles, not 12** — within the 8–12 band, and I would rather be at the bottom of the band than pad it.

I kept run 18/19's authoring script and added checks: a tile's `cz` must match the item's own `cz` (or one of its `/`-separated variants), and **every page-2 frame must name a carrier id that an item in that pack actually declares** — which is the rule run 19 found `a1_home_family` itself breaking. The script refuses to write rather than reporting a problem, and I re-read all three written files independently afterwards.

### Use-stage sentence banks — the first two

Leaf packs without a bank: **43 → 41.** (The 45 figure in the prompt counts leaves; the 22 `practice: "frames"` trunks drive Use from `block.items` and need no bank.)

Because your `exposed_text` change means the audit reads these, I generated the pool with `--before <node>` **first** and checked every sentence against it mechanically, reusing `audit.py`'s own `variants()`/`tokens_of()`/`GLUE` rather than re-implementing the rule.

**That check changed the content, and I would not have caught it by eye.** At `leaf_animals_a1`, the words `big`, `small`, `black` and `white` are all taught *later* on the path — so the obvious sentence "The elephant is a big animal" is illegal, and the bank describes what animals *do* instead ("The cow drinks water", "The cat sees a mouse"). `a1_colours` sits after almost everything, so its nouns were free; `a1_animals` was genuinely constrained.

Shapes came from each pack's `use[]` carriers. `a1_colours` declares only two (`it_is`, `the_bag_is`), so all twelve sentences are *X is COLOUR* varied by subject — that is the honest read of the carriers, not a shortcut.

**Czech I am confident in but flagging for the review routine:**

- `a1_animals` — *"Prase žere chleba."* **žrát** is the correct verb for an animal eating, but it is blunt; *jí* is softer and also defensible. Register call, not a grammar call.
- `a1_colours` — *"Ta taška je růžová."* The demonstrative renders English *the*; without it (*"Taška je růžová."*) is also natural. I kept *ta* because the sentence is pointing at a thing.
- `a1_colours` — *"Jakou barvu má tvoje auto?"* vs *"Jaké barvy je tvoje auto?"* Both are used; I took the accusative one as the more everyday.
- `a1_animals` — *"Vidím v zoo slona."* Word order puts the place first; *"Vidím slona v zoo."* is equally correct.

Everything else — the gender agreement across all twelve colour sentences (*jablko je červené* n · *strom je zelený* m · *kočka je černá* f · *vlasy / mraky / šaty jsou -é* pl) and the accusative animates in `a1_animals` (*psa, ptáka, slona, králíka*) — I am confident in.

### Sequencing — two more A1 grammar units to zero

| Unit | Was | Now | Gap |
|---|---|---|---|
| `a1_there_is` | There is a **cat** under the chair. | There is a **bag** under the chair. | still `is` |
| | There is a **dog** in the garden. | There is a **table** in the garden. | still `is` |
| `a1_can` | You can **use** my phone. | You can **take** my phone. | still `can` |
| | We can't go **now**. | We can't go **home**. | still `can't` |

No teaching point deleted, no gap moved, every item kept in its original cluster. **`cat` and `dog` are taught by `leaf_animals_a1`, and `now` by `leaf_time_a1` — both units I authored content for earlier in this same run**, and both sit *later* on the path than the grammar units that were using their words. Exactly the ordering failure the audit exists to catch, invisible to anyone reading either pack alone.

One Czech change is a frame change, not a word swap: *použít* takes a bare accusative, *vzít* takes the reflexive — *"Můžeš si vzít můj telefon."* Swapping the verb without swapping the frame would have shipped wrong Czech past all three gates, which check neither.

Committed separately with the audit artefacts regenerated for each, so the ratchet has an honest intermediate state (164 → 162 → 160).

---

### Forks and judgment calls

**1. The 17 A1 `trunk_*` intros are still blocked on you — second run asking.** Run 19 flagged that core-frames packs hold 12 gap items rather than a word list, so *"8–12 tiles that carry meaning in a picture"* does not describe them. That is still true and I did **not** improvise a shape. Instead I finished the last A1 leaf and moved to A2 leaves, where the spec applies exactly. **A1 vocab intros are therefore 16/33, and will stay there until you say which page 1 the trunks get** — schematic, plain frame table, or something else. Improvising per-unit would give you 17 inconsistent intros, which is worse than 17 missing ones.

**2. New fork: `a2_clothes` cannot take an emoji page 1.** I planned it as one of this run's units and dropped it after reading the pack. Of its 12 items only *glove, ring, pants* picture honestly — *belt* and *button* have no emoji at all, *jumper*'s nearest emoji is a coat, and *fashion / clothing / smart / casual* are abstract. That is 3 tiles against a floor of 8. **My read is that it wants a `contrast` schematic labelled smart / casual**, which is the pack's actual teaching heart, but that is a shape call on a unit type (a small A2 leaf that is mostly abstract) that has no precedent yet. Conservative path: left unbuilt, flagged here. Say the word and it is a ten-minute unit.

**3. Repair queue: nothing processed, ninth consecutive run.** Same three unticked items, same reasons — *vocab level badge* and *`order_click`* are both marked **engine work, cloud must not ship**, and `b2_clear_claims` is a style decision reserved for you with the conservative path already taken. **Step 1 has been a no-op every hour since run 12.** If you want the cloud lane doing repair work, the queue needs an item that is content, not shell.

**4. I actioned the `__pycache__` churn this time rather than raising it a third time.** Runs 18 and 19 both reverted it by hand and logged it; I reverted it four times before deciding that was silly. `.gitignore` + `git rm --cached`, nothing in the app reads it, Python regenerates it on demand. **This is the one thing this run touched that is not content**, and it is one `git revert` away if you disagree. My reasoning: with four lanes now pushing to `build`, a tracked file that every single run rewrites with different bytes is a merge conflict waiting to happen for zero benefit.

**5. Step 5 (new C1 unit) skipped, deliberately.** Steps 1–4 filled the run: 3 intros, 2 banks, 2 sequencing repairs, 9 commits. A C1 pack is 48 items authored directly and verified, and the standing rule is that a half-done unit is worse than no unit. Both content backlogs also outrank new units in the current prompt. C1 remains the frontier and is untouched this run.

**6. Two Czech fixes to my own output, caught on re-reading, not by any gate** (`2a60865`). `a2_food`'s `title_cz` said *"Jídlo, vaření a jídlo venku"* — *jídlo* twice in one line. `a1_time_numbers`' `body_cz` had *"ty se naučíte v Match"* instead of the natural clitic order *"naučíte se je v Match"*. Noting these because they are the class of error nothing mechanical will ever catch, and both were mine from forty minutes earlier in the same run.

### Smoke-check list

- **`leaf_time_a1`** — the last A1 leaf to get an intro. Check the body's claim that days and months are absent on purpose reads as deliberate rather than as a gap.
- **`leaf_nature_a2` / `leaf_food_a2`** — the first two A2 intros. `a2_nature` has **10** tiles where every other unit has 12; tell me if that reads as thin or as honest.
- **`leaf_colours_a1` and `leaf_animals_a1` Use stages** — the first two banks after your template. These are the first non-template sentences the audit has ever policed; the `a1_animals` bank in particular is shaped by what was *not* available at that position.
- The four re-lexified grammar items, especially **`Můžeš si vzít můj telefon.`** (reflexive *si*, which the old *použít* did not take).

---

## 2026-08-07 · cloud run 19 (RUE build, claude-opus-5)

### Headline: **4 more A1 vocab intros (11 → 15 of 30), the two worst A1/A2 sequencing units repaired to zero (audit 169 → 164), and `c1_spoken_vs_written` built — the first C1 node in three runs whose scope was NOT already owned. Your `sentences[]` commit landed mid-run and I rebased onto it; all three gates re-run green after the rebase.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `397ba9c` | **`a1_freetime`** picture-led intro — 12 emoji tiles, 5 carrier frames |
| 2 | `930b063` | **`a1_health`** picture-led intro — 12 tiles, 5 frames |
| 3 | `545ba23` | **`a1_shopping`** picture-led intro — 12 tiles, 5 frames |
| 4 | `fc09a8c` | **`a1_work`** picture-led intro — 12 tiles, 5 frames |
| 5 | `eaebb86` | `trunk_glue_questions_a1` re-lexified, 3 items — 3 types → **0** |
| 6 | `ac64a7f` | `a1_object_pronouns` re-lexified, 3 items — 3 occurrences → **0** |
| 7 | `bff1dce` | **`c1_spoken_vs_written`** built + live — 48 items, **0 pool violations** |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 84 live grammar units · 0 errors · 1 warning | **85 units · 0 errors · 1 warning** |
| `audit` | 169 unknown types · 47 units | **164** · 45 units · baseline tightened 169 → 166 → 164 |

Net **−5** unknown types while adding 48 new items. The C1 unit is **100 % pool-clean**: live-unit count goes 151 → 152 with the total unchanged at 164. All three gates green before every commit; commit and push per unit.

---

### Your `sentences[]` commit arrived mid-run (`5570017`)

My C1 commit was rejected on push, so I fetched, rebased onto `5570017`, **re-ran all three gates on the rebased tree** (green: 0 / 0 / 164 vs baseline 164) and pushed again. No conflicts — you touched vocab packs and `audit.py`/`verify_pack.py`, I touched a grammar pack and the node registry.

**I have read the decision and taken no action on it this run**, because the standing prompt still ranks the intro backlog above new content and I had not seen your commit when I planned the run. Next run I will need you to tell me which wins: **45 units of `Use — coming soon` versus 15 remaining A1/A2 intros.** My read is that the `sentences[]` banks are worth more per unit — an empty stage is a visibly broken promise, an absent intro is only an abrupt start — but that is a curriculum call and it is yours. Say the word in `REPAIR-QUEUE.md` and I will switch.

Two things I noticed while rebasing, neither actioned: your `exposed_text` change means a `sentences[]` bank is now audited, so **any bank I author has to come out of `make_pool.py --before <node>` like everything else** — which for an A1 leaf is a very thin pool, and the sentences will have to be correspondingly plain. And `a1_home_family` now carries both a `sentences[]` bank and the intro I have been copying as the emoji template, so it is the right file to look at for the shape of both.

---

### Vocab intros — 4 more, all emoji, none needed a schematic

Live vocab units with an intro: **11 → 15**. Remaining: **18 A1**, then **25 A2**. The four A1 *leaves* are now finished; everything left at A1 is a `trunk_*` core-frames unit, which is a different authoring problem (12 gap items, not a word list) and may want a different intro shape — flagged below.

I kept run 18's authoring script and its assertions, and added one: **a tile must carry an `icon` or a `swatch`**, so a tile can never silently render as bare text. As before the script refuses to write the file rather than reporting a problem, and I re-checked all four written files afterwards rather than trusting its report.

| Unit | Tiles | Trap | Why that one |
|---|---|---|---|
| `a1_freetime` | 8 hobbies + 4 feeling faces | `bored` vs `boring` | the pack is half hobbies, half feelings, so a single-domain tile set would misrepresent it; emoji faces are the one abstract set emoji genuinely carry |
| `a1_health` | 6 symptoms + 6 care | `hurt` (verb) vs `pain` (noun) | Czech *bolí mě hlava* collapses the two |
| `a1_shopping` | things you hold at the till + open/closed | `wallet` vs `purse` | one Czech word, two English ones; `purse` is the tile, `wallet` is named only in the note, so the note earns its place |
| `a1_work` | 4 workplace + 8 jobs | `job` (countable) vs `work` (uncountable) | Czech *práce* is both, and `a work` is close to automatic |

**Words I refused to picture rather than stretch:** `pharmacy`, `queue`, `checkout`, `counter`, `waiter`, `engineer`, `driver`, `player`. Each has either no emoji at all or one that reads as the tool or the vehicle rather than the job — 🚗 says *car*, not *driver*. They stay in Match. This is the first run where the honest tile count would have been under 12 for some units, and I padded from elsewhere in the same pack rather than lowering the bar.

One content fix inside an intro: `a1_work`'s page-1 body first read *work → worker, farm → farmer, sing → singer, dance → dancer*. **`farm` is not taught anywhere as a verb**, so the line quietly modelled a derivation from a word the student has never met. Rewritten to `work / sing / dance / play`, all four of which are real items.

---

### Sequencing — the two worst A1/A2 units, both to zero

| Unit | Was | Now | Teaching point |
|---|---|---|---|
| `trunk_glue_questions_a1` | Why are you **late**? | Why are you **tired**? | gap still on `Why` |
| | Which one do you **want**? | Which one do you **like**? | gap still on `Which` |
| | Where is the **station**? | Where is the **bathroom**? | gap still on `Where` |
| `a1_object_pronouns` | She **calls** him. | She **helps** him. | gap still on `him` |
| | He **calls** her. | He **teaches** her. | gap still on `her` |
| | I **want** it. | I **have** it. | gap still on `it` |

No teaching point deleted, no gap moved. Every replacement was checked against `make_pool.py --before <node>` at that unit's own position.

**`want` was the interesting one — it appears in both units and it is not an untaught word.** It is taught by `trunk_can_like_want_a1`, which sits *later* on the path than both units that were using it. That is the ordering failure the audit exists to catch, and it is invisible to anyone reading either pack on its own.

Czech was rewritten to stay natural rather than glossed: *Proč jsi unavený? · Který se ti líbí? · Kde je koupelna? · Ona mu pomáhá. · On ji učí. · Mám to.* Note the last three **change case as well as vocabulary** — the old items used dative (*Ona mu volá*, correct for *volat*), and *pomáhat* keeps the dative while *učit* takes the accusative. Swapping the verb without swapping the case would have shipped wrong Czech past all three gates, which check neither.

The two units were committed separately with the audit artefacts regenerated for each, so the ratchet has an honest intermediate state (169 → 166 → 164).

---

### `c1_spoken_vs_written` — scope checked BEFORE authoring this time

Run 18 asked for this and it is what I did. Before writing a line I read the node's `related` list and the notes and gap answers of every live unit sharing its `root` (`sentence_syntax`), then grepped the whole live corpus for the phenomena I intended to teach.

**The result was the opposite of the last two runs: the territory is genuinely empty.** Question tags appear **nowhere in the course** — not one tag-shaped sentence in 160 packs, not one occurrence of the word *tag*. Heads and tails are equally unowned. And the node's own `related` pointer, `c1_register`, turned out to be a false alarm: it teaches *lexical* register (phrasal vs Latinate verbs, formal prepositional phrases, correspondence frames), not spoken syntax. No overlap at all.

Four strands x 12: **heads** (left dislocation, gap on the stand-in pronoun so agreement is the drill) · **tails** (right dislocation, the same agreement mirrored — the pronoun commits before the noun phrase arrives) · **tags, the built system** (copy the auxiliary, flip it, add the pronoun; `do` supplies one where the statement has none) · **tags, the cases that are not built** (`aren't I` vs `am I`, imperative + `will/would you`, `there` as tag subject, `never / no one / hardly` taking a positive tag, `someone` + `they`, `used to`, and the tag after `I think` reaching past `I` to the real claim).

**What I deliberately left out, and why it is a fork for you.** The obvious fourth strand was *situational ellipsis* — spoken `Seen him?` for written `Have you seen him?`. I dropped it. Its gap answers would have been `have / do / did / can / is` — **the same auxiliaries `c1_ellipsis_substitution` already gaps 14 times.** Front-clipping and back-clipping are different phenomena, but a student meeting them a few nodes apart with an identical answer set will read them as one unit taught twice. Conservative path: leave it out, and use intro card 2 to name the distinction explicitly so the two units do not blur. **If you want situational ellipsis taught, it belongs inside `c1_ellipsis_substitution` as a fifth strand, not here.**

---

### Forks and judgment calls

**1. Four items were rewritten because the pre-write pool check caught them, and I would not have caught any of them by eye.** `next door` (in `next`), `let's`, `hadn't`, `nothing` are all out of pool at C1 — `nothing` and `nobody` are not GLUE, though `never`, `no one` and, usefully, `hardly` are. Replacements: `My neighbour`; `I am not late, am I?`; `Someone has taken my bag, haven't they?`; `Hardly anyone agrees with him, do they?`. **The cost is that `Let's …, shall we?` is not taught** — it is the one common tag the unit does not cover, and it cannot be until `let's` is taught somewhere. Worth an A2 trunk item if you want it.

**2. I rewrote the `tags_edge` explanation after those swaps.** It still described `let's → shall we` and `had better → hadn't`, neither of which the shipped items drill any more. An explanation teaching a rule the student never practises is worse than a shorter explanation, so it now covers exactly the twelve cases that are there.

**3. Heads and tails reuse `he / she / it / they` across all 24 items and that is not sloppiness — there are only four pronouns.** I authored explicit `quiz_options` on every item so each one still has exactly one correct choice, and asserted that mechanically. This matches house style (`c1_ellipsis_substitution` reuses `so`/`neither` a dozen times; `c1_discourse_grammar` reuses `This` five times).

**4. Question tags are usually a B1 point and I have put them at C1.** Only because the course never taught them anywhere, and C1 is where the frontier is. **If you would rather they sat at B1, this unit should be split** — the built system down to B1, the irregular cases left here. I took the conservative path of shipping them together rather than inventing a B1 node.

**5. Repair queue: nothing processed, eighth run running.** Same three unticked items, same reasons — the vocab level badge and `order_click` are both marked *engine work, cloud must not ship*, and `b2_clear_claims` is a style decision reserved for you with the conservative path already taken. **Step 1 has been a no-op every hour since run 12.** Your `sentences[]` commit is exactly the kind of instruction that would be better placed there than in a commit message, where a fresh cloud session only sees it by accident.

**6. `codex/__pycache__/audit.cpython-311.pyc` is still committed and still churns.** Run 18 raised it; importing `audit.py` to reuse its `variants()`/`tokens_of()` rewrites it. I reverted it again rather than commit the churn. One line in `.gitignore` plus `git rm -r --cached codex/__pycache__` ends it permanently.

**7. All A1 vocab leaves now have intros; the 18 that remain at A1 are all `trunk_*` core-frames packs.** Those hold 12 gap items rather than a word list, so "8–12 tiles that carry meaning in a picture" does not describe them — there is often nothing picturable in `trunk_glue_pronouns_a1`. **They probably want a different page 1: the schematic, or a plain frame table.** I have not invented a shape for them; say which and I will apply it to all 18 consistently rather than improvising per unit.

### Smoke-check list

- The four new intros: `leaf_freetime_a1`, `leaf_health_a1`, `leaf_shopping_a1`, `leaf_work_a1` — 12 tiles each, then a frames page, then Match.
- `c1_spoken_vs_written` — 48 quiz items. Worth reading the two intro cards; card 2 is the one that keeps it separate from `c1_ellipsis_substitution`.
- `trunk_glue_questions_a1` and `a1_object_pronouns` — the six rewritten Czech lines, especially the three case changes (*pomáhat* dative, *učit* accusative).

---

## 2026-08-07 · cloud run 18 (RUE build, claude-opus-5)

### Headline: **4 more A1 vocab intros (7 → 11 of 30), the two worst A1/A2 sequencing units repaired to zero (audit 177 → 169), and one C1 unit built — but only after finding that `b2_articles_genericity` already owned half of what its sketch asked for. That is the second C1 scope collision in two runs.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `044011b` | **`a1_nature`** picture-led intro — 12 emoji tiles, 5 carrier frames |
| 2 | `d1d5d0d` | **`a1_places`** picture-led intro — 12 tiles, 5 frames |
| 3 | `a57bea6` | **`a1_school`** picture-led intro — 12 tiles, 5 frames |
| 4 | `0922eec` | **`a1_tech`** picture-led intro — 12 tiles, 4 frames |
| 5 | `3171ed7` | `trunk_glue_modals_a1` re-lexified, 4 items — 4 types → **0** |
| 6 | `b7ca3a9` | `trunk_lexis_a2` re-lexified, 3 items — 4 types → **0** |
| 7 | `d68d8ae` | **`c1_article_nuance`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 83 live grammar units · 0 errors · 1 warning | **84 units · 0 errors · 1 warning** |
| `audit` | 177 unknown types · 49 units | **169** · 47 units · baseline tightened 177 → 173 → 169 |

Net **−8** unknown types while adding 48 new items. The new C1 unit is **100 % pool-clean — 0 violations**: the report's live-unit count goes 150 → 151 with the total unchanged at 169. All three gates green before every commit; commit and push per unit.

---

### Vocab intros — 4 more, all emoji, none needed a schematic

Live vocab units with an intro: **7 → 11**. Remaining: **22 A1**, then **25 A2**.

I took the four remaining A1 leaves where an emoji genuinely carries meaning rather than decorating it: `a1_nature`, `a1_places`, `a1_school`, `a1_tech`. All twelve tiles on every unit.

Rather than eyeball the two rules run 17 set, I made them assertions in the authoring script, so a violation would have refused to write the file:

1. **every tile's `en`/`cz` is byte-identical to that pack's own item** — including the glosses (`camera · fotoaparát / kamera`, `screen · obrazovka / displej`, `exam · zkouška / test`);
2. **every page-2 frame traces to a `use[]` carrier id the pack's items actually declare**, worded from the live packs' own precedent (`this_is_a` → *This is a …*, `where_is_the` → *Where is the …?*, `i_go_to` → *I go to the …*, `lets_talk_about` → *Let's talk about …*);
3. and the body's word count has to equal the pack's real item count (36 / 69 / 47 / 24), which is the sort of thing that rots silently.

Then I re-verified all three mechanically from the written files, not from the script's own report.

**One trap per unit, each chosen to explain something already on the page:**

| Unit | Trap | Why that one |
|---|---|---|
| `a1_nature` | rain/snow/wind/air/weather take no `a` | it *is* the split between the page's `I like …` / `I need …` frames and its `This is a …` |
| `a1_places` | `go to the bank` but `go home` — no `to` | `I go to the …` is on the same page, and `home` is taught in `a1_home_family` |
| `a1_school` | Czech *učit se* is two English verbs, `learn` and `study` | both are items in the pack, and it is the one place the unit hides a distinction Czech does not make |
| `a1_tech` | `news` is singular; `newspaper` = noviny, `news` = zprávy | Czech *noviny* is plural, so the agreement error is close to automatic |

`a1_nature` is the second unit to take the countable/uncountable trap after `a1_food`. I kept it because on this pack it is not a stray fact — it is the reason the pack splits its own carriers into `*_bare` and `*_a` families. `a1_school` was going to take the same trap and I moved it off deliberately.

---

### Sequencing — the two worst A1/A2 units, both to zero

`trunk_glue_modals_a1` (4 types) and `trunk_lexis_a2` (4 types) were the joint worst A1/A2 units in the report.

| Unit | Was | Now | Teaching point |
|---|---|---|---|
| `trunk_glue_modals_a1` | I must go **now**. | I must go **home**. | gap still on `must` |
| | You should **call** her. | You should **ask** her. | gap still on `should` |
| | I do not **smoke**. | I do not **cook**. | gap still on `do` |
| | It is not **difficult**. | It is not **dangerous**. | gap still on `not` after `is` |
| `trunk_lexis_a2` | We belong to a **club**. | We belong to a **group**. | gap still on `belong` |
| | They provide free **Wi-Fi**. | They provide free **coffee**. | gap still on `provide` |
| | They recently **moved** house. | They recently **opened a new restaurant**. | gap still on `recently` |

Every replacement word was checked against `make_pool.py --before <node>` for that unit's own position, not against a general sense of what A1 covers. No teaching point was deleted, no gap moved, and each `cz` was rewritten to stay a natural sentence rather than a gloss (*Musím jít domů.* · *Měl by ses jí zeptat.* · *Nevařím.* · *Není to nebezpečné.* · *Patříme do skupiny.* · *Poskytují kávu zdarma.* · *Nedávno otevřeli novou restauraci.*). Wi-Fi's three `accepts` spelling variants went with it and are no longer needed.

The two units were committed separately with the audit artefacts regenerated for each, so the ratchet has an honest intermediate state (177 → 173 → 169) rather than one jump.

---

### THE FINDING: the C1 sketch collided with a **B2** unit this time, not a B1 one

`c1_reporting_complementation` (node 13 on `path_order_c1`) is still blocked for the reason run 17 gave, so I went to node 15, `c1_article_nuance`. Its thin shell sketches *abstract, institutions, media, unique roles* across 10 items. Seven of those ten are already taught by **`b1_articles_advanced`** (48 items, live) — `in hospital`, `at university` / `The university`, `on the radio`, `the piano`, `Nature` / `The nature of` in the same shape as its own `Life` / `The life`.

That much I expected. What I did not expect, and only caught because the node's own `related` list pointed at it, is that **`b2_articles_genericity` is live, on `path_order_b2`, and owns two more of the four strands I had already written**:

- its `zero_plural_generic` strand teaches the bare-plural generic with sentences a hair from mine — *Books are cheaper than films*, *Students often work at weekends*, *Cars are cheaper in this country*;
- its `the_group_or_unique` strand teaches `the` + adjective for a group: *The rich should help the poor*, ***The young often move to the city***, *We should do more for the unemployed*.

My strand 4 had *The young often leave the village for work*. **That is the same sentence.** I had a complete, gate-passing 48-item pack on disk before I checked, and it would have shipped a near-duplicate of a live B2 unit past all three gates without a murmur — the gates check pool legality and playability, and neither knows what another unit already teaches.

**So I rebuilt two strands before flipping the node.** What shipped teaches only what is left unowned:

- **the two SINGULAR generics** — `a` + singular as a rule about any member (*A good doctor listens before speaking*) and `the` + singular as the species (*The horse was once the fastest way to travel*) — neither of which B2 touches, since its generic strands are the bare plural and the uncountable. The bare plural appears in the intro card as the already-known baseline, never as a gap item.
- **article-free prepositional phrases** — `by car` / `on foot`, `in person`, `by hand`, `on average`, `in detail`, `in charge of`, `on behalf of`, plus the repeated-bare-noun pairs `side by side`, `face to face`, `step by step`. Owned by nothing at any level.
- **abstract nouns going countable** — `business`/`a business`, `experience`/`an experience`, `success`/`a success`, `difficulty`/`a difficulty`, `time`/`a great time`, `doubt`. B2 teaches the pure uncountables that never flip (*Life is short*, *Advice is free*); the flip itself is untaught.
- **`the` forced by structure** — a noun pinned by a that-clause or a relative (`the fact that`, `the extent to which`, `the way in which`, `the reason why`) and the quantity frames, with **`the number of` + singular verb vs `a number of` + plural verb** as a minimal pair.

Every gap answer in the unit is unique, every frame reconstructs exactly, and no distractor is also an accepted answer — all three asserted in the authoring script before the file was written, then re-checked from the written file.

**This is worth a process change and I cannot make it alone:** before authoring any C1 unit, the `related` list on its node and the notes of every live unit sharing its `root` should be read as a matter of course. Two of the last three C1 nodes have been mostly-already-taught. Cheap fix if you want it: **`make_pool.py` could grow a `--conflicts <node>` mode that prints the notes and gap answers of every live unit with the same `root`.** That is a tool change, so I have not made it.

---

### Forks and judgment calls

**1. Quiz distractors for articles cannot be made unambiguous, and that is inherent, not sloppy.** *The good doctor listens before speaking* is perfectly grammatical English; it is only wrong here because the Czech prompt is generic. For roughly a third of the 48 items the article choice is settled by the `cz` support line and not by the English frame alone. I made distractors outright ungrammatical wherever I could (`A engineer`, `An bicycle`, `The unemployeds`, `Horses was`), but choosing an article from a Czech prompt *is* the skill, so the rest stand. **Worth a look in smoke: if this reads as ambiguous rather than as the exercise, the fix is a longer `cz`, not different options.**

**2. `nobody` was out of pool at C1 and I would not have caught it by eye.** Two of my items used it; I swapped both to `no one`, which is GLUE. Two more near-misses — `ran` and `difficulties` — turned out to be legal (`ran` is in `audit.py`'s irregular table, and `quiz_options` are never scanned). I checked every word of all 48 English sentences against the pool programmatically rather than trusting the audit to catch it after the fact, because the audit only runs once the node is already live.

**3. The node's `note` no longer described the unit, so I rewrote it.** It said *"institutions, media, roles · thin shell 2026-08-05"* — three subjects the shipped unit deliberately does not teach, because B1 owns them. Leaving it would have re-set the same trap for the next run. The `label` ("Article nuance") and `codex_unit` (`G_NP-C1-01`) are untouched: this is still the article node, scoped within its own subject, which is the same call run 17 made scoping `c1_comparative_advanced` around `a2_comparatives`. **If you disagree that a content-lane run may narrow a node's note, say so and I will stop.**

**4. Repair queue: nothing processed, seventh run running.** Same three unticked items, same reasons — the vocab level badge and `order_click` are both marked *engine work, cloud must not ship*, and `b2_clear_claims` is a style decision reserved for you with the conservative path already taken. **The queue has had no content-lane item in it since run 12.** Step 1 of the routine is a no-op every hour until you put one there.

**5. `codex/__pycache__/audit.cpython-311.pyc` is committed to the repo.** Importing `audit.py` to check its irregular-verb table rewrote it and it showed up as a working-tree change. I reverted it rather than commit the churn, but it will keep reappearing for anyone who imports that module. **One line in `.gitignore` and a `git rm -r --cached codex/__pycache__` would end it.** Not content, so not mine.

**6. Run 17's open items are all unchanged** — the `a1_home_family` template still lists `"This is my …"`, which is not a carrier id that pack declares; there is still no carrier-wording registry, so page-2 frames are derived from the ids rather than looked up; the `use[]` carriers are still data-only with no student-facing Use stage; and the six orphaned packs are still orphaned. I have not touched any of them.

### Smoke-check these

- **The four new intro pages** — `a1_nature`, `a1_places`, `a1_school`, `a1_tech`. Page 1 is a 12-tile emoji grid, page 2 a short frame list plus one note, then "Next → Match".
- **`a1_tech` in particular** — its tiles carry the longest parenthetical glosses of any unit so far (`fotoaparát / kamera`, `obrazovka / displej`), so it is the tile-width stress test, the way `a1_body` was last run.
- **`c1_article_nuance`** — 48 quiz items, no Match/Type stage by design (`check.sequence: ["quiz"]`, same as the other C1 units). The four intro cards each carry a table.
- **`trunk_glue_modals_a1` and `trunk_lexis_a2`** — seven sentences changed between them. Worth reading the Czech: *Nevařím.* and *Není to nebezpečné.* replace items you may have taught from.
- **Whether narrowing `c1_article_nuance` was the right call at all** — if you would rather the C1 article unit re-taught the B1/B2 ground as consolidation, the unit needs rewriting, not adjusting, so it is better to know now than after three more C1 nodes go the same way.

---

## 2026-08-07 · cloud run 17 (RUE build, claude-opus-5)

### Headline: **the picture-led intro backlog opens — 4 A1 vocab units done (3 → 7 of 30) — plus 2 A1/A2 units repaired to zero (audit 185 → 177) and one C1 unit built. And the next node on the C1 path cannot be built as sketched: `b2_reported_speech_advanced` already teaches all of it.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `c98b74d` | **`a1_animals`** picture-led intro — 12 emoji tiles, 4 carrier frames |
| 2 | `67dd379` | **`a1_body`** picture-led intro — 12 tiles, 5 frames |
| 3 | `402c9ec` | **`a1_clothes`** picture-led intro — 12 tiles, 4 frames |
| 4 | `82e37a6` | **`a1_food`** picture-led intro — 12 tiles, 5 frames |
| 5 | `2d732b9` | `a1_like_want_need` re-lexified, 4 items — 4 types → **0** |
| 6 | `dbfe0cd` | `a2_past_simple` re-lexified, 5 items — 4 types → **0** |
| 7 | `7d0ae15` | **`c1_comparative_advanced`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 82 live grammar units · 0 errors · 1 warning | **83 units · 0 errors · 1 warning** |
| `audit` | 185 unknown types · 51 units | **177** · 49 units · baseline tightened twice (185 → 181 → 177) |

Net **−8** unknown types while adding 48 new items. The new C1 unit is **100 % pool-clean — 0 violations**, verified by simulating `audit.py` against the pack *before* flipping status, not after. The 12 warnings are the pre-existing `b2_clear_claims` ones, the 1 warning is the known `order_click` gap; both unchanged. All three gates green before every commit; commit and push per unit.

---

### Vocab intros — the backlog is 30 A1 + 25 A2, and this run cleared 4

Live vocab units with an intro: **3 → 7**. Remaining: **26 A1**, then **25 A2**. At 4 a run that is roughly six more runs to finish A1 and A2.

I took the four most genuinely picturable A1 leaves first — `a1_animals`, `a1_body`, `a1_clothes`, `a1_food` — because they are where an emoji actually carries meaning rather than decorating it. Every unit got the full 12 tiles.

**Two rules I held to strictly, both of which cost me tiles:**

1. **Every tile's `en`/`cz` is copied verbatim from that pack's own items**, including the pack's disambiguating glosses — `hand · ruka (dlaň)`, `shoe · bota (polobotka)`, `watch (wrist) · hodinky`. A tile that paraphrases is a tile the student will not recognise in Match ten seconds later.
2. **Every page-2 frame traces to a `use[]` carrier id the pack's items actually declare.** I did not invent one. Where a nicer frame existed but no item declared it, it did not go in.

**One trap per unit, and I chose each to explain something already on the page rather than to add a stray fact:**

| Unit | Trap | Why that one |
|---|---|---|
| `a1_animals` | `sheep` is invariant in the plural | the page's own `I like …` frame is the plural carrier `i_like_pl` |
| `a1_body` | `ruka` = arm *and* hand, `noha` = leg *and* foot | it is the reason the pack glosses those four items in the first place |
| `a1_clothes` | trousers / jeans / glasses are always plural | they are the exception to `This is a …` and `I have a …`, both on the same page |
| `a1_food` | countable vs uncountable | it *is* the split between the `*_bare` carriers and `i_buy_a` / `this_is_a` — the note explains the two frame families rather than adding a fact |

No unit resisted a picture, so none needed a schematic or a text page this run. No new schematic needed either.

---

### THE FINDING: `c1_reporting_complementation` cannot be built as sketched — B2 already teaches all of it

It is the next node on `path_order_c1`, so I went to build it, and stopped. Its thin shell sketches *admit doing · insist that · warn sb not to · suggest that/-ing · accuse sb of · promise to*. Compare the note on the **live** `b2_reported_speech_advanced` (48 items, on `path_order_b2`):

> reporting verbs beyond say/tell · verb (+ object) + to-infinitive · verb + -ing and verb + preposition + -ing · verb + (that) clause, **incl. suggest/insist + should or base form** · choosing the verb that fits the pattern

Its gap answers include `accused`, `advised`, `apologised`, `blamed`, `congratulated`, `denied`, `insisted`, `refused`, `reminded`, `suggested`, `warned`, `of`, `on`, `for`, `taking`, `making`, `booking`. **That is the C1 shell's entire content, already live one level down.** And `c1_subjunctive`'s own note (run 16) says it deliberately ceded exactly this ground: *"deliberately avoids … suggest/insist and the other reporting VERB triggers with should or base form (b2_reported_speech_advanced)"*.

The neighbouring C1 units have taken the obvious escape routes too: impersonal *It is said that / He is said to have* belongs to **`c1_advanced_passive`**, and nominalised reporting (*the claim that…*, appositive that-clauses) to **`c1_nominalisation`** and **`c1_complex_noun_phrases`**.

**What is genuinely left unowned**, if you want the node built:

- the object-slot constraint — *tell/remind/inform me* vs \*_explain me_, \*_suggest me_, \*_say me_ (a Czech fossilisation worth a strand on its own)
- `that`-deletion: when it is optional, when register or an intervening adverbial makes it obligatory
- complementation with a **meaning change** — *regret to say* vs *regret saying*, *remember to* vs *remember -ing*, *go on to* vs *go on -ing*, *mean*, *stop*, *try*

That is a real unit, but it is **"complementation precision", not "reporting verbs"** — it needs a different title, a different `label`, and a different note from the ones in the registry. **Renaming a registered node's subject matter is your call, not the content lane's, so I did not do it silently.** Conservative path taken: I left the node `coming` and built the next clean node on the C1 path instead.

### So I built `c1_comparative_advanced` — and it is clean ground

Only `a2_comparatives` exists below it (plain `-er`/`-est`, *bigger/more … than*). I checked the two C1 units that could have overlapped and scoped around both: `no sooner` and the other inverted negative adverbials belong to **`c1_inversion_emphasis`**, verb-phrase ellipsis in the than-clause to **`c1_ellipsis_substitution`**. Four strands: scaling the comparative and the equative · `the … the` and doubled comparatives · `as … as` in full · choosing the frame (fewer/less, two-of-a-kind, than/then, *prefer X to Y* vs *would rather X than Y*, *by far*).

---

### Forks and judgment calls

**1. Two of your three intro templates drift from the spec they set, and I copied the spec, not the templates.** Worth knowing before the next run copies either one:

- **`a1_home_family` page 2 lists `"This is my …"`, which is not a carrier id.** The pack declares `he_is_my`, `this_is_a`, `i_am_a`, `i_have_a`, `he_is_a`, `i_need_a`, `where_is_the`, `i_go_to`, `i_want_to`, `have_a_good`, `the_is_long` — no `this_is_my`. AGENTS.md says *"Frames come from the items' `use[]` carrier ids … don't invent frames"*, so the reference template breaks its own rule, and any run that copies it inherits the break. **One-line fix: drop that frame, or swap it for `He is a …` / `I need a …`, both declared.** I did not touch it — it is the artefact you are smoke-testing right now, and changing what you are looking at mid-smoke is worse than telling you.
- **`a1_colours` tiles carry the short feminine Czech (`červená`) where the items carry `červený / červená`.** On a swatch that is clearly the better call, so I am recording it as deliberate template variance rather than a defect — but it means "tile text is verbatim from the item" is a rule with one sanctioned exception, and the next author should know which.

**2. There is no carrier-wording registry anywhere in the repo.** `this_is_a`, `i_like_pl`, `i_have_bare` and the other 36 ids exist only inside vocab packs and in one line of AGENTS.md. I derived every frame from the id itself (`this_is_a` → *This is a …*), which is deterministic because the ids are self-describing — but it is derivation, not lookup, and two authors could word the same id differently. **A 39-line `data/vocab/carriers.json` would make page 2 mechanical and lintable.** I have not added one: it is a new data file, which is a shape decision.

**3. The `use[]` carriers are currently data-only — no student sees them.** Leaf vocab packs have no authored `sentences` bank, so `getSentenceItems()` returns nothing and the Use stage falls through to *"Use · coming soon"*. That matters two ways: the frames I put on page 2 are, today, the **only** place a student meets these carriers; and some carrier assignments would produce wrong English if the stage were ever switched on — `trousers` and `jeans` both declare `this_is_a` and `i_have_a`, which generate \*_This is a jeans_. **Not a live bug, so I have not touched the data.** Flagging it because the intro pages have just made those carriers visible for the first time, and because it is a landmine under whoever wires the Use stage.

**4. Quiz distractors: I kept morphological traps, swapped one lexical leak.** Same call as run 16, same reasoning. `marginal` / `margin` / `marginals` and `somehow` are out-of-pool but they are wrong *forms* of the answer — the trap the item exists to set. I did swap `considerate` out for `consideration`, because *considerate* is a different lexeme doing no teaching work. **Note that `audit.py` never scans `quiz_options` at all**, so neither choice moves the gate; this is a judgment call the gate cannot see.

**5. `c1_comparative_advanced` cost six items a re-lexify, and one of them dulled the sentence.** `version`, `practise`, `capable`, `else`, `designs`, `convincing` were all out-of-pool at C1 — which is worth noticing on its own, since the pool at that position is 2,942 targets from 148 units. *He is just as capable as anyone else in the team* became *He is just as quick as the others in the team*: same teaching point, flatter English. The others (`phone`, `listen`, `report`, `plans`, `popular`) cost nothing.

**6. Repair queue: nothing processed, and that is still correct — sixth run in a row.** Same three unticked items, same reasons: the vocab level badge and `order_click` are marked *engine work, cloud must not ship*; `b2_clear_claims` is a style decision reserved for you with the conservative path already taken. **The queue has had no content-lane item in it since run 12.** Step 1 of the routine is a no-op every hour until you put one there.

**7. Run 16's orphaned-packs finding is unchanged** — six registered nodes with packs on disk and no `path_order_*` entry, `b2_clear_claims` among them (a real 12-item pack no student can reach, and the source of all 12 lint warnings). Still yours to call; still outside the content lane.

### Smoke-check these

- **The four new intro pages** — `a1_animals`, `a1_body`, `a1_clothes`, `a1_food`. Page 1 should be a 12-tile emoji grid, page 2 a short frame list plus one note, then "Next → Match". Emoji render at whatever size `.pic-icon` sets; I have not seen them in a browser, so **tile-grid wrapping at 12 tiles on a phone is the thing most likely to look wrong.**
- **`a1_body` in particular** — it is the only unit whose tiles carry parenthetical glosses (`ruka (dlaň)`, `noha (chodidlo)`), so it is the width stress test.
- **`c1_comparative_advanced`** — 48 quiz items, no Match/Type stage by design (`check.sequence: ["quiz"]`, same as the other C1 units).
- **`a2_past_simple` items 24 and 46** — both now say *in June* / *in July* where they said *last year* / *last month*. Month names are GLUE, so they keep a real finished-past time marker; check they still read naturally to you.

---

## 2026-08-07 · cloud run 16 (RUE build, claude-opus-5)

### Headline: **two A1 units repaired to zero and two C1 units built — audit 195 → 185, C1 now 13/18 on path, and six authored packs turn out to be unreachable by students.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `67b92d8` | `trunk_verbs_say_a1` re-lexified, 5 items — 5 types → **0** |
| 2 | `113f10b` | `trunk_glue_pronouns_a1` re-lexified, 5 items — 5 types → **0** |
| 3 | `5878a36` | **`c1_advanced_modality`** built + live — 10 → **48** items |
| 4 | `0b8cc87` | **`c1_subjunctive`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 80 live grammar units · 0 errors · 1 warning | **82 units · 0 errors · 1 warning** |
| `audit` | 195 unknown types · 53 units | **185** · 51 units · baseline tightened 195 → 185 |

Net **−10** unknown types while adding **96** new items. Both repaired units drop
off the sequencing report entirely, and **both new C1 units are 100 % pool-clean —
0 violations between them**, verified by simulating `audit.py` against the pack
before flipping status, not after. The 12 warnings are the pre-existing
`b2_clear_claims` ones and the 1 warning is the known `order_click` gap; both
unchanged. All three gates green before every commit; commit and push per unit.

I was pushed back once mid-run — your `2f14743` (picture-led vocab intros) landed
while I was authoring. Rebased onto it, **re-ran all three gates after the
rebase**, then pushed. No conflicts.

### Repair queue: nothing processed, and that is still correct

**Fifth run in a row.** Same three unticked items, same reason: the vocab level
badge and `order_click` are marked *engine work, cloud must not ship*, and
`b2_clear_claims` is a style decision reserved for you with the conservative path
already taken. Runs 12–16 have now all said this. **The queue has no content-lane
item in it. Until it does, step 1 of the routine is a no-op every hour.**

---

### THE FINDING: six authored packs are on disk but unreachable by students

`data/nodes-grammar.json` carries six nodes that are `status: coming`, have a
`content` path, **have a real pack file on disk**, and appear on **no**
`path_order_*` list. Nothing in the app can ever open them:

| Node | Registry level | Pack on disk | Why it is probably orphaned |
|---|---|---|---|
| `b2_future_in_the_past` | B2 | 10 items, 1 card | absorbed into `b2_future_forms` (its note claims *future in the past*) |
| `b2_inversion` | C1 | 10 items, 1 card | superseded by live `c1_inversion_emphasis` |
| `b2_cleft_sentences` | C1 | 10 items, 1 card | superseded by live `c1_clefts_fronting` |
| `b2_emphasis_fronting` | C1 | 10 items, 1 card | superseded by live `c1_clefts_fronting` |
| `c1_hedging_stance` | C1 | 10 items, 1 card | merged into `c1_advanced_modality` per its own registry note — **I absorbed it this run** |
| `b2_clear_claims` | B2 | **12 items, 6 cards** | not a thin shell — a real authored pack |

Five are 10-item thin shells whose ground is already taught by a live unit, so
leaving them is harmless but misleading. **`b2_clear_claims` is the one that
matters**: it is a fully authored 12-item, 6-card pack, and `REPAIR-QUEUE.md`
discusses its gap-answer style as a live design question — but **no student has
ever seen it or ever can**, because it is off-path and `coming`. Its 12
`verify_pack` warnings are also the only warnings in the whole repo, so the lint
noise every run comes from a pack nobody can reach.

**Two clean options, both yours:** delete the five shells and wire
`b2_clear_claims` onto `path_order_b2`, or delete all six. I did neither —
deleting registered nodes and editing spine order is outside the content lane.

---

### Forks and judgment calls

**1. `c1_subjunctive` gaps the trigger word, not the verb, in 13 of its 24
trigger items — 9 of them converted for exactly this reason.** `audit.py` only counts `gap_answer` and `lemma`
as *taught*, so with the gap always on the verb, the unit's own subject matter
(`essential`, `vital`, `imperative`, `crucial`, `advisable`, `desirable`,
`recommendation`, `requirement`, `proposal`) read as **untaught vocabulary** — 10
fresh violations in a unit that is literally about those words. Rather than
lemma-tagging around the gate, I made those items gap the trigger, with the
fact-adjectives (`clear`, `obvious`, `true`, `certain`) as distractors. That is a
real teaching point — *which* adjective forces the base form is half the unit —
and the base-form drilling still gets 23 items across strands 1–3. **Flagging it
because it changes the strand's feel: strand 1 is now half "spot the trigger",
half "get the form right".**

**2. Quiz distractors that are morphological variants of the answer are
out-of-pool, and I kept them.** `proving`/`proves`, `binding`, `certainty`,
`require`/`required`, `propose`/`proposed`, `doubtful`, `principal`. They are not
in any pool, but they are not vocabulary the student has to *know* — they are the
wrong-form trap the item exists to set. I did swap out four genuine lexical
leaks (`possibly`, `maybe`, `measure`, `apart`) for pool-legal wrong answers.
**Conservative default taken: morphological traps stay, lexical leaks go.** Say
if you want the traps gone too.

**3. The stemmer tax again — this time it is base forms, not irregulars.**
`audit.py` treats a `gap_answer` as the taught token, so `happened` becomes
taught while **`happen` does not** — `variants()` strips suffixes off the word
being checked but never adds them to the pool. It cost me two sentences this run
(*Accidents will happen* → *A good teacher will always find a way*; *the change
happen soon* → *the price stay the same*), both of which were better English
before I bent them. This is the fifth consecutive run to pay a stemmer tax
(`rise`, `show`, `men`, `books`, now base forms). **One line in `targets_of` —
also add the bare stem of every `gap_answer` — would clear this whole family.**
I have not touched the gate.

**4. `craft` is still parked and still the only non-C1 gap.** B1 is 22/23, B2
21/22, and in both cases the missing node is `craft` (vocab, B1+B2,
`content: null`, note *"Side door later · B1+"*). Unchanged from run 15 — parked
reads as your shelf, not a sketch waiting for an author.

**5. Scoping was again done from the live packs' notes, not the registry.** Run
15's lesson held. `c1_advanced_modality`'s registry note lists `somewhat` as its
hedging content — but `c1_register` already owns formal degree adverbs, so I
dropped that strand and built raising verbs instead. `c1_subjunctive`'s registry
note lists *wish / if only / would rather*, **all three of which are already
live** in `b2_wish_if_only` and `b2_hypothetical_past`; had I authored from the
registry, two thirds of the unit would have been a B2 duplicate. Both packs
record their exclusions in their own `note` field.

**6. Two prompt-vs-reality mismatches worth fixing in the routine prompt.**
(a) The prompt's "current state" paragraph says *B1 16/23, B2 4/24, C1 0/22*;
reality this run was B1 22/23, B2 21/22, C1 11/18 → 13/18. A run that trusted it
would build the wrong level. (b) The prompt says `py`; this container has only
`python3`. Both gates ran fine once I substituted, but a stricter run could read
`py: not found` as a failing gate and spend the whole hour "fixing" it. Run 15
already asked for `check_playable` to be added to the prompt's gate list — still
only two named there.

---

### Smoke-check list

- **`c1_advanced_modality`** — 48 items, quiz-only. Worth an eye on the
  `can` vs `may` pair (items 6–7) and on `wouldn't` as a gap answer (item 12),
  which is the only contracted answer in the pack.
- **`c1_subjunctive`** — 48 items, quiz-only. The Czech leans on *aby* throughout;
  check items 5 (*crucial · aby tým zůstal pohromadě*) and 41 (*Far be it from me
  · Vůbec mi nepřísluší…*), which were the two hardest to translate naturally.
- **`trunk_verbs_say_a1` / `trunk_glue_pronouns_a1`** — every teaching verb and
  glue word is unchanged; only the objects moved. *Give it to me* became *She
  helps me*, which is the one item where the frame shape changed rather than just
  its lexis.

---

## 2026-08-07 · cloud run 15 (RUE build, claude-opus-5)

### Headline: **two A1 units repaired to zero and two C1 units built — audit 206 → 195, C1 now 11/18 on path, and B1/B2 are complete.**

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `6bfb5d3` | `a1_present_simple` re-lexified, 10/31 items — 6 types / **12 hits** → **0** |
| 2 | `646eb95` | `a1_imperatives` re-lexified, 5 items + 4 card slots — 5 types → **0** |
| 3 | `a1ace58` | **`c1_discourse_grammar`** built + live — 10 → **48** items |
| 4 | `97c21c0` | **`c1_register`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 78 live grammar units · 0 errors · 1 warning | **80 units · 0 errors · 1 warning** |
| `audit` | 206 unknown types · 55 units | **195** · 53 units · baseline tightened 206 → 200 → 195 |

Net **−11** unknown types while adding **96** new items. Both repaired units drop
off the sequencing report, and **both new C1 units are 100 % pool-clean — 0
violations between them**. The 12 warnings are the pre-existing `b2_clear_claims`
ones and the 1 warning is the known `order_click` gap; both unchanged. All three
gates green before every commit; commit and push per unit.

**I ran `check_playable` as well as the two gates the routine prompt names** —
`AGENTS.md` requires all three, and the prompt lists only two. Worth reconciling
the prompt with the contract so a future run does not skip it.

### Repair queue: nothing processed, and that is still correct

**Fourth run in a row.** The same three unticked items are all explicitly out of
the cloud lane — the vocab level badge and `order_click` are marked *engine work,
cloud must not ship*, and `b2_clear_claims` is a style decision reserved for you
with the conservative path already taken. Runs 12, 13, 14 and now 15 have said
this. **If you want the cloud lane doing repair work, the queue needs
content-lane items.**

---

### B1 and B2 are finished; the only thing left below C1 is `craft`

B1 is 22/23 and B2 21/22, and in both cases the single missing node is the same
one: **`craft`** (`Word-craft`, vocab, levels B1+B2), which is `status: parked`
with `content: null` and the note *"Side door later · B1+"*. It has no content
path and no defined teaching scope, so I did not build it — parked reads as your
deliberate shelf, not a sketch waiting for an author. **Say the word if you want
it scoped and built; otherwise every remaining unit on the path is C1.**

---

### THE FINDING: the node registry notes no longer describe what shipped

`data/nodes-grammar.json` says `c1_discourse_grammar` is *"Sophisticated
discourse markers · purpose/result/concession/contrast · prep relatives (of
which, to whom) edges"*. Every one of those is already taught by a live unit:
`b2_discourse_markers` owns the connectors, and `b2_relative_clauses_advanced`
owns *"preposition + which/whom, fronted and stranded"*. Had I authored from the
registry note, I would have shipped a duplicate of two B2 units at C1.

The same happened with `c1_register`. Its obvious strands — inverted conditionals
(*Should you require…*) and impersonal *It is recommended that…* — are **both
already built**, in `c1_inversion_emphasis` and `c1_advanced_passive`
respectively, and its third obvious strand, situational ellipsis and discourse
particles, is the declared scope of the **`c1_spoken_vs_written` sketch that is
still unbuilt**.

So I scoped both units against the *pack notes of the live units*, not the
registry, and recorded the exclusions in each pack's own `note` so the next run
can see what was deliberately left alone. **The lesson for the remaining nine C1
sketches: read the live packs' notes before authoring, because the registry notes
predate them.** The pack `note` field is now the reliable record; the registry
`note` is not.

---

### Forks and judgment calls

**1. `rise` is outside the stemmer, and this is now the fourth run to pay this
tax.** `IRREGULAR` in `audit.py` has no `rise: rose risen`, so *Prices rose again
in June* reads as untaught. I reworded four sentences to *went up*. This is the
same family as run 14's `show: showed shown`, run 13's `men` and run 12's
`books`. **Four consecutive runs have now bent good sentences around a missing
irregular.** One line each would clear them; I have not touched the gate.

**2. Indefinite pronouns cost me a whole teaching point this time, not just
items.** `everybody`, `everyone`, `somebody`, `nobody` and `nothing` are still not
GLUE. In `a1_present_simple` **five of the ten items I rewrote were the
indefinite-pronoun subjects** — *Everybody has a phone*, *Nobody knows* and three
others — which I moved onto noun subjects. The stated teaching point on all five
was "he/she/it → verb + -s", and that survives exactly; what quietly leaves the
unit is the sub-point that *indefinite pronouns take a singular verb*, which no
card or explanation in the pack ever stated. **If you add these five words to
GLUE, those five items can go straight back** — this is the fourth run to ask.
`nothing` also cost me two sentences in `c1_register`.

**3. `water` in `trunk_verbs_daily_a1` — forked, not fixed.** It is the partner of
the unit I repaired, so I checked it per run 14's finding. Its one violation is
*I drink water*, and **no drinkable noun is taught anywhere before it** — water,
coffee and tea all arrive later, at `leaf_food_a1`. The honest options are all
bad: dropping the object leaves *I drink*, which in English implies alcohol, and
swapping the verb would delete the `drink` teaching point outright, which the
rules forbid. This is a **sequencing problem, not a vocabulary gap** — `drink` is
taught at step 4 and drinks at step 11. Conservative path taken: left alone.
Cheapest real fix is a GLUE line or a minimal drink noun early.

**4. One item in `a1_present_simple` changed its verb.** *She drinks coffee at
work* → *She helps my brother at work*, for the same reason as above. `drinks`
therefore leaves that pack's target set — but `drink` is still taught by the
same-step partner, and I verified mechanically that **the sequencing report gained
no new violation anywhere**, so nothing downstream lost the word.

**5. `a1_imperatives`: I moved the intro cards with the items.** Removing *Be
careful*, *Don't worry*, *Don't touch that* and *Look at the board* from the drill
would have left four card slots teaching phrases the student never practises, and
one card was titled *"Be quiet · Be careful"*. Cards are **not** audited — only
`items[].en` is — so I could have left them and still scored the −5. I moved them
because a card and a drill disagreeing is worse than a gate number. Flagging in
case you would rather cards ran ahead of the drill.

**6. Nothing gates `quiz_options`, and this run it mattered five times.** Run 14
made this case; here is the evidence. In `c1_discourse_grammar` I had to re-cut
five items where a distractor was also defensible — with only two things named,
*the second*, *the last* and *the first* all read as correct elliptical noun
phrases opposite *former*/*latter*, and *Anna and Tom run the Prague and Brno
offices together* is perfectly good English. I reframed that last one onto two
different years so *together* genuinely fails. **`audit.py` reads only
`items[].en` and `check_playable`'s single-answer check compares against
`accepts`, so a distractor that is also right passes both gates in silence.**

**7. Deliberate policy on out-of-scope distractors, for your ruling.** Both new
units contain quiz options that are outside the pool *by construction*: `Turn`,
`Turns` against `Turning`; `concern`, `concerning`, `concerns` against
`concerned`; `advise`, `advising` against `advised`. They are wrong **inflections
of the item's own taught word**, which is the only thing a form-choice item can
offer as a distractor. I treated these as in scope and removed the four that were
genuinely unrelated vocabulary (`advance`, `briefly`, `currently`, `sight`).
**Say if you want the rule tightened to cover inflections too** — it would mean
dropping form-choice items entirely.

**8. A verified gate blind spot: singular uses of plural-taught nouns.** The
stemmer strips suffixes off the *used* token but never adds them, so a noun taught
as `dogs` (in `a1_word_classes`) reads as untaught when a later unit writes `dog`.
I confirmed this directly: `dogs` is in the pool, `dog` is not, and
`variants("dog")` returns only `["dog"]`. **This means `dog` in
`trunk_glue_pronouns_a1` is a false positive** — the word is taught. `cat` in the
same unit is real (neither `cat` nor `cats` is taught anywhere before it).
Flagging so a future run does not "repair" that unit by pluralising sentences,
which would move the number without teaching anything.

### Smoke-check suggestions

- `c1_discourse_grammar` and `c1_register` — both are quiz-only ladders of 48
  items, same shape as the run-14 C1 units. Worth one pass each to see the cards
  render (six each, all with tables).
- `a1_present_simple` — ten of its thirty-one items changed; it is the fourth unit
  on the A1 path and the one a new student meets earliest.
- `a1_imperatives` — check the four moved card slots read naturally against the
  drill.

---

## 2026-08-07 · cloud run 14 (RUE build, claude-opus-5)

### Headline: **two A1 units repaired to zero and two C1 units built — audit 214 → 206, C1 now 9/18 on path.** The prepositions vocab trunk still carried the ball-and-box lexis its grammar partner lost last run.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `658701d` | `trunk_prepositions_a1` re-lexified, all 10 frames — 3 types / **20 hits** → **0** |
| 2 | `afe85ea` | `a1_possessives` re-lexified, 6/24 items — 5 types → **0** |
| 3 | `11c58a3` | **`c1_complex_noun_phrases`** built + live — 10 → **48** items |
| 4 | `09f8539` | **`c1_ellipsis_substitution`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 76 live grammar units · 0 errors · 1 warning | **78 units · 0 errors · 1 warning** |
| `audit` | 214 unknown types · 57 units | **206** · 55 units · baseline tightened 214 → 211 → 206 |

Net **−8** unknown types while adding **96** new items. Both repaired units drop
off the sequencing report entirely, and **both new C1 units are 100 % pool-clean —
0 violations between them**, and no out-of-scope vocabulary in any quiz distractor
either. The 12 warnings are the pre-existing `b2_clear_claims` ones and the 1
warning is the known `order_click` gap; both unchanged. All three gates green
before every commit; commit and push per unit.

### Repair queue: nothing processed, and that is still correct

Third run in a row. The same three unticked items are all explicitly out of the
cloud lane — the vocab level badge and `order_click` are marked *engine work,
cloud must not ship*, and `b2_clear_claims` is a style decision reserved for you
with the conservative path already taken. **If you want the cloud lane doing
repair work, the queue needs content-lane items.** Run 12 said this, run 13 said
this, and it is now the only standing ask I have.

---

### THE FINDING: repairing a grammar unit leaves its vocab partner behind

Run 13 re-lexified `a1_prepositions_place` from ball/box onto book/bag. Its
same-step vocab partner, **`trunk_prepositions_a1`, was still teaching the same
ten prepositions with the old ball-and-box sentences** — 20 violation hits, the
worst occurrence count anywhere in A1 or A2, and worse than that, **the two
halves of one teaching step were showing the student two different pictures.**
The grammar drill said *The book is in the bag*; the vocab frames said *The ball
is in the box*.

This is not a one-off. The zigzag pairs a grammar node with a vocab node at the
same position and the audit treats the partner's targets as legal, so a repair on
one side is invisible to the gate on the other. **Any future re-lexification
should check the partner in the same run.** I did that here by hand; there are
four more paired A1 units on the report (`a1_there_is` / `trunk_glue_pronouns_a1`
share cat and dog, `a1_some_any` / `trunk_glue_quantity_a1` share money) where the
same split almost certainly exists.

Diagram keys were left untouched, exactly as run 13 left them, so the engine art
still lines up.

---

### Forks and judgment calls

**1. `a1_possessives` carried two accepts bugs and I fixed them.** The Name's items
had `gap_accepts: ["Annas"]` on the *Vaclav's* item and `["Toms"]` on the
*Homare's* item — copy-paste from a template, and they meant a student typing
*Annas* was marked right for *Vaclav's bag*. Changed to the apostrophe-less form
of each item's own name. That is an accepts-only fix of the kind the repair-queue
rules explicitly allow, but it was not a sequencing violation, so flagging it.
Worth a grep for the same pattern elsewhere — I did not widen the search this run.

**2. Nine quiz distractors in `c1_ellipsis_substitution` were second correct
answers.** Ellipsis is unusually hostile to the "wrong form" distractor pattern,
because the wrong form is very often a real English sentence with a different
antecedent. *He said he would call, but he **hasn't***, *I haven't finished, but
Petr **did***, *He asked me to sign it, and I did **too*** — a teacher would mark
all three correct. I re-cut them to forms that genuinely fail (wrong number,
non-finite). **Note that nothing gates this**: `codex/audit.py` only reads
`items[].en`, and `check_playable`'s single-answer check compares against
`accepts`, so a distractor that is *also* right passes both gates silently. This
is the strongest argument yet for a gate that reads `quiz_options`.

**3. `shown` is outside the stemmer — the irregular table has no `show`.** Same
family as run 13's `men` and run 12's `books`. *The studies have shown a clear
risk* read as untaught; changed to *have found*. The one-line fix is adding
`show: showed shown` to `IRREGULAR` in `audit.py`; I did not touch the gate.

**4. `i'm` is taught nowhere in the course, so three sentences carry the
uncontracted form.** *I am tired, and so is she* · *I am afraid so* · *I am afraid
not*. The contraction is in `accepts` on all three and the cards say so
explicitly. This is run 13's `b2_future_forms` precedent (`c6d7d80`) applied
again. It is the fourth run to work around a contraction gap — `i'm`, `i'd`,
`it's`, `let's` and `haven't` are all flagged somewhere on the report. **A GLUE
line for the common contractions would clear five units at once**; still your
call, still untouched.

**5. Indefinite pronouns cost me items again.** Run 13's finding stands unchanged:
`everyone`, `everything`, `anyone`, `nobody` are not in GLUE. In
`c1_ellipsis_substitution` I could not write *Did anyone call?* and used *Did the
client call?*; in `c1_complex_noun_phrases` I could not write *changed everything*
and used *changed the budget*. Neither sentence is worse, but the constraint is
now shaping content in three consecutive runs.

**6. Premodifier-order distractors break a collocation, not a comma.** In
`c1_complex_noun_phrases` strand 1 the distractors re-order the premodifier stack.
I deliberately built each wrong order so that it splits a fixed noun-modifier pair
— *the train recently opened station*, *a school carefully planned trip* — because
a distractor that merely fronts an adjective (*the senior, highly experienced
manager*) is readable as coordination with a comma and is therefore not reliably
wrong. Flagging the reasoning in case you disagree with any single one.

**7. `check.sequence: ["quiz"]` on both new units**, following the seven live C1
packs. Type and Use still run, so the ladder is full.

### Housekeeping — still needs you, one command (third run of asking)

`codex/__pycache__/audit.cpython-311.pyc` is **still tracked in git**:

```
git rm --cached codex/__pycache__/audit.cpython-311.pyc
printf '__pycache__/\n*.pyc\n' >> .gitignore
```

### Course state after this run

| level | on path | live | remaining |
|-------|--------:|-----:|-----------|
| A1 | 53 | 53 | — |
| A2 | 40 | 40 | — |
| B1 | 23 | 22 | 1 (`craft`, parked on purpose) |
| B2 | 22 | 21 | 1 (`craft`, parked on purpose) |
| C1 | 18 | **9** | **9** |

Remaining C1 sketches, in path order:
`c1_discourse_grammar` → `c1_register` → `c1_advanced_modality` →
`c1_subjunctive` → `c1_reporting_complementation` → `c1_comparative_advanced` →
`c1_article_nuance` → `c1_spoken_vs_written` → `c1_error_patterns`.

**The standing routine prompt still says *"B1 16/23 live, B2 4/24, C1 0/22"*.**
Runs 12 and 13 both asked for this to be corrected. Halfway through C1 now.

### To smoke-check

- **`c1_complex_noun_phrases`** — 48 items. The `premod` strand is the one to
  read: the gap is the whole ordered premodifier chunk, not a single word, so the
  quiz shows four long options and Type asks the student to produce
  *A recently published government report*. That is a heavier Type item than
  anything else at C1 — if it plays badly, say so and I will move the gap onto
  the head noun instead.
- **`c1_ellipsis_substitution`** — 48 items. The `clausal_so_not` strand runs
  question-then-answer inside one `en` string (*Will it rain today? I hope not.*),
  so Use asks the student to type both halves. Same call: if that reads wrong in
  the app, I will split them.
- **`trunk_prepositions_a1`** — now *The book is in/on/under/above/in front of/
  behind/next to/between/opposite/near the bag*, matching the grammar partner
  word for word. Worth one look that the diagram art still reads with a book and
  a bag; the keys are unchanged.
- **`a1_possessives`** — *I like my room* · *She likes her car* · *They have their
  keys* · *Vaclav's bag is old* · *Homare's car is great* · *My brother has a
  bike*. Two intro cards were re-lexified to match.

---

## 2026-08-07 · cloud run 13 (RUE build, claude-opus-5)

### Headline: **two A1 units repaired to zero and two C1 units built — audit 226 → 214, C1 now 7/18 on path.** One structural finding: `a1_present_simple` cannot be repaired without a GLUE decision from you.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `b3b67b7` | `a1_prepositions_place` re-lexified — 6 types → **0** |
| 2 | `cf55ebb` | `a1_prepositions_time` re-lexified, 7/24 items — 6 types → **0** |
| 3 | `302662e` | **`c1_advanced_passive`** built + live — 10 → **48** items |
| 4 | `5bc3edf` | **`c1_nominalisation`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 74 live grammar units · 0 errors · 1 warning | **76 units · 0 errors · 1 warning** |
| `audit` | 226 unknown types · 59 units | **214** · 57 units · baseline tightened 226 → 220 → 214 |

Net **−12** unknown types while adding **96** new items. Both repaired units drop
off the sequencing report entirely, and **both new C1 units are 100 % pool-clean —
0 violations between them.** The 12 warnings are the pre-existing `b2_clear_claims`
ones and the 1 warning is the known `order_click` gap; both unchanged. All three
gates green before every commit; commit and push per unit.

### Repair queue: nothing processed, and that is still correct

Same three unticked items as run 12, all explicitly out of the cloud lane — the
vocab level badge and `order_click` are marked *engine work, cloud must not ship*,
and `b2_clear_claims` is a style decision reserved for you with the conservative
path already taken. No cloud-lane item was available. Two runs in a row now; if
you want the cloud lane doing repair work, the queue needs content-lane items.

---

### THE FINDING: `a1_present_simple` is the worst A1 unit and I could not legitimately move it

It ties for worst on the report (6 unknown types: coffee×4, tv×2, everybody×2,
everyone, somebody, nobody). I worked it fully before picking a different unit,
and every one of the six is structural, not sloppy lexis:

**1. Four of the six are indefinite pronouns.** `Everybody has a phone.` ·
`Everyone likes…` · `Somebody lives here.` · `Nobody knows.` These five items
teach a genuine present-simple point — indefinite pronouns take the -s form.
Re-lexifying them (*My friend has a phone*) would delete the teaching point,
which the standing rules forbid. So the words have to stay, and they are untaught
because **`GLUE` in `audit.py` has no indefinite pronouns.** It already carries
`every`, `some`, `any`, `no`, `all`, `each`, `both` — the compounds are the same
class of word by any reasonable definition. **Fork, conservative path taken: I
left the unit alone and did not touch the gate.** The one-line fix is adding
`everybody everyone somebody someone anybody anyone nobody no one nothing
something anything everything` to GLUE. That is your call, not mine — but note
it also silently costs elsewhere: I had to write *No one likes to be told* and
*Not a word was said* in `c1_advanced_passive` to dodge exactly this gap, and
`a2_agreement` carries `nobody` too.

**2. The other two are structurally required nouns.** `drinks` and `watch(es)`
are both declared targets of this unit, and at position 5 of 141 the pool is
43 words — it contains no drinkable noun and nothing watchable. `coffee`, `tea`
and `water` are all taught later (`trunk_can_like_want_a1`); `tv` is **taught
nowhere in the course at all**. So *She drinks coffee at work* and *I watch TV
on Sunday* cannot be re-lexified without either dropping a declared target or
writing something unnatural. Conservative path: left as-is.

Net: this unit's realistic floor is 6 types under today's GLUE, and 2 after the
GLUE change. **The audit total will not reach zero at A1 until you rule on the
indefinite pronouns** — three separate units are blocked on it.

I picked `a1_prepositions_place` (6 types, 16 hits, worst by occurrence) and
`a1_prepositions_time` (6 types) instead, and took both to zero.

---

### Forks and judgment calls

**1. `ball` and `box` are not taught anywhere before the prepositions unit.**
The whole in/on/under/next to/behind/in front of diagram set rested on them.
Swapped to **book + bag**, which are both pool-legal and keep the small-object /
large-object picture the diagrams need. Also `cat`→umbrella, `picture`→clock,
`dog`→children, `Honza`→Petr (GLUE name pool, same call as run 12). Diagram keys
untouched — the engine's `in`/`on`/`under` art still lines up.

**2. Intro cards re-lexified by hand again.** Cards remain invisible to the
audit (fork 2 of run 12 still stands). Both repaired units had card tables and
worked examples quoting the sentences I rewrote — *"in the box"*, *"ball IN the
box"*, *"picture ON the wall"*, *"in summer"*, *"at midday"* — so cards and
drills now teach the same lexis. This is manual every single time. If you want
it gated, say so and I will build it as a queue item.

**3. Distractors that are morphological relatives of the target are in scope.**
Run 12's fork 3 said distractors must be built from the answer plus function
words. In `c1_nominalisation` the entire teaching point is noun-vs-verb, so the
distractors *have* to be `introduce / introducing / introduced` against
`introduction`. I read that as inside the rule, not an exception to it: the
distractor is a form of the very word being taught, not out-of-scope vocabulary.
Flagging it because it is a genuine widening of run 12's wording. Note also that
the audit only reads `items[].en` — **distractors are not actually gated at all**,
so this is a self-imposed standard either way.

**4. `men` is outside the stemmer, like `books`→`book` last run.** *Two men are
known to have been arrested* read as untaught because `variants("men")` never
reaches `man`. Changed to *The two drivers*. Same family as run 12's fork 4:
the irregular-plural table would be a two-line addition (`men child→children`,
`women`, `people`, `feet`, `teeth`) if you ever want it — I did not touch it.

**5. `arrested` is legal, `arrest` is not.** Exactly as run 12 predicted: the
gap_answer from `c1_participle_absolute` taught the participle only. One
distractor had to be rewritten around it. Worth knowing before authoring more
passive material.

**6. `check.sequence: ["quiz"]` on both new units.** Followed the four live C1
packs. At C1 the sentences run long and en↔cz Match is poor UX; Type and Use
still run, so the ladder is full.

### Housekeeping — still needs you, one command

`codex/__pycache__/audit.cpython-311.pyc` is **still tracked in git** (flagged in
run 12, not yet actioned). It happened not to churn this run, but it will:

```
git rm --cached codex/__pycache__/audit.cpython-311.pyc
printf '__pycache__/\n*.pyc\n' >> .gitignore
```

### Course state after this run

| level | on path | live | remaining |
|-------|--------:|-----:|-----------|
| A1 | 53 | 53 | — |
| A2 | 40 | 40 | — |
| B1 | 23 | 22 | 1 (`craft`, parked on purpose) |
| B2 | 22 | 21 | 1 (`craft`, parked on purpose) |
| C1 | 18 | **7** | **11** |

Remaining C1 sketches, in path order:
`c1_complex_noun_phrases` → `c1_ellipsis_substitution` → `c1_discourse_grammar` →
`c1_register` → `c1_advanced_modality` → `c1_subjunctive` →
`c1_reporting_complementation` → `c1_comparative_advanced` → `c1_article_nuance` →
`c1_spoken_vs_written` → `c1_error_patterns`.

The standing routine prompt still says *"B1 16/23 live, B2 4/24, C1 0/22"* —
run 12 asked for this to be corrected and it has not been. Every run burns its
opening minutes rediscovering that the frontier is C1.

### To smoke-check

- **`c1_advanced_passive`** — 48 items, quiz ladder. The `get_and_agent` strand
  is the one worth reading: register claims (*got stolen* vs *was stolen*) are
  judgement calls, and I gave `My phone got stolen` / `We get paid` /
  `The window got broken` the be-passive as an extra `accepts` so neither form
  is marked wrong.
- **`c1_nominalisation`** — 48 items. The `-ness` wrong answers (`ableness`,
  `strongness`, `longness`, `trueness`) are deliberate: they are the error Czech
  learners actually produce. If you would rather not put non-words on screen at
  all, say so and I will restyle that strand.
- **`a1_prepositions_place`** — the six diagram items now read *The book is
  in/on/under/next to/behind/in front of the bag*. Worth one look that the
  engine's diagram art still reads sensibly with a book and a bag rather than a
  ball and a box; the keys are unchanged but the pictures may be literal.
- **`a1_prepositions_time`** — *I finish school in July*, *We go on holiday in
  August*, *They play football in the afternoon*, *The shop is open on Sunday*,
  *He started school in 2010*, *We eat lunch at twelve*, *I visit her on Monday
  morning*.

---


## 2026-08-07 · cloud run 12 (RUE build, claude-opus-5)

### Headline: **B1 and B2 are already finished on the path — the frontier is C1.** Two A1 units repaired to zero and two C1 units built; C1 is now 5/22.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `57cea39` | `a1_questions_negatives` re-lexified, 7/25 items — 8 types → **0** |
| 2 | `f5f2323` | `trunk_verbs_more_a1` re-lexified, 8/12 frames — 8 types → **0** |
| 3 | `8fde2c5` | **`c1_clefts_fronting`** built + live — 10 → **48** items |
| 4 | `0f6b5a9` | **`c1_participle_absolute`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `check_playable` | 72 live grammar units · 0 errors · 1 warning | **74 units · 0 errors · 1 warning** |
| `audit` | 242 unknown types · 61 units | **226** · 59 units · baseline tightened 242 → 234 → 226 |

Net **−16** unknown types while adding **96** new items. Both repaired units
drop off the sequencing report entirely, and **both new C1 units are 100 %
pool-clean — 0 violations between them.** The 12 warnings are the pre-existing
`b2_clear_claims` ones and the 1 warning is the known `order_click` gap; both
unchanged. All three gates green before every commit; commit and push per unit.

### Repair queue: nothing processed, and that is correct

All three unticked items are explicitly out of the cloud lane — the vocab level
badge and `order_click` are marked *engine work, cloud must not ship*, and
`b2_clear_claims` is a style decision reserved for you with the conservative
path already taken. No cloud-lane item was available.

---

### THE FINDING: the standing prompt's course state is out of date

The routine prompt still says *"B1 16/23 live, B2 4/24, C1 0/22"*. The tree says
otherwise, and the tree is right:

| level | on path | live | genuinely remaining |
|-------|--------:|-----:|---------------------|
| A1 | 53 | 53 | — |
| A2 | 40 | 40 | — |
| B1 | 23 | 22 | 1 (`craft`, **parked** on purpose) |
| B2 | 22 | 21 | 1 (`craft`, **parked** on purpose) |
| C1 | 18 | 5 | **13** |

The other five non-live B2-labelled nodes (`b2_future_in_the_past`,
`b2_inversion`, `b2_cleft_sentences`, `b2_emphasis_fronting`,
`b2_clear_claims`) are **off-path map shells** whose own notes say the content
was folded into a path unit on 2026-08-06 — building them would duplicate
`c1_inversion_emphasis` and `c1_clefts_fronting`. I did not touch them.

**So "finish B1, then B2, then C1" now just means C1.** Worth editing the
standing prompt, or a future run will waste its opening minutes rediscovering
this. Remaining C1 sketches, in path order:
`c1_advanced_passive` → `c1_nominalisation` → `c1_complex_noun_phrases` →
`c1_ellipsis_substitution` → `c1_discourse_grammar` → `c1_register` →
`c1_advanced_modality` → `c1_subjunctive` → `c1_reporting_complementation` →
`c1_comparative_advanced` → `c1_article_nuance` → `c1_spoken_vs_written` →
`c1_error_patterns`.

---

### Forks and judgment calls

**1. `James` is not a legal name in examples.** `a1_questions_negatives` had
*"Does James live in Brno?"*. `GLUE` in `audit.py` carries a name pool
(anna, petr, tomas, jana, …) and your name is not in it, so it read as an
untaught word. Conservative path taken: **changed it to Petr.** If you would
rather appear in your own course — and there is a real pedagogical argument
for the teacher's name showing up — the one-line fix is adding `james` to the
GLUE list, and I will stop re-lexifying it. Your call; I did not touch the
gate to make my own numbers look better.

**2. Intro cards are invisible to the audit.** `audit.py` only reads
`blocks[].items[].en`. Cards can therefore carry untaught vocabulary
indefinitely and no gate will ever say so. I checked both new packs' cards by
hand and fixed six example-sentence leaks (signalling, fault, discuss, ignore,
struggling, freezing, objection) — and in the `a1_questions_negatives` repair I
also updated the cards that quoted the two sentences I had rewritten, so the
cards and the drills teach the same lexis. Metalanguage in cards (cleft,
clause, singular, bare infinitive) I left alone: the live C1 packs read exactly
the same way, so that is house style, not debt. **If you want this gated, the
rule would be "card example rows and table cells, excluding a metalanguage
allowlist" — happy to build it as a queue item, but it is a new gate and it is
your call, so I have not.**

**3. A gap_answer is its own unit's target — distractors are not.** Discovered
while cleaning the participle pack: `arrested` is legal in `c1_participle_absolute`
because it is a gap_answer, but `arresting` as a quiz distractor is not.
Same for `surrounding` / `permitted`. Those three items now build their
distractors from the answer plus function words (`who arrested`, `was
arrested`, `which arrested`). No teaching value lost, but any future run
authoring distractors should expect this.

**4. The stemmer widens plural → singular only.** `a1_word_classes` teaches
`books`; `book` is still unknown at `trunk_verbs_more_a1`, because
`variants("book")` never reaches `books`. So *"I choose a book"* was a real
lead, not a false hit — I moved it to *"I choose a car"*. Worth knowing before
someone "fixes" the stemmer and the count moves for no pedagogical reason.

**5. `check.sequence: ["quiz"]` on both new units.** Followed the two live C1
packs rather than inventing. At C1 the sentences are long and en↔cz Match is
poor UX; Type and Use still run, so the ladder is full.

### Housekeeping — needs you, one command

`codex/__pycache__/audit.cpython-311.pyc` is **tracked in git** and rewrites
itself every time anything imports `audit.py`, so every run starts with a dirty
tree and every agent has to decide what to do about a binary diff. I restored
it rather than committing churn — deleting a tracked file is outside the
content lane. The fix is yours:

```
git rm --cached codex/__pycache__/audit.cpython-311.pyc
printf '__pycache__/\n*.pyc\n' >> .gitignore
```

### To smoke-check

- **`c1_clefts_fronting`** and **`c1_participle_absolute`** — quiz ladder on
  both, 48 items each. Worth reading a dozen Czech prompts in each: I rewrote
  the participle shell's Czech from scratch because it was calqued
  (*"Vše uváženo, uspěli jsme."*, *"To řečeno, rizika zůstávají."*).
- **`a1_questions_negatives`** — *"Does it help?"*, *"Are you tired?"*,
  *"I don't like football."*, *"I am not angry."*, *"What do you need?"* now
  replace the tea/coffee/hungry/ready set, and the intro cards were updated to
  match.
- **`trunk_verbs_more_a1`** — the 12 taught verbs are untouched; only the frame
  objects moved, because at that position the student knows 70 words.

---

## 2026-08-07 · local (James + Claude) — P0 CLEARED, 12 orphans routed, 3 gates added

James read run 11 and made four calls by dropdown. All four are shipped.

### 1. The P0 is fixed — `3c94e84`

`js/pack-adapt.js` translates the real pack shape into the ladder the engine
expects. Confirmed your diagnosis independently before touching it: 93/93
grammar packs carry `blocks[]` and 0/93 carry any of match/quiz/type_items/
use_items, and `pack.intro` is `{cards:[...]}` against an engine expecting an
array — so intro was skipped too, not just the drills.

| stage | built from |
|-------|-----------|
| match | items with `en` + `cz` |
| quiz  | gap frame + options: authored `quiz_options` where present, else sibling `gap_answer`s, **never** an option the item itself accepts |
| type  | `gap` as prompt, `gap_answer` as answer, **`cz` as the hint** so the stage stays CZ→EN |
| use   | `cz` → full `en` sentence |

`check.sequence` is honoured (packs asking for match+quiz get both; quiz-only
packs get quiz). Sample of the real output — `a1_present_simple` quiz:
*I ____ with Anna.* → work / works / live / lives.

### 2. New gate: `codex/check_playable.py` — **run it before every commit**

It simulates the adapter and fails on any live grammar unit whose ladder would
render empty. This is the gate that would have caught the P0 on day one; lint
and audit both cannot see this class of defect. It also carries **your quiz
single-answer check**: any option that the item's own accepts would grade
correct is a second correct answer, and errors. Now in `scripts/smoke.py`.

Result: **72 live grammar units on path · 0 errors · 1 warning.**

The warning is real and now queued: `a1_word_order` declares
`check.sequence: ["order_click"]` with `tokens[]` for a word-order builder no
engine implements. It plays intro → Use today. Engine work, local lane.

### 3. Irregular-verb table in `audit.py` — your run-10/11 request, shipped

~65 pairs (sat/knew/gave/said/ran/stood/became…). Stop re-lexifying around
them; *No sooner had we sat down…* is legal again.

### 4. The 12 orphans are routed — they were NOT parked on purpose

Your finding was correct and it was the biggest lever in the repo. All 12 are
now in `data/spine.json` as vocab consolidation steps, placed pedagogically
rather than dumped at the end: trunk verb/pronoun/modal sets early (core
material), theme leaves next to their neighbours — health after body, school
after work, animals after shopping, nature after time, tech and ideas last.
A1 path 41 → 53 nodes. **Zero orphaned live nodes remain.**

### Gates after all four

| gate | before | after |
|------|-------:|------:|
| `verify_pack` | 160 packs · 0 errors | **0 errors** (12 pre-existing warnings) |
| `check_playable` | (did not exist) | **0 errors** · 1 warning |
| `audit` | 396 | **242** — baseline 396 → 382 (irregulars) → **242** (routing) |

Against the 756 baseline at setup, sequencing violations are down **68%**.
The remaining 242 are much likelier to be real authoring debt now, so run 12's
sequencing repairs should bite properly.

### For the cloud lane

- **Three gates now, not two.** `check_playable.py` joins the pre-commit set —
  see AGENTS.md. If you ever change pack shape you must change BOTH
  `js/pack-adapt.js` and `codex/check_playable.py`, or the ladder silently
  empties again.
- Keep building — James's call, explicitly. B1/B2 finish, then C1.
- Your run-11 offer stands and is accepted: **audit older packs for the
  two-correct-answers defect.** The mechanical half is now gated, but the
  semantic half (*is being held* is real English) still needs reading. Fold it
  into runs as you touch each unit rather than one big sweep.
- Credit where due: the browser verification in run 1 (52/52 units, zero
  questions asked, then "100%") is what made this diagnosable, and the run-11
  routing finding was right on the evidence and right to stop short of
  shipping it.

---

## 2026-08-07 · cloud run 11 (RUE build, claude-opus-5)

### Headline: **12 fully-authored, LIVE A1 vocab units are in no `path_order` — students never reach them, and the 267 words they teach account for 169 of the 396 audit violations (43 %).** The "seed-list backlog" of runs 8–10 was never a missing-vocabulary problem. It is a routing problem. Also: two A1 units repaired to zero, and C1 is now 3/22.

### What landed

| # | Commit | What |
|---|--------|------|
| 1 | `8af4bf4` | `a1_frequency` re-lexified, 10/24 items — 8 types → **0** |
| 2 | `981caf2` | `a1_and_but_because` re-lexified, 8/24 items — 8 types → **0** |
| 3 | `c7689e6` | **`c1_time_aspect_edge`** built + live — 10 → **48** items |
| 4 | `1af41c0` | **`c1_inversion_emphasis`** built + live — 10 → **48** items |

### Gates

| | start of run | end of run |
|---|---|---|
| `verify_pack` | 160 packs · 0 errors · 12 warnings | **160 packs · 0 errors · 12 warnings** |
| `audit` | 412 unknown types · 60 units | **396** · 58 units · baseline tightened 412 → 404 → 396 |

Net **−16** unknown types while adding **96** new items. Both repaired units
drop off the report entirely (the first A1 grammar units to hit zero), and
both new C1 units are **100 % pool-clean — 0 violations between them, neither
appears in the report.** The 12 warnings are the pre-existing
`b2_clear_claims` ones, unchanged. Gates green before every commit; commit
and push per unit.

---

### THE FINDING: twelve live A1 vocab units are unreachable

This is the thing to read this run. Twelve units are `status: "live"`, have
authored content, and appear in **no `path_order` array at all**:

```
leaf_animals_a1  21    leaf_school_a1          47    trunk_verbs_more_a1   12
leaf_health_a1   24    leaf_tech_a1            24    trunk_verbs_more2_a1  12
leaf_ideas_a1    47    trunk_glue_modals_a1     8    trunk_verbs_more3_a1  12
leaf_nature_a1   36    trunk_glue_pronouns_a1  12    trunk_verbs_say_a1    12
                                                     (targets each)
```

**267 distinct words**, authored and sitting in the repo, that no student can
reach. A1 has 53 live nodes and a 41-node path; that gap is exactly these 12.

Every "this word is taught nowhere in 122 units" complaint I have logged in
runs 8, 9 and 10 traces back here. I checked each one mechanically rather
than trusting the earlier digests:

| word | I previously reported | actually |
|------|----------------------|----------|
| `say` `tell` `ask` `hear` | "taught nowhere" | `trunk_verbs_say_a1` — **off-path** |
| `answer` `question` `word` | "taught nowhere" (blocked authoring 3 runs) | `leaf_school_a1` — **off-path** |
| `weather` | "taught nowhere" | `leaf_nature_a1` — **off-path** |

**169 of the 396 remaining violations (43 %) are words these 12 units teach.**
That is the single largest lever in the repo and it is not an authoring job —
it is a dozen lines in `data/spine.json` / the `path_order` arrays.

**I did not ship it.** Path membership decides what every downstream unit may
legally use; dropping 267 words into the A1 pool re-sequences the entire
course beneath it, and that is a course-design call, not a content call. It is
also not obviously a bug — you may have pulled these deliberately. Conservative
path taken, logged here.

**What I would want to know before doing it:** were these parked on purpose?
If not, the sensible order is (a) decide their positions in the A1 path,
(b) rebuild, (c) let the ratchet auto-tighten, then (d) re-run the sequencing
repair against whatever is left. Done in that order the remaining 227
violations are probably real authoring debt; done in the other order I will
keep re-lexifying sentences to avoid words the course already teaches.

Note it does not touch this run's numbers: the 396 is honest, and the two
units I repaired I repaired legitimately.

---

### Judgment calls and forks

**1. A quiz gate is missing, and I found real defects with it by hand.**
Nothing in the repo checks that a multiple-choice item has exactly **one**
correct option. `verify_pack` checks frame reconstruction; `audit` checks
vocabulary; neither reads `quiz_options`. Building `c1_time_aspect_edge` I
substituted all four options back into all 48 frames and read the 192
sentences — **eight items had two defensible answers:**

- Six process items where the simple perfect is genuinely acceptable next to
  the continuous (*By June I will have taught here for twenty years* is not
  wrong), so the student could be marked wrong for good English.
- `The meeting is being held upstairs.` — offered as a distractor against
  `is to be held`. It is simply correct English.
- `She is due to start her new job on Monday` had `going` as a distractor:
  *is going to start … on Monday* is correct too.

All eight fixed before commit. I did the same read on
`c1_inversion_emphasis` (another 192) and additionally replaced 20 distractors
that were word-salad (`we finish can on time`) with plausible learner errors
(`can we finishing on time`) — a scrambled distractor teaches nothing because
nobody would ever pick it. **Suggested: a ~30-line `verify_pack` check that
flags any item whose `gap_accepts` intersects `quiz_options` in more than one
place.** That catches the mechanical half automatically. The semantic half
(*is being held* is real English) still needs a human or a model reading it —
worth knowing that this class of defect is currently invisible to the gates
and has probably shipped in earlier units. I have not audited older packs for
it; say the word and I will.

**2. `b2_future_forms` already owns the ordinary futures, so the C1 unit takes
only the edges.** B2 teaches will / going to / present continuous / present
simple / future continuous / future perfect / time clauses / was going to. So
`c1_time_aspect_edge` deliberately teaches none of those again: it takes
future perfect **continuous** against future perfect from a named future
point, `be to` / `be due to` (including the passive `is to be published`),
`was to have + PP` for the plan that failed, and the aspect that is not about
time at all (`always/forever/constantly` + continuous, `keep + -ing`, state
verbs in the continuous). If you would rather it had re-drilled the basics,
that was the fork and I took the no-duplication path.

**3. `b2_inversion` is a sketch in no `path_order`, so `c1_inversion_emphasis`
is the only place the course teaches inversion.** I built it to stand alone
rather than assume B2 groundwork that a student never sees — hence four full
strands including the `Only after the guests had left **did we** start to
clean` trap, which is where learners actually fail. Related to the finding
above: same routing problem, different level.

**4. Names again — conservative path, same as run 10.** `Homare` and `Patrik`
in `a1_and_but_because` audit as untaught vocabulary because they are not in
`audit.py`'s GLUE name list. I renamed them (`Anna`, `Petr`) rather than widen
GLUE, for the reason run 10 gave: widening drops the total without improving a
sentence. Still your call, still deserves its own labelled commit if you want it.

**5. The irregular-verb blind spot bit again, exactly as run 10 predicted.**
`sat`, `knew`, `gave`, `fell`, `rang`, `ran`, `stood`, `said`, `became`,
`recognised` all read as untaught. Casualties: *No sooner had we **sat down**
than…* became *No sooner had we **arrived**…*, and `Little did she know` only
survived because I made the whole phrase the gap answer, which legalises
`know` as a target. That is a workaround, not a fix. The ~60-pair irregular
table in `audit.py` is still the right answer and still not mine to ship.

**6. Two violations I did NOT dodge by deleting teaching.** In `a1_frequency`
the `never` items must show a positive verb after `never`; I kept all five and
re-lexified around them. In `a1_and_but_because` the gap stays on
and/but/because only and the 8/8/8 split is intact. No teaching point was
removed to move a number in either unit.

**7. Small, flagged: `well` in `a1_frequency` comes from the same-step partner
unit**, not from the pool proper (`She always works hard` → `She always works
well`). Legal by `audit.py`'s own partner rule, but it does mean the student
meets the word in the same step rather than earlier. Reject it if you dislike
the dependency.

### Repair queue — 4 open items reviewed, 0 newly ticked

Unchanged, and again nothing manufactured to produce a tick. All four sit
outside this lane: the **P0**, the hardcoded `A1` vocab badge, `zero_article`
(blocked on the P0), and the `b2_clear_claims` style call. Re-verified the P0
mechanically rather than trusting the queue text: `js/practice-grammar.js`
still contains **zero** occurrences of `blocks`, and still reads `pack.match` /
`pack.quiz` / `pack.type_items` / `pack.use_items`, none of which exist in any
of the 160 packs.

**The P0 is eleven runs old and this run put 96 more grammar items behind it.**
Ninety-six items I verified by hand, in a practice engine that will ask a
student none of them and then report "Check: 100 %". The adapter proposal has
been in this digest since run 1; it needs about twenty lines of `js/` and a
decision from you. Content is the lane I have, so I will keep building — but
the gap between "units live" and "units a student can actually practise" grew
again today.

### Smoke-check list

- **`c1_time_aspect_edge` strand 4** is the one to look at first. It teaches
  that a continuous form can carry irritation rather than time (*She is always
  complaining*, *He keeps interrupting me*) and that state verbs shift meaning
  in the continuous (*He is being difficult*). If you think that belongs in a
  separate pragmatics unit rather than under "time & aspect", say so before I
  build more C1 and I will move it.
- **`c1_inversion_emphasis` strand 2** — the *Only after X **did we** Y* rule.
  Card 3 is built entirely around it because it is the error learners actually
  make. Check the card reads clearly; it is the densest thing in the unit.
- `a1_frequency` — *I never drink tea* is now *I never cook*, and the five
  `never` explanations quote it. Czech *Nikdy nevařím* is clean, but it moves
  the unit's flavour off food. Reject if you dislike it.
- `a1_and_but_because` — *He is small but strong* → *He is short but quick*
  (`strong` is untaught; `short` comes from `leaf_body_a1`). Same contrast,
  different pair.
- **C1 is now 3/22 on-path live. Next in path order: `c1_clefts_fronting`.**

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
