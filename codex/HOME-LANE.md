# The home-machine drafting lane

Set up 2026-09-05. The always-on home computer runs the B2 drafting lane in
VS Code, continuously, via `/loop`. The cloud routine that did this job
(`RUE B2/C1 loop`) is **disabled** — there is one writer on `b2/auto` and it is
this machine. Do not re-enable the routine without turning this off first.

---

## Setup, once

Open VS Code on the home machine at `…\Documents\projects\rue-exp`, then in a
terminal there:

```powershell
git fetch origin
git checkout b2/auto
git pull --ff-only origin b2/auto
```

If `git pull` refuses because the working tree is dirty, **look at what is
dirty before discarding it** — this repo has form: uncommitted-but-correct
registry files caused the `path_order_b1` trap twice. `git status` first,
`git stash` only if it is genuinely scratch.

### Verify the machine can run the gates

```powershell
py -X utf8 codex/verify_pack.py          # expect: 4 errors, ~56 warnings
py -X utf8 codex/audit.py                # expect: total_unknown_types ~774
py -X utf8 codex/check_rewrite.py        # expect: 9 packs, 12 findings (A1/A2 only, all [PROTECTED])
node --check js/practice-vocab.js        # expect: silent
```

Those numbers are the 2026-09-05 baseline: **4 errors / 56 warnings**, audit
**774**, check_rewrite **9 packs / 12 findings** (all protected A1/A2), and **45
B2 units still undrafted** of the 60. If they are wildly different, the
checkout is wrong or the machine is missing Python 3 — stop and fix that first,
because every gate in the loop is a comparison against these.

### Sanity-check the registry

```powershell
py -X utf8 -c "import json; t=json.load(open('data/tree.json',encoding='utf-8')); g=json.load(open('data/nodes-grammar.json',encoding='utf-8')); print('b1', len(t['path_order_b1']), len(g['path_order_b1']), '| b2', len(t['path_order_b2']), len(g['path_order_b2']))"
```

Expect `b1 59 59 | b2 60 60`. Anything else means the registries have drifted
and the lane must not start.

---

## Start the loop

```
/loop Read codex/AGENT-LOOP.md, codex/DRAFTING.md and codex/B2-PLAN.md, then
draft the next undrafted B2 unit in B2-PLAN path order on branch b2/auto.
One unit per iteration. Sweep the position pool before writing any bank.
Run the full gate order from DRAFTING.md and only keep work that passes.
Commit that one unit with a message saying what moved, push, and stop.
```

One unit per iteration is deliberate: it keeps each commit reviewable and means
an interrupted iteration loses one unit, not six.

## What this lane may not do

Everything in `AGENT-LOOP.md`'s hard-nevers, plus:

- **No registry edits.** The 37 B2 nodes are already stamped. If a unit needs a
  new node id, stop and put it in `codex/DECISIONS.md` — `tree.json` and
  `nodes-*.json` are coordination-tab files and two writers have corrupted
  them before.
- **No B1.** James is smoke-testing B1 on his laptop and pushing fixes to
  `b1/auto`. Touching B1 content from here collides with a human.
- **No `main`.** Work lands on `b2/auto`; James merges.
- **No ticking `INSPECTED.md`.** Only James ticks, from Telegram, after playing.

## Checking on it

From anywhere, including the phone:

```powershell
git fetch origin && git log --oneline origin/b2/auto | head -20
py -X utf8 codex/check_rewrite.py --brief
```

Questions the lane could not answer are appended to `codex/DECISIONS.md` under
**Open**, each with the default it applied. Nothing waits on you.

## If it stops

A `/loop` dies with the VS Code window, a reboot, or a crash. There is no
watchdog. Symptom: `git log origin/b2/auto` stops advancing. Fix: reopen VS
Code and paste the loop prompt again — it picks up from whatever is undrafted,
because the queue is derived from the repo, not held in the session.
