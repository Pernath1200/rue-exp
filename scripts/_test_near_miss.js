/**
 * Use-stage spelling near-miss (James, 2026-09-05, b1_future flag 13).
 * A one-letter slip gets a second go; a form error stays wrong.
 * Run: node scripts/_test_near_miss.js
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { _nearMissWord: nearMiss } = await import(
  pathToFileURL(join(ROOT, "js/practice-grammar.js")).href
);

const rome = {
  answer: "We are flying to Rome on Saturday morning. We have the tickets.",
  accepts: [
    "We're flying to Rome on Saturday morning. We have the tickets.",
    "We are going to fly to Rome on Saturday morning. We have the tickets.",
  ],
  wrong: "We are fly to Rome on Saturday morning. We have the tickets.",
};

const cases = [
  // the flag itself — one letter dropped from flying
  [rome, "We are flyng to Rome on Saturday morning. We have the tickets.", "flying"],
  [rome, "We are flying to Rome on Saturday morning. We have the tikets.", "tickets"],
  [rome, "We are flying to Rome on Saturday moring. We have the tickets.", "morning"],
  // the planted error is grammar, not typing
  [rome, "We are fly to Rome on Saturday morning. We have the tickets.", null],
  // a form of the same verb is never a typo
  [rome, "We are flies to Rome on Saturday morning. We have the tickets.", null],
  [rome, "We are flew to Rome on Saturday morning. We have the tickets.", null],
  // two words out is not a slip
  [rome, "We are flyng to Rom on Saturday morning. We have the tickets.", null],
  // short words stay wrong: grammar hides there
  [
    { answer: "I will wait here until the rain stops.", accepts: [], wrong: "I will wait here until the rain will stop." },
    "I will wait here untl the rain stops.",
    "until",
  ],
  [
    { answer: "We are used to the heat.", accepts: [], wrong: "" },
    "We were used to the heat.",
    null,
  ],
  // a correct answer never reaches this path, but must not read as a slip
  [rome, "We are flying to Rome on Saturday morning. We have the tickets.", null],
];

let fail = 0;
for (const [item, typed, want] of cases) {
  const got = nearMiss(typed, item);
  const gotWord = got ? got.target : null;
  const ok = gotWord === want;
  if (!ok) fail += 1;
  console.log(`${ok ? "ok  " : "FAIL"}  ${typed}\n        want ${want} · got ${gotWord}`);
}
console.log(fail ? `\n${fail} failing` : "\nall pass");
process.exit(fail ? 1 : 0);
