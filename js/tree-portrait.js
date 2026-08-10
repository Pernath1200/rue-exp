/**
 * Sapling status-portrait — grows with CEFR level (A1 small → A2 taller → B1+ wider).
 * Grammar = roots below soil · Vocab = trunk + little branches/leaves above.
 * Roots use tapered ribbons (RUE2 craft, simplified). Root labels hidden —
 * knots only (atmosphere); soft click still focuses a path unit.
 * Navigation stays on the spine list.
 */

/** @typedef {{ id: string, domain: string, tree_part?: string, root?: string, status?: string, foundation?: boolean, label?: string }} TreeNode */

// Angles fan wider (botanical mass under soil, not a tight cluster).
const GRAMMAR_LATERALS = [
  { tree_part: "forms", label: "Forms", angle: -68 },
  { tree_part: "verbs", label: "Verbs", angle: -34 },
  { tree_part: "sentence", label: "Sentence", angle: 0 },
  { tree_part: "chunks", label: "Chunks", angle: 34 },
  { tree_part: "links", label: "Linking", angle: 68 },
];

/** Fixed house seats — A1 only lights a few; others stay ghost. */
const HOUSES = [
  { tree_part: "home_family", label: "Home", side: "L", i: 0 },
  { tree_part: "food_shopping", label: "Food", side: "L", i: 1 },
  { tree_part: "free_time", label: "Free time", side: "L", i: 2 },
  { tree_part: "work_routine", label: "Work", side: "L", i: 3 },
  { tree_part: "travel_city", label: "City", side: "R", i: 0 },
  { tree_part: "health_body", label: "Health", side: "R", i: 1 },
  { tree_part: "self_body", label: "Body", side: "R", i: 2 },
  { tree_part: "knowledge", label: "School", side: "R", i: 3 },
  { tree_part: "communication", label: "Communication", side: "L", i: 4 },
  { tree_part: "money", label: "Money", side: "R", i: 4 },
  { tree_part: "public_life", label: "Public life", side: "L", i: 5 },
  { tree_part: "inner_life", label: "Inner life", side: "R", i: 5 },
];

/**
 * Level-scaled sapling geometry (not a full B1 web — a growing young tree).
 * trunkH / rootDepth / canopyScale drive “small sapling → taller sapling”.
 */
const LEVEL_PRESETS = {
  A1: {
    W: 640,
    H: 540,
    soilY: 248,
    trunkH: 72,
    trunkW0: 9,
    trunkW1: 14,
    canopyScale: 0.72,
    rootDepth: 120,
    rootReach: 0.88,
    fork: true,
    secondaryForks: 1,
    hair: 5,
    hairGate: 0,
    segments: 2,
    wobble: 14,
    soilDots: 42,
    caption: "Young sapling — small roots, small canopy.",
    caption2: "Grows with fruit · click a root knot",
    soilLabel: "A1 · soil",
  },
  A2: {
    W: 640,
    H: 580,
    soilY: 268,
    trunkH: 100,
    trunkW0: 11,
    trunkW1: 18,
    canopyScale: 0.9,
    rootDepth: 150,
    rootReach: 0.9,
    fork: true,
    secondaryForks: 1,
    hair: 5,
    hairGate: 0.25,
    segments: 2,
    wobble: 20,
    soilDots: 48,
    caption: "Taller sapling — deeper roots.",
    caption2: "A2 · more branches · click a knot",
    soilLabel: "A2 · soil",
  },
  B1: {
    W: 660,
    H: 640,
    soilY: 280,
    trunkH: 120,
    trunkW0: 13,
    trunkW1: 22,
    canopyScale: 1.05,
    rootDepth: 180,
    rootReach: 0.96,
    fork: true,
    secondaryForks: 2,
    hair: 8,
    hairGate: 0.2,
    segments: 3,
    wobble: 26,
    soilDots: 64,
    caption: "Young tree — wider system.",
    caption2: "B1 · denser roots · click a knot",
    soilLabel: "B1 · soil",
  },
  B2: {
    W: 680,
    H: 680,
    soilY: 290,
    trunkH: 135,
    trunkW0: 14,
    trunkW1: 24,
    canopyScale: 1.12,
    rootDepth: 200,
    rootReach: 1,
    fork: true,
    secondaryForks: 2,
    hair: 10,
    hairGate: 0.15,
    segments: 3,
    wobble: 30,
    soilDots: 80,
    caption: "Growing into a full tree.",
    caption2: "B2 · deep system · click a knot",
    soilLabel: "B2 · soil",
  },
  C1: {
    W: 700,
    H: 740,
    soilY: 300,
    trunkH: 155,
    trunkW0: 15,
    trunkW1: 28,
    canopyScale: 1.22,
    rootDepth: 230,
    rootReach: 1.06,
    fork: true,
    secondaryForks: 3,
    hair: 12,
    hairGate: 0.12,
    segments: 3,
    wobble: 34,
    soilDots: 100,
    caption: "Mature tree — full system.",
    caption2: "C1 · densest roots · click a knot",
    soilLabel: "C1 · soil",
  },
};

