# Decisions queue

Questions from the B1 agent loop that need James, and his answers. The queue is a
file so it survives a closed laptop: an agent writes here and keeps working, James
answers from any machine or from his phone, the next run picks the answers up.

**Agents:** append under **Open**. Always propose a default and state what you
will do if it goes unanswered — then do that and carry on. Never wait.

**James:** answer by editing the `→` line. Move the whole block to **Answered**
when it is dealt with, or leave it and an agent will move it once applied.

Format:

```
### <unit_id> · <rule id or topic>
**Q:** one sentence.
**Options:** a / b / c
**Default if unanswered:** a — and why.
→ (James: your answer here)
```

2026-09-05: James answered the whole queue by dropdown in the B1 smoke tab.
Blocks below moved to **Answered** with what was applied. Three entries stay open.

---

## Open

### B27 · which other packs lean on the Czech to say "this is past"?
**Q:** `b1_past_modals` needed 17 of 21 cues marked `/ past` — nothing in the English said the sentence was past. Is that unit-specific or a class? A sweep for past-form answers whose stem has no past anchor returns **171 items in 14 packs**, but most are noise: the conditional and wish packs (`b2_second_conditional` 40, `b1_wishes` 13, `b1_second_conditional` 8) use a past FORM for unreal time, not past time; `a2_used_to` / `b1_used_to` / `b1_be_used_to` (57 between them) carry the past in *used to* / *would* itself; the agreement and tag packs (15) are matching *was* / *were* to a subject, not choosing a tense. Nothing there needs a marker.
**Options:** a) leave it at `b1_past_modals` and treat B27 as a rule to apply when a unit is next played / b) hand-check the two packs the sweep leaves standing — `b1_reported_speech` (9 items) and `b1_past_continuous_2` (8) — where the tense really is the choice / c) try to make the sweep precise enough to enforce.
**Default if unanswered:** a. (c) is not worth it: the sweep cannot tell an unreal past from a past-time past without knowing what each unit teaches, which is the pack note's job, not a regex. (b) is a cheap 20-minute look if you want it before you play either unit.
→ (James: your answer here)

### b1_past_modals · the Use stage has the same hole, and the cue cannot reach it
**Q:** The `/ past` markers fix Type and Quiz, where the bracket is on screen. Use shows only the wrong English sentence — no cue, no Czech — so *He mustn't work on Saturday.* and *My son must study all weekend.* are still real English sentences the student is asked to correct (E9). The tense there can only come from the sentence.
**Options:** a) anchor those sentences — a one-word edit on most (*on Saturday* → *last Saturday*, *all weekend* → *all last weekend*), which changes `en` / `cz` / `accepts` / `wrong` on the affected items / b) show the Czech in fix-mode Use as a support line, the way Type already does / c) drop those items from Use (`use: false`) and let Quiz carry the meaning contrast.
**Default if unanswered:** a when you next play the unit — it is the only fix that makes all three stages honest, and four items in the pack already do it. Not done now: your brief was accepts, cues and UI, and this rewrites sentences on a pack you have smoked three times. (b) is a one-line engine change but weakens Use everywhere else, which is the stage that exists precisely because you cannot check the Czech.
→ (James: your answer here)

### lint.py · two cue checks are ready to land, and one of them lights up protected A2
**Q:** B26 (negative answer, no negative in the cue) and B25 (the gap answer is the bracketed phrase copied out) are both cheap regex checks. Measured over all 240 packs: B26 hits **29 items in 7 packs** — `b1_question_tags` ×9 are false (a negative tag is the point, so tag packs need the same exemption A8's `TAG_AFTER` already has), `b1_reported_speech` ×3 are false (their cues say *negative* / *won't*), leaving 6 in `a2_used_to`, 7 in `a2_present_perfect`, 1 each in `a2_past_continuous` and `a2_will_going_to`, and 0 in B1 now that `b1_future`'s four are fixed. B25 hits **2 items**, one of which is `a2_have_to`. So landing either check turns protected A2 packs red.
**Options:** a) land both as EXACT with the tag/cue guards, accept that A2 lights up, and leave those items alone as a recorded standing class / b) land them as CANDIDATE so they report without counting against the loop's gate 1 / c) do not land them; the rules stay prose in AUTHORING-RULES.
**Default if unanswered:** c — nothing added to `lint.py` this pass. Adding an EXACT check that reddens A1/A2 mid-flight is exactly the kind of thing that stalls the other tab, and the sweep above is already the answer to "how much debt is behind this": about fifteen real items, all on packs you have ruled off limits.
→ (James: your answer here)

