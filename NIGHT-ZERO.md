# NIGHT ZERO — gates before content

**Status: READY** · branch `night/gates-zero` · orchestrator reads this, then runs.

Goal: port the RUPL quality machinery to RUE so every later content night runs
against real machine gates. **No content authoring tonight.** Model source:
`../rupl-exp/codex/` (sequencing/audit.py, make_pool.py, verify_pack.py,
SEQUENCING.md) — adapt, don't copy-paste Polish assumptions.

## Deliverables (priority order — stop cleanly wherever dawn lands)

1. **Local node registry** — remove the last lab dependency: `--rebuild-tree`
   currently reads frozen `rue-auto/grammar` + `rue3-exp` `tree.json` for node
   definitions. Move node lists into `rue-exp/data/` (e.g. `nodes-grammar.json`
   + `nodes-vocab.json`), rebuild `tree.json` from them + `spine.json` only.
   Result must be byte-stable against the current committed `tree.json`.
2. **Pack lint (`codex/verify_pack.py` equivalent)** — schema check for every
   pack in `data/*/blocks/`: `en`/`cz` present, **no `pl` fields**, gap items
   reconstruct (`gap` + `gap_answer` ⊆ `en`), `accepts` well-formed,
   `default_direction: cz_to_en`, ids unique, block/tree cross-links resolve.
3. **Pool generator (`make_pool.py --before <node>`)** — position-aware taught
   pool from the per-level paths in `tree.json`. Position-aware is mandatory:
   the RUPL whole-course pool caused real ordering bugs.
4. **Sequencing auditor (`audit.py` skeleton)** — for each spine step: every
   token in a pack's items either sits in the pool before that node or is
   declared by the pack itself. Report-only tonight (JSON + md report into
   `audit/`); gate hard-fails come later once James sees the false-positive
   rate. Known blind spot to document, not solve: homographs (string match ≠
   meaning match).
5. **Harden `scripts/smoke.py`** — fold in the pack lint, tree/pack
   cross-check, and per-level path integrity (no dangling node ids).

## Rules

- All AGENTS.md night-shift rules apply: one file per agent, orchestrator
  wires/audits/commits, `night/gates-zero` only, never `main`.
- Tooling lives in `rue-exp/codex/` (mirror rupl-exp layout) — Codex-First:
  unit identity comes from `../rue-codex` `G_*`/`V_*`; never invent ids.
- Each deliverable proves itself against the **current live packs** (154
  committed blocks) and reports counts, not adjectives, in the digest.
- Finish with `NIGHT-DIGEST.md`: what landed, gate results on today's content
  (expect real findings — e.g. A1/A2 sequencing violations), forks as
  dropdown-ready questions, and the recommended first content-night batch.
