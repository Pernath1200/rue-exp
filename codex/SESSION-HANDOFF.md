# Session handoff — 2026-08-31 (A1 beta close)

Open this file in a **new rue-exp overseer tab**. Do not use `codex/HANDOFF.md` (Claude kill switch). Folder: `C:\Users\ADMIN\documents\projects\rue-exp`.

Paste:

```
Rue-exp overseer. James oversees other tabs from here. Do not rewrite packs unless he asks. Do not tick INSPECTED by hand. Do not invent node ids. Port 8097. Progress key rue-exp-progress. Codex: ../rue-codex.

Read first: AGENTS.md · this file (codex/SESSION-HANDOFF.md) · PLAN.md · UNIT-SUGGESTIONS.md · LEVEL-CHECKS.md · WORKING-SYSTEM.md · AUTHORING-RULES.md (I10 = lint.py seconds, grammar only; I8 after flags; I6 after Telegram tick).

Job today: finish A1 beta by smoking remaining A1 vocab, then rest. Students still on rue2/rue3. Inspected ≠ approved. Do not start A2 coming grammar.

Answer “what next”, give paste prompts, keep docs honest. One worker tab per job. Recount A1 from tree.json path_order (60 live). Do not spend the hour on extra scripts or doc sweeps.
```

---

## Product

| | |
|--|--|
| App | rue-exp · **8097** · progress **`rue-exp-progress`** |
| Students | Still rue2 / rue3 until James promotes |
| Bar | Usable, not perfect. Sniper → neighbour → tree |
| Circle | **A1 60 / 60 live** on `path_order` (recounted 2026-08-31). `trunk_frames_a1` is `sitting_of` `a1_be_have` (teaching path 61, not a 61st slot) |

## Do not

- Invent node ids · hand-tick INSPECTED · start `codex/A2-COMING.md`
- Split Home/Family or Places (cap 60 instead)
- Raise sequencing baseline · push from auto · promote Pages · touch `codex/HANDOFF.md`

## Now (James)

1. **Ctrl+F5** → play `#leaf_feelings_a1` (18). Intro is 12 of 18 tiles — C49.
2. Telegram **`leaf_time_a1 tested`** — played to fruit; log still lacks the tick.
3. Then path order below. No I10 on vocab. Skip Match on glue trunks if dud. ~6/hour.
4. Telegram `<id> tested` after each. Inspected ≠ approved. After this tick send `units to test` if Telegram still skips Feelings (`of 53` is stale).

http://localhost:8097/#leaf_feelings_a1

## Remaining A1 vocab (play order)

Hold is only `a1_finale`. Rebuild Top 5 after Home tick. Play this order:

1. `#leaf_home_family` — **ticked 2026-08-31**
2. `#leaf_freetime_a1` — **ticked 2026-08-31** · C49 intro
3. `#leaf_feelings_a1` — **ticked 2026-08-31**
4. `#trunk_glue_questions_a1` — **ticked 2026-08-31** · Question words
5. `#trunk_verbs_say_a1` — **now**
6. `#leaf_places` — 60, Ctrl+F5
7. `#leaf_countries_a1`
8. `#leaf_food_a1` — 58
9. `#leaf_clothes_a1`
10. `#leaf_body_a1`
11. `#leaf_health_a1`
12. `#trunk_glue_pronouns_a1` — glue
13. `#trunk_can_like_want_a1`
14. `#trunk_verbs_more2_a1`
15. `#leaf_work_a1`
16. `#leaf_school_a1`
17. `#trunk_glue_modals_a1` — glue
18. `#trunk_prepositions_a1`
19. `#trunk_verbs_more3_a1`
20. `#trunk_there_time_a1`
21. `#trunk_glue_quantity_a1` — glue
22. `#leaf_time_a1` — done in app; **tick Telegram**
23. `#leaf_time_2_a1` — 60, live
24. `#leaf_nature_a1`
25. `#leaf_shopping_a1`
26. `#leaf_animals_a1`
27. `#trunk_glue_linkers_a1` — glue
28. `#trunk_verbs_action_a1`
29. `#leaf_tech_a1`
30. `#leaf_colours_a1`
31. `#trunk_adjectives_a1`
32. `#leaf_ideas_a1`
33. `#a1_vocab_match`
34. `#a1_vocab_type`
35. `#a1_finale` — last; keep held on the bot until vocab is done

After 34, Telegram will offer **A2 vocab**. Stop. Not today.

Grammar A1 teaching + Which + cloze: inspected. Finale not. Vocab ticked: frames, social, daily, more.

If Telegram says `of 53`: home listener is stale. Trampoline + restart. Good: `N down, M to go (of T). Snapshot …`

## Locks

| | |
|--|--|
| Cap 60 | Five Match boards of 12. Over 60 → cut to A2 counterpart, no new A1 node |
| Home cut | mum, dad, adult, apartment, upstairs, downstairs, sofa, stairs, neighbour |
| Places cut | journey, tourist, passport, vacation, flight, bicycle, policeman, university, theatre |
| Combined | Home+Family, Places+transport |
| Not A1 nodes | mine/yours, or, weather, relatives, grammar Time 2 (`once a week`) |

## Git — dirty sitting, not committed

Last push: `2231ca9`. Working tree has Time 2, Feelings, cap-60 cuts, tree/spine, adjectives, docs. Do **not** commit `--help`, `node_modules`, `.grok`. Ask before push.

## Worker pastes (only when needed)

**Rebuild bot ranking** (30s — Feelings is live, stop holding Free time):

```
In rue-exp: in codex/build_smoke_next.py set hold to only a1_finale (drop leaf_freetime_a1).
Then: py -X utf8 codex/reconcile_inspected.py
That rebuilds INSPECTED from the Telegram log (item counts: Home/Places 60, Time 1 36, add leaf_time_2_a1) and writes vault Top 5.
Do not tick INSPECTED by hand. Do not start A2. Do not rewrite packs.
```

**I8 only after James flags.** Vocab has no I10.

**After Telegram `<id> tested`:**

```
In rue-exp: py -X utf8 codex/reconcile_inspected.py
Do not tick INSPECTED by hand. If he flagged, I8 that unit in a new tab.
```

## Stale (do not spend the hour fixing)

- `codex/LEVEL-CHECKS.md` last line still says 58/60 (both spares landed).
- Vault Top 5 rebuilt 10:14 (Free time → Feelings). Home listener still needs Sync + `units to test`; if it says `of 53`, trampoline + restart.
