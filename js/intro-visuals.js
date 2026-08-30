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
const SURFACE = "var(--surface, #141414)";

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

/** Certainty axis — not a timeline.
 *  labels: [axisTitle, degree1, modal1, degree2, modal2, ...]
 *  Degree sits above the dot, modal below. Arrow = more sure. */
function certainty_scale(labels) {
  const title = labels[0] || "how sure";
  const pairs = [];
  for (let i = 1; i + 1 < labels.length && pairs.length < 5; i += 2) {
    pairs.push([labels[i], labels[i + 1]]);
  }
  if (pairs.length < 2) return "";
  const x0 = 36;
  const x1 = 284;
  const y = 86;
  const step = (x1 - x0) / (pairs.length - 1);
  let inner = label(160, 20, title, { size: 13, fill: ACCENT });
  inner += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${MUTED}" stroke-width="2"/>`;
  inner += `<polygon points="${x1},${y} ${x1 - 8},${y - 5} ${x1 - 8},${y + 5}" fill="${MUTED}"/>`;
  pairs.forEach(([deg, modal], i) => {
    const x = x0 + step * i;
    const r = 5 + i * 1.5;
    inner += labelBlock(x, 52, deg, 78, { size: 11, fill: MUTED, maxLines: 2 });
    inner += `<circle cx="${x}" cy="${y}" r="${r}" fill="${ACCENT}"/>`;
    inner += label(x, 116, modal);
  });
  return svg(inner, 320, 150);
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

/** Sufficiency scale — too / enough are not ticks on 0–100.
 *  They sit relative to a need: short of it, at it, past it.
 *  labels: ["not enough", "enough", "too"] */
function need_scale(labels) {
  const left = labels[0] || "not enough";
  const mid = labels[1] || "enough";
  const right = labels[2] || "too";
  const y = 78;
  const x0 = 28;
  const xNeed = 150;
  const x1 = 292;
  let inner = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${MUTED}" stroke-width="2"/>`;
  inner += `<polygon points="${x1},${y} ${x1 - 8},${y - 5} ${x1 - 8},${y + 5}" fill="${MUTED}"/>`;
  inner += `<line x1="${xNeed}" y1="${y - 18}" x2="${xNeed}" y2="${y + 18}" stroke="${ACCENT}" stroke-width="2.5"/>`;
  inner += label(xNeed, 42, "need", { size: 12, fill: ACCENT });
  inner += `<circle cx="70" cy="${y}" r="5" fill="${ACCENT}"/>`;
  inner += label(70, 112, left, { size: 12 });
  inner += `<circle cx="${xNeed}" cy="${y}" r="7" fill="${ACCENT}"/>`;
  inner += label(xNeed, 112, mid, { size: 12 });
  inner += `<circle cx="250" cy="${y}" r="9" fill="${ACCENT}"/>`;
  inner += label(250, 112, right, { size: 12 });
  return svg(inner, 320, 140);
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
 *  labels: [centre, label1, example1, label2, example2, label3, example3, label4, example4]
 *  Three options sit in a row under the hub so a line cannot cut through a box
 *  (James, 2026-08-28, Articles 2). Four still use a 2×2 grid. */
function hub_spokes(labels) {
  const [centre, ...rest] = labels;
  const spokes = [];
  for (let i = 0; i < 8; i += 2) {
    if (rest[i]) spokes.push([rest[i], rest[i + 1] || ""]);
  }
  const n = spokes.length;
  const three = n === 3;
  const bw = three ? 100 : 148;
  const bh = 54;
  const y = 86;
  const boxes = three
    ? [
        [6, y],
        [110, y],
        [214, y],
      ]
    : [
        [8, 86],
        [164, 86],
        [8, 152],
        [164, 152],
      ];
  const fit1 = (t, w, s) =>
    Math.max(8, Math.min(s, Math.floor(w / (0.62 * Math.max(1, String(t).length)))));
  const hub = wrapFit(centre || "", 176, 12, 2);
  const hubH = hub.lines.length > 1 ? 40 : 32;
  const hubW = 188;
  let inner = `<rect x="${160 - hubW / 2}" y="6" width="${hubW}" height="${hubH}" rx="8" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  inner += labelBlock(160, 6 + hubH / 2, centre || "", 176, { size: 12, maxLines: 2 });
  spokes.forEach(([top, ex], i) => {
    const [x, by] = boxes[i];
    const cx = x + bw / 2;
    inner += `<line x1="160" y1="${6 + hubH}" x2="${cx}" y2="${by}" stroke="${MUTED}" stroke-width="1.5" opacity="0.7"/>`;
    inner += `<rect x="${x}" y="${by}" width="${bw}" height="${bh}" rx="8" fill="none" stroke="${ACCENT}" stroke-width="1.5" opacity="0.8"/>`;
    inner += label(cx, by + 22, top, { size: fit1(top, bw - 10, 12) });
    if (ex) inner += label(cx, by + 40, ex, { size: fit1(ex, bw - 10, 11), fill: MUTED });
  });
  return svg(inner, 320, three ? 150 : 214);
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

/* Place prepositions — ball and box. Same scenes the vocab engine already
 * draws on items (practice-vocab diagramSvg). Grammar intros named these
 * keys for years and got a blank: introDiagram only knew scale/branch/…
 * (a1_prepositions_place, James 2026-08-26). Theme strokes, not the old
 * hardcoded orange. */
function pBox(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="3"/>`;
}
function pOpenBox(x, y, w, h) {
  return `<path d="M${x} ${y} L${x} ${y + h} L${x + w} ${y + h} L${x + w} ${y}" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round"/>`;
}
function pBall(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="16" fill="${ACCENT}" stroke="${MUTED}" stroke-width="2"/>`;
}
function placeIn() {
  return svg(pOpenBox(70, 70, 80, 45) + pBall(110, 96), 220, 150);
}
function placeOn() {
  return svg(pBox(70, 80, 80, 40) + pBall(110, 64), 220, 150);
}
function placeUnder() {
  return svg(pBox(70, 55, 80, 40) + pBall(110, 116), 220, 150);
}
function placeNextTo() {
  return svg(pBox(58, 70, 70, 45) + pBall(162, 92), 220, 150);
}
function placeBehind() {
  /* Ball first, filled box on top — outline-only read as "on" (James, smoke). */
  return svg(pBall(110, 72) + pBox(66, 70, 88, 52), 220, 150);
}
function placeInFrontOf() {
  return svg(pBox(66, 46, 88, 48) + pBall(110, 102), 220, 150);
}
function pMap(x, y, w, h, dotX, dotY) {
  const x2 = x + w, y2 = y + h;
  const streets =
    `<line x1="${x}" y1="${y + h * 0.38}" x2="${x2}" y2="${y + h * 0.38}" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<line x1="${x}" y1="${y + h * 0.68}" x2="${x2}" y2="${y + h * 0.68}" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<line x1="${x + w * 0.45}" y1="${y}" x2="${x + w * 0.45}" y2="${y2}" stroke="${MUTED}" stroke-width="1.5"/>`;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="2"/>` +
    streets +
    `<circle cx="${dotX}" cy="${dotY}" r="6" fill="${ACCENT}"/>`
  );
}
function placeAt() {
  /* Point on a map — not a pin over the ball (James: lollipop, 2026-08-26). */
  return svg(
    pMap(30, 22, 160, 100, 102, 90) +
      label(148, 94, "station", { size: 12, fill: ACCENT, anchor: "start" }),
    220,
    150,
  );
}
function placeInOnAt() {
  const col = (cx, drawing, caption) =>
    `<g transform="translate(${cx - 40}, 8)">${drawing}</g>` +
    label(cx, 148, caption, { size: 14, fill: ACCENT });
  return svg(
    col(54, pOpenBox(5, 48, 70, 40) + pBall(40, 72), "in") +
      col(160, pBox(5, 72, 70, 36) + pBall(40, 56), "on") +
      col(
        266,
        pMap(2, 22, 76, 88, 36, 82),
        "at",
      ),
    320,
    164,
  );
}

/* Movement prepositions — same ball and box as place, plus an arrow
 * (a2_prepositions_movement, James 2026-08-29: position is visual; many
 * small scenes, not one giant picture per page). Caption lives outside
 * the SVG so the grid can shrink these. */
function mBall(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="13" fill="${ACCENT}" stroke="${MUTED}" stroke-width="2"/>`;
}
function mArrow(x1, y1, x2, y2, { dashed = false } = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 12;
  const spread = 5.8;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const px = -uy * spread;
  const py = ux * spread;
  const dash = dashed ? ` stroke-dasharray="5 4"` : "";
  return (
    `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round"${dash}/>` +
    `<polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${ACCENT}"/>`
  );
}
function mArc(x1, y1, cx, cy, x2, y2) {
  const dx = x2 - cx;
  const dy = y2 - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 12;
  const spread = 5.8;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const px = -uy * spread;
  const py = ux * spread;
  return (
    `<path d="M${x1} ${y1} Q${cx} ${cy} ${bx} ${by}" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${ACCENT}"/>`
  );
}
function mScene(inner) {
  return svg(inner, 220, 150);
}

