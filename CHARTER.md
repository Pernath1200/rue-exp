# RUE-exp · Charter (weekend merge draft)

**Status:** active scaffold · grammar (RUE2) + vocab (RUE3) in one shell  
**Folder:** `projects/rue-exp` only  
**Model:** `rupl-exp` (Polish unified app that already works)  
**Does not replace:** `rue2-grok-v1.0` · `rue3-exp` / lab `rue-auto/grammar`

---

## One-liner

One local tree: **teach system** (grammar roots) then **use on themes** (vocab canopy), with a shared A1 zigzag spine and dual practice engines.

---

## Locks (2026-08-06)

| | Value |
|--|--------|
| Name | **rue-exp** |
| Port | **8097** |
| Progress | `rue-exp-progress` (never RUE2/RUE3 keys) |
| Smoke | `rue-exp-smoke-flags` |
| Architecture | Dual practice modules (`practice-grammar.js` + `practice-vocab.js`) |
| Spine | Soft path · `data/spine.json` steps with `grammar` / `vocab` sides |
| Content sync | `scripts/sync_from_stable.py` ← `rue-auto/grammar` + `rue3-exp` |
| UI chrome | English |
| Content scaffolding | Czech in packs (as RUE2/3) |
| Visual identity | **RUE2 cyan** `#569cd6` (not RUPL copper) · soft teal success · warm muted wrong |
| Brand bar | **RUE** |
| Domain colour | Subtle G/V chips only (vocab tint `#4db6c7`) · practice chrome stays one accent |
| Levels | **A1–C1 all open** for browse · practice when `live` |
| Topics | Per-level paths: A1/A2 zigzag · B1 G+V catalogue · B2/C1 grammar spines (+ sketches) |
| Deploy target | Public repo `Pernath1200/rue-exp` · Pages this weekend when smokeable |
| Font | System UI only |
| Logo | Text-only **RUE** (no image asset) |
| Chrome language | English only (CZ in pack content) |
| Home | Quiet **Learn English** |
| Author / smoke | Like RUE2: author unlock + local flag list |

---

## Non-goals (weekend)

- Replace student RUE2 / RUE3 URLs  
- Hard grammar→vocab locks  
- Single mega practice engine  
- Import old RUE2/RUE3 progress into this key  
- Perfect EN strings in every practice sub-screen (PL leftovers OK short-term)

---

## Sync

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\sync_from_stable.py
py -m http.server 8097
```

Open **http://localhost:8097/**
