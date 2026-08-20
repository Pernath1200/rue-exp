/**
 * Practice ladder (RUE3-shaped vocab engine for rue-exp):
 * Match → Quiz → Type word → Use (sentence)
 * Direction is fixed CZ → EN: items carry en (English target, typed and
 * graded) + cz (Czech support, shown as prompt).
 * Default pass size: DEFAULT_PASS (12); shorter banks use all items.
 * Each stage stops with score (e.g. 11/12) + retry wrongs before next.
 * Sentence mode:
 *   - trunk frames (practice: "frames") → model production from items
 *   - leaf packs with pack.sentences[] → same grading UI (authored translations)
 *   - no bank → "Coming soon" placeholder (no free-write)
 */

import { canonSynonyms } from "./synonyms.js";
import { introDiagram } from "./intro-visuals.js";
import { attachExplain } from "./explain.js";
import { setSmokeContext } from "./smoke-flags.js";

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
function expandContractions(s) {
  let t = String(s).toLowerCase();
  const pairs = [
    [/\bwon't\b/g, "will not"],
    [/\bcan't\b/g, "cannot"],
    [/\bcannot\b/g, "cannot"],
    [/\bdon't\b/g, "do not"],
    [/\bdoesn't\b/g, "does not"],
    [/\bdidn't\b/g, "did not"],
    [/\bisn't\b/g, "is not"],
    [/\baren't\b/g, "are not"],
    [/\bwasn't\b/g, "was not"],
    [/\bweren't\b/g, "were not"],
    [/\bhaven't\b/g, "have not"],
    [/\bhasn't\b/g, "has not"],
    [/\bi'm\b/g, "i am"],
    [/\byou're\b/g, "you are"],
    [/\bhe's\b/g, "he is"],
    [/\bshe's\b/g, "she is"],
    [/\bit's\b/g, "it is"],
    [/\bwe're\b/g, "we are"],
    [/\bthey're\b/g, "they are"],
    [/\bi've\b/g, "i have"],
    [/\byou've\b/g, "you have"],
    [/\bwe've\b/g, "we have"],
    [/\bthey've\b/g, "they have"],
    [/\bi'll\b/g, "i will"],
    [/\byou'll\b/g, "you will"],
    [/\bhe'll\b/g, "he will"],
    [/\bshe'll\b/g, "she will"],
    [/\bwe'll\b/g, "we will"],
    [/\bthey'll\b/g, "they will"],
    [/\bi'd\b/g, "i would"],
    [/\byou'd\b/g, "you would"],
    [/\bhe'd\b/g, "he would"],
    [/\bshe'd\b/g, "she would"],
    [/\bwe'd\b/g, "we would"],
    [/\bthey'd\b/g, "they would"],
    [/\bthere's\b/g, "there is"],
    [/\bthat's\b/g, "that is"],
    [/\bwhat's\b/g, "what is"],
    [/\bwhere's\b/g, "where is"],
    [/\bwho's\b/g, "who is"],
  ];
  for (const [re, rep] of pairs) t = t.replace(re, rep);
  return t;
}

/** Soft production normalizer (case + punctuation + contraction twins). */
function norm(s) {
  return expandContractions(s)
    .replace(/[''`´]/g, "")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function isCorrectAnswer(userInput, item, primary, opts = {}) {
  const userN = norm(userInput);
  if (!userN) return false;
  // norm() already folds case, punctuation and contractions, and English
  // sentences must keep their subjects — no softer sentence match than this.
  const forms = itemAccepts(item, primary, opts);
  if (forms.includes(userN)) return true;
  if (!(item && item._strict_articles) && determinerMatch(userN, forms)) return true;
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

/* Intro prose is authored with **bold** / *italic* markdown, same as the
 * grammar packs. Escape FIRST, then tag — never the reverse. Bold before
 * italic or `**x**` is eaten as italic wrapping `*x*`. Added 2026-08-12:
 * the vocab intro renderer had no markdown at all. */
function escMd(s) {
  return escapeHtml(s)
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
  /** Optional read-first stage (concept packs). */
  const hasIntro = Array.isArray(block.intro) && block.intro.length > 0;
  /* Frames packs draw Use from block.items, the same list Type just used, so
   * on a pack of one-line social chunks Use IS Type — same prompt, same
   * answer, twice. Such a pack sets ladder.sentence = false: the stage is
   * dropped and the fruit lands after Type. (James, 2026-08-20, smoking
   * a1_core_frames_social: "the Use is the same as the type in — let's just
   * cut it and give the fruit after type in".) */
  const noSentence = block.ladder ? block.ladder.sentence === false : false;
  const focusStructures =
    Array.isArray(block.focus_structures) && block.focus_structures.length
      ? block.focus_structures
      : Array.isArray(block.teaches_structures)
        ? block.teaches_structures
        : [];

  function getSentenceItems() {
    if (isFrames) return block.items;
    if (sentenceBank) return sentenceBank;
    return null;
  }

  // Words the Use bank will demand get focus-weighted in the word modes,
  // so a big deck cannot reach Use before its targets have surfaced
  // (guaranteed exposure, not probabilistic — the "Ile masz lat?" lesson).
  const sentenceTargets = new Set();
  for (const s of sentenceBank || []) {
    for (const l of s.lemmas || []) sentenceTargets.add(l);
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
    const key = `${deckKeyBase}::${mode}`;
    const store = loadSeenStore();
    const set = new Set(store[key] || []);
    for (const i of order) {
      if (items[i]) set.add(itemDeckKey(items[i]));
    }
    const allKeys = items.map(itemDeckKey);
    const complete = allKeys.every((k) => set.has(k));
    store[key] = complete ? [] : [...set].filter((k) => allKeys.includes(k));
    saveSeenStore(store);
  }

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
    const metaBits = isFrames
      ? `${block.items.length} frames · ${packLevel} · trunk`
      : bankN
        ? `${block.items.length} words · ${bankN} sentences · ${packLevel}`
        : `${block.items.length} words · ${packLevel}`;
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
          .map(
            ([id, label]) =>
              `<button type="button" class="mode ${state.mode === id ? "active" : ""}" data-mode="${id}">${label}</button>`,
          )
          .join("")}
      </div>
      <div class="p-bar">
        <span id="p-status">${escapeHtml(statusText || "")}</span>
        <span class="dir-static">${state.mode === "sentence" ? "Write in English" : "CZ → EN"}</span>
      </div>
      <div id="p-stage" class="stage"></div>
      <div class="practice-exit">
        <button type="button" class="btn-ghost" id="p-exit">← Back to map</button>
      </div>
    `;
  }

  function wireChrome() {
    root.querySelectorAll(".mode").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
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
      gap_answer: it.gap_answer || "",
    });
  }

  function newMatch() {
    const order = rotatedOrder("match", block.items, null);
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
      const item = block.items[i];
      const support = supportOf(item);
      const senses = czSenses(support);
      const keys = senses.length ? senses : [glossKey(support)].filter(Boolean);
      if (keys.some((k) => seenGloss.has(k))) continue;
      for (const k of keys) seenGloss.add(k);
      pool.push(item);
    }
    const left = pool.map((it, i) => ({ t: supportOf(it), id: i }));
    const right = shuffle(
      pool.map((it, i) => ({ t: targetOf(it), id: i })),
    );
    state.match = {
      left,
      right,
      sel: null,
      doneIds: new Set(),
      total: pool.length,
    };
  }

  function renderMatch(stage) {
    if (!state.match) newMatch();
    const m = state.match;
    const doneCount = m.doneIds.size;
    setFlagContext({
      stage: "match",
      itemIndex: null,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });

    if (doneCount === m.total) {
      reportMode("match");
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Match · Done</div>
          <div class="scoreline">${doneCount} / ${m.total}</div>
          <div class="sub">Next: Quiz · Enter continues</div>
          <div class="nav">
            <button type="button" class="btn" id="m-again">New set</button>
            <button type="button" class="btn primary" id="m-quiz">2 · Quiz →</button>
            <button type="button" class="btn" id="m-map">← Map</button>
          </div>
        </div>`;
      stage.querySelector("#m-again").onclick = () => {
        newMatch();
        render();
      };
      stage.querySelector("#m-quiz").onclick = () => setMode("quiz");
      stage.querySelector("#m-map")?.addEventListener("click", () => {
        clearKey();
        opts.onExit();
      });
      bindEnterPrimary(stage);
      return `Matched ${doneCount} of ${m.total}${deckLabel("match", block.items)}`;
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

    stage.innerHTML = `
      <div class="match-hint">Click a word, then its pair · click again (or Esc) to deselect</div>
      <div class="match"><div>${col(m.left, "L")}</div><div>${col(m.right, "R")}</div></div>`;

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
    return `Matched ${doneCount} of ${m.total}${deckLabel("match", block.items)}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newQuiz(onlyIndices) {
    const list = block.items;
    const order = rotatedOrder("quiz", list, onlyIndices);
    state.quiz = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      wrong: [], // item indices missed this pass
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderQuiz(stage) {
    const list = block.items;
    if (!state.quiz) newQuiz();
    const q = state.quiz;
    const passLen = q.order.length;

    if (q.pos >= q.order.length) {
      const wrongN = q.wrong.length;
      // Full-set runs feed best-score; a retry round only counts once it
      // clears every remaining mistake (mastery through correction).
      if (!q.retryPass) reportMode("quiz", { score: q.score, total: passLen });
      else if (wrongN === 0) reportMode("quiz", { score: 1, total: 1 });
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Quiz done</div>
          <div class="scoreline">${q.score} / ${passLen}</div>
          <div class="sub">${
            wrongN > 0
              ? `${wrongN} to retry · or go to Type`
              : "All clear · next: Type"
          }${q.retryPass ? " (retry pass)" : ""} · Enter = next</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="q-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="q-type">3 · Type →</button>
                   <button type="button" class="btn" id="q-type-map">← Map</button>`
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
      stage.querySelector("#q-type").onclick = () => setMode("type");
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
      return wrongN > 0 ? `Done · wrong: ${wrongN}` : `Done · ${q.score}/${passLen}`;
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
    const correct = frame ? it.gap_answer : targetOf(it);
    let others;
    if (frame) {
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
    const opts = shuffle([correct, ...others]);

    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        <div class="prompt">${sw(supportOf(it))}${escapeHtml(supportOf(it))}${gb(supportOf(it))}</div>
        ${frame ? `<div class="prompt prompt-gap">${escapeHtml(it.gap)}</div>` : ""}
        <div class="sub">Choose the ${frame ? "missing word" : "English"} · keys 1–4 · then <strong>Enter</strong> = next (always)</div>
        <div class="opts">
          ${opts
            .map(
              (o, i) =>
                `<button type="button" class="opt" data-i="${i}"><span class="knum">${i + 1}</span>${sw(o)}${escapeHtml(o)}${gb(o)}</button>`,
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
      if (opts[i] === correct) {
        buttons[i].classList.add("correct");
        q.score++;
      } else {
        buttons[i].classList.add("wrong");
        const ci = opts.indexOf(correct);
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
      if (e.target.closest("input, textarea, select")) return;
      if (e.target.closest("#smoke-flags-host")) return;
      if (e.key === "Enter") {
        if (q.answered) {
          e.preventDefault();
          goNextQuestion();
        }
        return;
      }
      // After answering, only Enter advances (not another digit press).
      if (q.answered) return;
      const n = quizKeyToIndex(e, opts.length);
      if (n != null) {
        e.preventDefault();
        e.stopPropagation();
        pick(n);
      }
    };
    // Capture so numbers win even if a button has focus
    document.addEventListener("keydown", state.keyHandler, true);

    return `${q.retryPass ? "Retry" : "Question"} ${q.pos + 1} of ${passLen} · score ${q.score}${q.retryPass ? "" : deckLabel("quiz", block.items)}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newType(onlyIndices) {
    const list = block.items;
    const order = rotatedOrder("type", list, onlyIndices);
    state.typ = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      missedThis: false,
      wrong: [], // item indices missed this pass
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderType(stage) {
    const list = block.items;
    if (!state.typ) newType();
    const t = state.typ;
    const passLen = t.order.length;

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      // Full-set runs feed best-score; a retry round only counts once it
      // clears every remaining mistake (mastery through correction).
      if (!t.retryPass) reportMode("type", { score: t.score, total: passLen });
      else if (wrongN === 0) reportMode("type", { score: 1, total: 1 });
      // No Use stage on this pack: settle it here so the fruit gate, which
      // still wants four modes, is satisfied by the work actually done.
      if (noSentence && wrongN === 0) {
        reportMode("sentence", { score: 1, total: 1 });
      }
      const sub = noSentence
        ? wrongN > 0
          ? `${wrongN} to retry`
          : "All clear · unit done"
        : wrongN > 0
          ? `${wrongN} to retry · or go to Use`
          : "All clear · next: Use";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Type done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${sub}${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              noSentence
                ? wrongN > 0
                  ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
                     <button type="button" class="btn" id="t-sent-map">← Map</button>`
                  : `<button type="button" class="btn" id="t-again">Try full set</button>
                     <button type="button" class="btn primary" id="t-sent-map">← Map</button>`
                : wrongN > 0
                  ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
                     <button type="button" class="btn" id="t-sent">4 · Use →</button>
                     <button type="button" class="btn" id="t-sent-map">← Map</button>`
                  : `<button type="button" class="btn" id="t-again">Try full set</button>
                     <button type="button" class="btn primary" id="t-sent">4 · Use →</button>`
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
    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        ${frame && it.cz ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.cz)}</div>` : ""}
        <div class="prompt prompt-gap">${frame ? "" : sw(prompt)}${escapeHtml(prompt)}</div>
        <div class="sub">${sub}</div>
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

    return `${passLabel} ${t.pos + 1} / ${passLen} · score ${t.score}${t.retryPass ? "" : deckLabel("type", block.items)}`;
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
      : "Short translations into English · patterns from earlier units.";

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      // Same gate discipline as Quiz/Type: first pass records real score;
      // perfect retry stamps 1/1 cleanPass. Never fruit on partial Use.
      if (!t.retryPass) reportMode("sentence", { score: t.score, total: passLen });
      else if (wrongN === 0) reportMode("sentence", { score: 1, total: 1 });
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Stage done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${
            wrongN > 0
              ? `${wrongN} to retry`
              : doneSub
          }${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="fs-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="fs-map">Back to map →</button>`
                : `<button type="button" class="btn primary" id="fs-map">Back to map →</button>
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
    stage.innerHTML = `
      <div class="q">
        <div class="sub">Sentence <strong>${t.pos + 1}</strong> of <strong>${passLen}</strong>${t.retryPass ? " (retry)" : ""} · write in English</div>
        ${diagramBlock(it)}
        ${structureHint(it)}
        <div class="prompt" style="font-size:1.2rem">${escapeHtml(it.cz)}</div>
        <div class="sub">Translate into English · Enter = check / next</div>
        <textarea class="type-in type-area" id="ti" rows="2" autocomplete="off" spellcheck="false" placeholder="write the English sentence…"></textarea>
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        ${it.gap ? `<button type="button" class="link" id="hint">Hint · frame</button> · ` : ""}
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
    // Scaffold hint for chunk sentences: shows the gap frame, no penalty.
    // "Show answer" stays the give-up; this is the rung below it.
    stage.querySelector("#hint")?.addEventListener("click", () => {
      fb.textContent = `Frame: ${it.gap}`;
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
        t.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        t.missedThis = true;
        fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(it.en)}</span>`;
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
          <button type="button" class="btn" id="soon-map">← Map</button>
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

  function introSection(sec) {
    const table = sec.table
      ? `<table class="intro-table"><thead><tr>${(sec.table.headers || [])
          .map((h) => `<th>${escapeHtml(h)}</th>`)
          .join("")}</tr></thead><tbody>${(sec.table.rows || [])
          .map(
            (r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`
      : "";
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
    const st = root.querySelector("#p-status");
    if (st) st.textContent = status || "";
  }

  render();
}