### b1_be_used_to · it sits directly after *would for past habits*, which you say compounds the confusion
**Q:** Your flag 2: *"its place directly after used to / would for past habits could make this more confusing."* `category_seq` 15 is `b1_used_to` (would), 16 is `b1_be_used_to`. Fixed inside the pack instead: card 0 now says *"**Not** the past-habit *used to* — that one is over. This one is **now**"*, and the *used to · be used to* contrast card moved from position 3 to position 1 (your flag 3). Moving the unit itself is a `tree.json` / `path_order_b1` change and that file belongs to the other tab.
**Options:** a) leave the adjacency — the contrast is sharpest while the past-habit unit is fresh, now that the intro names it / b) move `b1_be_used_to` later in `path_order_b1` so the two are not consecutive.
**Default if unanswered:** a — nothing done to the path. Replay the intro before ruling; the two cards may already have closed it.
→ (James: your answer here)


### The loop · two runs of this routine were live at once
**Q:** On 2026-09-04 two cloud runs of the B1 agent loop were working `b1/auto` at the same time. Both picked `b1_be_used_to` (the first `- [ ][ ]` row in path order at that moment) and authored it independently; the second landed over the first. Should the loop keep taking the first unit in path order when it cannot see what another run is inside?
**Options:** a) leave the contract alone and accept the occasional duplicate — the loser's work is simply thrown away / b) let a run that detects a live sibling (a push on `b1/auto` within the last few minutes) work the roster from the **tail** instead, so the two meet in the middle / c) make the loop claim a unit by pushing an empty marker commit before it starts.
**Default if unanswered:** b — done for the rest of this run. After the collision, this run took `b1_prepositions_time_2` (last unworked row in `path_order_b1`) and then `b1_cause_concession`, working backwards, and there were no further collisions. This is a deliberate deviation from "lowest first" in AGENT-LOOP.md and the only one made. It costs nothing pedagogically — every `[ ][ ]` unit still gets done — but it means the units nearest the front of your play order are the fast run's work, not this one's. (c) is the proper fix if two runs are meant to be normal; if they are not, the thing to fix is the schedule, not the loop.
**Two more collisions, from the other run:** `b1_cause_concession` (10→24 here, 10→25 there) and `b1_degree_adverbs` (12→27 here, 12→36 there). Working from the tail did not prevent them, because the other run was working the head and reached the tail too. The cheap version of (c) that needs no new file: **read `git log b1/auto` before picking, and skip any unit already named in a commit subject there** — the branch log is already the record. On `b1_cause_concession` the second run dropped its own commit and kept what had landed. On `b1_degree_adverbs` the two were **not** equivalent, so nothing was thrown away — see the next entry.
→ (James: your answer here — not covered by the 2026-09-05 dropdowns. The branch-log check (skip units already named in `git log b1/auto` subjects) is the standing default until you rule.)