const C = {
  copper: "#569cd6",
  copperDeep: "#3d6f9c",
  amber: "#4db6c7",
  fruit: "#22c55e",
  fruitLite: "#4ade80",
  dim: "rgba(150,150,150,0.28)",
  dimStroke: "rgba(140,140,140,0.4)",
  ink: "#c8b090",
  muted: "#7a7a7a",
  soil: "#0c1014",
  soilTop: "#121820",
  sky: "#0a0a0a",
};

function f(n) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Stable hash → [0,1) for deterministic organic wobble (RUE2). */
function hash01(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Tapered ribbon along quadratic Béziers — closed filled path (RUE2 limbChain).
 * segs: { p0, p1, p2, w0, w1 }[]
 */
function limbChain(segs, steps = 22) {
  const L = [];
  const R = [];
  segs.forEach((s, si) => {
    for (let i = si === 0 ? 0 : 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x = mt * mt * s.p0.x + 2 * mt * t * s.p1.x + t * t * s.p2.x;
      const y = mt * mt * s.p0.y + 2 * mt * t * s.p1.y + t * t * s.p2.y;
      const tx = 2 * mt * (s.p1.x - s.p0.x) + 2 * t * (s.p2.x - s.p1.x);
      const ty = 2 * mt * (s.p1.y - s.p0.y) + 2 * t * (s.p2.y - s.p1.y);
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const w = (s.w0 + (s.w1 - s.w0) * t) / 2;
      L.push([x + nx * w, y + ny * w]);
      R.push([x - nx * w, y - ny * w]);
    }
  });
  if (!L.length) return "";
  let d = `M${f(L[0][0])} ${f(L[0][1])}`;
  for (let i = 1; i < L.length; i++) d += `L${f(L[i][0])} ${f(L[i][1])}`;
  d += `L${f(R[R.length - 1][0])} ${f(R[R.length - 1][1])}`;
  for (let i = R.length - 2; i >= 0; i--) d += `L${f(R[i][0])} ${f(R[i][1])}`;
  return `${d}Z`;
}

function qpoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function chainPoint(segs, t) {
  const n = segs.length;
  if (!n) return { x: 0, y: 0 };
  const u = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(u));
  const local = u - i;
  const s = segs[i];
  return qpoint(s.p0, s.p1, s.p2, local);
}

function ridgePath(segs) {
  if (!segs.length) return "";
  let d = `M${f(segs[0].p0.x)} ${f(segs[0].p0.y)}`;
  for (const s of segs) {
    d += `Q${f(s.p1.x)} ${f(s.p1.y)} ${f(s.p2.x)} ${f(s.p2.y)}`;
  }
  return d;
}

/**
 * Multi-segment primary root from soil collar toward tip (RUE2-style wobble).
 */
