/**
 * Practice ladder (RUE3-shaped vocab engine for rue-exp):
 * Match → Quiz → Type word → Use (sentence)
 * Direction is fixed CZ → EN: items carry en (English target, typed and
 * graded) + cz (Czech support, shown as prompt).
 * Default pass size: DEFAULT_PASS (12); shorter banks use all items.
 * Each stage stops with score (e.g. 11/12) + retry wrongs before next.
 * Sentence mode:
 *   - trunk frames (practice: "frames") → model production from items
 *   - leaf packs with pack.sentences[] → Quiz/Type gaps
 *   - Use: CZ→EN (default) · use_sentences[] frames · use_mode "rewrite"
 *     (paraphrase: underlined prompt + letter clue, type the sentence)
 *   - no bank → "Coming soon" placeholder (no free-write)
 */

import { canonSynonyms } from "./synonyms.js";
import { expandContractions } from "./contractions.js";
import { introDiagram } from "./intro-visuals.js";
import { attachExplain } from "./explain.js?v=2026-08-28-dep-quiz";
import { setSmokeContext } from "./smoke-flags.js?v=2026-09-03-flagon";
import { vocabCoverNeed, vocabCoveredEnough } from "./progress.js?v=2026-09-02-matchall";

/**
 * Default questions per stage (Match board · Quiz · Type · Use).
 * Author ≥12 when possible; shorter banks use all items.
 */
export const DEFAULT_PASS = 12;
/** Weight multiplier for items matching pack focus_structures (recycle still appears). */
export const FOCUS_WEIGHT = 3;

/**
 * Deck rotation: passes prefer items not yet shown in this pack+mode, so
 * successive visits walk the whole deck (deck 12/36 → 24/36 → 36/36 → new
 * cycle) instead of resampling the same random dozen.
 */
const SEEN_KEY = "rue-exp-v0.1-deck-seen";

function loadSeenStore() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveSeenStore(store) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(store));
  } catch {
    /* private mode etc. — rotation degrades to random sampling */
  }
}

function itemDeckKey(it) {
  return `${it.en || it.gap_answer || ""}‖${it.cz || ""}`;
}

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Indices for a pass: up to DEFAULT_PASS, or onlyIndices for retry.
 * Optional weighted sample: focus_structures on items get FOCUS_WEIGHT slots in the bag
 * so new patterns appear more often while recycle still draws from the rest of the pool.
 * @param {number} listLen
 * @param {number[] | null} onlyIndices
 * @param {{ items?: object[], focusStructures?: string[] }} [opts]
 */
function passOrder(listLen, onlyIndices, opts) {
  if (onlyIndices && onlyIndices.length) {
    return shuffle(onlyIndices.slice());
  }
  if (listLen <= 0) return [];
  if (listLen <= DEFAULT_PASS) {
    const idxs = [];
    for (let i = 0; i < listLen; i++) idxs.push(i);
    return shuffle(idxs);
  }
  const items = opts && opts.items;
  const focus = new Set((opts && opts.focusStructures) || []);
  const targets = (opts && opts.targets) || null;
  const seen = (opts && opts.seen) || null;
  const bag = [];
  for (let i = 0; i < listLen; i++) {
    let w = 1;
    if (focus.size && items && items[i]) {
      const st = items[i].structures || [];
      if (st.some((s) => focus.has(s))) w = FOCUS_WEIGHT;
    }
    if (w === 1 && targets && targets.size && items && items[i]) {
      if (targets.has(items[i].en)) w = FOCUS_WEIGHT;
    }
    for (let k = 0; k < w; k++) bag.push(i);
  }
  // shuffle() copies and returns; the result was being discarded, so within
  // each tier the deck was walked in authoring order (same bug as
  // practice-grammar samplePass — James, 2026-08-12).
  const bagOrder = shuffle(bag);
  // Three tiers: unseen sentence-targets are GUARANTEED first (Use must
  // never demand a word the word modes haven't shown — deterministic, not
  // weighted odds), then other unseen (rotation), then seen top-up.
  const tTargets = [];
  const tUnseen = [];
  const tSeen = [];
  const used = new Set();
  for (const i of bagOrder) {
    if (used.has(i)) continue;
    used.add(i);
    const it = items && items[i];
    const wasSeen = seen && it && seen.has(itemDeckKey(it));
    const isTarget = targets && targets.size && it && targets.has(it.en);
    if (wasSeen) tSeen.push(i);
    else if (isTarget) tTargets.push(i);
    else tUnseen.push(i);
  }
  const order = [...tTargets, ...tUnseen, ...tSeen].slice(0, DEFAULT_PASS);
  return shuffle(order);
}

/** Expand common contractions so I'm / I am grade the same. */

