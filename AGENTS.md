# Agent rules — rue-exp (unified RUE)

## Product

| | |
|--|--|
| **Folder** | `projects/rue-exp` |
| **Role** | **The one canonical RUE repo** (decided 2026-08-06) — grammar + vocab zigzag, rupl-exp pattern |
| **Port** | 8097 |
| **Progress** | `rue-exp-progress` only |
| **Codex** | `../rue-codex` — units hang on `G_*` / `V_*`; never invent theme ids |
| **Do not overwrite** | `rue2-grok-v1.0` / `rue3-exp` student sites without explicit promote |

## Critical — where edits go (2026-08-06)

`rue-auto/grammar` and `rue3-exp` are **FROZEN archives — never edit them,
never sync from them.** `scripts/sync_from_stable.py` is retired and carries a
hard guard. Everything is edited **here**:

| Kind | Edit here |
|------|-----------|
| **Shell** (HTML/CSS/JS) | `rue-exp/` directly |
| **Grammar packs** | `rue-exp/data/grammar/blocks/` directly |
| **Vocab packs** | `rue-exp/data/vocab/blocks/` directly |
| **Path / spine** | `data/spine.json` → `py scripts/sync_from_stable.py --rebuild-tree` |

Node registry is fully local (`data/nodes-grammar.json` / `data/nodes-vocab.json`
— lab snapshots taken 2026-08-06); `--rebuild-tree` no longer reads the frozen
labs at all. Register new nodes there, never elsewhere.

## Do

- Edit spine pairs in `data/spine.json` (`grammar` / `vocab` sides)
- Run `py scripts/sync_from_stable.py --rebuild-tree` after pack or spine changes
- Keep dual engines; do not invent a third practice system
- Soft path only (no hard G→V locks unless James asks)

## Language contract (locked 2026-08-06)

- Direction is fixed **CZ → EN**: items carry `en` (English **target** — typed,
  chosen, graded) + `cz` (Czech **support** — always the prompt)
- Never reintroduce `pl` data fields or a direction toggle
- Frame Type mode shows `cz` as support, never the full `en` sentence (it
  contains the gap answer)

## Vocab intros — picture-led (James, 2026-08-07)

Going straight into Match is too abrupt. Every live vocab unit gets a **two-page
intro**, authored into the pack as `intro: [ page1, page2 ]` (a flat ARRAY —
grammar packs use `intro.cards`, vocab does not).

**Page 1 — meaning through a picture. Page 2 — the frames** the words live in,
plus at most one trap.

```jsonc
"intro": [
  { "title": "Your family and your home",
    "title_cz": "Vaše rodina a váš domov",     // see the Czech ladder below
    "pictures": [                                // emoji OR swatch, 8-12 tiles
      { "icon": "👩", "en": "mother", "cz": "matka" },
      { "swatch": "#e04a4a", "en": "red", "cz": "červená" }
    ],
    "diagram": "branch",                         // abstract sets INSTEAD of pictures
    "labels": ["idea", "thing", "place"],        // the schematic's labels
    "body": "One or two lines. Never a wall." },
  { "title": "You will use these words in",
    "frames": ["This is a …", "I have a …"],     // from the items' use[] carriers
    "note": "home ≠ house: home = domov, house = dům.",
    "note_cz": "Pozor: home ≠ house." }
]
```

- **Czech ladder:** A1/A2 Czech on tiles and notes is fine · B1 a little ·
  **B2/C1 minimal**.
- **Pictures**: emoji, colour swatches, or a schematic from
  `js/intro-visuals.js` (`scale · circles · branch · cycle · contrast`).
  Abstract sets (Ideas, Feelings, Society) take a **schematic**, never
  stretched emoji. **No photo or image files** — nothing external, nothing
  licensed. Need a new schematic? Propose it in the digest; it goes in
  `intro-visuals.js`, never inside a pack.
- **Pictures are intro-only.** Never put `icon`/`swatch` on drill items — the
  chip renders beside BOTH the English and the Czech tile, which would turn
  Match into pairing identical images.
- **Frames come from the items' `use[]` carrier ids** — use the real carrier
  wording (`this_is_a` → "This is a …"); don't invent frames.
- Templates to copy: `a1_home_family` (emoji), `a1_colours` (swatches),
  `a1_ideas` (schematic).
- Order: **all live A1 vocab units first, then A2.** B1 only after James
  reviews the A1/A2 set.

**Trunk units (James, 2026-08-08) — mixed treatment, judged per pack, not
skipped.** The `trunk_*` packs (pronouns, modals, verb-overflow lists,
question words, quantity/linker glue) don't fit "8-12 tiles" as a rule — some
teach genuinely concrete, picturable content; others are pure function words
with no referent. Decide per unit:

- **Concrete trunk** (its items are real nouns/verbs a glyph can carry —
  `trunk_verbs_more_a1`, `trunk_verbs_say_a1`, `trunk_verbs_action_a1`, and
  similar): treat exactly like a leaf — normal emoji-tile page 1.
