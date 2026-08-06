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

## Night shift (protocol, from RUPL — 2026-08-06)

Mechanism: James leaves a Claude Code session open in the evening; the main
session is the **orchestrator**, background agents do the work.

- **Branch:** all night work lands on `night/*` — **never `main`**, even though
  no Pages deploy exists yet. Orchestrator commits; agents never run git.
- **One file per agent.** Every RUPL stall was a two-file task; zero failures
  across ~50 single-file agents. Agents never touch `tree.json`, never run the
  auditor — the orchestrator wires, audits and commits centrally.
- **Digest:** orchestrator writes `NIGHT-DIGEST.md` (repo root) before dawn:
  what was built, what passed which gates, open forks as dropdown-ready
  questions. James reads it in the morning; nothing merges without him.
- **Notify:** orchestrator sends a push notification (PushNotification tool)
  when a batch of units lands and when the digest is ready — one line, counts
  not adjectives (e.g. "night: 6 B1 vocab packs landed, 5 pass audit").
  Batch-level only, never per-file noise.
- **Design forks:** agent takes the conservative path, still builds the unit,
  logs the fork in the digest.
- **Verify regardless of self-report.** ~1/3 of fluent "all clean" RUPL agent
  reports hid a real bug. The orchestrator re-checks every unit mechanically.
- **Machine gates before content:** night zero builds the RUE auditor / pool /
  lint (see `NIGHT-ZERO.md`). Content nights only run against real gates.
- Night output = **drafts that pass the machine gate**. James still smokes —
  overnight work never promotes itself to students.

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
