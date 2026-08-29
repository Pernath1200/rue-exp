# Tree visual + multi-lang codex (locked decisions)

**Date:** 2026-07-28  
**Context:** Combined organism for `rue-exp` (and later family). Posters: RUE2 roots · RUE3 canopy. EN source: `rue-codex`.

---

## Decisions (James)

### 1. Codex scope — multi-language

**→ (A) Universal topology + separate unit lists per language.**

| Layer | Shared across langs? | What |
|-------|----------------------|------|
| Tree topology | **Yes** | Tap + 6 grammar laterals · trunk · 12 branch houses · growth stages A1–C2 |
| Unit lists | **Per language** | EN stays `rue-codex` `G_*` / `V_*` · PL (and later CZ) get sibling registries |
| Unit *content* | **Per language** | Never force EN article units onto Polish |

### 2. Grammar lateral names in the UI

**→ Student-facing only (PL names). No teacher metalanguage in UI.**

- Learner sees: *Forms · Verbs · Sentence · Chunks · Linking · Foundation* (EN seats)
- Teachers / codex / JSON may still store universal seats: `noun_phrase`, `verb_phrase`, … for cross-lang analytics
- UI never shows NP / VP / SS / CL as primary labels

### 3. First visual ambition

**→ Fixed skeleton, dim empty seats, light live bits** (easier *and* poster-true).

| Approach | Effort | Fits posters? |
|----------|--------|----------------|
| Only draw live bits (thin A1 shape changes over time) | Higher (layout thrash) | Weaker (“same branch seats forever”) |
| **Full skeleton, dim + lit** | **Lower** (static SVG + fill/opacity) | **Strong** (dim = not yet opened) |

Honest A1 still reads as shallow: live roots short/thick only where fruited; trunk thin; few leaves lit near stem; rest dim.

### 4. Soil-line interaction

**→ Spine = primary navigation. Tree = status portrait.**

- “Do next” / path list / Practice remain the work UI  
- Tree shows growth honesty (roots thickness, trunk width, leaf light)  
- Tree may later soft-click to scroll/focus a path node — not replace spine  

### 5. Codex home for PL (and CZ)

**→ Separate registries for now**, derived from / influenced by EN `rue-codex`.

| Registry | Role |
|----------|------|
| `rue-codex` | EN (and universal topology docs) — main |
| **`RUE-codex`** (or `pl-codex`) | PL grammar + vocab units · `lang: pl` · maps to RUE2/3/exp |
| Later `rucz-codex` | CZ when ready |
| Future multi-lang | Easier for **vocab** (same houses); **grammar** harder (different morphology partitions) |

Derivation rule: copy **topology + banding + house list** from EN model; rewrite **unit titles, tree_part fill, notes** for the language. Spine join IDs (`PL_*`) can live in language codex or shared join file.

---

## Universal topology (language-agnostic)

### Below soil — grammar

| Seat (internal id) | Student-facing (EN example) | Student-facing (EN example) |
|--------------------|----------------------------|-----------------------------|
| `tap_root` | Foundation | Foundation |
| `verb_phrase` | Verbs | Verbs |
| `noun_phrase` | Noun forms | Forms |
| `sentence_syntax` | Sentence | Sentence |
| `clause_linking` | Linking clauses | (later · complex linkers) |
| `verb_complementation` | Verb patterns | (later · or fold into Verbs) |
| `prepositions_particles` | Prepositions | Linking / prepositions |

A language-specific A1 may **light or leave dim** seats that EN fills early (e.g. articles) and **thicken** Forms/Verbs earlier. That is correct, not a bug.

### Above soil — vocab

| Seat | Role |
|------|------|
| Trunk | Core + frames + chunks (COR / PHR) |
| 12 houses | Fixed positions (SEL, MON, COM, HOM, WRK, …) |
| Leaves | Domain lexis in use |
| Flowers | B2+ flair (dim at A1) |
| Fruit | Generative mastery (honest, rare early) |

---

## Combined visual (rue-exp status portrait)

```
        [ dim/lit houses + leaves — vocab ]
        [ trunk width — core/frames      ]
  ══════ soil line (CEFR band indicator) ══════
        [ laterals thickness/depth — grammar ]
        [ tap root                             ]
```

