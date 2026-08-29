# Agent rules — rue-exp (unified RUE)

## Product

| | |
|--|--|
| **Folder** | `projects/rue-exp` |
| **Role** | **The one canonical RUE repo** (decided 2026-08-06) — grammar + vocab zigzag, rupl-exp pattern |
| **Port** | 8097 |
| **Progress** | `rue-exp-progress` only — one key, one browser. A per-student picker was tried and removed 2026-08-10 (students use their own laptops). Never rename the key. |
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

**A1 + A2 leaves are closed** (38 banks, ~946 sentences as of HANDOFF 2026-08-09).
B1 leaves still need banks when that tier is polished. Author a real
`sentences[]` bank per leaf pack. **Decided: we do NOT port
`rue3-exp/js/carriers.js`.** It builds Czech by string template with no case
or gender agreement (`Mám ${cz}` gives *Mám sestra*), and broken Czech in
front of a Czech learner is worse than a missing stage.

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

## James policy locks (2026-08-09) — full text: `codex/POLICY-LOCKS.md`

| ID | Lock |
|----|------|
| **P-hour** | `a1_articles` / `hour` permanently accepted — never re-fix |
| **P-lemma** | Item-level `lemma` allowed for taught-in-place words the gap hides |
| **P-b1-vocab** | B1 vocab extension = **interactive only** (auto must not start) |
| **P-deploy** | A1+A2 polished before any student deploy |
| **P-engine** | Auto never touches `js/` / `css/` / `index.html` unless REPAIR-QUEUE says engine-ok |

## B1 vocabulary extension — PARKED, interactive only (James, 2026-08-09)

**Not active for auto. Do not start this unattended.** Interactive sessions
may resume later. Briefly planned as a live cloud-routine program on
2026-08-08, then parked. Scoped plan for a human-led resume; see
`codex/HANDOFF.md` Q1 (Oxford coverage anomaly) before trusting gap numbers.

Full reasoning: `rupl-exp/codex/VOCAB-REORIENTATION-2026-08-07.md` (covers both
RUE and RUPL — decisions 9-15 are RUE's). Summary: RUE's grammar goes to C1 and
its A1/A2 vocab is finished, but vocab stops dead at B1. **Scope if resumed:
bring vocab to a clean B1, ~26 new thematic packs, on branch `vocab/b1-build`
(exists, pushed, rebased current as of 2026-08-08 — will need re-rebasing onto
whatever `build` has moved to by then). B2/C1 vocab scope is a separate,
deliberately unresolved decision.**

**Order, if resumed — do not skip ahead:**

1. ~~Re-verify the gap before trusting it.~~ **DONE 2026-08-10 — Q1 CLOSED,
   verdict in `codex/OXFORD-REMEASURE.md`.** The "anomaly" was a
   measurement-tier artifact (2026-08-07 read tier C/anyfield 98/56,
   2026-08-08 read tier A/items 90/30 — same table, different rows, nothing
   moved). Coverage never fell; the re-lexify hypothesis is dead. **Scope
   the extension off tier B (taught): ~498 words ≈ 42 packs — not the old
   336, which was the inflated tier-C floor.** Any future coverage claim
   must name its tier (A items / B taught / C anyfield).
2. **Prerequisite: backfill `teaches_lemmas` across all 93 grammar packs.**
   Flat array on each pack, e.g. `"teaches_lemmas": ["work", "works", "live",
   "lives"]` — the actual forms the pack drills (RUPL's grammar packs already
   have this field; `rupl-exp/data/grammar/blocks/a1_gender.json` is a real
   example to model the shape on, not the content). Derive mechanically from
   each item's `gap_answer` plus any other form the pack meaningfully teaches;
   dedupe per pack. Not started as of wind-down (0/93).
3. **Author the B1 packs** from the corrected gap list, ~26 thematic packs of
   12, matching existing convention exactly: full five modes, same quality bar
   as A1/A2, picture-led intros and `sentences[]` Use banks per the specs
   above. **No reading lane, no engine changes — content only.**

**Multi-word stragglers** (32 A1/A2 items like "have to", "ice cream", "next
to", "t-shirt") are lower priority than the B1 core.

## Wind-down (historical — Claude closed 2026-08-09)

Claude cloud + Czech-review routines **self-terminated** on sight of
`codex/HANDOFF.md`. That file is the **Claude** kill switch only — it does
**not** stop the **Grok** continuous-improvement lane
(`agent-nightly/RUE-AUTO.md`).

## Automation lanes (2026-08-09)

| Lane | What | Branch |
|------|------|--------|
| **Grok auto `AgentRueExp`** | every ~3h · repair → A1/A2 polish → B1 sequencing | `auto/*` local · **no push** |
| **Interactive** (James + Grok/Claude) | shell, policy, smoke, B1 vocab if resumed | `build` / as asked |
| **Claude cloud RUE build** | **OFF** (HANDOFF kill switch) | — |

Control flag: **`agent-nightly/RUE-AUTO.md` Status = READY | OFF**.

Shared rules:

- **Gates before commit** — every commit must pass all four:
  `py -X utf8 codex/verify_pack.py` (**0 errors**),
  `py -X utf8 codex/check_playable.py` (**0 errors**),
  `py -X utf8 codex/audit.py --check` (**ratchet: violations may never rise**), and
  `py -X utf8 codex/check_codex.py` (**0 unknown tags**).
- **Pack shape is fixed**: content in `blocks[].items[]`; adapter builds the
  ladder. Never author `pack.match/quiz/type_items/use_items` directly.
- **Pool before authoring** — `py -X utf8 codex/make_pool.py … --before <node>`.
- **Never invent node ids.** Register in `data/nodes-*.json`, rebuild tree.
- **Digest per run** — append to `codex/BUILD-DIGEST.md`.
- **Engine/shell**: auto touches `js/`/`css/`/`index.html` **only** if
  REPAIR-QUEUE marks an item engine-ok; default ban.
- All output = **drafts that pass the machine gate**. James still smokes —
  automation never promotes itself to students.

## Sequencing repair — Oxford-preference rule (2026-08-10)

When re-lexifying a sentence onto taught vocabulary to clear an audit
violation: if several taught replacements fit, **prefer a word on
`codex/vocab/oxford-5k-cefr.csv` at or below the pack's level**, and never
swap an Oxford-listed word for an off-list one when an Oxford-listed
alternative exists. (Q1 established this failure mode never actually
happened — the rule exists so it never can. See `codex/OXFORD-REMEASURE.md`.)

## Don't

- Write to `rue2-exp-progress` or rue3 progress keys
- Edit `rue-auto` / `rue3-exp` (frozen) or retire the old student apps
- Push / force-push / deploy Pages from an auto run · promote without James
- Start B1 vocab extension from auto (interactive only)

## Smoke

Interactive: **audit first** (intro / Match / Quiz / Type / Use), findings, dropdowns,
then rewrite. Full method: `codex/AUTHORING-RULES.md` § Smoke method (I8).
After Telegram `<unit_id> tested`: new rules in that file → reconcile → commit → new tab.

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\smoke.py
py -m http.server 8097
```
