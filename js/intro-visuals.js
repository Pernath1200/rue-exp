/**
 * intro-visuals.js — schematics for vocab intro pages.
 *
 * Abstract sets (Ideas, Feelings, Society…) have no usable emoji, so they get
 * a drawn relationship instead. These are PARAMETERISED, not bespoke: a pack
 * names a schematic and supplies its own labels. Authoring agents can fill in
 * labels reliably; they cannot hand-draw SVG reliably.
 *
 *   { "diagram": "scale", "labels": ["cold", "warm", "hot"] }
 *
 * Colours come from the app's CSS custom properties, so a schematic sits in
 * the palette without each pack restating it.
 *
 * Add a schematic here, never inside a pack.
 */

const ACCENT = "var(--vocab-accent, #4db6c7)";
const MUTED = "var(--muted, #a0a0a0)";
const TEXT = "var(--text, #fff)";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svg(inner, w = 320, h = 150) {
  return `<svg viewBox="0 0 ${w} ${h}" class="intro-scene" role="img">${inner}</svg>`;
}

function label(x, y, text, { size = 13, fill = TEXT, anchor = "middle" } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="var(--font, system-ui)">${esc(text)}</text>`;
}

/* Labels come from packs, so a renderer can never trust them to fit its
 * geometry — card 13 of b1_articles_advanced put 65 characters into a 114px
 * box and the text ran straight through the walls (James, 2026-08-24).
 * wrapFit() word-wraps into at most maxLines lines and steps the font down
 * until the longest line fits the given width. ~0.62em per character is the
 * usual average for system-ui. */
function wrapWords(text, charsPerLine) {
  const words = String(text || "").split(" ");
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    if (cur && (cur + " " + w).length > charsPerLine) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  });
  if (cur) lines.push(cur);
  return lines;
}

function wrapFit(text, width, size, maxLines = 2, minSize = 8) {
  for (let s = size; s >= minSize; s--) {
    const cpl = Math.max(1, Math.floor(width / (0.62 * s)));
    const lines = wrapWords(text, cpl);
    if (lines.length <= maxLines && !lines.some((l) => l.length > cpl)) return { lines, size: s };
  }
  const cpl = Math.max(1, Math.floor(width / (0.62 * minSize)));
  return { lines: wrapWords(text, cpl).slice(0, maxLines), size: minSize };
}

/** Centred wrapped text block inside a box: (cx, cy) is the box centre. */
function labelBlock(cx, cy, text, width, { size = 11, fill = TEXT, maxLines = 2 } = {}) {
  const f = wrapFit(text, width, size, maxLines);
  const lh = f.size + 3;
  const y0 = cy - ((f.lines.length - 1) * lh) / 2 + f.size * 0.35;
  return f.lines.map((l, i) => label(cx, y0 + i * lh, l, { size: f.size, fill })).join("");
}

/** Horizontal axis with graded stops — degree, intensity, frequency. */
function scale(labels) {
  const pts = labels.slice(0, 5);
  if (pts.length < 2) return "";
  const x0 = 30;
  const x1 = 290;
  const step = (x1 - x0) / (pts.length - 1);
  let inner = `<line x1="${x0}" y1="80" x2="${x1}" y2="80" stroke="${MUTED}" stroke-width="2"/>`;
  inner += `<polygon points="${x1},80 ${x1 - 8},75 ${x1 - 8},85" fill="${MUTED}"/>`;
  pts.forEach((t, i) => {
    const x = x0 + step * i;
    const r = 5 + i * 1.5;
    inner += `<circle cx="${x}" cy="80" r="${r}" fill="${ACCENT}"/>`;
    inner += label(x, 108, t);
  });
  return svg(inner);
}

/** Nested rings — widening scope: me → family → community. */
function circles(labels) {
  const pts = labels.slice(0, 3);
  if (!pts.length) return "";
  const radii = [64, 44, 24];
  let inner = "";
  pts.forEach((t, i) => {
    const r = radii[i] ?? 20;
    inner += `<circle cx="110" cy="75" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="2" opacity="${1 - i * 0.22}"/>`;
    inner += label(200, 45 + i * 26, t, { anchor: "start" });
    inner += `<line x1="110" y1="${75 - r}" x2="195" y2="${41 + i * 26}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="3 3"/>`;
  });
  return svg(inner);
}

