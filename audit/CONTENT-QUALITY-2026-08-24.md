# Content quality check — 2026-08-24

Review of live A1/A2 grammar + vocab on `main` (then this branch).  
Gates first; qualitative pass second. B1 vocab extension, engine/shell, and B1+ sequencing debt were **not** in scope.

---

## 1. Official gates

Run from repo root with `python3 -X utf8` (`py` is not on this machine).

| Gate | Result | Counts |
|------|--------|--------|
| `codex/verify_pack.py` | **PASS** | 171 packs · **0 errors** · 12 warnings |
| `codex/check_playable.py` | **PASS** | 100 live grammar units on path · **0 errors** · 0 warnings |
| `codex/audit.py --check` | **PASS** (ratchet) | before fix: **280 = baseline 280**; after the one A1 re-lexify: **279 types / 31 units**, baseline tightened 280 → 279 |
| `codex/check_codex.py` | **PASS** | 39 distinct tags · 56 canonical units · **0 unknown** |

`verify_pack` warnings (12/12) are all `b2_clear_claims` judgment-label gaps. REPAIR-QUEUE already records James’s ruling: permanent, correct, do not restyle.

`check_playable` only walks **grammar** units. Vocab ladders are not in that gate.

---

## 2. What the qualitative scan covered

Live A1/A2: **94** nodes with content (58 vocab · 36 grammar).  
A1 path 53 steps · A2 path 41 steps.

Checked mechanically, then sampled by hand:

- Vocab `intro` shape (two-page array, pictures / diagram / text-only glue, frames or equivalent page 2)
- `icon` / `swatch` on drill items (forbidden)
- Leaf `sentences[]` banks: count, `lemmas` in-pack, `en`+`cz`+`accepts`
- Language contract: every item `en`+`cz`, no `pl` (the lint already forbids `pl`)
- Czech trap family on vocab banks and A1/A2 grammar `cz` (dropped 3sg, `mít rád`, 1sg past, 1sg adjective)
- English typo / double-space heuristics
- Duplicate `en` inside grammar packs
- `accepts[]` vs canonical `en` (Use also grades `item.en` via the adapter, so a missing accept of the full `en` is not a miss)
- Trunk intro treatment vs AGENTS.md concrete / glue rule
- Remaining A1/A2 audit unknowns vs B1+ debt

---

## 3. Prioritized issues

Severity: **P0** ship-blocker · **P1** live A1/A2 student-facing defect or missing required surface · **P2** polish / known backlog · **P3** note only.

### P1 — fixed on this branch

| Pack | What’s wrong | Fix |
|------|----------------|-----|
| `a1_prepositions_time` | Use prompt *Volá mámě dvakrát denně.* does not fix He vs She (present 3sg). Accepts only *She…*. Same item used **calls**, taught later on the path (`trunk_verbs_action_a1`). Teaching point is *twice **a** day*, not the verb. | Czech: *Ona pomáhá mámě dvakrát denně.* English: *She helps her mother twice a day.* `help` / `helps` / `mother` are pool-legal `--before a1_prepositions_time`. |

Smoke: `#a1_prepositions_time` — Match / Type / Use on the *twice a day* item.

### P1 — remaining (not edited)

| Pack | What’s wrong | Suggested fix |
|------|----------------|---------------|
| `a2_core_frames_recycle` · `a2_core_frames_lexis` · `a2_core_frames_chunks` | Live A2 **trunks** with **no `intro` array**. Every other live A1/A2 vocab unit has two pages. Documented leftover from the 13-trunk intro backlog (A1 trunks are now dressed). | Author two-page intros. Judge per pack: recycle = content-word frames (picture-led is honest); lexis = abstract verbs (text-only or a schematic, not stretched emoji); chunks = formulae (glue / text-only). Do not invent frames — read the items. |
| `trunk_glue_pronouns_a1` (and the glue family) | Still the 2026-08-11 **DUD**: 3 of 12 items are place prepositions (*about / under / by*), and Match is decided by content words. James ruled **re-scope the whole glue family**, not pack-by-pack. Still unticked on REPAIR-QUEUE. | Audit all `glue_*` / `core_frames_*` function-word packs, then one revision so the target word is the distinguishing feature. Overlaps `a1_object_pronouns` / `a1_possessives` — decide trunk vs leaf first. |

