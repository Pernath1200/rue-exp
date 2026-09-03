# B1 plan — 60 units (drafted 2026-09-01)

James dropdowns 2026-09-01. Built against [[Grammar Tree by Root]] v2 (21 B1 root_ids),
the B1→B1+ course doc, and the **25 B1 units already live in the app**.
Five end-of-level checks cloned from A1/A2 (same sitting).

**Bar:** usable, not perfect. Telegram `<id> tested`. Do not hand-tick INSPECTED.
**Cap:** 36 words per vocab leaf.
**Do not invent node ids.** New ids below are **proposed** until Codex is stamped.

A2 must be smoked and live before B1 unlocks. No A1/A2 re-smoke.

---

## Locked decisions

| | |
|--|--|
| For / since | **A2 owns it** (`a2_for_since`). No B1 unit. Recycled inside present perfect continuous |
| Used to | **A2 owns it** (`a2_used_to`). B1 gets *would* for past habits only — the `b1_used_to` node was rescoped to carry it (2026-09-02) rather than left parked as a duplicate |
| Too / enough | A2 owns the pair. `b1_degree_adverbs` keeps the 0–100 scale and **absorbs so / such** |
| Dependent prepositions | **Stays grammar.** `b1_dependent_prepositions` keeps its path slot. Not a vocab unit |
| Word formation | **Two packs, not five.** `b1_suffixes` + `b1_prefixes` stay whole (rewritten 2026-08-30). Only *word families* is new |
| Comparison 2 | **Pulled forward to B1**, new root_id. Tree says B2 — tree gets updated |
| Reported speech 2 | **B1**, not B2. `b1_reported_speech` was already built with backshift + if/wh |
| Future continuous | **Not at B1.** Course doc wanted it; tree keeps it B2. Cut |
| Future forms consolidation | **Not a unit.** Consolidation only — A2 will / going to / arrangements recycle inside other B1 packs |
| Reflexives 2 | **In.** A2 lock hands *by myself* / emphasis to B1 in writing |
| Prepositions of time 2 | **In.** `parked-once-a-week.json` — items already drafted from Patrik smoke |
| Trunk core frames | **Off-circle** to Topics, like `trunk_recycle_a2` / `trunk_lexis_a2`. Nouns duplicate `trunk_abstract_b1` |
| Checks | Same five as A1/A2, last on the path. **In** the 60 |

**Parked specs that land here (do not re-park):**

| Spec | Lands in |
|------|----------|
| `parked-stop-to-ing.json` | `b1_verb_patterns_advanced` — both shapes, different meaning |
| `parked-stressed-stressful.json` | `leaf_feelings_b1` — cause form not -ing |
| `parked-once-a-week.json` | `b1_prepositions_time_2` |

---

## The 60

**32 grammar + 23 vocab + 5 checks = 60.**
Grammar runs heavier than A2 because suffixes, prefixes, degree adverbs, fronting and
dependent prepositions are all **grammar** nodes in this app.

### Grammar already built (16) — packs exist, none smoke-tested

All sixteen are `[x][ ]` in INSPECTED. Built, not played.

| id | Title | Bank | Do |
|----|-------|-----:|----|
| `b1_present_perfect_vs_past` | Present perfect vs past simple | 79 | **smoke first** · course doc weeks 1–4 priority |
| `b1_passives` | Passive (form of be) | 48 | smoke |
| `b1_modals_speculation` | Might / may / could / must (guess) | 48 | smoke |
| `b1_articles_advanced` | Articles 2 | 48 | smoke · redesigned 2026-08-18 |
| `b1_it_subject` | Introductory it | 46 | smoke · pro-drop repair |
| `b1_word_order_fronting` | Word order 2 | 21 | smoke · **thin, may need thicken** |
| `b1_relative_clauses` | Relative clauses | 66 | smoke · defining + omission |
| `b1_reported_speech` | Reported speech | 54 | smoke · backshift + said/told + if/wh |
| `b1_indirect_questions` | Indirect questions | 24 | smoke · must go **beyond** the thin A2 pack |
| `b1_linkers` | Linkers (although / so) | 60 | smoke |
| `b1_degree_adverbs` | Degree adverbs (B1) | 12 | **thicken + so/such** · thinnest pack at B1 |
| `b1_verb_patterns_advanced` | Verb patterns 2 | 56 | smoke · fold `parked-stop-to-ing` |
| `b1_phrasal_verbs` | Phrasal verbs 1 | 44 | smoke · rewritten 2026-08-30 |
| `b1_dependent_prepositions` | Dependent prepositions 1 | 34 | smoke |
| `b1_suffixes` | Word Formation: Suffixes | 44 | smoke · rewritten 2026-08-30 |
| `b1_prefixes` | Prefixes | 44 | smoke · rewritten 2026-08-30 |

