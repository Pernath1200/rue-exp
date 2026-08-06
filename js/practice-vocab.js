/**
 * Practice ladder (RUE3-shaped vocab engine for rue-exp):
 * Match → Quiz → Type word → Use (sentence)
 * Default for word modes: toward English (CZ → EN)
 * Default pass size: DEFAULT_PASS (12); shorter banks use all items.
 * Each stage stops with score (e.g. 11/12) + retry wrongs before next.
 * Sentence mode:
 *   - trunk frames (practice: "frames") → model production from items
 *   - leaf packs with pack.sentences[] → same grading UI (authored translations)
 *   - no bank → "Coming soon" placeholder (no free-write)
 */

import { getSmokeApi, countFlags, updateFlagsBadge } from "./smoke-flags.js";
import { attachExplain } from "./explain.js";
import { isAuthorUnlock } from "./progress.js";

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
  return `${it.pl || it.gap_answer || ""}‖${it.en || ""}`;
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
      if (targets.has(items[i].pl)) w = FOCUS_WEIGHT;
    }
    for (let k = 0; k < w; k++) bag.push(i);
  }
  shuffle(bag);
  // Three tiers: unseen sentence-targets are GUARANTEED first (Use must
  // never demand a word the word modes haven't shown — deterministic, not
  // weighted odds), then other unseen (rotation), then seen top-up.
  const tTargets = [];
  const tUnseen = [];
  const tSeen = [];
  const used = new Set();
  for (const i of bag) {
    if (used.has(i)) continue;
    used.add(i);
    const it = items && items[i];
    const wasSeen = seen && it && seen.has(itemDeckKey(it));
    const isTarget = targets && targets.size && it && targets.has(it.pl);
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

/** Soft production normalizer (case + punctuation). */
function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Expand one answer string into normalised acceptable forms (slashes, notes). */
function accepts(answer) {
  if (answer == null || answer === "") return [];
  const forms = [answer, String(answer).replace(/\([^)]*\)/g, " ")];
  return [
    ...new Set(
      forms
        .flatMap((f) => String(f).split(/[/;]/))
        .map(norm)
        .filter(Boolean),
    ),
  ];
}

/**
 * Soft full-sentence match for Polish — listed accepts only via itemAccepts;
 * here: exact after norm, or strip optional "ja/ty" subject if rest matches.
 */
function softSentenceMatch(userNorm, primaryNorm) {
  if (!userNorm || !primaryNorm) return false;
  if (userNorm === primaryNorm) return true;

  const dropSubj = (t) =>
    t.replace(/^(ja|ty|on|ona|ono|my|wy|oni|one)\s+/i, "").trim();
  const u = dropSubj(userNorm);
  const p = dropSubj(primaryNorm);
  if (u && p && u === p) return true;
  return false;
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
  return [...out];
}

function isCorrectAnswer(userInput, item, primary, opts = {}) {
  const { forGap = false } = opts;
  const userN = norm(userInput);
  if (!userN) return false;
  if (itemAccepts(item, primary, opts).includes(userN)) return true;
  // Soft match only for full sentences / non-gap (gate Sentence, frame Sentence)
  if (!forGap && primary && String(primary).trim().includes(" ")) {
    const primaryN = norm(primary);
    if (softSentenceMatch(userN, primaryN)) return true;
    // also soft-match against listed accepts
    if (item && Array.isArray(item.accepts)) {
      for (const a of item.accepts) {
        if (softSentenceMatch(userN, norm(a))) return true;
      }
    }
  }
  return false;
}

