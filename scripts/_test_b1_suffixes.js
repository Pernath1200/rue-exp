/**
 * jsdom walk of rewritten b1_suffixes.
 * Run: node scripts/_test_b1_suffixes.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const pack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/b1_suffixes.json"), "utf8"),
);

const { adaptGrammarPack } = await import(
  pathToFileURL(join(ROOT, "js/pack-adapt.js")).href
);
const adapted = adaptGrammarPack(pack);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

assert(adapted.intro.length === 8, "8 intro cards");
assert(adapted.match.length === 8, "8 match pairs");
assert(adapted.quiz.length === 12, "12 quiz items");
assert(adapted.type_items.length === 12, "12 type items");
assert(adapted.use_items.length === 12, "12 use items");
assert(
  adapted.use_items.every((x) => x.wrong && !x.open),
  "use items are error-correction",
);
assert(
  adapted.match.every((p) => p.en.startsWith("-")),
  "match left tiles are suffixes",
);
assert(
  adapted.quiz.some((q) => q.answer === "information"),
  "quiz covers -tion",
);
assert(
  adapted.type_items[0].root === "INFORM",
  "type starts with INFORM (as_authored)",
);
assert(
  adapted.type_items.every((t) => /____/.test(t.prompt) && /\s/.test(t.prompt)),
  "every type prompt is a gapped sentence",
);
assert(
  adapted.quiz.every((q) => /____/.test(q.prompt) && /\s/.test(q.prompt)),
  "every quiz prompt is a gapped sentence",
);
assert(
  !adapted.type_items.some((t) => /person:|adjective:|opposite adjective:|noun \(action\)/i.test(t.prompt)),
  "no slot-label type prompts",
);
assert(
  !adapted.quiz.some((q) => /\(teach\)|\(us\)|\(help\)|\(manag\)/i.test(q.prompt)),
  "wf quiz does not append a comparative lemma",
);
assert(
  adapted.intro[0].ref && adapted.intro[0].ref.tab === "wordform",
  "card 0 links Word formation reference",
);

const html = `<!doctype html><html><body>
  <div id="smoke-toolbar" hidden></div>
  <div id="root"></div>
</body></html>`;
const dom = new JSDOM(html, {
  url: "http://localhost:8097/",
  pretendToBeVisual: true,
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;
global.CustomEvent = window.CustomEvent;
window.scrollTo = () => {};

const { startGrammarPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-grammar.js")).href + "?test=1"
);

const root = document.getElementById("root");
const refs = [];
startGrammarPractice(pack, root, {
  onExit() {},
  onOpenReference(tab) {
    refs.push(tab);
  },
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function h2() {
  return root.querySelector("h2")?.textContent || "";
}
function click(sel) {
  const el = typeof sel === "string" ? root.querySelector(sel) : sel;
  if (!el) throw new Error("missing " + sel);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}
function enter() {
  document.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
}

assert(h2().includes("Word Formation: Suffixes"), "intro title");
assert(root.querySelector("svg"), "card 0 inline svg");
assert(
  /PREFIX/.test(root.querySelector("svg")?.textContent || ""),
  "card 0 PREFIX block",
);
assert(root.querySelector("#intro-open-ref"), "reference link on card 0");
click("#intro-open-ref");
assert(refs[0] === "wordform", "reference opens wordform tab");

for (let i = 0; i < 7; i += 1) click("#btn-next");
assert(/Intro · 8 \/ 8/.test(root.textContent), "last intro card");
assert(root.querySelector("table"), "self-check table");
click("#btn-next");

assert(h2().includes("Match"), "Check opens on Match");
assert(root.querySelectorAll(".match-col .m").length === 16, "8+8 match tiles");
assert(
  adapted.match.filter((p) =>
    ["-tion", "-ment", "-ness"].includes(p.en),
  ).every((p) => p.cz === "turns a word into a noun · noun"),
  "tion/ment/ness share one job tile",
);

const nounRight = [...root.querySelectorAll('.m[data-side="R"]')].filter((el) =>
  /turns a word into a noun/.test(el.textContent),
);
const tionL = [...root.querySelectorAll('.m[data-side="L"]')].find((el) =>
  el.textContent.includes("-tion"),
);
assert(nounRight.length === 3 && tionL, "three shared noun-job tiles");
click(tionL);
click(nounRight.find((el) => el.dataset.id !== tionL.dataset.id));
await sleep(20);
assert(tionL.classList.contains("done"), "tion matches a ment/ness job tile");

const leftBtns = [...root.querySelectorAll('.m[data-side="L"]:not(.done)')];
for (const L of leftBtns) {
  const rights = [...root.querySelectorAll('.m[data-side="R"]:not(.done)')];
  const sameId = rights.find((R) => R.dataset.id === L.dataset.id);
  const sameText = rights.find((R) => {
    const pair = adapted.match.find((p) => p.en === L.textContent.trim());
    return pair && R.textContent.includes(pair.cz.split(" · ")[0]);
  });
  click(L);
  click(sameId || sameText);
}
await sleep(400);
assert(root.querySelector("#m-next"), "match board complete");
click("#m-next");

assert(h2().includes("Quiz"), "Quiz after Match");
for (let i = 0; i < 12; i += 1) {
  const prompt = root.querySelector(".practice-prompt")?.textContent || "";
  const item = adapted.quiz.find((q) => prompt.includes(String(q.prompt).slice(0, 18)));
  assert(!!item, `quiz ${i + 1} prompt maps to a bank item`);
  const hit = root.querySelector(`.choice[data-answer="${item.answer}"]`);
  assert(!!hit, `quiz ${i + 1} has chip ${item.answer}`);
  click(hit);
  await sleep(20);
  enter();
  await sleep(20);
}
assert(root.querySelector("#q-next") || h2().includes("Type"), "quiz gate or Type");
if (root.querySelector("#q-next")) click("#q-next");

assert(h2().includes("Type"), "Type stage");
assert(root.querySelector(".wf-root")?.textContent === "INFORM", "first type root INFORM");
for (let i = 0; i < 12; i += 1) {
  const input = root.querySelector("#ans");
  const rootCue = root.querySelector(".wf-root")?.textContent;
  const item = adapted.type_items.find((t) => t.root === rootCue && !t._done);
  const answer = item ? item.answer : adapted.type_items[i].answer;
  if (item) item._done = true;
  input.value = answer;
  click("#btn-submit");
  await sleep(10);
  click("#btn-submit");
  await sleep(10);
}
assert(root.querySelector("#t-next"), "type gate");
click("#t-next");

assert(h2().includes("Use"), "Use stage");
assert(root.querySelector(".fix-label"), "Correct this sentence label");
assert(root.querySelector("#ans"), "use has a type-in box");
for (let i = 0; i < 12; i += 1) {
  const prompt = root.querySelector(".practice-prompt")?.textContent || "";
  const item = adapted.use_items.find(
    (u) => prompt.includes(u.wrong) || prompt.includes(u.prompt),
  );
  assert(!!item, `use ${i + 1} prompt maps to a wrong sentence`);
  const input = root.querySelector("#ans");
  input.value = item.answer;
  click("#btn-submit");
  await sleep(10);
  click("#btn-submit");
  await sleep(10);
}
assert(root.querySelector("#t-next") || h2().includes("Done"), "use gate or done");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("b1_suffixes jsdom walk passed");
