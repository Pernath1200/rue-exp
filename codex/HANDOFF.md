# HANDOFF — RUE (`rue-exp`), unattended work closed 2026-08-09

This is the terminal document for RUE's **Claude** cloud automation. **Its
existence is the Claude kill switch:** the "RUE build" routine and the
Czech-review routine check for this file first and exit immediately on sight
of it. **Grok continuous improvement** is separate — controlled only by
`agent-nightly/RUE-AUTO.md` Status (READY / OFF), not by this file.

Written by cloud run 36 on branch `build`. Every number below was **re-counted
from `data/tree.json` and the pack files during that run**, not copied from
`codex/BUILD-DIGEST.md`. Where a digest figure and a fresh count disagreed, the
fresh count is what is printed here and the disagreement is called out.

> **Amended 2026-08-09 (local session, commit `7310998`) — read this first.**
> Three of the open items below were closed after this document was written:
> **Q3** (all 28 Czech review flags — applied), **Q5 item-level half** (the
> 32-item gloss-collision grading defect — engine fix shipped), and the four
> accepts-drift flags. Each section is marked inline. **`main` was also
> fast-forwarded to `build`** on the same day, so the two are aligned and the
> repo's default branch no longer shows the stale pre-P0 state; nothing is
> deployed and students remain on the old rue2/rue3 sites.
>
> **Amended again 2026-08-09 (Grok interactive) — James policy session.**
> **Q6 closed** (`a1_articles`/`hour` permanently accepted). **Item-level
> `lemma` allowed** (P-lemma). **B1 vocab extension stays interactive-only**
> (auto must not start). Continuous improvement: **Grok** lane
> `agent-nightly/RUE-AUTO.md` (every ~3h, no push). Full locks:
> `codex/POLICY-LOCKS.md`. Still open: **Q1** Oxford anomaly, **Q2**
> tokenizer, **Q4** twice-taught words, trunk intros, B1 leaf intros/banks.

---

## 1 · What RUE is, and where it stands

A unified English course for Czech learners — grammar and vocabulary on one
zigzag path — built and taught by James. `rue-exp` is **the one canonical
repo** (decided 2026-08-06). `rue-auto/grammar`, `rue3-exp` and `rue2-grok-v1.0`
are frozen archives; never edit or sync from them.

The course is **workable and playable end to end**. James wound down unattended
work on 2026-08-09 not because RUE was broken but because the next thing on the
list (a B1 vocabulary extension, section 6) is a multi-week build that doesn't
fit a short close-out window.

### Live nodes — fresh count, 2026-08-09

| | A1 | A2 | B1 | B2 | C1 | total |
|---|---|---|---|---|---|---|
| **grammar live** | 20 | 15 | 13 | 21 | 17 | **86** |
| **vocab live** | 33 | 25 | 9 | – | – | **67** |
| **live total** | 53 | 40 | 22 | 21 | 17 | **153** |

- **153 live nodes with content.** On disk: 93 grammar pack files, 67 vocab
  pack files (so 7 grammar packs exist but are not live).
- **Not live:** 7 grammar nodes at `status: "coming"` —
  `c1_error_patterns`, `c1_hedging_stance`, `b2_inversion`,
  `b2_cleft_sentences`, `b2_emphasis_fronting` (all catalogued C1),
  `b2_future_in_the_past`, `b2_clear_claims` (B2). Plus one parked vocab
  node, `craft` (B1/B2), with no content file.
- Vocab live splits into **38 leaves** (16 A1 + 22 A2 — B1 adds 6 more) and
  **29 trunks** (17 A1, 3 A2, 3 B1). The distinction matters: every backlog
  tally in the digests counts *leaves*.

### Completeness by feature — fresh count

| feature | A1 leaf | A1 trunk | A2 leaf | A2 trunk | B1 leaf | B1 trunk |
|---|---|---|---|---|---|---|
| **picture-led intro** | 16/16 | 7/17 | 22/22 | 0/3 | 0/6 | 0/3 |
| **Use-stage `sentences[]`** | 16/16 | — | 22/22 | 0/3 | 0/6 | 0/3 |

- **Use banks: 38 banks, 946 sentences.** A1 and A2 leaves are both **closed**.
  This was the wind-down's primary backlog and it is finished.
- **13 vocab trunk packs still have no intro** (10 A1 + 3 A2). Trunks were
  never in the wind-down's scope; frame/trunk packs also don't need a
  `sentences[]` bank — they drill their own items.
