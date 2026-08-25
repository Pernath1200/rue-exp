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
    tb = card.get("table") or {}
    for row in (tb.get("rows") or []):
        bits += [str(x) for x in row]
    return " ".join(bits)


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
                         "filler", "nopattern", "hardgloss", "badname", "vocablevel")}

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
                cz = (it.get("cz") or "")[:48]
                en = ((it.get("accepts") or [it.get("en", "")])[0])[:60]
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
