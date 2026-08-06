# Agent rules — rue-exp (unified RUE)

## Product

| | |
|--|--|
| **Folder** | `projects/rue-exp` |
| **Role** | Merge shell: grammar + vocab zigzag (like `rupl-exp`) |
| **Port** | 8097 |
| **Progress** | `rue-exp-progress` only |
| **Lab grammar** | `../rue-auto/grammar` |
| **Lab vocab** | `../rue3-exp` |
| **Do not overwrite** | `rue2-grok-v1.0` student site without explicit promote |

## Do

- Edit spine pairs in `data/spine.json` (`grammar` / `vocab` sides)  
- Run `py scripts/sync_from_stable.py` after pack or spine changes  
- Keep dual engines; do not invent a third practice system  
- Soft path only (no hard G→V locks unless James asks)

## Don’t

- Write to `rue2-exp-progress` or rue3 progress keys  
- Retire RUE2/RUE3 stable apps  
- Force-push Pages without human OK  

## Smoke

```powershell
cd C:\Users\ADMIN\documents\projects\rue-exp
py scripts\sync_from_stable.py
py -m http.server 8097
```
