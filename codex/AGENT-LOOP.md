# B1 agent loop — the contract

One unit at a time, in path order, until B1 is worth playing. Written 2026-09-04
for cloud agents that run while James is travelling and cannot ask him anything
mid-run.

**Read `codex/AUTHORING-RULES.md` first, every run.** It is the whole point. The
one line under all of it: *the gates check STRUCTURE — a green gate means a unit
will not crash, it says nothing about whether it is any good.*

---

## Never

| Never | Why |
|---|---|
| **Tick `codex/INSPECTED.md`** | Only James ticks, from Telegram, after playing. "An agent's report is not a tick." Not the first box, not the second, not ever. |
| **Touch A1 or A2** | Finished, hand-checked work. James 2026-09-04: "they are fine, I don't want you fiddling with those." |
| **Edit `data/tree.json`, `data/nodes-*.json`, `js/`, `css/`, `index.html`** | Shared by every level; another agent may be in them. Registry changes go to `DECISIONS.md` as a request. |
| **Push to `main`** | Work goes to branch `b1/auto`. James merges. |
| **Block waiting for an answer** | He may be on a plane. Queue the question and carry on with the next unit. |
| **Invent node ids** | `codex/B1-PLAN.md` owns the roster. |

## Pick the next unit

1. Read `codex/INSPECTED.md`. Take B1 rows only.
2. `- [ ][ ]` = never looked at. `- [x][ ]` = James has played it. Work the
   `[ ][ ]` ones first.
3. Order them by position in `path_order_b1` in `data/tree.json`, lowest first.
   Path order, not alphabetical — he plays in path order.
4. Skip any unit already carrying an unanswered entry in `codex/DECISIONS.md`.
5. Skip the five level-check shells (`b1_vocab_match`, `b1_vocab_type`,
   `b1_grammar_match`, `b1_grammar_type`, `b1_finale`) — they pool at runtime and
   have no pack to author. Spec is `codex/LEVEL-CHECKS.md`.

## Work the unit

**Grammar.** `py -X utf8 codex/lint.py <unit_id>` is the prep card. Findings are
labelled:

- **EXACT** — a fact about the data (contraction twin missing, `it` not accepted,
  synonym absent from the map). **Fix it. Do not ask.**
- **CANDIDATE** — needs James (does English force `the` here; is this Czech really
  unambiguous; is this vocabulary too low for B1). **Queue it.**

Then walk the stage table in `AUTHORING-RULES.md` — Intro, Match, Quiz, Type, Use
— and apply every rule that bites. Cite rule IDs in the pack `note`.

**Vocab.** No lint. Work `AUTHORING-RULES.md` directly, plus:
`quiz_mode: sentence_gap` (B22) · C49 the intro shows **every** new word in boards
of 8–12, not a sample · E10 Use is full-sentence production of the new word, never
CZ→EN of the bank · A12 sense-mark homonyms.

**Sentence quality**, everywhere: no frame twice in a pack · 7–9 words · recycle
vocabulary from earlier units · vary person and mood · kill "X is very important".
Ceiling: only what the path teaches **before** this unit's own slot. Regenerate it
per unit with `py -X utf8 codex/make_pool.py codex/POOL.md --before <unit_id>` —
a stale pool has caused real sequencing bugs both ways.

## Content targets

| Kind | Target | Note |
|---|---|---|
| Grammar unit | **24–40 items** | 20 of 34 B1 grammar packs are 10–16 item stubs. Thickening them is the job, not an extra. |
| Vocab leaf | **36 words max** | 36 is a ceiling, not a target (`B1-PLAN.md`). Cut dumps. |
| Vocab leaf sentences | **one per lemma** | 17 of 28 leaves have 36 words and 8 sentences. |
| Intro | 4–6 cards, one job per card | C9 no walltext · C10 a table or diagram on every card · C14 card 0 is the unit name + Czech |

## Gate — before you finish the unit

```
py -X utf8 codex/lint.py <unit_id>      # grammar
py -X utf8 codex/verify_pack.py
py -X utf8 codex/audit.py
```

Keep the work only if **all** of these hold:

1. The unit's own lint flag count is **lower** than when you started.
2. **No new rule ID** appears that was not there before.
3. Item count is inside the target band above.
4. `verify_pack` errors and `audit total_unknown_types` have not risen.

A stub that is still a stub **fails** — "no number got worse" is not a pass. If
you cannot meet the bar, revert the unit, write what blocked you into
`DECISIONS.md`, and move on. A half-done unit is worse than an untouched one.

## Commit

One commit per unit on `b1/auto`:

```
b1_past_perfect: 16 -> 30 items, lint 20 -> 4

Thickened per B1-PLAN. Fixed A8 contractions (8 items), A7 synonym map
(2), A2 subject not specified (3). Two CANDIDATE findings queued in
DECISIONS.md: A4 `the` demands, vocablevel.
```

Then push `b1/auto` and take the next unit.

## Questions

Append to `codex/DECISIONS.md` under **Open**, in the format that file specifies.
Always propose a default and say what you will do if he never answers — then do
that and carry on. Never stop the loop for an answer.

**Do not try to notify James.** A cloud run has no channel to him and no
notification tool, and he does not want one — a scheduled ping about authoring
questions is the kind of thing he ignores, which then buries the lines that
mattered. The queue is a pull, not a push: he reads `DECISIONS.md` when he
chooses. Your end-of-run summary is the whole report.
