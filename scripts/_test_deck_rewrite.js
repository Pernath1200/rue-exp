/**
 * A pack rewritten under a finished unit must not take its tree away.
 * Work (a1_work) gained `quiz_mode: sentence_gap` on 2026-08-31, moving Quiz
 * and Type off the word deck onto sentence frames — every stored key became
 * a ghost. A fruited block adopts the live deck; an unfinished one still
 * starts over. Run: node scripts/_test_deck_rewrite.js
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import fs from "node:fs";

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
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="smoke-toolbar" hidden></div>
      <span id="smoke-live"></span>
      <div id="root"></div>
    </body></html>`,
    { url: "http://localhost:8097/" },
  );
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

mount();
const { startPractice } = await import(
  pathToFileURL(join(ROOT, "js/practice-vocab.js")).href + "?t=rewrite"
);
const progress = await import(
  pathToFileURL(join(ROOT, "js/progress.js")).href + "?t=rewrite"
);

const pack = JSON.parse(
  fs.readFileSync(join(ROOT, "data/vocab/blocks/a1_work.json"), "utf8"),
);
// Same merge app.js does for a multi-block pack.
const practiceBlock = {
  id: pack.id,
  title: pack.title,
  items: pack.blocks.flatMap((b) => b.items || []),
  sentences: pack.sentences,
  intro: null,
  quiz_mode: pack.quiz_mode,
};
const WORDS = practiceBlock.items.length;
const FRAMES = pack.sentences.length;

/** Open the unit and collect what it wrote back to progress. */
function open(extraOpts) {
  mount();
  const reports = {};
  startPractice(document.getElementById("root"), practiceBlock, {
    onExit() {},
    onModeComplete(mode, meta) {
      reports[mode] = meta;
    },
    packId: pack.id,
    packTitle: pack.title,
    packLevel: "A1",
    startMode: "match",
    ...extraOpts,
  });
  return reports;
}

// The pre-rewrite state: 30 word keys, cleared, from the old deck.
const stale = {
  matchKeys: pack.blocks
    .flatMap((b) => b.items || [])
    .slice(0, 30)
    .map((it) => `${it.en}‖${it.cz}`),
  matchNeed: 30,
  matchCleared: true,
};
stale.quizKeys = stale.matchKeys;
stale.quizNeed = 30;
stale.quizCleared = true;
stale.typeKeys = stale.matchKeys;
stale.typeNeed = 30;
stale.typeCleared = true;

// ---- 1 · unfinished unit still starts over on a rewritten deck ----
const cold = open(stale);
assert(
  cold.quiz && cold.quiz.coveredKeys.length === 0 && cold.quiz.coverageDone === false,
  `unfinished: Quiz starts over (got ${cold.quiz && cold.quiz.coveredKeys.length})`,
);
assert(
  cold.match && cold.match.coveredKeys.length === 0,
  `unfinished: Match starts over (got ${cold.match && cold.match.coveredKeys.length})`,
);

// ---- 2 · a fruited unit adopts the live deck instead ----
const warm = open({ ...stale, wasFruit: true });
assert(
  warm.quiz && warm.quiz.coveredKeys.length === FRAMES && warm.quiz.need === FRAMES,
  `fruited: Quiz adopts ${FRAMES} frames (got ${warm.quiz && warm.quiz.coveredKeys.length})`,
);
assert(
  warm.type && warm.type.coveredKeys.length === FRAMES,
  `fruited: Type adopts ${FRAMES} frames (got ${warm.type && warm.type.coveredKeys.length})`,
);
assert(
  warm.match && warm.match.coveredKeys.length === WORDS,
  `fruited: Match adopts ${WORDS} words (got ${warm.match && warm.match.coveredKeys.length})`,
);
assert(
  warm.quiz.coverageDone === true && warm.match.coverageDone === true,
  "fruited: adoption is persisted as covered, not as a reset",
);

