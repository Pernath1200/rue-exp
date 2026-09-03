# Smoke briefing — A1 vocab, 2026-08-31

Give this file to a worker tab that is looking at **remaining A1 vocab** before James plays it. Source of law is still `codex/AUTHORING-RULES.md`. This is the sitting’s crop, not a second rulebook.

Paste:

```
Read codex/SMOKE-BRIEFING.md then AUTHORING-RULES.md (the IDs it names).
Rue-exp. Do not invent node ids. Do not tick INSPECTED. Do not start A2 coming.
Look at remaining unsmoked A1 vocab (from SESSION-HANDOFF play order). Report which packs still break the sitting’s lessons. Dropdowns before any rewrite. I8 only if James wants a fix now.
Do not revert js/practice-vocab.js / progress.js / app.js / index.html.
```

---

## Already smoked this sitting — do not reopen unless he flags

Home, Free time, Feelings, Question words, Say, Places, Food, Countries, Clothes.  
Plus earlier: frames, social, daily, more.

Play next: Body → Health → Pronouns → Can/like/want → more2. Full list: `codex/SESSION-HANDOFF.md`.

---

## Content lessons (look for these on packs he has not played)

| ID | What went wrong | Fix | Look for on remaining packs |
|----|-----------------|-----|-----------------------------|
| **C49** | One picture page of 12, then Match, while the pack teaches 20–60 words. | Themed boards of 8–12 covering **every lemma**, then frames. | **Already applied** to remaining A1 leaves (Places … Ideas) and adjectives. Glue trunks were **not** batched — they still need a closed-class table, not a body paragraph (see Questions). |
| **C50** | Title *Glue · Wh- questions*. | Student title **Question words**. Id stays `trunk_glue_questions_a1`. | Other `trunk_glue_*` titles still say Glue. |
| **C51** | Meaning table *how → How are you?* (example in the meaning cell). | Cell names the category (*a feeling / state*). | Glue tables. |
| **C52** | say/tell and look/see buried in a frames note. | Each pair: own intro page **and** Quiz/Type/Use items whose chips are the pair. | Other trunks with a known pair (look/see already on Say). |
| **C18** | Intro title *Czech is not English*. | Name the thing: *Czech and English questions are different*. | Slogan titles. |
| **C20** | Page 1 *There is no picture here*. | Closed-class table, not teacher talk. | Remaining glue intros. |
| **B8** | Quiz gapped *old / many / time* on How old / How many / What time. | Gap the **question word**. Chips are question words. | Glue Quiz: gap the glue, not the content word. |
| **B22** | Quiz was 1–1 (*vtipný* → funny/sad/happy). Match already does that. | Leaf with a Use bank: `quiz_mode: "sentence_gap"` (Czech sentence + English `____`). **Do not flip smoked leaves until replayed.** | Remaining leaves with `sentences[]`. Feelings already on. |
| **A12** | *bike*, *square*, *station*, *country* each have two readings. | Sense in parens on the ambiguous side; one sense per item; accept the other honest English. | Homonyms on remaining leaves (Type/Match). |
| **F5** | Use demanded *have breakfast* when the pack only taught the noun. | Intro shows the collocation before Use asks *Snídám…*. A5 still accepts *eat*. | *have lunch / dinner*, other light-verb collocations. |
| **E6** | *My brother is Slovak* — then so are you. | Situation true in the world. *My friend is Slovak.* Parent origin is fine. | Use nationality / family sentences. |
| **D3** | Dual Czech *země / venkov* on one item. | One student-facing Czech. | Slash leftovers in `cz`. |

Also from Feelings: dropped *well* (adverb, already on A2 adverbs). *wonderful* Czech is *nádherný* only so Match does not twin *amazing*.

---

## Engine already in — do not re-fix unless it regresses

| What | Why |
|------|-----|
| **B9** even-split | 13–18 words → 9+8 Match, not 12+6. 12-word trunks stay 12. Bigger packs stay 12s. |
| Match leftover cover | After a board of 8, remaining sentences still get a board. Do not stamp done because `n ≤ 12`. |
| Clothes *bota* | *shoe* / *boot* cannot share a Match board (same Czech). Round label uses leftover words, not `ceil(n/12)`. |
| Fruit 36 unique Quiz+Type | Fat leaves: min(n, 36) unique words. Match/Use stay one round of 12. |
| Type leftover → Use | After two Type 12s (e.g. 24/30), Use is the primary button. 12/23 is not a leftover. |
| Smoke-skip Match | Skipping Match still counts as walked, so Use can fruit. |
| Next must not skip a stage | Quiz hub: no Type until Quiz coverage. Type hub: no Use until Type coverage. Clothes 23/23. |
| `strict_capitals` | Countries: lowercase *czech* is *Capital letter*. Type clue may show the capital; grading is still strict. |
| Type cover = words | Countries Type was covering Which-is-correct? sentences, so round 2 repeated. Type covers the **words**. |

Cache stamp is on `index.html` (`?v=`). Ctrl+F5 after JS.

---

## Parked — not this job

Thicker Quiz/Use banks (more than ~12 sentences), **no duds**, not auto-fill. `UNIT-SUGGESTIONS.md`.

---

## How to look

1. Remaining packs from SESSION-HANDOFF, in play order.
2. For each: intro pages vs lemma count (C49); glue = table not body (C20/C50); Quiz gaps the taught word (B8); leaf Quiz 1–1 vs sentence-gap (B22); Use collocations (F5); homonyms (A12).
3. Write findings. **Dropdowns. Then change only if James says.**
4. `verify_pack` / `check_playable` if you edit. Do not tick INSPECTED.
