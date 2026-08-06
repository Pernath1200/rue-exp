# Polish UI audit — rue-exp · 2026-08-06

**Status:** **Fixed same day** — user-visible PL chrome anglicized (RUE2 labels).  
Rescan of `js/*` + `index.html`: **0** remaining UI hits (diacritic fold maps in graders excepted).

**Scope:** shell + practice engines + map portrait.  
**Not in scope as “UI leaks”:** Czech pack fields (`cz`, `*_cz`) used as L1 scaffolding for English learning.  
**Method:** full-file scan + diacritic/lexicon search + dual explore agents on JS vs data/docs.

---

## Executive summary

| Area | Polish in learner/author UI? |
|------|------------------------------|
| `index.html` home chrome | **Clean EN** |
| `data/spine.json` / `data/tree.json` labels | **Clean EN** (path unit titles OK) |
| Pack content `cz` fields | Intentional **Czech**, not Polish chrome |
| **`practice-grammar.js`** | **Heavy PL** — entire ladder chrome |
| **`practice-vocab.js`** | **Heavy PL** — entire mode chrome + EN↔PL production copy |
| **`tree-portrait.js`** | **Heavy PL** — roots, houses, growth captions |
| **`app.js`** (detail, author, pills) | **Moderate PL** |
| **`progress.js`** (path status) | **Moderate PL** (`żywe` / `owoc` / `planowane`) |
| **`smoke-flags.js`** | **1 string** (`Zamknij`) |
| **`explain.js`** | **Bilingual** (`Dlaczego? · Why?`) |
| CSS / docs | Comments + historical PL design notes |

**Why one click still shows Polish:** outer home is EN; **first Practice open** or **Map → Tree / unit detail** hits engines and portrait that were cloned from **rupl-exp** and never anglicized.

**Rough counts (user-visible PL strings):**

| File | ~UI hits |
|------|--------:|
| practice-vocab.js | ~70–80 |
| practice-grammar.js | ~55–70 |
| tree-portrait.js | ~25–30 |
| app.js | ~12–18 |
| progress.js | 3 unique labels (× call sites) |
| smoke-flags.js | 1 |
| explain.js | 1 |
| **Total** | **~170–200 distinct UI strings** |

Plus ~25 comment-only / ~10 non-UI diacritic-normalizer lines.

---

## Severity bands

| Band | Meaning | Action |
|------|---------|--------|
| **P0 — one click** | Visible without hunting | Anglicize first |
| **P1 — practice** | All ladder/mode chrome | Full string table EN |
| **P2 — map portrait** | Tree metaphor labels | EN seats + captions |
| **P3 — author/smoke** | Testers only | EN |
| **P4 — docs/comments** | Not runtime | Optional |

---

## P0 — Visible after minimal interaction

### Path list status (`progress.js`)

| EN replacement | Current PL |
|----------------|------------|
| live | `żywe` |
| fruit / done | `owoc` |
| planned | `planowane` |

Shown on every path row via `progressLabel()`.

### Unit detail (`app.js`)

| Context | PL now |
|---------|--------|
| Empty detail | `Wybierz węzeł na ścieżce.` |
| Domain pill | `gramatyka` / `słówka` |
| Status pills | `żywe`, `planowane`, `owoc`, `jednostka ✓` |
| No content CTA | `Treść wkrótce / poza spine` · `Brak treści` |
| Partner line (author) | `Para:` · `owoc` / `bez owocu` |
| Roots chip | `Kół` |
| Author button | `Tryb autorski` / `Tryb autorski WŁ` |
| Author hint | `Autorski: A2+ otwarte… Pełna korona słówek…` |
| Map more (if shown) | `Ukryj drzewo…` / `Pokaż drzewo…` |

### Map tree (`tree-portrait.js`) — open Map

**Grammar laterals:** Formy, Czasowniki, Zdanie, Chunki, Spójniki (+ Kół %)  
**Houses:** Dom, Jedzenie, Czas wolny, Praca, Miasto, Zdrowie, Ciało, Nauka, Komunikacja, Pieniądze, Publiczne, Wewnętrzne  
**Captions / soil:** Młoda sadzonka…, gleba, korzenie, korona, etc.  
**aria-label:** Sadzonka: korzenie gramatyka…

---

## P1 — Practice engines (dominant leak)

### Grammar ladder labels (`practice-grammar.js`)

| Mode id | PL label | Suggested EN |
|---------|----------|--------------|
| intro | Wstęp | Intro |
| check | Kontrola | Check |
| type | Pisanie | Type |
| use | Użycie | Use |
| match phase | Dopasuj | Match |