/** Soft production normalizer (case + punctuation + contraction twins). */
function norm(s) {
  return expandContractions(s)
    .replace(/[''`´]/g, "")
    .replace(/\bo\s*clock\b/gi, "oclock")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sentence-Quiz chip key: punctuation off, case KEPT.
 *  norm() lowercases (via expandContractions), so Italian / italian would
 *  collapse and the capital-letter contrast could not be a chip. */
function sentenceChipKey(s) {
  return String(s == null ? "" : s)
    .replace(/[''`´]/g, "")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CAP_SKIP = new Set([
  "I", "He", "She", "They", "We", "My", "The", "A", "An",
  "I'm", "I'll", "I've", "I'd",
]);

/** Proper names the model capitalises — country, nationality, city, language. */
function contentCapitals(s) {
  return (String(s).match(/[A-ZÀ-Ý][A-Za-zÀ-ÿ']*/g) || []).filter(
    (w) => w.length > 1 && !CAP_SKIP.has(w),
  );
}

function capModelList(model) {
  if (model == null) return [];
  return Array.isArray(model) ? model.filter(Boolean) : [model];
}

/** Proper names in the matched form must keep their capitals.
 *  Check the accept that matches what they typed (Czechia vs the Czech Republic),
 *  not only the preferred model. */
function capitalsOk(typed, model) {
  const models = capModelList(model);
  if (!models.length) return true;
  const userN = norm(typed);
  const matching = models.filter((m) => norm(m) === userN);
  const check = matching.length ? matching : models;
  const got = String(typed == null ? "" : typed).match(/[A-Za-zÀ-ÿ']+/g) || [];
  return check.some((m) => {
    const want = contentCapitals(m);
    if (!want.length) return true;
    return want.every((w) => got.includes(w));
  });
}

const ARTICLES = new Set(["a", "an", "the"]);
const STARTS_VOWEL = /^[aeiou]/;

/* Czech marks possession by case, not by a separate word, so "v tašce" is
 * equally "in the bag" and "in her bag" — the prompt cannot tell the student
 * which the author picked. Article folding already handled a/an/the; this
 * extends the same ruling to possessive determiners, which sit in the same
 * slot and are just as unrecoverable from the Czech. (James, 2026-08-20,
 * mid-smoke: "Anna má telefon v tašce" marked "in the bag" wrong against
 * "in her bag" — "I have to eliminate this".)
 *
 * Folded by REDUCTION, not expansion: eleven determiners over four slots
 * would be 14k variants, so both sides collapse to one placeholder instead.
 * The token count is unchanged, so a DROPPED determiner still fails — "she
 * has bag" stays wrong, which is the Czech-L1 error the app exists to teach.
 *
 * A determiner in FINAL position is never folded: "her" there is an object
 * pronoun ("I like her"), and folding it would accept "I like the".
 *
 * Packs that teach articles or possession set strict_articles and keep exact
 * grading. */
const DETERMINERS = new Set([
  "a", "an", "the",
  "my", "your", "his", "her", "our", "their", "its",
  // Czech "ten / ta / to" is both the definite article and the demonstrative:
  // "Ten doktor tady pracuje" is equally "The doctor works here" and "This
  // doctor works here". Nothing in the prompt picks between them.
  // (James, 2026-08-20: "we have to be generous about these things".)
  "this", "that", "these", "those",
]);

function detFold(normed) {
  const toks = normed.split(" ");
  if (toks.length < 2) return normed;
  let touched = false;
  const out = toks.map((t, i) => {
    if (i === toks.length - 1) return t;
    if (!DETERMINERS.has(t)) return t;
    touched = true;
    return "§d";
  });
  return touched ? out.join(" ") : normed;
}

/* True when user and expected differ only in which determiners were chosen. */
function determinerMatch(userN, forms) {
  const u = detFold(userN);
  if (u === userN) return false;
  for (const f of forms) {
    if (f.includes(" ") && detFold(f) === u) return true;
  }
  return false;
}

/**
 * Czech has no articles, so a Czech prompt cannot determine a / an / the —
 * "Dávám ti knihu" is equally "a book" and "the book", and both are correct
 * English (James, 2026-08-11: 617 items across 57 A1/A2 vocab units were
 * marking one of the two wrong).
 *
 * So swap articles freely, but NEVER drop one: variants are generated only
 * from forms that already contain an article, so "I give you book" still
 * fails. Omitting the article is a real Czech-L1 error and `a1_articles`
 * exists to teach it.
 *
 * The indefinite is rebuilt from the following word so no variant is bad
 * English ("an dog" is never generated). Vocab only — grammar packs run
 * through practice-grammar.js and keep exact-article grading.
 */
function articleVariants(normed) {
  const toks = normed.split(" ");
  const slots = [];
  toks.forEach((t, i) => {
    if (ARTICLES.has(t)) slots.push(i);
  });
  // No article, or so many that expansion would explode — leave it alone.
  if (!slots.length || slots.length > 4) return [normed];
  let variants = [toks];
  for (const p of slots) {
    const next = [];
    for (const v of variants) {
      const indef = STARTS_VOWEL.test(v[p + 1] || "") ? "an" : "a";
      for (const art of new Set(["the", indef])) {
        const copy = v.slice();
        copy[p] = art;
        next.push(copy);
      }
    }
    variants = next;
  }
  return [...new Set(variants.map((v) => v.join(" ")))];
}

/* Czech "tu" / "tady" / "tam" carry BOTH jobs at once: they mark the
 * existential ("Je tu pes" = there is a dog) and they say where ("here").
 * English splits those, and either rendering is right — "There is a teacher"
 * and "There is a teacher here" are both faithful to "Je tu učitel". The
 * engines accepted whichever one the item happened to be authored with and
 * failed the other, which is a fault in the grading, not in the answer.
 * (James, 2026-08-19, mid-lesson: "je tu meaning here and there … please be
 * flexible on this: it is frustrating".)
 *
 * So: inside an EXISTENTIAL sentence only, a locative "here" is optional and
 * a TRAILING "there" is optional. Outside one nothing changes — "Bread is
 * cheap here" still needs its here, because there the word is the meaning.
 * A pack can set strict_place to opt out where the contrast is the lesson.
 */
const EXISTENTIAL = /\bthere (is|are|was|were)\b|\b(is|are|was|were) there\b/;
/* The same Czech word opens both English sentences: "Je tu pes" is equally
 * "There is a dog" and "Here is a dog". English splits existential from
 * deictic; Czech does not, so the student has no cue to pick between them and
 * a unit that is not teaching that contrast must not fail them for it. Packs
 * that DO teach it set strict_place. (James, 2026-08-20, smoking a1_articles:
 * "be as generous as possible with tu and here and there: it's annoying".) */
const OPENER = /^(there|here) (is|are|was|were)\b/;

function placeVariants(normed) {
  if (!EXISTENTIAL.test(normed) && !OPENER.test(normed)) return [normed];
  const toks = normed.split(" ");
  const out = new Set([normed]);
  const dropHere = (list) => list.filter((t) => t !== "here");
  const noHere = dropHere(toks);
  if (noHere.length && noHere.length !== toks.length) out.add(noHere.join(" "));
  /* A "there" at the very end is locative — the existential one sits in front
   * of the verb, so removing the last token can never eat it. */
  if (toks.length > 2 && toks[toks.length - 1] === "there") {
    const cut = toks.slice(0, -1);
    out.add(cut.join(" "));
    out.add(dropHere(cut).join(" "));
  }
  /* Maximum generosity on the tu/here/there cluster, by James's ruling: every
   * variant built above also gets its opener twin, and any leftover standalone
   * "here"/"there" is optional inside these sentences. Both sides of the
   * comparison are reduced the same way, so it works in either direction. */
  for (const v of [...out]) {
    if (OPENER.test(v)) {
      out.add(v.replace(OPENER, (m, w, be) => (w === "there" ? "here" : "there") + " " + be));
    }
  }
  for (const v of [...out]) {
    const t = v.split(" ");
    const body = t.slice(2).filter((x) => x !== "here" && x !== "there");
    if (OPENER.test(v) && body.length !== t.length - 2) {
      out.add([t[0], t[1], ...body].join(" "));
      out.add(["there", t[1], ...body].join(" "));
      out.add(["here", t[1], ...body].join(" "));
    }
  }
  return [...out].filter(Boolean);
}

/**
 * Split alternatives on / and ; — but NEVER inside parentheses.
 *
 * A slash in a sense hint is punctuation, not a second answer: "play
 * (sport/game)" is one word with a disambiguator, and splitting blind also
 * accepted a bare "game" for hrát (James, 2026-08-17, A1 sweep). Sense
 * indicators are shown but never required, so accepts() still derives the
 * paren-stripped form separately — "play" keeps passing.
 */
function splitAlternatives(s) {
  const out = [];
  let buf = "";
  let depth = 0;
  for (const ch of String(s)) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if ((ch === "/" || ch === ";") && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out;
}

/** Expand one answer string into normalised acceptable forms (slashes, notes). */
function accepts(answer) {
  if (answer == null || answer === "") return [];
  const forms = [answer, String(answer).replace(/\([^)]*\)/g, " ")];
  return [
    ...new Set(
      forms
        /* The WHOLE answer is always acceptable, not only its split parts.
         * splitAlternatives treats ";" as an alternatives separator, which is
         * right for "big; large" and catastrophic for a sentence that simply
         * contains a semicolon: "The data was wrong; thus we cannot use the
         * report" was split into two halves, so the full correct sentence —
         * the one the item itself shows as the answer — graded WRONG. 18 B2
         * and C1 items were ungradeable this way. (James, 2026-08-19.) */
        .flatMap((f) => [f, ...splitAlternatives(f)])
        .map(norm)
        .filter(Boolean),
    ),
  ];
}

/**
 * Preferred model + optional item.accepts / item.gap_accepts.
 * Show answer stays the preferred model; grading allows listed variants.
 * gap_accepts only apply when forGap (Word mode) — bare synonyms must not pass Sentence.
 */
function itemAccepts(item, primary, { forGap = false } = {}) {
  const extras = [];
  if (item && Array.isArray(item.accepts)) extras.push(...item.accepts);
  if (forGap && item && Array.isArray(item.gap_accepts)) {
    extras.push(...item.gap_accepts);
  }
  const out = new Set(accepts(primary));
  for (const a of extras) {
    for (const n of accepts(a)) out.add(n);
  }
  // Auto contraction-style twins already via expandContractions in norm
  for (const form of [...out]) {
    for (const v of articleVariants(form)) out.add(v);
  }
  if (!(item && item._strict_place)) {
    for (const form of [...out]) {
      for (const v of placeVariants(form)) out.add(v);
    }
  }
  return [...out];
}

let STRICT_DETERMINERS = false;
function strictDeterminersActive() {
  return STRICT_DETERMINERS;
}

function isCorrectAnswer(userInput, item, primary, opts = {}) {
  const userN = norm(userInput);
  if (!userN) return false;
  // norm() already folds case, punctuation and contractions, and English
  // sentences must keep their subjects — no softer sentence match than this.
  const forms = itemAccepts(item, primary, opts);
  if (forms.includes(userN)) return true;
  if (!strictDeterminersActive() && determinerMatch(userN, forms)) return true;
  /* Both sides get reduced, so it works in either direction: the student who
   * adds "here" to an item authored without it, and the one who leaves it off
   * an item authored with it. */
  if (!(item && item._strict_place)) {
    for (const uv of placeVariants(userN)) {
      if (forms.includes(uv)) return true;
    }
  }
  // Two names for one thing (shop/store, phone/telephone) compare equal once
  // both sides are canonicalised. Context-dependent pairs are NOT in the map.
  const userC = canonSynonyms(userN);
  if (userC !== userN || forms.some((f) => canonSynonyms(f) !== f)) {
    return forms.some((f) => canonSynonyms(f) === userC);
  }
  return false;
}

/** Fold any diacritics (café → cafe). Near-miss detection ONLY — never used to grade a pass. */
function deacc(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Levenshtein distance, bailing out once past `cap`. */
function editDistance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (row[j] < best) best = row[j];
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length];
}

/**
 * Verdict for an answer that failed isCorrectAnswer().
 *   "accent" — right word, only diacritics off (keyboard problem, not a
 *              knowledge problem) → count it, but show the exact spelling.
 *   "close"  — within a couple of edits (dropped ending, typo) → offer one
 *              retry instead of a hard wrong + reveal.
 *   null     — genuinely a different word. Stays wrong.
 * Never widens the answer key: the model answer shown is unchanged.
 */
function nearMiss(userInput, item, primary, opts = {}) {
  const userN = norm(userInput);
  if (!userN) return null;
  const forms = itemAccepts(item, primary, opts);
  if (!forms.length) return null;

  const userFlat = deacc(userN);
  if (forms.some((f) => deacc(f) === userFlat)) return "accent";

  // Budget scales with length; short words get none (syn vs sen is a real miss).
  for (const f of forms) {
    const cap = f.length >= 7 ? 2 : f.length >= 5 ? 1 : 0;
    if (cap === 0) continue;
    if (editDistance(userFlat, deacc(f), cap) <= cap) return "close";
  }
  return null;
}

export { norm, isCorrectAnswer, itemAccepts, expandContractions, nearMiss, articleVariants, placeVariants, detFold, determinerMatch };

/** Ball-and-box SVG diagrams (from Teaching Material basic-prepositions.html), RUE3 dark tokens. */
function diagramSvg(key) {
  const box = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#2a2218" stroke="#e0a050" stroke-width="3"/>`;
  const obox = (x, y, w, h) =>
    `<path d="M${x} ${y} L${x} ${y + h} L${x + w} ${y + h} L${x + w} ${y}" fill="#221c14" stroke="#e0a050" stroke-width="3" stroke-linejoin="round"/>`;
  const ball = (cx, cy) =>
    `<circle cx="${cx}" cy="${cy}" r="16" fill="#e88a3c" stroke="#c56f27" stroke-width="2"/>`;
  const dash = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e0a050" stroke-width="2" stroke-dasharray="5 5"/>`;
  const svg = (inner) =>
    `<svg viewBox="0 0 220 150" class="scene" aria-hidden="true">${inner}</svg>`;
  const scenes = {
    in: () => svg(obox(70, 70, 80, 45) + ball(110, 96)),
    on: () => svg(box(70, 80, 80, 40) + ball(110, 64)),
    under: () => svg(box(70, 55, 80, 40) + ball(110, 116)),
    above: () => svg(box(70, 94, 80, 32) + ball(110, 44)),
    "next to": () => svg(box(58, 70, 70, 45) + ball(162, 92)),
    between: () => svg(box(22, 70, 46, 45) + box(152, 70, 46, 45) + ball(110, 92)),
    "in front of": () => svg(box(80, 56, 78, 40) + ball(102, 104)),
    behind: () => svg(ball(112, 64) + box(72, 74, 80, 44)),
    opposite: () => svg(box(22, 70, 46, 45) + box(152, 70, 46, 45) + dash(72, 92, 148, 92)),
    near: () => svg(box(40, 70, 54, 45) + ball(170, 92) + dash(98, 92, 150, 92)),
  };
  const fn = scenes[key];
  return fn ? fn() : "";
}

function diagramBlock(item) {
  if (!item || !item.diagram) return "";
  const svg = diagramSvg(item.diagram);
  if (!svg) return "";
  return `<div class="picwrap">${svg}</div>`;
}

/** Czech support side — always the prompt. */
function supportOf(item) {
  return item.cz;
}

/** English target side — always typed / chosen / graded. */
function targetOf(item) {
  return item.en;
}

/** Lemma used in free Sentence mode (English target). */
function keyWord(item) {
  const raw = item.en || item.cz || "";
  return String(raw).replace(/\([^)]*\)/g, "").split("/")[0].trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Intro prose is authored with **bold** / *italic* / ~~struck~~, same as the
 * grammar packs. Escape FIRST, then tag — never the reverse. Bold before
 * italic or `**x**` is eaten as italic wrapping `*x*`. Added 2026-08-12:
 * the vocab intro renderer had no markdown at all. */
function escMd(s) {
  return escapeHtml(s)
    .replace(/~~([^~]+)~~/g, '<s class="wrong-eg">$1</s>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(\S[^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
}


/** Human labels for structure tags shown as a soft pattern hint.
 * RUE packs don't tag structures[] yet — unknown tags fall back to the raw tag. */
const STRUCTURE_LABELS = {};

function structureHint(item) {
  const tags = item && Array.isArray(item.structures) ? item.structures : [];
  if (!tags.length) return "";
  const parts = tags.map((t) => STRUCTURE_LABELS[t] || t);
  return `<div class="sub structure-hint">Pattern: ${escapeHtml(parts.join(" · "))}</div>`;
}

function isFrameItem(item) {
  return Boolean(item && item.gap && item.gap_answer);
}

/** "free (time)" → "free" so a Use lemma can be gapped in the English. */
function lemmaBare(s) {
  return String(s || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Leaf Use sentence → Quiz/Type frame (Czech sentence + English gap). */
function sentenceToFrame(s) {
  if (!s || typeof s !== "object") return null;
  const en = String(s.en || "").trim();
  const cz = String(s.cz || "").trim();
  const lemmas = Array.isArray(s.lemmas) ? s.lemmas : [];
  if (!en || !cz || !lemmas.length) return null;
  let gap = en;
  let answer = "";
  for (const raw of lemmas) {
    const form = lemmaBare(raw);
    if (!form) continue;
    /* \b fails at accented edges (é in café is not \w), so the lemma never
     * matched and the frame silently gapped the wrong word — bound by the
     * letter class instead (James, 2026-08-31). */
    const esc = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^A-Za-zÀ-ž])(${esc})(?![A-Za-zÀ-ž])`, "i");
    if (!re.test(gap)) continue;
    answer = form;
    gap = gap.replace(re, "$1____");
    break;
  }
  if (!answer || !gap.includes("____")) return null;
  return {
    en,
    cz,
    gap,
    gap_answer: answer,
    lemmas,
    accepts: s.accepts,
    /* Authored confusables (the adjective twin on adverb frames — CZ names
     * the meaning, the form is the test; James, 2026-09-03, adverbs). */
    quiz_options: Array.isArray(s.quiz_options) ? s.quiz_options : undefined,
  };
}

/** First letter + blanks, and letter count.
 *  Was fat-deck only (>12). A2 36-word leaves still had 12 Type items, so
 *  the clue never appeared (James, 2026-09-02, transport). Always show it.
 *  Vocab level-check type-in reuses this (James, 2026-09-03). */
export function typeLetterClue(answer) {
  const raw = String(answer || "").trim();
  if (!raw) return "";
  /* A paren gloss is a sense hint, shown but never required — accepts()
   * strips it — so it stays readable and out of the letter count:
   * "short (height)" → "s____ (height) · 5 letters" (James, 2026-08-31). */
  let depth = 0;
  let pat = "";
  let letters = 0;
  let word = "";
  const flush = () => {
    if (!word) return;
    pat += word[0] + "_".repeat(word.length - 1);
    letters += word.length;
    word = "";
  };
  for (const ch of raw) {
    if (ch === "(") {
      flush();
      depth++;
      pat += ch;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      pat += ch;
      continue;
    }
    if (depth === 0 && /[A-Za-zÀ-ž]/.test(ch)) {
      word += ch;
      continue;
    }
    flush();
    pat += ch;
  }
  flush();
  if (letters < 2) return "";
  return `${pat} · ${letters} letter${letters === 1 ? "" : "s"}`;
}

/** Use rewrite clue: r______ (7). Hidden target, Type-style length. */
function rewriteLetterClue(lemma) {
  const w = lemmaBare(lemma);
  if (w.length < 2) return "";
  return `${w[0]}${"_".repeat(w.length - 1)} (${w.length})`;
}

function markUnderline(prompt, span) {
  const p = String(prompt || "");
  const u = String(span || "").trim();
  if (!p) return "";
  if (!u) return escapeHtml(p);
  const idx = p.toLowerCase().indexOf(u.toLowerCase());
  if (idx < 0) return escapeHtml(p);
  return `${escapeHtml(p.slice(0, idx))}<u class="rw-u">${escapeHtml(
    p.slice(idx, idx + u.length),
  )}</u>${escapeHtml(p.slice(idx + u.length))}`;
}

function rewriteHintFrame(it) {
  const en = String(it.en || "");
  const lemma = lemmaBare(it.lemma);
  if (!en || !lemma) return "";
  const esc = lemma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^A-Za-zÀ-ž])(${esc})(?![A-Za-zÀ-ž])`, "i");
  if (!re.test(en)) return "";
  return en.replace(re, "$1____");
}

function isRewriteItem(it) {
  return Boolean(it && it.prompt && it.underline && it.en);
}

/** Which-is-correct? Quiz (B21). Match and Type skip these. */
function isSentenceQuiz(item) {
  return item && item.quiz_axis === "sentence";
}

/**
 * Normalised Czech gloss, for detecting items that share a prompt.
 * Two items with the same Czech support (bohatý = rich AND wealthy) are both
 * correct answers to that prompt — Quiz must not offer one as a distractor
 * against the other, and Match must not show the same tile twice.
 */
function glossKey(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The bare senses inside a Czech prompt: "silnice / cesta" -> [silnice, cesta],
 * "cesta (delší)" -> [cesta]. Alternatives and the parenthetical gloss are
 * stripped, because what a student reads and answers against is the sense.
 */
function czSenses(cz) {
  return String(cz == null ? "" : cz)
    .split("/")
    .map((p) => glossKey(p.replace(/\([^)]*\)/g, " ")))
    .filter(Boolean);
}

function matchSenseKeys(item) {
  const support = supportOf(item);
  const senses = czSenses(support);
  return senses.length ? senses : [glossKey(support)].filter(Boolean);
}

/** One member of each Czech-sense group first, so a pair like shoe/boot
 *  (both *bota*) is split across boards instead of both landing leftover. */
function spreadMatchOrder(list, order) {
  const items = [];
  for (const i of order) {
    const it = list[i];
    if (it) items.push({ i, it });
  }
  if (items.length < 2) return order;
  const parent = items.map((_, idx) => idx);
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  const keyAt = new Map();
  items.forEach((x, idx) => {
    for (const k of matchSenseKeys(x.it)) {
      if (keyAt.has(k)) {
        const a = find(keyAt.get(k));
        const b = find(idx);
        if (a !== b) parent[b] = a;
      } else {
        keyAt.set(k, idx);
      }
    }
  });
  const groups = new Map();
  items.forEach((x, idx) => {
    const r = find(idx);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(x.i);
  });
  const reps = [];
  const rest = [];
  for (const g of groups.values()) {
    if (g.length > 1) {
      reps.push(g[0]);
      rest.push(...g.slice(1));
    } else {
      rest.push(g[0]);
    }
  }
  const pos = new Map(order.map((i, p) => [i, p]));
  rest.sort((a, b) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0));
  return [...reps, ...rest];
}

/**
 * A prompt is BARE when it offers no alternative and no disambiguating gloss.
 * Bare "cesta" has five right answers (way, road, journey, trip, voyage) and
 * the student cannot know which is wanted; "cesta (delší)" names one, so it
 * stays strict. Only bare prompts get widened (James, 2026-08-17, found in a
 * lesson: cesta was graded as journey alone).
 */
function isBarePrompt(cz) {
  const s = String(cz == null ? "" : cz);
  return Boolean(s.trim()) && !s.includes("/") && !s.includes("(");
}

/**
 * @param {HTMLElement} root
 * @param {{ id?: string, title: string, items: object[], practice?: string }} block
 * @param {{ onExit: () => void, practice?: string, packId?: string, packTitle?: string }} opts
 */
export function startPractice(root, block, opts) {
  const isFrames = opts.practice === "frames" || block.practice === "frames";
  const packId = opts.packId || block.id || "";
  const packTitle = opts.packTitle || block.title || "";
  const packLevel = opts.packLevel || block.level || "?";
  /** Authored sentence bank (leaf packs). Trunk frames use block.items. */
  const sentenceBank =
    Array.isArray(block.sentences) && block.sentences.length
      ? block.sentences
      : null;
  /** A2+ Use bank (E10). Quiz/Type keep sentences[]. Absent → Use translates. */
  const useBank =
    Array.isArray(block.use_sentences) && block.use_sentences.length
      ? block.use_sentences
      : null;
  /** Optional read-first stage (concept packs). */
  const hasIntro = Array.isArray(block.intro) && block.intro.length > 0;
  /* Frames packs draw Use from block.items, the same list Type just used, so
   * on a pack of one-line social chunks Use IS Type — same prompt, same
   * answer, twice. Such a pack sets ladder.sentence = false: the stage is
   * dropped and the fruit lands after Type. (James, 2026-08-20, smoking
   * a1_core_frames_social: "the Use is the same as the type in — let's just
   * cut it and give the fruit after type in".) */
  const ladderCfg = opts.ladder || block.ladder || null;
  /* Packs that TEACH a determiner contrast keep exact grading. Read from opts
   * because the engine is handed a BLOCK, and pack-level fields only arrive if
   * they are passed through explicitly. */
  const strictDet = !!(opts.strictDeterminers || block.strict_determiners);
  STRICT_DETERMINERS = strictDet;
  const strictCaps = !!(opts.strictCapitals || block.strict_capitals);
  const noSentence = ladderCfg ? ladderCfg.sentence === false : false;
  const focusStructures =
    Array.isArray(block.focus_structures) && block.focus_structures.length
      ? block.focus_structures
      : Array.isArray(block.teaches_structures)
        ? block.teaches_structures
        : [];

  function getSentenceItems() {
    /* E10: Use prefers use_sentences[] when authored. Quiz/Type still read
     * sentences[] via sentenceToFrame. */
    if (useBank) return useBank;
    /* An authored bank wins even on a frames pack. Without this, Use on a
     * frames pack replays block.items — the same prompts Type just used —
     * so an added sentences[] was dead weight (James, 2026-08-31,
     * Adjectives 2: "these sentences are all a bit simple"). */
    if (sentenceBank) return sentenceBank;
    if (isFrames) return block.items;
    return null;
  }

  // Words the Use bank will demand get focus-weighted in the word modes,
  // so a big deck cannot reach Use before its targets have surfaced
  // (guaranteed exposure, not probabilistic — the "Ile masz lat?" lesson).
  const sentenceTargets = new Set();
  for (const s of useBank || sentenceBank || []) {
    if (s.lemma) sentenceTargets.add(s.lemma);
    for (const l of s.lemmas || []) sentenceTargets.add(l);
  }

  const wordItems = (block.items || []).filter((it) => !isSentenceQuiz(it));
  const sentenceQuizItems = (block.items || []).filter(isSentenceQuiz);
  const quizMode = block.quiz_mode || opts.quiz_mode || "";
  const sentenceFrames =
    quizMode === "sentence_gap"
      ? (sentenceBank || []).map(sentenceToFrame).filter(Boolean)
      : [];
  function quizList() {
    if (sentenceQuizItems.length) return sentenceQuizItems;
    if (sentenceFrames.length) return sentenceFrames;
    return wordItems.length ? wordItems : block.items || [];
  }
  function matchList() {
    return wordItems.length ? wordItems : block.items || [];
  }

  const quizCovered = new Set(opts.quizKeys || []);
  const typeCovered = new Set(opts.typeKeys || []);
  const matchCovered = new Set(opts.matchKeys || []);
  let matchCleared = !!opts.matchCleared;
  let quizCleared = !!opts.quizCleared;
  let typeCleared = !!opts.typeCleared;

  /** Drop keys for lemmas the pack no longer has (Feelings dropped *well*
   *  and the leftover key made Match read 18/17 and skip the second board).
   *  If the saved deck is a different size, first-learn starts over. */
  function pruneCovered(covered, list) {
    const live = new Set((list || []).map(itemDeckKey));
    let ghosts = 0;
    for (const k of [...covered]) {
      if (live.has(k)) continue;
      covered.delete(k);
      ghosts += 1;
    }
    return ghosts;
  }
  function deckChanged(storedNeed, liveNeed, ghosts) {
    if (ghosts) return true;
    if (storedNeed == null || liveNeed == null) return false;
    return Number(storedNeed) !== Number(liveNeed);
  }

  function typeSourceList() {
    return sentenceFrames.length ? sentenceFrames : matchList();
  }

  /** Word Quiz and sentence-gap Quiz share Type's keys. Which-is-correct?
   *  (`quiz_axis: sentence`) is a different deck — Type must cover the words
   *  itself or round 2 redraws the same 12 (James, 2026-08-31, Countries). */
  function typeTiedToQuiz() {
    return sentenceQuizItems.length === 0;
  }

  function quizCoverNeed() {
    return vocabCoverNeed(quizList().length);
  }

  function typeCoverNeed() {
    return vocabCoverNeed(typeSourceList().length);
  }

  function coverRoundTotal(need) {
    return Math.max(1, Math.ceil(need / DEFAULT_PASS));
  }

  function coverRoundAt(have) {
    return Math.max(0, Math.ceil(have / DEFAULT_PASS));
  }

  function matchCoverNeed() {
    return matchList().length;
  }

  const matchGhosts = pruneCovered(matchCovered, matchList());
  const quizGhosts = pruneCovered(quizCovered, quizList());
  const typeGhosts = pruneCovered(typeCovered, typeSourceList());
  const matchNeedNow = matchCoverNeed();
  const quizNeedNow = quizCoverNeed();
  const typeNeedNow = typeCoverNeed();
  const matchDeckChanged = deckChanged(opts.matchNeed, matchNeedNow, matchGhosts);
  const quizDeckChanged = deckChanged(opts.quizNeed, quizNeedNow, quizGhosts);
  const typeDeckChanged = deckChanged(opts.typeNeed, typeNeedNow, typeGhosts);
  if (matchDeckChanged) {
    matchCovered.clear();
    matchCleared = false;
  } else {
    matchCleared = matchCleared && matchCovered.size >= matchNeedNow;
  }
  if (quizDeckChanged) {
    quizCovered.clear();
    quizCleared = false;
  } else {
    quizCleared = quizCleared && quizCovered.size >= quizNeedNow;
  }
  if (typeDeckChanged) {
    typeCovered.clear();
    typeCleared = false;
  } else {
    typeCleared = typeCleared && typeCovered.size >= typeNeedNow;
  }
  /* A finished unit must never be un-finished by a pack rewrite. Work was
   * rebuilt under its own tree on 2026-08-31 — 30 words → 32, and
   * `quiz_mode: sentence_gap` moved Quiz and Type onto sentence frames, so
   * every remembered key was a ghost and the unit dropped to 0/32 · 0/32 ·
   * 0/12. Twenty more A1 packs gained the same line the same day. A block
   * that already has its tree adopts whatever the deck is now; the new
   * material comes due through review, not by demoting a unit James has
   * already walked. (James, 2026-08-31: "it's about the 6th time in total
   * I've been through this unit".) */
  const adoptDeck = Boolean(opts.wasFruit);
  if (adoptDeck) {
    for (const it of matchList()) matchCovered.add(itemDeckKey(it));
    for (const it of quizList()) quizCovered.add(itemDeckKey(it));
    for (const it of typeSourceList()) typeCovered.add(itemDeckKey(it));
    matchCleared = true;
    quizCleared = true;
    typeCleared = true;
  }
  /* Stale 12+12+1 progress: do not open a board of one pair. Replay the
   * even split (James, 2026-09-02, family). Skip if the tree is already on. */
  let shortLeftoverReset = false;
  if (!adoptDeck && !matchCleared && matchList().length > 18) {
    const leftN = matchList().filter((it) => !matchCovered.has(itemDeckKey(it))).length;
    if (leftN > 0 && leftN < 8) {
      matchCovered.clear();
      shortLeftoverReset = true;
    }
  }
  if (typeof opts.onModeComplete === "function") {
    // Adoption is persisted too, or the tree is re-taken on every open.
    if (matchDeckChanged || adoptDeck || shortLeftoverReset) {
      opts.onModeComplete("match", {
        coverageDone: adoptDeck,
        coveredKeys: [...matchCovered],
        need: matchNeedNow,
      });
    }
    if (quizDeckChanged || adoptDeck) {
      opts.onModeComplete("quiz", {
        coverageDone: adoptDeck,
        coveredKeys: [...quizCovered],
        need: quizNeedNow,
      });
    }
    if (typeDeckChanged || adoptDeck) {
      opts.onModeComplete("type", {
        coverageDone: adoptDeck,
        coveredKeys: [...typeCovered],
        need: typeNeedNow,
      });
    }
  }

  /** Naive ceil(need/cap) is 2 for 23 words, but a Czech-sense collision
   *  can leave 1 word after two boards — never print "Match 3 of 2". */
  function leftoverRounds(have, need, cap) {
    const size = Math.max(1, cap || DEFAULT_PASS);
    const remaining = Math.max(0, need - have);
    const planned = Math.max(1, Math.ceil(need / size));
    const roundN = Math.max(1, Math.ceil(Math.max(have, 1) / size));
    if (!remaining) {
      const n = Math.max(roundN, planned);
      return { roundN: n, roundTotal: n };
    }
    const boardsLeft = Math.max(1, Math.ceil(remaining / size));
    return { roundN, roundTotal: Math.max(planned, roundN + boardsLeft) };
  }

  function moreBoardsLine(have, need, boardCap, kind) {
    const remaining = Math.max(0, need - have);
    if (!remaining) {
      return kind === "match" ? "All clear · next: Quiz" : "All clear · next: Type";
    }
    const { roundN, roundTotal } = leftoverRounds(have, need, boardCap);
    const left = Math.max(1, roundTotal - roundN);
    const unit = kind === "match" ? "match" : "quiz";
    const units = kind === "match" ? "matches" : "quizzes";
    if (left === 1) return `Complete 1 more ${unit} to continue`;
    return `Complete ${left} more ${units} to continue`;
  }

  function matchFruitNeed() {
    return matchCoverNeed();
  }

  /** What's still holding the tree after Use. Match must cover every word. */
  function fruitBlockers() {
    const bits = [];
    const mNeed = matchFruitNeed();
    if (matchCovered.size < mNeed && !matchCleared) {
      bits.push(`Match ${matchCovered.size}/${mNeed}`);
    }
    const qNeed = quizCoverNeed();
    if (!vocabCoveredEnough([...quizCovered], qNeed)) {
      bits.push(`Quiz ${quizCovered.size}/${qNeed}`);
    }
    const tNeed = typeCoverNeed();
    if (!vocabCoveredEnough([...typeCovered], tNeed)) {
      bits.push(`Type ${typeCovered.size}/${tNeed}`);
    }
    return bits;
  }

  function leftoverMode() {
    if (matchCovered.size < matchFruitNeed() && !matchCleared) return "match";
    if (!quizFruitReady()) return "quiz";
    if (!typeFruitReady()) return "type";
    return null;
  }

  function quizFruitReady() {
    return vocabCoveredEnough([...quizCovered], quizCoverNeed());
  }

  function typeFruitReady() {
    return vocabCoveredEnough([...typeCovered], typeCoverNeed());
  }

  function canOpenMode(id) {
    if (id === "intro" || id === "match") return true;
    if (id === "quiz") {
      return matchCleared || matchCovered.size >= matchCoverNeed();
    }
    if (id === "type") return !typeTiedToQuiz() || quizFruitReady();
    if (id === "sentence") {
      return typeFruitReady() && (!typeTiedToQuiz() || quizFruitReady());
    }
    return true;
  }

  function moreQuizzesLine(have, need) {
    const total = coverRoundTotal(need);
    const done = coverRoundAt(have);
    const left = Math.max(0, total - done);
    if (!left) return "All clear · next: Type";
    if (left === 1) return "Complete 1 more quiz to continue";
    return `Complete ${left} more quizzes to continue`;
  }

  function pickUnseen(list, covered, n) {
    const prefer = [];
    const rest = [];
    for (let i = 0; i < list.length; i++) {
      if (covered.has(itemDeckKey(list[i]))) continue;
      if (sentenceTargets.size && sentenceTargets.has(list[i].en)) prefer.push(i);
      else rest.push(i);
    }
    return [...shuffle(prefer), ...shuffle(rest)].slice(0, n);
  }

  /** First-learn Type on a shared deck only produces words already quizzed.
   *  Which-is-correct? Quiz does not share keys — use the full word list. */
  function typeList() {
    const all = typeSourceList();
    if (typeCleared || !typeTiedToQuiz()) return all;
    const quizzed = all.filter((it) => quizCovered.has(itemDeckKey(it)));
    return quizzed.length ? quizzed : all;
  }

  /** Same job as grammar matchBoardSize (B9). Word chips stay 12, except
   *  packs of 13–18 split evenly (18 → 9+9, 17 → 9+8) so the leftover
   *  board is not a short six. (James, 2026-08-31, Feelings.)
   *  Bigger packs stay 12s unless the last board would be under 8
   *  (25 → 9+8+8, not 12+12+1 — James, 2026-09-02, family).
   *  Count a sentence by English word count, not a trailing period —
   *  *Hello.* is a word, *They become friends.* is a sentence. */
  function matchBoardSize(items) {
    if (!items || !items.length) return DEFAULT_PASS;
    let n = 0;
    for (const it of items) {
      const words = String(it.en || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length >= 4) n += 1;
    }
    if (n > items.length / 2) return 8;
    const N = items.length;
    if (N <= DEFAULT_PASS) return DEFAULT_PASS;
    if (N <= 18) return Math.ceil(N / 2);
    const leftover = N % DEFAULT_PASS;
    if (leftover === 0 || leftover >= 8) return DEFAULT_PASS;
    return Math.ceil(N / Math.ceil(N / DEFAULT_PASS));
  }

  function orderOpts(items) {
    return { items, focusStructures, targets: sentenceTargets };
  }

  // ---- Visual anchors for self-illustrating vocab ----
  // Items may carry swatch: "#hex" (colours) or icon: "🐕" (concrete nouns).
  // The chip renders beside the word in Match/Quiz/type prompts so a beginner
  // can derive meaning from the visual itself (anchor rule when no lexical
  // anchor exists). Typing still requires producing the word — the chip
  // anchors meaning, not spelling.
  const swatchByText = new Map();
  const iconByText = new Map();
  // Gender badges keyed by the Czech side only — they mark the Czech noun,
  // and must never leak onto the EN side (that would gift the answer).
  const genderByCz = new Map();
  const GENDER_LABEL = { m: "m.", f: "f.", n: "n.", pl: "pl." };
  for (const it of block.items || []) {
    if (it.swatch) {
      swatchByText.set(it.cz, it.swatch);
      swatchByText.set(it.en, it.swatch);
    }
    if (it.icon) {
      iconByText.set(it.cz, it.icon);
      iconByText.set(it.en, it.icon);
    }
    if (it.gender && GENDER_LABEL[it.gender]) {
      genderByCz.set(it.cz, it.gender);
    }
  }

  function sw(text) {
    const c = swatchByText.get(text);
    if (c) return `<span class="swatch" style="background:${c}"></span>`;
    const ic = iconByText.get(text);
    if (ic) return `<span class="icon-chip">${ic}</span>`;
    return "";
  }

  /** Gender badge after a Czech noun (teaches gender during exposure). */
  function gb(text) {
    const g = genderByCz.get(text);
    return g
      ? ` <span class="gender-badge gender-${g}">${GENDER_LABEL[g]}</span>`
      : "";
  }

  // ---- Equally-correct answers to an ambiguous prompt ----
  // One Czech word routinely covers several English ones. Where the prompt
  // names no sense, every English word the course attaches to that sense is a
  // correct answer, so grading must accept them all and Quiz must not offer
  // one as a distractor against another. A grader rule rather than 182 hand
  // edits, and it stays true as content grows (same call as the 617 article
  // defects, James 2026-08-11).
  //
  // The map is course-wide (data/senses.json), not per-pack: `film` and
  // `movie` live in different packs, and a pack-local map caught only 73 of
  // the 182. The pack's own items are folded in on top so a new pack is
  // covered before the map is regenerated.
  const enBySense = new Map();
  const shared = (opts.senseMap && opts.senseMap.senses) || null;
  if (shared) {
    for (const [s, list] of Object.entries(shared)) {
      enBySense.set(s, new Set(list));
    }
  }
  for (const it of block.items || []) {
    if (!it || !it.en) continue;
    for (const s of czSenses(it.cz)) {
      if (!enBySense.has(s)) enBySense.set(s, new Set());
      enBySense.get(s).add(it.en);
    }
  }

  /** Other English answers that are equally right for this item's prompt. */
  function siblingAnswers(item) {
    if (!item || !isBarePrompt(item.cz)) return [];
    const set = enBySense.get(glossKey(item.cz));
    if (!set || set.size < 2) return [];
    return [...set].filter((en) => en && en !== item.en);
  }

  // ---- Deck rotation (per pack + mode) ----
  const deckKeyBase = opts.packId || block.id || block.title || "pack";

  function deckSeen(mode) {
    const arr = loadSeenStore()[`${deckKeyBase}::${mode}`] || [];
    return new Set(arr);
  }

  /** Mark a freshly built pass as seen; a completed cycle resets to empty. */
  function markDeckSeen(mode, order, items) {
    if (!items || items.length <= DEFAULT_PASS) return;
    markKeysSeen(
      mode,
      order.map((i) => items[i] && itemDeckKey(items[i])).filter(Boolean),
      items,
    );
  }

  /** First-learn coverage (36 unique) must count as seen so review
   *  Type/Quiz draw the leftover words, not a reshuffle of the same 36. */
  function markKeysSeen(mode, keys, items) {
    if (!items || items.length <= DEFAULT_PASS || !keys || !keys.length) return;
    const key = `${deckKeyBase}::${mode}`;
    const store = loadSeenStore();
    const set = new Set(store[key] || []);
    for (const k of keys) set.add(k);
    const allKeys = items.map(itemDeckKey);
    const complete = allKeys.every((k) => set.has(k));
    store[key] = complete ? [] : [...set].filter((k) => allKeys.includes(k));
    saveSeenStore(store);
  }

  markKeysSeen("quiz", [...quizCovered], quizList());
  markKeysSeen("type", [...typeCovered], typeSourceList());
  markKeysSeen("match", [...matchCovered], matchList());

  /** "· deck 24/36" coverage suffix for decks bigger than one pass. */
  function deckLabel(mode, items) {
    if (!items || items.length <= DEFAULT_PASS) return "";
    const seen = deckSeen(mode);
    const n = items.filter((it) => seen.has(itemDeckKey(it))).length;
    const shown = n === 0 ? items.length : n;
    return ` · deck ${shown}/${items.length}`;
  }

  function rotatedOrder(mode, list, onlyIndices) {
    const order = passOrder(list.length, onlyIndices, {
      ...orderOpts(list),
      seen: deckSeen(mode),
    });
    if (!onlyIndices || !onlyIndices.length) markDeckSeen(mode, order, list);
    return order;
  }

  const state = {
    // Review launches jump straight to production (opts.startMode = "type")
    mode: opts.startMode || (hasIntro ? "intro" : "match"),
    introPage: 0,
    match: null,
    quiz: null,
    typ: null,
    use: null,
    keyHandler: null,
    advanceTimer: null,
    /** Current item context for smoke Flag (always-visible toolbar). */
    flagContext: {
      packId,
      packTitle,
      blockId: block.id || "",
      stage: "match",
      itemIndex: null,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    },
  };
  /** Track first completion for optional UI; scores always update bests. */
  const reported = { match: false, quiz: false, type: false, sentence: false };
  let payoffShown = false;

  function setFlagContext(partial) {
    state.flagContext = { ...state.flagContext, ...partial };
    // Also push to the shared context the Flag toolbar reads. Without this a
    // flag raised in a vocab unit reported whichever GRAMMAR pack was opened
    // last (James, 2026-08-11 — a1_animals flags came out as a1_present_simple).
    setSmokeContext(state.flagContext);
  }

  /**
   * Always push mode complete (so retries raise best Quiz/Word).
   * reported[] only tracks first finish this session.
   */
  function reportMode(mode, meta) {
    if (!mode) return;
    reported[mode] = true;
    if (typeof opts.onModeComplete === "function") {
      opts.onModeComplete(mode, meta || {});
    }
  }

  if (typeof opts.onTouch === "function") opts.onTouch();

  /* A pack with no Use stage settles that mode the moment the unit is opened,
   * not when Type happens to be finished. Reporting it at Type-completion only
   * left anyone who had ALREADY cleared Type stranded on 3/4 for ever, with no
   * stage left to play. The mode is vacuously complete — the stage does not
   * exist — and fruit still needs Quiz and Type genuinely clear, so this
   * cannot hand out a unit nobody worked for. (James, 2026-08-20: "social
   * should be done, fruited, even without the use part".) */
  if (noSentence) reportMode("sentence", { score: 1, total: 1 });

  function clearKey() {
    if (state.keyHandler) {
      document.removeEventListener("keydown", state.keyHandler, true);
      document.removeEventListener("keydown", state.keyHandler, false);
      state.keyHandler = null;
    }
    if (state.advanceTimer) {
      clearTimeout(state.advanceTimer);
      state.advanceTimer = null;
    }
  }

  // Exits that bypass #p-exit (shell back button, opening the next unit) leave
  // this instance's document-level Enter handler alive; a stale handler then
  // re-renders the OLD unit on Enter. Unbind the previous instance on mount
  // and hand the shell a teardown, mirroring grammar's _RUE2UnbindKeys.
  if (typeof root._RUEVocabUnbind === "function") root._RUEVocabUnbind();
  root._RUEVocabUnbind = clearKey;

  /** Map digit / numpad key to 0-based option index, or null. */
  function quizKeyToIndex(e, optCount) {
    const codeMap = {
      Digit1: 0,
      Digit2: 1,
      Digit3: 2,
      Digit4: 3,
      Digit5: 4,
      Digit6: 5,
      Numpad1: 0,
      Numpad2: 1,
      Numpad3: 2,
      Numpad4: 3,
      Numpad5: 4,
      Numpad6: 5,
    };
    if (Object.prototype.hasOwnProperty.call(codeMap, e.code)) {
      const i = codeMap[e.code];
      return i < optCount ? i : null;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= optCount) return n - 1;
    return null;
  }

  /**
   * Enter = primary action (check / next / continue).
   * Callers skip textarea when free multi-line write owns Enter.
   * Single-line type-in (#ti, input.type-in) must receive Enter.
   */
  function bindEnter(handler) {
    clearKey();
    state.keyHandler = (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.target.closest("select")) return;
      if (e.target.closest("#smoke-flags-host")) return;
      handler(e);
    };
    document.addEventListener("keydown", state.keyHandler, true);
  }

  function bindEnterPrimary(stage) {
    bindEnter((e) => {
      // Don't steal Enter from multi-line free write
      if (e.target.closest("textarea") && !e.target.closest("#ti")) return;
      e.preventDefault();
      const btn =
        stage.querySelector(".btn.primary") ||
        stage.querySelector("#chk") ||
        stage.querySelector(".btn");
      if (btn && !btn.disabled) btn.click();
    });
  }

  function setMode(m) {
    if (!canOpenMode(m)) return;
    clearKey();
    state.mode = m;
    if (m === "intro") state.introPage = 0;
    state.match = null;
    state.quiz = null;
    state.typ = null;
    state.use = null;
    render();
  }

  function renderChrome(statusText) {
    const base = [
      ["match", "Match"],
      ["quiz", "Quiz"],
      ["type", "Type"],
    ];
    if (!noSentence) base.push(["sentence", "Use"]);
    if (hasIntro) base.unshift(["intro", "Intro"]);
    const modes = base.map(([id, label], i) => [id, `${i + 1} · ${label}`]);
    const bankN = sentenceBank ? sentenceBank.length : 0;
    const wordN = matchList().length;
    const metaBits = isFrames
      ? `${block.items.length} frames · ${packLevel} · trunk`
      : bankN
        ? `${wordN} words · ${bankN} sentences · ${packLevel}`
        : `${wordN} words · ${packLevel}`;
    return `
      <div class="practice-head">
        <div class="practice-title">${escapeHtml(block.title)}</div>
        ${
          block.title_en
            ? `<div class="unit-gloss">${escapeHtml(block.title_en)}</div>`
            : ""
        }
        <div class="practice-meta">${metaBits}</div>
      </div>
      <div class="modes">
        ${modes
          .map(([id, label]) => {
            const open = canOpenMode(id);
            const cls = `mode${state.mode === id ? " active" : ""}`;
            const dis = open ? "" : " disabled";
            const title = open
              ? ""
              : id === "quiz"
                ? ' title="Finish Match first"'
                : id === "type"
                  ? ' title="Finish Quiz first"'
                  : ' title="Finish Quiz and Type first"';
            return `<button type="button" class="${cls}" data-mode="${id}"${dis}${title}>${label}</button>`;
          })
          .join("")}
      </div>
      <div class="p-bar">
        <span id="p-status">${escapeHtml(statusText || "")}</span>
        <span class="dir-static">${
          state.mode === "sentence"
            ? "Write in English"
            : state.mode === "quiz" && sentenceQuizItems.length
              ? "Which is correct?"
              : "CZ → EN"
        }</span>
      </div>
      <div id="p-stage" class="stage"></div>
      <div class="practice-exit">
        <button type="button" class="btn-ghost" id="p-exit">← Home</button>
      </div>
    `;
  }

  function wireChrome() {
    root.querySelectorAll(".mode").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        setMode(btn.dataset.mode);
      });
    });
    root.querySelector("#p-exit").addEventListener("click", () => {
      clearKey();
      opts.onExit();
    });
  }

  function flagItem(it, itemIndex, stage) {
    if (!it) {
      setFlagContext({
        stage: stage || state.mode,
        itemIndex: itemIndex ?? null,
        en: "",
        cz: "",
        gap: "",
        gap_answer: "",
      });
      return;
    }
    setFlagContext({
      stage: stage || state.mode,
      itemIndex: typeof itemIndex === "number" ? itemIndex : null,
      en: it.en || "",
      cz: it.cz || "",
      gap: it.gap || "",
      gap_answer: it.gap_answer || it.en || "",
    });
  }

  function newMatch() {
    const list = matchList();
    const need = matchCoverNeed();
    let order;
    if (!matchCleared && matchCovered.size < need) {
      order = pickUnseen(list, matchCovered, list.length);
    } else {
      order = rotatedOrder("match", list, null);
    }
    order = spreadMatchOrder(list, order);
    // Drop items whose Czech prompt duplicates one already on the board —
    // two identical tiles are unpairable by sight, and pairing is graded by
    // item id, so the visually-correct pairing is wrong half the time.
    // Compared by SENSE, not by whole string: "Ahoj. / Dobrý den." (Hello),
    // "Ahoj. (neformálně)" (Hi) and "Ahoj. (na rozloučenou)" (Bye) are three
    // different strings that a student reads as one word, so all three used
    // to land on the same board and two of them were a coin-flip. Any shared
    // sense is enough to keep the later item off this board — it still comes
    // round in another pass. (James, 2026-08-20, smoking a1_core_frames_social:
    // "ambiguity here on Ahoj … it's not totally clear".)
    const seenGloss = new Set();
    const pool = [];
    for (const i of order) {
      const item = list[i];
      if (!item) continue;
      const keys = matchSenseKeys(item);
      if (keys.some((k) => seenGloss.has(k))) continue;
      for (const k of keys) seenGloss.add(k);
      pool.push(item);
    }
    const uncovered = list.filter((it) => !matchCovered.has(itemDeckKey(it)));
    const cap = matchBoardSize(uncovered.length ? uncovered : list);
    if (pool.length > cap) pool.splice(cap);
    const left = pool.map((it, i) => ({
      t: supportOf(it),
      en: targetOf(it),
      cz: supportOf(it),
      id: i,
    }));
    const right = shuffle(
      pool.map((it, i) => ({
        t: targetOf(it),
        en: targetOf(it),
        cz: supportOf(it),
        id: i,
      })),
    );
    state.match = {
      left,
      right,
      sel: null,
      doneIds: new Set(),
      total: pool.length,
      roundKeys: pool.map((it) => itemDeckKey(it)),
    };
  }

  /** English answers in left-column order — James smokes without Czech. */
  function pushMatchSmoke() {
    const m = state.match;
    const key = (m?.left || [])
      .map((x) => x.en)
      .filter(Boolean)
      .join(" · ");
    setFlagContext({
      stage: "match",
      itemIndex: null,
      en: key,
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
  }

  function smokeToolbarOn() {
    return document.getElementById("smoke-toolbar")?.hidden === false;
  }

  function renderMatch(stage) {
    if (!state.match) newMatch();
    const m = state.match;
    const doneCount = m.doneIds.size;
    pushMatchSmoke();

    if (doneCount === m.total) {
      const list = matchList();
      const need = matchCoverNeed();
      const boardCap = matchBoardSize(list);
      if (!matchCleared) {
        if (list.length <= boardCap) {
          for (const it of list) matchCovered.add(itemDeckKey(it));
        } else {
          for (const k of m.roundKeys || []) matchCovered.add(k);
        }
        markKeysSeen("match", [...matchCovered], list);
      }
      const have = matchCovered.size;
      /* Match covers every word before Quiz (James, 2026-09-02, family
       * 12/25). Skip still stamps walked. Do not mark the stage clear
       * after one board. */
      const done = matchCleared || have >= need;
      if (done) matchCleared = true;
      reportMode("match", {
        coverageDone: done,
        coveredKeys: [...matchCovered],
        need,
      });
      if (
        done &&
        typeof opts.onFruitNow === "function" &&
        fruitBlockers().length === 0 &&
        opts.onFruitNow()
      ) {
        return `Matched ${doneCount} of ${m.total}`;
      }
      const more = !done;
      const { roundN, roundTotal } = leftoverRounds(have, need, boardCap);
      const title = more
        ? `Match ${roundN} of ${roundTotal} done`
        : matchCleared || need <= boardCap
          ? "Match · Done"
          : `Match ${roundTotal} of ${roundTotal} done`;
      const sub = more
        ? moreBoardsLine(have, need, boardCap, "match")
        : "Next: Quiz · Enter continues";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${title}</div>
          <div class="scoreline">${need > DEFAULT_PASS ? `${have} / ${need} words` : `${doneCount} / ${m.total}`}</div>
          <div class="sub">${sub}</div>
          <div class="nav">
            ${
              more
                ? `<button type="button" class="btn primary" id="m-more">Match ${roundN + 1} of ${roundTotal} →</button>
                   <button type="button" class="btn" id="m-quiz">2 · Quiz →</button>`
                : `<button type="button" class="btn" id="m-again">New set</button>
                   <button type="button" class="btn primary" id="m-quiz">2 · Quiz →</button>
                   <button type="button" class="btn" id="m-map">← Home</button>`
            }
          </div>
        </div>`;
      stage.querySelector("#m-more")?.addEventListener("click", () => {
        newMatch();
        render();
      });
      const againBtn = stage.querySelector("#m-again");
      if (againBtn) {
        againBtn.onclick = () => {
          newMatch();
          render();
        };
      }
      stage.querySelector("#m-quiz").onclick = () => setMode("quiz");
      stage.querySelector("#m-map")?.addEventListener("click", () => {
        clearKey();
        opts.onExit();
      });
      bindEnterPrimary(stage);
      return `Matched ${doneCount} of ${m.total}${deckLabel("match", matchList())}`;
    }

    const col = (arr, side) =>
      arr
        .map((x) => {
          const done = m.doneIds.has(x.id);
          const cls = done ? "m done" : "m";
          const label = done ? `✓ ${x.t}` : x.t;
          return `<button type="button" class="${cls}" data-side="${side}" data-id="${x.id}" ${done ? "disabled" : ""}>${sw(x.t)}${escapeHtml(label)}${gb(x.t)}</button>`;
        })
        .join("");

    // Smoke-only: same hatch as grammar Match (James, 2026-08-30). Re-testing
    // Quiz must not pay the match toll every time. Hidden unless the dev
    // toolbar is up, so students still do the pairing.
    stage.innerHTML = `
      <div class="match-hint">Click a word, then its pair · click again (or Esc) to deselect${
        smokeToolbarOn()
          ? ` · <button type="button" class="link" id="m-skip">skip match (smoke) →</button>`
          : ""
      }</div>
      <div class="match"><div class="match-col">${col(m.left, "L")}</div><div class="match-col">${col(m.right, "R")}</div></div>`;
    stage.querySelector("#m-skip")?.addEventListener("click", () => {
      // Smoke skip still counts as Match walked, or Use 12/12 never gets a tree
      // (James, Countries 2026-08-31). Students do not see this control.
      reportMode("match", {
        coverageDone: true,
        coveredKeys: [...matchCovered],
        need: Math.min(DEFAULT_PASS, matchCoverNeed()),
      });
      matchCleared = true;
      setMode("quiz");
    });

    // Esc clears a mis-tapped token without needing to find it again.
    clearKey();
    state.keyHandler = (e) => {
      if (e.key !== "Escape" || !m.sel) return;
      e.preventDefault();
      m.sel.el.classList.remove("sel");
      m.sel = null;
    };
    document.addEventListener("keydown", state.keyHandler, true);

    stage.querySelectorAll(".m:not(.done)").forEach((el) => {
      el.addEventListener("click", () => {
        const id = +el.dataset.id;
        const side = el.dataset.side;
        if (!m.sel) {
          m.sel = { id, side, el };
          el.classList.add("sel");
          return;
        }
        if (m.sel.el === el) {
          // De-click: tapped the selected token again → clear it.
          el.classList.remove("sel");
          m.sel = null;
          return;
        }
        if (m.sel.side === side) {
          m.sel.el.classList.remove("sel");
          m.sel = { id, side, el };
          el.classList.add("sel");
          return;
        }
        if (m.sel.id === id) {
          // Pair found — persist in state so re-render keeps them eliminated
          m.doneIds.add(id);
          m.sel.el.classList.remove("sel");
          m.sel.el.classList.add("done");
          m.sel.el.disabled = true;
          m.sel.el.textContent = "✓ " + m.sel.el.textContent.replace(/^✓\s*/, "");
          el.classList.add("done");
          el.disabled = true;
          el.textContent = "✓ " + el.textContent.replace(/^✓\s*/, "");
          m.sel = null;
          // Refresh status line + full board when complete
          setTimeout(() => render(), doneCount + 1 >= m.total ? 280 : 0);
          if (doneCount + 1 < m.total) {
            const st = root.querySelector("#p-status");
            if (st) st.textContent = `Matched ${m.doneIds.size} of ${m.total}`;
          }
        } else {
          const a = m.sel.el;
          a.classList.add("wrong");
          el.classList.add("wrong");
          setTimeout(() => {
            a.classList.remove("wrong");
            el.classList.remove("wrong");
            // Only drop the highlight if nothing was picked during the flash —
            // a fast re-tap would otherwise leave m.sel set but nothing lit.
            if (m.sel?.el !== a) a.classList.remove("sel");
            if (m.sel?.el !== el) el.classList.remove("sel");
          }, 450);
          m.sel = null;
        }
      });
    });
    return `Matched ${doneCount} of ${m.total}${deckLabel("match", matchList())}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newQuiz(onlyIndices) {
    const list = quizList();
    const retry = Boolean(onlyIndices && onlyIndices.length);
    const keepKeys = retry && state.quiz ? state.quiz.roundKeys || [] : [];
    let order;
    if (retry) {
      order = shuffle(onlyIndices.slice());
    } else if (!quizCleared && quizCovered.size < quizCoverNeed()) {
      order = pickUnseen(list, quizCovered, DEFAULT_PASS);
    } else {
      order = rotatedOrder("quiz", list, null);
    }
    state.quiz = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      wrong: [],
      retryPass: retry,
      roundKeys: retry ? keepKeys : order.map((i) => itemDeckKey(list[i])),
    };
  }

  function renderQuiz(stage) {
    const list = quizList();
    if (!state.quiz) newQuiz();
    const q = state.quiz;
    const passLen = q.order.length;

    if (q.pos >= q.order.length) {
      const wrongN = q.wrong.length;
      const need = quizCoverNeed();
      if (wrongN === 0) {
        if (!quizCleared) {
          for (const k of q.roundKeys || []) quizCovered.add(k);
          markKeysSeen("quiz", q.roundKeys || [], quizList());
          markKeysSeen("match", q.roundKeys || [], matchList());
        }
        const done = quizCleared || quizFruitReady();
        reportMode("quiz", {
          score: q.retryPass ? 1 : q.score,
          total: q.retryPass ? 1 : passLen,
          coverageDone: done,
          coveredKeys: [...quizCovered],
          need,
        });
        if (
          wrongN === 0 &&
          typeof opts.onFruitNow === "function" &&
          fruitBlockers().length === 0 &&
          opts.onFruitNow()
        ) {
          return `Quiz ${q.score}/${passLen}`;
        }
      } else if (!q.retryPass) {
        reportMode("quiz", {
          score: q.score,
          total: passLen,
          coverageDone: quizCleared || quizFruitReady(),
          coveredKeys: [...quizCovered],
          need,
        });
      }
      const have = quizCovered.size;
      const moreN = Math.min(DEFAULT_PASS, Math.max(0, need - have));
      const more = wrongN === 0 && !quizCleared && have < need;
      const canType = wrongN === 0 && quizFruitReady();
      const roundN = coverRoundAt(have);
      const roundTotal = coverRoundTotal(need);
      const title = need > DEFAULT_PASS && wrongN === 0
        ? `Quiz ${roundN} of ${roundTotal} done`
        : "Quiz done";
      const sub = wrongN > 0
        ? `${wrongN} to retry`
        : !canType
          ? moreQuizzesLine(have, need)
          : more
            ? moreQuizzesLine(have, need)
            : "All clear · next: Type";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${title}</div>
          <div class="scoreline">${q.score} / ${passLen}${need > DEFAULT_PASS ? ` · ${have} / ${need} words` : ""}</div>
          <div class="sub">${sub}${q.retryPass ? " (retry pass)" : ""} · Enter = next</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="q-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="q-type-map">← Home</button>`
                : !canType
                  ? `<button type="button" class="btn primary" id="q-more">Quiz ${roundN + 1} of ${roundTotal} →</button>`
                  : more
                    ? `<button type="button" class="btn primary" id="q-type">3 · Type →</button>
                       <button type="button" class="btn" id="q-more">Quiz ${roundN + 1} of ${roundTotal} →</button>`
                    : `<button type="button" class="btn" id="q-again">Try full set</button>
                       <button type="button" class="btn primary" id="q-type">3 · Type →</button>`
            }
          </div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="q-again">Try full set</button>`
              : ""
          }
        </div>`;
      const retryBtn = stage.querySelector("#q-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newQuiz(q.wrong.slice());
          render();
        };
      }
      const moreBtn = stage.querySelector("#q-more");
      if (moreBtn) {
        moreBtn.onclick = () => {
          newQuiz();
          render();
        };
      }
      stage.querySelector("#q-type")?.addEventListener("click", () => setMode("type"));
      stage.querySelector("#q-type-map")?.addEventListener("click", () => {
        clearKey();
        opts.onExit();
      });
      const again = stage.querySelector("#q-again");
      if (again) {
        again.onclick = () => {
          newQuiz();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Done · wrong: ${wrongN}`
        : `Done · ${q.score}/${passLen}${need > DEFAULT_PASS ? ` · ${have}/${need} words` : ""}`;
    }

    const itemIndex = q.order[q.pos];
    const it = list[itemIndex];
    flagItem(it, itemIndex, "quiz");
    /* Frame items quiz the GAP, not the sentence. Whole-sentence options from
     * other items are solved by content-word matching alone — "polévku" finds
     * "soup" without ever deciding recept = recipe/prescription (James,
     * 2026-08-16, smoking b2_false_friends). Authored quiz_options carry the
     * confusable set (the false friend's twin, the learner's error form);
     * fallback is other items' gap answers. */
    const frame = isFrameItem(it);
    const sentence = isSentenceQuiz(it);
    const correct = sentence
      ? targetOf(it)
      : frame
        ? it.gap_answer
        : targetOf(it);
    let others;
    if (sentence) {
      const authored = Array.isArray(it.quiz_options)
        ? it.quiz_options.filter((o) => o && sentenceChipKey(o) !== sentenceChipKey(correct))
        : [];
      others = [...new Set(authored)].slice(0, 3);
    } else if (frame) {
      const authored = Array.isArray(it.quiz_options)
        ? [...new Set(it.quiz_options.filter((o) => o && o !== correct))]
        : [];
      others = authored.length
        ? shuffle(authored).slice(0, 3)
        : shuffle([
            ...new Set(
              list
                .filter((x) => x !== it && x.gap_answer && x.gap_answer !== correct)
                .map((x) => x.gap_answer),
            ),
          ]).slice(0, 3);
    } else {
      // A sibling sharing this item's Czech prompt is an EQUALLY CORRECT answer,
      // not a distractor (bohatý = rich AND wealthy). Grading is a string match
      // against `correct`, so offering the twin marks a right answer wrong.
      // The same holds one level down: for a bare prompt like "cesta", every
      // English word attached to that sense is right, even though the sibling's
      // own prompt reads "silnice / cesta" and so never matched as a gloss.
      const supportKey = glossKey(supportOf(it));
      const equally = new Set(siblingAnswers(it).map((en) => glossKey(en)));
      others = shuffle(
        list.filter(
          (x) =>
            targetOf(x) !== correct &&
            glossKey(supportOf(x)) !== supportKey &&
            !equally.has(glossKey(targetOf(x))),
        ),
      )
        .slice(0, 3)
        .map((x) => targetOf(x));
    }
    const choices = shuffle([correct, ...others]);

    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        <div class="prompt">${
          sentence
            ? "Which is correct?"
            : `${sw(supportOf(it))}${escapeHtml(supportOf(it))}${gb(supportOf(it))}`
        }</div>
        ${
          sentence && supportOf(it)
            ? `<div class="sub">${escapeHtml(supportOf(it))}</div>`
            : ""
        }
        ${frame ? `<div class="prompt prompt-gap">${escapeHtml(it.gap)}</div>` : ""}
        <div class="sub">${
          sentence
            ? "Tap the English sentence · keys 1–3 · then <strong>Enter</strong> = next"
            : `Choose the ${frame ? "missing word" : "English"} · keys 1–4 · then <strong>Enter</strong> = next (always)`
        }</div>
        <div class="opts">
          ${choices
            .map(
              (o, i) =>
                `<button type="button" class="opt" data-i="${i}"><span class="knum">${i + 1}</span>${sentence ? "" : sw(o)}${escapeHtml(o)}${sentence ? "" : gb(o)}</button>`,
            )
            .join("")}
        </div>
      </div>`;

    const goNextQuestion = () => {
      if (state.advanceTimer) {
        clearTimeout(state.advanceTimer);
        state.advanceTimer = null;
      }
      q.pos++;
      q.answered = false;
      render();
    };

    const pick = (i) => {
      if (q.answered) return;
      q.answered = true;
      const buttons = [...stage.querySelectorAll(".opt")];
      const chipEq = sentence
        ? (a, b) => sentenceChipKey(a) === sentenceChipKey(b)
        : (a, b) => norm(a) === norm(b);
      if (chipEq(choices[i], correct)) {
        buttons[i].classList.add("correct");
        q.score++;
      } else {
        buttons[i].classList.add("wrong");
        const ci = choices.findIndex((o) => chipEq(o, correct));
        if (ci >= 0) buttons[ci].classList.add("correct");
        if (!q.wrong.includes(itemIndex)) q.wrong.push(itemIndex);
      }
      // Stay on feedback until Enter (right or wrong) — no auto-advance.
    };

    stage.querySelectorAll(".opt").forEach((el) => {
      el.addEventListener("click", () => pick(+el.dataset.i));
    });

    // Don't leave focus on mode/dir chrome — that blocked 1–4 keys
    // (handler used to ignore keydown when target was .mode / .dir).
    if (document.activeElement && root.contains(document.activeElement)) {
      const ae = document.activeElement;
      if (ae.matches && ae.matches("button.mode, button.dir, #p-exit, .util-btn")) {
        ae.blur();
      }
    }
    if (!stage.hasAttribute("tabindex")) stage.setAttribute("tabindex", "-1");
    try {
      stage.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }

    clearKey();
    state.keyHandler = (e) => {
      // Only skip when typing in a real field (not chrome buttons)
      if (e.target && e.target.closest && e.target.closest("input, textarea, select")) return;
      if (e.target && e.target.closest && e.target.closest("#smoke-flags-host")) return;
      if (e.key === "Enter") {
        if (q.answered) {
          e.preventDefault();
          goNextQuestion();
        }
        return;
      }
      // After answering, only Enter advances (not another digit press).
      if (q.answered) return;
      const n = quizKeyToIndex(e, choices.length);
      if (n != null) {
        e.preventDefault();
        e.stopPropagation();
        pick(n);
      }
    };
    // Capture so numbers win even if a button has focus
    document.addEventListener("keydown", state.keyHandler, true);

    return `${q.retryPass ? "Retry" : "Question"} ${q.pos + 1} of ${passLen} · score ${q.score}${q.retryPass ? "" : deckLabel("quiz", list)}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newType(onlyIndices) {
    const list = typeList();
    const retry = Boolean(onlyIndices && onlyIndices.length);
    const keepKeys = retry && state.typ ? state.typ.roundKeys || [] : [];
    let order;
    if (retry) {
      order = shuffle(onlyIndices.slice());
    } else if (!typeCleared && typeCovered.size < typeCoverNeed()) {
      order = pickUnseen(list, typeCovered, DEFAULT_PASS);
    } else {
      order = rotatedOrder("type", list, null);
    }
    state.typ = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      missedThis: false,
      wrong: [],
      retryPass: retry,
      roundKeys: retry ? keepKeys : order.map((i) => itemDeckKey(list[i])),
    };
  }

  function renderType(stage) {
    const list = typeList();
    if (!state.typ) newType();
    const t = state.typ;
    const passLen = t.order.length;

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      const need = typeCoverNeed();
      const quizNeed = quizCoverNeed();
      const tied = typeTiedToQuiz();
      if (wrongN === 0) {
        if (!typeCleared) {
          for (const k of t.roundKeys || []) {
            if (!tied || quizCovered.has(k)) typeCovered.add(k);
          }
          markKeysSeen("type", t.roundKeys || [], typeSourceList());
        }
        const typeEnough = vocabCoveredEnough([...typeCovered], need);
        const quizEnough = vocabCoveredEnough([...quizCovered], quizNeed);
        const done =
          typeCleared || (tied ? quizEnough && typeEnough : typeEnough);
        reportMode("type", {
          score: t.retryPass ? 1 : t.score,
          total: t.retryPass ? 1 : passLen,
          coverageDone: done,
          coveredKeys: [...typeCovered],
          need,
        });
        if (
          wrongN === 0 &&
          typeof opts.onFruitNow === "function" &&
          fruitBlockers().length === 0 &&
          opts.onFruitNow()
        ) {
          return `Type ${t.score}/${passLen}`;
        }
      } else if (!t.retryPass) {
        const typeEnough = vocabCoveredEnough([...typeCovered], need);
        const quizEnough = vocabCoveredEnough([...quizCovered], quizNeed);
        reportMode("type", {
          score: t.score,
          total: passLen,
          coverageDone:
            typeCleared || (tied ? quizEnough && typeEnough : typeEnough),
          coveredKeys: [...typeCovered],
          need,
        });
      }
      if (noSentence && wrongN === 0 && (typeCleared || vocabCoveredEnough([...typeCovered], need))) {
        reportMode("sentence", { score: 1, total: 1 });
      }
      const have = typeCovered.size;
      const quizHave = quizCovered.size;
      const typeCap = tied ? Math.min(need, Math.max(quizHave, 0)) : need;
      const more = wrongN === 0 && !typeCleared && have < typeCap;
      const quizFirst = tied && wrongN === 0 && !typeCleared && !quizFruitReady();
      const canUse =
        wrongN === 0 &&
        typeFruitReady() &&
        (!tied || quizFruitReady());
      const leftWords = Math.max(0, typeCap - have);
      const shortLeftover =
        more &&
        !noSentence &&
        leftWords > 0 &&
        leftWords < DEFAULT_PASS &&
        have >= DEFAULT_PASS * 2 &&
        canUse;
      const moreN = Math.min(DEFAULT_PASS, leftWords);
      const roundN = coverRoundAt(have);
      const roundTotal = coverRoundTotal(need);
      const typeLeft = Math.max(0, roundTotal - roundN);
      const useBtn = (primary) =>
        noSentence
          ? ""
          : `<button type="button" class="btn${primary ? " primary" : ""}" id="t-sent">Use →</button>`;
      const moreBtn = more
        ? `<button type="button" class="btn${shortLeftover || noSentence ? "" : " primary"}" id="t-more">Type ${roundN + 1} of ${roundTotal}${shortLeftover ? ` · ${leftWords} words` : ""} →</button>`
        : "";
      const title = need > DEFAULT_PASS && wrongN === 0
        ? `Type ${roundN} of ${roundTotal} done`
        : "Type done";
      const sub = wrongN > 0
        ? `${wrongN} to retry`
        : quizFirst
          ? `Quiz ${quizHave} / ${need} first`
          : more && shortLeftover
            ? `All clear · next: Use · ${leftWords} words left`
            : more && !canUse
              ? typeLeft === 1
                ? `${moreN} more words`
                : `${typeLeft} more type-ins`
              : more
                ? typeLeft === 1
                  ? `${moreN} more words · or Use`
                  : `${typeLeft} more type-ins · or Use`
                : noSentence
                  ? "All clear · unit done"
                  : "All clear · next: Use";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${title}</div>
          <div class="scoreline">${t.score} / ${passLen}${need > DEFAULT_PASS ? ` · ${have} / ${need} words` : ""}</div>
          <div class="sub">${sub}${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="t-sent-map">← Home</button>`
                : quizFirst
                  ? `<button type="button" class="btn primary" id="t-quiz">Quiz · ${Math.min(DEFAULT_PASS, need - quizHave)} more →</button>`
                  : more && noSentence
                    ? `${moreBtn}
                       <button type="button" class="btn" id="t-sent-map">← Home</button>`
                    : more && shortLeftover
                      ? `${useBtn(true)}
                         ${moreBtn}`
                      : more && !canUse
                        ? moreBtn
                        : more
                          ? `${moreBtn}
                             ${useBtn(false)}`
                          : noSentence
                            ? `<button type="button" class="btn" id="t-again">Try full set</button>
                               <button type="button" class="btn primary" id="t-sent-map">← Home</button>`
                            : canUse
                              ? `<button type="button" class="btn" id="t-again">Try full set</button>
                                 ${useBtn(true)}`
                              : moreBtn || `<button type="button" class="btn primary" id="t-more">Type ${roundN + 1} of ${roundTotal} →</button>`
            }
          </div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="t-again">Try full set</button>`
              : ""
          }
        </div>`;
      const retryBtn = stage.querySelector("#t-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newType(t.wrong.slice());
          render();
        };
      }
      const sentBtn = stage.querySelector("#t-sent");
      if (sentBtn) sentBtn.onclick = () => setMode("sentence");
      stage.querySelector("#t-more")?.addEventListener("click", () => {
        newType();
        render();
      });
      stage.querySelector("#t-quiz")?.addEventListener("click", () => setMode("quiz"));
      stage.querySelector("#t-sent-map")?.addEventListener("click", () => {
        clearKey();
        opts.onExit();
      });
      const again = stage.querySelector("#t-again");
      if (again) {
        again.onclick = () => {
          newType();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Done · wrong: ${wrongN}`
        : `Done · ${t.score}/${passLen}`;
    }

    const itemIndex = t.order[t.pos];
    const it = list[itemIndex];
    flagItem(it, itemIndex, "type");
    const frame = isFrameItem(it);
    // Frames: gap-fill on the English sentence, Czech translation as support
    // (never the full English sentence — that would show the answer).
    // Leaves: Czech word prompt, type the English word.
    const prompt = frame ? it.gap : supportOf(it);
    const answer = frame ? it.gap_answer : targetOf(it);
    const sub = frame
      ? "Fill the missing English word · Enter = check / next"
      : "Write in English · Enter = check / next";
    const passLabel = t.retryPass ? "retry" : "set";
    const clue = typeLetterClue(answer);
    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        ${frame && it.cz ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.cz)}</div>` : ""}
        <div class="prompt prompt-gap">${frame ? "" : sw(prompt)}${escapeHtml(prompt)}</div>
        <div class="sub">${sub}</div>
        ${clue ? `<div class="type-clue">${escapeHtml(clue)}</div>` : ""}
        <input class="type-in" id="ti" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here…" />
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
    inp.addEventListener("input", () => setFlagContext({ typed: inp.value }));
    inp.focus();

    function goNext() {
      if (t.missedThis) {
        const idx = t.order[t.pos];
        if (!t.wrong.includes(idx)) t.wrong.push(idx);
      }
      t.pos++;
      t.answered = false;
      t.missedThis = false;
      t.nearUsed = false;
      render();
    }

    function afterGrade() {
      attachExplain(fb, it);
      inp.disabled = true;
      skip.style.visibility = "hidden";
      chk.textContent = t.pos === passLen - 1 ? "Score →" : "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    function grade(opts = {}) {
      if (t.answered) return;
      const { allowNear = true } = opts;
      // Frames gap a sentence, so only word items get the ambiguous-prompt
      // widening.
      const equally = frame ? [] : siblingAnswers(it);
      const alsoRight = equally.find((alt) =>
        isCorrectAnswer(inp.value, it, alt, { forGap: frame }),
      );
      if (isCorrectAnswer(inp.value, it, answer, { forGap: frame }) || alsoRight) {
        if (strictCaps && !capitalsOk(inp.value, [answer, ...(it.accepts || [])])) {
          t.answered = true;
          t.missedThis = true;
          fb.innerHTML = `✗ Capital letter: <span class="reveal">${escapeHtml(answer)}</span>`;
          fb.className = "fb bad";
          afterGrade();
          return;
        }
        t.answered = true;
        t.missedThis = false;
        t.score++;
        // Say the model answer too, or the student never learns which word
        // this prompt was reaching for.
        fb.innerHTML = alsoRight
          ? `✓ Correct — also: <span class="reveal">${escapeHtml(answer)}</span>`
          : "✓ Correct";
        fb.className = "fb good";
        afterGrade();
        return;
      }

      // Near-miss layer: diacritics count as right, a dropped ending gets one retry.
      const near = allowNear
        ? nearMiss(inp.value, it, answer, { forGap: frame })
        : null;
      if (near === "accent") {
        t.answered = true;
        t.missedThis = false;
        t.score++;
        fb.innerHTML = `✓ Correct — with spelling: <span class="reveal">${escapeHtml(answer)}</span>${gb(answer)}`;
        fb.className = "fb good";
        afterGrade();
        return;
      }
      if (near === "close" && !t.nearUsed) {
        t.nearUsed = true;
        fb.textContent = "Almost — check the ending and try again.";
        fb.className = "fb near";
        inp.select();
        inp.focus();
        return;
      }

      t.answered = true;
      t.missedThis = true;
      fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(answer)}</span>${gb(answer)}`;
      fb.className = "fb bad";
      const s = document.createElement("button");
      s.type = "button";
      s.className = "link";
      s.textContent = "I was right → count it";
      s.onclick = () => {
        t.score++;
        t.missedThis = false;
        s.textContent = "counted ✓";
        s.disabled = true;
      };
      fb.appendChild(document.createElement("br"));
      fb.appendChild(s);
      afterGrade();
    }

    chk.onclick = () => {
      if (t.answered) goNext();
      else grade();
    };
    skip.onclick = () => {
      if (t.answered) return;
      inp.value = "";
      grade({ allowNear: false });
    };

    // Enter handled ONLY by the document-level bindEnter handler.
    // A second listener on the input double-fires: capture handler grades,
    // then the input handler sees answered=true and advances instantly,
    // so feedback never stays on screen.
    bindEnter((e) => {
      // Allow Enter from input, Check button, or anywhere on stage
      if (e.target.closest("textarea") && e.target.id !== "ti") return;
      e.preventDefault();
      e.stopPropagation();
      if (t.answered) goNext();
      else grade();
    });

    return `${passLabel} ${t.pos + 1} / ${passLen} · score ${t.score}${t.retryPass ? "" : deckLabel("type", list)}`;
  }

  // ---- 4 · Use / sentence (model bank / trunk frames) ----

  /** Trunk frames or leaf sentences[] — full sentence production (supports retry wrong). */
  function newFrameSentence(onlyIndices) {
    const list = getSentenceItems() || [];
    const order = rotatedOrder("sentence", list, onlyIndices);
    state.typ = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      missedThis: false,
      wrong: [],
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderFrameSentence(stage) {
    const list = getSentenceItems() || [];
    if (!list.length) return renderSentenceSoon(stage);
    if (!state.typ) newFrameSentence();
    const t = state.typ;
    const passLen = t.order.length;
    const doneSub = isFrames
      ? "Full English sentences from the prompt — core frames."
      : useBank && useBank.some(isRewriteItem)
        ? "Rewrite the sentence with a word from this unit."
        : useBank
          ? "Write a full sentence with the new word."
          : "Short translations into English · patterns from earlier units.";

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      // Same gate discipline as Quiz/Type: first pass records real score;
      // perfect retry stamps 1/1 cleanPass. Never fruit on partial Use.
      if (!t.retryPass) reportMode("sentence", { score: t.score, total: passLen });
      else if (wrongN === 0) reportMode("sentence", { score: 1, total: 1 });
      /* Say what is holding the tree even on a round with wrongs. Fruit
       * still needs a clean Use, but a screen that only says "3 to retry"
       * hides the fact that Match is also short — you retry, fruit anyway
       * fails, and nothing ever told you why (James, 2026-08-31). */
      const blockers = fruitBlockers();
      const leftMode = wrongN === 0 ? leftoverMode() : null;
      if (
        wrongN === 0 &&
        !blockers.length &&
        typeof opts.onFruitNow === "function" &&
        opts.onFruitNow()
      ) {
        payoffShown = true;
        return `Done · ${t.score}/${passLen}`;
      }
      const leftLabel =
        leftMode === "match"
          ? "1 · Match →"
          : leftMode === "quiz"
            ? "2 · Quiz →"
            : leftMode === "type"
              ? "3 · Type →"
              : "";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Stage done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${
            wrongN > 0
              ? `${wrongN} to retry${
                  blockers.length
                    ? ` · then the tree needs ${blockers.join(" · ")}`
                    : " · then the tree"
                }`
              : blockers.length
                ? `The tree needs ${blockers.join(" · ")}`
                : "On the tree · next: Home"
          }${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="fs-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="fs-map">← Home</button>`
                : blockers.length
                  ? `<button type="button" class="btn primary" id="fs-left">${leftLabel}</button>
                     <button type="button" class="btn" id="fs-map">← Home</button>`
                  : `<button type="button" class="btn primary" id="fs-map">← Home</button>
                     <button type="button" class="btn" id="fs-match">1 · Match</button>`
            }
          </div>
          <button type="button" class="link" id="fs-again">Try full set</button>
        </div>`;
      const retryBtn = stage.querySelector("#fs-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newFrameSentence(t.wrong.slice());
          render();
        };
      }
      stage.querySelector("#fs-map").onclick = () => {
        clearKey();
        opts.onExit();
      };
      stage.querySelector("#fs-left")?.addEventListener("click", () => {
        if (leftMode) setMode(leftMode);
      });
      stage.querySelector("#fs-match")?.addEventListener("click", () => setMode("match"));
      const again = stage.querySelector("#fs-again");
      if (again) {
        again.onclick = () => {
          newFrameSentence();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Done · wrong: ${wrongN}`
        : `Done · ${t.score}/${passLen}`;
    }

    const itemIndex = t.order[t.pos];
    const it = list[itemIndex];
    flagItem(it, itemIndex, "sentence");
    const rewriteUse = isRewriteItem(it);
    const frameUse = Boolean(it.frame) && !rewriteUse;
    const frameHint = rewriteUse
      ? rewriteHintFrame(it)
      : it.frame || it.gap || "";
    const letterClue = rewriteUse ? rewriteLetterClue(it.lemma) : "";
    const rewriteTask =
      (block.use_hint ||
        "Rewrite the sentence. Replace the underlined words.") +
      " Enter = check / next";
    /* Rewrite: English prompt, target hidden, Type-style blank.
     * Frame Use: do not print the English lemma (B15).
     * Default: CZ→EN translation. */
    const promptHtml = rewriteUse
      ? `<p class="fix-label">Rewrite</p>
        <div class="prompt" style="font-size:1.15rem">${markUnderline(it.prompt, it.underline)}</div>
        ${letterClue ? `<div class="rw-clue">${escapeHtml(letterClue)}</div>` : ""}
        <div class="sub">${escapeHtml(rewriteTask)}</div>`
      : frameUse
        ? `<div class="prompt" style="font-size:1.2rem">${escapeHtml(it.frame)}</div>
        ${it.cz ? `<div class="sub" style="font-size:1.05rem;margin-top:0.45rem">${escapeHtml(it.cz)}</div>` : ""}
        <div class="sub">Write the sentence · Enter = check / next</div>`
        : `<div class="prompt" style="font-size:1.2rem">${escapeHtml(it.cz)}</div>
        <div class="sub">Translate into English · Enter = check / next</div>`;
    stage.innerHTML = `
      <div class="q">
        <div class="sub">Sentence <strong>${t.pos + 1}</strong> of <strong>${passLen}</strong>${t.retryPass ? " (retry)" : ""} · write in English</div>
        ${diagramBlock(it)}
        ${structureHint(it)}
        ${promptHtml}
        <textarea class="type-in type-area" id="ti" rows="2" autocomplete="off" spellcheck="false" placeholder="${rewriteUse ? "type the new sentence…" : "write the English sentence…"}"></textarea>
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        ${frameHint ? `<button type="button" class="link" id="hint">Hint · frame</button> · ` : ""}
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
    // Scaffold hint for chunk sentences: shows the gap frame, no penalty.
    // "Show answer" stays the give-up; this is the rung below it.
    stage.querySelector("#hint")?.addEventListener("click", () => {
      fb.textContent = `Frame: ${frameHint}`;
      fb.className = "fb near";
      inp.focus();
    });
    inp.addEventListener("input", () => setFlagContext({ typed: inp.value }));
    inp.focus();

    function goNext() {
      if (t.missedThis) {
        const idx = t.order[t.pos];
        if (!t.wrong.includes(idx)) t.wrong.push(idx);
      }
      t.pos++;
      t.answered = false;
      t.missedThis = false;
      render();
    }

    function afterGrade() {
      attachExplain(fb, it);
      inp.disabled = true;
      skip.style.visibility = "hidden";
      chk.textContent = t.pos === passLen - 1 ? "Finish ✓" : "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    function grade() {
      if (t.answered) return;
      t.answered = true;
      t.missedThis = false;
      if (isCorrectAnswer(inp.value, it, it.en)) {
        if (strictCaps && !capitalsOk(inp.value, [it.en, ...(it.accepts || [])])) {
          t.missedThis = true;
          fb.innerHTML = `✗ Capital letter: <span class="reveal">${escapeHtml(it.en)}</span>`;
          fb.className = "fb bad";
        } else {
          t.score++;
          fb.textContent = "✓ Correct";
          fb.className = "fb good";
        }
      } else {
        t.missedThis = true;
        const typedN = norm(inp.value);
        const trap =
          rewriteUse &&
          Array.isArray(it.reject) &&
          it.reject.some((r) => typedN.includes(norm(r)));
        const trapNote = trap && it.trap_note ? ` ${escapeHtml(it.trap_note)}` : "";
        fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(it.en)}</span>${trapNote}`;
        fb.className = "fb bad";
        const s = document.createElement("button");
        s.type = "button";
        s.className = "link";
        s.textContent = "I was right → count it";
        s.onclick = () => {
          t.score++;
          t.missedThis = false;
          s.textContent = "counted ✓";
          s.disabled = true;
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(s);
      }
      afterGrade();
    }

    chk.onclick = () => {
      if (t.answered) goNext();
      else grade();
    };
    skip.onclick = () => {
      if (t.answered) return;
      inp.value = "";
      grade();
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (t.answered) goNext();
      else grade();
    });
    bindEnter((e) => {
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      if (t.answered) goNext();
      else grade();
    });

    return `Sentence ${t.pos + 1} of ${passLen} · score ${t.score}${t.retryPass ? "" : deckLabel("sentence", getSentenceItems() || [])}`;
  }

  /** Leaf pack has no sentences[] yet — no free-write. */
  function renderSentenceSoon(stage) {
    setFlagContext({
      stage: "sentence",
      itemIndex: null,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
    stage.innerHTML = `
      <div class="q">
        <div class="prompt">Use · coming soon</div>
        <div class="sub" style="margin-top:0.75rem;line-height:1.45">
          Short translations into English will live here (frames from earlier units).
          This pack has no sentence bank yet — go back to Match / Quiz / Type.
        </div>
        <div class="nav" style="margin-top:1rem">
          <button type="button" class="btn primary" id="soon-type">3 · Type</button>
          <button type="button" class="btn" id="soon-match">1 · Match</button>
          <button type="button" class="btn" id="soon-map">← Home</button>
        </div>
      </div>`;
    stage.querySelector("#soon-type").onclick = () => setMode("type");
    stage.querySelector("#soon-match").onclick = () => setMode("match");
    stage.querySelector("#soon-map")?.addEventListener("click", () => {
      clearKey();
      opts.onExit();
    });
    bindEnterPrimary(stage);
    return "Use · coming soon";
  }

  function renderSentence(stage) {
    if (getSentenceItems()) return renderFrameSentence(stage);
    return renderSentenceSoon(stage);
  }

  /** Picture grid: emoji / colour swatch tiles. Meaning before translation. */
  function pictureGrid(pics) {
    const tiles = pics
      .map((p) => {
        const art = p.swatch
          ? `<span class="pic-swatch" style="background:${escapeHtml(p.swatch)}"></span>`
          : p.icon
            ? `<span class="pic-icon">${escapeHtml(p.icon)}</span>`
            : "";
        if (!art && !p.en) return "";
        return `<div class="pic-tile">
            ${art}
            <span class="pic-en">${escapeHtml(p.en || "")}</span>
            ${p.cz ? `<span class="pic-cz">${escapeHtml(p.cz)}</span>` : ""}
          </div>`;
      })
      .join("");
    return tiles ? `<div class="pic-grid">${tiles}</div>` : "";
  }

  function introTableHtml(t) {
    if (!t || !Array.isArray(t.rows)) return "";
    return `<table class="intro-table"><thead><tr>${(t.headers || [])
      .map((h) => `<th>${escMd(h)}</th>`)
      .join("")}</tr></thead><tbody>${(t.rows || [])
      .map(
        (r) => `<tr>${r.map((c) => `<td>${escMd(c)}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody></table>`;
  }

  function introSection(sec) {
    const tableList = [
      ...(sec.table ? [sec.table] : []),
      ...((Array.isArray(sec.tables) && sec.tables) || []),
    ];
    const table = tableList.map(introTableHtml).join("");
    const pics = Array.isArray(sec.pictures) ? pictureGrid(sec.pictures) : "";
    const diagram = sec.diagram
      ? `<div class="intro-diagram">${introDiagram(sec.diagram, sec.labels)}</div>`
      : "";
    const frames = Array.isArray(sec.frames) && sec.frames.length
      ? `<ul class="intro-frames">${sec.frames
          .map((f) => `<li>${escMd(f)}</li>`)
          .join("")}</ul>`
      : "";
    const note = sec.note
      ? `<p class="intro-note">${escMd(sec.note)}</p>`
      : "";
    return `
      <div class="q intro-card">
        ${sec.title ? `<div class="prompt">${escMd(sec.title)}</div>` : ""}
        ${sec.title_cz ? `<div class="sub"><em>${escMd(sec.title_cz)}</em></div>` : ""}
        ${diagram}
        ${pics}
        ${sec.body ? `<p style="white-space:pre-line">${escMd(sec.body)}</p>` : ""}
        ${frames}
        ${table}
        ${note}
        ${sec.note_cz ? `<p class="intro-note sub"><em>${escMd(sec.note_cz)}</em></p>` : ""}
        ${sec.body_cz ? `<p class="sub" style="white-space:pre-line"><em>${escMd(sec.body_cz)}</em></p>` : ""}
      </div>`;
  }

  /** Paginated: one section per page, so "1 / 2" means two short pages. */
  function renderIntro(stage) {
    setFlagContext({ stage: "intro", itemIndex: null, en: "", cz: "" });
    const secs = block.intro || [];
    const total = secs.length;
    const i = Math.min(state.introPage || 0, Math.max(0, total - 1));
    const sec = secs[i];
    const last = i >= total - 1;
    stage.innerHTML = `
      ${introSection(sec || {})}
      <div class="nav">
        ${i > 0 ? `<button type="button" class="btn" id="in-prev">← Back</button>` : ""}
        <button type="button" class="btn primary" id="in-next">${
          last ? "Next → Match" : "Next →"
        }</button>
      </div>`;
    stage.querySelector("#in-prev")?.addEventListener("click", () => {
      state.introPage = i - 1;
      render();
    });
    stage.querySelector("#in-next").onclick = () => {
      if (last) {
        setMode("match");
      } else {
        state.introPage = i + 1;
        render();
      }
    };
    bindEnterPrimary(stage);
    return total > 1
      ? `Intro ${i + 1} of ${total} · Enter = next`
      : "Intro · read · Enter = next";
  }

  function render() {
    if (payoffShown) return;
    clearKey();
    root.innerHTML = renderChrome("…");
    wireChrome();
    const stage = root.querySelector("#p-stage");
    let status = "";
    if (state.mode === "intro") status = renderIntro(stage);
    else if (state.mode === "match") status = renderMatch(stage);
    else if (state.mode === "quiz") status = renderQuiz(stage);
    else if (state.mode === "type") status = renderType(stage);
    else status = renderSentence(stage);
    if (payoffShown) return;
    const st = root.querySelector("#p-status");
    if (st) st.textContent = status || "";
  }

  render();
}
