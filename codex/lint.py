#!/usr/bin/env python
"""Pre-flight lint — find the likely faults in a unit BEFORE James plays it.

    python codex/lint.py b1_verb_patterns_advanced     one unit, with the items
    python codex/lint.py --all                         every live unit, ranked
    python codex/lint.py --all --brief                 counts only

Read-only. Changes nothing, ticks nothing, never authors. Every check here comes
from a real failure found by hand on 2026-08-24 — see
`Desktop/RUE authoring rules - learned from smoke testing 2026-08-24.md`.

WHY THIS EXISTS. Smoking a2_first_conditional took two hours, and most of that was
DISCOVERY — finding each class of fault by being marked wrong and getting annoyed —
not judgement. Discovery is the automatable half. With the suspects listed up front,
a unit should take about twenty minutes: confirm, overrule, fix, tick.

The gates (audit / check_pretaught / check_playable) check STRUCTURE. Every fault
below was present while all three were green. This checks the other thing.

EXACT vs CANDIDATE. Checks marked EXACT are facts about the data — an item either
lists `it` or it does not. Checks marked CANDIDATE need James's judgement: English
often forces `the`, and Czech perfectives are detected by a wordlist, not morphology.
Candidates are for looking at, never for acting on unread.

Weekend smoke-prep (2026-08-29) added D3 slash / teacher-note, F3 Use-leads,
F2 Do/Does-in-Use before questions, C4 intro-not-in-bank, C11 Quiz word absent
from intro, F4 unknown 's names. 2026-08-30: B11 NP+be cue `(plan / be)`.
B20 sentence-sort omits Czech · B21 word-order Quiz is Which is correct? ·
E8 word-order skips Type. Still read-only. `/smoke-prep` runs this.
"""
import json
import re
import sys
from pathlib import Path

from tree_path import teaching_path

ROOT = Path(__file__).resolve().parent.parent

# --- shared patterns ---------------------------------------------------------
DEMONSTRATIVE = re.compile(r"\b(ten|ta|to|toho|tu|ty|ti|tím|tou|tento|tato|toto|tomu|tom|tomto|těch|těm|těmi)\b", re.I)

# Czech perfective presents that MEAN FUTURE. A wordlist, not morphology, so this is
# a candidate check. The walk-home item (`přijdeš` = you WILL arrive, answer demanded
# the present) is the failure it exists to catch.
CZ_FUTURE = re.compile(
    r"\b(bude|budeš|budu|budou|budeme|budete|přijde|přijdeš|přijdu|přijdou|"
    r"otevře|otevřeš|udělá|uděláš|koupí|koupíš|zavolá|zavoláš|půjde|půjdeš|"
    r"půjdu|půjdeme|pojede|pojedeš|přinese|přineseš|uvidí|uvidíš|dá|dáš|"
    r"skončí|začne|začneš|pošle|pošleš|vezme|vezmeš|napíše|napíšeš)\b", re.I)

# short form -> EVERY long form it can stand for. The 1:1 version expanded
# "she's been working" to "she is been working" and flagged the perfect
# items in every perfect unit; `'s` is `is` OR `has`, `'d` is `had` OR
# `would` (B1 sweep 2026-09-04). A twin counts as present if ANY listed
# expansion is in accepts.
CONTRACTIONS = {
    "it's": ["it is", "it has"], "i'm": ["i am"],
    "you're": ["you are"], "we're": ["we are"], "they're": ["they are"],
    "he's": ["he is", "he has"], "she's": ["she is", "she has"],
    "that's": ["that is", "that has"],
    "i've": ["i have"], "you've": ["you have"],
    "we've": ["we have"], "they've": ["they have"],
    "i'd": ["i had", "i would"], "he'd": ["he had", "he would"],
    "she'd": ["she had", "she would"], "you'd": ["you had", "you would"],
    "we'd": ["we had", "we would"], "they'd": ["they had", "they would"],
    "don't": ["do not"], "doesn't": ["does not"], "didn't": ["did not"],
    "won't": ["will not"], "isn't": ["is not"], "aren't": ["are not"],
    "hasn't": ["has not"], "haven't": ["have not"], "hadn't": ["had not"],
    "can't": ["cannot"], "couldn't": ["could not"],
    "wouldn't": ["would not"],
    "let's": ["let us"], "i'll": ["i will"], "we'll": ["we will"],
    "you'll": ["you will"], "he'll": ["he will"], "she'll": ["she will"],
    "they'll": ["they will"],
}

# long form -> the one short form it contracts to. Many-to-one: "he is" and
# "he has" both contract to "he's".
EXPANSIONS = {}
for _short, _longs in CONTRACTIONS.items():
    for _long in _longs:
        EXPANSIONS[_long] = _short

WORD = r"\b%s\b"

# A8 guards — three classes of contraction the check used to demand that are not
# English. Found by the B1 authoring loop 2026-09-04, confirmed by James.
#
#   had to / have to   "I had to work" does NOT contract to "I'd to work"
#   had + object       "I had a car" does NOT contract to "I'd a car"
#   question tags      the twin of "aren't you?" is "are you not?", never
#                      "are not you?" — so every negative tag was flagged, and
#                      the count grew as a tag unit was thickened
#
# These made the A8 count unusable on b1_question_tags (9 of 25 items) and on
# every past-obligation pack. Suppressing them is not leniency: the ONLY way to
# clear them by editing a pack was to write ungrammatical strings into
# `accepts`, which is what grades the student.
HAVE_TAIL = re.compile(r"\b(had|have|has)$", re.I)
# had/have/has only contracts before a participle. The first guard was a
# blacklist of common non-participles, which lost whack-a-mole to every noun
# ("If I had TIME" still demanded "if I'd time", 2026-09-05). Whitelist the
# participle instead — same alternation the A14 past-perfect check trusts.
IS_PARTICIPLE = re.compile(
    r"^\s+(never\s+|ever\s+|already\s+|just\s+|not\s+)*"
    r"(\w+(ed|en)\b|been|gone|done|seen|taken|given|come|left|lost|"
    r"met|paid|put|read|run|said|sent|set|sold|spent|told|won|written|"
    r"begun|broken|brought|bought|caught|chosen|drunk|driven|eaten|"
    r"fallen|felt|found|forgotten|got|heard|held|kept|known|made|"
    r"become|thought|taught|understood|built|slept|shown|worn|grown|"
    r"thrown|drawn|blown|hurt|cut|meant|learnt)\b", re.I)
TAG_AFTER = re.compile(r"^\s*(i|you|he|she|it|we|they|there)\s*\?", re.I)

# English free choices — interchangeable anywhere, unlike the Czech-ambiguity pairs
# the synonym map was generated for. `everyone` rejected for `everybody` was the
# failure that exposed this.
FREE_PAIRS = {
    "everyone": "everybody", "everybody": "everyone",
    "someone": "somebody", "somebody": "someone",
    "anyone": "anybody", "anybody": "anyone",
    "nobody": "no one", "no one": "nobody",
}

# Packs whose conditionals are UNREAL: `when` is genuinely wrong there, so the
# if/when check must not fire.
# A1's second half: `when` is accepted in a REAL conditional and NEVER in
# an unreal one. A unit missing from this set throws false `ifwhen` flags
# whose "fix" would break the rule. b1_second_conditional and b1_wishes
# were authored after this set and never added (B1 sweep 2026-09-04).
UNREAL = {"b2_second_conditional", "b2_third_conditional", "b2_mixed_conditionals",
          "b2_wish_if_only", "c1_subjunctive",
          "b1_second_conditional", "b1_wishes"}

CONNECTORS = ["if", "when", "until", "as soon as", "after", "unless", "before"]


import csv
import collections

# Oxford 5000 with CEFR bands, lowest level per word (a word listed as both a
# noun and a verb takes the easier one). Used by the level checks below.
_CEFR_ORD = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5}


def cefr_map():
    out = {}
    f = ROOT / "codex/vocab/oxford-5k-cefr.csv"
    if not f.exists():
        return out
    for r in csv.DictReader(f.open(encoding="utf-8")):
        w = r["word"].strip().lower()
        l = r["level"].strip().lower()
        if w and l in _CEFR_ORD and (w not in out or _CEFR_ORD[l] < _CEFR_ORD[out[w]]):
            out[w] = l
    return out


CEFR = cefr_map()

# Claims that there is nothing to learn. Deliberately NOT matching a bare
# "there is no", which is ordinary phrasing in a grammar explanation and gave
# 21 hits of which most were false (2026-08-24).
NO_PATTERN = re.compile(
    r"(no rule|learn in chunks|learn the pair|just learn|memoris|memoriz|by heart|"
    r"verb by verb|case by case|no logic|no pattern|nothing to work out|"
    r"you (?:simply )?have to learn)", re.I)

# Grammar metalanguage a student meets repeatedly — never counted as too hard.
METALANGUAGE = {
    "preposition", "prepositions", "infinitive", "noun", "nouns", "verb", "verbs",
    "adjective", "adjectives", "adverb", "adverbs", "clause", "clauses", "tense",
    "tenses", "article", "articles", "plural", "singular", "subject", "object",
    "pronoun", "pronouns", "base", "form", "forms", "pattern", "patterns",
    "vowel", "consonant", "passive", "active", "conditional", "gerund",
}


