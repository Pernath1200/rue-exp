# B2 plan — 60 units (drafted 2026-09-05)

James dropdowns 2026-09-05. Built against the **24 existing B2 grammar nodes**
(5 live, 19 parked shells), the 3 live B2 vocab packs, and the A1→B1 theme
lineage. Five end-of-level checks cloned from B1 (same sitting).

**Bar:** usable, not perfect. Telegram `<id> tested`. Do not hand-tick INSPECTED.
**Caps:** vocab 36 words per leaf (ceiling, not target) · grammar 24–40 items.
**Do not invent node ids.** New ids below are **proposed** until the registry is
stamped — stamping `data/tree.json` / `data/nodes-*.json` is coordination-tab
work, never a cloud run's.

---

## Locked decisions (James 2026-09-05)

| | |
|--|--|
| Split | **25 grammar + 30 vocab + 5 checks = 60.** Vocab-heavy: B2 is where vocab expansion accelerates, heading toward advanced. |
| Word formation | **Six dedicated lessons**, spaced ~9 apart: 2 prefix, 2 suffix, 1 **PIE roots**, and the existing live `b2_word_formation` (FCE Part 3) as capstone. |
| New vocab strands | All four in, each anchored to an existing family: **Science & research** (←knowledge/ideas), **Media & advertising** (←news/tech), **Business & economy** (←work/money), **Society & politics** (←news/crime). |
| WF inside vocab units | Every leaf gets a **"Build the family" intro card** (employ → employer / employment / unemployed) **plus 4–6 derived forms as real bank items**, drilled like any word, inside the 36 cap. C11 holds: the card names what the bank drills. |
| Absorptions (no node deleted) | `b2_hypothetical_past` → **wish / if only** · `b2_articles_correction` → **Articles 4** (merged into `b2_articles_genericity`, rescoped) · `b2_preposition_ing` → **gerunds & infinitives advanced** (the 2026-08 audit found it 84% A1 vocab re-teaching `b1_dependent_prepositions`) · `b2_clear_claims` (live, 12 items) → seed bank of **discourse markers**. Absorbed nodes park with `levels: []` and a note, once stamped. |
| Vocab level target | Banks lean B2→C1 Oxford; sentence texture rules apply (7–9 words, no frame twice, recycle earlier units). |
| Oversize live banks | `b2_second_conditional` / `b2_third_conditional` / `b2_word_formation` are 72 items — over band. Repair first (in progress on `b2/auto`); whether to trim or split is **James's call later**, not a run's. |
| Stale path | Committed `path_order_b2` still lists `b2_be_get_used_to` (now B1) and `craft`. The rebuild happens at stamping, from this file. |

---

## Grammar — 25

### Existing shells and live packs (19 slots)

