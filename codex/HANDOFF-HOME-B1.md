# Handoff — home machine, B1 debt clearance

Give this file to the home computer. Written 2026-09-05 by the laptop session, after
James asked why smoke testing was not getting faster.

**The job in one line:** clear every fault a script can already see from the B1 units
James has not played yet, so his next sitting is spent on teaching judgement instead
of on faults the project learned weeks ago.

**B2 is paused.** Do not work it. B1 only, until James says otherwise.

---

## Why this exists

150 authoring rules, 39 with a check. James was acting as the linter for 111 rules
already written down. The clearest case: C6 was written 2026-08-29 with its own state
cell reading *"lintable against `codex/vocab/oxford-5k-cefr.csv`"* and sat unbuilt for
a week — when the check was finally written on 2026-09-05 it found 45 instances across
21 B1 packs in under a minute. Every one of those was a flag waiting to reach him one
unit at a time.

That backlog is now measured (`codex/RULE-ENFORCEMENT.md`) and partly mechanised. Your
job is to work the findings, not to rediscover them.

---

## You are the only automated lane

As of 2026-09-05 17:00, everything else that was writing to this repo has been stopped:

| What | State |
|---|---|
| Three Claude sessions working `b1/auto` on the laptop | **stopped** (PIDs 18712, 32936, 30048) |
| `AgentRueExp` scheduled task (Grok, `run-rue.ps1`) | disabled since 2026-08-09 — leave it disabled |
| `AgentRuplExp`, `AgentNightlyLabs`, `AgentMultiLangA1` | disabled since August, different projects |
| `rue-sweep/lanes/lane-0` worktree | removed (idle since 2026-09-04) |
| `b2/auto` worktree on the laptop | still checked out, but **B2 is paused** — nothing runs it |
| `TelegramSweepBot` | running, and stays — it is James's Telegram interface |

James plays on the laptop. You are the only thing that writes unattended. If you ever
find another lane's commits appearing on your branch, stop and say so in the report
rather than working around it.

## Set-up

Use the home machine's own clone. **Do not work on `b1/auto` directly** — that is the
branch James plays from, and he will have uncommitted edits in his tree.

```
cd <your rue-exp clone>
git fetch origin
git checkout -b b1/home origin/b1/auto     # first time only
git merge origin/b1/auto                   # every run after that
```

Commit to `b1/home` and push it. James merges when he chooses.

**Why the separate branch matters.** On 2026-09-05 two agent sessions ran in the same
working directory on the laptop, both on `b1/auto`. One did `git reset` and then
committed with everything staged; the other session's uncommitted edits went into its
commit — a commit titled *"b1_past_modals: the Czech was carrying the tense on its own"*
also contains a different session's rewrite of the same pack. Nothing was lost, by luck.
Separating by branch protects nothing when two agents share one working tree; separating
by machine and branch, as you now are, does.

## Read first

| File | Why |
|---|---|
| `codex/AUTHORING-RULES.md` | the 153 rules. This is the substance |
| `codex/AGENT-LOOP.md` | the contract — nevers, standing decisions, gates |
| `codex/RULE-ENFORCEMENT.md` | which rules have a check, which never will |
| `codex/DECISIONS.md` | James's settled answers. Do not re-ask them |

---

## The loop, per unit

```
py -X utf8 codex/preflight.py <unit_id>        # every scoped check, one card
   ... fix ...
py -X utf8 codex/preflight.py <unit_id>        # clean, or every remaining line explained
py -X utf8 codex/verify_pack.py                # errors must not rise
py -X utf8 codex/audit.py --check              # --check, or the ratchet cannot fail
py -X utf8 codex/check_gloss.py                # ratcheted
py -X utf8 codex/check_rules.py                # ratcheted
py -X utf8 codex/test_checks.py                # every check must still complain
git commit
```

**Two gates are red before you start, and neither is yours.** `audit.py --check` fails
at 790 against a baseline of 246 written on 2026-08-25 — legitimate coverage growth, not
rot, and re-baselining is waiting on James's word (see DECISIONS, "The gates · three of
the four are red on main"). `check_pretaught` fails at 104 vs 92, all A1 features. For
both, the test is not "is it green" but **"did my change make it worse"**: record the
number before you touch anything and compare after. Do not re-baseline either one
without James saying so.

