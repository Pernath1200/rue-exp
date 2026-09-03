/**
 * Level checks — not teaching packs. A1 and A2 share this file.
 * Vocab match: six EN↔CZ pairs, deal the next board, clock on.
 * Vocab type-in: Czech prompt, first-letter + length clue, type English,
 *   12 at a time, no clock, recap.
 * Grammar which: three full English sentences, tap the right one.
 *   Clock off by default, optional on. Recap. No Use, no fruit.
 * Finale: CZ → full English sentence. Retry until the round is clean.
 *   Whole-level run fruits this node only. Filtered runs never fruit.
 *
 * Vocab pool = live vocab packs at that level (runtime). A2 Topics-only
 * trunks stay off the check. Do not fork a second sprint file.
 *
 * Vocab behaviour from Desktop `vocab game (2).html` (Martin). Chrome is RUE.
 */

import { setSmokeContext } from "./smoke-flags.js?v=2026-09-03-flagon";
import { expandContractions } from "./contractions.js";
import { canonSynonyms } from "./synonyms.js";
import { _gradeGrammar, gradeGrammarSentence } from "./practice-grammar.js";
import { isCorrectAnswer, typeLetterClue } from "./practice-vocab.js?v=2026-09-03-quizform";
import {
  touchBlock,
  completeMode,
  completeFinale,
  completeCheckRound,
} from "./progress.js?v=2026-08-31-adopt";

const BOARD_SIZE = 6;
const TYPE_SIZE = 12;
const WHICH_SIZE = 12;
const G_MATCH_TITLE = "A1 grammar · match";
const CLEAR_AT = 2;
const WRONG_MS = 280;
const CLEAR_MS = 180;
const CHECK_PRACTICES = new Set([
  "match_sprint",
  "type_sprint",
  "grammar_match_sprint",
  "grammar_type_sprint",
  "use_sprint",
]);
const ALL = "__all__";

function levelFromNode(node, fallback = "A1") {
  const raw = (node?.levels && node.levels[0]) || node?.level || fallback;
  return String(raw).toUpperCase();
}

function sprintKeys(level) {
  const lv = String(level || "A1").toLowerCase();
  return {
    trouble: `rue-exp-sprint-trouble:${lv}_vocab_match`,
    best: `rue-exp-sprint-best:${lv}_vocab_match`,
    typeBest: `rue-exp-sprint-best:${lv}_vocab_type`,
    topic: `rue-exp-sprint-topic:${lv}_vocab_match`,
    minutes: `rue-exp-sprint-minutes:${lv}_vocab_match`,
  };
}

/** Default A1 so tests that call markTrouble without a sprint keep the old keys. */
let ACTIVE = sprintKeys("A1");

function activateSprintKeys(level) {
  ACTIVE = sprintKeys(level);
}

