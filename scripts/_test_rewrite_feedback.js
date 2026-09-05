/**
 * Vocab rewrite Use: say WHICH miss it was (James, 2026-09-05, b1_work).
 * Run: node scripts/_test_rewrite_feedback.js
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const mod = await import(pathToFileURL(process.cwd() + "/js/practice-vocab.js").href);
const { isCorrectAnswer, _usesLemma: usesLemma, _sentenceDiff: sentenceDiff } = mod;

const pack = JSON.parse(readFileSync("data/vocab/blocks/b1_work.json", "utf8"));
const byLemma = (l) => pack.use_sentences.find((u) => u.lemma === l);

let fail = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label} · got ${JSON.stringify(got)}`);
};

// flag 3 — a real synonym, but not this unit's word
const hire = byLemma("hire");
check("recruit is still wrong", isCorrectAnswer("the company wants to recruit two new people", hire, hire.en), false);
check("recruit misses the lemma", usesLemma("the company wants to recruit two new people", "hire"), false);
check("hire is the lemma", usesLemma("The company wants to hire two new people.", "hire"), true);
check("hired counts", usesLemma("The company hired two new people.", "hire"), true);
check("hiring counts", usesLemma("The company is hiring two new people.", "hire"), true);

// flag 4 — the word was produced, one carrier word differs
const free = byLemma("freelance");
check("his own hours now passes", isCorrectAnswer("He is now freelance and chooses his own hours", free, free.en), true);
check("freelance is present", usesLemma("He is now freelance and picks his own hours", "freelance"), true);
const d = sentenceDiff("He is now freelance and picks his hours", free, free.en);
check("carrier slip is diffed", Boolean(d && d.extra.includes("picks")), true);
check("diff marks the word", Boolean(d && /w-extra">picks/.test(d.html)), true);

// a wholly different sentence is not a diff
check("far-off answer gives no diff", sentenceDiff("I go to work by bus every morning of the week", free, free.en), null);

// multi-word lemmas
check("multi-word lemma, split form", usesLemma("I have to hand in the report", "hand in"), true);
check("multi-word lemma, absent", usesLemma("I must send the report", "hand in"), false);

console.log(fail ? `\n${fail} failing` : "\nall pass");
process.exit(fail ? 1 : 0);
