/**
 * RUE2 ladder: Intro → Check → Type → Use
 * Production toward English. Diacritics kept where present (not stripped).
 *
 * Shell patterns ported from RUE2 spirit:
 * - single Enter router (state.enterAdvance) — never exits to map
 * - ← Back do mapy is mouse-only (shell #btn-practice-back, tabindex -1)
 * - intro nav: Back / Next · Enter = Next · Backspace = Back
 * - English chrome labels (RUPL lineage cleaned 2026-08-06)
 *
 * Type modes: full_word | ending_gap (morphology packs)
 */

import {
  completeMode,
  touchBlock,
  hasFruit,
  grammarBest,
} from "./progress.js";
import { attachExplain } from "./explain.js?v=2026-08-28-dep-quiz";
import { introDiagram } from "./intro-visuals.js?v=2026-09-02-indmap2";
import { canonSynonyms } from "./synonyms.js";
import { articleVariants, placeVariants, determinerMatch } from "./practice-vocab.js";
import { expandContractions } from "./contractions.js";
import { adaptGrammarPack } from "./pack-adapt.js?v=2026-09-01-matchen";
/* Real again (2026-08-10). The no-op stub left by 7ec4bd1 meant every call
 * site below kept computing item context and throwing it away. */
import { setSmokeContext } from "./smoke-flags.js";

/** Alias for dual-engine shell */
export { startPractice as startGrammarPractice };
/* exported for engine tests only */
export { isCorrect as _gradeGrammar, articleMatch as _articleMatch, gradeGrammarSentence };

/**
 * Default questions per graded stage (Check quiz · Type · Use).
 * Also caps Match board size. Packs should author ≥12 items per stage when possible;
 * shorter banks use all available items (no padding with junk).
 */
export const DEFAULT_PASS = 12;

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const FOCUS_WEIGHT = 3;

/**
 * Up to DEFAULT_PASS items; if onlyIndices set, those items (retry pass).
 * Prefer items tagged with pack focus_structures (weight FOCUS_WEIGHT) so
 * today's pattern appears often while recycle items still enter the bag.
 */
/* One pass = one BLOCK. Blocks are the author's pass units (52 packs use
 * them, almost all sized ~DEFAULT_PASS), and in a1_word_classes — path step
 * 1 — they are three different exercise types: word-class labels, one/more
 * than one, plural forms. Mixing them on one board is incoherent, especially
 * for a first lesson. Repeat visits advance to the next block, so the whole
 * pack is still reachable. Single-block packs are unaffected. */
const BLOCK_TURN_KEY = "rue-exp-block-turn";

function blockTurn(packId, stage, count) {
  if (count <= 1) return 0;
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(BLOCK_TURN_KEY) || "{}") || {};
  } catch {
    store = {};
  }
  const k = `${packId}:${stage}`;
  const turn = Number(store[k] || 0) % count;
  store[k] = (turn + 1) % count;
  try {
    localStorage.setItem(BLOCK_TURN_KEY, JSON.stringify(store));
  } catch {
    /* private mode — rotation degrades to always-first-block */
  }
  return turn;
}

function samplePass(items, onlyIndices, focusStructures, pick) {
  let list = Array.isArray(items) ? items : [];
  if (!list.length) return [];
  if (onlyIndices && onlyIndices.length) {
    return shuffle(onlyIndices.map((i) => list[i]).filter(Boolean));
  }
  if (pick && pick.packId) {
    const blocks = [];
    for (const it of list) {
      if (it && it._block && !blocks.includes(it._block)) blocks.push(it._block);
    }
    if (blocks.length > 1) {
      const b = blocks[blockTurn(pick.packId, pick.stage || "", blocks.length)];
      list = list.filter((it) => it._block === b);
    }
  }
  if (list.length <= DEFAULT_PASS) return shuffle(list.slice());
  const focus = new Set(focusStructures || []);
  const bag = [];
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    let w = 1;
    if (focus.size && it && Array.isArray(it.structures)) {
      if (it.structures.some((s) => focus.has(s))) w = FOCUS_WEIGHT;
    }
    for (let k = 0; k < w; k++) bag.push(i);
  }
  /* shuffle() COPIES (a.slice()) and returns — it does not sort in place.
   * `shuffle(bag);` threw the result away, so every pass took the first
   * DEFAULT_PASS items in authoring order, identically, every time. In
   * a1_and_but_because that meant 8 "and" then 4 "but" and `because` was
   * unreachable — the unit could not teach a third of itself (James,
   * 2026-08-12). Every pack with more than 12 items was affected. */
  const order = shuffle(bag);
  const out = [];
  const used = new Set();
  for (const i of order) {
    if (used.has(i)) continue;
    used.add(i);
    out.push(list[i]);
    if (out.length >= DEFAULT_PASS) break;
  }
  if (pick && pick.minZero > 0) {
    const isZ = (it) =>
      it &&
      (it.answer === "—" ||
        it.zero_article ||
        (it.accepts || []).includes("—"));
    let have = out.filter(isZ).length;
    const extras = shuffle(list.filter((it) => isZ(it) && !out.includes(it)));
    for (const it of extras) {
      if (have >= pick.minZero) break;
      const idx = out.findIndex((x) => !isZ(x));
      if (idx < 0) break;
      out[idx] = it;
      have += 1;
    }
    return shuffle(out);
  }
  return out;
}

/* Clock times, one rule instead of edits on 12 items that would rot (James,
 * 2026-08-13, smoking a1_word_order): "at three o'clock" was the only accepted
 * form, so "at three" and "at 3" both graded wrong — "too strict, demoralising".
 * o'clock is optional in English and the corpus is already inconsistent
 * (`a2_past_continuous` writes "At 8 o'clock"), so both sides are normalised.
 *
 * `one` is deliberately NOT in the table: it is a pronoun in
 * `c1_ellipsis_substitution` ("I would like the big one") and a label in
 * `a1_word_classes`, where accepting "1" would be wrong. two-twelve are
 * unambiguously numerals.
 *
 * GRAMMAR ONLY — never port this to practice-vocab.js: `a1_time_numbers`
 * (84 items) teaches the number WORDS, and there "3" for "three" is the miss. */
const CLOCK_DIGITS = {
  two: "2", three: "3", four: "4", five: "5", six: "6",
  seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12",
};
const CLOCK_WORD_RE = new RegExp(
  `\\b(${Object.keys(CLOCK_DIGITS).join("|")})\\b`,
  "g",
);

/* Contractions expand BEFORE the apostrophe is stripped — otherwise "won't
 * be" becomes "won t be" and never matches "will not be". The vocab engine
 * has folded them since 2026-08-10; this engine never did, so every
 * contraction in every grammar pack graded the long form wrong.
 * (James, 2026-08-20: "I have said a million times to allow both
 * contractions and the full form".) */
/* Diacritics fold on BOTH sides. The target language is English, so the only
 * accented characters that ever reach grading are Czech proper nouns the packs
 * quote — and an English articles unit must not fail "She lives in Karlin"
 * for the missing í (James, 2026-08-24, b1_articles_advanced smoke). Folding
 * both sides means the accented and unaccented spellings both pass. */
