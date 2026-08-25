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

**Capture ritual:** when a unit is ticked in `INSPECTED.md`, ask *what happened here that isn't
already a rule?* New rules go in as `observed`. A rule that recurs is promoted to `confirmed`.
When a check lands, it becomes `enforced` and names its ID.

**The one rule under all the others:** the gates check STRUCTURE. Every failure below was
present while `audit`, `check_pretaught` and `check_playable` were green, and had been for
weeks. **A green gate means a unit will not crash. It says nothing about whether it is any
good.**

---

## A · Prompt determinacy

> **A0 — Every item has exactly ONE degree of freedom: the thing being taught.** Everything
> else must be forced by the prompt. If the prompt doesn't determine the answer, either fix the
> prompt or accept every legitimate answer. No grading leniency can rescue a prompt that lacks
> the information. — `confirmed`

**Test for any item:** could a competent translator, or Google Translate, produce something
correct that this item rejects? A whole Use stage scored **3/12** against pasted Google
Translate answers.

| ID | Rule | From | State |
|---|---|---|---|
| **A1** | Czech `když` is both *if* and *when*. Accept both in a REAL conditional; never in an unreal one. | *"When you heat water, it boils"* marked wrong by a unit that teaches *when* behaves like *if*. 143 of 180 `If` items are unreal. | `enforced` — lint `ifwhen`, engine `lenient_if_when` |
| **A2** | A Czech clause with no explicit subject does not specify one. Name the subject, or accept he/she/it. | *Když přijde pozdě* is he, she or it. 169 items list `he` and `she` but not `it` — the author knew and stopped halfway. | `enforced` — lint `subject` |
| **A3** | Czech perfective present is FUTURE. Never use a perfective prompt for an English present-tense answer. | *přijdeš* = *you will arrive*, but the item demanded *"you arrive late"*. The worst credibility failure found. | `enforced` — lint `czfuture` (candidate) |
| **A4** | Czech has no articles. Don't demand `the` unless English forces it or the Czech marks it. | *koupím kávu* → *"buy **the** coffee"* required; *"buy coffee"* rejected. ~1,009 items demand `the` with no Czech support. | `enforced` — lint `article` (candidate) |
| **A5** | One Czech word with two English renderings needs both accepted. | *brzy* is *soon* and *early*; only *early* was accepted. | `observed` |
| **A6** | Never demand a word the Czech does not contain. | *Zavolám* is *I will call*; the key was *"I will call **you**"*. | `observed` |
| **A7** | Free English synonyms must be in the synonym map. | *everyone* rejected for *everybody*. The map had 41 Czech-ambiguity pairs and no English-side free choices. | `enforced` — lint `synonym` |
| **A8** | Contractions accepted both ways, always. | *"I cannot stand"* rejected where *"I can't stand"* was the key. 404 items across 71 units. | `enforced` — lint `contraction` |

---

## B · Distractors

| ID | Rule | From | State |
|---|---|---|---|
| **B1** | A distractor must be clearly wrong, never arguable. If a native would hesitate, it isn't one. | *acting* offered against *actor* — marginal, not wrong. | `observed` |
| **B2** | Never borrow a sibling item's answer as a distractor in a FORM pack. Borrowing is right only where the point is *which word*. | 1,543 items across 54 units borrow. `b1_verb_patterns_advanced` offered no `-ing` option at all in a unit about `-ing`. | `confirmed` |
| **B3** | Author `quiz_options` wherever the teaching point is form. The fallback cannot know the axis. | 47% of gap items have none. | `confirmed` |
| **B4** | The unit's own target error must appear among the options. | `a2_comparatives` was extended for *more better* — and *more better* is never shown. | `observed` |
| **B5** | A Match board needs distinct PROMPT tiles. Repeated labels on the ANSWER side are fine when prompts are distinct and grading is by instance (words → their classes works; James built and class-tested exactly that). The ban is on boards whose prompt tiles repeat — "one" five times is clicking, not matching. First version of this rule over-reached and briefly killed James's own labels board; scope it to the prompt side only. | `a1_word_classes`: one/more board (bad — identical prompts) vs labels board (good — distinct words, repeated classes), both smoked 2026-08-25. | `confirmed` |

---

## C · Intro cards

