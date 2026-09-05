#!/usr/bin/env python3
"""
check_rules.py — the batch of rules that were written down and never mechanised.

Written 2026-09-05 after James asked why smoke testing is not getting faster.
The answer was that 111 of 150 rules had no check, so he was acting as the linter
for rules already in `AUTHORING-RULES.md`. `codex/RULE-ENFORCEMENT.md` triages all
of them; this file holds the ones worth a script.

Each check names its rule. A1/A2 packs are marked `[PROTECTED]` and counted
separately: a check that would redden protected packs is still worth landing
(I11) — it just must not gate. The ratchet is the total over unprotected packs.

    py -X utf8 codex/check_rules.py                # everything
    py -X utf8 codex/check_rules.py b1_wishes      # one pack, with the findings
    py -X utf8 codex/check_rules.py --level b1
    py -X utf8 codex/check_rules.py --rule C49
    py -X utf8 codex/check_rules.py --check        # non-zero exit if the count rose
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAMMAR = ROOT / "data/grammar/blocks"
VOCAB = ROOT / "data/vocab/blocks"
BASELINE = ROOT / "audit/rules-baseline.json"

PROTECTED = ("a1", "a2")
CZECH_LETTER = re.compile(r"[čďěňřšťůž]", re.I)
STRIKE = re.compile(r"~~.+?~~")
MISTAKE_HEAD = re.compile(r"not this|wrong|mistake|chyb|~~", re.I)
SAY_HEAD = re.compile(r"say this|right|correct|správn", re.I)


def cards_of(d):
    intro = d.get("intro")
    if isinstance(intro, dict):
        return intro.get("cards") or []
    return intro or []


def items_of(d):
    return [it for b in (d.get("blocks") or []) for it in (b.get("items") or [])]


def tables_of(card):
    return ([card["table"]] if card.get("table") else []) + list(card.get("tables") or [])


def cue_of(gap):
    """The bracket at the end of a gap stem: 'I ____ work. (must)' -> 'must'."""
    m = re.search(r"\(([^()]*)\)\s*$", str(gap or ""))
    return m.group(1).strip() if m else ""


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[*~`]", "", str(s or ""))).strip().lower()


# ---------------------------------------------------------------- B rules

def b2_borrowed_answer(uid, d):
    """B2 — a FORM pack must not offer a sibling item's answer as a distractor."""
    items = items_of(d)
    answers = {norm(it.get("gap_answer")) for it in items if it.get("gap_answer")}
    if len(answers) < 4:
        return []                       # a which-word pack, where borrowing is right
    out = []
    for i, it in enumerate(items):
        mine = norm(it.get("gap_answer"))
        for o in it.get("quiz_options") or []:
            n = norm(o)
            if n and n != mine and n in answers:
                out.append(("B2", i, "chip %r is another item's answer" % o))
                break
    return out


def b3_no_options(uid, d):
    """B3 — a gap item in a form pack needs authored quiz_options."""
    gaps = [it for it in items_of(d) if it.get("gap")]
    bare = [it for it in gaps if not (it.get("quiz_options") or [])]
    if not bare or len(bare) * 4 < len(gaps):
        return []                       # a handful is the engine fallback doing its job
    return [("B3", None, "%d of %d gap items have no authored quiz_options"
             % (len(bare), len(gaps)))]


def b25_cue_is_answer(uid, d):
    """B25 — the answer is the bracketed cue copied out; the item tests nothing."""
    out = []
    for i, it in enumerate(items_of(d)):
        cue, ans = norm(cue_of(it.get("gap"))), norm(it.get("gap_answer"))
        if not cue or not ans:
            continue
        cue = re.sub(r"^(the|a|an)\s+", "", cue)
        if cue == ans:
            out.append(("B25", i, "cue (%s) is the answer" % cue))
    return out


def b26_negative_cue(uid, d):
    """B26 — a negative answer needs a negative in the cue, not only in the Czech."""
    if "tag" in uid:
        return []                       # a negative tag is the teaching point
    out = []
    for i, it in enumerate(items_of(d)):
        ans, cue = norm(it.get("gap_answer")), norm(cue_of(it.get("gap")))
        if not ans or not cue:
            continue
        neg_ans = re.search(r"\bn't\b|\bnot\b|n't", ans) or "n't" in ans
        if neg_ans and not re.search(r"not|n't|negative|won't|nikoli|ne\b", cue):
            out.append(("B26", i, "answer %r is negative, cue (%s) is not" % (it["gap_answer"], cue)))
    return out