/** Drop Polish diacritics. Near-miss detection ONLY — never used to grade a pass. */
function deacc(s) {
  return String(s)
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
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
 *   "accent" — right word, only diacritics off (English keyboard problem,
 *              not a knowledge problem) → count it, but show the ogonki.
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

export {
  norm,
  isCorrectAnswer,
  itemAccepts,
  softSentenceMatch,
  expandContractions,
  nearMiss,
};

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

function promptOf(item, plToEn) {
  return plToEn ? item.pl : item.en;
}

function answerOf(item, plToEn) {
  return plToEn ? item.en : item.pl;
}

/** Lemma used in free Sentence mode (Polish target for RUE3). */
function keyWord(item) {
  const raw = item.pl || item.en || "";
  return String(raw).replace(/\([^)]*\)/g, "").split("/")[0].trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Human labels for structure tags shown as a soft pattern hint. */
const STRUCTURE_LABELS = {
  to_jest: "This is…",
  poss_nom: "my / your",
  byc_adj: "I am / it is + adjective",
  zgoda: "adjective + noun",
  miec_acc: "I have / has + object",
  present: "present tense",
};

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
 * @param {HTMLElement} root
 * @param {{ id?: string, title: string, items: object[], practice?: string }} block
 * @param {{ onExit: () => void, practice?: string, packId?: string, packTitle?: string }} opts
 */
export function startPractice(root, block, opts) {
  const isFrames = opts.practice === "frames" || block.practice === "frames";
  const packId = opts.packId || block.id || "";
  const packTitle = opts.packTitle || block.title || "";
  /** Authored sentence bank (leaf packs). Trunk frames use block.items. */
  const sentenceBank =
    Array.isArray(block.sentences) && block.sentences.length
      ? block.sentences
      : null;
  /** Optional read-first stage (concept packs). */
  const hasIntro = Array.isArray(block.intro) && block.intro.length > 0;
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
  // Gender badges keyed by PL only — they mark the Polish noun, and must
  // never leak onto the EN side (that would gift the answer in PL→EN).
  const genderByPl = new Map();
  const GENDER_LABEL = { m: "m.", f: "f.", n: "n.", pl: "pl." };
  for (const it of block.items || []) {
    if (it.swatch) {
      swatchByText.set(it.pl, it.swatch);
      swatchByText.set(it.en, it.swatch);
    }
    if (it.icon) {
      iconByText.set(it.pl, it.icon);
      iconByText.set(it.en, it.icon);
    }
    if (it.gender && GENDER_LABEL[it.gender]) {
      genderByPl.set(it.pl, it.gender);
    }
  }

  function sw(text) {
    const c = swatchByText.get(text);
    if (c) return `<span class="swatch" style="background:${c}"></span>`;
    const ic = iconByText.get(text);
    if (ic) return `<span class="icon-chip">${ic}</span>`;
    return "";
  }

  /** Gender badge after a Polish noun (teaches gender during exposure). */
  function gb(text) {
    const g = genderByPl.get(text);
    return g
      ? ` <span class="gender-badge gender-${g}">${GENDER_LABEL[g]}</span>`
      : "";
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
    plToEn: true, // toward English (label: CZ → EN); var name is historical
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
      pl: "",
      gap: "",
      gap_answer: "",
      typed: "",
    },
  };
  /** Track first completion for optional UI; scores always update bests. */
  const reported = { match: false, quiz: false, type: false, sentence: false };

  function setFlagContext(partial) {
    state.flagContext = { ...state.flagContext, ...partial };
  }

  function captureTyped() {
    const el =
      root.querySelector("#ti") ||
      root.querySelector("#ui") ||
      root.querySelector("input.type-in") ||
      root.querySelector("textarea.type-in");
    if (el) setFlagContext({ typed: String(el.value || "") });
  }

  function openSmokeFlag() {
    captureTyped();
    getSmokeApi()?.openForm({ ...state.flagContext });
  }

  function openSmokeList() {
    getSmokeApi()?.openList();
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
      ["sentence", "Use"],
    ];
    if (hasIntro) base.unshift(["intro", "Intro"]);
    const modes = base.map(([id, label], i) => [id, `${i + 1} · ${label}`]);
    const showDir = state.mode !== "sentence";
    const nFlags = countFlags();
    const bankN = sentenceBank ? sentenceBank.length : 0;
    const metaBits = isFrames
      ? `${block.items.length} frames · A1 · trunk`
      : bankN
        ? `${block.items.length} words · ${bankN} sentences · A1`
        : `${block.items.length} words · A1`;
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
      ${
        isAuthorUnlock()
          ? `<div class="smoke-toolbar" role="toolbar" aria-label="Smoke flags">
        <button type="button" class="btn smoke-flag-btn" id="p-flag" title="Flag this item for smoke review">⚑ Flag item</button>
        <button type="button" class="btn smoke-flag-list" id="p-flag-list" data-smoke-badge title="View flagged items · copy for agent">${nFlags > 0 ? `Flagged (${nFlags})` : "Flagged list"}</button>
        <span class="smoke-toolbar-hint">Smoke · local notes for the agent</span>
      </div>`
          : ""
      }
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
        ${
          showDir
            ? `<button type="button" class="dir" id="p-dir">${state.plToEn ? "CZ → EN" : "EN → CZ"}</button>`
            : `<span class="dir-static">Write in English</span>`
        }
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
    const dir = root.querySelector("#p-dir");
    if (dir) {
      dir.addEventListener("click", () => {
        state.plToEn = !state.plToEn;
        state.match = null;
        state.quiz = null;
        state.typ = null;
        clearKey();
        render();
      });
    }
    root.querySelector("#p-flag")?.addEventListener("click", () => {
      openSmokeFlag();
    });
    root.querySelector("#p-flag-list")?.addEventListener("click", () => {
      openSmokeList();
    });
    root.querySelector("#p-exit").addEventListener("click", () => {
      clearKey();
      opts.onExit();
    });
    updateFlagsBadge();
  }

  function flagItem(it, itemIndex, stage) {
    if (!it) {
      setFlagContext({
        stage: stage || state.mode,
        itemIndex: itemIndex ?? null,
        en: "",
        pl: "",
        gap: "",
        gap_answer: "",
      });
      return;
    }
    setFlagContext({
      stage: stage || state.mode,
      itemIndex: typeof itemIndex === "number" ? itemIndex : null,
      en: it.en || "",
      pl: it.pl || "",
      gap: it.gap || "",
      gap_answer: it.gap_answer || "",
    });
  }

  function newMatch() {
    const order = rotatedOrder("match", block.items, null);
    const pool = order.map((i) => block.items[i]);
    const left = pool.map((it, i) => ({ t: promptOf(it, state.plToEn), id: i }));
    const right = shuffle(
      pool.map((it, i) => ({ t: answerOf(it, state.plToEn), id: i })),
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
      pl: "",
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
          </div>
        </div>`;
      stage.querySelector("#m-again").onclick = () => {
        newMatch();
        render();
      };
      stage.querySelector("#m-quiz").onclick = () => setMode("quiz");
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
                   <button type="button" class="btn" id="q-type">3 · Type →</button>`
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
    const correct = answerOf(it, state.plToEn);
    const others = shuffle(
      list.filter((x) => answerOf(x, state.plToEn) !== correct),
    )
      .slice(0, 3)
      .map((x) => answerOf(x, state.plToEn));
    const opts = shuffle([correct, ...others]);

    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        <div class="prompt">${sw(promptOf(it, state.plToEn))}${escapeHtml(promptOf(it, state.plToEn))}${gb(promptOf(it, state.plToEn))}</div>
        <div class="sub">Choose the ${state.plToEn ? "English" : "Czech"} version — answer 1–4 · Enter = next</div>
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
      // Auto-advance; Enter skips the wait
      state.advanceTimer = setTimeout(goNextQuestion, 750);
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
      if (q.answered) {
        // Digit during the feedback pause: skip the wait instead of
        // swallowing the press — fast keying stays responsive.
        if (quizKeyToIndex(e, opts.length) != null) {
          e.preventDefault();
          goNextQuestion();
        }
        return;
      }
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
      const sub =
        wrongN > 0
          ? `${wrongN} to retry · or go to Use`
          : "All clear · next: Use";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Type done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${sub}${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="t-sent">4 · Use →</button>`
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
      stage.querySelector("#t-sent").onclick = () => setMode("sentence");
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
    // Frames: gap-fill. Leaves: bilingual word prompt.
    const prompt = frame
      ? it.gap
      : promptOf(it, state.plToEn);
    const answer = frame ? it.gap_answer : answerOf(it, state.plToEn);
    const sub = frame
      ? "Fill the missing English word · Enter = check / next"
      : `Write ${state.plToEn ? "in English" : "in Czech"} · Enter = check / next`;
    const passLabel = t.retryPass ? "retry" : "set";
    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        ${frame ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.en)}</div>` : ""}
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
      if (isCorrectAnswer(inp.value, it, answer, { forGap: frame })) {
        t.answered = true;
        t.missedThis = false;
        t.score++;
        fb.textContent = "✓ Correct";
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
      reportMode("sentence", { score: t.score, total: passLen });
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
        <div class="prompt" style="font-size:1.2rem">${escapeHtml(it.en)}</div>
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
      if (isCorrectAnswer(inp.value, it, it.pl)) {
        t.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        t.missedThis = true;
        fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(it.pl)}</span>`;
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
      pl: "",
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
        </div>
      </div>`;
    stage.querySelector("#soon-type").onclick = () => setMode("type");
    stage.querySelector("#soon-match").onclick = () => setMode("match");
    bindEnterPrimary(stage);
    return "Use · coming soon";
  }

  function renderSentence(stage) {
    if (getSentenceItems()) return renderFrameSentence(stage);
    return renderSentenceSoon(stage);
  }

  function renderIntro(stage) {
    setFlagContext({ stage: "intro", itemIndex: null, en: "", pl: "" });
    const cards = (block.intro || [])
      .map((sec) => {
        const table = sec.table
          ? `<table class="intro-table"><thead><tr>${(sec.table.headers || [])
              .map((h) => `<th>${escapeHtml(h)}</th>`)
              .join("")}</tr></thead><tbody>${(sec.table.rows || [])
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
              )
              .join("")}</tbody></table>`
          : "";
        return `
          <div class="q" style="margin-bottom:0.9rem">
            <div class="prompt">${escapeHtml(sec.title || "")}</div>
            ${sec.title_pl ? `<div class="sub"><em>${escapeHtml(sec.title_pl)}</em></div>` : ""}
            ${sec.body ? `<p style="white-space:pre-line">${escapeHtml(sec.body)}</p>` : ""}
            ${table}
            ${sec.body_pl ? `<p class="sub" style="white-space:pre-line"><em>${escapeHtml(sec.body_pl)}</em></p>` : ""}
          </div>`;
      })
      .join("");
    stage.innerHTML = `
      ${cards}
      <div class="nav"><button type="button" class="btn primary" id="in-next">Next → Match</button></div>`;
    stage.querySelector("#in-next").onclick = () => setMode("match");
    bindEnterPrimary(stage);
    return "Intro · read · Enter = next";
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
