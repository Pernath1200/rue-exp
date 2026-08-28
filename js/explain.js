/**
 * Per-item explanation, shown WITH the answer feedback.
 *
 * Was hidden behind a "Why?" link — "never shown unprompted", to keep the flow
 * uncluttered (2026-08-04). Reversed 2026-08-24 (James): the explanation IS the
 * teaching, and behind a click most students never read it. It now renders
 * immediately, headed "Explanation".
 *
 * `explanation` is read first (2026-08-11): 3,759 items across 92 packs carry it
 * and not one was displayed, because this function only looked at `explain`,
 * which no item has. `explain` stays supported as the override.
 *
 * onOpen() still fires — it cancels the Type stage's auto-advance so the note can
 * be read. That guarantee is unchanged; it just fires on render, not on click.
 */
export function attachExplain(fb, item, onOpen) {
  const text = item && (item.explanation || item.explain);
  if (!fb || !text) return;
  if (onOpen) onOpen(); // cancel auto-advance so the note can actually be read

  const note = document.createElement("div");
  note.className = "explain-note";

  const head = document.createElement("div");
  head.className = "explain-head";
  head.textContent = "Explanation";
  note.appendChild(head);

  const md = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  const main = document.createElement("div");
  main.innerHTML = md(text);
  note.appendChild(main);

  const cz = item.explanation_cz || item.explain_cz || "";
  if (cz && cz !== text) {
    const sub = document.createElement("div");
    sub.className = "explain-note-cz";
    sub.innerHTML = md(cz);
    note.appendChild(sub);
  }

  fb.appendChild(note);
}