function shuffle(items) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escMd(s) {
  return esc(s)
    .replace(/~~([^~]+)~~/g, '<s class="wrong-eg">$1</s>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(\S[^*\n]*?)\*(?!\*)/g, "$1<em>$2</em>");
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function readBest(topic, minutes) {
  const map = readJson(ACTIVE.best, {}) || {};
  const k = `${topic || ALL}:${minutes || 1}`;
  const n = parseInt(map[k] || 0, 10);
  return Number.isFinite(n) ? n : 0;
}

function writeBest(topic, minutes, value) {
  const map = readJson(ACTIVE.best, {}) || {};
  const k = `${topic || ALL}:${minutes || 1}`;
  map[k] = value;
  writeJson(ACTIVE.best, map);
}

function readTrouble() {
  const raw = readJson(ACTIVE.trouble, {}) || {};
  return raw && typeof raw === "object" ? raw : {};
}

function writeTrouble(map) {
  writeJson(ACTIVE.trouble, map);
}

function markTrouble(id) {
  const t = readTrouble();
  t[String(id)] = 0;
  writeTrouble(t);
}

/** Right CLEAR_AT times in a row (while on the list) and the word is retired. */
function creditTrouble(id) {
  const t = readTrouble();
  const k = String(id);
  if (!(k in t)) return;
  t[k] = (t[k] || 0) + 1;
  if (t[k] >= CLEAR_AT) delete t[k];
  writeTrouble(t);
}

/**
 * This round's misses plus leftover trouble, type-in eligible, max 12.
 * Frame sentences stay on the match trouble list but are not drilled here.
 */
export function buildPracticeList(typePool, extraIds) {
  const t = readTrouble();
  const want = new Set(Object.keys(t).map(String));
  for (const id of extraIds || []) {
    if (id != null && id !== "") want.add(String(id));
  }
  const out = [];
  const seen = new Set();
  for (const w of typePool || []) {
    const id = String(w.id);
    if (!want.has(id) || seen.has(id)) continue;
    if (!isTypeInPrompt(w.en)) continue;
    seen.add(id);
    out.push(w);
  }
  return shuffle(out).slice(0, TYPE_SIZE);
}

export { markTrouble, creditTrouble, readTrouble, CLEAR_AT };

const poolCacheByLevel = Object.create(null);

function itemKey(en, cz) {
  return `${String(en || "").trim().toLowerCase()}‖${String(cz || "").trim().toLowerCase()}`;
}

function isVocabPoolNode(n, selfId, level) {
  if (n.domain !== "vocab") return false;
  if (n.status !== "live") return false;
  if (!n.content) return false;
  if (n.id === selfId) return false;
  if (!(n.levels || []).includes(level)) return false;
  if (CHECK_PRACTICES.has(n.practice)) return false;
  /* A2 Topics-only trunks (recycle / lexis / chunks) stay off the check. */
  if (level !== "A1" && n.kind === "trunk") return false;
  return true;
}

/**
 * Live vocab items at `level`, excluding the check node itself.
 * Deduped on en+cz. Topic = source node label.
 */
export async function loadVocabPool(tree, loadJson, selfId, level) {
  const lv = String(level || "A1").toUpperCase();
  if (poolCacheByLevel[lv]) return poolCacheByLevel[lv];
  const nodes = (tree?.nodes || []).filter((n) =>
    isVocabPoolNode(n, selfId, lv),
  );
  const seen = new Set();
  const out = [];
  let seq = 0;
  for (const n of nodes) {
    let pack;
    try {
      pack = await loadJson(`./data/${n.content}`);
    } catch {
      continue;
    }
    const items = [];
    if (Array.isArray(pack.blocks)) {
      for (const b of pack.blocks) {
        for (const it of b.items || []) items.push(it);
      }
    }
    for (const it of items) {
      if (it?.quiz_axis === "sentence") continue;
      const en = String(it?.en || "").trim();
      const cz = String(it?.cz || "").trim();
      if (!en || !cz) continue;
      const k = itemKey(en, cz);
      if (seen.has(k)) continue;
      seen.add(k);
      seq += 1;
      out.push({
        id: String(seq),
        en,
        cz,
        t: n.label || pack.title || n.id,
        src: n.id,
      });
    }
  }
  poolCacheByLevel[lv] = out;
  return out;
}

/** A1 alias — tests and older call sites. */
export async function loadA1VocabPool(tree, loadJson, selfId) {
  return loadVocabPool(tree, loadJson, selfId, "A1");
}

/**
 * Type-in drops frame sentences. Keep ice cream / next to (2–3 tokens,
 * no .?!). Match can keep sentences; typing them is Use.
 */
export function isTypeInPrompt(en) {
  const s = String(en || "").trim();
  if (!s) return false;
  if (/[.?!]/.test(s)) return false;
  const tokens = s.split(/\s+/).filter(Boolean);
  return tokens.length >= 1 && tokens.length <= 3;
}

export function filterTypeInPool(list) {
  return (list || []).filter((w) => isTypeInPrompt(w.en));
}

function typeNorm(s) {
  return expandContractions(s)
    .replace(/[''`´]/g, "")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function typeForms(answer) {
  const raw = String(answer || "");
  const stripped = raw.replace(/\([^)]*\)/g, " ");
  return [...new Set([raw, stripped].map(typeNorm).filter(Boolean))];
}

function formsMatch(typed, expected) {
  const userN = typeNorm(typed);
  if (!userN) return false;
  const forms = typeForms(expected);
  if (forms.includes(userN)) return true;
  const userC = canonSynonyms(userN);
  return forms.some((f) => canonSynonyms(f) === userC);
}

function editDist(a, b, cap) {
  const left = String(a || "");
  const right = String(b || "");
  if (Math.abs(left.length - right.length) > cap) return cap + 1;
  let prev = Array.from({ length: right.length + 1 }, (_, j) => j);
  for (let i = 1; i <= left.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= right.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      if (row[j] < best) best = row[j];
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[right.length];
}

function foldLetters(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function typedTheCzech(typed, cz) {
  const u = foldLetters(typed);
  const c = foldLetters(cz);
  return Boolean(u && c && u === c);
}

/**
 * App vocab Type rules (synonyms, contractions) plus the HTML traps:
 * one-letter typos pass unless that typo is a different pool word, and
 * unless they typed the Czech (mobil is not mobile).
 */
export function gradeTypeIn(typed, item, pool) {
  const expected = item?.en || "";
  const cz = item?.cz || "";
  if (formsMatch(typed, expected)) {
    return { ok: true, reason: "exact" };
  }
  const czN = typeNorm(cz);
  const siblings = [];
  const otherEns = new Set();
  for (const w of pool || []) {
    const enN = typeNorm(w.en);
    if (enN && enN !== typeNorm(expected)) otherEns.add(enN);
    if (w.id === item?.id) continue;
    if (czN && typeNorm(w.cz) === czN) {
      siblings.push(w);
      otherEns.delete(enN);
    }
  }
  for (const sib of siblings) {
    if (formsMatch(typed, sib.en)) {
      return { ok: true, reason: "sibling" };
    }
  }
  const userN = typeNorm(typed);
  if (!userN) return { ok: false, reason: "empty" };
  const userFlat = foldLetters(typed);
  if (typeForms(expected).some((f) => foldLetters(f) === userFlat)) {
    return { ok: true, reason: "accent" };
  }
  if (typedTheCzech(typed, cz)) {
    return { ok: false, reason: "czech" };
  }
  if (otherEns.has(userN)) {
    return { ok: false, reason: "other-word" };
  }
  if (typeForms(expected).some((f) => editDist(userN, f, 1) === 1)) {
    return { ok: true, reason: "typo" };
  }
  return { ok: false, reason: "wrong" };
}

function readTypeBest(topic) {
  const map = readJson(ACTIVE.typeBest, {}) || {};
  const n = parseInt(map[topic || ALL] || 0, 10);
  return Number.isFinite(n) ? n : 0;
}

function writeTypeBest(topic, value) {
  const map = readJson(ACTIVE.typeBest, {}) || {};
  map[topic || ALL] = value;
  writeJson(ACTIVE.typeBest, map);
}

function paintLetterClue(el, answer) {
  if (!el) return;
  const clue = typeLetterClue(answer);
  el.textContent = clue;
  el.hidden = !clue;
}

function practicePanelHtml() {
  return `
        <div id="sprint-practice" hidden>
          <p class="kicker">Practice · <span id="pr-pos">1</span> of <span id="pr-total">1</span></p>
          <div class="sprint-type-card">
            <p class="sub">Write in English · Enter = check / next</p>
            <p class="prompt" id="pr-prompt"></p>
            <div class="type-clue" id="pr-clue" hidden></div>
            <input class="type-in" id="pr-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here…" lang="en" aria-label="English" />
            <div class="fb" id="pr-fb"></div>
            <div class="sprint-actions">
              <button type="button" class="btn primary" id="pr-check">Check</button>
            </div>
          </div>
        </div>`;
}

function paintPracticeButton(root, list) {
  const btn = root.querySelector("#sprint-btn-practice");
  const again = root.querySelector("#sprint-btn-again");
  if (!btn) return;
  if (!list.length) {
    btn.hidden = true;
    again?.classList.add("primary");
    return;
  }
  btn.hidden = false;
  btn.textContent =
    "Practice " + list.length + (list.length === 1 ? " word" : " words");
  again?.classList.remove("primary");
}

function recapPracticeAnswers(root, results) {
  const list = root.querySelector("#sprint-recap-list");
  const wrap = root.querySelector("#sprint-recap");
  const head = wrap?.querySelector("h3");
  if (!list || !wrap) return;
  if (head) head.textContent = "Your answers";
  let html = "";
  for (const r of results) {
    const miss = !r.ok;
    const wrote =
      miss && String(r.typed || "").trim()
        ? `<span class="wrote">you wrote ${esc(r.typed)}</span>`
        : "";
    html +=
      `<li class="${miss ? "missed" : ""}">` +
      `<span class="sprint-mark">${miss ? "✗" : "✓"}</span>` +
      `<b>${esc(r.word.en)}</b><span>${esc(r.word.cz)}</span>${wrote}</li>`;
  }
  list.innerHTML = html;
  list.classList.add("type-recap");
  wrap.hidden = results.length === 0;
}

function bindPractice({ root, getTypePool, sfx, smoke, onFinish }) {
  let list = [];
  let pos = 0;
  let answered = false;
  let results = [];
  let origin = "results";
  let active = false;

  function current() {
    return list[pos] || null;
  }

  function renderItem() {
    const w = current();
    const prompt = root.querySelector("#pr-prompt");
    const inp = root.querySelector("#pr-input");
    const fb = root.querySelector("#pr-fb");
    const chk = root.querySelector("#pr-check");
    if (!w || !prompt || !inp || !fb || !chk) return;
    answered = false;
    prompt.textContent = w.cz;
    paintLetterClue(root.querySelector("#pr-clue"), w.en);
    inp.value = "";
    inp.disabled = false;
    fb.textContent = "";
    fb.className = "fb";
    chk.textContent = "Check";
    root.querySelector("#pr-pos").textContent = String(pos + 1);
    root.querySelector("#pr-total").textContent = String(list.length);
    smoke?.("practice", { en: w.en, cz: w.cz, typed: "" });
    inp.focus();
  }

  function finish() {
    active = false;
    onFinish({
      origin,
      results,
      leftover: buildPracticeList(getTypePool(), []),
    });
  }

  function goNext() {
    if (!answered) return;
    if (pos + 1 >= list.length) {
      finish();
      return;
    }
    pos += 1;
    renderItem();
  }

  function grade() {
    if (!active || answered) return;
    const w = current();
    const inp = root.querySelector("#pr-input");
    const fb = root.querySelector("#pr-fb");
    const chk = root.querySelector("#pr-check");
    if (!w || !inp || !fb || !chk) return;
    const typed = String(inp.value || "");
    const verdict = gradeTypeIn(typed, w, getTypePool());
    answered = true;
    results.push({ word: w, ok: verdict.ok, typed });
    inp.disabled = true;
    if (verdict.ok) {
      creditTrouble(w.id);
      sfx?.match?.();
      fb.className = "fb good";
      fb.textContent = "✓ " + w.en;
    } else {
      markTrouble(w.id);
      sfx?.miss?.();
      fb.className = "fb bad";
      const wrote = typed.trim() ? ` you wrote ${esc(typed.trim())}` : "";
      fb.innerHTML = `✗ ${esc(w.en)}<span class="wrote">${wrote}</span>`;
    }
    chk.textContent = pos + 1 >= list.length ? "Finish" : "Next";
    smoke?.("practice", { en: w.en, cz: w.cz, typed });
    chk.focus();
  }

  function start(practiceList, originName) {
    list = (practiceList || []).slice();
    if (!list.length) return false;
    pos = 0;
    answered = false;
    results = [];
    origin = originName || "results";
    active = true;
    root.querySelector("#sprint-start") && (root.querySelector("#sprint-start").hidden = true);
    root.querySelector("#sprint-play") && (root.querySelector("#sprint-play").hidden = true);
    root.querySelector("#sprint-results") && (root.querySelector("#sprint-results").hidden = true);
    const panel = root.querySelector("#sprint-practice");
    if (panel) panel.hidden = false;
    renderItem();
    return true;
  }

  function handleEnter() {
    if (!active) return false;
    if (answered) goNext();
    else grade();
    return true;
  }

  root.querySelector("#pr-check")?.addEventListener("click", () => {
    if (!active) return;
    if (answered) goNext();
    else grade();
  });
  root.querySelector("#pr-input")?.addEventListener("input", (e) => {
    const w = current();
    smoke?.("practice", {
      en: w?.en || "",
      cz: w?.cz || "",
      typed: e.target.value || "",
    });
  });

  return {
    start,
    handleEnter,
    isActive() {
      return active;
    },
    stop() {
      active = false;
    },
  };
}

function topicsOf(vocab) {
  const set = new Set();
  for (const w of vocab) if (w.t) set.add(w.t);
  return [...set].sort((a, b) => a.localeCompare(b));
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function startVocabSprint({
  root,
  node,
  loadJson,
  tree,
  onExit,
  onFruit,
}) {
  const level = levelFromNode(node);
  activateSprintKeys(level);
  const selfId = node?.id || `${level.toLowerCase()}_vocab_match`;
  const title = node?.label || `${level} vocab · match`;

  /* One whole-set round through the check is the bar — it checks material
   * learned in the units above it, so there is no ladder to walk. A topic
   * filter is a subset, not the check, so it never fruits.
   * (James, 2026-08-31: "you only have to do one round of it".) */
  function fruitCheckRound(whole) {
    if (!whole) return;
    const r = completeCheckRound(selfId);
    if (r.justFruited) onFruit?.({ grow: true });
    else if (r.nowFruit) onFruit?.({ grow: false });
  }

  let vocab = [];
  let topic = ALL;
  try {
    const saved = localStorage.getItem(ACTIVE.topic);
    if (saved) topic = saved;
  } catch {
    /* */
  }
  let minutes = 1;
  try {
    const savedM = parseInt(localStorage.getItem(ACTIVE.minutes) || "1", 10);
    if (savedM === 2 || savedM === 3) minutes = savedM;
  } catch {
    /* */
  }
  let roundMs = minutes * 60000;
  let screen = "start";
  let score = 0;
  let remaining = roundMs;
  let pool = [];
  let selection = null;
  let locked = false;
  let gone = {};
  let matched = 0;
  let lastTick = 6;
  let rafId = 0;
  let lockTimer = 0;
  let audioCtx = null;
  let seenRound = [];
  let missedRound = {};
  let loopStart = 0;
  let practice = null;

  function activeVocab() {
    if (topic === ALL) return vocab;
    const out = vocab.filter((w) => w.t === topic);
    return out.length >= BOARD_SIZE ? out : vocab;
  }

  function unlockAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, gain, slideTo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        audioCtx.currentTime + duration,
      );
    }
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    select() {
      beep(540, 0.045, "sine", 0.035);
    },
    match() {
      beep(523.25, 0.07, "triangle", 0.045);
      setTimeout(() => beep(783.99, 0.11, "triangle", 0.04), 55);
    },
    miss() {
      beep(196, 0.09, "square", 0.028, 140);
    },
    start() {
      beep(392, 0.08, "sine", 0.04);
      setTimeout(() => beep(523.25, 0.1, "sine", 0.04), 80);
    },
    end() {
      beep(246.94, 0.22, "sine", 0.05, 130);
    },
    tick() {
      beep(880, 0.03, "sine", 0.025);
    },
  };

  function startingPool() {
    const active = activeVocab();
    const t = readTrouble();
    const first = [];
    const rest = [];
    for (const w of active) {
      if (w.id in t) first.push(w);
      else rest.push(w);
    }
    return shuffle(first).concat(shuffle(rest));
  }

  function dealBoard(fromPool) {
    const source =
      fromPool.length >= BOARD_SIZE ? fromPool : shuffle(activeVocab());
    return { board: source.slice(0, BOARD_SIZE), rest: source.slice(BOARD_SIZE) };
  }

  function tileEl(side, id) {
    return root.querySelector(`[data-side="${side}"][data-id="${CSS.escape(id)}"]`);
  }

  function setTileClass(side, id, state) {
    const el = tileEl(side, id);
    if (!el) return;
    el.className = "sprint-tile" + (state && state !== "idle" ? ` ${state}` : "");
    el.disabled = state === "gone";
    el.setAttribute("aria-pressed", state === "selected" ? "true" : "false");
  }

  function loadBoard(fromPool) {
    const dealt = dealBoard(fromPool);
    pool = dealt.rest;
    selection = null;
    locked = false;
    gone = {};
    matched = 0;
    for (const w of dealt.board) {
      if (!seenRound.includes(w)) seenRound.push(w);
    }
    const enCol = shuffle(dealt.board);
    const czCol = shuffle(dealt.board);
    const board = root.querySelector("#sprint-board");
    if (!board) return;
    let html = "";
    for (let i = 0; i < BOARD_SIZE; i++) {
      const en = enCol[i];
      const cz = czCol[i];
      html +=
        `<button type="button" class="sprint-tile" data-side="en" data-id="${esc(en.id)}"` +
        ` aria-label="English: ${esc(en.en)}">${esc(en.en)}</button>` +
        `<button type="button" class="sprint-tile" data-side="cz" data-id="${esc(cz.id)}"` +
        ` aria-label="Czech: ${esc(cz.cz)}">${esc(cz.cz)}</button>`;
    }
    board.innerHTML = html;
  }

  function updateHud() {
    const $time = root.querySelector("#sprint-time");
    const $score = root.querySelector("#sprint-score");
    const $bar = root.querySelector("#sprint-bar");
    const $fill = root.querySelector("#sprint-bar-fill");
    if ($time) $time.textContent = formatTime(remaining);
    if ($score) $score.textContent = String(score);
    const urgent = remaining <= 10000;
    $time?.classList.toggle("urgent", urgent);
    $bar?.classList.toggle("urgent", urgent);
    if ($fill) $fill.style.transform = `scaleX(${remaining / roundMs})`;
  }

  function renderRecap() {
    const list = root.querySelector("#sprint-recap-list");
    const wrap = root.querySelector("#sprint-recap");
    if (!list || !wrap) return;
    let html = "";
    for (const w of seenRound) {
      const miss = missedRound[w.id];
      html +=
        `<li class="${miss ? "missed" : ""}">` +
        `<b>${esc(w.en)}</b><span>${esc(w.cz)}</span></li>`;
    }
    list.innerHTML = html;
    wrap.hidden = seenRound.length === 0;
  }

  function endGame() {
    if (lockTimer) clearTimeout(lockTimer);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    sfx.end();
    fruitCheckRound(topic === ALL);
    const best = readBest(topic, minutes);
    if (score > best) writeBest(topic, minutes, score);
    const newBest = Math.max(best, score);
    screen = "results";
    const hero = root.querySelector("#sprint-final");
    const note = root.querySelector("#sprint-note");
    if (hero) {
      hero.innerHTML = `${esc(String(score))}<small>${
        score === 1 ? " pair" : " pairs"
      }</small>`;
    }
    if (note) {
      note.textContent =
        score > 0 && score >= newBest ? "New best score." : `Best ${newBest}`;
    }
    const play = root.querySelector("#sprint-play");
    const results = root.querySelector("#sprint-results");
    const start = root.querySelector("#sprint-start");
    start.hidden = true;
    play.hidden = true;
    const prPanel = root.querySelector("#sprint-practice");
    if (prPanel) prPanel.hidden = true;
    results.hidden = false;
    renderRecap();
    paintPracticeButton(
      root,
      buildPracticeList(filterTypeInPool(vocab), Object.keys(missedRound)),
    );
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "sprint",
      checkPhase: "results",
      itemIndex: score,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
  }

  function loop(now) {
    remaining = Math.max(0, roundMs - (now - loopStart));
    updateHud();
    const secs = Math.ceil(remaining / 1000);
    if (secs <= 5 && secs > 0 && secs < lastTick) {
      lastTick = secs;
      sfx.tick();
    }
    if (remaining <= 0) {
      endGame();
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function startGame() {
    unlockAudio();
    sfx.start();
    if (lockTimer) clearTimeout(lockTimer);
    if (rafId) cancelAnimationFrame(rafId);
    score = 0;
    seenRound = [];
    missedRound = {};
    remaining = roundMs;
    lastTick = 6;
    screen = "playing";
    practice?.stop();
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-results").hidden = true;
    const prPanel = root.querySelector("#sprint-practice");
    if (prPanel) prPanel.hidden = true;
    root.querySelector("#sprint-play").hidden = false;
    loadBoard(startingPool());
    updateHud();
    loopStart = performance.now();
    rafId = requestAnimationFrame(loop);
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "sprint",
      checkPhase: "match",
      itemIndex: 0,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
  }

  function onTile(side, id) {
    if (screen !== "playing" || locked) return;
    if (gone[id]) return;
    if (selection && selection.side === side && selection.id === id) return;

    if (!selection || selection.side === side) {
      if (selection && selection.side === side) {
        setTileClass(selection.side, selection.id, "idle");
      }
      selection = { side, id };
      setTileClass(side, id, "selected");
      sfx.select();
      return;
    }

    locked = true;
    const other = selection;
    const isMatch = other.id === id;

    if (isMatch) {
      sfx.match();
      gone[id] = true;
      setTileClass(side, id, "selected");
      setTileClass(other.side, other.id, "selected");
      score += 1;
      matched += 1;
      updateHud();
      lockTimer = setTimeout(() => {
        setTileClass(side, id, "gone");
        setTileClass(other.side, other.id, "gone");
        selection = null;
        if (matched >= BOARD_SIZE) loadBoard(pool);
        else locked = false;
      }, CLEAR_MS);
      return;
    }

    sfx.miss();
    missedRound[id] = true;
    missedRound[other.id] = true;
    markTrouble(id);
    markTrouble(other.id);
    setTileClass(side, id, "wrong");
    setTileClass(other.side, other.id, "wrong");
    lockTimer = setTimeout(() => {
      setTileClass(side, id, "idle");
      setTileClass(other.side, other.id, "idle");
      selection = null;
      locked = false;
    }, WRONG_MS);
  }

  function renderShell() {
    const topicOpts = [`<option value="${ALL}">Whole ${esc(level)}</option>`]
      .concat(
        topicsOf(vocab).map(
          (t) =>
            `<option value="${esc(t)}"${t === topic ? " selected" : ""}>${esc(t)}</option>`,
        ),
      )
      .join("");
    const best = readBest(topic, minutes);
    root.innerHTML = `
      <div class="sprint">
        <div class="practice-head"><h2>${esc(title)}</h2></div>
        <p class="home-hint">Check, not a lesson — one full round fruits it.</p>

        <div id="sprint-start">
          <p class="lede">Six pairs at a time, from the ${esc(level)} words in the app. Tap English, then Czech. Beat the clock.</p>
          <div class="sprint-actions">
            <label class="sprint-field">Word set
              <select id="sprint-topic">${topicOpts}</select>
            </label>
            <label class="sprint-field">Time
              <select id="sprint-minutes">
                <option value="1"${minutes === 1 ? " selected" : ""}>1 minute</option>
                <option value="2"${minutes === 2 ? " selected" : ""}>2 minutes</option>
                <option value="3"${minutes === 3 ? " selected" : ""}>3 minutes</option>
              </select>
            </label>
            <button type="button" class="btn primary" id="sprint-btn-play">Play</button>
            <p class="sprint-best"${best ? "" : " hidden"}>Best <span>${best}</span></p>
          </div>
          <p class="home-hint">${vocab.length} words in the pool.</p>
        </div>

        <div id="sprint-play" hidden>
          <div class="sprint-hud">
            <div>
              <p class="hud-label">Time</p>
              <p class="hud-value" id="sprint-time">1:00</p>
            </div>
            <div>
              <p class="hud-label">Score</p>
              <p class="hud-value" id="sprint-score">0</p>
            </div>
          </div>
          <div class="sprint-bar" id="sprint-bar"><i id="sprint-bar-fill"></i></div>
          <div class="sprint-cols"><p>English</p><p>Čeština</p></div>
          <div class="sprint-board" id="sprint-board"></div>
        </div>

        <div id="sprint-results" hidden>
          <p class="kicker">Time’s up</p>
          <p class="score-hero" id="sprint-final">0<small> pairs</small></p>
          <p class="note" id="sprint-note">Best 0</p>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="sprint-btn-practice" hidden>Practice</button>
            <button type="button" class="btn primary" id="sprint-btn-again">Play again</button>
          </div>
          <section class="sprint-recap" id="sprint-recap" hidden>
            <h3>This round</h3>
            <ul class="sprint-recap-list" id="sprint-recap-list"></ul>
          </section>
        </div>
        ${practicePanelHtml()}
      </div>
    `;

    root.querySelector("#sprint-topic")?.addEventListener("change", (e) => {
      topic = e.target.value || ALL;
      try {
        localStorage.setItem(ACTIVE.topic, topic);
      } catch {
        /* */
      }
      const b = readBest(topic, minutes);
      const line = root.querySelector(".sprint-best");
      if (line) {
        line.hidden = !b;
        const span = line.querySelector("span");
        if (span) span.textContent = String(b);
      }
    });
    root.querySelector("#sprint-minutes")?.addEventListener("change", (e) => {
      minutes = parseInt(e.target.value, 10) || 1;
      roundMs = minutes * 60000;
      try {
        localStorage.setItem(ACTIVE.minutes, String(minutes));
      } catch {
        /* */
      }
    });
    root.querySelector("#sprint-btn-play")?.addEventListener("click", startGame);
    root.querySelector("#sprint-btn-again")?.addEventListener("click", startGame);
    root.querySelector("#sprint-board")?.addEventListener("click", (event) => {
      const btn = event.target.closest("button.sprint-tile");
      if (!btn) return;
      onTile(btn.getAttribute("data-side"), btn.getAttribute("data-id"));
    });
    practice = bindPractice({
      root,
      getTypePool: () => filterTypeInPool(vocab),
      sfx,
      smoke(phase, extra = {}) {
        setSmokeContext({
          packId: selfId,
          packTitle: title,
          stage: "type",
          checkPhase: phase,
          itemIndex: 0,
          en: extra.en || "",
          cz: extra.cz || "",
          gap: "",
          gap_answer: extra.en || "",
          typed: extra.typed || "",
        });
      },
      onFinish({ origin, results, leftover }) {
        screen = "results";
        const panel = root.querySelector("#sprint-practice");
        if (panel) panel.hidden = true;
        root.querySelector("#sprint-results").hidden = false;
        const right = results.filter((r) => r.ok).length;
        const kicker = root.querySelector("#sprint-results .kicker");
        if (kicker) {
          kicker.textContent =
            origin === "start" ? "Type-in done" : "Practice done";
        }
        const hero = root.querySelector("#sprint-final");
        if (hero) {
          hero.innerHTML = `${esc(String(right))}<small> / ${esc(
            String(results.length),
          )}</small>`;
        }
        const note = root.querySelector("#sprint-note");
        if (note) {
          const left = results.length - right;
          note.textContent =
            left === 0
              ? "All correct."
              : left + (left === 1 ? " to come back to." : " to come back to.");
        }
        recapPracticeAnswers(root, results);
        paintPracticeButton(root, leftover);
      },
    });
    root.querySelector("#sprint-btn-practice")?.addEventListener("click", () => {
      const list = buildPracticeList(
        filterTypeInPool(vocab),
        Object.keys(missedRound),
      );
      if (practice.start(list, "results")) screen = "practice";
    });
  }

  function onPracticeKey(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (!practice?.isActive()) return;
    const t = e.target;
    if (t && t.closest && t.closest("#btn-practice-back")) return;
    if (t && t.closest && t.closest("#smoke-flags-host")) return;
    e.preventDefault();
    e.stopPropagation();
    practice.handleEnter();
  }

  function teardown() {
    if (rafId) cancelAnimationFrame(rafId);
    if (lockTimer) clearTimeout(lockTimer);
    rafId = 0;
    document.removeEventListener("keydown", onPracticeKey, true);
    practice?.stop();
  }

  document.addEventListener("keydown", onPracticeKey, true);
  root._RUE2UnbindKeys = teardown;

  root.innerHTML = `<p class="home-hint">Loading ${esc(level)} words…</p>`;
  loadVocabPool(tree, loadJson, selfId, level)
    .then((list) => {
      vocab = list;
      if (topic !== ALL && !topicsOf(vocab).includes(topic)) topic = ALL;
      renderShell();
    })
    .catch((e) => {
      root.innerHTML = `<p class="home-hint">Could not load the ${esc(level)} word pool. ${esc(
        e.message || e,
      )}</p>`;
    });

  void onExit;
}

export function startVocabTypeSprint({
  root,
  node,
  loadJson,
  tree,
  onExit,
  onFruit,
}) {
  const level = levelFromNode(node);
  activateSprintKeys(level);
  const selfId = node?.id || `${level.toLowerCase()}_vocab_type`;
  const title = node?.label || `${level} vocab · type`;

  /* One whole-set round through the check is the bar — it checks material
   * learned in the units above it, so there is no ladder to walk. A topic
   * filter is a subset, not the check, so it never fruits.
   * (James, 2026-08-31: "you only have to do one round of it".) */
  function fruitCheckRound(whole) {
    if (!whole) return;
    const r = completeCheckRound(selfId);
    if (r.justFruited) onFruit?.({ grow: true });
    else if (r.nowFruit) onFruit?.({ grow: false });
  }

  let vocab = [];
  let topic = ALL;
  try {
    const saved = localStorage.getItem(ACTIVE.topic);
    if (saved) topic = saved;
  } catch {
    /* */
  }
  let screen = "start";
  let round = [];
  let idx = 0;
  let score = 0;
  let answered = false;
  let typedNow = "";
  let audioCtx = null;
  let practice = null;

  function activeVocab() {
    if (topic === ALL) return vocab;
    const out = vocab.filter((w) => w.t === topic);
    return out.length ? out : vocab;
  }

  function unlockAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, gain, slideTo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        audioCtx.currentTime + duration,
      );
    }
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    match() {
      beep(523.25, 0.07, "triangle", 0.045);
      setTimeout(() => beep(783.99, 0.11, "triangle", 0.04), 55);
    },
    miss() {
      beep(196, 0.09, "square", 0.028, 140);
    },
    start() {
      beep(392, 0.08, "sine", 0.04);
      setTimeout(() => beep(523.25, 0.1, "sine", 0.04), 80);
    },
    end() {
      beep(246.94, 0.22, "sine", 0.05, 130);
    },
  };

  function startingPool() {
    const active = activeVocab();
    const t = readTrouble();
    const first = [];
    const rest = [];
    for (const w of active) {
      if (w.id in t) first.push(w);
      else rest.push(w);
    }
    return shuffle(first).concat(shuffle(rest));
  }

  function current() {
    return round[idx] || null;
  }

  function smoke(phase, extra = {}) {
    const w = current();
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "type",
      checkPhase: phase,
      itemIndex: idx,
      en: w?.en || extra.en || "",
      cz: w?.cz || extra.cz || "",
      gap: "",
      gap_answer: w?.en || "",
      typed: extra.typed || typedNow || "",
    });
  }

  function updateHud() {
    const $pos = root.querySelector("#sprint-pos");
    const $score = root.querySelector("#sprint-score");
    if ($pos) {
      $pos.textContent = round.length
        ? `${Math.min(idx + 1, round.length)}/${round.length}`
        : "0/0";
    }
    if ($score) $score.textContent = String(score);
  }

  function renderItem() {
    const w = current();
    const prompt = root.querySelector("#sprint-prompt");
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !prompt || !inp || !fb || !chk) return;
    answered = false;
    typedNow = "";
    prompt.textContent = w.cz;
    paintLetterClue(root.querySelector("#sprint-clue"), w.en);
    inp.value = "";
    inp.disabled = false;
    fb.textContent = "";
    fb.className = "fb";
    chk.textContent = "Check";
    chk.disabled = false;
    updateHud();
    smoke("type");
    inp.focus();
  }

  function renderRecap() {
    const list = root.querySelector("#sprint-recap-list");
    const wrap = root.querySelector("#sprint-recap");
    if (!list || !wrap) return;
    let html = "";
    for (const w of round) {
      const miss = !w.ok;
      const wrote =
        miss && w.typed
          ? `<span class="wrote">you wrote ${esc(w.typed)}</span>`
          : "";
      html +=
        `<li class="${miss ? "missed" : ""}">` +
        `<span class="sprint-mark">${miss ? "✗" : "✓"}</span>` +
        `<b>${esc(w.en)}</b><span>${esc(w.cz)}</span>${wrote}</li>`;
    }
    list.innerHTML = html;
    wrap.hidden = round.length === 0;
  }

  function showResults() {
    sfx.end();
    fruitCheckRound(topic === ALL);
    const best = readTypeBest(topic);
    if (score > best) writeTypeBest(topic, score);
    const newBest = Math.max(best, score);
    screen = "results";
    const hero = root.querySelector("#sprint-final");
    const note = root.querySelector("#sprint-note");
    if (hero) {
      hero.innerHTML = `${esc(String(score))}<small> / ${esc(
        String(round.length),
      )}</small>`;
    }
    if (note) {
      note.textContent =
        score > 0 && score >= newBest ? "New best score." : `Best ${newBest}`;
    }
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-play").hidden = true;
    const prPanel = root.querySelector("#sprint-practice");
    if (prPanel) prPanel.hidden = true;
    root.querySelector("#sprint-results").hidden = false;
    renderRecap();
    paintPracticeButton(
      root,
      buildPracticeList(
        vocab,
        round.filter((w) => !w.ok).map((w) => w.id),
      ),
    );
    smoke("results", { en: "", cz: "", typed: "" });
  }

  function goNext() {
    if (!answered) return;
    if (idx + 1 >= round.length) {
      showResults();
      return;
    }
    idx += 1;
    renderItem();
  }

  function grade() {
    if (screen !== "playing" || answered) return;
    const w = current();
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !inp || !fb || !chk) return;
    const typed = String(inp.value || "");
    typedNow = typed;
    const verdict = gradeTypeIn(typed, w, vocab);
    answered = true;
    w.typed = typed;
    w.ok = verdict.ok;
    inp.disabled = true;
    if (verdict.ok) {
      sfx.match();
      score += 1;
      w.ok = true;
      creditTrouble(w.id);
      fb.className = "fb good";
      if (verdict.reason === "typo" || verdict.reason === "accent") {
        fb.innerHTML = `✓ Correct — spelling: <span class="reveal">${esc(
          w.en,
        )}</span>`;
      } else if (verdict.reason === "sibling") {
        fb.innerHTML = `✓ Correct — also: <span class="reveal">${esc(
          w.en,
        )}</span>`;
      } else {
        fb.textContent = "✓ Correct";
      }
    } else {
      sfx.miss();
      markTrouble(w.id);
      fb.className = "fb bad";
      const wrote = typed.trim()
        ? ` you wrote ${esc(typed.trim())}`
        : "";
      fb.innerHTML = `✗ ${esc(w.en)}<span class="wrote">${wrote}</span>`;
    }
    chk.textContent = idx + 1 >= round.length ? "Score →" : "Next";
    updateHud();
    smoke("type", { typed });
    chk.focus();
  }

  function startRound() {
    unlockAudio();
    sfx.start();
    const source = startingPool();
    const n = Math.min(TYPE_SIZE, source.length);
    round = source.slice(0, n).map((w) => ({ ...w, typed: "", ok: null }));
    idx = 0;
    score = 0;
    answered = false;
    typedNow = "";
    screen = "playing";
    practice?.stop();
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-results").hidden = true;
    const prPanel = root.querySelector("#sprint-practice");
    if (prPanel) prPanel.hidden = true;
    root.querySelector("#sprint-play").hidden = false;
    renderItem();
  }

  function onKeydown(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const t = e.target;
    if (t && t.closest && t.closest("#btn-practice-back")) return;
    if (t && t.closest && t.closest("#smoke-flags-host")) return;
    if (t && t.closest && t.closest("select")) return;
    if (t && t.closest && t.closest("textarea")) return;
    e.preventDefault();
    e.stopPropagation();
    if (practice?.handleEnter()) return;
    if (screen === "start") {
      root.querySelector("#sprint-btn-play")?.click();
      return;
    }
    if (screen === "results") {
      const prBtn = root.querySelector("#sprint-btn-practice");
      if (prBtn && !prBtn.hidden) prBtn.click();
      else root.querySelector("#sprint-btn-again")?.click();
      return;
    }
    if (screen === "playing") {
      if (answered) goNext();
      else grade();
    }
  }

  function renderShell() {
    const topicOpts = [`<option value="${ALL}">Whole ${esc(level)}</option>`]
      .concat(
        topicsOf(vocab).map(
          (t) =>
            `<option value="${esc(t)}"${t === topic ? " selected" : ""}>${esc(t)}</option>`,
        ),
      )
      .join("");
    const best = readTypeBest(topic);
    root.innerHTML = `
      <div class="sprint sprint-type">
        <div class="practice-head"><h2>${esc(title)}</h2></div>
        <p class="home-hint">Check, not a lesson — one full round fruits it.</p>

        <div id="sprint-start">
          <p class="lede">Czech on the screen, type the English. Twelve ${esc(level)} words at a time. No clock. Misses come first next time.</p>
          <div class="sprint-actions">
            <label class="sprint-field">Word set
              <select id="sprint-topic">${topicOpts}</select>
            </label>
            <button type="button" class="btn primary" id="sprint-btn-play">Play</button>
            <p class="sprint-best"${best ? "" : " hidden"}>Best <span>${best}</span></p>
          </div>
          <p class="home-hint">${vocab.length} words in the pool.</p>
        </div>

        <div id="sprint-play" hidden>
          <div class="sprint-hud">
            <div>
              <p class="hud-label">Word</p>
              <p class="hud-value" id="sprint-pos">1/${TYPE_SIZE}</p>
            </div>
            <div>
              <p class="hud-label">Score</p>
              <p class="hud-value" id="sprint-score">0</p>
            </div>
          </div>
          <div class="sprint-type-card">
            <p class="sub">Write in English · Enter = check / next</p>
            <p class="prompt" id="sprint-prompt"></p>
            <div class="type-clue" id="sprint-clue" hidden></div>
            <input class="type-in" id="ti" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here…" lang="en" aria-label="English" />
            <div class="fb" id="tfb"></div>
            <div class="sprint-actions">
              <button type="button" class="btn primary" id="chk">Check</button>
            </div>
          </div>
        </div>

        <div id="sprint-results" hidden>
          <p class="kicker">Round over</p>
          <p class="score-hero" id="sprint-final">0<small> / 12</small></p>
          <p class="note" id="sprint-note">Best 0</p>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="sprint-btn-practice" hidden>Practice</button>
            <button type="button" class="btn primary" id="sprint-btn-again">Play again</button>
          </div>
          <section class="sprint-recap" id="sprint-recap" hidden>
            <h3>This round</h3>
            <ul class="sprint-recap-list type-recap" id="sprint-recap-list"></ul>
          </section>
        </div>
        ${practicePanelHtml()}
      </div>
    `;

    root.querySelector("#sprint-topic")?.addEventListener("change", (e) => {
      topic = e.target.value || ALL;
      try {
        localStorage.setItem(ACTIVE.topic, topic);
      } catch {
        /* */
      }
      const b = readTypeBest(topic);
      const line = root.querySelector(".sprint-best");
      if (line) {
        line.hidden = !b;
        const span = line.querySelector("span");
        if (span) span.textContent = String(b);
      }
    });
    root.querySelector("#sprint-btn-play")?.addEventListener("click", startRound);
    root.querySelector("#sprint-btn-again")?.addEventListener("click", startRound);
    root.querySelector("#chk")?.addEventListener("click", () => {
      if (answered) goNext();
      else grade();
    });
    root.querySelector("#ti")?.addEventListener("input", (e) => {
      typedNow = e.target.value || "";
      smoke("type", { typed: typedNow });
    });
    practice = bindPractice({
      root,
      getTypePool: () => vocab,
      sfx,
      smoke,
      onFinish({ origin, results, leftover }) {
        screen = "results";
        const panel = root.querySelector("#sprint-practice");
        if (panel) panel.hidden = true;
        root.querySelector("#sprint-results").hidden = false;
        const right = results.filter((r) => r.ok).length;
        const kicker = root.querySelector("#sprint-results .kicker");
        if (kicker) {
          kicker.textContent =
            origin === "start" ? "Type-in done" : "Practice done";
        }
        const hero = root.querySelector("#sprint-final");
        if (hero) {
          hero.innerHTML = `${esc(String(right))}<small> / ${esc(
            String(results.length),
          )}</small>`;
        }
        const note = root.querySelector("#sprint-note");
        if (note) {
          const left = results.length - right;
          note.textContent =
            left === 0
              ? "All correct."
              : left + (left === 1 ? " to come back to." : " to come back to.");
        }
        recapPracticeAnswers(root, results);
        paintPracticeButton(root, leftover);
      },
    });
    root.querySelector("#sprint-btn-practice")?.addEventListener("click", () => {
      const list = buildPracticeList(
        vocab,
        round.filter((w) => !w.ok).map((w) => w.id),
      );
      if (practice.start(list, "results")) screen = "practice";
    });
  }

  function teardown() {
    document.removeEventListener("keydown", onKeydown, true);
    practice?.stop();
  }

  document.addEventListener("keydown", onKeydown, true);
  root._RUE2UnbindKeys = teardown;

  root.innerHTML = `<p class="home-hint">Loading ${esc(level)} words…</p>`;
  loadVocabPool(tree, loadJson, selfId, level)
    .then((list) => {
      vocab = filterTypeInPool(list);
      if (topic !== ALL && !topicsOf(vocab).includes(topic)) topic = ALL;
      renderShell();
    })
    .catch((e) => {
      root.innerHTML = `<p class="home-hint">Could not load the ${esc(level)} word pool. ${esc(
        e.message || e,
      )}</p>`;
    });

  void onExit;
}

const GAP_MARK = /_{2,}|\u2026|\.{3}/;

function gKeys(level) {
  const lv = String(level || "A1").toLowerCase();
  return {
    trouble: `rue-exp-sprint-trouble:${lv}_grammar_match`,
    best: `rue-exp-sprint-best:${lv}_grammar_match`,
    minutes: `rue-exp-sprint-minutes:${lv}_grammar_match`,
    typeBest: `rue-exp-sprint-best:${lv}_grammar_type`,
    typeTopic: `rue-exp-sprint-topic:${lv}_grammar_type`,
  };
}

/** Default A1 so tests that grade without a sprint keep the old keys. */
let G_ACTIVE = gKeys("A1");

function activateGKeys(level) {
  G_ACTIVE = gKeys(level);
}

/** Smoked A1 grammar (INSPECTED.md, 2026-08-30). Runtime pool source. */
const SMOKED_A1_GRAMMAR = new Set([
  "a1_be_have",
  "a1_agreement",
  "a1_and_but_because",
  "a1_articles",
  "a1_can",
  "a1_frequency",
  "a1_imperatives",
  "a1_like_want_need",
  "a1_object_pronouns",
  "a1_possessives",
  "a1_prepositions_place",
  "a1_prepositions_time",
  "a1_present_simple",
  "a1_question_words",
  "a1_questions_negatives",
  "a1_some_any",
  "a1_there_is",
  "a1_to_for_with",
  "a1_word_classes",
  "a1_word_order",
]);

const SKIP_WHICH_SRC = new Set([
  "a1_word_classes",
  "a1_word_order",
  "a1_prepositions_place",
]);

/** Type-in: skip metalanguage + picture-only place (A0 bag in/under the table). */
const SKIP_TYPE_SRC = new Set([
  "a1_word_classes",
  "a1_prepositions_place",
]);

const CHECK_G_PRACTICES = new Set([
  "grammar_match_sprint",
  "grammar_type_sprint",
  "use_sprint",
]);

const MEANING_FAMILIES = [
  new Set(["who", "what", "where", "when", "why", "how"]),
  new Set(["my", "your", "his", "her", "our", "their", "mine", "yours"]),
  new Set(["always", "usually", "often", "sometimes", "never"]),
  new Set(["a", "an", "the", "—", "-", "–", ""]),
  new Set(["and", "but", "because"]),
  new Set(["to", "for", "with"]),
  new Set(["me", "him", "her", "us", "them", "it", "you"]),
  new Set(["i", "he", "she", "we", "they"]),
];
const POSS_CHIPS = new Set([
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "mine",
  "yours",
]);
const BE_CHIPS = new Set(["am", "is", "are", "was", "were", "be", "been"]);
const HAVE_CHIPS = new Set(["have", "has", "had"]);
/** Fronted-question chips that take a base verb (Can she drive? / Does she drive?). */
const BASE_Q_AUX = new Set([
  "can",
  "could",
  "will",
  "would",
  "should",
  "may",
  "must",
  "do",
  "does",
  "did",
]);
/** Present → past. Agreement errors (have/has, go/goes) stay as wrongs. */
const PAST_OF = {
  have: "had",
  has: "had",
  am: "was",
  is: "was",
  are: "were",
  do: "did",
  does: "did",
  go: "went",
  goes: "went",
  speak: "spoke",
  speaks: "spoke",
  eat: "ate",
  eats: "ate",
  know: "knew",
  knows: "knew",
};
const SHORT_AUX = new Set([
  "can",
  "can't",
  "cannot",
  "can not",
  "do",
  "don't",
  "does",
  "doesn't",
  "am",
  "is",
  "are",
  "am not",
  "is not",
  "are not",
  "isn't",
  "aren't",
  "have",
  "haven't",
  "has",
  "hasn't",
  "did",
  "didn't",
  "will",
  "won't",
]);
const THERE_CHIPS = new Set([
  "there is",
  "there are",
  "there's",
  "there isn't",
  "there aren't",
  "is there",
  "are there",
  "isn't there",
  "aren't there",
]);
const IT_THEY_CHIPS = new Set([
  "it is",
  "it's",
  "they are",
  "they're",
  "it isn't",
  "they aren't",
  "it is not",
  "they are not",
]);

function gReadBest(minutes) {
  const map = readJson(G_ACTIVE.best, {}) || {};
  const n = parseInt(map[String(minutes || 0)] || 0, 10);
  return Number.isFinite(n) ? n : 0;
}

function gWriteBest(minutes, value) {
  const map = readJson(G_ACTIVE.best, {}) || {};
  map[String(minutes || 0)] = value;
  writeJson(G_ACTIVE.best, map);
}

function gReadTrouble() {
  const raw = readJson(G_ACTIVE.trouble, {}) || {};
  return raw && typeof raw === "object" ? raw : {};
}

function gMarkTrouble(id) {
  const t = gReadTrouble();
  t[String(id)] = 0;
  writeJson(G_ACTIVE.trouble, t);
}

function gCreditTrouble(id) {
  const t = gReadTrouble();
  const k = String(id);
  if (!(k in t)) return;
  t[k] = (t[k] || 0) + 1;
  if (t[k] >= CLEAR_AT) delete t[k];
  writeJson(G_ACTIVE.trouble, t);
}

/** This round’s misses plus leftover trouble, max 12. */
export function buildWhichPracticeList(pool, extraIds) {
  const t = gReadTrouble();
  const want = new Set(Object.keys(t).map(String));
  for (const id of extraIds || []) {
    if (id != null && id !== "") want.add(String(id));
  }
  const out = [];
  const seen = new Set();
  for (const w of pool || []) {
    const id = String(w.id);
    if (!want.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(w);
  }
  return shuffle(out).slice(0, WHICH_SIZE);
}

function paintWhichPracticeButton(root, list) {
  const btn = root.querySelector("#sprint-btn-practice");
  const again = root.querySelector("#sprint-btn-again");
  if (!btn) return;
  if (!list.length) {
    btn.hidden = true;
    again?.classList.add("primary");
    return;
  }
  btn.hidden = false;
  btn.textContent =
    "Practice " +
    list.length +
    (list.length === 1 ? " sentence" : " sentences");
  again?.classList.remove("primary");
}

/** Explanation + teaching-unit link after an answer (Which and grammar type-in). */
function paintWhy(root, w) {
  const box = root.querySelector("#which-why");
  const expl = root.querySelector("#which-expl");
  const link = root.querySelector("#which-unit");
  if (!box) return;
  const text = String(w?.why || "").trim();
  if (expl) {
    expl.innerHTML = text ? escMd(text) : "";
    expl.hidden = !text;
  }
  if (link) {
    if (w?.src) {
      link.hidden = false;
      link.setAttribute("href", "#" + w.src);
      link.textContent = "Open " + (w.t || w.src) + " →";
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }
  }
  box.hidden = !text && !w?.src;
}

function formKey(ans) {
  return String(ans || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function sentKey(s) {
  return formKey(s).replace(/[.,!?;:'"’]/g, "");
}

export function fillGrammarGap(gap, chip) {
  const g = String(gap || "");
  if (!GAP_MARK.test(g)) return null;
  let piece = String(chip ?? "").trim();
  if (piece === "—" || piece === "-" || piece === "–") piece = "";
  const idx = g.search(GAP_MARK);
  if (idx === 0 && piece && piece.charAt(0) === piece.charAt(0).toLowerCase()) {
    piece = piece.charAt(0).toUpperCase() + piece.slice(1);
  }
  let out = g.replace(GAP_MARK, piece);
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
  return out || null;
}

/**
 * Type stem cues `(just/take)` and extra clauses (`I am not now`) stay on
 * Quiz/Type. Which is three full sentences the same shape as `en`
 * (James, a2_grammar_match 2026-09-03).
 */
export function whichGap(gap) {
  let g = String(gap || "").trim();
  g = g.replace(/(?:\s*\([^)]*\))+\s*$/g, "").trim();
  if (!GAP_MARK.test(g)) return g;
  if (!/[.?!]/.test(g)) return g;
  const parts = [];
  let buf = "";
  for (const ch of g) {
    buf += ch;
    if (ch === "." || ch === "?" || ch === "!") {
      const piece = buf.trim();
      if (piece) parts.push(piece);
      buf = "";
    }
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);
  const keep = parts.filter((p) => GAP_MARK.test(p));
  return keep.length ? keep.join(" ") : g;
}

/** Irregular participles that are not also the past (*taken* ≠ *took*). */
const IRREG_PP_NOT_PAST = new Set([
  "taken",
  "gone",
  "seen",
  "eaten",
  "written",
  "done",
  "been",
  "given",
  "spoken",
  "driven",
  "broken",
  "chosen",
  "forgotten",
  "known",
  "shown",
  "worn",
  "grown",
  "flown",
  "thrown",
  "rung",
  "sung",
  "drunk",
  "swum",
  "come",
  "become",
  "run",
]);

function isUsedToForm(s) {
  const k = formKey(s);
  return /\bused to\b/.test(k) || /\buse to\b/.test(k);
}

function isUsedToFormError(chip) {
  const kc = formKey(chip);
  if (/\bused to\s+[a-z]+ing\b/.test(kc)) return true;
  if (/\bdidn'?t used to\b/.test(kc) || /\bdid not used to\b/.test(kc)) {
    return true;
  }
  if (/^use to\b/.test(kc)) return true;
  return false;
}

function isBareParticipleFragment(chip) {
  const kc = formKey(chip);
  if (/^(have|has|had|was|were|is|are|am)\b/.test(kc)) return false;
  const words = kc.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] || "";
  return IRREG_PP_NOT_PAST.has(last);
}

/** more carefully ↔ carefully ↔ most carefully. Not *carefuler* / *more longer*. */
function isDegreeTwin(ans, chip) {
  const ka = formKey(ans);
  const kc = formKey(chip);
  const moreMost = (s) => {
    const m = s.match(/^(more|most|less|least)\s+(.+)$/);
    return m ? { deg: m[1], base: m[2] } : null;
  };
  const a = moreMost(ka);
  const c = moreMost(kc);
  if (a && !c && a.base === kc) return true;
  if (c && !a && c.base === ka) {
    if (/(er|est)$/.test(ka) || /^(better|worse|further|farther)$/.test(ka)) {
      return false;
    }
    return true;
  }
  if (a && c && a.base === c.base && a.deg !== c.deg) return true;
  const stem = (s) => s.replace(/(er|est)$/, "");
  if (
    /(er)$/.test(ka) &&
    /(est)$/.test(kc) &&
    stem(ka) === stem(kc) &&
    ka.length > 3
  ) {
    return true;
  }
  if (
    /(est)$/.test(ka) &&
    /(er)$/.test(kc) &&
    stem(ka) === stem(kc) &&
    ka.length > 3
  ) {
    return true;
  }
  return false;
}

/**
 * True = do not use as a Which distractor: still real English without Czech,
 * or a chip that cannot sit in this frame (*too a few cars*).
 */
function whichChipIsRealEnglish(ans, chip, gap) {
  const g = whichGap(gap);
  const kc = formKey(chip);
  if (/\btoo\s+(_{2,}|\u2026|\.{3})/i.test(g)) {
    if (/^a\s+(few|little)\b/.test(kc)) return true;
    if (/^(lots of|a lot of)\b/.test(kc)) return true;
  }
  if (isDegreeTwin(ans, chip)) return true;
  if (isUsedToForm(ans)) return !isUsedToFormError(chip);
  const ka = formKey(ans);
  /* Present/past perfect VP (*has already finished*), not bare *have*. */
  if (/^(have|has|had)\s+/.test(ka)) {
    if (isBareParticipleFragment(chip)) return false;
    if (/^(have|has|had)\b/.test(kc)) {
      const auxA = ka.match(/^(have|has|had)/)[1];
      const auxC = kc.match(/^(have|has|had)/)[1];
      if (auxA !== auxC) return false;
    }
    return true;
  }
  return false;
}

function isQuestionOrNeg(gap) {
  const s = String(gap || "");
  if (/\?/.test(s)) return true;
  return /\b(n't|not|never|no)\b/i.test(s);
}

function gapIndex(gap) {
  return String(gap || "").search(GAP_MARK);
}

function wordAfterGap(gap) {
  const g = String(gap || "");
  const idx = gapIndex(g);
  if (idx < 0) return "";
  const rest = g.slice(idx).replace(GAP_MARK, "");
  const m = rest.match(/^\s*([A-Za-z][A-Za-z']*)/);
  return m ? m[1].toLowerCase() : "";
}

function qAuxAgrees(aux, subj) {
  const a = formKey(aux);
  if (!subj) return false;
  if (
    a === "can" ||
    a === "could" ||
    a === "will" ||
    a === "would" ||
    a === "should" ||
    a === "may" ||
    a === "must" ||
    a === "did"
  ) {
    return true;
  }
  if (a === "do") {
    return subj === "i" || subj === "you" || subj === "we" || subj === "they";
  }
  if (a === "does") {
    return !["i", "you", "we", "they"].includes(subj);
  }
  return false;
}

function isShortAnswerGap(gap) {
  return /^(yes|no)\b/i.test(String(gap || ""));
}

function stripNeg(s) {
  let t = formKey(s)
    .replace(/n't\b/g, "")
    .replace(/\bnot\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t === "ca") t = "can";
  if (t === "wo") t = "will";
  return t;
}

function isPolarityTwin(a, b) {
  const ka = formKey(a);
  const kb = formKey(b);
  const na = /n't|\bnot\b/.test(ka);
  const nb = /n't|\bnot\b/.test(kb);
  if (na === nb) return false;
  return stripNeg(ka) === stripNeg(kb);
}

function verbStem(form) {
  const f = formKey(form);
  if (f.endsWith("ies") && f.length > 4) return f.slice(0, -3) + "y";
  if (/(?:ch|sh|x|ss|zz|o)es$/.test(f) && f.length > 4) return f.slice(0, -2);
  if (f.endsWith("s") && !f.endsWith("ss") && f.length > 3) return f.slice(0, -1);
  return f;
}

function regularPastOf(form) {
  const stem = verbStem(form);
  if (stem.endsWith("y") && stem.length > 2 && !/[aeiou]y$/.test(stem)) {
    return stem.slice(0, -1) + "ied";
  }
  if (stem.endsWith("e")) return stem + "d";
  return stem + "ed";
}

function isTenseTwin(a, b) {
  const ka = formKey(a);
  const kb = formKey(b);
  if (PAST_OF[ka] === kb || PAST_OF[kb] === ka) return true;
  if (regularPastOf(ka) === kb || regularPastOf(kb) === ka) return true;
  return false;
}

function sameMeaningFamily(a, b) {
  const ka = formKey(a);
  const kb = formKey(b);
  if (!ka || !kb || ka === kb) return false;
  for (const fam of MEANING_FAMILIES) {
    if (fam.has(ka) && fam.has(kb)) return true;
  }
  return false;
}

/**
 * True when filling the gap with `chip` would still be real English
 * (another possible preposition, a/the, who/what, …). Those chips
 * are not distractors for Which is correct?
 */
export function chipIsPossibleEnglish(ans, chip, gap, corpus) {
  const ka = formKey(ans);
  const kc = formKey(chip);
  if (!kc || ka === kc) return true;
  if (sameMeaningFamily(ans, chip)) return true;
  if (POSS_CHIPS.has(kc)) return true;
  if (
    (BE_CHIPS.has(ka) && HAVE_CHIPS.has(kc)) ||
    (HAVE_CHIPS.has(ka) && BE_CHIPS.has(kc))
  ) {
    return true;
  }
  if (/^you\s+/.test(kc)) return true;
  if (/^to\s+/.test(kc) && gapIndex(gap) === 0) return true;
  if (isTenseTwin(ans, chip)) return true;
  if (isShortAnswerGap(gap) && SHORT_AUX.has(kc)) return true;
  if (isPolarityTwin(ans, chip)) return true;
  if (THERE_CHIPS.has(ka) && IT_THEY_CHIPS.has(kc)) return true;
  if (IT_THEY_CHIPS.has(ka) && THERE_CHIPS.has(kc)) return true;
  if (THERE_CHIPS.has(ka) && THERE_CHIPS.has(kc)) {
    const wa = ka.split(" ").sort().join(" ");
    const wb = kc.split(" ").sort().join(" ");
    if (wa === wb) return true;
  }
  if (
    BASE_Q_AUX.has(ka) &&
    BASE_Q_AUX.has(kc) &&
    gapIndex(gap) === 0 &&
    /\?/.test(String(gap || ""))
  ) {
    const subj = wordAfterGap(gap);
    if (qAuxAgrees(chip, subj)) return true;
  }
  const someAny =
    (ka === "some" && kc === "any") || (ka === "any" && kc === "some");
  if (someAny && isQuestionOrNeg(gap)) return true;
  const sent = fillGrammarGap(gap, chip);
  if (sent && corpus && corpus.has(sentKey(sent))) return true;
  return false;
}

function looksLikeSentence(en) {
  const s = String(en || "").trim();
  if (!s) return false;
  if (/[.?!]/.test(s)) return true;
  return s.split(/\s+/).filter(Boolean).length >= 3;
}

/**
 * One Which item, or null if the gap cannot yield two clearly-impossible
 * English sentences.
 */
export function whichItemFromPackItem(it, meta = {}) {
  const { src = "", topic = "", corpus = new Set() } = meta;
  if (src && SKIP_WHICH_SRC.has(src)) return null;
  if (it?.diagram) return null;
  const en = String(it?.en || "").trim();
  const gap = String(it?.gap || "").trim();
  const ans = String(it?.gap_answer || "").trim();
  const opts = Array.isArray(it?.quiz_options) ? it.quiz_options : [];
  if (!en || !gap || !ans) return null;
  if (!looksLikeSentence(en)) return null;
  if (!GAP_MARK.test(gap)) return null;
  if ((gap.match(GAP_MARK) || []).length !== 1) return null;
  if (opts.length < 3) return null;
  const gapForWhich = whichGap(gap);
  if (!GAP_MARK.test(gapForWhich)) return null;
  if ((gapForWhich.match(GAP_MARK) || []).length !== 1) return null;
  const wrongs = [];
  const seen = new Set([sentKey(en)]);
  for (const chip of opts) {
    if (formKey(chip) === formKey(ans)) continue;
    if (chipIsPossibleEnglish(ans, chip, gap, corpus)) continue;
    if (whichChipIsRealEnglish(ans, chip, gap)) continue;
    const sent = fillGrammarGap(gapForWhich, chip);
    if (!sent || seen.has(sentKey(sent))) continue;
    if (sentKey(sent) === sentKey(en)) continue;
    if (corpus && corpus.has(sentKey(sent))) continue;
    seen.add(sentKey(sent));
    wrongs.push(sent);
  }
  if (wrongs.length < 2) return null;
  return {
    en,
    wrongs: shuffle(wrongs).slice(0, 2),
    t: topic || "",
    src: src || "",
    why: String(it?.explanation || "").trim(),
  };
}

const grammarPoolCacheByLevel = Object.create(null);

function isGrammarPoolNode(n, selfId, level) {
  if (n.domain !== "grammar") return false;
  if (n.status !== "live" || !n.content) return false;
  if (n.id === selfId) return false;
  if (!(n.levels || []).includes(level)) return false;
  if (CHECK_G_PRACTICES.has(n.practice)) return false;
  if (n.fruit === false) return false;
  /* A1 keeps the smoked list (untested live packs stay out). A2+ uses every
   * live teaching pack at that level. */
  if (level === "A1" && !SMOKED_A1_GRAMMAR.has(n.id)) return false;
  return true;
}

/**
 * Live teaching grammar at `level` as Which-is-correct? items.
 * correct = en; two wrongs = gap filled by a clearly impossible quiz chip.
 * Skip diagram (place in/on/under). Skip if two chips would both be English.
 */
export async function loadGrammarWhich(tree, loadJson, selfId, level) {
  const lv = String(level || "A1").toUpperCase();
  if (grammarPoolCacheByLevel[lv]) return grammarPoolCacheByLevel[lv];
  const nodes = (tree?.nodes || []).filter((n) =>
    isGrammarPoolNode(n, selfId, lv),
  );
  const packs = [];
  const corpus = new Set();
  for (const n of nodes) {
    let pack;
    try {
      pack = await loadJson(`./data/${n.content}`);
    } catch {
      continue;
    }
    packs.push({ n, pack });
    for (const b of pack.blocks || []) {
      for (const it of b.items || []) {
        const en = String(it?.en || "").trim();
        if (en) corpus.add(sentKey(en));
      }
    }
  }
  const out = [];
  let seq = 0;
  const seenEn = new Set();
  for (const { n, pack } of packs) {
    for (const b of pack.blocks || []) {
      for (const it of b.items || []) {
        const item = whichItemFromPackItem(it, {
          src: n.id,
          topic: n.label || pack.title || n.id,
          corpus,
        });
        if (!item) continue;
        const k = sentKey(item.en);
        if (seenEn.has(k)) continue;
        seenEn.add(k);
        seq += 1;
        out.push({ ...item, id: String(seq) });
      }
    }
  }
  grammarPoolCacheByLevel[lv] = out;
  return out;
}

/** A1 alias — tests and older call sites. */
export async function loadA1GrammarWhich(tree, loadJson, selfId) {
  return loadGrammarWhich(tree, loadJson, selfId, "A1");
}

/**
 * One Type cloze, or null. Same smoked A1 source as Which is correct?.
 * Skip diagram / place in-on-under (A0). Skip word-classes metalanguage.
 * Stem cues already on the gap stay (B11).
 */
export function typeItemFromPackItem(it, meta = {}) {
  const { src = "", topic = "" } = meta;
  if (src && SKIP_TYPE_SRC.has(src)) return null;
  if (it?.diagram) return null;
  if (it?.type === false) return null;
  const en = String(it?.en || "").trim();
  const cz = String(it?.cz || "").trim();
  const gap = String(it?.gap || "").trim();
  const ans = String(it?.gap_answer || "").trim();
  if (!en || !gap || !ans || !cz) return null;
  if (!GAP_MARK.test(gap)) return null;
  if ((gap.match(GAP_MARK) || []).length !== 1) return null;
  if (/=\s*(_{2,}|\u2026|\.{3})/.test(gap)) return null;
  const accepts = Array.isArray(it.gap_accepts)
    ? it.gap_accepts.filter((x) => x != null && String(x).trim() !== "")
    : [];
  return {
    en,
    cz,
    gap,
    prompt: gap,
    answer: ans,
    accepts,
    zero_article: !!it.zero_article || ans === "—",
    t: topic || "",
    src: src || "",
    why: String(it?.explanation || "").trim(),
  };
}

const grammarGapCacheByLevel = Object.create(null);

/**
 * Teaching grammar at `level` as Type clozes: Czech + gapped English.
 * Same source packs as Which is correct?. Skip diagram/place, word-classes,
 * check-units. B11 bracket cues on the gap are kept.
 */
export async function loadGrammarGaps(tree, loadJson, selfId, level) {
  const lv = String(level || "A1").toUpperCase();
  if (grammarGapCacheByLevel[lv]) return grammarGapCacheByLevel[lv];
  const nodes = (tree?.nodes || []).filter(
    (n) => isGrammarPoolNode(n, selfId, lv) && !SKIP_TYPE_SRC.has(n.id),
  );
  const out = [];
  const seen = new Set();
  for (const n of nodes) {
    let pack;
    try {
      pack = await loadJson(`./data/${n.content}`);
    } catch {
      continue;
    }
    if (pack?.ladder?.type === false) continue;
    if (pack?.kind === "level_check") continue;
    const topic = n.label || pack.title || n.id;
    for (const b of pack.blocks || []) {
      for (const it of b.items || []) {
        const item = typeItemFromPackItem(it, { src: n.id, topic });
        if (!item) continue;
        const k = `${n.id}::${sentKey(item.en)}::${formKey(item.answer)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ ...item, id: k });
      }
    }
  }
  grammarGapCacheByLevel[lv] = out;
  return out;
}

