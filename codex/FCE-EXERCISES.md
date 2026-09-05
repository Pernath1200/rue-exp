# FCE-style exercise shapes — B2/C1 spec

**Locked 2026-09-05**, James dropdowns, interactive session. **Spec only — nothing
built.** No pack authored, no engine code written. This document is what the next
build session (interactive, for the KWT half — see P-engine below) works from.

**Scope: B2 and above.** B1 use is explicitly **not decided** — see §4.

## Why this doc exists, not `AUTHORING-RULES.md`

`AUTHORING-RULES.md`'s own convention is a rule per real failure found by playing
a unit. Nothing here has been played — this is pre-built architecture, the same
class of document as `LEVEL-CHECKS.md` or `TREE-AND-CODEX.md`. When a rule below
is smoke-tested and either confirmed or broken, promote the finding into
`AUTHORING-RULES.md` the normal way; this file stays the design record.

## The decisions, verbatim intent

| Question | Answer |
|---|---|
| Open Cloze mechanic | **Quiz stays multiple-choice** (existing `quiz_options`, unchanged). **Type becomes the FCE-cloze stage: blind type-in, no clues at all** — explicitly **no first-letter-and-blanks, no letter count**. This is the vocab Type stage's scaffold (`typeLetterClue` in `js/practice-vocab.js`); grammar's Type stage already renders a bare `<input>` with no such clue (confirmed by reading `js/practice-grammar.js` — no `typeLetterClue`-equivalent exists there). **Net effect: no engine change for Open Cloze.** The rule is a *lock against ever adding* that vocab-style scaffold to a grammar Open Cloze item, not a change to make now. |
| Open Cloze placement | **Retrofit into existing/future grammar units**, not dedicated units. No `b2_open_cloze_1` node. The shape applies to whichever grammar units teach a grammar word (prepositions, conjunctions, articles, etc.) — see the candidate table in §1. |
| Key Word Transformation placement | **New `use_mode` inside each relevant grammar unit** — not dedicated review units. KWT becomes that unit's Use stage, same footing as `use_mode: "correct"` or `"rewrite"` today. |
| Build scope this session | **Full spec only.** One pilot unit per format is the natural next step, but not this session. |
| B1 | **Deferred, unresolved.** Do not retrofit B1 units on the strength of this doc. |

---

## 1. Open Cloze (grammar-word Type stage)

### What changes and what doesn't

The real FCE Part 2 task is one continuous text with ~12 numbered gaps. That
whole-text shape was **considered and explicitly not built** — recording this so
nobody re-proposes it as a gap in the spec. What we're building instead is
per-sentence, using the item shape every grammar pack already has (`gap` /
`gap_answer` / `accepts` / `quiz_options`). The only thing that makes an item
"Open Cloze" rather than an ordinary form-drill item is **what the gap targets**:
a grammar word (preposition, conjunction, article, pronoun, auxiliary,
quantifier, relative pronoun) rather than a content-word inflection.

**No engine work is needed.** Quiz already renders `quiz_options` as multiple
choice; Type already renders a plain text input with zero scaffold on the
grammar side. Open Cloze is a content and tagging discipline, not new code.

### New item field: `gap_class`

