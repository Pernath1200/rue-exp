# HANDOFF — unattended work is OFF (2026-08-10 · updated 2026-08-11)

**This file's existence is the kill switch.** Both cloud routines check for it
at step 0 and exit immediately without doing anything. It was deleted earlier
today by mistake and is restored deliberately.

**James's standing rule, 2026-08-10: manual edits only.** No cloud routine, no
cron, no background agent lane. Credits are the binding constraint — two days
of automation consumed ~40% of the overall allowance and >50% of Fable, and
running out means losing access to Claude for lessons, invoicing and everything
else. **Do not delete this file. Do not re-enable any routine.** If automation
ever looks like the right answer, say so and stop — James arms it himself at
claude.ai/code/routines.

Both routines are also **disabled** at the scheduler as of 2026-08-10 12:02
(`trig_019uhrW8FmRi5SmgTndG9JCU` build, `trig_01HunW8eDvCibPB4imEPuJUY` Czech
review). Two layers: disabled there, no-op here.

## State at stop

Everything from the previous terminal handoff (cloud run 36, 2026-08-09) still
stands and is in git history at commit `0914b98` — read it there if you need
the full picture. Its Czech authoring rules were extracted to
`codex/CZECH-TRAPS.md` so they survive independently. What changed since:

- **Q1 (the Oxford coverage anomaly) is CLOSED** — measurement-tier artifact,
  not a regression. Verdict in `codex/OXFORD-REMEASURE.md`. B1 extension
  re-scoped to ~498 words (tier B) rather than the old inflated 336.
- ~~Per-student progress shipped~~ — **WRONG, and was already wrong when
  written.** The picker was reverted the same day (`449272d`); `progress.js`
  now copies `rue-exp-progress:me` back to the bare key and deletes the profile
  keys. **One key, `rue-exp-progress`, never renamed.** Students use their own
  laptops, so the picker solved a problem that doesn't exist.
- **Two automation runs landed on `build` before the stop**: `b1_work` and
  `b1_money` dressed (intro + Use bank each), `trunk_core_b1` intro, plus a
  Czech review pass (0 fixes, 1 flag). **`build` is 6 commits ahead of `main`
  and unreviewed** — James's call whether to keep or discard.
- `codex/LESSON-READY-PLAN.md` describes the remaining work. **Its Phase 1
  automation lanes are cancelled**; the content scope stands as a manual
  to-do list.

## 2026-08-11 — interactive session (James smoking, Claude Code fixing)

First unit of `codex/ESSENTIAL-UNITS.md` worked properly. **Read that file
first** — it is the live control document for this workstream and now carries
the per-unit findings. Three commits, pushed to `main` (so live on Pages):

- **`03c0137` engine.** Five defects, all shell-wide rather than pack-specific,
  all found by smoking one unit. Intro `points[]` was never rendered (403 of
  557 grammar cards carry it; 43 had nothing else) and `**bold**` never parsed.
  Quiz dropped the `cz` support line on all 86 live units, breaking the CZ→EN
  contract. Type/Use auto-advanced after a correct answer; now everything waits
  for Enter. `reviewTick()` had no `return`, so `onReview` could never fire and
  a successful review passed in silence — reviews now earn the payoff banner in
  its `remembered` mode, which was built long ago and never wired. **Reviews no
  longer use a percentage gate at all** (James): unlimited retries, a stage
  counts when every item is right, an uncleared pass changes nothing — the same
  `stageIsClear` rule first-learning already used.
- **`2d8c76d` packs.** `a1_agreement` 26→28 items; `a1_present_simple`,
  `a2_quantifiers`, `a2_will_going_to` one Czech prompt each.
- **`858e140` docs.** Findings folded back into ESSENTIAL-UNITS.

**Smoke flag button restored** (`03c0137`), hostname-gated — automatic on
`localhost:8097`, impossible on Pages. `smoke-flags.js` had survived `7ec4bd1`
intact; only the wiring was cut.

### Open, in priority order

1. ~~`CZECH-TRAPS.md` still says "extinct"~~ **DONE 2026-08-11.** It now
   carries the correction and the triage rule. Original note:
   **`codex/CZECH-TRAPS.md` said the dropped-subject defect was "extinct —
   0 in 946".** That covered the **vocab sentence banks only**; grammar pack
   `cz` fields had never been swept and `a1_agreement` had three. The triage
   rule that makes a sweep cheap: **past tense is immune** (Czech marks gender
   and number on the verb), **present/future 3rd person is exposed**. Fix the
   file — it is what an agent reads directly.