def status_disagreements():
    """Node status is duplicated in tree.json and nodes-grammar.json and NOTHING
    keeps them in sync. The app reads tree.json; these scripts read
    nodes-grammar.json. On 2026-08-24 a unit was parked in one, stayed live in
    the other, and check_playable happily reported it as live."""
    t = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
    g = json.loads((ROOT / "data/nodes-grammar.json").read_text(encoding="utf-8"))
    tn = {n["id"]: n.get("status") for n in (t.get("nodes") or [])}
    gl = g["nodes"]
    gl = gl if isinstance(gl, list) else list(gl.values())
    gn = {n["id"]: n.get("status") for n in gl}
    return [(k, tn.get(k), gn.get(k)) for k in sorted(set(tn) & set(gn))
            if tn.get(k) != gn.get(k)]


def _words(text):
    return [w for w in re.findall(r"[a-zA-Z][a-zA-Z'-]+", str(text).lower())
            if w not in METALANGUAGE]


def card_text(card):
    bits = [card.get("body", ""), card.get("title", "")]
    bits += [str(x) for x in (card.get("points") or [])]
    tbs = [card.get("table") or {}]
    if isinstance(card.get("tables"), list):
        tbs.extend(card["tables"])
    for tb in tbs:
        if not isinstance(tb, dict):
            continue
        for row in (tb.get("rows") or []):
            bits += [str(x) for x in row]
    return " ".join(bits)


# --- weekend smoke-prep (2026-08-29): D3 / F3 / C4 / C11 / F4 / F2 -------------
# Read-only. Every check is a class found by playing a unit this weekend.

FUNCTION = set(
    """
    i you he she it we they me him her us them
    my your his our their mine yours hers ours theirs
    a an the this that these those
    am is are was were be been being
    do does did doing done
    have has had having
    will would can could should must may might
    not no yes please
    to from in on at of for with by as than into
    and but or so because if when
    here there now then too very just also
    what who where why how
    one two three four five six seven eight nine ten eleven twelve
    mr mrs
    """.split()
)

CLASS_NAMES = {
    "martin", "ondrej", "vaclav", "anna", "patrik", "tomas", "james", "martina",
    "prague", "brno",
}

_TREE_IDX = None


def tree_index():
    global _TREE_IDX
    if _TREE_IDX is None:
        t = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
        nodes = t.get("nodes") or []
        _TREE_IDX = {
            "path": teaching_path(t),
            "by_id": {n["id"]: n for n in nodes if isinstance(n, dict) and n.get("id")},
        }
    return _TREE_IDX


def pack_lexicon(rel):
    """Content words in a pack at data/<rel>."""
    if not rel:
        return set()
    p = ROOT / "data" / rel
    if not p.exists():
        return set()
    d = json.loads(p.read_text(encoding="utf-8"))
    out = set()
    blocks = d.get("blocks") or []
    items = []
    for b in blocks:
        items.extend(b.get("items") or [])
    if not items:
        items = d.get("items") or []
    for it in items:
        out.update(_words(it.get("en") or ""))
        out.update(_words(it.get("gap_answer") or ""))
    return out


def taught_lexicon(uid, this_items):
    """Partner + prior path + this unit's gap_answers + function words."""
    idx = tree_index()
    words = set(FUNCTION)
    path = idx["path"]
    by_id = idx["by_id"]
    for nid in path:
        if nid == uid:
            break
        n = by_id.get(nid)
        if n:
            words |= pack_lexicon(n.get("content"))
    partner = (by_id.get(uid) or {}).get("partner_id")
    if partner and partner in by_id:
        words |= pack_lexicon(by_id[partner].get("content"))
    for it in this_items:
        words.update(_words(it.get("gap_answer") or ""))
    return words


def questions_already_taught(uid):
    path = tree_index()["path"]
    if uid not in path or "a1_questions_negatives" not in path:
        return True
    return path.index("a1_questions_negatives") < path.index(uid)


def intro_cards(d):
    intro = d.get("intro")
    if isinstance(intro, list):
        return intro
    if isinstance(intro, dict):
        return intro.get("cards") or []
    return []


def intro_blob(d):
    return " ".join(card_text(c) for c in intro_cards(d) if isinstance(c, dict)).lower()


def distinctive_words(uid, packs):
    """Words this unit uses that few other units use — its subject matter."""
    counts = collections.Counter()
    for u, items in packs.items():
        seen = set()
        for it in items:
            seen.update(_words((it.get("accepts") or [it.get("en", "")])[0]))
        for w in seen:
            counts[w] += 1
    mine = set()
    for it in packs.get(uid, []):
        mine.update(_words((it.get("accepts") or [it.get("en", "")])[0]))
    return {w for w in mine if 1 < len(w) and counts[w] <= 4}


def load_live():
    tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
    ng = json.loads((ROOT / "data/nodes-grammar.json").read_text(encoding="utf-8"))
    live = set(tree["path_order"])
    for k, v in ng.items():
        if k.startswith("path_order_"):
            live |= set(v)
    nodes = ng["nodes"]
    nodes = nodes if isinstance(nodes, list) else list(nodes.values())
    status = {n.get("id"): n.get("status") for n in nodes}
    return [u for u in sorted(live) if status.get(u) == "live"]


def subjects(accepts):
    return {w.lower() for a in accepts for w in re.findall(r"\b(he|she|it)\b", a, re.I)}


# A9, B11 and B12 were pinned to `uid == "a2_present_perfect"` and one B11
# to `a2_present_continuous`, so none of them ran on
# b1_present_perfect_vs_past, b1_present_perfect_continuous, b1_past_perfect
# or b1_past_continuous_2 (B1 sweep 2026-09-04). Name the shape, not the
# unit.
def teaches_tense(d, uid, *needles):
    blob = " ".join([uid, str(d.get("title") or ""),
                     str(d.get("note") or "")]).lower()
    return any(n in blob for n in needles)