/** A1 alias — tests and older call sites. */
export async function loadA1GrammarGaps(tree, loadJson, selfId) {
  return loadGrammarGaps(tree, loadJson, selfId, "A1");
}

function gTypeReadBest(topic) {
  const map = readJson(G_ACTIVE.typeBest, {}) || {};
  const n = parseInt(map[topic || ALL] || 0, 10);
  return Number.isFinite(n) ? n : 0;
}

function gTypeWriteBest(topic, value) {
  const map = readJson(G_ACTIVE.typeBest, {}) || {};
  map[topic || ALL] = value;
  writeJson(G_ACTIVE.typeBest, map);
}

/** Existing grammar Type grader (contractions, if/when, zero article). */
export function gradeGrammarGap(typed, w) {
  const zeroItem = !!(w && (w.zero_article || w.answer === "—"));
  const typedVal =
    zeroItem && String(typed || "").trim() === "" ? "—" : typed;
  return _gradeGrammar(
    typedVal,
    { answer: w?.answer, accepts: w?.accepts || [] },
    "full_word",
  );
}

function whichIdsForEn(en, whichPool) {
  const k = sentKey(en);
  const ids = [];
  for (const w of whichPool || []) {
    if (sentKey(w.en) === k) ids.push(String(w.id));
  }
  return ids;
}

