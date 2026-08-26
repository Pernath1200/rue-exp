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
  Modal verbs       one family table (not by level) + free drills
  Word formation    30 prefixes · 30 suffixes by word class (lookup only —
                    the reps live under Exam Practice)
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



# ------------------------------------------------- countable / uncountable

# From James's BC FCE lesson + Worksheet_Uncountable-Nouns_2026-05-16 (his
# proven material — drills are lifted from its Exercises B-E, adjusted only
# where an answer was not unique). Czech notes ONLY where the trap is Czech:
# informace, rada, nabytek and ukol are countable in Czech, which is exactly
# why "informations" and "advices" happen; penize is plural, which is why
# "money are" happens.

UN_COLUMNS = [
    {"key": "noun", "label": "Noun"},
    {"key": "unit", "label": "One unit of it"},
    {"key": "note", "label": "Watch out"},
]

# (noun, one-unit-of-it [/ alternatives], watch-out note)
UNCOUNTABLES = [
    ("advice", "a piece of advice",
     "jedna rada — but advice never takes a or -s"),
    ("information", "a piece of information",
     "informace → never informations"),
    ("news", "a piece of news", "looks plural — takes IS: the news is on"),
    ("furniture", "a piece of furniture", "nábytek → never furnitures"),
    ("luggage", "a piece of luggage", "zavazadla → luggage is singular"),
    ("equipment", "a piece of equipment", ""),
    ("homework", "a piece of homework", "úkol → homework has no plural"),
    ("research", "a piece of research", "never researches"),
    ("progress", "—", "make progress — no unit, no plural"),
    ("feedback", "a piece of feedback", ""),
    ("traffic", "—", "heavy traffic · takes IS"),
    ("weather", "—", "takes IS: the weather is awful"),
    ("luck", "a bit of luck", ""),
    ("bread", "a slice of bread / a piece of bread", ""),
    ("coffee", "a cup of coffee", "a coffee = one cup, in a café"),
    ("water", "a glass of water / a bottle of water", ""),
    ("money", "—", "peníze jsou množné — money takes IS"),
]

DL_COLUMNS = [
    {"key": "word", "label": "Word"},
    {"key": "unc", "label": "Uncountable"},
    {"key": "cnt", "label": "Countable"},
]

DOUBLE_LIFE = [
    ("experience", "experience in marketing = praxe",
     "a strange experience = zážitek"),
    ("time", "we don't have time", "I've been there three times"),
    ("hair", "she has beautiful hair", "there's a hair in my soup"),
    ("light", "plants need light", "turn off the lights"),
    ("paper", "a bag made of paper", "a paper = a newspaper / an essay"),
    ("room", "is there room for me? = místo", "a room = pokoj"),
    ("glass", "made of glass", "a glass of wine"),
    ("chicken", "we had chicken for dinner", "a chicken = the animal"),
]

# Drills, mined from the worksheet.
UN_DRILLS = [
    # Exercise C · counting phrases
    {"cue": "one unit: advice", "answer": "a piece of advice"},
    {"cue": "one unit: information", "answer": "a piece of information"},
    {"cue": "one unit: bread", "answer": "a slice of bread / a piece of bread"},
    {"cue": "one unit: coffee", "answer": "a cup of coffee"},
    {"cue": "one unit: luck", "answer": "a bit of luck"},
    {"cue": "one unit: water", "answer": "a glass of water / a bottle of water"},
    {"cue": "one unit: furniture", "answer": "a piece of furniture"},
    # Exercise B · quantifiers (choice in the cue keeps the answer unique)
    {"cue": "How ___ information do you need? (much / many)", "answer": "much"},
    {"cue": "How ___ luggage can I take? (much / many)", "answer": "much"},
    {"cue": "How ___ times have you been there? (much / many)", "answer": "many"},
    {"cue": "We don't have ___ time today. (much / many)", "answer": "much"},
    {"cue": "She gave me ___ good advice. (some / a)", "answer": "some"},
    # Exercise D · error correction — items with one deterministic fix
    {"cue": "Fix: I have a lot of homeworks tonight.",
     "answer": "I have a lot of homework tonight."},
    {"cue": "Fix: We don't have a lot of equipments at the office.",
     "answer": "We don't have a lot of equipment at the office."},
    {"cue": "Fix: I bought some new furnitures last weekend.",
     "answer": "I bought some new furniture last weekend."},
    {"cue": "Fix: The news about the merger are interesting.",
     "answer": "The news about the merger is interesting."},
    {"cue": "Fix: The informations you gave me were very helpful.",
     "answer": "The information you gave me was very helpful."},
]