### b1_relative_clauses · 36 Czech prompts gained *ten / ta / to*, on a unit you have played
**Q:** Your standing answer on A4 says "where the Czech can carry a demonstrative naturally, adding one is the better fix". On this pack that is 36 of 66 items, because a Czech noun with a restrictive relative clause takes *ten/ta/to* as a matter of course (*Ta kniha, kterou jsem koupil…*). It took A4 from 42 to 1. Is that too much churn on a unit you have already smoked?
**Options:** a) keep it — the demonstrative is what licenses `the`, and the generic plurals (*Lidé, kteří pracují v noci*) deliberately stayed bare, which is exactly where the English has no article, so the pack now teaches the contrast instead of hiding it / b) revert the demonstratives and let A4 stand lit at 42 / c) keep them only on the where/when/why items.
**Default if unanswered:** a — done this run. It is one mechanical pass to reverse if you dislike it: the commit touches only the `cz` field on those items. Seven prompts in the same commit were rewritten for a different reason and must **not** be reverted — *Klíče na stole*, *Autobus do Brna*, *Obchod s nářadím*, *Most z roku 2010*, *Cesta k řece*, *Takhle jsem to udělal*, *Líbí se mi, jak pracuje* carried no relative clause at all, so no translator produced the English the item demanded (A0).
→ (James: your answer here — not covered by the 2026-09-05 dropdowns. Default (a) stands; judge the Czech when you replay the unit.)

### a2_misc · sentences[51] frame gaps nothing (B24) — but A2 is off-limits
**Q:** The new B24 check (2026-09-05) found one frame the B1 loop was forbidden to fix: `a2_misc` sentences[51] has no lemma that matches its own `en`, so that word silently has no Quiz and no Type item. A1/A2 are done and off-limits — does that cover a one-frame repair of a silent fault?
**Options:** a) fix the one frame (mechanical; restores the missing Quiz/Type item, no content judgment) / b) leave it — A2 stays untouched, the warning stands as the record.
**Default if unanswered:** b — the off-limits rule is yours and this is the only A1/A2 hit the check found.
→ (James: your answer here)

---

## Answered

### b1_used_to / a2_will_going_to · the *Modal verbs N* series had holes at 2 and 6
**Q:** Both packs sit in **Time and Tenses** and both were titled *Modal verbs N*. James, smoking `b1_used_to`: *"is this time and tenses or modal verbs? I thought it was time and tenses. if so, titles in this section are wrong."*
→ **Retitle both, then renumber the rest 1–6 (James, 2026-09-05).** Applied. `b1_used_to` → **Would for past habits**, `a2_will_going_to` → **Will / going to** — the labels `nodes-grammar.json` already carried. The remaining six renumber in path order, EN and CZ card titles together: `a2_modals_must_should` 3→2, `a2_have_to` 4→3, `a2_could_able` 5→4, `b1_past_modals` 7→5, `b1_modals_speculation` 8→6. `a1_can` stays 1. The series is unbroken again and no unit is titled for a category it does not sit in. `INSPECTED.md` still prints the old titles; it is generated, so the next `reconcile_inspected.py` picks them up — do not hand-edit it.

### b1_be_used_to · does one exercise test form and use together?
**Q:** *Ondrej ____ used to his new schedule. (get)* — James, smoke flag 4: *"this just tests form, not use. wonder if I should do both in one exercise. think about this and then ask me."* The pack's third block (used to vs be used to) already tests use; the **be vs get** block did not — every gap there was a form of *get*, so nothing asked *am used to* against *am getting used to* on meaning alone.
→ **(a) Keep the axes apart and fill the hole (James, 2026-09-05).** Applied: two Quiz-only minimal pairs at items 21–22, same noun, only the situation moves — *After ten years here, I ____ the noise* → **am used to**; *It's my first week here, so I ____ the noise* → **am getting used to**. Both chip rows are the same four real forms, so only the situation picks. `type: false` (a cloze cannot force one of two real forms, E8) and no `wrong` (a be/get swap is real English — the pack's own E9/G4 line). Item 13 stays a form item and keeps its form chips. Mixing the axes was rejected: it breaks B6, and a miss becomes unreadable — you cannot tell whether the student lost the form or the meaning.

*(2026-09-05 — answered by dropdown in the B1 smoke tab; "applied" notes say what
the interactive session did the same day.)*

