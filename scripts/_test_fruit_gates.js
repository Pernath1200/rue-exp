/**
 * RUE first-learn fruit gates (must match progress.js).
 * Partial scores must NEVER fruit — that was the early-tick bug.
 * Run: node scripts/_test_fruit_gates.js
 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const {
  hasFruit,
  blockHasFruit,
  canEnterGrammarUse,
  canEnterVocabSentence,
  completeMode,
  completeVocabMode,
  stageIsClear,
  loadProgress,
} = await import("../js/progress.js");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

assert(stageIsClear(1, false) === true, "ratio 1 clear");
assert(stageIsClear(0.75, false) === false, "0.75 not clear for first fruit");
assert(stageIsClear(0.5, true) === true, "sticky cleanPass clear");

// --- Grammar: modes only without clear scores → no fruit ---
store.clear();
completeMode("g1", "intro");
completeMode("g1", "check", { score: 9, total: 12 });
completeMode("g1", "type", { score: 10, total: 12 });
completeMode("g1", "use", { score: 8, total: 12 });
assert(hasFruit("g1") === false, "grammar partial scores → not fruit");
assert(canEnterGrammarUse("g1") === false, "helper: Use not clear with partial");

// Clear check+type via perfect retry stamps
completeMode("g1", "check", { score: 1, total: 1 });
completeMode("g1", "type", { score: 1, total: 1 });
assert(canEnterGrammarUse("g1") === true, "helper: clear Check+Type");
assert(hasFruit("g1") === false, "use still 8/12 → not fruit (early-tick guard)");
const rUse = completeMode("g1", "use", { score: 1, total: 1 });
assert(hasFruit("g1") === true, "grammar all three clear → fruit");
assert(rUse.justFruited === true, "justFruited true on first clear fruit");

// Second time — no justFruited
const rAgain = completeMode("g1", "use", { score: 1, total: 1 });
assert(rAgain.justFruited === false, "already fruit → not justFruited");

// --- Grammar: cannot fruit without use ---
store.clear();
completeMode("g2", "check", { score: 12, total: 12 });
completeMode("g2", "type", { score: 12, total: 12 });
assert(hasFruit("g2") === false, "no use → not fruit");
completeMode("g2", "use", { score: 5, total: 12 });
assert(hasFruit("g2") === false, "use 5/12 does NOT fruit");
completeMode("g2", "use", { score: 1, total: 1 });
assert(hasFruit("g2") === true, "use retry-cleared → fruit");

// --- Grammar: walking modes without scores → no fruit ---
store.clear();
completeMode("g3", "check");
completeMode("g3", "type");
completeMode("g3", "use");
assert(hasFruit("g3") === false, "modes-only without scores → not fruit");

// --- Vocab ---
store.clear();
completeVocabMode("v1", "match");
completeVocabMode("v1", "quiz", { score: 9, total: 12 });
completeVocabMode("v1", "type", { score: 12, total: 12 });
const r4 = completeVocabMode("v1", "sentence", { score: 10, total: 12 });
assert(r4.justFruited === false, "vocab partial quiz → not justFruited");
assert(
  blockHasFruit({
    modes: { match: true, quiz: true, type: true, sentence: true },
    bestQuiz: 1,
    bestType: 1,
    quizCleanPass: true,
    typeCleanPass: true,
    bestSentence: 10 / 12,
    sentenceCleanPass: false,
  }) === false,
  "vocab sentence 10/12 blocks fruit",
);

completeVocabMode("v1", "quiz", { score: 1, total: 1 });
completeVocabMode("v1", "sentence", { score: 12, total: 12 });
const b = loadProgress().vocab.blocks.v1;
assert(blockHasFruit(b) === true, "vocab clear quiz+type+sentence → fruit");

// Fat leaf: Match fruit is one board of 12, not the leftover 23rd word.
store.clear();
const keys23 = Array.from({ length: 23 }, (_, i) => `w${i}‖c${i}`);
completeVocabMode("v_clothes", "match", {
  nodeId: "leaf_clothes_a1",
  coveredKeys: keys23.slice(0, 12),
  need: 23,
  coverageDone: false,
});
completeVocabMode("v_clothes", "quiz", {
  nodeId: "leaf_clothes_a1",
  score: 1,
  total: 1,
  coveredKeys: keys23,
  need: 23,
  coverageDone: true,
});
completeVocabMode("v_clothes", "type", {
  nodeId: "leaf_clothes_a1",
  score: 1,
  total: 1,
  coveredKeys: keys23,
  need: 23,
  coverageDone: true,
});
completeVocabMode("v_clothes", "sentence", {
  nodeId: "leaf_clothes_a1",
  score: 12,
  total: 12,
});
assert(
  blockHasFruit(loadProgress().vocab.blocks.v_clothes) === true,
  "clothes Match 12/23 still fruits once Quiz/Type/Use are clear",
);

store.clear();
completeVocabMode("v_short", "match", {
  coveredKeys: keys23.slice(0, 11),
  need: 23,
  coverageDone: false,
});
completeVocabMode("v_short", "quiz", {
  score: 1,
  total: 1,
  coveredKeys: keys23,
  need: 23,
  coverageDone: true,
});
completeVocabMode("v_short", "type", {
  score: 1,
  total: 1,
  coveredKeys: keys23,
  need: 23,
  coverageDone: true,
});
completeVocabMode("v_short", "sentence", { score: 12, total: 12 });
assert(
  blockHasFruit(loadProgress().vocab.blocks.v_short) === false,
  "Match 11/23 does not fruit",
);

// Countries: Type must walk all 30 — the 25–35 short-tail exemption was
// removed 2026-08-31 (James), so 24/30 no longer fruits, 30/30 does.
store.clear();
const keys30 = Array.from({ length: 30 }, (_, i) => `c${i}‖k${i}`);
const keys14 = keys30.slice(0, 14);
completeVocabMode("v_countries", "match", {
  coverageDone: true,
  coveredKeys: [],
  need: 12,
});
completeVocabMode("v_countries", "quiz", {
  score: 12,
  total: 12,
  coveredKeys: keys14,
  need: 14,
  coverageDone: true,
});
completeVocabMode("v_countries", "type", {
  score: 12,
  total: 12,
  coveredKeys: keys30.slice(0, 24),
  need: 30,
  coverageDone: true,
});
completeVocabMode("v_countries", "sentence", { score: 12, total: 12 });
assert(
  blockHasFruit(loadProgress().vocab.blocks.v_countries) === false,
  "Countries Type 24/30 does not fruit",
);
completeVocabMode("v_countries", "type", {
  score: 6,
  total: 6,
  coveredKeys: keys30,
  need: 30,
  coverageDone: true,
});
assert(
  blockHasFruit(loadProgress().vocab.blocks.v_countries) === true,
  "Countries Type 30/30 + Match skip fruits after Use",
);

store.clear();
completeVocabMode("v_36", "match");
completeVocabMode("v_36", "quiz", {
  score: 1,
  total: 1,
  coveredKeys: keys30.slice(0, 24),
  need: 36,
  coverageDone: false,
});
completeVocabMode("v_36", "type", {
  score: 1,
  total: 1,
  coveredKeys: keys30.slice(0, 24),
  need: 36,
  coverageDone: false,
});
completeVocabMode("v_36", "sentence", { score: 12, total: 12 });
assert(
  blockHasFruit(loadProgress().vocab.blocks.v_36) === false,
  "24/36 Quiz+Type does not fruit",
);

// Fresh vocab quiz open
store.clear();
completeVocabMode("v2", "match");
completeVocabMode("v2", "quiz", { score: 8, total: 12 });
completeVocabMode("v2", "type", { score: 12, total: 12 });
assert(canEnterVocabSentence("v2") === false, "helper: sentence needs quiz clear");

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nALL PASS (rue-exp fruit gates)");
process.exit(0);