function moveTo() {
  return mScene(
    pBox(132, 48, 68, 54) + mBall(38, 76) + mArrow(56, 76, 124, 76),
  );
}
function moveInto() {
  return mScene(
    pOpenBox(118, 42, 78, 68) +
      mBall(132, 92) +
      mArrow(36, 92, 114, 92),
  );
}
function moveOnto() {
  return mScene(
    pBox(78, 92, 90, 36) +
      mBall(123, 79) +
      mArc(28, 118, 62, 40, 123, 79),
  );
}
function moveFrom() {
  return mScene(
    pBox(18, 48, 68, 54) + mBall(176, 76) + mArrow(94, 76, 158, 76),
  );
}
function moveOutOf() {
  return mScene(
    pOpenBox(18, 42, 78, 68) +
      mBall(176, 92) +
      mArrow(70, 92, 158, 92),
  );
}
function moveOff() {
  return mScene(
    pBox(28, 92, 86, 36) +
      mBall(176, 79) +
      mArc(72, 79, 128, 28, 176, 79),
  );
}
function moveAcross() {
  const road =
    `<rect x="18" y="62" width="184" height="30" rx="4" fill="${SURFACE}" stroke="${MUTED}" stroke-width="2"/>` +
    `<line x1="30" y1="77" x2="190" y2="77" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="8 6"/>`;
  return mScene(road + mBall(110, 36) + mArrow(110, 52, 110, 118));
}
function moveAlong() {
  const road =
    `<rect x="18" y="62" width="184" height="30" rx="4" fill="${SURFACE}" stroke="${MUTED}" stroke-width="2"/>` +
    `<line x1="30" y1="77" x2="190" y2="77" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="8 6"/>`;
  return mScene(road + mBall(92, 77) + mArrow(110, 77, 188, 77));
}
function moveThrough() {
  const tunnel =
    `<path d="M52 118 L52 78 Q110 18 168 78 L168 118" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round"/>`;
  return mScene(tunnel + mBall(110, 86) + mArrow(58, 86, 96, 86) + mArrow(126, 86, 174, 86));
}
function movePast() {
  return mScene(
    pBox(86, 32, 52, 70) +
      mBall(38, 102) +
      mArrow(54, 102, 192, 102),
  );
}
function moveOver() {
  return mScene(
    pBox(74, 92, 72, 32) +
      `<path d="M28 112 A 82 64 0 0 1 176 112" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round"/>` +
      mBall(102, 64) +
      mArrow(176, 112, 204, 112),
  );
}
function moveUnderGoing() {
  return mScene(
    pBox(70, 28, 80, 40) +
      mBall(110, 118) +
      mArrow(28, 118, 192, 118),
  );
}
function pStairs() {
  return `<path d="M32 122 H72 V100 H104 V78 H136 V56 H176 V122 Z" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="2.5" stroke-linejoin="round"/>`;
}
function moveUp() {
  return mScene(pStairs() + mBall(88, 86) + mArrow(104, 72, 154, 40));
}
function moveDown() {
  return mScene(pStairs() + mBall(152, 42) + mArrow(136, 56, 86, 92));
}
function moveAround() {
  return mScene(
    pBox(88, 56, 44, 34) +
      `<circle cx="110" cy="73" r="48" fill="none" stroke="${ACCENT}" stroke-width="2.2" stroke-dasharray="5 4"/>` +
      mBall(110, 121) +
      mArrow(124, 118, 152, 102),
  );
}
function moveBetween() {
  return mScene(
    pBox(16, 18, 56, 100) +
      pBox(148, 18, 56, 100) +
      mBall(110, 48) +
      mArrow(110, 64, 110, 112),
  );
}
function moveTowards() {
  return mScene(
    pBox(168, 48, 42, 50) + mBall(24, 74) + mArrow(42, 74, 128, 74),
  );
}
function pBus(x, y) {
  return (
    `<rect x="${x}" y="${y}" width="96" height="38" rx="9" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="2.5"/>` +
    `<rect x="${x + 12}" y="${y + 8}" width="20" height="14" rx="2" fill="none" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<rect x="${x + 40}" y="${y + 8}" width="20" height="14" rx="2" fill="none" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<circle cx="${x + 24}" cy="${y + 38}" r="7" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="2"/>` +
    `<circle cx="${x + 74}" cy="${y + 38}" r="7" fill="${SURFACE}" stroke="${ACCENT}" stroke-width="2"/>`
  );
}
function moveOnBus() {
  return mScene(
    pBus(108, 62) + mBall(36, 92) + mArrow(54, 88, 112, 72),
  );
}
function moveOffBus() {
  return mScene(
    pBus(16, 62) + mBall(176, 88) + mArrow(118, 72, 160, 84),
  );
}