/** Centre with branches — a topic and the words that hang off it. */
function branch(labels) {
  const root = labels[0] || "";
  const kids = labels.slice(1, 5);
  let inner = `<circle cx="60" cy="75" r="26" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  inner += label(60, 79, root, { size: 12 });
  const ys = kids.length === 1 ? [75] : kids.map((_, i) => 30 + (90 / Math.max(1, kids.length - 1)) * i);
  kids.forEach((t, i) => {
    const y = ys[i];
    inner += `<line x1="86" y1="75" x2="170" y2="${y}" stroke="${MUTED}" stroke-width="1.5"/>`;
    inner += `<circle cx="174" cy="${y}" r="4" fill="${ACCENT}"/>`;
    inner += label(186, y + 4, t, { anchor: "start", size: 12 });
  });
  return svg(inner);
}

/** Closed loop — routines, processes, cycles. */
function cycle(labels) {
  const pts = labels.slice(0, 4);
  if (pts.length < 2) return "";
  // Labels sit r+24 from the centre, so the top and bottom ones need headroom:
  // at cy=72 in a 150-high box they fell outside and were cut in half
  // (James, 2026-08-23, a2_routine "How often, not what").
  const cx = 160;
  const cy = 92;
  const r = 44;
  let inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  pts.forEach((t, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / pts.length;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    inner += `<circle cx="${x}" cy="${y}" r="6" fill="${ACCENT}"/>`;
    const side = Math.abs(Math.cos(a)) > 0.5 ? (Math.cos(a) > 0 ? "start" : "end") : "middle";
    const lx = cx + (r + (side === "middle" ? 22 : 14)) * Math.cos(a);
    const ly = cy + (r + 22) * Math.sin(a) + 4;
    inner += label(lx, ly, t, { size: 12, anchor: side });
  });
  return svg(inner, 320, 184);
}

/** Two contrasted boxes — the false-friend pair (home vs house). */
function contrast(labels) {
  const [a, b, aNote, bNote] = labels;
  let inner = "";
  inner += `<rect x="16" y="34" width="130" height="78" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  inner += `<rect x="174" y="34" width="130" height="78" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2" opacity="0.55"/>`;
  inner += label(81, 68, a || "", { size: 15 });
  inner += label(239, 68, b || "", { size: 15 });
  if (aNote) inner += label(81, 92, aNote, { size: 11, fill: MUTED });
  if (bNote) inner += label(239, 92, bNote, { size: 11, fill: MUTED });
  inner += label(160, 76, "vs", { size: 11, fill: MUTED });
  return svg(inner);
}

/* ---------------------------------------------------------------------------
 * Grammar schematics (added 2026-08-24 for b1_verb_patterns_advanced).
 *
 * These four are deliberately GENERAL shapes, not one-offs for that unit:
 * one-thing-many-options, a slot sequence, a before/after contrast, and a
 * which-form decision. Timelines alone should serve every tense unit. The rule
 * stands — geometry lives here, labels come from the pack — but the reason is
 * reuse and a consistent visual language, not that SVG is hard: James's point
 * (2026-08-24) is that everything gets checked by eye anyway.
 *
 * Labels arrive as one flat array; each function documents its own order.
 * ------------------------------------------------------------------------- */

/** Hub and spokes — one thing, several options.
 *  labels: [centre, label1, example1, label2, example2, label3, example3, label4, example4] */