- All 86 live grammar packs have `intro.cards`. **None has `teaches_lemmas`
  (0/86)** — see section 6, this is the B1 plan's prerequisite.

### Gate state at close — all four green

| gate | result |
|---|---|
| `python3 -X utf8 codex/verify_pack.py` | 160 packs · **0 errors** · 12 warnings |
| `python3 -X utf8 codex/check_playable.py` | 86 live grammar units on path · **0 errors** · 0 warnings |
| `python3 -X utf8 codex/audit.py --check` | **126** unknown types across 19 units · **baseline 126** · ratchet ok |
| `python3 -X utf8 codex/check_codex.py` | 37 distinct tags · 55 canonical units · **PASSED** |
| `python3 -X utf8 scripts/smoke.py` | **SMOKE PASSED** |

**The two audit gate numbers are `126` and `126`** — current violations and
the ratchet baseline, equal, so the gate passes with no headroom. Any change
that adds a single untaught word fails it. The 12 `verify_pack` warnings are
all `b2_clear_claims` and are **permanent and correct** (James formalised this
2026-08-08: its gap answers are judgment labels — *overgeneral*, *clear claim*
— which is pedagogically right for a pack teaching argumentation). Do not
"fix" them.

**`py` is not on PATH in the cloud container; `python3 -X utf8` is.** Every
digest entry from run 30 onward re-discovered this.

---

## 2 · Where the 126 audit violations actually are

Fresh breakdown from `audit/sequencing-report.json`:

| level | units | violations |
|---|---|---|
| A1 | 1 | 1 |
| A2 | 0 | 0 |
| B1 | 14 | 96 |
| B2 | 4 | 29 |
| C1 | 0 | 0 |

**A1/A2 sequencing repair is exhausted.** The single A1 entry is
`a1_articles` / `hour`, and it is a permanent logged fork, not an oversight:
the item teaches *an hour* (silent h), so deleting `hour` deletes the teaching
point. `hour` *is* taught — by `leaf_time_a1`, which sits after `a1_articles`
on the path — so it is a true ordering violation. Every silent-h alternative
(`honest`, `honour`, `honor`, `heir`) was checked and none is pool-legal
either. Options are: move the unit, teach `hour` earlier, or accept it.
**Accepted, unchanged, awaiting James.**

**9 of the 126 are tokenizer artifacts, not content defects** — verified
directly from the report this run, and note this corrects the digest's
estimate of "~7":

- `wi` + `fi` in `b1_used_to`, `b1_relative_clauses`, `b2_third_conditional`
  — *Wi-Fi* split on its hyphen (6 of the 9).
- `ond` + `ej` in `b1_reported_speech` — *Ondřej* split on its diacritics.
- `b` in `b2_present_perfect_continuous` — a bare fragment.

`WORD_RE` in `codex/audit.py` is `[a-z']+`, so hyphens and non-ASCII letters
both split a word. **No content rewrite can ever clear these 9.** The fix is
in `tokens_of()`, which is gate tooling — see section 5, an agent that can
lower its own ratchet by editing the gate is not a ratchet, so this is James's
call and was deliberately never taken by the cloud lane.

The remaining ~117 are genuine B1/B2 teaching-order leads. They were out of
the wind-down's scope and nobody has worked them.

---

## 3 · What was deliberately NOT done, and why

Each of these was a real decision with a reason, not an omission. Re-deciding
them is fine; re-discovering them is waste.

1. **B1 vocabulary extension — parked, not cancelled.** ~26 new thematic
   packs to bring vocab to a clean B1. Section 6 below.
2. **`teaches_lemmas` backfill across the 93 grammar packs — 0/93, not
   started.** It is step 2 of the B1 plan and has no value outside it.
3. **B1/B2 sequencing repair (~117 violations).** Out of the wind-down's
   scope. A1/A2 is genuinely exhausted; B1/B2 was never attempted.
4. **The 3 remaining tokenizer fixes** (hyphen, non-ASCII) — gate tooling,
   James's call. Section 5.
5. **13 vocab trunk intros** (10 A1, 3 A2). Trunks were out of scope. James's
   2026-08-08 rule for them still stands and is in AGENTS.md: concrete trunks
   get normal emoji tiles, glue trunks (pronouns, modals, question words,
   quantity, linkers) get a **text-only page 1** — forcing an emoji onto a
   function word would be a lie. Decide per pack by reading its items.
