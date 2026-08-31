/**
 * rue-exp dual progress — never writes RUE2/RUE3 keys.
 *
 * First-learn fruit (tick payoff) — RUPL/RUE2 gates (2026-08-10):
 *   Grammar: Check + Type + Use each fully clear (ratio ≥ 1 or sticky cleanPass).
 *   Vocab: Match done + Quiz + Type + Sentence fully clear (same).
 *   Fat vocab leaves (James 2026-08-30): Quiz and Type each need
 *   vocabCoverNeed(n) unique words (min(n, 36), 12-word rounds, no repeats)
 *   before cleanPass. Match and Use stay one round of 12 — extra Match
 *   boards walk the deck, they do not hold the tree. Packs of ≤12
 *   unchanged. Soft PASS_RATIO / FRUIT_SOFT = reviews only.
 * Unlimited retries: a later perfect retry stamps cleanPass via score 1/1.
 */

const KEY = "rue-exp-progress";

/**
 * Thin storage adapter. Today: this browser (localStorage).
 * Later: swap read/write for an account without rewriting fruit gates,
 * the tree, or Download / Import. Never rename KEY. Never write RUE2/RUE3 keys.
 */
export const ProgressStore = {
  key: KEY,
  read() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  write(raw) {
    try {
      localStorage.setItem(KEY, raw);
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* private mode */
    }
  },
};

/* One student per browser — each learner uses their own laptop, so a picker
   was solving a problem that doesn't exist (removed 2026-08-10, same day it
   was added). This undoes the brief profile-key experiment: anything written
   under "rue-exp-progress:me" is copied back to the plain key, then the
   scoped keys are cleared so a stale copy can't overwrite it on a later load.
   Runs once and is then a no-op. */
