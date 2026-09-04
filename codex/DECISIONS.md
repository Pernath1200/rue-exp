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

---

## Open

### b1_past_perfect · A4 `the` in past narrative
**Q:** Seven items demand `the` where the Czech carries no demonstrative (*the film*, *the station*, *the train*, *the room*, *the door*, *the shop*, *the window*) — is that a real A4 fault at B1, or is it English forcing the article?
**Options:** a) leave them — English forces `the` on a second mention or a known referent, and stripping it would teach bad English / b) add the article-free wording to `accepts` where a native would also say it / c) rewrite the sentences onto nouns that do not need an article.
**Default if unanswered:** a — every one of the seven is a *known referent* (the film we are watching, the station we were heading for). Dropping `the` there is not English, and (b) would accept sentences no native writes. The A4 candidate stays lit on this pack; the sequencing story is that `the` is not the teaching point here, so it costs the student nothing.
**Same rule, harder case (`b1_agreement_tricky`):** three items are *The police …*, where English forces both the article and the plural, and Czech *policie* takes neither an article nor a natural demonstrative — *ta policie* is not what anyone says. Those three cannot be cleared by rewriting the Czech the way the rest of this run's A4 findings were. Default: they stand.
→ (James: your answer here)

### b1_used_to · A0 — the Czech picks neither *would* nor *used to*
**Q:** *Každé léto jsme chodili plavat* is *We would go swimming*, *We used to go swimming* **and** *We went swimming every summer*. Type cannot force `would` from that Czech. How should the would items be graded?
**Options:** a) accept the *used to* twin on every action item (`gap_accepts` + `accepts`) and let the authored Quiz options be the stage that forces `would` / b) cue the gap `(would / go)` in the B11 idiom so Type forces it, at the cost of handing the student the auxiliary / c) drop Type on this unit (`ladder.type: false`) the way E8 drops it on word order.
**Default if unanswered:** a — done this run. A0 says fix the prompt or accept every legitimate answer, and (b) is asymmetric: the state items would then be answerable by "no *would* in the cue, so type *used to*", which is the B15 giveaway. The state items stay determinate on their own, because `would` is simply wrong with a state — that is the unit's teaching point, and it is the Quiz that carries it.
→ (James: your answer here)

