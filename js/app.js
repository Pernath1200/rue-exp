/**
 * rue-exp — combined map: grammar + vocab, spine conductor.
 * Stable siblings: RUE2 :8092 · RUE3 :8091. This app: :8097.
 */

import { startGrammarPractice } from "./practice-grammar.js";
import { startPractice as startVocabPractice } from "./practice-vocab.js";
import {
  loadProgress,
  isLevelUnlocked,
  hasFruit,
  progressLabelGrammar,
  nodeProgressStateGrammar,
  hasVocabFruit,
  progressLabelVocab,
  nodeProgressStateVocab,
  touchBlock,
  completeMode,
  touchVocabBlock,
  completeVocabMode,
  refreshUnit,
  levelUnitStats,
  reviewDueList,
  backfillReview,
  PASS_RATIO,
  MASTERY_REPS,
  FRUIT_SOFT,
  downloadProgressFile,
  importProgressPayload,
} from "./progress.js";
import {
  mountSmokeFlagsUI,
  getSmokeApi,
  updateFlagsBadge,
  addFlag,
  loadFlags,
} from "./smoke-flags.js";
import { renderTreePortrait } from "./tree-portrait.js";
import { initReference, renderReference } from "./reference.js";

/* Smoke flagging is a REVIEW tool, not a student feature (James, 2026-08-10).
 * Gated on hostname, so it is automatic when serving on :8097 and cannot
 * appear on GitHub Pages — no unlock button to leave switched on by accident.
 * Restores the chrome removed in 7ec4bd1 alongside Author unlock. */
const IS_DEV_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(
  location.hostname,
);

const STATE = {
  level: "A1",
  tree: null,
  spine: null,
  selectedId: null,
  view: "map",
  showFull: false,
  /** Queued first-fruit tick — shown on practice exit only. */
  pendingFruitPayoff: null,
  lastPlayedLevel: null,
  cameFromReview: false,
};

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nodeById(id) {
  return (STATE.tree?.nodes || []).find((n) => n.id === id) || null;
}

/** Typed addresses arrive with any capitalisation — match ids case-blind. */
function resolveNodeId(id) {
  const exact = nodeById(id);
  if (exact) return exact;
  const low = String(id || "").toLowerCase();
  return (
    (STATE.tree?.nodes || []).find((n) => n.id.toLowerCase() === low) || null
  );
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const m = a.length;
  const n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[n];
}

/** Closest openable units to a missed id — prefix beats contains beats typo. */
function nearestLiveNodes(id, limit = 3) {
  const low = String(id || "").toLowerCase();
  const scored = [];
  for (const n of STATE.tree?.nodes || []) {
    if (n.status !== "live" || !n.content) continue;
    const nid = n.id.toLowerCase();
    let score = null;
    if (nid.startsWith(low) || low.startsWith(nid)) score = 0;
    else if (nid.includes(low) || low.includes(nid)) score = 1;
    else {
      const d = editDistance(low, nid);
      if (d <= 3) score = 1 + d;
    }
    if (score !== null) scored.push([score, n]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].id.localeCompare(b[1].id));
  return scored.slice(0, limit).map(([, n]) => n);
}

/**
 * A deep link that did not open a unit. Only James (and family, later) use
 * these links, so the miss is builder information, not student hand-holding:
 * say what happened, offer the closest real units, and on the dev host log
 * the id to the smoke-flag store — a missed link is a unit worth building.
 */
function showDeepLinkNotice(id) {
  clearDeepLinkNotice();
  const map = document.getElementById("view-map");
  if (!map) return;

  const inTree = resolveNodeId(id);
  const near = nearestLiveNodes(id);
  const head = inTree
    ? `“${escapeHtml(id)}” is planned but not built yet.`
    : `No unit called “${escapeHtml(id)}” yet.`;

  let logged = false;
  if (IS_DEV_HOST) {
    const note = `deep link miss: #${id}`;
    const dup = loadFlags().some((f) => f.note === note);
    if (!dup) {
      addFlag({ tag: "ui", note, packId: String(id) });
      logged = true;
    }
  }

  const nearHtml = near.length
    ? `<span class="deeplink-near">Closest built units: ${near
        .map(
          (n) =>
            `<a href="#${escapeHtml(n.id)}">${escapeHtml(
              n.title || n.id,
            )}</a>`,
        )
        .join(" · ")}</span>`
    : "";
  const loggedHtml = logged
    ? `<span class="deeplink-logged">Flagged as a unit to build.</span>`
    : "";

  const el = document.createElement("div");
  el.id = "deeplink-notice";
  el.className = "deeplink-notice";
  el.innerHTML = `
    <div class="deeplink-notice-text">
      <strong>${head}</strong>
      ${nearHtml}
      ${loggedHtml}
    </div>
    <button class="deeplink-dismiss" type="button" aria-label="Dismiss">×</button>
  `;
  el.querySelector(".deeplink-dismiss").addEventListener("click", () =>
    clearDeepLinkNotice(),
  );
  map.insertBefore(el, map.firstChild);
}

function clearDeepLinkNotice() {
  document.getElementById("deeplink-notice")?.remove();
}

/**
 * Deep-link: marked sheets / smoke notes can open a unit by hash.
 * Accepts #a1_word_order · #/a1_word_order · #unit=a1_word_order
 * (optional &review=1 for review launch). Bare # or #/ returns to map.
 */
