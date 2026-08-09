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

## 2026-08-07 — second-opinion pass (cloud, ~14:00 UTC)

Scope: everything after the 12:48 review — 6 new intros (a1_time_numbers,
a2_nature, a2_food, a2_sports, a2_tech, a2_travel) and 4 new sentence banks
(a1_animals, a1_colours, a1_body, a1_places, 48 sentences). Grammar-pack
re-lexify commits (a1_can, a1_there_is, a1_question_words, a1_some_any)
skipped — out of scope.

**Fixed: 1 · Flagged: 2 · everything else ok.**

Fixes:
- `a2_tech` *smartphone*: cz *smartphon* → *smartphone* (both the intro tile
  and the word entry it was copied from) — standard Czech is *smartphone* or
  the adapted *smartfon*; *smartphon* is a hybrid misspelling of both.

For James:
- `a2_food` intro tile *vegetarian* = "vegetariánský" (adjective only), but
  the pack's own word entry is "vegetarián / vegetariánský" and its carrier
  frames are noun-shaped ("I am a vegetarian"). Suggest the tile match the
  entry: "vegetarián / vegetariánský". Adjective isn't wrong (🥗 could read
  as vegetarian food), so left unchanged.
- `a2_food` intro tile *chip* = "hranolka" — colloquial feminine; the
  dictionary-preferred form is "hranolek". Very common in speech, so
  defensible; left unchanged. Mention only so the choice is deliberate.

Clean, no log needed: all 48 new bank sentences (cases, agreement and dual
forms all correct — e.g. *Slyším ušima*, *Spím na zádech*, *Jakou barvu má
tvoje auto?* are properly idiomatic, not calqued) and the other five intros'
tiles and notes.

## 2026-08-07 — second-opinion pass (cloud, ~16:00 UTC)

Scope: everything after the ~14:00 review — run 22's 3 new A2 intros
(a2_routine, a2_family, a2_freetime), 2 new sentence banks (a1_food,
a1_clothes, 24 sentences), and the changed cz in the glue_quantity
re-lexify (*Nemám žádnou vodu*, *Něco je na stole* — both correct). The
collision-sweep commit touched only `en`/`accepts`, so nothing there to
judge.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a1_clothes` bank *suit*: en "My brother wears a suit **at work**." but
  cz "Můj bratr nosí **do práce** oblek." (= *to* work). The Czech is
  natural, but a student translating the prompt will produce "…wears a
  suit to work", which `accepts` grades wrong. Either cz → "Můj bratr
  nosí v práci oblek." or add the to-work form to `accepts` (English, so
  yours). Not fixed — both halves are individually fine; only the pairing
  drifts.

Clean, no log needed: all 24 new bank sentences (idiomatic *Snídám doma*,
*Mám hlad / má žízeň*, correct accusatives *rybu / polévku / vidličku /
košili*, plural agreement *hezké šaty*, *Tyhle kalhoty se mi nelíbí*);
*Chleba je na stole* matches the pack's own primary gloss "chleba /
chléb", deliberate, fine. All three intros' tiles, titles and notes ok —
incl. the už = already/yet note and cena = price/prize note, both
correct.

## 2026-08-07 — second-opinion pass (cloud, ~17:30 UTC)

Scope: everything after the 14:44 review — run 23's 3 new A2 intros
(a2_feelings, a2_work, a2_society), 2 new sentence banks (a1_freetime,
a1_health, 24 sentences), and the changed cz in the trunk_social and
trunk_verbs_more3 re-lexifies (*Ano, prosím*, *Trávím čas s rodinou*,
*Chci se přidat k týmu* — all correct: instrumental after *s*, dative
after *přidat se k*).

**Fixed: 0 · Flagged: 0 · everything ok.**

Clean, no log needed: all 24 bank sentences (idiomatic *Bolí mě hlava* for
the headache prompt with both accepts covered, correct accusatives
*horečku / chřipku / hudbu*, feminine agreement *Ta kniha je nudná / Moje
matka je šťastná*, natural *Oslava je u nás doma*, *Potřebujeme si
odpočinout*); bank cz all consistent with the packs' own glosses (oslava,
posilovna, léky, zdravotní sestra). All three intros ok — a2_work tiles
(firma, továrna, průmysl, podnikatel, pohovor, žádost, smlouva, plat,
kariéra all correct), the Mám strach → I am afraid note, and the
police-is-plural note are all sound.

## 2026-08-07 — second-opinion pass (cloud, ~19:00 UTC)

Scope: everything after the 15:43 review — run 24's 3 new intros
(a2_describing, a2_home, a2_shopping), 2 new sentence banks (a1_work,
a1_school, 26 sentences), and the changed cz in the glue_linkers and
verbs_more2 re-lexifies (*Podívej se do tašky*, *Běhám v parku* — both
correct: genitive after *do*, locative after *v*).

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_home` intro tile *upstairs* = "nahoře / do patra" but *downstairs* =
  "dole / dolů". The downstairs pair is location/direction with the plain
  adverb; the upstairs pair switches to the prepositional "do patra" for
  direction. "Jít do patra" is real Czech, but the symmetric pair a learner
  expects is "nahoře / nahoru". Defensible, so left unchanged.

