import { expandContractions } from "./contractions.js";

/**
 * Tables — reference panel + free practice (James, 2026-08-17).
 * Ported from arta-lat's Tabulae / rupl-exp's Tabele, then simplified on
 * James's second pass:
 *
 *  - Grouped by LEVEL, not by grammatical pattern.
 *  - NO progress dimming. The level grouping already carries the progression,
 *    so dimming was doing the same job twice and made the panel look busier
 *    than it is. Tables are plain lists; every row is practisable.
 *  - The table HIDES while a drill runs — answers above the question defeat
 *    the exercise.
 *  - A wrong answer HALTS the run: the correction sits on screen and nothing
 *    moves until it is acknowledged.
 *  - Untracked on purpose: no fruit, no SRS. The reference is a whetstone,
 *    not a path station.
 *
 * Sections are GENERIC and drive both the table and the pool:
 *   columns    [{key,label}]        the table
 *   drill      [{from,to,label}]    cue "<row[from]> · <label>" -> row[to]
 *                                   (no label -> the cue is just row[from])
 *   row.drills [{cue,answer}]       explicit pairs, for anything irregular
 *   row.skip_drill                  column-pair drills off for this row
 * Adding a table is a data job, not a code job.
 */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Grading normaliser: case, spacing and trailing punctuation only. */
