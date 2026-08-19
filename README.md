# rue-exp · unified English (grammar + vocab)

**RUE2** (grammar) + **RUE3** (vocab) in **one** shell — same pattern as **rupl-exp** (Polish).

| | |
|--|--|
| **Status** | Canonical working tree · A1+A2 playable · polish before deploy (2026-08-09) |
| **Port** | **8097** |
| **Progress** | `rue-exp-progress` (local only · never rename lightly) |
| **Branch** | `build` (auto) · `main` aligned but **not** student-facing yet |
| **Spine** | `data/spine.json` — A1 + A2 zigzag; B1–C1 catalogue paths |
| **Charter** | [CHARTER.md](./CHARTER.md) |
| **Handoff** | [codex/HANDOFF.md](./codex/HANDOFF.md) — Claude unattended closed |
| **Auto** | `agent-nightly/RUE-AUTO.md` · Grok every ~3h (content polish · no push) |

Students still use **rue2-grok-v1.0** / **rue3-exp** until James promotes after A1+A2 polish.

Frozen archives (never edit / never full-sync from):

- Grammar lab: `rue-auto/grammar` · student: `rue2-grok-v1.0`
- Vocab: `rue3-exp`

## Run locally

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\smoke.py
py -m http.server 8097
```

Open **http://localhost:8097/** · hard-refresh **Ctrl+F5** after pulls.

## What works now

- Home: **Do next · Review · Topics · Exam Practice · Tables · How to use · More**
- Dual progress (grammar + vocab) under one key · download/import
- A1 + A2 full zigzag paths; B1–C1 browse when `live`
- Grammar ladder wired via `pack-adapt.js` (Match · Quiz · order_click · Type · Use)
- Word formation (FCE/CAE Part 3): `root_word` mode · B2 + C1 packs · B1 affix pair
- **Exam Practice** (`exam-drill.js`) — pooled word-formation reps, rounds of 12, wrong items retried; untracked (no fruit, never in Do next)
- **Tables** (`reference.js`) — level-grouped reference tabs with free drills; untracked, table hides mid-drill
- Vocab: picture-led intros + Use `sentences[]` on **all A1/A2 leaves**
- Machine gates: `verify_pack` · `check_playable` · `audit --check` · `check_codex` · smoke

## Rebuild tree (after spine / node registry edits)

```powershell
py scripts\sync_from_stable.py --rebuild-tree
```

## Continuous improvement (Grok)

```powershell
cd C:\Users\ADMIN\documents\projects\agent-nightly
.\run-rue.ps1 -DryRun
.\install-scheduled-task-rue.ps1   # every 3h, staggered
# Pause: set RUE-AUTO.md Status to OFF
```

See **agent-nightly/RUE-AUTO.md**. Local commits only · **no push** · no engine.

## Deploy (when James says)

GitHub Pages → when A1+A2 feel lesson-true · not automatic.