Clean, no log needed: all 26 bank sentences (correct accusatives *práci /
přestávku / zkoušku / tužku / otázku*, genitive *řidič autobusu*, locatives
*na schůzce / v kanceláři / v prvním patře* — which also correctly matches
British *first floor* = české první patro — masculine-animate *To je můj
kolega*, idiomatic *Chci se učit anglicky*, *Začínám pracovat v sedm*); the
a2_describing intro (the linguistic "stojí po is nebo am" is standard
grammar-text usage) and the a2_shopping tiles and quality/quantity note all
ok, incl. the deliberate "obchod (amer.)" marking on *store*.

## 2026-08-07 — second-opinion pass (cloud, ~20:00 UTC)

Scope: everything after the 16:43 review — run 25's 3 new intros
(a2_adverbs, a2_ideas, a2_verbs), 2 new sentence banks (a1_time_numbers,
a1_nature, 26 sentences), and the *fix* gloss repair in a2_verbs. The
recycle_a2 re-lexify touched only `en`/`accepts`/`gap` (cz unchanged) and
past_continuous is a grammar pack — nothing there to judge.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_ideas` intro `body_cz`: "Většina z nich **drží na jednom řetězci**"
  — calque of the English "hang on one chain"; *držet na řetězci* reads as
  physically holding/being kept on a chain. Suggest "Většina z nich tvoří
  jeden řetězec: problém → …". Marginal rather than ungrammatical, so left
  unchanged.

Clean, no log needed: all 26 bank sentences (correct locatives *V horách /
v lese / v řece / na zahradě / v květnu*, dative *k moři*, genitive plural
*hodně hvězd*, neuter agreement *Slunce je horké / Pole je suché*,
idiomatic *Kolik je hodin?*, *V zimě je zima*, *dvakrát za rok*, *za deset
minut*; *Obchod otevírá v devět* is normal shop usage). The a2_verbs intro
(*Samá slovesa v základním tvaru…* and the borrow/lend note both tight and
correct), the a2_adverbs intro incl. the hardly ≠ hard note, and the new
*fix* = "spravit" gloss all ok.

## 2026-08-07 — second-opinion pass (cloud, ~18:45 UTC)

Scope: everything after the previous review — run 26's 3 new intros
(a2_health, a2_school, a2_clothes) and 2 new sentence banks (a1_shopping,
a1_tech, 28 sentences). The modals_must_should/countable re-lexify touched
only grammar packs — out of scope, nothing judged there.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_health` *toothache* = "bolest zubu" (both the intro tile and the word
  entry it copies). Grammatical, but the idiomatic set term is "bolest
  zubů" — the singular reads as pain from one specific tooth. If changed,
  change both spots together so tile and entry stay in sync. Left unchanged.