def lint_pack(uid):
    p = ROOT / "data/grammar/blocks" / f"{uid}.json"
    if not p.exists():
        return None
    d = json.loads(p.read_text(encoding="utf-8"))
    pack_seq = (d.get("check") or {}).get("sequence")
    pack_wants_quiz = pack_seq is None or "quiz" in pack_seq
    items = []
    item_in_quiz = {}
    for b in d.get("blocks") or []:
        seq = (b.get("check") or {}).get("sequence")
        wants_q = pack_wants_quiz if seq is None else ("quiz" in seq)
        for it in b.get("items") or []:
            items.append(it)
            item_in_quiz[id(it)] = wants_q
    pack_level = str(d.get("level", "")).upper()
    perfect_unit = teaches_tense(d, uid, "present perfect", "past perfect",
                                 "present_perfect", "past_perfect")
    continuous_unit = teaches_tense(d, uid, "present continuous",
                                    "past continuous", "present_continuous",
                                    "past_continuous")
    strict_articles = bool(d.get("strict_articles"))
    lenient_if_when = bool(d.get("lenient_if_when"))
    syn = json.loads((ROOT / "data/senses.json").read_text(encoding="utf-8")).get("synonyms", {})

    f = {k: [] for k in ("ifwhen", "subject", "article", "contraction", "synonym",
                         "czfuture", "zeromark", "noopts", "onewording",
                         "filler", "nopattern", "hardgloss", "badname", "vocablevel",
                         "slash", "teachernote", "uselead", "useleadhi",
                         "qlead",
                         "introex", "quizextra", "hardname", "chunkword",
                         "fakes3sg", "toparticle", "remember",
                         "articlegap", "theregap", "cancant", "a1meta",
                         "courseaside", "negdef", "smallwords", "mistakecol",
                         "timesort", "aweek", "baddiagram", "notbullet",
                         "verbcue", "thirdform", "ppcuz", "ppsort",
                         "stemcue", "longtable", "plusminus",
                         "sortlabel", "sortbold", "patternchip", "bothsort",
                         "parencue", "practisenote", "sortcz", "sentquiz",
                         "wordordertype", "slotgap", "closedset",
                         "ppanchor", "seqrecap", "notimeline")}

    taught = taught_lexicon(uid, items)
    q_ok = questions_already_taught(uid)

    for it in items:
        acc = it.get("accepts") or []
        cz = it.get("cz", "")
        en = acc[0] if acc else it.get("en", "")

        if item_in_quiz.get(id(it), True) and it.get("gap_answer") and not (
                isinstance(it.get("quiz_options"), list) and len(it["quiz_options"]) >= 2):
            f["noopts"].append(it)

        if not acc:
            continue
        if len(acc) == 1:
            f["onewording"].append(it)

        # D3 — slash dumps two student-facing Czechs  [EXACT]
        if " / " in cz:
            f["slash"].append(it)

        # D3 — teacher marks that rendered on Match/Use  [EXACT]
        if re.search(r"(≈|→|\(as a |\(in general\)|desk ≈|povolání)", cz, re.I):
            f["teachernote"].append(it)

        # F4 — 's name the class does not already know  [EXACT]
        for name in re.findall(r"\b([A-Z][a-z]+)'s\b", it.get("en") or ""):
            # F4 guard: "She's used to it" is a subject contraction, not the
            # possessive of a person called She. (B1 loop, 2026-09-04.)
            if name.lower() in ("she", "he", "it", "that", "there", "who", "what"):
                continue
            if name.lower() not in CLASS_NAMES:
                f["hardname"].append(it)
                break

        # F2 — Use produces Do/Does before the questions unit  [EXACT]
        if it.get("use") is not False and not q_ok:
            if re.match(r"^(do|does)\b", str(en), re.I):
                f["qlead"].append(it)

        # B8 — infinitive particle as the Quiz gap (want ____ work → to)  [EXACT]
        gap = str(it.get("gap") or "")
        ga = str(it.get("gap_answer") or "").strip().lower()

        # B7 — slot-label gap (person: ____) is a definition, not a cloze
        # b1_suffixes 2026-08-30: Type "person: ____" USE — James: FCE sentence + root.
        if re.search(r":\s*_{2,}\s*$", gap) and len(re.findall(r"[A-Za-z]+", gap)) <= 4:
            f["slotgap"].append(it)

        if re.search(r"\bwant[s]?\s+_{2,}\s+\w", gap, re.I) and ga == "to":
            f["toparticle"].append(it)

        # B18 — mashup chip "to swimming" / "to reading"  [EXACT]
        # a2_verb_patterns 2026-08-29: "to swimming isn't even a common error".
        for o in it.get("quiz_options") or []:
            if re.fullmatch(r"to\s+[a-z]+ing", str(o).strip(), re.I) \
                    and str(o).strip().lower() != ga:
                f["patternchip"].append(it)
                break

        # B8 — a/an/the gap in a pack that is not articles  [EXACT]
        # a1_there_is 2026-08-29: There is ____ university tested articles.
        if ga in ("a", "an", "the") and "article" not in uid:
            f["articlegap"].append(it)

        # B8 — can/can't polarity on a statement in the A1 can unit  [EXACT]
        # a1_can 2026-08-29: I ____ speak English → can. "just clicking can/can't
        # — pointless." Czech umím/neumím already picks the chip. Short answers
        # (Yes, I ____.) and fronted questions (____ you swim?) stay.
        # Not B1/B2 modal packs — there which modal IS the point.
        if uid.startswith("a1_can") and ga in ("can", "can't", "cannot", "can not") \
                and re.search(
                    r"\b(?:I|You|He|She|We|They|It)\s+_{2,}\s+[A-Za-z]", gap):
            f["cancant"].append(it)

        # A11 — many-pair form pack Type/Quiz missing (stem)  [EXACT]
        # a2_ed_ing_adjectives 2026-08-29: The book was ____. → surprising
        # was a vocab test (interesting). Cue (surprise).
        if ga and re.fullmatch(r"[A-Za-z]+(ed|ing)", ga) and "(" not in gap:
            pairish = [
                str(x.get("gap_answer") or "").strip().lower()
                for x in items if x.get("gap_answer")
            ]
            pairish = [w for w in pairish if re.fullmatch(r"[a-z]+(ed|ing)", w)]
            eds = {w for w in pairish if w.endswith("ed")}
            ings = {w for w in pairish if w.endswith("ing")}
            if len(eds) >= 4 and len(ings) >= 4 and len(set(pairish)) >= 8:
                f["stemcue"].append(it)

        # B11 — whole-VP Type/Quiz missing (lemma) when the stem doesn't name the verb
        # a2_past_continuous 2026-08-29: You ____ when I called. → were sleeping.
        # "should have verb needed in brackets"
        ing = re.search(
            r"\b(?:was|were|wasn't|weren't)\s+(\w+ing)\b", ga, re.I)
        if ing and "(" not in gap and ing.group(1).lower() not in gap.lower():
            after = re.split(r"_{2,}", gap, maxsplit=1)
            rest = after[1] if len(after) > 1 else ""
            if not re.search(
                    r"\b(a|an|the|to|for|in|lunch|dinner|football|english)\b",
                    rest, re.I):
                f["verbcue"].append(it)

        # B11 — present continuous: I ____ to open the door. → am trying
        # 2026-09-01: "should have verb in brackets (try)". Aux-only questions
        # (____ you working?) already name the verb on the stem.
        if continuous_unit and ga:
            if re.fullmatch(r"(Are|Is|are|is)", ga):
                if not re.search(r"\w+ing", gap, re.I):
                    f["verbcue"].append(it)
            else:
                cue = re.search(r"\(([^)]*)\)", gap)
                cue_words = re.findall(r"[a-z]+", cue.group(1).lower()) if cue else []
                has_verb_cue = any(w not in ("no", "not") for w in cue_words)
                if not has_verb_cue and not re.search(r"\w+ing", gap, re.I):
                    f["verbcue"].append(it)

        # B11 — present perfect whole VP (have just finished) with no (just/finish)
        # a2_present_perfect 2026-08-29: I ____. → have just finished.
        if perfect_unit:
            if re.search(r"\b(have|has|haven't|hasn't)\s+\w+", ga) and "(" not in gap:
                after = re.split(r"_{2,}", gap, maxsplit=1)
                rest = after[1] if len(after) > 1 else ""
                if not re.search(r"\b(finished|arrived|eaten|seen|called|done)\b",
                                 rest, re.I):
                    f["verbcue"].append(it)

        # B11 — position-slot Type (always drink / drink always) with no (always/drink)
        # a2_adverbs_order 2026-08-29: I like ____. → coffee very much.
        if "(" not in gap:
            ga_words = re.findall(r"[a-z]+", ga)
            if len(ga_words) >= 2:
                bag = tuple(sorted(ga_words))
                for o in (it.get("quiz_options") or []):
                    ow = re.findall(r"[a-z]+", str(o).lower())
                    if ow and tuple(sorted(ow)) == bag and ow != ga_words:
                        f["verbcue"].append(it)
                        break

        # B11 — NP + be gap whose (cue) is the noun only
        # b1_indirect_questions 2026-08-30: (plan) for "the plan is"
        # "plan as clue is not enough - should have verb (be) as well"
        cue_m = re.search(r"\(([^)]*)\)\s*[.?]?\s*$", gap)
        ga_words = re.findall(r"[a-z']+", ga.lower())
        if cue_m and ga_words and ga_words[-1] in ("is", "are", "was", "were"):
            if 2 <= len(ga_words) <= 3:
                cue = cue_m.group(1).lower()
                if cue and not re.search(r"\b(be|is|are|was|were)\b", cue):
                    nouns = [
                        w for w in re.findall(r"[a-z]+", cue)
                        if w not in (
                            "he", "she", "it", "they", "we", "you", "i",
                            "who", "what", "how",
                        )
                    ]
                    if nouns:
                        f["verbcue"].append(it)

        # A9 — Czech past does not pick present perfect  [EXACT]
        # a2_present_perfect 2026-08-29: Uklidil jsem kuchyň is also I cleaned.
        if perfect_unit and it.get("gap"):
            if re.search(r"\b(have|has|haven't|hasn't)\b", ga) and ga not in (
                    "have", "has"):
                blob = " ".join([cz, en, gap]).lower()
                if not re.search(
                        # unfinished-time markers added when this check was
                        # unpinned from a2_present_perfect and first ran on
                        # the B1 units (B1 sweep 2026-09-04): today, so far,
                        # this week and twice force the perfect on their own.
                        r"just|already|yet|never|ever|\bfor\b|since|"
                        r"už|ještě|právě|nikdy|někdy|dlouho|\brok|\blet\b|"
                        r"today|so far|lately|recently|\btwice\b|times|"
                        r"this (week|month|year|morning|afternoon)|"
                        r"dnes|zatím|naposledy|tento|tenhle|letos|"
                        r"before",
                        blob, re.I):
                    f["ppcuz"].append(it)

        # A14 — past perfect with no past reference point  [CANDIDATE]
        # James smoke of b1_past_perfect 2026-09-04: "____ you ever been to
        # London before? (have)" expecting Had — "you wouldn't use past perfect
        # here without context". A bare `before` / `ever` / `never` is an
        # adverb, not an anchor; with no past point stated, present perfect is
        # the honest answer and the Czech picks neither. The item's own
        # distractor list usually offers the better answer as a wrong one.
        ans = (it.get("accepts") or [it.get("en", "")])[0]
        # Narrative past perfect only. A conditional or a wish licenses `had` +
        # participle on its own grammar and needs no story anchor ("If she had
        # studied, she would have passed", "I wish I had studied") — the first
        # version of this check put 46 false hits on b2_third_conditional. And
        # `had` must actually govern a PARTICIPLE: second conditional's "If I
        # had more time" is past simple possessive, not past perfect at all.
        conditional = re.search(r"\bif\b|\bwould(n't)? have\b|\bwish\b|\bif only\b", ans, re.I)
        pp = re.search(r"\b(had|hadn't)\b\s+"
                       r"(you|i|he|she|it|we|they|[A-Z]\w+)?\s*"   # question inversion
                       r"(\w+ly\s+)?(never\s+|ever\s+|already\s+|just\s+)*"
                       r"(\w+(ed|en)\b|been|gone|done|seen|taken|given|come|left|lost|"
                       r"met|paid|put|read|run|said|sent|set|sold|spent|told|won|written|"
                       r"begun|broken|brought|bought|caught|chosen|drunk|driven|eaten|"
                       r"fallen|felt|found|forgotten|got|heard|held|kept|known|made)\b",
                       ans, re.I)
        if pp and not conditional:
            # an anchor is a past-simple CLAUSE or an explicit past frame
            anchored = re.search(
                r"\b(when|before|after|by the time|until|till|because|so|since)\s+"
                r"\w+(\s+\w+)?\s+\w+|"                       # subordinate clause
                r"\b(that|last|previous)\s+\w+|"             # "that trip"
                r"\bby\s+(\w+\s+)?(o'clock|noon|midnight|then|\d)|"  # "by six o'clock"
                r"\b(yesterday|ago|earlier|first|already)\b|"
                r"\b(said|told|asked|knew|realised|realized|found out)\b",
                ans, re.I)
            # ...or a second past-simple verb outside the had-clause. Any -ed
            # form counts, plus the common irregulars: a hand list missed
            # "She showed me the book she had bought" (b2_past_perfect).
            outside = re.sub(r"\b(had|hadn't)\b.*?(?=[,.]|$)", "", ans, flags=re.I)
            second = re.search(r"\b\w+ed\b|"
                               r"\b(was|were|got|came|arrived|went|left|saw|found|"
                               r"took|put|rang|ran|sat|stood|told|said|gave|made|"
                               r"knew|met|felt|kept|held|brought|bought|caught|"
                               r"sent|spent|lost|won|wrote|read|drove|fell|"
                               r"couldn't|didn't|wouldn't)\b", outside, re.I)
            if not anchored and not second:
                f["ppanchor"].append(it)

        # F3 — Use production uses a word the path has not taught
        # The rule is scoped to EARLY A1 ("recognition may lead, production
        # may not"). Ungated it was the loudest signal at B1 — 158 hits
        # across 26 units of a rule that does not apply there (B1 sweep
        # 2026-09-04). A1 keeps the EXACT flag; A2+ gets a CANDIDATE so the
        # signal survives without drowning the rest.
        if it.get("use") is not False:
            leftover = [
                w for w in _words(en)
                if w not in taught and w not in FUNCTION and len(w) > 2
            ]
            if leftover:
                key = "uselead" if pack_level == "A1" else "useleadhi"
                f[key].append({
                    "cz": cz,
                    "en": "%s  ·  leads: %s" % (en, ", ".join(leftover[:6])),
                })

        # A1 — Czech `když` is both if and when  [EXACT]
        if uid not in UNREAL and not lenient_if_when:
            if any(re.match(r"\s*if\b", a, re.I) for a in acc) and \
               not any(re.match(r"\s*when\b", a, re.I) for a in acc):
                f["ifwhen"].append(it)

        # A2 — subject not specified by the Czech  [EXACT]
        s = subjects(acc)
        if {"he", "she"} <= s and "it" not in s:
            f["subject"].append(it)

        # A4 — demands `the` with no Czech demonstrative  [CANDIDATE]
        if not strict_articles and all(re.search(r"\bthe\b", a, re.I) for a in acc) \
                and not DEMONSTRATIVE.search(cz):
            f["article"].append(it)

        # A8 — contraction twin missing  [EXACT]
        # A short form is satisfied if ANY of its expansions is in accepts
        # ("he's lived" is covered by "he has lived"); a long form is
        # satisfied by its one contraction.
        low = [a.lower() for a in acc]
        hit = False
        for a in low:
            for short, longs in CONTRACTIONS.items():
                pat = WORD % re.escape(short)
                m = re.search(pat, a)
                if not m:
                    continue
                # A8 guard: a question tag's twin is "are you not?", never
                # "are not you?" — do not demand a string nobody writes.
                if TAG_AFTER.match(a[m.end():]):
                    continue
                if not any(re.sub(pat, lg, a) in low for lg in longs):
                    f["contraction"].append(it); hit = True; break
            if hit:
                break
            for lng, short in EXPANSIONS.items():
                pat = WORD % re.escape(lng)
                m = re.search(pat, a)
                if not m:
                    continue
                # "has not sent" -> "'s not sent" is marginal and the n't
                # contraction already covers the negative. Skip it.
                if a[m.end():m.end() + 4] == " not":
                    continue
                # A8 guard: "had"/"have" only contracts in front of a past
                # participle. "I had to work" and "I had a car" do not become
                # "I'd to work" / "I'd a car".
                if HAVE_TAIL.search(lng) and not IS_PARTICIPLE.match(a[m.end():]):
                    continue
                if re.sub(pat, short, a) not in low:
                    f["contraction"].append(it); hit = True; break
            if hit:
                break

        # A7 — free English synonym absent from the map  [EXACT]
        for a in acc:
            words = set(re.findall(r"\b\w+\b", a.lower()))
            if any(w in FREE_PAIRS and w not in syn for w in words):
                f["synonym"].append(it); break

        # A3 — Czech says future, English answer is present-only  [CANDIDATE]
        # Only inside a time/conditional clause (když / až / jestli / dokud): that is
        # where the tense mismatch actually misleads, and it is the walk-home fault.
        # Without this guard it fired on every ordinary subordinate clause and was
        # 3-for-3 false positives on b1_verb_patterns_advanced.
        clause = re.search(r"\b(kdy[žz]|a[žz]|jestli|dokud)\b[^,.]{0,40}", cz, re.I)
        if clause and CZ_FUTURE.search(clause.group(0)) \
                and not re.search(r"\b(will|won't|'ll|going to)\b", en, re.I):
            f["czfuture"].append(it)

        # E2 — recycled always-true item carrying no marker  [EXACT]
        if "zero conditional" in str(it.get("explanation", "")).lower() \
                and "vždy platí" not in cz:
            f["zeromark"].append(it)

    # D1 — filler explanations: one string doing duty for many items  [EXACT]
    # b1_verb_patterns_advanced had 9 distinct explanations for 56 items, one of
    # them on 23. "to = direction / receiver / infinitive marker" says nothing
    # about the item it sits under, and is pasted across 61 items in 4 units.
    expl = collections.Counter(str(it.get("explanation", "")).strip()
                               for it in items if it.get("explanation"))
    for text, n in expl.most_common():
        if n >= 5:
            f["filler"].append({"cz": "%d items share this" % n, "en": text})

    # C7 — the card claims there is no pattern  [CANDIDATE]
    # "There is no rule to compute" / "Learn in chunks" — false where a tendency
    # exists, and demoralising. Irregular verbs ARE a list; judgement needed.
    for i, c in enumerate((d.get("intro") or {}).get("cards", [])):
        m = NO_PATTERN.search(card_text(c))
        if m:
            f["nopattern"].append({"cz": "card %d · %s" % (i, c.get("title", "")),
                                   "en": m.group(0)})

    # C6 — a gloss harder than the word it glosses  [CANDIDATE]
    # A table row explains column 1 with columns 2+. `stop` (a1) explained with
    # `quit` (b1) and `pause` (b2) is the fault; the gloss must be EASIER.
    for i, c in enumerate((d.get("intro") or {}).get("cards", [])):
        for row in ((c.get("table") or {}).get("rows") or []):
            if len(row) < 2:
                continue
            term = [CEFR.get(w) for w in _words(row[0])]
            term = [_CEFR_ORD[x] for x in term if x]
            if not term:
                continue
            easiest = min(term)
            for cell in row[1:]:
                # A gloss is prose; a verb list is not. "enjoy, don't mind, fancy"
                # is the unit's content, not an explanation of column 1, and
                # comparing levels against it produced six false positives.
                txt = str(cell)
                if txt.count(",") >= 2 or not re.search(
                        r"(the|a|an|you|is|are|to|in|of|so|it|they|no)", txt, re.I):
                    continue
                for w in _words(cell):
                    l = CEFR.get(w)
                    if l and _CEFR_ORD[l] > easiest + 1:
                        f["hardgloss"].append(
                            {"cz": "card %d · %s" % (i, str(row[0])[:34]),
                             "en": "%s (%s) glossed with %s (%s)" % (
                                 str(row[0])[:22], "level %d" % easiest, w, l)})
                        break

    # C4 — intro example sentence is not in this bank  [EXACT]
    bank_en = set()
    for it in items:
        for s in [it.get("en"), *(it.get("accepts") or [])]:
            bank_en.add(re.sub(r"[.!?]+$", "", str(s or "").lower().strip()))
    for c in intro_cards(d):
        blob = json.dumps(c, ensure_ascii=False)
        for ex in re.findall(r"\*\*([^*]+)\*\*", blob):
            s = re.sub(r"[.!?]+$", "", ex.strip().lower())
            if " " in s and len(s.split()) >= 3 and s not in bank_en:
                f["introex"].append({"cz": c.get("title", ""), "en": ex.strip()})

    # C11 — Quiz teaching-words never named in intro  [EXACT]
    # Skip form packs with many unique gap_answers (verbs, etc.).
    ga = collections.Counter(
        str(it.get("gap_answer") or "").strip().lower()
        for it in items if it.get("gap_answer")
    )
    intro_l = intro_blob(d)
    if 1 <= len(ga) <= 8 and intro_l:
        for w, n in ga.items():
            if n < 2 or not w or w in FUNCTION:
                continue
            if w not in intro_l:
                f["quizextra"].append(
                    {"cz": "%dx in bank, absent from intro" % n, "en": w}
                )

    # B19 — (maybe)/(sure)/(impossible) is not a verb lemma  [EXACT]
    # b1_modals_speculation 2026-08-30: fallback offered "impossibles".
    _paren_cue = re.compile(
        r"\((maybe not|maybe|sure|impossible|possible|certain)\)\s*$", re.I
    )
    for it in items:
        gap = str(it.get("gap") or "")
        m = _paren_cue.search(gap)
        if not m:
            continue
        opts = it.get("quiz_options")
        if isinstance(opts, list) and len(opts) >= 2:
            continue
        f["parencue"].append({
            "cz": str(it.get("cz") or "")[:40],
            "en": "%s  ·  cue (%s) needs authored chips" % (
                gap[:48], m.group(1).lower()),
        })

    # C15 — teacher-course word "chunk(s)" on an A1 card  [EXACT]
    if str(d.get("level", "")).upper() == "A1":
        for i, c in enumerate(intro_cards(d)):
            cap = str((c.get("table") or {}).get("caption") or "")
            heads = " ".join(str(h) for h in ((c.get("table") or {}).get("headers") or []))
            blob = " ".join([
                str(c.get("title") or ""),
                str(c.get("title_cz") or ""),
                cap, heads, card_text(c),
            ])
            if re.search(
                    r"\bchunks?\b|grammar theory|just these frames|full grammar",
                    blob, re.I):
                f["chunkword"].append({
                    "cz": "card %d · %s" % (i, c.get("title", "")),
                    "en": "chunk/frames/grammar-theory is teacher-speak, not A1",
                })

    # B8 — dummy There never the gap in a there-is pack  [EXACT]
    # a1_there_is 2026-08-29: There ____ a book left There on the page.
    if re.search(r"there_is", uid):
        n_there = sum(
            1 for it in items
            if re.search(r"\bthere\b", str(it.get("gap_answer") or ""), re.I)
        )
        if n_there == 0:
            f["theregap"].append({
                "cz": "0 items gap There / There is / Is there",
                "en": "dummy There never tested — gap was is/are with There given",
            })

    # C22 — A1 metalanguage with no Czech on the same card  [EXACT]
    # a1_can 2026-08-29: permission. a1_some_any 2026-08-29: quantifiers.
    if str(d.get("level", "")).upper() == "A1":
        for i, c in enumerate(intro_cards(d)):
            bits = [card_text(c), str(c.get("title_cz") or ""),
                    str(c.get("body_cz") or "")]
            for ex in c.get("examples") or []:
                if isinstance(ex, dict):
                    bits += [str(ex.get("en") or ""), str(ex.get("cz") or "")]
            blob = " ".join(bits)
            if re.search(r"\bpermission\b", blob, re.I) and not re.search(
                    r"(dovolen|smím|smíš|smíme|smíte|\bsmí\b)", blob, re.I):
                f["a1meta"].append({
                    "cz": "card %d · %s" % (i, c.get("title", "")),
                    "en": "permission with no Czech (dovolení / smím)",
                })
            if re.search(r"\bquantifiers?\b", blob, re.I) and not re.search(
                    r"množstv", blob, re.I):
                f["a1meta"].append({
                    "cz": "card %d · %s" % (i, c.get("title", "")),
                    "en": "quantifier with no Czech (množství)",
                })
            if re.search(r"\bprepositions?\b", blob, re.I) and not re.search(
                    r"předložk", blob, re.I):
                f["a1meta"].append({
                    "cz": "card %d · %s" % (i, c.get("title", "")),
                    "en": "preposition with no Czech (předložky)",
                })

    # C23 — intro names the pack, the level, or the syllabus  [EXACT]
    # Voice audit 2026-08-29: "this pack" / "this unit" / "at A2" / "common A1"
    # on the student page. The intro teaches English, not the course.
    COURSE_ASIDE = re.compile(
        r"\bthis pack\b|\bthis unit\b|\bthis bank\b|\bfor this pack\b|"
        r"\bnot this pack\b|\bcovered at\b|"
        r"\bat A[12]\b|\bat B[12]\b|\bat C1\b|"
        r"\bcommon A\d\b|\bCEFR\b",
        re.I,
    )
    for i, c in enumerate(intro_cards(d)):
        surfaces = [
            ("title", str(c.get("title") or "")),
            ("title_cz", str(c.get("title_cz") or "")),
            ("body", str(c.get("body") or "")),
        ]
        for j, p in enumerate(c.get("points") or []):
            surfaces.append(("points[%d]" % j, str(p)))
        tbs = [c.get("table") or {}]
        if isinstance(c.get("tables"), list):
            tbs.extend(c["tables"])
        for tb in tbs:
            if not isinstance(tb, dict):
                continue
            for h in tb.get("headers") or []:
                surfaces.append(("header", str(h)))
            for r, row in enumerate(tb.get("rows") or []):
                for cell in row or []:
                    surfaces.append(("cell", str(cell)))
        for loc, text in surfaces:
            m = COURSE_ASIDE.search(text)
            if m:
                f["courseaside"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "%s: %s" % (loc, text.strip()[:72]),
                })

    # C25 — don't define this thing by listing what it is not  [EXACT]
    # a1_and_but_because 2026-08-29: "Not add, not why".
    # a1_to_for_with 2026-08-29: "Not in / on / at (place or time)."
    NEG_DEF = re.compile(
        r"^\s*not\s+\w+[,;]?\s+not\s+\w+"
        r"|^\s*not\s+\w+(\s*/\s*\w+){2,}",
        re.I,
    )
    for i, c in enumerate(intro_cards(d)):
        for j, p in enumerate(c.get("points") or []):
            if NEG_DEF.search(str(p)):
                f["negdef"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "points[%d]: %s" % (j, str(p).strip()[:72]),
                })

    # C36 — teacher shorthand in + / in − and ?  [EXACT]
    # a2_some_any_no 2026-08-29: "some in + · any in − and ?" took James time
    # to decode. Write positives / negatives / questions. Table headers that
    # are just + / − (a1_imperatives) stay — that table was kept (C30).
    PLUSMINUS = re.compile(
        r"\bin\s+\+"
        r"|\bin\s+[−\-]"
        r"|[−\-]\s+and\s+\?",
        re.I,
    )
    for i, c in enumerate(intro_cards(d)):
        surfaces = [("title", str(c.get("title") or ""))]
        for j, p in enumerate(c.get("points") or []):
            surfaces.append(("points[%d]" % j, str(p)))
        for j, ex in enumerate(c.get("examples") or []):
            if isinstance(ex, dict):
                surfaces.append(("examples[%d]" % j, str(ex.get("en") or "")))
        for j, L in enumerate(c.get("links") or []):
            if isinstance(L, dict):
                surfaces.append(("links[%d]" % j, str(L.get("note") or "")))
        for loc, text in surfaces:
            if PLUSMINUS.search(text):
                f["plusminus"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "%s: %s" % (loc, text.strip()[:72]),
                })
                break

    # B13 — both-pattern verb on a to vs -ing sort  [EXACT]
    # a2_verb_patterns 2026-08-29: try on the to-column; try takes both.
    BOTH_PATTERN = {
        "like", "love", "hate", "prefer", "try", "start", "begin",
        "continue", "stop", "remember", "forget",
    }
    bins_l = " ".join(str(x) for x in (d.get("bins") or [])).lower()
    if "ing" in bins_l and re.search(r"\bto\b", bins_l):
        for it in items:
            if not it.get("bin"):
                continue
            chip = re.sub(r"[^a-z]+", " ", str(it.get("en") or "").lower()).strip()
            head = chip.split()[0] if chip else ""
            if head in BOTH_PATTERN:
                f["bothsort"].append(it)

    # B16 — position-sort column titled "before verb" / "before drink"
    # a2_adverbs_order 2026-08-29: He is often tired is after is, not before verb;
    # "before drink" as a column only fits one chip.
    bin_names = [str(x) for x in (d.get("bins") or [])]
    bin_names += [str(it.get("bin") or "") for it in items if it.get("bin")]
    for bname in bin_names:
        if re.search(r"^before\s+drink\b", bname, re.I):
            f["sortlabel"].append({
                "cz": bname,
                "en": "sort column is the pattern, not before drink",
            })
            break
        if re.search(r"^before\s+(the\s+)?verb\b", bname, re.I) \
                and "be" not in str(d.get("sort_rule") or "").lower() \
                and "can" not in str(d.get("sort_rule") or "").lower():
            f["sortlabel"].append({
                "cz": bname,
                "en": "before the verb needs a be/can rule line (sort_rule)",
            })
            break

    # C37 — sentence-sort chips: if any chip uses **bold**, all 3+ word chips must
    # a2_adverbs_order 2026-08-29: "the adverbs should be highlighted"
    sort_items = [it for it in items if it.get("bin") and it.get("en")]
    if any("**" in str(it.get("en")) for it in sort_items):
        for it in sort_items:
            en = str(it.get("en") or "")
            if len(en.split()) >= 3 and "**" not in en:
                f["sortbold"].append(it)

    # B20 — full-sentence sort chips still carry Czech  [EXACT]
    # b1_word_order_fronting 2026-08-30: EN+CZ overflowed the column.
    # Short word/phrase sorts (always drink / used to live) may keep Czech.
    if d.get("sort_cz") is not False:
        for it in sort_items:
            en_plain = re.sub(r"[*_]+", " ", str(it.get("en") or ""))
            if len(en_plain.split()) >= 6 and str(it.get("cz") or "").strip():
                f["sortcz"].append(it)

    # B21 — word-order Quiz is still a gapped fragment  [EXACT]
    # b1_word_order_fronting 2026-08-30: "which is correct?" with full sentences.
    if "word_order" in uid and uid != "a1_word_order":
        seq = (d.get("check") or {}).get("sequence") or []
        if (not seq or "quiz" in seq) and d.get("quiz_axis") != "sentence":
            f["sentquiz"].append({
                "cz": uid,
                "en": "word-order Quiz is Which is correct? (quiz_axis: sentence)",
            })

    # E8 — word-order sentence Quiz still has Type  [EXACT]
    # b1_word_order_fronting 2026-08-30: cloze cannot force the subject.
    if d.get("quiz_axis") == "sentence":
        if (d.get("ladder") or {}).get("type") is not False:
            if any(it.get("gap") and it.get("type") is not False for it in items):
                f["wordordertype"].append({
                    "cz": uid,
                    "en": "word-order Type cloze cannot force the subject — skip Type",
                })

    # C26 — don't call the target "small words"  [EXACT]
    # a1_to_for_with 2026-08-29: "Three small words" — a, if, no are small too.
    if str(d.get("level", "")).upper() == "A1":
        for i, c in enumerate(intro_cards(d)):
            blob = " ".join([
                str(c.get("title") or ""),
                str(c.get("title_cz") or ""),
                card_text(c),
            ])
            if re.search(r"\bsmall words\b", blob, re.I):
                f["smallwords"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "small words — name the class (prepositions)",
                })

    # C35 — pairs/mistakes table over ~8 rows is two cards  [EXACT]
    # a2_ed_ing_adjectives 2026-08-29: 12-row Common pairs then 12-row
    # Common mistakes — "too much text / split to two pages".
    for i, c in enumerate(intro_cards(d)):
        extra = c.get("tables") if isinstance(c.get("tables"), list) else []
        tables = []
        if isinstance(c.get("table"), dict):
            tables.append(c["table"])
        tables.extend(t for t in extra if isinstance(t, dict))
        title = str(c.get("title") or "")
        for tb in tables:
            rows = tb.get("rows") or []
            heads = " ".join(str(h) for h in (tb.get("headers") or [])).lower()
            dump = bool(re.search(
                r"wrong|right|feeling|cause|-ed|-ing|pair|mistake",
                heads + " " + title, re.I,
            ))
            if dump and len(rows) > 8:
                f["longtable"].append({
                    "cz": "card %d · %s" % (i, title),
                    "en": "%d rows — split across two cards (C35)" % len(rows),
                })

    # C27 — Common mistakes: error column first  [EXACT]
    # a1_to_for_with 2026-08-29: Say / Not was backwards.
    for i, c in enumerate(intro_cards(d)):
        title = str(c.get("title") or "")
        if not re.search(r"common mistakes", title, re.I):
            continue
        heads = [str(h).strip().lower() for h in ((c.get("table") or {}).get("headers") or [])]
        if len(heads) >= 2 and heads[0] == "say" and heads[1] == "not":
            f["mistakecol"].append({
                "cz": "card %d · %s" % (i, title),
                "en": "Say / Not — put the mistake first (Not / Say)",
            })

    # C29 — a tense unit needs a timeline  [CANDIDATE]
    # The rule has been `confirmed` since 2026-08-29 and was never enforced.
    # James 2026-09-04: "all tenses units need at least one timeline diagram,
    # sometimes two, to compare with another tense so as to make meaning
    # clearer." A shape table is not that picture — the student has to see
    # WHERE the form lives in time relative to the tenses already taught.
    TENSE_RE = re.compile(
        r"\b(present|past|future)[\s_-]+(simple|continuous|perfect)\b|"
        r"present[\s_-]?perfect|past[\s_-]?perfect|"
        r"\bwill\b.*\bgoing to\b|\bgoing to\b.*\bwill\b|"
        r"\bused to\b|\btenses?\b", re.I)
    # "be used to / get used to" is an adjective construction (= accustomed),
    # not a tense — it only matched on the substring "used to".
    NOT_A_TENSE = re.compile(r"\b(be|get)[\s_-]?used[\s_-]?to\b", re.I)
    _tense_blob = "%s %s" % (uid, d.get("title") or "")
    if TENSE_RE.search(_tense_blob) and not NOT_A_TENSE.search(_tense_blob):
        # a timeline is a wide horizontal axis, or one of the timeline diagram keys
        TIMELINE_KEY = {"timelines", "time_now", "pp_vs_past"}
        # attribute order varies (x1 y1 x2 y2 in practice), so parse, don't guess
        LINE_TAG = re.compile(r"<line\b[^>]*>", re.I)
        ATTR = re.compile(r"\b(x1|x2|y1|y2)\s*=\s*\"(-?\d+(?:\.\d+)?)\"", re.I)

        def is_axis(tag):
            a = {k.lower(): float(v) for k, v in ATTR.findall(tag)}
            if len(a) < 4:
                return False
            return abs(a["y1"] - a["y2"]) < 2 and abs(a["x2"] - a["x1"]) > 200
        n_tl = 0
        for c in intro_cards(d):
            svg = str(c.get("svg") or "")
            keys = [str(c.get("diagram") or "")] + [
                (dg if isinstance(dg, str) else str((dg or {}).get("diagram") or ""))
                for dg in (c.get("diagrams") or [])]
            if any(k.strip() in TIMELINE_KEY for k in keys):
                n_tl += 1
                continue
            if any(is_axis(tag) for tag in LINE_TAG.findall(svg)):
                n_tl += 1
        if n_tl == 0:
            f["notimeline"].append({
                "cz": "%d intro cards, no timeline" % len(intro_cards(d)),
                "en": "C29 tense unit — needs a timeline against the tenses already taught",
            })

    # C57 — a sequel unit opens by recapping the one it builds on  [CANDIDATE]
    # James, b1_past_continuous_2 2026-09-04: "every unit which is 2, or 3, or 4
    # etc should refer to the previous units in the series and build on them...
    # start with what we already know: a one page recap of Past Continuous 1."
    # A single bullet saying "You already know was/were + -ing" is not the recap;
    # card 0 has to do the job. 18 B1 units are sequels, so this is a class.
    title_now = str(d.get("title") or "")
    m_seq = re.match(r"^(.*?)\s*(?:([2-9])|\(?advanced\)?)\s*$", title_now, re.I)
    if m_seq and m_seq.group(1).strip():
        base = m_seq.group(1).strip().lower()
        idx = tree_index()["by_id"]
        prior = [n for nid, n in idx.items()
                 if nid != uid
                 # the predecessor is often "... 1", so strip 1-9 here even
                 # though only 2-9 marks a unit AS a sequel above
                 and re.sub(r"\s*(?:[1-9]|\(?advanced\)?)\s*$", "",
                            str(n.get("label") or ""), flags=re.I).strip().lower() == base]
        if prior:
            # A dedicated CARD, not a bullet. b1_past_continuous_2 card 0 said
            # "You already know was / were + -ing" inside the new unit's own
            # shape table, and James still flagged it: a one-line nod is not
            # the recap. So look at card TITLES, which is what separates a page
            # about the predecessor from a mention of it.
            cards = intro_cards(d)
            prior_label = str(prior[0].get("label") or "")
            prior_stem = re.sub(r"\s*(?:[1-9]|\(?advanced\)?)\s*$", "",
                                prior_label, flags=re.I).strip().lower()
            recaps = False
            for i_c, c in enumerate(cards[:4]):
                ttl = (str(c.get("title") or "") + " " +
                       str(c.get("title_cz") or "")).lower()
                if re.search(r"already know|you know|recap|remind|"
                             r"už (znáš|víš)|opakován|zopakuj", ttl, re.I):
                    recaps = True
                # card 0 is the unit's own name (C14), so its title naming the
                # predecessor's stem is just the family name, not a recap
                elif i_c > 0 and prior_stem and prior_stem in ttl:
                    recaps = True
            if not recaps:
                f["seqrecap"].append({
                    "cz": "card 0 does not recap %s" % (
                        prior[0].get("label") or prior[0].get("id")),
                    "en": "%s is a sequel — open on what the student already has" % title_now,
                })

    # C17 — Remember / Pamatuj recap card  [EXACT]
    # James, a1_object_pronouns 2026-08-29: "cut this page: it's stupid and
    # cringe and unnecessary." Same leftover on questions_negatives / question_words.
    for i, c in enumerate(intro_cards(d)):
        title = str(c.get("title") or "").strip()
        title_cz = str(c.get("title_cz") or "").strip()
        if re.search(r"^remember$", title, re.I) or re.search(r"^pamatuj$", title_cz, re.I):
            f["remember"].append({
                "cz": "card %d · %s" % (i, title or title_cz),
                "en": "Remember/Pamatuj recap — cut it (C17)",
            })
        if re.search(r"what you practise", title, re.I) or re.search(
            r"^co nácvičuješ", title_cz, re.I
        ):
            f["practisenote"].append({
                "cz": "card %d · %s" % (i, title or title_cz),
                "en": "What you practise recap — cut it (C20)",
            })

    # C45 — "The eight prefixes" implies English has only eight  [EXACT]
    # b1_prefixes 2026-08-30: "misleading to say the eight prefixes /
    # implies that there are only eight / maybe the most common eight".
    for i, c in enumerate(intro_cards(d)):
        title = str(c.get("title") or "").strip()
        if re.search(
            r"\bthe (two|three|four|five|six|seven|eight|nine|ten|twelve) "
            r"(prefixes?|suffixes?)\b",
            title,
            re.I,
        ):
            f["closedset"].append({
                "cz": "card %d · %s" % (i, title),
                "en": "closed inventory title — say the most common N (C45)",
            })

    # C30 — "Not:" bullets under the IS table  [EXACT]
    # a1_imperatives 2026-08-29: shape table was good; the four Not: lines
    # at the bottom had to become a Not/Say table.
    for i, c in enumerate(intro_cards(d)):
        for j, p in enumerate(c.get("points") or []):
            if re.match(r"^\s*not\s*:", str(p), re.I):
                f["notbullet"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "points[%d]: %s" % (j, str(p).strip()[:72]),
                })

    # C12 — invented I + -s on a common-mistakes card  [EXACT]
    # James has never heard I works / I likes from Czech learners.
    for i, c in enumerate(intro_cards(d)):
        title = str(c.get("title") or "")
        if not re.search(r"common mistakes", title, re.I):
            continue
        blob = card_text(c)
        m = re.search(r"\bI\s+(likes|works|wants|needs|goes)\b", blob)
        if m:
            f["fakes3sg"].append({
                "cz": "card %d · %s" % (i, title),
                "en": "I %s — not a heard Czech-learner error" % m.group(1),
            })

    # B10 — in/on/at time pack uses sentence Match, not sort boxes  [EXACT]
    # a1_prepositions_time 2026-08-29: "drag and drop with in on at".
    ga_set = {
        str(it.get("gap_answer") or "").strip().lower()
        for it in items if it.get("gap_answer")
    }
    ga_set.discard("")
    time_core = ga_set - {"a week"}
    seq = [str(x) for x in ((d.get("check") or {}).get("sequence") or [])]
    if time_core == {"in", "on", "at"}:
        if "match" in seq and "sort_bins" not in seq:
            f["timesort"].append({
                "cz": "check.sequence has match, no sort_bins",
                "en": "in/on/at time → three boxes, not sentence Match (B10)",
            })
        for it in items:
            if str(it.get("gap_answer") or "").strip().lower() == "a week":
                f["aweek"].append({
                    "cz": it.get("cz", ""),
                    "en": "%s  ·  a week is Time 2, not at/on/in (F2)"
                    % (it.get("en") or ""),
                })

    # B12 — present perfect Check is sort, not Match  [EXACT]
    # a2_present_perfect 2026-08-29: see→seen and person→have/has both failed;
    # Czech cannot pick this tense. Three boxes, English sentences.
    if perfect_unit:
        if "match" in seq and "sort_bins" not in seq:
            f["ppsort"].append({
                "cz": "check.sequence has match, no sort_bins",
                "en": "Czech cannot pick PP vs past — sort English sentences (B12)",
            })

    # C34 — 3rd form / 3. tvar on an A1/A2 card  [EXACT]
    # a2_present_perfect 2026-08-29: "3rd form to me is 3rd of what?"
    if str(d.get("level", "")).upper() in ("A1", "A2"):
        for i, c in enumerate(intro_cards(d)):
            blob = " ".join([
                str(c.get("title") or ""),
                str(c.get("title_cz") or ""),
                card_text(c),
            ])
            if re.search(r"\b3rd form\b|3\.\s*tvar", blob, re.I):
                f["thirdform"].append({
                    "cz": "card %d · %s" % (i, c.get("title") or ""),
                    "en": "3rd form — say past participle (C34)",
                })

    # C28 — intro diagram key is unknown → blank picture  [EXACT]
    # a1_prepositions_time 2026-08-29: in-on-at-scale was not a schematic.
    # C10 still green (the field is non-empty). Inline svg without a key is fine.
    DIAGRAM_KEYS = {
        "scale", "certainty_scale", "need_scale", "circles", "branch", "cycle", "contrast",
        "hub_spokes", "boxes_row", "timelines", "decision_flow", "pp_vs_past",
        "time_now", "in", "on", "under", "at", "next to", "behind",
        "in front of", "in-on-at", "to-for-with", "articles_map",
        "indefinite_map",
        "move-to", "move-into", "move-onto", "move-from", "move-out-of",
        "move-off", "move-across", "move-along", "move-through", "move-past",
        "move-over", "move-under", "move-up", "move-down", "move-around",
        "move-between", "move-towards", "move-on-bus", "move-off-bus",
    }
    for i, c in enumerate(intro_cards(d)):
        has_svg = bool(str(c.get("svg") or "").strip())
        names = []
        one = str(c.get("diagram") or "").strip()
        if one:
            names.append(one)
        for dgm in c.get("diagrams") or []:
            if isinstance(dgm, str):
                n = dgm.strip()
            elif isinstance(dgm, dict):
                n = str(dgm.get("diagram") or "").strip()
            else:
                n = ""
            if n:
                names.append(n)
        for name in names:
            if name and name not in DIAGRAM_KEYS and not has_svg:
                f["baddiagram"].append({
                    "cz": "card %d · %s" % (i, c.get("title", "")),
                    "en": "diagram %r is not in intro-visuals.js (blank picture)"
                    % name,
                })

    # C4 — cards promise connectors the bank barely drills  [EXACT]
    cardtext = json.dumps(d.get("intro", {}), ensure_ascii=False).lower()
    # Word boundaries, same regex the `used` count applies: substring matching
    # found `if` inside `sans-serif` and `before` inside ordinary card prose.
    promised = [c for c in CONNECTORS if re.search(r"\b%s\b" % re.escape(c), cardtext)]
    used = {c: sum(1 for it in items
                   if re.search(r"\b%s\b" % c, (it.get("accepts") or [it.get("en", "")])[0], re.I))
            for c in promised}

    # "advanced" claimed below B2  [EXACT]
    # "Verb patterns (advanced)" and "Articles (advanced)" were both B1: a
    # difficulty claim where a sequence number was the honest label.
    lvl = str(d.get("level", "")).upper()
    if lvl in ("A1", "A2", "B1") and re.search(r"advanced", str(d.get("title", "")), re.I):
        f["badname"].append({"cz": "level " + lvl, "en": str(d.get("title"))})

    # unit vocabulary well above its own level  [CANDIDATE]
    # b2_preposition_ing was 84% A1 vocabulary — never a B2 unit. This flags the
    # opposite too: a unit whose sentences are harder than the level claims.
    if lvl.lower() in _CEFR_ORD:
        own = _CEFR_ORD[lvl.lower()]
        band = collections.Counter()
        for it in items:
            for w in _words((it.get("accepts") or [it.get("en", "")])[0]):
                l = CEFR.get(w)
                if l:
                    band[_CEFR_ORD[l]] += 1
        tot = sum(band.values())
        if tot >= 40:
            at_or_below = sum(n for k, n in band.items() if k <= own)
            share = at_or_below / tot
            two_below = sum(n for k, n in band.items() if k <= own - 2) / tot
            # A grammar pack MUST carry easy vocabulary — A0 says the form is
            # the only degree of freedom, so the carrier words have to be ones
            # the student already owns. "2+ levels below" is a fault on a vocab
            # leaf and a virtue on a form pack, and it only switched on once a
            # stub was thickened past 40 known tokens, which made honest work
            # look like a regression. (James, 2026-09-04.) The other half of
            # the check — sentences ABOVE the unit's level — still applies.
            is_grammar = (tree_index()["by_id"].get(uid) or {}).get("domain") == "grammar"
            if two_below > 0.75 and not is_grammar:
                f["vocablevel"].append(
                    {"cz": "%.0f%% of words are 2+ levels below %s" % (100 * two_below, lvl),
                     "en": "is this really a %s unit?" % lvl})
            elif share < 0.80:
                f["vocablevel"].append(
                    {"cz": "only %.0f%% of words are %s or below" % (100 * share, lvl),
                     "en": "sentences may be above the unit's level"})

    return {"id": uid, "level": d.get("level"), "n": len(items), "flags": f,
            "n_sentence": sum(1 for it in items if it.get("accepts")),
            "strict_articles": strict_articles, "lenient_if_when": lenient_if_when,
            "promised": used}


