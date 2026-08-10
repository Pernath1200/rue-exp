# LESSON-READY PLAN — from here to a lesson-reliable RUE

Written 2026-08-10 (James + Claude local session, post-audit). This is the
scope document for the next automation push. **Any routine or agent working
this plan reads it in full first**, plus `AGENTS.md` (binding contract) and
`codex/POLICY-LOCKS.md` (James's standing rulings — all still in force).

**Goal, in one line:** the app usable reliably in James's lessons — every
surface a student meets at A1–B1 finished, B2–C1 grammar smoke-verified,
per-student progress, no "coming soon" inside the taught path.

**What this plan is NOT:** no deployment/hosting (separate roadmap owned by
James), no B1 vocabulary extension (~304 words — parked per P-b1-vocab, do
not start), no B2/C1 vocab decision, no tokenizer edit (P-tokenizer:
James-only, and he has deliberately NOT scheduled it in this push — the 9
phantom violations stay and are known), no engine work by automation
(P-engine).

Decisions behind this plan (James, 2026-08-10 dropdown session): finish the
B1 vocab leaves rather than hide the tier · Grok auto + a bounded Claude
restart · profile switcher built locally, never by automation · scope =
trunk intros + B1/B2 sequencing repair + Q1 re-measure with Oxford-aware
re-lexify.

---

## Phase 0 — interactive setup (James + local Claude, before any automation)

Nothing in Phase 1 starts until every box here is ticked. Order matters.

- [ ] **0.1 Review + merge the outstanding Grok auto branches** into `main`
      (`auto/2026-08-09-1706`, `auto/2026-08-09-2007`, and any newer).
      Gates green on the merge result. Automation must start from one
      baseline, not three.
- [ ] **0.2 Fast-forward `build` to `main`** (build is currently 1+ commits
      behind). Claude's lane writes `build`; it must start current.
- [ ] **0.3 Build the profile switcher** (local Claude session, engine lane).
      Spec: `js/progress.js` keys become per-student
      (`rue-exp-progress:<student>`), a small picker UI on the home screen
      (default profile = `me` for James's own use; students: martin, ondrej,
      martina, jan, vaclav, tomas, homare + add-new), active profile shown
      in the header, `rue-exp-progress` (bare) migrates to `me` on first
      run. **The bare key name itself stays sacred as the prefix — never
      rename.** Update AGENTS.md's progress-key rule to describe the
      per-student scheme in the same commit.
- [ ] **0.4 Cherry-pick the measurement tooling from `origin/vocab/b1-build`
      onto `build`**: `codex/scripts/rue_oxford.py`, `lex_coverage.py`,
      `gloss_check.py`, `codex/vocab/oxford-5k-cefr.csv`,
      `oxford-b1-gap.tsv`. Scripts + data only — no authored content from
      that branch. (Q1 work is impossible while the tools live on an
      unmerged branch; HANDOFF §4 Q1 documents this trap.)
- [ ] **0.5 Add the Oxford-preference rule to both lanes' repair procedure**
      (AGENTS.md, "sequencing repair" section): *when re-lexifying a
      sentence onto taught vocabulary, if several taught replacements fit,
      prefer a word on `codex/vocab/oxford-5k-cefr.csv` at or below the
      pack's level; never swap an Oxford-listed word for an off-list one
      when an Oxford-listed alternative exists.* This is the Q1 mitigation —
      it stops the ratchet quietly buying audit compliance with curriculum
      coverage.
- [ ] **0.6 Re-arm the lanes:**
      - Write the two Claude routine prompts (templates in §Lane C below),
        pointing at THIS file by path. Verify each prompt's factual claims
        against the repo before saving (HANDOFF §7 warning — stale prompts
        cost runs).
      - **Delete `codex/HANDOFF.md` last**, after both prompts exist. Its
        deletion is the Claude kill-switch release; the routines' step 0
        checks for it. (It remains in git history; nothing else references
        it live.)
      - Update the Grok auto lane's standing instructions to §Lane G scope.

---

## Phase 1 — automation (two lanes, disjoint files, hard caps)

### Writer partition — read this before touching anything

One writer per file set. The lanes are partitioned so they can run
concurrently:

| lane | writes | files it may touch |
|---|---|---|
| **G (Grok auto)** | local `auto/*` branches, no push, James merges | A1/A2 **trunk** vocab packs (intros) · **grammar** packs at B1/B2 (sequencing re-lexify only) |
| **C (Claude cloud)** | `build` on GitHub | the 6 **B1 leaf** vocab packs + 3 **B1 trunk** packs · `codex/OXFORD-REMEASURE.md` (its report) |

Neither lane touches: `js/`, `css/`, `index.html`, gate scripts, `main`,
`vocab/b1-build`, the other lane's files, `codex/CZECH-REVIEW.md` (review
routine's property). All four gates green before every commit; audit is a
ratchet (violations never rise; baseline currently 120).

### Lane G — Grok auto (content polish, its current shape)

Ordered scope; stop-by date **2026-08-24** (date-gated step 0: on or after
that date, write a final digest commit and set own Status OFF).

1. **13 trunk intros** (10 A1 + 3 A2). James's standing rule (AGENTS.md,
   2026-08-08): concrete trunks (e.g. verbs_more/say/action) → normal emoji
   tiles; glue trunks (pronouns, modals, question words, quantity, linkers)
   → **text-only page 1** — never force an emoji onto a function word.
   Decide per pack by reading its items. Picture-led two-page shape as per
   the 38 shipped leaf intros.