function buildPrimaryRoot(collar, tip, id, preset, fillM) {
  const segsN = Math.max(2, preset.segments | 0);
  const wobble = (preset.wobble || 12) * (0.55 + 0.45 * fillM);
  const pts = [collar];
  for (let i = 1; i < segsN; i++) {
    const t = i / segsN;
    const base = {
      x: collar.x + (tip.x - collar.x) * t,
      y: collar.y + (tip.y - collar.y) * t,
    };
    const h1 = hash01(`${id}-w${i}a`);
    const h2 = hash01(`${id}-w${i}b`);
    const dx = tip.x - collar.x;
    const dy = tip.y - collar.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const side = (h1 - 0.5) * 2;
    pts.push({
      x: base.x + nx * wobble * side,
      y: base.y + ny * wobble * side * 0.35 + wobble * 0.35 * h2,
    });
  }
  pts.push(tip);

  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const h = hash01(`${id}-c${i}`);
    const ctrl = {
      x: (a.x + b.x) / 2 + (h - 0.5) * wobble * 0.55,
      y: (a.y + b.y) / 2 + wobble * 0.4 + (hash01(`${id}-cy${i}`) - 0.3) * 10,
    };
    const t0 = i / (pts.length - 1);
    const t1 = (i + 1) / (pts.length - 1);
    segs.push({ p0: a, p1: ctrl, p2: b, t0, t1 });
  }
  return segs;
}

function withWidths(segs, w0, w1) {
  return segs.map((s) => ({
    ...s,
    w0: w0 + (w1 - w0) * s.t0,
    w1: w0 + (w1 - w0) * s.t1,
  }));
}

/**
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {TreeNode[]} opts.nodes
 * @param {(id: string) => boolean} opts.isFruit
 * @param {(id: string) => string} opts.progressState
 * @param {(node: TreeNode) => void} [opts.onSelect]
 * @param {string} [opts.level]
 */
