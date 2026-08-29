/**
 * Portrait lift (2026-08-29): viewed level sets skeleton age, lights = work
 * at or below the viewed level, slot floor never hides real work.
 * Run: node scripts/_test_map_lift.js
 */
const fs = await import("node:fs/promises");
const tree = JSON.parse(
  await fs.readFile(new URL("../data/tree.json", import.meta.url), "utf8"),
);
const { litSlots, renderTreePortrait } = await import("../js/tree-portrait.js");

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

process.exit(failed ? 1 : 0);
