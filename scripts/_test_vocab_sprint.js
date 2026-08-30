/**
 * A1 vocab match + type-in level checks — pool, board, type-in (jsdom).
 * Run: node scripts/_test_vocab_sprint.js
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const tree = JSON.parse(readFileSync(join(ROOT, "data/tree.json"), "utf8"));
const pack = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_vocab_match.json"), "utf8"),
);
const typePack = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_vocab_type.json"), "utf8"),
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

const {
  startVocabSprint,
  startVocabTypeSprint,
  startGrammarMatchSprint,
  startGrammarTypeSprint,
  startFinaleSprint,
  loadA1VocabPool,
  loadA1UsePool,
  loadA1GrammarWhich,
  loadA1GrammarGaps,
  filterFinalePool,
  gradeFinale,
  whichItemFromPackItem,
  buildWhichPracticeList,
  typeItemFromPackItem,
  fillGrammarGap,
  chipIsPossibleEnglish,
  filterTypeInPool,
  isTypeInPrompt,
  gradeTypeIn,
  gradeGrammarGap,
  markTrouble,
  creditTrouble,
  readTrouble,
  buildPracticeList,
  CLEAR_AT,
} = await import(pathToFileURL(join(ROOT, "js/vocab-sprint.js")).href);

const { hasFruit, completeFinale, completeMode, progressLabelGrammar } =
  await import(pathToFileURL(join(ROOT, "js/progress.js")).href);

function loadJson(path) {
  const rel = path.replace(/^\.\//, "");
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

assert(pack.practice === "match_sprint", "pack practice");
assert(pack.fruit === false, "pack fruit false");
assert(pack.blocks[0].items.length === 0, "pool lives in other packs");
assert(typePack.practice === "type_sprint", "type pack practice");
assert(typePack.fruit === false, "type pack fruit false");
assert(typePack.blocks[0].items.length === 0, "type pool lives in other packs");
assert(typePack.codex_unit === "V_COR-A1B1-01", "type pack codex");

const node = tree.nodes.find((n) => n.id === "a1_vocab_match");
const typeNode = tree.nodes.find((n) => n.id === "a1_vocab_type");
assert(node && node.fruit === false, "tree fruit false");
assert(typeNode && typeNode.fruit === false, "type tree fruit false");
assert(typeNode.practice === "type_sprint", "type tree practice");
const matchI = tree.path_order.indexOf("a1_vocab_match");
const typeI = tree.path_order.indexOf("a1_vocab_type");
const gI = tree.path_order.indexOf("a1_grammar_match");
const gTypeI = tree.path_order.indexOf("a1_grammar_type");
assert(matchI === typeI - 1, "type immediately after vocab match");
assert(typeI === gI - 1, "grammar match immediately after vocab type");
assert(gI === gTypeI - 1, "grammar type immediately after grammar match");
const finaleI = tree.path_order.indexOf("a1_finale");
assert(gTypeI === finaleI - 1, "finale immediately after grammar type");
assert(finaleI === tree.path_order.length - 1, "finale last on A1 path");

const pool = await loadA1VocabPool(tree, loadJson, "a1_vocab_match");
assert(pool.length >= 200, `pool ${pool.length} too small`);
assert(
  !pool.some((w) => w.src === "a1_vocab_match" || w.src === "a1_vocab_type"),
  "pool includes a check node",
);
const keys = new Set(pool.map((w) => w.en.toLowerCase() + "‖" + w.cz.toLowerCase()));
assert(keys.size === pool.length, "pool not unique");

const root = document.getElementById("root");
startVocabSprint({
  root,
  node,
  loadJson,
  tree,
  onExit() {},
});

await new Promise((r) => setTimeout(r, 80));
const play = root.querySelector("#sprint-btn-play");
assert(play, "Play button missing");
assert(/words in the pool/.test(root.textContent), "pool count missing");
play.click();
await new Promise((r) => setTimeout(r, 50));
const tiles = [...root.querySelectorAll(".sprint-tile")];
assert(tiles.length === 12, `board ${tiles.length} want 12`);
const firstEn = tiles.find((t) => t.dataset.side === "en");
const mate = tiles.find(
  (t) => t.dataset.side === "cz" && t.dataset.id === firstEn.dataset.id,
);
assert(firstEn && mate, "could not find a pair");
firstEn.click();
mate.click();
await new Promise((r) => setTimeout(r, 50));
assert(
  root.querySelector("#sprint-score")?.textContent === "1",
  "score after one pair",
);

if (typeof root._RUE2UnbindKeys === "function") root._RUE2UnbindKeys();
root.innerHTML = "";

assert(isTypeInPrompt("ice cream"), "keep ice cream");
assert(isTypeInPrompt("next to"), "keep next to");
assert(isTypeInPrompt("in front of"), "keep 3 tokens");
assert(!isTypeInPrompt("I am a student."), "drop framed sentence");
assert(!isTypeInPrompt("How are you?"), "drop question");
assert(!isTypeInPrompt("I have a cat"), "drop 4-token sentence");

const typePool = filterTypeInPool(pool);
assert(typePool.length >= 100, `type pool ${typePool.length} too small`);
assert(
  typePool.some((w) => /^ice cream$/i.test(w.en)),
  "type pool missing ice cream",
);
assert(
  typePool.some((w) => /^next to$/i.test(w.en)),
  "type pool missing next to",
);
assert(
  !typePool.some((w) => /[.?!]/.test(w.en)),
  "type pool kept punctuation sentence",
);
assert(
  typePool.every((w) => w.en.trim().split(/\s+/).length <= 3),
  "type pool kept a long frame",
);
assert(
  pool.some((w) => w.en === "I am a student."),
  "match pool should still hold I am a student.",
);
assert(
  !typePool.some((w) => w.en === "I am a student."),
  "type pool kept I am a student.",
);

const mobile = { id: "m", en: "mobile", cz: "mobil" };
assert(
  gradeTypeIn("mobile", mobile, [mobile]).ok,
  "exact mobile should pass",
);
assert(
  gradeTypeIn("Mobile", mobile, [mobile]).ok,
  "case should pass",
);
assert(
  !gradeTypeIn("mobil", mobile, [mobile]).ok,
  "cognate mobil must not pass for mobile",
);
assert(
  gradeTypeIn("mobil", mobile, [mobile]).reason === "czech",
  "mobil fail reason",
);
assert(
  gradeTypeIn("mothe", { id: "1", en: "mother", cz: "matka" }, [
    { id: "1", en: "mother", cz: "matka" },
  ]).ok,
  "one-letter typo should pass",
);
{
  const price = { id: "1", en: "price", cz: "cena" };
  const prize = { id: "2", en: "prize", cz: "odměna" };
  const g = gradeTypeIn("prize", price, [price, prize]);
  assert(!g.ok, "prize/price other-word should fail");
  assert(g.reason === "other-word", `prize/price reason ${g.reason}`);
}
{
  const sister = { id: "1", en: "sister", cz: "sestra" };
  const nurse = { id: "2", en: "nurse", cz: "sestra" };
  const g = gradeTypeIn("nurse", sister, [sister, nurse]);
  assert(g.ok, "same-Czech sibling should pass");
}
assert(
  gradeTypeIn("don't", { id: "1", en: "do not", cz: "ne" }, [
    { id: "1", en: "do not", cz: "ne" },
  ]).ok,
  "contraction twin should pass",
);

const typeRoot = document.createElement("div");
document.body.appendChild(typeRoot);
localStorage.removeItem("rue-exp-sprint-topic:a1_vocab_match");
const troubleWord = typePool.find((w) => w.en.toLowerCase() === "mother") || typePool[0];
localStorage.setItem(
  "rue-exp-sprint-trouble:a1_vocab_match",
  JSON.stringify({ [troubleWord.id]: 0 }),
);
startVocabTypeSprint({
  root: typeRoot,
  node: typeNode,
  loadJson,
  tree,
  onExit() {},
});
await new Promise((r) => setTimeout(r, 80));
assert(!typeRoot.querySelector("#sprint-minutes"), "type-in has a clock");
assert(/words in the pool/.test(typeRoot.textContent), "type pool count missing");
assert(typeRoot.querySelector("#sprint-btn-play"), "type Play button missing");
typeRoot.querySelector("#sprint-btn-play").click();
await new Promise((r) => setTimeout(r, 50));
assert(!typeRoot.querySelector("#sprint-time"), "play screen has a clock");
assert(!typeRoot.querySelector("#sprint-bar"), "play screen has a timer bar");
const prompt = typeRoot.querySelector("#sprint-prompt");
const inp = typeRoot.querySelector("#ti");
assert(prompt && inp, "type prompt/input missing");
assert(prompt.textContent === troubleWord.cz, "trouble word should come first");
inp.value = troubleWord.en;
typeRoot.querySelector("#chk").click();
await new Promise((r) => setTimeout(r, 20));
assert(
  typeRoot.querySelector("#sprint-score")?.textContent === "1",
  "type score after one correct",
);
assert(/✓/.test(typeRoot.querySelector("#tfb")?.textContent || ""), "type ✓ missing");
assert(
  typeRoot.querySelector("#chk")?.textContent === "Next" ||
    typeRoot.querySelector("#chk")?.textContent === "Score →",
  "next/score after grade",
);

if (typeof typeRoot._RUE2UnbindKeys === "function") typeRoot._RUE2UnbindKeys();
typeRoot.innerHTML = "";

const TROUBLE_KEY = "rue-exp-sprint-trouble:a1_vocab_match";
localStorage.removeItem(TROUBLE_KEY);
assert(CLEAR_AT === 2, "CLEAR_AT");
markTrouble("x");
assert(readTrouble().x === 0, "mark starts at 0");
markTrouble("x");
assert(readTrouble().x === 0, "miss resets streak");
creditTrouble("x");
assert(readTrouble().x === 1, "first credit");
creditTrouble("x");
assert(!("x" in readTrouble()), "two credits retire");
creditTrouble("ghost");
assert(!("ghost" in readTrouble()), "credit unknown is no-op");

{
  const sentence = pool.find((w) => w.en === "I am a student.");
  const word = typePool[0];
  localStorage.setItem(TROUBLE_KEY, JSON.stringify({ [word.id]: 0 }));
  const extra = sentence ? [sentence.id] : [];
  const list = buildPracticeList(typePool, extra);
  assert(list.some((w) => w.id === word.id), "practice includes leftover trouble");
  assert(
    !list.some((w) => w.en === "I am a student."),
    "practice dropped a frame sentence",
  );
  assert(list.length <= 12, "practice cap 12");
}
localStorage.removeItem(TROUBLE_KEY);

{
  const prRoot = document.createElement("div");
  document.body.appendChild(prRoot);
  localStorage.removeItem("rue-exp-sprint-topic:a1_vocab_match");
  const first = typePool[0];
  localStorage.setItem(TROUBLE_KEY, JSON.stringify({ [first.id]: 0 }));
  startVocabTypeSprint({
    root: prRoot,
    node: typeNode,
    loadJson,
    tree,
    onExit() {},
  });
  await new Promise((r) => setTimeout(r, 80));
  prRoot.querySelector("#sprint-btn-play").click();
  await new Promise((r) => setTimeout(r, 30));
  const tin = prRoot.querySelector("#ti");
  tin.value = "zzzz";
  prRoot.querySelector("#chk").click();
  for (let i = 0; i < 30; i++) {
    const results = prRoot.querySelector("#sprint-results");
    if (results && !results.hidden) break;
    prRoot.querySelector("#chk")?.click();
    await new Promise((r) => setTimeout(r, 5));
  }
  const prBtn = prRoot.querySelector("#sprint-btn-practice");
  assert(prBtn && !prBtn.hidden, "Practice button after misses");
  assert(/Practice \d+/.test(prBtn.textContent), "Practice N words");
  prBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  const prPanel = prRoot.querySelector("#sprint-practice");
  assert(prPanel && !prPanel.hidden, "practice panel shown");
  const prPrompt = prRoot.querySelector("#pr-prompt");
  assert(prPrompt && prPrompt.textContent, "practice Czech prompt");
  const hit = typePool.find((w) => w.cz === prPrompt.textContent);
  prRoot.querySelector("#pr-input").value = hit ? hit.en : "zzzz";
  prRoot.querySelector("#pr-check").click();
  await new Promise((r) => setTimeout(r, 10));
  assert(/✓|✗/.test(prRoot.querySelector("#pr-fb")?.textContent || ""), "practice grade");
  if (typeof prRoot._RUE2UnbindKeys === "function") prRoot._RUE2UnbindKeys();
  prRoot.remove();
}

const gPack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/a1_grammar_match.json"), "utf8"),
);
assert(gPack.practice === "grammar_match_sprint", "g pack practice");
assert(gPack.fruit === false, "g pack fruit");
assert(gPack.title === "Which is correct?", "g pack title");
const gNode = tree.nodes.find((n) => n.id === "a1_grammar_match");
assert(gNode && gNode.fruit === false, "g tree fruit");
assert(gNode.status === "live", "g live");
assert(gNode.codex_unit === "G_SS-A1B1-01", "g hang");
assert(tree.path_order.includes("a1_grammar_match"), "g on A1 path");
assert(tree.path_order.includes("a1_grammar_type"), "g type on A1 path");

assert(
  fillGrammarGap("I ____ a student.", "is") === "I is a student.",
  "fill I is",
);
assert(
  fillGrammarGap("____ the window.", "Opens") === "Opens the window.",
  "fill Opens",
);
assert(
  chipIsPossibleEnglish("a", "the", "I have ____ dog.", new Set()),
  "the is possible English vs a",
);
assert(
  !chipIsPossibleEnglish("am", "is", "I ____ a student.", new Set()),
  "I is is not possible English",
);
{
  const am = whichItemFromPackItem(
    {
      en: "I am a student.",
      gap: "I ____ a student.",
      gap_answer: "am",
      quiz_options: ["am", "is", "are", "have"],
      explanation: "I → **am**.",
    },
    { src: "a1_be_have", topic: "Be / have", corpus: new Set() },
  );
  assert(am && am.en === "I am a student.", "am item");
  assert(am.wrongs.includes("I is a student."), "I is");
  assert(am.wrongs.includes("I are a student."), "I are");
  assert(!am.wrongs.some((w) => /have/.test(w)), "have is possible English");
  assert(am.why === "I → **am**.", "why missing");
  assert(am.src === "a1_be_have", "src missing");
  assert(am.t === "Be / have", "topic missing");
}
{
  const desk = whichItemFromPackItem(
    {
      en: "The bag is under the table.",
      gap: "The bag is ____ the table.",
      gap_answer: "under",
      quiz_options: ["under", "on", "in"],
      diagram: "under",
    },
    { src: "a1_prepositions_place", corpus: new Set() },
  );
  assert(!desk, "diagram place item must drop");
}
{
  const art = whichItemFromPackItem(
    {
      en: "I have a dog.",
      gap: "I have ____ dog.",
      gap_answer: "a",
      quiz_options: ["a", "an", "the", "—"],
    },
    { src: "a1_articles", corpus: new Set() },
  );
  assert(!art, "a/the both English — skip");
}
assert(
  chipIsPossibleEnglish("Can", "Does", "____ she drive?", new Set()),
  "Does she drive is English",
);
assert(
  !chipIsPossibleEnglish("Can", "Do", "____ she drive?", new Set()),
  "Do she drive is not English",
);
assert(
  !chipIsPossibleEnglish("Can", "Are", "____ she drive?", new Set()),
  "Are she drive is not English",
);
assert(
  chipIsPossibleEnglish("Go", "To go", "____ home.", new Set()),
  "To go home is English",
);
assert(
  chipIsPossibleEnglish("have", "had", "I ____ a phone.", new Set()),
  "I had a phone is English",
);
assert(
  !chipIsPossibleEnglish("have", "has", "I ____ a phone.", new Set()),
  "I has a phone is not English",
);
{
  const can = whichItemFromPackItem(
    {
      en: "Can she drive?",
      gap: "____ she drive?",
      gap_answer: "Can",
      quiz_options: ["Can", "Do", "Does", "Are"],
    },
    { src: "a1_can", corpus: new Set() },
  );
  assert(can && can.en === "Can she drive?", "can she kept");
  assert(!can.wrongs.includes("Does she drive?"), "Does she drive leaked");
  assert(can.wrongs.includes("Do she drive?"), "missing Do she drive");
  assert(can.wrongs.includes("Are she drive?"), "missing Are she drive");
}
{
  const go = whichItemFromPackItem(
    {
      en: "Go home.",
      gap: "____ home.",
      gap_answer: "Go",
      quiz_options: ["Go", "Goes", "You go", "To go"],
    },
    { src: "a1_imperatives", corpus: new Set() },
  );
  assert(!go, "Go home to-infinitive / You go — skip");
}
{
  const have = whichItemFromPackItem(
    {
      en: "I have a phone.",
      gap: "I ____ a phone.",
      gap_answer: "have",
      quiz_options: ["have", "has", "having", "had"],
    },
    { src: "a1_agreement", corpus: new Set() },
  );
  assert(have && have.en === "I have a phone.", "I have kept");
  assert(!have.wrongs.includes("I had a phone."), "I had a phone leaked");
  assert(have.wrongs.includes("I has a phone."), "missing I has");
  assert(have.wrongs.includes("I having a phone."), "missing I having");
}
assert(
  chipIsPossibleEnglish("can", "do", "Yes, I ____.", new Set()),
  "Yes I do is English",
);
assert(
  chipIsPossibleEnglish("likes", "liked", "He ____ dogs.", new Set()),
  "He liked dogs is English",
);
assert(
  !chipIsPossibleEnglish("likes", "like", "He ____ dogs.", new Set()),
  "He like dogs is not English",
);
assert(
  chipIsPossibleEnglish("speak", "spoke", "You ____ English and Czech.", new Set()),
  "You spoke is English",
);
assert(
  chipIsPossibleEnglish(
    "There is",
    "It is",
    "____ a car in front of the house.",
    new Set(),
  ),
  "It is a car is English",
);
assert(
  chipIsPossibleEnglish("are", "aren't", "There ____ many people here.", new Set()),
  "There aren't is English",
);
assert(
  !chipIsPossibleEnglish("are", "is", "There ____ many people here.", new Set()),
  "There is many people is not English",
);
{
  const yes = whichItemFromPackItem(
    {
      en: "Yes, I can.",
      gap: "Yes, I ____.",
      gap_answer: "can",
      quiz_options: ["can", "can't", "do", "am"],
    },
    { src: "a1_can", corpus: new Set() },
  );
  assert(!yes, "Yes I can short answers — skip");
}
{
  const no = whichItemFromPackItem(
    {
      en: "No, I can't.",
      gap: "No, I ____.",
      gap_answer: "can't",
      quiz_options: ["can't", "can", "don't", "am not"],
    },
    { src: "a1_can", corpus: new Set() },
  );
  assert(!no, "No I can't short answers — skip");
}
{
  const like = whichItemFromPackItem(
    {
      en: "He likes dogs.",
      gap: "He ____ dogs.",
      gap_answer: "likes",
      quiz_options: ["likes", "like", "liking", "liked"],
    },
    { src: "a1_agreement", corpus: new Set() },
  );
  assert(like && like.en === "He likes dogs.", "likes kept");
  assert(!like.wrongs.includes("He liked dogs."), "He liked leaked");
  assert(like.wrongs.includes("He like dogs."), "missing He like");
  assert(like.wrongs.includes("He liking dogs."), "missing He liking");
}
{
  const speak = whichItemFromPackItem(
    {
      en: "You speak English and Czech.",
      gap: "You ____ English and Czech.",
      gap_answer: "speak",
      quiz_options: ["speak", "speaks", "speaking", "spoke"],
    },
    { src: "a1_agreement", corpus: new Set() },
  );
  assert(speak, "speak kept");
  assert(
    !speak.wrongs.includes("You spoke English and Czech."),
    "You spoke leaked",
  );
}
{
  const car = whichItemFromPackItem(
    {
      en: "There is a car in front of the house.",
      gap: "____ a car in front of the house.",
      gap_answer: "There is",
      quiz_options: ["There is", "It is", "Is", "There are"],
    },
    { src: "a1_there_is", corpus: new Set() },
  );
  assert(car, "there is car kept");
  assert(
    !car.wrongs.includes("It is a car in front of the house."),
    "It is a car leaked",
  );
}
{
  const people = whichItemFromPackItem(
    {
      en: "There are many people here.",
      gap: "There ____ many people here.",
      gap_answer: "are",
      quiz_options: ["are", "is", "aren't", "isn't"],
    },
    { src: "a1_there_is", corpus: new Set() },
  );
  assert(people, "many people kept");
  assert(
    !people.wrongs.includes("There aren't many people here."),
    "aren't leaked",
  );
}
{
  const books = whichItemFromPackItem(
    {
      en: "There are two books on the table.",
      gap: "____ two books on the table.",
      gap_answer: "There are",
      quiz_options: ["There are", "There is", "It is", "They are"],
    },
    { src: "a1_there_is", corpus: new Set() },
  );
  assert(!books, "They are two books — skip");
}

const gPool = await loadA1GrammarWhich(tree, loadJson, "a1_grammar_match");
assert(gPool.length >= 80, `grammar which pool ${gPool.length}`);
assert(
  gPool.every(
    (w) =>
      w.en &&
      Array.isArray(w.wrongs) &&
      w.wrongs.length === 2 &&
      w.wrongs.every((s) => s && s !== w.en),
  ),
  "which items need en + 2 wrongs",
);
assert(
  !gPool.some((w) => w.src === "a1_prepositions_place"),
  "place pack leaked",
);
assert(!gPool.some((w) => w.src === "a1_articles"), "articles leaked");
assert(
  gPool.some((w) => w.src === "a1_prepositions_time"),
  "time preps should stay",
);
assert(
  gPool.some((w) => w.en === "I am a student."),
  "missing I am a student",
);
assert(
  !gPool.some((w) => w.en === "Go home."),
  "Go home should drop",
);
{
  const can = gPool.find((w) => w.en === "Can she drive?");
  assert(can, "Can she drive dropped");
  assert(
    !can.wrongs.includes("Does she drive?"),
    "pool Does she drive leaked",
  );
}
{
  const have = gPool.find((w) => w.en === "I have a phone.");
  assert(have, "I have a phone dropped");
  assert(!have.wrongs.includes("I had a phone."), "pool I had leaked");
}
assert(!gPool.some((w) => w.en === "Yes, I can."), "Yes I can should drop");
assert(!gPool.some((w) => w.en === "No, I can't."), "No I can't should drop");
assert(
  !gPool.some((w) => w.en === "There are two books on the table."),
  "two books should drop",
);
{
  const like = gPool.find((w) => w.en === "He likes dogs.");
  assert(like, "He likes dogs dropped");
  assert(!like.wrongs.includes("He liked dogs."), "pool He liked leaked");
}
{
  const people = gPool.find((w) => w.en === "There are many people here.");
  assert(people, "many people dropped");
  assert(
    !people.wrongs.includes("There aren't many people here."),
    "pool aren't leaked",
  );
}
{
  const speak = gPool.find((w) => w.en === "You speak English and Czech.");
  assert(speak, "speak dropped");
  assert(
    !speak.wrongs.includes("You spoke English and Czech."),
    "pool You spoke leaked",
  );
}
{
  const car = gPool.find(
    (w) => w.en === "There is a car in front of the house.",
  );
  assert(car, "car dropped");
  assert(
    !car.wrongs.includes("It is a car in front of the house."),
    "pool It is a car leaked",
  );
}
{
  const watch = gPool.find(
    (w) => w.en === "My brother watches TV in the evening.",
  );
  assert(watch, "watches dropped");
  assert(
    !watch.wrongs.includes("My brother watched TV in the evening."),
    "pool watched leaked",
  );
}

const groot = document.createElement("div");
document.body.appendChild(groot);
localStorage.removeItem("rue-exp-sprint-minutes:a1_grammar_match");
startGrammarMatchSprint({
  root: groot,
  node: gNode,
  loadJson,
  tree,
  onExit() {},
});
let gPlay = null;
for (let i = 0; i < 25 && !gPlay; i++) {
  await new Promise((r) => setTimeout(r, 40));
  gPlay = groot.querySelector("#sprint-btn-play");
}
if (!gPlay) {
  console.error("grammar shell html:", groot.innerHTML.slice(0, 600));
}
assert(gPlay, "grammar Play missing");
assert(
  groot.querySelector(".practice-head h2")?.textContent ===
    "A1 grammar · match",
  "unit title missing",
);
assert(/Which is correct\?/.test(groot.textContent), "prompt missing");
const minSel = groot.querySelector("#sprint-minutes");
assert(minSel && minSel.value === "0", "clock should default off");
gPlay.click();
await new Promise((r) => setTimeout(r, 50));
assert(groot.querySelector("#sprint-clock-wrap")?.hidden, "play clock on");
assert(groot.querySelector("#sprint-bar")?.hidden, "play bar on");
const gChoices = [...groot.querySelectorAll("#choices .choice")];
assert(gChoices.length === 3, `g choices ${gChoices.length}`);
assert(
  gChoices.every((b) => /\s/.test(b.textContent)),
  "choices are not full sentences",
);
const gOk = gChoices.find((b) => b.dataset.ok === "1");
assert(gOk, "correct choice unmarked");
gOk.click();
await new Promise((r) => setTimeout(r, 50));
assert(
  groot.querySelector("#sprint-score")?.textContent === "1",
  "grammar score after one tap",
);
{
  const why = groot.querySelector("#which-why");
  assert(why && !why.hidden, "why hidden after tap");
  const unit = groot.querySelector("#which-unit");
  assert(unit && !unit.hidden, "unit link hidden");
  assert(/^#a1_/.test(unit.getAttribute("href") || ""), "unit href");
  assert(/^Open /.test(unit.textContent || ""), "unit label");
}
if (typeof groot._RUE2UnbindKeys === "function") groot._RUE2UnbindKeys();
groot.remove();

{
  const canItem = gPool.find((w) => w.en === "Can she drive?");
  const haveItem = gPool.find((w) => w.en === "I have a phone.");
  localStorage.setItem(
    "rue-exp-sprint-trouble:a1_grammar_match",
    JSON.stringify({ [canItem.id]: 0, [haveItem.id]: 0 }),
  );
  const g2 = document.createElement("div");
  document.body.appendChild(g2);
  startGrammarMatchSprint({
    root: g2,
    node: gNode,
    loadJson,
    tree,
    onExit() {},
  });
  let play2 = null;
  for (let i = 0; i < 25 && !play2; i++) {
    await new Promise((r) => setTimeout(r, 40));
    play2 = g2.querySelector("#sprint-btn-play");
  }
  assert(play2, "pinned Play missing");
  play2.click();
  await new Promise((r) => setTimeout(r, 50));
  const seenEn = [];
  for (let n = 0; n < 2; n++) {
    const buttons = [...g2.querySelectorAll("#choices .choice")];
    const texts = buttons.map((b) => b.dataset.answer);
    const okBtns = buttons.filter((b) => b.dataset.ok === "1");
    assert(okBtns.length === 1, `ok count ${okBtns.length} on item ${n}`);
    seenEn.push(okBtns[0].dataset.answer);
    if (texts.includes("Can she drive?")) {
      assert(!texts.includes("Does she drive?"), "UI Does she drive");
      assert(texts.includes("Do she drive?"), "UI missing Do she drive");
      assert(texts.includes("Are she drive?"), "UI missing Are she drive");
    }
    if (texts.includes("I have a phone.")) {
      assert(!texts.includes("I had a phone."), "UI I had a phone");
      assert(texts.includes("I has a phone."), "UI missing I has");
      assert(texts.includes("I having a phone."), "UI missing I having");
    }
    okBtns[0].click();
    await new Promise((r) => setTimeout(r, 30));
    const nxt = g2.querySelector("#chk");
    if (nxt && !nxt.hidden) nxt.click();
    await new Promise((r) => setTimeout(r, 30));
  }
  assert(seenEn.includes("Can she drive?"), "pinned can not dealt");
  assert(seenEn.includes("I have a phone."), "pinned have not dealt");
  if (typeof g2._RUE2UnbindKeys === "function") g2._RUE2UnbindKeys();
  g2.remove();
  localStorage.removeItem("rue-exp-sprint-trouble:a1_grammar_match");
}

assert(gPool.every((w) => w.src), "pool src missing");
assert(
  gPool.filter((w) => w.why).length >= 100,
  "pool explanations missing",
);
{
  localStorage.setItem(
    "rue-exp-sprint-trouble:a1_grammar_match",
    JSON.stringify({ [gPool[0].id]: 0 }),
  );
  const list = buildWhichPracticeList(gPool, []);
  assert(list.length === 1, `practice list ${list.length}`);
  assert(list[0].id === gPool[0].id, "practice id");
  localStorage.removeItem("rue-exp-sprint-trouble:a1_grammar_match");
}

{
  localStorage.removeItem("rue-exp-sprint-trouble:a1_grammar_match");
  const g3 = document.createElement("div");
  document.body.appendChild(g3);
  startGrammarMatchSprint({
    root: g3,
    node: gNode,
    loadJson,
    tree,
    onExit() {},
  });
  let play3 = null;
  for (let i = 0; i < 25 && !play3; i++) {
    await new Promise((r) => setTimeout(r, 40));
    play3 = g3.querySelector("#sprint-btn-play");
  }
  assert(play3, "practice Play missing");
  play3.click();
  await new Promise((r) => setTimeout(r, 50));
  let missedEn = "";
  for (let n = 0; n < 12; n++) {
    const buttons = [...g3.querySelectorAll("#choices .choice")];
    const ok = buttons.find((b) => b.dataset.ok === "1");
    const bad = buttons.find((b) => b.dataset.ok !== "1");
    if (n === 0) {
      missedEn = ok?.dataset.answer || "";
      bad.click();
    } else {
      ok.click();
    }
    await new Promise((r) => setTimeout(r, 15));
    const nxt = g3.querySelector("#chk");
    if (nxt && !nxt.hidden) nxt.click();
    await new Promise((r) => setTimeout(r, 15));
  }
  const prBtn = g3.querySelector("#sprint-btn-practice");
  assert(prBtn && !prBtn.hidden, "Practice hidden after miss");
  assert(
    /Practice 1 sentence/.test(prBtn.textContent || ""),
    prBtn?.textContent,
  );
  prBtn.click();
  await new Promise((r) => setTimeout(r, 40));
  assert(!g3.querySelector("#sprint-play")?.hidden, "practice play hidden");
  const replayed = [...g3.querySelectorAll("#choices .choice")].map(
    (b) => b.dataset.answer,
  );
  assert(replayed.includes(missedEn), "practice did not replay miss");
  if (typeof g3._RUE2UnbindKeys === "function") g3._RUE2UnbindKeys();
  g3.remove();
  localStorage.removeItem("rue-exp-sprint-trouble:a1_grammar_match");
}

const gtPack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/a1_grammar_type.json"), "utf8"),
);
assert(gtPack.practice === "grammar_type_sprint", "gt pack practice");
assert(gtPack.fruit === false, "gt pack fruit");
assert(gtPack.codex_unit === "G_SS-A1B1-01", "gt pack hang");
assert(gtPack.blocks[0].items.length === 0, "gt pool lives in other packs");
const gtNode = tree.nodes.find((n) => n.id === "a1_grammar_type");
assert(gtNode && gtNode.fruit === false, "gt tree fruit");
assert(gtNode.status === "live", "gt live");
assert(gtNode.codex_unit === "G_SS-A1B1-01", "gt hang");
assert(gtNode.practice === "grammar_type_sprint", "gt tree practice");
assert(gtNode.root === "sentence_syntax", "gt root");

{
  const desk = typeItemFromPackItem(
    {
      en: "The bag is under the table.",
      cz: "Taška je pod stolem.",
      gap: "The bag is ____ the table.",
      gap_answer: "under",
      diagram: "under",
    },
    { src: "a1_prepositions_place" },
  );
  assert(!desk, "type must skip diagram place");
}
{
  const wc = typeItemFromPackItem(
    {
      en: "noun",
      cz: "dog · pes",
      gap: "dog = ____",
      gap_answer: "noun",
    },
    { src: "a1_word_classes" },
  );
  assert(!wc, "type must skip word classes");
}
{
  const am = typeItemFromPackItem(
    {
      en: "I am a student.",
      cz: "Já jsem student.",
      gap: "I ____ a student.",
      gap_answer: "am",
      explanation: "I → **am**.",
    },
    { src: "a1_be_have", topic: "Be / have" },
  );
  assert(am && am.answer === "am", "type am item");
  assert(am.prompt === "I ____ a student.", "type keeps gap");
  assert(am.cz === "Já jsem student.", "type keeps czech");
  assert(am.why === "I → **am**.", "type keeps explanation");
  assert(am.src === "a1_be_have", "type keeps src");
}

assert(gradeGrammarGap("am", { answer: "am", accepts: [] }), "exact am");
assert(gradeGrammarGap("AM", { answer: "am", accepts: [] }), "case am");
assert(
  gradeGrammarGap("do not", { answer: "don't", accepts: [] }),
  "contraction twin don't / do not",
);
assert(
  gradeGrammarGap("don't", { answer: "do not", accepts: [] }),
  "contraction twin do not / don't",
);
assert(!gradeGrammarGap("is", { answer: "am", accepts: [] }), "wrong form");
assert(
  !gradeGrammarGap("I am a student.", { answer: "am", accepts: [] }),
  "whole sentence must not pass for the form",
);
assert(
  gradeGrammarGap("", { answer: "—", accepts: [], zero_article: true }),
  "empty enter is zero article",
);

const gtPool = await loadA1GrammarGaps(tree, loadJson, "a1_grammar_type");
assert(gtPool.length >= 80, `grammar type pool ${gtPool.length}`);
assert(
  gtPool.every(
    (w) =>
      w.prompt &&
      w.answer &&
      w.cz &&
      /_{2,}|\u2026|\.{3}/.test(w.prompt) &&
      w.src !== "a1_grammar_type" &&
      w.src !== "a1_grammar_match",
  ),
  "type items need gap + form + czech, no check units",
);
assert(
  !gtPool.some((w) => w.src === "a1_prepositions_place"),
  "type place pack leaked",
);
assert(
  !gtPool.some((w) => w.src === "a1_word_classes"),
  "type word-classes leaked",
);
assert(
  gtPool.some((w) => w.en === "I am a student." && w.answer === "am"),
  "type missing I am a student",
);
{
  const cued = typeItemFromPackItem(
    {
      en: "You were sleeping.",
      cz: "Spal jsi.",
      gap: "You ____. (sleep)",
      gap_answer: "were sleeping",
    },
    { src: "a1_be_have" },
  );
  assert(cued && /\(sleep\)/.test(cued.prompt), "B11 stem cue must stay");
}
assert(
  gtPool.some((w) => w.src === "a1_prepositions_time"),
  "time preps should stay in type",
);
assert(
  gtPool.filter((w) => w.why).length >= 100,
  "type explanations missing",
);

const gtRoot = document.createElement("div");
document.body.appendChild(gtRoot);
localStorage.removeItem("rue-exp-sprint-topic:a1_grammar_type");
const amWhich = gPool.find((w) => w.en === "I am a student.");
const amType = gtPool.find((w) => w.en === "I am a student." && w.answer === "am");
assert(amWhich && amType, "shared I am a student");
localStorage.setItem(
  "rue-exp-sprint-trouble:a1_grammar_match",
  JSON.stringify({ [amWhich.id]: 0 }),
);
startGrammarTypeSprint({
  root: gtRoot,
  node: gtNode,
  loadJson,
  tree,
  onExit() {},
});
let gtPlay = null;
for (let i = 0; i < 40 && !gtPlay; i++) {
  await new Promise((r) => setTimeout(r, 40));
  gtPlay = gtRoot.querySelector("#sprint-btn-play");
}
if (!gtPlay) {
  console.error("grammar type shell html:", gtRoot.innerHTML.slice(0, 600));
}
assert(gtPlay, "grammar type Play missing");
assert(/A1 grammar · type/.test(gtRoot.textContent), "gt title missing");
assert(!gtRoot.querySelector("#sprint-minutes"), "gt has a clock");
assert(/forms in the pool/.test(gtRoot.textContent), "gt pool count missing");
gtPlay.click();
await new Promise((r) => setTimeout(r, 50));
assert(!gtRoot.querySelector("#sprint-time"), "gt play has a clock");
assert(!gtRoot.querySelector("#sprint-bar"), "gt play has a timer bar");
const gtPrompt = gtRoot.querySelector("#sprint-prompt");
const gtCz = gtRoot.querySelector("#sprint-cz");
const gtInp = gtRoot.querySelector("#ti");
assert(gtPrompt && gtInp, "gt prompt/input missing");
assert(gtPrompt.textContent === amType.prompt, "which trouble should come first");
assert(gtCz && gtCz.textContent === amType.cz, "czech support missing");
gtInp.value = "I am a student.";
gtRoot.querySelector("#chk").click();
await new Promise((r) => setTimeout(r, 20));
assert(
  gtRoot.querySelector("#sprint-score")?.textContent === "0",
  "whole sentence must not score",
);
assert(/✗/.test(gtRoot.querySelector("#tfb")?.textContent || ""), "gt ✗ missing");
{
  const why = gtRoot.querySelector("#which-why");
  assert(why && !why.hidden, "gt why hidden after check");
  const unit = gtRoot.querySelector("#which-unit");
  assert(unit && !unit.hidden, "gt unit link hidden");
  assert(unit.getAttribute("href") === "#a1_be_have", "gt unit href");
  assert(/^Open /.test(unit.textContent || ""), "gt unit label");
  const expl = gtRoot.querySelector("#which-expl");
  assert(expl && /am/i.test(expl.textContent || ""), "gt explanation empty");
}
gtRoot.querySelector("#chk").click();
await new Promise((r) => setTimeout(r, 15));
for (let n = 1; n < 12; n++) {
  const prompt = gtRoot.querySelector("#sprint-prompt")?.textContent;
  const hit = gtPool.find((w) => w.prompt === prompt);
  const inp = gtRoot.querySelector("#ti");
  if (inp) inp.value = hit ? hit.answer : "ok";
  gtRoot.querySelector("#chk")?.click();
  await new Promise((r) => setTimeout(r, 10));
  gtRoot.querySelector("#chk")?.click();
  await new Promise((r) => setTimeout(r, 10));
}
const gtPr = gtRoot.querySelector("#sprint-btn-practice");
assert(gtPr && !gtPr.hidden, "gt Practice hidden after miss");
assert(/Practice 1 form/.test(gtPr.textContent || ""), gtPr?.textContent);
gtPr.click();
await new Promise((r) => setTimeout(r, 40));
assert(!gtRoot.querySelector("#sprint-play")?.hidden, "gt practice play hidden");
assert(!gtRoot.querySelector("#sprint-practice"), "gt extra practice panel");
assert(
  gtRoot.querySelector("#sprint-prompt")?.textContent === amType.prompt,
  "gt practice did not replay miss",
);

if (typeof gtRoot._RUE2UnbindKeys === "function") gtRoot._RUE2UnbindKeys();
gtRoot.remove();
localStorage.removeItem("rue-exp-sprint-trouble:a1_grammar_match");

{
  const dont = gtPool.find((w) => w.answer === "don't" || w.answer === "do not");
  assert(dont, "don't item missing");
  assert(gradeGrammarGap("don't", dont), "grade don't");
  assert(gradeGrammarGap("do not", dont), "grade do not");
}

const fPack = JSON.parse(
  readFileSync(join(ROOT, "data/grammar/blocks/a1_finale.json"), "utf8"),
);
assert(fPack.practice === "use_sprint", "finale pack practice");
assert(fPack.fruit !== false, "finale pack can fruit");
assert(fPack.codex_unit === "G_SS-A1B1-01", "finale pack hang");
assert(fPack.blocks[0].items.length === 0, "finale pool lives in other packs");
const fNode = tree.nodes.find((n) => n.id === "a1_finale");
assert(fNode && fNode.fruit !== false, "finale tree can fruit");
assert(fNode.status === "live", "finale live");
assert(fNode.codex_unit === "G_SS-A1B1-01", "finale hang");
assert(fNode.practice === "use_sprint", "finale tree practice");
assert(fNode.root === "sentence_syntax", "finale root");
assert(fNode.domain === "grammar", "finale domain");

const usePool = await loadA1UsePool(tree, loadJson, "a1_finale");
assert(usePool.length >= 200, `use pool ${usePool.length} too small`);
assert(
  usePool.every(
    (w) =>
      w.en &&
      w.cz &&
      w.src &&
      w.kind &&
      w.src !== "a1_finale" &&
      w.src !== "a1_vocab_match" &&
      w.src !== "a1_vocab_type" &&
      w.src !== "a1_grammar_match" &&
      w.src !== "a1_grammar_type",
  ),
  "use pool leaked a check unit or empty row",
);
assert(
  !usePool.some((w) => w.src === "a1_word_classes"),
  "word classes leaked into Use pool",
);
assert(
  !usePool.some((w) => w.en === "She is not at home."),
  "use:false item leaked",
);
assert(
  usePool.some((w) => w.kind === "grammar" && w.src === "a1_articles"),
  "articles Use missing",
);
assert(
  usePool.some((w) => w.kind === "vocab" && w.src === "leaf_home_family"),
  "home family sentences missing",
);
assert(
  filterFinalePool(usePool, "__grammar__").every((w) => w.kind === "grammar"),
  "grammar filter mixed",
);
assert(
  filterFinalePool(usePool, "__vocab__").every((w) => w.kind === "vocab"),
  "vocab filter mixed",
);
assert(
  filterFinalePool(usePool, "a1_articles").every((w) => w.src === "a1_articles"),
  "unit filter mixed",
);
assert(
  gradeFinale("I'm a student.", {
    kind: "grammar",
    en: "I am a student.",
    accepts: [],
  }),
  "grammar contraction twin",
);
assert(
  gradeFinale("This is my mother", {
    kind: "vocab",
    en: "This is my mother.",
    accepts: ["This is my mother"],
  }),
  "vocab sentence accepts",
);
{
  const art = usePool.find(
    (w) => w.src === "a1_articles" && /^I have a dog\.?$/i.test(w.en),
  );
  assert(art && art.strict_articles, "articles pack flags missing");
  assert(!gradeFinale("I have dog.", art), "strict articles dropped a");
  assert(gradeFinale("I have a dog.", art), "articles exact");
}

localStorage.removeItem("rue-exp-progress");
assert(progressLabelGrammar(fNode) === "live", "finale label before play");
completeMode("a1_finale", "use");
assert(progressLabelGrammar(fNode) === "started", "finale must not show 1/4");
assert(!hasFruit("a1_finale"), "use-only must not fruit the finale");
completeFinale("a1_finale");
assert(hasFruit("a1_finale"), "completeFinale should fruit this node");
assert(progressLabelGrammar(fNode) === "done", "finale done label");
assert(!hasFruit("a1_articles"), "completeFinale must not fruit teaching units");
assert(
  progressLabelGrammar(tree.nodes.find((n) => n.id === "a1_articles")) !==
    "done",
  "articles label must not become done",
);
localStorage.removeItem("rue-exp-progress");
assert(!hasFruit("a1_finale"), "progress not cleared");

async function waitFor(fn, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 40));
  }
  return null;
}

async function answerFinale(root, typed) {
  const inp = root.querySelector("#ti");
  const chk = root.querySelector("#chk");
  if (!inp || !chk) return;
  inp.value = typed;
  chk.click();
  await new Promise((r) => setTimeout(r, 8));
  chk.click();
  await new Promise((r) => setTimeout(r, 8));
}

{
  const fRoot = document.createElement("div");
  document.body.appendChild(fRoot);
  localStorage.removeItem("rue-exp-progress");
  localStorage.removeItem("rue-exp-sprint-topic:a1_finale");
  startFinaleSprint({
    root: fRoot,
    node: fNode,
    loadJson,
    tree,
    onExit() {},
  });
  const play = await waitFor(() => fRoot.querySelector("#sprint-btn-play"));
  assert(play, "finale Play missing");
  assert(/A1 review/.test(fRoot.textContent), "review title missing");
  const mins = fRoot.querySelector("#sprint-minutes");
  assert(mins && mins.value === "0", "clock not off by default");
  const set = fRoot.querySelector("#sprint-topic");
  const opts = [...(set?.options || [])].map((o) => o.value);
  assert(opts.includes("__all__"), "Whole A1 missing");
  assert(opts.includes("__grammar__"), "Grammar only missing");
  assert(opts.includes("__vocab__"), "Vocab only missing");
  assert(opts.includes("a1_articles"), "unit a1_articles missing");
  assert(opts.includes("leaf_home_family"), "unit leaf_home_family missing");
  play.click();
  await new Promise((r) => setTimeout(r, 40));
  assert(fRoot.querySelector("#sprint-clock-wrap")?.hidden, "clock wrap shown");
  const firstCz = fRoot.querySelector("#sprint-prompt")?.textContent;
  assert(firstCz, "finale prompt missing");
  await answerFinale(fRoot, "zzz wrong");
  for (let n = 1; n < 12; n++) {
    const cz = fRoot.querySelector("#sprint-prompt")?.textContent;
    const hit = usePool.find((w) => w.cz === cz);
    await answerFinale(fRoot, hit ? hit.en : "ok");
  }
  assert(
    /Retry/.test(fRoot.querySelector("#sprint-pos-label")?.textContent || "") ||
      /Retry/.test(fRoot.querySelector("#chk")?.textContent || "") ||
      !fRoot.querySelector("#sprint-results")?.hidden === false,
    "retry did not start after a miss",
  );
  const retryCz = fRoot.querySelector("#sprint-prompt")?.textContent;
  assert(retryCz === firstCz, "retry should replay the miss first-ish");
  const hit = usePool.find((w) => w.cz === retryCz);
  await answerFinale(fRoot, hit ? hit.en : "ok");
  const recap = await waitFor(
    () => !fRoot.querySelector("#sprint-results")?.hidden && fRoot,
  );
  assert(recap, "finale recap missing after retry");
  assert(/Done/.test(fRoot.textContent), "round not done");
  assert(/Grammar/.test(fRoot.textContent), "recap Grammar block missing");
  assert(!/knot/i.test(fRoot.textContent), "knot copy leaked");
  const recapLinks = [...fRoot.querySelectorAll("a.finale-unit")];
  assert(recapLinks.length >= 1, "recap unit links missing");
  assert(
    recapLinks.every((a) => /^#/.test(a.getAttribute("href") || "")),
    "recap links are not hashes",
  );
  assert(/you wrote zzz wrong/.test(fRoot.textContent), "first-try miss dropped");
  assert(hasFruit("a1_finale"), "Whole A1 clean should fruit this node");
  assert(!hasFruit("a1_articles"), "Whole A1 must not fruit teaching units");
  if (typeof fRoot._RUE2UnbindKeys === "function") fRoot._RUE2UnbindKeys();
  fRoot.remove();
}

{
  const fRoot = document.createElement("div");
  document.body.appendChild(fRoot);
  localStorage.removeItem("rue-exp-progress");
  localStorage.setItem("rue-exp-sprint-topic:a1_finale", "__grammar__");
  startFinaleSprint({
    root: fRoot,
    node: fNode,
    loadJson,
    tree,
    onExit() {},
  });
  const play = await waitFor(() => fRoot.querySelector("#sprint-btn-play"));
  assert(play, "filtered Play missing");
  play.click();
  await new Promise((r) => setTimeout(r, 40));
  for (let n = 0; n < 12; n++) {
    const cz = fRoot.querySelector("#sprint-prompt")?.textContent;
    const hit = usePool.find((w) => w.cz === cz);
    await answerFinale(fRoot, hit ? hit.en : "ok");
  }
  await waitFor(() => !fRoot.querySelector("#sprint-results")?.hidden);
  assert(!hasFruit("a1_finale"), "filtered run fruited the finale");
  assert(!hasFruit("a1_articles"), "filtered run fruited a teaching unit");
  const recapLinks = [...fRoot.querySelectorAll("a.finale-unit")];
  assert(
    recapLinks.some((a) => (a.getAttribute("href") || "").startsWith("#a1_")),
    "filtered recap missing grammar unit link",
  );
  if (typeof fRoot._RUE2UnbindKeys === "function") fRoot._RUE2UnbindKeys();
  fRoot.remove();
  localStorage.removeItem("rue-exp-sprint-topic:a1_finale");
}

if (failed) {
  console.error(failed, "failed");
  process.exit(1);
}
console.log(
  "ok  pool",
  pool.length,
  "  type",
  typePool.length,
  "  which",
  gPool.length,
  "  gaps",
  gtPool.length,
  "  3 sentences  score 1",
);