Clean, no log needed: all 28 bank sentences (correct instrumental *platit
kartou*, accusatives *účtenku / slevu / velikost / zprávu*, genitive *fotka
mojí rodiny*, locatives *v tašce / na stole / v obývacím pokoji / na
obrazovce*, agreement *Cena je dobrá / To tričko je levné / To auto je
drahé*; *Dívám se na zprávy* for "I watch the news" is properly idiomatic).
All three intros' tiles match their packs' own word entries verbatim; the
chemist = lékárna note, the maths = matika (brit.) mapping, and the
pants (amer./brit.) warning are all sound.

## 2026-08-08 — second-opinion pass (cloud, ~13:00 UTC)

Scope: run 27's Czech — 2 new intros (a2_media, a2_misc) and 2 new sentence
banks (a1_ideas, a2_routine, 28 sentences). The a1_to_for_with re-lexify
touched a grammar pack — out of scope, nothing judged there.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_media` *smell* = "zápach / čichat" (intro tile and the word entry it
  copies, character-identical). *Zápach* is specifically a **bad** smell and
  *čichat* is deliberate sniffing — both pick the marked member, so a learner
  acquires smell = stink + sniff. For the neutral A2 senses suggest
  "pach / cítit" (or "vůně / zápach" if the nice/nasty pair is wanted). Not
  ungrammatical, so left unchanged; if changed, change tile and entry together.

Clean, no log needed: all 28 bank sentences (correct accusatives *radu /
zvyk / rozvrh / plán*, locative *ve skupině*, idiomatic *Co je to za věc?*,
*Je půlnoc*, *Autobus tu ještě není*, *Je trochu zima*, reflexive *Každý den
si píšu do deníku*; the already/yet/still trio each sits where the intro
teaches it). Both intros' tiles match their packs' own glosses verbatim; the
fall = podzim (amer.) i pád note and the speaker = mluvčí i reproduktor note
are both sound, and body_cz prose on both pages is natural, not calqued.

## 2026-08-08 — second-opinion pass (cloud, ~15:00 UTC)

Started as a backlog pass (nothing new since the ~13:00 review), so reviewed
the oldest never-reviewed pack, **a1_core_frames_adjectives** (36 items, all
three blocks). Run 28 then landed mid-pass, so its Czech is included too:
2 new sentence banks (a2_family, a2_travel, 28 sentences), 2 new intros
(trunk glue_pronouns text-only, trunk verbs_action picture-led), plus the
verbs_action items themselves (scaffold-era, never previously reviewed).
c1_reporting_complementation is a grammar pack — out of scope.

**Fixed: 0 · Flagged: 2 · everything else ok.**

For James:
- `a1_core_frames_verbs_action`: the new intro note correctly teaches
  "take the bus = jet autobusem, ne „brát autobus“" — but the pack's own
  *take* item still carries the scaffold-era cz "Jedu autobusem. / **Beru si
  autobus.**", i.e. exactly the calque the note forbids, shown as prompt
  Czech. Colloquial *vzít si autobus* exists, so not unambiguously wrong —
  but note and item now contradict each other. Suggest dropping " / Beru si
  autobus." from the item. Left unchanged (my rules say unidiomatic = flag).
- `a1_core_frames_adjectives` first-person items: *tired* gives both genders
  ("Jsem unavený. / Jsem unavená.") but *healthy* and *ready* give masculine
  only ("Jsem zdravý.", "Jsem připravený."). Nothing is wrong, and cz is
  prompt-side so grading is unaffected — but the pack sets the both-genders
  precedent itself, and a female learner meets masculine-only first person.
  Suggest adding "/ Jsem zdravá." and "/ Jsem připravená." if the symmetry is
  wanted. Left unchanged.

Clean, no log needed:
- adjectives pack: neuter/masculine alternates ("Je to velké. / Je velký."),
  animate plural "Jsou přátelští.", idiomatic "Mám hlad" and "Je zima. /
  Je to studené.", adverbial "Je to špatně." for wrong — no English-shaped
  Czech anywhere in the pack.
- all 28 new bank sentences: correct animate accusative "Dnes máme hosta",
  genitives "majitel obchodu" / "blízko pláže", locatives "na dovolené / na
  letišti / v naší společnosti", accusatives "dobrou povahu / silnou osobnost
  / zpáteční jízdenku", idiomatic "Let má zpoždění" for *is delayed*; plural
  "Kde jsou moje zavazadla?" for singular *luggage* is the right Czech and
  "Where are my bags" is already in accepts, so grading holds.
- both intros' titles and notes ("Malá slova, která drží větu pohromadě",
  "Dvanáct věcí, které děláte", the him/her/them note, "jet autobusem" with
  correct instrumental) and all 12 verbs_action tiles, which match the packs'
  item glosses. The verbs_action items' possessive-dropping Czech ("Najdu
  tašku" for *I find my bag*) is natural and safe — frames packs gap only the
  verb, so "my" is supplied by the English frame, not graded from the cz.

## 2026-08-08 — second-opinion pass (cloud, ~16:00 UTC)

Scope: run 29's Czech — 3 new Use-stage sentence banks (a2_clothes 12,
a2_nature 17, a2_food 22 sentences; all pure additions, no existing cz
touched). The sequencing commit changed only item-level `lemma` fields —
no Czech to judge.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_food` bank *cream*: cz "Chceš do kávy smetanu?" but accepts only
  "Do you want cream in **your** coffee". The Czech (correctly) has no
  possessive, so a student will plausibly produce "…cream in the coffee",
  which grades wrong. The cz is perfect — suggest adding the the-coffee
  form to `accepts` (English, so yours). Same shape as the earlier
  a1_clothes *suit* flag; nothing changed.