### P2 — A1/A2 sequencing leftovers (live, higher priority than B1+)

`a1_articles` / `hour` is **gone from the report** (declared via `lemma`; P-hour still applies — do not re-pick that item).

Remaining A1/A2 unknown **types** after this branch (6 types / 4 units):

| Pack | Unknown | Teaching point? | Suggested re-lexify (pool-checked) |
|------|---------|-----------------|------------------------------------|
| `a2_comparatives` | `last` | No — gap is *much*. | *…much better than before.* (`before` is in the pool; *last year* is the only hit.) |
| `a2_ed_ing_adjectives` | `deadline` | No — gap is *stressed*. | *I am stressed about the exam / the test / the meeting.* |
| `a2_ed_ing_adjectives` | `moving` | No — gap is *stressful*. Gerund subject is extra. | *The journey is stressful.* (near-duplicate of *The new job is stressful* already in the pack — acceptable.) |
| `a2_quantifiers` | `version` | No — gap is *a lot*. | *The second film / book is a lot better.* |
| `a2_first_conditional` | `until` ×2 | **Yes** — intro and the 2026-08-19 rewrite teach *when / until / as soon as*. | **Keep.** Same class as P-hour. |
| `a2_first_conditional` | `link` | Patrik’s own sentence (*When we are online, I will send you the link*). | **Keep** unless James wants it swapped for *message* / *email* (both in the pool). |

Do **not** treat B1+ unknowns as this pass’s work. Current ratchet after the one A1 fix: **279** types / **31** units, almost all B1–C1 (`a1_prepositions_time` dropped off the report). Known tokenizer phantoms (`wi`+`fi`, `ond`+`ej`, bare `b`) stay until P-tokenizer.

### P2 — explanation quality (A1/A2 grammar)

| Pack | What’s wrong | Suggested fix |
|------|----------------|---------------|
| `a2_adverbs_order` | 50 items, **1** explanation: *“manner/place/time — keep natural English order.”* Most items are frequency / focus (*always, never, also, too, either, still*), so the line is the wrong category, not just thin. Already on REPAIR-QUEUE. | Split into families (mid-position frequency · *also/too/either* · manner) — same method as `a2_comparatives` 1→4. |
| `a2_ed_ing_adjectives` | 28 items, 2 explanations (the -ed / -ing pair). Adequate. | Optional third line for *stressful* (not a pure -ing participle). |
| `a1_like_want_need` · `a1_some_any` · `a1_imperatives` | 24 items, 2 explanations each. | Fine at A1; not a defect. |

A1/A2 explanations are otherwise **plain English** — no complex-metalanguage hits.

`a2_adverbs` (vocab leaf) page 2 uses a **table**, not `frames[]`. That is the right shape for adverbs (no *This is a …* carrier). Not a defect.

### P2 — grammar Czech (A1/A2), not graded wrong

Vocab `sentences[]` banks: **0** trap-family hits (dropped 3sg / `mít rád` / 1sg past / 1sg adjective). Matches the 2026-08-09 bank sweep.

Grammar `cz` is a different population (never in the Czech-review routine). After accepting (a) past tense as immune, (b) `rád/ráda` / gendered adjectives as subject-fixing, (c) He/She already listed in `accepts[]`:

- **One real Use-stage grading defect** — fixed above.
- **~14 `mám rád` prompts** (*I like…*) presume a male speaker. Not a grading miss (*I like* is forced). Worst concentration: `a1_like_want_need`, `a2_countable`, `a2_adverbs_order`. Recast onto a 3rd-person subject if James wants the support line gender-safe.
- **1sg past** is structural in `a2_past_simple` / `a2_past_continuous` (*Včera jsem pracoval*). Past morphology fixes person; it still assumes a male speaker. Same recast rule as the banks if touched.
- Many A2 items disambiguate with a trailing *(on)* / *(ona)*. Visible, so they grade; sloppy next to the *Ona se zajímá* prefix style used on 2026-08-12. Worst: `a2_adverbs_order` (*Ona je taky učitelka (ona).*).

