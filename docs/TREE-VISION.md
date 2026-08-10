# Tree vision — combined grammar roots + vocab canopy

**Status:** direction locked 2026-08-10 (James + Grok).  
**Code today:** `js/tree-portrait.js` (sapling sketch, live).  
**Long target:** one botanical organism, all SVG, progress-driven.

---

## Problem (why this doc exists)

1. The current map is a **clear but basic sketch** (soil line, stick roots, labeled house twigs). Fine for navigation; not the emotional “tree” of the RUE model.
2. **C1 looked smaller than B2** because `LEVEL_PRESETS` had no `C1` entry — unknown levels fell back to **A1**. Fixed in the same pass as this doc; do not regress.
3. RUE2 already had a **strong underground** (`rue2-grok-v1.0/js/roots.js`). RUE3 / posters had a **strong above-soil** language. rue-exp needs **both in one figure**.

---

## North star

| Reference | Role |
|-----------|------|
| `Desktop/tree/tree complete.png` | Full botanical ink tree — dense crown, thick trunk, roots under a ground line, fruit in the canopy. **Primary visual goal.** |
| RUE2 `roots.js` + root-stage poster | Underground craft: ribbons, forks, hair rootlets, A1→C1 depth. **Grammar half.** |
| RUE3 growth-stage poster (`Poster_Tree-Growth-Stages_RUE3_2026-07-20.pptx`) | Sapling → mature stages as teaching story. **Level skeleton.** |

**Combined rule:** one SVG scene — grammar = roots below soil, vocab = trunk + branches + leaves/fruit above. Not two maps.

---

## Decisions (2026-08-10)

| Topic | Decision |
|-------|----------|
| **Ship order** | Fix C1 scale + light polish now; full redesign as a planned pass (not a mid-lesson rewrite). |
| **North star art** | `tree complete.png` density and silhouette. |
| **Tech** | **All SVG / code**, live, progress-driven. No big photo assets as the primary tree. Stage PNGs only if a later experiment needs them. |
| **Growth model** | **Level sets skeleton** (A1 shallow/small → C1 deep/full). **Fruit thickens and lights** limbs (opacity, stroke width, leaf/fruit knots). Same spirit as RUE2. |
| **Interaction** | **Soft map:** click focuses a path unit; **list / Do next stay primary**. Tree is atmosphere + quick jump. |
| **Palette (near term)** | Keep **cyan/blue sketch language**, just denser geometry. Long-term may warm the trunk while roots stay cool lab-blue. |
| **This pass deliverable** | This doc + C1 preset fix (+ soil-dot scale on presets). |

---

## Level skeleton (target proportions)

Sketch of intent (exact numbers live in `LEVEL_PRESETS`):

| Level | Feel | Roots | Canopy |
|-------|------|-------|--------|
| **A1** | Young sapling | Shallow, few forks, no hair | Small crown, few house seats lit |
| **A2** | Taller sapling | Deeper, first forks | Wider twigs |
| **B1** | Young tree | Web forming | Denser houses |
| **B2** | Growing full tree | Deep system | Full seat set active |
| **C1** | Mature system | Deepest, densest rootlets | Largest crown — **must exceed B2** |

Progress never shrinks the skeleton; it only **fills** it.

---

## Domain mapping (unchanged product meaning)

| Tree part | Domain | Today’s seats |
|-----------|--------|----------------|
| Tap + laterals (Forms, Verbs, Sentence, Chunks, Linking) | Grammar | `tree_part` / foundation on grammar nodes |
| Trunk + house branches (Home, Food, …) | Vocab | `HOUSES` in `tree-portrait.js` |

Future denser drawing must **preserve seat ids** so progress wiring stays valid. Prefer richer paths over renaming `tree_part`s.

---

## Interaction contract

- Click knot / label → focus that unit (if live + has id); do **not** replace Topics / Do next.
- Dim / planned seats stay visible as ghosts so the full model is always readable.
- Mobile: tree is secondary; list remains usable without the portrait.

---

## Implementation roadmap

### Done / near-term (class-safe)

- [x] Document vision (`docs/TREE-VISION.md`)
- [x] Add **C1** `LEVEL_PRESETS` so C1 ≥ B2 in size
- [x] Level-driven soil texture count
- [ ] Optional light density polish on current cyan paths (still sketch language)

### Next redesign pass (full cool tree)

1. **Port underground craft** from RUE2 `roots.js` (ribbon strokes, secondary forks, hair, level presets) into rue-exp under the same soil line — keep seat → unit mapping.
2. **Rewrite canopy** toward `tree complete.png`: tapered multi-branch crown, leaf clusters, fruit dots; houses remain semantic seats, not just stick labels.
3. **Unify palette** once both halves exist (still dark UI): cool roots, slightly denser cyan canopy first; optional warm trunk later.
4. **QA:** A1 empty, A1 half-fruit, B2 full, C1 full — C1 always visually largest skeleton; fruit only enriches.

### Explicit non-goals (for now)

- Hard G→V locks on the portrait
- Replacing list navigation
- Hosted art pipeline / licensed photos
- Per-student tree skins

---

## File map

| File | Role |
|------|------|
| `js/tree-portrait.js` | Live sapling portrait (edit here) |
| `css/app.css` | `.tree-portrait*` layout |
| `js/app.js` | Calls `renderTreePortrait` with nodes + progress |
| `docs/TREE-AND-CODEX.md` | Codex / tree id relationship (separate concern) |
| `../rue2-grok-v1.0/js/roots.js` | **Read-only reference** for root craft |
| Desktop `tree/tree complete.png` | Visual north star (not in repo yet) |

---

## Acceptance when “cool tree” ships

1. At a glance: **one tree**, roots + crown, not a diagram of sticks.  
2. **C1 skeleton > B2 > … > A1.**  
3. Fruit visibly thickens / lights the right limbs without changing topology.  
4. Soft click still works; Do next remains the lesson path.  
5. Cyan/blue denser language first; no requirement for full-colour storybook unless James reopens palette.