### lint.py · A8 demands a contraction that is not English (`had to` / `have to`)
**Q:** `lint.py` flags *I had to work last Saturday* as missing its contraction twin, because `i had` → `i'd`. But *I'd to work* is not modern English, and neither is *Did you've to wait long?* for *Did you have to wait long?*. Four such flags sat on `b1_past_modals` at 10 items and nine at 25, all of them false.
**Options:** a) guard the check — skip a short form whose expansion is immediately followed by `to` (had to / have to / has to) / b) leave it and let every past-obligation pack carry permanent EXACT flags / c) write the ungrammatical accepts in so the count goes green.
**Default if unanswered:** a is the fix, but it is a change to `lint.py`, which this loop should not make unattended — so **b for now**: the two remaining flags on `b1_past_modals` stand, and the pack `note` says in capitals that they must not be "fixed". (c) is never acceptable: an accepts list is what grades the student, and *I'd to work* in it marks a wrong answer right. This run also reduced the count honestly, by rotating the obligation items onto noun subjects (F6), which the check does not fire on.
**Second instance, worse (`b1_question_tags`):** every **negative question tag** is unsatisfiable the same way. The twin of *aren't you?* is *are you not?*, but the check looks for the string *are not you?*. Nine of 25 items carry a permanent EXACT flag, and the count can only grow as the unit is thickened — so on this unit the A8 count is not a usable quality signal at all. The same guard would fix it: skip a contraction whose expansion lands in a tag (a short form after a comma, or immediately before a pronoun). A third instance is `I'd a car` for *I had a car* — possessive *had* does not contract either; the run's own closure tool now only contracts `X had` in front of a past participle.
**Also worth knowing:** these three false-positive classes are why `b1_question_tags` went 12 → 10 rather than to near zero, and why its 15 new items lean toward negative-sentence/positive-tag. That lean is defensible on its own (it is the harder direction out of Czech *že ne?*, and the stub had only three), but it was chosen with the flag count in view, and you should know that.
→ (James: your answer here)

### B1 grammar · `vocablevel` fires on every grammar pack
**Q:** The `vocablevel` candidate ("92% of words are 2+ levels below B1 — is this really a B1 unit?") fires on b1_past_perfect and on most B1 grammar packs. Should a grammar pack be lexically levelled at all?
**Options:** a) ignore it on grammar packs — a form unit must carry easy vocabulary so the only difficulty is the form (A0: one degree of freedom) / b) raise the carrier vocabulary to B1 words / c) exempt grammar packs in `lint.py` so the signal stops firing.
**Default if unanswered:** a — carry on ignoring it on grammar packs, and do not raise carrier vocabulary. Note that (c) is the cheap version of (a) but it is a lint change, which is not this loop's to make unattended.
**Note added by the same run:** the check only runs once a pack has 40+ CEFR-known word tokens, so **thickening a stub is what switches it on**. `b1_be_used_to` had no `vocablevel` flag at 10 items and had one at 24 — a new rule ID that the AGENT-LOOP gate forbids, arrived at by doing exactly what the loop asks. Clearing it would mean writing B2 nouns into a B1 form pack, which A0 forbids (the carrier must be easy so the form is the only difficulty). The loop is treating this one rule ID as exempt from the "no new rule ID" gate on any pack whose item count crossed the floor this run, and saying so in the commit. If you disagree, (c) is the fix.
**Correction, from the parallel run that landed the 28-item `b1_be_used_to`:** on that pack the flag was *marginal*, not structural — 77% against a 75% threshold, with 31 of the A1 tokens being the word `to` from the unit's own target string. Four carrier nouns moved off A1 onto words the path already teaches (*school* → *schedule*, *phone* → *keyboard*, *weather* → *heat*, *cold* → *noise*) and it cleared, so that pack now has **no** `vocablevel` flag and the exemption was not needed there. That is not a general answer: those four swaps did not raise the difficulty of anything, but on a pack that is genuinely 90%+ A1 there is nothing to swap without breaking A0. The exemption above still stands for those.
→ (James: your answer here)

### b1_be_used_to · A4 `the` on *drive on the left*
**Q:** One item demands `the` where the Czech (*Není zvyklý jezdit vlevo*) has no demonstrative — *He isn't used to driving on **the** left*. Real A4 fault, or English forcing the article?
**Options:** a) leave it — *drive on the left* is a fixed English phrase and there is no article-free version / b) add *on left* to `accepts` / c) rewrite the sentence onto something that needs no article.
**Default if unanswered:** a — done this run. *Drive on left* is not English, so (b) would accept a sentence no native writes, and (c) throws away the best driving example in the pack. The other two article demands this unit carried were fixed properly: *na zimu* → *na ten hluk* and *to počasí* → *to horko* both now carry the Czech demonstrative that licenses `the`, so only this one stays lit.
→ (James: your answer here)

### B1 grammar · F4 fires on the contraction *She's*
**Q:** `lint.py`'s F4 check is `\b([A-Z][a-z]+)'s\b`, so the subject contraction **She's** is read as a possessive of an unknown name *She* and reported EXACT. Is that worth a regex fix?
**Options:** a) fix the check — exclude the pronouns (*She's / He's / It's / That's / There's*) so F4 only ever means a real name / b) leave it and let authors write the uncontracted form in `en` / c) add the pronouns to `CLASS_NAMES`.
**Default if unanswered:** b — done this run, because a lint change is not this loop's to make unattended. `b1_be_used_to` now shows *She is used to speaking English at work* in `en` and keeps *She's…* in `accepts`, so A8 still holds and nothing is lost on screen. (a) is the right fix when someone is in that file; (c) would suppress a genuine F4 hit on a name literally called *She*, which is nobody.
→ (James: your answer here)

---

## Answered

*(empty)*

### b1_relative_clauses_2 · typing the word *nothing*
**Q:** Three items answer the gap with the literal string `nothing` (*The letter ____ I sent last week arrived today.* → `nothing`), which is how the 2026-09-02 draft already did it. That reads fine as a Quiz chip and badly as a Type answer — nobody types "nothing" — and `verify_pack` warns that the frame may not reconstruct.
**Options:** a) keep it — the chip is the point, and the Type stage is a small cost on three of 25 items / b) mark those three `type: false` so they are Quiz-only / c) invent a different token (`—`, `no word`) — which is a new mechanism and needs the engine to agree.
**Default if unanswered:** a — kept, because the pack already shipped one item of this shape and inventing a token unattended is worse than a rough Type on three items. (b) is the cheap improvement if you want it; say so and the next run does it.
→ (James: your answer here)