### AGENT-LOOP · the 24–40 item band on a unit that was never a stub
**Q:** The gate says "item count is inside the target band above" (24–40 for grammar). Five B1 grammar packs were built well above it — `b1_present_perfect_vs_past` 79, `b1_relative_clauses` 66, `b1_linkers` 60, `b1_verb_patterns_advanced` 56, `b1_reported_speech` 54 — and the repair work now starting on them cannot meet that gate without gutting banks you asked to keep.
**Options:** a) read the band as a **floor** for stubs and a target for thickening, never a cap on a bank that is already rich / b) cut those five to 40 / c) split them into two units each.
→ **The band is a floor, and big banks get served in slices:** first time round a unit serves **three sets of 12**, then the rest of the bank rotates in on the reviews. No cutting, no splitting. The serving mechanism is an engine job (first-play cap + review rotation) — queued, not yet built; until it exists the full bank plays as authored. AGENT-LOOP.md band row updated. (Covers the duplicate entry "Two built B1 units sit above the 24-40 item band", folded in here.)

### lint.py · A4's DEMONSTRATIVE regex has no instrumental or dative-plural forms
**Q (mostly for the record):** `DEMONSTRATIVE` had no **tím / tou / ti / tomto / těmi**, so *Včera jsem mluvil s tím manažerem* — which does carry the demonstrative that licenses *the manager* — still reported an A4 candidate.
→ **Fix it (dropdown: fix all six checker classes).** Applied 2026-09-05: `ti|tím|tou|tomto|těmi` added to the regex. The two already-fixed items on `b1_present_perfect_vs_past` stopped flagging (pack's A4 went 11 → 9; the 9 are the signed-off English-forces-`the` class). Covers the duplicate entry "the A4 demonstrative list misses five common Czech forms".

### lint.py · the connector check matches CONNECTORS as substrings
**Q (for the record):** `promised = [c for c in CONNECTORS if c in cardtext]` found **if** inside `font-family="Lexend, sans-serif"` and **before** inside ordinary card prose.
→ **Fix it (dropdown).** Applied 2026-09-05: word-boundary match, the same regex the *used* count applies. The `sans-serif` class of hit is gone.

### verify_pack.py · C9 counts Czech háčky as extra words, so honest examples read as walltext
**Q:** `c9_words` counted *Dědeček* as four words. Two of the four remaining C9 violations were pure artifact.
→ **Fix it (dropdown).** Applied 2026-09-05: the letter class now includes the Czech carons. C9 went 4 → 2; the remaining two (`a2_past_questions`, `a1_core_frames_glue_pronouns`) are real walltext on protected A1/A2 packs.

### lint.py · A8 demands a contraction that is not English (`had to` / `have to`) — and negative tags, and possessive *had*
→ **Fix the guards (dropdown).** Already done by a later run before this session: `NOT_A_PARTICIPLE` (had/have/has + non-participle) and `TAG_AFTER` (tag twins) are in lint.py. 2026-09-05 added *more / less / fewer / much / many* to the non-participle list so *If I had more time* stops demanding *if I'd more time*. The "counts are noise, not debt" record on `b1_second_conditional` / `b1_wishes` / `b1_question_tags` is signed off — those flags should now largely clear on re-lint.

### B1 grammar · F4 fires on the contraction *She's*
→ **Fixed before this session** — the pronoun guard (She/He/It/That/There/Who/What) is in lint.py, dated B1 loop 2026-09-04. Signed off.

### B1 grammar · `vocablevel` fires on every grammar pack
→ **Exempt grammar packs** — already in lint.py before this session (`is_grammar` guard, citing James 2026-09-04). Signed off; carrier vocabulary stays easy (A0).

### B1 grammar · the A4 candidate on the passive and relative-clause packs
→ **(a) Leave them lit (dropdown sign-off).** A passive with a definite subject and a defining relative clause with a definite head are exactly where English forces `the`; the Czech reflexive passive carries no demonstrative to add.

### b1_past_perfect · A4 `the` in past narrative
→ **(a) Leave them (dropdown sign-off).** All seven are known referents; dropping `the` is not English. The three *The police* items on `b1_agreement_tricky` stand for the same reason.

### b1_be_used_to · A4 `the` on *drive on the left*
→ **(a) Leave it (dropdown sign-off).** *Drive on the left* is a fixed phrase; there is no article-free version.

### b1_used_to · A0 — the Czech picks neither *would* nor *used to*
→ **(a) (dropdown sign-off).** Type accepts the *used to* twin on action items; the authored Quiz chips are the stage that forces *would*; state items keep carrying the teaching point.

### b1_indirect_questions · the three *I wonder* items cannot clear F3
→ **(a) Nothing (dropdown sign-off).** F3 stands as a permanent scoped candidate on those three; do not re-open.

### b1_second_conditional / b1_wishes / b1_question_tags · their A8 counts are all false, and nothing is behind them
→ **(a) (dropdown sign-off).** Folded into the A8 guard entry above — with the guards now complete the counts should drop on their own; whatever remains is the recorded noise class, not debt.

### All vocab · a frame whose lemma is inflected produces NO gap — worth a rule and a check
→ **(a) Rule + check (dropdown).** Applied 2026-09-05: **B24** written into AUTHORING-RULES.md (`enforced`), and `verify_pack.py` now mirrors `sentenceToFrame`'s letter-class match next to the lemma-not-an-item warning. First sweep found exactly one live hit — `a2_misc` sentences[51], queued under Open because A2 is off-limits.

### leaf_personality_b1 / leaf_self_b1 · F7 says personality owns traits, path order says self does
→ **(c) Leave the overlap (dropdown).** `leaf_self_b1` keeps its seven trait adjectives; `leaf_personality_b1`'s four repeats stand as a second exposure. Both packs stay as the 2026-09-04/05 runs left them (review board + 24 new adjectives on personality already applied and kept).

### B1 vocab · F7 — 48 words are taught as new on two different B1 leaves
→ **(a) Per-unit as touched (dropdown).** The later pack drops the tile when a run works that unit; no one-commit sweep. *charge / get on / guilty* are sense-pairs — A12-mark, never cut. The first-owner list in this block is the working reference.

### b1_degree_adverbs · nine intro cards cut to six, then rebuilt to nine, on a unit you have played
→ **(a) Yes — a run may restructure a smoked intro when a written rule is broken (dropdown).** The nine-card one-job-per-card rebuild stands (C11 outranks the 4–6 count when the unit absorbs so/such + the parked degree cluster). James verifies on replay; the unit is in the B1 smoke queue.

### The loop · gate 1 has nothing to bite on once a unit is repaired
**Q:** "The unit's own lint flag count is lower than when you started" is unmeetable on units already at 0 or carrying only standing candidates — taken literally the loop must revert real fixes.
→ **Loosen it (dropdown):** gate 1 is now "the count has **not risen**, and no new rule ID appears". AGENT-LOOP.md updated 2026-09-05. AUTHORING-RULES findings are the bar on 0→0 commits.

### B1 vocab · the texture backlog and the 7–9 word line cannot both hold
→ **The shape bar wins (dropdown):** one clause move beyond `NP + be + ADJ` plus two recycled content words, 10–14 words. AGENT-LOOP.md sentence-quality line updated 2026-09-05; the two already-clean leaves are the house style. (The backlog itself was closed by the 2026-09-05 run: 359 → 0 across 21 leaves.) **Still open inside this decision:** whether to move `b1_linkers` earlier than path slot 37 so earlier leaves may use *although / until / instead / however* — the path order is James's; leaves before slot 37 stay on *because / when / if / but* + relative *that/which/where* until he moves it.

### The gates · three of the four are red on `main`
→ **Fix the rename + investigate the jump (dropdown).** Applied/diagnosed 2026-09-05:
- `path_order_b2` row `b2_be_get_used_to` **removed** from `data/tree.json` (the unit was pulled forward on 2026-09-02 and already sits on `path_order_b1`). verify_pack errors 5 → 4.
- The **audit ratchet jump is explained**: baseline 246 was written 2026-08-25. Commit `85854de` (2026-08-31, "A1 pass") took the total 331 → 589 in one commit — it folded the five `trunk_glue_*_a1` packs + `a1_object_pronouns` out of `tree.json` (their taught words stopped being credited downstream) **and** made the path run to the end, adding 18 more live units to the audit's scope. The B1 build-out then grew it to ~800 and the loop trimmed to 791. Legitimate coverage growth, not content rot. **Pending James's nod:** re-baseline `audit/sequencing-baseline.json` to the current total so the ratchet bites again.
- The four remaining verify errors (C9 ×2, C10 ×2 against zero baselines) are all on protected A1/A2 packs — fixing them needs James to lift the off-limits rule for those specific cards.

### b1_relative_clauses_2 · typing the word *nothing*
**Q:** Three items answer the gap with the literal string `nothing` (*The letter ____ I sent last week arrived today.* → `nothing`), which is how the 2026-09-02 draft already did it. That reads fine as a Quiz chip and badly as a Type answer — nobody types "nothing" — and `verify_pack` warns that the frame may not reconstruct.
**Options:** a) keep it — the chip is the point, and the Type stage is a small cost on three of 25 items / b) mark those three `type: false` so they are Quiz-only / c) invent a different token (`—`, `no word`) — which is a new mechanism and needs the engine to agree.
**Default if unanswered:** a — kept, because the pack already shipped one item of this shape and inventing a token unattended is worse than a rough Type on three items. (b) is the cheap improvement if you want it; say so and the next run does it.
→ **(b), and it is applied.** The standing-decisions table in AGENT-LOOP.md answers this — "mark those three items `type: false` — Quiz-only. The chip is the teaching point; nobody types nothing into a gap. Do this on the next run that touches the unit." The 2026-09-05 run checked: all three items already carry `type: false`, so an earlier run had done it. The three `verify_pack` warnings that remain are the check not knowing about `type: false`; they are not a Type stage that still asks for the word. Moved here so nobody works it again.