function foldDiacritics(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function norm(s) {
  return foldDiacritics(expandContractions(String(s)))
    .toLowerCase()
    .replace(/[!?.,;:"'()]/g, " ")
    // the apostrophe is gone by now, so o'clock reads as "o clock"
    .replace(/\bo clock\b/g, " ")
    .replace(CLOCK_WORD_RE, (w) => CLOCK_DIGITS[w])
    .replace(/\s+/g, " ")
    .trim();
}

function normEnding(s) {
  return foldDiacritics(expandContractions(String(s)))
    .toLowerCase()
    .replace(/[!?.,;:"'()\s]/g, "")
    .trim();
}

function typeModeOf(pack, item) {
  if (item && item.mode) return item.mode;
  if (pack?.type?.mode) return pack.type.mode;
  if (pack?.default_type_mode) return pack.default_type_mode;
  if (pack?.kind === "morphology" || pack?.morphology === true) return "ending_gap";
  /* FCE/CAE Part 3 shape (James, 2026-08-18): sentence gap + capitalised root
   * cue, student produces the WHOLE derived word — prefixes, negatives and
   * stem changes included. ending_gap cannot carry it: that mode types a
   * suffix onto an unchanged stem, and decide→decision has no such stem. */
  if (pack?.kind === "word_formation") return "root_word";
  return "full_word";
}

function fullFormOf(item) {
  if (item.full != null && item.full !== "") return String(item.full);
  if (item.stem != null && item.ending != null) return `${item.stem}${item.ending}`;
  if (item.answer != null) return String(item.answer);
  return "";
}

/* Zero-article items answer with a dash. norm() strips dashes to nothing and
 * acceptsList drops empty forms, so a dash could be CLICKED in Quiz (which
 * compares raw strings) but could never be TYPED correctly — the answer
 * normalised away to nothing. Both sides map to one sentinel instead, so the
 * dash survives grading. Typed "-", an em dash, "no article", "none" and an
 * empty box all count. (James, 2026-08-20: "make the zero article a dash".) */
const ZERO = "§zero";
const ZERO_WORDS = /^(no article|none|nothing|zero|bez clenu|bez členu)$/i;

const DASHES = new Set([
  "-", "_", "‐", "‑", "‒", "–", "—", "―", "−",
]);

function isZeroMark(s) {
  const t = String(s == null ? "" : s).trim();
  if (ZERO_WORDS.test(t)) return true;
  // Every character must be a dash or whitespace — written as a set lookup,
  // not a character class: "_-‐" inside [] is a RANGE that swallows every
  // letter, which briefly made "the" count as a zero mark.
  for (const ch of t) {
    if (!DASHES.has(ch) && !/\s/.test(ch)) return false;
  }
  return true;
}

function acceptsList(item, mode) {
  const raw = [];
  if (mode === "ending_gap") {
    if (item.ending != null) raw.push(item.ending);
    if (Array.isArray(item.accepts)) raw.push(...item.accepts);
    return [...new Set(raw.map(normEnding).filter((x) => x !== ""))];
  }
  if (item.answer != null) raw.push(item.answer);
  if (Array.isArray(item.accepts)) raw.push(...item.accepts);
  return [...new Set(raw.map((r) => (isZeroMark(r) ? ZERO : norm(r))).filter(Boolean))];
}

/* Czech has no articles, so a Czech prompt cannot pick between a and the —
 * the same ruling the vocab engine has carried since 2026-08-11 (617 items).
 * The grammar engine stayed exact because articles are sometimes the point:
 * packs that TEACH articles set strict_articles and keep exact grading, and
 * everywhere else SENTENCE answers fold a/an/the freely — never drop: a
 * missing article stays wrong. Single-word gap answers stay exact in every
 * pack: a gap cueing 'a' is asking about the article.
 * (James, 2026-08-18, from the Martina/Tomáš lessons.) */
let LENIENT_ARTICLES = true;

/* Possessive determiners fold with the articles — Czech marks possession by
 * case, so "v tašce" gives the student no way to know the author wrote "in
 * her bag" rather than "in the bag". Same gate as the articles: packs that
 * TEACH possession set strict_articles. See detFold in practice-vocab.js. */
let LENIENT_POSSESSIVES = true;
let LENIENT_DETERMINERS = true;

function possessiveMatch(u, forms) {
  // DETERMINERS includes a/an/the, so a pack that teaches ARTICLES must switch
  // this off too — otherwise strict_articles would be silently undone here.
  if (!LENIENT_ARTICLES || !LENIENT_POSSESSIVES || !LENIENT_DETERMINERS || !u.includes(" ")) return false;
  return determinerMatch(u, forms);
}

/* Czech `když` is BOTH "if" and "when", so a Czech prompt cannot pick between
 * them. In a REAL conditional they are interchangeable — a2_first_conditional's
 * own intro card says "when · until · as soon as · after behave exactly like
 * if" — and for an always-true sentence "When you heat water, it boils" is if
 * anything the more natural English. But in an UNREAL conditional ("If I had
 * money, I would buy it") "when" is simply wrong, and unreal conditionals are
 * 143 of the 180 If-answers in the course. So unlike every other lenient pass
 * here this one is OPT-IN: packs whose conditionals are REAL set
 * `lenient_if_when`, and everything else keeps exact grading.
 * (James, 2026-08-24: he played the whole Use stage of a2_first_conditional
 * pasting Google Translate's answers and scored 3/12. "When you heat water, it
 * boils" was marked wrong by the very unit that teaches when behaves like if.
 * By his own count this rule rescues half or more of those failures.) */
let LENIENT_IF_WHEN = false;

function ifWhenMatch(u, forms) {
  if (!LENIENT_IF_WHEN || !u.includes(" ")) return false;
  const fold = (s) => s.replace(/\b(if|when)\b/gi, "if");
  const uf = fold(u);
  return forms.some((f) => f.includes(" ") && fold(f) === uf);
}

function articleMatch(u, forms) {
  if (!LENIENT_ARTICLES || !u.includes(" ")) return false;
  const uv = new Set(articleVariants(u));
  for (const f of forms) {
    if (!f.includes(" ")) continue;
    for (const v of articleVariants(f)) {
      if (uv.has(v)) return true;
    }
  }
  return false;
}

/* The same "je tu" ruling as the vocab engine — see placeVariants in
 * practice-vocab.js. Grammar packs that TEACH the contrast set strict_place
 * and keep exact grading; everywhere else an optional locative in an
 * existential sentence stops being a wrong answer. */
let LENIENT_PLACE = true;

function placeMatch(u, forms) {
  if (!LENIENT_PLACE) return false;
  const uv = new Set(placeVariants(u));
  for (const f of forms) {
    for (const v of placeVariants(f)) {
      if (uv.has(v)) return true;
    }
  }
  return false;
}

/* "now" is optional in a present-continuous sentence — the tense already says
 * it, and the Czech cue "(teď)" is there to force the tense, not to demand the
 * word. The corpus writes "now" in some answers and not others, so a student
 * who adds it was marked wrong on one item and one who omits it on the next:
 * "inconsistent. bad pedagogy. both should be allowed" (James, 2026-08-23,
 * smoking a2_present_continuous). Sentence answers only; packs that TEACH
 * the adverb set strict_time. GRAMMAR ONLY, like the clock rule above. */
let LENIENT_TIME = true;
const OPTIONAL_TIME_RE = /\b(right now|just now|at the moment|at this moment|currently|now)\b/g;

function stripTime(s) {
  return String(s).replace(OPTIONAL_TIME_RE, " ").replace(/\s+/g, " ").trim();
}

function timeMatch(u, forms) {
  if (!LENIENT_TIME || !u.includes(" ")) return false;
  const us = stripTime(u);
  if (!us) return false;
  for (const f of forms) {
    if (!f.includes(" ")) continue;
    const fs = stripTime(f);
    if (fs === us) return true;
    if (fs !== f || us !== u) {
      if (articleMatch(us, [fs]) || possessiveMatch(us, [fs]) || placeMatch(us, [fs])) return true;
    }
  }
  return false;
}

function quizChoiceOk(item, choice) {
  const u = norm(choice);
  if (!u) return false;
  if (norm(item.answer) === u) return true;
  return (item.accepts || []).some((a) => norm(a) === u);
}

function quizShowAnswer(item) {
  const seen = new Set();
  const out = [];
  for (const x of [item.answer, ...(item.accepts || [])]) {
    const k = norm(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(String(x).trim());
  }
  return out.join(" / ") || String(item.answer || "");
}

function isCorrect(user, item, mode) {
  if (mode === "ending_gap") {
    const u = normEnding(user);
    if (!u) return false;
    return acceptsList(item, mode).includes(u);
  }
  /* Word formation grades EXACT against answer + gap_accepts. No article
   * folding (single words) and — deliberately — no synonym canonicalisation:
   * a synonym is a different root, and the exam task is "use the word given".
   * Folding shop/store here would mark a wrong exam answer right. */
  if (mode === "root_word") {
    const u = norm(user);
    if (!u) return false;
    return acceptsList(item, "full_word").includes(u);
  }
  const u = isZeroMark(user) ? ZERO : norm(user);
  if (!u) return false;
  const forms = acceptsList(item, mode);
  if (forms.includes(u)) return true;
  // A zero-article item is answered by the absence of a word: nothing else
  // can fold into it, so stop before the lenient passes below.
  if (u === ZERO || forms.includes(ZERO)) return false;
  if (articleMatch(u, forms)) return true;
  if (possessiveMatch(u, forms)) return true;
  if (placeMatch(u, forms)) return true;
  if (timeMatch(u, forms)) return true;
  if (ifWhenMatch(u, forms)) return true;
  // Two names for one thing (shop/store, phone/telephone). The lesson fault
  // that prompted this — "na stole" answered only by desk — was in a GRAMMAR
  // pack, so the rule has to live here too, not only in the vocab engine.
  const uc = canonSynonyms(u);
  if (uc !== u || forms.some((f) => canonSynonyms(f) !== f)) {
    return forms.some((f) => canonSynonyms(f) === uc);
  }
  return false;
}

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function pairPl(p) {
  return p.cz || p.pl || "";
}

function applyGradeFlags(pack) {
  LENIENT_ARTICLES = !pack?.strict_articles;
  LENIENT_POSSESSIVES = !pack?.strict_possessives;
  LENIENT_DETERMINERS = !pack?.strict_determiners;
  LENIENT_PLACE = !pack?.strict_place;
  LENIENT_TIME = !pack?.strict_time;
  // OPT-IN, not opt-out — see ifWhenMatch. Unreal conditionals must stay exact.
  LENIENT_IF_WHEN = !!pack?.lenient_if_when;
}

/** Existing Use grader with this item's pack flags (articles, place, if/when). */
function gradeGrammarSentence(typed, item) {
  const prev = {
    articles: LENIENT_ARTICLES,
    possessives: LENIENT_POSSESSIVES,
    determiners: LENIENT_DETERMINERS,
    place: LENIENT_PLACE,
    time: LENIENT_TIME,
    ifWhen: LENIENT_IF_WHEN,
  };
  applyGradeFlags(item);
  try {
    return isCorrect(
      typed,
      { answer: item?.answer || item?.en, accepts: item?.accepts || [] },
      "full_word",
    );
  } finally {
    LENIENT_ARTICLES = prev.articles;
    LENIENT_POSSESSIVES = prev.possessives;
    LENIENT_DETERMINERS = prev.determiners;
    LENIENT_PLACE = prev.place;
    LENIENT_TIME = prev.time;
    LENIENT_IF_WHEN = prev.ifWhen;
  }
}

/**
 * @param {object} pack
 * @param {HTMLElement} root
 * @param {{ onExit: () => void }} opts
 */
export function startPractice(rawPack, root, opts) {
  applyGradeFlags(rawPack);
  // RUE packs store blocks[].items[]; this ladder wants flat stage banks.
  const pack = adaptGrammarPack(rawPack);
  touchBlock(pack.id);

  const focusStructures =
    Array.isArray(pack.focus_structures) && pack.focus_structures.length
      ? pack.focus_structures
      : Array.isArray(pack.teaches_structures)
        ? pack.teaches_structures
        : [];

  setSmokeContext({
    packId: pack.id || pack.tree_node || "",
    packTitle: pack.title || "",
    stage: "intro",
    checkPhase: "",
    itemIndex: null,
    en: "",
    cz: "",
    gap: "",
    gap_answer: "",
    typed: "",
  });

  const state = {
    stage: "intro",
    reviewStart: opts.startStage || null,
    checkPhase: "match",
    introIndex: 0,
    matchPairs: [],
    matchChoices: {},
    matchSubmitted: false,
    quizItems: [],
    quizIndex: 0,
    quizScore: 0,
    quizWrong: [],
    quizRetryPass: false,
    quizGate: false,
    quizScoreCommitted: false,
    orderItems: [],
    orderIndex: 0,
    orderScore: 0,
    orderWrong: [],
    orderRetryPass: false,
    orderGate: false,
    orderScoreCommitted: false,
    orderPicked: [],
    /** @type {null | object[]} shuffled {t,i} bag for the current order item */
    orderBag: null,
    /** @type {null | object} the item orderBag was shuffled for (invalidates on change) */
    orderBagFor: null,
    typeItems: [],
    typeIndex: 0,
    typeScore: 0,
    typeWrong: [],
    typeRetryPass: false,
    typeGate: false,
    typeScoreCommitted: false,
    useItems: [],
    useIndex: 0,
    useScore: 0,
    useWrong: [],
    useRetryPass: false,
    useGate: false,
    useScoreCommitted: false,
    checkScore: 0,
    checkTotal: 0,
    /** @type {null | (() => void)} */
    enterAdvance: null,
    /** @type {null | (() => void)} */
    onBackKey: null,
    enterOnSelect: false,
    /** @type {null | ((e: KeyboardEvent) => void)} */
    digitHandler: null,
  };

  // ---- RUE2-style key router (one capture handler for the whole practice) ----
  function clearAdvance() {
    if (state.digitHandler) {
      document.removeEventListener("keydown", state.digitHandler, true);
      state.digitHandler = null;
    }
    state.enterAdvance = null;
    state.onBackKey = null;
    state.enterOnSelect = false;
  }

  function isTypingTarget(t) {
    if (!t || !t.closest) return false;
    return !!t.closest("input, textarea, [contenteditable=true]");
  }

  function onPracticeKeydown(e) {
    const t = e.target;

    // Back to map: never leave on Enter/Space — advance ladder instead (RUE2)
    if (t && t.closest && t.closest("#btn-practice-back")) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Enter" && typeof state.enterAdvance === "function") {
          state.enterAdvance();
        }
      }
      return;
    }

    // Esc clears a mis-tapped match token without needing to find it again.
    if (e.key === "Escape" && state.matchBoard && state.matchBoard.sel) {
      e.preventDefault();
      state.matchBoard.sel.el.classList.remove("sel");
      state.matchBoard.sel = null;
      return;
    }

    if (e.key === "Backspace" && typeof state.onBackKey === "function") {
      if (isTypingTarget(t)) return;
      e.preventDefault();
      e.stopPropagation();
      state.onBackKey();
      return;
    }

    if (e.key !== "Enter" || e.shiftKey) return;
    if (t && t.closest && t.closest("textarea")) return;
    if (t && t.tagName === "SELECT" && !state.enterOnSelect) return;

    if (typeof state.enterAdvance !== "function") return;

    e.preventDefault();
    e.stopPropagation();
    state.enterAdvance();
  }

  document.addEventListener("keydown", onPracticeKeydown, true);

  // ---- Ladder: click a stage to jump straight to it (no hard lock) ----
  function onLadderClick(e) {
    const step =
      e.target.closest && e.target.closest(".ladder-step[data-stage]");
    if (!step || !root.contains(step)) return;
    jumpToStage(step.dataset.stage);
  }
  root.addEventListener("click", onLadderClick);

  function teardown() {
    clearAdvance();
    document.removeEventListener("keydown", onPracticeKeydown, true);
    root.removeEventListener("click", onLadderClick);
    root._RUE2UnbindKeys = null;
  }

  root._RUE2UnbindKeys = teardown;

  const exitToMap = () => {
    teardown();
    opts.onExit();
  };

  let justFruitedThisRun = false;

  /**
   * Record progress + fire onFruit when !wasFruit → nowFruit
   * (strict clear gates live in progress.js — never modes-only).
   * Replay (already fruited) is queued from renderDone, without growth.
   */
  function notifyProgress(mode, result) {
    if (typeof opts.onBeforeProgress === "function") opts.onBeforeProgress();
    const r = completeMode(pack.id, mode, result);
    if (r && r.justFruited && typeof opts.onFruit === "function") {
      justFruitedThisRun = true;
      opts.onFruit({ domain: "grammar", packId: pack.id, mode, grow: true });
    }
    if (r && r.review && typeof opts.onReview === "function") {
      opts.onReview(r.review, mode);
    }
    return r;
  }

  function setStage(s) {
    state.stage = s;
    render();
  }

  // Jump to any ladder stage via its proper entry (each initialises its items)
  function jumpToStage(id) {
    if (!id || id === state.stage) return;
    if (id === "intro") setStage("intro");
    else if (id === "check") beginCheck();
    else if (id === "type") beginType();
    else if (id === "use") beginUse();
  }

  /**
   * Label for whatever really comes after Check, so a gate never promises a
   * stage the pack cannot play. Mirrors beginType/beginUse's fall-through:
   * an empty Type stamps 1/1 and hands straight to Use.
   */
  function afterCheckLabel() {
    if ((pack.type_items || []).length) return "Type";
    if ((pack.use_items || []).length) return "Use";
    return "Done";
  }

  function ladderHtml() {
    // Never show a stage that would auto-skip. The rule was written for Use
    // and applied only there (2026-08-13): `a1_word_order` has no gap items,
    // so its Type bank is empty, `beginType` stamps type 1/1 and falls through
    // to Use — and the ladder still drew "3 · Type", so the student was shown
    // a stage they never played and Done reported it 100 %.
    const stepDefs = [
      ["intro", "Intro"],
      ["check", "Check"],
    ];
    if ((pack.type_items || []).length) stepDefs.push(["type", "Type"]);
    if ((pack.use_items || []).length) stepDefs.push(["use", "Use"]);
    const steps = stepDefs.map(([k, label], i) => [k, `${i + 1} · ${label}`]);
    const order = ["intro", "check", "type", "use", "done"];
    const cur = order.indexOf(state.stage);
    const banners = {
      intro: {
        title: "Stage 1 · Intro",
        sub: "Read · Enter = Next · Backspace = Back",
      },
      check: {
        title: "Stage 2 · Check",
        sub:
          state.checkPhase === "sort_bins"
            ? "Sort · drag a word into a column · Enter = check when all placed"
            : state.checkPhase === "quiz"
            ? "Quiz · keys 1–4 · Enter = next"
            : state.checkPhase === "order_click"
              ? "Word order · click the words in order · Enter = next"
              : "Match · left → right · Enter = next when done",
      },
      type: {
        title: "Stage 3 · Type",
        sub: "Type the form · Enter = check · Enter = next",
      },
      use: {
        title: "Stage 4 · Use",
        sub:
          pack.use_hint ||
          "Full sentence in English · Enter = check · Enter = next",
      },
      done: {
        title: "Done",
        sub: "Enter = map",
      },
    };
    const ban = banners[state.stage] || banners.done;
    return `
      <div class="ladder-wrap">
        <div class="ladder" role="list" aria-label="Practice stages">
          ${steps
            .map(([id, label], i) => {
              let cls = "ladder-step";
              if (state.stage === id || (state.stage === "done" && id === "use"))
                cls += " is-current";
              else if (i < cur) cls += " is-done";
              const arrow =
                i < steps.length - 1
                  ? `<span class="ladder-arrow" aria-hidden="true">→</span>`
                  : "";
              return `<button type="button" class="${cls}" data-stage="${id}">${label}</button>${arrow}`;
            })
            .join("")}
        </div>
        <div class="stage-banner">
          <div class="stage-banner-title">${ban.title}</div>
          <div class="stage-banner-sub">${ban.sub}</div>
        </div>
        ${
          pack.title_en
            ? `<div class="unit-gloss">${esc(pack.title_en)}</div>`
            : ""
        }
      </div>`;
  }

  function focusPrimary(sel) {
    const b = root.querySelector(sel);
    if (!b) return;
    try {
      b.focus({ preventScroll: true });
    } catch {
      b.focus();
    }
  }

  // ---- Intro ----
  function renderIntro() {
    clearAdvance();
    const cards = pack.intro || [];
    if (!cards.length) {
      notifyProgress( "intro");
      beginCheck();
      return;
    }
    const card = cards[state.introIndex];
    setSmokeContext({
      stage: "intro",
      checkPhase: "",
      itemIndex: state.introIndex,
      en: card.title || "",
      cz: card.title_cz || card.body_cz || "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
    let body = "";
    if (card.body) body += `<p>${escMd(card.body)}</p>`;
    const bodyCz = card.body_cz || card.body_pl;
    if (bodyCz) body += `<p><em>${escMd(bodyCz)}</em></p>`;

    const diagramBlock = () => {
      let html = "";
      const cells = [];
      if (card.diagram) {
        cells.push({
          diagram: card.diagram,
          caption: card.diagram_caption || "",
          labels: card.labels || [],
        });
      }
      if (Array.isArray(card.diagrams)) {
        for (const d of card.diagrams) {
          if (!d) continue;
          if (typeof d === "string") {
            cells.push({ diagram: d, caption: "", labels: [] });
          } else if (d.diagram) {
            cells.push({
              diagram: d.diagram,
              caption: d.caption || "",
              labels: d.labels || [],
            });
          }
        }
      }
      const one = (cell, small) => {
        const svgMarkup = introDiagram(cell.diagram, cell.labels || []);
        if (!svgMarkup) {
          if (card.diagram_fallback)
            return `<p class="intro-fallback">${escMd(card.diagram_fallback)}</p>`;
          return "";
        }
        if (cell.diagram === "articles_map" || cell.diagram === "indefinite_map")
          return svgMarkup;
        const wrap = small
          ? "intro-scene-wrap intro-scene-wrap-sm"
          : "intro-scene-wrap";
        const pic = `<div class="${wrap}">${svgMarkup}</div>`;
        if (!cell.caption && !small) return pic;
        const cap = cell.caption
          ? `<figcaption>${escMd(cell.caption)}</figcaption>`
          : "";
        return `<figure class="intro-diagram-cell">${pic}${cap}</figure>`;
      };
      if (cells.length > 1) {
        const n = Math.min(cells.length, 4);
        html += `<div class="intro-diagram-grid cols-${n}">`;
        html += cells.map((c) => one(c, true)).join("");
        html += `</div>`;
      } else if (cells.length === 1) {
        html += one(cells[0], false);
      }
      if (card.svg && String(card.svg).trim().startsWith("<svg")) {
        html += `<div class="intro-scene-wrap">${card.svg}</div>`;
      }
      return html;
    };
    const tableBlock = () => {
      const list = [];
      /* Later-cards author a dummy Related table; `links[]` is what renders.
       * A teaching card may keep its real table AND a prerequisite link
       * (James, a2_some_any_no 2026-08-29: jump to Some / any 1). */
      const dummyRelated =
        Array.isArray(card.links) &&
        card.links.length &&
        String((card.table && card.table.headers && card.table.headers[0]) || "")
          .trim()
          .toLowerCase() === "related";
      if (card.table && !dummyRelated) list.push(card.table);
      if (Array.isArray(card.tables)) {
        for (const t of card.tables) if (t && Array.isArray(t.rows)) list.push(t);
      }
      if (!list.length) return "";
      const one = (tbl) => {
        const h = tbl.headers || [];
        return `<table class="intro-table"><thead><tr>${h
          .map((x) => `<th>${escMd(x)}</th>`)
          .join("")}</tr></thead><tbody>${(tbl.rows || [])
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${escMd(c)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`;
      };
      return list.map(one).join("");
    };
    // points[] carries the bulk of the authored teaching on 403 of 557 cards
    // (43 of them have nothing else) — it went unrendered until 2026-08-10.
    const pointsBlock = () => {
      if (!Array.isArray(card.points) || !card.points.length) return "";
      return `<ul class="intro-points">${card.points
        .map((p) => `<li>${escMd(p)}</li>`)
        .join("")}</ul>`;
    };
    const examplesBlock = () => {
      if (!card.examples) return "";
      return card.examples
        .map((ex) => {
          const cz = ex.cz || ex.pl || "";
          let line = `<div class="intro-ex"><span class="pl">${esc(cz)}</span>`;
          if (ex.en) line += ` <span class="en">· ${escMd(ex.en)}</span>`;
          line += `</div>`;
          return line;
        })
        .join("");
    };

    /* Default: schematic before the table so the picture of WHEN lands first
     * (James, 2026-08-26: small timelines on later intro pages).
     * text_first: definition + examples, then the picture (James, 2026-08-28:
     * degree "What they are" opened on the scale, not on what they are). */
    if (card.text_first) {
      body += pointsBlock();
      body += examplesBlock();
      body += tableBlock();
      body += diagramBlock();
    } else {
      body += diagramBlock();
      body += tableBlock();
      body += pointsBlock();
      body += examplesBlock();
    }
    if (card.ref && card.ref.tab) {
      body += `<p class="intro-ref"><button type="button" class="link" id="intro-open-ref">${esc(
        card.ref.label || "Full table",
      )}</button></p>`;
    }
    if (Array.isArray(card.links) && card.links.length) {
      const heads =
        Array.isArray(card.link_headers) && card.link_headers.length
          ? card.link_headers
          : ["Related", "You already know"];
      body += `<table class="intro-table"><thead><tr><th>${escMd(
        heads[0] || "Related",
      )}</th><th>${escMd(heads[1] || "")}</th></tr></thead><tbody>`;
      for (const L of card.links) {
        const id = String(L.id || "").trim();
        if (!/^[a-z][a-z0-9_]*$/i.test(id)) continue;
        const label = esc(L.label || id);
        const note = escMd(L.note || "");
        body += `<tr><td><a class="link" href="#${esc(id)}">${label}</a></td><td>${note}</td></tr>`;
      }
      body += `</tbody></table>`;
    }

    const last = state.introIndex >= cards.length - 1;
    const n = cards.length;
    const i = state.introIndex;
    const sitting = typeof opts.nextSitting === "function" ? opts.nextSitting() : null;

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)}</h2></div>
      ${
        i === 0 && sitting
          ? `<p class="practice-hint">This sitting continues into ${esc(sitting.label)}.</p>`
          : ""
      }
      <div class="intro-card">
        <p class="intro-kicker">Intro · ${i + 1} / ${n}</p>
        ${card.title ? `<h3>${esc(card.title)}</h3>` : ""}
        ${card.title_cz || card.title_pl ? `<p><em>${esc(card.title_cz || card.title_pl)}</em></p>` : ""}
        ${body}
        <div class="nav">
          <button type="button" class="btn" id="btn-prev" ${i === 0 ? "disabled" : ""}>← Back</button>
          <button type="button" class="btn primary" id="btn-next">${
            last ? "Check →" : "Next →"
          }</button>
        </div>
      </div>
    `;

    const goPrev = () => {
      if (state.introIndex > 0) {
        state.introIndex -= 1;
        render();
      }
    };
    const goNext = () => {
      if (last) {
        notifyProgress( "intro");
        beginCheck();
      } else {
        state.introIndex += 1;
        render();
      }
    };

    root.querySelector("#intro-open-ref")?.addEventListener("click", () => {
      if (typeof opts.onOpenReference === "function") {
        opts.onOpenReference(card.ref.tab);
      }
    });
    root.querySelector("#btn-prev")?.addEventListener("click", goPrev);
    root.querySelector("#btn-next")?.addEventListener("click", goNext);
    state.enterAdvance = goNext;
    state.onBackKey = goPrev;
    focusPrimary("#btn-next");
  }

  // ---- Check ----
  /**
   * Match board: up to DEFAULT_PASS pairs (or whole bank if shorter).
   * Shuffle order of left rows and right chips.
   */
  /* Twelve pairs is right for words and a wall of text for sentences. A
   * sentence-to-sentence board gets 8, which is what fits a screen without
   * scrolling. Sized from the content, not per pack, so it holds everywhere.
   * (James, 2026-08-20, smoking a2_first_conditional: "too much words for a
   * single page — they are full sentences, we only need 8, not 12".)
   * 2026-08-29 a1_some_any: char-avg > 24 missed A1 sentences
   * ("I have some coffee." is 20 chars, pack avg 23) and still painted 12.
   * Count as a sentence if it has a .?! or four-plus words — short phrases
   * and single words stay at 12. Word packs of 13–18 split evenly
   * (James, 2026-08-31, Feelings: leftover six is harder to scan than 9+9). */
  function matchBoardSize(pairs) {
    if (!pairs.length) return DEFAULT_PASS;
    const isSentence = (s) => {
      const t = String(s || "").trim();
      const words = t.split(/\s+/).filter(Boolean);
      return words.length >= 4 || /[.?!]/.test(t);
    };
    let n = 0;
    for (const p of pairs) {
      if (isSentence(p.en || p.prompt || "")) n += 1;
    }
    if (n > pairs.length / 2) return 8;
    const N = pairs.length;
    if (N > DEFAULT_PASS && N <= 18) return Math.ceil(N / 2);
    return DEFAULT_PASS;
  }


  /* Sort into bins — classification, NOT matching (James, 2026-08-26).
   * The Match board was being used to put nouns into countable/uncountable,
   * which meant twelve tiles reading "countable" down one side: "you are not
   * really matching things here". Here each word is dragged into a column.
   *
   * Marking happens at the END, once every word is placed (his call): the
   * student commits to a whole sort instead of fishing for green one word at
   * a time. Click-to-place is kept alongside drag — a trackpad drag is fiddly
   * and a student who cannot drag would otherwise be stuck mid-lesson.
   */
  function renderSortBins() {
    const items = state.sortItems;
    const bins = Array.isArray(pack.bins) && pack.bins.length
      ? pack.bins
      : [...new Set(items.map((it) => it.bin))];
    const placed = state.sortPlaced;
    const done = state.sortSubmitted;
    const poolIdx = items.map((_, i) => i).filter((i) => placed[i] == null);
    const allPlaced = poolIdx.length === 0;

    const chip = (i, inBin) => {
      const it = items[i];
      const sel = state.sortSel === i ? " sel" : "";
      let mark = "";
      if (done && inBin) {
        mark = placed[i] === it.bin ? " good" : " bad";
      }
      const cz = it.cz ? `<span class="sb-cz">${esc(it.cz)}</span>` : "";
      const truth =
        done && inBin && placed[i] !== it.bin
          ? `<span class="sb-truth">${esc(it.bin)}</span>`
          : "";
      return `<button type="button" class="sb-chip${sel}${mark}" data-i="${i}"${
        done ? " disabled" : ' draggable="true"'
      }>${escMd(it.en)}${cz}${truth}</button>`;
    };

    const captions = pack.bin_captions && typeof pack.bin_captions === "object"
      ? pack.bin_captions
      : {};
    const cols = bins
      .map(
        (b) => `
        <div class="sb-bin" data-bin="${esc(b)}">
          <h3>${esc(b)}</h3>
          ${captions[b] ? `<p class="sb-cap">${esc(captions[b])}</p>` : ""}
          <div class="sb-drop">${items
            .map((_, i) => i)
            .filter((i) => placed[i] === b)
            .map((i) => chip(i, true))
            .join("")}</div>
        </div>`,
      )
      .join("");

    const score = done
      ? items.filter((it, i) => placed[i] === it.bin).length
      : 0;

    /* Smoke-only: same hatch as Match (James, 2026-08-25 / 2026-08-28).
     * Re-testing Quiz must not pay the sort toll every time. Hidden unless
     * the dev toolbar is up, so students still do the four-box sort. */
    const smokeOn = document.getElementById("smoke-toolbar")?.hidden === false;

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Sort</h2></div>
      <p class="score-line">${
        done
          ? `${score} / ${items.length} correct`
          : `${items.length - poolIdx.length} / ${items.length} placed · drag a word into a column, or click it then click a column${
              smokeOn
                ? ` · <button type="button" class="link" id="sb-skip">skip sort (smoke) →</button>`
                : ""
            }`
      }</p>
      ${
        pack.sort_rule
          ? `<p class="sb-rule">${esc(pack.sort_rule)}</p>`
          : ""
      }
      <div class="sb-pool" id="sb-pool">${poolIdx
        .map((i) => chip(i, false))
        .join("")}</div>
      <div class="sb-bins">${cols}</div>
      <div class="nav">
        ${
          done
            ? `<button type="button" class="primary" id="sb-next">Continue →</button>`
            : `<button type="button" class="primary" id="sb-check"${
                allPlaced ? "" : " disabled"
              }>Check</button>`
        }
      </div>
    `;

    if (done) {
      const goNext = () => {
        if (!state.sortScoreCommitted) {
          state.checkScore += score;
          state.checkTotal += items.length;
          state.sortScoreCommitted = true;
        }
        goToNextCheckPhaseOrType();
      };
      root.querySelector("#sb-next")?.addEventListener("click", goNext);
      state.enterAdvance = goNext;
      focusPrimary("#sb-next");
      return;
    }

    root.querySelector("#sb-skip")?.addEventListener("click", goToNextCheckPhaseOrType);

    const place = (i, bin) => {
      if (i == null || Number.isNaN(i)) return;
      state.sortPlaced[i] = bin;
      state.sortSel = null;
      render();
    };

    root.querySelectorAll(".sb-chip").forEach((el) => {
      const i = Number(el.dataset.i);
      el.addEventListener("click", () => {
        // A placed chip goes back to the pool; a pooled chip gets selected.
        if (state.sortPlaced[i] != null) {
          delete state.sortPlaced[i];
          state.sortSel = null;
        } else {
          state.sortSel = state.sortSel === i ? null : i;
        }
        render();
      });
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        e.dataTransfer.effectAllowed = "move";
      });
    });

    root.querySelectorAll(".sb-bin").forEach((el) => {
      const bin = el.dataset.bin;
      el.addEventListener("click", () => {
        if (state.sortSel != null) place(state.sortSel, bin);
      });
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        el.classList.add("over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("over");
        place(Number(e.dataTransfer.getData("text/plain")), bin);
      });
    });

    const submit = () => {
      if (poolIdx.length) return;   // not all placed — Enter does nothing
      state.sortSubmitted = true;
      render();
    };
    root.querySelector("#sb-check")?.addEventListener("click", submit);
    /* Enter MUST be re-pointed here. Leaving it unset let it keep the intro's
     * action (beginCheck), so pressing Enter after placing every word wiped
     * sortPlaced and restarted the sort at 0/12 — James, first play. */
    state.enterAdvance = submit;
    if (allPlaced) focusPrimary("#sb-check");
  }

  function newMatchBoard() {
    const pool = pack.match || [];
    const sampled = samplePass(pool, null, focusStructures, {
      packId: pack.id,
      stage: "match",
    });
    const raw = sampled.slice(0, matchBoardSize(sampled));
    const leftSrc = shuffle(raw);
    const left = leftSrc.map((p, i) => ({
      id: i,
      t: p.en || p.prompt || "",
      ans: pairPl(p),
    }));
    // Right chips: same pairs, independent shuffle; id must match left's pair
    // Rebuild right from left so ids stay aligned with ans
    const right = shuffle(
      left.map((row) => ({
        id: row.id,
        t: row.ans,
      })),
    );
    state.matchBoard = {
      left,
      right,
      sel: null,
      doneLeft: new Set(),
      doneRight: new Set(),
      total: left.length,
      wrongFlash: 0,
    };
  }

  function beginCheck() {
    state.stage = "check";
    state.checkPhase = "match";
    state.matchSubmitted = false;
    state.matchBoard = null;
    state.quizItems = samplePass(pack.quiz || [], null, focusStructures, {
      packId: pack.id,
      stage: "quiz",
      minZero: pack.quiz_axis === "articles" ? 3 : 0,
    });
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizWrong = [];
    state.quizRetryPass = false;
    state.quizGate = false;
    state.quizScoreCommitted = false;
    state.orderItems = samplePass(pack.order || [], null, focusStructures, {
      packId: pack.id,
      stage: "order",
    });
    state.orderIndex = 0;
    state.orderScore = 0;
    state.orderWrong = [];
    state.orderRetryPass = false;
    state.orderGate = false;
    state.orderScoreCommitted = false;
    state.orderPicked = [];
    state.orderBag = null;
    state.orderBagFor = null;
    const sortBank = pack.sortbins || [];
    state.sortItems = sortBank.length <= 16
      ? shuffle(sortBank.slice())
      : samplePass(sortBank, null, focusStructures, {
          packId: pack.id,
          stage: "sortbins",
        });
    state.sortPlaced = {};
    state.sortSubmitted = false;
    state.sortSel = null;
    state.sortScoreCommitted = false;
    state.checkScore = 0;
    state.checkTotal = 0;
    const hasSort = state.sortItems.length > 0;
    const hasMatch = (pack.match || []).length > 0;
    const hasQuiz = state.quizItems.length > 0;
    const hasOrder = state.orderItems.length > 0;
    if (!hasSort && !hasMatch && !hasQuiz && !hasOrder) {
      notifyProgress( "check", { score: 1, total: 1 });
      beginType();
      return;
    }
    if (hasSort) state.checkPhase = "sort_bins";
    else if (hasMatch) newMatchBoard();
    else if (hasQuiz) state.checkPhase = "quiz";
    else state.checkPhase = "order_click";
    render();
  }

  /**
   * Check has up to three phases in a fixed order: match -> quiz -> order_click.
   * Called when the CURRENT phase is fully done; moves to the next phase that
   * actually has items, or closes out Check and starts Type. Order_click is
   * last today because only a1_word_order uses it and it has neither match
   * nor quiz — a pack combining all three would still resolve correctly.
   */
  function goToNextCheckPhaseOrType() {
    /* sort_bins runs first — classify, then work with the classes. Coming OUT
     * of it we fall through to Match if the pack has one. */
    if (state.checkPhase === "sort_bins" && (pack.match || []).length) {
      newMatchBoard();
      state.checkPhase = "match";
      render();
      return;
    }
    if (state.checkPhase !== "quiz" && state.checkPhase !== "order_click" && state.quizItems.length) {
      state.checkPhase = "quiz";
      render();
      return;
    }
    if (state.checkPhase !== "order_click" && state.orderItems.length) {
      state.checkPhase = "order_click";
      render();
      return;
    }
    const s = state.checkTotal ? state.checkScore : 1;
    const t = state.checkTotal || 1;
    notifyProgress( "check", { score: s, total: t });
    beginType();
  }

  function beginQuizRetry() {
    const wrong = state.quizWrong.slice();
    if (!wrong.length) return;
    state.quizItems = shuffle(wrong);
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizWrong = [];
    state.quizRetryPass = true;
    state.quizGate = false;
    // Retry does not re-commit into checkScore
    state.checkPhase = "quiz";
    render();
  }

  /**
   * RUE2-style two-column match: click left, click right.
   * Instant pair feedback · no dropdowns · no page scroll needed.
   */
  function renderMatch() {
    clearAdvance();
    if (!state.matchBoard) newMatchBoard();
    const m = state.matchBoard;
    const doneCount = m.doneLeft.size;
    setSmokeContext({
      stage: "check",
      checkPhase: "match",
      itemIndex: doneCount,
      en: (m.left || []).map((x) => x.t).join(" | ").slice(0, 120),
      cz: "",
      gap: "",
      gap_answer: (m.right || []).map((x) => x.t).join(" | ").slice(0, 120),
      typed: "",
    });

    // Finished board
    if (m.total > 0 && doneCount >= m.total) {
      // Full credit for completing the board (wrong tries already flashed)
      if (!state.matchSubmitted) {
        state.checkScore += m.total;
        state.checkTotal += m.total;
        state.matchSubmitted = true;
      }
      root.innerHTML = `
        ${ladderHtml()}
        <div class="practice-head"><h2>${esc(pack.title)} · Match</h2></div>
        <p class="practice-prompt">Matched ${doneCount} / ${m.total}</p>
        <p class="practice-hint">Enter = next</p>
        <div class="nav">
          <button type="button" class="btn" id="m-again">Try again</button>
          <button type="button" class="btn primary" id="m-next">${
            state.quizItems.length
              ? "Next to quiz →"
              : state.orderItems.length
                ? "Next to word order →"
                : "Next →"
          }</button>
        </div>
      `;
      root.querySelector("#m-again")?.addEventListener("click", () => {
        state.matchSubmitted = false;
        newMatchBoard();
        // undo score from previous complete if replaying
        state.checkScore = Math.max(0, state.checkScore - m.total);
        state.checkTotal = Math.max(0, state.checkTotal - m.total);
        render();
      });
      const goNext = goToNextCheckPhaseOrType;
      root.querySelector("#m-next")?.addEventListener("click", goNext);
      state.enterAdvance = goNext;
      focusPrimary("#m-next");
      return;
    }

    const col = (arr, side) =>
      arr
        .map((x) => {
          const done =
            side === "L" ? m.doneLeft.has(x.id) : m.doneRight.has(x.id);
          const cls = done ? "m done" : "m";
          const label = done ? "✓ " + x.t : x.t;
          return `<button type="button" class="${cls}" data-side="${side}" data-id="${x.id}" ${
            done ? "disabled" : ""
          }>${escMd(label)}</button>`;
        })
        .join("");

    // Smoke-only escape hatch: re-testing the quiz must not pay the match
    // toll every time (James, 2026-08-25). Gated on the dev toolbar, so
    // students never see it — their Check stays match → quiz.
    const smokeOn = document.getElementById("smoke-toolbar")?.hidden === false;
    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Match</h2></div>
      <p class="score-line">${doneCount} / ${m.total} · click left, then right · click again (or Esc) to deselect${
        smokeOn ? ` · <button type="button" class="link" id="m-skip">skip match (smoke) →</button>` : ""
      }</p>
      <div class="match" id="match-board">
        <div class="match-col">${col(m.left, "L")}</div>
        <div class="match-col">${col(m.right, "R")}</div>
      </div>
    `;
    root.querySelector("#m-skip")?.addEventListener("click", goToNextCheckPhaseOrType);

    root.querySelectorAll(".m:not(.done)").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        const id = Number(btnEl.dataset.id);
        const side = btnEl.dataset.side;
        if (!m.sel) {
          m.sel = { id, side, el: btnEl };
          btnEl.classList.add("sel");
          return;
        }
        if (m.sel.el === btnEl) {
          // De-click: tapped the selected token again → clear it.
          btnEl.classList.remove("sel");
          m.sel = null;
          return;
        }
        if (m.sel.side === side) {
          m.sel.el.classList.remove("sel");
          m.sel = { id, side, el: btnEl };
          btnEl.classList.add("sel");
          return;
        }
        const leftId = m.sel.side === "L" ? m.sel.id : id;
        const rightId = m.sel.side === "R" ? m.sel.id : id;
        const leftRow = m.left.find((x) => x.id === leftId);
        const rightRow = m.right.find((x) => x.id === rightId);
        /* Two ways a pair can be right — never grade by instance id alone.
         * 1. Repeating LEFT labels (a1_word_classes: three tiles "verb"):
         *    any left with that label matches a right whose partner shares it
         *    (James, 2026-08-12).
         * 2. Repeating RIGHT labels (dependent preps: several "to" / "for"):
         *    the right chip's text is this left's answer. Instance matching
         *    marked married→to wrong when the chip belonged to belong
         *    (James, 2026-08-28). */
        const truePartner = rightRow
          ? m.left.find((x) => x.id === rightRow.id)
          : null;
        const byLeftLabel =
          truePartner && norm(truePartner.t) === norm(leftRow && leftRow.t);
        const byRightText =
          leftRow &&
          rightRow &&
          norm(leftRow.ans) === norm(rightRow.t);
        const ok =
          leftRow &&
          rightRow &&
          (byLeftLabel || byRightText) &&
          !m.doneLeft.has(leftId) &&
          !m.doneRight.has(rightId);

        if (ok) {
          m.doneLeft.add(leftId);
          m.doneRight.add(rightId);
          m.sel.el.classList.remove("sel");
          m.sel.el.classList.add("done");
          m.sel.el.disabled = true;
          m.sel.el.textContent =
            "✓ " + m.sel.el.textContent.replace(/^✓\s*/, "");
          btnEl.classList.add("done");
          btnEl.disabled = true;
          btnEl.textContent = "✓ " + btnEl.textContent.replace(/^✓\s*/, "");
          m.sel = null;
          const nextDone = m.doneLeft.size;
          setTimeout(() => render(), nextDone >= m.total ? 280 : 0);
        } else {
          const a = m.sel.el;
          a.classList.add("wrong");
          btnEl.classList.add("wrong");
          setTimeout(() => {
            a.classList.remove("wrong");
            btnEl.classList.remove("wrong");
            // Only drop the highlight if nothing was picked during the flash —
            // a fast re-tap would otherwise leave m.sel set but nothing lit.
            if (m.sel?.el !== a) a.classList.remove("sel");
            if (m.sel?.el !== btnEl) btnEl.classList.remove("sel");
          }, 450);
          m.sel = null;
        }
      });
    });
  }

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

  function renderQuizGate() {
    clearAdvance();
    const total = state.quizItems.length || 1;
    const score = state.quizScore;
    const wrongN = state.quizWrong.length;
    // Commit quiz score once (not on every re-render). Check is recorded
    // HERE, on reaching the gate — not on clicking through to Type. Both
    // the ladder (jumpToStage -> beginType) and leaving the unit bypass that
    // click, which silently lost a finished Check and left units stuck at
    // 3/4 (James, 2026-08-05). Type and Use already commit on gate
    // render; this makes Check behave the same.
    if (!state.quizScoreCommitted && !state.quizRetryPass) {
      state.checkScore += score;
      state.checkTotal += total;
      state.quizScoreCommitted = true;
      notifyProgress( "check", {
        score: state.checkScore,
        total: state.checkTotal,
      });
    }
    // Clearing every mistake in the retry rounds counts as a full pass —
    // mastery through correction, not first-try perfection.
    if (state.quizRetryPass && wrongN === 0) {
      notifyProgress( "check", { score: 1, total: 1 });
    }
    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Quiz · Done</h2></div>
      <p class="practice-prompt">Score: <strong>${score} / ${total}</strong></p>
      <p class="practice-hint">${
        wrongN > 0
          ? `${wrongN} wrong · retry or continue`
          : `All clear · next: ${state.orderItems.length ? "Word order" : afterCheckLabel()}`
      }${state.quizRetryPass ? " · retry pass" : ""}</p>
      <div class="nav">
        ${
          wrongN > 0
            ? `<button type="button" class="btn primary" id="q-retry">Retry wrong (${wrongN})</button>
               <button type="button" class="btn" id="q-next">${state.orderItems.length ? "Next to word order →" : `Next to ${afterCheckLabel()} →`}</button>`
            : `<button type="button" class="btn" id="q-again">Try full set</button>
               <button type="button" class="btn primary" id="q-next">${state.orderItems.length ? "Next to word order →" : `Next to ${afterCheckLabel()} →`}</button>`
        }
      </div>
      ${
        wrongN > 0
          ? `<button type="button" class="link" id="q-again">Try full set</button>`
          : ""
      }
    `;
    const goType = goToNextCheckPhaseOrType;
    root.querySelector("#q-next")?.addEventListener("click", goType);
    root.querySelector("#q-retry")?.addEventListener("click", () => beginQuizRetry());
    root.querySelector("#q-again")?.addEventListener("click", () => {
      if (state.quizScoreCommitted) {
        state.checkScore = Math.max(0, state.checkScore - score);
        state.checkTotal = Math.max(0, state.checkTotal - total);
        state.quizScoreCommitted = false;
      }
      state.quizItems = samplePass(pack.quiz || [], null, focusStructures, {
      packId: pack.id,
      stage: "quiz",
      minZero: pack.quiz_axis === "articles" ? 3 : 0,
    });
      state.quizIndex = 0;
      state.quizScore = 0;
      state.quizWrong = [];
      state.quizRetryPass = false;
      state.quizGate = false;
      state.checkPhase = "quiz";
      render();
    });
    state.enterAdvance = wrongN > 0 ? () => beginQuizRetry() : goType;
    focusPrimary(wrongN > 0 ? "#q-retry" : "#q-next");
  }

  function itemDiagramHtml(item) {
    if (!item || !item.diagram) return "";
    const markup = introDiagram(item.diagram, []);
    if (!markup) return "";
    return `<div class="item-scene-wrap">${markup}</div>`;
  }

  function renderQuiz() {
    clearAdvance();
    const items = state.quizItems;
    if (state.quizGate || state.quizIndex >= items.length) {
      if (!state.quizGate) state.quizGate = true;
      renderQuizGate();
      return;
    }
    const item = items[state.quizIndex];
    setSmokeContext({
      stage: "check",
      checkPhase: "quiz",
      itemIndex: state.quizIndex,
      en: item.prompt || "",
      cz: item.cz || "",
      // Word formation: the root cue is the item's identity — a flag without
      // it says "He showed great ____" and nothing else.
      gap: item.root || "",
      gap_answer: item.answer || "",
      typed: "",
    });
    const choices = shuffle((item.choices || []).slice());
    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Quiz</h2></div>
      <p class="score-line">${state.quizIndex + 1} / ${items.length} · score ${state.quizScore}${
        state.quizRetryPass ? " · retry" : ""
      }</p>
      <div class="item-stem">
        <div class="item-stem-text">
          <p class="practice-prompt">${esc(item.prompt)}${
            item.root ? ` <span class="wf-root">${esc(item.root)}</span>` : ""
          }</p>
          ${item.cz ? `<p class="practice-hint">${esc(item.cz)}</p>` : ""}
          <p class="practice-hint">Keys <strong>1–${choices.length}</strong> · then <strong>Enter</strong> = next (always)</p>
        </div>
        ${itemDiagramHtml(item)}
      </div>
      <div class="choices" id="choices"></div>
      <div class="feedback" id="feedback"></div>
    `;
    const box = root.querySelector("#choices");
    let locked = false;
    let advanceTimer = null;

    const goNextQ = () => {
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      state.quizIndex += 1;
      if (state.quizIndex >= items.length) state.quizGate = true;
      render();
    };

    const pick = (i) => {
      if (locked || i < 0 || i >= choices.length) return;
      locked = true;
      const c = choices[i];
      const buttons = [...box.querySelectorAll(".choice")];
      const good = quizChoiceOk(item, c);
      if (good) state.quizScore += 1;
      else if (!state.quizWrong.includes(item)) state.quizWrong.push(item);
      if (buttons[i]) buttons[i].classList.add(good ? "is-correct" : "is-wrong");
      buttons.forEach((ch) => {
        ch.disabled = true;
        if (quizChoiceOk(item, ch.dataset.answer)) ch.classList.add("is-correct");
      });
      const fb = root.querySelector("#feedback");
      fb.className = "feedback " + (good ? "ok" : "bad");
      fb.textContent = good ? "✓ Correct" : `→ ${quizShowAnswer(item)}`;
      attachExplain(fb, item, () => {
        if (advanceTimer) {
          clearTimeout(advanceTimer);
          advanceTimer = null;
        }
      });
      // Always wait for Enter after MC (right or wrong) — no auto-advance.
      state.enterAdvance = goNextQ;
    };

    function onDigit(e) {
      if (e.target.closest("input, textarea, select")) return;
      if (locked) return;
      const n = quizKeyToIndex(e, choices.length);
      if (n != null) {
        e.preventDefault();
        e.stopPropagation();
        pick(n);
      }
    }
    state.digitHandler = onDigit;
    document.addEventListener("keydown", onDigit, true);

    choices.forEach((c, i) => {
      const b = el(
        `<button type="button" class="choice" data-answer="${escAttr(c)}"><span class="knum">${i + 1}</span> ${esc(c)}</button>`,
      );
      b.addEventListener("click", () => pick(i));
      box.appendChild(b);
    });

    if (document.activeElement && root.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  function beginOrderRetry() {
    const wrong = state.orderWrong.slice();
    if (!wrong.length) return;
    state.orderItems = shuffle(wrong);
    state.orderIndex = 0;
    state.orderScore = 0;
    state.orderWrong = [];
    state.orderRetryPass = true;
    state.orderGate = false;
    state.orderPicked = [];
    state.checkPhase = "order_click";
    render();
  }

  function renderOrderGate() {
    clearAdvance();
    const total = state.orderItems.length || 1;
    const score = state.orderScore;
    const wrongN = state.orderWrong.length;
    // Same rationale as the quiz gate (James, 2026-08-05): commit on reaching
    // the gate, not on clicking through — leaving early must not lose credit.
    if (!state.orderScoreCommitted && !state.orderRetryPass) {
      state.checkScore += score;
      state.checkTotal += total;
      state.orderScoreCommitted = true;
      notifyProgress( "check", {
        score: state.checkScore,
        total: state.checkTotal,
      });
    }
    if (state.orderRetryPass && wrongN === 0) {
      notifyProgress( "check", { score: 1, total: 1 });
    }
    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Word order · Done</h2></div>
      <p class="practice-prompt">Score: <strong>${score} / ${total}</strong></p>
      <p class="practice-hint">${
        wrongN > 0
          ? `${wrongN} wrong · retry or go to ${afterCheckLabel()}`
          : `All clear · next: ${afterCheckLabel()}`
      }${state.orderRetryPass ? " · retry pass" : ""}</p>
      <div class="nav">
        ${
          wrongN > 0
            ? `<button type="button" class="btn primary" id="o-retry">Retry wrong (${wrongN})</button>
               <button type="button" class="btn" id="o-next">Next to ${afterCheckLabel()} →</button>`
            : `<button type="button" class="btn" id="o-again">Try full set</button>
               <button type="button" class="btn primary" id="o-next">Next to ${afterCheckLabel()} →</button>`
        }
      </div>
      ${
        wrongN > 0
          ? `<button type="button" class="link" id="o-again">Try full set</button>`
          : ""
      }
    `;
    const goType = goToNextCheckPhaseOrType;
    root.querySelector("#o-next")?.addEventListener("click", goType);
    root.querySelector("#o-retry")?.addEventListener("click", () => beginOrderRetry());
    root.querySelector("#o-again")?.addEventListener("click", () => {
      if (state.orderScoreCommitted) {
        state.checkScore = Math.max(0, state.checkScore - score);
        state.checkTotal = Math.max(0, state.checkTotal - total);
        state.orderScoreCommitted = false;
      }
      state.orderItems = samplePass(pack.order || [], null, focusStructures, {
      packId: pack.id,
      stage: "order",
    });
      state.orderIndex = 0;
      state.orderScore = 0;
      state.orderWrong = [];
      state.orderRetryPass = false;
      state.orderGate = false;
      state.orderPicked = [];
      state.checkPhase = "order_click";
      render();
    });
    state.enterAdvance = wrongN > 0 ? () => beginOrderRetry() : goType;
    focusPrimary(wrongN > 0 ? "#o-retry" : "#o-next");
  }

  /**
   * Click-to-order: item.tokens[] shuffled as buttons; clicking appends to a
   * growing preview and disables that button. Auto-checks against `accepts`
   * once every token is placed — no separate Check button, matching the
   * quiz's immediate-feedback feel. "Clear" restarts the same item without
   * counting as a second try.
   */
  function renderOrderClick() {
    clearAdvance();
    const items = state.orderItems;
    if (state.orderGate || state.orderIndex >= items.length) {
      if (!state.orderGate) state.orderGate = true;
      renderOrderGate();
      return;
    }
    const item = items[state.orderIndex];
    const picked = state.orderPicked;
    setSmokeContext({
      stage: "check",
      checkPhase: "order_click",
      itemIndex: state.orderIndex,
      en: item.answer || "",
      cz: item.cz || "",
      gap: "",
      gap_answer: item.tokens.join(" "),
      typed: picked.map((p) => p.t).join(" "),
    });

    if (!state.orderBag || state.orderBagFor !== item) {
      state.orderBag = shuffle(item.tokens.map((t, i) => ({ t, i })));
      state.orderBagFor = item;
    }
    const bag = state.orderBag;
    const answered = picked.length >= item.tokens.length;

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Word order</h2></div>
      <p class="score-line">${state.orderIndex + 1} / ${items.length} · score ${state.orderScore}${
        state.orderRetryPass ? " · retry" : ""
      }</p>
      <p class="practice-prompt">${esc(item.cz || "")}</p>
      <p class="practice-hint">Click the words in order · Enter = next once answered</p>
      <div class="order-built" id="order-built">${
        picked.length
          ? picked.map((p) => `<span class="order-chip placed">${esc(p.t)}</span>`).join(" ")
          : `<span class="order-placeholder">…</span>`
      }</div>
      <div class="order-bag" id="order-bag"></div>
      <div class="nav">
        ${
          answered
            ? `<button type="button" class="btn primary" id="o-next">Next →</button>`
            : `<button type="button" class="btn" id="o-clear" ${picked.length ? "" : "disabled"}>Clear</button>`
        }
      </div>
      <div class="feedback" id="feedback"></div>
    `;

    const box = root.querySelector("#order-bag");
    const usedIdx = new Set(picked.map((p) => p.i));
    bag.forEach(({ t, i }) => {
      const used = usedIdx.has(i);
      const b = el(
        `<button type="button" class="order-token" data-i="${i}" ${
          used || answered ? "disabled" : ""
        }>${esc(t)}</button>`,
      );
      if (!used && !answered) {
        b.addEventListener("click", () => {
          state.orderPicked.push({ t, i });
          render();
        });
      }
      box.appendChild(b);
    });

    if (!answered) {
      root.querySelector("#o-clear")?.addEventListener("click", () => {
        state.orderPicked = [];
        render();
      });
    }

    if (answered) {
      const built = picked.map((p) => p.t).join(" ");
      const good = [item.answer, ...(item.accepts || [])].some(
        (a) => norm(a) === norm(built),
      );
      if (good) state.orderScore += 1;
      else if (!state.orderWrong.includes(item)) state.orderWrong.push(item);
      const fb = root.querySelector("#feedback");
      fb.className = "feedback " + (good ? "ok" : "bad");
      fb.textContent = good ? "✓ Correct" : `→ ${item.answer}`;
      attachExplain(fb, item);
      const goNext = () => {
        state.orderIndex += 1;
        state.orderPicked = [];
        state.orderBag = null;
        if (state.orderIndex >= items.length) state.orderGate = true;
        render();
      };
      state.enterAdvance = goNext;
      root.querySelector("#o-next")?.addEventListener("click", goNext);
      focusPrimary("#o-next");
    }

    if (document.activeElement && root.contains(document.activeElement) && !answered) {
      document.activeElement.blur();
    }
  }

  function beginType(onlyWrong) {
    state.stage = "type";
    state.typeGate = false;
    state.typeScoreCommitted = false;
    if (onlyWrong && onlyWrong.length) {
      state.typeItems = shuffle(onlyWrong.slice());
      state.typeRetryPass = true;
    } else {
      const raw = pack.type_items || [];
      state.typeItems =
        pack.type_order === "as_authored"
          ? raw.slice()
          : samplePass(raw, null, focusStructures, {
              packId: pack.id,
              stage: "type",
              minZero: pack.quiz_axis === "articles" ? 3 : 0,
            });
      state.typeRetryPass = false;
    }
    state.typeIndex = 0;
    state.typeScore = 0;
    state.typeWrong = [];
    if (!state.typeItems.length) {
      notifyProgress( "type", { score: 1, total: 1 });
      beginUse();
      return;
    }
    render();
  }

  function beginUse(onlyWrong) {
    state.stage = "use";
    state.useGate = false;
    state.useScoreCommitted = false;
    if (onlyWrong && onlyWrong.length) {
      state.useItems = shuffle(onlyWrong.slice());
      state.useRetryPass = true;
    } else {
      state.useItems = samplePass(pack.use_items || [], null, focusStructures, {
        packId: pack.id,
        stage: "use",
        minZero: pack.quiz_axis === "articles" ? 3 : 0,
      });
      state.useRetryPass = false;
    }
    state.useIndex = 0;
    state.useScore = 0;
    state.useWrong = [];
    if (!state.useItems.length) {
      // No Use bank: stage is absent, not failed — stamp clear (1/1).
      notifyProgress("use", { score: 1, total: 1 });
      state.stage = "done";
      render();
      return;
    }
    render();
  }

  function renderTypedGate(kind) {
    clearAdvance();
    const items = kind === "type" ? state.typeItems : state.useItems;
    const score = kind === "type" ? state.typeScore : state.useScore;
    const wrong = kind === "type" ? state.typeWrong : state.useWrong;
    const retryPass =
      kind === "type" ? state.typeRetryPass : state.useRetryPass;
    const total = items.length || 1;
    const wrongN = wrong.length;
    const title = kind === "type" ? "Type" : "Use";
    const nextLabel =
      kind === "type" && (pack.use_items || []).length
        ? "Next to Use →"
        : "Finish · summary →";

    if (kind === "type" && !state.typeScoreCommitted && !retryPass) {
      notifyProgress( "type", { score, total });
      state.typeScoreCommitted = true;
    }
    if (kind === "use" && !state.useScoreCommitted && !retryPass) {
      notifyProgress( "use", { score, total });
      state.useScoreCommitted = true;
    }
    // Clearing every mistake in the retry rounds counts as a full pass —
    // mastery through correction, not first-try perfection.
    if (retryPass && wrongN === 0) {
      notifyProgress( kind, { score: 1, total: 1 });
    }

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · ${title} · Done</h2></div>
      <p class="practice-prompt">${
        kind === "use" && pack.use_mode === "open"
          ? `Wrote <strong>${score} / ${total}</strong>`
          : `Score: <strong>${score} / ${total}</strong>`
      }</p>
      <p class="practice-hint">${
        wrongN > 0
          ? `${wrongN} wrong · retry or continue`
          : kind === "type"
            ? "All clear · next: Use"
            : pack.use_mode === "open"
              ? "All written · summary"
              : "All clear · summary"
      }${retryPass ? " · retry pass" : ""}</p>
      <div class="nav">
        ${
          wrongN > 0
            ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
               <button type="button" class="btn" id="t-next">${nextLabel}</button>`
            : `<button type="button" class="btn" id="t-again">Try full set</button>
               <button type="button" class="btn primary" id="t-next">${nextLabel}</button>`
        }
      </div>
      ${
        wrongN > 0
          ? `<button type="button" class="link" id="t-again">Try full set</button>`
          : ""
      }
    `;

    const goNext = () => {
      if (kind === "type") beginUse();
      else {
        state.stage = "done";
        render();
      }
    };
    const retry = () => {
      if (kind === "type") beginType(wrong.slice());
      else beginUse(wrong.slice());
    };
    const again = () => {
      if (kind === "type") {
        state.typeScoreCommitted = false;
        beginType();
      } else {
        state.useScoreCommitted = false;
        beginUse();
      }
    };

    root.querySelector("#t-next")?.addEventListener("click", goNext);
    root.querySelector("#t-retry")?.addEventListener("click", retry);
    root.querySelector("#t-again")?.addEventListener("click", again);
    state.enterAdvance = wrongN > 0 ? retry : goNext;
    focusPrimary(wrongN > 0 ? "#t-retry" : "#t-next");
  }

  /* use_mode: "open" — produce-first, not graded (b1_suffixes spec 2026-08-30).
   * Sample stays locked until the student has written something. */
  function renderOpenUse(item, idx, total, score) {
    clearAdvance();
    const prompt = item.prompt || item.use_prompt || "Write a few sentences.";
    const sample = item.sample || item.answer || item.en || "";
    const targets = Array.isArray(item.targets) ? item.targets.filter(Boolean) : [];
    setSmokeContext({
      stage: "use",
      checkPhase: "",
      itemIndex: idx,
      en: sample,
      cz: item.cz || "",
      gap: targets.join(" "),
      gap_answer: sample,
      typed: "",
    });
    const chips = targets.length
      ? `<p class="use-targets">${targets
          .map((t) => `<span class="use-target">${esc(t)}</span>`)
          .join("")}</p>`
      : "";
    const cz = item.cz
      ? `<p class="practice-hint">${esc(item.cz)}</p>`
      : "";

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Use</h2></div>
      <p class="score-line">${idx + 1} / ${total} · write first, then sample</p>
      <p class="fix-label">Write a few sentences</p>
      <div class="item-stem">
        <div class="item-stem-text">
          <p class="practice-prompt">${esc(prompt)}</p>
          ${cz}
          ${chips}
        </div>
      </div>
      <textarea id="ans" class="type-in type-area use-open-area" rows="4" autocomplete="off" spellcheck="true" lang="en" placeholder="Write something…"></textarea>
      <div class="input-row">
        <button type="button" class="btn primary" id="btn-submit">Show sample</button>
      </div>
      <div class="feedback" id="feedback"></div>
    `;

    const input = root.querySelector("#ans");
    const btn = root.querySelector("#btn-submit");
    const fb = root.querySelector("#feedback");
    input.focus();

    let revealed = false;

    const goNext = () => {
      state.useIndex += 1;
      if (state.useIndex >= state.useItems.length) state.useGate = true;
      render();
    };

    const reveal = () => {
      if (revealed) {
        goNext();
        return;
      }
      if (!input.value.trim()) {
        fb.className = "feedback bad";
        fb.textContent = "Write something first — then the sample unlocks.";
        input.focus();
        return;
      }
      revealed = true;
      state.useScore += 1;
      input.disabled = true;
      fb.className = "feedback ok";
      fb.innerHTML = sample
        ? `<span class="use-sample-label">Sample</span> ${esc(sample)}`
        : "Saved.";
      btn.textContent = "Next →";
      focusPrimary("#btn-submit");
      state.enterAdvance = goNext;
    };

    btn.addEventListener("click", reveal);
    state.enterAdvance = reveal;
  }

  function renderTypedStage(kind) {
    clearAdvance();
    const items = kind === "type" ? state.typeItems : state.useItems;
    const idx = kind === "type" ? state.typeIndex : state.useIndex;
    const score = kind === "type" ? state.typeScore : state.useScore;
    const gate = kind === "type" ? state.typeGate : state.useGate;
    const retryPass =
      kind === "type" ? state.typeRetryPass : state.useRetryPass;

    if (gate || idx >= items.length) {
      if (kind === "type") state.typeGate = true;
      else state.useGate = true;
      renderTypedGate(kind);
      return;
    }

    const item = items[idx];
    if (kind === "use" && item && item.open) {
      renderOpenUse(item, idx, items.length, score);
      return;
    }
    const mode = kind === "use" ? "full_word" : typeModeOf(pack, item);
    const isGap = mode === "ending_gap" && item.stem != null;
    const isRoot = mode === "root_word" && item.root;
    const prompt =
      item.prompt_en || item.prompt || item.en || "Write in English:";
    setSmokeContext({
      stage: kind === "type" ? "type" : "use",
      checkPhase: "",
      itemIndex: idx,
      // `prompt` in Use IS the Czech (use_items prompt = it.cz), so flagging
      // from Use printed the Czech twice and never showed the English target.
      // In Type the prompt IS the English cloze — flagging with the answer
      // there produced "en: queues" and no sentence at all (James, 2026-08-24,
      // b1_articles_advanced smoke).
      en: kind === "type" ? item.prompt || item.en || "" : item.answer || prompt,
      cz: item.cz || "",
      gap: isGap ? item.stem || "" : isRoot ? item.root : "",
      gap_answer: isGap ? item.ending || "" : item.answer || "",
      typed: "",
    });
    /* Voice Use (James, 2026-08-28): "Make this active/passive" as a grey
     * line under the sentence was missed. Same slot as fix-the-sentence:
     * task label above, sentence as the object, placeholder names the target. */
    const voiceHint = (() => {
      const h = String(item.hint || "");
      if (!h.startsWith("Make this")) return "";
      return h.replace(/\.\s*$/, "");
    })();
    const voicePlaceholder = /active$/i.test(voiceHint)
      ? "type the active sentence…"
      : /passive$/i.test(voiceHint)
        ? "type the passive sentence…"
        : "";
    const joinHint = /^Join into one sentence/i.test(String(item.hint || ""));
    const rewriteHint =
      kind === "use" &&
      (pack.use_mode === "rewrite" ||
        /^Change one word so the sentence means the opposite/i.test(
          String(item.hint || ""),
        ));

    const hint =
      item.hint && !voiceHint && !joinHint
        ? `<p class="practice-hint">${esc(item.hint)}</p>`
        : "";

    /* Fix-the-sentence items (use_mode: "correct") look identical to a
     * translation prompt otherwise — the banner said "Fix the sentence" but it
     * was too small to register (James, 2026-08-24). Same treatment as his
     * Patrik error page: a label above, the wrong sentence in the error colour,
     * and a placeholder that says what to type. */
    const fixMode = Boolean(item.wrong);
    const agentHint = (() => {
      if (!/active$/i.test(voiceHint)) return "";
      const pool = [item.answer, ...(item.accepts || [])];
      const unspec = pool.some((s) =>
        /^(someone|they|people)\b/i.test(String(s || "").trim())
      );
      return unspec ? `<p class="practice-hint">Use <strong>they</strong> or <strong>someone</strong>.</p>` : "";
    })();
    const taskLabel = fixMode
      ? `<p class="fix-label">Correct this sentence</p>`
      : rewriteHint
        ? `<p class="fix-label">Rewrite with a prefix</p>`
      : voiceHint
        ? `<p class="fix-label">${esc(voiceHint)}</p>${agentHint}`
        : joinHint
          ? `<p class="fix-label">Join into one sentence</p>`
          : "";

    const inputBlock = isGap
      ? `<div class="gap-row" aria-label="Fill the ending">
          <span class="gap-stem">${esc(item.stem)}</span>
          <input type="text" id="ans" class="gap-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="__" lang="pl" />
          <button type="button" class="btn primary" id="btn-submit">Check</button>
        </div>`
      : `<div class="input-row">
          <input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${
            isRoot
              ? "whole word…"
              : rewriteHint
                ? "type the opposite sentence…"
              : item.wrong
                ? "type the corrected sentence…"
                : joinHint
                  ? "type one sentence…"
                : kind === "type" &&
                    (item.zero_article ||
                      item.answer === "—" ||
                      (item.accepts || []).includes("—"))
                  ? "Enter = no article"
                : voicePlaceholder || "type in English…"
          }" lang="en" />
          <button type="button" class="btn primary" id="btn-submit">Check</button>
        </div>`;

    const stageLabel =
      kind === "type" ? (isGap ? "Endings" : "Type") : "Use";

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · ${stageLabel}</h2></div>
      <p class="score-line">${idx + 1} / ${items.length} · score ${score}${
        retryPass ? " · retry" : ""
      }</p>
      ${taskLabel}
      <div class="item-stem">
        <div class="item-stem-text">
          <p class="practice-prompt${fixMode && !rewriteHint ? " practice-prompt--wrong" : ""}">${esc(prompt)}${
            isRoot ? ` <span class="wf-root">${esc(item.root)}</span>` : ""
          }</p>
          ${hint}
          ${
            isGap
              ? `<p class="practice-hint gap-hint">Only the <strong>ending</strong></p>`
              : isRoot
                ? `<p class="practice-hint gap-hint">The <strong>whole word</strong> formed from the word in capitals</p>`
                : kind === "type" &&
                    (item.zero_article ||
                      item.answer === "—" ||
                      (item.accepts || []).includes("—"))
                  ? `<p class="practice-hint">No article? leave empty and press <strong>Enter</strong>.</p>`
                  : ""
          }
        </div>
        ${itemDiagramHtml(item)}
      </div>
      ${inputBlock}
      <div class="feedback" id="feedback"></div>
    `;

    const input = root.querySelector("#ans");
    const btn = root.querySelector("#btn-submit");
    const fb = root.querySelector("#feedback");
    input.focus();

    let answered = false;
    let retype = false; // correction practice after a miss — never scored
    let advanceTimer = null;

    const goNext = () => {
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      if (kind === "type") {
        state.typeIndex += 1;
        if (state.typeIndex >= items.length) state.typeGate = true;
      } else {
        state.useIndex += 1;
        if (state.useIndex >= items.length) state.useGate = true;
      }
      render();
    };

    const grade = () => {
      if (answered) return;
      answered = true;
      // Zero-article items: the empty box IS the answer — Enter with nothing
      // typed submits "no article" (James, 2026-08-25, a1_articles smoke).
      const zeroItem =
        item.answer === "—" || item.ending === "—" ||
        (item.accepts || []).includes("—");
      const typedVal =
        zeroItem && input.value.trim() === "" ? "—" : input.value;
      const good = isCorrect(typedVal, item, mode);
      if (good) {
        if (!retype) {
          if (kind === "type") state.typeScore += 1;
          else state.useScore += 1;
        }
        fb.className = "feedback ok";
        fb.textContent =
          (isGap
            ? `✓ Correct · ${fullFormOf(item) || item.stem + item.ending}`
            : "✓ Correct") + (retype ? " (retyped)" : "");
      } else {
        if (!retype) {
          if (kind === "type") {
            if (!state.typeWrong.includes(item)) state.typeWrong.push(item);
          } else if (!state.useWrong.includes(item)) {
            state.useWrong.push(item);
          }
        }
        fb.className = "feedback bad";
        const prefixFree =
          kind === "use" &&
          (item.no_prefix || []).some((s) => norm(s) === norm(typedVal));
        if (prefixFree) {
          fb.textContent = "Correct English — but use a prefix here.";
          fb.appendChild(document.createElement("br"));
          fb.appendChild(document.createTextNode("→ " + item.answer));
        } else {
          fb.textContent = isGap
            ? `→ ${item.ending}  ·  ${fullFormOf(item)}`
            : `→ ${item.answer}`;
        }
        // Let the learner type the correction — motor memory, not score.
        const fix = document.createElement("button");
        fix.type = "button";
        fix.className = "link";
        fix.textContent = "Rewrite correctly →";
        fix.onclick = () => {
          retype = true;
          answered = false;
          input.disabled = false;
          input.value = "";
          btn.textContent = "Check";
          state.enterAdvance = onEnter; // Enter grades again, not skip
          input.focus();
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(fix);
      }
      attachExplain(fb, item, () => {
        if (advanceTimer) {
          clearTimeout(advanceTimer);
          advanceTimer = null;
        }
      });
      input.disabled = true;
      btn.textContent = "Next →";
      // No btn.onclick here — the persistent onEnter click listener already
      // routes by `answered`; a second handler double-advanced (item skip).
      focusPrimary("#btn-submit");
      state.enterAdvance = goNext;
      // Always wait for Enter, right or wrong (James, 2026-08-10): a correct
      // answer is still worth looking at, and the old 750/900ms auto-advance
      // pulled the item away mid-read.
    };

    const onEnter = () => {
      if (answered) goNext();
      else grade();
    };

    btn.addEventListener("click", onEnter);
    state.enterAdvance = onEnter;
  }

  function renderDone() {
    clearAdvance();
    // Stored bests, not the last round's numbers — a retry round of 2
    // items must never read as "50%" over the whole stage.
    const best = grammarBest(pack.id);
    const bCheck = best.check == null ? null : Math.round(best.check * 100);
    const bType = best.type == null ? null : Math.round(best.type * 100);
    const fruit = hasFruit(pack.id);
    const sitting = typeof opts.nextSitting === "function" ? opts.nextSitting() : null;
    // Replay: still show the tree, but do not grow a new knot (James, 2026-08-29).
    if (fruit && !justFruitedThisRun && typeof opts.onFruit === "function") {
      opts.onFruit({ domain: "grammar", packId: pack.id, grow: false });
    }

    root.innerHTML = `
      ${ladderHtml()}
      <div class="practice-head"><h2>${esc(pack.title)} · Done</h2></div>
      <p class="practice-prompt">${
        fruit
          ? "Fruit earned."
          : "Ladder finished. Fruit needs Check, Type and Use all clear — retry the wrong items."
      }</p>
      ${
        sitting
          ? `<p class="practice-hint">Next: ${esc(sitting.label)}</p>`
          : ""
      }
      <p class="score-line">
        ${bCheck != null ? `Check: ${bCheck} % · ` : ""}
        ${bType != null ? `Type: ${bType} % · ` : ""}
        Use: ${
          state.useItems.length
            ? `${state.useScore}/${state.useItems.length}`
            : "—"
        }
      </p>
      <p class="practice-hint">Progress stays in this browser · write in English</p>
      <div class="practice-exit">
        <div class="nav">
          <button type="button" class="btn" id="btn-retry">Practice again</button>
          <button type="button" class="btn primary" id="btn-map">${
            sitting ? "Continue →" : "← Home"
          }</button>
        </div>
      </div>
    `;
    root.querySelector("#btn-retry")?.addEventListener("click", () => {
      state.introIndex = 0;
      setStage("intro");
    });
    root.querySelector("#btn-map")?.addEventListener("click", exitToMap);
    state.enterAdvance = exitToMap;
    focusPrimary("#btn-map");
  }

  function render() {
    if (state.stage === "intro") return renderIntro();
    if (state.stage === "check") {
      if (state.checkPhase === "sort_bins") return renderSortBins();
      if (state.checkPhase === "match") return renderMatch();
      if (state.checkPhase === "order_click") return renderOrderClick();
      return renderQuiz();
    }
    if (state.stage === "type") return renderTypedStage("type");
    if (state.stage === "use") return renderTypedStage("use");
    if (state.stage === "done") return renderDone();
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(s) {
    return esc(s).replace(/'/g, "&#39;");
  }

  /* Intro prose is authored with **bold**, *italic* and ~~strikethrough~~. Escape
   * FIRST, then turn the surviving asterisk runs into tags — never the other
   * way round, or pack text could inject markup. Bold must run before italic
   * or `**x**` would be eaten as an italic wrapping `*x*`.
   * Italic added 2026-08-12: 69 single-asterisk spans across 15 packs were
   * printing raw (James, smoking a1_word_classes). */
  function escMd(s) {
    return esc(s)
      .replace(/~~([^~]+)~~/g, '<s class="wrong-eg">$1</s>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // \S guard: a lone "a * b" must not become "a <em> b</em>".
      .replace(/(^|[^*])\*(\S[^*\n]*?)\*(?!\*)/g, "$1<em>$2</em>");
  }

  if (state.reviewStart) {
    // Review launch: straight to production (Type), skip intro/check
    jumpToStage(state.reviewStart);
  } else {
    render();
  }
}
