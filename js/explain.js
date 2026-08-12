/**
 * "Why?" — optional per-item explanation, revealed on demand.
 * Items opt in via an `explain` field (learner English). Never shown
 * unprompted: a small link appears with the answer feedback; clicking it
 * swaps in the note. Authored from A2 unit 1 onward (James 2026-08-04);
 * A1 items gain explains opportunistically.
 */
export function attachExplain(fb, item, onOpen) {
  /* Read `explanation` first (2026-08-11): 3,759 items across 92 packs carry
   * it and NOT ONE was ever displayed, because this function only looked at
   * `explain` — which no item in the repo has. The whole explanation layer was
   * dead. `explain` stays supported as the override. */
  const text = item && (item.explanation || item.explain);
  if (!fb || !text) return;
  const cz = item.explanation_cz || item.explain_cz || "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "link explain-link";
  btn.textContent = "Why?";
  btn.onclick = () => {
    if (onOpen) onOpen(); // e.g. cancel auto-advance so the note can be read
    const note = document.createElement("div");
    note.className = "explain-note";
    note.textContent = text;
    if (cz && cz !== text) {
      const sub = document.createElement("div");
      sub.className = "explain-note-cz";
      sub.textContent = cz;
      note.appendChild(sub);
    }
    btn.replaceWith(note);
  };
  fb.appendChild(document.createElement("br"));
  fb.appendChild(btn);
}
