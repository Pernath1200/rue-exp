# B1 smoke playbook — from the A2 sitting

**This is the file.** Give it to the B1 smoke tab on day one.

Content rules live in `codex/AUTHORING-RULES.md` (stable IDs, `observed` → `confirmed` → `enforced`). Do not copy them here. This file is the **sitting method** A2 taught, so B1 does not rediscover it.

Roster: `codex/B1-PLAN.md`. Lint: `codex/lint.py` (grammar only). Tick: Telegram `<id> tested` → `py -X utf8 codex/reconcile_inspected.py`.

---

## Two files, one job

| File | What it is |
|------|------------|
| `codex/AUTHORING-RULES.md` | Every correction found by playing. A0–A12, B1–B22, C1–C55, D, E, F, I8/I10. |
| **This file** | How to sit so those rules get applied *before* the hour burns. |

Dated A2 play-state (`SMOKE-HANDOFF-A2-*.md`) is leftover path, not this.

---

## Pace (James, 2026-09-02)

A2 hour-2 logged 8 ticks; some were catch-up from earlier. Real play is **about 5 units an hour ≈ 10% of a 60-list**, if prep is good.

| Pack state | Pace |
|------------|------|
| Leaf with pictures, frames, `quiz_mode: sentence_gap`, one sentence per lemma | fast — skip Match, flag, tick |
| Grammar whose card 0 already names the set / title / sort contrast | medium |
| Grammar stub, dump over 36, or intro rewrite mid-play + Ctrl+F5 | slow |

B1 is 32 grammar + 23 vocab + 5 checks. At 5/hour that is **about 12 hours** of play, not a weekend of discovery. Prep is what keeps it at 5.

---

## How a sitting runs (do not invent a fourth job)

| Job | What | How long |
|-----|------|----------|
| **Prep (I10)** | Grammar: `py -X utf8 codex/lint.py <id>` → 8-line card. Vocab: no lint. No `pack-adapt` dump. | seconds |
| **Card-0 pre-flight** | Grammar that joins a class already taught (modals, articles, some/any, tenses): C14 title, C55 set, C11 if Check is a sort, C43 if a scale. Fix *before* play. | minutes, not a rewrite sit |
| **Play** | James. Skip Match if dud. Flag as you go. Telegram tick. | ~10–15 min if prep held |
| **Rewrite (I8)** | Only after flags, or Wreck. Findings → dropdowns → change. Then replay. | a sit |

A tab that audits every intro card before the play is doing I8 first. That cost **22 minutes / 155k tokens** (2026-08-29) and blocked the next unit.

---

## Before the first B1 unit

Do these once. They are why A2 vocab hours were faster than A2 grammar stubs.

1. **`quiz_mode: sentence_gap`** on every B1 leaf that has `sentences[]`, *before* the first vocab smoke (B22). Do not flip a leaf after it is ticked until it is replayed.
2. **C49:** intro shows **every** new word (boards of 8–12), then frames. A 12-tile sample of a 36-word pack is not an intro.
3. **E10:** from A2, vocab Use is full-sentence production of the **new word**, not CZ→EN of the bank. Do not copy A1 translation-Use onto B1 leaves.
4. **E7:** B1 form-pack Use is error-correction when translation lets extra errors in (already true of several B1 packs).
5. **36 is a ceiling**, not a target. Cut dumps before they hit the hour.
6. **Sprint engine** (`js/vocab-sprint.js`) already takes a **level** for vocab match/type (A2 2026-09-02). B1 vocab checks clone that — do not fork a second file. **Grammar** match/type/finale are still A1-hardcoded; generalise to a level *before* the five B1 checks, same way.
7. Unlock `LIVE_LEVELS` to include B1 only when James says. A2 stays live.

---

## Grammar card 0 — the A2 hour-killer

Drills were fine. Intros burned the clock. Mid-play rewrite + Ctrl+F5 is the expensive path.

Before James opens a B1 grammar unit, card 0 must:

| ID | Check |
|----|--------|
| **C14** | Title is the unit name (EN + CZ). Not a slogan (*2 systems*, *Not from*). |
| **C1 / C55** | What it IS first. If it joins a closed class already taught, open on **the set**, then this member. Recap; link the full table. (`have_to` / `could_able` 2026-09-02.) |
| **C11** | If Check is a **sort**, the intro named that contrast. Sort chips do not introduce a pair the cards never showed. |
| **C43** | A degree scale names the axis (`need_scale` on too/enough). Not a mystery timeline. |
| **C53** | Form-change IS is with vs without, not a job both forms share. (`possessive_pronouns`.) |
| **C54** | Person lists are I / you / he / she / we / they. If the title has *hers*, *his* is in the table. |
| **C29** | Tense units: timeline vs tenses already taught. |
| **E7** | Use = one error, the teaching point. Not a second grammar hole. |

New IDs from A2 (already in AUTHORING-RULES as `observed`): **C53, C54, C55**. Promote if they recur at B1.

---

## Vocab — already in the engine (do not re-fix)

| What | Why |
|------|-----|
| B9 even-split | 13–18 words → 9+8 Match, not 12+6. Last leftover board under 8 even-splits too. |
| Type letter clue | Always on (`f_____ · 6 letters`), including short banks. |
| Skip Match | Still counts as walked, so Use can fruit. |
| Sentence-gap Quiz/Type | From `sentences[]`. One live sentence per lemma, up to 36. |
| Vocab sprint by level | `loadVocabPool(..., "B1")`. Trouble/best keys are per level. Topics-only trunks stay off the check. |

---

## Tick and memory

- Telegram `<tree_id> tested`. Pack filename aliases (`a2_travel` → `leaf_travel_a2`).
- Full id. A leading `1` is not a slot. Do not type `as_` for `a2_`.
- Phone `of 53` means the home listener is stale. This laptop’s SweepBot 409s if home still polls — ticks in the smoke tab still count if the log line is written.
- After tick: *what happened that is not already a rule?* → AUTHORING-RULES `observed` → reconcile → commit. **The tab is not the memory.**
- Do not hand-edit `INSPECTED.md`.

---

## Do not, at B1

- Invent node ids. Stamp in Codex first (`B1-PLAN.md` still has proposed ids).
- I8-audit a pack before the play.
- Copy A1 CZ→EN Use onto B1 leaves.
- Batch-refill Quiz/Use with duds.
- Start B1 vocab **extension** from auto (P-b1-vocab). The 23 leaves in B1-PLAN are the circle, not that program.
- Re-smoke A1/A2 unless it blocks a B1 unit.
- Fork `vocab-sprint.js`.

---

## First B1 play (when he unlocks)

`codex/B1-PLAN.md` path, smoke first: `#b1_present_perfect_vs_past`.

Prep that unit: I10 lint + card-0 (C29 timeline vs present perfect / past simple already taught at A2). Then play. Skip Match if Czech cannot pick the tense (B12) — that pack may already be a sort.