def overlap_report(uid, top=3):
    """Which live unit shares most of this one's distinctive vocabulary.

    b2_preposition_ing re-taught b1_dependent_prepositions' collocations a level
    higher and 19 slots later, and nothing flagged it (2026-08-24). Distinctive =
    words used by at most four live units, so shared function words do not drown
    the signal. CANDIDATE: overlap is normal between neighbours; a high score
    means LOOK, not that the unit is redundant."""
    packs = {}
    for u in load_live():
        f = ROOT / "data/grammar/blocks" / (u + ".json")
        if f.exists():
            d = json.loads(f.read_text(encoding="utf-8"))
            packs[u] = [it for b in d.get("blocks", []) for it in b.get("items", [])]
    if uid not in packs:
        return []
    mine = distinctive_words(uid, packs)
    if not mine:
        return []
    out = []
    for u in packs:
        if u == uid:
            continue
        theirs = distinctive_words(u, packs)
        if not theirs:
            continue
        shared = mine & theirs
        if shared:
            out.append((len(shared) / len(mine), u, sorted(shared)[:8]))
    out.sort(reverse=True)
    return out[:top]


LABELS = [
    ("plusminus",   "EXACT  C36 intro says in + / in − and ? — write positives / negatives / questions"),
    ("ppsort",      "EXACT  B12 present perfect Check is Match — Czech cannot pick this tense, use sort"),
    ("thirdform",   "EXACT  C34 A1/A2 intro says 3rd form — name past participle"),
    ("ppcuz",       "EXACT  A9  present-perfect item has no just/already/yet/for (Czech past is also past simple)"),
    ("timesort",    "EXACT  B10 in/on/at time pack still uses sentence Match — sort boxes"),
    ("aweek",       "EXACT  F2  once/twice a week inside an at/on/in pack — Time 2"),
    ("baddiagram",  "EXACT  C28 intro diagram key is not in intro-visuals.js — blank picture"),
    ("smallwords",  "EXACT  C26 A1 intro calls them small words — name the class"),
    ("mistakecol",  "EXACT  C27 Common mistakes table is Say / Not — error first"),
    ("negdef",      "EXACT  C25 intro point is Not X, not Y / Not in / on / at"),
    ("chunkword",   "EXACT  C15 A1 intro uses teacher-speak (chunk / frames / grammar theory)"),
    ("remember",    "EXACT  C17 intro has a Remember/Pamatuj recap card — cut it"),
    ("notbullet",   "EXACT  C30 intro point is a Not: bullet — use a Not/Say table"),
    ("courseaside", "EXACT  C23 intro names this pack / this unit / at A2 / common A1"),
    ("fakes3sg",    "EXACT  C12 common-mistakes lists I+likes/works (not a heard error)"),
    ("toparticle",  "EXACT  B8  Quiz gaps the particle to (want ____ work), not to-V vs V"),
    ("articlegap",  "EXACT  B8  Quiz gaps a/an/the in a pack that is not articles"),
    ("theregap",    "EXACT  B8  there-is pack never gaps There — dummy subject untested"),
    ("cancant",     "EXACT  B8  a1_can statement gaps can/can't — Czech already picks the chip"),
    ("stemcue",     "EXACT  A11 many-pair form pack gap has no (stem) — Type is a vocab test"),
    ("longtable",   "EXACT  C35 pairs/mistakes intro table has >8 rows — split across two cards"),
    ("verbcue",     "EXACT  B11 whole-VP gap has no (lemma), or NP+be cue is the noun only"),
    ("sortlabel",   "EXACT  B16 position-sort column is 'before verb' / 'before drink' — name the pattern"),
    ("sortbold",    "EXACT  C37 sentence-sort chip is 3+ words with no **taught form**"),
    ("patternchip", "EXACT  B18 Quiz chip is to+ing mashup (to swimming) — use the two real forms"),
    ("bothsort",    "EXACT  B13 sort chip takes both to and -ing (try/like) — cannot pick a bin"),
    ("parencue",    "EXACT  B19 (maybe)/(sure)/(impossible) cue has no authored quiz_options"),
    ("practisenote","EXACT  C20 intro has a What you practise recap card — cut it"),
    ("sortcz",      "EXACT  B20 sentence-sort chip still has Czech — omit cz (sort_cz: false)"),
    ("sentquiz",    "EXACT  B21 word-order Quiz is a gap, not Which is correct? with full sentences"),
    ("wordordertype","EXACT  E8  word-order sentence Quiz still has Type — skip Type"),
    ("closedset",   "EXACT  C45 intro title is The eight prefixes — implies a closed set"),
    ("slotgap",     "EXACT  B7  gap is a slot label (person: ____), not a sentence"),
    ("a1meta",      "EXACT  C22 A1 intro says permission/quantifier/preposition with no Czech gloss"),
    ("slash",       "EXACT  D3  cz has two prompts joined with /"),
    ("teachernote", "EXACT  D3  teacher mark in cz (≈ → or English aside)"),
    ("uselead",     "EXACT  F3  A1 Use item has words not yet taught (partner+prior+this)"),
    ("qlead",       "EXACT  F2  Use starts with Do/Does before the questions unit"),
    ("introex",     "EXACT  C4  intro example is not a sentence in this bank"),
    ("quizextra",   "EXACT  C11 teaching-word in Quiz never named in intro"),
    ("hardname",    "EXACT  F4  's name is not on the class list"),
    ("filler",      "EXACT      one explanation doing duty for many items"),
    ("badname",     "EXACT      title claims `advanced` below B2"),
    ("ifwhen",      "EXACT      accepts `If` but not `When` — Czech `když` is both"),
    ("subject",     "EXACT      lists he+she but not it — Czech names no subject"),
    ("contraction", "EXACT      contraction twin missing from accepts"),
    ("synonym",     "EXACT      free English synonym not in the synonym map"),
    ("zeromark",    "EXACT      always-true item with no (vždy platí) marker"),
    ("nopattern",   "CANDIDATE  card claims there is no pattern to learn"),
    ("hardgloss",   "CANDIDATE  gloss harder than the word it explains"),
    ("vocablevel",  "CANDIDATE  unit vocabulary does not match its level"),
    ("czfuture",    "CANDIDATE  Czech looks future, English answer has no will"),
    ("article",     "CANDIDATE  demands `the`, Czech has no demonstrative"),
    ("useleadhi",   "CANDIDATE  F3 above A1 — Use item has words not yet taught"),
    ("ppanchor",    "CANDIDATE  A14 past perfect with no past reference point"),
    ("seqrecap",    "CANDIDATE  C57 sequel unit does not recap its predecessor"),
    ("notimeline",  "CANDIDATE  C29 tense unit has no timeline diagram"),
]