DL_DRILLS = [
    # Exercise E · double-life gaps (choice in the cue)
    {"cue": "I have great ___ in marketing. (experience / experiences)",
     "answer": "experience"},
    {"cue": "I had a strange ___ yesterday. (experience / an experience)",
     "answer": "an experience"},
    {"cue": "We don't have ___ for this. (time / a time)", "answer": "time"},
    {"cue": "I've visited Paris three ___. (time / times)", "answer": "times"},
    {"cue": "There's ___ in my soup. (hair / a hair)", "answer": "a hair"},
    {"cue": "She has beautiful ___. (hair / a hair)", "answer": "hair"},
    {"cue": "Turn off ___ , please. (light / the lights)",
     "answer": "the lights"},
    {"cue": "Plants need ___ to grow. (light / a light)", "answer": "light"},
    {"cue": "Pour me ___ , please. (wine / a glass of wine)",
     "answer": "a glass of wine"},
]

# ------------------------------------------------- word formation (affixes)
# Mined from the legacy app (rue2.cz/reference_word_formation.json) at
# James's request, 2026-08-18 — "the previous, legacy app had a lot of good
# reference bits". 30 prefixes most-common-first, 30 suffixes grouped by the
# word class they make. Lightly edited: examples were kept where they are
# genuine derivations a student could reuse in Part 3.
# LOOKUP ONLY — no drills. Reps live under Exam Practice (James, 2026-08-18:
# tables are for looking up; the drilling belongs in the exam gym).

WF_PRE_COLUMNS = [
    {"key": "prefix", "label": "Prefix"},
    {"key": "meaning", "label": "Meaning"},
    {"key": "examples", "label": "Examples"},
]

WF_SUF_COLUMNS = [
    {"key": "suffix", "label": "Suffix"},
    {"key": "makes", "label": "Makes"},
    {"key": "examples", "label": "Examples"},
]

# (prefix, meaning, examples) — most common first, as the legacy list ordered
# them.
WF_PREFIXES = [
    ("un-", "not; opposite", "unable, unhappy, unlock"),
    ("re-", "again; back", "rewrite, return, rebuild"),
    ("in- / im- / il- / ir-", "not", "incorrect, impossible, illegal, irregular"),
    ("dis-", "not; opposite; apart", "disagree, disappear, dislike"),
    ("en- / em-", "cause to; put into", "enable, encourage, empower"),
    ("pre-", "before", "preview, prepay, prehistoric"),
    ("over-", "too much; above", "overflow, overload, oversleep"),
    ("non-", "not", "nonstop, nonfiction, nonsense"),
    ("mis-", "wrong; badly", "misunderstand, misuse, misspell"),
    ("sub-", "under; below", "subway, submarine, subtitle"),
    ("inter-", "between; among", "international, interact, internet"),
    ("de-", "reverse; remove", "defrost, decode, decrease"),
    ("trans-", "across; change", "transport, translate, transform"),
    ("under-", "too little; below", "underestimate, undercook, underpay"),
    ("out-", "more; beyond; external", "outdoors, outnumber, outgrow"),
    ("post-", "after", "postwar, postpone, postgraduate"),
    ("super-", "above; beyond", "supermarket, superstar, supernatural"),
    ("fore-", "before; front", "foresee, forearm, foreground"),
    ("semi-", "half; partly", "semicircle, semicolon, semiconductor"),
    ("anti-", "against", "anticlockwise, antibody, antisocial"),
    ("mid-", "middle", "midnight, midday, midweek"),
    ("multi-", "many", "multicultural, multiply, multimedia"),
    ("ex-", "former; out", "ex-president, ex-wife, export"),
    ("self-", "by oneself; for oneself", "self-service, selfish, self-esteem"),
    ("co-", "together; with", "cooperate, co-worker, coexist"),
    ("counter-", "opposite; in return",
     "counteract, counterargument, counterproductive"),
    ("auto-", "self; by itself", "automatic, autobiography, automobile"),
    ("bi-", "two; twice", "bicycle, bilingual, biannual"),
    ("tri-", "three", "triangle, tripod, tricycle"),
    ("con- / com- / col-", "with; together", "connect, combine, collect"),
]