(function unscopeProgressKeys() {
  try {
    const scoped = localStorage.getItem(`${KEY}:me`);
    if (scoped != null) localStorage.setItem(KEY, scoped);
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${KEY}:`)) localStorage.removeItem(k);
    }
    localStorage.removeItem("rue-exp-profile");
    localStorage.removeItem("rue-exp-profiles");
  } catch {
    /* private mode — nothing to undo */
  }
})();

export const PASS_RATIO = 0.8;
export const FRUIT_SOFT = 0.75;
/** First-learn pass size. Match fruit is one pass; Quiz/Type walk up to 36. */
export const VOCAB_PASS = 12;
/** Successful spaced reviews needed for “Mastered” (RUE2 sibling). */
export const MASTERY_REPS = 4;

/**
 * First-learn stage clear: full marks (ratio ≥ 1) or sticky cleanPass
 * from retry-until-clear. Soft 0.8 does NOT count.
 */
export function stageIsClear(ratio, cleanPass) {
  if (cleanPass) return true;
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) return false;
  return ratio >= 1;
}

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

/**
 * One-time: restore fruit after fruit gates tightened (2026-08-10).
 * Progress was NOT wiped — meters count fruit; modes-only "done" stopped
 * counting under strict clear rules, so 4/4 units looked incomplete and
 * Learned dropped to 0%.
 *
 * Runs once per progress blob (`fruitClearMigrate: 1`). Grandfathers any
 * unit that already walked the full ladder (old contract) as clear.
 * Future completeMode calls still require real clear scores for new fruit.
 */
function migrateLegacyFruitClear(p) {
  if (!p || p.fruitClearMigrate === 1) return false;

  const stamp = (b, bestPath, passKey) => {
    b[passKey] = true;
    if (bestPath === "check" || bestPath === "type" || bestPath === "use") {
      b.best = b.best || {};
      if (b.best[bestPath] == null || b.best[bestPath] < 1) b.best[bestPath] = 1;
    } else if (b[bestPath] == null || b[bestPath] < 1) {
      b[bestPath] = 1;
    }
  };

  for (const b of Object.values(p.grammar.blocks || {})) {
    if (!b || !b.modes) continue;
    if (!(b.modes.check && b.modes.type && b.modes.use)) continue;
    stamp(b, "check", "checkCleanPass");
    stamp(b, "type", "typeCleanPass");
    stamp(b, "use", "useCleanPass");
  }

  for (const b of Object.values(p.vocab.blocks || {})) {
    if (!b || !b.modes) continue;
    if (!(b.modes.match && b.modes.quiz && b.modes.type && b.modes.sentence)) {
      continue;
    }
    stamp(b, "bestQuiz", "quizCleanPass");
    stamp(b, "bestType", "typeCleanPass");
    stamp(b, "bestSentence", "sentenceCleanPass");
    b.sentenceDone = true;
  }

  p.fruitClearMigrate = 1;
  return true;
}

export function loadProgress() {
  try {
    const raw = ProgressStore.read();
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
    if (migrateLegacyFruitClear(d)) {
      ProgressStore.write(JSON.stringify(d));
    }
    return d;
  } catch {
    return empty();
  }
}

function save(p) {
  ProgressStore.write(JSON.stringify(p));
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

function ensureGrammarBlock(p, blockId) {
  if (!p.grammar.blocks[blockId]) {
    p.grammar.blocks[blockId] = {
      modes: {},
      best: {},
      checkCleanPass: false,
      typeCleanPass: false,
      useCleanPass: false,
      touchedAt: Date.now(),
    };
  }
  const b = p.grammar.blocks[blockId];
  if (!b.modes) b.modes = {};
  if (!b.best) b.best = {};
  if (b.checkCleanPass === undefined) b.checkCleanPass = false;
  if (b.typeCleanPass === undefined) b.typeCleanPass = false;
  if (b.useCleanPass === undefined) b.useCleanPass = false;
  return b;
}

export function touchBlock(blockId) {
  const p = loadProgress();
  const b = ensureGrammarBlock(p, blockId);
  b.touchedAt = Date.now();
  save(p);
}

/**
 * @returns {{ wasFruit: boolean, nowFruit: boolean, justFruited: boolean, review?: object }}
 */
export function completeMode(blockId, mode, result = null) {
  const wasFruit = hasFruit(blockId);
  const p = loadProgress();
  const b = ensureGrammarBlock(p, blockId);
  b.modes[mode] = true;
  b.touchedAt = Date.now();
  let ratio = null;
  if (result && typeof result.score === "number" && result.total > 0) {
    ratio = result.score / result.total;
    const prev = b.best[mode];
    if (prev == null || ratio > prev) b.best[mode] = ratio;
    // Full marks or retry-until-clear stamp (1/1) → sticky cleanPass
    if (ratio >= 1) {
      if (mode === "check") b.checkCleanPass = true;
      if (mode === "type") b.typeCleanPass = true;
      if (mode === "use") b.useCleanPass = true;
    }
  }
  save(p);
  const nowFruit = hasFruit(blockId);
  const review = reviewTick(blockId, ratio, nowFruit);
  return {
    wasFruit,
    nowFruit,
    justFruited: !wasFruit && nowFruit,
    review,
  };
}

function gBlock(id) {
  return loadProgress().grammar.blocks[id] || null;
}

function modeDone(b, mode) {
  return !!(b && b.modes && b.modes[mode]);
}

export function grammarCheckClear(b) {
  if (!b) return false;
  return stageIsClear(b.best && b.best.check, b.checkCleanPass);
}

export function grammarTypeClear(b) {
  if (!b) return false;
  return stageIsClear(b.best && b.best.type, b.typeCleanPass);
}

export function grammarUseClear(b) {
  if (!b) return false;
  return stageIsClear(b.best && b.best.use, b.useCleanPass);
}

/**
 * Helper for tests / future soft warnings. Ladder jumps stay free in the UI
 * (James 2026-08-10); fruit still requires all three clear.
 */
export function canEnterGrammarUse(blockId) {
  const b = gBlock(blockId);
  return grammarCheckClear(b) && grammarTypeClear(b);
}

/**
 * First-learn fruit: Check + Type + Use each fully clear.
 * Modes-only is not enough. Soft % does not grant fruit.
 * Intro optional (ladder still records it when played).
 */
export function hasFruit(blockId) {
  const b = gBlock(blockId);
  if (!b) return false;
  /* a1_finale: Whole A1 Use round cleaned. Does not fake Check/Type. */
  if (b.finaleCleanPass) return true;
  if (!modeDone(b, "check") || !modeDone(b, "type") || !modeDone(b, "use")) {
    return false;
  }
  return grammarCheckClear(b) && grammarTypeClear(b) && grammarUseClear(b);
}

/**
 * Fruit the A1 finale node only. Never call this on a teaching unit.
 * Filtered runs must not reach here.
 */
export function completeFinale(blockId) {
  const wasFruit = hasFruit(blockId);
  const p = loadProgress();
  const b = ensureGrammarBlock(p, blockId);
  b.modes.use = true;
  b.useCleanPass = true;
  const prev = b.best.use;
  if (prev == null || prev < 1) b.best.use = 1;
  b.finaleCleanPass = true;
  b.touchedAt = Date.now();
  save(p);
  const nowFruit = hasFruit(blockId);
  const review = reviewTick(blockId, 1, nowFruit);
  return {
    wasFruit,
    nowFruit,
    justFruited: !wasFruit && nowFruit,
    review,
  };
}

export function grammarBest(blockId) {
  const b = gBlock(blockId);
  return {
    check: b && b.best && b.best.check != null ? b.best.check : null,
    type: b && b.best && b.best.type != null ? b.best.type : null,
    use: b && b.best && b.best.use != null ? b.best.use : null,
  };
}

export function progressLabelGrammar(node) {
  if (node.status === "planned") return "planned";
  if (node.fruit === false) return "check";
  if (hasFruit(node.id)) return "done";
  const b = gBlock(node.id);
  /* Finale is one Use check, not a Check/Type/Use ladder. */
  if (node.practice === "use_sprint") {
    if (b && b.modes && Object.keys(b.modes).length) return "started";
    return "live";
  }
  if (!b || !b.modes) return "live";
  const done = ["intro", "check", "type", "use"].filter((m) => b.modes[m]);
  if (!done.length) return "live";
  return `${done.length}/4`;
}

export function nodeProgressStateGrammar(node) {
  if (node.status !== "live") return "planned";
  if (node.fruit === false) return "live";
  if (hasFruit(node.id)) return "fruit";
  const b = gBlock(node.id);
  if (b && b.modes && Object.keys(b.modes).length) return "started";
  return "live";
}

// ---- Vocab API (compatible with RUE3 opts callbacks) ----

function ensureVocabBlock(p, blockId, nodeId) {
  if (!p.vocab.blocks[blockId]) {
    p.vocab.blocks[blockId] = {
      nodeId: nodeId || null,
      modes: {},
      bestQuiz: null,
      bestType: null,
      bestSentence: null,
      quizCleanPass: false,
      typeCleanPass: false,
      sentenceCleanPass: false,
      sentenceDone: false,
      quizKeys: [],
      typeKeys: [],
      matchKeys: [],
      quizNeed: null,
      typeNeed: null,
      matchNeed: null,
      matchCleanPass: false,
      touchedAt: Date.now(),
    };
  }
  const b = p.vocab.blocks[blockId];
  if (!b.modes) b.modes = {};
  if (b.quizCleanPass === undefined) b.quizCleanPass = false;
  if (b.typeCleanPass === undefined) b.typeCleanPass = false;
  if (b.sentenceCleanPass === undefined) b.sentenceCleanPass = false;
  if (b.matchCleanPass === undefined) b.matchCleanPass = false;
  if (!Array.isArray(b.quizKeys)) b.quizKeys = [];
  if (!Array.isArray(b.typeKeys)) b.typeKeys = [];
  if (!Array.isArray(b.matchKeys)) b.matchKeys = [];
  if (nodeId) b.nodeId = nodeId;
  return b;
}

/** Unique words Quiz/Type must clear before fruit. Trunks of 12 stay 12. */
export function vocabCoverNeed(n) {
  const N = Number(n) || 0;
  if (N <= VOCAB_PASS) return Math.max(0, N);
  return Math.min(N, 36);
}

/**
 * Quiz/Type fruit: unique keys up to need, except a leftover shorter than a
 * round after two full 12s (25–35 words). 24/30 then Use still gets the tree
 * (James, Countries 2026-08-31). 23-word packs stay whole-pack. 36 still 36.
 */
export function vocabCoveredEnough(have, need) {
  const H = Array.isArray(have) ? have.length : Number(have) || 0;
  const N = Number(need);
  if (need == null || !Number.isFinite(N) || N <= 0) return true;
  if (H >= N) return true;
  if (
    N > VOCAB_PASS * 2 &&
    H >= VOCAB_PASS * 2 &&
    N - VOCAB_PASS * 2 < VOCAB_PASS
  ) {
    return true;
  }
  return false;
}

export function vocabCoverage(blockId) {
  const b = (loadProgress().vocab.blocks || {})[blockId] || {};
  return {
    quizKeys: Array.isArray(b.quizKeys) ? b.quizKeys : [],
    typeKeys: Array.isArray(b.typeKeys) ? b.typeKeys : [],
    matchKeys: Array.isArray(b.matchKeys) ? b.matchKeys : [],
    quizNeed: b.quizNeed,
    typeNeed: b.typeNeed,
    matchNeed: b.matchNeed,
    quizCleared: vocabQuizClear(b),
    typeCleared: vocabTypeClear(b),
    matchCleared: vocabMatchClear(b),
  };
}

export function touchVocabBlock(blockId, nodeId) {
  const p = loadProgress();
  const b = ensureVocabBlock(p, blockId, nodeId);
  b.touchedAt = Date.now();
  save(p);
}

/**
 * Node ids with activity inside the window (default 24h). The map portrait
 * uses this so house labels name recent growth, then fade — an old completed
 * unit must not keep a permanent nameplate (James, 2026-08-25).
 */
export function recentNodeIds(withinMs = 24 * 60 * 60 * 1000) {
  const p = loadProgress();
  const cutoff = Date.now() - withinMs;
  const ids = new Set();
  for (const [id, b] of Object.entries((p.grammar && p.grammar.blocks) || {})) {
    if ((b.touchedAt || 0) >= cutoff) ids.add(id);
  }
  for (const [id, b] of Object.entries((p.vocab && p.vocab.blocks) || {})) {
    if ((b.touchedAt || 0) >= cutoff) ids.add(b.nodeId || id);
  }
  return ids;
}

/**
 * @returns {{ wasFruit: boolean, nowFruit: boolean, justFruited: boolean, review?: object }}
 */
export function completeVocabMode(blockId, mode, meta = {}) {
  const p = loadProgress();
  const b = ensureVocabBlock(p, blockId, meta.nodeId);
  const wasFruit = blockHasFruit(b);
  b.modes[mode] = true;
  b.touchedAt = Date.now();
  let ratio = null;
  if (meta.score != null && meta.total > 0) {
    ratio = meta.score / meta.total;
  }
  if (mode === "match") {
    if (Array.isArray(meta.coveredKeys)) b.matchKeys = meta.coveredKeys;
    if (meta.need != null) b.matchNeed = meta.need;
    if (meta.coverageDone === true) b.matchCleanPass = true;
    if (meta.coverageDone === false) b.matchCleanPass = false;
  }
  if (mode === "quiz") {
    if (ratio != null) {
      if (b.bestQuiz == null || ratio > b.bestQuiz) b.bestQuiz = ratio;
      if (ratio >= 1 && meta.coverageDone !== false) b.quizCleanPass = true;
    }
    if (Array.isArray(meta.coveredKeys)) b.quizKeys = meta.coveredKeys;
    if (meta.need != null) b.quizNeed = meta.need;
    if (meta.coverageDone === false) b.quizCleanPass = false;
  }
  if (mode === "type") {
    if (ratio != null) {
      if (b.bestType == null || ratio > b.bestType) b.bestType = ratio;
      if (ratio >= 1 && meta.coverageDone !== false) b.typeCleanPass = true;
    }
    if (Array.isArray(meta.coveredKeys)) b.typeKeys = meta.coveredKeys;
    if (meta.need != null) b.typeNeed = meta.need;
    if (meta.coverageDone === false) b.typeCleanPass = false;
  }
  if (mode === "sentence") {
    b.sentenceDone = true;
    if (ratio != null) {
      if (b.bestSentence == null || ratio > b.bestSentence) b.bestSentence = ratio;
      if (ratio >= 1) b.sentenceCleanPass = true;
    }
  }
  save(p);
  const nowFruit = blockHasFruit(b);
  const review = reviewTick(b.nodeId || blockId, ratio, nowFruit);
  return {
    wasFruit,
    nowFruit,
    justFruited: !wasFruit && nowFruit,
    review,
  };
}

export function vocabMatchClear(b) {
  if (!b) return false;
  if (!b.modes?.match) return false;
  // Smoke skip stamps matchCleanPass with no keys. One board of 12 is enough.
  if (b.matchCleanPass) return true;
  if (b.matchNeed == null) return true;
  const fruitNeed = Math.min(Number(b.matchNeed) || 0, VOCAB_PASS);
  if (fruitNeed <= 0) return true;
  return (b.matchKeys || []).length >= fruitNeed;
}

export function vocabQuizClear(b) {
  if (!b) return false;
  if (b.quizNeed != null && !vocabCoveredEnough(b.quizKeys, b.quizNeed)) {
    return false;
  }
  return stageIsClear(b.bestQuiz, b.quizCleanPass);
}

export function vocabTypeClear(b) {
  if (!b) return false;
  if (b.typeNeed != null && !vocabCoveredEnough(b.typeKeys, b.typeNeed)) {
    return false;
  }
  return stageIsClear(b.bestType, b.typeCleanPass);
}

export function vocabSentenceClear(b) {
  if (!b) return false;
  return stageIsClear(b.bestSentence, b.sentenceCleanPass);
}

/** Helper only — UI keeps free ladder jumps; fruit still needs clear Quiz+Type. */
export function canEnterVocabSentence(blockId) {
  const b = loadProgress().vocab.blocks[blockId] || null;
  if (!b) return false;
  return vocabQuizClear(b) && vocabTypeClear(b);
}

/**
 * First-learn fruit: Match walked + Quiz/Type/Sentence fully clear.
 * Partial scores do not fruit (James early-tick regression).
 */
export function blockHasFruit(b) {
  if (!b || !b.modes) return false;
  const m = b.modes;
  if (!(m.match && m.quiz && m.type && m.sentence)) return false;
  return (
    vocabMatchClear(b) &&
    vocabQuizClear(b) &&
    vocabTypeClear(b) &&
    vocabSentenceClear(b)
  );
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
  if (node.fruit === false) return "check";
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
  if (node.fruit === false) return "live";
  if (hasVocabFruit(node)) return "fruit";
  const p = loadProgress();
  for (const x of Object.values(p.vocab.blocks || {})) {
    if (x.nodeId === node.id && x.modes && Object.keys(x.modes).length)
      return "started";
  }
  return "live";
}

/**
 * Map-tree paint: started < fruit (learned) < remembered (≥1 review) < mastered (≥4).
 * Path labels still use nodeProgressState*; this is portrait-only.
 */
export function nodeTreeStrength(node) {
  if (!node || node.status !== "live") return "none";
  const reps = getNodeReview(node.id).successfulReps || 0;
  if (reps >= MASTERY_REPS) return "mastered";
  if (reps >= 1) return "remembered";
  if (node.domain === "vocab" ? hasVocabFruit(node) : hasFruit(node.id)) {
    return "fruit";
  }
  const st =
    node.domain === "vocab"
      ? nodeProgressStateVocab(node)
      : nodeProgressStateGrammar(node);
  return st === "started" ? "started" : "none";
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
// A review succeeds when, while due, a stage is CLEARED — every item right,
// however many retries that took. No percentage threshold: reps++ and the
// interval widens. An uncleared pass changes nothing; the unit stays due.
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

function reviewTick(nodeId, ratio, fruited) {
  if (!nodeId) return null;
  const p = loadProgress();
  const n = (p.nodes[nodeId] = p.nodes[nodeId] || {});
  const now = Date.now();
  if (fruited && !n.learnedAt) {
    n.learnedAt = new Date(now).toISOString();
    n.nextDueAt = new Date(now + REVIEW_INTERVALS_DAYS[0] * DAY_MS).toISOString();
    save(p);
    return null;
  }
  if (!n.learnedAt || !n.nextDueAt || ratio == null) return null;
  if (now < Date.parse(n.nextDueAt)) return null;
  // No percentage gate (James, 2026-08-11). Retries are unlimited, so what
  // counts is finishing the stage with every item right — a 0% first pass
  // that is then cleared is a pass. Anything short of clear does nothing at
  // all: the unit simply stays due until it IS cleared. Same rule as
  // first-learning (stageIsClear), which reviews were not using.
  if (!stageIsClear(ratio, false)) return null;
  n.lastReviewAt = new Date(now).toISOString();
  n.successfulReps = (n.successfulReps || 0) + 1;
  const idx = Math.min(n.successfulReps, REVIEW_INTERVALS_DAYS.length - 1);
  const days = REVIEW_INTERVALS_DAYS[idx];
  n.nextDueAt = new Date(now + days * DAY_MS).toISOString();
  save(p);
  return {
    counted: true,
    successfulReps: n.successfulReps,
    days,
    nextDueAt: n.nextDueAt,
  };
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
 * Chained sitting halves (`sitting_of`) are not circle slots.
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
      n.levels.includes(level) &&
      !n.sitting_of,
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
  ProgressStore.clear();
}

/** Storage key (stable — never rename; renaming wipes browsers). */
export function progressStorageKey() {
  return KEY;
}

/**
 * Portable progress file for Download / Import.
 * Move between localhost and GitHub Pages, or backup before updates.
 */
export function buildProgressExport() {
  return {
    app: "rue-exp",
    key: KEY,
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
    if (!ProgressStore.write(JSON.stringify(normalized))) {
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
    obj.key !== KEY
  ) {
    return {
      ok: false,
      message: `Wrong file (key ${obj.key}). Need ${KEY} or a RUE2 grammar export.`,
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
  if (!ProgressStore.write(JSON.stringify(normalized))) {
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