Clean, no log needed: all 51 bank sentences otherwise. Correct oblique
cases throughout — accusatives *uniformu / módu / rajčatovou omáčku /
rybu / výraznou chuť / svou druhou rukavici*, genitives *moc oleje / do
hospody / mýdlo do koupelny*, datives *k rybě*, locatives *v práci
(matches "at work" — the earlier suit drift not repeated) / v poušti /
na trávě / v údolí*, instrumental *s džemem*; agreement *Tyhle kalhoty
jsou moc velké / Tyhle šperky jsou velmi drahé / Moje sestra je
vegetariánka*; idiomatic *Dnes vypadáš elegantně*, *Dnes jíme hovězí*,
*Dům je ze dřeva*. Bank cz consistent with the packs' own glosses
(šéfkuchař, neformální, knoflík — all reviewed with their intros earlier).

## 2026-08-08 — second-opinion pass (cloud, ~17:00 UTC)

Scope: run 30's Czech — 3 new Use-stage sentence banks (a2_shopping 22,
a2_sports 22, a2_media 24 sentences; all pure additions, no existing cz
touched). No intro changes this run.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_media` bank *smell*: "Tenhle zápach je velmi silný." is grammatical
  and consistent with the pack's gloss — but that gloss (*smell* =
  "zápach / čichat") is the one already flagged on 2026-08-08 (~13:00) as
  picking the marked bad-smell member. If you act on that flag and move the
  gloss to "pach / cítit", this sentence now needs the same change
  ("Tenhle pach…"); they travel together. Nothing changed here.

Clean, no log needed: the other 67 bank sentences. Correct oblique cases
throughout — instrumental *kreditní kartou*, genitives *Autor téhle knihy /
Kvalita tohoto výrobku / hodně otázek / velké množství vody / moc hluku /
Konec příběhu*, accusatives *tuhle značku / čokoládovou tyčinku / dobrou
recenzi / moji matku*, locatives *na zdi / v tomhle obchodě / na dráze /
v moři*; agreement *Noviny jsou na stole* (plurale tantum with plural verb
for singular en *newspaper* — right call), *Tohle drama je moc dlouhé*,
*Plachtění není snadné*; idiomatic *Co je to za materiál?*, *chodí na
ryby*, *výhodná koupě* for *bargain*, *Je tu moc hluku*. The
football/soccer pair correctly cross-accepts both terms since cz *fotbal*
cannot disambiguate. No English-shaped Czech found in any of the three
banks.

## 2026-08-08 — second-opinion pass (cloud, ~18:30 UTC)

Scope: everything after the ~17:00 review — run 31's 3 Use-stage banks
(a2_feelings 25, a2_society 27, a2_freetime 32 sentences) and 2 new trunk
intros (glue_questions text-only, verbs_daily picture-led), plus run 32's
3 Use-stage banks (a2_work 33, a2_school 34, a2_tech 35 sentences). All
pure additions — no existing cz touched.

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_school` bank *teaching*: "Výuka je dobré povolání." — grammatical
  and consistent with the pack's own gloss (*teaching* = "výuka"), but
  *výuka* is the instruction itself (lessons), not an occupation, so
  calling it a *povolání* reads oddly; a Czech would say "Učit je dobré
  povolání" or "Učitelství je dobré povolání". If the sentence changes,
  consider whether the gloss should grow to "výuka / učitelství" so they
  stay in step. Semantic collocation, not a grammar error, so left
  unchanged.