function hub_spokes(labels) {
  const [centre, ...rest] = labels;
  const spokes = [];
  for (let i = 0; i < 8; i += 2) spokes.push([rest[i] || "", rest[i + 1] || ""]);
  const boxes = [
    [8, 86], [164, 86], [8, 152], [164, 152],
  ];
  // Labels shrink to fit their box — "the: we both know which" overflowed the
  // 148px spoke box at a fixed size 12 (James, 2026-08-24, b1_articles_advanced).
  const fit1 = (t, w, s) => Math.max(8, Math.min(s, Math.floor(w / (0.62 * Math.max(1, String(t).length)))));
  let inner = `<rect x="110" y="8" width="100" height="32" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  inner += label(160, 29, centre || "", { size: fit1(centre, 92, 13) });
  spokes.forEach(([top, ex], i) => {
    if (!top) return;
    const [x, y] = boxes[i];
    inner += `<line x1="160" y1="40" x2="${x + 74}" y2="${y}" stroke="${MUTED}" stroke-width="1.5" opacity="0.7"/>`;
    inner += `<rect x="${x}" y="${y}" width="148" height="54" rx="8" fill="none" stroke="${ACCENT}" stroke-width="1.5" opacity="0.8"/>`;
    inner += label(x + 74, y + 22, top, { size: fit1(top, 138, 12) });
    if (ex) inner += label(x + 74, y + 40, ex, { size: fit1(ex, 138, 11), fill: MUTED });
  });
  return svg(inner, 320, 214);
}

/** Boxes in a row with arrows, and aligned example rows beneath — a slot sequence.
 *  labels: [box1, box2, box3, r1a, r1b, r1c, r2a, r2b, r2c]
 *  A box label with " · " renders as two lines (head over detail) in a taller
 *  box, and any line longer than the box shrinks its font to fit — at one size,
 *  "FIRST MENTION · a / an" spilled out both sides of its box
 *  (James, 2026-08-24, b1_articles_advanced "First mention, then known"). */
function boxes_row(labels) {
  const [b1, b2, b3, ...ex] = labels;
  const xs = [6, 114, 222];
  const mid = [52, 160, 268];
  const INNER_W = 84; // 92-wide box minus breathing room
  const fit = (t, size) => Math.min(size, Math.floor(INNER_W / (0.62 * Math.max(1, String(t).length))) || size);
  const twoLine = [b1, b2, b3].some((t) => String(t || "").includes(" · "));
  const boxH = twoLine ? 46 : 36;
  const cy = 10 + boxH / 2;
  let inner = "";
  [b1, b2, b3].forEach((t, i) => {
    t = t || "";
    inner += `<rect x="${xs[i]}" y="10" width="92" height="${boxH}" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
    const parts = twoLine ? String(t).split(" · ") : [String(t)];
    if (parts.length > 1) {
      const head = parts[0];
      const detail = parts.slice(1).join(" · ");
      inner += label(mid[i], 30, head, { size: fit(head, 11) });
      inner += label(mid[i], 47, detail, { size: fit(detail, 11), fill: MUTED });
    } else {
      inner += label(mid[i], cy + 5, t, { size: fit(t, 12) });
    }
  });
  [[98, 114], [206, 222]].forEach(([x1, x2]) => {
    inner += `<line x1="${x1}" y1="${cy}" x2="${x2 - 6}" y2="${cy}" stroke="${MUTED}" stroke-width="1.5"/>`;
    inner += `<path d="M${x2 - 6} ${cy - 4} L${x2} ${cy} L${x2 - 6} ${cy + 4} Z" fill="${MUTED}"/>`;
  });
  for (let r = 0; r < 2; r++) {
    const y = 42 + boxH + r * 28;
    for (let c = 0; c < 3; c++) {
      const t = ex[r * 3 + c];
      if (t) inner += label(mid[c], y, t, { size: 11, fill: r === 0 ? TEXT : MUTED });
    }
  }
  return svg(inner, 320, 114 + boxH);
}

/** Two stacked timelines sharing a `now` marker — before/after contrast.
 *  labels: [upperLabel, upperPast, upperNow, upperCaption,
 *           lowerLabel, lowerNow, lowerFuture, lowerCaption] */
