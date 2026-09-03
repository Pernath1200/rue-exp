# Level checks — plan (2026-08-30)

Live now: **`a1_vocab_match`** (timed 6-pair EN↔CZ), **`a1_vocab_type`** (untimed CZ→EN, 12 at a time), **`a1_grammar_match`** (Which is correct?), **`a1_grammar_type`** (cloze type-in), and **`a1_finale`** (Use on everything). Match/type checks: no fruit; Do next skips them. Finale: last on A1, can fruit **this node only**.

Fruit stays **Use only**. Match/type are checks, not lessons (`fruit: false`, Do next skips them). The finale is the Use check.

---

## 1. Vocab type-in — live (`a1_vocab_type`)

**Job.** Martin can match A1 words; he cannot yet type them. Same pool as match, harder door.

**From his HTML.** No clock. Czech on screen, write the English. Twelve at a time. Recap (✓ / ✗, “you wrote”). Misses go on a trouble list and come first next time. One-letter typos forgiven unless the typo is a *different real word*, and unless they typed the Czech.

**In the app.**

| | |
|--|--|
| Id | `a1_vocab_type` (James 2026-08-30) |
| Codex | `V_COR-A1B1-01` |
| Pool | Same runtime pool as match (`loadA1VocabPool`) |
| Filter | **Drop frame sentences.** Keep *ice cream* / *next to*; drop *I am a student.* Rule: no `.?!` on the English, at most three tokens. Match can keep sentences; type-in cannot — that is Use. |
| Prompt | Czech → type English (CZ→EN contract) |
| Clock | Off |
| Pass size | 12 |
| Trouble | **Share the match sprint key** so words he mismatched show up here first. Recap has **Practice N words** (this round’s misses + leftover, max 12). Right twice in a row and the word leaves the log. Same button on the match recap. |
| Fruit | None |
| Chrome | RUE, same splash / recap family |
| Grading | App vocab Type rules (synonyms, contractions) plus the HTML’s cognate trap: *mobil* is not *mobile* |

**Not** the teaching Type stage inside `leaf_home_family`. No intro cards. No Quiz. Topic dropdown: Whole A1 / one leaf (same as match).

**Build shape.** `js/vocab-sprint.js` (`practice: "type_sprint"`). Node last on A1 after `a1_vocab_match`. Play: `http://localhost:8097/#a1_vocab_type`.

---

## 2. Grammar matching — live (`a1_grammar_match`)

**Job.** Easy grammar check. Vocab match works; gap↔form match did not (parked 2026-08-30). The desk/table item was A0: *in* and *under* are both English when you strip the picture and the Czech.

**Which is correct?** Three full English sentences, tap the good one. B21. No pairing, no Czech, no picture.

Clock **off by default**, optional on (same as the finale). Recap. **Practice N** on misses (same 3-choice quiz, leftover trouble, max 12, retire after 2 in a row). After each tap: pack explanation + link to the teaching unit. No fruit. Do next skips it.

**Pool.** Rebuild the three sentences from smoked A1 gap items: correct = `en`; two wrongs = `en` with the gap filled by a *clearly impossible* quiz chip (not another possible preposition). Skip `diagram` items (place in/on/under). Skip if two chips would both be real English (articles, who/what, Can/Does, have/had, likes/liked, Yes I can/do, there is/it is, are/aren't, sentence-initial *to go*, possessives, frequency, some/any).

**Id.** `a1_grammar_match` revived as this quiz. Do not invent a second id unless James wants a clean name (`a1_grammar_which`).

Play: `http://localhost:8097/#a1_grammar_match`.

---

## 3. Grammar type-in — live (`a1_grammar_type`)

**Job.** Medium grammar check. Cloze, not Use.

**From the vocab type-in.** No clock. 12 items. Recap. Trouble list from grammar-match misses first. **Practice N** on misses (same cloze, leftover trouble, max 12, retire after 2 in a row). After each Check: pack explanation + link to the teaching unit.

**Prompt.** The **gapped English** plus the Czech support line the Type stage already shows. Student types the gap, not the whole sentence. Stem cue in brackets stays (B11). That is the Clozemaster slice: pooled Type items from A1 grammar, not a new bank.

**Not** CZ→EN whole sentence. That is Use (combined vocab+grammar, later, **with fruit**).

**Pool.** Same gap items as grammar match. Filter: one degree of freedom (A0). If Czech does not pick the form, the English stem must. Skip diagram / place in-on-under, `a1_word_classes`, check-units.

| | |
|--|--|
| Id | `a1_grammar_type` (James 2026-08-30) |
| Codex | `G_SS-A1B1-01` |
| Practice | `grammar_type_sprint` |
| Clock | Off |
| Pass size | 12 |
| Fruit | None — Do next skips it |

**Grading.** Existing grammar Type (`practice-grammar.js` / `_gradeGrammar`), including contractions (A8) and if/when (A1). Do not invent a second grader.

Play: `http://localhost:8097/#a1_grammar_type`.

---

## Order and what waits

```
now     a1_vocab_match          live
now     a1_vocab_type           live
now     a1_grammar_match        live (mixed A1, G_SS-A1B1-01)
now     a1_grammar_type         live (cloze, G_SS-A1B1-01)
now     a1_finale               live (Use on everything, after cloze)
```

---

## 4. A1 finale — Use on everything (live, `a1_finale`)

**Job.** Last A1 check. CZ → full English sentence. Pool **everything** that already has a Use sentence: A1 grammar Use items with `cz`+`en`, and A1 vocab `sentences[]`. Diagnostic + gym. Fun to return to for reps.

**Not.** Error-correction (that stays in teaching units). Not a silent “pass A1, skip the path”. Not English↔Czech match.

**Filter (start screen).** Whole A1 · Grammar only · Vocab only · one unit (any live A1 teaching node). Whole A1 is the finale. The rest is extra practice.

**Clock.** Off by default. Optional on, for a later gym run.

**Round.** 12 sentences. Retry misses until that round is clean (same spirit as Exam Practice). First-try misses are the diagnostic, even if they then get them right.

**After the round.** Recap in two blocks — **Grammar** / **Vocab** — grouped by source unit, with a deep link (`#a1_articles`, `#leaf_home_family`, …). That’s the highlight: where to work next.

**Fruit.** Whole A1 run, round cleaned → fruit **this node only**. Filtered runs never fruit. Do **not** light other A1 knots. They fruit when the student actually does those units.

**Do next.** This node is last on the A1 path and **is not skipped** (unlike match/type). Walking A1 ends here. Filtered practice is from Topics / the recap links.

**Hang.** Grammar domain, Sentence · `G_SS-A1B1-01` (same house as grammar match). Vocab sentences still come from vocab packs at runtime.

**Grade.** Existing Use grader (contractions, synonyms, accepts). Do not invent a second one. Skip `use: false` items and empty banks.

**Build.** `js/vocab-sprint.js` (`practice: "use_sprint"`). Node last on A1 after `a1_grammar_type`. Play: `http://localhost:8097/#a1_finale`.

Id `a1_vocab_type` is locked. Frame sentences are dropped on type-in.

**A1 circle:** 60 live. Checks are last on the path.

---

## 5. A2 — same five, not built yet

Clone this file. Proposed ids (stamp with the A2 roster in `A2-PLAN.md`):

`a2_vocab_match` · `a2_vocab_type` · `a2_grammar_match` · `a2_grammar_type` · `a2_finale`

Pool = A2 packs at runtime. Same fruit / Do-next rules as A1. Engine (`js/vocab-sprint.js`) is A1-hardcoded today — generalise to a level, do not fork a second sprint file.