Clean, no log needed: the other 185 bank sentences. Correct oblique cases
throughout — genitives *bojí se psů / Hrdina toho příběhu / Obyvatelstvo
této země / do knihovny / hodně dovedností / hodně lidí*, datives *Vláda
pomáhá lidem*, accusatives *věří v Boha / našel zloděje / požádat o tuhle
práci / studuje biologii / Potřebuji kopii*, locatives *na schůzce /
o nezaměstnanosti / o zeměpisu / o médiích / dobrý v matice / na téhle
webové stránce*, instrumental *před zkouškou*; agreement incl. neuter
plural *Tato data jsou velmi důležitá*, masc.-anim. plural *Studenti jsou
zmatení / pyšní / přátelští*, plurale-tantum-style plural *Jeho znalosti
jsou velmi dobré* for singular en *knowledge*; the a2_feelings author's
own note holds — every gendered adjective has an explicit subject, and the
one 1sg sentence uses gender-neutral *v rozpacích*. Both trunk intros'
titles, tiles and notes ok (the how much/how many and make/do notes are
sound; all 12 verbs_daily tiles are clean infinitives matching their
items).

## 2026-08-08 — second-opinion pass (cloud, ~20:00 UTC)

Scope: run 33's Czech — 2 new Use-stage sentence banks (a2_home 39,
a2_health 41 sentences) and 3 new trunk intros (verbs_more and verbs_say
picture-led, glue_quantity text-only). All pure additions — no existing
cz touched.

**Fixed: 1 · Flagged: 1 · everything else ok.**

Fixes:
- `glue_quantity` intro `title_cz`: *Kolik, jak moc, a slova, která…* →
  *Kolik, jak moc a slova, která…* — the comma before *a* is the English
  Oxford comma carried over; Czech takes no comma before *a* in a plain
  list.

For James:
- `a2_health` bank *toothache*: "Můj syn má bolest zubu." — grammatical
  and consistent with the pack's gloss, but that gloss (*toothache* =
  "bolest zubu") is the one flagged on 2026-08-07 (~18:45) as reading
  like pain from one specific tooth; the idiomatic set term is "bolest
  zubů" (or "Bolí ho zub"). If you act on that flag, this sentence
  travels with the tile and word entry. Nothing changed here.

Clean, no log needed: the other 79 bank sentences. Correct oblique cases
throughout — accusatives *novou skříň / bránu / novou pračku / rakovinu /
tuhle chorobu / vážnou nemoc / velkou kost*, animate accusative *dva psy*,
genitives *vedle dveří / bolest zad / konec života*, locatives *v garáži /
ve dřezu / na střeše / na polici / v ložnici / na dveřích / v předsíni /
na balkoně / v krku*, dative *k lékaři / mi píše recept*, instrumental
*stávám se učitelem* (in the pack items the tiles copy); agreement incl.
neuter *Topení je velmi staré*, plural *Tyhle závěsy jsou nové / Schody
jsou špinavé*; plurale tantum *Tyhle odpadky nejsou moje* for singular en
*rubbish* is the right Czech and the en side is covered by accepts (same
shape as the earlier luggage call). Idiomatic *Výtah nefunguje*, *Bolí mě
kotník*, *Starám se o svoji matku* (correct reflexive *svoji*), *Musíte
užívat léky*, *bolest v krku* and *bolest zad* are the standard set terms
(only the zubu one drifts, flagged above). All three intros otherwise ok —
the enjoy-inversion note ("Práce mě baví = I enjoy my work") matches the
pack's own item, the tell-needs-a-person note is sound, and all 24 tiles
match their packs' item glosses.