export function renderTreePortrait(container, opts) {
  const nodes = opts.nodes || [];
  const isFruit = opts.isFruit || (() => false);
  const progressState = opts.progressState || (() => "planned");
  const level = LEVEL_PRESETS[opts.level] ? opts.level : "A1";
  const P = LEVEL_PRESETS[level];

  const byPart = {};
  for (const n of nodes) {
    const tp = n.tree_part || (n.domain === "grammar" ? n.root : null);
    if (!tp) continue;
    if (!byPart[tp]) byPart[tp] = [];
    byPart[tp].push(n);
  }

  function seatFill(treePart) {
    const list = byPart[treePart] || [];
    if (!list.length) return { fill: 0, state: "dim", nodes: [] };
    let sum = 0;
    let anyLive = false;
    let anyFruit = false;
    let anyStarted = false;
    for (const n of list) {
      if (n.status !== "live") continue;
      anyLive = true;
      const st = progressState(n.id);
      if (st === "fruit" || isFruit(n.id)) {
        anyFruit = true;
        sum += 1;
      } else if (st === "started") {
        anyStarted = true;
        sum += 0.45;
      } else {
        sum += 0.12;
      }
    }
    if (!anyLive) return { fill: 0, state: "dim", nodes: list };
    const fill = Math.min(1, sum / Math.max(1, list.filter((n) => n.status === "live").length || list.length));
    const state = anyFruit ? "fruit" : anyStarted ? "started" : "live";
    return { fill, state, nodes: list };
  }

  const tap = seatFill("tap_root");
  const foundations = nodes.filter(
    (n) => n.domain === "grammar" && n.foundation && n.status === "live",
  );
  if (foundations.length) {
    let s = 0;
    for (const n of foundations) {
      if (isFruit(n.id)) s += 1;
      else if (progressState(n.id) === "started") s += 0.45;
      else s += 0.12;
    }
    tap.fill = Math.max(tap.fill, Math.min(1, s / foundations.length));
    if (tap.fill > 0 && tap.state === "dim") tap.state = "live";
    if (foundations.some((n) => isFruit(n.id))) tap.state = "fruit";
  }

  const trunk = seatFill("trunk");
  // Also count live vocab leaves as canopy life so trunk isn't empty early
  const vocabLive = nodes.filter(
    (n) => n.domain === "vocab" && n.status === "live",
  );
  if (vocabLive.length) {
    let s = 0;
    for (const n of vocabLive) {
      if (isFruit(n.id) || progressState(n.id) === "fruit") s += 1;
      else if (progressState(n.id) === "started") s += 0.4;
      else s += 0.1;
    }
    trunk.fill = Math.max(trunk.fill, Math.min(1, s / vocabLive.length));
    if (vocabLive.some((n) => isFruit(n.id))) trunk.state = "fruit";
    else if (trunk.state === "dim" && trunk.fill > 0) trunk.state = "live";
  }

  const laterals = GRAMMAR_LATERALS.map((L) => ({
    ...L,
    ...seatFill(L.tree_part),
  }));
  const houses = HOUSES.map((H) => ({
    ...H,
    ...seatFill(H.tree_part),
  }));

  const W = P.W;
  const H = P.H;
  const cx = W / 2;
  const soilY = P.soilY;

  function strokeFor(state) {
    if (state === "dim") return C.dimStroke;
    if (state === "fruit") return C.fruit;
    if (state === "started") return C.copper;
    return C.copper;
  }

  function fillFor(state) {
    if (state === "dim") return C.dim;
    if (state === "fruit") return C.fruit;
    return C.copper;
  }

  // ---- Roots (below) — full structure always; progress only tints/thickens ----
  // Earlier pass looked "the same" because width was scaled by fill≈0.12.
  const collar = { x: cx, y: soilY + 5 };
  const rootBits = laterals
    .map((L) => {
      const isDim = L.state === "dim";
      const progress = Math.max(0, Math.min(1, L.fill));
      const struct = isDim ? 0.55 : 0.82 + progress * 0.18;
      const len =
        P.rootDepth * P.rootReach * (0.88 + progress * 0.12) * (isDim ? 0.78 : 1);
      const rad = (L.angle * Math.PI) / 180;
      const tip = {
        x: cx + Math.sin(rad) * len,
        y: soilY + 14 + Math.cos(rad * 0.08) * len * 0.96,
      };
      const segs = buildPrimaryRoot(collar, tip, L.tree_part, P, struct);
      // Elegant taper (RUE2 scale) — not thick tubes
      const w0 = isDim ? 2.8 : 3.6 + progress * 2.2;
      const w1 = isDim ? 0.7 : 0.9 + progress * 0.5;
      const body = limbChain(withWidths(segs, w0, w1), 22);
      const stroke = strokeFor(L.state);
      const fillBody =
        L.state === "fruit"
          ? "rgba(34,197,94,0.7)"
          : isDim
            ? "rgba(100,130,160,0.22)"
            : "rgba(86,156,214,0.55)";
      const op = isDim ? 0.55 : 0.92;
      const tipPt = segs.length ? segs[segs.length - 1].p2 : tip;
      const knotR =
        (isDim ? 3.2 : 4 + progress * 1.6) * (level === "A1" ? 1 : 1);
      const firstNode = (L.nodes || []).find((n) => n.status === "live");
      const dataId = firstNode ? firstNode.id : "";

      let forks = "";
      const nFork = P.fork ? Math.max(0, P.secondaryForks || 0) + (isDim ? 0 : 1) : 0;
      for (let fi = 0; fi < nFork; fi++) {
        const att = chainPoint(segs, 0.38 + fi * 0.18);
        const sign = (L.angle < 0 ? -1 : 1) * (fi % 2 === 0 ? 1 : -1);
        const fang = rad + sign * (0.38 + fi * 0.12);
        const flen = len * (0.28 + 0.08 * fi) * (isDim ? 0.65 : 0.85);
        const ftip = {
          x: att.x + Math.sin(fang) * flen,
          y: att.y + Math.abs(Math.cos(fang)) * flen * 0.9 + 6,
        };
        const h = hash01(`${L.tree_part}-fk${fi}`);
        const fctrl = {
          x: (att.x + ftip.x) / 2 + (h - 0.5) * 12,
          y: (att.y + ftip.y) / 2 + 8,
        };
        const fw0 = w0 * 0.4;
        const fsegs = [
          { p0: att, p1: fctrl, p2: ftip, t0: 0, t1: 1, w0: fw0, w1: 0.55 },
        ];
        forks += `<path d="${limbChain(fsegs, 14)}" fill="${fillBody}" stroke="${stroke}"
          stroke-width="0.35" opacity="${isDim ? 0.35 : 0.7}" pointer-events="none"/>`;
      }

      let hairs = "";
      const hairN = P.hair || 0;
      const hairGate = P.hairGate != null ? P.hairGate : 0;
      if (hairN > 0 && struct >= hairGate) {
        const n = Math.min(hairN, 10);
        for (let hi = 0; hi < n; hi++) {
          const tA = 0.45 + 0.48 * hash01(`${L.tree_part}-ht${hi}`);
          const att = chainPoint(segs, tA);
          const a = rad + (hash01(`${L.tree_part}-ha${hi}`) - 0.5) * 1.15;
          const hlen =
            8 + 16 * hash01(`${L.tree_part}-hl${hi}`) * (isDim ? 0.5 : 0.9);
          const hx = att.x + Math.sin(a) * hlen;
          const hy = att.y + Math.abs(Math.cos(a)) * hlen + 3;
          hairs += `<path d="M${f(att.x)} ${f(att.y)}Q${f((att.x + hx) / 2)} ${f((att.y + hy) / 2 + 5)} ${f(hx)} ${f(hy)}"
            fill="none" stroke="${stroke}" stroke-width="0.9"
            opacity="${isDim ? 0.18 : 0.32}" stroke-linecap="round" pointer-events="none"/>`;
        }
      }

      const ridge = ridgePath(segs);
      const ridgeOp = isDim ? 0.2 : 0.4 + progress * 0.2;

      return `
        <g class="tp-lateral" data-part="${L.tree_part}" data-node="${dataId}">
          <path class="tp-root-body ${L.state}" d="${body}" fill="${fillBody}"
            stroke="${stroke}" stroke-width="0.45" opacity="${op}"/>
          <path class="tp-root-ridge" d="${ridge}" fill="none" stroke="${stroke}"
            stroke-width="${1.15 + progress * 0.5}" opacity="${ridgeOp}" stroke-linecap="round"
            pointer-events="none"/>
          ${forks}${hairs}
          <circle class="tp-knot ${L.state}" data-node="${dataId}"
            cx="${f(tipPt.x)}" cy="${f(tipPt.y)}" r="${f(knotR)}"
            fill="${fillFor(L.state)}" stroke="${stroke}" stroke-width="1.1" opacity="${op}"
            style="cursor:${dataId ? "pointer" : "default"}">
            <title>${esc(L.label)}</title>
          </circle>
        </g>`;
    })
    .join("");

  // Tap root — heavy central mass
  const tapProgress = Math.max(0, Math.min(1, tap.fill));
  const tapIsDim = tap.state === "dim" && tap.fill === 0;
  const tapStruct = tapIsDim ? 0.5 : 0.88 + tapProgress * 0.12;
  const tapLen = P.rootDepth * (0.52 + tapProgress * 0.18);
  const tapTip = { x: cx, y: soilY + 10 + tapLen };
  const tapSegs = buildPrimaryRoot(collar, tapTip, "tap", P, tapStruct);
  const tapW0 = tapIsDim ? 3.8 : 5.2 + tapProgress * 2.5;
  const tapW1 = tapIsDim ? 1.1 : 1.5 + tapProgress * 0.6;
  const tapBody = limbChain(withWidths(tapSegs, tapW0, tapW1), 24);
  const tapStroke = strokeFor(tapIsDim ? "dim" : tap.state);
  const tapOp = tapIsDim ? 0.5 : 0.95;
  const tapFillBody =
    tap.state === "fruit"
      ? "rgba(34,197,94,0.72)"
      : "rgba(70,140,200,0.62)";
  const tapRidge = ridgePath(tapSegs);

  // ---- Trunk (tapered sapling stem) ----
  const tFill = Math.max(0.08, trunk.fill); // tiny visible stem even at zero
  const trunkH = P.trunkH * (0.85 + tFill * 0.2) * (0.92 + P.canopyScale * 0.08);
  const twBot = P.trunkW0 + tFill * (P.trunkW1 - P.trunkW0);
  const twTop = twBot * 0.55;
  const trunkTop = soilY - trunkH;
  const trunkOp = trunk.state === "dim" ? 0.45 : 0.95;
  // Trapezoid path for taper
  const trunkPath = `M ${f(cx - twBot / 2)} ${f(soilY + 2)}
    L ${f(cx - twTop / 2)} ${f(trunkTop)}
    L ${f(cx + twTop / 2)} ${f(trunkTop)}
    L ${f(cx + twBot / 2)} ${f(soilY + 2)} Z`;
  const trunkFill =
    trunk.state === "fruit"
      ? "url(#tpTrunkFruit)"
      : "url(#tpTrunkWood)";

  // ---- Canopy: small arched branches + leaf clusters ----
  // Show dim seats as faint stubs; live/started/fruit as real twigs
  const canopyBits = houses
    .map((H) => {
      const sign = H.side === "L" ? -1 : 1;
      // Stagger height — lower houses closer to soil collar, upper near tip
      const yAlong = 0.18 + H.i * 0.12;
      const y0 = trunkTop + trunkH * yAlong;
      const baseReach =
        (38 + H.i * 4) * P.canopyScale * (H.state === "dim" ? 0.55 : 0.75 + H.fill * 0.45);
      const x1 = cx + sign * (twTop * 0.5 + 1);
      const x2 = cx + sign * baseReach;
      // Arch upward like a young tree branch
      const y2 = y0 - (10 + H.i * 3) * P.canopyScale - H.fill * 8;
      const cpx = cx + sign * baseReach * 0.55;
      const cpy = y0 - 14 * P.canopyScale;
      const op =
        H.state === "dim" ? 0.22 : H.state === "fruit" ? 1 : H.state === "started" ? 0.88 : 0.7;
      const stroke =
        H.state === "fruit"
          ? C.fruit
          : H.state === "dim"
            ? C.dimStroke
            : C.amber;
      const sw = H.state === "dim" ? 1.1 : 1.35 + H.fill * 1.8;
      const leafNodes = (H.nodes || []).filter((n) => n.status === "live");
      const dataId = leafNodes[0]?.id || "";

      // Leaf cluster (ellipses) near tip — more when filled
      let leaves = "";
      if (H.state !== "dim") {
        const nLeaf = 2 + Math.round(H.fill * 3);
        for (let k = 0; k < nLeaf; k++) {
          const t = 0.55 + (k / Math.max(1, nLeaf)) * 0.4;
          const lx = x1 + (x2 - x1) * t + sign * (k % 2) * 3;
          const ly = y0 + (y2 - y0) * t - 3 - (k % 3);
          const rx = 3.2 + H.fill * 2.2;
          const ry = 2 + H.fill * 1.4;
          const col =
            H.state === "fruit"
              ? k % 2
                ? C.fruit
                : C.fruitLite
              : C.amber;
          leaves += `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="${f(rx)}" ry="${f(ry)}"
            fill="${col}" opacity="${0.55 + H.fill * 0.4}" transform="rotate(${sign * ( -25 + k * 12)} ${f(lx)} ${f(ly)})"/>`;
        }
      } else {
        // ghost tip dot
        leaves = `<circle cx="${f(x2)}" cy="${f(y2)}" r="2" fill="${C.dim}" opacity="0.5"/>`;
      }

      const labX = x2 + sign * 5;
      const labOp = H.state === "dim" ? 0.4 : op;
      const labFill = H.state === "dim" ? "#555" : "#d4b070";

      return `
        <g class="tp-house" data-part="${H.tree_part}" data-node="${dataId}">
          <path class="tp-branch ${H.state}" d="M ${f(x1)} ${f(y0)} Q ${f(cpx)} ${f(cpy)}, ${f(x2)} ${f(y2)}"
            fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round"/>
          ${leaves}
          <text class="tp-house-label" x="${f(labX)}" y="${f(y2 + 3)}"
            text-anchor="${H.side === "L" ? "end" : "start"}"
            fill="${labFill}" font-size="9" font-family="Segoe UI,system-ui,sans-serif"
            opacity="${labOp}" style="cursor:${dataId ? "pointer" : "default"}" data-node="${dataId}">${esc(H.label)}</text>
        </g>`;
    })
    .join("");

  // Soft soil texture dots (level-scaled; C1 densest)
  let soilDots = "";
  const nDots = P.soilDots != null ? P.soilDots : 40;
  for (let i = 0; i < nDots; i++) {
    const dx = 30 + ((i * 97) % (W - 60));
    const dy = soilY + 20 + ((i * 53) % (H - soilY - 40));
    const r = 0.6 + (i % 3) * 0.35;
    soilDots += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="rgba(200,160,100,0.06)"/>`;
  }

  const svg = `
    <svg class="tree-portrait-svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto"
      role="img" aria-label="Sapling: grammar roots, trunk and vocab leaves">
      <defs>
        <linearGradient id="tpTrunkWood" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="${C.copperDeep}"/>
          <stop offset="55%" stop-color="${C.copper}"/>
          <stop offset="100%" stop-color="${C.amber}"/>
        </linearGradient>
        <linearGradient id="tpTrunkFruit" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#15803d"/>
          <stop offset="100%" stop-color="${C.fruitLite}"/>
        </linearGradient>
        <linearGradient id="tpSoilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.soilTop}"/>
          <stop offset="100%" stop-color="${C.soil}"/>
        </linearGradient>
        <radialGradient id="tpSkyGlow" cx="50%" cy="18%" r="55%">
          <stop offset="0%" stop-color="rgba(224,160,80,0.09)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <linearGradient id="tpGroundGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(200,120,64,0.2)"/>
          <stop offset="100%" stop-color="rgba(200,120,64,0)"/>
        </linearGradient>
        <filter id="tpSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2"/>
        </filter>
      </defs>

      <rect width="${W}" height="${H}" fill="${C.sky}" rx="10"/>
      <!-- air -->
      <rect width="${W}" height="${soilY}" fill="url(#tpSkyGlow)"/>
      <!-- soil bed -->
      <rect x="0" y="${soilY}" width="${W}" height="${H - soilY}" fill="url(#tpSoilGrad)"/>
      ${soilDots}

      <!-- canopy + trunk -->
      <g class="tp-above">
        ${canopyBits}
        <path class="tp-trunk" d="${trunkPath}" fill="${trunkFill}" opacity="${trunkOp}"
          stroke="${C.copperDeep}" stroke-width="0.6"/>
        <!-- tiny leader shoot at tip -->
        <path d="M ${f(cx)} ${f(trunkTop)} Q ${f(cx - 4)} ${f(trunkTop - 14)}, ${f(cx + 1)} ${f(trunkTop - 22)}"
          fill="none" stroke="${trunk.state === "fruit" ? C.fruit : C.copper}"
          stroke-width="1.6" opacity="${0.5 + tFill * 0.4}" stroke-linecap="round"/>
      </g>

      <!-- soil line + glow -->
      <rect x="0" y="${soilY - 10}" width="${W}" height="18" fill="url(#tpGroundGlow)" opacity="0.55" filter="url(#tpSoft)"/>
      <line x1="36" y1="${soilY}" x2="${W - 36}" y2="${soilY}"
        stroke="rgba(208,144,80,0.65)" stroke-width="1.6"/>
      <text x="${W - 44}" y="${soilY - 8}" text-anchor="end" fill="${C.muted}"
        font-size="9" font-family="Segoe UI,system-ui,sans-serif">${esc(P.soilLabel)}</text>

      <!-- roots (ribbons · knots only — no root labels) -->
      <g class="tp-below">
        <path d="${tapBody}" fill="${tapFillBody}" stroke="${tapStroke}"
          stroke-width="0.55" opacity="${tapOp}"/>
        <path d="${tapRidge}" fill="none" stroke="${tapStroke}"
          stroke-width="${1.15 + tapStruct * 0.4}" opacity="${0.28 + tapStruct * 0.25}"
          stroke-linecap="round" pointer-events="none"/>
        <circle cx="${f(tapTip.x)}" cy="${f(tapTip.y)}" r="${f(3.2 + tapProgress * 1.8)}"
          fill="${fillFor(tap.state === "dim" && tap.fill === 0 ? "dim" : tap.state)}"
          opacity="${tapOp}">
          <title>Foundation · ${Math.round(tap.fill * 100)}%</title>
        </circle>
        ${rootBits}
      </g>

      <text x="${cx}" y="20" text-anchor="middle" fill="${C.muted}" font-size="11"
        font-style="italic" font-family="Segoe UI,system-ui,sans-serif">${esc(P.caption)}</text>
      <text x="${cx}" y="36" text-anchor="middle" fill="#555" font-size="10"
        font-style="italic" font-family="Segoe UI,system-ui,sans-serif">${esc(P.caption2)}</text>
    </svg>
  `;

  container.innerHTML = svg;

  if (typeof opts.onSelect === "function") {
    container.querySelectorAll("[data-node]").forEach((el) => {
      const id = el.getAttribute("data-node");
      if (!id) return;
      el.addEventListener("click", () => {
        const node = nodes.find((n) => n.id === id);
        if (node) opts.onSelect(node);
      });
    });
  }

  return { laterals, houses, trunk, tap, level };
}
