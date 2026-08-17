/**
 * Freely interchangeable English words (James, 2026-08-17, from a lesson).
 *
 * "Ten klic je na stole" was answered only by "desk" while its neighbour
 * "Ta kniha je na stole" was answered by "table" — same Czech, same unit, one
 * marked wrong. data/senses.json fixed that class for BARE word prompts, but
 * the ambiguity usually sits inside a SENTENCE, where a bare-prompt rule
 * cannot reach.
 *
 * A sweep of every sentence found 221 ambiguous triples. Most depend on
 * context and MUST stay strict — sestra is sister or nurse, cena is price or
 * prize — so only genuine synonyms are widened here: two names for one thing,
 * right anywhere they appear. The list lives in codex/scripts/gen_senses.py.
 *
 * Implemented by canonicalising rather than expanding: each word maps to its
 * group's first member, so "the shop is closed" and "the store is closed"
 * become the same string and compare equal. Expanding every combination would
 * blow up on a sentence carrying several of them.
 */

/** word -> canonical form. Empty until app.js loads data/senses.json. */
let MAP = Object.create(null);

export function setSynonymMap(map) {
  MAP = map && typeof map === "object" ? map : Object.create(null);
}

export function hasSynonyms() {
  return Object.keys(MAP).length > 0;
}

/**
 * Replace every interchangeable word with its canonical form.
 * Input must already be normalised (lower case, punctuation stripped) — this
 * only swaps whole words, it does not tidy anything else.
 */
export function canonSynonyms(normalised) {
  if (!normalised) return normalised;
  const words = String(normalised).split(" ");
  const swapped = [];
  let touched = false;
  for (let i = 0; i < words.length; i++) {
    const c = MAP[words[i]];
    if (c && c !== words[i]) {
      words[i] = c;
      swapped.push(i);
      touched = true;
    }
  }
  if (!touched) return normalised;
  // A swap can strand the wrong indefinite: "an apartment" -> "an flat".
  // Repair a/an ONLY directly before a word we actually changed, so a silent-h
  // "an hour" elsewhere in the sentence is never touched.
  for (const i of swapped) {
    const prev = i > 0 ? words[i - 1] : null;
    if (prev === "a" || prev === "an") {
      words[i - 1] = /^[aeiou]/.test(words[i]) ? "an" : "a";
    }
  }
  return words.join(" ");
}
