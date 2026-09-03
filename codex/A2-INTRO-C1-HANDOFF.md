# A2 grammar intros — C1 audit (2026-09-02)

Give this file to a **new tab**. Do **not** open `codex/HANDOFF.md` (Claude kill switch).

Paste:

```
Read codex/A2-INTRO-C1-HANDOFF.md then AUTHORING-RULES.md (C1 · C14 · C17 · C18 · C20 · C23 · text_first).
Rue-exp. Port 8097. Progress key rue-exp-progress. Do not invent node ids. Do not tick INSPECTED. Do not start vocab. Do not rewrite until James says after this report.

Job: A2 grammar intro card 0. Structural: what the thing IS before any list. Engine default paints the table FIRST unless text_first: true. James saw a2_possessive_pronouns open on a word list and called it inadequate / user could be lost.

This file is the audit. Adjustments = a later ask. Dropdowns before any rewrite. I8 if he wants a fix now. Ctrl+F5 after edits.
```

---

## Product

| | |
|--|--|
| Folder | `C:\Users\ADMIN\documents\projects\rue-exp` |
| Bar | usable, not perfect |
| Scope | **A2 grammar intros only** (30 packs). Vocab intros are picture boards (C49) — not this job. Skip `a2_grammar_match` / `a2_grammar_type` / `a2_finale` (engine still A1). |

## Do not

- Invent node ids · hand-tick INSPECTED · start vocab · touch `codex/HANDOFF.md`
- Rewrite the whole intro of a smoked unit unless James asks
- Batch-flip `text_first` without reading card 0 (a dump with `text_first` is still a dump)
- Put arrangements back next to present continuous (path moved 2026-09-02)

---

## The issue (James, smoking `a2_possessive_pronouns`)

Card 0 opened on a **Before a noun / Alone** table of *my book / mine / …*. Title was `my book · mine`. Bullets under the table. Nothing said **what these words are**. User could be lost.

**Rules:**

| ID | What it means here |
|----|-------------------|
| **C1** | Card 0 says what the thing **IS**, then the Czech trap. Form-change: name the forms they already know, then the change. |
| **C14** | Card 0 title = unit name + Czech. Not a nickname or a word list. |
| **C18** | Title names the thing, precisely. Not a slogan. |
| **C23** | No *this pack* / *this unit* / *at A2*. |
| **C17 / C20** | No *Remember / Pamatuj* recap. No *Practice focus*. |
| **`text_first`** | Engine (`js/practice-grammar.js`): default is **diagram → table → points**. `text_first: true` is **points → table**. Possessives failed because the table painted first. |

Template that worked (after the flag):

```jsonc
{
  "title": "Mine / yours / his / hers",    // unit name (C14 · C54 person order)
  "title_cz": "Mine / yours / his / hers",
  "text_first": true,                      // definition ABOVE the list
  "points": [
    "These words say **whose** something is.",
    "You already know **my book**. That form needs a noun.",
    "With **no noun**, English changes the word: **This book is mine.**",
    "Czech *moje* does both jobs. English does not."
  ],
  "table": { /* the list comes AFTER */ }
}
```

---

## Render census (card 0)

**16 / 30** A2 grammar card 0s are still `text_first: false` → table first.

**14** have `text_first: true` on card 0: `a2_possessive_pronouns` · `a2_verb_patterns` · `a2_prepositions_movement` · `a2_some_any_no` · plus **ten rewritten 2026-09-02 (I8 worst C1 fails):** `a2_agreement` · `a2_comparatives` · `a2_indefinite_pronouns` · `a2_modals_must_should` · `a2_say_tell` · `a2_adverbs_order` · `a2_countable` · `a2_quantifiers` · `a2_reflexives` · `a2_for_since`.

`a2_simple_vs_continuous` still `text_first: false` — aspect bullets sit **under** the table. Tense timelines: keep diagram-first unless a pack is opened (James, 2026-09-02).

---

## Oriented (keep — maybe only flip `text_first`)

Definition exists in the points. Title is the unit name, or close. Table-first is the remaining bug.

| id | Card 0 | Note |
|----|--------|------|
| `a2_possessive_pronouns` | Mine / yours / his / hers | Smoked 2026-09-02. `text_first`. C53 with-noun vs alone. C54 *his* in title and in I/you/he order. |
| `a2_simple_vs_continuous` | Present simple vs continuous | Aspect defined. **Flip `text_first`.** |
| `a2_past_simple` | Past simple | Finished vs now. Table first. |
| `a2_present_continuous` | Present continuous | This form is **now**. Table first. |
| `a2_present_perfect` | Present perfect | Still true **now**. Table first. |
| `a2_past_continuous` | Past continuous | In progress in the past. Table first. |
| `a2_used_to` | Used to | Past habit, stopped. No table on card 0. |
| `a2_verb_patterns` | Verb patterns 1 | `text_first`. After some verbs, another verb follows. |
| `a2_prepositions_movement` | Prepositions of movement | `text_first`. Where a thing is going. |
| `a2_too_enough` | too and enough | Defines both. Table first. |
| `a2_have_to` | have to | Outside obligation. Thin. |
| `a2_ed_ing_adjectives` | -ed / -ing | Feeling vs cause. Table first. |
| `a2_could_able` | could = past of can | Form-change (can → could). Title ≠ pack name *Can / could (past ability)*. |
| `a2_arrangements` | A plan in the diary | Form-change (PC-now → diary). Nickname title (C14). |
| `a2_indirect_questions` | The question hides inside | Direct vs after *know*. Slogan title (C18). |
| `a2_first_conditional` | What is a conditional? | Two halves. Title ≠ pack name. |
| `a2_articles` | the vs nothing | Zero article for a group/idea. Title ≠ pack name. Pack title still *Articles at A2* (C23). |