function troubleEnsFromWhich(whichPool) {
  const t = gReadTrouble();
  const byId = new Map((whichPool || []).map((w) => [String(w.id), w]));
  const ens = new Set();
  for (const id of Object.keys(t)) {
    const w = byId.get(String(id));
    if (w?.en) ens.add(sentKey(w.en));
  }
  return ens;
}

function markGrammarType(w, whichPool) {
  if (!w) return;
  gMarkTrouble(w.id);
  for (const id of whichIdsForEn(w.en, whichPool)) gMarkTrouble(id);
}

function creditGrammarType(w, whichPool) {
  if (!w) return;
  gCreditTrouble(w.id);
  for (const id of whichIdsForEn(w.en, whichPool)) gCreditTrouble(id);
}

function buildGrammarPracticeList(typePool, extraIds, whichPool) {
  const t = gReadTrouble();
  const want = new Set(Object.keys(t).map(String));
  for (const id of extraIds || []) {
    if (id != null && id !== "") want.add(String(id));
  }
  const ens = new Set();
  const byId = new Map((whichPool || []).map((w) => [String(w.id), w]));
  for (const id of want) {
    const w = byId.get(id);
    if (w?.en) ens.add(sentKey(w.en));
  }
  const out = [];
  const seen = new Set();
  for (const w of typePool || []) {
    const id = String(w.id);
    if (seen.has(id)) continue;
    if (!want.has(id) && !ens.has(sentKey(w.en))) continue;
    seen.add(id);
    out.push(w);
  }
  return shuffle(out).slice(0, TYPE_SIZE);
}

