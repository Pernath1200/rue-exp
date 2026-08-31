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
const slovakUse = pack.sentences.find((s) => (s.lemmas || []).includes("Slovak"));
assert(
  slovakUse && /friend/i.test(slovakUse.en) && !/brother/i.test(slovakUse.en),
  `Slovak Use is a friend (${slovakUse && slovakUse.en})`,
);
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

function ensureSmokeLive() {
  if (document.getElementById("smoke-live")) return;
  const s = document.createElement("span");
  s.id = "smoke-live";
  document.body.appendChild(s);
}

function liveEn() {
  const live = document.getElementById("smoke-live")?.textContent || "";
  const m = live.match(/EN: (.+)$/);
  return (m ? m[1] : "").trim();
}

function typeIn(text) {
  const inp = document.getElementById("ti");
  inp.value = text;
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.getElementById("chk").click();
}

function typeNext() {
  document.getElementById("chk").click();
}

ensureSmokeLive();

// --- P0: lowercase Czech is Capital letter, clue does not gift C____ ---
if (typeof root._RUEVocabUnbind === "function") root._RUEVocabUnbind();
const czechItem = words.find((it) => it.en === "Czech");
startPractice(
  root,
  {
    id: pack.id,
    title: pack.title,
    items: [czechItem],
    intro: [],
    strict_capitals: true,
  },
  {
    packId: pack.id,
    packTitle: pack.title,
    packLevel: pack.level,
    startMode: "type",
    strictCapitals: true,
    onExit() {},
  },
);
await new Promise((r) => setTimeout(r, 20));
assert(liveEn() === "Czech", `Czech item (${liveEn()})`);
typeIn("czech");
const fbLow = document.getElementById("tfb")?.textContent || "";
assert(/Capital letter/.test(fbLow), `lowercase czech must fail (${fbLow})`);
assert(/Czech/.test(fbLow), "show the capitalised form");

if (typeof root._RUEVocabUnbind === "function") root._RUEVocabUnbind();
startPractice(
  root,
  {
    id: pack.id,
    title: pack.title,
    items: [czechItem],
    intro: [],
    strict_capitals: true,
  },
  {
    packId: pack.id,
    packTitle: pack.title,
    packLevel: pack.level,
    startMode: "type",
    strictCapitals: true,
    onExit() {},
  },
);
await new Promise((r) => setTimeout(r, 20));
typeIn("Czech");
const fbOk = document.getElementById("tfb")?.textContent || "";
assert(/Correct/.test(fbOk) && !/Capital letter/.test(fbOk), `Czech passes (${fbOk})`);

// --- Type round 2 must not repeat round 1 (30 words, not the 14 Which items) ---
if (typeof root._RUEVocabUnbind === "function") root._RUEVocabUnbind();
const typeReports = [];
startPractice(
  root,
  {
    id: pack.id,
    title: pack.title,
    items,
    sentences: pack.sentences,
    intro: [],
    strict_capitals: true,
  },
  {
    packId: pack.id,
    packTitle: pack.title,
    packLevel: pack.level,
    startMode: "type",
    strictCapitals: true,
    onExit() {},
    onModeComplete(mode, meta) {
      if (mode === "type") typeReports.push(meta);
    },
  },
);
await new Promise((r) => setTimeout(r, 20));

const round1 = [];
for (let i = 0; i < 12; i++) {
  const ans = liveEn();
  assert(ans, `round 1 item ${i} has EN`);
  const clue = document.querySelector(".type-clue")?.textContent || "";
  assert(clue, `type clue on fat Type (${ans})`);
  if (/[A-Z]/.test(ans)) {
    assert(/[A-Z]/.test(clue), `clue keeps capitals for ${ans} (${clue})`);
  }
  round1.push(ans);
  typeIn(ans);
  const fb = document.getElementById("tfb")?.textContent || "";
  assert(/Correct/.test(fb), `round 1 ${ans} (${fb})`);
  typeNext();
}

const hub1 = root.textContent;
assert(/12 \/ 30 words/.test(hub1), `Type hub 12/30 (${hub1.slice(0, 220)})`);
assert(/Type 1 of 3 done/.test(hub1), "three Type rounds for 30 words");
assert(document.getElementById("t-sent"), "Use available after first Type set");
assert(
  document.getElementById("t-more")?.classList.contains("primary"),
  "Type 2 is primary after 12/30",
);
const last1 = typeReports[typeReports.length - 1];
assert(last1 && last1.need === 30, `type need 30, got ${last1 && last1.need}`);
assert(
  last1 && (last1.coveredKeys || []).length === 12,
  `stored 12 type keys, got ${last1 && (last1.coveredKeys || []).length}`,
);
assert(last1 && last1.coverageDone === false, "12/30 does not clear Type");

document.getElementById("t-more").click();
await new Promise((r) => setTimeout(r, 20));
const round2 = [];
for (let i = 0; i < 12; i++) {
  const ans = liveEn();
  assert(ans, `round 2 item ${i} has EN`);
  round2.push(ans);
  typeIn(ans);
  typeNext();
}
const overlap = round2.filter((a) => round1.includes(a));
assert(overlap.length === 0, `round 2 repeats round 1: ${overlap.join(", ")}`);
const hub2 = root.textContent;
assert(/24 \/ 30 words/.test(hub2), `Type hub 24/30 (${hub2.slice(0, 220)})`);
const last2 = typeReports[typeReports.length - 1];
assert(last2 && last2.coverageDone === true, "24/30 is enough Type for the tree");
const useBtn = document.getElementById("t-sent");
assert(useBtn, "Use on Type hub after two sets");
assert(useBtn.classList.contains("primary"), "Use is primary after 24/30 leftover");
useBtn.click();
await new Promise((r) => setTimeout(r, 20));
assert(
  document.querySelector("textarea#ti") || /write in English/i.test(root.textContent),
  `Use stage after two Type sets (${root.textContent.slice(0, 180)})`,
);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ok  countries  30 words  14 which  7-page intro  type 30 unique");