def report(r, brief=False):
    print("=" * 72)
    print("%s  ·  %s  ·  %d items" % (r["id"], r["level"], r["n"]))
    flags, f = r["flags"], r["flags"]
    print("  Use exposure : %d of %d sentence items accept ONE wording"
          % (len(f["onewording"]), r["n_sentence"]))
    if f["noopts"]:
        print("  Quiz         : %d gap items have NO authored options — distractors are"
              % len(f["noopts"]))
        print("                 borrowed from other items, so Check may test nothing.")
    if r["strict_articles"]:
        print("  NOTE         : strict_articles is ON — `the` IS the lesson here, do not flag it")
    if r["lenient_if_when"]:
        print("  NOTE         : lenient_if_when is ON — `when` is accepted for `if`")
    print()
    total = 0
    for key, label in LABELS:
        hits = flags[key]
        if not hits:
            continue
        total += len(hits)
        print("  [%d] %s" % (len(hits), label))
        if not brief:
            for it in hits[:6]:
                cz = (it.get("cz") or "")[:56]
                en = (it.get("en") or (it.get("accepts") or [""])[0])[:72]
                print("        cz: %s" % cz)
                print("        en: %s" % en)
            if len(hits) > 6:
                print("        ... and %d more" % (len(hits) - 6))
        print()
    if not brief:
        ov = overlap_report(r["id"])
        if ov and ov[0][0] >= 0.25:
            print("  [ ] CANDIDATE  shares distinctive vocabulary with another live unit")
            for score, u, words in ov:
                if score >= 0.15:
                    print("        %3.0f%%  %-32s %s" % (100 * score, u, ", ".join(words[:6])))
            print()

    thin = {c: n for c, n in r["promised"].items() if n <= 2}
    well = [c for c, n in r["promised"].items() if n >= 10]
    # only an equivalence CLAIM counts: 3+ connectors named, one of them heavily
    # drilled, the rest barely. Otherwise a passing mention of "if" flagged every pack.
    if len(r["promised"]) >= 3 and well and thin:
        print("  [%d] EXACT      cards promise connectors the bank barely drills" % len(thin))
        print("        promised: %s" % ", ".join("%s=%d" % (c, n) for c, n in r["promised"].items()))
        print()
    if not total:
        print("  no flags from the exact checks.\n")
    return total


