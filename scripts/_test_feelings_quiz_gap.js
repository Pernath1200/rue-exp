/**
 * Feelings Quiz is a Czech sentence + English gap, not a 1-1 word list.
 * Run: node scripts/_test_feelings_quiz_gap.js
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

assert(pack.quiz_mode === "sentence_gap", "quiz_mode");
assert(pack.sentences.length === 24, `24 sentences, got ${pack.sentences.length}`);
const lemmaHits = pack.sentences.flatMap((s) => s.lemmas || []);
const uniqueLemmas = new Set(lemmaHits);
assert(uniqueLemmas.size === 17, `17 lemmas used, got ${uniqueLemmas.size}`);
assert(lemmaHits.length === 24, "7 recycled uses");

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
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=sentgap"
);

startPractice(
  document.getElementById("root"),
  {
    id: pack.id,
    title: pack.title,
    items,
    sentences: pack.sentences,
    intro: pack.intro,
    quiz_mode: pack.quiz_mode,
    level: pack.level,
  },
  {
    onExit() {},
    packId: pack.id,
    packTitle: pack.title,
    packLevel: pack.level,
    quiz_mode: pack.quiz_mode,
    startMode: "quiz",
  },
);

const gap = document.querySelector(".prompt-gap");
assert(gap && /____/.test(gap.textContent), `English gap (${gap?.textContent})`);
const czs = new Set(pack.sentences.map((s) => s.cz));
const shownCz = [...document.querySelectorAll(".prompt, .sub")].map(
  (el) => el.textContent,
);
assert(
  shownCz.some((t) => czs.has(t.trim())),
  `Czech sentence on screen (${shownCz.slice(0, 6).join(" | ")})`,
);
const chips = [...document.querySelectorAll("button.opt")].map((b) =>
  b.textContent.replace(/^\d+\s*/, "").trim(),
);
assert(chips.length === 4, `4 chips, got ${chips.length}`);
assert(
  chips.every((c) => !/\s/.test(c) || c === "free"),
  `chips are words (${chips.join(", ")})`,
);
assert(!/Choose the English/.test(document.body.textContent), "not 1-1 word quiz copy");
assert(/missing word/.test(document.body.textContent), "gap-fill copy");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
