# rue-exp · unified English (grammar + vocab)

**RUE2** (grammar) + **RUE3** (vocab) in **one** shell — same pattern as **rupl-exp** (Polish).

| | |
|--|--|
| **Status** | Weekend draft scaffold (2026-08-06) |
| **Port** | **8097** |
| **Progress** | `rue-exp-progress` (local only · never rename lightly) |
| **Sources** | `rue-auto/grammar` · `rue3-exp` via `scripts/sync_from_stable.py` |
| **Spine** | `data/spine.json` — A1 + A2 zigzag; B1–C1 full catalogue paths |
| **Charter** | [CHARTER.md](./CHARTER.md) |

Stable siblings stay separate:

- Grammar lab: `rue-auto/grammar` · student: `rue2-grok-v1.0`  
- Vocab: `rue3-exp`  

## Run locally

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\sync_from_stable.py
py -m http.server 8097
```

Open **http://localhost:8097/** · hard-refresh **Ctrl+F5** after sync.

## What works in the scaffold

- Home: **Do next · Review · Topics · How to use · More**  
- Dual progress (grammar + vocab) under one key  
- Path from A1 spine (≈40 steps G/V interleaved)  
- Map / tree portrait (roots + canopy)  
- Practice entry for both domains (engines ported from rupl — EN polish ongoing)  
- Higher levels on map as coming  

## Sync content

```powershell
py scripts\sync_from_stable.py
```

Copies blocks + rebuilds `data/tree.json` from `data/spine.json`.

## Deploy (when ready)

GitHub Pages → `pernath1200.github.io/rue-exp` · branch `main` · root `/`.

## Weekend goal

Drafted **complete A1 app** by end of weekend; then test, add, improve content.
