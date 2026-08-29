# Tree hang audit — 2026-08-28

Live grammar topics in `data/tree.json`: **99**.  
This pass retagged **Degree only**. Everything else is a **recommendation**, not applied.  
Portrait laterals = Codex roots. No 7th root.

## 1. Degree retag (done)

`b1_degree_adverbs` — all three hangs together:

| Field | Was | Now |
|--|--|--|
| `root` / `tree_part` | `noun_phrase` (Forms) | `sentence_syntax` (Sentence) |
| `codex_unit` | `G_NP-B1B2-01` | `G_SS-B1B2-01` |
| `related[]` | `a2_comparatives`, `b2_quantifiers_advanced` | `a2_adverbs_order` |
| node `note` | so/such + extreme adjectives | scale (a bit/quite/very/extremely) + too/enough |

Files: `data/tree.json`, `data/nodes-grammar.json`, pack `codex_unit` only (items/intro untouched), `rue-codex` `G_SS-B1B2-01` now lists the topic; `G_NP-B1B2-01` never named it.

Portrait check: finishing Degree fruits the **Sentence** lateral, not Forms.

Three-file split after retag: **none** on any live grammar topic.

---

## 2. Mismatch table (do not apply)

99 live · **7 missing `codex_unit`** · **0 splits**.  
Rows below are the rest of the hang problems. Recommended hang is for James — **not written**.

| id | label | lv | hang | codex_unit | Codex scope | pack actually teaches | verdict | recommended (not applied) |
|--|--|--|--|--|--|--|--|--|
| `a1_agreement` | Subject–verb agreement | A1 | `verb_phrase` | — | Codex: agreement is `G_SS` (James 2026-06-14: off Verbs onto Sentence) | present simple agreement, he works / they work | **WRONG HOUSE** + **MISSING CODEX** | `sentence_syntax` · `G_SS-A1B1-01` |
| `a2_agreement` | Subject–verb agreement (A2) | A2 | `verb_phrase` | — | same | has/goes/does, was/were, everybody, there is/are | **WRONG HOUSE** + **MISSING CODEX** | `sentence_syntax` · `G_SS-A1B1-01` |
| `a1_frequency` | Frequency | A1 | `verb_phrase` | `G_VP-A1B1-01` | VP = tenses/auxiliaries | always/usually/often… **position** (before verb, after be) | **FLAG** adverb family split with `a2_adverbs_order` on Sentence — do not merge unless James says | likely `sentence_syntax` · `G_SS-A1B1-01` (with adverb position) |
| `a1_word_classes` | Word classes | A1 | `tap_root` | — | Grammar Codex excludes tap | metalanguage: noun/verb/adj… | **CODEX GAP** | keep `tap_root` (Foundation). No `G_*` for tap. Do not invent a 7th root. |
| `b1_prefixes` | Prefixes — the basics | B1 | `noun_phrase` | — | `word_formation` is `outside_roots` / vocab channel in Codex | un-/in-/dis-/re- | **MISSING CODEX** + **CODEX GAP** | not Forms. Park until vocab `word_craft` (or a named G/V unit). Do not invent a root. |
| `b1_suffixes` | Suffixes — the basics | B1 | `noun_phrase` | — | same | -er/-tion/-ful/-ly… | **MISSING CODEX** + **CODEX GAP** | same as prefixes |
| `b2_word_formation` | Word formation (FCE Part 3) | B2 | `noun_phrase` | — | same | FCE Part 3 affix gym | **MISSING CODEX** + **CODEX GAP** | same |
| `c1_word_formation` | Word formation (CAE Part 3) | C1 | `noun_phrase` | — | same | CAE Part 3 | **MISSING CODEX** + **CODEX GAP** | same |

### Softer flags (root matches a real `G_*`, scope is a stretch)

Not Degree-class bugs. Listed so they are not invisible.