- **Glue trunk** (pronouns, modals, question words, quantity, linkers — no
  concrete referent, forcing an emoji would be a lie): **text-only page 1** —
  a short title + 1-2 line framing of what the pack does, no `pictures[]`,
  no `diagram`. Page 2 (frames) is unchanged either way.
- When genuinely unsure which a pack is, read its items first — don't guess
  from the id alone.

## Use-stage sentence banks (James, 2026-08-07)

45 of 67 live vocab units show **"Use · coming soon"** — the fourth stage is
dead for two thirds of the vocab side. Fix: author a real `sentences[]` bank
per pack. **Decided: we do NOT port `rue3-exp/js/carriers.js`.** It builds
Czech by string template with no case or gender agreement (`Mám ${cz}` gives
*Mám sestra*), and broken Czech in front of a Czech learner is worse than a
missing stage.

```jsonc
"sentences": [
  { "en": "My mother is in the kitchen.",
    "cz": "Moje matka je v kuchyni.",
    "lemmas": ["kitchen"],                  // words THIS pack teaches
    "accepts": ["My mother is in the kitchen"] }
]
```

- **~12 per pack**, one per lemma the unit most needs to produce.
- `lemmas` must name items that exist in this pack — they drive guaranteed
  exposure (the word modes surface a lemma before Use demands it). Lint warns.
- **The audit reads sentence banks** (`exposed_text`), so every English word in
  a sentence must be pool-legal at that unit's position. No free pass.
- **`use[]` tags stay** — 1,858 of them, curated, naming the frames each word
  fits (`this_is_a`, `i_have_a`, `he_is_my`). They are **authoring guidance**,
  not executable: read them to choose a sentence's shape. The engine that made
  them executable stays in the frozen lab; revisit only if Czech case/gender
  data ever lands on the lemmas.
- Template to copy: `a1_home_family`.
- **Czech is the risk.** Write only Czech you are confident is natural and
  correctly inflected. If you cannot, choose a simpler English sentence you
  CAN translate well. Every bank is reviewed by the separate Czech-review
  routine — flag anything you were unsure of in the digest.

## Explanation language scales with level (James, 2026-08-08)

Explanatory prose — intro `body`/`note`/`title_cz`, grammar `explanation`/
`explanation_cz`, hints — is scaffolding around the target content, not the
target content itself. Its own register should track the student's level:

- **A1/A2: simple, plain-English metalanguage.** Short sentences, controlled
  vocabulary, avoid subordinate clauses in the explanation itself. The
  student is reading the explanation to understand something hard — the
  explanation must not itself be hard.
- **B1 and up: natural, less simplified English.** The explanation may use
  normal native-level phrasing and sentence complexity.

This never relaxes the difficulty of the target CONTENT (the `en` being
taught) at any level — only the prose that explains it. Plain grammar terms
still apply throughout (real category names — preposition, genitive — never
baby-talk), at every level.

## B1 vocabulary extension (James, 2026-08-08)