def preflight_global():
    """Checks that are about the course, not one unit. Printed before anything."""
    bad = status_disagreements()
    if bad:
        print("STATUS DISAGREEMENT — tree.json vs nodes-grammar.json")
        print("  the app reads tree.json; these scripts read nodes-grammar.json,")
        print("  so a status set in only one place silently does nothing.")
        for uid, a, b in bad:
            print("    %-32s tree=%-8s nodes-grammar=%s" % (uid, a, b))
        print()


def main():
    args = [a for a in sys.argv[1:]]
    brief = "--brief" in args
    args = [a for a in args if not a.startswith("--")]
    preflight_global()
    if "--all" in sys.argv[1:]:
        rows = []
        for uid in load_live():
            r = lint_pack(uid)
            if not r:
                continue
            n = sum(len(r["flags"][k]) for k, _ in LABELS)
            rows.append((n, uid, r))
        rows.sort(reverse=True, key=lambda x: x[0])
        print("LIVE UNITS RANKED BY FLAG COUNT\n")
        for n, uid, r in rows:
            print("  %3d  %-34s %s  %d items" % (n, uid, r["level"], r["n"]))
        print("\ntotal flags across %d units: %d" % (len(rows), sum(n for n, _, _ in rows)))
        if not brief:
            print("\nRun `python codex/lint.py <unit>` for the items.")
        return
    if not args:
        print(__doc__)
        return
    for uid in args:
        r = lint_pack(uid)
        if not r:
            print("no such live pack: %s" % uid)
            continue
        report(r, brief)


if __name__ == "__main__":
    main()
