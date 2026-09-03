# Handoff — B1 smoke (written 2026-09-02, for the next sitting)

Give this file to a **new tab**. Do **not** open `codex/HANDOFF.md` (Claude kill switch).
Finish the A2 rail first — `codex/SMOKE-HANDOFF-A2-GRAMMAR-2026-09-03.md` is a separate tab.

Paste:

```
Read codex/SMOKE-HANDOFF-B1-2026-09-03.md then AGENTS.md · AUTHORING-RULES.md
(I8 after flags · I6 after tick · C1 · C11 · C14 · C18 · C53 · C54 · C55 · E7).
Rue-exp. Port 8097. Progress key rue-exp-progress. Codex: ../rue-codex.
Do not invent node ids. Do not tick INSPECTED by hand. Do not run scripts/sync_from_stable.py.
Job: B1 smoke from path_order_b1. Next play is in this file.
Every B1 unit is either BUILT-BUT-NEVER-PLAYED or a DRAFT NOBODY HAS READ. Dropdowns before any rewrite.
Ctrl+F5 after edits.
```

---

## Product

| | |
|--|--|
| Folder | `C:\Users\ADMIN\Documents\projects\rue-exp` |
| Port | 8097 |
| Progress | `rue-exp-progress` only |
| Bar | usable, not perfect |
| Path | `path_order_b1`, 60 slots · 35 grammar · 25 vocab (incl. 5 checks) |
| Plan | `codex/B1-PLAN.md` |

## Two switches before anything plays

Both are **off**. Neither has been flipped — A2 was still being smoked.

1. `js/app.js:65` — `const LIVE_LEVELS = ["A1", "A2"];` → add `"B1"`.
2. **36 of the 60 nodes are `status: "parked"`.** They are the units drafted 2026-09-02.
   Unpark as you reach them, or in one pass — but a parked unit will not open.

`check_playable` only counts **live** units, so it currently reports 79 and 0 errors
**without looking at any of the 36 drafts.** Expect new findings the moment they go live.

## Do not

- Run `scripts/sync_from_stable.py`. It rebuilds **all five** path orders from
  `nodes-grammar.json` and overwrites `tree.json`. On 2026-09-02 it silently cut
  `path_order_b1` from 60 to 43 and dropped every new grammar unit. If it must run,
  check `path_order_b1` is still 60 afterwards.
- Edit the registries from two tabs at once. `tree.json`, `nodes-grammar.json` and
  `nodes-vocab.json` are shared by every level — an A2 tab writing them touches B1.
  `path_order_b1` must be identical in `tree.json` **and** `nodes-grammar.json`;
  the second is the one sync reads.
- Invent node ids · hand-tick INSPECTED · refill B2/C1 stubs · push / Pages.

---

## What actually exists

| Group | Count | State |
|-------|------:|-------|
| Built earlier, `[x][ ]` in INSPECTED | 16 grammar | built, **never played** |
| Built earlier, vocab leaves | 8 | built, **never played** |
| Drafted 2026-09-02 | 16 grammar · 15 vocab | **never read by anyone** |
| Level checks | 5 | runtime-pooled, no bank; engine still A1-hardcoded |

Drafts: 197 grammar intro cards · 909 grammar items · 540 vocab words · 120 Use sentences.
Gates green, lint clean on all 15 vocab leaves. **I1: a green gate means it will not crash.
It says nothing about whether it is any good.**

## Now

**Next play:** http://localhost:8097/#b1_present_perfect_vs_past — 79 items, built earlier,
never played, and slot 1 on the path. It needs no unparking.

Then path order. First draft you reach is slot 3, `b1_present_perfect_continuous`.

Tick: `b1_present_perfect_vs_past tested`.

---

## Known before you start

These were found while drafting. None has been played.

| # | Thing | Where |
|---|-------|-------|
| 1 | **Six built leaves fail C49** — a 12-tile intro against 36 words. Not draft work; they were already like this. | `leaf_self_b1` · `leaf_knowledge_b1` · `leaf_work_b1` · `leaf_communication_b1` · `leaf_money_b1` · `leaf_home_b1` |
| 2 | **lint cannot check perfect-tense contractions.** `CONTRACTIONS` (lint.py:52) is 1:1 with no *has/had* entries, so *She's been working* expands to *"She is been working"* and flags. A8 says accept both ways, so the contraction stays and the check complains. Needs a 1:many map. | every perfect unit |
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
**These three are not yet in `AUTHORING-RULES.md`** — they should be promoted into it.

## After a flag

I8: findings → **dropdowns** → rewrite. Not a drive-by. After Telegram `<id> tested`:
new class → `AUTHORING-RULES.md` as `observed` → `python codex/reconcile_inspected.py` → **new tab**.