export function startGrammarMatchSprint({
  root,
  node,
  loadJson,
  tree,
  onExit,
  onFruit,
}) {
  const level = levelFromNode(node);
  activateGKeys(level);
  const selfId = node?.id || `${level.toLowerCase()}_grammar_match`;
  const title =
    level === "A1"
      ? G_MATCH_TITLE
      : node?.label || `${level} grammar · match`;

  /* One whole-set round through the check is the bar — it checks material
   * learned in the units above it, so there is no ladder to walk. A topic
   * filter is a subset, not the check, so it never fruits.
   * (James, 2026-08-31: "you only have to do one round of it".) */
  function fruitCheckRound(whole) {
    if (!whole) return;
    const r = completeCheckRound(selfId);
    if (r.justFruited) onFruit?.({ grow: true });
    else if (r.nowFruit) onFruit?.({ grow: false });
  }

  let vocab = [];
  let minutes = 0;
  try {
    const savedM = parseInt(localStorage.getItem(G_ACTIVE.minutes) || "0", 10);
    if (savedM === 0 || savedM === 1 || savedM === 2 || savedM === 3) {
      minutes = savedM;
    }
  } catch {
    /* */
  }
  let roundMs = minutes * 60000;
  let screen = "start";
  let score = 0;
  let remaining = roundMs;
  let lastTick = 6;
  let rafId = 0;
  let audioCtx = null;
  let loopStart = 0;
  let round = [];
  let idx = 0;
  let answered = false;
  let locked = false;
  let origin = "play";

  function unlockAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, gain, slideTo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        audioCtx.currentTime + duration,
      );
    }
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    select() {
      beep(540, 0.045, "sine", 0.035);
    },
    match() {
      beep(523.25, 0.07, "triangle", 0.045);
      setTimeout(() => beep(783.99, 0.11, "triangle", 0.04), 55);
    },
    miss() {
      beep(196, 0.09, "square", 0.028, 140);
    },
    start() {
      beep(392, 0.08, "sine", 0.04);
      setTimeout(() => beep(523.25, 0.1, "sine", 0.04), 80);
    },
    end() {
      beep(246.94, 0.22, "sine", 0.05, 130);
    },
    tick() {
      beep(880, 0.03, "sine", 0.025);
    },
  };

  function startingPool() {
    const t = gReadTrouble();
    const first = [];
    const rest = [];
    for (const w of vocab) {
      if (w.id in t) first.push(w);
      else rest.push(w);
    }
    return shuffle(first).concat(shuffle(rest));
  }

  function dealItems(fromPool, n) {
    const source = fromPool.length ? fromPool : shuffle(vocab);
    return source.slice(0, n).map((w) => ({
      ...w,
      choices: shuffle([w.en, ...w.wrongs.slice(0, 2)]),
      picked: null,
      ok: null,
    }));
  }

  function current() {
    return round[idx] || null;
  }

  function clockOn() {
    return origin !== "practice" && minutes > 0;
  }

  function leftoverList() {
    return buildWhichPracticeList(
      vocab,
      round.filter((w) => !w.ok).map((w) => w.id),
    );
  }

  function showWhy(w) {
    paintWhy(root, w);
  }

  function updateHud() {
    const $time = root.querySelector("#sprint-time");
    const $score = root.querySelector("#sprint-score");
    const $pos = root.querySelector("#sprint-pos");
    const $bar = root.querySelector("#sprint-bar");
    const $fill = root.querySelector("#sprint-bar-fill");
    if (clockOn()) {
      if ($time) $time.textContent = formatTime(remaining);
      const urgent = remaining <= 10000;
      $time?.classList.toggle("urgent", urgent);
      $bar?.classList.toggle("urgent", urgent);
      if ($fill && roundMs) $fill.style.transform = `scaleX(${remaining / roundMs})`;
    }
    if ($score) $score.textContent = String(score);
    if ($pos) {
      if (clockOn()) $pos.textContent = String(idx + 1);
      else {
        $pos.textContent = round.length
          ? `${Math.min(idx + 1, round.length)}/${round.length}`
          : "0/0";
      }
    }
  }

  function smoke(phase) {
    const w = current();
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "sprint",
      checkPhase: phase,
      itemIndex: idx,
      en: w?.en || "",
      cz: "",
      gap: "",
      gap_answer: w?.en || "",
      typed: w?.picked || "",
    });
  }

  function renderItem() {
    const w = current();
    const box = root.querySelector("#choices");
    const fb = root.querySelector("#tfb");
    const nxt = root.querySelector("#chk");
    if (!w || !box) return;
    answered = false;
    locked = false;
    box.innerHTML = "";
    fb.textContent = "";
    fb.className = "fb";
    const why = root.querySelector("#which-why");
    if (why) why.hidden = true;
    if (nxt) {
      nxt.hidden = true;
      nxt.textContent =
        idx + 1 >= round.length && !clockOn() ? "Score →" : "Next";
    }
    for (let i = 0; i < w.choices.length; i++) {
      const c = w.choices[i];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.dataset.answer = c;
      if (sentKey(c) === sentKey(w.en)) b.dataset.ok = "1";
      b.innerHTML = `<span class="knum">${i + 1}</span> ${esc(c)}`;
      b.addEventListener("click", () => pick(i));
      box.appendChild(b);
    }
    updateHud();
    smoke("quiz");
  }

  function renderRecap() {
    const list = root.querySelector("#sprint-recap-list");
    const wrap = root.querySelector("#sprint-recap");
    if (!list || !wrap) return;
    let html = "";
    for (const w of round) {
      if (w.ok == null) continue;
      const miss = !w.ok;
      const picked =
        miss && w.picked
          ? `<span class="wrote">you picked ${esc(w.picked)}</span>`
          : "";
      html +=
        `<li class="${miss ? "missed" : ""}">` +
        `<span class="sprint-mark">${miss ? "✗" : "✓"}</span>` +
        `<b>${esc(w.en)}</b>${picked}</li>`;
    }
    list.innerHTML = html;
    wrap.hidden = !html;
  }

  function endGame() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    sfx.end();
    fruitCheckRound(origin !== "practice");
    if (origin !== "practice") {
      for (const w of round) {
        if (w.ok !== true) gMarkTrouble(w.id);
      }
    }
    const leftover = leftoverList();
    const seen = round.filter((w) => w.ok != null);
    const total =
      origin === "practice" || !clockOn() ? round.length : seen.length;
    screen = "results";
    const hero = root.querySelector("#sprint-final");
    const note = root.querySelector("#sprint-note");
    const kicker = root.querySelector("#sprint-results .kicker");
    if (kicker) {
      kicker.textContent =
        origin === "practice"
          ? "Practice done"
          : minutes > 0
            ? "Time’s up"
            : "Round over";
    }
    if (hero) {
      hero.innerHTML = `${esc(String(score))}<small> / ${esc(
        String(total || 0),
      )}</small>`;
    }
    if (note) {
      if (origin === "practice") {
        const left = leftover.length;
        note.textContent =
          left === 0
            ? "All clear."
            : left + (left === 1 ? " to come back to." : " to come back to.");
      } else {
        const best = gReadBest(minutes);
        if (score > best) gWriteBest(minutes, score);
        const newBest = Math.max(best, score);
        note.textContent =
          score > 0 && score >= newBest ? "New best score." : `Best ${newBest}`;
      }
    }
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-play").hidden = true;
    root.querySelector("#sprint-results").hidden = false;
    renderRecap();
    paintWhichPracticeButton(root, leftover);
    smoke("results");
  }

  function goNext() {
    if (!answered) return;
    if (clockOn() && remaining <= 0) {
      endGame();
      return;
    }
    if (idx + 1 >= round.length) {
      if (clockOn() && remaining > 0) {
        const seenIds = new Set(round.map((w) => w.id));
        const rest = startingPool().filter((w) => !seenIds.has(w.id));
        const more = dealItems(rest.length ? rest : startingPool(), WHICH_SIZE);
        if (!more.length) {
          endGame();
          return;
        }
        round = round.concat(more);
      } else {
        endGame();
        return;
      }
    }
    idx += 1;
    renderItem();
  }

  function pick(i) {
    if (screen !== "playing" || locked) return;
    const w = current();
    if (!w) return;
    const c = w.choices[i];
    if (c == null) return;
    locked = true;
    answered = true;
    const ok = sentKey(c) === sentKey(w.en);
    w.picked = c;
    w.ok = ok;
    if (ok) {
      sfx.match();
      score += 1;
      gCreditTrouble(w.id);
    } else {
      sfx.miss();
      gMarkTrouble(w.id);
    }
    const buttons = [...root.querySelectorAll("#choices .choice")];
    buttons.forEach((ch) => {
      ch.disabled = true;
      if (sentKey(ch.dataset.answer) === sentKey(w.en)) {
        ch.classList.add("is-correct");
      }
    });
    if (buttons[i] && !ok) buttons[i].classList.add("is-wrong");
    const fb = root.querySelector("#tfb");
    if (fb) {
      fb.className = "fb " + (ok ? "good" : "bad");
      fb.textContent = ok ? "✓ Correct" : "✗ " + w.en;
    }
    const nxt = root.querySelector("#chk");
    if (nxt) {
      nxt.hidden = false;
      nxt.textContent =
        idx + 1 >= round.length && !clockOn() ? "Score →" : "Next";
      nxt.focus();
    }
    showWhy(w);
    updateHud();
    smoke("quiz");
  }

  function loop(now) {
    remaining = Math.max(0, roundMs - (now - loopStart));
    updateHud();
    const secs = Math.ceil(remaining / 1000);
    if (secs <= 5 && secs > 0 && secs < lastTick) {
      lastTick = secs;
      sfx.tick();
    }
    if (remaining <= 0) {
      endGame();
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function beginRound(items) {
    unlockAudio();
    sfx.start();
    if (rafId) cancelAnimationFrame(rafId);
    score = 0;
    idx = 0;
    answered = false;
    locked = false;
    remaining = clockOn() ? roundMs : 0;
    lastTick = 6;
    screen = "playing";
    round = items;
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-results").hidden = true;
    root.querySelector("#sprint-play").hidden = false;
    const clockWrap = root.querySelector("#sprint-clock-wrap");
    const bar = root.querySelector("#sprint-bar");
    if (clockWrap) clockWrap.hidden = !clockOn();
    if (bar) bar.hidden = !clockOn();
    renderItem();
    if (clockOn()) {
      loopStart = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function startGame() {
    origin = "play";
    beginRound(dealItems(startingPool(), WHICH_SIZE));
  }

  function startPractice() {
    const list = leftoverList();
    if (!list.length) return;
    origin = "practice";
    beginRound(dealItems(list, list.length));
  }

  function onKeydown(e) {
    if (e.target && e.target.closest) {
      if (e.target.closest("#btn-practice-back")) return;
      if (e.target.closest("#smoke-flags-host")) return;
      if (e.target.closest("select")) return;
      if (e.target.closest("textarea")) return;
      if (e.target.closest("a")) return;
    }
    if (screen === "playing" && !answered) {
      const map = {
        Digit1: 0,
        Digit2: 1,
        Digit3: 2,
        Numpad1: 0,
        Numpad2: 1,
        Numpad3: 2,
      };
      if (Object.prototype.hasOwnProperty.call(map, e.code)) {
        e.preventDefault();
        e.stopPropagation();
        pick(map[e.code]);
        return;
      }
    }
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    if (screen === "start") {
      root.querySelector("#sprint-btn-play")?.click();
      return;
    }
    if (screen === "results") {
      root.querySelector("#sprint-btn-again")?.click();
      return;
    }
    if (screen === "playing" && answered) goNext();
  }

  function renderShell() {
    const best = gReadBest(minutes);
    const opt = (v, label) =>
      `<option value="${v}"${minutes === v ? " selected" : ""}>${label}</option>`;
    root.innerHTML = `
      <div class="sprint sprint-which">
        <div class="practice-head"><h2>${esc(title)}</h2></div>
        <p class="home-hint">Check, not a lesson — one full round fruits it.</p>

        <div id="sprint-start">
          <p class="lede">Which is correct? Three English sentences. Tap the right one. Twelve from ${esc(level)} grammar. Clock off unless you turn it on.</p>
          <div class="sprint-actions">
            <label class="sprint-field">Time
              <select id="sprint-minutes">
                ${opt(0, "Off")}
                ${opt(1, "1 minute")}
                ${opt(2, "2 minutes")}
                ${opt(3, "3 minutes")}
              </select>
            </label>
            <button type="button" class="btn primary" id="sprint-btn-play">Play</button>
            <p class="sprint-best"${best ? "" : " hidden"}>Best <span>${best}</span></p>
          </div>
          <p class="home-hint">${vocab.length} sentences in the pool.</p>
        </div>

        <div id="sprint-play" hidden>
          <div class="sprint-hud">
            <div id="sprint-clock-wrap" hidden>
              <p class="hud-label">Time</p>
              <p class="hud-value" id="sprint-time">1:00</p>
            </div>
            <div>
              <p class="hud-label">Item</p>
              <p class="hud-value" id="sprint-pos">1/${WHICH_SIZE}</p>
            </div>
            <div>
              <p class="hud-label">Score</p>
              <p class="hud-value" id="sprint-score">0</p>
            </div>
          </div>
          <div class="sprint-bar" id="sprint-bar" hidden><i id="sprint-bar-fill"></i></div>
          <p class="which-prompt">Which is correct?</p>
          <p class="practice-hint">Keys <strong>1–3</strong> · then <strong>Enter</strong> = next</p>
          <div class="choices" id="choices"></div>
          <div class="fb" id="tfb"></div>
          <div class="which-why" id="which-why" hidden>
            <p class="which-expl" id="which-expl"></p>
            <a class="which-unit" id="which-unit" hidden></a>
          </div>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="chk" hidden>Next</button>
          </div>
        </div>

        <div id="sprint-results" hidden>
          <p class="kicker">Round over</p>
          <p class="score-hero" id="sprint-final">0<small> / 12</small></p>
          <p class="note" id="sprint-note">Best 0</p>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="sprint-btn-practice" hidden>Practice</button>
            <button type="button" class="btn primary" id="sprint-btn-again">Play again</button>
          </div>
          <section class="sprint-recap" id="sprint-recap" hidden>
            <h3>This round</h3>
            <ul class="sprint-recap-list type-recap" id="sprint-recap-list"></ul>
          </section>
        </div>
      </div>
    `;

    root.querySelector("#sprint-minutes")?.addEventListener("change", (e) => {
      minutes = parseInt(e.target.value, 10);
      if (minutes !== 0 && minutes !== 1 && minutes !== 2 && minutes !== 3) {
        minutes = 0;
      }
      roundMs = minutes * 60000;
      try {
        localStorage.setItem(G_ACTIVE.minutes, String(minutes));
      } catch {
        /* */
      }
      const b = gReadBest(minutes);
      const line = root.querySelector(".sprint-best");
      if (line) {
        line.hidden = !b;
        const span = line.querySelector("span");
        if (span) span.textContent = String(b);
      }
    });
    root.querySelector("#sprint-btn-play")?.addEventListener("click", startGame);
    root.querySelector("#sprint-btn-again")?.addEventListener("click", startGame);
    root.querySelector("#sprint-btn-practice")?.addEventListener("click", startPractice);
    root.querySelector("#chk")?.addEventListener("click", goNext);
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "sprint",
      checkPhase: "start",
      itemIndex: 0,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
  }

  function teardown() {
    document.removeEventListener("keydown", onKeydown, true);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener("keydown", onKeydown, true);
  root._RUE2UnbindKeys = teardown;

  root.innerHTML = `<p class="home-hint">Loading ${esc(level)} grammar…</p>`;
  loadGrammarWhich(tree, loadJson, selfId, level)
    .then((list) => {
      vocab = list;
      renderShell();
    })
    .catch((e) => {
      root.innerHTML = `<p class="home-hint">Could not load the ${esc(level)} grammar pool. ${esc(
        e.message || e,
      )}</p>`;
    });

  void onExit;
}

function paintGrammarPracticeButton(root, list) {
  const btn = root.querySelector("#sprint-btn-practice");
  const again = root.querySelector("#sprint-btn-again");
  if (!btn) return;
  if (!list.length) {
    btn.hidden = true;
    again?.classList.add("primary");
    return;
  }
  btn.hidden = false;
  btn.textContent =
    "Practice " + list.length + (list.length === 1 ? " form" : " forms");
  again?.classList.remove("primary");
}

export function startGrammarTypeSprint({
  root,
  node,
  loadJson,
  tree,
  onExit,
  onFruit,
}) {
  const level = levelFromNode(node);
  activateGKeys(level);
  const selfId = node?.id || `${level.toLowerCase()}_grammar_type`;
  const title =
    level === "A1"
      ? "A1 grammar · type"
      : node?.label || `${level} grammar · type`;
  const matchId = `${level.toLowerCase()}_grammar_match`;

  /* One whole-set round through the check is the bar — it checks material
   * learned in the units above it, so there is no ladder to walk. A topic
   * filter is a subset, not the check, so it never fruits.
   * (James, 2026-08-31: "you only have to do one round of it".) */
  function fruitCheckRound(whole) {
    if (!whole) return;
    const r = completeCheckRound(selfId);
    if (r.justFruited) onFruit?.({ grow: true });
    else if (r.nowFruit) onFruit?.({ grow: false });
  }

  let vocab = [];
  let whichPool = [];
  let topic = ALL;
  try {
    const saved = localStorage.getItem(G_ACTIVE.typeTopic);
    if (saved) topic = saved;
  } catch {
    /* */
  }
  let screen = "start";
  let origin = "play";
  let round = [];
  let idx = 0;
  let score = 0;
  let answered = false;
  let typedNow = "";
  let audioCtx = null;

  function activeVocab() {
    if (topic === ALL) return vocab;
    const out = vocab.filter((w) => w.t === topic);
    return out.length ? out : vocab;
  }

  function unlockAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, gain, slideTo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        audioCtx.currentTime + duration,
      );
    }
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    match() {
      beep(523.25, 0.07, "triangle", 0.045);
      setTimeout(() => beep(783.99, 0.11, "triangle", 0.04), 55);
    },
    miss() {
      beep(196, 0.09, "square", 0.028, 140);
    },
    start() {
      beep(392, 0.08, "sine", 0.04);
      setTimeout(() => beep(523.25, 0.1, "sine", 0.04), 80);
    },
    end() {
      beep(246.94, 0.22, "sine", 0.05, 130);
    },
  };

  function startingPool() {
    const active = activeVocab();
    const t = gReadTrouble();
    const ens = troubleEnsFromWhich(whichPool);
    const first = [];
    const rest = [];
    for (const w of active) {
      if (w.id in t || ens.has(sentKey(w.en))) first.push(w);
      else rest.push(w);
    }
    return shuffle(first).concat(shuffle(rest));
  }

  function current() {
    return round[idx] || null;
  }

  function leftoverList() {
    return buildGrammarPracticeList(
      vocab,
      round.filter((w) => !w.ok).map((w) => w.id),
      whichPool,
    );
  }

  function smoke(phase, extra = {}) {
    const w = extra.word || current();
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "type",
      checkPhase: phase,
      itemIndex: idx,
      en: w?.en || extra.en || "",
      cz: w?.cz || extra.cz || "",
      gap: w?.prompt || extra.gap || "",
      gap_answer: w?.answer || "",
      typed: extra.typed || typedNow || "",
    });
  }

  function updateHud() {
    const $pos = root.querySelector("#sprint-pos");
    const $score = root.querySelector("#sprint-score");
    if ($pos) {
      $pos.textContent = round.length
        ? `${Math.min(idx + 1, round.length)}/${round.length}`
        : "0/0";
    }
    if ($score) $score.textContent = String(score);
  }

  function renderItem() {
    const w = current();
    const prompt = root.querySelector("#sprint-prompt");
    const cz = root.querySelector("#sprint-cz");
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !prompt || !inp || !fb || !chk) return;
    answered = false;
    typedNow = "";
    prompt.textContent = w.prompt;
    if (cz) cz.textContent = w.cz || "";
    inp.value = "";
    inp.disabled = false;
    fb.textContent = "";
    fb.className = "fb";
    chk.textContent = "Check";
    chk.disabled = false;
    const why = root.querySelector("#which-why");
    if (why) why.hidden = true;
    updateHud();
    smoke("type");
    inp.focus();
  }

  function renderRecap() {
    const list = root.querySelector("#sprint-recap-list");
    const wrap = root.querySelector("#sprint-recap");
    if (!list || !wrap) return;
    let html = "";
    for (const w of round) {
      const miss = !w.ok;
      const wrote =
        miss && w.typed
          ? `<span class="wrote">you wrote ${esc(w.typed)}</span>`
          : "";
      html +=
        `<li class="${miss ? "missed" : ""}">` +
        `<span class="sprint-mark">${miss ? "✗" : "✓"}</span>` +
        `<b>${esc(w.answer)}</b><span>${esc(w.prompt)}</span>${wrote}</li>`;
    }
    list.innerHTML = html;
    wrap.hidden = round.length === 0;
  }

  function showResults() {
    sfx.end();
    fruitCheckRound(topic === ALL && origin !== "practice");
    const leftover = leftoverList();
    screen = "results";
    const hero = root.querySelector("#sprint-final");
    const note = root.querySelector("#sprint-note");
    const kicker = root.querySelector("#sprint-results .kicker");
    if (kicker) {
      kicker.textContent =
        origin === "practice" ? "Practice done" : "Round over";
    }
    if (hero) {
      hero.innerHTML = `${esc(String(score))}<small> / ${esc(
        String(round.length),
      )}</small>`;
    }
    if (note) {
      if (origin === "practice") {
        const left = leftover.length;
        note.textContent =
          left === 0
            ? "All clear."
            : left + (left === 1 ? " to come back to." : " to come back to.");
      } else {
        const best = gTypeReadBest(topic);
        if (score > best) gTypeWriteBest(topic, score);
        const newBest = Math.max(best, score);
        note.textContent =
          score > 0 && score >= newBest ? "New best score." : `Best ${newBest}`;
      }
    }
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-play").hidden = true;
    root.querySelector("#sprint-results").hidden = false;
    renderRecap();
    paintGrammarPracticeButton(root, leftover);
    smoke("results", { en: "", cz: "", typed: "" });
  }

  function goNext() {
    if (!answered) return;
    if (idx + 1 >= round.length) {
      showResults();
      return;
    }
    idx += 1;
    renderItem();
  }

  function grade() {
    if (screen !== "playing" || answered) return;
    const w = current();
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !inp || !fb || !chk) return;
    const typed = String(inp.value || "");
    typedNow = typed;
    const ok = gradeGrammarGap(typed, w);
    answered = true;
    w.typed = typed;
    w.ok = ok;
    inp.disabled = true;
    if (ok) {
      sfx.match();
      score += 1;
      creditGrammarType(w, whichPool);
      fb.className = "fb good";
      fb.textContent = "✓ Correct";
    } else {
      sfx.miss();
      markGrammarType(w, whichPool);
      fb.className = "fb bad";
      const wrote = typed.trim() ? ` you wrote ${esc(typed.trim())}` : "";
      fb.innerHTML = `✗ ${esc(w.answer)}<span class="wrote">${wrote}</span>`;
    }
    chk.textContent = idx + 1 >= round.length ? "Score →" : "Next";
    paintWhy(root, w);
    updateHud();
    smoke("type", { typed });
    chk.focus();
  }

  function beginRound(items) {
    unlockAudio();
    sfx.start();
    round = (items || []).map((x) => ({ ...x, typed: "", ok: null }));
    idx = 0;
    score = 0;
    answered = false;
    typedNow = "";
    screen = "playing";
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-results").hidden = true;
    root.querySelector("#sprint-play").hidden = false;
    renderItem();
  }

  function startRound() {
    origin = "play";
    const source = startingPool();
    beginRound(source.slice(0, Math.min(TYPE_SIZE, source.length)));
  }

  function startPractice() {
    const list = leftoverList();
    if (!list.length) return;
    origin = "practice";
    beginRound(list);
  }

  function onKeydown(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const t = e.target;
    if (t && t.closest && t.closest("#btn-practice-back")) return;
    if (t && t.closest && t.closest("#smoke-flags-host")) return;
    if (t && t.closest && t.closest("select")) return;
    if (t && t.closest && t.closest("textarea")) return;
    if (t && t.closest && t.closest("a")) return;
    e.preventDefault();
    e.stopPropagation();
    if (screen === "start") {
      root.querySelector("#sprint-btn-play")?.click();
      return;
    }
    if (screen === "results") {
      root.querySelector("#sprint-btn-again")?.click();
      return;
    }
    if (screen === "playing") {
      if (answered) goNext();
      else grade();
    }
  }

  function renderShell() {
    const topicOpts = [`<option value="${ALL}">Whole ${esc(level)}</option>`]
      .concat(
        topicsOf(vocab).map(
          (t) =>
            `<option value="${esc(t)}"${t === topic ? " selected" : ""}>${esc(t)}</option>`,
        ),
      )
      .join("");
    const best = gTypeReadBest(topic);
    root.innerHTML = `
      <div class="sprint sprint-type sprint-grammar">
        <div class="practice-head"><h2>${esc(title)}</h2></div>
        <p class="home-hint">Check, not a lesson — one full round fruits it.</p>

        <div id="sprint-start">
          <p class="lede">Czech and a gapped English sentence. Type the missing form, not the whole sentence. Twelve from ${esc(level)} grammar. No clock. Misses from Which is correct? come first.</p>
          <div class="sprint-actions">
            <label class="sprint-field">Set
              <select id="sprint-topic">${topicOpts}</select>
            </label>
            <button type="button" class="btn primary" id="sprint-btn-play">Play</button>
            <p class="sprint-best"${best ? "" : " hidden"}>Best <span>${best}</span></p>
          </div>
          <p class="home-hint">${vocab.length} forms in the pool.</p>
        </div>

        <div id="sprint-play" hidden>
          <div class="sprint-hud">
            <div>
              <p class="hud-label">Item</p>
              <p class="hud-value" id="sprint-pos">1/${TYPE_SIZE}</p>
            </div>
            <div>
              <p class="hud-label">Score</p>
              <p class="hud-value" id="sprint-score">0</p>
            </div>
          </div>
          <div class="sprint-type-card">
            <p class="sub">Type the missing form · Enter = check / next</p>
            <p class="prompt" id="sprint-prompt"></p>
            <p class="practice-hint" id="sprint-cz"></p>
            <input class="type-in" id="ti" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the form…" lang="en" aria-label="Form" />
            <div class="fb" id="tfb"></div>
            <div class="which-why" id="which-why" hidden>
              <p class="which-expl" id="which-expl"></p>
              <a class="which-unit" id="which-unit" hidden></a>
            </div>
            <div class="sprint-actions">
              <button type="button" class="btn primary" id="chk">Check</button>
            </div>
          </div>
        </div>

        <div id="sprint-results" hidden>
          <p class="kicker">Round over</p>
          <p class="score-hero" id="sprint-final">0<small> / 12</small></p>
          <p class="note" id="sprint-note">Best 0</p>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="sprint-btn-practice" hidden>Practice</button>
            <button type="button" class="btn primary" id="sprint-btn-again">Play again</button>
          </div>
          <section class="sprint-recap" id="sprint-recap" hidden>
            <h3>This round</h3>
            <ul class="sprint-recap-list type-recap" id="sprint-recap-list"></ul>
          </section>
        </div>
      </div>
    `;

    root.querySelector("#sprint-topic")?.addEventListener("change", (e) => {
      topic = e.target.value || ALL;
      try {
        localStorage.setItem(G_ACTIVE.typeTopic, topic);
      } catch {
        /* */
      }
      const b = gTypeReadBest(topic);
      const line = root.querySelector(".sprint-best");
      if (line) {
        line.hidden = !b;
        const span = line.querySelector("span");
        if (span) span.textContent = String(b);
      }
    });
    root.querySelector("#sprint-btn-play")?.addEventListener("click", startRound);
    root.querySelector("#sprint-btn-again")?.addEventListener("click", startRound);
    root.querySelector("#sprint-btn-practice")?.addEventListener("click", startPractice);
    root.querySelector("#chk")?.addEventListener("click", () => {
      if (answered) goNext();
      else grade();
    });
    root.querySelector("#ti")?.addEventListener("input", (e) => {
      typedNow = e.target.value || "";
      smoke("type", { typed: typedNow });
    });
  }

  function teardown() {
    document.removeEventListener("keydown", onKeydown, true);
  }

  document.addEventListener("keydown", onKeydown, true);
  root._RUE2UnbindKeys = teardown;

  root.innerHTML = `<p class="home-hint">Loading ${esc(level)} grammar…</p>`;
  Promise.all([
    loadGrammarGaps(tree, loadJson, selfId, level),
    loadGrammarWhich(tree, loadJson, matchId, level),
  ])
    .then(([list, which]) => {
      vocab = list;
      whichPool = which || [];
      if (topic !== ALL && !topicsOf(vocab).includes(topic)) topic = ALL;
      renderShell();
    })
    .catch((e) => {
      root.innerHTML = `<p class="home-hint">Could not load the ${esc(level)} grammar pool. ${esc(
        e.message || e,
      )}</p>`;
    });

  void onExit;
}

