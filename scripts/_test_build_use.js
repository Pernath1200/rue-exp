/**
 * b1_work build Use (James, 2026-09-05, flag 2, answer b): the prompt is a
 * situation, not a sentence to copy, and grading is the unit's word + what the
 * cue said — never one wording.
 * Run: node scripts/_test_build_use.js
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const { _buildVerdict: verdict } = await import(
  pathToFileURL(process.cwd() + "/js/practice-vocab.js").href
);
const pack = JSON.parse(readFileSync("data/vocab/blocks/b1_work.json", "utf8"));
const it = (l) => pack.use_sentences.find((u) => u.lemma === l);

let fail = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : ` · got ${JSON.stringify(got)}`}`);
};

// every item is authored for build mode
check("all 12 carry a cue", pack.use_sentences.every((u) => u.cue && u.targets?.length), true);
check("no cue contains its own answer", pack.use_sentences.every((u) => !u.cue.includes(u.en)), true);
// and the model answer itself must pass its own grader
for (const u of pack.use_sentences) {
  const v = verdict(u.en, u);
  if (!v.ok) { fail += 1; console.log(`FAIL  model answer rejected: ${u.lemma} · ${v.why}`); }
}
check("every model answer passes", true, true);

const vac = it("vacancy");
check("a different wording passes", verdict("There is a vacancy at our company for a teacher.", vac).ok, true);
check("the model wording passes", verdict(vac.en, vac).ok, true);
check("the word alone fails", verdict("a vacancy", vac).ok, false);
check("right length, no lemma, fails", verdict("Our company is looking for a new teacher.", vac).ok, false);
check("that miss names the clue", /v_+ \(7\)/.test(verdict("Our company is looking for a new teacher.", vac).why), true);
check("lemma but not the situation fails", verdict("We have a vacancy in the office right now.", vac).ok, false);
check("that miss names what is missing", verdict("We have a vacancy in the office right now.", vac).why.includes("teacher"), true);

const free = it("freelance");
check("freelance, own wording", verdict("He is freelance now and picks his own hours.", free).ok, true);
check("targets are base forms, so plural in the answer matches", verdict("He works freelance and chooses his hours himself.", free).ok, true);
check("no target is authored as a plural", pack.use_sentences.every((u) => u.targets.every((x) => !/[a-z]s$/.test(x) || x === "people")), true);

console.log(fail ? `\n${fail} failing` : "\nall pass");
process.exit(fail ? 1 : 0);