### Grammar new (16) — 14 need a node id, 2 reuse an existing parked node

| Proposed id | Title | Job |
|-------------|-------|-----|
| `b1_present_perfect_continuous` | Present perfect continuous | *How long have you been…* · recycles for/since from A2 |
| `b1_past_perfect` | Past perfect | Past-before-past sequencing |
| `b1_past_continuous_2` | Past continuous 2 | Questions/negatives + when/while narrative contrast |
| `b1_used_to` **(reused)** | Would for past habits | *We would go every summer.* **Not** used to — A2 owns that. Rescoped 2026-09-02 from the parked node |
| `b1_be_used_to` **(reused)** | Be used to / get used to | Czech *zvyknout si*. Pulled forward 2026-09-02 from the parked `b2_be_get_used_to`, which was an empty stub. Kept apart from `a2_used_to` |
| `b1_past_modals` | Had to / was able to / managed to | A2 gave past ability *could*. This is the rest |
| `b1_agreement_tricky` | Agreement 2 — everybody, news, police | Above `a1_agreement` / `a2_agreement` |
| `b1_comparison_2` | As…as, less / the least, much + comparative | Pulled forward from B2 |
| `b1_question_tags` | Question tags | |
| `b1_second_conditional` | Second conditional | Course doc weeks 9–11 |
| `b1_wishes` | I wish + past | |
| `b1_reported_speech_2` | Reported speech 2 — questions & commands | ask/tell + object + to-infinitive |
| `b1_relative_clauses_2` | Relative clauses 2 — non-defining | **Comma rule is the interference target** (Czech commas every relative clause) |
| `b1_cause_concession` | Because of / despite / in spite of / thanks to | |
| `b1_reflexives_2` | By myself / emphasis | A2 lock hands this forward |
| `b1_prepositions_time_2` | Prepositions of time 2 | *once / twice / three times a week.* Cards drafted in `parked-once-a-week.json` |

### Vocab already built (8) — 36-word leaves, none smoke-tested

| id | Title | Words | Do |
|----|-------|------:|----|
| `leaf_money_b1` | Money & possessions | 36 | play |
| `leaf_work_b1` | Work & routine | 36 | play |
| `leaf_home_b1` | Home & family | 36 | play |
| `leaf_communication_b1` | Communication | 36 | play · **place before reported speech** — pretaught admit/deny/claim/warn/remind |
| `leaf_knowledge_b1` | Knowledge & travel | 36 | play · **serves as education 2** |
| `leaf_self_b1` | Self & body | 36 | play · **serves as health 2** |
| `trunk_abstract_b1` | Abstraction starters | 24 | **thicken to 36 + sentences** · no practice mode set yet |
| `trunk_chunks_b1` | Collocations & chunks | 24 | **thicken to 36** · make/do/take/have + strong adj–noun. Absorbs the take/have/give unit |

### Vocab new (15) — all need a node id

| Proposed id | Title | Soaks from |
|-------------|-------|------------|
| `leaf_personality_b1` | Personality & character | above `leaf_personality_a2` |
| `leaf_relationships_b1` | Relationships & social life | above `leaf_family_a2` |
| `leaf_news_b1` | News & current affairs | new theme |
| `leaf_crime_b1` | Crime & law | new theme |
| `leaf_environment_b1` | Environment | above `leaf_nature_a2` |
| `leaf_technology_b1` | Technology | above `leaf_tech_a2` |
| `leaf_travel_b1` | Travel 2 — journeys, problems, accommodation | above `leaf_travel_a2`; `leaf_knowledge_b1` only half-covers |
| `leaf_feelings_b1` | Feelings 2 — nuanced emotion adjectives | recycles A2 -ed/-ing · **fold `parked-stressed-stressful`** |
| `leaf_get_b1` | Get — senses & collocations | own unit; too big for `trunk_chunks_b1` |
| `leaf_phrasal_1_b1` | Phrasal verbs pack 1 — everyday & home | lexis, above the `b1_phrasal_verbs` grammar |
| `leaf_phrasal_2_b1` | Phrasal verbs pack 2 — work, travel, relationships | cumulative ~60 target per course doc |
| `leaf_word_families_b1` | Word families in frames | act → action → active → actively · **RUE3 word-formation feeder** |
| `leaf_false_friends_b1` | Czech false friends | actual, eventually, sympathetic, control, gymnasium |
| `leaf_confusables_b1` | Confusables | lend/borrow, bring/take, remember/remind, look/watch/see |
| `trunk_opinions_b1` | Opinions & discourse chunks | I'd say, in my view, on the other hand + first hedging buds |