2. **B1/B2 sequencing repair** (~117 genuine leads across 18 units; the 9
   tokenizer phantoms — Wi-Fi splits, Ondřej, bare `b` — are NOT clearable,
   skip them on sight). Use `codex/make_pool.py POOL.md --before <node>` per
   pack; re-lexify under the **Oxford-preference rule** (Phase 0.5). Respect
   P-hour: `a1_articles`/`hour` is permanently accepted, skip. Tighten the
   baseline as violations fall — never loosen.

### Lane C — Claude cloud routine (bounded restart)

**Build routine: cap 10 runs. Czech-review routine: cap 10 runs.** Both
self-terminate by the proven mechanism: a run counter in this file's
appendix (each run increments its own line below) and a terminal write of
`codex/HANDOFF.md` (fresh content, same filename = same kill switch) when
the counter hits cap OR the scope below is complete, whichever first. Both
routines exit at step 0 if `codex/HANDOFF.md` exists.

Ordered scope:

1. ~~Run 1 — Q1 verdict~~ **DONE 2026-08-10 in Phase 0** (came free with
   the 0.4 cherry-pick): verdict in `codex/OXFORD-REMEASURE.md` —
   measurement artifact (tier C vs tier A of the same report compared
   across days), coverage never fell, re-lexify hypothesis dead. All
   coverage claims must name their tier from now on. Lane C starts
   directly at content work.
2. **Runs 1+ — dress B1 vocab fully.** For each of the 6 B1 leaves: a
   picture-led 2-page intro (emoji tiles / swatches / parameterised
   schematic via `js/intro-visuals.js` — NEVER stretched emoji, NEVER image
   files; Czech ladder at B1 = light) and a `sentences[]` Use bank (~12
   sentences; more only if the pack is large — `DEFAULT_PASS` is 12, a
   12-bank has no rotation). For each of the 3 B1 trunks: intro only
   (concrete-vs-glue rule), no bank. **Czech authoring: follow HANDOFF §5's
   trap list in full** (dropped subject, mít rád, past-tense gender,
   predicate adjectives, myself/ourselves ban, gloss collision →
   `accepts[]` where the two readings are the same sentence). The full
   trap list lives in `codex/CZECH-TRAPS.md` (extracted from the old
   HANDOFF §5 before its deletion). Use the route-around method (explicit
   noun subjects, 1sg/1pl present, impersonal frames) — it hit 0 defects
   in 946 sentences.
3. **Czech-review routine**: reviews `cz` in packs the build routine
   changed since its last pass. Fix only unambiguous errors; flag anything
   uncertain to `codex/CZECH-REVIEW.md` "For James"; never touch English;
   never edit files outside its flag file + the reviewed packs.

### Standing rules that bind both lanes (the expensive ones)

- Verify mechanically, never by eye; never trust a digest — including your
  own from earlier in the run. `codex/_oracle.py --selftest` replays the
  audit's own legality set.
- Every genuine design fork: conservative default + a logged digest note.
- Pack shape is fixed (`blocks[].items[]`, `intro.cards` grammar /
  `intro:[p1,p2]` vocab array). If a task seems to need a shape change,
  STOP and queue it for James — that class of change once shipped 52 units
  that graded 100% on zero questions.
- Never invent node ids or `codex_unit` ids.
- On contradictory authority (this file vs a prompt vs AGENTS.md): between
  an irreversible stop and a reversible pause, pause and ask James.

---

## Phase 2 — James verification (interactive, after both lanes stop)

- [ ] **2.1 Merge**: review Lane G's final auto branch(es) → `main`;
      promote `build` → `main`. Gates green on the result.
- [ ] **2.2 Czech flags**: rule on anything in `codex/CZECH-REVIEW.md`'s
      new "For James" entries (last cycle: accept the routine's suggested
      fix wholesale worked fine).
- [ ] **2.3 Smoke B1 → C1 grammar** — James only, flag button
      (`js/smoke-flags.js`) required, bounded ~45-min speedrun passes per
      protocol. B2's 21 and C1's 17 live units have never been smoked by a
      human; the gates cannot see what a student sees (this project's most
      expensive lesson). Flags come back to a local Claude session as the
      fix queue.
- [ ] **2.4 Profile switcher in a real lesson** — one pilot lesson (Martin
      or Ondřej), confirm two students on one machine keep separate
      progress.
- [ ] **2.5 Close-out**: audit baseline re-checked, this file's boxes all
      ticked → RUE is lesson-ready. The deploy conversation (hosting,
      progress chart, error-report pipeline) continues in the separate
      website roadmap — it starts from this state but is not this plan.

## Completion criteria — measurable, no judgment calls

| # | criterion | how verified |
|---|---|---|
| 1 | All four gates + smoke green | run them |
| 2 | Trunk intros 23/23 (A1 17, A2 3, B1 3) | count packs with intro pages |
| 3 | B1 leaves 6/6 intros + 6/6 Use banks | count |
| 4 | Sequencing: B1+B2 genuine violations substantially down from 117; ratchet never loosened; floor = 9 phantoms + P-hour + any James-accepted forks | `audit/sequencing-report.json` |
| 5 | `codex/OXFORD-REMEASURE.md` exists with a verdict on Q1 | read it |
| 6 | Per-student progress live (switcher shipped, bare-key migration works) | pilot lesson 2.4 |
| 7 | B1–C1 grammar smoked by James, flag queue emptied | 2.3 done |

## Appendix — run counters (routines: increment your own line, one per run)

- Claude build runs used: 0 / 10
- Claude Czech-review runs used: 0 / 10