6. **B1 vocab Use banks (0/6 leaves) and B1 intros (0/9).** The B1 vocab tier
   is live but has neither feature. It was never in scope for the A1/A2
   backlog work.
7. **No new C1 units.** The wind-down forbade new content. **The stale
   instruction to watch for:** the wind-down prompt named
   `c1_reporting_complementation` as "the agreed next C1 pick". That is
   wrong — it has been **live at full house size (48 items) since run 26**.
   Anything repeating it is stale.
8. **`a2_describing` split into literal separate packs.** James asked for the
   314-adjective pack to be "split into several banks". A pack carries exactly
   one `sentences[]` array, and changing pack shape requires changing **both**
   `js/pack-adapt.js` and `codex/check_playable.py` — engine code the cloud
   lane must not touch. So it was authored as five contiguous contrast-pair
   banks *inside* the one array (size/shape · character/mood · quality ·
   condition · the un- family). **If James meant literal separate packs, that
   is a node-registry plus engine change and needs the local lane.**
9. **Use-bank coverage is selective, not complete, on the big packs.** The
   spec says ~12 sentences per pack; the four giants got more (`a2_describing`
   61 of 314 items, `a2_ideas` 89 of 89, `a2_misc` 84 of 86, `a2_verbs` 28 of
   112). The reason for exceeding 12: `DEFAULT_PASS` in `js/practice-vocab.js`
   is **12**, so a 12-sentence bank hands the student the identical Use pass
   every single time — the rotation has nothing to rotate. Cutting is cheap if
   James wants the literal floor; the opposite is not.

---

## 4 · Open questions — everything unresolved, in one place

These need a human. They are listed worst-first by how much they'd cost to
rediscover.

### Q1 · The Oxford coverage measurement moved the wrong way — unexplained

**This is the most important open item and it is genuinely unresolved.**

The B1 vocab plan was scoped off a 336-word gap. When it was re-measured on
2026-08-08 after two days of content work, coverage moved **down**: A1 from
98 % to 90 %, B1 from 56 % to 30 %. **Coverage cannot fall when work only
*adds* content.** So either the measurement is wrong, or content work is
silently destroying coverage.

The leading hypothesis, **unconfirmed**: the sequencing repairs (the
`fix(unit): re-lexify … onto taught vocabulary` commits, which swap a word for
an already-taught synonym to clear an audit violation) may be trading away
Oxford-listed words for simpler off-list ones, with **no preference either
way** in the repair procedure. Roughly two dozen such re-lexify commits landed
across runs 18-35. If that is the cause, the ratchet has been quietly buying
audit compliance with vocabulary coverage for weeks.

Nobody has tested this. **Do not trust any coverage number until
`codex/scripts/rue_oxford.py` is re-run fresh.**

**Practical trap:** that script, the CEFR word list, and the gap file are
**not on `build`**. They live only on `origin/vocab/b1-build`
(`codex/scripts/rue_oxford.py`, `codex/scripts/lex_coverage.py`,
`codex/scripts/gloss_check.py`, `codex/scripts/backfill_teaches_lemmas.py`,
`codex/vocab/oxford-5k-cefr.csv`, `codex/vocab/oxford-b1-gap.tsv`). Anyone
reading a file path from AGENTS.md literally on `build` will not find it.

### Q2 · The two remaining tokenizer defects (gate tooling — James only)

`tokens_of()` / `WORD_RE` splits on hyphens and on non-ASCII letters, creating
9 permanently-unclearable violations (section 2). One change to the regex
fixes both. **It lowers the audit number without any content improving**, so
it must be James's, and the baseline should be re-cut deliberately when it
lands. The cloud lane held to propose-only on this across ~10 runs.

Historical note so nobody re-reports these as new: **two earlier tokenizer
defects of the same family were already fixed by James on 2026-08-08** — the
contraction/possessive-genitive fix (`WORD_RE` treated `father's` as one
token, which made *every* possessive genitive unwritable outside
`a1_possessives`) and the parenthesised-disambiguator fix (`targets_of()`
stripped `PARENS_RE` but `exposed_text()` did not, so `watch (wrist)` exposed
`wrist` and taught only `watch`). Those two fixes are what dropped the audit
from 143 to 129. **They are done. The hyphen and non-ASCII cases are what
remain.**

### Q3 · Czech items flagged for James — **CLOSED 2026-08-09** (`7310998`)

