# Tree portrait — visuals brief for claude.ai

*Paste this whole file into claude.ai. It is self-contained. 2026-08-29.*

You are mocking up **visual polish** for the tree portrait in **rue-exp**, a
vanilla-JS English-learning app for Czech students. The tree is a status
portrait: grammar lives **below the soil** as roots, vocabulary **above** as
trunk + branches. You produce **mockups only** (an HTML artifact with inline
SVG) — no app code, no libraries, no external assets. The real renderer is a
seeded procedural SVG; your job is to explore how its *states and growth*
should read, inside locked rules.

## The organism (locked — do not redesign)

One tree, five ages. The same seeded skeleton renders at every CEFR level;
a level shows an **age** of it. Nothing re-randomises between levels, so
A1 → C1 reads as one tree growing.

| Level | Age | stem × girth of full |
|--|--|--|
| A1 | Sapling — one stem, first leaves | 0.40 × 0.11 |
| A2 | Young tree — first limbs | 0.56 × 0.24 |
| B1 | Growing — limbs branching | 0.72 × 0.45 |
| B2 | Filling out — full crown forming | 0.88 × 0.74 |
| C1 | Mature tree — full system | 1.00 × 1.00 |

**Below soil — grammar.** One central **tap root** ("Foundation") + exactly
**six laterals**. Never a seventh:

Forms · Verbs · Sentence · Linking · Verb patterns · Prepositions

**Above soil — vocab.** Trunk (core/glue vocab) + **twelve houses** as
branches: Self & body, Communication, Creativity & love, Partnerships,
Knowledge & travel, Community (left) · Money, Home & family, Work & routine,
Change, Public life, Inner life (right).

**Canvas:** dark. viewBox 860×1100, soil line at y=700, trunk at x=430.
Per-level crop zooms the young tree (A1 at most 2.2×) so growth stays visible.

## Palette (locked hexes)

```
wood           #569cd6   (blue — trunk, roots, unlit knot stroke)
wood remembered#3d72b0   (seat limb/root after ≥1 review)
wood mastered  #2a5388   (seat limb/root after ≥4 reviews)
leaf/cyan      #4db6c7   (leaves, unfilled fruit outline, "started")
learned        #22c55e   (green fruit/knot fill + small glow)
remembered     #4ade80   (brighter green + glow)
mastered       #86efac   (fullest green + strong double glow)
label          #d4b070   (gold — active labels)  dim #8a8a8a  muted #7a7a7a
sky #0a0a0a   soil #0c1014   soil-top #121820   knot bg #0c1014
ghost opacity 0.3
```

## Light rules (locked semantics)

- A seat (lateral root or house) shows up to **6 knot/leaf slots**. Slots are
  a *summary*, not 1:1 with topics. Empty/ghost units **never steal** a lit
  slot: lit count = share of *started* work, mapped onto the slots that exist.
- Ladder per slot, **strongest first**: started (cyan outline) → learned
  (green fill) → remembered (brighter + glow, ≥1 successful review) →
  mastered (fullest + stronger glow, ≥4).
- **Wood is a second channel** (James, 2026-09-02): fruit/knots stay the
  brighter greens. The seat’s bark goes darker at remembered, darker again
  at mastered (house limb or that root). Shared trunk darkens/thickens only
  from trunk-glue + word-craft reviews, saturating — not from every house.
- Seats with no live material at the viewed level render as **ghosts**
  (opacity 0.3), still present so the skeleton stays whole.
- Lights show work **at or below** the viewed level. Progress never shrinks
  the skeleton; it only fills it.

## What to mock up (your actual task)

Build **one HTML artifact**, dark background, three panels side by side:
**A1 sapling · A2 young tree · B1 growing tree** — the same tree at three
ages, as if one student climbed the level rail. Hand-drawn SVG approximating
the geometry above is fine; it does not need to be procedurally exact.

Explore and show:

1. **Growth legibility** — does A1 → A2 → B1 read as *one organism aging*?
   How should the crop/zoom hand over between ages?
2. **The green ladder at small sizes** — learned vs remembered vs mastered
   on tiny knots: do the three greens + glows separate clearly? Show a legend.
3. **Roots vs canopy balance** — grammar knots below, vocab leaves/fruit
   above: where does the eye go first? Should soil-line treatment change?
4. **Ghost reading** — one panel should include ghosted seats (e.g. B1 view
   where Linking has no started work): do ghosts read as "future", not "off"?
5. **One caption line** per panel — the map copy that tells the student the
   picture follows the level rail (e.g. "Your tree at B1"). Propose wording.

## Hard boundaries

- **No 7th root, no new houses, no renaming seats.**
- **No 1:1 topic knots** — slots stay a capped summary.
- **No house-coloured washes**; palette above is the palette. If you believe
  a colour/rule/element must be added, render it in a clearly separated
  section titled **PROPOSAL** with one sentence of rationale — James decides.
  Never blend proposals into the main panels.
- Meters (Learned / Remembered / Mastered) live elsewhere in the app; do not
  add gauges, percentages, or progress bars to the tree itself.
- Static mockup only: no login, no data, no interactivity beyond hover if
  useful.

Deliver: the three-panel artifact + legend + captions, then a short list of
what you'd change in the real renderer, each item ≤ 2 lines.