### Level checks — need Codex stamp (5)

Clone A2. Spec: `codex/LEVEL-CHECKS.md`. Pool = smoked B1 units at runtime.
Depends on `js/vocab-sprint.js` already being generalised for A2.

| Proposed id | Job |
|-------------|-----|
| `b1_vocab_match` | Easy. Timed 6-pair EN↔CZ |
| `b1_vocab_type` | Medium. CZ→EN ×12, no clock |
| `b1_grammar_match` | Easy. Which is correct? ×12 |
| `b1_grammar_type` | Medium. Cloze type-in ×12 |
| `b1_finale` | Use on everything. **Does not skip** · last on path |

**Off the circle** (Topics only): `trunk_core_b1`.
**Reused, not new (2026-09-02):** `b1_used_to` rescoped to *Would for past habits* — used to itself stays
at `a2_used_to`. `b2_be_get_used_to` renamed to `b1_be_used_to` and relevelled B2 → B1; its bank was
already empty (auto-authored, removed 2026-08-29 — do not refill from auto).

---

## Proposed path (play order)

Zigzag. New grammar **bold**. New vocab *italic*. Built units plain. Checks last.
Present perfect family front-loaded per the course doc (weeks 1–4 priority).

1. `b1_present_perfect_vs_past`
2. `leaf_self_b1`
3. **`b1_present_perfect_continuous`**
4. `trunk_abstract_b1` · thicken to 36
5. **`b1_past_perfect`**
6. **`b1_past_continuous_2`**
7. *`leaf_travel_b1`*
8. **`b1_used_to`** · rescoped to *would*
9. **`b1_be_used_to`** · pulled forward from B2
10. `leaf_knowledge_b1`
11. **`b1_past_modals`**
12. `b1_modals_speculation`
13. `leaf_work_b1`
14. `b1_passives`
15. *`leaf_news_b1`*
16. **`b1_agreement_tricky`**
17. `leaf_communication_b1` · feeds 18–19
18. `b1_reported_speech`
19. **`b1_reported_speech_2`**
20. `b1_indirect_questions`
21. *`leaf_personality_b1`*
22. **`b1_question_tags`**
23. `b1_relative_clauses`
24. **`b1_relative_clauses_2`** · comma rule
25. *`leaf_relationships_b1`*
26. **`b1_second_conditional`**
27. **`b1_wishes`**
28. *`leaf_feelings_b1`*
29. `b1_articles_advanced`
30. **`b1_comparison_2`**
31. `b1_degree_adverbs` · thicken + so/such
32. `leaf_money_b1`
33. `b1_it_subject`
34. `b1_word_order_fronting`
35. `leaf_home_b1`
36. **`b1_reflexives_2`**
37. *`leaf_crime_b1`*
38. `b1_linkers`
39. **`b1_cause_concession`**
40. *`leaf_environment_b1`*
41. *`leaf_technology_b1`*
42. `b1_verb_patterns_advanced`
43. `trunk_chunks_b1` · thicken to 36
44. *`leaf_get_b1`*
45. `b1_phrasal_verbs`
46. *`leaf_phrasal_1_b1`*
47. *`leaf_phrasal_2_b1`*
48. `b1_dependent_prepositions`
49. **`b1_prepositions_time_2`**
50. `b1_suffixes`
51. `b1_prefixes`
52. *`leaf_word_families_b1`*
53. *`leaf_false_friends_b1`*
54. *`leaf_confusables_b1`*
55. *`trunk_opinions_b1`*
56. `b1_vocab_match`
57. `b1_vocab_type`
58. `b1_grammar_match`
59. `b1_grammar_type`
60. `b1_finale`

---

## In-place (no new id)

- `b1_degree_adverbs` thicken 12 → ~36, fold in so / such
- `trunk_abstract_b1` thicken 24 → 36 + sentences + practice mode
- `trunk_chunks_b1` thicken 24 → 36
- `b1_word_order_fronting` — check 21 items is enough
- `b1_verb_patterns_advanced` fold `parked-stop-to-ing`
- Unlock B1 in `LIVE_LEVELS` once A2 is smoked
- Update `path_order_b1` in `data/nodes-grammar.json` (currently 16 entries)

