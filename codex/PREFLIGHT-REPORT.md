# Preflight — 2026-09-05, home lane

**Swept** 28 unplayed units (14 B1) · **fixed** 12 findings in 7 packs ·
**retracted** 3 checks as false · **left** 6, all standing lint candidates you have
already ruled on.

**Every unplayed B1 unit is clean of `check_rules` findings.** So is every played
B1 unit. `check_rules` live went **19 → 8**, and all eight are on paused B2 packs
or protected A1 ones.

> **Two things to read before anything else.**
> 1. Your `de1e118` landed mid-run and pulled B25 and C14 — the two classes this
>    lane had just worked. That work was **backed out, not pushed**.
> 2. Three more findings turned out to be the check measuring the wrong thing, and
>    one of them had already reached you as a dropdown. See *Retracted*.

## Fixed

| Unit | Rule | What changed |
|---|---|---|
| b1_relative_clauses | C32 ×4 | Wrong column struck through, bold left in place |
| b1_relative_clauses_2 | C32 ×2 | same |
| b1_reported_speech_2 | C32 ×3 | same |
| b1_second_conditional | C32 ×3 | same |
| b1_future | C13 ×1 | card 4's second example bolds the present simple, matching the one above it |
| b1_be_used_to | B25 ×1 | item 9's chips were distortions of itself (*cold weathering*, *be cold weather*). Re-gapped onto the form: `I'm not ____ cold weather. (use)` → *used to*. The one hit that meets your own test — still flagged in DECISIONS, since you had just pulled the check |
| b1_core_frames | — | Use was a second run of Type. `ladder.sentence: false` — your `a1_core_frames_social` ruling of 2026-08-20. **Dropdown: keep** |

## Retracted — the check was wrong, not the pack

| Rule | Was reported | What is actually there |
|---|---|---|
| **B3** | 59 gap items with no chips across `b1_phrasal_verbs`, `b1_prefixes`, `b1_suffixes` | Every one sits in a type-only or use-only block whose `check.sequence` is `[]`, so `pack-adapt.js` never hands it to `choicesFor`. Every block that *does* reach Quiz is fully authored. **This one had already reached you as a dropdown and you green-lit 23 chip sets. Nothing was authored.** B3 now counts only what reaches Quiz |
| **E3** | `b1_be_used_to` item 12 accepts a continuous twin | `I'm getting` **is** a continuous — the contraction hid the `am`, so the check flagged the item's own uncontracted twin. E3 now expands `'m / 're / 's`. The five real E3 findings stand |
| **C19** | Czech loose in an English table on `b1_modals_speculation` | A headerless two-column card whose left cell is the sentence *"Czech often uses možná / určitě / nemůže být"*. Its only other hit, `a1_word_classes`' *"**adjective** (*přídavné jméno*)"*, is a gloss C22 positively requires. **Dropdown: fix the script** — a column with no header is now skipped |
| **C56** | `b1_core_frames` intro opens on a diagram, not pictures | Deliberate since 2026-08-10: the set is *decide / suggest / agree / refuse* and there is no picture of *agree*. **Dropdown: fix the script** — a pack may now say `C56 exempt: <reason>` in its note, and this one does |

`C46` on `b1_phrasal_verbs` — *Phrasal verbs* should be *Phrasal verbs 1* — left
alone. **Dropdown: the rename is yours.**

### One consequence worth knowing

Narrowing C19 leaves it with **no hits anywhere in the corpus**, so its frozen
fixture — one of the two false hits — stopped firing and `test_checks` reported
`SILENT — the check is broken`. That is the H5 story again: the fixture was wrong,
not the check. There is no true C19 instance left to freeze, so the check is
unproven until one appears. Recorded in the manifest rather than faked, and in
DECISIONS in case you would rather revert C19 than leave it unproven.

`test_checks`' `pulled` field is now `skip`, since a fixture can stop proving its
check for more than one honest reason. Three carry it: B25 and C14 pulled, C19
narrowed. Anything without `skip` must still fire.

## Backed out — your audit landed mid-run

| Was done | Why it went |
|---|---|
| `b1_prepositions_time_2` — 9 `(every)` cues rewritten, card 0 renamed | you: *`(every)` against every / on every / in every tests the preposition, not the word* |
| C14 renames on 7 packs | you: *"Two kinds of relative clause" is a good descriptive opener, which is what C1 asks for* |
| A carve-out that stopped B25 flagging verb-lemma cues | moot once B25 was pulled. On record in `724de80`: it separated 46 of the 67 hits by asking whether any chip is an inflection of the cue |

## Left, and why

| Unit | Rule | Why |
|---|---|---|
| b1_future · b1_past_perfect · b1_agreement_tricky · b1_be_used_to | lint A4 ×4 | your standing decision names these exact cases — *the film*, *the station*, *the police*, *drive on the left* |
| b1_future · b1_past_continuous_2 | lint F3 ×2 | `useleadhi` — lint's own comment says F3 is scoped to early A1 and does not apply above it, which is why it is a CANDIDATE |
| b1_abstract | C49 | 7 of 36 words never shown in the intro. Played unit, outside this brief |
| b2_present_perfect_continuous · b2_second_conditional · b2_third_conditional | B3 ×3 | 192 gap items with no chips, and these ones **do** reach Quiz. B2 is paused; a real job when it restarts |

## The handoff's priority section is wrong

It says `b1_collocations`, `b1_word_families` and `b1_core_frames` leave **96 words
with no Quiz item and no Type item at all**, and to author their sentence banks
first. Read against `js/practice-vocab.js`, `quizList()` falls through to
`wordItems` and `typeSourceList()` to `matchList()` — both `block.items`. All 96
already have both. Two of the three are `practice: frames` packs whose items *are*
full sentences; `b1_word_families` was rebuilt to bare words on 2026-09-04 because
the old shape was unplayable. **Dropdown: the correction stands, nothing authored.**
One real fault came out of checking it — `b1_core_frames` Use replaying Type — and
that is fixed.

## The pattern, since it is now three for three

Every check written speculatively from rule text has cost more than it found: B2
(496 false), B25 (28 of 29), C14 (15 of 17), C19 (2 of 2), C56 (1 of 1), B3 (59 of
59), E3 (1 of 6). The ones that hold — F9, C6, C58, C32, C13 — were each written
against a fault you had actually pointed at. Two of the six also shared one cause:
the check read the JSON without knowing what the **engine** does with it, so B3
missed block gating and E3 missed contractions. A check on pack data that has not
been read against `js/` is a guess.

## Gates

verify_pack 4 errors / 57 warnings · audit 790 · gloss 99 · rules 8 ·
pretaught 104 · test_checks 8 proved / 0 silent / 3 skipped

All unmoved from the start of the run except `rules`, 19 → 8. The two that were red
before this lane touched anything — audit 790 vs 246, pretaught 104 vs 92 — are red
at exactly the same numbers.
