/**
 * Use done: leftover Quiz/Type must name the tree, and a clear ladder
 * fires onFruitNow (the payoff). Type 12/23 must not make Use primary.
 * Run: node scripts/_test_use_tree.js
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

function mount() {
  const html = `<!doctype html><html><body>
    <div id="smoke-toolbar" hidden></div>
    <span id="smoke-live"></span>
    <div id="root"></div>
  </body></html>`;
  const dom = new JSDOM(html, { url: "http://localhost:8097/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
  global.performance = { now: () => Date.now() };
  global.requestAnimationFrame = (fn) => setTimeout((t) => fn(t || Date.now()), 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  return document.getElementById("root");
}

const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=usetree"
);

function itemsN(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ en: `word${i}`, cz: `cz${i}` });
  return out;
}
function keysOf(list) {
  return list.map((it) => `${it.en}‖${it.cz}`);
}

const sentences = [
  { en: "I have a coat.", cz: "Mám kabát.", lemmas: ["word0"], accepts: ["I have a coat"] },
  { en: "This is a hat.", cz: "Tohle je klobouk.", lemmas: ["word1"], accepts: ["This is a hat"] },
];

function liveEn() {
  const live = document.getElementById("smoke-live")?.textContent || "";
  const m = live.match(/EN: (.+)$/);
  return (m ? m[1] : "").trim();
}

function typeSentence() {
  const inp = document.getElementById("ti");
  const en = liveEn();
  inp.value = en;
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.getElementById("chk").click();
  document.getElementById("chk").click();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const thirteen = itemsN(13);
const k13 = keysOf(thirteen);

const root = mount();
startPractice(
  root,
  {
    id: "use_left",
    title: "Use leftover",
    items: thirteen,
    sentences,
    level: "A1",
  },
  {
    onExit() {},
    packId: "use_left",
    packTitle: "Use leftover",
    packLevel: "A1",
    startMode: "sentence",
    matchKeys: k13,
    matchNeed: 13,
    matchCleared: true,
  },
);
await wait(20);
typeSentence();
typeSentence();
await wait(20);
const leftBody = document.body.textContent;
assert(/The tree needs/.test(leftBody), `leftover names the tree (${leftBody.slice(0, 280)})`);
assert(/Quiz 0\/13/.test(leftBody), `Quiz leftover (${leftBody.slice(0, 280)})`);
assert(document.getElementById("fs-left"), "leftover Quiz/Type button");
assert(!/On the tree · next: Home/.test(leftBody), "must not claim the tree yet");

let fruitNow = 0;
mount();
startPractice(
  document.getElementById("root"),
  {
    id: "use_ok",
    title: "Use clear",
    items: thirteen,
    sentences,
    level: "A1",
  },
  {
    onExit() {},
    onFruitNow() {
      fruitNow += 1;
      return true;
    },
    packId: "use_ok",
    packTitle: "Use clear",
    packLevel: "A1",
    startMode: "sentence",
    matchKeys: k13,
    matchNeed: 13,
    matchCleared: true,
    quizKeys: k13,
    quizNeed: 13,
    quizCleared: true,
    typeKeys: k13,
    typeNeed: 13,
    typeCleared: true,
  },
);
await wait(20);
typeSentence();
typeSentence();
await wait(20);
assert(fruitNow === 1, `onFruitNow fired once, got ${fruitNow}`);
assert(
  !document.getElementById("fs-map") || fruitNow === 1,
  "payoff replaces Stage done when the tree is ready",
);

const fat = itemsN(23);
mount();
startPractice(
  document.getElementById("root"),
  {
    id: "type23",
    title: "Type 23",
    items: fat,
    sentences,
    level: "A1",
  },
  {
    onExit() {},
    packId: "type23",
    packTitle: "Type 23",
    packLevel: "A1",
    startMode: "type",
    quizKeys: keysOf(fat),
    quizNeed: 23,
    quizCleared: true,
  },
);
await wait(20);


function typeWord() {
  const ans = liveEn().trim();
  const inp = document.getElementById("ti");
  if (!inp || !ans) return false;
  inp.value = ans;
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.getElementById("chk")?.click();
  document.getElementById("chk")?.click();
  return true;
}

let typed = 0;
for (let i = 0; i < 16 && typed < 12; i++) {
  if (/Type 1 of/.test(document.body.textContent) && document.getElementById("t-more")) break;
  if (typeWord()) typed += 1;
  await wait(10);
}
await wait(50);
const hub = document.body.textContent;
assert(/12 \/ 23 words/.test(hub), `Type hub 12/23 (${hub.slice(0, 220)})`);
const more = document.getElementById("t-more");
const useBtn = document.getElementById("t-sent");
assert(more, "Type 2 offered after 12/23");
assert(more.classList.contains("primary"), "Type 2 is primary after 12/23");
assert(!useBtn, "Use locked until Type 23/23");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
