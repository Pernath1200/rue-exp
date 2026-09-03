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

/** Drop a trailing teacher cue — "(as a patient)", "(in general)" — so the
 *  uncorrected English can be compared with accepts. */
function stripTeacherCue(s) {
  return String(s || "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

function useAcceptsWithoutWrong(accepts, wrong) {
  const bare = key(stripTeacherCue(wrong));
  if (!bare) return accepts.slice();
  return accepts.filter((a) => key(a) !== bare);
}

/** Linker Type: intro words are the target. Silent cousins still pass
 *  (James, 2026-08-28: omitted from the unit, not marked wrong). */
function linkerTypeAccepts(it) {
  const ans = String(it.gap_answer || "").trim();
  const out = [];
  const seen = new Set();
  const push = (x) => {
    const t = String(x || "").trim();
    if (!t) return;
    const k = key(t);
    if (!k || seen.has(k) || k === key(ans)) return;
    seen.add(k);
    out.push(t);
  };
  for (const x of it.gap_accepts || []) push(x);
  if (key(ans) === "but") {
    push("although");
    push("though");
    push("even though");
  }
  if (key(ans) === "although") {
    push("though");
    push("even though");
  }
  if (key(ans) === "however") push("On the other hand");
  if (key(ans) === "because") {
    push("as");
    push("since");
  }
  if (key(ans) === "because of") push("due to");
  if (key(ans) === "so that") {
    push("so");
    push("in order that");
  }
  if (key(ans) === "too") push("as well");
  if (key(ans) === "despite") push("in spite of");
  if (key(ans) === "in spite of") push("despite");
  if (key(ans) === "when") push("after");
  if (key(ans) === "after") push("when");
  return out;
}

/** Type must not be “always that”. Quiz already dropped that as a free chip.
 *  Keep that in Type only when it is the written answer, or when/why (taught). */
function relativeTypeAccepts(it, pack) {
  if (String(pack && pack.quiz_axis) === "linkers") return linkerTypeAccepts(it);
  const raw = [it.gap_answer, ...(it.gap_accepts || [])].filter(Boolean);
  if (String(pack && pack.quiz_axis) !== "relative") return it.gap_accepts || [];
  const ans = String(it.gap_answer || "").trim().toLowerCase();
  /* Some thats, not most: only when the gap is that, or when/why (taught).
   * who/which Type wants who or which. (James, 2026-08-28.) */
  const allowThat = ans === "that" || ans === "when" || ans === "why";
  const out = [];
  const seen = new Set();
  for (const x of raw) {
    if (!allowThat && String(x).trim().toLowerCase() === "that") continue;
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function fillRelativeGap(it, word) {
  const g = String(it.gap || "");
  const w = String(word || "").trim();
  if (!w || !/_{2,}/.test(g)) return "";
  return g.replace(/_{2,}/, w);
}

/** Use: only a few items should accept that (the ones whose gap is that).
 *  who/which items must not be passable with that every time. */
function relativeUseAnswer(it) {
  const w = String(it.gap_answer || "").trim();
  if (w && w.toLowerCase() !== "that") {
    const filled = fillRelativeGap(it, w);
    if (filled) return filled;
  }
  return it.en;
}

function relativeUseAccepts(it) {
  const w = String(it.gap_answer || "").trim().toLowerCase();
  const allowThat = w === "that";
  const primary = relativeUseAnswer(it);
  let forms = [primary, it.en, ...(it.accepts || [])].filter(Boolean);
  if (!allowThat) {
    const thatSent = fillRelativeGap(it, "that");
    forms = forms.filter((s) => !thatSent || key(s) !== key(thatSent));
  }
  return relativeDropAccepts(forms);
}

/** Object relatives may drop who/which/that/when/why. Never drop where. */
function relativeDropAccepts(accepts) {
  const out = [];
  for (const s of accepts || []) {
    out.push(s);
    const d = String(s)
      .replace(/\s+\b(who|which|that|when|why)\s+(?=(I|you|he|she|we|they)\b)/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim();
    if (d && d !== s) out.push(d);
  }
  return [...new Set(out)];
}

function capFirst(s) {
  const t = String(s || "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function lowerFirst(s) {
  const t = String(s || "").trim();
  if (!t) return t;
  if (/^I\b/.test(t)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function splitJoin(join) {
  const raw = String(join || "").trim();
  const m = raw.match(/^(.+?[.?!])\s+(.+)$/);
  if (!m) return null;
  const strip = (s) => s.replace(/[.?!]+$/g, "").trim();
  const a = strip(m[1]);
  const b = strip(m[2]);
  if (!a || !b) return null;
  return { a, b };
}

function thereWasNoun(s) {
  const m = String(s || "").match(/^There (?:was|were) (.+)$/i);
  return m ? m[1].trim() : "";
}

function linkerKind(answer) {
  const a = String(answer || "").trim().toLowerCase();
  if (
    ["although", "though", "even though", "however", "but", "on the other hand"].includes(
      a,
    )
  ) {
    return "contrast";
  }
  if (["despite", "in spite of"].includes(a)) return "contrast_np";
  if (["so", "therefore"].includes(a)) return "result";
  if (["because", "as", "since"].includes(a)) return "reason";
  if (["because of", "due to"].includes(a)) return "reason_np";
  if (a === "so that") return "purpose";
  if (["and", "also", "too"].includes(a)) return "addition";
  if (["when", "after", "then", "before"].includes(a)) return "time";
  return "";
}

/** Same-job joins from the two-clause prompt (James, 2026-08-28 smoke:
 *  but/although/however, because/so/so that, because of + clause). */
function pushContrastJoins(push, a, b) {
  const la = lowerFirst(a);
  const lb = lowerFirst(b);
  push(`Although ${la}, ${lb}.`);
  push(`Even though ${la}, ${lb}.`);
  push(`Though ${la}, ${lb}.`);
  push(`${a}, but ${lb}.`);
  push(`${a} but ${lb}.`);
  push(`${a}. However, ${lb}.`);
  push(`${a}. On the other hand, ${lb}.`);
  push(`${capFirst(b)} although ${la}.`);
  push(`${capFirst(b)} even though ${la}.`);
  push(`${capFirst(b)} though ${la}.`);
  const subjA = a.match(/^(I|You|He|She|We|They|It)\s+(?:am|is|are|was|were)\s+/i);
  const subjB = b.match(
    /^(I|You|He|She|We|They|It)\s+(?:am|is|are|was|were)\s+(.+)$/i,
  );
  if (
    subjA &&
    subjB &&
    subjA[1].toLowerCase() === subjB[1].toLowerCase()
  ) {
    push(`${a} but ${subjB[2]}.`);
    push(`${a}, but ${subjB[2]}.`);
  }
}

function nounForms(noun) {
  const n = String(noun || "").trim();
  if (!n) return [];
  const bare = n.replace(/^(the|a|an)\s+/i, "");
  return [...new Set([n, bare, `the ${bare}`].filter(Boolean))];
}

function pushBecauseOfNoun(push, noun, result) {
  const lr = lowerFirst(result);
  for (const f of nounForms(noun)) {
    push(`Because of ${f}, ${lr}.`);
    push(`Due to ${f}, ${lr}.`);
    push(`${result} because of ${f}.`);
    push(`${result} due to ${f}.`);
  }
}

function pushDespiteNoun(push, noun, result) {
  const lr = lowerFirst(result);
  for (const f of nounForms(noun)) {
    push(`Despite ${f}, ${lr}.`);
    push(`In spite of ${f}, ${lr}.`);
    push(`${result} despite ${f}.`);
    push(`${result} in spite of ${f}.`);
  }
}

function pushCausalJoins(push, reason, result) {
  const lr = lowerFirst(result);
  const lrsn = lowerFirst(reason);
  push(`${result} because ${lrsn}.`);
  push(`${result} as ${lrsn}.`);
  push(`${result} since ${lrsn}.`);
  push(`Because ${lrsn}, ${lr}.`);
  push(`As ${lrsn}, ${lr}.`);
  push(`Since ${lrsn}, ${lr}.`);
  push(`${reason}, so ${lr}.`);
  push(`${reason}. So ${lr}.`);
  push(`${reason}. Therefore, ${lr}.`);
  const noun = thereWasNoun(reason);
  if (noun) pushBecauseOfNoun(push, noun, result);
}

function pushAdditionJoins(push, a, b) {
  const lb = lowerFirst(b);
  push(`${a.replace(/\.?$/, "")} and ${lb}.`);
  const left = a.match(
    /^(I|You|He|She|We|They|It)\s+(like|likes|bought|plays|play|speaks|speak)\s+(.+)$/i,
  );
  const right = b.match(
    /^(I|You|He|She|We|They|It)\s+(like|likes|bought|plays|play|speaks|speak)\s+(.+)$/i,
  );
  if (
    left &&
    right &&
    left[1].toLowerCase() === right[1].toLowerCase() &&
    left[2].toLowerCase() === right[2].toLowerCase()
  ) {
    push(`${left[1]} ${left[2]} ${left[3].replace(/\.?$/, "")} and ${right[3]}.`);
  }
  const subj = b.match(/^(I|You|He|She|We|They|It)\s+(.+)$/i);
  if (subj) {
    push(`${a.replace(/\.?$/, "")}. ${subj[1]} also ${subj[2]}.`);
    push(`${a.replace(/\.?$/, "")}. ${capFirst(b.replace(/\.?$/, ""))}, too.`);
    push(`${a.replace(/\.?$/, "")}. ${capFirst(b.replace(/\.?$/, ""))} as well.`);
  }
}

function pushTimeJoins(push, a, b) {
  const la = lowerFirst(a);
  const lb = lowerFirst(b);
  push(`When ${la}, ${lb}.`);
  push(`${capFirst(b)} when ${la}.`);
  push(`After ${la}, ${lb}.`);
  push(`${capFirst(b)} after ${la}.`);
  push(`${a.replace(/\.?$/, "")}. Then ${lb}.`);
  push(`${a.replace(/\.?$/, "")}, then ${lb}.`);
}

function pushPurposeJoins(push, a, b) {
  const lb = lowerFirst(b);
  push(`${a} because ${lb}.`);
  push(`${a} in order that ${lb}.`);
  const wanted = b.match(/\bwanted to (.+)$/i);
  if (wanted) {
    const v = wanted[1].trim();
    push(`${a} so that we would ${v}.`);
    push(`${a} so that we could ${v}.`);
    push(`${a} so we would ${v}.`);
    push(`${a} so we could ${v}.`);
    push(`${a} so that I would ${v}.`);
    push(`${a} so that I could ${v}.`);
  }
  if (/\b(will|would|can|could|do not|don't|does not)\b/i.test(b)) {
    push(`${a} so that ${lb}.`);
    push(`${a} so ${lb}.`);
  }
}

/** Linker Use join: same-job word order AND same-job linker (although/but/
 *  however · because/so/so that). Authored en stays the shown answer. */
function linkerUseAccepts(it) {
  const out = [];
  const seen = new Set();
  const push = (s) => {
    const t = String(s || "").replace(/\s+/g, " ").trim();
    if (!t) return;
    const k = key(t);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  push(it.en);
  for (const a of it.accepts || []) push(a);

  const pair = splitJoin(it.join);
  const kind = linkerKind(it.gap_answer);
  if (pair) {
    const { a, b } = pair;
    if (kind === "contrast" || kind === "contrast_np") {
      pushContrastJoins(push, a, b);
      const noun = thereWasNoun(a) || thereWasNoun(b);
      const result = thereWasNoun(a) ? b : a;
      if (kind === "contrast_np" && noun) pushDespiteNoun(push, noun, result);
    } else if (kind === "result") {
      pushCausalJoins(push, a, b);
    } else if (kind === "reason") {
      pushCausalJoins(push, b, a);
    } else if (kind === "reason_np") {
      if (thereWasNoun(a) && !thereWasNoun(b)) pushCausalJoins(push, a, b);
      else if (thereWasNoun(b) && !thereWasNoun(a)) pushCausalJoins(push, b, a);
      else pushCausalJoins(push, a, b);
    } else if (kind === "purpose") {
      pushPurposeJoins(push, a, b);
    } else if (kind === "addition") {
      pushAdditionJoins(push, a, b);
    } else if (kind === "time") {
      pushTimeJoins(push, a, b);
    }
  }

  const FRONT =
    /^(Although|Even though|Though|Despite|In spite of|Because of|Due to)\s+(.+?),\s+(.+?)\.?$/i;
  for (const s of out.slice()) {
    const m = String(s).match(FRONT);
    if (!m) continue;
    const linker = String(m[1]).toLowerCase();
    const dep = m[2].trim();
    const main = m[3].trim().replace(/[.?!]+$/, "");
    push(`${capFirst(main)} ${linker} ${dep}.`);
  }

  const REASON = /^(.+?)\s+(because(?!\s+of)|as|since)\s+(.+?)\.?$/i;
  for (const s of out.slice()) {
    const m = String(s).match(REASON);
    if (!m) continue;
    const main = m[1].trim().replace(/[.,;:]+$/, "");
    if (
      /^(although|even though|though|because|as|since|despite|however|so)\b/i.test(
        main,
      )
    ) {
      continue;
    }
    const linker = m[2];
    const dep = m[3].trim().replace(/[.?!]+$/, "");
    push(`${capFirst(linker)} ${dep}, ${lowerFirst(main)}.`);
  }
  return out;
}

function joinUseAnswer(it, pack) {
  if (String(pack && pack.quiz_axis) === "relative") return relativeUseAnswer(it);
  return it.en;
}

function joinUseAccepts(it, pack) {
  if (String(pack && pack.quiz_axis) === "relative") return relativeUseAccepts(it);
  if (String(pack && pack.quiz_axis) === "linkers") return linkerUseAccepts(it);
  const out = [];
  const seen = new Set();
  for (const s of [it.en, ...(it.accepts || [])]) {
    const t = String(s || "").trim();
    const k = key(t);
    if (!t || !k || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
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
  grow: ["grows", "grew", "grown", "growing"],
  steal: ["steals", "stole", "stolen", "stealing"],
  teach: ["teaches", "taught", "taught", "teaching"],
  build: ["builds", "built", "built", "building"],
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
  /* Closed-class -er words are not comparatives. her → lemma "h" was
   * offering "more her / hest" on a1_possessives (James, 2026-08-29). */
  if (
    /^(her|after|never|over|under|other|either|neither|whether|former|per|ever|together|however|therefore|moreover|nevertheless|whatever|whenever|wherever)$/i.test(
      a,
    )
  ) {
    return false;
  }
  if (/^(more|most|less)(\s|$)/i.test(a)) return true;
  if (/^(better|worse|best|worst)$/i.test(a)) return true;
  const lemma = comparativeLemma(it);
  if (/(ier|iest|er|est)$/i.test(a) && lemma && lemma.length >= 2) return true;
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

/** Articles Quiz: a / an / the / — or this noun with those articles.
 *  Sibling gap-answers were other nouns (school / hospital) — vocabulary,
 *  not articles (James, 2026-08-28, b1_articles_advanced). */
function articleFormChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "articles") return null;
  const answer = String(it.gap_answer ?? "").trim();
  if (!answer) return null;
  const al = answer.toLowerCase();
  const seen = new Set();
  const opts = [];
  const take = (x) => {
    const k = key(x);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(x);
  };
  if (al === "a" || al === "an" || al === "the" || answer === "—" || al === "—") {
    /* Always lowercase chips — "The" at the start of a stem made the
     * item guessable from capitalisation (James, 2026-08-28). */
    take("a");
    take("an");
    take("the");
    take("—");
    return opts.length >= 2 ? opts : null;
  }
  const np = /^(a|an|the)\s+(.+)$/i.exec(answer);
  if (np) {
    const noun = np[2];
    take("a " + noun);
    take("an " + noun);
    take("the " + noun);
    take(noun);
    return opts.length >= 2 ? opts : null;
  }
  take(answer);
  take("the " + answer);
  const vowel = /^[aeiou]/i.test(answer);
  take((vowel ? "an " : "a ") + answer);
  take((vowel ? "a " : "an ") + answer);
  return opts.length >= 2 ? opts : null;
}

/** *Important is to…* — Czech adjective-first order (James, 2026-08-28). */
function itAdjFront(answer) {
  const m = String(answer).match(/^it\s+(is|was)\s+(.+)$/i);
  if (!m) return "";
  const be = m[1].toLowerCase();
  const rest = m[2].trim();
  if (/^(a|an|the)\s/i.test(rest)) return "";
  if (/^(no use|worth)\b/i.test(rest)) return "";
  const that = /\s+that$/i.test(rest);
  const adj = rest.replace(/\s+that$/i, "").trim();
  if (!/^[a-z]+$/i.test(adj)) return "";
  const front = adj.charAt(0).toUpperCase() + adj.slice(1).toLowerCase();
  return that ? `${front} ${be} that` : `${front} ${be}`;
}

/** Introductory-it Quiz: dummy it, not sibling adjectives / fake verb forms.
 *  Czech has no subject here — chips are the live mistakes: adjective-first
 *  (*Illegal is…*) · drop it · there for it. (James, 2026-08-28.) */
function itSubjectChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "it_subject") return null;
  const answer = String(it.gap_answer || "").trim();
  if (!/^it\b/i.test(answer)) return null;

  const opts = [];
  const seen = new Set();
  const take = (x) => {
    const k = key(x);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(matchCase(answer, x));
  };

  take(answer);
  const front = itAdjFront(answer);
  if (front) take(front);

  const dropped = answer.replace(/^it's\s+/i, "").replace(/^it\s+/i, "");
  if (dropped) take(dropped);

  const there = /^it's\b/i.test(answer)
    ? answer.replace(/^it's/i, "There's")
    : answer.replace(/^it\b/i, "There");
  take(there);

  const noBe = dropped.replace(/^(is|was|are|were|'s)\s+/i, "").trim();
  if (noBe) take(noBe);

  if (opts.length < 4) {
    const agr = answer
      .replace(/\bdoesn't\b/i, "don't")
      .replace(/\bseems\b/i, "seem")
      .replace(/\bappears\b/i, "appear")
      .replace(/\btakes\b/i, "take")
      .replace(/\bcosts\b/i, "cost")
      .replace(/\blooks\b/i, "look")
      .replace(/\bfeels\b/i, "feel")
      .replace(/\bsurprised\b/i, "surprise");
    if (key(agr) !== key(answer)) take(agr);
  }
  if (opts.length < 4 && dropped) take("This " + dropped);

  return opts.length >= 2 ? opts : null;
}

/** Relative-clause Quiz: who / which / that / where / when / why.
 *  Distractors are the intro errors: what, who/which swap, how after the way.
 *  (James, 2026-08-28, b1_relative_clauses.) */
function relativeFormChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "relative") return null;
  const answer = String(it.gap_answer || "").trim().toLowerCase();
  if (!answer) return null;
  const gap = String(it.gap || "");
  const opts = [];
  const seen = new Set();
  const take = (x) => {
    const t = String(x || "").trim().toLowerCase();
    const k = key(t);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(t);
  };
  take(answer);
  /* `that` is a valid defining relative for who/which/when/why. If it sits
   * on the chip row AND in gap_accepts, every item is "click that". Keep it
   * as a chip only when it is the authored answer, or a real error (where).
   * Type/Use still accept it. (James, 2026-08-28.) */
  const banned = acceptedKeys(it);
  const takeWrong = (x) => {
    if (banned.has(key(x))) return;
    take(x);
  };
  if (/\bway\s+_{2,}/i.test(gap) || /\bway ____/i.test(gap)) {
    takeWrong("how");
    takeWrong("what");
    takeWrong("which");
    takeWrong("who");
    return opts.length >= 2 ? opts : null;
  }
  takeWrong("what");
  if (answer === "who") {
    takeWrong("which");
    takeWrong("where");
  } else if (answer === "which") {
    takeWrong("who");
    takeWrong("where");
  } else if (answer === "that") {
    takeWrong("who");
    takeWrong("which");
  } else if (answer === "where") {
    takeWrong("that");
    takeWrong("which");
  } else if (answer === "when" || answer === "why") {
    takeWrong("who");
    takeWrong("which");
  }
  if (opts.length < 4) takeWrong("where");
  return opts.length >= 2 ? opts : null;
}

/** Linker Quiz: same-job confusions, never a valid cousin as a wrong chip.
 *  because vs because of; although vs however; so vs therefore vs so that.
 *  (James, 2026-08-28, b1_linkers.) */
const LINKER_CONFUSIONS = {
  so: ["because", "although", "therefore"],
  therefore: ["however", "because", "although"],
  because: ["because of", "so", "although"],
  "because of": ["because", "despite", "so"],
  although: ["however", "because", "so"],
  though: ["however", "because", "so"],
  "even though": ["however", "because", "so"],
  however: ["although", "therefore", "because"],
  but: ["although", "so", "however"],
  "so that": ["so", "because", "although"],
  despite: ["although", "because of", "however"],
  "in spite of": ["although", "because of", "despite"],
  "on the other hand": ["however", "although", "because"],
  and: ["but", "so", "because"],
  also: ["too", "and", "but"],
  too: ["also", "and", "so"],
  when: ["after", "because", "so"],
  after: ["when", "because", "then"],
  then: ["so", "when", "after"],
};
const LINKER_FILL = [
  "because",
  "so",
  "although",
  "however",
  "but",
  "therefore",
  "and",
  "when",
];

const DEP_PREP_FAMILY = [
  "in",
  "at",
  "on",
  "for",
  "of",
  "to",
  "about",
  "with",
  "from",
];
/* Czech-shaped traps first, then the rest of the family.
 * Silent cousins (gap_accepts) are banned — not a free chip (James, linkers). */
const DEP_PREP_TRAPS = {
  in: ["about", "on", "at"],
  at: ["in", "on", "to"],
  on: ["of", "in", "at"],
  for: ["to", "of", "at"],
  of: ["from", "for", "about"],
  to: ["for", "at", "with"],
  about: ["of", "for", "with"],
  with: ["about", "to", "at"],
  from: ["of", "to", "with"],
};

function depPrepChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "dependent_prep") return null;
  const answer = String(it.gap_answer || "").trim();
  if (!answer || answer === "—") return null;
  const opts = [];
  const seen = new Set();
  const banned = acceptedKeys(it);
  const take = (x) => {
    const t = String(x || "").trim();
    if (!t || t === "—") return;
    const k = key(t);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(t);
  };
  const takeWrong = (x) => {
    if (banned.has(key(x))) return;
    take(x);
  };
  take(answer);
  for (const x of DEP_PREP_TRAPS[answer.toLowerCase()] || []) takeWrong(x);
  for (const x of DEP_PREP_FAMILY) takeWrong(x);
  return opts.length >= 2 ? opts : null;
}

function linkerFormChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "linkers") return null;
  const answer = String(it.gap_answer || "").trim();
  if (!answer) return null;
  const opts = [];
  const seen = new Set();
  const banned = acceptedKeys(it);
  const take = (x) => {
    const t = String(x || "").trim();
    if (!t) return;
    const k = key(t);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(matchCase(answer, t));
  };
  const takeWrong = (x) => {
    if (banned.has(key(x))) return;
    take(x);
  };
  take(answer);
  const fam = LINKER_CONFUSIONS[answer.toLowerCase()] || [];
  for (const x of fam) takeWrong(x);
  for (const x of LINKER_FILL) takeWrong(x);
  return opts.length >= 2 ? opts : null;
}

/** Passive Quiz: form of THIS verb only (James, 2026-08-28 smoke).
 *  Four chips: correct be+pp · swapped number · be+bare lemma · participle alone.
 *  Gap answer must be `is/are/was/were/be + pp` (subject stays in the stem). */
function passiveBeChoices(it, pack) {
  if (String(pack && pack.quiz_axis) !== "passive") return null;
  const lemma = String(it.lemma || cuedLemma(it.gap) || "").toLowerCase().trim();
  const answer = String(it.gap_answer || "").trim();
  if (!lemma || !answer) return null;
  const m = key(answer).match(/^(is|are|was|were|be)\s+(\S+)$/);
  if (!m) return null;
  const be = m[1];
  const pp = m[2];
  const swap = { is: "are", are: "is", was: "were", were: "was", be: "is" };
  const seen = new Set([key(answer)]);
  const opts = [answer];
  const take = (x) => {
    const k = key(x);
    if (!k || seen.has(k) || opts.length >= 4) return;
    seen.add(k);
    opts.push(matchCase(answer, x));
  };
  take(swap[be] + " " + pp);
  take(be + " " + lemma);
  take(pp);
  return opts.length >= 2 ? opts : null;
}

function gapPrompt(it, pack) {
  const g = String(it.gap || "");
  if (/\(.*\)\s*$/.test(g)) return g;
  /* Word-formation already shows the capitalised root. Do not also glue on a
   * comparative lemma: user → (us), helper → (help), teacher → (teach). */
  if (pack && pack.kind === "word_formation") return g;
  if (isComparativeAnswer(it)) {
    const lemma = comparativeLemma(it);
    if (lemma) return g + " (" + lemma + ")";
  }
  /* PP vs past (James, 2026-08-26): Type/Quiz cue the base verb. */
  if (pack && (pack.quiz_axis === "pp_vs_past" || pack.quiz_axis === "passive")) {
    const lemma = String(it.lemma || "").trim();
    if (lemma) return g + " (" + lemma + ")";
  }
  return g;
}

/* some/any/no/every + body/one/thing/where. These behave as one closed family:
 * a quantifier can never stand where a compound stands, and vice versa. */
const COMPOUND_ANSWER = /^(any|some|no|every)(body|one|thing|where)$/;

function choicesFor(it, siblings, pack) {
  const sentenceMode = pack && String(pack.quiz_axis) === "sentence";
  const answer = sentenceMode ? it.en : it.gap_answer;
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

  const formOpts =
    !pack?.quiz_axis || pack.quiz_axis === "comparatives"
      ? comparativeFormChoices(it)
      : null;
  if (formOpts) return formOpts;

  const tenseOpts = ppVsPastChoices(it, pack);
  if (tenseOpts) return tenseOpts;

  const passOpts = passiveBeChoices(it, pack);
  if (passOpts) return passOpts;

  const artOpts = articleFormChoices(it, pack);
  if (artOpts) return artOpts;

  const itOpts = itSubjectChoices(it, pack);
  if (itOpts) return itOpts;

  const relOpts = relativeFormChoices(it, pack);
  if (relOpts) return relOpts;

  const linkOpts = linkerFormChoices(it, pack);
  if (linkOpts) return linkOpts;

  const depOpts = depPrepChoices(it, pack);
  if (depOpts) return depOpts;

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
  // Anywhere else (reported speech, …) sibling aux is vocab — had must offer
  // have / has, not was / could / would (James, b1_reported_speech 2026-08-30).
  if (!lemma) {
    const aux = auxDistractors(answer);
    const sibsNow = siblings.map((s) => s.gap_answer);
    const ansIsModal = !!(aux && AUX_ALL.has(String(answer).toLowerCase().replace(/[’]/g, "'").trim()));
    const modalPack = /modal/i.test(String((pack && pack.id) || "")) ||
      /modal/i.test(String((pack && pack.title) || ""));
    if (ansIsModal && modalPack) {
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
        .filter((it) => it.en && (it.lemma || it.cz) && blockAllows(it, "match"))
        .map((it) => {
          /* Lemma → preposition board (James, 2026-08-28, dependent preps):
           * left is the adjective/verb, right is the prep. Not Czech. */
          if (it.lemma && it.gap_answer) {
            return {
              en: it.lemma,
              cz: String(it.gap_answer),
              structures: it.structures,
              _block: it._block,
            };
          }
          /* Prefix/suffix job board: lemma is the affix, cz is the meaning
           * card. `en` can be a legal sentence for the audit pool. */
          if (it.lemma && !it.gap) {
            return {
              en: it.lemma,
              cz: String(it.cz || ""),
              structures: it.structures,
              _block: it._block,
            };
          }
          return {
            en: it.match_en || it.en,
            cz: it.cz,
            structures: it.structures,
            _block: it._block,
          };
        })
    : [];

  const quiz = wantsCheck("quiz")
    ? withGap
        .filter((it) => blockAllows(it, "quiz"))
        .map((it) => {
          const sentenceMode = String(pack.quiz_axis) === "sentence";
          const choices = choicesFor(
            it,
            withGap.filter((s) => s !== it),
            pack,
          );
          if (!choices) return null;
          let quizAnswer = it.gap_answer;
          if (sentenceMode) {
            quizAnswer = it.en;
          } else if (String(pack.quiz_axis) === "articles") {
            const raw = String(it.gap_answer || "").trim();
            const al = raw.toLowerCase();
            const np = /^(a|an|the)\s+(.+)$/i.exec(raw);
            if (al === "a" || al === "an" || al === "the") quizAnswer = al;
            else if (np) quizAnswer = np[1].toLowerCase() + " " + np[2];
          }
          return {
            prompt: sentenceMode
              ? (it.quiz_prompt || "Which is correct?")
              : gapPrompt(it, pack),
            answer: quizAnswer,
            choices,
            accepts: sentenceMode ? [] : (it.gap_accepts || []),
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
          /* Sentence-sort chips (b1_word_order_fronting): Czech on the
           * same line overflows the column. Pack sets sort_cz: false. */
          cz: pack.sort_cz === false ? "" : it.cz,
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
  const type_items = (wants("type") ? withGap : [])
    .filter((it) => it.type !== false)
    .map((it) => ({
      prompt: gapPrompt(it, pack),
      hint: it.cz,
      answer: it.gap_answer,
      accepts: relativeTypeAccepts(it, pack),
      zero_article: !!it.zero_article,
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
  const voiceMode = pack.use_mode === "voice";
  const joinMode = pack.use_mode === "join";
  const openMode = pack.use_mode === "open";
  const rewriteMode = pack.use_mode === "rewrite";
  const use_items = !(wants("use") ? items : []).length
    ? []
    : openMode
      ? items
          .filter(
            (it) =>
              it.use !== false &&
              it.en &&
              (it.use_prompt || it.prompt),
          )
          .map((it) => ({
            prompt: it.use_prompt || it.prompt,
            sample: it.en,
            answer: it.en,
            accepts: it.accepts || [],
            open: true,
            hint: it.cz || "",
            cz: it.cz || "",
            targets: it.targets || it.lemmas || [],
            explanation: it.explanation,
            explanation_cz: it.explanation_cz,
            structures: it.structures,
            _block: it._block,
          }))
    : rewriteMode
      ? items
          .filter((it) => it.en && it.rewrite && it.use !== false)
          .map((it) => ({
            prompt: it.rewrite,
            wrong: "",
            answer: it.en,
            accepts: it.accepts || [],
            hint:
              pack.use_hint ||
              "Change one word so the sentence means the opposite.",
            no_prefix: it.no_prefix || [],
            cz: it.cz || "",
            diagram: it.diagram || "",
            explanation: it.explanation,
            explanation_cz: it.explanation_cz,
            structures: it.structures,
            _block: it._block,
          }))
    : joinMode
      ? items
          .filter((it) => it.en && it.join)
          .map((it) => ({
            prompt: it.join,
            wrong: "",
            answer: joinUseAnswer(it, pack),
            accepts: joinUseAccepts(it, pack),
            hint: "Join into one sentence.",
            cz: it.cz || "",
            diagram: it.diagram || "",
            explanation: it.explanation,
            explanation_cz: it.explanation_cz,
            structures: it.structures,
            _block: it._block,
          }))
    : voiceMode
      ? items
          .filter((it) => it.en && it.active)
          .flatMap((it) => {
            const passive = it.en;
            const active = it.active;
            const passAcc = it.accepts && it.accepts.length ? it.accepts : [passive];
            const actAcc =
              it.active_accepts && it.active_accepts.length
                ? it.active_accepts
                : [active];
            const row = (prompt, answer, accepts, hint) => ({
              prompt,
              wrong: "",
              answer,
              accepts,
              hint,
              cz: "",
              diagram: it.diagram || "",
              explanation: it.explanation,
              explanation_cz: it.explanation_cz,
              structures: it.structures,
              _block: it._block,
            });
            return [
              row(active, passive, passAcc, "Make this passive."),
              row(passive, active, actAcc, "Make this active."),
            ];
          })
      : items
          /* Early A1 (James, 2026-08-28, a1_be_have): Match/Quiz may show a
           * carrier word the path has not taught yet (Czech is on screen).
           * Use is production — skip items marked use: false. */
          .filter((it) => it.en && !(it.bin && !it.gap) && it.use !== false && (fixMode ? it.wrong : it.cz))
          .map((it) => ({
            prompt: fixMode ? it.wrong : it.cz,
            wrong: it.wrong || "",
            answer: it.en,
            /* Never accept the uncorrected prompt. Type can allow AmE
             * "in the hospital"; Use's wrong IS that form (plus a teacher
             * cue), so the same accept would mark "no change" as right. */
            accepts: fixMode
              ? useAcceptsWithoutWrong(it.accepts || [], it.wrong)
              : it.accepts || [],
            zero_article: !!it.zero_article,
            cz: it.cz,
            diagram: it.diagram || "",
            explanation: it.explanation,
            explanation_cz: it.explanation_cz,
            structures: it.structures,
            no_prefix: it.no_prefix || [],
            _block: it._block,
          }));

  return { ...pack, intro: cards, match, sortbins, quiz, order, type_items, use_items };
}

export { key as _normKey, choicesFor as _choicesFor, flatItems as _flatItems };
