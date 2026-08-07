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
  const cx = 160;
  const cy = 72;
  const r = 46;
  let inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  pts.forEach((t, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / pts.length;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    inner += `<circle cx="${x}" cy="${y}" r="6" fill="${ACCENT}"/>`;
    const lx = cx + (r + 30) * Math.cos(a);
    const ly = cy + (r + 30) * Math.sin(a) + 4;
    inner += label(lx, ly, t, { size: 12 });
  });
  return svg(inner);
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

const SCHEMATICS = { scale, circles, branch, cycle, contrast };

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
