/**
 * A1 map-tree slice: 6-slot cap, ghosts do not steal, A1 lighting only.
 * Run: node scripts/_test_a1_tree.js
 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const {
  completeMode,
  completeVocabMode,
  hasFruit,
  hasVocabFruit,
  nodeProgressStateGrammar,
  nodeProgressStateVocab,
  ProgressStore,
  importProgressPayload,
  loadProgress,
  resetAllProgress,
} = await import("../js/progress.js");
const { litSlots, renderTreePortrait } = await import("../js/tree-portrait.js");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

function fruitGrammar(id) {
  completeMode(id, "check", { score: 1, total: 1 });
  completeMode(id, "type", { score: 1, total: 1 });
  completeMode(id, "use", { score: 1, total: 1 });
}

function fruitVocab(id) {
  completeVocabMode(id, "match", { nodeId: id });
  completeVocabMode(id, "quiz", { nodeId: id, score: 1, total: 1 });
  completeVocabMode(id, "type", { nodeId: id, score: 1, total: 1 });
  completeVocabMode(id, "sentence", { nodeId: id, score: 1, total: 1 });
}

assert(litSlots([], 3) === 0, "no live units → no lights");
assert(litSlots([{ id: "a" }], 0) === 0, "no work → no lights");
assert(litSlots(Array.from({ length: 5 }), 5) === 5, "5 of 5 stays 5");
assert(
  litSlots(Array.from({ length: 20 }), 3) === 3,
  "3 fruited of 20 live → 3 lights (empty do not steal)",
);
assert(
  litSlots(Array.from({ length: 20 }), 10) === 6,
  "10 fruited of 20 live → cap 6",
);

assert(ProgressStore.key === "rue-exp-progress", "store key never renamed");
store.clear();
ProgressStore.write(JSON.stringify({ version: 1, grammar: { blocks: {} } }));
assert(ProgressStore.read(), "store write/read");
resetAllProgress();
assert(ProgressStore.read() == null, "store clear");
assert(Object.keys(loadProgress().grammar.blocks).length === 0, "load after clear is empty");

store.clear();
const imported = importProgressPayload({
  app: "rue-exp",
  key: "rue-exp-progress",
  progress: {
    grammar: { blocks: { a1_g: { modes: { check: true } } } },
    vocab: { blocks: {} },
  },
});
assert(imported.ok === true, "import goes through the store");
assert(loadProgress().grammar.blocks.a1_g, "imported grammar block present");

store.clear();
const homeNodes = [];
for (let i = 0; i < 10; i++) {
  homeNodes.push({
    id: "home_" + i,
    domain: "vocab",
    status: "live",
    content: "v/h" + i + ".json",
    levels: ["A1"],
    tree_part: "home_family",
    codex_unit: "V_HOM-A1-0" + i,
  });
}
const nodes = [
  {
    id: "a1_verbs",
    domain: "grammar",
    status: "live",
    content: "g/v.json",
    levels: ["A1"],
    root: "verb_phrase",
    tree_part: "verb_phrase",
  },
  {
    id: "a2_verbs",
    domain: "grammar",
    status: "live",
    content: "g/v2.json",
    levels: ["A2"],
    root: "verb_phrase",
    tree_part: "verb_phrase",
  },
  ...homeNodes,
];

fruitGrammar("a1_verbs");
fruitGrammar("a2_verbs");
fruitVocab("home_0");
fruitVocab("home_1");
fruitVocab("home_2");

function isFruit(n) {
  return n.domain === "vocab" ? hasVocabFruit(n) : hasFruit(n.id);
}
function progressState(n) {
  return n.domain === "vocab"
    ? nodeProgressStateVocab(n)
    : nodeProgressStateGrammar(n);
}

const host = { innerHTML: "", querySelectorAll() { return []; } };
const painted = renderTreePortrait(host, {
  level: "A1",
  nodes,
  isFruit: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? isFruit(n) : false;
  },
  progressState: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? progressState(n) : "planned";
  },
});

assert(painted.level === "A1", "map slice paints A1 age");
assert(/Sapling/.test(host.innerHTML), "A1 skeleton is a sapling");
const verbs = painted.laterals.find((L) => L.tree_part === "verb_phrase");
assert(verbs.fruited.length === 1, "A2 fruit does not count on the A1 tree");
assert(verbs.knotsFruit === 1, "one A1 Verbs fruit → one fruit knot");
const home = painted.houses.find((H) => H.tree_part === "home_family");
assert(home.fruited.length === 3, "three A1 home units fruited");
assert(
  home.fruit === 3,
  "home 3/10 fruit → 3 lights, not 2 (ghosts do not steal)",
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall ok");