~~`codex/CZECH-REVIEW.md` carries 27 flagged items across 19 "For James"
sections.~~ **All 28 (the 27 plus №25 from the FINAL PASS) were resolved in a
local session on 2026-08-09.** James's ruling: apply the review routine's own
suggested fix in every case, rather than adjudicating one at a time.

Applied: 4 accepts-drift fixes (cz correct but `accepts[]` only allowed a
different English phrasing — a real "right answer marked wrong" class);
8 wrong-sense glosses (*smell* zápach→pach, *toothache* zubu→zubů,
*teaching* výuka→Učitelství, *structure*→Konstrukce/pevná, *variety*→výběr,
*unit*→lekce, *receive* obdrží→dostane, *messy* nepořádný→neuklizený);
7 intro-tile choices (incl. `a1_shopping`'s otevřeno/zavřeno pair);
3 register/idiom; 3 gender-symmetry slashes; 2 word-order (there-is items
now plain existential *Je tam*, not fronted deictic *Tam je*).

**`codex/CZECH-REVIEW.md` was NOT edited** — it belongs to the review routine
and the rule stands even though the routine has stopped. The flags remain in
it as the historical record; this entry is the answer to them.

Still genuinely open from that file: nothing. Build-side judgment calls
quoted below (`a2_describing` *tidy*, *shut*; `a2_verbs` *fix*) were build's
own flags rather than the review routine's, and were left as authored.

### Q4 · 164 English words are taught twice across live A1/A2 vocab units

Measured in run 24, never fixed, never ruled on. Not a gate failure and not
obviously wrong — recycling is legitimate — but it was surfaced as something
James might want to prune and never got an answer.

### Q5 · Within-pack Czech gloss collision

Two items in one pack sharing a Czech gloss produce a CZ→EN prompt with two
correct English answers, so a student answering the other one **grades
wrong**. Same class of defect as the dropped-subject rule, different cause.
`a2_describing` alone has 11 exact-gloss pairs (rich/wealthy, entire/whole,
electric/electrical, certain/sure, ill/sick, enormous/huge, likely/probable,
fast/quick, indoor/inner, high/tall, broad/wide).

**A good handling was found and should be the default: put the sibling in
`accepts[]`.** The audit reads `sentences[].en` and never `accepts[]`, so an
alternate is free at the gate and stops a right answer grading wrong. It does
not rescue everything — *zvláštní* glosses both `special` and `strange`, and
accepting both changes what the sentence means, so `special` was dropped and
`unique` covered instead. **The test is whether the two readings are the same
sentence (rescuable) or different ones (not).**

**The item-level half is now FIXED — 2026-08-09 (`7310998`), option (c).**
A separate run measured **32 vocab items** (22 `a2_describing`, 6
`a2_adverbs`, 4 `a2_ideas`) whose Czech prompt has two equally correct
English answers at the item level — a live student-facing grading defect.
James chose the engine fix, which is the only one of the three options that
repairs all three modes, since Quiz and Match both grade by item identity
rather than by string:

- **Quiz** (`js/practice-vocab.js`): a sibling sharing this item's Czech
  gloss is no longer eligible as a distractor. Verified on `a2_adverbs` —
  *definitely* excluded from *rozhodně*'s options, distractor pool shrinks
  only 65 → 64, so no collateral loss.
- **Match**: the board dedupes by Czech gloss, so it can no longer show two
  identical tiles. `a2_adverbs` 66 items → 63 tiles, 0 duplicates.
- **Type** was already safe via `accepts[]`.

Both use a shared `glossKey()` normaliser. The sentence-bank half described
above was already handled during the build.

### Q6 · `a1_articles` / `hour` — **CLOSED 2026-08-09** (James · P-hour)

**Accepted permanently.** Silent-h teaching point; do not re-lexify or re-pick.
See `codex/POLICY-LOCKS.md` and `audit/SEQUENCING-REPORT.md`.

---

## 5 · Standing hard rules — these survive the wind-down

They are in `AGENTS.md` in full; this is the short list that cost the most to
learn. **Every one of them was earned by something going wrong.**

- **`main` is James's.** Automation pushes `build` only. Never force-push.
- **Never edit `rue2-*`, `rue3-*`, `rue-auto`** — frozen archives. This repo is
  canonical.
- **Language contract is locked:** direction is CZ → EN. `en` is always the
  graded target, `cz` always the support. **Never reintroduce `pl` fields or a
  direction toggle.**
- **Progress key `rue-exp-progress` is sacred** — never rename.
- **Never put `icon`/`swatch` on drill items.** The chip renders beside both
  the English and the Czech tile, which turns Match into pairing identical
  pictures. Pictures are intro-only.
- **Pack shape is fixed:** content lives in `blocks[].items[]` with
  `intro.cards` and `check.sequence`. Never author `pack.match/quiz/type_items/
  use_items`. **If you change pack shape you must change BOTH
  `js/pack-adapt.js` and `codex/check_playable.py`** or the ladder silently
  empties — this is exactly how all 52 live grammar units once shipped a
  student straight to "Done · 100 %" having answered zero questions.
- **Never invent a `codex_unit` id.** `check_codex.py` must pass; a missing
  unit means adding it upstream in rue-codex first, then refreshing
  `codex/codex-units.json`.
- **Never invent node ids.** Author for registered nodes in
  `data/nodes-grammar.json` / `data/nodes-vocab.json`, flip status there, then
  `py scripts/sync_from_stable.py --rebuild-tree`.
- **All four gates green before every commit.** The audit is a ratchet:
  violations may never rise.
- **Pool before authoring** — `codex/make_pool.py POOL.md --before <node_id>`,
  regenerated per pack. Only pool-legal + GLUE + same-step partner material.
- **Verify mechanically, never by eye, and never trust a digest** — including
  your own from earlier in the same run. About a third of fluent "all clean"
  agent reports on the sibling project hid a real bug. `codex/_oracle.py`
  exists for exactly this: it imports `audit.py` and reuses **its own**
  `variants()` / `tokens_of()` / `GLUE` / `targets_of()` / `full_path()` to
  replay the gate's `legal` set, and it has a `--selftest` (6 published
  cases). It is not a gate and nothing reads it. **Every run from 30 to 34
  rebuilt this from scratch and threw it away** before it was finally
  committed.
