/**
 * Portrait lift (2026-08-29): viewed level sets skeleton age, lights = work
 * at or below the viewed level, slot floor never hides real work.
 * Run: node scripts/_test_map_lift.js
 */
const fs = await import("node:fs/promises");
const tree = JSON.parse(
  await fs.readFile(new URL("../data/tree.json", import.meta.url), "utf8"),
);
const { litSlots, renderTreePortrait, cambiumGirthBonus } =
  await import("../js/tree-portrait.js");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}
const host = () => ({ innerHTML: "", querySelectorAll() { return []; } });
const paint = (level, nodes, litId, state) =>
  renderTreePortrait(host(), {
    level,
    nodes,
    isFruit: (id) => id === litId && state !== "started",
    progressState: (id) => (id === litId ? state : "none"),
  });

// 1. Lights at-or-below the viewed level: A1 work shows on the B1 tree.
//    (Also locks the agreement retag — a1_agreement lights Sentence.)
let p = paint("B1", tree.nodes, "a1_agreement", "fruit");
assert(p.level === "B1", "viewed level sets the skeleton age");
const sentB1 = p.laterals.find((L) => L.tree_part === "sentence_syntax");
const verbsB1 = p.laterals.find((L) => L.tree_part === "verb_phrase");
assert(sentB1.fruited.some((n) => n.id === "a1_agreement"),
  "A1 fruit lights Sentence on the B1 view (lights ≤ level)");
assert(!verbsB1.fruited.length,
  "agreement no longer lights Verbs (retag locked)");

// 2. Lights never run ahead of the view: B1 work is silent on the A1 tree.
p = paint("A1", tree.nodes, "b1_degree_adverbs", "fruit");
const sentA1 = p.laterals.find((L) => L.tree_part === "sentence_syntax");
assert(!sentA1.fruited.length,
  "B1 fruit does not light the A1 view (no lights above the band)");

// 3. Slot floor: 1 started of 30 live must still show one light (K3 —
//    rounding must never make real work invisible).
const synth = Array.from({ length: 30 }, (_, i) => ({
  id: "v" + i, domain: "grammar", kind: "topic", root: "verb_phrase",
  tree_part: "verb_phrase", levels: ["A1"], status: "live",
}));
p = paint("A1", synth, "v0", "started");
const verbs = p.laterals.find((L) => L.tree_part === "verb_phrase");
assert(verbs.knots === 1, "1 started of 30 live → exactly 1 lit slot");
assert(litSlots(synth, 1) === 1, "litSlots floor holds at 1/30");

// 4. Map dressing (polish, 2026-08-29): seats wear their names on the map,
//    the growing tip carries the apex bud — and neither leaks into payoffs.
const mapHost = host();
renderTreePortrait(mapHost, {
  level: "A1", nodes: tree.nodes,
  isFruit: () => false, progressState: () => "none",
});
assert(mapHost.innerHTML.includes(">Linking</text>"),
  "map names every root seat (Linking labelled)");
assert(mapHost.innerHTML.includes(">Foundation</text>"),
  "tap root labelled Foundation");
assert(mapHost.innerHTML.includes("tp-bud"),
  "apex bud on the growing map tree");
const payHost = host();
renderTreePortrait(payHost, {
  level: "A1", nodes: tree.nodes,
  isFruit: () => false, progressState: () => "none",
  justNow: "leaf_home_family", highlight: ["home_family", "trunk"],
});
assert(!payHost.innerHTML.includes(">Linking</text>"),
  "payoff stays unlabelled below ground");
assert(!payHost.innerHTML.includes("tp-bud"), "payoff carries no bud");

// 5. Cambium (2026-08-29): word-craft reps thicken the trunk — saturating,
//    capped, level-filtered; the edge-line variant is map-only.
assert(cambiumGirthBonus(0) === 0, "cambium: no work, no bonus");
assert(
  cambiumGirthBonus(1) - cambiumGirthBonus(0) >
    cambiumGirthBonus(2) - cambiumGirthBonus(1),
  "cambium: diminishing returns");
assert(cambiumGirthBonus(1000) < 0.15, "cambium: hard cap holds");
const wcState = (id) =>
  ["b1_prefixes", "b1_suffixes", "b2_word_formation", "c1_word_formation"]
    .includes(id) ? "mastered" : "none";
const wcHost = host();
let wp = renderTreePortrait(wcHost, {
  level: "B1", nodes: tree.nodes, cambium: "edge",
  isFruit: (id) => wcState(id) === "mastered",
  progressState: wcState,
});
assert(wp.cambium.sum === 4,
  "cambium counts only packs at or below the viewed level (2 of 4 at B1)");
assert(wp.cambium.bonus > 0, "cambium bonus feeds girth");
assert(wcHost.innerHTML.includes("tp-cambium"),
  "edge-line renders on the map with word-craft work");
const wcClean = host();
wp = renderTreePortrait(wcClean, {
  level: "B1", nodes: tree.nodes, cambium: "edge",
  isFruit: () => false, progressState: () => "none",
});
assert(wp.cambium.bonus === 0 && !wcClean.innerHTML.includes("tp-cambium"),
  "no work: no bonus, no edge-line");
const wcPay = host();
renderTreePortrait(wcPay, {
  level: "B1", nodes: tree.nodes, cambium: "edge",
  isFruit: (id) => wcState(id) === "mastered",
  progressState: wcState, justNow: "b1_prefixes",
});
assert(!wcPay.innerHTML.includes("tp-cambium"),
  "edge-line never leaks into payoffs (girth itself still applies)");

// 6. House wood (2026-08-30): a vocab house grows a bough only when covered.
const emptyCrown = host();
renderTreePortrait(emptyCrown, {
  level: "B1", nodes: tree.nodes,
  isFruit: () => false, progressState: () => "none",
});
assert(!emptyCrown.innerHTML.includes(">Home &amp; family</text>"),
  "B1 with no vocab work does not name a Home branch");
const homeCrown = host();
renderTreePortrait(homeCrown, {
  level: "B1", nodes: tree.nodes,
  isFruit: (id) => id === "leaf_home_family",
  progressState: (id) => (id === "leaf_home_family" ? "fruit" : "none"),
});
assert(homeCrown.innerHTML.includes(">Home &amp; family</text>"),
  "covering Home & family grows and names that branch");

const payWhole = host();
renderTreePortrait(payWhole, {
  level: "B1", nodes: tree.nodes,
  isFruit: (id) => id === "leaf_home_family" || id === "a1_agreement",
  progressState: (id) =>
    id === "leaf_home_family" || id === "a1_agreement" ? "fruit" : "none",
  justNow: "b1_phrasal_verbs",
  highlight: ["verb_complementation", "trunk"],
  focus: "roots",
  focusLabel: "Phrasal verbs",
});
assert(payWhole.innerHTML.includes("tp-house"),
  "grammar payoff still draws the crown (same plant, not roots-only)");
assert(payWhole.innerHTML.includes(">Home &amp; family</text>"),
  "previous Home fruit stays named on the grammar payoff tree");
assert(payWhole.innerHTML.includes("Phrasal verbs"),
  "new grammar unit is still labelled on its root");

process.exit(failed ? 1 : 0);
