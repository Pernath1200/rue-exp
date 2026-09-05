# Rule enforcement — which of the 150 rules a machine can hold

Written 2026-09-05, after James asked why smoke testing is not getting faster.

The answer was arithmetic. 150 rules, 39 with a check. He was acting as the linter
for 111 rules already written down — the fault reached him even though the project
had already learned it. C6 is the clearest case: written 2026-08-29 with its own
state cell reading *"lintable against `codex/vocab/oxford-5k-cefr.csv`"*, still
unbuilt a week later, and when the check was finally written it found 45 instances
across 21 B1 packs in under a minute.

**I11** now says a rule lands with its check or lands marked `manual`. This file is
the backlog that predates that rule, and the verdict on each one.

A verdict of `manual` is not a failure. It is the honest half of the split: some of
these are teaching judgements and always will be. What matters is that the pile is
no longer undifferentiated, so `observed` with no check now means *someone owes a
check*, not *nobody has thought about it*.


## Built — a check exists as of 2026-09-05 — 22

| Rule | What it says | Verdict |
|---|---|---|
| **B3** | Author quiz_options wherever the teaching point is form. The fallback cannot know the axis. | per pack, not per item — a handful of bare gaps is the engine fallback working |
| **B22** | Vocab Match is 1–1 meaning. On a leaf with a Use bank, Quiz/Type are translation sentence gaps (Czech sentence + English | leaf with a sentence bank whose quiz_mode is not sentence_gap |
| **B25** | A gap whose answer is the bracketed cue copied out tests nothing. Are you used to ____ yet? (the noise) → the noise is t | the answer is the bracketed cue copied out |
| **B26** | A negative answer needs a negative cue. (start) for won't start and (sell) for aren't going to sell make the student gue | negative answer, no negative in the cue, with the question-tag exemption |
| **C13** | In intro examples, bold the taught form, not the whole sentence. Do it on every intro card. On not any, bold don't as we | an intro example with nothing bolded, or the whole example bolded |
| **C14** | Card 0's title is the unit's name in English and Czech (title / title_cz). A nickname is not a name. | card 0's title against the unit's own title |
| **C15** | No ELT teacher-words on an A1 card. chunk / chunks, grammar theory, just these frames are course jargon, not student Eng | lint `chunkword` — the state cell says confirmed but the check exists |
| **C17** | No Remember / Pamatuj recap card. The other cards already taught it. Cut it. | lint `remember` — same |
| **C19** | Don't sprinkle L1 into an English form table. Czech lives in title_cz and examples[]. | Czech letters in a column that is not the Czech column |
| **C20** | An intro card teaches the student, not the lesson plan. No practice-sequence notes. Cut What you practise / Co nácvičuje | lint `practisenote` — same |
| **C22** | A1 metalanguage needs a Czech gloss on the same card. permission is not student A1 English. | lint `a1meta` — same |
| **C32** | Intro error examples must look like errors. Use ~~strike~~ (renders .wrong-eg). Italic I didn't went reads as emphasis,  | a mistakes column with no ~~strike~~ |
| **C46** | If later units on the same topic exist or are planned, the first unit is numbered. Phrasal verbs → Phrasal verbs 1. Same | a bare title whose numbered sequel exists |
| **C49** | A vocab intro shows every new word, not a 12-tile sample. One picture page per theme (about 8–12 tiles each), then the f | every lemma shown in the intro, with chunk packs exempt |
| **C56** | A diagram-only intro page (contrast / scale / branch, no pictures) is grammar. Vocab intros are picture boards, then fra | vocab intro opening on a diagram with no picture board |
| **D1** | An explanation must name THIS item's word and shape, and give the reason. A generic note is filler. | one explanation across four or more items, or fewer than a third distinct |
| **E3** | Accepts stay aspect-strict: a continuous twin is NOT an accepted variant of a simple-form answer (Czech learners over-ap | a continuous twin accepted for a simple-form answer |
| **E10** | From A2, Use tests the new word by having the student write a full sentence. Not CZ→EN of the bank (that grades articles | a vocab leaf above A1 whose Use is translation |
| **F7** | A vocab word is introduced as new only once (Match tile + intro picture). Recycle it in later sentences/Use. A2 of the s | a lemma taught as new by two packs, path order deciding the owner |
| **F8** | When an A2 theme pack recycles already-taught words, intro starts with review picture boards (8–12), title You already k | superseded by F9, which is enforced in check_rewrite.py |
| **H5** | Must read in both themes: currentColor and CSS variables, never hardcoded hex. | hardcoded hex in inline SVG — breaks one of the two themes |
| **J2** | A grammar pack's filename, its id, and its node id are one string. build_inspected_register.py globs data/grammar/blocks | filename, pack id and tree_node as one string |

## Buildable — a script can decide it, nobody has written it yet — 12

| Rule | What it says | Verdict |
|---|---|---|
| **A10** | going to work is the commute, not a future plan. Do not use work as the schematic after going to (am going to + work). D | literal: `going to work` as a future item. Tiny yield, one line |
| **A13** | After past said / told, the complement is past (she was tired). Do not author said that she is tired as the model, and d | `said/told … that … is/are/am` in en or accepts |
| **B5** | A Match board needs distinct PROMPT tiles. Repeated labels on the ANSWER side are fine when prompts are distinct and gra | duplicate prompt tiles on a Match board — the ANSWER side may repeat, the prompt side may not |
| **B15** | Match is not required on every unit. A Check task the student can solve by reading a word off the chip (sort box no with | narrow but real: a sort chip that contains its own bin label |
| **C21** | A unit whose English structure Czech does not have (dummy there) needs a Common mistakes card for the L1 calque (It is a | narrow: a dummy-there pack with no Common mistakes card |
| **C31** | Don't write base / base form / base verb on an A1/A2 card unless the same card shows the form (work, not worked). Or ski | `base` on an A1/A2 card where the same card does not show the form |
| **C54** | A person closed class is listed I / you / he / she / we / they. If the title names hers, it names his. Do not park his l | a person table missing a person, when the title names one |
| **E7** | A2/B1 Use on a form pack is sentence error-correction (use_mode: correct), not CZ→EN translation, when the Czech lets ex | an A2/B1 form pack whose use_mode is translation |
| **F6** | Dummy people and places in A1/A2 filler sentences rotate. People: Czech first names, students included, mixed gender, fe | name and place repetition counts inside a pack |
| **H2** | One diagram per card, maximum. | more than one diagram on a card |
| **H6** | Must degrade to a text fallback. | inline SVG with no text fallback |
| **I7** | After a rename, grep gap_accepts / accepts. Leftover keys from the old name still grade. | after a rename, accepts keys that name a word no longer in the pack |

## Partly — a script can shortlist, a person rules — 30

| Rule | What it says | Verdict |
|---|---|---|
| **A5** | One Czech word with two English renderings needs both accepted. | needs the Czech-ambiguity map; it can shortlist items whose cz holds a mapped word and whose accepts carry one rendering |
| **A12** | A vocab word with two everyday readings gets a short sense in parentheses on the ambiguous side. Pick one sense — do not | a denylist of known homonyms (bike, square, station, country, mouse, patient, charge) can shortlist; which sense is meant is a person's call |
| **A14** | Past perfect needs a stated past reference point. Without one, present perfect is the honest English and the Czech does  | the 2026-09-04 sweep found 171 hits, mostly unreal-past noise. Needs to know what each unit teaches |
| **A15** | The gap stem carries the evidence, not just the en. When the thing that forces the form sits in a second sentence (We bo | whether the evidence sits in a second sentence is a reading judgement |
| **B2** | Never borrow a sibling item's answer as a distractor in a FORM pack. Borrowing is right only where the point is which wo | ATTEMPTED 2026-09-05 and pulled: 496 findings on B1, nearly all false. In a paradigm pack every chip is legitimately another item's answer. Needs the morphological-family test pack-adapt.js already has |
| **B4** | The unit's own target error must appear among the options. | the intro's Common-mistakes column supplies the error strings; checking they reach quiz_options is doable but assumes that card exists |
| **B6** | Options stay on the teaching axis. anybody / somebody / nobody tests the quantifier; anyone / anywhere / anything tests  | engine already does the aux families; the general 'on the teaching axis' test is judgement |
| **B7** | Closed-class Quiz/Type is a gapped sentence, not a definition (____ = person / time → ____ / person: ____). Meaning pair | lint `slotgap` covers the definition-gap half |
| **B8** | The gap is THIS unit's teaching point, not a neighbour's. Do not gap the infinitive particle to alone (She wants ____ wo | four lint flags cover named cases; the general 'this unit's point' test is judgement |
| **B13** | A sort chip must pick its bin the way Saturday picks on. A noun-state (This bag is big, The door is closed, I'm thirsty) | lint `bothsort` covers the named verbs |
| **B18** | A to-V vs -ing Quiz offers the two real forms of this lemma (to read / reading). Never a mashup (to reading, to swimming | lint `patternchip` catches the mashups |
| **B19** | A meaning cue in parentheses — (maybe) / (sure) / (impossible) — is not a verb lemma. Author quiz_options (other modals, | lint `parencue` catches the missing options |
| **B27** | If only the Czech says the sentence is past, the cue must say it. A unit that converts a present form to its past (must  | measured 2026-09-04: 171 hits, most are unreal past or used-to. Cannot separate without the pack note |
| **B28** | If a unit teaches a contrast, some item must make the student choose — and the bracket cue must not name the answer's ow | needs to know which two forms the unit contrasts; the cue-names-the-answer half is close to B25 |
| **C5** | If the engine forgives something, the card must say so — and say where the forgiven forms still differ. | the engine's forgiving rules are a known list; whether the card says so is a text search |
| **C11** | If Check (Quiz or a sort) tests a contrast, an intro card named it. No silent extras in the bank. | lint `quizextra` covers chips never named in the intro |
| **C12** | A "common mistakes" card lists only errors a Czech learner actually makes. Do not invent ones a teacher has never heard. | lint `fakes3sg` covers the named invented errors |
| **C41** | A card for one pattern does not list a verb that only takes the other. would like (to only) does not belong on the -ing  | the verb lists are data; which pattern a verb takes needs a table nobody has |
| **C43** | A degree scale is not a timeline. The picture names the axis (how sure →) and the degree at each tick (impossible … almo | a scale diagram without an axis label is detectable if the schematic names it |
| **C48** | A vocab intro does not teach a contrast as a slash list in body. Long/short (Hello / Hi) is a table. Frame lists on page | a slash list in body is a text search; that it should be a table is the call |
| **C52** | A vocab pack that contains a known contrast pair (say/tell, look/see) does not bury it in the frames note. Each pair get | known contrast pairs are a short list; whether they get a page is checkable once that list exists |
| **D3** | cz is student-facing. No teacher notes, English asides, or editor leftovers in it. (On — a man), desk ≈ table, povolání  | lint `teachernote` and `slash` cover the named leftovers |
| **D5** | If a continuous unit carries present-simple / stative items, the explanation names present simple and bans -ing on THAT  | stative verbs are a known list; the explanation text is searchable |
| **E2** | One error per error-correction item. If the "correct" answer still contains something questionable, the item teaches it  | one error per item — countable only where the wrong is derived |
| **E9** | Use must not ask the student to rewrite a sentence that is already correct English. Parking is legal / It is possible /  | whether the Use prompt contains an error needs the wrong field |
| **E11** | On a two-form contrast, Use wrong still contains this form (or its own calque). Do not plant the cousin's error as the p | which form the wrong contains is close to B28 |
| **F2** | Don't introduce a topic inside a neighbour's unit. A topic with no unit of its own gets smuggled in and breaks the host. | lint `aweek` covers the named case |
| **F3** | Early A1: recognition may lead, production may not. Match / Quiz / Type may use a short carrier (Czech on screen). Use o | lint `uselead` covers A1 Use |
| **F5** | Vocab Use may not demand a light-verb collocation the pack never showed. breakfast is a noun (snídaně); Czech snídat is  | light-verb collocations are a short list |
| **J1** | A unit whose teaching point is a form is a grammar unit: registered in nodes-grammar.json, filed in data/grammar/blocks/ | a form pack in the vocab tree: detectable from the pack's own shape |

## Manual — no script can see this one — 50

| Rule | What it says | Verdict |
|---|---|---|
| **A6** | Never demand a word the Czech does not contain. | requires reading the Czech. The known gap at the foot of the rules file |
| **B1** | A distractor must be clearly wrong, never arguable. If a native would hesitate, it isn't one. | 'would a native hesitate' is the test. No |
| **B14** | Feeling vs cause (-ed / -ing adjectives) is a sort (person / thing), not EN↔CZ sentence Match. Sentence Match is transla | which contrast belongs on a sort is a teaching call |
| **B17** | A sort column is the job, not the form-word printed on the chip. Box used to with chip I used to live here is B15. Name  | naming the job is writing, not checking |
| **B23** | End-of-level Which is correct? options are three full sentences the same shape as en. Type (lemma) cues and extra clause | engine-side; the chips are generated, not authored |
| **C1** | Orient before you correct. Card 0 says what the thing IS, then what trips a Czech speaker. For a form-change unit, name  | orientation before correction is a reading judgement |
| **C2** | Name the misconception the card replaces. Restating the form teaches nothing — the student already half-knows it. | naming the misconception cannot be detected |
| **C3** | Don't bury the insight below the rule. | where the insight sits on the card |
| **C7** | Never assert there is no pattern when there is one. It is false and it is demoralising. | 'there is no rule' is a claim about English |
| **C8** | When a card teaches a test or rule of thumb, it must disclose the test's blind spot in the same card — especially where  | whether a blind spot is disclosed |
| **C16** | Don't list a hyponym as a second meaning. A job is a thing; thing / job is not two readings. | hyponym vs second meaning |
| **C18** | An intro card title names the thing, precisely. Not a joke or a slogan. | 'names the thing precisely' is editorial |
| **C24** | Don't taxonomize a joiner by word class. and joins two of whatever is already there — nouns, verbs, adjectives, adverbs. | fake grammar of a joiner |
| **C33** | Past continuous's usual job is interrupted background: was -ing when + past simple. A bank of clock-time snapshots (I wa | whether the bank teaches interrupted background |
| **C38** | also / too / this either are additive adverbs in one sentence. The conjunction is and (and either…or, a different either | word-class claim about also/too |
| **C39** | Don't gloss this tense as then, not now when that also names a tense they already know. Then, not now is past simple too | whether a gloss also names a tense they know |
| **C40** | Don't state a pattern as always-on. One verb is followed by another is false. After some verbs a second verb follows, in | 'always-on' claims are prose |
| **C42** | A what is X card shows a sentence with X and a sentence without X. Naming the class, or jumping to a later job (how sure | with-X vs without-X is a reading judgement |
| **C44** | If the bank drills a closed-class cousin as the same job, the intro names it as the same job. Do not gloss it with a nei | same-job cousins |
| **C47** | A backshift card shows a direct sentence and the same sentence reported, with the tense named beside each. A row of tens | whether the card shows the same sentence reported |
| **C50** | The student-facing title names the class. Not Glue · …, not wh- questions as jargon. Glue is author-talk. | author-talk in a student title |
| **C51** | A meaning-table asks for cell names the category, not an example sentence. how → How are you? is the example sitting in  | category vs example in a meaning cell |
| **C53** | A form-change card 0 does not define the new form by a job the old form also has. These words say whose something is is  | whether a definition distinguishes the new form |
| **C55** | A unit that adds a member to a closed class already taught opens on set membership, not only a meaning contrast with the | set membership is a teaching decision |
| **D2** | Explanations render automatically with the feedback, not behind a click. | engine behaviour, already true |
| **D4** | A gloss names what the word asks for or points to, not what the word is. why = reason is false (why is not a reason). ho | what a word asks for |
| **D6** | A spelling slip is not a grammar mistake. A Use sentence that differs from an accepted answer in one word, and that word | engine-side, already built |
| **D7** | A wrong Use answer says WHICH miss it was. In a rewrite Use the two failures are different and a bare ✗ Answer: … render | engine-side, already built |
| **E1** | A sentence needs a situation, not just a grammar frame. | a situation versus a frame |
| **E4** | Don't ask the student to produce a sentence a teacher has never heard. Coursebook contrast is not Use material, and not  | 'a teacher has never heard it' is the test |
| **E5** | Command banks are adult. A few classroom tiles are fine (Sit down, Open the window). Do not fill Match with teacher-to-c | adult versus classroom register |
| **E6** | A situation must be true in the world. It's cold. I'll open the window is false — you open a window when it is hot. A si | true in the world |
| **E12** | A Use prompt that contains the answer is transcription, not production. The rewrite shape shows the whole target sentenc | engine-side, already built |
| **F4** | A1 names in 's items and intro examples are names the class already knows. Do not add a hard name as decoration. | which names the class knows |
| **G1** | Derive from structure the data already carries; do not author at scale. | process |
| **G2** | Read every derived line. Budget roughly one in ten needing hand work. | process |
| **G3** | The exceptions are usually the pedagogically important ones. | process |
| **G4** | A derived WRONG answer may be a perfectly correct sentence. Check every one. | a derived wrong that is real English — the reason G-rules exist |
| **H1** | Draw a relation prose states badly — sequence, choice, contrast, hierarchy. If a sentence says it as well, don't draw it | whether prose says it as well |
| **H3** | Geometry lives in js/intro-visuals.js; the pack supplies labels only. OVERRIDDEN by James 2026-08-25 for Claude.ai-autho | overridden |
| **H4** | A new diagram type goes in the library, never inside a pack. Softened with H3's override: applies to library-rendered di | library versus pack, now that inline SVG is allowed |
| **I1** | A green gate is not evidence of quality. | the rule under all the others |
| **I2** | Agents verify, never author. Building creates smoke debt; read-only review pays it off. | process |
| **I4** | Lint first, play second, fix the CLASS not the instance. | process |
| **I5** | The two failure kinds are different jobs. Unit one failed at GRADING; unit two graded fine and failed at TEACHING. The l | process |
| **I6** | After Telegram <unit_id> tested: capture new rules, reconcile the register, commit. A long tab is not a memory. | process |
| **I8** | When rewriting: audit every stage before changing anything. Findings, then dropdowns, then rewrite. Diving in repeats th | process |
| **I9** | If a rewrite is in flight, finish it before James plays. A long pretest against the old pack means flags cite titles tha | process |
| **I10** | Pre-smoke is lint.py + an 8-line card. Seconds, not a quarter hour. Do not dump pack-adapt, do not read every item, do n | process — and now superseded by preflight.py |
| **I11** | A rule lands with its check, or it lands marked manual and says why. Writing the rule and leaving the check for later me | the rule that says a rule ships with its check. Process |


## What this changed on the day

`codex/check_rules.py` holds the batch built from the **Built** list above.
`codex/preflight.py` runs every check that can see a unit, so prep is no longer
lint-only (I10's shape was right when lint was the only check; there are now seven).
`codex/test_checks.py` proves each check still complains about a real fault, using
frozen copies of packs from before they were fixed — because a check that has never
been seen to fire is decoration, and F9 shipped that way this morning.

**B2 is the one that was attempted and pulled.** It found 496 things on B1 and was
wrong about nearly all of them: in a paradigm pack, every chip *is* another item's
answer, which is the axis, not borrowing. It is in **Partly** above with what it
would need. A check that cries wolf costs more than no check.