**Data → paint:**

| Visual | Driven by |
|--------|-----------|
| Root thickness | Grammar fruit / mode progress on packs tagged to that seat |
| Root depth | Highest CEFR with live content for that seat |
| Trunk width | Vocab fruit on trunk/frame packs |
| Leaf light | Vocab fruit on theme/leaf nodes |
| Dim seat | Topology present, no live pack yet |
| Copper vs amber | Grammar below soil · vocab above (already dual accent) |

**Navigation:** spine first; optional click on lit knot/leaf → `focusNodeOnMap(id)`.

---

## Provisional PL grammar seats ↔ current packs

| Internal seat | PL UI label | Live packs (today) |
|---------------|-------------|--------------------|
| tap | Foundation | foundation flags on packs |
| noun_phrase / forms | Forms | a1_gender, a1_gender_check, a1_acc_gym |
| verb_phrase | Verbs | a1_hello (be), a1_present(+gym), a1_miec conjug |
| case (forms) | Forms | a1_miec acc, a1_acc_gym |
| sentence_syntax | Sentence | planned questions / word order |
| prepositions | Linking / prepositions | planned prep_place |
| chunks | Chunki | only when frame-forced |

Exact `tree_part` mapping can be a JSON table in `RUE-codex` without renaming student UI.

---

## Why grammar multi-lang is harder than vocab

| Vocab | Grammar |
|-------|---------|
| Same life domains (home, work, food) | Different systems (articles vs gender/case) |
| Shared house seats work | Same “NP seat” holds different root_ids |
| Lemma + translation portable | Morphology not portable |

So: **shared topology forever**; **shared unit rows only where the system is really the same** (rare for grammar; common for themes).

---

## Build order (when implementing)

1. **Status-portrait SVG** in `rue-exp` — **done** (`js/tree-portrait.js`)  
2. **Tag** exp tree nodes with `tree_part` + `codex_unit` — **done** (via `sync_from_stable.py` + `RUE-codex/codex.json`)  
3. **Seed `RUE-codex`** — **done** (topology + PL grammar/vocab units for live packs)  
4. **Do not** rewrite EN `rue-codex` content; only reference it as parent model  

---

## The cambium — word formation's seat (James, 2026-08-29)

Word formation is neither trunk (it is not core words) nor branches (it has
no theme) nor a root (morphology is not syntax). It is the **multiplier** —
the system that turns hundreds of known roots into thousands of family
members. The tree already has a name for "structural, but neither roots nor
branches": the **cambium**, the thin living layer that produces all new
mass. Height comes from the apex bud (next level, new material); width
comes from the cambium (densifying what you have). A thick trunk on a
modest tree = someone who makes a few hundred roots go a long way.

- **Data**: the Codex's existing `word_craft` strand IS the cambium — no
  rename, no new tree_part upstream. `V_WFM-B1B2-01` (b1_prefixes,
  b1_suffixes) and `V_WFM-B2C1-01` (b2_word_formation, c1_word_formation —
  the FCE/CAE gyms) woke from drafted to app-integrated. Etymology
  (`V_WFM-B2C1-02`) stays drafted.
- **Portrait**: visuals deferred. Direction when it comes: word-craft
  progress feeds **trunk girth** (the 08-25 tap-decision mechanism — reps
  add rings, diminishing returns), possibly a thin living edge-line on the
  trunk. No knots, no slots, no new limb. Mockup-first if wanted.
- **Copy caveat** (vocab-roots research 2026-06-03): the affix multiplier
  is receptive and front-loaded B1→B2, tapering. Do not oversell — no
  "50 roots unlock thousands" claims in student-facing text.

## Open (non-blocking)

- Exact EN labels for the six seats (Forms vs Noun phrase, etc.)  
- Whether case is a sub-seat of Forms or its own lateral in a language profile  
- Name of sibling repo: `RUE-codex` vs `pl-codex` vs folder under projects  

---

## One line

**One tree shape for every language; separate unit lists per language; PL student names on the map; spine navigates; tree reports growth; PL codex sibling first, multi-lang registry later.**
