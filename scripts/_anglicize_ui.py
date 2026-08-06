#!/usr/bin/env python3
"""Replace Polish UI chrome with English (RUE2 vocabulary). One-shot 2026-08-06."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Longest-first where needed; applied as plain str.replace in order
REPLACEMENTS: list[tuple[str, str]] = [
    # --- progress / status ---
    ('return "planowane"', 'return "planned"'),
    ('return "owoc"', 'return "done"'),
    ('return "żywe"', 'return "live"'),
    # --- smoke / explain ---
    ('aria-label="Zamknij">Zamknij', 'aria-label="Close">Close'),
    ('btn.textContent = "Dlaczego? · Why?"', 'btn.textContent = "Why?"'),
    ('"Dlaczego? · Why?"', '"Why?"'),
    # --- app.js ---
    ('rootChip("Kół"', 'rootChip("Foundation"'),
    ("Wybierz węzeł na ścieżce.", "Pick a unit on the path."),
    ('? "gramatyka" : "słówka"', '? "grammar" : "vocab"'),
    ("'żywe'", "'live'"),
    ('"żywe"', '"live"'),
    ("'planowane'", "'planned'"),
    ("'owoc'", "'done'"),
    ("'jednostka ✓'", "'done ✓'"),
    ("jednostka ✓", "done ✓"),
    (" · owoc", " · done"),
    (" · bez owocu", " · not done"),
    ("Para:", "Pair:"),
    ("Treść wkrótce / poza spine", "Content coming / off path"),
    ("Brak treści", "No content"),
    ('? "Tryb autorski WŁ" : "Tryb autorski"', '? "Author unlock ON" : "Author unlock"'),
    (
        "Autorski: A2+ otwarte (bez treści). Pełna korona słówek = sync show_full (później).",
        "Author: A2+ open (may lack content). Full canopy = sync show_full (later).",
    ),
    (
        "Hide · Ukryj drzewo i jednostki ▴",
        "Hide tree and units ▴",
    ),
    (
        "Show all units · Pokaż drzewo i jednostki ▾",
        "Show all units ▾",
    ),
    ("owoc · bursztyn = vocab", "done · amber = vocab"),
    ("next line + Dalej", "next line + Do next"),
    ("Tematy/map or Dalej", "Topics/map or Do next"),
    # --- tree portrait ---
    ('label: "Formy"', 'label: "Forms"'),
    ('label: "Czasowniki"', 'label: "Verbs"'),
    ('label: "Zdanie"', 'label: "Sentence"'),
    ('label: "Chunki"', 'label: "Chunks"'),
    ('label: "Spójniki"', 'label: "Linking"'),
    ('label: "Dom"', 'label: "Home"'),
    ('label: "Jedzenie"', 'label: "Food"'),
    ('label: "Czas wolny"', 'label: "Free time"'),
    ('label: "Praca"', 'label: "Work"'),
    ('label: "Miasto"', 'label: "City"'),
    ('label: "Zdrowie"', 'label: "Health"'),
    ('label: "Ciało"', 'label: "Body"'),
    ('label: "Nauka"', 'label: "School"'),
    ('label: "Komunikacja"', 'label: "Communication"'),
    ('label: "Pieniądze"', 'label: "Money"'),
    ('label: "Publiczne"', 'label: "Public life"'),
    ('label: "Wewnętrzne"', 'label: "Inner life"'),
    (
        "Młoda sadzonka — małe korzenie, mała korona.",
        "Young sapling — small roots, small canopy.",
    ),
    (
        "Rośnie z owocami · klik = węzeł na ścieżce",
        "Grows with fruit · click = path unit",
    ),
    ("A1 · gleba", "A1 · soil"),
    (
        "Wyższa sadzonka — korzenie głębiej.",
        "Taller sapling — deeper roots.",
    ),
    ("A2 · więcej gałęzi i odnóg", "A2 · more branches"),
    ("A2 · gleba", "A2 · soil"),
    (
        "Młode drzewko — szerszy system.",
        "Young tree — wider system.",
    ),
    ("B1 · gęstsze korzenie i korona", "B1 · denser roots and canopy"),
    ("B1 · gleba", "B1 · soil"),
    ("Rośnie w pełne drzewo.", "Growing into a full tree."),
    ("B2 · głęboki system", "B2 · deep system"),
    ("B2 · gleba", "B2 · soil"),
    (
        'aria-label="Sadzonka: korzenie gramatyka, pień i liście słówka"',
        'aria-label="Sapling: grammar roots, trunk and vocab leaves"',
    ),
    (">Kół · ${", ">Foundation · ${"),
    # copper → cyan in portrait constants (visual)
    ('copper: "#c87840"', 'copper: "#569cd6"'),
    ('copperDeep: "#8a5028"', 'copperDeep: "#3d6f9c"'),
    ('amber: "#e0a050"', 'amber: "#4db6c7"'),
    # --- practice-grammar ladder ---
    ('["intro", "Wstęp"]', '["intro", "Intro"]'),
    ('["check", "Kontrola"]', '["check", "Check"]'),
    ('["type", "Pisanie"]', '["type", "Type"]'),
    ('["use", "Użycie"]', '["use", "Use"]'),
    ('title: "Etap 1 · Wstęp"', 'title: "Stage 1 · Intro"'),
    (
        'sub: "Czytaj · Enter = Dalej · Backspace = Wstecz"',
        'sub: "Read · Enter = Next · Backspace = Back"',
    ),
    ('title: "Etap 2 · Kontrola"', 'title: "Stage 2 · Check"'),
    (
        '"Quiz · klawisze 1–4 · Enter = dalej"',
        '"Quiz · keys 1–4 · Enter = next"',
    ),
    (
        '"Dopasuj · lewo → prawo · Enter = dalej gdy skończysz"',
        '"Match · left → right · Enter = next when done"',
    ),
    ('title: "Etap 3 · Pisanie"', 'title: "Stage 3 · Type"'),
    (
        'sub: "Napisz formę · Enter = sprawdź · Enter = dalej"',
        'sub: "Type the form · Enter = check · Enter = next"',
    ),
    ('title: "Etap 4 · Użycie"', 'title: "Stage 4 · Use"'),
    (
        '"Całe zdanie po polsku · Enter = sprawdź · Enter = dalej"',
        '"Full sentence in English · Enter = check · Enter = next"',
    ),
    ('title: "Gotowe"', 'title: "Done"'),
    ('sub: "Enter = mapa"', 'sub: "Enter = map"'),
    ('aria-label="Etapy ćwiczenia"', 'aria-label="Practice stages"'),
    ("Wstęp · ${i + 1}", "Intro · ${i + 1}"),
    ('card.title || "Wstęp"', 'card.title || "Intro"'),
    (">← Wstecz</button>", ">← Back</button>"),
    ('last ? "Kontrola →" : "Dalej →"', 'last ? "Check →" : "Next →"'),
    (" · Dopasuj</h2>", " · Match</h2>"),
    ("Dopasowano ${", "Matched ${"),
    ("Enter = dalej</p>", "Enter = next</p>"),
    (
        'state.quizItems.length ? "Dalej do quizu →" : "Dalej →"',
        'state.quizItems.length ? "Next to quiz →" : "Next →"',
    ),
    (">Jeszcze raz</button>", ">Try again</button>"),
    (
        "kliknij lewo, potem prawo · kliknij ponownie (lub Esc), aby odznaczyć",
        "click left, then right · click again (or Esc) to deselect",
    ),
    (" · Quiz · Gotowe</h2>", " · Quiz · Done</h2>"),
    ("Wynik: <strong>", "Score: <strong>"),
    (
        "`${wrongN} błędów · powtórz albo idź do Pisania`",
        "`${wrongN} wrong · retry or go to Type`",
    ),
    (
        '"Wszystko poprawnie · dalej: Pisanie"',
        '"All clear · next: Type"',
    ),
    ("runda poprawkowa", "retry pass"),
    (">Powtórz błędy (${wrongN})</button>", ">Retry wrong (${wrongN})</button>"),
    (">Dalej do Pisania →</button>", ">Next to Type →</button>"),
    (">Cała talia od nowa</button>", ">Try full set</button>"),
    (" · wynik ${", " · score ${"),
    (' · poprawka"', ' · retry"'),
    (
        "Klawisze <strong>1–${choices.length}</strong> · po odpowiedzi Enter = dalej",
        "Keys <strong>1–${choices.length}</strong> · after answer Enter = next",
    ),
    ('? "✓ Poprawnie"', '? "✓ Correct"'),
    ('const title = kind === "type" ? "Pisanie" : "Użycie"', 'const title = kind === "type" ? "Type" : "Use"'),
    ('? "Dalej do Użycia →"', '? "Next to Use →"'),
    (': "Zakończ · podsumowanie →"', ': "Finish · summary →"'),
    (
        "`${wrongN} błędów · powtórz albo idź dalej`",
        "`${wrongN} wrong · retry or continue`",
    ),
    (
        '"Wszystko poprawnie · dalej: Użycie"',
        '"All clear · next: Use"',
    ),
    (
        '"Wszystko poprawnie · podsumowanie"',
        '"All clear · summary"',
    ),
    ('"Napisz po polsku:"', '"Write in English:"'),
    ('aria-label="Uzupełnij końcówkę"', 'aria-label="Fill the ending"'),
    (">Sprawdź</button>", ">Check</button>"),
    ('placeholder="po polsku…" lang="pl"', 'placeholder="type in English…" lang="en"'),
    (
        'kind === "type" ? (isGap ? "Końcówki" : "Pisanie") : "Użycie"',
        'kind === "type" ? (isGap ? "Endings" : "Type") : "Use"',
    ),
    (
        "Tylko <strong>końcówka</strong> · diakrytyki ważne",
        "Only the <strong>ending</strong>",
    ),
    ("✓ Poprawnie · ${", "✓ Correct · ${"),
    ('"✓ Poprawnie") + (retype ? " (przepisane)"', '"✓ Correct") + (retype ? " (retyped)"'),
    (">Przepisz poprawnie →</button>", ">Rewrite correctly →</button>"),
    ('btn.textContent = "Sprawdź"', 'btn.textContent = "Check"'),
    ('btn.textContent = "Dalej →"', 'btn.textContent = "Next →"'),
    (" · Gotowe</h2>", " · Done</h2>"),
    ("Owoc zdobyty.", "Fruit earned."),
    ("Drabinka skończona.", "Ladder finished."),
    ("Kontrola: ${bCheck}", "Check: ${bCheck}"),
    ("Pisanie: ${bType}", "Type: ${bType}"),
    ("Użycie: ${", "Use: ${"),
    ("Postęp lokalny · EN → PL", "Progress stays in this browser · write in English"),
    (">Ćwicz ponownie</button>", ">Practice again</button>"),
    (">← Do mapy</button>", ">← Back to map</button>"),
    # leftover grammar PL fragments
    ("Enter = dalej", "Enter = next"),
    ("Enter = Dalej", "Enter = Next"),
    ("Backspace = Wstecz", "Backspace = Back"),
    # --- practice-vocab ---
    ('["match", "Dopasuj"]', '["match", "Match"]'),
    ('["type", "Słowo"]', '["type", "Type"]'),
    ('["sentence", "Zdanie"]', '["sentence", "Sentence"]' if False else '["sentence", "Use"]'),
    # sentence mode label as Use to match RUE2, or Sentence - user said Match Quiz Type Use/Sentence
    # I'll use Sentence for vocab sentence stage as RUE3 often does, but user said Use/Sentence - Use is fine
    ('if (hasIntro) base.unshift(["intro", "Wstęp"])', 'if (hasIntro) base.unshift(["intro", "Intro"])'),
    (
        "`${block.items.length} ram · A1 · rdzeń pnia`",
        "`${block.items.length} frames · A1 · trunk`",
    ),
    (
        "`${block.items.length} słów · ${bankN} zdań · A1`",
        "`${block.items.length} words · ${bankN} sentences · A1`",
    ),
    (
        "`${block.items.length} słów · A1`",
        "`${block.items.length} words · A1`",
    ),
    (">Pisz po polsku</span>", ">Write in English</span>"),
    (">← Wróć do drzewa</button>", ">← Back to map</button>"),
    (">Dopasuj · Gotowe</div>", ">Match · Done</div>"),
    ("Dalej: Quiz · Enter kontynuuje", "Next: Quiz · Enter continues"),
    (">Nowa talia</button>", ">New set</button>"),
    (
        "Kliknij słowo, potem jego parę · kliknij ponownie (lub Esc), aby odznaczyć",
        "Click a word, then its pair · click again (or Esc) to deselect",
    ),
    (">Quiz skończony</div>", ">Quiz done</div>"),
    (
        "`${wrongN} do powtórki · lub idź do Słowa`",
        "`${wrongN} to retry · or go to Type`",
    ),
    (
        '"Wszystko poprawnie · dalej: Słowo"',
        '"All clear · next: Type"',
    ),
    (" (runda poprawkowa)", " (retry pass)"),
    (">3 · Słowo →</button>", ">3 · Type →</button>"),
    (
        "`Gotowe · błędy: ${wrongN}`",
        "`Done · wrong: ${wrongN}`",
    ),
    ("`Gotowe · ${q.score}/${passLen}`", "`Done · ${q.score}/${passLen}`"),
    (
        'Wybierz wersję ${state.plToEn ? "angielską" : "polską"} — odpowiedz 1–4 · Enter = dalej',
        'Choose the ${state.plToEn ? "English" : "Czech"} version — answer 1–4 · Enter = next',
    ),
    (
        '`${q.retryPass ? "Poprawka" : "Pytanie"} ${q.pos + 1} z ${passLen} · wynik ${q.score}',
        '`${q.retryPass ? "Retry" : "Question"} ${q.pos + 1} of ${passLen} · score ${q.score}',
    ),
    (
        "`${wrongN} do powtórki · lub idź do Zdania`",
        "`${wrongN} to retry · or go to Use`",
    ),
    (
        '"Wszystko poprawnie · dalej: Zdanie"',
        '"All clear · next: Use"',
    ),
    (">Pisanie skończone</div>", ">Type done</div>"),
    (">4 · Zdanie →</button>", ">4 · Use →</button>"),
    ("`Gotowe · ${t.score}/${passLen}`", "`Done · ${t.score}/${passLen}`"),
    (
        '"Uzupełnij brakujące polskie słowo · Enter = sprawdź / dalej"',
        '"Fill the missing English word · Enter = check / next"',
    ),
    (
        '`Napisz ${state.plToEn ? "po angielsku" : "po polsku"} · Enter = sprawdź / dalej`',
        '`Write ${state.plToEn ? "in English" : "in Czech"} · Enter = check / next`',
    ),
    ('? "poprawka" : "talia"', '? "retry" : "set"'),
    (">Pokaż odpowiedź</button>", ">Show answer</button>"),
    ('? "Wynik →" : "Dalej"', '? "Score →" : "Next"'),
    ('fb.textContent = "✓ Poprawnie"', 'fb.textContent = "✓ Correct"'),
    (
        "✓ Poprawnie — z ogonkami:",
        "✓ Correct — with spelling:",
    ),
    (
        "Prawie — sprawdź końcówkę i spróbuj jeszcze raz.",
        "Almost — check the ending and try again.",
    ),
    ("✗ Odpowiedź:", "✗ Answer:"),
    (
        's.textContent = "Miałem rację → policz to"',
        's.textContent = "I was right → count it"',
    ),
    ("zaliczone ✓", "counted ✓"),
    (
        '"Pełne polskie zdania z angielskiego — podstawowe ramy działają."',
        '"Full English sentences from the prompt — core frames."',
    ),
    (
        '"Krótkie tłumaczenia EN → PL · wzorce z poprzednich jednostek."',
        '"Short translations into English · patterns from earlier units."',
    ),
    (">Część gotowa</div>", ">Stage done</div>"),
    ("`${wrongN} do powtórki`", "`${wrongN} to retry`"),
    (">Wróć do mapy →</button>", ">Back to map →</button>"),
    (">1 · Dopasuj</button>", ">1 · Match</button>"),
    (
        "· napisz po polsku</div>",
        "· write in English</div>",
    ),
    (
        "Przetłumacz na polski · Enter = sprawdź / dalej",
        "Translate into English · Enter = check / next",
    ),
    ('placeholder="napisz polskie zdanie…"', 'placeholder="write the English sentence…"'),
    ('placeholder="pisz tutaj…"', 'placeholder="type here…"'),
    (">Podpowiedź · rama</button>", ">Hint · frame</button>"),
    ("Rama:", "Frame:"),
    ('? "Zakończ ✓" : "Dalej"', '? "Finish ✓" : "Next"'),
    ("Zdanie <strong>${t.pos + 1}</strong> z <strong>${passLen}</strong>", "Sentence <strong>${t.pos + 1}</strong> of <strong>${passLen}</strong>"),
    (
        "`Zdanie ${t.pos + 1} z ${passLen} · wynik ${t.score}",
        "`Sentence ${t.pos + 1} of ${passLen} · score ${t.score}",
    ),
    (">Zdanie · wkrótce</div>", ">Use · coming soon</div>"),
    (
        "Tu będą krótkie tłumaczenia EN → PL (gotowe wzorce z wcześniejszych jednostek).",
        "Short translations into English will live here (frames from earlier units).",
    ),
    (
        "Ten pakiet nie ma jeszcze banku zdań — wróć do Dopasuj / Quiz / Słowo.",
        "This pack has no sentence bank yet — go back to Match / Quiz / Type.",
    ),
    (">3 · Słowo</button>", ">3 · Type</button>"),
    ('return "Zdanie · wkrótce"', 'return "Use · coming soon"'),
    (">Dalej → Dopasuj</button>", ">Next → Match</button>"),
    (
        'return "Wstęp · czytaj · Enter = dalej"',
        'return "Intro · read · Enter = next"',
    ),
    (" · talia ${shown}/", " · deck ${shown}/"),
    # structure labels in vocab
    ('poss_nom: "mój / twój (mianownik)"', 'poss_nom: "my / your (nominative)"'),
    ('present: "czas teraźniejszy"', 'present: "present tense"'),
    ('to_jest: "To jest…"', 'to_jest: "This is…"'),
    # gender f label
    ("f: \"ż.\"", 'f: "f."'),
    ("pl: \"mn.\"", 'pl: "pl."'),
    # common leftovers
    ("Dopasowano ", "Matched "),
    ("Gotowe · ", "Done · "),
    ("Dalej →", "Next →"),
    ("Wstecz", "Back"),
    ("powtórz", "retry"),
    ("błędów", "wrong"),
    ("błędy", "wrong"),
    ("poprawnie", "correct"),
    ("Poprawnie", "Correct"),
    ("Sprawdź", "Check"),
    ("Dalej", "Next"),
    ("Zakończ", "Finish"),
    ("Wynik", "Score"),
    ("Pytanie", "Question"),
    ("Poprawka", "Retry"),
    ("talia", "deck"),
    ("Talia", "Deck"),
    (" z ${", " of ${"),  # careful - might break English "with ${" - only if still PL pattern
]

# Fix the broken sentence mode line - I used a ternary wrongly
# Re-apply sentence label properly after

FILES = [
    "js/progress.js",
    "js/smoke-flags.js",
    "js/explain.js",
    "js/app.js",
    "js/tree-portrait.js",
    "js/practice-grammar.js",
    "js/practice-vocab.js",
    "css/app.css",
]


def main():
    # Fix replacements list: sentence mode
    reps = []
    for a, b in REPLACEMENTS:
        if "if False else" in b:
            reps.append((a, '["sentence", "Use"]'))
        else:
            reps.append((a, b))

    # Sort by length of old string descending for safer replace? 
    # Order matters for some - keep manual order
    
    for rel in FILES:
        path = ROOT / rel
        if not path.is_file():
            print("skip", rel)
            continue
        text = path.read_text(encoding="utf-8")
        orig = text
        for old, new in reps:
            if old in text:
                text = text.replace(old, new)
        if text != orig:
            path.write_text(text, encoding="utf-8")
            print("updated", rel, "delta", len(text) - len(orig))
        else:
            print("no change", rel)

    # docs
    doc = ROOT / "docs" / "TREE-AND-CODEX.md"
    if doc.is_file():
        t = doc.read_text(encoding="utf-8")
        t2 = t
        doc_reps = [
            (
                "Learner sees: *Formy · Czasowniki · Zdanie · Chunki · Spójniki · Kół* (or refined PL labels)",
                "Learner sees: *Forms · Verbs · Sentence · Chunks · Linking · Foundation* (EN seats)",
            ),
            (
                "“Zrób to dalej” / path list / Ćwicz remain the work UI",
                "“Do next” / path list / Practice remain the work UI",
            ),
            ("| Kół / fundament |", "| Foundation |"),
            ("| Czasowniki |", "| Verbs |"),
            ("| Formy |", "| Forms |"),
            ("| Spójniki / przyimki |", "| Linking / prepositions |"),
            ("| spójniki złożone |", "| complex linkers |"),
            ("| Kół |", "| Foundation |"),
            ("Student-facing (PL example)", "Student-facing (EN example)"),
            ("(or refined PL labels)", "(EN labels)"),
        ]
        for a, b in doc_reps:
            t2 = t2.replace(a, b)
        # table cells that are only Polish names
        t2 = t2.replace("`Formy`", "`Forms`")
        t2 = t2.replace("`Czasowniki`", "`Verbs`")
        t2 = t2.replace("Kół", "Foundation")
        t2 = t2.replace("Ćwicz", "Practice")
        t2 = t2.replace("przyimki", "prepositions")
        if t2 != t:
            doc.write_text(t2, encoding="utf-8")
            print("updated docs/TREE-AND-CODEX.md")

    css = ROOT / "css" / "app.css"
    if css.is_file():
        c = css.read_text(encoding="utf-8")
        c2 = c.replace(
            "/* Mode tabs — Dopasuj / Quiz / Słowo / Zdanie */",
            "/* Mode tabs — Match / Quiz / Type / Use */",
        ).replace(
            '/* Status bar: "Pytanie 1 z 24 · wynik 0" + direction toggle */',
            '/* Status bar: "Question 1 of 24 · score 0" + direction toggle */',
        )
        if c2 != c:
            css.write_text(c2, encoding="utf-8")
            print("updated css comments")

    print("done")


if __name__ == "__main__":
    main()