function normAns(s) {
  return expandContractions(String(s == null ? "" : s))
    .toLowerCase()
    .replace(/[.?!,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Accepted forms for one answer. "was / were" is a single cell holding two
 * real forms, so either alone passes, and so does the pair as written.
 */
function acceptable(answer) {
  const whole = normAns(answer);
  const parts = String(answer)
    .split("/")
    .map(normAns)
    .filter(Boolean);
  return new Set([whole, ...parts]);
}

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let CTX = null;
let tab = null;
const openDrills = new Map(); // sectionId -> drill state

/** ctx = { data, activeTab? } — injected from app.js. activeTab lets a
 * deep link (the Exam Practice panel's affix-tables link) land on a specific
 * tab instead of whichever one the visitor last had open. */
export function initReference(ctx) {
  CTX = ctx;
  if (ctx?.activeTab && (ctx?.data?.tabs || []).some((t) => t.id === ctx.activeTab)) {
    tab = ctx.activeTab;
  }
  if (!tab) tab = ctx?.data?.tabs?.[0]?.id || null;
}

function tabs() {
  return (CTX?.data?.tabs) || [];
}

function currentTab() {
  return tabs().find((t) => t.id === tab) || tabs()[0] || null;
}

function sectionsOf(t) {
  return (t && t.sections) || [];
}

/** Practice items for a section: explicit row drills, then column pairs. */
function poolOf(sec) {
  const out = [];
  for (const row of sec.rows || []) {
    for (const d of row.drills || []) {
      if (d && d.cue && d.answer) out.push({ cue: d.cue, answer: d.answer });
    }
    if (row.skip_drill) continue;
    for (const spec of sec.drill || []) {
      const answer = row[spec.to];
      const cueWord = row[spec.from];
      // "—" marks a cell with no form (it has no standalone possessive):
      // it belongs in the table but must never be asked for.
      if (!answer || !cueWord || answer === "—") continue;
      out.push({
        cue: spec.label ? `${cueWord} · ${spec.label}` : cueWord,
        answer,
      });
    }
  }
  return out;
}

// ----------------------------------------------------------------- drill

function drillHtml(id) {
  const st = openDrills.get(id);
  if (!st) return "";
  if (st.i >= st.items.length) {
    return `<div class="ref-drill">
      <p class="ref-drill-score">Done: <strong>${st.score} / ${st.items.length}</strong></p>
      <button type="button" class="home-btn" data-ref-again="${esc(id)}">Again</button>
      <button type="button" class="home-btn" data-ref-close="${esc(id)}">Close</button>
    </div>`;
  }
  const it = st.items[st.i];
  // A wrong answer HALTS the run: correction on screen, nothing moves until
  // it is acknowledged.
  if (st.halt) {
    return `<div class="ref-drill">
      <p class="ref-drill-cue">${esc(it.cue)} <span class="ref-drill-n">${st.i + 1}/${st.items.length}</span></p>
      <p class="ref-drill-fb is-wrong">✗ you typed: ${esc(st.halt.typed)}</p>
      <p class="ref-drill-correction">${esc(it.answer)}</p>
      <form data-ref-continue="${esc(id)}">
        <button type="submit" class="home-btn" data-ref-continue-btn="${esc(id)}">Continue</button>
      </form>
    </div>`;
  }
  const fb = st.fb
    ? `<p class="ref-drill-fb is-ok">✓ ${esc(st.fb.show)}</p>`
    : "";
  return `<div class="ref-drill">
    <p class="ref-drill-cue">${esc(it.cue)} <span class="ref-drill-n">${st.i + 1}/${st.items.length}</span></p>
    <form data-ref-form="${esc(id)}" autocomplete="off">
      <input type="text" class="ref-drill-input" data-ref-input="${esc(id)}"
             autocapitalize="off" autocorrect="off" spellcheck="false"
             placeholder="type the form…" />
      <button type="submit" class="home-btn">Check</button>
    </form>
    ${fb}
  </div>`;
}

function startDrill(id, pool) {
  openDrills.set(id, {
    items: shuffle(pool).slice(0, 10),
    i: 0,
    score: 0,
    fb: null,
    halt: null,
  });
}

// ---------------------------------------------------------------- render

function tableHtml(sec) {
  const cols = sec.columns || [];
  const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join("");
  const rows = (sec.rows || [])
    .map((r) => {
      const tds = cols
        .map((c) => `<td class="ref-form">${esc(r[c.key])}</td>`)
        .join("");
      const note = r.note
        ? `<tr class="ref-note-row"><td colspan="${cols.length}">${esc(r.note)}</td></tr>`
        : "";
      return `<tr>${tds}</tr>${note}`;
    })
    .join("");
  return `<table class="ref-table">
      <thead><tr>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function sectionHtml(sec, i) {
  const pool = poolOf(sec);
  const st = openDrills.get(sec.id);
  // Mid-drill the table is HIDDEN — it returns with the score.
  const running = st && st.i < st.items.length;
  const drill = openDrills.has(sec.id)
    ? drillHtml(sec.id)
    : pool.length >= 3
      ? `<button type="button" class="home-btn" data-ref-drill="${esc(sec.id)}">Practise (${pool.length})</button>`
      : `<p class="home-hint">Practice unlocks as the path teaches these forms.</p>`;
  // First section open by default, so a tab never opens looking empty.
  const open = openDrills.has(sec.id) || i === 0 ? "open" : "";
  return `<details class="quiet-details ref-block" data-ref-block="${esc(sec.id)}" ${open}>
    <summary><strong>${esc(sec.title)}</strong> · ${esc(sec.sub || "")} <span class="ref-exemplar">${esc(sec.exemplar || "")}</span></summary>
    ${sec.intro ? `<p class="home-hint">${esc(sec.intro)}</p>` : ""}
    ${running ? "" : tableHtml(sec)}
    ${drill}
  </details>`;
}

export function renderReference(host) {
  if (!host || !CTX?.data) return;
  const t = currentTab();
  const secs = sectionsOf(t);
  const tabBar = tabs()
    .map(
      (x) =>
        `<button type="button" class="home-btn ${x.id === (t && t.id) ? "is-active" : ""}" data-ref-tab="${esc(x.id)}">${esc(x.label)}</button>`,
    )
    .join("");
  const body = secs.length
    ? secs.map(sectionHtml).join("")
    : `<p class="home-hint">Not built yet — this tab is wired and waiting for its table.</p>`;
  host.innerHTML = `
    <div class="ref-tabs" role="tablist">${tabBar}</div>
    <p class="home-hint">${esc((t && t.blurb) || "")} Practice here is not scored towards your progress.</p>
    ${body}
  `;
  wire(host);
  // Keyboard flow: the input when asking, the continue button when halted.
  const focusTarget =
    host.querySelector("[data-ref-input]") ||
    host.querySelector("[data-ref-continue-btn]");
  if (focusTarget) focusTarget.focus();
}

/** Point the panel at a given tab before the next render (deep links). */
export function focusTab(id) {
  const found = tabs().find((t) => t.id === String(id || ""));
  if (found) tab = found.id;
  return Boolean(found);
}

function poolFor(id) {
  for (const t of tabs()) {
    const sec = sectionsOf(t).find((s) => s.id === id);
    if (sec) return poolOf(sec);
  }
  return [];
}

function wire(host) {
  host.querySelectorAll("[data-ref-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      tab = b.dataset.refTab;
      renderReference(host);
    }),
  );
  host.querySelectorAll("[data-ref-drill]").forEach((b) =>
    b.addEventListener("click", () => {
      startDrill(b.dataset.refDrill, poolFor(b.dataset.refDrill));
      renderReference(host);
    }),
  );
  host.querySelectorAll("[data-ref-again]").forEach((b) =>
    b.addEventListener("click", () => {
      startDrill(b.dataset.refAgain, poolFor(b.dataset.refAgain));
      renderReference(host);
    }),
  );
  host.querySelectorAll("[data-ref-close]").forEach((b) =>
    b.addEventListener("click", () => {
      openDrills.delete(b.dataset.refClose);
      renderReference(host);
    }),
  );
  host.querySelectorAll("[data-ref-form]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = f.dataset.refForm;
      const st = openDrills.get(id);
      if (!st) return;
      const input = f.querySelector("[data-ref-input]");
      const typed = input ? input.value : "";
      if (!normAns(typed)) return;
      const it = st.items[st.i];
      if (acceptable(it.answer).has(normAns(typed))) {
        st.score += 1;
        st.fb = { show: it.answer };
        st.i += 1;
      } else {
        st.halt = { typed };
      }
      renderReference(host);
    }),
  );
  host.querySelectorAll("[data-ref-continue]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = f.dataset.refContinue;
      const st = openDrills.get(id);
      if (!st || !st.halt) return;
      st.halt = null;
      st.fb = null;
      st.i += 1;
      renderReference(host);
    }),
  );
}