## 2026-08-08 — second-opinion pass (cloud, ~21:30 UTC)

Scope: run 34's Czech — the 3 giant A2 Use-stage sentence banks (a2_adverbs
55, a2_misc 84, a2_ideas 89 sentences; all pure additions, no existing cz
touched). The a1_word_order sequencing fix is a grammar pack — out of scope.

**Fixed: 0 · Flagged: 4 · everything else ok.**

For James:
- `a2_adverbs` bank *immediately*: cz "Přijďte okamžitě." but accepts only
  "Please come immediately" — the cz has no *prosím*, so a student will
  produce "Come immediately", which grades wrong. Every other imperative in
  these banks keeps prosím on both sides (Prosím, jezděte opatrně / Mluvte
  prosím jasně / Nemluvte prosím hlasitě / Počkejte prosím na recepci); only
  this one drops it. Either cz → "Přijďte prosím okamžitě." or add the bare
  form to `accepts` (English, so yours). Same shape as the earlier suit/cream
  flags; nothing changed.
- `a2_ideas` bank *structure*: "Struktura domu je silná." — grammatical, but
  *silný* is the English-shaped choice; the Czech collocation for a physically
  strong structure is **pevná** (and for a house, *konstrukce* is the more
  natural noun than *struktura*). Suggest "Konstrukce domu je pevná." or
  minimally "…je pevná."; matches the pack's gloss (structure = struktura),
  so left unchanged.
- `a2_ideas` bank *variety*: "Ten obchod má velkou rozmanitost." — calque of
  "has a large variety"; a Czech says "má velký výběr". *Rozmanitost* is the
  pack's gloss and is fine for abstract variety/diversity, but a shop "having
  rozmanitost" reads translationese. If changed, the gloss may want to grow
  to "rozmanitost / výběr" so sentence and gloss stay in step. Left unchanged.
- `a2_misc` bank *unit*: "Každá jednotka má deset slov." — the sentence
  forces the textbook-unit reading, and that in Czech is **lekce**;
  *jednotka* is a unit of measurement (or a military/emergency unit), so
  "jednotka má deset slov" reads oddly. The gloss (unit = jednotka) is fine
  for the general sense — it's only this carrier sentence that lands on the
  wrong sense. Suggest a measurement carrier ("Metr je jednotka délky.") or
  cz → "Každá lekce má deset slov." with the gloss grown to "jednotka /
  lekce". Semantic, not grammatical, so left unchanged.

Clean, no log needed: the other 224 sentences. Correct oblique cases
throughout — genitives *podél řeky / mnoho přínosů / kousek chleba / sada
hrnků / druh čaje / láhev vody / hodně síly / zdroj života / z kovu /
z plastu / deset procent studentů (with correct sg. verb + gen. pl.
"je nových")*, accusatives *cigaretu / pozvánku / známku / miliardu lidí /
radu / důležitou roli*, locatives *v kruhu / ve zdi / v misce / na recepci /
v dobrém stavu*, instrumental-free but correct *Podle mého bratra*; vocative
*Milá Anno*; plurale tantum *Dveře jsou z kovu* with plural verb for singular
en *door* (same shape as the earlier luggage/rubbish calls); sám/sama/samy
agreement all correct incl. *Děti to udělaly samy*; idiomatic *Můj syn má
potíže* for "is in trouble", *Můj otec tady dřív pracoval* for "used to
work", *Můj syn dělá pokroky*, *To nemá smysl*, *Mám otevřít okno?* for
"Shall I…". No dictionary-nominative or possessive-agreement defects found
in any of the three banks.

## 2026-08-08 — second-opinion pass (cloud, ~23:00 UTC)

Scope: run 35's Czech — the final 2 A2 Use-stage sentence banks (a2_verbs 28,
a2_describing 61 sentences; all pure additions, no existing cz touched). This
closes the A2 Use backlog at 22/22. The other run-35 commits touched only
codex/ docs and AGENTS.md — no Czech to judge.

