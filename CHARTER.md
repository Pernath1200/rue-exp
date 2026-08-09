# RUE-exp · Charter

**Status:** canonical English app (grammar + vocab) · A1+A2 polish before deploy  
**Folder:** `projects/rue-exp` only  
**Model:** `rupl-exp` (Polish unified app)  
**End state:** full replacement of student RUE2 + RUE3 — new URL + one-time
progress import once lesson-proven. Until James promotes, `rue2-grok-v1.0` /
`rue3-exp` stay live and untouched; labs are frozen archives.

---

## One-liner

One local tree: **teach system** (grammar roots) then **use on themes** (vocab canopy), with a shared A1/A2 zigzag spine and dual practice engines.

---

## Locks (2026-08-06 · refreshed 2026-08-09)

| | Value |
|--|--------|
| Name | **rue-exp** |
| Port | **8097** |
| Progress | `rue-exp-progress` (never RUE2/RUE3 keys) |
| Smoke | `rue-exp-smoke-flags` |
| Architecture | Dual practice modules (`practice-grammar.js` + `practice-vocab.js`) |
| Spine | Soft path · `data/spine.json` steps with `grammar` / `vocab` sides |
| Content | Edit **here only** · labs frozen · no full sync from rue-auto / rue3-exp |
| UI chrome | English |
| Content scaffolding | Czech in packs (as RUE2/3) |
| Visual identity | **RUE2 cyan** `#569cd6` · soft teal success · warm muted wrong |
| Brand bar | **RUE** |
| Domain colour | Subtle G/V chips only (vocab tint `#4db6c7`) · practice chrome stays one accent |
| Levels | **A1–C1 all open** for browse · practice when `live` |
| Topics | Per-level paths: A1/A2 zigzag · B1 G+V catalogue · B2/C1 grammar spines |
| Deploy | Only after **A1+A2 polish + James smoke** · Pages not automatic |
| Font | System UI only |
| Logo | Text-only **RUE** (no image asset) |
| Chrome language | English only (CZ in pack content) |
| Home | Quiet **Learn English** |
| Author / smoke | Like RUE2: author unlock + local flag list |
| Auto lane | Grok `agent-nightly` · content only · **no push** · no engine |

---

## Non-goals (until promote)

- Replace student RUE2 / RUE3 URLs without explicit James go  
- Hard grammar→vocab locks  
- Single mega practice engine  
- Unattended B1 vocab extension (interactive only when resumed)  
- Auto-merge to student-facing deploy  

---

## Run

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\smoke.py
py -m http.server 8097
```

Open **http://localhost:8097/**