## Tree work (Codex-First)

`Grammar Tree by Root.md` needs root_ids added before the new grammar is built:

| Unit | root_id |
|------|---------|
| Present perfect vs past simple | **no root_id exists** — the app #1 B1 unit is unrepresented in the tree |
| Past continuous 2 | extension of `A2.past_continuous.basic` |
| Would for past habits | split from `B1.used_to_would.past_habits` (A2 took *used to*) |
| Be used to / get used to | in the course doc, unplaced in the tree |
| Comparison 2 | pull forward from `B2.comparatives.advanced` |
| Reflexives 2 | new |
| Prepositions of time 2 | new |

Already present and correct: `B1.questions.tags`, `B1.conditionals.second`,
`B1.conditionals.wishes_present`, `B1.past_perfect.basic`, `B1.present_perfect.continuous`,
`B1.modals.past_forms`, `B1.subject_verb_agreement.tricky`, `B1.prepositions.cause_concession`.

Also: the tree has `A2.relative_clauses.basic`, but the A2 lock says *"Relatives / passives: stay B1."*
**Tree is wrong here — A2 lock wins.** Remove or re-level.

---

## Stamp list (34 new ids + 2 reused)

**Grammar (14 new):** `b1_present_perfect_continuous` · `b1_past_perfect` · `b1_past_continuous_2` ·
`b1_past_modals` · `b1_agreement_tricky` ·
`b1_comparison_2` · `b1_question_tags` · `b1_second_conditional` · `b1_wishes` ·
`b1_reported_speech_2` · `b1_relative_clauses_2` · `b1_cause_concession` · `b1_reflexives_2` ·
`b1_prepositions_time_2`

**Vocab (15 new):** `leaf_personality_b1` · `leaf_relationships_b1` · `leaf_news_b1` · `leaf_crime_b1` ·
`leaf_environment_b1` · `leaf_technology_b1` · `leaf_travel_b1` · `leaf_feelings_b1` · `leaf_get_b1` ·
`leaf_phrasal_1_b1` · `leaf_phrasal_2_b1` · `leaf_word_families_b1` · `leaf_false_friends_b1` ·
`leaf_confusables_b1` · `trunk_opinions_b1`

**Reused (2):** `b1_used_to` (rescoped) · `b1_be_used_to` (renamed from `b2_be_get_used_to`)

**Checks (5):** `b1_vocab_match` · `b1_vocab_type` · `b1_grammar_match` · `b1_grammar_type` · `b1_finale`

## Build state 2026-09-02 (rough drafts written)

All 60 path units now carry content. `path_order_b1` is the full 60; B1 stays out of
`LIVE_LEVELS` and all 36 authored units stay `status: parked`.

| | |
|--|--|
| Grammar | 16 units · 197 intro cards · 909 items |
| Vocab | 15 leaves · 74 intro pages · 540 new words · 120 Use sentences |
| Checks | 5, runtime-pooled — no bank by design |
| Gates | `check_codex` 0 findings · `check_playable` 0 errors, 5 warnings (unchanged from baseline) |
| Lint | all 15 vocab leaves clean · grammar clear of C4 / C23 / B8 |

Written against `AUTHORING-RULES.md` **plus** `SMOKE-HANDOFF-A2-GRAMMAR-2026-09-02.md`, which
carries three rules not in the rules file: **C53** (a form-change card 0 must not define the new
form by a job the old form also has), **C54** (person lists are I/you/he/she/we/they), **C55**
(a new member of a class already taught opens on set membership, not only a cousin contrast),
and the update that **C11 now includes sort**. C55 was applied to `b1_past_modals`,
`b1_past_continuous_2`, `b1_agreement_tricky`, `b1_comparison_2`, `b1_cause_concession`,
`b1_prepositions_time_2`; C54 to `b1_reflexives_2`.

**These drafts have never been read by anyone.** Rule I1: a green gate says a unit will not
crash and nothing about whether it is any good.

## Week order

1. Smoke the 16 built grammar packs in path order — they exist, none have been played.
2. Play the 6 full vocab leaves (money, work, home, communication, knowledge, self).
3. Thicken the three thin ones: `b1_degree_adverbs`, `trunk_abstract_b1`, `trunk_chunks_b1`.
4. Stamp the 36 ids. Update `path_order_b1`.
5. Author new grammar **in path order** — first missing is `b1_present_perfect_continuous`.
6. New vocab leaves when their slot comes (36 words, Use bank, sentence-gap).
7. Checks last.
