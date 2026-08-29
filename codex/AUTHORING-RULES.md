# Authoring rules — learned by smoke testing

Every rule here came from a real failure found by playing a unit. None is theoretical.

## How to use this

- **IDs are stable.** A lint check names the rule it enforces; a pack `note` can cite the rule
  it follows. That is what makes this bite instead of sitting there.
- **State tells you what to automate next.** A rule at `observed` is a hunch with one data
  point. At `enforced` a script catches it and you can stop thinking about it.

| State | Means |
|---|---|
| `observed` | seen once, in one unit |
| `confirmed` | seen again, in a different unit |
| `enforced` | `codex/lint.py` catches it — you no longer hunt for it by hand |

**Capture ritual (after every smoked unit, before the commit):** Telegram tick, then ask
*what happened here that isn't already a rule?* New rules go in as `observed`. A rule that
recurs is promoted to `confirmed`. When a check lands, it becomes `enforced` and names its ID.
Then `python codex/reconcile_inspected.py` and commit. The tab is not the memory.

**The one rule under all the others:** the gates check STRUCTURE. Every failure below was
present while `audit`, `check_pretaught` and `check_playable` were green, and had been for
weeks. **A green gate means a unit will not crash. It says nothing about whether it is any
good.**

---

## Smoke method — audit first, then change (I8)

Do not dive in. Lessons from one unit carry to the next only if they are in this file
and in git, not in a long tab.

**Before any rewrite**, audit every stage against the rules below. Write findings.
Then dropdowns. Then change. Then James plays.

| Stage | Look for |
|--|--|
| **Intro** | C1 what it is before any correction · C14 card 0 is the unit name + Czech · one job per page · C9 no walltext · C10 table/diagram on every card · C11 every Quiz contrast has a card · C12 common mistakes are real L1 errors · C4 examples from this bank · C13 bold the form on every card · C15 no *chunk* · C16 no hyponym-as-meaning · C17 no *Remember* recap · C18 title names the thing · C19 no stray L1 in an English table · C20 no lesson-plan notes · C21 dummy-subject units need Common mistakes · C22 A1 metalanguage (*permission*) needs Czech · C23 no *this pack* / *at A2* · C24 no joiner POS taxonomy (*two things* / *two actions*) · C25 no *Not add, not why* / *Not in / on / at* · C26 no *small words* · C27 mistakes column first · C28 diagram key must exist · **C29** tense card 0 has a timeline vs tenses already taught · **C30** what-it-is-not is a Not/Say table, not *Not:* bullets · **C31** no *base* unless the card shows *work* not *worked* · **C32** error rows are `~~strike~~`, not italic · **C33** past continuous usual job is interrupted (*was -ing* when + past simple), not clock-time snapshots · **C34** no *3rd form* — say past participle · **C35** pairs/mistakes tables over ~6 rows split across two cards |
| **Match** | Does it test the grammar point, or only EN↔CZ? Sentence boards are a toll; skip exists. **B9:** full sentences → 8 pairs, not 12 (12 is for words and short phrases). **B10:** in/on/at time → sort boxes, not sentence pairs. **B12:** if Czech cannot pick this tense, Check is a **sort of English sentences** (same verb, light time cue), not EN↔CZ and not see→seen. **B13:** a sort chip must pick the bin (*Saturday* → *on*); *This bag is big* does not pick will vs going to. **B14:** *-ed / -ing* adjectives → sort feeling/cause, not EN↔CZ. D3: no teacher notes in `cz`. **E5:** command banks are adult — classroom tiles in ones and twos, not a school board. **A0:** Czech must force THIS tense (*Pršelo* is also *It rained*; *Uklidil jsem kuchyň* is also *I cleaned*). |
| **Quiz** | A0 one degree of freedom · **A9:** Czech past does not pick present perfect — *just/already/yet/never/for* (and Czech *už/ještě/právě*) · B3 authored chips on a form pack · B6 on-axis · B7 sentence gap, not `____ = meaning` · B8 gap is THIS unit's point (not a neighbour, not *a/an* inside *there is*, not *can/can't* when the error is *to swim*) · chips include the right answer · no untaught extras (C11) |
| **Type** | Same target as Quiz · A8 contractions · I7 leftover `accepts` after a rename · explanations name THIS item (D1), not a neighbour (F2) · **B11:** if the English stem does not name the verb, `(lemma)` on the gap (`You ____ when I called.` → `(sleep)`; `I ____.` → `(just/finish)`) · **A11:** many-pair form pack cues the stem (`(surprise)`) so Type is not a vocab test |
| **Use** | F3: production may not lead. Partner + glue + this unit's words. A1 Czech is fine to smoke. Flag translation-only false-wrongs. **D5:** a stative in this unit names present simple in the explanation. **E4:** a sentence a teacher has never heard is not Use (*She wasn't listening when I came*). **E6:** the situation must be true in the world (cold → open a window is false). **E7:** A2 many-pair form pack Use is error-correction, not CZ→EN. |

A1/A2 translation is allowed except E7. Recognition may lead; Use may not (F3).

**After Telegram `<unit_id> tested`:** new rules in this file → `python codex/reconcile_inspected.py` → commit → **new tab** for the next unit.

---

## A · Prompt determinacy