const FINALE_SIZE = 12;
const FINALE_TITLE = "A1 review";
const GRAMMAR_FILTER = "__grammar__";
const VOCAB_FILTER = "__vocab__";
const SKIP_USE_MODES = new Set(["voice", "join", "rewrite"]);
const SKIP_CHECK_IDS = new Set([
  "a1_vocab_match",
  "a1_vocab_type",
  "a1_grammar_match",
  "a1_grammar_type",
  "a1_finale",
  "a2_vocab_match",
  "a2_vocab_type",
  "a2_grammar_match",
  "a2_grammar_type",
  "a2_finale",
  "b1_vocab_match",
  "b1_vocab_type",
  "b1_grammar_match",
  "b1_grammar_type",
  "b1_finale",
]);

function fKeys(level) {
  const lv = String(level || "A1").toLowerCase();
  return {
    best: `rue-exp-sprint-best:${lv}_finale`,
    topic: `rue-exp-sprint-topic:${lv}_finale`,
    minutes: `rue-exp-sprint-minutes:${lv}_finale`,
  };
}

let F_ACTIVE = fKeys("A1");

function activateFKeys(level) {
  F_ACTIVE = fKeys(level);
}

const usePoolCacheByLevel = Object.create(null);

function packGradeFlags(pack) {
  return {
    strict_articles: !!pack?.strict_articles,
    strict_possessives: !!pack?.strict_possessives,
    strict_determiners: !!pack?.strict_determiners,
    strict_place: !!pack?.strict_place,
    strict_time: !!pack?.strict_time,
    lenient_if_when: !!pack?.lenient_if_when,
  };
}