A closed tag naming the grammar-word class under test, for authoring discipline
and same-axis distractor checking (an extension of B6 — "options stay on the
teaching axis"):

```
"gap_class": "preposition"   | "conjunction" | "article" | "pronoun"
           | "auxiliary"     | "quantifier"  | "relative" | "other"
```

Worked example (`b2_preposition_ing`, illustrative — not authored):

```json
{
  "en": "She's responsible for organising the whole event.",
  "cz": "Zodpovídá za organizaci celé akce.",
  "gap": "She's responsible ____ organising the whole event.",
  "gap_answer": "for",
  "gap_class": "preposition",
  "quiz_options": ["for", "of", "with", "about"],
  "accepts": ["She's responsible for organising the whole event.",
              "She is responsible for organising the whole event."],
  "explanation": "responsible **for** + -ing — the fixed dependent preposition.",
  "explanation_cz": "responsible **for** + -ing — pevná vazba s předložkou."
}
```

### Authoring rules for this shape

- **A0 still applies**: exactly one grammar word gapped per item, everything
  else forced by the sentence.
- **Quiz distractors share `gap_class`** — a preposition item's wrong options
  are other prepositions, never a random word. This is B6's axis rule applied
  explicitly to function words, which A1–B1 units rarely tested this way.
- **Type gets zero scaffold.** No `(lemma)` cue (B11 is for content-word VPs
  with no visible stem — a grammar word has no stem to cue), no letter count.
  If an item is unguessable without a cue, the sentence doesn't force the
  answer — that's an A0 failure, fix the sentence, don't add a hint.
- **`check.sequence: ["quiz"]`, `ladder.match: false`** is the recommended
  shell — same as `b2_word_formation` / `c1_word_formation`. Match doesn't
  test a function word meaningfully (same logic as B10/B12/B15's weak-Match
  findings). Whether Use stays on is the unit's own call, not dictated by
  Open Cloze.

### Candidate units (from the current B2/C1 stub roster)

All currently `status: parked`, `quality: stub`, 0 items — genuinely greenfield,
not a retrofit of finished work.

| Unit | Level | Grammar-word focus |
|---|---|---|
| `b2_preposition_ing` | B2 | dependent prepositions before -ing |
| `b2_articles_genericity` | B2 | articles — generic reference |
| `b2_articles_correction` | B2 | articles — error correction |
| `b2_quantifiers_advanced` | B2 | quantifiers |
| `b2_discourse_markers` | B2 | conjunctions / linking adverbials |
| `c1_article_nuance` | C1 | articles — fine distinctions |
| `c1_discourse_grammar` | C1 | conjunctions / discourse connectors |
| `c1_spoken_vs_written` | C1 | register-sensitive function words |
| `c1_complex_noun_phrases` | C1 | determiners / relative pronouns inside NPs |

None of the seven already-live B2 units (present perfect continuous, past
perfect, second/third conditional, delexical collocations, false friends,
fixed phrases, clear claims) are grammar-word units — Open Cloze doesn't touch
them.

---

## 2. Word formation variety (extends the existing mechanic)

`b2_word_formation` and `c1_word_formation` already exist, are `good_draft`,
72 items each, and already work exactly like FCE Part 3 (sentence + gap +
capitalised root, type the whole derived word — `kind: "word_formation"`,
`typeModeOf` → `root_word`). **Zero engine change** — this section is a content
addition, for whenever these two packs get their next thickening pass.

**The variety wanted:** every current item is a bare derivation-class swap
(verb→noun, adjective→noun). Add:

- **Prefix-only items** — the root already has the right word class; the
  gap is a negative or reversative prefix (*fortunate → unfortunate*,
  *appear → disappear*, *possible → impossible*, *understand →
  misunderstand*, *legal → illegal*, *responsible → irresponsible*).
- **Suffix-only items** — same class change, but the point is the specific
  ending (*-ness* vs *-ity*, *-ance* vs *-ence*) rather than a derivation.
- **Spelling-shift items** — already present incidentally (C1 card 2 covers
  *deep→depth*, *strong→strength*); worth authoring as its own recognisable
  slice rather than leaving it as background noise in the bank.

**Optional new item field**, same spirit as `gap_class`, for authoring
tracking only (not required for the engine, which doesn't branch on it):

```
"formation_type": "prefix" | "suffix" | "both" | "spelling_shift"
```

No candidate-unit table needed — this applies to the two units that already
exist, next time either is opened for thickening.

---

## 3. Key Word Transformation — new `use_mode: "transformation"`

### Real exam shape and our word-count convention

Two sentences, a keyword the student must use **unchanged**, and a gap the
student fills with **a fixed word range that includes the keyword** so that
the second sentence means the same as the first. The real exam's own
convention varies by level; adopted here as the default (correct me if you
want different bands):

| Level | Word count |
|---|---|
| B2 (FCE) | 2–5 words |
| C1 (CAE) | 3–6 words |

### Schema (worked example, illustrative — not authored)

```json
{
  "en": "The company made a decision to close the factory.",
  "cz": "Firma se rozhodla zavřít tu továrnu.",
  "keyword": "DECISION",
  "transform_prompt": "The company ____________ close the factory.",
  "gap_answer": "made a decision to",
  "accepts": ["made the decision to", "made a decision to"],
  "word_count": [2, 5],
  "explanation": "**make a/the decision to** + infinitive — noun-phrase paraphrase of *decided to*.",
  "explanation_cz": "**make a/the decision to** + infinitiv — parafráze slovesa *decided to* podstatným jménem."
}
```

Field notes:

- `keyword` — shown unchanged (rendered in caps, non-editable) between the two
  sentences, exactly as the real exam sheet shows it.
- `transform_prompt` — the second sentence with its gap. Distinct field name
  from `gap`/`gap_answer`'s existing meaning (a single-sentence cloze) so the
  two mechanisms never collide in the same item.
- `gap_answer` / `accepts` — same grading mechanism as every other item type:
  string match against a list, A8 contractions etc. still apply. **No new
  grading logic.**
- `word_count` — `[min, max]`, rendered as a hint the way the real answer
  sheet states it ("using between two and five words"). Advisory to the
  student, not enforced by the grader — the real exam doesn't fail a correct
  answer for the wrong count either, and neither should this.

### Authoring rules

- **The keyword appears unchanged** in every accepted answer — not
  re-inflected, not paraphrased away. This is the whole point of the task;
  an answer that avoids the keyword isn't a valid alternative, it's a
  different item.
- **A0 still applies**: one grammar change tested per item. A transformation
  that simultaneously flips voice AND tense is two teaching points wearing
  one item.
- **E9/G4 apply as elsewhere**: the first sentence must be genuinely correct,
  ordinary English — no manufactured awkwardness to force the target
  paraphrase.

### Engine work needed — P-engine, interactive-only

This is the one piece of this spec that **is** new code: `js/practice-grammar.js`'s
Use-stage renderer (`renderTypedStage("use")`) needs a
`pack.use_mode === "transformation"` branch — sentence 1, the fixed keyword,
sentence 2 with its gap, word-count hint, grade against `accepts` the same way
`use_mode: "correct"` already does. Per `POLICY-LOCKS.md`'s `P-engine` row,
`js/` is interactive/James-only — the cloud loop must not attempt this. Build
it in a session like this one, not on `b1/auto` or any future `b2/auto`.

### Candidate units

KWT fits a unit whose form naturally *paraphrases* — passives, conditionals,
reported speech, comparatives, causative, cleft/inversion. It fits less
naturally on units whose point is pure tense/aspect timing, where there's
usually no alternate wording that keeps the same meaning without changing the
verb form itself (which is what those units are testing in the first place).

| KWT-native (Use stage becomes `transformation`) | Keep ordinary Use |
|---|---|
| `b2_passives_advanced` | `b2_present_perfect_continuous` |
| `b2_second_conditional` | `b2_past_perfect` |
| `b2_third_conditional` | `b2_narrative_tenses` |
| `b2_mixed_conditionals` | `b2_future_forms` |
| `b2_wish_if_only` | `b2_future_in_the_past` |
| `b2_hypothetical_past` | `c1_time_aspect_edge` |
| `b2_modal_perfect` | |
| `b2_causative` | |
| `b2_reported_speech_advanced` | |
| `b2_relative_clauses_advanced` | |
| `b2_cleft_sentences` | |
| `b2_emphasis_fronting` | |
| `b2_inversion` | |
| `c1_clefts_fronting` | |
| `c1_inversion_emphasis` | |
| `c1_nominalisation` | |
| `c1_advanced_passive` | |
| `c1_advanced_modality` | |
| `c1_subjunctive` | |
| `c1_reporting_complementation` | |
| `c1_comparative_advanced` | |

This is a starting split, not a ruling — a unit can keep both: KWT items
alongside its existing Use items, if the author finds both worth drilling.

---

## 4. B1 — explicitly deferred

James: "maybe some use for B1, in a limited capacity, but I don't know yet."
**No B1 unit is retrofitted on the strength of this doc.** Revisit once the B2
pilot units exist and have been played — a real KWT or Open Cloze item in front
of a B1 student is the only way to judge whether it's premature there. Until
that revisit, this spec's scope is B2/C1 only.

---

## 5. What this session did NOT do

No pack content authored. No `js/` code written. No node registered. The only
files this spec touches are this one and a pointer row in `POLICY-LOCKS.md`.
Next step whenever building begins: one pilot unit per format (an Open Cloze
retrofit candidate from §1's table, one KWT unit from §3's table) to prove the
schema before wider rollout — the build-scope option this session didn't take.