### P2 — trunk intro treatment

| Treatment | Packs | Verdict |
|-----------|--------|---------|
| Concrete + 12 emoji tiles | `verbs_daily` · `verbs_more` · `verbs_say` · `verbs_more2` · `verbs_more3` · `verbs_action` · `adjectives` | Correct (AGENTS.md concrete-trunk rule). |
| Glue + text-only page 1 | `glue_questions` · `glue_pronouns` · `glue_modals` · `glue_quantity` · `glue_linkers` | Correct. |
| Text-only, not named glue | `be_have` · `social` · `can_like_want` · `there_time` · `prepositions` | Reasonable for function / formula frames. **Prepositions of place** are the one that could honestly take tiles (*under the table*, *by the window*) — optional, not required. |
| Missing intro | three A2 trunks | See P1. |

No glue trunk has pictures. No drill item carries `icon` / `swatch`.

### P3 — not defects

- Duplicate `en` in `a1_word_classes` / `a1_question_words` / `a1_object_pronouns`: same word in several frames. Intentional.
- `a2_will_going_to` two-sentence `en` (*Look at those bags. She is going to travel.*) whose `accepts` omit the full string: Use grades `item.en` as `answer`. Fine. He-variants are already accepted.
- Typo heuristics that hit *Does she have* / *Not: She have* / *Not: I going to study*: counterexamples, not errors.
- `leaf_describing_a2` size (314 items / 251 new words): known under-partition, not a lint failure.
- `b2_clear_claims` gap labels: locked.

---

## 4. Language contract

- Direction still `cz_to_en` on every pack the lint sees.
- Every live A1/A2 item has non-empty `en` and `cz`.
- All 38 A1/A2 leaf sentence banks present, none short of 8, **lemmas all in-pack**, 0 missing `accepts`.
- A1/A2 explainer prose is short, plain English.

---

## 5. What changed on this branch

- `data/grammar/blocks/a1_prepositions_time.json` — one item (Czech subject + pool-legal verb).
- `audit/SEQUENCING-REPORT.md` + `audit/sequencing-report.json` + `audit/sequencing-baseline.json` — regenerated by the gate; baseline **280 → 279**.
- This file.
- `codex/BUILD-DIGEST.md` — one run entry.

No spine / node-id / tree rebuild. `--rebuild-tree` was **not** run (it still reorders A1/A2 from a stale spine; see 2026-08-20 / 2026-08-22 digest notes).

---

## 6. Deliberately not touched

- **B1+ sequencing debt** (~273 remaining unknown types, including tokenizer phantoms).
- **Parked B1 vocab extension** (P-b1-vocab). `vocab/b1-build` not opened.
- **Engine / shell** (`js/` · `css/` · `index.html`).
- **Glue-trunk re-scope** (James: family-wide, after an audit).
- **Three A2 trunk intros** (real authoring; not a one-line fix).
- **`until` / `link`** on `a2_first_conditional`.
- **`a1_articles` / `hour`** (P-hour).
- **Gender-safe recasts** of `mám rád` / 1sg past in grammar packs (not grading defects).
- **Student deploy / Pages.**
- New node ids.

---

## 7. Suggested next sitting (human)

1. Smoke `#a1_prepositions_time` on the rewritten item.
2. ESSENTIAL-UNITS still unticked: `a1_word_order`, `a1_articles`, `a1_possessives`, `a1_object_pronouns` — walk, don’t batch.
3. If a short sequencing pass: the four easy A2 unknowns in the table above (`last`, `deadline`, `moving`, `version`). Pool already checked.
4. Glue-family re-scope when James is ready — do not dress more glue intros first.
5. Three A2 trunk intros after (4), or in parallel if those trunks are not glue-DUD shaped.