| id | hang · unit | why it is only a flag |
|--|--|--|
| `a1_like_want_need` | `verb_complementation` · `G_VC-A1B1-01` | Pack is mostly verb+noun; VC scope is to-inf vs -ing. Nearest hang is still VC. |
| `a1_object_pronouns` | `noun_phrase` · `G_NP-A1B1-01` | Forms (pronoun forms) — defensible on NP. Not articles/quantifiers. |
| `c1_ellipsis_substitution` | `sentence_syntax` · `G_SS-B2C1-01` | Unit notes say inversion/clefts; pack is so/neither/ellipsis. Same root, thin scope fit. |
| `c1_register` | `sentence_syntax` · `G_SS-B2C1-01` | Pack is formal vs informal lexis as much as syntax. |
| `c1_spoken_vs_written` | `sentence_syntax` · `G_SS-B2C1-01` | Same unit, spoken heads/tails/tags. |

C1 packs on `G_VP-B2C1-01` / `G_NP-B2C1-01` / `G_VC-B2C1-01` match those roots. Codex **notes** still say “no dedicated topic” (2016-06-12 RUE2 gap). That is a Codex note lag, not a wrong house.

---

## 3. Counts after Degree

| Seat | Live grammar topics |
|--|--|
| Foundation (`tap_root`) | 1 |
| Verbs | 30 (still the heavy one; Degree did not leave Verbs) |
| Forms | 21 |
| Sentence | 18 (Degree joined adverb position) |
| Linking | 18 |
| Verb patterns | 6 |
| Prepositions | 5 |

`a1_agreement` + `a2_agreement` still sit on Verbs without a `G_*`. That is the next Degree-class pair if you want one.

Not ticked in INSPECTED. Pack items/intro for Degree not rewritten here.

---

## 4. a1_frequency — the case (drafted 2026-08-29, NOT applied)

James asked for the for/against on the audit's FLAG. Decision is his.

**Hang now:** `verb_phrase` · `G_VP-A1B1-01`.

**For moving to `sentence_syntax` · `G_SS-A1B1-01`:**

1. **The tag has no Codex backing.** No rue-codex file mentions frequency at
   all — `G_VP-A1B1-01`'s app_ref (auxiliaries, will/going to, irregulars,
   past simple/continuous) never claimed it. The VP tag is app-side only, so
   this is not "overruling Codex", it is filling a blank.
2. **The pack teaches position, not verb form.** Note: "before verb / after
   be". The smoke lane's current intro edit adds "With the verb, or after
   *be*" — position framing again. Codex VP scope is tense/aspect/aux/modals.
3. **The family unifies.** `a2_adverbs_order` (Sentence · G_SS-A1B1-01)
   already lists `a1_frequency` as related and teaches the same rule
   (always/also/still before verb · after be). Degree joined Sentence
   2026-08-28. Moving frequency puts the whole adverb-position family in one
   house; agreement joined the same unit 2026-08-29.
3b. **Same unit, same seat:** move = `G_SS-A1B1-01`, the unit agreement now
   hangs on. Seat lights: one A1 light leaves Verbs (30 topics, heaviest),
   Sentence gains its natural member.

**Against / cautions:**

1. Pedagogically A1 frequency lives beside present simple routines (Verbs
   neighborhood on the path). But the path is unchanged by a retag —
   `related[]` (currently empty!) can carry the present-simple link.
2. The audit's FLAG was about the family split with `a2_adverbs_order` —
   moving resolves it, but James said do not merge the packs; a move is a
   retag only, both packs stay separate.
3. None. There is no Codex counter-claim to weigh.

**Recommended if applied:** `root`/`tree_part` = `sentence_syntax`,
`codex_unit` = `G_SS-A1B1-01`, `related[]` = `["a1_present_simple",
"a2_adverbs_order"]`, all files together (tree, nodes-grammar, pack tag,
rue-codex mapping G_SS-A1B1-01 + reverse map). Pack items/intro untouched
(smoke lane owns the pack content and has live WIP in it — retag must wait
for that WIP to land or go in as tag-only line insert).