def b22_vocab_quiz_mode(uid, d):
    """B22 — a leaf with a sentence bank runs sentence_gap Quiz, not a second word list."""
    if not (d.get("sentences") and items_of(d)):
        return []
    if d.get("quiz_mode") != "sentence_gap":
        return [("B22", None, "leaf has %d sentences but quiz_mode is %r"
                 % (len(d["sentences"]), d.get("quiz_mode")))]
    return []


# ---------------------------------------------------------------- C rules

def c13_bold_the_form(uid, d):
    """C13 — bold the taught form in intro examples, not nothing and not everything."""
    out = []
    for ci, c in enumerate(cards_of(d)):
        for e in c.get("examples") or []:
            en = e.get("en") if isinstance(e, dict) else e
            if not en or len(str(en).split()) < 3:
                continue
            bolds = re.findall(r"\*\*(.+?)\*\*", str(en))
            if not bolds:
                out.append(("C13", ci, "example with nothing bolded: %r" % str(en)[:52]))
            elif len(bolds) == 1 and norm(bolds[0]) == norm(re.sub(r"[*]", "", str(en))):
                out.append(("C13", ci, "whole example bolded: %r" % str(en)[:52]))
    return out


def c14_card0_title(uid, d):
    """C14 — card 0's title is the unit's name, not a nickname."""
    cs = cards_of(d)
    if not cs:
        return []
    t, title = norm(cs[0].get("title")), norm(d.get("title"))
    if not t or not title:
        return []
    if t == title or t in title or title in t:
        return []
    return [("C14", 0, "card 0 is %r, the unit is %r" % (cs[0].get("title"), d.get("title")))]


def c19_czech_in_english_table(uid, d):
    """C19 — Czech lives in title_cz and examples, not sprinkled in an English table.

    A Czech-to-English contrast table is not that fault. `b1_modals_speculation`
    card 7 is titled "Czech trap · mozna" and pairs Czech sentences with their
    English — Czech belongs in its left column. Skip a card that says so, and skip
    a table whose first column is mostly Czech.
    """
    out = []
    for ci, c in enumerate(cards_of(d)):
        if re.search(r"czech|česk", "%s %s" % (c.get("title") or "", c.get("title_cz") or ""), re.I):
            continue
        for t in tables_of(c):
            rows = t.get("rows") or []
            first_cz = sum(1 for r in rows if r and CZECH_LETTER.search(str(r[0])))
            if rows and first_cz * 2 >= len(rows):
                continue                  # a CZ -> EN pair table, which is its job
            heads = [str(h) for h in (t.get("headers") or [])]
            for row in t.get("rows") or []:
                for i, cell in enumerate(row):
                    head = heads[i] if i < len(heads) else ""
                    if re.search(r"cz|czech|česk", head, re.I):
                        continue
                    if CZECH_LETTER.search(str(cell)):
                        out.append(("C19", ci, "Czech in the %r column: %r" % (head, str(cell)[:40])))
    return out


def c32_errors_look_like_errors(uid, d):
    """C32 — a mistakes column uses ~~strike~~, or the errors read as emphasis."""
    out = []
    for ci, c in enumerate(cards_of(d)):
        for t in tables_of(c):
            heads = [str(h) for h in (t.get("headers") or [])]
            cols = [i for i, h in enumerate(heads) if MISTAKE_HEAD.search(h)]
            if not cols:
                continue
            for i in cols:
                cells = [str(r[i]) for r in (t.get("rows") or []) if i < len(r)]
                if cells and not any(STRIKE.search(x) for x in cells):
                    out.append(("C32", ci, "%r column has no ~~strike~~: %r"
                                % (heads[i], cells[0][:40])))
    return out


def c46_numbered_series(uid, d, titles):
    """C46 — if 'X 2' exists, the first unit is 'X 1', not bare 'X'."""
    title = str(d.get("title") or "").strip()
    if not title or re.search(r"\d\s*$", title):
        return []
    base = re.sub(r"\s*\(.*?\)\s*$", "", title).strip().lower()
    if any(re.match(r"^%s\s*[2-9]$" % re.escape(base), t.lower()) for t in titles if t):
        return [("C46", None, "%r has a sequel, so it should be %r" % (title, title + " 1"))]
    return []


