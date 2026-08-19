/**
 * error-type.js — what KIND of mistake was that? (James, 2026-08-19)
 *
 * "these ideas would be good to add for the FCE level and CAE level exercises
 * too: highlight the type of error."
 *
 * The drill used to compare typed against gap_answer, get a boolean, and print
 * "→ hopefully". But the triple (typed, root, answer) says far more than
 * pass/fail, and each kind of miss points at a different fix:
 *
 *   hope        HOPE      hopefully    no change made
 *   hopeful     HOPE      hopefully    wrong class — adjective for an adverb
 *   possible    POSSIBLE  impossible   missed the negative
 *   unpossible  POSSIBLE  impossible   wrong negative prefix
 *   happyness   HAPPY     happiness    spelling
 *
 * Five categories, decided in the 2026-08-19 dropdown round, plus a SILENT
 * fallback: a miss we cannot classify shows the bare answer exactly as before.
 * A wrong label is worse than no label, so every rule here requires the two
 * words to be anchored to the same root before it will fire.
 *
 * Computed, never authored — that was the point of choosing rules over tags:
 * all 288 word-formation items across B1/B2/C1 are covered without touching
 * the data, including typos nobody predicted.
 *
 * Two entry points, same rules:
 *   diagnose(typed, root, answer) — what went wrong on this attempt
 *   invites(root, answer)         — what this ITEM tends to catch people on,
 *                                   which is how the gate's targeted follow-up
 *                                   round filters the pool
 */

/* Assimilated forms before bare in-: impossible, irregular, illegal. */
const NEG = ["un", "im", "ir", "il", "in", "dis", "non", "mis"];

/* Longest first — "ation" must win before "tion", "ically" before "ly".
 * Ambiguous endings carry BOTH classes (arrival/national -al, student/urgent
 * -ent, teacher/bigger -er) so wrong_class only fires when the two class sets
 * are genuinely disjoint. Under-calling beats mislabelling. */
const SUFFIXES = [
  ["ability", ["n"]], ["ibility", ["n"]],
  ["ically", ["adv"]],
  ["ation", ["n"]], ["ition", ["n"]], ["ution", ["n"]], ["ession", ["n"]],
  ["ision", ["n"]], ["ction", ["n"]], ["ssion", ["n"]],
  ["ment", ["n"]], ["ness", ["n"]], ["ship", ["n"]], ["hood", ["n"]],
  ["ancy", ["n"]], ["ency", ["n"]], ["ance", ["n"]], ["ence", ["n"]],
  ["tion", ["n"]], ["sion", ["n"]], ["ity", ["n"]], ["ism", ["n"]],
  ["ist", ["n"]], ["ian", ["n"]], ["dom", ["n"]], ["age", ["n"]],
  ["ure", ["n"]], ["th", ["n"]],
  ["ison", ["n"]],
  ["ative", ["adj"]], ["itive", ["adj"]],
  ["ious", ["adj"]], ["eous", ["adj"]], ["ical", ["adj"]],
  ["able", ["adj"]], ["ible", ["adj"]], ["less", ["adj"]], ["ful", ["adj"]],
  ["ous", ["adj"]], ["ish", ["adj"]], ["ary", ["adj"]], ["ory", ["adj"]],
  ["ive", ["adj", "n"]], ["ic", ["adj"]],
  ["ent", ["adj", "n"]], ["ant", ["adj", "n"]], ["al", ["adj", "n"]],
  ["ise", ["v"]], ["ize", ["v"]], ["ify", ["v"]], ["ate", ["v", "adj"]],
  ["en", ["v", "adj"]],
  ["er", ["n", "adj"]], ["or", ["n"]], ["ee", ["n"]],
  ["ly", ["adv"]],
  ["y", ["adj", "n"]],
];

const CLASS_WORD = { n: "noun", adj: "adjective", adv: "adverb", v: "verb" };

export const ERROR_LABELS = {
  no_change: "no change made",
  negative: "missed the negative",
  neg_prefix: "wrong negative prefix",
  wrong_class: "wrong class",
  spelling: "spelling",
};