### B2 vocab · the three B2 leaves have no `recaps` field, so F9 cannot check them
**Q:** F9 (2026-09-05) makes a vocab leaf name its predecessors in a `recaps` field; `check_rewrite.py` then enforces that the first page reviews those words before the unit teaches new ones. All 23 B1 leaves now carry it. `b2_delexical_collocations`, `b2_false_friends` and `b2_fixed_phrases` do not, and each reports one F9 finding.
**Why it was not just done:** B2 is being drafted on `b2/auto` on the home machine, unattended. Editing those three packs here would collide with that run.
**Default if unanswered:** the B2 run adds the field when it next touches each pack — `"recaps": [...]` naming the earlier packs the leaf builds on, `[]` where there is genuinely no predecessor. Until then `check_rewrite` carries three standing findings, which is honest: nothing is hidden, and no B1 work is blocked.

### leaf_knowledge_b1 · the unit was two units in one coat
**Flagged by James, 2026-09-05 smoke:** "wondering if the vocab in this unit is a bit too diffuse — customs, revision, diploma". 24 study words plus 11 border-and-planning travel words, while `leaf_travel_b1` sits four slots earlier and is already at the 36-word ceiling, so there was nowhere to merge them.
→ **Applied (dropdown, four answers):**
- **Park the travel eleven.** `codex/parked-travel-border-b1.json` holds them whole — tiles with icons, one sentence per lemma, the four Use rewrites and the "On the way" intro card — for a Travel 3 / At the border leaf whenever James wants one. No node invented.
- **Keep the five abstractions** (beginner, expertise, talent, theory, proof): "they are what knowledge means".
- **Drop the F7 duplicates.** `exam` (School 1, A1) is no longer a tile — it sits on the recap page and still carries three sentences as recycled vocabulary. `fare` (Transport, A2) left with the travel eleven.
- **Numbered into the existing set.** James: "there should be a school/study set by now: this could be part 2 or 3 of the same set." School 1 · School 2 · School 3 → **School 4**. `label` changed in `tree.json` and `nodes-vocab.json`; the node id `leaf_knowledge_b1` and the filename are unchanged (J2).

