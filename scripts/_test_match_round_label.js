/**
 * Clothes Match leftover: shoe/boot share *bota*, so a 12+10 split
 * must not print Match 3 of 2. From scratch, split the pair so two
 * boards cover all 23.
 * Run: node scripts/_test_match_round_label.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const pack = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_clothes.json"), "utf8"),
);
const items = pack.blocks.flatMap((b) => b.items);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=match3"
);

function mount() {
  const html = `<!doctype html><html><body>
    <div id="smoke-toolbar" hidden></div>
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

function startClothes(extra) {
  const root = mount();
  startPractice(
    root,
    {
      id: pack.id,
      title: pack.title,
      items,
      sentences: pack.sentences,
      intro: pack.intro,
      level: pack.level,
    },
    {
      onExit() {},
      packId: pack.id,
      packTitle: pack.title,
      packLevel: pack.level,
      startMode: "match",
      ...extra,
    },
  );
  return root;
}

function pairBoard() {
  const left = [
    ...document.querySelectorAll('button.m[data-side="L"]:not(.done)'),
  ];
  for (const L of left) {
    const R = document.querySelector(
      `button.m[data-side="R"][data-id="${L.dataset.id}"]:not(.done)`,
    );
    L.click();
    R?.click();
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

assert(items.length === 23, `23 clothes items, got ${items.length}`);
assert(
  items.some((it) => it.en === "shoe") && items.some((it) => it.en === "boot"),
  "shoe and boot are live",
);

const botaSafe = items.filter(
  (it) => it.en !== "shoe" && it.en !== "boot",
);
assert(botaSafe.length === 21, `21 non-bota items, got ${botaSafe.length}`);
const preKeys = botaSafe.slice(0, 12).map((it) => `${it.en || ""}‖${it.cz || ""}`);

startClothes({
  matchKeys: preKeys,
  matchNeed: 23,
  matchCleared: false,
});

const nLeftover = document.querySelectorAll("button.m").length;
assert(
  nLeftover === 20,
  `stranded leftover board buttons ${nLeftover} (want 20 = 10 pairs)`,
);
pairBoard();
await wait(400);

const body = document.body.textContent;
assert(
  /Match 3 of 2/.test(body) === false,
  `must not print Match 3 of 2 (${body.slice(0, 280)})`,
);
assert(/Match 2 of 3/.test(body), `Match 2 of 3 done (${body.slice(0, 280)})`);
assert(
  /All clear/.test(body) === false,
  `must not say All clear with 1 word left (${body.slice(0, 280)})`,
);
assert(/Complete 1 more match/.test(body), "subline asks for one more match");
const more = document.getElementById("m-more");
assert(!!more, "third Match board offered");
assert(
  more.textContent.includes("Match 3 of 3"),
  `button is Match 3 of 3, got ${JSON.stringify(more.textContent)}`,
);

startClothes({});
const n1 = document.querySelectorAll("button.m").length;
assert(n1 === 24, `first board from scratch ${n1} (want 24 = 12 pairs)`);
pairBoard();
await wait(400);
const more2 = document.getElementById("m-more");
assert(!!more2, "second Match board offered from scratch");
assert(
  /Match 1 of 2/.test(document.body.textContent),
  `Match 1 of 2 from scratch (${document.body.textContent.slice(0, 220)})`,
);
more2.click();
const n2 = document.querySelectorAll("button.m").length;
assert(n2 === 22, `second board from scratch ${n2} (want 22 = 11 pairs)`);
pairBoard();
await wait(400);
assert(
  !document.getElementById("m-more"),
  "no third board when shoe/boot were split",
);
assert(
  /23 \/ 23/.test(document.body.textContent),
  `23/23 after two boards (${document.body.textContent.slice(0, 220)})`,
);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