**Fixed: 0 · Flagged: 2 · everything else ok.**

For James:
- `a2_verbs` bank *receive*: "Každý student obdrží knihu." — grammatical
  (gnomic perfective with *každý* is fine), and it matches the pack's own
  gloss (*receive* = "obdržet"). But *obdržet* is officialese — everyday
  Czech is *dostat*: "Každý student dostane knihu." At A2 the formal verb
  is a register mismatch. If changed, grow the gloss to "obdržet / dostat"
  so sentence and gloss stay in step. Left unchanged.
- `a2_describing` bank *messy*: "Jeho pokoj je nepořádný." — matches the
  pack's gloss (*messy* = "nepořádný"), but *nepořádný* primarily describes
  a messy **person**; for a room the natural adjective is *neuklizený*,
  which would also mirror the very next sentence's tidy pair ("Její pokoj
  je uklizený") exactly. "Nepořádná domácnost" is attested, so defensible;
  left unchanged. If changed, sentence and gloss travel together.

Clean, no log needed: the other 87 sentences. The dropped-subject rule held
in both banks exactly as the commit messages claim — every subjectless
prompt fixes its person by 1sg/1pl morphology or imperative, and
a2_describing routes every predicate adjective through a 3rd-person or
inanimate subject, so no gendered form leaks the speaker. Correct oblique
cases throughout — dative *vyhýbám se centru* (+ gen. *města*), *táhne
židli ke stolu*; animate accusatives *zveme naše sousedy*; gen. pl.
*deset lidí*; accusatives *tuhle odpověď / velkou knihu / ranní vlak /
jinou knihu*; reflexives *si dělá starosti o mou sestru / si balím tašku*.
Agreement clean incl. plural *Ty děti jsou unavené*, masc.-anim. plural
*Tihle ptáci jsou vzácní*, and both long and short forms of schopný
("je schopná pomoci" / "není schopen chodit" — both correct). Idiomatic
throughout: *chytit ranní vlak*, *šetříme peníze na dovolenou*, *zvládá
tuhle práci*, the borrow/lend pair *půjčit si / půjčovat* correctly
distinguished. No dictionary-nominative, possessive-agreement, or
word-order calques found in either bank.

## 2026-08-08 — second-opinion pass (cloud, backlog)

