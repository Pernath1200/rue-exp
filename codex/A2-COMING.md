# Missing A2 grammar — draft specs (2026-08-30)

Nine nodes already exist (`coming`, `G_*` stamped, **no pack files**). Do not invent ids.  
Do not auto-fill banks. Usable, not perfect. I8 before James plays. E7 Use = error-correction. C9/C10 intros. Pool before authoring (`make_pool.py --before <node>` once it is on the path).

Live A2 grammar is the 17 he smoked. These nine take A2 grammar 17 → 26. Still short of 60 for the level (vocab + checks fill the rest).

**Not these nine:** Time 2 (`parked-once-a-week.json`) — no node yet. Leave it.  
**Known divergence, not a gap:** defining relatives stay at B1 (`b1_relative_clauses`). EGP lists them at A2.

Go live only after a smoke tick. Until then they stay `coming` (Topics can show them; Do next skips them).

---

## Write in this order (student pain)

1. `a2_articles` — *I like the dogs* / *The life is hard*
2. `a2_simple_vs_continuous` — Czech has no progressive; the two forms never meet
3. `a2_past_questions` — *Where did you went?*
4. `a2_for_since` — *I live here five years*
5. `a2_have_to` — *mustn't* vs *don't have to*
6. `a2_say_tell` — říct / mluvit split; untreated to C1
7. `a2_too_enough` — meaning + position, missing at every level
8. `a2_could_able` — past of *can*, not B1 speculation
9. `a2_reflexives` — *I feel myself good* / *It happened me*

Path slot is independent of write order (below). A unit can be authored before it is inserted on the zigzag.

---

## Path slots (when they go live)

Insert on `path_order_a2` / spine **after** the unit that makes the contrast possible. Soft path.

| After (already live) | New unit |
|----------------------|----------|
| `a2_present_continuous` (and A1 present simple) | `a2_simple_vs_continuous` |
| `a2_past_simple` | `a2_past_questions` |
| `a2_present_perfect` | `a2_for_since` |
| `a2_modals_must_should` | `a2_have_to` |
| `a2_past_simple` + `a1_can` | `a2_could_able` |
| `a2_countable` | `a2_articles` |
| `a2_comparatives` | `a2_too_enough` |
| `a2_verb_patterns` | `a2_say_tell` |
| `a1_object_pronouns` (known) · mid/late A2 | `a2_reflexives` |

---

## Per unit

Shared ladder unless noted: intro (what it IS, then the L1 miss) → Check → Quiz → Type → Use `use_mode: correct`. Skip EN↔CZ Match when Czech cannot pick the form (B12). Authored chips (B3/B4). Gap is **this** point (B8). A2 metalanguage can be a little denser than A1; still no *this pack* (C23).

### 1. `a2_articles` — Articles at A2 — *the* vs zero  
**Hang:** Forms · `G_NP-A1B1-01`  
**Job:** Plurals and abstracts: *I like dogs* not *the dogs*; *Life is hard* not *The life*.  
**Not:** *a/an* (that is `a1_articles`). Not B2 genericity.  
**Check:** sort three boxes — *a/an* / *the* / *—* (zero). Chips are noun phrases (*dogs*, *the sun*, *music*), like the A1 four-way quiz, not sentence pairs.  
**Quiz/Type:** gap the article (including dash for zero). Four chips: a · an · the · —.  
**Use:** error-correction: *I like the dogs.* / *The life is hard.*

### 2. `a2_simple_vs_continuous` — Present simple vs continuous  
**Hang:** Verbs · `G_VP-A1B1-01`  
**Job:** Same verb, two jobs: *every day* vs *now / this week*. Czech *pije* is both (A0).  
**Not:** statives as a new list — one card, then Type; explanation names present simple (D5). Not future *going to*.  
**Check:** sort English sentences, same few verbs, light time cue (B12). Skip EN↔CZ.  
**Quiz/Type:** whole VP; stem `(work)` / `(work / now)`. Chips *works* / *is working*.  
**Use:** one error per sentence (*I working every day* or *I work now* when the stem is a short window).

### 3. `a2_past_questions` — Past questions & negatives  
**Hang:** Sentence · `G_SS-A1B1-01`  
**Job:** *did* + base. *Where did you go?* / *I didn't go.* Not *did you went* / *I didn't went*.  
**Not:** present *do/does* (A1). Not past continuous questions.  
**Check:** sort Correct / Needs repair, or Quiz “Which is correct?” (B21) with three full sentences.  
**Type:** skip if the cloze cannot force *did + go* (E8). Prefer Use.  
**Use:** *Where did you went?* → *Where did you go?*