# (suffix, makes, examples) grouped by word class. "television" was dropped
# from the legacy -sion examples: a student cannot derive it in Part 3.
WF_SUFFIX_NOUNS = [
    ("-ness", "noun", "happiness, darkness, kindness"),
    ("-tion", "noun", "action, education, relation"),
    ("-sion", "noun", "decision, conclusion, permission"),
    ("-ment", "noun", "movement, development, government"),
    ("-er", "noun (person/thing)", "teacher, writer, worker"),
    ("-or", "noun (person)", "actor, director, inventor"),
    ("-ence", "noun", "difference, reference, confidence"),
    ("-ance", "noun", "importance, distance, appearance"),
    ("-ity", "noun", "ability, quality, reality"),
    ("-ship", "noun", "friendship, leadership, membership"),
    ("-ist", "noun (person)", "artist, scientist, pianist"),
    ("-ism", "noun", "capitalism, tourism, criticism"),
    ("-ty", "noun", "safety, loyalty, certainty"),
    ("-dom", "noun", "freedom, kingdom, wisdom"),
]

WF_SUFFIX_VERBS = [
    ("-ize / -ise", "verb", "organize, realise, apologise"),
    ("-en", "verb", "widen, strengthen, shorten"),
    ("-ify", "verb", "simplify, clarify, identify"),
    ("-ate", "verb", "create, communicate, celebrate"),
]

