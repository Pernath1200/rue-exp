/**
 * a2_adverbs_order Sort smoke (jsdom).
 * Run: node scripts/_test_a2_adverbs_sort.js
 *
 * Headers, 12 cards, per-column accept/reject, skip-sort control.
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
  try {
    ({ JSDOM } = await import("jsdom"));
  } catch {
    console.error("FAIL: jsdom is required (npm install jsdom)");
    process.exit(1);
  }
}

const { adaptGrammarPack } = await import(
  pathToFileURL(join(ROOT, "js/pack-adapt.js")).href
);

const pack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/a2_adverbs_order.json"), "utf8"),
);
const adapted = adaptGrammarPack(pack);
const engineSrc = readFileSync(join(ROOT, "js/practice-grammar.js"), "utf8");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

const BINS = ["before the verb", "after be / after can", "at the end"];
const WANT = {
  "before the verb": [
    "always drink coffee",
    "often watch films",
    "still live in Brno",
    "never eat meat",
  ],
  "after be / after can": [
    "is often tired",
    "is always late",
    "can also drive",
    "can also swim",
  ],
  "at the end": ["clearly", "hard", "too", "either"],
};

function chipKey(en) {
  return String(en || "")
    .replace(/\*\*/g, "")
    .toLowerCase();
}

function matchesWant(en, fragments) {
  const k = chipKey(en);
  return fragments.some((f) => k.includes(f.toLowerCase()));
}

assert(JSON.stringify(adapted.bins) === JSON.stringify(BINS), "three renamed headers on pack.bins");
assert(
  String(adapted.sort_rule || "").includes("First look for be or can"),
  "sort_rule is the be/can line",
);
assert((adapted.sortbins || []).length === 12, "12 sort cards");
assert(pack.codex_unit === "G_SS-A1B1-01", "unit_id G_SS-A1B1-01 unchanged");

const byBin = { [BINS[0]]: [], [BINS[1]]: [], [BINS[2]]: [] };
for (const it of adapted.sortbins) {
  assert(BINS.includes(it.bin), `card bin is one of three: ${it.bin}`);
  byBin[it.bin].push(it);
}
assert(byBin[BINS[0]].length === 4, "4 cards in before the verb");
assert(byBin[BINS[1]].length === 4, "4 cards in after be / after can");
assert(byBin[BINS[2]].length === 4, "4 cards in at the end");

for (const [bin, frags] of Object.entries(WANT)) {
  for (const it of byBin[bin]) {
    assert(
      matchesWant(it.en, frags),
      `"${chipKey(it.en)}" belongs in ${bin}`,
    );
  }
  for (const it of adapted.sortbins) {
    const mine = it.bin === bin;
    const looks = matchesWant(it.en, frags);
    if (mine) {
      assert(looks, `accepted in ${bin}: ${chipKey(it.en)}`);
    } else if (looks && bin === BINS[0]) {
      assert(
        false,
        `"${chipKey(it.en)}" must be rejected by before the verb`,
      );
    } else {
      assert(it.bin !== bin, `"${chipKey(it.en)}" not accepted in ${bin}`);
    }
  }
}

const canAlso = adapted.sortbins.filter((it) =>
  /can also (drive|swim)/i.test(chipKey(it.en)),
);
assert(canAlso.length === 2, "can also drive + can also swim present");
for (const it of canAlso) {
  assert(
    it.bin === "after be / after can",
    `"${chipKey(it.en)}" column 2 only (got ${it.bin})`,
  );
  assert(
    it.bin !== "before the verb",
    `"${chipKey(it.en)}" rejected by before the verb`,
  );
}

assert(
  /pack\.sort_rule/.test(engineSrc) && /class="sb-rule"/.test(engineSrc),
  "engine renders sort_rule as .sb-rule below the drag line",
);
assert(
  /id="sb-skip"/.test(engineSrc) && /skip sort \(smoke\)/.test(engineSrc),
  "skip-sort control still in the engine",
);

/* jsdom: headers, 12 chips, rule line, skip, drop marking. */
const items = adapted.sortbins;
const rule = String(adapted.sort_rule || "");
const skip = `<button type="button" class="link" id="sb-skip">skip sort (smoke) →</button>`;
const html = `<!doctype html><html><body>
  <div id="smoke-toolbar"></div>
  <div id="root">
    <h2>Adverb position · Sort</h2>
    <p class="score-line">0 / ${items.length} placed · drag a word into a column, or click it then click a column · ${skip}</p>
    <p class="sb-rule">${rule}</p>
    <div class="sb-pool" id="sb-pool">${items
      .map(
        (it, i) =>
          `<button type="button" class="sb-chip" data-i="${i}" draggable="true">${it.en}</button>`,
      )
      .join("")}</div>
    <div class="sb-bins">${BINS.map(
      (b) =>
        `<div class="sb-bin" data-bin="${b}"><h3>${b}</h3><div class="sb-drop"></div></div>`,
    ).join("")}</div>
  </div>
</body></html>`;

const dom = new JSDOM(html);
const doc = dom.window.document;
const headers = [...doc.querySelectorAll(".sb-bin h3")].map((h) => h.textContent);
assert(
  JSON.stringify(headers) === JSON.stringify(BINS),
  "jsdom: three renamed headers present",
);
assert(doc.querySelectorAll(".sb-chip").length === 12, "jsdom: 12 cards render");
assert(
  doc.querySelector(".sb-rule")?.textContent.includes("First look for be or can"),
  "jsdom: rule line under the drag instruction",
);
assert(doc.getElementById("sb-skip"), "jsdom: skip-sort still works (control present)");

function mark(placed) {
  for (const el of doc.querySelectorAll(".sb-chip")) {
    const i = Number(el.dataset.i);
    const it = items[i];
    el.classList.remove("good", "bad");
    if (placed[i] == null) continue;
    el.classList.add(placed[i] === it.bin ? "good" : "bad");
  }
}

const allCorrect = Object.fromEntries(items.map((it, i) => [i, it.bin]));
mark(allCorrect);
assert(
  [...doc.querySelectorAll(".sb-chip.good")].length === 12,
  "jsdom: each card accepted only in its correct column",
);
assert(
  doc.querySelectorAll(".sb-chip.bad").length === 0,
  "jsdom: no false rejects on the answer key",
);

const canIdx = items.findIndex((it) => /can also drive/i.test(chipKey(it.en)));
const wrong = { ...allCorrect, [canIdx]: "before the verb" };
mark(wrong);
const driveChip = doc.querySelector(`.sb-chip[data-i="${canIdx}"]`);
assert(
  driveChip.classList.contains("bad"),
  "jsdom: can also drive dropped on before the verb is rejected",
);

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nall ok");
