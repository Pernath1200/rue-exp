# Supplementary tier + starred word bank — speculative

**Status: SPECULATIVE. Do not build. Do not action from this file.**
Recorded 2026-09-05 from a design conversation with James. Nothing here is a
decision; the open forks are listed at the end. An agent that reads this file
should carry on with its own work and change nothing on the strength of it.

## The idea

The core 60 per level stay the essential path. Alongside them sit **supplementary
units** — real word knowledge, but not what everyone needs at B2. Examples raised:
cars and driving (Martin), investing and start-ups (Patrik), possibly tech.

## Settled in conversation

- **They attach to the existing twelve canopy branches**, not to a new shelf.
  The twelve are already defined in `js/tree-portrait.js` (SEL MON COM HOM CRE
  WRK PAR CHA KNO PUB CMT INN). Cars → knowledge_travel, investing →
  money_possessions, medicine → self_body, tech → communication as currently
  seated. There has to be a place in the tree for all knowledge.
- **They show tree growth but are not required.** Someone with deep knowledge in
  one area should see extra growth on that branch. Completion is computed over
  the core 60 only; supplementary fruit adds and never subtracts.
- **Sinks, not sources.** A supplementary unit may consume core vocabulary as
  carriers. Nothing may consume its words. `audit.py` must not credit them as
  taught, or a downstream core unit would be allowed to lean on vocabulary only
  one student has met. James: "yes, good point."
- **Shape: full vocab leaf** — intro cards, 24–40 items, all five stages, same
  lint gates as any other leaf.
- **`vocablevel` needs a per-pack exemption**, the way grammar packs already
  carry `is_grammar`. Specialist domain words (depreciation, clutch, cap table)
  are above level by construction and would otherwise lint red on every item.

## Starred word bank ("My words")

- Student stars words; they collect into a **playable leaf** (Match/Quiz/Type/
  Sentence), not a passive list.
- **Anything can be starred**, including words typed in from a lesson that exist
  in no pack.
- Consequence, unresolved: a playable item needs cz, an example sentence, a gap
  frame and distractor chips. A starred pack word arrives with all four. A
  typed-in word arrives with none, so the bank is two-tier whether or not it is
  designed that way — starred words play, typed words are inert until something
  fills them in.
- Suggestion, not decided: My Words should probably never bear fruit. Fruit gates
  use `vocabCoverNeed(n)` against a fixed bank size, so a deck that grows as they
  star things would un-ripen its own fruit. Never gating sidesteps that and fits
  "not essential for healthy growth."
- Storage rides the existing single localStorage key in `js/progress.js`, so it
  travels with Download/Import and is per-device like everything else.

## State of the tree as of 2026-09-05

Measured, not estimated:

- Three of the twelve branches have **zero** vocab units: `partnerships`,
  `community`, `change_transformation`.
- **44 of 101** vocab nodes sit on `tree_part: trunk` with no branch:
  19 A1, 9 A2, 11 B1, 3 B2, 1 B1+B2, 1 unlevelled.
- `BRANCH_UNIT` (the `V_XXX-` codex_unit regex the portrait uses to identify
  branch content) matches only **8** of the 101.
- Some seatings look pragmatic rather than meant: `leaf_health_a1` is on
  work_routine, not self_body; tech is on communication.

**Why this matters to the idea:** if extra growth is what visibly thickens a
branch, then today one cars pack would render a fuller Knowledge & travel branch
than the whole completed core, because most core units are not seated to compete
with it. Seating is a prerequisite, not a later tidy-up.

James, 2026-09-05: a lot of the early vocab staying on trunk is fine — trunk is
the shared foundation, branches are where knowledge differentiates. That leaves
the 11 B1 and 3 B2 trunk-seated units as the ones that actually matter, since B2
is where the supplementary tier lives. **Recategorising is not being decided now.**

## Open forks

1. When a branch grows past its core allotment, does it get longer/thicker (same
   shape, more wood) or a visible outgrowth (a spur reading "this is their thing,
   not everyone's")? Decides whether the portrait shows a person's shape or their
   specialism — a rendering tweak vs a new visual grammar.
2. What fills in cz / example / frame / distractors for a typed-in starred word.
3. Whether the B1/B2 trunk-seated units get reseated onto branches, and whether
   the existing seating map gets a deliberate pass at the same time.
4. B2 core is currently 28 units in `path_order_b2`, not 60. The supplementary
   tier assumes a core of 60; that build-out is the larger prior job.

---

# Branch coverage by level — speculative, DEFERRED

Same conversation, 2026-09-05. James: **defer entirely** — park until B2 core 60
exists. Nothing to do. Recorded so the model survives.

## The twelve branches are the twelve houses

`js/tree-portrait.js` lists them as odd houses then even houses, two groups of
six, and `BRANCH_UNIT` codes them in house order 1–12:

| h | branch | h | branch |
|---|--------|---|--------|
| 1 | self_body (SEL) | 7 | partnerships (PAR) |
| 2 | money_possessions (MON) | 8 | change_transformation (CHA) |
| 3 | communication (COM) | 9 | knowledge_travel (KNO) |
| 4 | home_family (HOM) | 10 | public_life (PUB) |
| 5 | creativity_love (CRE) | 11 | community (CMT) |
| 6 | work_routine (WRK) | 12 | inner_life_belief (INN) |

## The intended shape (James, 2026-09-05, verbatim sense)

Growth is **cumulative**, not a reveal threshold:

- **A1** — mostly trunk, but a number of topics, giving small branch growth.
- **A2** — mostly trunk; a few more branches, and develop branches already growing.
- **B1** — more branches again, and consolidate the trunk.
- **B2** — something on **all twelve** branches, plus a fairly strong trunk.

Early branches should be the **concrete daily ones** (home & family, self & body,
work & routine; then knowledge & travel, money, public life).

Most topics should be covered at each level. Where they are not, that is a **gap
to fill**, and the vocab units should be adjusted to fill it.

## Measured state, 2026-09-05 (live vocab leaves)

```
branch                   A1  A2  B1  B2
self_body                 2   .   1   .
communication             1   4   2   .
creativity_love           1   2   .   .
partnerships              .   .   .   .
knowledge_travel          3   2   3   .
community                 .   .   .   .
money_possessions         1   1   1   .
home_family               5   5   2   .
work_routine              2   3   1   .
change_transformation     .   .   .   .
public_life               2   2   2   .
inner_life_belief         2   2   2   .
trunk                    19   6   8   3
```

Read against the intended shape: **A1 is fine** — nine branches carrying 1–3
leaves each is exactly "a number of topics, small branch growth." The gaps are

1. **B1 adds no new branches** — 8 occupied, fewer than A1's 9. It thickens but
   does not widen, so the "add more branches" step is missing.
2. **B2 has no branch vocab at all** — its three live vocab nodes are on trunk.
   The level meant to complete the canopy currently contributes nothing to it.
3. **Houses 7, 8 and 11 are empty at every level** — partnerships, change and
   community. James: **gaps to fill at B1 too**, not B2-only, so the canopy fills
   gradually rather than three branches appearing at once.

## Units James wants invented

- **h8 · death / transformation** → `change_transformation`
- **h7 · partnerships** → `partnerships`

Both to appear at **B1–B2**. Not authored, not scheduled.

(h11 · community is the third empty house and needs one too; James named only the
two. Do not assume the third — ask.)

## Not decided

- Whether existing A1/A2 leaves get reseated at all. James: a lot of early vocab
  staying on trunk is fine.
- Whether "gap at this level" becomes a check, or stays a judgment.