### 4. `a2_for_since` — For / since + duration  
**Hang:** Verbs · `G_VP-A1B1-01`  
**Job:** *for* + period (*two years*), *since* + point (*2019*, *Monday*). Czech present for a continuing state: *I live here five years* is the miss.  
**Not:** present perfect vs past simple (that is `b1_present_perfect_vs_past`). `a2_present_perfect` already uses *for* as a **tense** cue — this unit owns **which word**.  
**Check:** sort two boxes, chips *two years* / *2019* / *Monday* / *a long time* (B10 shape).  
**Quiz/Type:** gap *for* / *since*. Stem has the time phrase.  
**Use:** *I live here five years* / *I have lived here since two years*.

### 5. `a2_have_to` — Have to / don't have to  
**Hang:** Verbs · `G_VP-A1B1-01`  
**Job:** obligation from outside (*have to*). *don't have to* = not necessary. *mustn't* = don't do it.  
**Not:** *must/should* as the only contrast (already `a2_modals_must_should`). The new chip is *have to* / *don't have to*.  
**Check:** sort *must* / *have to* / *don't have to* / *mustn't* only if the chip picks the bin (B13). Else skip Match; Quiz only.  
**Quiz:** same words, meaning cue on the stem (*It's the law* / *It's not necessary*).  
**Use:** *You mustn't pay* when the meaning is *you don't have to*.

### 6. `a2_could_able` — Can / could / be able to  
**Hang:** Verbs · `G_VP-A1B1-01`  
**Job:** *could* = past of *can* (ability). *be able to* when *can* has no form (*will be able to*, *have been able to*).  
**Not:** *could* = maybe (`b1_modals_speculation`). Not polite requests as the whole unit — one card max.  
**Check:** sort past ability / now / future ability, chips that force the box (*when I was five* / *tomorrow*).  
**Quiz:** *could* / *can* / *was able to* / *will be able to* — authored, not sibling verbs.  
**Use:** *I can swim when I was little.*

### 7. `a2_too_enough` — Too / enough  
**Hang:** Forms · `G_NP-A1B1-01`  
**Job:** *too* + adj (+ *to*-V). adj + *enough*. *enough* + noun. Position and meaning (too much / not enough).  
**Not:** *very* / *quite* (`b1_degree_adverbs`). Not comparatives.  
**Check:** sort *too* / *enough* if the chip picks it (*too tired* vs *old enough*). Else skip.  
**Quiz/Type:** gap *too* / *enough*; cue `(old)` so it is not a vocab test (A11).  
**Use:** *I'm enough old to drive* / *It's too much expensive*.

### 8. `a2_say_tell` — Say / tell / speak / talk  
**Hang:** Verb patterns · `G_VC-A1B1-01`  
**Job:** *tell* + person. *say* + the words (no person, or *say to*). *speak* + language. *talk* + *to/about*.  
**Not:** reported speech backshift (`b1_reported_speech`). Not *ask*.  
**Check:** match *say* / *tell* / *speak* / *talk* to a short frame (*____ him* / *____ English* / *____ hello*).  
**Quiz:** gap the verb; chips the four; person already on the stem or not.  
**Use:** *She said me the news* / *He told that he was tired*.

### 9. `a2_reflexives` — Reflexive verbs & *-self*  
**Hang:** Forms · `G_NP-A1B1-01`  
**Job:** English *myself* only when subject and object are the same (*I hurt myself*). Czech *se* does not always want *-self*: *I feel good* not *I feel myself good*; *It happened to me* not *It happened me*.  
**Not:** object pronouns *me/him* as the whole lesson (`a1_object_pronouns`).  
**Check:** sort *need -self* / *don't* — chips *hurt myself* / *feel good* / *enjoy ourselves*.  
**Quiz:** gap *myself* / *me* / *—* .  
**Use:** *I feel myself good* / *It happened me yesterday*.

---

## Sitting shape (when he is back)

One unit per tab. Spec above → pack `blocks[].items[]` (no authored `pack.quiz`) → intro tables → `coming` → `live` + spine insert + `--rebuild-tree` → I10 `lint.py` → play → Telegram.

First to write: **`a2_articles`**. Highest Czech error, node and hang already right, A1 articles already smoked so the contrast is clean.
