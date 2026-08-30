/**
 * Smoke the A1 countries leaf: 6-page intro, word Match, sentence Quiz.
 * Run: node scripts/_test_a1_countries.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const tree = JSON.parse(readFileSync(join(ROOT, "data/tree.json"), "utf8"));
const pack = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_countries.json"), "utf8"),
);

const dom = new JSDOM("<!doctype html><div id='root'></div>", {
  url: "http://localhost:8097/",
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href
);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

const COUNTRIES = [
  "the Czech Republic",
  "Slovakia",
  "Germany",
  "Poland",
  "Austria",
  "America",
  "Britain",
  "Italy",
  "Spain",
  "France",
  "Japan",
  "Russia",
];
const PEOPLE = [
  "Czech",
  "Slovak",
  "German",
  "Polish",
  "Austrian",
  "American",
  "British",
  "English",
  "Italian",
  "Spanish",
  "French",
  "Russian",
];
const CITIES = ["Prague", "Brno", "Bratislava", "Vienna", "Berlin", "London"];

const node = tree.nodes.find((n) => n.id === "leaf_countries_a1");
assert(node, "node missing");
assert(!node.codex_unit, "must not invent a V_* tag");
assert(pack.default_direction === "cz_to_en", "direction");
assert(Array.isArray(pack.intro) && pack.intro.length === 7, "7 intro pages");

const p0 = (pack.intro[0].pictures || []).map((p) => p.en);
const p1 = (pack.intro[1].pictures || []).map((p) => p.en);
const pCity = (pack.intro[5].pictures || []).map((p) => p.en);
assert(p0.length === 12 && COUNTRIES.every((c) => p0.includes(c)), "page 1 countries");
assert(p1.length === 12 && PEOPLE.every((c) => p1.includes(c)), "page 2 people");
assert(/Italian/.test(pack.intro[2].note || ""), "capital-letter card");
assert(pCity.length === 6 && CITIES.every((c) => pCity.includes(c)), "page 6 cities");
assert(pack.intro[3].table?.rows?.length === 6, "person table 1");
assert(pack.intro[4].table?.rows?.length === 5, "person table 2");
assert(
  JSON.stringify(pack.intro[6].frames) ===
    JSON.stringify(["I am …", "I am from …", "I speak …"]),
  "frames on last page",
);

const items = pack.blocks.flatMap((b) => b.items || []);
const words = items.filter((it) => it.quiz_axis !== "sentence");
const which = items.filter((it) => it.quiz_axis === "sentence");
assert(words.length === 30, `word items ${words.length}`);
assert(which.length === 14, `which items ${which.length}`);
assert(which.every((it) => (it.quiz_options || []).length === 3), "3 chips");
assert(
  which.every((it) => (it.quiz_options || []).includes(it.en)),
  "correct chip present",
);
assert(
  which.some((it) => (it.quiz_options || []).includes("I speak italian.")),
  "lowercase italian is a chip",
);
assert(pack.strict_capitals === true, "strict_capitals");
assert(
  items.every((it) => !it.icon && !it.swatch),
  "icon/swatch on a drill item",
);

const root = document.getElementById("root");
startPractice(
  root,
  {
    id: pack.id,
    title: pack.title,
    items,
    sentences: pack.sentences,
    intro: pack.intro,
  },
  {
    packId: pack.id,
    packTitle: pack.title,
    packLevel: pack.level,
    onExit() {},
  },
);

await new Promise((r) => setTimeout(r, 40));
assert(/Slovensko/.test(root.textContent), "p1 Slovakia");
assert(!/Praha/.test(root.textContent), "Prague not on countries page");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/angličtina/.test(root.textContent), "English on people page");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/Velké písmeno/.test(root.textContent), "capital card");
assert(/not italian/.test(root.textContent), "italian trap");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/a German/.test(root.textContent), "table 1 a German");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/a Pole/.test(root.textContent), "table 2 a Pole");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/Praha/.test(root.textContent), "Prague on cities page");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
assert(/I am from …/.test(root.textContent), "frames");

root.querySelector("#in-next").click();
await new Promise((r) => setTimeout(r, 20));
const matchTiles = [...root.querySelectorAll(".match .m")];
assert(matchTiles.length >= 20, `match tiles ${matchTiles.length}`);
assert(
  !matchTiles.some((t) => /He is a German/.test(t.textContent)),
  "Quiz sentences leaked onto Match",
);

root.querySelector('[data-mode="quiz"]').click();
await new Promise((r) => setTimeout(r, 20));
assert(/Which is correct\?/.test(root.textContent), "quiz prompt");
const opts = [...root.querySelectorAll(".opt")];
assert(opts.length === 3, `quiz chips ${opts.length}`);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ok  countries  30 words  14 which  7-page intro");
