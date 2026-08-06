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

## Automation lanes (2026-08-06, mirrors RUPL)

Two lanes meet on branch **`build`**; `main` moves only when James promotes.

| Lane | What | Branch |
|------|------|--------|
| **Cloud routine "RUE build"** | hourly, claude-opus-5, self-contained prompt: repair → build 2-3 units | `build` |
| **Local sessions** (James + Claude) | judgement work, smoke fixes, design | `build` (promote to `main` = James only) |

Shared rules, from the RUPL build (they all earned their place):

- **Gates before commit** — every commit must pass:
  `py -X utf8 codex/verify_pack.py` (**0 errors**) and
  `py -X utf8 codex/audit.py --check` (**ratchet: violations may never rise**).
- **Pool before authoring** — `py -X utf8 codex/make_pool.py POOL.md --before
  <node>`; only pool-legal + GLUE + same-step partner material in new units.
- **Never invent node ids.** Author packs for registered sketch nodes
  (`data/nodes-grammar.json` / `data/nodes-vocab.json`), flip status there,
  rebuild via `py scripts/sync_from_stable.py --rebuild-tree`.
- **Digest per run** — append to `codex/BUILD-DIGEST.md`: what/why/forks.
  Design forks: conservative path + logged note, never a silent guess.
- **Verify regardless of self-report** — ~1/3 of fluent "all clean" RUPL agent
  reports hid a real bug. Re-check mechanically every time.
- **Engine/shell code**: cloud lane touches `js/`/`css/`/`index.html` ONLY for
  items listed in `codex/REPAIR-QUEUE.md` — content is its lane, the shell is
  James's + local Claude's.
- **Local multi-agent nights**: one file per agent; orchestrator wires, audits,
  commits centrally (every RUPL stall was a two-file agent task).
- **Notify (local sessions)**: PushNotification on batch land + digest ready —
  one line, counts not adjectives. Cloud runs surface in the claude.ai app.
- All output = **drafts that pass the machine gate**. James still smokes —
  automation never promotes itself to students.

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