/** to / for / with — three relations (a1_to_for_with, James 2026-08-29).
 *  to   = movement toward (arrow). for = intended for someone (thing tagged
 *  to a person — not a second arrow, or it collapses into to). with = together
 *  (two overlapping rings). labels: [from, dest, thing, who, a, b]
 *  e.g. I, school, this, you, me, you */
function toForWith(labels) {
  const from = labels[0] || "I";
  const dest = labels[1] || "school";
  const thing = labels[2] || "this";
  const who = labels[3] || "you";
  const a = labels[4] || "me";
  const b = labels[5] || "you";
  const col = (cx, drawing, caption) =>
    `<g transform="translate(${cx - 50}, 6)">${drawing}</g>` +
    label(cx, 158, caption, { size: 14, fill: ACCENT });
  const toPanel =
    `<circle cx="16" cy="50" r="12" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    `<line x1="30" y1="50" x2="58" y2="50" stroke="${ACCENT}" stroke-width="2.5"/>` +
    `<polygon points="66,50 56,45 56,55" fill="${ACCENT}"/>` +
    `<rect x="68" y="34" width="30" height="32" rx="6" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    label(16, 80, from, { size: 11, fill: MUTED }) +
    label(83, 80, dest, { size: 11, fill: MUTED });
  const forPanel =
    `<rect x="10" y="34" width="30" height="32" rx="6" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    `<circle cx="86" cy="50" r="12" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    label(25, 80, thing, { size: 11, fill: MUTED }) +
    label(86, 80, who, { size: 11, fill: MUTED }) +
    `<path d="M25 88 L25 104 L86 104 L86 88" fill="none" stroke="${MUTED}" stroke-width="1.5"/>` +
    label(56, 120, "for", { size: 11, fill: ACCENT });
  const withPanel =
    `<circle cx="38" cy="50" r="16" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    `<circle cx="62" cy="50" r="16" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    label(38, 82, a, { size: 11, fill: MUTED }) +
    label(62, 82, b, { size: 11, fill: MUTED });
  return svg(
    col(54, toPanel, "to") +
      col(160, forPanel, "for") +
      col(266, withPanel, "with"),
    320,
    172,
  );
}