Now 23 words in two blocks of 12 and 11, one sentence per lemma, five intro cards, C49 clean. `js/tree-portrait.js` still calls the *branch* "Knowledge & travel" — that is the branch, not this unit, and other travel leaves hang there, so it was left alone.

### Intro glosses · "uses complex word to define a simple word"
**Flagged by James, 2026-09-05 smoke of `b1_past_modals`:** the Job column defined **had to** as *"you were obliged to do it"* — "bad pedagogy · use simpler words and give an example sentence". *obliged* is C1 in the Oxford 5000. The same card set also said *"not that it was forbidden"* (off-list), a card later.
→ **Applied (dropdown, four answers):**
- **The card** is now three columns — Form / Job / Example — with the job in A1 words and the form shown in a sentence on the same row.
- **Swept every B1 grammar unit**, not only this one: 45 gloss rewrites across 21 packs (*governs* → decides, *stance* → how sure the speaker is, *neutral* → normal, *duration* → how long, *creeps in* → gets added, *retell* → say again, *slot* → part, *skip the doer* → leave out the doer, *plain verb* → verb (*go*, not *gone*)). Each judged one at a time; nothing batch-replaced.
- **Four more meaning tables** got an Example column: `b1_modals_speculation` (the nine modals), `b1_prepositions_time_2`, `b1_suffixes`, plus the flagged one. `b1_second_conditional`'s Phrase column is already full sentences, so it needed nothing.
- **`codex/check_gloss.py`** enforces both, ratcheted at **99** — every remaining finding is on a protected A1/A2 pack and marked as such. B1 grammar is clean. C6 moves `observed` → `enforced`; **C58** is new.