**Buttons / gates (sample):** Dalej, Wstecz, Sprawdź, Powtórz błędy, Cała talia od nowa, Dalej do Pisania, Dalej do Użycia, Zakończ, Ćwicz ponownie, ← Do mapy, Jeszcze raz…

**Hints / feedback:** Czytaj · Enter = Dalej…, Napisz formę…, Całe zdanie **po polsku**, Wynik, błędów, Wszystko poprawnie, poprawka, Poprawnie, Przepisz poprawnie, Drabinka skończona, Owoc zdobyty, Postęp lokalny · **EN → PL**, placeholder `po polsku…`, lang=`pl`.

**Product note for EN merge:** production direction should become **CZ → EN** (or EN practice), not “write Polish”.

### Vocab modes (`practice-vocab.js`)

| Mode | PL | Suggested EN |
|------|-----|--------------|
| match | Dopasuj | Match |
| type | Słowo | Word / Type |
| sentence | Zdanie | Sentence |
| intro | Wstęp | Intro |

**Heavy PL:** Wróć do drzewa, Pisz po polsku, Quiz skończony, Powtórz błędy, Cała talia od nowa, Wybierz wersję polską/angielską, Napisz po polsku, Przetłumacz na polski, Pokaż odpowiedź, Podpowiedź · rama, Miałem rację → policz to, Zdanie · wkrótce, talia N/M, rdzeń pnia, słów, zdań, gender `ż.`, structure labels (`mianownik`, `czas teraźniejszy`…).

**Diacritic fold map (ą→a …):** not UI; keep for any PL content if retained, or replace with EN normalizer later.

---

## P2 — Smoke / explain

| File | PL |
|------|-----|
| smoke-flags.js | `Zamknij` (button + aria) |
| explain.js | `Dlaczego? · Why?` |

---

## P3 — Non-runtime

| File | Notes |
|------|--------|
| css/app.css | Comments: Dopasuj / Słowo / Zdanie / Pytanie… |
| docs/TREE-AND-CODEX.md | Historical PL student labels (Formy, Ćwicz, Kół…) |
| practice file headers | Comments only |

---

## Explicitly NOT Polish UI leaks

1. **`data/tree.json` / `spine.json` unit titles** — English.  
2. **Pack `cz` / `explanation_cz` / intro `*_cz`** — Czech L1 scaffolding for RUE (intentional).  
3. **`default_direction: cz_to_en`** — Czech → English, not Polish.  
4. **`index.html`** primary chrome — already EN (Do next, Topics, etc.).  

---

## Where Polish is injected from

```
rupl-exp clone
  ├── practice-grammar.js   ← full PL ladder
  ├── practice-vocab.js     ← full PL modes + PL production
  ├── tree-portrait.js      ← PL metaphor labels
  ├── progress.js           ← PL status words
  └── app.js detail/author  ← partial PL
```

Data layer was resynced to EN/CZ packs; **chrome engines were not rewritten**.

---

## Recommended fix order

1. **String table pass** — single EN dictionary for ladder modes + common buttons (Next, Back, Check, Retry wrong, Try full set, Score, Practice again, Back to map).  
2. **progress.js + app.js pills** — live / planned / done (fruit).  
3. **tree-portrait.js** — EN seats (Forms, Verbs, Sentence… / Home, Food…) aligned with RUE codex houses.  
4. **Direction copy** — remove “po polsku / EN→PL”; use CZ→EN or EN practice language.  
5. **smoke Zamknij → Close**; explain → `Why?` only.  
6. Docs/comments last.

**Estimate:** ~200 UI strings; mostly concentrated in 2 practice files + portrait.

---

## Verification after fix

```text
1. rg diacritics + PL lexicon in js/ index.html (exclude data/**/blocks and diacritic fold map)
2. Click path: no żywe/owoc
3. Open Map tree: no Formy/Dom/sadzonka
4. Practice grammar + vocab full ladder: no Dalej/Wstęp/po polsku
5. Author unlock: no Tryb autorski
```

---

## Appendix — file line anchors (representative)

See live files for full list; agents + line scan 2026-08-06:

- `js/practice-grammar.js` — modes ~310–348, gates ~749–1215, type ~1045–1165  
- `js/practice-vocab.js` — modes ~669–721, all stage finishes ~810–1532  
- `js/tree-portrait.js` — ~10–100, 425, 487  
- `js/app.js` — ~410–693, 860–861  
- `js/progress.js` — ~133–243  
- `js/smoke-flags.js` — ~166  
- `js/explain.js` — ~13  