| id | Title | State | Continues |
|----|-------|-------|-----------|
| `b2_present_perfect_continuous` | Present perfect simple vs continuous | live 48 · repair | `b1_present_perfect_vs_past`; owns PPC (B1's node was retired for it) |
| `b2_past_perfect` | Past perfect 2 — incl. continuous | live 26 · repair | `b1_past_perfect` |
| `b2_narrative_tenses` | Narrative tenses | shell · build | past simple/continuous/perfect woven; C29 timeline required |
| `b2_future_forms` | Future forms review + future continuous | shell · build | A2 will/going to · B1 cut future continuous to here |
| `b2_future_in_the_past` | Future in the past | shell · build | *was going to / would* — feeds narrative |
| `b2_second_conditional` | Second conditional (B2 pass) | live 72 · repair | `b1_second_conditional` |
| `b2_third_conditional` | Third conditional | live 72 · repair | B1 conditionals |
| `b2_mixed_conditionals` | Mixed conditionals | shell · build | second + third |
| `b2_wish_if_only` | Wish / if only (absorbs hypothetical past) | shell · build | `b1_wishes` |
| `b2_modal_perfect` | Modal perfect (must have / can't have) | shell · build | `b1_modals_speculation` · `b1_past_modals` |
| `b2_passives_advanced` | Passives 2 | shell · build | `b1_passives` |
| `b2_causative` | Causative (have/get something done) | shell · build | passives thread |
| `b2_reported_speech_advanced` | Reported speech 3 | shell · build | `b1_reported_speech` + `_2`; C57 recap |
| `b2_relative_clauses_advanced` | Relative clauses 3 | shell · build | `b1_relative_clauses` + `_2`; C57 recap |
| `b2_participle_clauses` | Participle clauses | shell · build | relative clauses (reduction) |
| `b2_gerunds_infinitives_advanced` | Verb patterns 3 (absorbs preposition + -ing) | shell · build | `b1_verb_patterns_advanced` |
| `b2_articles_genericity` | Articles 4 (genericity + mixed cases) | shell · rescope | `b1_articles_advanced` |
| `b2_quantifiers_advanced` | Quantifiers 2 | shell · build | `a2_quantifiers` |
| `b2_discourse_markers` | Discourse markers (seeds: clear claims) | shell · build | `b1_linkers` · `trunk_opinions_b1` |

### Word formation thread (6 slots, ~every 9 units)

| id | Title | Job |
|----|-------|-----|
| `b2_prefixes_1` *(new)* | Prefixes 2 — negative & opposite | un-, in-/im-/il-/ir-, dis-, mis-, non- above `b1_prefixes` |
| `b2_suffixes_1` *(new)* | Suffixes 2 — making nouns | -tion, -ment, -ness, -ity, -ship, -hood above `b1_suffixes` |
| `b2_pie_roots` *(new)* | Roots — the oldest layer | PIE/Latin roots: spect, port, dict, duct, struct, press, form; ties the families together |
| `b2_prefixes_2` *(new)* | Prefixes 3 — degree & direction | over-, under-, re-, out-, co-, anti-, ex- |
| `b2_suffixes_2` *(new)* | Suffixes 3 — adjectives & verbs | -ive, -ous, -ful/-less, -able/-ible, -en, -ise |
| `b2_word_formation` | Word formation (FCE Part 3) | **exists, live 72** — the capstone, near the end |

---

## Vocab — 30

Every leaf: pictures → frames intro (C56), `quiz_mode: sentence_gap` (B22),
E10 Use, **"Build the family" card + 4–6 derived bank items**, 36-word cap.

### Continuations of deep families (13)

| Proposed id | Title | Line |
|-------------|-------|------|
| `leaf_travel_b2` | Travel 3 | A2 Travel 1 · B1 Travel 2 |
| `leaf_work_b2` | Work 4 | A1→B1 Work 1–3 |
| `leaf_home_b2` | Home 4 | A1→B1 Home 1–3 |
| `leaf_tech_b2` | Tech 4 | A1→B1 Tech 1–3 |
| `leaf_feelings_b2` | Feelings 4 | A1→B1 Feelings 1–3 |
| `leaf_food_b2` | Food 4 | A1–A2 Food 1–3 |
| `leaf_town_b2` | City life 4 | A1–A2 Town 1–3 |
| `leaf_school_b2` | Education 4 | A1–A2 School 1–3 |
| `leaf_personality_b2` | Personality 3 | A2 · B1 |
| `leaf_family_b2` | Family 3 | A1 · A2 |
| `leaf_health_b2` | Health 3 | A1 · A2 |
| `leaf_free_time_b2` | Leisure & culture 3 | A1 · A2 Free time |
| `leaf_shopping_b2` | Consumer 3 | A1 · A2 Shopping |

### Continuations of B1-born themes (10)

| Proposed id | Title | Continues |
|-------------|-------|-----------|
| `leaf_news_b2` | News 2 | `leaf_news_b1` |
| `leaf_crime_b2` | Crime & justice 2 | `leaf_crime_b1` |
| `leaf_environment_b2` | Environment 2 | `leaf_environment_b1` (← nature line) |
| `leaf_money_b2` | Money 2 | `leaf_money_b1` |
| `leaf_communication_b2` | Communication 2 | `leaf_communication_b1` |
| `leaf_relationships_b2` | Relationships 2 | `leaf_relationships_b1` |
| `leaf_self_b2` | Self & body 2 | `leaf_self_b1` |
| `leaf_opinions_b2` | Opinions & argument 2 | `trunk_opinions_b1` |
| `leaf_phrasal_3_b2` | Phrasal verbs 3 | B1 packs 1–2 |
| `leaf_phrasal_4_b2` | Phrasal verbs 4 | toward the FCE ~120 cumulative target |

### New strands (4) — each anchored to an existing family

| Proposed id | Title | Anchor |
|-------------|-------|--------|
| `leaf_science_b2` | Science & research | knowledge/ideas line; heaviest WF-family payoff |
| `leaf_media_b2` | Media & advertising | news + tech |
| `leaf_business_b2` | Business & economy | work + money |
| `leaf_society_b2` | Society & politics | news + crime; watch register — trim anything that smells C1 |

### Already live (3)

`b2_delexical_collocations` (24 · make/do/take/have/get — the chunks/get line) ·
`b2_false_friends` (25 · continues `leaf_false_friends_b1`) ·
`b2_fixed_phrases` (18 · idioms line). Repair to current rules; thicken toward 36.

**Cut (parked for C1):** Confusables 2, Word families 2 (the thread lives in the
six WF lessons + per-leaf family bits now).

---

## Checks — 5

Clone B1's five, pooling smoked B2 units at runtime: `b2_vocab_match` ·
`b2_vocab_type` · `b2_grammar_match` · `b2_grammar_type` · `b2_finale`
(Use on everything, does not skip, last on path).

---

## Proposed path order (60, play order)

WF lessons land at slots 7 · 16 · 26 · 34 · 43 · 55 — one every ~9.
Perfect/narrative family front-loaded, conditionals mid, formal machinery
(passives → reporting → clauses) later, exactly as the levels below did.

| # | unit | | # | unit |
|---|------|-|---|------|
| 1 | `b2_present_perfect_continuous` | | 31 | `b2_reported_speech_advanced` |
| 2 | `leaf_travel_b2` | | 32 | `leaf_communication_b2` |
| 3 | `b2_past_perfect` | | 33 | `leaf_society_b2` |
| 4 | `leaf_work_b2` | | 34 | **`b2_prefixes_2`** |
| 5 | `b2_narrative_tenses` | | 35 | `b2_relative_clauses_advanced` |
| 6 | `leaf_media_b2` | | 36 | `leaf_environment_b2` |
| 7 | **`b2_prefixes_1`** | | 37 | `b2_participle_clauses` |
| 8 | `leaf_home_b2` | | 38 | `leaf_town_b2` |
| 9 | `b2_future_forms` | | 39 | `leaf_phrasal_3_b2` |
| 10 | `leaf_tech_b2` | | 40 | `b2_gerunds_infinitives_advanced` |
| 11 | `b2_future_in_the_past` | | 41 | `leaf_business_b2` |
| 12 | `leaf_news_b2` | | 42 | `leaf_money_b2` |
| 13 | `b2_delexical_collocations` | | 43 | **`b2_suffixes_2`** |
| 14 | `b2_second_conditional` | | 44 | `b2_articles_genericity` |
| 15 | `leaf_feelings_b2` | | 45 | `leaf_food_b2` |
| 16 | **`b2_suffixes_1`** | | 46 | `leaf_free_time_b2` |
| 17 | `b2_third_conditional` | | 47 | `b2_quantifiers_advanced` |
| 18 | `leaf_relationships_b2` | | 48 | `leaf_shopping_b2` |
| 19 | `b2_mixed_conditionals` | | 49 | `leaf_self_b2` |
| 20 | `leaf_personality_b2` | | 50 | `b2_discourse_markers` |
| 21 | `b2_wish_if_only` | | 51 | `leaf_opinions_b2` |
| 22 | `leaf_family_b2` | | 52 | `leaf_school_b2` |
| 23 | `b2_modal_perfect` | | 53 | `b2_fixed_phrases` |
| 24 | `leaf_crime_b2` | | 54 | `leaf_phrasal_4_b2` |
| 25 | `b2_false_friends` | | 55 | **`b2_word_formation`** |
| 26 | **`b2_pie_roots`** | | 56–60 | the five checks |
| 27 | `b2_passives_advanced` | | | |
| 28 | `leaf_science_b2` | | | |
| 29 | `b2_causative` | | | |
| 30 | `leaf_health_b2` | | | |

Theme placement is deliberate where it pays: Media beside narrative tenses,
Science beside passives, Crime beside modal perfect (speculating about the
past), Business/Money beside verb patterns, Opinions beside discourse markers.

---

## Order of build (for the b2/auto lane)

1. **Repair the four live monsters** (already underway — third/second
   conditional, PP continuous, past perfect) + C29 timelines + C57 recaps.
2. **Build the parked shells** in path order, 24–40 items, under
   AGENT-LOOP.md's full gate.
3. **Thicken the three live vocab packs** to current rules.
4. New leaves and WF lessons **only after their node ids are stamped** — until
   then they are proposals, and inventing ids is a hard never.
