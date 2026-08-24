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
                         "czfuture", "zeromark", "noopts", "onewording")}

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

    # C4 — cards promise connectors the bank barely drills  [EXACT]
    cardtext = json.dumps(d.get("intro", {}), ensure_ascii=False).lower()
    promised = [c for c in CONNECTORS if c in cardtext]
    used = {c: sum(1 for it in items
                   if re.search(r"\b%s\b" % c, (it.get("accepts") or [it.get("en", "")])[0], re.I))
            for c in promised}

    return {"id": uid, "level": d.get("level"), "n": len(items), "flags": f,
            "n_sentence": sum(1 for it in items if it.get("accepts")),
            "strict_articles": strict_articles, "lenient_if_when": lenient_if_when,
            "promised": used}


LABELS = [
    ("ifwhen",      "EXACT      accepts `If` but not `When` — Czech `když` is both"),
    ("subject",     "EXACT      lists he+she but not it — Czech names no subject"),
    ("contraction", "EXACT      contraction twin missing from accepts"),
    ("synonym",     "EXACT      free English synonym not in the synonym map"),
    ("zeromark",    "EXACT      always-true item with no (vždy platí) marker"),
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


def main():
    args = [a for a in sys.argv[1:]]
    brief = "--brief" in args
    args = [a for a in args if not a.startswith("--")]
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