/** Past simple vs present perfect — SAME event, two ways of looking.
 *  labels: [pastTitle, pastEvent, pastCaption, ppTitle, ppEvent, ppResult, ppCaption] */
function pp_vs_past(labels) {
  const [pTitle, pEvent, pCap, ppTitle, ppEvent, ppResult, ppCap] = labels;
  const NOW = 248;
  const PAST = 88;
  const axis = (y) =>
    `<line x1="16" y1="${y}" x2="304" y2="${y}" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<line x1="${NOW}" y1="${y - 10}" x2="${NOW}" y2="${y + 10}" stroke="${ACCENT}" stroke-width="2.5"/>` +
    label(NOW, y + 26, "NOW", { size: 11, fill: ACCENT });
  const event = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="7" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="2"/>`;
  let inner = "";
  inner += label(16, 18, pTitle || "Past simple", { size: 13, anchor: "start" });
  inner += axis(50);
  inner += event(PAST, 50);
  inner += label(PAST, 38, pEvent || "", { size: 12 });
  if (pCap) inner += label(16, 90, pCap, { size: 11, fill: MUTED, anchor: "start" });
  inner += label(16, 122, ppTitle || "Present perfect", { size: 13, anchor: "start" });
  inner += axis(154);
  inner += `<line x1="${PAST}" y1="154" x2="${NOW}" y2="154" stroke="${ACCENT}" stroke-width="3" stroke-dasharray="5 4"/>`;
  inner += event(PAST, 154);
  inner += label(PAST, 142, ppEvent || "", { size: 12 });
  inner += `<circle cx="${NOW}" cy="154" r="5" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  if (ppResult) inner += label(NOW, 142, ppResult, { size: 11, fill: ACCENT });
  if (ppCap) inner += label(16, 194, ppCap, { size: 11, fill: MUTED, anchor: "start" });
  return svg(inner, 320, 210);
}

