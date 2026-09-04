# Handoff — B1 smoke (written 2026-09-02, for the next sitting)

Give this file to a **new tab**. Do **not** open `codex/HANDOFF.md` (Claude kill switch).
A1 and A2 are finished (60/60, one tick each). B1 is the whole job now.

Paste:

```
Read codex/SMOKE-HANDOFF-B1-2026-09-03.md then AGENTS.md · AUTHORING-RULES.md
(I8 after flags · I6 after tick · C1 · C11 · C14 · C18 · C53 · C54 · C55 · E7).
Rue-exp. Port 8097. Progress key rue-exp-progress. Codex: ../rue-codex.
Do not invent node ids. Do not tick INSPECTED by hand. Do not run scripts/sync_from_stable.py.
Job: B1 from path_order_b1. Three rails, pick one per sitting — see the file.
16 built grammar have ONE tick (approve them). 8 built vocab are untracked. 30 units nobody has read.
0 of 59 approved. Check path_order_b1 is 59 in tree.json AND nodes-grammar.json before starting.
Dropdowns before any rewrite. Ctrl+F5 after edits.
```

---

## Product

| | |
|--|--|
| Folder | `C:\Users\ADMIN\Documents\projects\rue-exp` |
| Port | 8097 |
| Progress | `rue-exp-progress` only |
| Bar | usable, not perfect |
| Path | `path_order_b1`, **59 slots** · 34 grammar · 25 vocab (incl. 5 checks) |
| Plan | `codex/B1-PLAN.md` |

## Two switches before anything plays

~~Both are **off**.~~ **Both flipped, verified 2026-09-04.** Nothing here is left to do.

1. ~~`js/app.js:65`~~ — `LIVE_LEVELS` is now `["A1", "A2", "B1"]` (`js/app.js:75`).
2. ~~**36 of the 60 nodes are `status: "parked"`.**~~ **0 parked.** All 59 resolve to a
   node and all 59 open.

`check_playable` only counts **live** units, so while the 36 were parked it reported
79 and 0 errors without looking at any of them. They are live now, so its count is
real — but I1 still applies: it says they will not crash, not that they are any good.

## Do not

- Run `scripts/sync_from_stable.py`. It rebuilds **all five** path orders from
  `nodes-grammar.json` and overwrites `tree.json`. This has now bitten twice:
  2026-09-02 it cut `path_order_b1` from 60 to 43 and dropped every new grammar unit;
  by 2026-09-04 it had grown it to 65 by appending `trunk_recycle_a2`, `trunk_lexis_a2`,
  `trunk_chunks_a2`, `trunk_core_b1` and `craft` — three of them A2 units, and
  `trunk_core_b1` was ruled off-circle in `B1-PLAN.md`. Both times `nodes-grammar.json`
  kept the correct count, so **restore from there**, not from tree.json.
  **Check `path_order_b1` is 59 in BOTH files at the start of every sitting.**
- Edit the registries from two tabs at once. `tree.json`, `nodes-grammar.json` and
  `nodes-vocab.json` are shared by every level — an A2 tab writing them touches B1.
  `path_order_b1` must be identical in `tree.json` **and** `nodes-grammar.json`;
  the second is the one sync reads.
- Invent node ids · hand-tick INSPECTED · refill B2/C1 stubs · push / Pages.

---

## What actually exists

**Three different jobs, not one.** Corrected 2026-09-04 — an earlier version of this file
called the built grammar "never played". It is not: `[x][ ]` means played end to end.

| Group | Count | State | Job |
|-------|------:|-------|-----|
| Built earlier, `[x][ ]` | 16 grammar | **one tick — already played once** | second pass → **approve** (`[x][x]`) |
| Built earlier, vocab leaves | 8 | **not in the register at all** — it covers A1–A2 only | first smoke, and they need tracking |
| Drafted 2026-09-02 | 15 grammar · 15 vocab | **never read by anyone** | first smoke |
| Level checks | 5 | runtime-pooled, no bank; engine still A1-hardcoded | after the engine takes a level |

Nothing at B1 has a second tick. **0 approved of 59.**

Drafts: 197 grammar intro cards · 909 grammar items · 540 vocab words · 120 Use sentences.
Gates green, lint clean on all 15 vocab leaves. **I1: a green gate means it will not crash.
It says nothing about whether it is any good.**

## Now