def c49_intro_shows_every_word(uid, d):
    """C49 — a vocab intro shows every new word, not a sample."""
    lemmas = {norm(it.get("en")) for it in items_of(d) if it.get("en")}
    if not lemmas:
        return []
    phrases = sum(1 for w in lemmas if w.count(" ") >= 2)
    if phrases * 3 >= len(lemmas):
        return []                       # a chunk pack: its words are phrases, not tiles
    shown = set()
    for c in cards_of(d):
        for p in c.get("pictures") or []:
            shown.add(norm(p.get("en")))
        for t in tables_of(c):
            for row in t.get("rows") or []:
                for cell in row:
                    for part in re.split(r"[·,;/|]", str(cell)):
                        shown.add(norm(part))
    missing = sorted(w for w in lemmas if w and w not in shown)
    if not missing:
        return []
    return [("C49", None, "%d of %d words never shown in the intro: %s"
             % (len(missing), len(lemmas), ", ".join(missing[:8])))]


def c56_vocab_page_is_pictures(uid, d):
    """C56 — a diagram-only page is grammar; vocab intros are picture boards."""
    cs = cards_of(d)
    if not cs:
        return []
    c = cs[0]
    if c.get("pictures"):
        return []
    if c.get("diagram") or c.get("svg"):
        return [("C56", 0, "vocab intro opens on a diagram with no picture board")]
    return []


# ---------------------------------------------------------------- D, E, F, H, J

def d1_generic_explanations(uid, d):
    """D1 — an explanation names THIS item. One string across many items is filler."""
    items = [it for it in items_of(d) if it.get("explanation")]
    if len(items) < 8:
        return []
    seen = {}
    for it in items:
        seen.setdefault(norm(it["explanation"]), []).append(it)
    worst = max(seen.items(), key=lambda kv: len(kv[1]))
    if len(worst[1]) >= 4:
        return [("D1", None, "one explanation covers %d of %d items: %r"
                 % (len(worst[1]), len(items), worst[0][:52]))]
    if len(seen) * 3 < len(items):
        return [("D1", None, "%d distinct explanations for %d items" % (len(seen), len(items)))]
    return []


def e3_aspect_strict(uid, d):
    """E3 — a continuous twin is not an accepted variant of a simple-form answer."""
    out = []
    for i, it in enumerate(items_of(d)):
        en = str(it.get("en") or "")
        if not en or re.search(r"\b(am|is|are|was|were)\s+\w+ing\b", en):
            continue
        for a in it.get("accepts") or []:
            if re.search(r"\b(am|is|are|was|were)\s+\w+ing\b", str(a)):
                out.append(("E3", i, "continuous twin accepted for a simple-form answer: %r"
                            % str(a)[:46]))
                break
    return out


def e10_vocab_use_mode(uid, d):
    """E10 — from A2, vocab Use is production, not CZ->EN of the bank."""
    lvl = str(d.get("level") or "").lower()
    if lvl in ("", "a1"):
        return []
    if not d.get("sentences"):
        return []
    mode = d.get("use_mode")
    if mode in ("rewrite", "correct"):
        return []
    return [("E10", None, "vocab Use is %r — from A2 it is production of the new word" % mode)]


def f7_word_taught_twice(uid, d, owners):
    """F7 — a vocab word is introduced as new only once."""
    out = []
    for it in items_of(d):
        w = norm(it.get("en"))
        if not w:
            continue
        first = owners.get(w)
        if first and first != uid:
            out.append(("F7", None, "%r is already taught as new in %s" % (it["en"], first)))
    return out[:6]


def h5_theme_safe_svg(uid, d):
    """H5 — inline SVG uses currentColor and CSS variables, never a hardcoded hex."""
    out = []
    for ci, c in enumerate(cards_of(d)):
        svg = c.get("svg")
        if not svg:
            continue
        # var(--vocab-accent, #4db6c7) is the house pattern: the variable carries the
        # theme and the hex is only its fallback. Only a bare hex is the fault.
        bare = re.sub(r"var\(\s*--[a-z-]+\s*,\s*#[0-9a-fA-F]{3,6}\s*\)", "", str(svg))
        hexes = set(re.findall(r"#[0-9a-fA-F]{3,6}\b", bare))
        if hexes:
            out.append(("H5", ci, "inline svg has hardcoded colour%s: %s"
                        % ("s" if len(hexes) > 1 else "", ", ".join(sorted(hexes)[:4]))))
    return out


def j2_ids_match(uid, d):
    """J2 — filename, pack id and tree_node are one string, or the register drops it."""
    out = []
    if d.get("id") and d["id"] != uid:
        out.append(("J2", None, "pack id %r does not match the filename %r" % (d["id"], uid)))
    return out