/** One compact axis: event in the past, NOW on the right.
 *  closed = finished when (short bar, gap to NOW)
 *  bridge = result still true now (dashed link)
 *  span   = situation started then and continues (bar through NOW) */
function timeNowRow(event, note, mode, y) {
  const NOW = 250;
  const PAST = 88;
  let inner = "";
  inner += `<line x1="16" y1="${y}" x2="304" y2="${y}" stroke="${MUTED}" stroke-width="1.5"/>`;
  inner += `<line x1="${NOW}" y1="${y - 10}" x2="${NOW}" y2="${y + 10}" stroke="${ACCENT}" stroke-width="2.5"/>`;
  inner += label(NOW, y + 26, "NOW", { size: 11, fill: ACCENT });
  if (mode === "span") {
    inner += `<line x1="${PAST}" y1="${y}" x2="${NOW + 16}" y2="${y}" stroke="${ACCENT}" stroke-width="4"/>`;
    inner += `<polygon points="${NOW + 24},${y} ${NOW + 14},${y - 5} ${NOW + 14},${y + 5}" fill="${ACCENT}"/>`;
  } else if (mode === "bridge") {
    inner += `<line x1="${PAST}" y1="${y}" x2="${NOW}" y2="${y}" stroke="${ACCENT}" stroke-width="3" stroke-dasharray="5 4"/>`;
    inner += `<circle cx="${NOW}" cy="${y}" r="5" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  } else {
    inner += `<line x1="${PAST - 22}" y1="${y}" x2="${PAST + 22}" y2="${y}" stroke="${ACCENT}" stroke-width="5"/>`;
  }
  inner += `<circle cx="${PAST}" cy="${y}" r="6" fill="${ACCENT}"/>`;
  inner += label(PAST, y - 16, event || "", { size: 12 });
  if (note) {
    if (mode === "bridge") inner += label(NOW, y - 16, note, { size: 11, fill: ACCENT });
    else if (mode === "span") inner += label((PAST + NOW) / 2, y + 26, note, { size: 11, fill: MUTED });
    else inner += label(PAST, y + 26, note, { size: 11, fill: MUTED });
  }
  return inner;
}

/** Compact one-row time line for later intro cards.
 *  labels: [event, note, mode]  mode = closed | bridge | span */
function time_now(labels) {
  const [event, note, mode] = labels;
  return svg(timeNowRow(event, note, mode, 38), 320, 90);
}

const SCHEMATICS = {
  scale, certainty_scale, need_scale, circles, branch, cycle, contrast,
  hub_spokes, boxes_row, timelines, decision_flow, pp_vs_past, time_now,
  in: placeIn,
  on: placeOn,
  under: placeUnder,
  at: placeAt,
  "next to": placeNextTo,
  behind: placeBehind,
  "in front of": placeInFrontOf,
  "in-on-at": placeInOnAt,
  "to-for-with": toForWith,
  "move-to": moveTo,
  "move-into": moveInto,
  "move-onto": moveOnto,
  "move-from": moveFrom,
  "move-out-of": moveOutOf,
  "move-off": moveOff,
  "move-across": moveAcross,
  "move-along": moveAlong,
  "move-through": moveThrough,
  "move-past": movePast,
  "move-over": moveOver,
  "move-under": moveUnderGoing,
  "move-up": moveUp,
  "move-down": moveDown,
  "move-around": moveAround,
  "move-between": moveBetween,
  "move-towards": moveTowards,
  "move-on-bus": moveOnBus,
  "move-off-bus": moveOffBus,
};

/** A1 articles decision map — HTML flowchart, not SVG (James, 2026-08-04).
 *  Ported into rue-exp 2026-08-28; was drawing only in rue2-grok-v1.0. */
function articlesMapHtml() {
  return `
    <div class="articles-map" role="img" aria-label="Article decision map: the, a or an, or no article">
      <div class="am-ask">
        <span class="am-kicker">Ask yourself</span>
        <span class="am-q">Does my listener know which one I mean?</span>
      </div>
      <div class="am-split">
        <div class="am-branch am-yes">
          <span class="am-label am-label-yes">Yes</span>
          <div class="am-box am-box-the">
            <div class="am-head">the</div>
            <p class="am-rule">We both know which one.</p>
            <p class="am-ex">Open <strong>the</strong> window.</p>
          </div>
        </div>
        <div class="am-branch am-no">
          <span class="am-label am-label-no">No</span>
          <div class="am-ask am-ask-sm">
            <span class="am-q">What kind of noun?</span>
          </div>
          <div class="am-leaves">
            <div class="am-box am-box-a">
              <span class="am-leaf-tag">one thing <span class="am-cz">· jedna věc</span></span>
              <div class="am-head">a / an</div>
              <p class="am-ex">I have <strong>a</strong> dog.</p>
            </div>
            <div class="am-box am-box-zero">
              <span class="am-leaf-tag">many / mass <span class="am-cz">· víc / voda…</span></span>
              <div class="am-head">no article</div>
              <p class="am-ex">I like <strong>dogs</strong>. · I drink <strong>water</strong>.</p>
            </div>
          </div>
        </div>
      </div>
      <p class="am-foot">Ask again for every new noun.</p>
    </div>`;
}

/** Names a pack may use in `diagram`. */
export const DIAGRAM_KEYS = Object.keys(SCHEMATICS).concat("articles_map");

/**
 * @param {string} name schematic id
 * @param {string[]} labels pack-supplied labels
 * @returns {string} SVG markup, or "" if the name is unknown
 */
export function introDiagram(name, labels) {
  if (name === "articles_map") return articlesMapHtml();
  const fn = SCHEMATICS[name];
  if (!fn) return "";
  return fn(Array.isArray(labels) ? labels.map((l) => String(l)) : []);
}
