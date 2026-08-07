# Czech review log — second-opinion pass

The build routine authors Czech; **this routine only judges it.** James is the
only Czech-capable human in the loop, so this pass exists to shrink what he has
to read, not to replace him.

Scope: `cz` fields in vocab `sentences[]` banks and intro pages, newest first.

Verdicts:
- **fix** — unambiguously wrong (case, gender, agreement, word order, typo).
  Fix it in place, note it here.
- **flag** — defensible but unidiomatic, or a real dialect/register choice.
  Do NOT change it. Log it here under "For James" with the alternative.
- **ok** — leave silent. Do not log clean sentences; this file is for signal.

Never touch the English. Never touch `en`, `accepts`, `lemmas`, or any grammar
pack. If a Czech fix would change what the English sentence means, flag instead.

---

## 2026-08-07 — second-opinion pass (cloud)

Scope: all Czech changed in the last ~6 h — 16 new picture-led intros (animals,
body, clothes, colours, food, freetime, health, home_family, ideas, nature,
places, school, shopping, tech, work), the new a1_home_family `sentences[]`
bank (12 items, was marked TEMPLATE — now reviewed), and re-lexified items in
glue_modals, glue_pronouns, glue_questions, prepositions (book/bag),
verbs_say, a2_lexis.

**Fixed: 1 · Flagged: 3 · everything else ok.**

Fixes:
- `a1_ideas` intro `note_cz`: *Když nevíte slovo* → *Když neznáte slovo* —
  standard Czech takes *znát* with a bare noun object (*vědět* takes a clause);
  English-shaped "don't know the word".

For James:
- `a1_shopping` intro tile *open* = "otevřený / otevřít" but *closed* =
  "zavřeno" — mixed forms. Suggest "otevřeno" for both to read as the shop-sign
  pair otevřeno/zavřeno. Defensible as is, so left unchanged.
- `a1_food` intro `note_cz`: "Nepočitatelná **jídla** (bread, rice, water,
  coffee)…" — water and coffee aren't *jídla*. Suggest "Nepočitatelná slova"
  or "…jídla a pití". Meaning is clear, so left unchanged.
- `a1_health` intro tile *sick* = "nemocný / špatně (mi je)" — the inverted
  parenthesis is clumsy; suggest "nemocný / je mi špatně". Left unchanged.

Spot-checked clean (no log needed, noting only because the bank was flagged
TEMPLATE by the author): a1_home_family sentence bank — all 12 cz correct.
