/**
 * Fat-leaf Quiz/Type coverage: min(n, 36) unique words before fruit.
 * Run: node scripts/_test_vocab_cover.js
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "scripts", "x.js"));
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
    <div id="smoke-toolbar"></div><span id="smoke-live"></span><div id="root"></div>
  </body></html>`;
  const { window } = new JSDOM(html, { url: "http://localhost:8097/" });
  Object.assign(global, {
    window,
    document: window.document,
    localStorage: window.localStorage,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    CSS: { escape: (s) => String(s) },
    performance: { now: () => Date.now() },
    requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
  });
}

mount();
const { vocabCoverNeed, completeVocabMode, vocabQuizClear, vocabTypeClear, blockHasFruit } =
  await import(pathToFileURL(join(ROOT, "js/progress.js")).href + "?t=cover");

assert(vocabCoverNeed(12) === 12, "trunk of 12 stays 12");
assert(vocabCoverNeed(23) === 23, "23-word leaf is the whole pack");
assert(vocabCoverNeed(69) === 36, "69-word leaf caps at 36");
assert(vocabCoverNeed(84) === 36, "time leaf caps at 36");

const items = [];
for (let i = 0; i < 30; i++) {
  items.push({ en: `word${i}`, cz: `cz${i}` });
}

function enter() {
  const stage = document.getElementById("p-stage") || document.body;
  stage.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
}

function clickCorrect() {
  const live = document.getElementById("smoke-live")?.textContent || "";
  const ans = (live.match(/EN: ([^·]+)/) || live.match(/answer: (.+)$/) || [])[1];
  const want = (ans || "").trim();
  const btn = [...document.querySelectorAll(".opt")].find(
    (b) => b.textContent.replace(/^\d+/, "").trim() === want,
  );
  (btn || document.querySelector(".opt"))?.click();
  enter();
}

const reports = [];
const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=cover2"
);

startPractice(document.getElementById("root"), {
  id: "cover_test",
  title: "Cover test",
  items,
  level: "A1",
}, {
  onExit() {},
  packId: "cover_test",
  packTitle: "Cover test",
  packLevel: "A1",
  startMode: "quiz",
  onModeComplete(mode, meta) {
    reports.push({ mode, ...meta });
    completeVocabMode("cover_test", mode, meta);
  },
});

function finishQuizRound() {
  for (let i = 0; i < 16; i++) {
    if (/Quiz done/.test(document.body.textContent)) break;
    clickCorrect();
  }
}

finishQuizRound();
assert(/12 \/ 30 words/.test(document.body.textContent), `round1 scoreline (${document.body.textContent.slice(0, 180)})`);
assert(reports.length && reports[reports.length - 1].coverageDone === false, "round 1 does not fruit Quiz");
assert((reports[reports.length - 1].coveredKeys || []).length === 12, "round 1 stored 12 keys");

document.getElementById("q-more")?.click();
finishQuizRound();
document.getElementById("q-more")?.click();
finishQuizRound();

const lastQ = [...reports].reverse().find((r) => r.mode === "quiz");
assert(lastQ && lastQ.coverageDone === true, "round 3 coverageDone");
assert((lastQ.coveredKeys || []).length === 30, `30 unique quiz keys (${(lastQ.coveredKeys || []).length})`);
assert(vocabQuizClear(globalThis.__b || { quizNeed: 30, quizKeys: lastQ.coveredKeys, bestQuiz: 1, quizCleanPass: true }), "quiz clear helper with 30/30");

const b = completeVocabMode("cover_test", "quiz", lastQ);
assert(vocabQuizClear({ quizNeed: 30, quizKeys: lastQ.coveredKeys, bestQuiz: 1, quizCleanPass: true }), "clear at 30");
assert(
  !vocabQuizClear({ quizNeed: 36, quizKeys: lastQ.coveredKeys.slice(0, 12), bestQuiz: 1, quizCleanPass: true }),
  "12/36 is not a Quiz pass",
);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
