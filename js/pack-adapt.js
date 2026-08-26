import { expandContractions } from "./contractions.js";
/**
 * pack-adapt.js — translate a RUE grammar pack into the shape the practice
 * ladder expects.
 *
 * RUE packs (RUE2 lineage) store everything in `blocks[].items[]`:
 *   { en, cz, gap, gap_answer, gap_accepts, accepts, explanation,
 *     explanation_cz, quiz_options? }
 * and carry `intro: { cards: [...] }` plus `check: { sequence: [...] }`.
 *
 * practice-grammar.js (RUPL lineage) expects `pack.intro` as a card ARRAY plus
 * flat `pack.match / quiz / type_items / use_items` banks. Nothing produced
 * those keys, so the whole grammar ladder rendered empty while still
 * reporting a pass. This module is the bridge.
 *
 * Ladder built from one item bank:
 *   match       → meaning (English sentence ↔ Czech)
 *   quiz        → choose the right form in the frame
 *   order_click → click item.tokens[] into the right sequence (needs
 *                 check.sequence: ["order_click"] and items shaped
 *                 { tokens: string[], accepts?: string[] } — a1_word_order)
 *   type        → produce the missing form (Czech shown as the hint)
 *   use         → produce the whole English sentence from Czech
 */

/** Normalised key for answer/distractor comparison. */
function key(s) {
  return expandContractions(String(s == null ? "" : s))
    .toLowerCase()
    .replace(/[!?.,;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function flatItems(pack) {
  const out = [];
  /* Tag each item with its block. Blocks are the author's PASS UNITS — 52
   * packs use them and almost every block is ~12 items, i.e. DEFAULT_PASS.
   * a1_word_classes (path step 1) has three: word-class labels, one/more
   * than one, and plural forms. Flattening them put all three exercise types
   * on one Match board, which is incoherent for a first lesson (James,
   * 2026-08-12, in class). Nothing noticed while passes were unshuffled,
   * because the first 12 items happened to be exactly block 1. */
  for (const b of pack.blocks || []) {
    for (const it of b.items || []) {
      if (it && typeof it === "object") out.push({ ...it, _block: b.id || "" });
    }
  }
  return out;
}

/** Distinct block ids present in an adapted bank, in authoring order. */
export function blocksOf(items) {
  const seen = [];
  for (const it of items || []) {
    const b = it && it._block;
    if (b && !seen.includes(b)) seen.push(b);
  }
  return seen;
}

/** Every string a given item would accept, normalised (never a distractor). */
function acceptedKeys(it) {
  const out = new Set();
  for (const v of [it.gap_answer, ...(it.gap_accepts || []), ...(it.accepts || [])]) {
    const k = key(v);
    if (k) out.add(k);
  }
  return out;
}

/**
 * Multiple-choice options for a gap item.
 * Authored `quiz_options` win. Otherwise borrow other items' answers from the
 * same pack — never one this item would itself accept, never a duplicate.
 * Returns null when fewer than two distinct options can be built (the item is
 * then left out of the quiz rather than shipped unanswerable).
 */
/* When a gap names its verb — "everybody ____ here. (be)" — the task is to
 * pick the right FORM of that verb. Distractors drawn from other items give
 * you "calls" and "study", which are eliminable without knowing anything and
 * test nothing. These are the forms a learner actually confuses.
 * (James, 2026-08-20, smoking a2_first_conditional: "it should have the
 * common mistakes, including will be, be, would be etc".) */
const IRREGULAR = {
  be: ["am", "is", "are", "was", "were", "been", "being"],
  have: ["has", "had", "having"],
  do: ["does", "did", "done", "doing"],
  go: ["goes", "went", "gone", "going"],
  get: ["gets", "got", "gotten", "getting"],
  make: ["makes", "made", "making"],
  take: ["takes", "took", "taken", "taking"],
  come: ["comes", "came", "coming"],
  see: ["sees", "saw", "seen", "seeing"],
  say: ["says", "said", "saying"],
  know: ["knows", "knew", "known", "knowing"],
  think: ["thinks", "thought", "thinking"],
  give: ["gives", "gave", "given", "giving"],
  find: ["finds", "found", "finding"],
  tell: ["tells", "told", "telling"],
  leave: ["leaves", "left", "leaving"],
  feel: ["feels", "felt", "feeling"],
  bring: ["brings", "brought", "bringing"],
  buy: ["buys", "bought", "buying"],
  pay: ["pays", "paid", "paying"],
  meet: ["meets", "met", "meeting"],
  win: ["wins", "won", "winning"],
  run: ["runs", "ran", "running"],
  eat: ["eats", "ate", "eaten", "eating"],
  drink: ["drinks", "drank", "drunk", "drinking"],
  write: ["writes", "wrote", "written", "writing"],
  speak: ["speaks", "spoke", "spoken", "speaking"],
  begin: ["begins", "began", "begun", "beginning"],
  understand: ["understands", "understood", "understanding"],
  read: ["reads", "read", "read", "reading"],
  send: ["sends", "sent", "sent", "sending"],
  sell: ["sells", "sold", "sold", "selling"],
  lose: ["loses", "lost", "lost", "losing"],
  choose: ["chooses", "chose", "chosen", "choosing"],
  break: ["breaks", "broke", "broken", "breaking"],
  drive: ["drives", "drove", "driven", "driving"],
};

function thirdPerson(v) {
  if (/(s|sh|ch|x|z|o)$/.test(v)) return v + "es";
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ies";
  return v + "s";
}

function doubles(v) {
  // One syllable, consonant-vowel-consonant: swim -> swimming, stop -> stopped.
  // w, x and y never double.
  return /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v);
}

function pastForm(v) {
  if (/e$/.test(v)) return v + "d";
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ied";
  if (doubles(v)) return v + v.slice(-1) + "ed";
  return v + "ed";
}

function ingForm(v) {
  if (/[^aeiou]e$/.test(v)) return v.slice(0, -1) + "ing";
  if (doubles(v)) return v + v.slice(-1) + "ing";
  return v + "ing";
}

/* The lemma a gap cues, if it names one: "… ____ here. (be)" -> "be". */
function cuedLemma(gap) {
  const m = String(gap || "").match(/\(([a-z][a-z ]{0,14})\)\s*$/i);
  if (!m) return null;
  const w = m[1].trim().toLowerCase();
  return /^(not )?[a-z]+$/.test(w) ? w : null;
}

/* A gap sitting after can/could/must/should takes a bare infinitive, so
 * "will swim" is not a mistake anyone makes there — but "to swim" and
 * "swimming" are. */
const MODAL_BEFORE = /(^|\s)(can|could|must|should|might|may|will|would|shall)\s+_{2,}/i;

function negativeForms(v) {
  const t = thirdPerson(v);
  return ["doesn't " + v, "don't " + v, "won't " + v, "isn't " + ingForm(v),
    "not " + v, "didn't " + v, t];
}

function formsOf(v, gap) {
  if (/^not /.test(v)) return negativeForms(v.slice(4).trim());
  const irr = IRREGULAR[v] || null;
  // An irregular verb NEVER gets the regular endings — "haves", "bed" and
  // "bes" are not mistakes a learner makes, they are nonsense words.
  const third = irr ? irr[0] : thirdPerson(v);
  const past = irr ? (irr.find((f) => !/(s|ing)$/.test(f)) || null) : pastForm(v);
  const ing = irr ? (irr.find((f) => /ing$/.test(f)) || ingForm(v)) : ingForm(v);
  // Ordered by how often each is the actual mistake: the bare form and
  // will + base lead, because that is the classic conditional/time-clause error.
  const out = MODAL_BEFORE.test(String(gap || ""))
    ? [v, "to " + v, ing, third, past, "is " + ing]
    : [v, "will " + v, third, "would " + v, past, ing, "to " + v, "is " + ing];
  if (irr) irr.forEach((f) => out.push(f));
  return out.filter(Boolean);
}

/* ---- Auxiliary gaps (James, 2026-08-23, smoking a2_present_continuous):
 * "____ they coming?" must offer "do" — the mistake a Czech speaker makes —
 * not a random sibling answer. Same family first, then one confusable from
 * the neighbouring family. */
const AUX_FAMILIES = [
  ["am", "is", "are"], ["was", "were"], ["do", "does"], ["did"],
  ["have", "has"], ["had"],
  ["will", "would", "can", "could", "should", "must", "might", "may", "shall"],
  ["isn't", "aren't"], ["wasn't", "weren't"], ["don't", "doesn't"], ["didn't"],
  ["haven't", "hasn't"], ["hadn't"],
  ["won't", "wouldn't", "can't", "couldn't", "shouldn't", "mustn't"],
];
/* Which other family a learner reaches for by mistake. */
const AUX_CONFUSABLE = {
  am: ["do", "was"], is: ["does", "was", "do"], are: ["do", "were", "does"],
  was: ["is", "did", "were"], were: ["are", "did", "was"],
  do: ["are", "does", "is"], does: ["is", "do", "are"], did: ["was", "do", "does"],
  have: ["has", "had", "are"], has: ["have", "had", "is"], had: ["have", "has", "was"],
  "isn't": ["doesn't", "wasn't"], "aren't": ["don't", "weren't"],
  "don't": ["doesn't", "isn't", "didn't"], "doesn't": ["don't", "isn't", "didn't"],
  "didn't": ["don't", "wasn't", "doesn't"], "wasn't": ["isn't", "didn't"], "weren't": ["aren't", "didn't"],
  "haven't": ["hasn't", "don't"], "hasn't": ["haven't", "doesn't"], "hadn't": ["haven't", "didn't"],
};
const AUX_ALL = new Set(AUX_FAMILIES.flat());

function auxDistractors(answer) {
  // raw lowercase, not key(): key() expands "isn't" to "is not" and the family lookup misses
  const a = String(answer == null ? "" : answer).toLowerCase().replace(/[’]/g, "'").trim();
  if (!AUX_ALL.has(a)) return null;
  const fam = AUX_FAMILIES.find((f) => f.includes(a)) || [];
  const out = fam.filter((f) => f !== a);
  for (const c of AUX_CONFUSABLE[a] || []) if (!out.includes(c)) out.push(c);
  // modals: any two other modals are the live confusion (will/would, can/could)
  if (fam.length > 6) return [...out.slice(0, 3)];
  // keep two of the same family, then confusables
  const same = out.filter((f) => fam.includes(f)).slice(0, 2);
  const cross = out.filter((f) => !fam.includes(f));
  return [...same, ...cross];
}

/* ---- Verb-form gaps: "He is ____ in the park." -> run, ran, ranning — wrong
 * forms of the SAME verb, not another auxiliary (James, 2026-08-23). The
 * lemma is recovered from the answer: the irregular table first, then the
 * spelling rules run backwards. */
const NOT_VERBS = new Set(["morning", "evening", "thing", "something", "nothing", "anything", "everything",
  "during", "wedding", "building", "clothing", "ceiling", "king", "ring", "sing", "bring", "spring", "string",
  "wing", "swing", "meaning", "feeling", "meeting", "parking", "shopping", "need", "bed", "red", "feed", "seed",
  "indeed", "hundred", "this", "is", "his", "yes", "us", "bus", "plus", "was", "has", "does", "always", "sometimes",
  "perhaps", "news", "clothes", "glasses", "trousers", "jeans", "maths", "physics", "politics"]);

function lemmaOf(answer) {
  const a = key(answer);
  if (!/^[a-z]+$/.test(a) || NOT_VERBS.has(a) || AUX_ALL.has(a)) return null;
  for (const [base, forms] of Object.entries(IRREGULAR)) {
    if (a === base || forms.includes(a)) return base;
  }
  let stem = null;
  if (/ing$/.test(a) && a.length > 4) stem = a.slice(0, -3);
  else if (/ed$/.test(a) && a.length > 3) stem = a.slice(0, -2);
  else if (/ies$/.test(a)) return a.slice(0, -3) + "y";
  else if (/(s|sh|ch|x|z|o)es$/.test(a)) return a.slice(0, -2);
  else if (/s$/.test(a) && a.length > 3) return a.slice(0, -1);
  if (!stem) return null;
  if (/([^aeiou])\1$/.test(stem) && !/(ll|ss|ff|zz)$/.test(stem)) return stem.slice(0, -1); // running -> run
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(stem) || /[cgvz]$/.test(stem) || /[^aeiou]u$/.test(stem)) return stem + "e"; // making, dancing
  if (/i$/.test(stem) && /ed$/.test(a)) return stem.slice(0, -1) + "y"; // studied -> study
  return stem;
}

function verbFormDistractors(answer, gap, lemma) {
  const a = key(answer);
  const v = lemma;
  const irr = IRREGULAR[v] || null;
  const third = irr ? irr[0] : thirdPerson(v);
  const past = irr ? (irr.find((f) => !/(s|ing)$/.test(f)) || pastForm(v)) : pastForm(v);
  const ing = irr ? (irr.find((f) => /ing$/.test(f)) || ingForm(v)) : ingForm(v);
  // the malformed -ing a learner actually writes: ran -> ranning, make -> makeing, stop -> stoping
  const bad = [];
  if (irr && past && /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(past)) bad.push(past + past.slice(-1) + "ing");
  if (v + "ing" !== ing) bad.push(v + "ing");
  if (/ing$/.test(a)) return [v, past, ...bad, third, "to " + v];
  if (/ed$/.test(a) || a === past) return [v, ing, third, "was " + ing, ...bad];
  if (a === third) return [v, ing, past, "is " + ing];
  return [third, past, ing, ...bad];
}

/* Distractors take the answer's capitalisation — a lone capital at a
 * sentence-initial gap was giving the answer away. */
function matchCase(answer, s) {
  const a = String(answer), t = String(s);
  if (!a || !t) return t;
  if (/^I(\s|'|$)/.test(t)) return t;
  const up = /^[A-Z]/.test(a);
  return (up ? t.charAt(0).toUpperCase() : t.charAt(0).toLowerCase()) + t.slice(1);
}

/* Comparatives (James, a2_comparatives smoke): Quiz was offering bigger /
 * taller / smaller — vocabulary, not form. Options stay on THIS adjective:
 * correct · misspelling · more+comparative · wrong degree. Base in (brackets)
 * on the prompt so it is a cue, not a fourth vocab item. */
const CMP_IRREG = {
  better: "good",
  best: "good",
  worse: "bad",
  worst: "bad",
};
const CMP_SILENT_E = {
  saf: "safe",
  nic: "nice",
  lat: "late",
  wid: "wide",
  larg: "large",
  clos: "close",
  strang: "strange",
};

function comparativeLemma(it) {
  const ans = String(it.gap_answer || "").trim();
  const low = ans.toLowerCase();
  const mMore = /^(more|most|less)\s+(.+)/i.exec(ans);
  if (mMore) return mMore[2];
  if (low === "more" || low === "most" || low === "less") {
    const after = String(it.gap || "").match(/____\s+(\w+)/);
    return after ? after[1] : "";
  }
  if (CMP_IRREG[low]) return CMP_IRREG[low];
  if (/iest$/i.test(ans)) return ans.slice(0, -4) + "y";
  if (/ier$/i.test(ans)) return ans.slice(0, -3) + "y";
  if (/est$/i.test(ans)) {
    let s = ans.slice(0, -3);
    // bigger → big; keep ll (small/tall already end in double l).
    if (/(.)\1$/i.test(s) && !/ll$/i.test(s)) s = s.slice(0, -1);
    return CMP_SILENT_E[s.toLowerCase()] || s.toLowerCase();
  }
  if (/er$/i.test(ans)) {
    let s = ans.slice(0, -2);
    if (/(.)\1$/i.test(s) && !/ll$/i.test(s)) s = s.slice(0, -1);
    return CMP_SILENT_E[s.toLowerCase()] || s.toLowerCase();
  }
  return "";
}

function isComparativeAnswer(it) {
  const a = String(it.gap_answer || "").trim();
  if (/^(more|most|less)(\s|$)/i.test(a)) return true;
  if (/^(better|worse|best|worst)$/i.test(a)) return true;
  if (/(ier|iest|er|est)$/i.test(a) && comparativeLemma(it)) return true;
  return false;
}

function misspellComparative(form, lemma) {
  const f = String(form);
  if (/^(more|most|less)\s+/i.test(f)) {
    const adj = f.replace(/^(more|most|less)\s+/i, "");
    if (/ly$/i.test(adj)) return f.replace(/ly$/i, "ley");
    if (/e$/i.test(adj)) return f.replace(/e$/i, "er");
    return `${adj}er`;
  }
  if (/(.)\1(er|est)$/i.test(f)) return f.replace(/(.)\1(er|est)$/i, "$1$2");
  if (/ier$/i.test(f)) return f.replace(/ier$/i, "yer");
  if (/iest$/i.test(f)) return f.replace(/iest$/i, "yest");
  if (/er$/i.test(f) && lemma && lemma.length > 2) {
    // quiet → quiter (not quieer). Drop the vowel before the last consonant
    // on longer stems; short CVC keeps taler / fater.
    if (lemma.length >= 5) {
      return lemma.replace(/([aeiou])([^aeiouy])$/i, "$2") + "er";
    }
    return lemma.slice(0, -1) + "er";
  }
  if (/est$/i.test(f) && lemma && lemma.length > 2) {
    return lemma.slice(0, -1) + "est";
  }
  if (/^better$/i.test(f)) return "beter";
  if (/^worse$/i.test(f)) return "worser";
  if (/^worst$/i.test(f)) return "worstest";
  if (/^best$/i.test(f)) return "bestest";
  return "";
}

function doubleComparative(form, lemma) {
  const f = String(form);
  if (/^(more|most|less)\s+/i.test(f)) {
    const adj = f.replace(/^(more|most|less)\s+/i, "");
    const head = /^(most)/i.test(f) ? "most" : /^(less)/i.test(f) ? "more" : "more";
    if (/ly$/i.test(adj)) return `${head} ${adj}`;
    return `${head} ${adj}er`;
  }
  if (/(est)$/i.test(f) && !/^(best|worst)$/i.test(f)) return "more " + f;
  if (/^(best)$/i.test(f)) return "most best";
  if (/^(worst)$/i.test(f)) return "most worst";
  return "more " + f;
}

function wrongDegree(form, lemma) {
  const f = String(form);
  const m = /^(more|most|less)\s+(.+)/i.exec(f);
  if (m) {
    if (/^more$/i.test(m[1])) return "most " + m[2];
    if (/^most$/i.test(m[1])) return "more " + m[2];
    return "least " + m[2];
  }
  if (/^better$/i.test(f)) return "best";
  if (/^best$/i.test(f)) return "better";
  if (/^worse$/i.test(f)) return "worst";
  if (/^worst$/i.test(f)) return "worse";
  if (/ier$/i.test(f)) return f.slice(0, -3) + "iest";
  if (/iest$/i.test(f)) return f.slice(0, -4) + "ier";
  if (/er$/i.test(f)) return f.slice(0, -2) + "est";
  if (/est$/i.test(f)) return f.slice(0, -3) + "er";
  return lemma ? "more " + lemma : "";
}

function comparativeFormChoices(it) {
  if (!isComparativeAnswer(it)) return null;
  const answer = String(it.gap_answer || "").trim();
  const lemma = comparativeLemma(it);
  if (!lemma) return null;
  const opts = [answer];
  const seen = new Set([key(answer)]);
  for (const x of [
    misspellComparative(answer, lemma),
    doubleComparative(answer, lemma),
    wrongDegree(answer, lemma),
  ]) {
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    opts.push(x);
  }
  return opts.length >= 2 ? opts : null;
}

function simplePastOf(lemma) {
  if (lemma === "be") return "was";
  const irr = IRREGULAR[lemma];
  if (!irr) return pastForm(lemma);
  const hit = irr.find((f) => !/(s|ing)$/.test(f));
  return hit || pastForm(lemma);
}

function participleOf(lemma) {
  if (lemma === "be") return "been";
  const irr = IRREGULAR[lemma];
  if (!irr) return pastForm(lemma);
  const en = irr.find((f) => /n$/.test(f) && !/ing$/.test(f));
  if (en) return en;
  return simplePastOf(lemma);
}

/** Past simple vs present perfect — options are forms of THIS verb, not sibling vocab.
 *  Packs opt in with quiz_axis: "pp_vs_past" (James, 2026-08-26: saw/have seen/read/finished). */
function ppVsPastChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "pp_vs_past") return null;
  const lemma = String(it.lemma || cuedLemma(it.gap) || "").toLowerCase().trim();
  const answer = String(it.gap_answer || "").trim();
  if (!answer) return null;
  const ansKey = key(answer);
  const seen = new Set([ansKey]);
  const opts = [answer];
  const take = (x) => {
    const k = key(x);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(matchCase(answer, x));
  };

  const aux = ansKey.replace(/'/g, "'");
  const qPhrase = /^(did|have|has|was|were)\s+([a-z]+)\b/.exec(aux);
  if (qPhrase && lemma) {
    const subj = qPhrase[2];
    const past = simplePastOf(lemma);
    const pp = participleOf(lemma);
    if (lemma === "be") {
      take("was " + subj);
      take("were " + subj);
      take("have " + subj + " been");
      take("has " + subj + " been");
    } else {
      take("did " + subj + " " + lemma);
      take("have " + subj + " " + pp);
      take("has " + subj + " " + pp);
      take("did " + subj + " " + past);
      take("have " + subj + " " + lemma);
    }
    return opts.length >= 2 ? opts : null;
  }
  const negPhrase = /^(didn't|did not|haven't|have not|hasn't|has not)\s+/.test(aux);
  if (negPhrase) {
    if (!lemma) return null;
    const past = simplePastOf(lemma);
    const pp = participleOf(lemma);
    take("didn't " + lemma);
    take("haven't " + pp);
    take("hasn't " + pp);
    take("didn't " + past);
    take("haven't " + lemma);
    return opts.length >= 2 ? opts : null;
  }
  if (!lemma) return null;
  const past = simplePastOf(lemma);
  const pp = participleOf(lemma);
  take(past);
  take("have " + pp);
  take("has " + pp);
  if (past !== pp) {
    take(pp);
    if (lemma !== "be") take("have " + past);
  } else {
    take(lemma);
    if (lemma !== "have") take("have " + lemma);
    if (!/ed$/.test(lemma)) take("have " + lemma + "ed");
  }
  return opts.length >= 2 ? opts : null;
}

function gapPrompt(it, pack) {
  const g = String(it.gap || "");
  if (/\(.*\)\s*$/.test(g)) return g;
  if (isComparativeAnswer(it)) {
    const lemma = comparativeLemma(it);
    if (lemma) return g + " (" + lemma + ")";
  }
  /* PP vs past (James, 2026-08-26): Type/Quiz cue the base verb. */
  if (String(pack && pack.quiz_axis) === "pp_vs_past") {
    const lemma = String(it.lemma || "").trim();
    if (lemma) return g + " (" + lemma + ")";
  }
  return g;
}

/* some/any/no/every + body/one/thing/where. These behave as one closed family:
 * a quantifier can never stand where a compound stands, and vice versa. */
const COMPOUND_ANSWER = /^(any|some|no|every)(body|one|thing|where)$/;

function choicesFor(it, siblings, pack) {
  const answer = it.gap_answer;
  if (!key(answer)) return null;
  const answerIsCompound = COMPOUND_ANSWER.test(key(answer));

  if (Array.isArray(it.quiz_options) && it.quiz_options.length >= 2) {
    const seen = new Set();
    const opts = [];
    for (const o of it.quiz_options) {
      const k = key(o);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      opts.push(o);
    }
    if (opts.some((o) => key(o) === key(answer)) && opts.length >= 2) return opts;
    return null;
  }

  const formOpts = comparativeFormChoices(it);
  if (formOpts) return formOpts;

  const tenseOpts = ppVsPastChoices(it, pack);
  if (tenseOpts) return tenseOpts;

  const banned = acceptedKeys(it);
  const seen = new Set([key(answer)]);
  const distractors = [];

  // Forms of the cued verb first — they are the mistakes worth offering.
  const lemma = cuedLemma(it.gap);
  if (lemma) {
    for (const f of formsOf(lemma, it.gap)) {
      if (distractors.length >= 3) break;
      const k = key(f);
      if (!k || seen.has(k) || banned.has(k)) continue;
      seen.add(k);
      distractors.push(f);
    }
  }

  const take = (list) => {
    for (const f of list || []) {
      if (distractors.length >= 3) break;
      const k = key(f);
      if (!k || seen.has(k) || banned.has(k)) continue;
      seen.add(k);
      distractors.push(f);
    }
  };

  // Auxiliary gap: same family + the cross-family confusable (do for be, ...).
  // Modal packs: this unit's other modals first (must / should / mustn't),
  // not will / can / would from the giant aux family (James, a2_modals smoke).
  if (!lemma) {
    const aux = auxDistractors(answer);
    const sibsNow = siblings.map((s) => s.gap_answer);
    const ansIsModal = !!(aux && AUX_ALL.has(String(answer).toLowerCase().replace(/[’]/g, "'").trim()));
    if (ansIsModal) {
      const modalSibs = sibsNow.filter((s) => {
        const k = String(s || "").toLowerCase().replace(/[’]/g, "'").trim();
        return AUX_ALL.has(k);
      });
      take(modalSibs);
    }
    take(aux);
  }

  // Verb-form gap: wrong forms of the same verb. Single words only; in verb
  // packs any form, elsewhere only -ing / -ed (so plural nouns in article or
  // word-class packs keep their sibling distractors).
  if (!lemma && distractors.length < 3 && /^[A-Za-z]+$/.test(String(answer))) {
    const verbPack = /^G_V[PC]-/.test(String((pack && pack.codex_unit) || ""));
    const a = key(answer);
    if (verbPack || /(ing|ed)$/.test(a)) {
      const v = lemmaOf(answer);
      if (v && v !== a) take(verbFormDistractors(answer, it.gap, v));
    }
  }

  // Siblings, own family first. A pack with two slices (a2_quantifiers carries
  // quantifiers AND the neg+any slice) was handing "anywhere" the options
  // a lot / many / much — none can fit the frame, so the item fell to
  // elimination with no knowledge (James, smoke 2026-08-26). Compounds only
  // ever confuse other compounds; quantifiers only other quantifiers.
  const sibs = siblings.map((s) => s.gap_answer);
  const sameFamily = (s) => COMPOUND_ANSWER.test(key(s)) === answerIsCompound;
  take(sibs.filter(sameFamily));
  // Cross-family only to rescue an item that would otherwise be a coin flip
  // (a lone compound in a quantifier pack). A three-option item beats a
  // four-option one where the fourth gives the answer away.
  if (distractors.length < 2) take(sibs);
  if (!distractors.length) return null;
  return [answer, ...distractors.map((d) => matchCase(answer, d))];
}

/**
 * @param {object} pack raw RUE pack
 * @returns {object} pack with intro/match/quiz/type_items/use_items populated
 */
export function adaptGrammarPack(pack) {
  if (!pack || typeof pack !== "object") return pack;
  // Already in engine shape (or hand-authored that way) — leave it alone.
  if (!Array.isArray(pack.blocks) || !pack.blocks.length) return pack;

  const items = flatItems(pack);
  const cards = Array.isArray(pack.intro)
    ? pack.intro
    : Array.isArray(pack.intro?.cards)
      ? pack.intro.cards
      : [];

  // `check.sequence` lists the phases INSIDE Check (match / quiz) only.
  // `ladder` switches whole stages off (a1_word_classes is metalanguage —
  // no typed production).
  const seq = Array.isArray(pack.check?.sequence) ? pack.check.sequence : null;
  const ladder = pack.ladder || {};
  const wantsCheck = (phase) =>
    ladder[phase] !== false && (!seq || seq.includes(phase));
  const wants = (stage) => ladder[stage] !== false;

  const withGap = items.filter((it) => key(it.gap_answer) && it.gap);

  // A block's own check.sequence overrides the unit's for that block's items:
  // a quiz-only block must not leak into the Match pool (James, 2026-08-25 —
  // sentence-jobs items flooded the labels Match board off the screen).
  const blockSeq = {};
  for (const b of pack.blocks || []) {
    if (b && b.id && Array.isArray(b.check?.sequence)) blockSeq[b.id] = b.check.sequence;
  }
  const blockAllows = (it, phase) => {
    const s = blockSeq[it._block];
    return !s || s.includes(phase);
  };

  const match = wantsCheck("match")
    ? items
        .filter((it) => it.en && it.cz && blockAllows(it, "match"))
        .map((it) => ({ en: it.en, cz: it.cz, structures: it.structures, _block: it._block }))
    : [];

  const quiz = wantsCheck("quiz")
    ? withGap
        .filter((it) => blockAllows(it, "quiz"))
        .map((it) => {
          const choices = choicesFor(
            it,
            withGap.filter((s) => s !== it),
            pack,
          );
          if (!choices) return null;
          return {
            prompt: gapPrompt(it, pack),
            answer: it.gap_answer,
            choices,
            cz: it.cz,
            diagram: it.diagram || "",
            // Word-formation packs (2026-08-18): the capitalised root cue IS
            // the item — EN-only by James's ruling, no Czech anywhere.
            root: it.root,
            explanation: it.explanation,
            explanation_cz: it.explanation_cz,
            structures: it.structures,
            _block: it._block,
          };
        })
        .filter(Boolean)
    : [];

  /* Sort into bins (2026-08-26, James): classification, not matching. The
   * Match board was being used to put nouns into countable/uncountable, which
   * meant twelve tiles reading "countable" down one side — "you are not
   * really matching things here". Here the student drags each word into one
   * of `pack.bins` and checks at the end.
   * Items carry `bin`; the pack names the columns. */
  const sortbins = wantsCheck("sort_bins")
    ? items
        .filter((it) => it.bin && it.en && blockAllows(it, "sort_bins"))
        .map((it) => ({
          en: it.en,
          cz: it.cz,
          bin: it.bin,
          explanation: it.explanation,
          explanation_cz: it.explanation_cz,
          structures: it.structures,
          _block: it._block,
        }))
    : [];

  // Order-click: click tokens[] into the correct sequence, prompted by cz.
  // Items with fewer than 2 tokens can't be a real ordering task.
  const order = wantsCheck("order_click")
    ? items
        .filter((it) => Array.isArray(it.tokens) && it.tokens.length >= 2)
        .map((it) => ({
          cz: it.cz,
          tokens: it.tokens,
          answer:
            (Array.isArray(it.accepts) && it.accepts[0]) ||
            it.en ||
            it.tokens.join(" "),
          accepts:
            Array.isArray(it.accepts) && it.accepts.length
              ? it.accepts
              : [it.tokens.join(" ")],
          // Carried like quiz/type/use — this branch was the one that dropped
          // them, so a1_word_order (the only order_click pack) could not have
          // shown a reason even once authored.
          explanation: it.explanation,
          explanation_cz: it.explanation_cz,
          structures: it.structures,
          _block: it._block,
        }))
    : [];

  // Type: produce the missing form. Czech rides along as the hint so the
  // stage stays CZ→EN rather than a bare cloze.
  const type_items = (wants("type") ? withGap : []).map((it) => ({
    prompt: gapPrompt(it, pack),
    hint: it.cz,
    answer: it.gap_answer,
    accepts: it.gap_accepts || [],
    cz: it.cz,
    diagram: it.diagram || "",
    root: it.root,
    explanation: it.explanation,
    explanation_cz: it.explanation_cz,
    structures: it.structures,
    _block: it._block,
  }));

  // Use: whole-sentence production from the Czech. zero_article items (no
  // typed answer exists — the teaching point is the absent word) belong here
  // and nowhere else.
  /* use_mode: "correct" — the prompt is a WRONG English sentence and the student
   * fixes it, instead of translating from Czech (James, 2026-08-24). Two reasons:
   * he cannot smoke-test a Czech prompt (he does not read Czech), and free
   * translation from an ambiguous Czech sentence was the source of most of the
   * course's false wrongs. Items carrying no `wrong` have no realistic Czech
   * error, so they drop out of Use by design and are still drilled elsewhere.
   * The Czech stays on the item for the support line. */
  const fixMode = pack.use_mode === "correct";
  const use_items = (wants("use") ? items : [])
    .filter((it) => it.en && !(it.bin && !it.gap) && (fixMode ? it.wrong : it.cz))
    .map((it) => ({
      prompt: fixMode ? it.wrong : it.cz,
      wrong: it.wrong || "",
      answer: it.en,
      accepts: it.accepts || [],
      cz: it.cz,
      diagram: it.diagram || "",
      explanation: it.explanation,
      explanation_cz: it.explanation_cz,
      structures: it.structures,
      _block: it._block,
    }));

  return { ...pack, intro: cards, match, sortbins, quiz, order, type_items, use_items };
}

export { key as _normKey, choicesFor as _choicesFor, flatItems as _flatItems };