The check reads levels from `codex/vocab/oxford-5k-cefr.csv` and irregular forms from the app's own `data/reference.json`, and drops five classes of false positive found by reading the output: the unit's own material, words inside emphasis (a quoted Czech word or the form being taught), affixes, grammar metalanguage, and cells that are whole example sentences. It is not a spell-check — it asks one question: is this word harder than the thing it explains.

### b1_past_modals · could vs was able to, and the question that was no good
**Flagged by James, 2026-09-05:** "difference between could and were able to is not clear (and often not really important, I think)" and, of Quiz item 1, "this question is no good".
**What was actually wrong:** the contrast was never tested. All five *be able to* items cue `(be able)` in brackets, so the student is told which form to write. The only two items asking for a choice — *I ____ read when I was five. (can)* and *____ swim when you were a child? (you / can)* — both offered a second right answer, and the chip "Were you able" was ungrammatical against its own stem (*Were you able swim*).
→ **Applied (dropdown, four answers):**
- **Card 2 narrowed** to the one case that bites: could and was able to are the same for known ability and in every negative, and part company only for one thing done on one occasion. Three rows, examples drawn from the bank.
- **Both choice items keep their place, with honest chips** — the right-but-broken option replaced by a clearly wrong form of the same word, keeping *Did you could* as the unit's own error (B4).
- **couldn't accepted** on the two negatives whose frame allows it (item 2 prints *to* on the stem, so it cannot take couldn't), each with its uncontracted twin per A8, and the card now says both are right in negatives.
- **Four of the seven identical *had to* affirmatives cut**: 25 → 21 items. Below the 24 floor in AGENT-LOOP, deliberately — no gate enforces it, the band is a floor for stubs, and this bank's problem was repetition, not thinness.

**New rule B25** (`observed`): if a unit teaches a contrast, some item must make the student choose, and the bracket cue must not name the answer's own form. Cueing what the student converts *from* is fine — `(must)` → *had to* is the teaching point.