`test_checks.py` is not optional. On 2026-09-05 a new check reported clean across the
whole corpus because a mangled `\b` made it match nothing — it looked exactly like
success. The same suite then caught a second broken check the same afternoon. **A check
that has never been seen to fire proves nothing.** If you write a check, add its fixture
to `codex/regressions/` and its line to the manifest, or the suite will tell on you.

---

## What you may change

**Fix everything you can, wording included** (James, 2026-09-05 dropdown). That means
you may rewrite a bracket cue, rename a card, simplify a gloss, restructure an intro
card, cut a repetitive item. Cite the rule id in the pack `note` and say what moved,
because he has a feel for these units and will notice.

The bar is the rules file, not your taste. Before rewriting anything, find the rule that
says so. If no rule says so, leave it and write the observation into `DECISIONS.md`.

### Never

| Never | Why |
|---|---|
| **Touch A1 or A2** | finished, hand-checked. Checks mark them `[PROTECTED — do not touch]` — that marking is the whole point of the ratchet, not an invitation |
| **Tick `codex/INSPECTED.md`** | only James ticks, from Telegram, after playing. An agent's report is not a tick |
| **Work in the laptop's directory** | see Set-up |
| **Touch B2 or `b2/auto`** | paused |
| **Edit `data/tree.json`, `data/nodes-*.json`, `js/`, `css/`, `index.html`** | shared by every level. A registry change goes to `DECISIONS.md` as a request |
| **Loosen `accepts` to move a number** | `accepts` is what grades the student. Never write an ungrammatical string into it |
| **Push to `main`** | `b1/home`. James merges |

---

## The queue — corrected 2026-09-05 18:00

**Read this section before you believe a finding count.** The first version of this
handoff quoted 110 findings. James pushed back — *"the things I've seen on b1 are not
that bad, I don't want any big rewrites, but I don't want it to just do pointless
busywork"* — and he was right. Four of the checks written that afternoon were audited
against real items and **pulled or narrowed**:

| Check | Why it went |
|---|---|
| **B2** borrowed distractor | 496 findings on B1, nearly all false. In a paradigm pack every chip *is* another item's answer — that is the axis, not borrowing |
| **B25** cue is the answer | 28 of 29 false. `(get)` against chips *get / be / being / getting* is the A11 stem cue and is **required**; `(every)` against *every / on every / in every* tests the preposition. Only a cue whose chips are distortions of itself is the fault |
| **C14** card 0 nickname | 15 of 17 false. *"What is the passive?"*, *"Two kinds of relative clause"* are good descriptive openers — C1 asks for exactly that. The rule was written against a slogan (*"2 systems"*) and nothing can tell a slogan from a good title |
| **C19** Czech in a table | 4 of 4 false. `b1_modals_speculation` card 7 is titled *"Czech trap · možná"* — a CZ→EN pair table, where Czech belongs. Narrowed to skip those |
| **F7** word taught twice | 41 findings, but James's standing decision is *per-unit as touched, no one-commit sweep*. Now behind `--rule F7`; do not sweep it |

**The lesson, and it applies to you too:** the checks that were precise came from a fault
James had actually pointed at (F9, C6, C58 — all clean hits). The ones written
speculatively from rule text alone were mostly noise. If a check you write fires on more
than a handful of units, read ten of its findings against the real items before you act
on any of them.

### What is actually left on B1 grammar — 13 findings

```
b1_phrasal_verbs    B3   23 of 36 gap items have no authored quiz_options
b1_prefixes         B3   24 of 36 gap items have no authored quiz_options
b1_suffixes         B3   12 of 24 gap items have no authored quiz_options
b1_relative_clauses      C32  'Wrong' column has no ~~strike~~
b1_relative_clauses_2    C32  'Not this' column has no ~~strike~~
b1_reported_speech_2     C32  'Not this' column has no ~~strike~~
b1_second_conditional    C32  'Not this' column has no ~~strike~~
b1_phrasal_verbs    C46  has a sequel, so it should be 'Phrasal verbs 1'
b1_abstract         C49  7 of 36 words never shown in the intro
b1_core_frames      C56  vocab intro opens on a diagram with no picture board
b1_future           C13  an intro example with nothing bolded
b1_be_used_to       E3   continuous twin accepted for a simple-form answer
b1_modals_speculation    C19  one Czech cell in an English column
```

