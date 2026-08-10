# Czech authoring rules — the trap family (standing document)

Extracted verbatim from the 2026-08-09 HANDOFF (its §5) on 2026-08-10, so
these rules survive that file's deletion. They were discovered one at a time
across cloud runs 27-36 and are the single most expensive body of knowledge
in the project. Any Czech authoring — human or agent — needs all of them.

### Czech authoring rules — the trap family, all of it

These were discovered one at a time across runs 27-36 and are the single most
expensive body of knowledge in the project. Any future Czech authoring needs
all of them.

1. **Dropped subject (the grading defect).** Czech drops the subject pronoun,
   so *Už je tady* is true for he/she/it alike and a student answering with a
   different subject than the author intended **grades wrong**. Every 3sg
   prompt needs an explicit subject unless it is impersonal.
2. **`mít rád` leaks the speaker's gender** — *Mám rád* vs *Mám ráda*.
3. **Past-tense verbs leak the speaker's gender** — *Četl jsem* vs *Četla
   jsem*. Easiest to write by accident, because the English (*I read an
   interesting article*) looks perfectly neutral. 1pl has it too (*Dívali* vs
   *Dívaly*).
4. **Predicate adjectives leak gender** — *Jsem naštvaný* vs *naštvaná*.
   Structural for any feelings/describing pack.
5. **Reflexives leak it too.** *himself/herself/itself/themselves* are safe
   because a 3rd-person subject fixes *sám/sama/samy*, but **`myself` and
   `ourselves` cannot be written safely at all** — *Udělal jsem to sám* leaks
   masculine exactly like a 1sg past.
6. **Gloss collision** — Q5 above.

**The method that works** (runs 32-35 hit zero defects with it, versus ~3 % by
catching them on review): don't write the defect and then hunt it. Route every
prompt through an explicit noun subject (*Můj šéf*, *Ta láhev*, *Moje
babička*), or 1sg/1pl present morphology (*Mám*, *Potřebuji*, *Máme*), or an
impersonal/existential frame. Where the past tense is unavoidable — a health
pack is full of accidents — **put the past on an explicit non-speaker
subject**: *Byla tady nehoda* is past but agrees with *nehoda*, not with the
student. Same escape for adjectives: hang it on a noun the student does not
inhabit (*Moje čeština je strašná*).

**Verified state at close:** all 38 shipped banks, 946 sentences, swept
mechanically in run 36 against all of the above. **The dropped-subject grading
defect is extinct — 0 in 946.** Two gender-leak prompts were found in A1 banks
that predated the traps' discovery and were fixed (`a5a8152`). Note those two
were *not* grading defects: *Mám rád fotbal* still forces the answer *I like
football*. What they were is a support prompt presuming a male student.

**Verified state when extracted:** all 38 shipped banks, 946 sentences, swept
mechanically against all of the above. The dropped-subject grading defect was
extinct — 0 in 946.