function parseUnitHash(hash) {
  const raw = String(hash || "")
    .replace(/^#/, "")
    .trim();
  if (!raw || raw === "/") return { id: null, review: false };
  let body = raw.startsWith("/") ? raw.slice(1) : raw;
  let review = false;
  if (body.includes("=") || body.includes("&")) {
    const params = new URLSearchParams(body.includes("=") ? body : `id=${body}`);
    const id = params.get("unit") || params.get("id") || params.get("node") || "";
    review = /^(1|true|yes)$/i.test(params.get("review") || "");
    body = id || body.split("&")[0];
  }
  const id = body.split(/[/?&]/)[0].trim();
  if (!id || !/^[a-z][a-z0-9_]*$/i.test(id)) return { id: null, review: false };
  return { id, review };
}

function setUnitHash(nodeId, launch = {}) {
  if (STATE._hashSync) return;
  const next =
    nodeId
      ? launch.review
        ? `#${nodeId}&review=1`
        : `#${nodeId}`
      : "";
  if (location.hash === next || (!location.hash && !next)) return;
  STATE._hashSync = true;
  try {
    if (next) history.replaceState(null, "", next);
    else history.replaceState(null, "", location.pathname + location.search);
  } finally {
    STATE._hashSync = false;
  }
}

async function openNodeFromHash({ replace = true } = {}) {
  const { id, review } = parseUnitHash(location.hash);
  if (!id) return false;
  const node = resolveNodeId(id);
  if (!node || node.status !== "live" || !node.content) {
    // A real click on a bad link — say so instead of silently showing the map.
    if (STATE.view === "practice") showMap({ fromHash: true });
    showDeepLinkNotice(id);
    return false;
  }
  clearDeepLinkNotice();
  const lv = levelOfNode(node);
  if (lv) STATE.level = lv;
  STATE.selectedId = node.id;
  await openNode(node, { review });
  if (replace) setUnitHash(node.id, { review });
  return true;
}

function bindHashRouting() {
  window.addEventListener("hashchange", () => {
    if (STATE._hashSync) return;
    const { id } = parseUnitHash(location.hash);
    if (!id) {
      clearDeepLinkNotice();
      if (STATE.view === "practice") showMap({ fromHash: true });
      return;
    }
    openNodeFromHash({ replace: false });
  });
}

function isFruit(node) {
  if (!node || node.status !== "live") return false;
  return node.domain === "grammar" ? hasFruit(node.id) : hasVocabFruit(node);
}

function progressLabel(node) {
  return node.domain === "grammar"
    ? progressLabelGrammar(node)
    : progressLabelVocab(node);
}

function progressState(node) {
  return node.domain === "grammar"
    ? nodeProgressStateGrammar(node)
    : nodeProgressStateVocab(node);
}

function clearFruitPayoffKeys() {
  const root = document.getElementById("practice-root");
  if (root && root.__ruePayoffKey) {
    document.removeEventListener("keydown", root.__ruePayoffKey, true);
    root.__ruePayoffKey = null;
  }
}

function showMap(opts = {}) {
  const pr = document.getElementById("practice-root");
  if (pr && typeof pr._RUE2UnbindKeys === "function") {
    pr._RUE2UnbindKeys();
    pr._RUE2UnbindKeys = null;
  }
  if (pr && typeof pr._RUEVocabUnbind === "function") {
    pr._RUEVocabUnbind();
    pr._RUEVocabUnbind = null;
  }
  clearFruitPayoffKeys();
  if (pr) pr.innerHTML = "";
  STATE.view = "map";
  document.getElementById("view-map").hidden = false;
  document.getElementById("view-practice").hidden = true;
  document.body.classList.remove("domain-grammar", "domain-vocab");
  if (STATE.lastPlayedLevel) STATE.level = STATE.lastPlayedLevel;
  if (!opts.fromHash) setUnitHash(null);
  renderAll();
  // Land on "what's next" — after a review launch, that means the review
  // card (finish the day's queue), falling through to up-next once empty.
  requestAnimationFrame(() => {
    const rc = document.getElementById("review-card");
    const target =
      STATE.cameFromReview && rc && !rc.hidden
        ? rc
        : document.getElementById("up-next-card");
    STATE.cameFromReview = false;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.classList.add("is-focus-target");
    setTimeout(() => target?.classList.remove("is-focus-target"), 1600);
  });
}

function showPractice(domain) {
  STATE.view = "practice";
  clearFruitPayoffKeys();
  STATE.pendingFruitPayoff = null;
  document.getElementById("view-map").hidden = true;
  document.getElementById("view-practice").hidden = false;
  document.body.classList.remove("domain-grammar", "domain-vocab");
  document.body.classList.add(
    domain === "grammar" ? "domain-grammar" : "domain-vocab",
  );
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function levelOfNode(node) {
  if (!node) return STATE.level || "A1";
  if (Array.isArray(node.levels) && node.levels[0]) return node.levels[0];
  return STATE.level || "A1";
}

/**
 * Queue first-fruit tick. Only call when progress says justFruited.
 * Shown on practice exit — never mid-question.
 */
function queueFruitPayoff(nodeId, statsBefore) {
  const nodes = STATE.tree?.nodes || [];
  const level = levelOfNode(nodeById(nodeId));
  const after = levelUnitStats(level, nodes);
  STATE.pendingFruitPayoff = {
    kind: "learned",
    nodeId,
    level,
    before: statsBefore || after,
    after,
  };
}

/* A counted review earns the same payoff screen as first-learning, in its
 * "remembered" mode — the banner supported it from the start and nothing
 * ever fired it, so a successful review used to pass in total silence. */
function queueRememberedPayoff(nodeId, statsBefore) {
  const nodes = STATE.tree?.nodes || [];
  const level = levelOfNode(nodeById(nodeId));
  const after = levelUnitStats(level, nodes);
  STATE.pendingFruitPayoff = {
    kind: "remembered",
    nodeId,
    level,
    before: statsBefore || after,
    after,
  };
}

function maybeShowFruitPayoff() {
  const pending = STATE.pendingFruitPayoff;
  if (!pending) return false;
  STATE.pendingFruitPayoff = null;
  showFruitPayoff(pending);
  return true;
}

/**
 * First fruit only: tick + level chip + Learned bar (from RUE2 / RUPL).
 * Must not fire unless justFruited was true (strict clear gates).
 */
function showFruitPayoff({ before, after, kind = "learned", level: lvlIn, nodeId }) {
  const root = document.getElementById("practice-root");
  if (!root) return;
  if (typeof root._RUE2UnbindKeys === "function") {
    try {
      root._RUE2UnbindKeys();
    } catch {
      /* ignore */
    }
    root._RUE2UnbindKeys = null;
  }
  if (typeof root._RUEVocabUnbind === "function") {
    try {
      root._RUEVocabUnbind();
    } catch {
      /* ignore */
    }
    root._RUEVocabUnbind = null;
  }
  clearFruitPayoffKeys();
  STATE.view = "payoff";
  document.getElementById("view-map").hidden = true;
  document.getElementById("view-practice").hidden = false;
  document.body.classList.remove("domain-grammar", "domain-vocab");

  const isRemember = kind === "remembered";
  const meterKey = isRemember ? "remembered" : "learned";
  const meterLabel = isRemember ? "Remembered" : "Learned";
  const meterClass = isRemember ? "meter-remembered" : "meter-learned";
  const level = lvlIn || levelOfNode(nodeById(nodeId)) || STATE.level || "A1";
  const total = after?.total > 0 ? after.total : 1;
  const pctOf = (n) => Math.round((100 * (n || 0)) / total);
  const fromN = before?.[meterKey] ?? 0;
  const toN = after?.[meterKey] ?? 0;
  const fromP = pctOf(fromN);
  const toP = pctOf(toN);
  const reduce =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION_MS = 1250;
  const primaryId = isRemember ? "payoff-review" : "payoff-next";
  const primaryLabel = isRemember ? "Review" : "Do next";

  const paintStats = (n, p) => {
    const fracEl = root.querySelector("#payoff-frac");
    const pctEl = root.querySelector("#payoff-pct");
    const track = root.querySelector(".meter-track");
    if (fracEl) fracEl.textContent = `${n}/${total}`;
    if (pctEl) pctEl.textContent = `${p}%`;
    if (track) track.setAttribute("aria-valuenow", String(p));
  };

  root.innerHTML = `
    <div class="fruit-payoff" role="status" aria-live="polite"
      aria-label="${escapeXml(level)} ${escapeXml(meterLabel)} ${toN} of ${total}, ${toP} percent">
      <div class="fruit-payoff-tick${reduce ? " is-drawn" : ""}" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="56" height="56" focusable="false">
          <circle cx="24" cy="24" r="20" />
          <path d="M14 24.5 L21 31.5 L34 16.5" />
        </svg>
      </div>
      <div class="fruit-payoff-kind" aria-hidden="true">${escapeXml(meterLabel)}</div>
      <div class="fruit-payoff-head">
        <span class="fruit-payoff-level" aria-hidden="true">${escapeXml(level)}</span>
        <span class="fruit-payoff-stats">
          <span id="payoff-frac">${reduce ? toN : fromN}/${total}</span>
          <span class="fruit-payoff-dot" aria-hidden="true">·</span>
          <span id="payoff-pct">${reduce ? toP : fromP}%</span>
        </span>
      </div>
      <div class="meter-row ${meterClass} fruit-payoff-meter">
        <div class="meter-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
          aria-valuenow="${reduce ? toP : fromP}"
          aria-label="${escapeXml(level)} ${escapeXml(meterLabel)} ${toN} of ${total}">
          <div class="meter-fill" id="payoff-fill" style="width:${reduce ? toP : fromP}%"></div>
        </div>
      </div>
      <div class="home-actions fruit-payoff-nav" role="group" aria-label="Main actions">
        <button type="button" class="home-btn home-btn-primary" id="${primaryId}">${primaryLabel}</button>
        <button type="button" class="home-btn" id="payoff-home">Home</button>
        ${
          isRemember
            ? `<button type="button" class="home-btn" id="payoff-next">Do next</button>`
            : `<button type="button" class="home-btn" id="payoff-review">Review</button>`
        }
        <button type="button" class="home-btn" id="payoff-topics">Topics</button>
        <button type="button" class="home-btn" id="payoff-howto">How to use</button>
      </div>
    </div>`;

  const fill = root.querySelector("#payoff-fill");
  const tick = root.querySelector(".fruit-payoff-tick");

  if (reduce) {
    paintStats(toN, toP);
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tick) tick.classList.add("is-drawn");
        if (fill) fill.style.width = `${toP}%`;
        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / DURATION_MS);
          const e = 1 - (1 - t) ** 3;
          const n = Math.round(fromN + (toN - fromN) * e);
          const p = Math.round(fromP + (toP - fromP) * e);
          paintStats(n, p);
          if (t < 1) requestAnimationFrame(step);
          else paintStats(toN, toP);
        };
        requestAnimationFrame(step);
      });
    });
  }

  const leaveToMap = () => {
    clearFruitPayoffKeys();
    showMap();
  };

  root.querySelector("#payoff-next")?.addEventListener("click", () => {
    leaveToMap();
    void startDoNext();
  });
  root.querySelector("#payoff-home")?.addEventListener("click", () => {
    leaveToMap();
    STATE.homePanel = null;
    renderHomeChrome();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  root.querySelector("#payoff-review")?.addEventListener("click", () => {
    leaveToMap();
    STATE.homePanel = "review";
    renderHomeChrome();
    document.getElementById("review-card")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
  root.querySelector("#payoff-topics")?.addEventListener("click", () => {
    leaveToMap();
    STATE.homePanel = "more";
    STATE.homePanelSource = "topics";
    renderHomeChrome();
    document.getElementById("panel-more")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
  root.querySelector("#payoff-howto")?.addEventListener("click", () => {
    leaveToMap();
    showHowto();
  });

  const onKey = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    clearFruitPayoffKeys();
    leaveToMap();
    if (isRemember) {
      STATE.homePanel = "review";
      renderHomeChrome();
    } else {
      void startDoNext();
    }
  };
  root.__ruePayoffKey = onKey;
  document.addEventListener("keydown", onKey, true);
  root.querySelector(`#${primaryId}`)?.focus();
}

/** Path id list for the active CEFR level (A1 zigzag + A2 zigzag + higher spines). */
function pathOrderForLevel(level) {
  const t = STATE.tree || {};
  const lv = level || STATE.level || "A1";
  if (lv === "A1") return t.path_order || [];
  if (lv === "A2") return t.path_order_a2 || [];
  if (lv === "B1") return t.path_order_b1 || [];
  if (lv === "B2") return t.path_order_b2 || [];
  if (lv === "C1") return t.path_order_c1 || [];
  return t.path_order || [];
}

/**
 * Next = first unfruited **live** node on this level's path.
 * Coming/planned stay on Topics but do not block Do next.
 */
function spineNext() {
  const order = pathOrderForLevel(STATE.level);
  const steps = [
    ...(STATE.spine?.steps || []),
    ...(STATE.spine?.steps_a2 || []),
  ];
  for (const nid of order) {
    const node = nodeById(nid);
    if (!node || !node.levels?.includes(STATE.level)) continue;
    if (node.status !== "live" || !node.content) continue;
    if (isFruit(node)) continue;
    const step =
      steps.find((s) => {
        const g = s.grammar || s.rue2 || s.RUE2 || {};
        const v = s.vocab || s.rue3 || s.RUE3 || {};
        return g.node_id === nid || v.node_id === nid;
      }) || { id: node.unit_id || "", case_tags: node.case_tags || [] };
    const side = node.domain === "grammar" ? "grammar" : "vocab";
    const pairId = node.partner_id;
    const pair = pairId
      ? { node_id: pairId, label: nodeById(pairId)?.label || pairId }
      : null;
    return { step, node, side, pair };
  }
  return null;
}

function focusNodeOnMap(node) {
  if (!node) return;
  STATE._userPickedUnit = true;
  STATE.homePanel = null;
  STATE.selectedId = node.id;
  renderPath();
  renderDetail();
  renderHomeChrome();
  syncUnitDetailVisibility();
  requestAnimationFrame(() => {
    document
      .getElementById("node-detail-card")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const go = document.querySelector("#node-actions .btn:not(:disabled)");
    go?.classList.add("is-focus-target");
    try {
      go?.focus({ preventScroll: true });
    } catch {
      go?.focus();
    }
    setTimeout(() => go?.classList.remove("is-focus-target"), 1600);
  });
}

function renderRail() {
  const rail = document.getElementById("level-rail");
  const levels = STATE.tree?.levels || ["A1", "A2", "B1", "B2", "C1"];
  rail.innerHTML = "";
  for (const lv of levels) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-btn";
    // rue-exp: all levels unlocked for browse; live units practiceable
    void isLevelUnlocked(lv);
    btn.setAttribute("aria-pressed", lv === STATE.level ? "true" : "false");
    btn.textContent = lv;
    btn.addEventListener("click", () => {
      STATE.level = lv;
      STATE.selectedId = null;
      renderAll();
      STATE.setMapMore?.(true);
      document
        .getElementById("path-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    rail.appendChild(btn);
  }
}

function renderUpNext() {
  // Home chrome drives next line + Do next
  renderHomeChrome();
  const el = document.getElementById("up-next");
  if (el) el.innerHTML = "";
}

const HOWTO_KEY = "rue-exp-howto-seen";

function renderHomeChrome() {
  const line = document.getElementById("home-next-line");
  const hit = spineNext();
  const due = typeof reviewDueList === "function" ? reviewDueList(STATE.tree?.nodes || []) : [];
  if (line) {
    if (!hit) {
      line.textContent = "Path complete for now.";
    } else {
      line.innerHTML = `Do next: <strong>${escapeHtml(hit.node.label)}</strong>`;
    }
  }
  const revHint = document.getElementById("home-review-hint");
  if (revHint) {
    if (due.length) {
      revHint.hidden = false;
      revHint.textContent = `${due.length} due for review`;
    } else {
      revHint.hidden = true;
      revHint.textContent = "";
    }
  }
  const progMeta = document.getElementById("progress-summary-meta");
  if (progMeta) {
    const s = levelUnitStats(STATE.level, STATE.tree?.nodes || []);
    if (s?.total) {
      const pct = Math.round((100 * (s.learned || 0)) / s.total);
      progMeta.textContent = `· ${pct}%`;
    }
  }
  const review = document.getElementById("review-card");
  const more = document.getElementById("panel-more");
  const tables = document.getElementById("tables-card");
  if (review) review.hidden = STATE.homePanel !== "review";
  if (more) more.hidden = STATE.homePanel !== "more";
  if (tables) tables.hidden = STATE.homePanel !== "tables";
  const moreBtn = document.getElementById("btn-home-more");
  if (moreBtn) {
    moreBtn.setAttribute(
      "aria-expanded",
      STATE.homePanel === "more" ? "true" : "false",
    );
  }
  const activeBtn =
    STATE.homePanel === "review"
      ? "btn-home-review"
      : STATE.homePanel === "tables"
        ? "btn-home-tables"
        : STATE.homePanel === "more"
          ? STATE.homePanelSource === "topics"
            ? "btn-home-topics"
            : "btn-home-more"
          : null;
  for (const id of [
    "btn-home-review",
    "btn-home-topics",
    "btn-home-tables",
    "btn-home-more",
  ]) {
    document.getElementById(id)?.classList.toggle("is-active", id === activeBtn);
  }
  document
    .getElementById("btn-do-next")
    ?.classList.toggle("home-btn-primary", activeBtn == null);
  syncUnitDetailVisibility();
}

/** Unit card only after a pick — not on first paint, not under Review/More. */
function syncUnitDetailVisibility() {
  const card = document.getElementById("node-detail-card");
  if (!card) return;
  const show =
    Boolean(STATE.selectedId) &&
    STATE.homePanel == null &&
    STATE.view !== "practice";
  card.hidden = !show;
}

function showHowto() {
  const overlay = document.getElementById("howto-overlay");
  if (!overlay) return;
  overlay.hidden = false;
  const finish = (runNext) => {
    try {
      localStorage.setItem(HOWTO_KEY, "1");
    } catch {
      /* ignore */
    }
    overlay.hidden = true;
    if (runNext) void startDoNext();
  };
  const startBtn = document.getElementById("howto-start");
  const dismissBtn = document.getElementById("howto-dismiss");
  if (startBtn) startBtn.onclick = () => finish(true);
  if (dismissBtn) dismissBtn.onclick = () => finish(false);
}

async function startDoNext() {
  const hit = spineNext();
  if (!hit?.node) return;
  // Open practice for that node (grammar or vocab)
  try {
    await openNode(hit.node);
  } catch (e) {
    console.warn(e);
    focusNodeOnMap(hit.node);
  }
}

function wireMapHelp() {
  const btn = document.getElementById("btn-map-help");
  const tip = document.getElementById("map-help-tip");
  if (!btn || !tip || btn.dataset.wired) return;
  btn.dataset.wired = "1";
  const setOpen = (open) => {
    tip.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  btn.addEventListener("mouseenter", () => setOpen(true));
  btn.addEventListener("mouseleave", () => {
    if (document.activeElement !== btn) setOpen(false);
  });
  btn.addEventListener("focus", () => setOpen(true));
  btn.addEventListener("blur", () => setOpen(false));
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(tip.hidden);
  });
  btn.addEventListener("pointerdown", (e) => e.stopPropagation());
}

function wireHomeActions() {
  if (document.body.dataset.homeWired === "1") return;
  document.body.dataset.homeWired = "1";
  STATE.homePanel = null;
  wireMapHelp();
  document.getElementById("btn-do-next")?.addEventListener("click", () => {
    void startDoNext();
  });
  document.getElementById("btn-how-to-use")?.addEventListener("click", () => {
    showHowto();
  });
  document.getElementById("btn-home-more")?.addEventListener("click", () => {
    const reopen = STATE.homePanel === "more" && STATE.homePanelSource !== "more";
    STATE.homePanel = STATE.homePanel === "more" && !reopen ? null : "more";
    STATE.homePanelSource = "more";
    renderHomeChrome();
    if (STATE.homePanel === "more") {
      const det = document.getElementById("map-details");
      if (det) det.open = true;
      STATE.setMapMore?.(true);
      renderRoots();
      renderPath();
      renderLevelMeters();
      document.getElementById("panel-more")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
  document.getElementById("btn-home-review")?.addEventListener("click", () => {
    STATE.homePanel = STATE.homePanel === "review" ? null : "review";
    renderHomeChrome();
    if (STATE.homePanel === "review") {
      renderReview();
      document.getElementById("review-card")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
  document.getElementById("btn-home-tables")?.addEventListener("click", () => {
    STATE.homePanel = STATE.homePanel === "tables" ? null : "tables";
    renderHomeChrome();
    if (STATE.homePanel === "tables") {
      const host = document.getElementById("reference-host");
      if (host) {
        if (!STATE.reference) {
          host.innerHTML = `<p class="home-hint">Tables could not be loaded.</p>`;
        } else {
          initReference({ data: STATE.reference });
          renderReference(host);
        }
      }
      document.getElementById("tables-card")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
  document.getElementById("btn-home-topics")?.addEventListener("click", () => {
    const reopen = STATE.homePanel === "more" && STATE.homePanelSource !== "topics";
    STATE.homePanel = STATE.homePanel === "more" && !reopen ? null : "more";
    STATE.homePanelSource = "topics";
    renderHomeChrome();
    if (STATE.homePanel === "more") {
      const det = document.getElementById("map-details");
      if (det) det.open = true;
      STATE.setMapMore?.(true);
      renderRoots();
      renderPath();
      document.getElementById("panel-more")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
}

/** Combined tree portrait only (Roots/Canopy meter chips removed — 2026-08-10). */
function renderRoots() {
  const portrait = document.getElementById("tree-portrait");
  if (portrait && STATE.tree) {
    renderTreePortrait(portrait, {
      level: STATE.level || "A1",
      nodes: STATE.tree.nodes || [],
      isFruit: (id) => {
        const n = nodeById(id);
        return n ? isFruit(n) : false;
      },
      progressState: (id) => {
        const n = nodeById(id);
        return n ? progressState(n) : "planned";
      },
      onSelect: (node) => focusNodeOnMap(node),
    });
  }
}

function renderPath() {
  const list = document.getElementById("path-list");
  list.innerHTML = "";
  const order = pathOrderForLevel(STATE.level);
  let n = 0;
  for (const id of order) {
    const node = nodeById(id);
    if (!node || !node.levels?.includes(STATE.level)) continue;
    n += 1;
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "path-item";
    if (node.status !== "live") btn.classList.add("is-coming");
    btn.setAttribute(
      "aria-pressed",
      STATE.selectedId === node.id ? "true" : "false",
    );
    const st = progressState(node);
    let label = progressLabel(node);
    if (node.status === "coming") label = "coming";
    else if (node.status === "planned") label = "planned";
    else if (node.status === "parked") label = "parked";
    let statusCls = "status";
    if (st === "fruit") statusCls += " is-fruit";
    else if (node.status !== "live" || st === "planned")
      statusCls += " is-planned";
    else statusCls += " is-live";
    const dtag =
      node.domain === "grammar"
        ? `<span class="domain-tag g">gram</span>`
        : `<span class="domain-tag v">vocab</span>`;

    btn.innerHTML = `
      <span class="n">${n}</span>
      <span class="meta">
        <span class="title">${dtag} ${escapeHtml(node.label)}</span>
        ${node.note ? `<span class="note">${escapeHtml(node.note)}</span>` : ""}
      </span>
      <span class="${statusCls}">${escapeHtml(label)}</span>
    `;
    btn.addEventListener("click", () => {
      focusNodeOnMap(node);
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
  if (!n) {
    list.innerHTML = `<li class="path-empty sub">No units on this level yet.</li>`;
  }
}

function renderDetail() {
  const box = document.getElementById("node-detail");
  const node = nodeById(STATE.selectedId);
  if (!node) {
    box.innerHTML = `<p class="tree-legend">Pick a unit on the path.</p>`;
    return;
  }
  const st = progressState(node);
  const pills = [];
  pills.push(
    `<span class="pill live">${node.domain === "grammar" ? "grammar" : "vocab"}</span>`,
  );
  if (node.status === "live") pills.push('<span class="pill live">live</span>');
  else if (node.status === "coming")
    pills.push('<span class="pill">coming</span>');
  else if (node.status === "parked")
    pills.push('<span class="pill">parked</span>');
  else pills.push('<span class="pill">planned</span>');
  if (st === "fruit") pills.push('<span class="pill fruit">done</span>');
  pills.push(
    `<span class="pill">${escapeHtml((node.levels || []).join(" · ") || "?")}</span>`,
  );

  const partner = node.partner_id ? nodeById(node.partner_id) : null;

  box.innerHTML = `
    <div>${pills.join("")}</div>
    <p class="practice-prompt" style="margin-top:0.5rem">${escapeHtml(node.label)}</p>
    ${node.note ? `<p class="tree-legend">${escapeHtml(node.note)}</p>` : ""}
    ${
      partner
        ? `<p class="tree-legend">Pair: <button type="button" class="today-link" id="btn-detail-partner">${escapeHtml(partner.label)}</button>
           ${isFruit(partner) ? " · done" : " · not done"}</p>`
        : ""
    }
    <div class="node-actions" id="node-actions"></div>
  `;
  box.querySelector("#btn-detail-partner")?.addEventListener("click", () => {
    if (partner) focusNodeOnMap(partner);
  });
  const actions = box.querySelector("#node-actions");
  if (node.status === "live" && node.content) {
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn";
    go.textContent = "Practice →";
    go.addEventListener("click", () => openNode(node));
    actions.appendChild(go);
  } else {
    const wait = document.createElement("button");
    wait.type = "button";
    wait.className = "btn";
    wait.disabled = true;
    wait.textContent =
      node.status === "coming" || node.status === "planned"
        ? "Coming — sketch only (no practice yet)"
        : node.status === "parked"
          ? "Parked"
          : "No content";
    actions.appendChild(wait);
  }
}

async function openNode(node, launch = {}) {
  if (node.status !== "live" || !node.content) return;
  STATE.cameFromReview = !!launch.review;
  const lv = levelOfNode(node);
  if (lv) STATE.level = lv;
  STATE.selectedId = node.id;
  if (!launch.fromHash) setUnitHash(node.id, launch);
  try {
    const pack = await loadJson(`./data/${node.content}`);
    showPractice(node.domain);
    const root = document.getElementById("practice-root");
    root.innerHTML = "";

    STATE.lastPlayedLevel = levelOfNode(node);

    if (node.domain === "grammar") {
      let statsBefore = null;
      startGrammarPractice(pack, root, {
        startStage: launch.review ? "type" : undefined,
        onBeforeProgress: () => {
          statsBefore = levelUnitStats(levelOfNode(node), STATE.tree?.nodes || []);
        },
        onReview: () => {
          queueRememberedPayoff(
            node.id,
            statsBefore || levelUnitStats(levelOfNode(node), STATE.tree?.nodes || []),
          );
        },
        onFruit: () => {
          queueFruitPayoff(
            node.id,
            statsBefore || levelUnitStats(levelOfNode(node), STATE.tree?.nodes || []),
          );
        },
        onExit: () => {
          if (node.unit_id) {
            refreshUnit(node.unit_id, node.id, node.partner_id);
          }
          if (maybeShowFruitPayoff()) return;
          showMap();
        },
      });
    } else {
      // Vocab: pack may be multi-block; use first block or whole pack as RUE3 does
      const practice =
        pack.practice === "frames" || pack.practice === "frames"
          ? "frames"
          : undefined;
      // Pack-level authored sentence bank; frames use items.
      const packSentences = Array.isArray(pack.sentences) ? pack.sentences : [];
      const focusStructures = Array.isArray(pack.focus_structures)
        ? pack.focus_structures
        : pack.teaches_structures || [];
      // RUE3 opens a block from pack — for simplicity open pack as single block list
      const block =
        Array.isArray(pack.blocks) && pack.blocks.length
          ? pack.blocks[0]
          : pack;
      // If multi-block, merge items for a thin vertical slice (exp)
      let practiceBlock = block;
      if (Array.isArray(pack.blocks) && pack.blocks.length > 1) {
        practiceBlock = {
          id: pack.id || node.id,
          title: pack.title || node.label,
          items: pack.blocks.flatMap((b) => b.items || []),
          sentences: packSentences,
          intro: pack.intro || null,
          focus_structures: focusStructures,
          teaches_structures: pack.teaches_structures || [],
          uses_structures: pack.uses_structures || [],
        };
      } else if (pack.blocks?.[0]) {
        practiceBlock = {
          ...pack.blocks[0],
          title: pack.blocks[0].title || pack.title,
          sentences: packSentences.length
            ? packSentences
            : pack.blocks[0].sentences || [],
          intro: pack.intro || null,
          focus_structures: focusStructures,
          teaches_structures: pack.teaches_structures || [],
          uses_structures: pack.uses_structures || [],
        };
      } else {
        practiceBlock = {
          ...practiceBlock,
          sentences: packSentences,
          focus_structures: focusStructures,
        };
      }
      if (practice === "frames") {
        practiceBlock.practice = "frames";
      }
      if (!practiceBlock.sentences) practiceBlock.sentences = packSentences;
      if (!practiceBlock.focus_structures) {
        practiceBlock.focus_structures = focusStructures;
      }

      const blockId = practiceBlock.id || pack.id || node.id;
      touchVocabBlock(blockId, node.id);
      startVocabPractice(root, practiceBlock, {
        startMode: launch.review ? "type" : undefined,
        practice,
        packId: pack.id || node.id,
        packTitle: pack.title || node.label,
        packLevel: (node.levels && node.levels[0]) || pack.level || "?",
        onTouch: () => touchVocabBlock(blockId, node.id),
        onModeComplete: (mode, meta) => {
          const nodes = STATE.tree?.nodes || [];
          const statsBefore = levelUnitStats(levelOfNode(node), nodes);
          const wasFruit = hasVocabFruit(node);
          const r = completeVocabMode(blockId, mode, meta || {});
          const nowFruit = hasVocabFruit(node);
          if ((r && r.justFruited) || (!wasFruit && nowFruit)) {
            queueFruitPayoff(node.id, statsBefore);
          }
        },
        onExit: () => {
          if (node.unit_id) {
            refreshUnit(node.unit_id, node.partner_id, node.id);
          }
          if (maybeShowFruitPayoff()) return;
          showMap();
        },
      });
    }
  } catch (e) {
    const err = document.getElementById("boot-error");
    err.hidden = false;
    err.textContent = String(e.message || e);
  }
}

/**
 * Three honest meters: learned (fruit) · remembered (≥1 review) · mastered (≥4).
 * Same model as RUE2. Review meters stay at 0 until unit SRS writes successfulReps.
 */
function renderLevelMeters() {
  const el = document.getElementById("level-meters");
  if (!el || !STATE.tree) return;
  const level = STATE.level || "A1";
  const nodes = STATE.tree.nodes || [];
  const s = levelUnitStats(level, nodes);
  const t = s.total || 0;
  const pct = (n) => (t ? Math.round((100 * n) / t) : 0);
  const bar = (n, kind) => {
    const p = pct(n);
    const label =
      kind === "learned"
        ? "Learned"
        : kind === "remembered"
          ? "Remembered"
          : "Mastered";
    return `
      <div class="meter-row meter-${kind}">
        <div class="meter-label">${label}</div>
        <div class="meter-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${label} ${p}% · ${n} of ${t}">
          <div class="meter-fill" style="width:${p}%"></div>
        </div>
        <div class="meter-count"><span class="meter-pct">${p}%</span> <span class="meter-frac">${n}/${t}</span></div>
      </div>`;
  };
  const reviewLive = s.remembered > 0 || s.mastered > 0;
  const learnedPct = pct(s.learned);
  const scoreBar = Math.round(
    (level === "A1" ? Math.min(PASS_RATIO, FRUIT_SOFT) : PASS_RATIO) * 100,
  );
  el.innerHTML = `
    <div class="meters-head">
      <span class="meters-title">${escapeHtml(level)} progress</span>
      <span class="meters-sub">${s.partial ? `+${s.partial} started · ` : ""}${t} units · <strong>${learnedPct}%</strong> learned</span>
    </div>
    ${bar(s.learned, "learned")}
    ${bar(s.remembered, "remembered")}
    ${bar(s.mastered, "mastered")}
    <p class="meters-hint">
      Learned = finished once · Remembered / Mastered = kept fresh over spaced reviews.
    </p>`;
}

/** Due reviews, path order, capped display. Hidden when nothing is due. */
function renderReview() {
  const card = document.getElementById("review-card");
  const list = document.getElementById("review-list");
  if (!card || !list || !STATE.tree) return;
  const live = (STATE.tree.nodes || []).filter(
    (n) => n.status === "live" && n.content,
  );
  const due = reviewDueList(live);
  if (!due.length) {
    card.hidden = true;
    return;
  }
  const order = STATE.tree.path_order || [];
  due.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  // Only show when Review panel is open (minimal home)
  card.hidden = STATE.homePanel !== "review";
  const MAX = 6;
  list.innerHTML = `
    <p class="tree-legend">Quick review — just the typing. Open a unit, it starts at the typing stage; score 75%+ and it counts. Gaps grow: 1 · 3 · 7 · 14 · 30 days.</p>
    <div class="nav">
      ${due
        .slice(0, MAX)
        .map(
          (n) =>
            `<button type="button" class="btn" data-rev="${n.id}">${n.domain === "grammar" ? "⚙ " : ""}${escapeHtml(n.label)}</button>`,
        )
        .join(" ")}
      ${due.length > MAX ? `<span class="today-muted">+${due.length - MAX}</span>` : ""}
    </div>`;
  list.querySelectorAll("[data-rev]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const n = nodeById(btn.dataset.rev);
      if (n) openNode(n, { review: true });
    }),
  );
}

function renderAll() {
  loadProgress();
  renderRail();
  renderLevelMeters();
  renderReview();
  renderUpNext();
  renderRoots();
  renderPath();
  // Minimal home: never auto-select on paint (user picks via Topics/map or Do next)
  if (!STATE._userPickedUnit) {
    STATE.selectedId = null;
  }
  renderDetail();
  wireHomeActions();
  syncUnitDetailVisibility();
}

// Chrome stamps translated-ltr/rtl on <html> when it machine-translates the
// page — which replaces the Polish content itself. If that ever happens
// (despite the notranslate meta), warn loudly in English.
function watchAutoTranslate() {
  const el = document.documentElement;
  const check = () => {
    if (!/\btranslated-(ltr|rtl)\b/.test(el.className)) return;
    if (document.getElementById("translate-warning")) return;
    const b = document.createElement("div");
    b.id = "translate-warning";
    b.className = "card notranslate";
    b.setAttribute("translate", "no");
    b.style.cssText = "border-color:#dc2626";
    b.innerHTML =
      "<strong>⚠ Turn off translation!</strong> Your browser has translated " +
      "this page into English — the Polish you are here to learn has been " +
      "replaced. Tap the translate icon in the address bar and choose " +
      "<em>Show original</em>, then <em>Never translate this site</em>.";
    document.querySelector(".container")?.prepend(b);
  };
  new MutationObserver(check).observe(el, {
    attributes: true,
    attributeFilter: ["class"],
  });
  check();
}

async function boot() {
  const err = document.getElementById("boot-error");
  try {
    STATE.tree = await loadJson("./data/tree.json");
    try {
      STATE.spine = await loadJson("./data/spine.json");
    } catch {
      STATE.spine = null;
    }
    // Tables are optional chrome: a missing or broken reference.json must
    // never take the app down with it.
    try {
      STATE.reference = await loadJson("./data/reference.json");
    } catch {
      STATE.reference = null;
    }
    // Adopt units fruited before the SRS existed (learnedAt <- touchedAt),
    // so earlier days' units come due immediately, not never.
    backfillReview(STATE.tree.nodes || []);

    watchAutoTranslate();

    document.getElementById("btn-practice-back")?.addEventListener("click", () => {
      showMap();
    });

    if (IS_DEV_HOST) {
      mountSmokeFlagsUI(document.getElementById("smoke-flags-host"));
      const bar = document.getElementById("smoke-toolbar");
      if (bar) bar.hidden = false;
      document.getElementById("p-flag")?.addEventListener("click", () => {
        // Capture whatever the student typed before the panel steals focus.
        const el = document.querySelector(
          "#practice-root #ti, #practice-root #ui, #practice-root input.type-in, #practice-root textarea.type-in",
        );
        getSmokeApi()?.openForm(el ? { typed: String(el.value || "") } : {});
      });
      document.getElementById("p-flag-list")?.addEventListener("click", () => {
        getSmokeApi()?.openList();
      });
      updateFlagsBadge();
    }

    const MORE_KEY = "rue-exp-v0.1-map-more";
    const moreBtn = document.getElementById("btn-map-more");
    const moreWrap = document.getElementById("map-more");
    function setMapMore(open) {
      if (!moreBtn || !moreWrap) return;
      moreWrap.hidden = !open;
      moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      moreBtn.textContent = open
        ? "Hide tree and units ▴"
        : "Show all units ▾";
      try {
        localStorage.setItem(MORE_KEY, open ? "open" : "closed");
      } catch {
        /* ignore */
      }
    }
    moreBtn?.addEventListener("click", () => setMapMore(moreWrap.hidden));
    STATE.setMapMore = setMapMore;
    let moreStored = null;
    try {
      moreStored = localStorage.getItem(MORE_KEY);
    } catch {
      /* ignore */
    }
    setMapMore(moreStored === "open");

    bindProgressTransfer();
    bindHashRouting();
    renderAll();
    // Marked-sheet / bookmark entry: open the unit named in the hash.
    await openNodeFromHash({ replace: true });
  } catch (e) {
    err.hidden = false;
    err.textContent = String(e.message || e);
  }
}

/** Download / Import RUE progress (backup before updates; localhost ↔ Pages). */
function bindProgressTransfer() {
  const dl = document.getElementById("btn-progress-download");
  const imp = document.getElementById("btn-progress-import");
  const file = document.getElementById("input-progress-import");
  const msg = document.getElementById("progress-transfer-msg");
  const show = (text, isErr) => {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.style.color = isErr ? "var(--wrong, #c4a574)" : "var(--muted, #a0a0a0)";
  };
  if (dl) {
    dl.addEventListener("click", () => {
      try {
        downloadProgressFile();
        const p = loadProgress();
        const g = Object.keys(p.grammar?.blocks || {}).length;
        const v = Object.keys(p.vocab?.blocks || {}).length;
        show(`Downloaded (grammar ${g} · vocab ${v}). Keep the file as backup.`);
      } catch (e) {
        show(String(e.message || e), true);
      }
    });
  }
  if (imp && file) {
    imp.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      file.value = "";
      if (!f) return;
      let text;
      try {
        text = await f.text();
      } catch {
        show("Could not read file.", true);
        return;
      }
      try {
        downloadProgressFile();
      } catch {
        /* ignore */
      }
      const ok = window.confirm(
        "Import this progress file?\n\n" +
          "• Accepts rue-exp exports and RUE2 grammar exports.\n" +
          "• Current progress on THIS site (active student profile) will be replaced.\n" +
          "• A backup download of current progress was just attempted.\n" +
          "• Page will reload after a successful import.",
      );
      if (!ok) {
        show("Import cancelled.");
        return;
      }
      const result = importProgressPayload(text);
      if (!result.ok) {
        show(result.message || "Import failed.", true);
        return;
      }
      show(result.message + " Reloading…");
      setTimeout(() => location.reload(), 400);
    });
  }
}

boot();
