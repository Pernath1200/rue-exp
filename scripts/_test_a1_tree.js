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
  lastCompletedNodeId,
  hasFruit,
  hasVocabFruit,
  nodeProgressStateGrammar,
  nodeProgressStateVocab,
  nodeTreeStrength,
  levelUnitStats,
  ProgressStore,
  importProgressPayload,
  loadProgress,
  resetAllProgress,
} = await import("../js/progress.js");
const { litSlots, renderTreePortrait, woodMark, cambiumGirthBonus } = await import("../js/tree-portrait.js");

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

assert(woodMark({ remembered: [], mastered: [] }) === "", "no reviews → no wood mark");
assert(woodMark({ remembered: [{ id: "a" }], mastered: [] }) === "wood-remembered", "≥1 review darkens wood");
assert(woodMark({ remembered: [{ id: "a" }], mastered: [{ id: "b" }] }) === "wood-mastered", "mastered outranks remembered");
assert(cambiumGirthBonus(0) === 0, "no trunk life → no girth bonus");
assert(cambiumGirthBonus(2) > 0 && cambiumGirthBonus(2) < 0.14, "girth bonus saturates under one age step");

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
  {
    id: "trunk_glue_a1",
    domain: "vocab",
    status: "live",
    content: "v/t.json",
    levels: ["A1"],
    tree_part: "trunk",
    codex_unit: "V_TRUNK-A1-01",
  },
  ...homeNodes,
];

fruitGrammar("a1_verbs");
fruitGrammar("a2_verbs");
fruitVocab("home_0");
fruitVocab("home_1");
fruitVocab("home_2");
fruitVocab("trunk_glue_a1");

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

function setReps(id, n) {
  const p = loadProgress();
  p.nodes = p.nodes || {};
  p.nodes[id] = Object.assign({}, p.nodes[id] || {}, { successfulReps: n });
  ProgressStore.write(JSON.stringify(p));
}
setReps("home_0", 4);
setReps("home_1", 1);
setReps("a1_verbs", 4);

const strengthPaint = renderTreePortrait(host, {
  level: "A1",
  nodes,
  isFruit: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? isFruit(n) : false;
  },
  progressState: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? nodeTreeStrength(n) : "none";
  },
});
const home2 = strengthPaint.houses.find((H) => H.tree_part === "home_family");
assert(home2.fruit === 3, "learned count unchanged after reviews");
assert(home2.fruitRemembered === 2, "remembered+mastered fill first (strongest first)");
assert(home2.fruitMastered === 1, "one mastered home unit → one strongest fruit");
assert(/fruit[^"]*mastered/.test(host.innerHTML), "SVG paints mastered fruit");
assert(/fruit[^"]*remembered/.test(host.innerHTML), "SVG paints remembered fruit");
assert(
  /class="tp-house fruit wood-mastered" data-part="home_family"/.test(host.innerHTML),
  "home house wood darkens at mastered",
);
const verbs2 = strengthPaint.laterals.find((L) => L.tree_part === "verb_phrase");
assert(verbs2.knotsMastered === 1, "mastered Verbs knot");
assert(/knot[^"]*mastered/.test(host.innerHTML), "SVG paints mastered knot");
assert(
  /class="tp-lateral fruit wood-mastered" data-part="verb_phrase"/.test(host.innerHTML),
  "Verbs root wood darkens at mastered",
);
setReps("trunk_glue_a1", 1);
const gluePaint = renderTreePortrait(host, {
  level: "A1",
  nodes,
  isFruit: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? isFruit(n) : false;
  },
  progressState: (id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? nodeTreeStrength(n) : "none";
  },
});
assert(gluePaint.cambium.glue > 0, "trunk-glue reviews feed girth sum");
assert(gluePaint.cambium.bonus > 0, "trunk life thickens the stem a little");
assert(/id="trunk" class="lb wood-remembered"/.test(host.innerHTML), "trunk wood darkens from glue reviews, not from houses");

const payoffPaint = renderTreePortrait(host, {
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
const homePay = payoffPaint.houses.find((H) => H.tree_part === "home_family");
assert(homePay.fruitMastered === 0, "payoff path does not paint mastery");
assert(homePay.fruit === 3, "payoff still shows learned fruit");

assert(
  levelUnitStats("A1", [
    {
      id: "a1_be_have",
      status: "live",
      content: "g.json",
      levels: ["A1"],
      domain: "grammar",
      sitting_vocab: "trunk_frames_a1",
    },
    {
      id: "trunk_frames_a1",
      status: "live",
      content: "v.json",
      levels: ["A1"],
      domain: "vocab",
      sitting_of: "a1_be_have",
    },
  ]).total === 1,
  "sitting half is not an A1 circle slot",
);

assert(
  lastCompletedNodeId(nodes) === "trunk_glue_a1",
  "last completed stamp follows the last first-fruit",
);
fruitVocab("home_3");
assert(
  lastCompletedNodeId(nodes) === "home_3",
  "a newer fruit replaces the last-completed stamp",
);
assert(
  lastCompletedNodeId(nodes, "A1") === "home_3",
  "A1 view keeps an A1 last-completed unit",
);
{
  const p = loadProgress();
  p.lastCompletedId = "a2_verbs";
  ProgressStore.write(JSON.stringify(p));
  assert(
    lastCompletedNodeId(nodes, "A1") !== "a2_verbs",
    "A1 view does not keep an A2 last-completed stamp",
  );
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall ok");
