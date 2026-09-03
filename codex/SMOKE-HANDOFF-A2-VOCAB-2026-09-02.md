# Handoff — A2 vocab smoke (2026-09-02, evening)

New tab. Do not continue the long thread. Read this, then `AGENTS.md` · `codex/A2-PLAN.md` · `codex/AUTHORING-RULES.md` (I8 after flags; I6 after Telegram tick; **E10**).

```
Folder: C:\Users\ADMIN\Documents\projects\rue-exp
Port: 8097
Progress key: rue-exp-progress
Codex: ../rue-codex
LIVE_LEVELS: ["A1","A2"]
```

**Bar:** usable, not perfect. Flag, Telegram `<tree_id> tested`, next.  
**Do not** invent node ids · hand-tick INSPECTED · start grammar · I10/lint.py (grammar-only) · copy routine rewrite-Use onto other leaves unless James asks · dump pack-adapt.

When he says **next:** give the next hash only, then stop.

Ctrl+F5. Cache: `index.html` → `js/app.js?v=2026-09-02-typeclue`.

---

## Where he is

**Now:** `http://localhost:8097/#leaf_feelings_a2` — next to smoke.

**This sitting (browser fruit / LEARNED, not Telegram):**

| Unit | Play | Notes |
|------|------|--------|
| `#leaf_routine_a2` | earlier sitting, through Use/fruit | Rewrite Use **pilot**. No Telegram tick assumed |
| `#leaf_family_a2` | Match + Quiz walk; Use flags | 25 words. Not confirmed LEARNED in this thread |
| `#leaf_travel_a2` | LEARNED | Was 75; **cut to 36 holidays**. Quiz/Type 36 |
| `#leaf_transport_a2` | LEARNED | “Okay, just needed expanding.” Quiz/Type 36 |
| `#leaf_freetime_a2` | LEARNED | 33 words, 33 sentences |

**INSPECTED.md still 0 A2 vocab ticks.** Telegram is the tick. Top 5 may list routine / family / travel / transport / freetime — he can send the **tree id** even if a unit is not slot 1:

`leaf_travel_a2 tested` · `leaf_transport_a2 tested` · `leaf_freetime_a2 tested`  
(`a2_travel tested` aliases.) After ticks: `py -X utf8 codex/reconcile_inspected.py`.

---

## Play order left (vocab only)

Skip dumps. Skip `a2_vocab_match` / `a2_vocab_type` (engine still A1). Adverbs 66 / ideas 92 / verbs 112 = keep-at-36 **later**, not this sitting.

1. `#leaf_feelings_a2` ← **here**
2. `#leaf_work_a2`
3. `#leaf_society_a2`
4. `#leaf_food_a2`
5. `#leaf_shopping_a2`
6. `#leaf_sports_a2`
7. `#leaf_nature_a2`
8. `#leaf_tech_a2`
9. `#leaf_school_a2`
10. `#leaf_clothes_a2`
11. `#leaf_media_a2`
12. `#leaf_home_a2` (39 — he names the 3 cuts)
13. `#leaf_health_a2` (41 — he names the 5 cuts)
14. `#leaf_appearance_a2`
15. `#leaf_personality_a2`
16. `#leaf_things_a2`
17. `#leaf_town_a2`

Replay if he wants: family (not confirmed done). Travel / transport / freetime already fruited this sitting.

Do not open: describing, verbs, ideas, ideas_2, misc, recycle, lexis, chunks.

---

## Locks this sitting

| | |
|--|--|
| **36 is a ceiling**, not a target. Clothes stays thin. |
| **Dumps** are leftover Oxford lists. Fates in `A2-PLAN.md`. Dead: describing, misc, ideas_2. Keep-at-36 later: ideas, verbs, **adverbs**. **Travel is done: 36 holidays.** Topics only: recycle / lexis / chunks. |
| **E10** A2 vocab Use is **not** CZ→EN of the long bank. Fruit = full-sentence Use. Czech support OK, phase out. |
| **Rewrite Use = routine only.** Do not copy onto other leaves unless he asks. |
| **Match** covers every word before Quiz. Skip still counts as walked. Last board under 8 is even-split (25 → 9+8+8, not 12+12+1). |
| **Quiz/Type** = one `sentences[]` gap per lemma (up to 36). Home 39 / health 41 still fruit-cap at 36. |
| **Type clues** always on (`f_____ · 6 letters`). |
| **C49** intros now cover every lemma on sitting leaves (done this sitting). Flag taste, don’t rewrite unless he asks. |
| **Home/health** — still 39 / 41. Do not cut unless he names the words. |

---

## What landed on disk this sitting

### Engine (James asked)

- Match leftover even-split when last board would be under 8 (`practice-vocab.js` `matchBoardSize` + short-leftover reset)
- Type letter clue on **every** vocab Type item (was fat-deck only, so 12-sentence stubs had no clue)
- Intro renderer reads `table` **and** `tables` (routine already/yet/still was invisible)
- Cache `?v=2026-09-02-typeclue`

### Content

- **C49:** picture boards of 8–12 covering every word, then frames, on the live A2 leaves that were a 12-tile sample (family through media, home, health, personality). Stubs appearance/things/town/transport were already full.
- **`a2_travel.json`:** 75 → **36** holidays (trip / hotel / beach). Transport overlap dropped. *vacation* accepted on *holiday*. `quiz_mode: sentence_gap`. 36 sentences. Intro 3×12 + frames.
- **Quiz/Type banks:** one live sentence per lemma on sitting A2 leaves (drops like *kids* / *cries* / *skis* rewritten to citation form). Stubs appearance / personality / things / town / transport: 12 → 36. Home + health flipped to `sentence_gap`.
- **Family Use:** accept *Children must behave*; *My sister has two children*.

### Not copied

Do **not** add `use_mode: rewrite` to feelings or later unless he asks.

---

## After Telegram tick

`py -X utf8 codex/reconcile_inspected.py` → commit if he wants → **new tab**. Vocab ticks use the tree id.

---

## New-tab paste

```
A2 vocab smoke continuation. Handoff: codex/SMOKE-HANDOFF-A2-VOCAB-2026-09-02.md
Now: http://localhost:8097/#leaf_feelings_a2
Ctrl+F5 (js/app.js?v=2026-09-02-typeclue).
Do not invent node ids. Do not hand-tick INSPECTED. Do not start grammar.
Do not copy routine rewrite-Use onto other leaves unless James asks.
When he says next: next hash only, then stop.
```
