# Tree thread — locks and next-tab handoff

**Product:** `rue-exp` only · port **8097** · `http://localhost:8097/`  
**Codex:** `../rue-codex` · units hang on `G_*` / `V_*` · do not invent ids or a 7th root.  
**This file** is the record of the Grok tree thread (closed 2026-08-31). Spine / Do next navigates. The tree is the status portrait.

Hard-refresh **Ctrl+F5** after JS changes. More → Map.

---

## Files to leave as they are (do not revert)

Dirty working-tree files that carry tree-picture work mixed with other tabs. **Do not `git checkout` these** to “clean up.”

| File | What it does |
|--|--|
| `js/tree-portrait.js` | Draws the SVG plant (roots, trunk, houses, lights). **Already on `main`.** Last picture rule is in the file header: one accumulating plant; faint empty seats; payoff does not crop the crown. |
| `js/app.js` | Wires the **Map** and the **payoff** to that portrait (level rail, highlight, `nodeTreeStrength`). Also contains unrelated home/exam chrome. Leave the file. |
| `js/progress.js` | Progress blob `rue-exp-progress` (never rename). Fruit gates, `ProgressStore` adapter, `nodeTreeStrength` (learned → remembered → mastered). Leave the file. |
| `index.html` | Map copy + `?v=` cache stamp so the browser actually loads new JS. |
| `scripts/_test_a1_tree.js` | Node tests for lights / store / strength. |
| `scripts/_test_map_lift.js` | Node tests for rail age, hang, Home branch, payoff crown. |
| `data/tree.json` | Live node registry the portrait reads (`root`, `tree_part`, `codex_unit`). Also gets smoke/spine edits from other tabs — do not revert the whole file. |
| `data/nodes-grammar.json` | Grammar node registry; must stay in lockstep with `tree.json` on hangs. |

**Not tree picture** (other million files): packs under `data/grammar/blocks/`, `data/vocab/blocks/`, `practice-*.js`, smoke/codex scripts. Different tabs.

---

## Locks

**Hang is one fact:** `root` == `tree_part` == pack `codex_unit` == that Codex unit’s `tree_part`. Gate: `codex/check_codex.py` + `codex/hang-baseline.json`. Never change a root without the matching `G_*`.

**Six laterals + tap** (no seventh root):

| Seat | Student label | Codex |
|--|--|--|
| `tap_root` | Foundation | no `G_*` |
| `noun_phrase` | Forms | `G_NP-*` articles, determiners, possessives, countability, comparison, quantifiers |
| `verb_phrase` | Verbs | `G_VP-*` tense, aspect, auxiliaries, modals, passives |
| `sentence_syntax` | Sentence | `G_SS-*` word order, questions, **agreement**, adverb position, **degree**, clefts/inversion |
| `clause_linking` | Linking | `G_CL-*` |
| `verb_complementation` | Verb patterns | `G_VC-*` |
| `prepositions_particles` | Prepositions | `G_PP-*` place, time, movement, to/for/with, dependent preps |

Vocab is **above soil**: trunk + 12 houses.

**Pronouns:** the *system* (I/me, my/your) is **roots** (Forms). Trunk glue may recycle the words; `trunk_glue_pronouns_a1` is not the grammar lesson. Not a house.

**Picture:**

- Level rail sets **how big** the plant can be (A1 sapling → B1 thicker).
- **Filled** = started / fruit / remembered (≥1 review) / mastered (≥4). Strongest first. Cap 6 slots; empty units do not steal lights.
- **Faint** = not done yet (ghost wood, unfilled). Future seats stay visible.
- Each completion is **the same plant plus this seat**. Grammar payoff **names and glows its root** but must still show the crown and previous greens. Do not crop to roots-only.
- Map and payoff read the **same store**. Payoff is not a second tree.
- Meters (More → Progress) stay Learned / Remembered / Mastered numbers. Do not force them to look like the drawing.

**Already applied hangs:** Degree, agreement (`a1`/`a2`), frequency → Sentence · `G_SS-*`. Audit (recommendations only): `audit/TREE-HANG-AUDIT-2026-08-28.md`. Do not retag further unless James types **apply**.

**Out of the app:** fluency (lesson + 12-lesson report only). No login. No inventing `G_*`/`V_*`. No Telegram / INSPECTED from a tree tab. Pack **items/intros** belong to the smoke tab.

**Store:** key `rue-exp-progress`. Thin `ProgressStore` so account-later is a swap, not a rewrite. Download/Import stay.

---

## Paste into Claude Code

```
# Handoff — rue-exp tree + Codex hang (TREE-THREAD.md, 2026-08-31)

You are in Claude Code. James is an English teacher in Prague.
Product is **rue-exp only** (`C:\Users\ADMIN\documents\projects\rue-exp`, port **8097**).
Codex-First: units hang on `G_*` / `V_*` in `../rue-codex`. Do not invent units, lesson procedures, or a second app. `rue2` / `rue3` are archive.

This tab owns **tree leftover + portrait + hang integrity**.
Smoke tab owns pack **items/intros**. Do not rewrite pack content. Do not tick INSPECTED. Do not touch Telegram.

Read `docs/TREE-THREAD.md` first. It is the lock file.

## Job

1. Hang gate already exists (`codex/check_codex.py`). Keep it green. Do not retag anything unless James types **apply**.
2. Portrait: one accumulating plant. Filled = done. Faint = not yet. Level caps size. Grammar payoff must show the same plant (crown included), with the new root labelled/glowing.
3. If you would invent a visual rule (1:1 knots, new colours, 7th root, roots-only crop), ask James first.

## Do not revert

Leave dirty `js/app.js`, `js/progress.js`, `index.html`, `scripts/_test_a1_tree.js` (and `data/tree.json` if dirty). They mix tree-picture work with other tabs.

## Files

- `js/tree-portrait.js` — SVG
- `js/app.js` — Map + payoff callers
- `js/progress.js` — `ProgressStore`, fruit, `nodeTreeStrength`
- `data/tree.json` + `data/nodes-grammar.json` — hangs
- `../rue-codex/grammar/Curriculum_Codex_Grammar.md` — human Codex; rebuild `codex.json` if you edit it
- `audit/TREE-HANG-AUDIT-2026-08-28.md` — mismatch list (recommend only)

Run: `py -m http.server 8097` → http://localhost:8097/ → More → Map. Ctrl+F5. Bump `?v=` on `index.html` if you change `js/` or `css/`.
```
