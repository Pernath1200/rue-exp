# HANDOFF — unattended work is OFF (2026-08-10)

**This file's existence is the kill switch.** Both cloud routines check for it
at step 0 and exit immediately without doing anything. It was deleted earlier
today by mistake and is restored deliberately.

**James's standing rule, 2026-08-10: manual edits only.** No cloud routine, no
cron, no background agent lane. Credits are the binding constraint — two days
of automation consumed ~40% of the overall allowance and >50% of Fable, and
running out means losing access to Claude for lessons, invoicing and everything
else. **Do not delete this file. Do not re-enable any routine.** If automation
ever looks like the right answer, say so and stop — James arms it himself at
claude.ai/code/routines.

Both routines are also **disabled** at the scheduler as of 2026-08-10 12:02
(`trig_019uhrW8FmRi5SmgTndG9JCU` build, `trig_01HunW8eDvCibPB4imEPuJUY` Czech
review). Two layers: disabled there, no-op here.

## State at stop

Everything from the previous terminal handoff (cloud run 36, 2026-08-09) still
stands and is in git history at commit `0914b98` — read it there if you need
the full picture. Its Czech authoring rules were extracted to
`codex/CZECH-TRAPS.md` so they survive independently. What changed since:

- **Q1 (the Oxford coverage anomaly) is CLOSED** — measurement-tier artifact,
  not a regression. Verdict in `codex/OXFORD-REMEASURE.md`. B1 extension
  re-scoped to ~498 words (tier B) rather than the old inflated 336.
- **Per-student progress shipped** — `rue-exp-progress:<profile>`, picker in the
  util-bar, bare-key data migrated to `me`. See AGENTS.md.
- **Two automation runs landed on `build` before the stop**: `b1_work` and
  `b1_money` dressed (intro + Use bank each), `trunk_core_b1` intro, plus a
  Czech review pass (0 fixes, 1 flag). **`build` is 6 commits ahead of `main`
  and unreviewed** — James's call whether to keep or discard.
- `codex/LESSON-READY-PLAN.md` describes the remaining work. **Its Phase 1
  automation lanes are cancelled**; the content scope stands as a manual
  to-do list.

## Remaining work (manual, whenever James chooses)

4 B1 leaves + 2 B1 trunks still undressed · 13 A1/A2 trunk intros · ~117 B1/B2
sequencing leads · B1→C1 grammar never human-smoked · hyphen/non-ASCII
tokenizer fix (James-only by policy). All detailed in
`codex/LESSON-READY-PLAN.md`.
