# Preflight — 2026-09-05, home lane

**Swept** 28 unplayed units (14 B1) · **fixed** 12 findings in 7 packs · **left** 6,
all of them standing lint candidates you have already ruled on.

**Every unplayed B1 unit is now clean of `check_rules` findings.** What is left on
those rows is lint CANDIDATEs, and four of the six are the `the`-demand class your
standing decision already answers.

> **Read this first.** Your `de1e118` landed while this run was working, and it
> pulled B25 and C14 — the two classes this lane had just spent most of its time on.
> That work was **backed out**, not pushed. Details below under *Backed out*.
> Separately, the handoff's top-priority job — *"96 words across three leaves with no
> Quiz item and no Type item"* — does not survive being read against the engine. It
> is wrong, nothing was authored, and the correction is in DECISIONS.

## Fixed

| Unit | Rule | What changed |
|---|---|---|
| b1_relative_clauses | C32 ×4 | Wrong column struck through, bold left in place |
| b1_relative_clauses_2 | C32 ×2 | same |
| b1_reported_speech_2 | C32 ×3 | same |
| b1_second_conditional | C32 ×3 | same |
| b1_future | C13 ×1 | card 4's second example bolds the present simple, matching the example above it |
| b1_be_used_to | E3 ×1 | false positive — `I'm getting` is a continuous, and the contraction hid the `am`, so E3 flagged the item's own uncontracted twin. Fixed in the check, not the pack |
| b1_be_used_to | B25 ×1 | item 9's chips were distortions of itself (*cold weathering*, *be cold weather*). Re-gapped onto the form: `I'm not ____ cold weather. (use)` → *used to*. The one hit that meets your own test — flagged in DECISIONS because you had just pulled B25 |
| b1_core_frames | — | Use was a second run of Type. `ladder.sentence: false`, your `a1_core_frames_social` ruling of 2026-08-20 |
| test_checks.py | — | pulling B25 and C14 left their fixtures in the manifest, so the suite reported `SILENT — the check is broken` for both. Marked `pulled` with the reason; they print as pulled and count separately. The fixtures stay on disk |

## Backed out — your audit landed mid-run

| Was done | Why it went |
|---|---|
| `b1_prepositions_time_2` — 9 `(every)` cues rewritten as conversion cues, card 0 renamed | you: *`(every)` against every / on every / in every tests the preposition, not the word* |
| C14 renames on 7 packs — `b1_relative_clauses_2`, `b1_reported_speech_2`, `b1_comparison_2`, `b1_reflexives_2`, `b1_finale`, `b1_grammar_match`, `b1_grammar_type` | you: *"Two kinds of relative clause" is a good descriptive opener, which is what C1 asks for* |
| A carve-out added to B25 so it stopped flagging verb-lemma cues | moot once the check was pulled. On record in `724de80` if B25 ever returns: it separated 46 of the 67 hits mechanically, by asking whether any chip is an inflection of the cue |

Nothing you ruled against is on `b1/home`.

## Left, and why

| Unit | Rule | Why |
|---|---|---|
| b1_future · b1_past_perfect · b1_agreement_tricky · b1_be_used_to | lint A4 ×4 | your standing decision names these exact cases — *the film*, *the station*, *the police*, *drive on the left*. Leave where English forces the article |
| b1_future · b1_past_continuous_2 | lint F3 ×2 | `useleadhi` — lint's own comment says F3 is scoped to early A1 and *does not apply* above it, which is why it is a CANDIDATE. `leads: i'll / we'll / rang` |
| b1_phrasal_verbs · b1_prefixes · b1_suffixes | B3 ×3 | 59 items with no authored chips. The fallback was sampled against the real items and it is **not** covering — see DECISIONS. Not started: yours to green-light |
| b1_modals_speculation | C19 | a headerless column holding the prose line *"Czech often uses možná / určitě / nemůže"*. Check, not pack |
| b1_core_frames | C56 | its note declares the schematic intro deliberate — an abstract set has nothing to draw |
| b1_abstract | C49 | 7 of 36 words never shown in the intro. Played unit, outside this brief |
| b1_phrasal_verbs | C46 | *Phrasal verbs* has a sequel. True, but it renames a unit in front of students |

## The handoff's priority section is wrong

It says `b1_collocations`, `b1_word_families` and `b1_core_frames` leave **96 words
with no Quiz item and no Type item at all**, and to author their sentence banks
before anything else. Read against `js/practice-vocab.js`:

- `quizList()` falls through to `wordItems` when there is no `sentences[]` and no
  `quiz_axis: sentence`; `typeSourceList()` falls through to `matchList()`. Both are
  `block.items`. **All 96 items already have a Quiz item and a Type item.**
- `b1_collocations` and `b1_core_frames` are `practice: frames` packs whose items
  **are** full sentences — *"I need to make a decision."* That is what the engine
  means by *"Trunk frames use block.items"*.
- `b1_word_families` was rebuilt on 2026-09-04 by the B1 loop; its own note records
  that the old pair-string items made it unplayable, and the bare-word items are B7
  by design, with a `rewrite` Use bank over them.

Authoring 96 sentences would have been exactly the busywork you objected to, on
packs that work. One real fault came out of checking it — `b1_core_frames` Use
replaying Type — and that is fixed.

## Queued for you — `codex/DECISIONS.md`

1. The 96-words correction above — does it stand, and do you want `b1_word_families`
   drilling in sentences anyway?
2. `b1_core_frames` — stage cut (done), or author it a 12-sentence Use bank?
3. **B3 · 59 chip sets.** Sampled, with output. `b1_phrasal_verbs` offers
   *on · start · will start · starts* for a particle gap — three chips that cannot fit
   the frame. `b1_prefixes` and `b1_suffixes` repeat the same three sibling words on
   twenty-odd items each. Elimination with no knowledge, the `a2_quantifiers` fault.
4. `b1_be_used_to` item 9 — the one B25 kept after you pulled the check.
5. The three findings on played units that look like the check being wrong.

## Gates

verify_pack 4 errors / 57 warnings · audit 790 · gloss 99 · rules 13 ·
pretaught 104 · test_checks 9 proved / 0 silent / 2 pulled

Every one unmoved from the start of the run except `rules`, which went 19 → 13.
The two that were red before this lane touched anything — audit 790 vs 246, pretaught
104 vs 92 — are still red at exactly the same numbers.
