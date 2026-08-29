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
from intro, F4 unknown 's names. Still read-only. `/smoke-prep` runs this.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- shared patterns ---------------------------------------------------------
DEMONSTRATIVE = re.compile(r"\b(ten|ta|to|toho|tu|ty|tento|tato|toto|tomu|tom|těch|těm)\b", re.I)

# Czech perfective presents that MEAN FUTURE. A wordlist, not morphology, so this is
# a candidate check. The walk-home item (`přijdeš` = you WILL arrive, answer demanded
# the present) is the failure it exists to catch.
CZ_FUTURE = re.compile(
    r"\b(bude|budeš|budu|budou|budeme|budete|přijde|přijdeš|přijdu|přijdou|"
    r"otevře|otevřeš|udělá|uděláš|koupí|koupíš|zavolá|zavoláš|půjde|půjdeš|"
    r"půjdu|půjdeme|pojede|pojedeš|přinese|přineseš|uvidí|uvidíš|dá|dáš|"
    r"skončí|začne|začneš|pošle|pošleš|vezme|vezmeš|napíše|napíšeš)\b", re.I)

CONTRACTIONS = {
    "it's": "it is", "i'm": "i am", "you're": "you are", "we're": "we are",
    "they're": "they are", "he's": "he is", "she's": "she is", "that's": "that is",
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "won't": "will not", "isn't": "is not", "aren't": "are not",
    "can't": "cannot", "couldn't": "could not", "wouldn't": "would not",
    "let's": "let us", "i'll": "i will", "we'll": "we will", "you'll": "you will",
}

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
UNREAL = {"b2_second_conditional", "b2_third_conditional", "b2_mixed_conditionals",
          "b2_wish_if_only", "c1_subjunctive"}

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
        path = []
        for k in (
            "path_order",
            "path_order_a2",
            "path_order_b1",
            "path_order_b2",
            "path_order_c1",
        ):
            path.extend(t.get(k) or [])
        _TREE_IDX = {
            "path": path,
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


def lint_pack(uid):
    p = ROOT / "data/grammar/blocks" / f"{uid}.json"
    if not p.exists():
        return None
    d = json.loads(p.read_text(encoding="utf-8"))
    items = [it for b in d.get("blocks", []) for it in b.get("items", [])]
    strict_articles = bool(d.get("strict_articles"))
    lenient_if_when = bool(d.get("lenient_if_when"))
    syn = json.loads((ROOT / "data/senses.json").read_text(encoding="utf-8")).get("synonyms", {})

    f = {k: [] for k in ("ifwhen", "subject", "article", "contraction", "synonym",
                         "czfuture", "zeromark", "noopts", "onewording",
                         "filler", "nopattern", "hardgloss", "badname", "vocablevel",
                         "slash", "teachernote", "uselead", "qlead",
                         "introex", "quizextra", "hardname", "chunkword",
                         "fakes3sg", "toparticle", "remember",
                         "articlegap", "theregap", "cancant", "a1meta",
                         "courseaside", "negdef", "smallwords", "mistakecol",
                         "timesort", "aweek", "baddiagram", "notbullet",
                         "verbcue", "thirdform", "ppcuz", "ppsort")}

    taught = taught_lexicon(uid, items)
    q_ok = questions_already_taught(uid)

    for it in items:
        acc = it.get("accepts") or []
        cz = it.get("cz", "")
        en = acc[0] if acc else it.get("en", "")

        if it.get("gap_answer") and not (
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
        if re.search(r"\bwant[s]?\s+_{2,}\s+\w", gap, re.I) and ga == "to":
            f["toparticle"].append(it)

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

        # B11 — present perfect whole VP (have just finished) with no (just/finish)
        # a2_present_perfect 2026-08-29: I ____. → have just finished.
        if uid == "a2_present_perfect":
            if re.search(r"\b(have|has|haven't|hasn't)\s+\w+", ga) and "(" not in gap:
                after = re.split(r"_{2,}", gap, maxsplit=1)
                rest = after[1] if len(after) > 1 else ""
                if not re.search(r"\b(finished|arrived|eaten|seen|called|done)\b",
                                 rest, re.I):
                    f["verbcue"].append(it)

        # A9 — Czech past does not pick present perfect  [EXACT]
        # a2_present_perfect 2026-08-29: Uklidil jsem kuchyň is also I cleaned.
        if uid == "a2_present_perfect" and it.get("gap"):
            if re.search(r"\b(have|has|haven't|hasn't)\b", ga) and ga not in (
                    "have", "has"):
                blob = " ".join([cz, en, gap]).lower()
                if not re.search(
                        r"just|already|yet|never|ever|\bfor\b|since|"
                        r"už|ještě|právě|nikdy|někdy|dlouho|\brok|\blet\b|"
                        r"before",
                        blob, re.I):
                    f["ppcuz"].append(it)

        # F3 — Use production uses a word the path has not taught  [EXACT]
        if it.get("use") is not False:
            leftover = [
                w for w in _words(en)
                if w not in taught and w not in FUNCTION and len(w) > 2
            ]
            if leftover:
                f["uselead"].append({
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
        low = [a.lower() for a in acc]
        for a in low:
            hit = False
            for short, long in CONTRACTIONS.items():
                for x, y in ((short, long), (long, short)):
                    if re.search(r"\b%s\b" % re.escape(x), a) and \
                       re.sub(r"\b%s\b" % re.escape(x), y, a) not in low:
                        f["contraction"].append(it); hit = True; break
                if hit: break
            if hit: break

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
    if uid == "a2_present_perfect":
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
        "scale", "need_scale", "circles", "branch", "cycle", "contrast",
        "hub_spokes", "boxes_row", "timelines", "decision_flow", "pp_vs_past",
        "time_now", "in", "on", "under", "at", "next to", "behind",
        "in front of", "in-on-at", "to-for-with", "articles_map",
    }
    for i, c in enumerate(intro_cards(d)):
        name = str(c.get("diagram") or "").strip()
        has_svg = bool(str(c.get("svg") or "").strip())
        if name and name not in DIAGRAM_KEYS and not has_svg:
            f["baddiagram"].append({
                "cz": "card %d · %s" % (i, c.get("title", "")),
                "en": "diagram %r is not in intro-visuals.js (blank picture)"
                % name,
            })

    # C4 — cards promise connectors the bank barely drills  [EXACT]
    cardtext = json.dumps(d.get("intro", {}), ensure_ascii=False).lower()
    promised = [c for c in CONNECTORS if c in cardtext]
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
            if two_below > 0.75:
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
    ("verbcue",     "EXACT  B11 whole-VP gap has no (lemma) and the stem does not name the verb"),
    ("a1meta",      "EXACT  C22 A1 intro says permission/quantifier/preposition with no Czech gloss"),
    ("slash",       "EXACT  D3  cz has two prompts joined with /"),
    ("teachernote", "EXACT  D3  teacher mark in cz (≈ → or English aside)"),
    ("uselead",     "EXACT  F3  Use item has words not yet taught (partner+prior+this)"),
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