| ID | Rule | From | State |
|---|---|---|---|
| **C1** | Orient before you correct. Card 0 says what the thing IS, then what trips a Czech speaker. | The rewritten first-conditional card opened on the contrast; a student who had never met a conditional met the correction first. | `confirmed` |
| **C2** | Name the misconception the card replaces. Restating the form teaches nothing — the student already half-knows it. | The cards that work say *why*: *"English word order is fixed, so articles carry that signal"*. The ones that fail restate the shape. | `confirmed` |
| **C3** | Don't bury the insight below the rule. | The *Czech marks the future twice* line existed — as a bullet on a card titled "Examples", after the rule. Nobody reaches it. | `observed` |
| **C4** | Don't promise equivalence the bank doesn't drill. | A card claimed five connectors behave alike; `if` got 44 items, the other four nine between them. | `enforced` — lint connector check |
| **C5** | If the engine forgives something, the card must say so — and say where the forgiven forms still differ. | `lenient_if_when` accepted *when* silently. Silent forgiveness teaches nothing. | `observed` |
| **C6** | A gloss must not be harder than the word it glosses. Easier, not merely at-level. | *stop* (A1) explained with *quit* (B1) and *pause* (B2); *"pause in order to"* at B1. | `observed` — lintable against `codex/vocab/oxford-5k-cefr.csv` |
| **C7** | Never assert there is no pattern when there is one. It is false and it is demoralising. | *"There is no rule to compute — English fixes it verb by verb"*, and *"Learn in chunks"* at A2. Verb patterns have two shapes and a real semantic tendency. | `confirmed` |

---

## D · Explanations

| ID | Rule | From | State |
|---|---|---|---|
| **D1** | An explanation must name THIS item's word and shape, and give the reason. A generic note is filler. | `b1_verb_patterns_advanced` had **9 distinct explanations for 56 items**; one string covered 23. *"to = direction / receiver / infinitive marker"* is pasted across 61 items in 4 units. | `observed` — lintable: count distinct explanations per pack |
| **D2** | Explanations render automatically with the feedback, not behind a click. | Hidden behind "Why?", most students never read them. Reversed 2026-08-24 — which makes D1 urgent, since filler is now visible. | `confirmed` |

---

## E · Sentences

| ID | Rule | From | State |
|---|---|---|---|
| **E1** | A sentence needs a situation, not just a grammar frame. | *"I will call you if I arrive early"* — grammatical, and means almost nothing. Compare *"If it rains, I'll work at home."* | `observed` |
| **E2** | One error per error-correction item. If the "correct" answer still contains something questionable, the item teaches it by implication. | A carrier sentence introduced an over-used *how* beside the target error. | `confirmed` |
| **E3** | Accepts stay aspect-strict: a continuous twin is NOT an accepted variant of a simple-form answer (Czech learners over-apply the continuous once they acquire it). Add the twin only where the simple form is unnatural in context — momentary weather and the like — and mark it item-by-item as an exception. | `a1_agreement` *Tady prší.* — "It's raining here" is the natural English and was rejected; James's call 2026-08-25: accept there, nowhere else in the unit. | `confirmed` |

---

## F · Sequencing

| ID | Rule | From | State |
|---|---|---|---|
| **F1** | Recycling earlier material into later units is wanted — but recycled material must be MARKED, so the student knows which rule is being asked for. | Six always-true items sat inside a unit teaching *will*; one carried `(vždy platí)`, five did not. | `enforced` — lint `zeromark` |
| **F2** | Don't introduce a topic inside a neighbour's unit. A topic with no unit of its own gets smuggled in and breaks the host. | Zero conditional is taught nowhere on the path — it exists only as a sub-topic of first conditional, which is why its items are ambiguous. | `observed` |

---

## G · Derivation

Added 2026-08-24. Deriving content from structure already in the data is the only thing that
scaled today — but it fails in a specific and dangerous way.

| ID | Rule | From | State |
|---|---|---|---|
| **G1** | Derive from structure the data already carries; do not author at scale. | Quiz options came from the base verb in each gap hint: 54 of 56 exact. Wrong sentences came from the item's own pattern: 35 of 56. | `confirmed` |
| **G2** | Read every derived line. Budget roughly one in ten needing hand work. | 2 of 56 quiz sets and 21 of 56 wrong sentences needed intervention. | `confirmed` |
| **G3** | The exceptions are usually the pedagogically important ones. | `look forward to` — the best question in the pack, and auto-derivation would have deleted it, because it cannot see that `to` is a preposition there. | `observed` |
| **G4** | A derived WRONG answer may be a perfectly correct sentence. Check every one. | *"I remember to lock the door"* generated as the error for *"I remember locking the door"* — both correct, different meanings. No gate would ever catch this. | `confirmed` |

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
| **I3** | Only James ticks `INSPECTED.md`. A link, or anything student-facing, requires at least one tick. | Four items on a student page linked into a cloud-authored unit nobody had read. Now enforced in the page builder, not left to memory. | `enforced` |
| **I4** | Lint first, play second, fix the CLASS not the instance. | Unit one cost two hours, mostly discovery. Unit two arrived with its suspects listed. | `confirmed` |
| **I5** | The two failure kinds are different jobs. Unit one failed at GRADING; unit two graded fine and failed at TEACHING. The lint catches the first and none of the second. | — | `confirmed` |

---

## Known gap

**Nobody can check the Czech.** James does not read it; scripts cannot; agents should not be
trusted with it. Several of the worst items found on 2026-08-24 were bad Czech, not bad
English — A3 and A6 both. Until a Czech speaker reads the prompts, every Czech-facing item is
unverified, and that is why `b1_verb_patterns_advanced` moved its Use stage to all-English
error correction (`use_mode: "correct"`).
