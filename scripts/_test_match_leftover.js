/**
 * Match leftover boards: a stale 18-word pass (dropped lemma) must not
 * skip the second board or print 18/17.
 * Run: node scripts/_test_match_leftover.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const pack = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_feelings.json"), "utf8"),
);
const items = pack.blocks.flatMap((b) => b.items);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

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
global.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=leftover"
);

assert(items.length === 17, `17 live items, got ${items.length}`);
assert(!items.some((it) => it.en === "well"), "well is not live");

const liveKeys = items.map((it) => `${it.en || ""}‖${it.cz || ""}`);
const staleKeys = [...liveKeys, "well‖dobře (zdravý)"];

startPractice(
  document.getElementById("root"),
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
    matchKeys: staleKeys,
    matchNeed: 18,
    matchCleared: true,
  },
);

const n1 = document.querySelectorAll("button.m").length;
assert(n1 === 18, `first board buttons ${n1} (want 18 = 9 pairs)`);

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
pairBoard();
await new Promise((r) => setTimeout(r, 400));

const body = document.body.textContent;
assert(/18 \/ 17/.test(body) === false, `must not print 18/17 (${body.slice(0, 220)})`);
assert(/9 \/ 17/.test(body), `scoreline 9/17 (${body.slice(0, 220)})`);
assert(/Match 1 of 2/.test(body), `Match 1 of 2 (${body.slice(0, 220)})`);
const more = document.getElementById("m-more");
assert(!!more, "second Match board offered");
more.click();
const n2 = document.querySelectorAll("button.m").length;
assert(n2 === 16, `second board buttons ${n2} (want 16 = 8 pairs)`);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