// ---- 3 · adoption keeps the tree through the fruit gate ----
// The real sequence: a unit fruited on the OLD deck, then the pack is
// rewritten, then it is opened and adoption writes the new keys.
mount();
localStorage.setItem(
  "rue-exp-progress",
  JSON.stringify({
    version: 1,
    fruitClearMigrate: 1,
    workRewriteRestore: 1,
    grammar: { blocks: {} },
    nodes: {},
    units: {},
    vocab: {
      blocks: {
        a1_work: {
          nodeId: "leaf_work_a1",
          modes: { match: true, quiz: true, type: true, sentence: true },
          bestQuiz: 1,
          bestType: 1,
          bestSentence: 1,
          sentenceDone: true,
          quizCleanPass: true,
          typeCleanPass: true,
          sentenceCleanPass: true,
          matchCleanPass: true,
          quizKeys: stale.quizKeys,
          typeKeys: stale.typeKeys,
          matchKeys: stale.matchKeys,
          quizNeed: 30,
          typeNeed: 30,
          matchNeed: 30,
        },
      },
    },
  }),
);
assert(progress.vocabBlockFruit("a1_work"), "fruited on the old deck");
for (const [mode, meta] of Object.entries(warm)) {
  progress.completeVocabMode("a1_work", mode, { ...meta, nodeId: "leaf_work_a1" });
}
assert(progress.vocabBlockFruit("a1_work"), "still fruited after the deck is adopted");
const after = progress.vocabCoverage("a1_work");
assert(
  after.quizNeed === FRAMES && after.quizKeys.length === FRAMES,
  `coverage now reads against the live deck (${after.quizKeys.length}/${after.quizNeed})`,
);

// ---- 4 · the one-time Work restore ----
mount();
localStorage.setItem(
  "rue-exp-progress",
  JSON.stringify({
    version: 1,
    fruitClearMigrate: 1,
    grammar: { blocks: {} },
    nodes: {},
    units: {},
    vocab: {
      blocks: {
        a1_work: {
          modes: { match: true, quiz: true, type: true, sentence: true },
          bestQuiz: 1,
          bestType: 1,
          bestSentence: 1,
          quizCleanPass: false,
          typeCleanPass: false,
          quizKeys: [],
          typeKeys: [],
          matchKeys: [],
          quizNeed: 32,
          typeNeed: 32,
          matchNeed: 32,
        },
        a1_nature: {
          modes: { match: true, quiz: false, type: false, sentence: false },
          matchKeys: [],
        },
      },
    },
  }),
);
const fresh = await import(
  pathToFileURL(join(ROOT, "js/progress.js")).href + "?t=restore"
);
assert(fresh.vocabBlockFruit("a1_work"), "Work gets its tree back after the rewrite");
assert(
  !fresh.vocabBlockFruit("a1_nature"),
  "restore cannot hand out a unit that never reached 4/4",
);

// ---- 5 · end-of-unit checks count, and fruit off one round ----
const treeNodes = JSON.parse(
  fs.readFileSync(join(ROOT, "data/tree.json"), "utf8"),
).nodes;
const checks = treeNodes.filter(
  (n) =>
    n.fruit === false &&
    n.status === "live" &&
    n.content &&
    (n.levels || []).includes("A1"),
);
assert(checks.length === 4, `A1 has ${checks.length} check units`);
assert(
  fresh.levelUnitStats("A1", treeNodes).total === 60,
  `checks stay in the A1 denominator (got ${fresh.levelUnitStats("A1", treeNodes).total})`,
);

const vCheck = checks.find((n) => n.domain === "vocab");
const gCheck = checks.find((n) => n.domain === "grammar");
assert(!fresh.nodeHasFruit(vCheck), "check starts unfruited");
assert(fresh.progressLabelVocab(vCheck) === "check", "and reads CHECK");

const learnedBefore = fresh.levelUnitStats("A1", treeNodes).learned;
for (const n of [vCheck, gCheck]) {
  const r = fresh.completeCheckRound(n.id);
  assert(r.justFruited, `${n.id} fruits off one round`);
}
assert(fresh.nodeHasFruit(vCheck), "vocab-domain check reads fruited");
assert(fresh.nodeHasFruit(gCheck), "grammar-domain check reads fruited");
assert(
  fresh.progressLabelVocab(vCheck) === "done",
  "a fruited check reads DONE, not CHECK",
);
assert(
  fresh.levelUnitStats("A1", treeNodes).learned === learnedBefore + 2,
  "both count towards Learned",
);

// A teaching unit's Check stage must not be mistaken for a check round.
const teach = treeNodes.find(
  (n) => n.domain === "grammar" && n.status === "live" && n.fruit !== false,
);
fresh.completeMode(teach.id, "check", { score: 1, total: 1 });
assert(
  !fresh.hasFruit(teach.id),
  "clearing Check alone still does not fruit a teaching unit",
);


console.log(failed ? `\n${failed} FAILED` : "\nall ok");
process.exit(failed ? 1 : 0);