---

## Fail C1 — remaining (list / forms first, or IS still missing)

Ten packs rewritten 2026-09-02 (card 0 = unit name + IS + Czech trap + `text_first`). Still open:

| id | Card 0 | What you see |
|----|--------|----------------|
| `a2_some_any_no` | Some / any 2 | `text_first`, but first line is the distribution rule, not what they are. Syllabus title. |
| `a2_will_going_to` | Will / going to | “Two forms. Two jobs.” Has a timeline — case by case. |
| `a2_past_questions` | did carries the past | Form-change is OK; *base* on the card (C31). Table first. |
| `a2_first_conditional` | What is a conditional? | Two halves. Title ≠ pack name. Remember still on. |
| `a2_articles` | the vs nothing | Zero article for a group/idea. Title ≠ pack name. Pack title still *Articles at A2* (C23). |

---

## Recap cards to cut (C17 / C20)

- ~~`a2_countable` — Practice focus + Remember~~ **cut 2026-09-02**
- ~~`a2_comparatives` — Remember~~ **cut 2026-09-02**
- ~~`a2_quantifiers` — Practice focus + Remember~~ **cut 2026-09-02**
- `a2_first_conditional` — Remember (still on)

---

## How to fix (when James says)

Order, per pack, **dropdowns first**:

1. **`text_first: true`** on card 0 if the points already are an IS (the “oriented” table). Seconds.
2. **Rewrite card 0** on the C1-fail table: unit name (C14), what it is, Czech trap, **then** the list/table. Do not start with “You know X”. Do not inventory later cards.
3. **Cut** Remember / Practice focus if that pack is open.
4. `py -X utf8 codex/verify_pack.py data/grammar/blocks/<id>.json` · Ctrl+F5 · `#<id>`.
5. Do **not** tick INSPECTED. Telegram stays James’s.

Do not batch all 30 in one go unless he asks. Path order (grammar), skipping checks:

`present_continuous` → `simple_vs_continuous` → `agreement` → `possessive_pronouns` → `past_simple` → `past_questions` → `past_continuous` → `used_to` → `present_perfect` → `for_since` → `will_going_to` → **`arrangements`** (moved here 2026-09-02) → `modals_must_should` → `have_to` → `could_able` → `comparatives` → `too_enough` → `ed_ing_adjectives` → `countable` → `articles` → `quantifiers` → `some_any_no` → `indefinite_pronouns` → `adverbs_order` → `first_conditional` → `verb_patterns` → `say_tell` → `prepositions_movement` → `reflexives` → `indirect_questions`

---

## Other sitting context (do not reopen unless asked)

This tab was an A2 **grammar smoke**. Related decisions already made:

| | |
|--|--|
| Arrangements path | **After** `a2_will_going_to` + `leaf_work_a2`, **not** after simple vs continuous. PC-now must settle. Spine `data/spine.json` · tree `path_order_a2` · `codex/A2-PLAN.md` updated. |
| SVC intro | Aspect defined; *I'm seeing her tomorrow* **cut** (confuses the unit). |
| Past simple Check | Sort finished / every day / now. Not *visit → visited*. |
| Past simple irregulars | A2 keeps **go / have / see / come / make / get** + **be**. Rest parked — not a B1 dump; V3 three-forms live with present perfect. |
| A2 form-pack Use | **Error-correction** (`use_mode: correct`), not CZ→EN. Live on present continuous, agreement, past simple, simple vs continuous. |
| Past simple Type | Lemma cues `(work)` → *worked*, `(be)` → *were*. English stem forces past (*yesterday / last year / in 2019*). |

Do not mix those jobs into the intro rewrite unless a card you open is already wrong for that reason.

---

## Files

| | |
|--|--|
| Packs | `data/grammar/blocks/a2_*.json` · `"intro": { "cards": [ ... ] }` |
| Render | `js/practice-grammar.js` · `text_first` branch ~line 897 |
| Rules | `codex/AUTHORING-RULES.md` § C |
| Path | `data/spine.json` `steps_a2` · `data/tree.json` `path_order_a2` |
