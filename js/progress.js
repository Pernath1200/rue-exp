/**
 * rue-exp dual progress — never writes RUE2/RUE3 keys.
 * Grammar fruit: 4 modes + best check/type ≥ 0.8 (RUE2)
 * Vocab fruit: 4 modes + best quiz/type ≥ 0.75 (RUE3 soft)
 */

/**
 * Per-student profiles (2026-08-10). The sacred name "rue-exp-progress"
 * survives as the PREFIX; each student's record lives at
 * "rue-exp-progress:<profile>". Pre-profile progress under the bare key
 * migrates (copy, not move) into profile "me" on first load — the bare key
 * stays behind untouched as a backup.
 */
const PREFIX = "rue-exp-progress";
const PROFILE_KEY = "rue-exp-profile";
const PROFILES_KEY = "rue-exp-profiles";
const DEFAULT_PROFILES = [
  "me", "martin", "ondrej", "martina", "jan", "vaclav", "tomas", "homare",
];

function sanitizeProfile(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

export function listProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) return arr.map(sanitizeProfile).filter(Boolean);
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_PROFILES.slice();
}

export function getActiveProfile() {
  let stored = null;
  try {
    stored = localStorage.getItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
  return sanitizeProfile(stored) || "me";
}

/** Select a profile (adds it to the list if new). Returns false on bad name. */
export function setActiveProfile(name) {
  const p = sanitizeProfile(name);
  if (!p) return false;
  localStorage.setItem(PROFILE_KEY, p);
  const list = listProfiles();
  if (!list.includes(p)) {
    list.push(p);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  }
  return true;
}

function key() {
  return `${PREFIX}:${getActiveProfile()}`;
}

// One-time migration: copy bare-key progress into the "me" profile.
(function migrateBareKey() {
  try {
    const bare = localStorage.getItem(PREFIX);
    if (bare != null && localStorage.getItem(`${PREFIX}:me`) == null) {
      localStorage.setItem(`${PREFIX}:me`, bare);
    }
  } catch {
    /* private mode etc. — profiles still work, just nothing to migrate */
  }
})();

export const PASS_RATIO = 0.8;
export const FRUIT_SOFT = 0.75;
/** Successful spaced reviews needed for “Mastered” (RUE2 sibling). */
export const MASTERY_REPS = 4;

function empty() {
  return {
    version: 1,
    authorUnlock: false,
    // Exp merge: all CEFR bands open for browse; practice when unit is live
    unlocked: ["A1", "A2", "B1", "B2", "C1"],
    grammar: { blocks: {} },
    vocab: { blocks: {} },
    units: {},
    /** Per tree-node review state (unit SRS). Honest zeros until review writes. */
    nodes: {},
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return empty();
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return empty();
    if (!d.grammar) d.grammar = { blocks: {} };
    if (!d.grammar.blocks) d.grammar.blocks = {};
    if (!d.vocab) d.vocab = { blocks: {} };
    if (!d.vocab.blocks) d.vocab.blocks = {};
    if (!d.units) d.units = {};
    if (!d.nodes) d.nodes = {};
    if (!Array.isArray(d.unlocked)) d.unlocked = ["A1", "A2", "B1", "B2", "C1"];
    return d;
  } catch {
    return empty();
  }
}

function save(p) {
  localStorage.setItem(key(), JSON.stringify(p));
}

export function isAuthorUnlock() {
  return !!loadProgress().authorUnlock;
}

export function setAuthorUnlock(on) {
  const p = loadProgress();
  p.authorUnlock = !!on;
  if (on) {
    for (const lv of ["A1", "A2", "B1", "B2", "C1"]) {
      if (!p.unlocked.includes(lv)) p.unlocked.push(lv);
    }
  }
  save(p);
}

export function isLevelUnlocked(level) {
  const p = loadProgress();
  if (p.authorUnlock) return true;
  // Migrate older saves that only had A1 unlocked
  const unlocked = p.unlocked || ["A1"];
  const need = ["A1", "A2", "B1", "B2", "C1"];
  let dirty = false;
  for (const lv of need) {
    if (!unlocked.includes(lv)) {
      unlocked.push(lv);
      dirty = true;
    }
  }
  if (dirty) {
    p.unlocked = unlocked;
    save(p);
  }
  return unlocked.includes(level);
}

// ---- Grammar API (compatible with practice-grammar.js) ----

export function touchBlock(blockId) {
  const p = loadProgress();
  if (!p.grammar.blocks[blockId]) {
    p.grammar.blocks[blockId] = { modes: {}, best: {}, touchedAt: Date.now() };
  } else {
    p.grammar.blocks[blockId].touchedAt = Date.now();
  }
  save(p);
}

export function completeMode(blockId, mode, result = null) {
  const p = loadProgress();
  if (!p.grammar.blocks[blockId]) {
    p.grammar.blocks[blockId] = { modes: {}, best: {}, touchedAt: Date.now() };
  }
  const b = p.grammar.blocks[blockId];
  b.modes[mode] = true;
  b.touchedAt = Date.now();
  let ratio = null;
  if (result && typeof result.score === "number" && result.total > 0) {
    ratio = result.score / result.total;
    const prev = b.best[mode];
    if (prev == null || ratio > prev) b.best[mode] = ratio;
  }
  save(p);
  // Grammar pack id == tree node id
  reviewTick(blockId, ratio, hasFruit(blockId));
}

function gBlock(id) {
  return loadProgress().grammar.blocks[id] || null;
}

function modeDone(b, mode) {
  return !!(b && b.modes && b.modes[mode]);
}

export function hasFruit(blockId) {
  const b = gBlock(blockId);
  if (!b) return false;
  // First completion fruits (James, 2026-08-04 smoke: "it shouldn't be
  // strict first time around") — walking the whole ladder is the bar.
  // Quality is policed where it matters: SRS reviews still need
  // FRUIT_SOFT to advance the schedule, and meters fill from real reps.
  return (
    modeDone(b, "intro") &&
    modeDone(b, "check") &&
    modeDone(b, "type") &&
    modeDone(b, "use")
  );
}

export function grammarBest(blockId) {
  const b = gBlock(blockId);
  return {
    check: b && b.best && b.best.check != null ? b.best.check : null,
    type: b && b.best && b.best.type != null ? b.best.type : null,
  };
}

export function progressLabelGrammar(node) {
  if (node.status === "planned") return "planned";
  if (hasFruit(node.id)) return "done";
  const b = gBlock(node.id);
  if (!b || !b.modes) return "live";
  const done = ["intro", "check", "type", "use"].filter((m) => b.modes[m]);
  if (!done.length) return "live";
  return `${done.length}/4`;
}

export function nodeProgressStateGrammar(node) {
  if (node.status !== "live") return "planned";
  if (hasFruit(node.id)) return "fruit";
  const b = gBlock(node.id);
  if (b && b.modes && Object.keys(b.modes).length) return "started";
  return "live";
}

// ---- Vocab API (compatible with RUE3 opts callbacks) ----

export function touchVocabBlock(blockId, nodeId) {
  const p = loadProgress();
  if (!p.vocab.blocks[blockId]) {
    p.vocab.blocks[blockId] = {
      nodeId: nodeId || null,
      modes: {},
      bestQuiz: null,
      bestType: null,
      sentenceDone: false,
      touchedAt: Date.now(),
    };
  } else {
    p.vocab.blocks[blockId].touchedAt = Date.now();
    if (nodeId) p.vocab.blocks[blockId].nodeId = nodeId;
  }
  save(p);
}

export function completeVocabMode(blockId, mode, meta = {}) {
  const p = loadProgress();
  if (!p.vocab.blocks[blockId]) {
    p.vocab.blocks[blockId] = {
      modes: {},
      bestQuiz: null,
      bestType: null,
      sentenceDone: false,
      touchedAt: Date.now(),
    };
  }
  const b = p.vocab.blocks[blockId];
  b.modes = b.modes || {};
  b.modes[mode] = true;
  b.touchedAt = Date.now();
  let ratio = null;
  if (meta.score != null && meta.total > 0) {
    ratio = meta.score / meta.total;
  }
  if (mode === "quiz" && ratio != null) {
    if (b.bestQuiz == null || ratio > b.bestQuiz) b.bestQuiz = ratio;
  }
  if (mode === "type" && ratio != null) {
    if (b.bestType == null || ratio > b.bestType) b.bestType = ratio;
  }
  if (mode === "sentence") b.sentenceDone = true;
  save(p);
  reviewTick(b.nodeId || blockId, ratio, blockHasFruit(b));
}

export function blockHasFruit(b) {
  if (!b || !b.modes) return false;
  const m = b.modes;
  // First completion fruits (James 2026-08-04) — see hasFruit(). Scores
  // are still recorded; SRS reviews keep the FRUIT_SOFT bar.
  return !!(m.match && m.quiz && m.type && m.sentence);
}

export function vocabBlockFruit(blockId) {
  return blockHasFruit(loadProgress().vocab.blocks[blockId]);
}

/** Vocab node fruit = any practice block under that node fruited, or node id as pack. */
export function hasVocabFruit(node) {
  if (!node || node.status !== "live") return false;
  const p = loadProgress();
  // Prefer blocks that record nodeId
  for (const [id, b] of Object.entries(p.vocab.blocks || {})) {
    if (b.nodeId === node.id && blockHasFruit(b)) return true;
    if (id === node.id && blockHasFruit(b)) return true;
  }
  // Pack id often equals tree content basename without path
  const content = node.content || "";
  const base = content.split("/").pop()?.replace(/\.json$/, "");
  if (base && p.vocab.blocks[base] && blockHasFruit(p.vocab.blocks[base]))
    return true;
  return false;
}

export function progressLabelVocab(node) {
  if (node.status === "planned") return "planned";
  if (hasVocabFruit(node)) return "done";
  const p = loadProgress();
  let b = null;
  for (const x of Object.values(p.vocab.blocks || {})) {
    if (x.nodeId === node.id) {
      b = x;
      break;
    }
  }
  if (!b) return "live";
  const modes = ["match", "quiz", "type", "sentence"];
  const done = modes.filter((m) => b.modes && b.modes[m]);
  if (!done.length) return "live";
  return `${done.length}/4`;
}

export function nodeProgressStateVocab(node) {
  if (node.status !== "live") return "planned";
  if (hasVocabFruit(node)) return "fruit";
  const p = loadProgress();
  for (const x of Object.values(p.vocab.blocks || {})) {
    if (x.nodeId === node.id && x.modes && Object.keys(x.modes).length)
      return "started";
  }
  return "live";
}

export function unitStatus(unitId) {
  const p = loadProgress();
  return p.units[unitId] || { grammarFruit: false, vocabFruit: false };
}

export function refreshUnit(unitId, grammarNodeId, vocabNodeId) {
  if (!unitId) return;
  const p = loadProgress();
  p.units[unitId] = {
    grammarFruit: grammarNodeId ? hasFruit(grammarNodeId) : false,
    vocabFruit: vocabNodeId
      ? hasVocabFruit({ id: vocabNodeId, status: "live" })
      : false,
  };
  save(p);
}

export function rootFill(tree, rootId) {
  const live = (tree.nodes || []).filter(
    (n) =>
      n.domain === "grammar" &&
      n.root === rootId &&
      n.status === "live" &&
      n.levels?.includes("A1"),
  );
  if (!live.length) return 0;
  let sum = 0;
  for (const n of live) {
    if (hasFruit(n.id)) sum += 1;
    else {
      const b = gBlock(n.id);
      if (b?.modes) {
        const parts = ["intro", "check", "type", "use"];
        sum += parts.filter((m) => b.modes[m]).length / 4;
      }
    }
  }
  return sum / live.length;
}

export function tapFill(tree) {
  const live = (tree.nodes || []).filter(
    (n) =>
      n.domain === "grammar" &&
      n.foundation &&
      n.status === "live" &&
      n.levels?.includes("A1"),
  );
  if (!live.length) return 0;
  let sum = 0;
  for (const n of live) {
    if (hasFruit(n.id)) sum += 1;
    else {
      const b = gBlock(n.id);
      if (b?.modes) {
        const parts = ["intro", "check", "type", "use"];
        sum += parts.filter((m) => b.modes[m]).length / 4;
      }
    }
  }
  return sum / live.length;
}

// ---- Unit SRS ----
// A unit becomes reviewable when it first fruits (learnedAt, due next day).
// A review succeeds when, while due, any scored pass reaches FRUIT_SOFT:
// reps++ and the interval widens. A weak pass while due re-queues tomorrow.
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

function reviewTick(nodeId, ratio, fruited) {
  if (!nodeId) return;
  const p = loadProgress();
  const n = (p.nodes[nodeId] = p.nodes[nodeId] || {});
  const now = Date.now();
  if (fruited && !n.learnedAt) {
    n.learnedAt = new Date(now).toISOString();
    n.nextDueAt = new Date(now + REVIEW_INTERVALS_DAYS[0] * DAY_MS).toISOString();
    save(p);
    return;
  }
  if (!n.learnedAt || !n.nextDueAt || ratio == null) return;
  if (now < Date.parse(n.nextDueAt)) return;
  n.lastReviewAt = new Date(now).toISOString();
  if (ratio >= FRUIT_SOFT) {
    n.successfulReps = (n.successfulReps || 0) + 1;
    const idx = Math.min(n.successfulReps, REVIEW_INTERVALS_DAYS.length - 1);
    n.nextDueAt = new Date(now + REVIEW_INTERVALS_DAYS[idx] * DAY_MS).toISOString();
  } else {
    n.nextDueAt = new Date(now + DAY_MS).toISOString();
  }
  save(p);
}

/** Live nodes whose review is due now (pass the tree's live practice nodes). */
export function reviewDueList(nodes) {
  const p = loadProgress();
  const now = Date.now();
  return (nodes || []).filter((node) => {
    const n = p.nodes?.[node.id];
    return n && n.learnedAt && n.nextDueAt && now >= Date.parse(n.nextDueAt);
  });
}

/**
 * One-time adoption for units fruited before the SRS existed: learnedAt is
 * taken from the block's touchedAt, so yesterday's units come due today.
 */
export function backfillReview(nodes) {
  const p = loadProgress();
  let changed = 0;
  for (const node of nodes || []) {
    if (!node || node.status !== "live" || !node.content) continue;
    if (p.nodes[node.id]?.learnedAt) continue;
    const fruited =
      node.domain === "vocab" ? hasVocabFruit(node) : hasFruit(node.id);
    if (!fruited) continue;
    let touched = null;
    if (node.domain === "grammar") {
      touched = p.grammar.blocks[node.id]?.touchedAt || null;
    } else {
      for (const [id, b] of Object.entries(p.vocab.blocks || {})) {
        if (b.nodeId === node.id || id === node.id) {
          touched = b.touchedAt || touched;
        }
      }
      const base = (node.content || "").split("/").pop()?.replace(/\.json$/, "");
      if (!touched && base) touched = p.vocab.blocks[base]?.touchedAt || null;
    }
    const learned = touched || Date.now() - DAY_MS;
    p.nodes[node.id] = {
      learnedAt: new Date(learned).toISOString(),
      nextDueAt: new Date(learned + REVIEW_INTERVALS_DAYS[0] * DAY_MS).toISOString(),
    };
    changed++;
  }
  if (changed) save(p);
  return changed;
}

/**
 * Review / SRS fields for a tree node. Empty until unit review writes them.
 * @returns {{ successfulReps: number, learnedAt: string|null, lastReviewAt: string|null, nextDueAt: string|null }}
 */
export function getNodeReview(nodeId) {
  const data = loadProgress();
  const n = (data.nodes && data.nodes[nodeId]) || null;
  return {
    successfulReps:
      n && typeof n.successfulReps === "number" ? n.successfulReps : 0,
    learnedAt: n && n.learnedAt ? n.learnedAt : null,
    lastReviewAt: n && n.lastReviewAt ? n.lastReviewAt : null,
    nextDueAt: n && n.nextDueAt ? n.nextDueAt : null,
  };
}

/**
 * Three-meter stats for a CEFR level (RUE2 model).
 * Unit grain = live practice nodes (grammar topics + vocab trunk/leaf) on that level.
 * Learned = fruit (ladder + score bar). Remembered = ≥1 successful review.
 * Mastered = ≥ MASTERY_REPS. Review meters stay honest zeros until SRS writes.
 *
 * @param {string} level
 * @param {Array<{ id: string, status?: string, levels?: string[], content?: string|null, domain?: string }>} nodes
 * @returns {{ total: number, learned: number, remembered: number, mastered: number, partial: number }}
 */
export function levelUnitStats(level, nodes) {
  const list = (nodes || []).filter(
    (n) =>
      n &&
      n.id &&
      n.status === "live" &&
      n.content &&
      Array.isArray(n.levels) &&
      n.levels.includes(level),
  );
  let learned = 0;
  let remembered = 0;
  let mastered = 0;
  let partial = 0;
  for (const n of list) {
    const fruited =
      n.domain === "vocab" ? hasVocabFruit(n) : hasFruit(n.id);
    const started =
      n.domain === "vocab"
        ? nodeProgressStateVocab(n) === "started"
        : nodeProgressStateGrammar(n) === "started";
    if (fruited) learned++;
    else if (started) partial++;
    const reps = getNodeReview(n.id).successfulReps;
    // Remembered/mastered only with real review evidence — no decorative glow
    if (fruited || reps > 0) {
      if (reps >= 1) remembered++;
      if (reps >= MASTERY_REPS) mastered++;
    }
  }
  return {
    total: list.length,
    learned,
    remembered,
    mastered,
    partial,
  };
}

export function resetAllProgress() {
  localStorage.removeItem(key());
}

/** Active profile's storage key. The PREFIX is stable — never rename. */
export function progressStorageKey() {
  return key();
}

/**
 * Portable progress file for Download / Import.
 * Move between localhost and GitHub Pages, or backup before updates.
 */
export function buildProgressExport() {
  return {
    app: "rue-exp",
    key: PREFIX,
    profile: getActiveProfile(),
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
  };
}

const RUE2_APP = "rue2-grammar";
const RUE2_KEY = "rue2-exp-progress";

function modeTruthy(modes, name) {
  if (!modes || typeof modes !== "object") return false;
  return !!modes[name];
}

function ratioFromPair(score, total) {
  if (typeof score !== "number" || typeof total !== "number" || total <= 0) {
    return null;
  }
  const r = score / total;
  if (!Number.isFinite(r)) return null;
  return Math.max(0, Math.min(1, r));
}

/**
 * Map one RUE2 grammar block → rue-exp grammar.blocks entry.
 * Modes: intro/check/type copy; sentence (+ sentenceDone) → use.
 * Scores: bestCheck/bestType pairs become best.check / best.type ratios.
 */
function mapRue2Block(src) {
  if (!src || typeof src !== "object") return null;
  const modesIn = src.modes && typeof src.modes === "object" ? src.modes : {};
  const modes = {};
  if (modeTruthy(modesIn, "intro")) modes.intro = true;
  if (modeTruthy(modesIn, "check") || modeTruthy(modesIn, "quiz") || modeTruthy(modesIn, "match")) {
    modes.check = true;
  }
  if (modeTruthy(modesIn, "type")) modes.type = true;
  if (modeTruthy(modesIn, "sentence") || modeTruthy(modesIn, "use") || src.sentenceDone) {
    modes.use = true;
  }

  const best = {};
  const checkR =
    ratioFromPair(src.bestCheckScore, src.bestCheckTotal) ??
    (typeof src.bestQuiz === "number" && src.bestQuiz >= 0 && src.bestQuiz <= 1
      ? src.bestQuiz
      : null);
  const typeR = ratioFromPair(src.bestTypeScore, src.bestTypeTotal);
  if (checkR != null) best.check = checkR;
  if (typeR != null) best.type = typeR;

  let touchedAt = Date.now();
  if (typeof src.touchedAt === "number" && Number.isFinite(src.touchedAt)) {
    touchedAt = src.touchedAt;
  } else if (typeof src.touchedAt === "string" && src.touchedAt) {
    const t = Date.parse(src.touchedAt);
    if (Number.isFinite(t)) touchedAt = t;
  }

  // Skip empty shells that were never started
  if (!Object.keys(modes).length && !Object.keys(best).length && !src.touchedAt) {
    return null;
  }

  return { modes, best, touchedAt };
}

/**
 * Convert a RUE2 export / progress body into a rue-exp progress object.
 * Returns { progress, stats } or { error }.
 */
export function convertRue2Progress(body) {
  if (!body || typeof body !== "object") {
    return { error: "No RUE2 progress data in file." };
  }
  const blocksIn =
    body.blocks && typeof body.blocks === "object" ? body.blocks : null;
  if (!blocksIn) {
    return {
      error:
        "RUE2 file has no blocks{} (not a grammar progress export).",
    };
  }

  const grammarBlocks = {};
  const mapped = [];
  const skippedEmpty = [];
  for (const [id, src] of Object.entries(blocksIn)) {
    if (!id || typeof id !== "string") continue;
    const mappedBlock = mapRue2Block(src);
    if (!mappedBlock) {
      skippedEmpty.push(id);
      continue;
    }
    grammarBlocks[id] = mappedBlock;
    mapped.push(id);
  }

  const unlocked = Array.isArray(body.unlocked)
    ? body.unlocked.slice()
    : ["A1", "A2", "B1", "B2", "C1"];
  for (const lv of ["A1", "A2", "B1", "B2", "C1"]) {
    if (!unlocked.includes(lv)) unlocked.push(lv);
  }

  // Carry SRS stamps when present (same node-id grain as grammar packs).
  const nodes = {};
  if (body.nodes && typeof body.nodes === "object") {
    for (const [nid, n] of Object.entries(body.nodes)) {
      if (!n || typeof n !== "object") continue;
      nodes[nid] = {
        learnedAt: n.learnedAt || null,
        nextDueAt: n.nextDueAt || null,
        lastReviewAt: n.lastReviewAt || null,
        successfulReps:
          typeof n.successfulReps === "number" ? n.successfulReps : 0,
      };
    }
  }

  const progress = {
    version: 1,
    authorUnlock: false,
    unlocked,
    grammar: { blocks: grammarBlocks },
    // RUE2 was grammar-only — vocab track starts empty on purpose.
    vocab: { blocks: {} },
    units: {},
    nodes,
    importedFrom: {
      app: RUE2_APP,
      at: new Date().toISOString(),
      mappedCount: mapped.length,
      skippedEmptyCount: skippedEmpty.length,
    },
  };

  return {
    progress,
    stats: {
      mapped,
      skippedEmpty,
      nodeCount: Object.keys(nodes).length,
    },
  };
}

function looksLikeRue2(obj, body) {
  if (obj.app === RUE2_APP) return true;
  if (obj.key === RUE2_KEY) return true;
  // Raw dump: top-level blocks without grammar.blocks
  if (
    body &&
    body.blocks &&
    typeof body.blocks === "object" &&
    !(body.grammar && body.grammar.blocks)
  ) {
    return true;
  }
  return false;
}

/**
 * Validate and apply an exported file (or raw progress object).
 * Accepts:
 *   - rue-exp exports (app "rue-exp", key rue-exp-progress[…])
 *   - RUE2 grammar exports (app "rue2-grammar", key rue2-exp-progress)
 *   - raw progress objects of either shape
 * Returns { ok, message, unitish, source }.
 */
export function importProgressPayload(raw) {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, message: "Not valid JSON." };
    }
  }
  if (!obj || typeof obj !== "object") {
    return { ok: false, message: "Empty or invalid file." };
  }

  const body = obj.progress != null ? obj.progress : obj;
  if (!body || typeof body !== "object") {
    return { ok: false, message: "No progress data in file." };
  }

  // --- RUE2 grammar → rue-exp ---
  if (looksLikeRue2(obj, body)) {
    const conv = convertRue2Progress(body);
    if (conv.error) {
      return { ok: false, message: conv.error };
    }
    const { progress: normalized, stats } = conv;
    try {
      localStorage.setItem(key(), JSON.stringify(normalized));
    } catch {
      return {
        ok: false,
        message: "Could not save (private mode / full storage).",
      };
    }
    const gN = stats.mapped.length;
    const skip = stats.skippedEmpty.length;
    const parts = [
      `Imported from RUE2 grammar: ${gN} unit(s)`,
      "vocab track empty (RUE2 had no vocab)",
    ];
    if (skip) parts.push(`${skip} empty record(s) skipped`);
    if (stats.nodeCount) parts.push(`SRS stamps: ${stats.nodeCount}`);
    return {
      ok: true,
      message: parts.join(" · ") + ".",
      unitish: gN,
      source: "rue2",
      mapped: stats.mapped,
      skippedEmpty: stats.skippedEmpty,
    };
  }

  // --- Native rue-exp ---
  // Accept the bare prefix (old exports) or any profile-suffixed key.
  if (
    obj.key &&
    obj.key !== PREFIX &&
    !String(obj.key).startsWith(`${PREFIX}:`)
  ) {
    return {
      ok: false,
      message: `Wrong file (key ${obj.key}). Need ${PREFIX} or a RUE2 grammar export.`,
    };
  }
  if (obj.app && obj.app !== "rue-exp") {
    return {
      ok: false,
      message: `This file is not RUE progress (app ${obj.app}). Need rue-exp or rue2-grammar.`,
    };
  }

  const normalized = {
    version: 1,
    authorUnlock: !!body.authorUnlock,
    unlocked: Array.isArray(body.unlocked) ? body.unlocked.slice() : ["A1"],
    grammar: {
      blocks:
        body.grammar &&
        body.grammar.blocks &&
        typeof body.grammar.blocks === "object"
          ? body.grammar.blocks
          : {},
    },
    vocab: {
      blocks:
        body.vocab && body.vocab.blocks && typeof body.vocab.blocks === "object"
          ? body.vocab.blocks
          : {},
    },
    units: body.units && typeof body.units === "object" ? body.units : {},
    nodes: body.nodes && typeof body.nodes === "object" ? body.nodes : {},
  };
  if (!normalized.unlocked.includes("A1")) {
    normalized.unlocked = ["A1", ...normalized.unlocked];
  }
  const gN = Object.keys(normalized.grammar.blocks).length;
  const vN = Object.keys(normalized.vocab.blocks).length;
  try {
    localStorage.setItem(key(), JSON.stringify(normalized));
  } catch {
    return {
      ok: false,
      message: "Could not save (private mode / full storage).",
    };
  }
  return {
    ok: true,
    message: `Imported (grammar units: ${gN}, vocab banks: ${vN}).`,
    unitish: gN + vN,
    source: "rue-exp",
  };
}

/** Download current progress as a .json file. */
export function downloadProgressFile() {
  const blob = new Blob([JSON.stringify(buildProgressExport(), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `RUE-progress-${day}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