- **Every genuine design fork: conservative default + a logged digest note.
  Never a silent guess.**
- **Automation never promotes itself to students.** All output is a draft that
  passes the machine gate; James still smokes.

### Czech authoring rules — the trap family, all of it

These were discovered one at a time across runs 27-36 and are the single most
expensive body of knowledge in the project. Any future Czech authoring needs
all of them.

1. **Dropped subject (the grading defect).** Czech drops the subject pronoun,
   so *Už je tady* is true for he/she/it alike and a student answering with a
   different subject than the author intended **grades wrong**. Every 3sg
   prompt needs an explicit subject unless it is impersonal.
2. **`mít rád` leaks the speaker's gender** — *Mám rád* vs *Mám ráda*.
3. **Past-tense verbs leak the speaker's gender** — *Četl jsem* vs *Četla
   jsem*. Easiest to write by accident, because the English (*I read an
   interesting article*) looks perfectly neutral. 1pl has it too (*Dívali* vs
   *Dívaly*).
4. **Predicate adjectives leak gender** — *Jsem naštvaný* vs *naštvaná*.
   Structural for any feelings/describing pack.
5. **Reflexives leak it too.** *himself/herself/itself/themselves* are safe
   because a 3rd-person subject fixes *sám/sama/samy*, but **`myself` and
   `ourselves` cannot be written safely at all** — *Udělal jsem to sám* leaks
   masculine exactly like a 1sg past.
6. **Gloss collision** — Q5 above.

**The method that works** (runs 32-35 hit zero defects with it, versus ~3 % by
catching them on review): don't write the defect and then hunt it. Route every
prompt through an explicit noun subject (*Můj šéf*, *Ta láhev*, *Moje
babička*), or 1sg/1pl present morphology (*Mám*, *Potřebuji*, *Máme*), or an
impersonal/existential frame. Where the past tense is unavoidable — a health
pack is full of accidents — **put the past on an explicit non-speaker
subject**: *Byla tady nehoda* is past but agrees with *nehoda*, not with the
student. Same escape for adjectives: hang it on a noun the student does not
inhabit (*Moje čeština je strašná*).

**Verified state at close:** all 38 shipped banks, 946 sentences, swept
mechanically in run 36 against all of the above. **The dropped-subject grading
defect is extinct — 0 in 946.** Two gender-leak prompts were found in A1 banks
that predated the traps' discovery and were fixed (`a5a8152`). Note those two
were *not* grading defects: *Mám rád fotbal* still forces the answer *I like
football*. What they were is a support prompt presuming a male student.