# ---------------------------------------------------------------- runner

GRAMMAR_CHECKS = [b3_no_options, b26_negative_cue,
                  c13_bold_the_form, c19_czech_in_english_table,
                  c32_errors_look_like_errors, d1_generic_explanations, e3_aspect_strict,
                  h5_theme_safe_svg, j2_ids_match]
VOCAB_CHECKS = [b22_vocab_quiz_mode, c49_intro_shows_every_word, c56_vocab_page_is_pictures,
                e10_vocab_use_mode, h5_theme_safe_svg, j2_ids_match]

ALL_RULES = ["B3", "B22", "B26", "C13", "C19", "C32", "C46", "C49",
             "C56", "D1", "E3", "E10", "F7", "H5", "J2"]


def load(folder):
    out = {}
    for f in sorted(folder.glob("*.json")):
        try:
            out[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
    return out


def run(only=None, level=None, rule=None):
    gram, voc = load(GRAMMAR), load(VOCAB)
    titles = [str(d.get("title") or "") for d in list(gram.values()) + list(voc.values())]

    # F7 needs to know who taught each word first, in path order
    owners = {}
    try:
        sys.path.insert(0, str(ROOT / "codex"))
        from tree_path import teaching_path
        tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
        by_node = {d.get("tree_node"): k for k, d in voc.items() if d.get("tree_node")}
        for nid in teaching_path(tree):
            k = by_node.get(nid)
            if not k:
                continue
            for it in items_of(voc[k]):
                w = norm(it.get("en"))
                if w:
                    owners.setdefault(w, k)
    except Exception:
        owners = {}

    rows = []
    for uid, d in sorted(list(gram.items()) + list(voc.items())):
        if only and uid not in only:
            continue
        lvl = str(d.get("level") or "").lower()
        if level and lvl != level:
            continue
        checks = GRAMMAR_CHECKS if uid in gram else VOCAB_CHECKS
        hits = []
        for fn in checks:
            try:
                hits += fn(uid, d)
            except Exception as exc:
                hits.append(("!!", None, "%s crashed: %s" % (fn.__name__, exc)))
        hits += c46_numbered_series(uid, d, titles)
        if uid in voc and rule == "F7":
            hits += f7_word_taught_twice(uid, d, owners)
        if rule:
            hits = [h for h in hits if h[0] == rule.upper()]
        if hits:
            rows.append((uid, lvl, hits))
    return rows


def main() -> int:
    argv = sys.argv[1:]
    check = "--check" in argv
    level = rule = None
    for flag in ("--level", "--rule"):
        if flag in argv:
            i = argv.index(flag)
            val = argv[i + 1]
            argv = argv[:i] + argv[i + 2:]
            if flag == "--level":
                level = val.lower()
            else:
                rule = val
    only = [a for a in argv if not a.startswith("-")]

    rows = run(only or None, level, rule)
    live = sum(len(h) for u, l, h in rows if l not in PROTECTED)
    prot = sum(len(h) for u, l, h in rows if l in PROTECTED)

    if not rows:
        print("check_rules: clean")
    else:
        print("RULES THAT HAD NO CHECK — see codex/RULE-ENFORCEMENT.md\n")
        for uid, lvl, hits in sorted(rows, key=lambda r: (r[1] in PROTECTED, -len(r[2]))):
            tag = "  [PROTECTED — do not touch]" if lvl in PROTECTED else ""
            print("  %3d  %s  %-30s%s" % (len(hits), lvl.upper(), uid, tag))
            if only or rule or len(rows) == 1:
                for rid, idx, msg in hits:
                    where = "item %s" % idx if isinstance(idx, int) else "pack"
                    print("        %-4s %-9s %s" % (rid, where, msg))
        print("\ncheck_rules: %d packs · %d findings (%d live · %d protected)"
              % (len(rows), live + prot, live, prot))

    if only or level or rule:
        return 0
    if not BASELINE.is_file():
        BASELINE.write_text(json.dumps({"live": live}) + "\n", encoding="utf-8")
        print("baseline written: %d live" % live)
        return 0
    base = json.loads(BASELINE.read_text(encoding="utf-8")).get("live", 0)
    if live > base:
        print("RATCHET FAIL: %d > baseline %d" % (live, base))
        return 1 if check else 0
    if live < base:
        BASELINE.write_text(json.dumps({"live": live}) + "\n", encoding="utf-8")
        print("baseline tightened: %d -> %d" % (base, live))
    else:
        print("ratchet ok: %d vs baseline %d" % (live, base))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
