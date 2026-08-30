/**
 * b1_prefixes rewrite smoke (jsdom + adapter).
 * Run: node scripts/_test_b1_prefixes.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let JSDOM;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  ({ JSDOM } = await import("jsdom"));
}

const { adaptGrammarPack } = await import(
  pathToFileURL(join(ROOT, "js/pack-adapt.js")).href
);
const { introDiagram } = await import(
  pathToFileURL(join(ROOT, "js/intro-visuals.js")).href
);

const pack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/b1_prefixes.json"), "utf8"),
);
const adapted = adaptGrammarPack(pack);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

assert(adapted.match.length === 8, `match ${adapted.match.length} want 8`);
const left = adapted.match.map((p) => p.en);
const right = adapted.match.map((p) => p.cz);
assert(new Set(left).size === 8, "match left not unique: " + left.join(" | "));
assert(new Set(right).size === 8, "match right not unique");
assert(left.includes("un-") && left.includes("mis-"), "match missing un-/mis-");
assert(
  right.some((t) => /__fair/.test(t)) && right.some((t) => /__possible/.test(t)),
  "match right missing example gaps",
);

assert(adapted.quiz.length === 12, `quiz ${adapted.quiz.length} want 12`);
for (const q of adapted.quiz) {
  const hits = (q.choices || []).filter(
    (c) => String(c).toLowerCase() === String(q.answer).toLowerCase(),
  );
  assert(hits.length === 1, `quiz ${q.answer} keyed ${hits.length} times`);
  assert((q.choices || []).length === 4, `quiz ${q.answer} chips ${(q.choices || []).length}`);
  assert(q.root, `quiz ${q.answer} missing root`);
}

assert(adapted.type_items.length === 12, `type ${adapted.type_items.length} want 12`);
assert(
  adapted.type_items.map((t) => t.answer).includes("Preheat"),
  "type missing Preheat",
);

assert(adapted.use_items.length === 12, `use ${adapted.use_items.length} want 12`);
assert(
  adapted.use_items.every((u) => u.wrong && u.answer && u.wrong !== u.answer),
  "use items need a wrong prompt different from the answer",
);
assert(
  adapted.use_items.every((u) =>
    /unpossible|unagreed|dislocked|unpatient|unlegal|underslept|unwrite|ununderstood|uncorrect|unregular|Unheat|inhappy/.test(
      u.wrong,
    ),
  ),
  "use wrongs should be a bad prefix, not a fine sentence",
);
const agree = adapted.use_items.find((u) => /disagreed/.test(u.answer));
assert(agree, "use missing disagreed");
assert(
  (agree.no_prefix || []).some((s) => /didn't agree with the plan/.test(s)),
  "use disagreed missing no_prefix didn't agree",
);

const hub = introDiagram("hub_spokes", [
  "PAID",
  "unpaid",
  "overpaid",
  "underpaid",
  "prepaid",
  "repaid",
]);
assert(/unpaid/.test(hub) && /repaid/.test(hub), "hub_spokes 5 missing words");
assert(/<svg/.test(hub), "hub_spokes 5 empty");

const { window } = new JSDOM(
  `<!doctype html><div id="root"></div>`,
  { url: "http://localhost:8097/#b1_prefixes" },
);
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;

const engineSrc = readFileSync(join(ROOT, "js/practice-grammar.js"), "utf8");
assert(/Rewrite with a prefix/.test(engineSrc), "engine missing rewrite label");
assert(
  /kind === "use" &&/.test(engineSrc) &&
    /use_mode === "rewrite"/.test(engineSrc),
  "rewrite UI must be Use-only, not Type",
);
assert(
  /Correct English — but use a prefix here/.test(engineSrc),
  "engine missing prefix-free feedback",
);

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("ok  match 8 · quiz 12 · type 12 · use 12 (wrong prefix) · hub 5");
