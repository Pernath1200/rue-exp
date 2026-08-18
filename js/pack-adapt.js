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
  return String(s == null ? "" : s)
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
function choicesFor(it, siblings) {
  const answer = it.gap_answer;
  if (!key(answer)) return null;

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

  const banned = acceptedKeys(it);
  const seen = new Set([key(answer)]);
  const distractors = [];
  for (const s of siblings) {
    if (distractors.length >= 3) break;
    const cand = s.gap_answer;
    const k = key(cand);
    if (!k || seen.has(k) || banned.has(k)) continue;
    seen.add(k);
    distractors.push(cand);
  }
  if (!distractors.length) return null;
  return [answer, ...distractors];
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

  const match = wantsCheck("match")
    ? items
        .filter((it) => it.en && it.cz)
        .map((it) => ({ en: it.en, cz: it.cz, structures: it.structures, _block: it._block }))
    : [];

  const quiz = wantsCheck("quiz")
    ? withGap
        .map((it) => {
          const choices = choicesFor(
            it,
            withGap.filter((s) => s !== it),
          );
          if (!choices) return null;
          return {
            prompt: it.gap,
            answer: it.gap_answer,
            choices,
            cz: it.cz,
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
    prompt: it.gap,
    hint: it.cz,
    answer: it.gap_answer,
    accepts: it.gap_accepts || [],
    cz: it.cz,
    root: it.root,
    explanation: it.explanation,
    explanation_cz: it.explanation_cz,
    structures: it.structures,
    _block: it._block,
  }));

  // Use: whole-sentence production from the Czech. zero_article items (no
  // typed answer exists — the teaching point is the absent word) belong here
  // and nowhere else.
  const use_items = (wants("use") ? items : [])
    .filter((it) => it.en && it.cz)
    .map((it) => ({
      prompt: it.cz,
      answer: it.en,
      accepts: it.accepts || [],
      cz: it.cz,
      explanation: it.explanation,
      explanation_cz: it.explanation_cz,
      structures: it.structures,
      _block: it._block,
    }));

  return { ...pack, intro: cards, match, quiz, order, type_items, use_items };
}

export { key as _normKey, choicesFor as _choicesFor, flatItems as _flatItems };