Nothing new since run 35 (the branch tip is that run's own log), so per the
backlog rule reviewed the oldest never-reviewed pack:
**a1_core_frames_can_like_want** (12 frame items, all cz read).

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a1_core_frames_can_like_want` item *Would you like a coffee?*: cz
  "Dáš si kávu? / Chtěl bys kávu?" — the conditional alternate is masculine
  only, while every other gendered form in this pack gives both ("Mám rád /
  Mám ráda", "Dal bych si / Dala bych si"). Nothing wrong, cz is prompt-side;
  suggest "/ Chtěla bys kávu?" if the pack's own both-genders symmetry is
  wanted. Same shape as the 2026-08-08 ~15:00 adjectives flag. Left unchanged.

Clean, no log needed: the other 11 items — correct accusatives (kávu, zimu,
hudbu, vodu, lístek/jízdenku), idiomatic ability *Umím plavat / Umím
anglicky* (not the *můžu* calque), *Můžeš mi pomoct?*, *Dal(a) bych si kávu*
for "I'd like", and the dropped-subject "Má rád hudbu" is fixed as *he* by
masculine *rád*. No English-shaped Czech in the pack.

Still never reviewed after this pass: a1_core_frames_there_time,
a2_core_frames_chunks, b1_abstract, b1_collocations, b1_core_frames.

## 2026-08-08 — second-opinion pass (cloud, backlog #2)

Nothing new since the previous backlog pass (run 35's two banks were already
covered by the ~23:00 entry), so reviewed the next oldest never-reviewed pack:
**a1_core_frames_there_time** (12 frame items, all cz read).

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a1_core_frames_there_time` items *There is a table.* / *There is a café.*:
  the second cz alternate fronts the adverb — "**Tam je** stůl." / "**Tam je**
  kavárna." Fronted *tam* is the deictic order (pointing: "there's the table,
  over there"); the plain existential order is "Je tam stůl." As an alternate
  gloss for English *there is* it may nudge learners toward the pointing
  reading. Grammatical and defensible, so left unchanged; if changed, both
  items travel together.

Clean, no log needed: the other 10 items — correct existentials with
quantifiers (*Jsou tu dvě židle*, *Je tam spousta lidí / hodně lidí* with
singular verb + gen. pl.), question forms (*Je tu banka?*, *Jsou tu nějaké
obchody?*), time frames (*Je pondělí*, *Jsou tři hodiny / Je třetí hodina* —
both standard), and the dropped-subject rule holds throughout (*Vstávám v
šest*, *Večeříme v sedm*, *Uvidíme se zítra* all fixed by 1sg/1pl morphology).
*Obchod otevírá v devět* matches the form already judged fine on 2026-08-07.
No English-shaped Czech in the pack.

Still never reviewed after this pass: a2_core_frames_chunks, b1_abstract,
b1_collocations, b1_core_frames.

## 2026-08-08 — second-opinion pass (cloud, backlog #3)

Nothing new in the last day beyond Czech already covered by earlier entries
(everything through run 35 and both backlog passes is reviewed), so per the
backlog rule reviewed the next oldest never-reviewed pack:
**a2_core_frames_chunks** (12 chunk items, all cz read).

**Fixed: 0 · Flagged: 1 · everything else ok.**

For James:
- `a2_core_frames_chunks` item *No problem.*: cz "Žádný problém. / **Není
  zač.**" — *Není zač* is the standard reply to thanks and maps to English
  "You're welcome", which `accepts` doesn't take (only "No problem."). In
  gap mode the frame "No ____." constrains the answer, so this bites only
  in full-translation grading — but a student prompted with *Není zač* will
  plausibly produce "You're welcome". Either drop " / Není zač." or add
  "You're welcome." to `accepts` (English, so yours). Both glosses are
  individually correct; only the pairing drifts. Left unchanged.

Clean, no log needed: the other 11 items — idiomatic *Jsi v pořádku?*,
*A co ty?* for "What about you?", *Záleží na počasí* (correct locative),
*Podle mapy* (correct genitive), *Už tu nebydlím* for "any more", *Hezký
den* (elliptical accusative), formal imperative *Posaďte se, prosím*;
both-gender pairs given where 1sg is gendered (*Dal bych si / Dala bych
si*, *Nejsem si jistý / jistá*); the dropped-subject rule holds throughout
(*Uvidíme se později*, *Už tu nebydlím* fixed by 1pl/1sg morphology).
No English-shaped Czech in the pack.

Still never reviewed after this pass: b1_abstract, b1_collocations,
b1_core_frames.

## 2026-08-09 — second-opinion pass (cloud, backlog #4)

Nothing new since backlog #3 (the branch tip is that pass's own log commit),
so per the backlog rule reviewed the next oldest never-reviewed pack:
**b1_abstract** (24 gloss-level items, both blocks, all cz read; the pack
has no sentences[] bank and no intro, so glosses are the whole surface).

**Fixed: 0 · Flagged: 0 · everything ok.**

Clean, no log needed: all 24 glosses are correct standard Czech. The dual
glosses split real sense pairs, not padding — *zkušenost / zážitek*
(experience as skill vs. as event), *argument / hádka* (reasoning vs.
quarrel), *souhlas / dohoda* (consent vs. deal), *volba / výběr*, *účel /
smysl*, *úsilí / snaha*, *vývoj / rozvoj* — and *knowledge* = plural
"znalosti / vědomosti" matches the plural-knowledge call already
established in the a2_school bank. No English-shaped Czech in the pack.

One note outside my lane (English-side, changed nothing): *experience* and
*opportunity* declare the carrier `the_is_long`, which would render "The
opportunity is long" if a B1 Use stage is ever wired. Carriers are
data-only today and BUILD-DIGEST already flags this class of landmine, so
this is a pointer, not a new finding.

Still never reviewed after this pass: b1_collocations, b1_core_frames.