The four **C32** ones are certain and mechanical: an error in a *Not this* column is
`~~struck~~`, not *italic*. Do those without asking.

The three **B3** ones are not mechanical — authoring 59 sets of chips is a real job and
the engine fallback may already be serving those word-formation packs adequately. Put it
to James in DECISIONS with a sample of what the fallback currently produces, and do not
start it unattended.

### The work that is actually worth your time — three leaves with no sentence bank

```
b1_collocations    36 words · 0 sentences · 12 use items
b1_word_families   36 words · 0 sentences · 12 use items
b1_core_frames     24 words · 0 sentences ·  0 use items
```

Quiz and Type are built from `sentences[]`. With none, **96 words across three leaves
have no Quiz item and no Type item at all**, and every gate is green because nothing
checks for it. This is not cosmetic and it is not a rewrite of anything James likes —
it is a hole. One sentence per lemma, under the rules that already govern them: B24 the
lemma must appear contiguously or the frame gaps nothing; `quiz_mode: sentence_gap`;
10–14 words with one clause move and two recycled content words; ceiling is what the
path teaches before that leaf (`make_pool.py --before <unit_id>`).

Do this before the 13 above. It is the only item here that changes what James meets when
he plays.

## Reporting

**`codex/PREFLIGHT-REPORT.md`, rewritten each run.** Overwrite it; it is a status board,
not a log. Keep it to what he would want at a glance:

```markdown
# Preflight — <date>, home lane

**Swept** 44 unplayed B1 units · **fixed** 61 findings in 14 units · **left** 9

## Fixed
| Unit | Rule | What changed |
|---|---|---|
| b1_be_used_to | B25 ×6 | cues now name the verb converted from, not the answer |

## Left, and why
| Unit | Rule | Why |
|---|---|---|
| b1_finale | C14 | card 0 is "Use it all" — renaming it needs James's word on what the review is called |

## Gates
verify_pack 4 errors / 57 warnings · audit 790 · gloss 99 · rules 116 · test_checks 11 proved
```

**Judgement calls go to `codex/DECISIONS.md`**, in that file's format: the question,
the options, a default, and what you will do if he never answers — then do that and
carry on. Never stop the loop for an answer.

**One ping when the run finishes**, and only then:

```python
import sys; sys.path.insert(0, r"C:\Users\ADMIN\reminders")
import telegram_sweep_bot as bot
bot.send("home lane: 14 units, 61 fixed, 9 left. codex/PREFLIGHT-REPORT.md")
```

One line, one message, at the end. Not a chore list, not a per-unit ping — a scheduled
task-list push is the kind of thing he ignores, which then buries the lines that
mattered. `nightly_ping.py` was rewritten on 2026-09-04 for exactly that reason.

---

## If you learn something new

**I11: a rule lands with its check, or it lands marked `manual` and says why.** If you
find a fault class the rules file does not name, write the rule in James's words if you
have them, build the check, add its fixture, and say so in the report. A rule with no
check is how this backlog happened.

If the check would redden protected A1/A2 packs, that is **not** a reason to skip it.
Land it, mark those findings `[PROTECTED — do not touch]`, and seed a ratchet — the way
`check_gloss.py` and `check_rules.py` do. A 2026-09-04 run measured two ready checks,
found they would light up A2, and defaulted to not landing them; both then sat unbuilt
behind a question nobody had answered.

---

## The bar

A green gate says a unit will not crash. It says nothing about whether it is any good —
that is what James's playing is for, and the whole point of this handoff is to stop
spending his play on things a script could have caught. If you finish the queue and the
checks are clean, the next useful work is `RULE-ENFORCEMENT.md`'s **buildable** column:
twelve rules with no check and a note on what each one needs.
