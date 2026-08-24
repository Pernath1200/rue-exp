#!/usr/bin/env python
"""Rebuild Patrik's error-practice page from the 2026-08-22 original.

Adds app deep-links to every explanation, applies James's smoke corrections, and
fixes the two UI faults found on 2026-08-24 (dead 1-3 keys, "Which is the English?").

The 08-22 file is the immutable source: every run starts from it and re-applies
everything below, so corrections accumulate and nothing is lost. To act on a new
smoke flag, add one entry to CORRECT and re-run.

    python codex/build_patrik_errors_page.py

Unit-link policy is inherited from codex/marking_topic_map.json: an item with no
LIVE unit is left UNLINKED on purpose. A link that goes nowhere useful is worse
than no link, and the blanks are what tell us which units to build.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_inspected_register import inspected_units

DESKTOP = Path.home() / "Desktop"
SRC = DESKTOP / "Practice_Patrik_Errors_2026-08-22.html"
OUT = DESKTOP / "Practice_Patrik_Errors_2026-08-24.html"

BASE = "https://pernath1200.github.io/rue-exp/"

# id -> (title, level). All verified live (status: live, on a path_order) 2026-08-24.
UNITS = {
    "a2_first_conditional": ("First conditional", "A2"),
    "b1_verb_patterns_advanced": ("Verb patterns +", "B1"),
    "b2_preposition_ing": ("Preposition + -ing", "B2"),
    "b1_articles_advanced": ("Articles (advanced)", "B1"),
    "a2_present_continuous": ("Present continuous", "A2"),
    "a1_prepositions_time": ("Prepositions of time", "A1"),
    "b1_indirect_questions": ("Indirect questions", "B1"),
    "a2_quantifiers": ("Much / many / a lot", "A2"),
    "b1_degree_adverbs": ("Degree adverbs", "B1"),
    "a2_comparatives": ("Comparatives", "A2"),
    "a2_ed_ing_adjectives": ("-ed / -ing adjectives", "A2"),
}

# Whole-group mappings. small = deliberately heterogeneous, mapped per item below.
GROUP = {
    "will": "a2_first_conditional",
    "verb": "b1_verb_patterns_advanced",
    "art": "b1_articles_advanced",
    "be": "a2_present_continuous",
    "small": None,
}

# verb-group items whose real point is preposition + -ing, not to/bare infinitive.
PREP_ING = {
    "blocking you from to be powerful",
    "I'm thinking about to change the design.",
    "He is interested in to invest.",
    "Thanks for to help me yesterday.",
}

# small-group, one at a time. None = no live unit; leave unlinked (see policy above).
SMALL = {
    "in Wednesday": "a1_prepositions_time",
    "ask him when is he…": "b1_indirect_questions",
    "I have lot of people": "a2_quantifiers",
    "a lot of different to Prague": "b1_degree_adverbs",
    "it's more better": "a2_comparatives",
    "if you're stressful about it": "a2_ed_ing_adjectives",
    "3 times in week": None,
    "he say me that…": None,          # a2_say_tell exists but status: coming
    "I am doing this for me": None,   # a2_reflexives exists but status: coming
    "this is the different": None,    # word form, no unit
    "it's a good dokument": None,     # word choice, no unit
}

# --- Carrier sentences for the 22 `sheet` items (James, 2026-08-24) ------------
# The sheet items were captured as raw fragments from lessons, so on their own the
# three options had no context to choose between ("if I will say" / "if I would
# say" / "if I say" are all sayable). Each is now embedded in a short sentence —
# invented context is fine, his call — so exactly one option is right. The 20
# `fresh` items were already full sentences and are untouched.
#
# Keyed on the ORIGINAL `said` fragment. Replaces said/right/d, and rule where the
# rule needed to move with it.
CARRIER = {
    "if I will say": {
        "said": "If I will say it now, it will sound wrong.",
        "right": ["If I say it now, it will sound wrong."],
        "d": "If I would say it now, it will sound wrong.",
    },
    "if you will talk with him": {
        "said": "If you will talk to him tomorrow, please explain the delay.",
        "right": ["If you talk to him tomorrow, please explain the delay.",
                  "If you talk with him tomorrow, please explain the delay."],
        "d": "If you would talk to him tomorrow, please explain the delay.",
    },
    "when we will be live": {
        "said": "When we will be live, I will send you the link.",
        "right": ["When we are live, I will send you the link.",
                  "When we go live, I will send you the link."],
        "d": "When we would be live, I will send you the link.",
    },
    "what can we to do": {
        "said": "What can we to do about the deadline?",
        "right": ["What can we do about the deadline?"],
        "d": "What can we doing about the deadline?",
    },
    "do you want be the best?": {
        "said": "Do you want be the best in the market?",
        "right": ["Do you want to be the best in the market?"],
        "d": "Do you want being the best in the market?",
    },
    "blocking you from to be powerful": {
        "said": "That fear is blocking you from to be powerful.",
        "right": ["That fear is blocking you from being powerful."],
        "d": "That fear is blocking you from be powerful.",
    },
    "in Centrum": {
        "said": "We can meet in Centrum after work.",
        "right": ["We can meet in the centre after work."],
        "d": "We can meet in a centre after work.",
    },
    "the Karlin": {
        "said": "I live in the Karlín, near the river.",
        "right": ["I live in Karlín, near the river.", "I live in Karlin, near the river."],
        "d": "I live in a Karlín, near the river.",
    },
    "end of the April": {
        "said": "The contract finishes at the end of the April.",
        "right": ["The contract finishes at the end of April."],
        "d": "The contract finishes at the end of an April.",
    },
    # James, 2026-08-24: the first carrier ("I don't understand how he thinking
    # about this") introduced a SECOND fault beside the target one — `how` is
    # overused there, and the natural repair ("how he thinks") removes the
    # continuous altogether, gutting the unit's own teaching point. An
    # error-correction item must have exactly one thing wrong. `right now` makes
    # the continuous unambiguously correct and keeps his error verbatim.
    # His `how`-overuse observation is a real pattern, parked for its own items.
    "how he thinking": {
        "said": "He thinking about the offer right now.",
        "right": ["He is thinking about the offer right now."],
        "d": "He think about the offer right now.",
    },
    # James's flag: he kept `are`, so he meant something ongoing — continuous first.
    "we are communicate with": {
        "said": "We are communicate with the client every week.",
        "right": ["We are communicating with the client every week.",
                  "We communicate with the client every week."],
        "d": "We are communicated with the client every week.",
        "rule": "He kept are, so he meant something ongoing: are + -ing. "
                "Drop are for the present simple: we communicate with.",
    },
    "in Wednesday": {
        "said": "We have a call in Wednesday.",
        "right": ["We have a call on Wednesday."],
        "d": "We have a call at Wednesday.",
    },
    # James, 2026-08-24 (Type smoke): right[0] spelled out "three", so the diff had
    # TWO separate changes (3->three, in->a) with the correct word "times" between
    # them — the cloze merged them and asked him to retype a word that was never
    # wrong. His "3" was not an error; keeping it leaves in->a as the single change.
    "3 times in week": {
        "said": "I go to the gym 3 times in week.",
        "right": ["I go to the gym 3 times a week.",
                  "I go to the gym three times a week."],
        "d": "I go to the gym 3 times in a week.",
    },
    "he say me that…": {
        "said": "He say me that the price was too high.",
        "right": ["He told me that the price was too high."],
        "d": "He said me that the price was too high.",
    },
    "ask him when is he…": {
        "said": "I will ask him when is he arriving.",
        "right": ["I will ask him when he is arriving."],
        "d": "I will ask him when does he arrive.",
    },
    "I have lot of people": {
        "said": "I have lot of people in my team.",
        "right": ["I have a lot of people in my team."],
        "d": "I have lot of peoples in my team.",
    },
    "a lot of different to Prague": {
        "said": "Brno is a lot of different to Prague.",
        "right": ["Brno is a lot different to Prague."],
        "d": "Brno is a lot of differently to Prague.",
    },
    # James's flag: more would be extra emphasis — plain `better` is the answer.
    "it's more better": {
        "said": "It's more better than the old one.",
        "right": ["It's better than the old one.", "It's much better than the old one."],
        "d": "It's more good than the old one.",
        "rule": "better is already the comparative. Plain: it's better. "
                "much better only if you want extra emphasis.",
    },
    # James's flag: `stressing` is fine in speech, so it can't be the wrong option.
    "if you're stressful about it": {
        "said": "If you're stressful about it, take a break.",
        "right": ["If you're stressed about it, take a break."],
        "d": "If you're stress about it, take a break.",
        "rule": "stressful = causes stress (a stressful day). stressed = how you feel. "
                "(you're stressing about it is also fine in speech, but stressed is the "
                "one to learn here.)",
    },
    "I am doing this for me": {
        "said": "I am doing this for me, not for the money.",
        "right": ["I am doing this for myself, not for the money."],
        "d": "I am doing this for my, not for the money.",
    },
    "this is the different": {
        "said": "This is the different between the two plans.",
        "right": ["This is the difference between the two plans."],
        "d": "This is the differ between the two plans.",
    },
    "it's a good dokument": {
        "said": "It's a good dokument about the war.",
        "right": ["It's a good documentary about the war."],
        "d": "It's a good document about the war.",
    },
}

# --- Further smoke corrections, keyed on the ORIGINAL `said`. One entry per flag.
# right[0] is what the page shows as THE answer and puts in the options, so
# reordering `right` is how you change which one is taught.
CORRECT = {
    # James, 2026-08-24: "If the investor says yes, we start in September" has
    # present in BOTH halves — the shape card 4 of a2_first_conditional teaches as
    # the ZERO conditional. It is really a scheduled-future present simple, a legal
    # first-conditional variant, but nothing on screen lets a student tell those
    # apart. `will` in the main clause of all three options keeps the if-clause as
    # the only thing that differs. (This one came from the 22 Aug authoring, not
    # from today's carriers.)
    "If the investor will say yes, we start in September.": {
        "said": "If the investor will say yes, we will start in September.",
        "right": ["If the investor says yes, we will start in September."],
        "d": "If the investor would say yes, we will start in September.",
    },
}

# Type mode grades free text against the whole `right` list, so a correct answer
# that is not in the list is marked wrong. norm() already forgives case, accents,
# curly apostrophes, trailing punctuation and spacing — but NOT contractions.
# Found 2026-08-24: 7 items would reject the expanded form ("It is better…" for
# "It's better…"). Both directions are added automatically so the list cannot
# drift out of sync with the sentences again.
CONTRACTIONS = {
    "it's": "it is", "i'm": "i am", "you're": "you are", "we're": "we are",
    "they're": "they are", "he's": "he is", "she's": "she is", "that's": "that is",
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "won't": "will not", "isn't": "is not", "aren't": "are not",
    "can't": "cannot", "couldn't": "could not", "wouldn't": "would not",
    "let's": "let us", "i'll": "i will", "we'll": "we will", "you'll": "you will",
}


def expand_contractions(right):
    """Add the expanded twin of any contraction (and vice versa) to `right`."""
    out = list(right)
    seen = {r.lower() for r in out}
    for sent in list(right):
        for short, long in CONTRACTIONS.items():
            for a, b in ((short, long), (long, short)):
                pat = re.compile(r"\b%s\b" % re.escape(a), re.I)
                if pat.search(sent):
                    twin = pat.sub(b, sent)
                    # keep the original capitalisation of the first letter
                    if sent[:1].isupper():
                        twin = twin[:1].upper() + twin[1:]
                    if twin.lower() not in seen:
                        out.append(twin)
                        seen.add(twin.lower())
    return out


def _key(w):
    return w.lower().strip(".,?!;:")


def make_cloze(said, rights):
    """Frame the correction as one blank, derived by diffing said against right[0].

    James's PISANIE HARD CAP (locked in RUPL): typed-whole answers <=3 words;
    4+ words = cloze, blank on the teaching point. The carrier sentences added on
    2026-08-24 pushed every Type answer to ~8 words, so the blank is derived here
    rather than hand-authored.

    Deletion errors ("if I WILL say" -> "if I say") diff to an EMPTY span, which is
    not typeable, so the gap is widened by one word to give something to type --
    typing `say` into `If I ____ it now` enacts the deletion.
    """
    import difflib
    a, b = said.split(), rights[0].split()
    sm = difflib.SequenceMatcher(None, [_key(w) for w in a], [_key(w) for w in b])
    ops = [o for o in sm.get_opcodes() if o[0] != "equal"]
    if not ops:
        return None, None
    lo, hi = min(o[3] for o in ops), max(o[4] for o in ops)
    if lo == hi:                       # pure deletion -> nothing to type
        if hi < len(b):
            hi += 1
        elif lo > 0:
            lo -= 1
        else:
            return None, None
    pre, post = b[:lo], b[hi:]
    # Punctuation belongs to the sentence, not to the answer: "…end of ____." with
    # the answer "April", never a blank that expects "April." typed in.
    tail = ""
    if b[lo:hi]:
        m = re.search(r"[.,?!;:]+$", b[hi - 1])
        if m:
            tail = m.group(0)
            b = b[:hi - 1] + [b[hi - 1][: -len(tail)]] + b[hi:]
    frame = " ".join(pre + ["____" + tail] + post)

    # Accept the equivalent span from every other correct variant that fits the
    # same frame, so alternatives are not silently marked wrong.
    gaps = [" ".join(b[lo:hi])]
    for v in rights[1:]:
        w = v.split()
        if len(w) >= len(pre) + len(post) and \
           [_key(x) for x in w[:len(pre)]] == [_key(x) for x in pre] and \
           (not post or [_key(x) for x in w[len(w) - len(post):]] == [_key(x) for x in post]):
            span = " ".join(w[len(pre):len(w) - len(post)] if post else w[len(pre):])
            if span and span not in gaps:
                gaps.append(span)
    gaps = [re.sub(r"[.,?!;:]+$", "", g) for g in gaps]
    return frame, [g for g in dict.fromkeys(gaps) if g]


def unit_for(item):
    """Topical match. Whether the link SURVIVES is decided by INSPECTED.md."""
    g = item["g"]
    if g == "small":
        return SMALL.get(item["said"])
    if g == "verb" and item["said"] in PREP_ING:
        return "b2_preposition_ing"
    return GROUP[g]


def main():
    html = SRC.read_text(encoding="utf-8")

    m = re.search(r"const ITEMS = (\[.*?\]);\n", html, re.S)
    items = json.loads(m.group(1))

    # A student-facing page may only link into units James has ticked in
    # codex/INSPECTED.md. On 2026-08-24 four of these items linked into
    # b2_preposition_ing, which the August cloud routine wrote and nobody had ever
    # read. Enforcing it here means it cannot happen again by oversight.
    ok_units = inspected_units()
    suppressed = {}

    linked, blank, fixed, carried, sheet_said = 0, [], [], [], []
    expanded = clozed = 0
    nocloze = []
    for it in items:
        orig = it["said"]
        if it.get("src") == "sheet":
            sheet_said.append(orig)
        it["u"] = unit_for(it)          # unit_for keys on the original fragment
        if it["u"] and it["u"] not in ok_units:
            suppressed[it["u"]] = suppressed.get(it["u"], 0) + 1
            it["u"] = None
        if it["u"]:
            linked += 1
        else:
            blank.append(orig)
        if orig in CARRIER:
            it.update(CARRIER[orig])
            carried.append(orig)
        if orig in CORRECT:
            it.update(CORRECT[orig])
            fixed.append(orig)
        before = len(it["right"])
        it["right"] = expand_contractions(it["right"])
        expanded += len(it["right"]) - before
        frame, gaps = make_cloze(it["said"], it["right"])
        if frame:
            it["frame"], it["gaps"] = frame, expand_contractions(gaps)
            clozed += 1
        else:
            nocloze.append(it["said"])
    html = html.replace(m.group(1), json.dumps(items, ensure_ascii=False), 1)

    helper = (
        "const BASE=%s;\nconst UNITS=%s;\n"
        "const unitLink = u => (u&&UNITS[u]) ? ' <a class=\"unit\" target=\"_blank\" "
        "rel=\"noopener\" href=\"'+BASE+'#unit='+u+'\">Practise in the app: '"
        "+UNITS[u][0]+' ('+UNITS[u][1]+') \\u2192</a>' : '';\nconst fold ="
        % (json.dumps(BASE), json.dumps(UNITS, ensure_ascii=False))
    )
    html = html.replace("const fold =", helper, 1)

    def sub1(old, new, tag):
        nonlocal html
        assert old in html, "anchor not found: " + tag
        html = html.replace(old, new, 1)

    # the link, in the feedback line and in the end-of-round wrong-answers table
    # Cloze feedback must answer the question that was asked. It said "type the
    # missing part" and then replied with the whole sentence, never naming what
    # belonged in the blank (James, 2026-08-24). Now: the gap in bold, the full
    # sentence after it for context.
    sub1("(ok?'Yes: ':'Not quite. English: ')+'<strong>'+esc(it.right.join(' / '))+'</strong>'",
         "(ok?'Yes: ':'Not quite. ')+((kind==='type'&&it.gaps) ? "
         "'<strong>'+esc(it.gaps.join(' / '))+'</strong> \\u2014 <span class=\"full\">'"
         "+esc(it.right[0])+'</span>' : "
         "(kind==='type'?'English: ':'')+'<strong>'+esc(it.right.join(' / '))+'</strong>')",
         "cloze feedback")

    sub1("esc(it.rule)+'</span>'", "esc(it.rule)+unitLink(it.u)+'</span>'", "rule span")

    # The pattern cards are where a student goes to LEARN the rule; the feedback
    # link only appears once they have already got something wrong. Link the cards
    # too (James, 2026-08-24). `small` is deliberately mixed and stays unlinked.
    CARD_UNIT = {
        "will after if and when": "a2_first_conditional",
        "What comes after the verb": "b1_verb_patterns_advanced",
        "Articles with places and months": "b1_articles_advanced",
        "be and the verb": "a2_present_continuous",
    }
    for heading, uid in CARD_UNIT.items():
        if uid not in ok_units:
            continue
        title, level = UNITS[uid]
        old = "<h3>%s</h3>" % heading
        assert old in html, "pattern card not found: " + heading
        html = html.replace(
            old,
            '<h3>%s <a class="unit" target="_blank" rel="noopener" href="%s#unit=%s">'
            'Practise in the app: %s (%s) →</a></h3>' % (heading, BASE, uid, title, level),
            1,
        )
    sub1("esc(w.rule)+'</td></tr>'", "esc(w.rule)+unitLink(w.u)+'</td></tr>'", "wrong table")

    # every option is English; only one is correct
    sub1('<p class="help">Which is the English?</p>',
         '<p class="help">Which is correct?</p>', "label")

    # 1-3 keys were coded but dead: the listener sat on the tab div, which has no
    # tabindex, so in Choose mode nothing held focus. Document-level, guarded on
    # the tab being visible.
    sub1("el.addEventListener('keydown',e=>{",
         "document.addEventListener('keydown',e=>{ if(el.classList.contains('hide')) return;",
         "keydown")

    # Chrome, James 2026-08-24: plain title, no subtitle, no footer line.
    sub1("<title>Patrik — your English, fixed</title>",
         "<title>Patrik: Error Patterns</title>", "doc title")
    sub1("<h1>Patrik — your English, fixed</h1>\n"
         '<p class="sub">42 sentences · 22 are things you said in our lessons · '
         "20 are the same two patterns in new sentences</p>",
         "<h1>Patrik: Error Patterns</h1>", "header")
    sub1('<p class="foot">From your error sheet of 16 August 2026. The app units for '
         'each pattern are linked on that sheet.</p>\n', "", "foot")
    # the blue rule lived on .sub, which is gone — move it onto the h1
    sub1("h1{font-size:22px;margin:0 0 2px}",
         "h1{font-size:22px;margin:0 0 14px;padding-bottom:10px;"
         "border-bottom:2px solid var(--blue)}", "h1 rule")

    # Type mode becomes a cloze: show the frame with one blank, type only the
    # missing part. Grades against `gaps` (all correct spans) not the whole sentence.
    sub1('<div class="row"><input class="in" autocomplete="off" spellcheck="false" '
         'placeholder="Type the corrected sentence">',
         '<div class="frame"></div>\n <div class="row"><input class="in" autocomplete="off" '
         'spellcheck="false" placeholder="Type the missing part">', "type input")

    sub1("else { $('.in').value=''; $('.in').disabled=false; $('.in').focus(); } }",
         "else { const f=$('.frame'); if(f) f.innerHTML = it.frame ? "
         "esc(it.frame).replace('____', '<b class=blank>____</b>') : ''; "
         "$('.in').value=''; $('.in').disabled=false; $('.in').focus(); } }", "type frame")

    # Choose mode showed "YOU SAID <wrong sentence>" as the prompt AND offered the
    # same wrong sentence as option 1 — the question gave itself away and read as
    # nonsense (James, 2026-08-24). Choose now shows only the options. Type keeps
    # the prompt: there the cloze frame needs the original for context, and the
    # wrong sentence is not among any options.
    sub1("if(kind==='quiz'){ const o=$('.opts');",
         "if(kind==='quiz'){ $('.said').classList.add('hide'); $('.q').classList.add('hide'); "
         "const o=$('.opts');", "hide prompt in quiz")

    # A retry round. Getting 1 of 42 wrong used to restart all 42, which is the
    # wrong incentive class (James, 2026-08-24: "demoralising, incompetent
    # pedagogy") and contradicts the RUPL poprawka rule — retry the mistakes, and
    # clearing them counts as a pass. start() now takes an optional subset.
    sub1("function start(){ st.order=shuffle(ITEMS.map((_,i)=>i)"
         ".filter(i=>filter==='all'||ITEMS[i].g===filter));",
         "function start(only){ st.order=shuffle((only&&only.length) ? only.slice() "
         ": ITEMS.map((_,i)=>i).filter(i=>filter==='all'||ITEMS[i].g===filter));",
         "start subset")

    sub1("h+='<p><button class=\"again\">Again</button></p>'; d.innerHTML=h; "
         "d.querySelector('.again').onclick=start; }",
         "const wrong=st.wrong.map(w=>ITEMS.indexOf(w)).filter(i=>i>=0);\n"
         "    h+= wrong.length ? '<p><button class=\"retry\">Try the '+wrong.length+"
         "' you got wrong</button> <button class=\"again\">Start again</button></p>' "
         ": '<p><button class=\"again\">Again</button></p>';\n"
         "    d.innerHTML=h;\n"
         "    const rb=d.querySelector('.retry'); if(rb) rb.onclick=()=>start(wrong);\n"
         "    d.querySelector('.again').onclick=()=>start(); }", "retry round")

    sub1("const ok=it.right.some(r=>norm(r)===norm(v));",
         "const ok=(kind==='type'&&it.gaps) ? it.gaps.some(g=>norm(g)===norm(v)) "
         ": it.right.some(r=>norm(r)===norm(v));", "type grading")

    sub1("['.q','.said','.opts','.fb','.next','.row'].forEach(s=>$(s)?.classList.remove('hide'));",
         "['.q','.said','.opts','.fb','.next','.row','.frame'].forEach(s=>$(s)?.classList.remove('hide'));",
         "show frame on start")
    sub1("function finish(){ ['.q','.said','.opts','.fb','.next','.row'].forEach(s=>$(s)?.classList.add('hide'));",
         "function finish(){ ['.q','.said','.opts','.fb','.next','.row','.frame'].forEach(s=>$(s)?.classList.add('hide'));",
         "hide frame on finish")
    sub1("Enter = check, then Enter = next · Capital letters and full stops don't matter",
         "Enter = check, then Enter = next · Type only the missing part · Capitals and full stops don't matter",
         "type help")

    sub1(".foot{",
         "a.unit{display:inline-block;margin-top:6px;color:var(--blue);font-size:13px;"
         "text-decoration:none;border-bottom:1px solid #b8cbe0}\n"
         "a.unit:hover{border-bottom-color:var(--blue)}\n"
         "td a.unit{display:block;margin-top:2px}\n"
         ".frame{font-size:19px;margin:10px 0 2px}\n"
         ".frame b.blank{color:var(--blue);letter-spacing:1px}\n"
         ".fb .full{opacity:.7}\n.foot{", "css")

    OUT.write_text(html, encoding="utf-8")
    print("written %s" % OUT)
    print("items %d | linked %d | unlinked %d | carriers %d/%d sheet | corrections %d"
          % (len(items), linked, len(blank), len(carried), len(sheet_said), len(fixed)))
    print("contraction accepts +%d | cloze frames %d/%d" % (expanded, clozed, len(items)))
    if nocloze:
        print("\nno cloze derivable (Type falls back to whole sentence):")
        for s_ in nocloze:
            print("  -", s_)
    wide = []
    for it in items:
        g = it.get("gaps", [""])[0].split()
        if len(g) > 1:
            a = {_key(w) for w in it["said"].split()}
            keep = [w for w in g if _key(w) in a]
            if keep and len(keep) < len(g):
                wide.append((it["frame"], it["gaps"][0], keep))
    if wide:
        print("\nblanks containing a word that was never wrong (fix the authoring):")
        for f, g, keep in wide:
            print('  %s -> "%s"  (unchanged inside: %s)' % (f, g, ", ".join(keep)))

    missing = [s for s in sheet_said if s not in CARRIER]
    if missing:
        print("\nsheet items still without a carrier:")
        for s in missing:
            print("  -", s)
    if blank:
        print("\nunlinked on purpose (no live unit):")
        for b in blank:
            print("  -", b)


if __name__ == "__main__":
    main()
