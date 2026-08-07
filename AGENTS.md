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

Interim limit: `--rebuild-tree` still *reads* the frozen labs' `tree.json` for
node definitions. Making the node registry fully local is night-zero work — do
not add new nodes until that lands.

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

## Automation lanes (2026-08-06, mirrors RUPL)

Two lanes meet on branch **`build`**; `main` moves only when James promotes.

| Lane | What | Branch |
|------|------|--------|
| **Cloud routine "RUE build"** | hourly, claude-opus-5, self-contained prompt: repair → build 2-3 units | `build` |
| **Local sessions** (James + Claude) | judgement work, smoke fixes, design | `build` (promote to `main` = James only) |

Shared rules, from the RUPL build (they all earned their place):

- **Gates before commit** — every commit must pass all three:
  `py -X utf8 codex/verify_pack.py` (**0 errors**),
  `py -X utf8 codex/check_playable.py` (**0 errors** — the ladder a student
  actually gets, plus the quiz single-correct-answer check), and
  `py -X utf8 codex/audit.py --check` (**ratchet: violations may never rise**).
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