function timelines(labels) {
  const [uL, uPast, uNow, uCap, lL, lNow, lFut, lCap] = labels;
  const NOW = 172;
  const line = (y) =>
    `<line x1="20" y1="${y}" x2="300" y2="${y}" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<line x1="${NOW}" y1="${y - 7}" x2="${NOW}" y2="${y + 7}" stroke="${ACCENT}" stroke-width="2"/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="${ACCENT}"/>`;
  let inner = "";
  inner += label(20, 22, uL || "", { size: 11, fill: MUTED, anchor: "start" });
  inner += line(50) + dot(80, 50) + dot(NOW, 50);
  inner += label(80, 42, uPast || "", { size: 11 });
  inner += label(NOW + 6, 42, uNow || "", { size: 11, anchor: "start" });
  if (uCap) inner += label(20, 70, uCap, { size: 10, fill: MUTED, anchor: "start" });
  inner += label(20, 110, lL || "", { size: 11, fill: MUTED, anchor: "start" });
  inner += line(138) + dot(NOW, 138) + dot(258, 138);
  inner += label(NOW - 6, 130, lNow || "", { size: 11, anchor: "end" });
  inner += label(258, 130, lFut || "", { size: 11 });
  if (lCap) inner += label(20, 158, lCap, { size: 10, fill: MUTED, anchor: "start" });
  return svg(inner, 320, 172);
}

/** Vertical decision flow: question -> yes -> result, no -> next question.
 *  labels: [q1, result1, q2, result2, q3, result3, default] */
function decision_flow(labels) {
  const qs = [[labels[0], labels[1]], [labels[2], labels[3]], [labels[4], labels[5]]];
  const BOX_H = 54; // three wrapped lines at size 10 fit; was 42 with one unwrapped line
  const STEP = BOX_H + 26;
  let inner = "";
  qs.forEach(([q, r], i) => {
    if (!q) return;
    const y = 8 + i * STEP;
    const cy = y + BOX_H / 2;
    inner += `<rect x="6" y="${y}" width="180" height="${BOX_H}" rx="8" fill="none" stroke="${ACCENT}" stroke-width="1.5"/>`;
    inner += labelBlock(96, cy, q, 168, { size: 11, maxLines: 3 });
    inner += `<line x1="186" y1="${cy}" x2="${200 - 6}" y2="${cy}" stroke="${MUTED}" stroke-width="1.5"/>`;
    inner += `<path d="M194 ${cy - 4} L200 ${cy} L194 ${cy + 4} Z" fill="${MUTED}"/>`;
    inner += label(192, cy - 7, "yes", { size: 9, fill: MUTED });
    inner += `<rect x="200" y="${y}" width="114" height="${BOX_H}" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
    inner += labelBlock(257, cy, r || "", 104, { size: 11, maxLines: 3 });
    if (i < 2) {
      inner += `<line x1="96" y1="${y + BOX_H}" x2="96" y2="${y + BOX_H + 20}" stroke="${MUTED}" stroke-width="1.5"/>`;
      inner += `<path d="M92 ${y + BOX_H + 20} L96 ${y + BOX_H + 26} L100 ${y + BOX_H + 20} Z" fill="${MUTED}"/>`;
      inner += label(108, y + BOX_H + 16, "no", { size: 9, fill: MUTED, anchor: "start" });
    }
  });
  const dy = 8 + 3 * STEP;
  inner += `<line x1="96" y1="${dy - 26}" x2="96" y2="${dy - 6}" stroke="${MUTED}" stroke-width="1.5"/>`;
  inner += `<path d="M92 ${dy - 6} L96 ${dy} L100 ${dy - 6} Z" fill="${MUTED}"/>`;
  inner += `<rect x="6" y="${dy}" width="308" height="46" rx="8" fill="none" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  inner += labelBlock(160, dy + 23, labels[6] || "", 292, { size: 11, fill: MUTED, maxLines: 2 });
  return svg(inner, 320, dy + 56);
}

const SCHEMATICS = {
  scale, circles, branch, cycle, contrast,
  hub_spokes, boxes_row, timelines, decision_flow,
};

/** Names a pack may use in `diagram`. */
export const DIAGRAM_KEYS = Object.keys(SCHEMATICS);

/**
 * @param {string} name schematic id
 * @param {string[]} labels pack-supplied labels
 * @returns {string} SVG markup, or "" if the name is unknown
 */
export function introDiagram(name, labels) {
  const fn = SCHEMATICS[name];
  if (!fn) return "";
  return fn(Array.isArray(labels) ? labels.map((l) => String(l)) : []);
}