Full reasoning: `rupl-exp/codex/VOCAB-REORIENTATION-2026-08-07.md` (covers both
RUE and RUPL — decisions 9-15 are RUE's). Summary: RUE's grammar goes to C1 and
its A1/A2 vocab is finished, but vocab stops dead at B1 (56% Oxford coverage
when last measured). **Scope: bring vocab to a clean B1, ~26 new thematic
packs. B2/C1 vocab scope is a separate, deliberately unresolved decision —
do not fold it in here.**

**Branch: `vocab/b1-build`, not `build`.** One writer per branch is the rule
that held through the RUPL build. While this work is active, the cloud lane's
entire hourly slot works `vocab/b1-build` — **not** repair queue, not
sequencing repair, not C1, all on `build`. `main` still only moves when James
promotes, from whichever branch is ready.

**Order, in this sequence — do not skip ahead:**

1. **Re-verify the gap before trusting it.** The original count (336 words)
   is stale — re-measured 2026-08-08 after two days of content work and it
   moved the wrong way (A1 98%→90%, B1 56%→30% coverage), which should not
   happen when only content is *added*. Likely cause, unconfirmed: sequencing
   repairs (`fix(unit): re-lexify … onto taught vocabulary` commits) swap a
   word for an already-taught synonym to clear an audit violation, and may be
   trading away Oxford-listed words for simpler ones with no preference either
   way. Before authoring a single B1 pack: run `codex/scripts/rue_oxford.py`
   fresh, sanity-check a handful of "missing" words by hand against real
   packs, and if the re-lexify theory holds, decide (log the fork) whether
   future re-lexify repairs should prefer an Oxford-listed replacement when
   more than one pool-legal option exists. Regenerate
   `codex/vocab/oxford-b1-gap.tsv` from the corrected measurement — the
   number that drives the ~26-pack plan must be one you trust.
2. **Prerequisite: backfill `teaches_lemmas` across all 93 grammar packs.**
   Flat array on each pack, e.g. `"teaches_lemmas": ["work", "works", "live",
   "lives"]` — the actual forms the pack drills (RUPL's grammar packs already
   have this field; `rupl-exp/data/grammar/blocks/a1_gender.json` is a real
   example to model the shape on, not the content). Derive mechanically from
   each item's `gap_answer` plus any other form the pack meaningfully teaches;
   dedupe per pack. Pure grammar-pack edits, no vocab file touched, fully
   gate-checkable. Without this the B1 gap number stays a range, not a count.
3. **Author the B1 packs** from the corrected gap list, ~26 thematic packs of
   12, matching existing convention exactly: full five modes (intro, match,
   quiz, type, use), same quality bar as A1/A2, picture-led intros per the
   spec above, `sentences[]` Use banks per the spec above. **No reading lane,
   no engine changes — content only**, per the original decision.
4. **Digest and gates as normal** — same `codex/BUILD-DIGEST.md`, same four
   gates, same REPAIR-QUEUE.md discipline. Note in each digest entry that
   you're on `vocab/b1-build`, not `build`, so James can tell the branches
   apart at a glance.

**Czech review follows this branch too** while it's active — see the
Czech-review routine's own prompt.

**Multi-word stragglers** (32 A1/A2 items like "have to", "ice cream", "next
to", "t-shirt") are lower priority than the B1 core — fold them in near the
end if time allows, don't let them block the main B1 sequence.

## Automation lanes (2026-08-06, mirrors RUPL)

Two lanes meet on branch **`build`**; `main` moves only when James promotes.
**Exception, active 2026-08-08: the cloud routine's branch is `vocab/b1-build`
until the B1 vocabulary extension above is finished — see that section for
what pauses and what doesn't.**

| Lane | What | Branch |
|------|------|--------|
| **Cloud routine "RUE build"** | hourly, claude-opus-5, self-contained prompt: repair → build 2-3 units | `build` (currently `vocab/b1-build` — see above) |
| **Local sessions** (James + Claude) | judgement work, smoke fixes, design | `build` (promote to `main` = James only) |

Shared rules, from the RUPL build (they all earned their place):

- **Gates before commit** — every commit must pass all four:
  `py -X utf8 codex/verify_pack.py` (**0 errors**),
  `py -X utf8 codex/check_playable.py` (**0 errors** — the ladder a student
  actually gets, plus the quiz single-correct-answer check),
  `py -X utf8 codex/audit.py --check` (**ratchet: violations may never rise**), and
  `py -X utf8 codex/check_codex.py` (**0 unknown tags** — every `codex_unit`
  must exist in the vendored rue-codex snapshot `codex/codex-units.json`;
  never invent unit ids — missing unit means add it upstream in rue-codex
  first, then refresh the snapshot).
- **Pack shape is fixed**: content lives in `blocks[].items[]` with
  `intro.cards` and `check.sequence`; `js/pack-adapt.js` translates that into
  the practice ladder. Never author `pack.match/quiz/type_items/use_items`
  directly, and if you change the pack shape you must change BOTH
  `pack-adapt.js` and `codex/check_playable.py` or the ladder silently empties.
- **Pool before authoring** — `py -X utf8 codex/make_pool.py POOL.md --before
  <node>`; only pool-legal + GLUE + same-step partner material in new units.
- **Never invent node ids.** Author packs for registered sketch nodes
  (`data/nodes-grammar.json` / `data/nodes-vocab.json`), flip status there,
  rebuild via `py scripts/sync_from_stable.py --rebuild-tree`.
- **Digest per run** — append to `codex/BUILD-DIGEST.md`: what/why/forks.
  Design forks: conservative path + logged note, never a silent guess.
- **Verify regardless of self-report** — ~1/3 of fluent "all clean" RUPL agent
  reports hid a real bug. Re-check mechanically every time.
- **Engine/shell code**: cloud lane touches `js/`/`css/`/`index.html` ONLY for
  items listed in `codex/REPAIR-QUEUE.md` — content is its lane, the shell is
  James's + local Claude's.
- **Local multi-agent nights**: one file per agent; orchestrator wires, audits,
  commits centrally (every RUPL stall was a two-file agent task).
- **Notify (local sessions)**: PushNotification on batch land + digest ready —
  one line, counts not adjectives. Cloud runs surface in the claude.ai app.
- All output = **drafts that pass the machine gate**. James still smokes —
  automation never promotes itself to students.

## Don't

- Write to `rue2-exp-progress` or rue3 progress keys
- Edit `rue-auto` / `rue3-exp` (frozen) or retire the old student apps
- Push `main` from a night run · force-push anything · deploy Pages without James

## Smoke

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\smoke.py
py -m http.server 8097
```