---

## 6 · The parked B1 vocabulary extension

**Do not start this without James.** It is parked, not cancelled.

The full scoped plan lives in **`AGENTS.md`, section "B1 vocabulary extension
— PARKED, future work only"** and is deliberately **not duplicated here** — one
copy, in the binding contract. Read it there. Its three ordered steps are:
re-verify the gap before trusting it (Q1 above — this is not optional), backfill
`teaches_lemmas` across the 93 grammar packs (0/93), then author ~26 thematic
packs on branch `vocab/b1-build`.

Two things to know before opening it:

- **`origin/vocab/b1-build` exists and is pushed**, rebased current as of
  2026-08-08. It will need re-rebasing onto whatever `build` has become.
- Deeper reasoning (covering both RUE and RUPL; decisions 9-15 are RUE's) is in
  `rupl-exp/codex/VOCAB-REORIENTATION-2026-08-07.md` — **a different repo**.

**B2/C1 vocab scope is a separate and deliberately unresolved decision.** RUE's
grammar reaches C1; its vocabulary stops at B1. Nobody has decided whether it
should follow.

---

## 7 · How to restart unattended work

1. **Delete `codex/HANDOFF.md`.** While it exists both routines exit at step 0
   without doing anything. This is the only switch.
2. Decide the scope first and write it down where a routine will read it —
   `AGENTS.md` for contract-level rules, a fresh plan file for a program of
   work. The routines are self-contained prompts with **no memory between
   runs**; anything not in the repo does not exist to them.
3. **Answer Q1 before any vocabulary program.** The coverage anomaly makes
   every gap number untrustworthy, and the B1 plan is scoped off one.
4. Recreate or re-enable the scheduled routines. The two that ran RUE were
   `trig_019uhrW8FmRi5SmgTndG9JCU` and `trig_01HunW8eDvCibPB4imEPuJUY` (build
   and Czech-review). **Verify those ids are real before acting on them** —
   they were quoted in a prompt, not confirmed from the scheduler.
5. `codex/WIND-DOWN.md` is retired. Don't edit it; it is the record of how
   this ended.

**A warning about scheduled prompts, learned the hard way in run 35.** A stored
prompt can contradict `AGENTS.md`, because the two are written at different
times and neither knows about the other. Run 35 hit a prompt saying *stop
permanently* against an AGENTS.md commit from hours earlier saying *switch
branches and start a 26-pack build*, both triggered by the same event. It took
the reversible path — it did the non-additive work but refused to write this
file, because writing it is a kill switch that would have silently cancelled a
build James had just specified. **That was the right call and it is the general
rule: between an irreversible stop and a reversible pause, on contradictory
authority, pause and ask.** James then resolved it explicitly by parking the
B1 plan in AGENTS.md and writing `codex/WIND-DOWN.md`, which is why run 36
could write this file without a conflict.

Prompts also go stale in smaller ways — run 35's named
`c1_reporting_complementation` as the next C1 pick when it had been live for
nine runs, and cited a file path that is not on `build`. **Check a prompt's
factual claims against the repo before acting on them.**

---

## 8 · Where everything is

| | |
|---|---|
| **Contract** | `AGENTS.md` — read in full before any work |
| **Per-run history** | `codex/BUILD-DIGEST.md` — newest at top, one entry per run |
| **James's channel in** | `codex/REPAIR-QUEUE.md` — one-time items all closed; 3 standing rules remain open by design |
| **Czech second opinion** | `codex/CZECH-REVIEW.md` — **belongs to the review routine, never edit** |
| **How this ended** | `codex/WIND-DOWN.md` — retired |
| **Gates** | `codex/verify_pack.py`, `codex/check_playable.py`, `codex/audit.py --check`, `codex/check_codex.py` |
| **Pool generator** | `codex/make_pool.py POOL.md --before <node_id>` |
| **Legality oracle** | `codex/_oracle.py` (`--selftest`) — not a gate |
| **Audit output** | `audit/SEQUENCING-REPORT.md`, `audit/sequencing-report.json`, `audit/sequencing-baseline.json` |
| **Smoke** | `python3 -X utf8 scripts/smoke.py`, then `python3 -m http.server 8097` |

Final commit of unattended work: cloud run 36, branch `build`, 2026-08-09.
All four gates green. `main` untouched, as it always was.
