/**
 * Vocab Match smoke hatch (jsdom).
 * Skip control + EN key in #smoke-live, gated on the dev toolbar.
 * Run: node scripts/_test_vocab_match_smoke.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const pack = JSON.parse(
  readFileSync(
    join(ROOT, "data/vocab/blocks/a1_core_frames_social.json"),
    "utf8",
  ),
);
const engineSrc = readFileSync(join(ROOT, "js/practice-vocab.js"), "utf8");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

assert(/id="m-skip"/.test(engineSrc), "skip-match control still in the engine");
assert(
  /skip match \(smoke\)/.test(engineSrc),
  "skip-match label still in the engine",
);

function mount(toolbarHidden) {
  const html = `<!doctype html><html><body>
    <div id="smoke-toolbar" ${toolbarHidden ? "hidden" : ""}></div>
    <span id="smoke-live"></span>
    <div id="root"></div>
  </body></html>`;
  const dom = new JSDOM(html, { url: "http://localhost:8097/" });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
  global.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
  global.performance = { now: () => Date.now() };
  global.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  return window;
}

const block = {
  ...pack.blocks[0],
  intro: pack.intro,
  practice: pack.practice,
  level: pack.level,
};

mount(false);
const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?test=vsmoke"
);

startPractice(document.getElementById("root"), block, {
  onExit() {},
  packId: pack.id,
  packTitle: pack.title,
  packLevel: pack.level,
  practice: pack.practice,
  startMode: "match",
});

const skip = document.getElementById("m-skip");
assert(skip, "jsdom: skip-match present when smoke toolbar is up");
const live = document.getElementById("smoke-live").textContent;
assert(/EN:/.test(live), `jsdom: smoke-live has EN key (${live})`);
assert(
  /Hi\.|Hello\.|Thanks\.|Thank you\./.test(live),
  `jsdom: smoke-live lists English answers (${live})`,
);

skip.click();
assert(
  document.querySelector(".opts") || /Choose the/.test(document.body.textContent),
  "jsdom: skip-match lands on Quiz",
);
assert(!document.getElementById("m-skip"), "jsdom: skip gone after leaving Match");

mount(true);
const { startPractice: startAgain } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?test=vsmoke2"
);
startAgain(document.getElementById("root"), block, {
  onExit() {},
  packId: pack.id,
  packTitle: pack.title,
  packLevel: pack.level,
  practice: pack.practice,
  startMode: "match",
});
assert(
  !document.getElementById("m-skip"),
  "jsdom: skip-match hidden when smoke toolbar is off",
);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