Two lint flags my own edit introduced, both fixed before finishing: C4 (lint reads any bolded run of three or more words as an example sentence and asks the bank for it — the pack bolds **was able** to, two words, everywhere else) and A8 (the couldn't I added to accepts needed its *could not* twin).

### The loop · why smoke testing was not getting faster, and the four things done about it
**James, 2026-09-05:** "smoke testing this session has been again painfully slow… there should be fewer and fewer adjustments to make as we go along… hours of work, and I am only on 45% of b1. why is this?"

**Measured before answering.** 150 rules, 39 with a check. All 19 unplayed B1 grammar units were clean against every enforced check — he was not re-finding known faults. But the rule curve is not flattening either: 90 rules carry an August date, 26 carry a September date and September was five days old. What changed is the *kind* of fault: section A (is the item gradeable) is 8 of 15 enforced and no longer produces flags; section C (teaching) is 58 rules with 18 enforced, and that is where every flag this session landed.

The avoidable half: **C6 was written 2026-08-29 with its own state cell reading "lintable against `codex/vocab/oxford-5k-cefr.csv`" and sat unbuilt for a week.** Built on 2026-09-05 it found 45 instances across 21 B1 packs in under a minute — 45 flags he would otherwise have met one at a time. Separately, a 2026-09-04 run measured the B25 and B26 checks, found they would redden protected A2, and defaulted to not landing them, so two ready checks sat behind an unanswered question.

→ **All four implemented (dropdown, 2026-09-05):**
1. **I11** — a rule lands with its check, or marked `manual` with the reason. New `manual` state in the rules file. Where a check would redden A1/A2, land it anyway with `[PROTECTED]` marking and a ratchet — that is now written down, so it cannot block a check again.
2. **`codex/test_checks.py`** — every check run against a pack that genuinely carries the fault, frozen in `codex/regressions/` from the commit before it was fixed (James's call: real faults, not invented ones; frozen rather than read from git each time, so they do not rot). It caught two broken checks within an hour of existing: `check_gloss` silent on its own founding example, and an H5 check that was flagging the sanctioned `var(--accent, #hex)` pattern as a fault.
3. **`codex/preflight.py`** — every scoped check for one unit in one card, and `--unplayed` to sweep everything not yet ticked. Replaces I10's lint-only prep, which was right when lint was the only check.
4. **`codex/RULE-ENFORCEMENT.md`** — all 113 unenforced rules triaged: 22 built, 12 buildable, 30 partly, 50 manual. `codex/check_rules.py` holds the batch built from it (B3, B22, B25, B26, C13, C14, C19, C32, C46, C49, C56, D1, E3, E10, F7, H5, J2), ratcheted at 116 live findings with 191 more on protected packs.

**B2 was attempted and pulled.** It found 496 things on B1 and was wrong about nearly all of them — in a paradigm pack every chip *is* another item's answer, which is the axis, not borrowing. It is in RULE-ENFORCEMENT under Partly with what it would need. A check that cries wolf costs more than no check.

### The loop · a second run was committing to b1/auto throughout this session
**What happened:** HEAD moved from `8588836` to `bc62862` while this session worked — four commits at 12:22, 12:28, 14:19 and 14:41, from another run. Commit `f29a3f0` ("b1_past_modals: the Czech was carrying the tense on its own") **swept up this session's uncommitted edits to the same pack** along with its own.
**How it came out:** intact, by luck. `b1_past_modals` now carries both this session's work (the could/was-able-to contrast table, the fixed Quiz chips, 25→21 items) and the other run's 17 `/ past` cues, and `AUTHORING-RULES.md` has 153 rows with no duplicate ids. Nothing was lost.
**Why it is worth recording anyway:** it also silently invalidated the regression fixtures, which were built from "HEAD" on the assumption that HEAD was this morning. They captured the *fixed* packs, and `check_gloss` duly reported clean on its own founding example. Rebuilt from `8588836` explicitly. The AGENT-LOOP claim check (read `git log origin/b1/auto` before starting a unit) is written for cloud runs and did not cover an interactive session — a session that is editing packs should assume HEAD can move under it, and pin an explicit commit whenever it needs "before".