> **A0 — Every item has exactly ONE degree of freedom: the thing being taught.** Everything
> else must be forced by the prompt. If the prompt doesn't determine the answer, either fix the
> prompt or accept every legitimate answer. No grading leniency can rescue a prompt that lacks
> the information. — `confirmed`

**Test for any item:** could a competent translator, or Google Translate, produce something
correct that this item rejects? A whole Use stage scored **3/12** against pasted Google
Translate answers. `a1_some_any` 2026-08-29: *Is there any problem?* — James has heard
*a problem* and *some problem*; cut the item. A native who would fill the gap with more
than one of *some* / *any* / *a* is not a teaching item.
`a1_to_for_with` 2026-08-29: *Come ____ me* is *to* / *with* / *for* in English, but
Czech *Pojď se mnou* only means *with* — kept. *I talk ____ my teacher* is A5
(*to* and *with* both from Czech *s*), not a Czech-forced chip.
`a2_past_continuous` 2026-08-29: Czech *Pršelo* is *It rained* or *It was raining* —
Match/Use that pair does not test continuous. Force it (*zrovna* / *když* / a clock).
`a2_present_perfect` 2026-08-29: *Uklidil jsem kuchyň* / *Obědvali* / *Neposlala e-mail*
are also past simple. Force it (*právě* / *už* / *ještě* / *nikdy* / *for two years*).
`a2_will_going_to` 2026-08-29: *I ____ the window* with chips *will open* / *am going to open*
does not pick the form unless the stem is the job (*It's hot* / *I have a plan* / *Look at the sky*).
A sort chip *This bag is big* is the same hole — both boxes look right.
`a2_ed_ing_adjectives` 2026-08-29: *The dog was ____* is *frightened* or *frightening* — a cause-adjective subject cannot be a creature that feels (*The film was ____*). Type *The book was ____* with Czech *překvapivá* was a vocab test (*interesting*); cue the stem `(surprise)` so the only freedom is the ending.
`a2_some_any_no` 2026-08-29: *Do you want ____?* — *something* and *anything* are both real questions; *Chceš něco?* does not pick. *You can ask ____ question* — *some questions* and *any questions* are both fine; cut.

| ID | Rule | From | State |
|---|---|---|---|
| **A1** | Czech `když` is both *if* and *when*. Accept both in a REAL conditional; never in an unreal one. | *"When you heat water, it boils"* marked wrong by a unit that teaches *when* behaves like *if*. 143 of 180 `If` items are unreal. | `enforced` — lint `ifwhen`, engine `lenient_if_when` |
| **A2** | A Czech clause with no explicit subject does not specify one. Name the subject, or accept he/she/it. | *Když přijde pozdě* is he, she or it. 169 items list `he` and `she` but not `it` — the author knew and stopped halfway. | `enforced` — lint `subject` |
| **A3** | Czech perfective present is FUTURE. Never use a perfective prompt for an English present-tense answer. | *přijdeš* = *you will arrive*, but the item demanded *"you arrive late"*. The worst credibility failure found. | `enforced` — lint `czfuture` (candidate) |
| **A4** | Czech has no articles. Don't demand `the` unless English forces it or the Czech marks it. | *koupím kávu* → *"buy **the** coffee"* required; *"buy coffee"* rejected. ~1,009 items demand `the` with no Czech support. | `enforced` — lint `article` (candidate) |
| **A5** | One Czech word with two English renderings needs both accepted. | *brzy* is *soon* and *early*; only *early* was accepted. `a1_to_for_with` 2026-08-29: *Mluvím s učitelem* → talk **to** or **with**; Type marked *with* wrong. `a2_present_continuous` / `a2_past_simple` 2026-08-29: *obědvat* / *snídat* → **have** or **eat** that meal. | `confirmed` |
| **A6** | Never demand a word the Czech does not contain. | *Zavolám* is *I will call*; the key was *"I will call **you**"*. | `observed` |
| **A7** | Free English synonyms must be in the synonym map. | *everyone* rejected for *everybody*. The map had 41 Czech-ambiguity pairs and no English-side free choices. | `enforced` — lint `synonym` |
| **A8** | Contractions accepted both ways, always. | *"I cannot stand"* rejected where *"I can't stand"* was the key. 404 items across 71 units. | `enforced` — lint `contraction` |
| **A9** | Czech past does not pick English present perfect. A Quiz/Type item whose only cue is *Dokončil jsem* / *Uklidil jsem kuchyň* also accepts past simple. Put *just / already / yet / never / for* on the stem and the matching Czech (*právě / už / ještě / nikdy / dva roky*). | `a2_present_perfect` 2026-08-29: *"are you totally sure the cz makes this unambiguous?"* — no. | `enforced` — lint `ppcuz` |
| **A10** | *going to work* is the commute, not a future plan. Do not use *work* as the schematic after *going to* (*am going to + work*). Do not write *He is going to work tomorrow* as a plan item. Use *study* / *help* / *call*. | `a2_will_going_to` 2026-08-29: *"ambiguous: I am going to work often means I am travelling to work."* | `observed` |
| **A11** | When a form pack drills many pairs of THIS word (*bored/boring*, *interested/interesting*), Type and Quiz cue the stem in brackets (`The book was ____. (surprise)`). Without the cue Type is a vocab test. Same mechanism as B11, different pack type. | `a2_ed_ing_adjectives` 2026-08-29: typing *int…* for *překvapivá*. | `enforced` — lint `stemcue` |

---

## B · Distractors

| ID | Rule | From | State |
|---|---|---|---|
| **B1** | A distractor must be clearly wrong, never arguable. If a native would hesitate, it isn't one. | *acting* offered against *actor* — marginal, not wrong. | `observed` |
| **B2** | Never borrow a sibling item's answer as a distractor in a FORM pack. Borrowing is right only where the point is *which word*. | 1,543 items across 54 units borrow. `b1_verb_patterns_advanced` offered no `-ing` option at all in a unit about `-ing`. | `confirmed` |
| **B3** | Author `quiz_options` wherever the teaching point is form. The fallback cannot know the axis. | 47% of gap items have none. | `confirmed` |
| **B4** | The unit's own target error must appear among the options. | `a2_comparatives` was extended for *more better* — and *more better* is never shown. | `observed` |
| **B5** | A Match board needs distinct PROMPT tiles. Repeated labels on the ANSWER side are fine when prompts are distinct and grading is by instance (words → their classes works; James built and class-tested exactly that). The ban is on boards whose prompt tiles repeat — "one" five times is clicking, not matching. First version of this rule over-reached and briefly killed James's own labels board; scope it to the prompt side only. A closed class is **one tile per word**, not doubled to fill twelve slots. | `a1_word_classes`: one/more board (bad — identical prompts) vs labels board (good — distinct words, repeated classes), both smoked 2026-08-25. `a1_question_words` 2026-08-29: who/what/where twice each — "just have them once". | `confirmed` |
| **B6** | Options stay on the teaching axis. *anybody / somebody / nobody* tests the quantifier; *anyone / anywhere / anything* tests the stem. A form pack offers forms of THIS word, not sibling verbs. | `a2_quantifiers` 2026-08-26; `a1_present_simple` 2026-08-29: *I ____ in an office* offered work / live / like. `a1_like_want_need` 2026-08-29: *He ____ a phone* must offer *needs / need*, not like / want / to. | `confirmed` |
| **B7** | Closed-class Quiz/Type is a **gapped sentence**, not a definition (`____ = person` / `time → ____`). Meaning pairing is Match. | `a1_question_words` 2026-08-29: flags 9–10. | `observed` |
| **B8** | The gap is THIS unit's teaching point, not a neighbour's. Do not gap the infinitive particle `to` alone (`She wants ____ work` → `to` — contrast *to V* with bare *V*). Do not gap *a/an* inside *there is*. Do not leave dummy *There* already on the page and only test *is/are*. Do not gap *can/can't* when Czech already picks the chip and the error is *can to swim*. | `a1_like_want_need` 2026-08-29: *She wants ____ work*. `a1_there_is` 2026-08-29: *There is ____ university*. `a1_can` 2026-08-29: *I ____ speak English* → can. *"just clicking can/can't — pointless."* | `confirmed` — lint `toparticle`, `articlegap`, `theregap`, `cancant` |
| **B9** | Twelve Match pairs is for **words and short phrases**. Full-sentence boards are **8**. Sized from the tiles on the board (a `.?!` or four-plus words counts as a sentence), not a character average. | `a2_first_conditional` 2026-08-20: *"full sentences, we only need 8, not 12"*. `a1_some_any` 2026-08-29: char-avg 23 still painted 12 and felt walltexty. | `enforced` — engine `matchBoardSize` |
| **B10** | **in / on / at** for time is a **sort**: three boxes, time chips (*Saturday*, *5 o'clock*, *July*). Sentence EN↔CZ Match does not test the prep. | `a1_prepositions_time` 2026-08-29: *"the match for this should be a drag and drop with in on at"*. Same engine as countable (`sort_bins`). | `enforced` — lint `timesort` |
| **B11** | Whole-VP Type/Quiz: if the English stem does not name the verb, put `(lemma)` on the gap. Time-word VPs cue both pieces: `(just/finish)`. | `a2_past_continuous` 2026-08-29: *You ____ when I called.* → *were sleeping*. `a2_present_perfect` 2026-08-29: *I ____.* → *have just finished* needs `(just/finish)`. `a2_will_going_to` 2026-08-29: *We ____ the kitchen.* → *are going to paint* needs `(paint)`. | `enforced` — lint `verbcue` |
| **B12** | When Czech cannot pick this tense, Check is a **sort of English sentences** (same few verbs, light time cue), not EN↔CZ Match and not *see → seen*. | `a2_present_perfect` 2026-08-29: participle Match *"only about finding past participle"*; person→have/has *"teaches nothing"*; sentence Match is tense-ambiguous. Three boxes: present simple / past simple / present perfect. B1 still owns *yesterday* vs *since* as markers. | `enforced` — lint `ppsort` |
| **B13** | A sort chip must pick its bin the way *Saturday* picks *on*. A noun-state (*This bag is big*, *The door is closed*, *I'm thirsty*) does not pick *will* vs *going to*. If the chip does not force the box, do not sort — skip Match. | `a2_will_going_to` 2026-08-29: *"I have a bag: will or going to???!!!"* Sort cut; unit is thin. | `observed` |
| **B14** | Feeling vs cause (*-ed / -ing* adjectives) is a **sort** (person / thing), not EN↔CZ sentence Match. Sentence Match is translation; the chips on Sort are the adjectives. | `a2_ed_ing_adjectives` 2026-08-29. Same engine as countable and in/on/at. | `observed` |
| **B15** | Match is not required on every unit. A Check task the student can solve by reading a word off the chip (sort box *no* with chip *I have no coffee*) or by pairing the same noun across columns (*bread* ↔ *bread*) is not a test. Skip Match. | `a2_some_any_no` 2026-08-29: EN=EN equivalents matched by noun; sort captions and Czech *jakoukoli / kdykoli / žádný* classified the chip. Check is Quiz only. | `observed` |

---

## C · Intro cards

| ID | Rule | From | State |
|---|---|---|---|
| **C1** | Orient before you correct. Card 0 says what the thing IS, then what trips a Czech speaker. For a form-change unit, name the forms they already know, then the change. | The rewritten first-conditional card opened on the contrast; a student who had never met a conditional met the correction first. `a1_object_pronouns` 2026-08-29: opened on *two jobs / subject vs object* instead of *you already know I, you, he… they change after the verb*. `a1_some_any` 2026-08-29: opened on *some in + / any in − and ?* instead of *they are quantifiers — quantity of a noun — then some = positive, any = negatives and questions*. | `confirmed` |
| **C2** | Name the misconception the card replaces. Restating the form teaches nothing — the student already half-knows it. | The cards that work say *why*: *"English word order is fixed, so articles carry that signal"*. The ones that fail restate the shape. | `confirmed` |
| **C3** | Don't bury the insight below the rule. | The *Czech marks the future twice* line existed — as a bullet on a card titled "Examples", after the rule. Nobody reaches it. | `observed` |
| **C4** | Don't promise equivalence the bank doesn't drill. | A card claimed five connectors behave alike; `if` got 44 items, the other four nine between them. | `enforced` — lint connector check |
| **C5** | If the engine forgives something, the card must say so — and say where the forgiven forms still differ. | `lenient_if_when` accepted *when* silently. Silent forgiveness teaches nothing. | `observed` |
| **C6** | A gloss must not be harder than the word it glosses. Easier, not merely at-level. | *stop* (A1) explained with *quit* (B1) and *pause* (B2); *"pause in order to"* at B1. | `observed` — lintable against `codex/vocab/oxford-5k-cefr.csv` |
| **C7** | Never assert there is no pattern when there is one. It is false and it is demoralising. | *"There is no rule to compute — English fixes it verb by verb"*, and *"Learn in chunks"* at A2. Verb patterns have two shapes and a real semantic tendency. | `confirmed` |
| **C8** | When a card teaches a test or rule of thumb, it must disclose the test's blind spot in the same card — especially where the student's L1 instinct feeds the test wrong answers. Prefer the test over an abstract definition (C6 territory), but never sell it as complete. | a2_countable: "can you say one ___?" passes *one advice* for a Czech speaker (jedna rada is fine Czech). The trap list existed three cards later, disconnected (James, 2026-08-25). `a1_frequency` 2026-08-29: "two places" is false for *sometimes* (first or last is fine) — named on the same card. | `confirmed` |
| **C9** | **NO WALLTEXT.** An intro card teaches with **tables, diagrams, bullets and example pairs**. `body`/`body_cz` are not teaching surfaces — do not author them. No single bullet, cell or example over **~15 words**. Czech goes in `examples[]` (renders *cz · en*) or `title_cz`. The *why* belongs in the item's `explanation`/`explanation_cz`, which the student reads at the moment they get it wrong. | a2_countable card 0 carried 72 words while five of its seven cards carried none — the whole unit's prose on card 1 of 7. James, 2026-08-26: *"no walltext: this is fatal — I want none of my intros to have walltext."* | `enforced` for **A1–B1 grammar** — `verify_pack` intro-density lint, ratcheted. Vocab and B2+ paused. |
| **C10** | **Every intro card has a table and/or a diagram.** `table.rows`, `diagram` (a key from `intro-visuals.js`), or inline `svg`. Points and example pairs may sit *with* the visual — they do not replace it. | 2026-08-28: 327 of 715 cards had neither. James: grammar only for now; A1–B1 first; put `body` into bullets and tables. | `enforced` for **A1–B1 grammar** — `verify_pack` intro-visual lint, ratcheted. Vocab and B2+ paused. |
| **C11** | If Quiz tests a contrast, an intro card named it. No silent extras in the bank. | `b1_linkers` 2026-08-28: chips included *on the other hand* with no intro page. `a1_present_simple` 2026-08-29: don't/doesn't, goes/studies/watches, everybody in the bank, not in the cards. `a1_questions_negatives` 2026-08-29: be vs do, don't vs isn't. | `confirmed` |
| **C12** | A "common mistakes" card lists only errors a Czech learner actually makes. Do not invent ones a teacher has never heard. | `a1_present_simple` 2026-08-29: *I works* — James has never heard it. Left *She work*, *I am work*, *He doesn't works*. `a1_questions_negatives` kept *You work here?*, *Are you live here?*, *I don't tired*, *Does she works?* `a1_like_want_need` 2026-08-29: *I likes coffee* — same class; keep *She like*, *He want*, *I want go*. | `confirmed` — lint `fakes3sg` |
| **C13** | In intro examples, bold the **taught form**, not the whole sentence. Do it on **every** intro card. On *not any*, bold **don't** as well as **any**. | `a1_questions_negatives` 2026-08-29: highlight *Do / Are / don't*, not *Do you work here?*. `a1_question_words` 2026-08-29: highlight *who*, not *Who is she?*. `a1_object_pronouns` 2026-08-29: highlight *me / him / her* on every page, not *I*. `a2_some_any_no` 2026-08-29: *I don't have any coffee* — *"don't should be highlighted"*. | `confirmed` |
| **C14** | Card 0's title is the unit's name in English and Czech (`title` / `title_cz`). A nickname is not a name. | `a1_questions_negatives` 2026-08-29: *"2 systems"* / *"2 systémy"* — James: translation for *Questions & negatives*, and drop *2 systems*. Now *Otázky a zápor*. | `observed` |
| **C15** | No ELT teacher-words on an A1 card. *chunk / chunks*, *grammar theory*, *just these frames* are course jargon, not student English. | `a1_question_words` 2026-08-29: *"remove chunks"*. `a1_like_want_need` 2026-08-29: Remember card *"Not full grammar theory" / "just these frames"*. | `confirmed` — lint `chunkword` |
| **C16** | Don't list a hyponym as a second meaning. A job is a thing; `thing / job` is not two readings. | `a1_question_words` 2026-08-29: *what* glossed *thing / job*. Job stays on *What does he do?*. | `observed` |
| **C17** | No *Remember / Pamatuj* recap card. The other cards already taught it. Cut it. | `a1_questions_negatives` / `a1_question_words` 2026-08-29 (I9 leftover titles). `a1_object_pronouns` 2026-08-29: *"cut this page: it's stupid and cringe and unnecessary"*. | `confirmed` — lint `remember` |
| **C18** | An intro card title names the thing, precisely. | `a1_object_pronouns` 2026-08-29: *With small words* → *After to / with / at* (Czech *S předložkou* was already the real name). | `observed` |
| **C19** | Don't sprinkle L1 into an English form table. Czech lives in `title_cz` and `examples[]`. | `a1_object_pronouns` 2026-08-29: *On / Ona / Oni* in the Form pairs Note column — *"why are you using Czech randomly?"* | `observed` |
| **C20** | An intro card teaches the student, not the lesson plan. No practice-sequence notes. | `a1_object_pronouns` 2026-08-29: *First: match subject form… Then: full sentences…* / *Practice block* — *"teacher notes on this page: not good"*. | `observed` |
| **C21** | A unit whose English structure Czech does not have (dummy *there*) needs a **Common mistakes** card for the L1 calque (*It is a cat…*, *On the table is a book*, *Is a bathroom here?*). Cutting Remember (C17) is not that card. | `a1_there_is` 2026-08-29: intro had nothing on common errors; James: *"there is, there are is a weird/new structure for cz learners"*. | `observed` |
| **C22** | A1 metalanguage needs a Czech gloss on the same card. *permission* is not student A1 English. | `a1_can` 2026-08-29: *"permission is going to be confusing word for a1 learners: have cz translations."* Now *permission = dovolení*. `a1_some_any` 2026-08-29: *quantifiers (množství)*. `a1_to_for_with` 2026-08-29: *prepositions (předložky)*. | `confirmed` — lint `a1meta` |
| **C23** | The intro never names the pack, the level, or the syllabus. *this pack*, *this unit*, *at A2*, *common A1*, *CEFR* are course-author notes. The page teaches English. | Voice audit 2026-08-29: 20 A1–B1 units. Worst: `b1_modals_speculation` “this pack” table. A1 leftovers smoked off: `some_any`, `prepositions_time`, `to_for_with`, `imperatives`. | `enforced` — lint `courseaside` |
| **C24** | Don't taxonomize a joiner by word class. *and* joins two of whatever is already there — nouns, verbs, adjectives, adverbs. A Frame column of *two things* / *two actions* is fake grammar of *and*, and repeating *two things* on consecutive rows is goofy. | `a1_and_but_because` 2026-08-29: *"why is it necessary to make these distinctions anyway?"* | `observed` |
| **C25** | Don't define this thing by listing what it is not. *Not add, not why* (sibling cards) and *Not in / on / at* (other prepositions) are the same leftover — they are also not proper nouns, adverbs, etc. Name the job. | `a1_and_but_because` 2026-08-29: *"no need for not add, not opposite"*. `a1_to_for_with` 2026-08-29: *"they are not many other things either"*. | `enforced` — lint `negdef` |
| **C26** | Don't call the target *small words*. *a*, *if*, *no* are small and different. Name the class (*prepositions*). | `a1_to_for_with` 2026-08-29: *"this is moronic"*. C18's *With small words* title was the same leftover. | `enforced` — lint `smallwords` |
| **C27** | A Common mistakes table puts the **error first**, the correct form second. | `a1_to_for_with` 2026-08-29: Say / Not was backwards. `a1_there_is` already had mistake → correct. | `enforced` — lint `mistakecol` |
| **C28** | A `diagram` key must exist in `intro-visuals.js`. An unknown key is a blank picture; C10 still goes green because it only checks the field is non-empty. Use a real key, or inline `svg` and drop the dead key. | `a1_prepositions_time` 2026-08-29: `in-on-at-scale` was not a schematic — card 0 drew nothing. | `enforced` — lint `baddiagram` |
| **C29** | A tense unit's card 0 has a **timeline** against tenses already taught. The new form sits where it lives in time: past simple LEFT of NOW (finished); present continuous AT NOW (short window). A point to the right of *every day* reads as future. A now/every-day table is not that picture. Labels are student English. On a future unit, NOW is a centre line: *I'm working* hangs on that line, *I'll* is to the right. Four equally-spaced stations put *now* in the future half. | `a2_present_continuous` 2026-08-29: *"should have a timeline to compare it to previously covered tenses"*; left-to-right made continuous look like the future. `a2_past_simple` 2026-08-29: card 0 was a shape table — *"needs a timeline, comparing with previously learned tenses"*. `a2_will_going_to` 2026-08-29: *"this timeline makes I am working look like future."* | `confirmed` |
| **C30** | After the IS table, *what this is not* is a **Not / Say** table, not *Not:* bullets. Card 0 of a form unit: shape first, then the L1 misses as rows. Extra tables live in `tables[]` (engine renders `table` then `tables`). | `a1_imperatives` 2026-08-29: +/− table was good; *"sentences at bottom could be improved: show a table to show what imperatives are not"*. | `enforced` — lint `notbullet` |
| **C31** | Don't write *base* / *base form* / *base verb* on an A1/A2 card unless the same card shows the form (*work*, not *worked*). Or skip the word and write the form. | `a2_past_simple` 2026-08-29: *"base: this is confusing, teacher talk - if it's not explained"*. | `observed` |
| **C32** | Intro error examples must **look like errors**. Use `~~strike~~` (renders `.wrong-eg`). Italic `*I didn't went*` reads as emphasis, not a mistake. Wrong / Right headers help; they are not enough alone. | `a2_past_simple` 2026-08-29: Negative card — *"it doesn't show that the mistakes are actually mistakes!!!!"* | `observed` |
| **C33** | Past continuous's **usual job** is interrupted background: *was -ing* **when** + past simple. A bank of clock-time snapshots (*I was working at six*) does not teach it. The When card shows **when** joining the clauses, not two columns with *when* only in the bullets. | `a2_past_continuous` 2026-08-29: *"much of the time we use past continuous, it's an interrupted action… very few of these sentences are interrupted."* Table said *when* joins them and then dropped *when*. | `observed` |
| **C34** | Don't write *3rd form* / *3. tvar* on an A1/A2 card. Students do not know 1st and 2nd. Name **past participle** (*příčestí minulé*) and show *seen / gone / eaten* on the same card. | `a2_present_perfect` 2026-08-29: *"3rd form to me is 3rd of what?"* | `enforced` — lint `thirdform` |
| **C35** | A pairs or mistakes table with more than about six content rows splits across two cards. One 12-row dump is too much text; Quiz still covers every pair. | `a2_ed_ing_adjectives` 2026-08-29: Common pairs, then Common mistakes — *"too much text / split to two pages"*. | `enforced` — lint `longtable` |
| **C36** | Don't write *in +* / *in − and ?*. That is a teacher puzzle. Write **positives / negatives / questions**. | `a2_some_any_no` 2026-08-29: *"some in + · any in − and ? … a user won't have time for this."* | `enforced` — lint `plusminus` |

**C9 note — why the prose can go.** 2,111 of 2,123 A1/A2/B1 grammar items (99%)
already carry `explanation` *and* `explanation_cz`, rendered by `js/explain.js`
beside the answer feedback. Intro prose was mostly duplicating a layer that
delivers the same content at the point of error, where it is actually read.
Removing it loses nothing; it relocates.

A **ratchet** is a count of remaining violations that is only allowed to fall.
It was how C9 survived a 986-hit corpus without turning the build red forever.
As of 2026-08-28 the A1–B1 grammar count is **0**: a new `body`, or a bullet
over ~15 words, is an error. Vocab and B2+ are not in that count.

---

## D · Explanations

| ID | Rule | From | State |
|---|---|---|---|
| **D1** | An explanation must name THIS item's word and shape, and give the reason. A generic note is filler. | `b1_verb_patterns_advanced` had **9 distinct explanations for 56 items**; one string covered 23. `a2_quantifiers` pasted *"Quantifier: much/many/a lot of…"* on almost every item, including the any-compounds. | `confirmed` — lintable: count distinct explanations per pack |
| **D2** | Explanations render automatically with the feedback, not behind a click. | Hidden behind "Why?", most students never read them. Reversed 2026-08-24 — which makes D1 urgent, since filler is now visible. | `confirmed` |
| **D3** | `cz` is student-facing. No teacher notes, English asides, or editor leftovers in it. *(On — a man)*, *desk ≈ table*, *povolání → a/an* all rendered on Match and Use. Dual Czech with a slash is the same class of leftover. A bare *Ano.* / *Ne.* on a short-answer item does not pick *did* / *didn't*. | `a1_possessives` 2026-08-29. `a1_frequency` 2026-08-29: *Vždycky piju kávu. / Vždy piju kávu.* `a2_past_simple` 2026-08-29: *No, I ____.* with *Ne.* — *"bad translation: cz just says no"*. Now *Ne, nepracoval.* | `confirmed` |
| **D4** | A gloss names what the word **asks for or points to**, not what the word is. *why = reason* is false (why is not a reason). *how = way* is too loose (*way* is a road, a habit, a gap). Write *asks for a reason* / *the way you do it*. | `a1_question_words` 2026-08-29: flags 7–8. | `observed` |
| **D5** | If a continuous unit carries present-simple / stative items, the explanation names **present simple** and bans **-ing** on THAT verb. A generic continuous helper pasted on *needs* is silent. | `a2_present_continuous` 2026-08-29: *We prefer tea to coffee* — *"this should be shown in explanation"*. | `observed` |

---

## E · Sentences

| ID | Rule | From | State |
|---|---|---|---|
| **E1** | A sentence needs a situation, not just a grammar frame. | *"I will call you if I arrive early"* — grammatical, and means almost nothing. Compare *"If it rains, I'll work at home."* | `observed` |
| **E2** | One error per error-correction item. If the "correct" answer still contains something questionable, the item teaches it by implication. | A carrier sentence introduced an over-used *how* beside the target error. | `confirmed` |
| **E3** | Accepts stay aspect-strict: a continuous twin is NOT an accepted variant of a simple-form answer (Czech learners over-apply the continuous once they acquire it). Add the twin only where the simple form is unnatural in context — momentary weather and the like — and mark it item-by-item as an exception. | `a1_agreement` *Tady prší.* — "It's raining here" is the natural English and was rejected; James's call 2026-08-25: accept there, nowhere else in the unit. | `confirmed` |
| **E4** | Don't ask the student to produce a sentence a teacher has never heard. Coursebook contrast is not Use material, and not an intro table cell. | `a2_quantifiers` 2026-08-26: dropped bare-*Few*. `a1_and_but_because` 2026-08-29: *late but happy* / *cold but nice* — *"goofy, weird"*. `a2_past_continuous` 2026-08-29: *I wasn't cooking when you called* / *He wasn't sleeping when I called* / *She wasn't listening when I came* — grammatical, *"this isn't a real sentence."* A habit error needs context (*as a child*), or *I was playing every day* is fine English. | `confirmed` |
| **E5** | Command banks are **adult**. A few classroom tiles are fine (*Sit down*, *Open the window*). Do not fill Match with teacher-to-child (*Look at the board*, *Don't speak Czech*, *Stand up*, *Come here*). | `a1_imperatives` 2026-08-29: *"I am teaching adults not children in a classroom"*. Swapped to *Look at this* / *Don't call me* / *Stand here* / *Come in*. | `observed` |
| **E6** | A situation must be true in the world. *It's cold. I'll open the window* is false — you open a window when it is hot. | `a2_will_going_to` 2026-08-29: *"If you are cold, you don't open a window!"* | `observed` |
| **E7** | A2 Use on a many-pair form pack is sentence **error-correction** (`use_mode: correct`), not CZ→EN translation. More complex Czech allows extra errors that are not the teaching point. One ending swap per sentence (E2). Do not derive a wrong that is real English (G4: *She is worrying about the exam*). | `a2_ed_ing_adjectives` 2026-08-29: *"I am wondering about doing direct translation at a2 / the more complex cz allows for more errors."* Same engine as countable. | `observed` |

---

## F · Sequencing

| ID | Rule | From | State |
|---|---|---|---|
| **F1** | Recycling earlier material into later units is wanted — but recycled material must be MARKED, so the student knows which rule is being asked for. | Six always-true items sat inside a unit teaching *will*; one carried `(vždy platí)`, five did not. | `enforced` — lint `zeromark` |
| **F2** | Don't introduce a topic inside a neighbour's unit. A topic with no unit of its own gets smuggled in and breaks the host. | Zero conditional inside first conditional. `a1_prepositions_time` 2026-08-29: *once/twice a week* (*a week*, not *in week*) is not at/on/in — Patrik's error, wrong unit; parked for Time 2. `a2_ed_ing_adjectives` 2026-08-29: *stressed/stressful* is the same job (feeling vs cause) but *-ful* not *-ing* — one odd pair; parked for B1 (`codex/parked-stressed-stressful.json`). Not `b1_suffixes` (that is CARE → careful). | `confirmed` — lint `aweek` |
| **F3** | Early A1: recognition may lead, production may not. Match / Quiz / Type may use a short carrier (Czech on screen). Use only partner + glue + words this unit owns. Mark the rest `use: false`. | `a1_be_have` 2026-08-28 (*afraid* / hungry); `a1_present_simple` 2026-08-29 (*office, French, Saturday*); `a1_possessives` (*job, tickets, blue, new*); `a1_frequency` 2026-08-29 (*lunch, meat, TV, late* — and *Do you often…?* stays Quiz/Type, because do-support is the next unit). | `confirmed` |
| **F4** | A1 names in *'s* items and intro examples are names the class already knows. Do not add a hard name as decoration. | `a1_possessives` 2026-08-29: *Homare's* made the *'s* test a Japanese-name test. Swapped to *Martin's*. | `observed` |

---

## G · Derivation

Added 2026-08-24. Deriving content from structure already in the data is the only thing that
scaled today — but it fails in a specific and dangerous way.

| ID | Rule | From | State |
|---|---|---|---|
| **G1** | Derive from structure the data already carries; do not author at scale. | Quiz options came from the base verb in each gap hint: 54 of 56 exact. Wrong sentences came from the item's own pattern: 35 of 56. | `confirmed` |
| **G2** | Read every derived line. Budget roughly one in ten needing hand work. | 2 of 56 quiz sets and 21 of 56 wrong sentences needed intervention. | `confirmed` |
| **G3** | The exceptions are usually the pedagogically important ones. | `look forward to` — the best question in the pack, and auto-derivation would have deleted it, because it cannot see that `to` is a preposition there. | `observed` |
| **G4** | A derived WRONG answer may be a perfectly correct sentence. Check every one. | *"I remember to lock the door"* generated as the error for *"I remember locking the door"* — both correct, different meanings. No gate would ever catch this. `a2_ed_ing_adjectives` 2026-08-29: *She is worrying about the exam* is real present continuous — no `wrong` on that item. | `confirmed` |
| **G5** | A derived quiz path must not fire on closed-class words. *her* ends in *-er*; the comparative generator offered *more her / hest* and cued *(h)*. | `a1_possessives` 2026-08-29. Engine denylist in `pack-adapt.js` (`isComparativeAnswer`). Object-pronoun *her* would have hit the same bug. | `enforced` — engine |

---

## H · Diagrams

| ID | Rule | From | State |
|---|---|---|---|
| **H1** | Draw a relation prose states badly — sequence, choice, contrast, hierarchy. If a sentence says it as well, don't draw it. | — | `observed` |
| **H2** | One diagram per card, maximum. | — | `observed` |
| **H3** | Geometry lives in `js/intro-visuals.js`; the pack supplies labels only. **OVERRIDDEN by James 2026-08-25 for Claude.ai-authored intros**: inline SVG in packs is allowed — James smokes everything by eye, which is the real quality gate; a 2026-08-24 batch needed only light Claude Code touch-ups. Claude Code normalizes on landing (H5/H6 compliance), never reverts to the library on H3 grounds. | Library rationale was cost+consistency, not quality. | `overridden` |
| **H4** | A new diagram type goes in the library, never inside a pack. **Softened with H3's override**: applies to library-rendered diagrams; inline SVG packs are exempt. | — | `confirmed` |
| **H5** | Must read in both themes: `currentColor` and CSS variables, never hardcoded hex. | — | `confirmed` |
| **H6** | Must degrade to a text fallback. | — | `confirmed` |

---

## I · Process

| ID | Rule | From | State |
|---|---|---|---|
| **I1** | A green gate is not evidence of quality. | 36 live units (1,701 items — all of B2 and C1) were auto-authored and never read, with every gate green throughout. | `confirmed` |
| **I2** | Agents verify, never author. Building creates smoke debt; read-only review pays it off. | The overnight agent pass produced 13 verified blockers and 53 unverified claims — precision under half. Deterministic checks run at ~1.0. | `confirmed` |
| **I3** | Only James ticks, and he ticks **once**: Telegram `<unit_id> tested` appends `TA/smoke-done-log.md`. `INSPECTED.md` is generated from that log (`python codex/reconcile_inspected.py`). Do not hand-tick the first box — a second tick is how Articles 2 drifted. A link, or anything student-facing, requires at least one tick. | Four items on a student page linked into a cloud-authored unit nobody had read. Dual-tick (bot + register) left Articles 2 tested in Telegram and blank in the register. | `enforced` |
| **I4** | Lint first, play second, fix the CLASS not the instance. | Unit one cost two hours, mostly discovery. Unit two arrived with its suspects listed. | `confirmed` |
| **I5** | The two failure kinds are different jobs. Unit one failed at GRADING; unit two graded fine and failed at TEACHING. The lint catches the first and none of the second. | — | `confirmed` |
| **I6** | After Telegram `<unit_id> tested`: capture new rules, reconcile the register, commit. A long tab is not a memory. | Frozen 31-hour smoke tab 2026-08-28. Weekend protocol 2026-08-29. | `confirmed` |
| **I7** | After a rename, grep `gap_accepts` / `accepts`. Leftover keys from the old name still grade. | `a1_possessives`: *Ondrej's* accepted *Patriks*; *Vaclav's* accepted *Annas*; *Homare's* accepted *Toms*. | `observed` |
| **I8** | **Audit every stage before changing anything.** Findings, then dropdowns, then rewrite. Diving in repeats the same class of mistake the previous unit just taught. | Weekend smoke 2026-08-29: present simple and possessives only got clean when the audit ran first. | `confirmed` |
| **I9** | Finish the rewrite **before** James plays. A long pretest means he smokes the old pack; flags cite titles that no longer exist. | `a1_questions_negatives` 2026-08-29: *2 systems* / *BE ?* / *Remember*. `a1_question_words` 2026-08-29: *who* / *Remember* / 12-tile Match against the rewritten four-card pack. | `confirmed` |

---

## Known gap

**Nobody can check the Czech.** James does not read it; scripts cannot; agents should not be
trusted with it. Several of the worst items found on 2026-08-24 were bad Czech, not bad
English — A3 and A6 both. Until a Czech speaker reads the prompts, every Czech-facing item is
unverified, and that is why `b1_verb_patterns_advanced` moved its Use stage to all-English
error correction (`use_mode: "correct"`).
