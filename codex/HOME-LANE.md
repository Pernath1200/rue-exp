# The home-machine drafting lane

**To start this lane, type one line into Claude Code on the home machine:**

```
/loop Read codex/HOME-LANE.md and follow it.
```

Nothing else. Everything below is the instruction — it travels with the repo, so
it never has to be pasted from anywhere.

Set up 2026-09-05. The always-on home computer runs the B2 drafting lane
continuously. The cloud routine that used to do this (`RUE B2/C1 loop`) is
**disabled**: there is one writer on `b2/auto` and it is this machine. Do not
re-enable that routine while this is running.

---

## Iteration 0 — prove the machine before writing anything

Do this once, on the first iteration only. If any check fails, **stop and say
so** — do not draft. Every gate in this loop is a *comparison* against these
numbers, so a bad checkout or a missing Python means the lane approves broken
work instead of catching it.

```
git fetch origin && git checkout b2/auto && git pull --ff-only origin b2/auto
py -X utf8 codex/verify_pack.py       # 4 errors, 56 warnings
py -X utf8 codex/audit.py             # total_unknown_types 774
py -X utf8 codex/check_rewrite.py     # 9 packs, 12 findings, all [PROTECTED]
```

Registry must read `b1 59/59 · b2 60/60`:

```
py -X utf8 -c "import json; t=json.load(open('data/tree.json',encoding='utf-8')); g=json.load(open('data/nodes-grammar.json',encoding='utf-8')); print('b1', len(t['path_order_b1']), len(g['path_order_b1']), '| b2', len(t['path_order_b2']), len(g['path_order_b2']))"
```

If `git pull` refuses because the tree is dirty, **look at what is dirty before
discarding it**. This repo has form: uncommitted-but-correct registry files
caused the `path_order_b1` trap twice.

---

## Every iteration — one unit

Read `codex/AGENT-LOOP.md` (the contract), `codex/DRAFTING.md` (the method) and
`codex/B2-PLAN.md` (the syllabus). Then:

1. Take the **next undrafted B2 unit in `B2-PLAN.md` path order**.
2. **Sweep the position pool before writing any bank** —
   `py -X utf8 codex/make_pool.py POOL.md --before <unit_id>`. Expect to sweep
   twice: the obvious vocabulary for a theme is usually already taught by an
   earlier level, and a unit that quietly re-teaches its predecessor is the one
   failure no gate catches.
3. Draft to the shapes in `DRAFTING.md` (leaf: recap card → three boards of 12 →
   Build-the-family → frames; word-formation: 7 tiles / 12 choose / 12 type /
   6 fix).
4. Run the **full gate order** from `DRAFTING.md`. Keep only work that passes:
   unit's `unknown` **CLEAN**, `check_rewrite` **clean**, `verify_pack` errors
   and `audit total_unknown_types` not risen.
5. Commit that one unit with a message saying what actually moved. Push. Stop.

One unit per iteration is deliberate: each commit stays reviewable, and an
interrupted iteration costs one unit rather than six.

## FCE exercise shapes — `codex/FCE-EXERCISES.md`

Read that spec once. In short:

- **Open Cloze** — no engine work; grammar Type already renders a bare input
  with no clue (the letter-clue mechanic is vocab-side only). This is tagging
  discipline: tag grammar-word gaps with `gap_class` (`preposition` ·
  `conjunction` · `article` · `pronoun` · `auxiliary` · `quantifier` ·
  `relative` · `other`), keep Quiz multiple-choice, keep distractors on the
  gap's own axis (B6). **Retrofit into grammar units you are drafting anyway —
  never as a dedicated unit.**
- **Word-formation variety** — content only, existing mechanic. When
  `b2_word_formation` or `c1_word_formation` next comes up for thickening, add
  prefix-only, suffix-only and spelling-shift items rather than only
  derivation-class swaps, tagged `formation_type` (`prefix` · `suffix` · `both`
  · `spelling_shift`). **No new word-formation units for this.**
- **Key Word Transformation — DO NOT BUILD.** It needs a new
  `use_mode: "transformation"` branch in `js/practice-grammar.js`, and `js/` is
  interactive/James-only under `POLICY-LOCKS.md`'s **P-engine** row. Author no
  KWT items until that branch exists — they would not render. If a unit from
  the spec's KWT-native table comes up, draft its ordinary Use stage and note in
  `DECISIONS.md` that KWT is pending engine work.
- **B1 is deferred.** Retrofit nothing at B1 on the strength of this spec.

## What this lane may not do

Everything in `AGENT-LOOP.md`'s hard-nevers, plus:

- **No registry edits.** The 37 B2 nodes are already stamped. A unit needing a
  new node id goes to `codex/DECISIONS.md` instead — `tree.json` and
  `nodes-*.json` are coordination-tab files and two writers have corrupted them
  before.
- **No B1 content.** James is smoke-testing B1 live and pushing to `b1/auto`.
- **No `main`.** Work lands on `b2/auto`; James merges.
- **No ticking `INSPECTED.md`.** Only James ticks, from Telegram, after playing.
  Per the amended **P-b2c1-stub** lock, this lane may draft B2/C1 — but nothing
  reaches a student without that tick.
- **No `js/`, `css/`, `index.html`.**

## Questions

Append to `codex/DECISIONS.md` under **Open**, each with a proposed default and
what you will do unattended — then do that and carry on. Never wait. Do not try
to notify James.

## Checking on it (James, from anywhere)

```
git fetch origin && git log --oneline origin/b2/auto | head -20
```

## If it stops

A `/loop` dies with the window, a reboot or a crash, and nothing announces it.
Symptom: `origin/b2/auto` stops advancing. Fix: type the one-line prompt again.
The queue comes from the repo, not from session state, so nothing is lost.
