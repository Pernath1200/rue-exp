/**
 * "Why?" — optional per-item explanation, revealed on demand.
 * Items opt in via an `explain` field (learner English). Never shown
 * unprompted: a small link appears with the answer feedback; clicking it
 * swaps in the note. Authored from A2 unit 1 onward (James 2026-08-04);
 * A1 items gain explains opportunistically.
 */
export function attachExplain(fb, item, onOpen) {
  if (!fb || !item || !item.explain) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "link explain-link";
  btn.textContent = "Why?";
  btn.onclick = () => {
    if (onOpen) onOpen(); // e.g. cancel auto-advance so the note can be read
    const note = document.createElement("div");
    note.className = "explain-note";
    note.textContent = item.explain;
    btn.replaceWith(note);
  };
  fb.appendChild(document.createElement("br"));
  fb.appendChild(btn);
}