Pick the rail first — the three groups want different work, and mixing them wastes the sitting:

- **Approve rail** — the 16 already-played grammar units, second pass. Cheapest ticks.
- **Draft rail** — the 30 units nobody has read. Highest risk, and where the eight known
  issues below live.
- **Untracked rail** — the 8 built B1 vocab leaves, which no register is watching.

~~**If starting on the draft rail:** slot 3, `b1_present_perfect_continuous`.~~ **Retired
2026-09-04** — James: present perfect has no time to settle before it, and slot 3 put it
*before* `b1_past_continuous_2` (slot 6), its own continuous-aspect prerequisite. `b2_present_perfect_continuous`
already owns the point with 48 items against this pack's 18. Removed from `path_order_b1`
in both files and parked (`levels: []`) like `trunk_core_b1`, so sync cannot re-append it.
The pack file is kept. **The draft rail now starts at `trunk_abstract_b1`.**
**If starting on the approve rail:** slot 1, `b1_present_perfect_vs_past` — 79 items,
already live, no unparking needed.

---

## Known before you start

These were found while drafting. None has been played.

| # | Thing | Where |
|---|-------|-------|
| 1 | **Six built leaves fail C49** — a 12-tile intro against 36 words. Not draft work; they were already like this. | `leaf_self_b1` · `leaf_knowledge_b1` · `leaf_work_b1` · `leaf_communication_b1` · `leaf_money_b1` · `leaf_home_b1` |
| 2 | ~~**lint cannot check perfect-tense contractions.**~~ **FIXED 2026-09-04.** `CONTRACTIONS` is now 1:many (`'s` = *is* OR *has*, `'d` = *had* OR *would*) with an `EXPANSIONS` reverse map, and the long→short pass skips negatives where the `n't` form already covers it. Corpus A8 hits 157 → 419 — the old 1:1 map was seeing about a third of the 404 items A8 documents. | every perfect unit |
| 3 | **Wrong intro shape** — transformation and contrast pairs got picture pages, and C52 wants a page per pair. The weakest drafted work. | `leaf_word_families_b1` · `leaf_false_friends_b1` · `leaf_confusables_b1` |
| 4 | **Scope chosen, not verified** — a backshift card and one item sit in the past perfect unit (F2 risk, approved by dropdown). And `b1_reported_speech_2` assumes the older pack really drills backshift; its note was read, its bank was not. | `b1_past_perfect` · `b1_reported_speech_2` |
| 5 | **Contradicts the tree.** Authored at B1 by dropdown; `Grammar Tree by Root.md` still files it at `B2.comparatives.advanced`. The tree edit has not been made. | `b1_comparison_2` |
| 6 | **540 words of machine-written Czech.** Diacritics correct, meanings unverified. Highest risk is the false-friends leaf, where the whole unit turns on Czech. *concurrence* is a weak entry — probably cut. | all 15 vocab leaves |
| 7 | **F3 on eight grammar drafts** — Use sentences with words not yet taught. `b1_passives` carries 14 of the same, so it is normal rather than clean. | see `lint.py <id>` |
| 8 | **Three thin built packs** still need thickening: 12, 24 and 24 items. | `b1_degree_adverbs` · `trunk_abstract_b1` · `trunk_chunks_b1` |

## Rules used

`AUTHORING-RULES.md`, **plus** `SMOKE-HANDOFF-A2-GRAMMAR-2026-09-02.md`, which carries three
rules the rules file does not have yet:

- **C53** a form-change card 0 does not define the new form by a job the old form also has
- **C54** person lists are I / you / he / she / we / they
- **C55** a new member of a class already taught opens on **set membership**, not only a cousin contrast
- and **C11 now includes sort**

C55 was applied to `b1_past_modals`, `b1_past_continuous_2`, `b1_agreement_tricky`,
`b1_comparison_2`, `b1_cause_concession`, `b1_prepositions_time_2`; C54 to `b1_reflexives_2`.
~~**These three are not yet in `AUTHORING-RULES.md`**~~ — **stale.** C53, C54 and
C55 are all in `AUTHORING-RULES.md`, and C56 (diagram-only intro pages are grammar)
landed after this file was written.

## After a flag

I8: findings → **dropdowns** → rewrite. Not a drive-by. After Telegram `<id> tested`:
new class → `AUTHORING-RULES.md` as `observed` → `python codex/reconcile_inspected.py` → **new tab**.