2. **Four known grading defects at B2/C1**, found and deliberately left:
   `b2_modal_perfect` ×2, `b2_future_forms`, `c1_article_nuance`.
3. ~~`a2_agreement`~~ **DONE 2026-08-11.** Original note: **it is next and cheap** — `we were` is missing from the pack
   entirely (that is Martin's and Tomas's *"we was"*), and 10 of 26 items carry
   the untaught-tense distractor defect already fixed in `a1_agreement`.
4. ~~**Deep-linking still does not exist**~~ **DONE 2026-08-12.** Hash routing
   folded in from a parallel Grok local branch (see merge note below).
   `#a1_word_order` · `#/unit` · `#unit=id` · optional `&review=1` → `openNode()`.
   Back to map clears the hash. Marked sheets can deep-link a student into a unit.

### Merge note — 2026-08-12 (Grok local rebuild)

James smoke-tested with Claude on `origin/main` (`3134061`). A parallel Grok
branch had diverged with overlapping `a2_agreement` / docs. **Resolved:**

| Keep | Drop |
|------|------|
| All Claude tip (`3134061`) — engine, vocab, a2_agreement, docs, REPAIR-QUEUE | Grok's alternate `a2_agreement` (28-item version) |
| Deep-link (`js/app.js`) re-applied on Claude base | Essential pre-pass on word_order / articles / possessives (James smokes those) |
| Present/future He/She Czech subject sweep on other A1/A2 packs (not a2_agreement) | |

Local only until James OKs push. Pages still at last origin tip until then.

### Second half of 2026-08-11 — vocab/trunk smoke

James smoked the seven shape-coverage units. Findings, all now fixed or logged:

- **Articles: Czech has none, so a/the is unknowable from the prompt.** 617
  A1/A2 vocab items accepted only one reading. **Fixed in the grader**
  (`practice-vocab.js`), not the data: a/an/the interchangeable, but an
  article must still be PRESENT. Grammar packs unaffected — `a1_articles`
  still grades exactly. One rule instead of 617 edits that would rot.
- **Continuous aspect** — *pije* is "drinks" or "is drinking". Fixed in
  `a1_animals`; the other vocab banks are unswept. Vocab only.
- **`trunk_glue_pronouns_a1` is a DUD** and it generalises: in any `frames`
  pack whose target is a FUNCTION word, Match is decided by content words, so
  the target is never tested. James ruled: **re-scope the packs**, audit the
  whole glue family first. See REPAIR-QUEUE.
- **`a1_core_frames_adjectives`** got the first trunk intro (12 tiles as
  opposite pairs + frames + one trap). **Approved — it is the template for
  the other 10.** But do not author them before the glue-trunk audit: a good
  intro on a pack whose exercise cannot test its target is decoration.
- **`a2_agreement` done** — `we were` added (the most-evidenced error in the
  whole sweep, both students, and it was missing from the pack), 10 distractor
  sets stripped of past forms (past simple is A2 step 5; this is step 3).
- **Load audit built** (scratch, not committed). `leaf_describing_a2` is
  **314 items introducing 251 new words in one unit** — the largest thing in
  the app by 3x. A2 carries more new vocabulary than A1 in fewer units: it is
  **under-partitioned, not thin**. Same finding as 15 A2 grammar units against
  RUPL's 62. Caveat: raw new-word counts over-predict difficulty where
  cognates dominate — `leaf_ideas_a1` is 47/47 new and James aced it, while
  29-new Adjectives was harder. The audit needs a cognate column.

**Next session (James): finish the ESSENTIAL-UNITS list.** Word order, articles,
possessives next. Each is cheaper now the engine is fixed. Deep-link is live
locally for smoke (`#a1_word_order` etc.).

## Remaining work (manual, whenever James chooses)

4 B1 leaves + 2 B1 trunks still undressed · 13 A1/A2 trunk intros · ~117 B1/B2
sequencing leads · B1→C1 grammar never human-smoked · hyphen/non-ASCII
tokenizer fix (James-only by policy). All detailed in
`codex/LESSON-READY-PLAN.md`.
