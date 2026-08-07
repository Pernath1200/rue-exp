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

## 2026-08-07 — second-opinion pass (cloud, afternoon)

Nothing new in the last 3 h beyond the morning review itself, so widened to
the last day. Scope: the six B1 vocab leaves never reviewed (b1_work,
b1_money, b1_communication, b1_knowledge, b1_self, b1_home — 216 glosses),
plus the changed cz in the re-lexify/repair commits to a1_core_frames_be_have,
verbs_daily, verbs_more.

**Fixed: 2 · Flagged: 1 · everything else ok.**

Fixes (both the same defect — English-shaped personal adjective where the
Czech verb is impersonal):
- `b1_self` *dizzy*: *kdo se mu točí hlava* → *komu se točí hlava* — mixed
  relative (kdo + mu); the dative relative is the grammatical form, and the
  pack itself already uses it for *relieved* = "komu se ulevilo".
- `b1_knowledge` *homesick*: *stýskající se po domově* → *komu se stýská po
  domově* — *stýskat se* is impersonal (*stýská se mi*), so a participle
  modifying the person is ungrammatical.

For James:
- `b1_work` *self-employed* = "podnikající na sebe / OSVČ" — the participle
  is grammatical but clunky; suggest "samostatně výdělečně činný / OSVČ".
  Defensible (colloquial *podnikat na sebe* exists), so left unchanged.

Clean, no log needed: the re-lexified core-frames Czech (correct
instrumentals *s bratrem / s kamarády*, dative *kamarádovi*, animate plural
*psy*, both-gender *Jsem unavený. / Jsem unavená.*) and the other five B1
leaves' glosses.