function isCheckUnit(n, selfId) {
  if (!n) return true;
  if (n.id === selfId) return true;
  if (SKIP_CHECK_IDS.has(n.id)) return true;
  if (CHECK_PRACTICES.has(n.practice) || CHECK_G_PRACTICES.has(n.practice)) {
    return true;
  }
  return false;
}

function isLiveTeaching(n, selfId, level) {
  if (!n || !n.content) return false;
  if (n.status !== "live") return false;
  if (!(n.levels || []).includes(level)) return false;
  if (isCheckUnit(n, selfId)) return false;
  /* A2+ Topics-only trunks stay off the check. A1 trunks stay in. */
  if (level !== "A1" && n.kind === "trunk") return false;
  return true;
}

function isLiveA1Teaching(n, selfId) {
  return isLiveTeaching(n, selfId, "A1");
}

/**
 * Live teaching Use sentences at `level`: grammar items with cz+en
 * (skip use: false), vocab sentences[]. Check-units stay out.
 * Error-correction packs (`use_mode: correct`) still contribute the
 * correct English sentence.
 */
export async function loadUsePool(tree, loadJson, selfId, level) {
  const lv = String(level || "A1").toUpperCase();
  if (usePoolCacheByLevel[lv]) return usePoolCacheByLevel[lv];
  const nodes = (tree?.nodes || []).filter((n) =>
    isLiveTeaching(n, selfId, lv),
  );
  const out = [];
  const seen = new Set();
  for (const n of nodes) {
    let pack;
    try {
      pack = await loadJson(`./data/${n.content}`);
    } catch {
      continue;
    }
    if (pack?.kind === "level_check") continue;
    const topic = n.label || pack.title || n.id;
    if (n.domain === "grammar") {
      if (pack?.ladder?.use === false) continue;
      if (SKIP_USE_MODES.has(pack?.use_mode)) continue;
      const flags = packGradeFlags(pack);
      for (const b of pack.blocks || []) {
        for (const it of b.items || []) {
          if (it?.use === false) continue;
          if (it?.bin && !it.gap) continue;
          const en = String(it?.en || "").trim();
          const cz = String(it?.cz || "").trim();
          if (!en || !cz) continue;
          if (!looksLikeSentence(en)) continue;
          const k = `g::${n.id}::${itemKey(en, cz)}`;
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({
            id: k,
            en,
            cz,
            accepts: Array.isArray(it.accepts) ? it.accepts : [],
            t: topic,
            src: n.id,
            kind: "grammar",
            ...flags,
          });
        }
      }
    } else if (n.domain === "vocab") {
      const bank = Array.isArray(pack.sentences) ? pack.sentences : [];
      if (!bank.length) continue;
      for (const it of bank) {
        const en = String(it?.en || "").trim();
        const cz = String(it?.cz || "").trim();
        if (!en || !cz) continue;
        const k = `v::${n.id}::${itemKey(en, cz)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({
          id: k,
          en,
          cz,
          accepts: Array.isArray(it.accepts) ? it.accepts : [],
          t: topic,
          src: n.id,
          kind: "vocab",
          strict_determiners: !!pack.strict_determiners,
        });
      }
    }
  }
  usePoolCacheByLevel[lv] = out;
  return out;
}

/** A1 alias — tests and older call sites. */
export async function loadA1UsePool(tree, loadJson, selfId) {
  return loadUsePool(tree, loadJson, selfId, "A1");
}

export function filterFinalePool(list, topic) {
  const all = list || [];
  if (!topic || topic === ALL) return all;
  if (topic === GRAMMAR_FILTER) return all.filter((w) => w.kind === "grammar");
  if (topic === VOCAB_FILTER) return all.filter((w) => w.kind === "vocab");
  return all.filter((w) => w.src === topic);
}

/** Existing Use graders — grammar `_gradeGrammar`, vocab `isCorrectAnswer`. */
export function gradeFinale(typed, item) {
  if (!item) return false;
  if (item.kind === "vocab") {
    return isCorrectAnswer(typed, item, item.en);
  }
  return gradeGrammarSentence(typed, item);
}

function finaleReadBest(topic) {
  const map = readJson(F_ACTIVE.best, {}) || {};
  const n = parseInt(map[topic || ALL] || 0, 10);
  return Number.isFinite(n) ? n : 0;
}

function finaleWriteBest(topic, value) {
  const map = readJson(F_ACTIVE.best, {}) || {};
  map[topic || ALL] = value;
  writeJson(F_ACTIVE.best, map);
}

function unitsOf(list, kind) {
  const seen = new Set();
  const out = [];
  for (const w of list || []) {
    if (kind && w.kind !== kind) continue;
    if (!w.src || seen.has(w.src)) continue;
    seen.add(w.src);
    out.push({ id: w.src, t: w.t || w.src });
  }
  out.sort((a, b) => a.t.localeCompare(b.t));
  return out;
}

function groupBySrc(list) {
  const order = [];
  const map = new Map();
  for (const w of list || []) {
    const k = w.src || "";
    if (!map.has(k)) {
      map.set(k, []);
      order.push(k);
    }
    map.get(k).push(w);
  }
  return order.map((src) => ({
    src,
    t: (map.get(src)[0] || {}).t || src,
    items: map.get(src),
  }));
}

export function startFinaleSprint({
  root,
  node,
  loadJson,
  tree,
  onExit,
  onFruit,
}) {
  const level = levelFromNode(node);
  activateFKeys(level);
  const selfId = node?.id || `${level.toLowerCase()}_finale`;
  const title = node?.label || (level === "A1" ? FINALE_TITLE : `${level} review`);
  let pool = [];
  let topic = ALL;
  try {
    const saved = localStorage.getItem(F_ACTIVE.topic);
    if (saved) topic = saved;
  } catch {
    /* */
  }
  let minutes = 0;
  try {
    const savedM = parseInt(localStorage.getItem(F_ACTIVE.minutes) || "0", 10);
    if (savedM === 0 || savedM === 1 || savedM === 2 || savedM === 3) {
      minutes = savedM;
    }
  } catch {
    /* */
  }
  let roundMs = minutes * 60000;
  let screen = "start";
  let firstPass = [];
  let deck = [];
  let stillWrong = [];
  let idx = 0;
  let score = 0;
  let answered = false;
  let typedNow = "";
  let retryPass = false;
  let cleaned = false;
  let audioCtx = null;
  let rafId = 0;
  let remaining = 0;
  let lastTick = 6;
  let loopStart = 0;

  function activePool() {
    return filterFinalePool(pool, topic);
  }

  function isWholeLevel() {
    return topic === ALL;
  }

  function unlockAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, gain, slideTo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        audioCtx.currentTime + duration,
      );
    }
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    match() {
      beep(523.25, 0.07, "triangle", 0.045);
      setTimeout(() => beep(783.99, 0.11, "triangle", 0.04), 55);
    },
    miss() {
      beep(196, 0.09, "square", 0.028, 140);
    },
    start() {
      beep(392, 0.08, "sine", 0.04);
      setTimeout(() => beep(523.25, 0.1, "sine", 0.04), 80);
    },
    end() {
      beep(246.94, 0.22, "sine", 0.05, 130);
    },
    tick() {
      beep(880, 0.03, "sine", 0.025);
    },
  };

  function current() {
    return deck[idx] || null;
  }

  function smoke(phase, extra = {}) {
    const w = extra.word || current();
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "use",
      checkPhase: phase,
      itemIndex: idx,
      en: w?.en || extra.en || "",
      cz: w?.cz || extra.cz || "",
      gap: "",
      gap_answer: w?.en || "",
      typed: extra.typed || typedNow || "",
    });
  }

  function updateHud() {
    const $time = root.querySelector("#sprint-time");
    const $score = root.querySelector("#sprint-score");
    const $pos = root.querySelector("#sprint-pos");
    const $bar = root.querySelector("#sprint-bar");
    const $fill = root.querySelector("#sprint-bar-fill");
    const $label = root.querySelector("#sprint-pos-label");
    if (minutes > 0 && screen === "playing") {
      if ($time) $time.textContent = formatTime(remaining);
      const urgent = remaining <= 10000;
      $time?.classList.toggle("urgent", urgent);
      $bar?.classList.toggle("urgent", urgent);
      if ($fill && roundMs) {
        $fill.style.transform = `scaleX(${remaining / roundMs})`;
      }
    }
    if ($score) $score.textContent = String(score);
    if ($pos) {
      $pos.textContent = deck.length
        ? `${Math.min(idx + 1, deck.length)}/${deck.length}`
        : "0/0";
    }
    if ($label) $label.textContent = retryPass ? "Retry" : "Item";
  }

  function renderItem() {
    const w = current();
    const prompt = root.querySelector("#sprint-prompt");
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !prompt || !inp || !fb || !chk) return;
    answered = false;
    typedNow = "";
    prompt.textContent = w.cz;
    inp.value = "";
    inp.disabled = false;
    fb.textContent = "";
    fb.className = "fb";
    chk.textContent = "Check";
    chk.disabled = false;
    updateHud();
    smoke(retryPass ? "retry" : "use");
    inp.focus();
  }

  function recapHtml(list) {
    const g = list.filter((w) => w.kind === "grammar");
    const v = list.filter((w) => w.kind === "vocab");
    const block = (title, rows) => {
      if (!rows.length) return "";
      let html = `<div class="finale-block"><h4>${esc(title)}</h4>`;
      for (const grp of groupBySrc(rows)) {
        html +=
          `<h5><a class="finale-unit" href="#${esc(grp.src)}">${esc(
            grp.t || grp.src,
          )}</a></h5>` + `<ul class="sprint-recap-list type-recap">`;
        for (const w of grp.items) {
          const miss = !w.firstOk;
          const wrote =
            miss && String(w.firstTyped || "").trim()
              ? `<span class="wrote">you wrote ${esc(w.firstTyped)}</span>`
              : "";
          html +=
            `<li class="${miss ? "missed" : ""}">` +
            `<span class="sprint-mark">${miss ? "✗" : "✓"}</span>` +
            `<b>${esc(w.en)}</b><span>${esc(w.cz)}</span>${wrote}</li>`;
        }
        html += "</ul>";
      }
      return html + "</div>";
    };
    return block("Grammar", g) + block("Vocab", v);
  }

  function maybeFruitThisNode() {
    if (!isWholeLevel() || !cleaned) return;
    const r = completeFinale(selfId);
    if (r.justFruited) onFruit?.({ grow: true });
    else if (r.nowFruit) onFruit?.({ grow: false });
  }

  function showResults() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    sfx.end();
    screen = "results";
    const hero = root.querySelector("#sprint-final");
    const note = root.querySelector("#sprint-note");
    const kicker = root.querySelector("#sprint-results .kicker");
    const total = firstPass.length || 0;
    if (kicker) {
      kicker.textContent = cleaned
        ? "Done"
        : minutes > 0
          ? "Time’s up"
          : "";
      kicker.hidden = !kicker.textContent;
    }
    if (hero) {
      hero.innerHTML = `${esc(String(score))}<small> / ${esc(
        String(total),
      )}</small>`;
    }
    if (note) {
      const misses = firstPass.filter((w) => !w.firstOk).length;
      const best = finaleReadBest(topic);
      if (score > best) finaleWriteBest(topic, score);
      const newBest = Math.max(best, score);
      const bits = [];
      if (misses) bits.push(`${misses} miss${misses === 1 ? "" : "es"}`);
      if (newBest) bits.push(`Best ${newBest}`);
      note.textContent = bits.join(" · ");
      note.hidden = !note.textContent;
    }
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-play").hidden = true;
    root.querySelector("#sprint-results").hidden = false;
    const wrap = root.querySelector("#sprint-recap");
    const host = root.querySelector("#sprint-recap-list");
    if (wrap && host) {
      host.innerHTML = recapHtml(firstPass);
      wrap.hidden = firstPass.length === 0;
    }
    maybeFruitThisNode();
    smoke("results", { en: "", cz: "", typed: "" });
  }

  function goNext() {
    if (!answered) return;
    if (minutes > 0 && remaining <= 0) {
      showResults();
      return;
    }
    if (idx + 1 < deck.length) {
      idx += 1;
      renderItem();
      return;
    }
    if (stillWrong.length) {
      retryPass = true;
      deck = shuffle(stillWrong.slice());
      idx = 0;
      renderItem();
      return;
    }
    cleaned = firstPass.length > 0 && firstPass.every((w) => w.ok != null);
    showResults();
  }

  function grade() {
    if (screen !== "playing" || answered) return;
    const w = current();
    const inp = root.querySelector("#ti");
    const fb = root.querySelector("#tfb");
    const chk = root.querySelector("#chk");
    if (!w || !inp || !fb || !chk) return;
    const typed = String(inp.value || "");
    typedNow = typed;
    const ok = gradeFinale(typed, w);
    answered = true;
    inp.disabled = true;
    if (!retryPass) {
      w.firstOk = ok;
      w.firstTyped = typed;
      if (ok) {
        w.ok = true;
        score += 1;
      } else {
        w.ok = false;
        stillWrong.push(w);
      }
    } else if (ok) {
      stillWrong = stillWrong.filter((x) => x.id !== w.id);
    }
    if (ok) {
      sfx.match();
      fb.className = "fb good";
      fb.textContent = "✓ Correct";
    } else {
      sfx.miss();
      fb.className = "fb bad";
      const wrote = typed.trim()
        ? `<span class="wrote">you wrote ${esc(typed.trim())}</span>`
        : "";
      fb.innerHTML = `✗ ${esc(w.en)}${wrote}`;
    }
    const lastOfPass = idx + 1 >= deck.length;
    const remainAfter = ok
      ? stillWrong.filter((x) => x.id !== w.id).length
      : stillWrong.length;
    const willRetry = lastOfPass && remainAfter > 0;
    chk.textContent = lastOfPass
      ? willRetry && !(minutes > 0 && remaining <= 0)
        ? "Retry →"
        : "Score →"
      : "Next";
    updateHud();
    smoke(retryPass ? "retry" : "use", { typed });
    chk.focus();
  }

  function loop(now) {
    remaining = Math.max(0, roundMs - (now - loopStart));
    updateHud();
    const secs = Math.ceil(remaining / 1000);
    if (secs <= 5 && secs > 0 && secs < lastTick) {
      lastTick = secs;
      sfx.tick();
    }
    if (remaining <= 0) {
      cleaned = false;
      showResults();
    }
  }

  function startRound() {
    unlockAudio();
    sfx.start();
    if (rafId) cancelAnimationFrame(rafId);
    touchBlock(selfId);
    completeMode(selfId, "use");
    const source = shuffle(activePool());
    const n = Math.min(FINALE_SIZE, source.length);
    firstPass = source.slice(0, n).map((w) => ({
      ...w,
      firstOk: null,
      firstTyped: "",
      ok: null,
    }));
    deck = firstPass.slice();
    stillWrong = [];
    idx = 0;
    score = 0;
    answered = false;
    typedNow = "";
    retryPass = false;
    cleaned = false;
    remaining = minutes > 0 ? roundMs : 0;
    lastTick = 6;
    screen = "playing";
    root.querySelector("#sprint-start").hidden = true;
    root.querySelector("#sprint-results").hidden = true;
    root.querySelector("#sprint-play").hidden = false;
    const clockWrap = root.querySelector("#sprint-clock-wrap");
    const bar = root.querySelector("#sprint-bar");
    if (clockWrap) clockWrap.hidden = minutes === 0;
    if (bar) bar.hidden = minutes === 0;
    renderItem();
    if (minutes > 0) {
      loopStart = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function onKeydown(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const t = e.target;
    if (t && t.closest && t.closest("#btn-practice-back")) return;
    if (t && t.closest && t.closest("#smoke-flags-host")) return;
    if (t && t.closest && t.closest("select")) return;
    if (t && t.closest && t.closest("a")) return;
    e.preventDefault();
    e.stopPropagation();
    if (screen === "start") {
      root.querySelector("#sprint-btn-play")?.click();
      return;
    }
    if (screen === "results") {
      root.querySelector("#sprint-btn-again")?.click();
      return;
    }
    if (screen === "playing") {
      if (answered) goNext();
      else grade();
    }
  }

  function filterOpts() {
    const gUnits = unitsOf(pool, "grammar");
    const vUnits = unitsOf(pool, "vocab");
    const opt = (value, label) =>
      `<option value="${esc(value)}"${topic === value ? " selected" : ""}>${esc(
        label,
      )}</option>`;
    return (
      opt(ALL, "Whole " + level) +
      opt(GRAMMAR_FILTER, "Grammar only") +
      opt(VOCAB_FILTER, "Vocab only") +
      `<optgroup label="Grammar">` +
      gUnits.map((u) => opt(u.id, u.t)).join("") +
      `</optgroup>` +
      `<optgroup label="Vocab">` +
      vUnits.map((u) => opt(u.id, u.t)).join("") +
      `</optgroup>`
    );
  }

  function renderShell() {
    const known =
      topic === ALL ||
      topic === GRAMMAR_FILTER ||
      topic === VOCAB_FILTER ||
      pool.some((w) => w.src === topic);
    if (!known) topic = ALL;
    const best = finaleReadBest(topic);
    const opt = (v, label) =>
      `<option value="${v}"${minutes === v ? " selected" : ""}>${label}</option>`;
    root.innerHTML = `
      <div class="sprint sprint-type sprint-finale">
        <div class="practice-head"><h2>${esc(title)}</h2></div>

        <div id="sprint-start">
          <div class="sprint-actions">
            <label class="sprint-field">Set
              <select id="sprint-topic">${filterOpts()}</select>
            </label>
            <label class="sprint-field">Time
              <select id="sprint-minutes">
                ${opt(0, "Off")}
                ${opt(1, "1 minute")}
                ${opt(2, "2 minutes")}
                ${opt(3, "3 minutes")}
              </select>
            </label>
            <button type="button" class="btn primary" id="sprint-btn-play">Play</button>
            <p class="sprint-best"${best ? "" : " hidden"}>Best <span>${best}</span></p>
          </div>
        </div>

        <div id="sprint-play" hidden>
          <div class="sprint-hud">
            <div id="sprint-clock-wrap" hidden>
              <p class="hud-label">Time</p>
              <p class="hud-value" id="sprint-time">1:00</p>
            </div>
            <div>
              <p class="hud-label" id="sprint-pos-label">Item</p>
              <p class="hud-value" id="sprint-pos">1/${FINALE_SIZE}</p>
            </div>
            <div>
              <p class="hud-label">Score</p>
              <p class="hud-value" id="sprint-score">0</p>
            </div>
          </div>
          <div class="sprint-bar" id="sprint-bar" hidden><i id="sprint-bar-fill"></i></div>
          <div class="sprint-type-card">
            <p class="sub">Enter = check / next</p>
            <p class="prompt" id="sprint-prompt"></p>
            <textarea class="type-in type-area" id="ti" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="English" lang="en" aria-label="English sentence"></textarea>
            <div class="fb" id="tfb"></div>
            <div class="sprint-actions">
              <button type="button" class="btn primary" id="chk">Check</button>
            </div>
          </div>
        </div>

        <div id="sprint-results" hidden>
          <p class="kicker"></p>
          <p class="score-hero" id="sprint-final">0<small> / 12</small></p>
          <p class="note" id="sprint-note"></p>
          <div class="sprint-actions">
            <button type="button" class="btn primary" id="sprint-btn-again">Play again</button>
          </div>
          <section class="sprint-recap finale-recap" id="sprint-recap" hidden>
            <h3>This round</h3>
            <div id="sprint-recap-list"></div>
          </section>
        </div>
      </div>
    `;

    root.querySelector("#sprint-topic")?.addEventListener("change", (e) => {
      topic = e.target.value || ALL;
      try {
        localStorage.setItem(F_ACTIVE.topic, topic);
      } catch {
        /* */
      }
      const b = finaleReadBest(topic);
      const line = root.querySelector(".sprint-best");
      if (line) {
        line.hidden = !b;
        const span = line.querySelector("span");
        if (span) span.textContent = String(b);
      }
    });
    root.querySelector("#sprint-minutes")?.addEventListener("change", (e) => {
      minutes = parseInt(e.target.value, 10);
      if (minutes !== 0 && minutes !== 1 && minutes !== 2 && minutes !== 3) {
        minutes = 0;
      }
      roundMs = minutes * 60000;
      try {
        localStorage.setItem(F_ACTIVE.minutes, String(minutes));
      } catch {
        /* */
      }
    });
    root.querySelector("#sprint-btn-play")?.addEventListener("click", startRound);
    root.querySelector("#sprint-btn-again")?.addEventListener("click", startRound);
    root.querySelector("#chk")?.addEventListener("click", () => {
      if (answered) goNext();
      else grade();
    });
    root.querySelector("#ti")?.addEventListener("input", (e) => {
      typedNow = e.target.value || "";
      smoke(retryPass ? "retry" : "use", { typed: typedNow });
    });
    setSmokeContext({
      packId: selfId,
      packTitle: title,
      stage: "use",
      checkPhase: "start",
      itemIndex: 0,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      typed: "",
    });
  }

  function teardown() {
    document.removeEventListener("keydown", onKeydown, true);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener("keydown", onKeydown, true);
  root._RUE2UnbindKeys = teardown;

  root.innerHTML = `<p class="home-hint">Loading…</p>`;
  loadUsePool(tree, loadJson, selfId, level)
    .then((list) => {
      pool = list;
      renderShell();
    })
    .catch((e) => {
      root.innerHTML = `<p class="home-hint">Could not load. ${esc(
        e.message || e,
      )}</p>`;
    });

  void onExit;
}