WF_SUFFIX_ADJ_ADV = [
    ("-ful", "adjective", "wonderful, careful, beautiful"),
    ("-less", "adjective", "hopeless, careless, endless"),
    ("-able", "adjective", "comfortable, reliable, capable"),
    ("-ible", "adjective", "possible, visible, responsible"),
    ("-al", "adjective", "national, personal, musical"),
    ("-ous", "adjective", "dangerous, famous, nervous"),
    ("-ive", "adjective", "active, creative, effective"),
    ("-y", "adjective", "sunny, windy, sleepy"),
    ("-ic", "adjective", "romantic, economic, artistic"),
    ("-ary", "adjective", "necessary, voluntary, secondary"),
    ("-ly", "adverb", "quickly, happily, slowly"),
    ("-ward(s)", "adverb", "forward, backward, homeward"),
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


    noun_sections = [
        {
            "id": "un_always", "title": "Always uncountable",
            "sub": "no a/an · no plural · verb in the singular",
            "exemplar": "advice · information · news",
            "intro": "These never take a/an or -s, however countable the Czech "
                     "word is. To count one, use a unit phrase — a piece of "
                     "advice, a slice of bread.",
            "columns": UN_COLUMNS, "drill": [],
            "rows": [
                {"noun": n, "unit": u, **({"note": w} if w else {})}
                for n, u, w in UNCOUNTABLES
            ],
        },
        {
            "id": "un_double", "title": "Double life",
            "sub": "countable and uncountable — different meanings",
            "exemplar": "experience · time · hair · light",
            "intro": "The same word, two lives: uncountable for the substance "
                     "or idea, countable for one specific piece of it. The "
                     "meaning changes with the article.",
            "columns": DL_COLUMNS, "drill": [],
            "rows": [{"word": w, "unc": u, "cnt": c} for w, u, c in DOUBLE_LIFE],
        },
    ]
    # attach the mined drills to the first row of each section (row.drills is
    # the explicit-pairs hook; the pool is per SECTION, so one carrier row is
    # enough and keeps the table clean)
    noun_sections[0]["rows"][0]["drills"] = UN_DRILLS
    noun_sections[1]["rows"][0]["drills"] = DL_DRILLS

    # --- word formation (affixes) ---
    wf_sections = [
        {
            "id": "wf_prefixes", "title": "Prefixes",
            "sub": "most common first",
            "exemplar": "un- · re- · mis-",
            "intro": "A prefix changes the MEANING, not the word class: happy "
                     "→ unhappy is still an adjective. The negatives matter "
                     "most in the exam — and in- changes its shape: im- before "
                     "p (impossible), ir- before r (irregular), il- before l "
                     "(illegal).",
            "columns": WF_PRE_COLUMNS, "drill": [],
            "rows": [{"prefix": p, "meaning": m, "examples": e}
                     for p, m, e in WF_PREFIXES],
        },
        {
            "id": "wf_suf_nouns", "title": "Suffixes — nouns",
            "sub": "actions, states, people",
            "exemplar": "-tion · -ness · -er",
            "intro": "A suffix changes the WORD CLASS. These make nouns; the "
                     "person endings -er / -or / -ist name who does it. Watch "
                     "the stems that shift: decide → decision, able → ability.",
            "columns": WF_SUF_COLUMNS, "drill": [],
            "rows": [{"suffix": s, "makes": m, "examples": e}
                     for s, m, e in WF_SUFFIX_NOUNS],
        },
        {
            "id": "wf_suf_verbs", "title": "Suffixes — verbs",
            "sub": "make it happen",
            "exemplar": "-en · -ify · -ise",
            "intro": "Adjective or noun → verb. And one prefix belongs here "
                     "too: en- makes verbs from the front — enable, enrich, "
                     "endanger.",
            "columns": WF_SUF_COLUMNS, "drill": [],
            "rows": [{"suffix": s, "makes": m, "examples": e}
                     for s, m, e in WF_SUFFIX_VERBS],
        },
        {
            "id": "wf_suf_adj", "title": "Suffixes — adjectives and adverbs",
            "sub": "-ful = with · -less = without",
            "exemplar": "-ful · -able · -ly",
            "intro": "-ful means with it, -less means without it: careful / "
                     "careless. -ly turns an adjective into an adverb: quick "
                     "→ quickly.",
            "columns": WF_SUF_COLUMNS, "drill": [],
            "rows": [{"suffix": s, "makes": m, "examples": e}
                     for s, m, e in WF_SUFFIX_ADJ_ADV],
        },
    ]

    # --- modal verbs: one family table, not split by level (James 2026-08-26) ---
    M_COLUMNS = [
        {"key": "modal", "label": "Modal"},
        {"key": "meaning", "label": "Meaning"},
        {"key": "cz", "label": "CZ"},
        {"key": "example", "label": "Example"},
    ]
    M_DRILL = [
        {"from": "meaning", "to": "modal"},
        {"from": "cz", "to": "modal"},
    ]
    # meaning and cz must be unique enough to cue one row.
    MODAL_ROWS = [
        ("can", "ability", "umět", "I can swim."),
        ("can", "permission", "smět", "You can sit here."),
        ("can't", "not able", "neumět / nemohu", "I can't come today."),
        ("can't", "not allowed", "nesmět", "You can't park here."),
        ("could", "past ability", "uměl", "I could swim at five."),
        ("could", "polite request", "mohl bys", "Could you help me?"),
        ("must", "rule / strong need", "muset (pravidlo)", "You must wear a seatbelt."),
        ("mustn't", "not allowed (rule)", "nesmět (zákaz)", "You mustn't smoke here."),
        ("have to", "need from the situation", "muset (situace)", "I have to work tomorrow."),
        ("don't have to", "not necessary", "nemuset", "You don't have to come."),
        ("should", "advice", "měl by", "You should see a doctor."),
        ("shouldn't", "bad idea", "neměl by", "You shouldn't drive fast."),
        ("ought to", "advice (like should)", "měl by (formálnější)", "You ought to apologise."),
        ("had better", "strong advice now", "radši bys", "You'd better go now."),
        ("may", "possible / allowed", "možná / smět", "It may rain. / You may go."),
        ("might", "possible", "možná", "It might rain."),
        ("must", "almost sure", "určitě (odhad)", "She must be at home."),
        ("can't", "almost sure not", "to nemůže být", "That can't be true."),
        ("need to", "need", "potřebovat", "I need to call her."),
        ("needn't", "not necessary (like don't have to)", "nemuset (needn't)", "You needn't wait."),
    ]
    modal_sections = [
        {
            "id": "mod_all",
            "title": "Modal verbs",
            "sub": "the extra meaning on another verb",
            "exemplar": f"{len(MODAL_ROWS)} forms",
            "intro": (
                "Modal verbs do not name the action. They add a meaning — "
                "that extra meaning is modality: ability, permission, a rule, "
                "advice, possibility. Most take a base verb with no to "
                "(must go). Exceptions that keep to: have to, need to, ought to."
            ),
            "columns": M_COLUMNS,
            "drill": M_DRILL,
            "drill_ok": False,
            "rows": [
                {"modal": m, "meaning": meaning, "cz": cz, "example": ex}
                for m, meaning, cz, ex in MODAL_ROWS
            ],
        }
    ]

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
            {"id": "modals", "label": "Modal verbs",
             "blurb": "The extra meaning on another verb — ability, a rule, advice, possibility. One family, not split by level.",
             "sections": modal_sections},
            {"id": "nouns", "label": "Countable & uncountable",
             "blurb": "advice, information, news — countable in Czech, never in English. And the words with two lives.",
             "sections": noun_sections},
            {"id": "wordform", "label": "Word formation",
             "blurb": "un-, mis-, -tion, -ness — the 30 prefixes and 30 suffixes behind FCE/CAE Part 3. The reps live under Exam Practice.",
             "sections": wf_sections},
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