/** Follow-up round offers, keyed by what an item invites. */
export const INVITE_LABELS = {
  negative: "negative prefixes",
  prefix: "other prefixes",
  spelling: "stem changes",
  wrong_class: "endings and word class",
};

/**
 * Which follow-up pool answers which miss. no_change is deliberately absent:
 * a student who typed the root straight back is helped by any transformation
 * item, so there is no honest filter to offer and the gate stays quiet.
 *
 * Nothing maps to "prefix" either, and that is not an oversight — that bucket
 * exists so TURN → return is not misfiled as a stem change. Its items stay in
 * the main pool; they are simply never the target of a focused round.
 */
export const FOLLOW_UP = {
  negative: "negative",
  neg_prefix: "negative",
  spelling: "spelling",
  wrong_class: "wrong_class",
};

/* Non-negative derivational prefixes. Needed only so that TURN → return is
 * not filed as a stem change — re- alters meaning, not spelling. */
const PREFIXES = ["re", "pre", "over", "under", "out", "inter", "sub", "co"];

function letters(s) {
  return String(s == null ? "" : s).toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Strip a negative prefix. The stem only has to be 2 letters — DO → undo and
 * FAIR → unfair are both real B1 items, and a longer floor silently dropped
 * the short ones into the spelling bucket. Every caller re-checks the stem
 * against the root, which is what keeps "index" from reading as in+dex.
 */
function splitNeg(w) {
  for (const p of NEG) {
    if (w.length > p.length + 1 && w.startsWith(p)) {
      return { neg: p, stem: w.slice(p.length) };
    }
  }
  return { neg: "", stem: w };
}

function splitPrefix(w) {
  for (const p of PREFIXES) {
    if (w.length > p.length + 1 && w.startsWith(p)) {
      return { pre: p, stem: w.slice(p.length) };
    }
  }
  return { pre: "", stem: w };
}

function splitSuffix(w) {
  for (const [suf, cls] of SUFFIXES) {
    if (w.length > suf.length + 2 && w.endsWith(suf)) {
      return { base: w.slice(0, w.length - suf.length), suf, cls };
    }
  }
  return { base: w, suf: "", cls: null };
}

function classOf(w) {
  return splitSuffix(splitNeg(w).stem).cls;
}

function disjoint(a, b) {
  if (!a || !b) return false;
  return !a.some((x) => b.includes(x));
}

function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

function sharedPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Same underlying word, allowing for stem changes (happy/happi, decide/decis). */
function sameBase(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return sharedPrefix(a, b) >= 3 && editDistance(a, b) <= 2;
}

/**
 * Both words must be recognisable derivatives of the root before any rule
 * fires — this is the guard that stops "understand" being read as un+derstand.
 */
function rootAnchored(w, r) {
  if (!w || !r) return false;
  return sharedPrefix(w, r) >= Math.min(4, Math.max(3, r.length - 2));
}

/**
 * Looser than rootAnchored, for classifying ITEMS rather than judging a
 * student. PAY → unpaid leaves the stem "paid", which shares only two letters
 * with the root but is plainly the same word; the data is trusted here in a
 * way a typed answer never is.
 */
function nearRoot(stem, r) {
  if (!stem || !r) return false;
  if (stem === r) return true;
  return sharedPrefix(stem, r) >= Math.min(3, r.length - 1) &&
    editDistance(stem, r) <= 2;
}

/**
 * @param {string} typed  what the student wrote
 * @param {string} root   the capitalised word given (HOPE)
 * @param {string} answer the correct derived word
 * @returns {{type: string, label: string} | null} null = unclassified, stay quiet
 */
export function diagnose(typed, root, answer) {
  const t = letters(typed);
  const r = letters(root);
  const a = letters(answer);
  if (!t || !a || t === a) return null;

  const tn = splitNeg(t);
  const an = splitNeg(a);

  /* The negative family runs FIRST, ahead of no_change. SAFE → unsafe answered
   * "safe" is literally an unchanged root, but calling that "no change made"
   * buries the actual fault: they read the sentence as positive. The negative
   * is what they missed, so that is what the tag has to say. */
  /* Two different negatives on the same stem — before the missed-negative
   * rule, because splitNeg is a string test and cannot tell un+derstand from
   * understand. Requiring the STEMS to match is what separates them: for
   * UNDERSTAND → misunderstand the false "un-" leaves "derstand", which
   * matches nothing, so this rule declines and the next one gets it right. */
  if (an.neg && tn.neg && an.neg !== tn.neg && sameBase(tn.stem, an.stem)) {
    return { type: "neg_prefix", label: ERROR_LABELS.neg_prefix };
  }
  if (an.neg && sameBase(t, an.stem)) {
    return { type: "negative", label: ERROR_LABELS.negative };
  }
  if (tn.neg && !an.neg && sameBase(tn.stem, a)) {
    return { type: "negative", label: "negative not needed" };
  }

  /* -ful / -less is the same fault wearing a suffix: hopeful for hopeless,
   * careless for careful. Both are real adjectives off the same root, so no
   * other rule would call it, yet it is a straight misreading of the sentence
   * and belongs in the negative family, not with spelling. */
  const fulLess = (w) =>
    w.endsWith("less") ? "less" : w.endsWith("ful") ? "ful" : "";
  const tf = fulLess(t);
  const af = fulLess(a);
  if (tf && af && tf !== af) {
    const base = (w, s) => w.slice(0, w.length - s.length);
    if (sameBase(base(t, tf), base(a, af))) {
      return af === "less"
        ? { type: "negative", label: ERROR_LABELS.negative }
        : { type: "negative", label: "negative not needed" };
    }
  }

  /* Typed the given word straight back — very common at B2, and it means the
   * student did not see that a transformation was wanted at all. */
  if (t === r) return { type: "no_change", label: ERROR_LABELS.no_change };

  /* Class before spelling: hopeful → hopefully is an edit distance of 2 and
   * would otherwise be miscalled a typo, when it is the opposite — they spelt
   * a real word correctly and picked the wrong one. */
  const tc = classOf(t);
  const ac = classOf(a);
  if (tc && ac && disjoint(tc, ac) && rootAnchored(t, r) && rootAnchored(a, r)) {
    const want = CLASS_WORD[ac[0]];
    return {
      type: "wrong_class",
      label: want ? `wrong class — ${want} needed` : ERROR_LABELS.wrong_class,
    };
  }

  if (editDistance(t, a) <= 2 && sharedPrefix(t, a) >= 3) {
    return { type: "spelling", label: ERROR_LABELS.spelling };
  }

  /* Right root, wrong ending, classes not separable (national/nationality).
   * Reported as a class miss because the fix is the same: check what the
   * sentence needs. */
  const ts = splitSuffix(tn.stem);
  const as = splitSuffix(an.stem);
  if (ts.suf && as.suf && ts.suf !== as.suf && sameBase(ts.base, as.base)) {
    return { type: "wrong_class", label: "wrong ending" };
  }

  return null;
}

/**
 * What kind of miss does this ITEM invite? Same rules, one fewer argument —
 * this is what the gate's targeted follow-up round filters on.
 * @returns {string | null}
 */
export function invites(root, answer) {
  const r = letters(root);
  const a = letters(answer);
  if (!r || !a) return null;

  /* Root intact at the front — INFORM → information, WEAK → weakness. Nothing
   * was added in front, so whatever happened happened at the end. Tested
   * first because it is also what stops information reading as in+formation. */
  if (a.startsWith(r)) {
    /* Plurals are answers too — TOUR → tourists, MUSIC → musicians. Drop a
     * trailing -s before looking the ending up, or the item falls out of every
     * follow-up pool for no reason. */
    const cls = splitSuffix(a).cls ||
      (a.endsWith("s") ? splitSuffix(a.slice(0, -1)).cls : null);
    return cls ? "wrong_class" : null;
  }

  const an = splitNeg(a);
  if (an.neg && nearRoot(an.stem, r)) return "negative";

  const ap = splitPrefix(a);
  if (ap.pre && nearRoot(ap.stem, r)) return "prefix";

  /* The root does not survive into the answer at all (happy → happiness,
   * decide → decision, maintain → maintenance) — that is where spelling
   * misses come from. */
  return "spelling";
}
