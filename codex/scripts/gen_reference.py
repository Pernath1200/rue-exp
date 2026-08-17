#!/usr/bin/env python3
"""
gen_reference.py — build data/reference.json for RUE's Tables panel.

Structure follows James's 2026-08-17 ruling (second pass): grouped by LEVEL,
not by grammatical pattern, and no progress dimming — the level grouping
already carries the progression, so dimming was doing the same job twice.
Tables are plain lists; every row is practisable.

  Irregular verbs   A1 · A2 · B1 · B1+          (three forms to memorise)
  Prepositions      A1 · A2 · B1                (B1 = dependent prepositions)
  Pronouns          personal/possessive/reflexive · this-that
  Tenses            one row per tense, one verb throughout
  Spelling & pairs  stub
  Numbers & dates   stub

LEVELLING IS A TEACHING JUDGEMENT, not derived. Both automatic sources were
tried and rejected: the Oxford CEFR bands rate a word SENSE (they put `say` at
C1 and `go` at B1), and the app's own path puts 54 of 66 verbs in A1. This
split is a curated first pass for James to correct.

Sections are generic and drive both the table and the practice pool:
  columns : [{key,label}]          -> the table
  drill   : [{from,to,label}]      -> cue "<row[from]> · <label>" answer row[to]
                                      (label omitted -> cue is just row[from])
  row.drills : [{cue,answer}]      -> explicit pairs, for anything irregular
Adding a table is a data job, not a code job.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
OUT = ROOT / "data" / "reference.json"

# --------------------------------------------------------------- verbs

V_COLUMNS = [
    {"key": "base", "label": "Base"},
    {"key": "past", "label": "Past simple"},
    {"key": "pp", "label": "Past participle"},
]
V_DRILL = [
    {"from": "base", "to": "past", "label": "past"},
    {"from": "base", "to": "pp", "label": "participle"},
]

# (base, past, participle, note)
FORMS = {
    "be": ("was / were", "been", "the only verb with two past forms: I/he was, you/we/they were"),
    "become": ("became", "become", ""),
    "begin": ("began", "begun", ""),
    "break": ("broke", "broken", ""),
    "bring": ("brought", "brought", ""),
    "build": ("built", "built", ""),
    "buy": ("bought", "bought", ""),
    "catch": ("caught", "caught", ""),
    "choose": ("chose", "chosen", ""),
    "come": ("came", "come", ""),
    "cost": ("cost", "cost", ""),
    "cut": ("cut", "cut", ""),
    "do": ("did", "done", ""),
    "drink": ("drank", "drunk", ""),
    "drive": ("drove", "driven", ""),
    "eat": ("ate", "eaten", ""),
    "fall": ("fell", "fallen", ""),
    "feel": ("felt", "felt", ""),
    "find": ("found", "found", ""),
    "fly": ("flew", "flown", ""),
    "forget": ("forgot", "forgotten", ""),
    "get": ("got", "got", "American English uses gotten for the participle"),
    "give": ("gave", "given", ""),
    "go": ("went", "gone", ""),
    "grow": ("grew", "grown", ""),
    "have": ("had", "had", ""),
    "hear": ("heard", "heard", ""),
    "hold": ("held", "held", ""),
    "keep": ("kept", "kept", ""),
    "know": ("knew", "known", ""),
    "learn": ("learnt", "learnt", "learned is also correct, and usual in American English"),
    "leave": ("left", "left", ""),
    "lend": ("lent", "lent", ""),
    "let": ("let", "let", ""),
    "lose": ("lost", "lost", ""),
    "make": ("made", "made", ""),
    "mean": ("meant", "meant", ""),
    "meet": ("met", "met", ""),
    "pay": ("paid", "paid", ""),
    "put": ("put", "put", ""),
    "read": ("read", "read", "spelled the same, said differently: /riːd/ → /red/"),
    "ride": ("rode", "ridden", ""),
    "ring": ("rang", "rung", ""),
    "run": ("ran", "run", ""),
    "say": ("said", "said", ""),
    "see": ("saw", "seen", ""),
    "sell": ("sold", "sold", ""),
    "send": ("sent", "sent", ""),
    "shut": ("shut", "shut", ""),
    "sing": ("sang", "sung", ""),
    "sit": ("sat", "sat", ""),
    "sleep": ("slept", "slept", ""),
    "speak": ("spoke", "spoken", ""),
    "spend": ("spent", "spent", ""),
    "stand": ("stood", "stood", ""),
    "swim": ("swam", "swum", ""),
    "take": ("took", "taken", ""),
    "teach": ("taught", "taught", ""),
    "tell": ("told", "told", ""),
    "think": ("thought", "thought", ""),
    "throw": ("threw", "thrown", ""),
    "understand": ("understood", "understood", ""),
    "wake": ("woke", "woken", ""),
    "wear": ("wore", "worn", ""),
    "win": ("won", "won", ""),
    "write": ("wrote", "written", ""),
}

VERB_LEVELS = [
    ("v_a1", "A1", "the first twenty",
     "You cannot say much without these. Learn all three forms together, out "
     "loud — be · was · been, not be … was … er … been.",
     ["be", "have", "do", "go", "get", "make", "say", "see", "come", "take",
      "know", "give", "think", "find", "tell", "put", "eat", "drink", "read",
      "write"]),
    ("v_a2", "A2", "the next twenty",
     "Everyday verbs you already use in the present. The work here is only "
     "the past forms.",
     ["begin", "break", "bring", "buy", "catch", "choose", "drive", "fall",
      "feel", "forget", "hear", "keep", "leave", "lose", "meet", "pay", "run",
      "sit", "sleep", "speak"]),
    ("v_b1", "B1", "widening out",
     "Less frequent, but they turn up constantly in reading and in stories.",
     ["become", "build", "cost", "cut", "fly", "grow", "hold", "learn",
      "lend", "let", "mean", "ride", "sell", "send", "sing"]),
    ("v_b1plus", "B1+", "the last stretch",
     "The tail of the common irregulars. Once these are in, the ordinary "
     "irregular verb holds no surprises.",
     ["ring", "shut", "spend", "stand", "swim", "teach", "throw",
      "understand", "wake", "wear", "win"]),
]

# ---------------------------------------------------------- prepositions

P_COLUMNS = [
    {"key": "prep", "label": "Preposition"},
    {"key": "use", "label": "Used for"},
    {"key": "example", "label": "Example"},
]
# The cue is the gapped sentence; the answer is the preposition.
P_DRILL = [{"from": "gap", "to": "prep", "label": ""}]

PREPS = [
    ("p_a1", "A1", "place, time and the basic three",
     "Czech v covers in, on and at, so these three can never be translated "
     "one-to-one. Learn them by the picture and by the phrase.", [
         ("in", "inside something; months and years", "I live in Prague.", "I live ___ Prague."),
         ("on", "on a surface; days of the week", "The book is on the table.", "The book is ___ the table."),
         ("at", "at a point; clock times", "I get up at six.", "I get up ___ six."),
         ("to", "where you are going", "I go to school.", "I go ___ school."),
         ("from", "where you started", "I come from Brno.", "I come ___ Brno."),
         ("with", "together", "I live with my brother.", "I live ___ my brother."),
         ("for", "who gets it", "This is for you.", "This is ___ you."),
         ("of", "belonging; what it is made of", "a cup of coffee", "a cup ___ coffee"),
         ("under", "below", "The bag is under the table.", "The bag is ___ the table."),
         ("behind", "at the back of", "The car is behind the house.", "The car is ___ the house."),
         ("next to", "beside", "She sits next to me.", "She sits ___ me."),
         ("between", "in the middle of two", "It is between the two shops.", "It is ___ the two shops."),
         ("near", "close to", "I live near the station.", "I live ___ the station."),
         ("before", "earlier than", "I have coffee before work.", "I have coffee ___ work."),
         ("after", "later than", "I rest after lunch.", "I rest ___ lunch."),
     ]),
    ("p_a2", "A2", "movement and longer time",
     "Most of these describe a path rather than a place. If something moves, "
     "the preposition usually changes.", [
         ("into", "movement to the inside", "He went into the room.", "He went ___ the room."),
         ("out of", "movement to the outside", "She came out of the house.", "She came ___ the house."),
         ("through", "in one side and out the other", "We walked through the park.", "We walked ___ the park."),
         ("across", "from one side to the other", "We walked across the bridge.", "We walked ___ the bridge."),
         ("along", "following a line", "We walked along the river.", "We walked ___ the river."),
         ("over", "above, or from one side to the other", "The plane flew over the city.", "The plane flew ___ the city."),
         ("around", "in a circle, or here and there", "We walked around the town.", "We walked ___ the town."),
         ("by", "beside; or how you travel", "I go by train.", "I go ___ train."),
         ("without", "not having it", "I drink coffee without sugar.", "I drink coffee ___ sugar."),
         ("during", "through a period", "I slept during the film.", "I slept ___ the film."),
         ("until", "up to a time, then it stops", "I work until five.", "I work ___ five."),
         ("since", "from a point in the past until now", "I have lived here since 2020.", "I have lived here ___ 2020."),
     ]),
    ("p_b1", "B1", "prepositions that belong to a word",
     "These are not chosen by meaning — the word in front simply takes that "
     "preposition and no other. Czech uses a case instead, so there is "
     "nothing to translate. Learn the pair as one item.", [
         ("at", "good / bad at something", "She is good at maths.", "She is good ___ maths."),
         ("in", "interested in something", "I am interested in history.", "I am interested ___ history."),
         ("on", "depend on somebody", "It depends on the weather.", "It depends ___ the weather."),
         ("to", "listen to something", "I listen to music.", "I listen ___ music."),
         ("for", "wait for somebody", "I am waiting for the bus.", "I am waiting ___ the bus."),
         ("for", "look for something you lost", "I am looking for my keys.", "I am looking ___ my keys."),
         ("after", "look after somebody", "She looks after her mother.", "She looks ___ her mother."),
         ("of", "afraid of something", "He is afraid of dogs.", "He is afraid ___ dogs."),
         ("to", "married to somebody", "She is married to a doctor.", "She is married ___ a doctor."),
         ("to", "belong to somebody", "This book belongs to me.", "This book belongs ___ me."),
         ("about", "think about something", "I am thinking about the test.", "I am thinking ___ the test."),
         ("with", "agree with somebody", "I agree with you.", "I agree ___ you."),
     ]),
]

# -------------------------------------------------------------- pronouns

PRON_COLUMNS = [
    {"key": "subject", "label": "Subject"},
    {"key": "object", "label": "Object"},
    {"key": "poss_adj", "label": "Possessive + noun"},
    {"key": "poss_pron", "label": "Possessive alone"},
    {"key": "reflexive", "label": "Reflexive"},
]
PRON_DRILL = [
    {"from": "subject", "to": "object", "label": "object"},
    {"from": "subject", "to": "poss_adj", "label": "possessive + noun"},
    {"from": "subject", "to": "poss_pron", "label": "possessive alone"},
    {"from": "subject", "to": "reflexive", "label": "reflexive"},
]

PRONOUNS = [
    ("I", "me", "my", "mine", "myself"),
    ("you", "you", "your", "yours", "yourself"),
    ("he", "him", "his", "his", "himself"),
    ("she", "her", "her", "hers", "herself"),
    ("it", "it", "its", "—", "itself"),
    ("we", "us", "our", "ours", "ourselves"),
    ("they", "them", "their", "theirs", "themselves"),
]

DEM_COLUMNS = [
    {"key": "word", "label": "Word"},
    {"key": "number", "label": "One or more"},
    {"key": "distance", "label": "Near or far"},
    {"key": "example", "label": "Example"},
]
DEMONSTRATIVES = [
    ("this", "one", "near you", "This is my bag.", "___ is my bag. (one, here)"),
    ("that", "one", "further away", "That is my car.", "___ is my car. (one, over there)"),
    ("these", "more than one", "near you", "These are my keys.", "___ are my keys. (more than one, here)"),
    ("those", "more than one", "further away", "Those are my shoes.", "___ are my shoes. (more than one, over there)"),
]

# ---------------------------------------------------------------- tenses

T_COLUMNS = [
    {"key": "tense", "label": "Tense"},
    {"key": "form", "label": "Form"},
    {"key": "example", "label": "Example"},
]

# (tense, form, example, drill answer) — one verb throughout, so the pattern
# reads straight down the column.
TENSES = [
    ("present simple", "work / works", "He works here.", "he works"),
    ("present continuous", "am / is / are + -ing", "He is working.", "he is working"),
    ("present perfect", "have / has + participle", "He has worked here.", "he has worked"),
    ("present perfect continuous", "have / has been + -ing", "He has been working.", "he has been working"),
    ("past simple", "worked", "He worked here.", "he worked"),
    ("past continuous", "was / were + -ing", "He was working.", "he was working"),
    ("past perfect", "had + participle", "He had worked.", "he had worked"),
    ("past perfect continuous", "had been + -ing", "He had been working.", "he had been working"),
    ("future with will", "will + base", "He will work.", "he will work"),
    ("future continuous", "will be + -ing", "He will be working.", "he will be working"),
    ("future perfect", "will have + participle", "He will have worked.", "he will have worked"),
    ("going to", "am / is / are going to + base", "He is going to work.", "he is going to work"),
]


def main() -> int:
    # --- verbs ---
    used: set[str] = set()
    verb_sections = []
    for sid, level, sub, intro, members in VERB_LEVELS:
        rows = []
        for base in members:
            if base not in FORMS:
                print(f"ABORT — {base} has no forms")
                return 1
            if base in used:
                print(f"ABORT — {base} listed at two levels")
                return 1
            used.add(base)
            past, pp, note = FORMS[base]
            row = {"base": base, "past": past, "pp": pp}
            if note:
                row["note"] = note
            rows.append(row)
        verb_sections.append({
            "id": sid, "title": level, "sub": sub,
            "exemplar": f"{len(rows)} verbs", "intro": intro,
            "columns": V_COLUMNS, "drill": V_DRILL, "rows": rows,
        })
    missing = set(FORMS) - used
    if missing:
        print(f"ABORT — not placed at any level: {sorted(missing)}")
        return 1

    # --- prepositions ---
    prep_sections = []
    for sid, level, sub, intro, items in PREPS:
        rows = [
            {"prep": p, "use": u, "example": ex, "gap": gap}
            for p, u, ex, gap in items
        ]
        prep_sections.append({
            "id": sid, "title": level, "sub": sub,
            "exemplar": f"{len(rows)} entries", "intro": intro,
            "columns": P_COLUMNS, "drill": P_DRILL, "rows": rows,
        })

    # --- pronouns ---
    pron_rows = []
    for subj, obj, adj, pron, refl in PRONOUNS:
        pron_rows.append({
            "subject": subj, "object": obj, "poss_adj": adj,
            "poss_pron": pron, "reflexive": refl,
        })
    # "it" has no standalone possessive — never ask for it.
    for r in pron_rows:
        if r["poss_pron"] == "—":
            r["drills"] = [
                {"cue": f'{r["subject"]} · object', "answer": r["object"]},
                {"cue": f'{r["subject"]} · possessive + noun', "answer": r["poss_adj"]},
                {"cue": f'{r["subject"]} · reflexive', "answer": r["reflexive"]},
            ]
            r["skip_drill"] = True

    dem_rows = [
        {"word": w, "number": n, "distance": d, "example": ex,
         "drills": [{"cue": gap, "answer": w}]}
        for w, n, d, ex, gap in DEMONSTRATIVES
    ]

    pron_sections = [
        {
            "id": "pr_personal", "title": "Personal, possessive and reflexive",
            "sub": "one row per person", "exemplar": "I · me · my · mine · myself",
            "intro": "Read across the row: the same person in five different "
                     "jobs. The two possessives are the pair Czech speakers mix "
                     "— my needs a noun after it, mine stands alone.",
            "columns": PRON_COLUMNS, "drill": PRON_DRILL, "rows": pron_rows,
        },
        {
            "id": "pr_dem", "title": "this · that · these · those",
            "sub": "pointing at things", "exemplar": "near or far, one or many",
            "intro": "Two questions decide it: one thing or more than one, and "
                     "near you or further away.",
            "columns": DEM_COLUMNS, "drill": [], "rows": dem_rows,
        },
    ]

    # --- tenses ---
    tense_rows = [
        {"tense": t, "form": f, "example": ex,
         "drills": [{"cue": f"{t} · he · work", "answer": ans}]}
        for t, f, ex, ans in TENSES
    ]
    tense_sections = [{
        "id": "t_all", "title": "The tenses", "sub": "one verb throughout",
        "exemplar": "work · he", "intro":
            "Every row uses the same verb and the same person, so the pattern "
            "reads straight down the column. Learn the FORM column — the tense "
            "name matters far less than being able to build it.",
        "columns": T_COLUMNS, "drill": [], "rows": tense_rows,
    }]

    payload = {
        "version": 2,
        "app": "rue-exp",
        "note": ("Tables + free practice. Grouped by level, no progress dimming "
                 "(James, 2026-08-17). Generated by codex/scripts/gen_reference.py "
                 "— edit that, not this file. Practice is untracked on purpose: "
                 "no fruit, no SRS."),
        "tabs": [
            {"id": "verbs", "label": "Irregular verbs",
             "blurb": "Three forms to memorise. Grouped from the ones you need first.",
             "sections": verb_sections},
            {"id": "preps", "label": "Prepositions",
             "blurb": "One Czech word is often three English ones — so learn the phrase, not the word.",
             "sections": prep_sections},
            {"id": "pron", "label": "Pronouns",
             "blurb": "Every form of every person, in one place.",
             "sections": pron_sections},
            {"id": "tenses", "label": "Tenses",
             "blurb": "One verb through every tense, so you can compare the forms.",
             "sections": tense_sections},
            {"id": "spell", "label": "Spelling & pairs",
             "blurb": "study → studies, stop → stopping; make/do, say/tell. Coming next.",
             "sections": []},
            {"id": "nums", "label": "Numbers & dates",
             "blurb": "1995, 3.15, 5th May, phone numbers. Coming next.",
             "sections": []},
        ],
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n",
                   encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    for tab in payload["tabs"]:
        secs = tab["sections"]
        n = sum(len(s["rows"]) for s in secs)
        print(f"  {tab['label']:18} {len(secs)} section(s) · {n:3} rows"
              + ("" if secs else "  (stub)"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
