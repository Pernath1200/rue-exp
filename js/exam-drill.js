/**
 * exam-drill.js — Exam Practice reps gym (James, 2026-08-18, after smoking
 * the first word-formation units: "one single exercise is not much help …
 * a student doing this exam would benefit from doing lots of reps").
 *
 * Rounds of ROUND_SIZE items drawn from the pooled word_formation banks of a
 * tier, graded exactly like the Type stage (root_word: whole derived word,
 * no synonym folding), wrong items retried until clean, then straight into
 * the next round on Enter.
 *
 * Deliberately OUTSIDE tree progress: the drill never writes fruit and never
 * appears in Do next. The path units teach; this is where the reps live.
 * Counters are session-only for the same reason.
 *
 * Shell contract mirrors practice-grammar.js: single Enter router on a
 * document-level capture handler, teardown registered as
 * root._RUE2UnbindKeys so showMap() cleans up, Enter on the Back button
 * advances instead of exiting.
 */

import { _gradeGrammar } from "./practice-grammar.js";
import { attachExplain } from "./explain.js";
import { setSmokeContext } from "./smoke-flags.js";

const ROUND_SIZE = 12;

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

/** Flatten every rooted gap item out of the packs' blocks. */
function poolOf(packs) {
  const out = [];
  for (const pack of packs || []) {
    for (const b of pack.blocks || []) {
      for (const it of b.items || []) {
        if (!it || typeof it !== "object") continue;
        if (!it.gap || !it.gap_answer || !it.root) continue;
        out.push({
          prompt: it.gap,
          root: it.root,
          answer: it.gap_answer,
          accepts: it.gap_accepts || [],
          explanation: it.explanation,
          explanation_cz: it.explanation_cz,
          _pack: pack.id || "",
        });
      }
    }
  }
  return out;
}

/**
 * @param {{ level: string, title: string, packs: object[],
 *           root: HTMLElement, onExit: () => void }} opts
 */
export function startWordFormationDrill(opts) {
  const { level, title, packs, root } = opts;
  const pool = poolOf(packs);

  const state = {
    /* Draw without repeats until the whole pool has been seen, THEN
     * reshuffle — reps should sweep the bank, not jackpot the same items. */
    bag: shuffle(pool.map((_, i) => i)),
    bagPos: 0,
    round: 1,
    items: [],
    idx: 0,
    score: 0,
    wrongs: [],
    retryPass: false,
    repsTotal: 0,
    /** @type {null | (() => void)} */
    enterAdvance: null,
  };

  function drawRound() {
    const n = Math.min(ROUND_SIZE, pool.length);
    if (state.bagPos + n > state.bag.length) {
      state.bag = shuffle(pool.map((_, i) => i));
      state.bagPos = 0;
    }
    const picked = state.bag.slice(state.bagPos, state.bagPos + n);
    state.bagPos += n;
    return picked.map((i) => pool[i]);
  }

  function onKeydown(e) {
    const t = e.target;
    // Enter/Space on Back must not exit mid-drill — same rule as the ladder.
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
    if (e.key !== "Enter" || e.shiftKey) return;
    if (t && t.closest && t.closest("textarea")) return;
    if (typeof state.enterAdvance !== "function") return;
    e.preventDefault();
    e.stopPropagation();
    state.enterAdvance();
  }

  document.addEventListener("keydown", onKeydown, true);

  function teardown() {
    state.enterAdvance = null;
    document.removeEventListener("keydown", onKeydown, true);
    root._RUE2UnbindKeys = null;
  }

  root._RUE2UnbindKeys = teardown;

  function beginRound() {
    state.items = drawRound();
    state.idx = 0;
    state.score = 0;
    state.wrongs = [];
    state.retryPass = false;
    renderItem();
  }

  function beginRetry() {
    state.items = shuffle(state.wrongs);
    state.idx = 0;
    state.wrongs = [];
    state.retryPass = true;
    renderItem();
  }

  function headHtml() {
    return `
      <div class="practice-head"><h2>${esc(title)}</h2></div>
      <p class="score-line">Round ${state.round} · ${
        Math.min(state.idx + 1, state.items.length)
      } / ${state.items.length} · score ${state.score}${
        state.retryPass ? " · retry" : ""
      } · ${state.repsTotal} reps this visit</p>`;
  }

  function renderItem() {
    state.enterAdvance = null;
    if (state.idx >= state.items.length) {
      renderGate();
      return;
    }
    const item = state.items[state.idx];
    setSmokeContext({
      packId: `exam_drill_${level.toLowerCase()}`,
      packTitle: title,
      stage: "drill",
      checkPhase: "",
      itemIndex: state.idx,
      en: item.answer || "",
      cz: "",
      gap: item.root || "",
      gap_answer: item.answer || "",
      typed: "",
    });

    root.innerHTML = `
      ${headHtml()}
      <p class="practice-prompt">${esc(item.prompt)} <span class="wf-root">${esc(item.root)}</span></p>
      <p class="practice-hint gap-hint">The <strong>whole word</strong> formed from the word in capitals</p>
      <div class="input-row">
        <input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="whole word…" lang="en" />
        <button type="button" class="btn primary" id="btn-submit">Check</button>
      </div>
      <div class="feedback" id="feedback"></div>
    `;

    const input = root.querySelector("#ans");
    const btn = root.querySelector("#btn-submit");
    const fb = root.querySelector("#feedback");
    input.focus();

    let answered = false;

    const goNext = () => {
      state.idx += 1;
      renderItem();
    };

    const grade = () => {
      if (answered) return;
      answered = true;
      state.repsTotal += 1;
      const good = _gradeGrammar(input.value, item, "root_word");
      if (good) {
        if (!state.retryPass) state.score += 1;
        fb.className = "feedback ok";
        fb.textContent = "✓ Correct";
      } else {
        state.wrongs.push(item);
        fb.className = "feedback bad";
        fb.textContent = `→ ${item.answer}`;
        attachExplain(fb, item, () => {});
      }
      input.disabled = true;
      btn.disabled = true;
      state.enterAdvance = goNext;
    };

    state.enterAdvance = grade;
    btn.addEventListener("click", grade);
  }

  function renderGate() {
    state.enterAdvance = null;
    const misses = state.wrongs.length;
    const clean = misses === 0;
    root.innerHTML = `
      <div class="practice-head"><h2>${esc(title)}</h2></div>
      <p class="score-line">Round ${state.round} done · score ${state.score} / ${state.items.length}${
        state.retryPass ? " (first pass)" : ""
      } · ${state.repsTotal} reps this visit</p>
      <p class="practice-prompt">${
        clean
          ? "Clean round. Enter = next round."
          : `${misses} to fix — Enter = retry ${misses === 1 ? "it" : "them"}.`
      }</p>
      <div class="input-row">
        <button type="button" class="btn primary" id="btn-go">${
          clean ? "Next round" : "Retry wrong"
        }</button>
      </div>
    `;
    const go = () => {
      if (clean) {
        state.round += 1;
        beginRound();
      } else {
        beginRetry();
      }
    };
    state.enterAdvance = go;
    root.querySelector("#btn-go")?.addEventListener("click", go);
  }

  if (!pool.length) {
    // Data fault, not a student state — the entry button should not exist
    // for an empty tier. Render the honest screen rather than a blank one.
    root.innerHTML = `
      <div class="practice-head"><h2>${esc(title)}</h2></div>
      <p class="practice-prompt">No drill items for this level yet.</p>
    `;
    return;
  }

  beginRound();
}
