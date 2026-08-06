/**
 * Sapling status-portrait — grows with CEFR level (A1 small → A2 taller → B1+ wider).
 * Grammar = roots below soil · Vocab = trunk + little branches/leaves above.
 * Navigation stays on the spine list; soft click on knots/labels focuses a node.
 */

/** @typedef {{ id: string, domain: string, tree_part?: string, root?: string, status?: string, foundation?: boolean, label?: string }} TreeNode */

const GRAMMAR_LATERALS = [
  { tree_part: "forms", label: "Forms", angle: -52 },
  { tree_part: "verbs", label: "Verbs", angle: -22 },
  { tree_part: "sentence", label: "Sentence", angle: 8 },
  { tree_part: "chunks", label: "Chunks", angle: 36 },
  { tree_part: "links", label: "Linking", angle: 58 },
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
    W: 620,
    H: 500,
    soilY: 250,
    trunkH: 72,
    trunkW0: 9,
    trunkW1: 14,
    canopyScale: 0.72,
    rootDepth: 105,
    rootReach: 0.72,
    fork: false,
    hair: 0,
    caption: "Young sapling — small roots, small canopy.",
    caption2: "Grows with fruit · click = path unit",
    soilLabel: "A1 · soil",
  },
  A2: {
    W: 640,
    H: 560,
    soilY: 268,
    trunkH: 100,
    trunkW0: 11,
    trunkW1: 18,
    canopyScale: 0.9,
    rootDepth: 140,
    rootReach: 0.85,
    fork: true,
    hair: 2,
    caption: "Taller sapling — deeper roots.",
    caption2: "A2 · more branches",
    soilLabel: "A2 · soil",
  },
  B1: {
    W: 660,
    H: 620,
    soilY: 280,
    trunkH: 120,
    trunkW0: 13,
    trunkW1: 22,
    canopyScale: 1.05,
    rootDepth: 175,
    rootReach: 0.95,
    fork: true,
    hair: 4,
    caption: "Young tree — wider system.",
    caption2: "B1 · denser roots and canopy",
    soilLabel: "B1 · soil",
  },
  B2: {
    W: 680,
    H: 660,
    soilY: 290,
    trunkH: 135,
    trunkW0: 14,
    trunkW1: 24,
    canopyScale: 1.12,
    rootDepth: 195,
    rootReach: 1,
    fork: true,
    hair: 6,
    caption: "Growing into a full tree.",
    caption2: "B2 · deep system",
    soilLabel: "B2 · soil",
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

/** Organic cubic from soil collar to tip (slight sag + lateral). */
function rootCurve(cx, soilY, angleDeg, len, wobble) {
  const rad = (angleDeg * Math.PI) / 180;
  // angle 0 = straight down; negative = left
  const tipX = cx + Math.sin(rad) * len;
  const tipY = soilY + 10 + Math.cos(rad * 0.15) * len * 0.92;
  const mid = 0.45;
  const c1x = cx + Math.sin(rad) * len * mid * 0.55 + wobble * 0.15;
  const c1y = soilY + 18 + len * 0.22;
  const c2x = cx + Math.sin(rad) * len * 0.78 + wobble * 0.35;
  const c2y = soilY + 12 + len * 0.55;
  return {
    tipX,
    tipY,
    d: `M ${f(cx)} ${f(soilY + 6)} C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(tipX)} ${f(tipY)}`,
  };
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

  // ---- Roots (below) ----
  const rootBits = laterals
    .map((L, idx) => {
      const len =
        P.rootDepth * P.rootReach * (0.55 + L.fill * 0.45) *
        (L.state === "dim" ? 0.55 : 1);
      const wobble = (idx % 2 === 0 ? -1 : 1) * (10 + idx * 3);
      const { tipX, tipY, d } = rootCurve(cx, soilY, L.angle, len, wobble);
      const sw =
        L.state === "dim" ? 1.6 : 1.8 + L.fill * 4.5;
      const stroke = strokeFor(L.state);
      const op = L.state === "dim" ? 0.32 : 0.92;
      const knotR =
        (L.state === "dim" ? 2.8 : 3.6 + L.fill * 2.4) * (level === "A1" ? 0.95 : 1);
      const firstNode = (L.nodes || []).find((n) => n.status === "live");
      const dataId = firstNode ? firstNode.id : "";
      const labFill = L.state === "dim" ? "#555" : C.ink;

      // Optional tiny fork when progressing (A2+)
      let fork = "";
      if (P.fork && L.state !== "dim" && L.fill > 0.25) {
        const side = L.angle < 0 ? -1 : 1;
        const fx = tipX + side * (12 + L.fill * 10);
        const fy = tipY - 8 - L.fill * 6;
        fork = `<path d="M ${f(tipX * 0.35 + cx * 0.65)} ${f((tipY + soilY) / 2)} Q ${f(tipX + side * 8)} ${f(tipY - 4)}, ${f(fx)} ${f(fy)}"
          fill="none" stroke="${stroke}" stroke-width="${1.2 + L.fill}" opacity="${0.45 + L.fill * 0.4}" stroke-linecap="round"/>`;
      }

      // Fine hairs near tip when fill high
      let hairs = "";
      if (P.hair > 0 && L.fill > 0.35 && L.state !== "dim") {
        for (let h = 0; h < Math.min(P.hair, 3); h++) {
          const a = L.angle + (h - 1) * 12;
          const hr = ((a * Math.PI) / 180);
          const hx = tipX + Math.sin(hr) * (8 + h * 4);
          const hy = tipY + 6 + h * 3;
          hairs += `<path d="M ${f(tipX)} ${f(tipY)} Q ${f((tipX + hx) / 2)} ${f(tipY + 8)}, ${f(hx)} ${f(hy)}"
            fill="none" stroke="${stroke}" stroke-width="1" opacity="0.35" stroke-linecap="round"/>`;
        }
      }

      return `
        <g class="tp-lateral" data-part="${L.tree_part}" data-node="${dataId}">
          <path class="tp-root ${L.state}" d="${d}" fill="none" stroke="${stroke}"
            stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>
          ${fork}${hairs}
          <circle class="tp-knot ${L.state}" data-node="${dataId}"
            cx="${f(tipX)}" cy="${f(tipY)}" r="${f(knotR)}"
            fill="${fillFor(L.state)}" stroke="${stroke}" stroke-width="1.1" opacity="${op}"
            style="cursor:${dataId ? "pointer" : "default"}"/>
          <text class="tp-label" x="${f(tipX)}" y="${f(tipY + 14)}" text-anchor="middle"
            fill="${labFill}" font-size="9.5" font-family="Segoe UI,system-ui,sans-serif"
            opacity="${L.state === "dim" ? 0.55 : 0.95}">${esc(L.label)}</text>
        </g>`;
    })
    .join("");

  // Tap root
  const tapLen = P.rootDepth * (0.42 + tap.fill * 0.35);
  const tapSw = tap.state === "dim" && tap.fill === 0 ? 2 : 2.2 + tap.fill * 5;
  const tapStroke = strokeFor(
    tap.state === "dim" && tap.fill === 0 ? "dim" : tap.state,
  );
  const tapOp = tap.state === "dim" && tap.fill === 0 ? 0.35 : 0.95;
  // Gentle S for tap
  const tapD = `M ${f(cx)} ${f(soilY + 6)} C ${f(cx - 6)} ${f(soilY + tapLen * 0.4)}, ${f(cx + 5)} ${f(soilY + tapLen * 0.7)}, ${f(cx)} ${f(soilY + 6 + tapLen)}`;

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

  // Soft soil texture dots
  let soilDots = "";
  const nDots = level === "A1" ? 28 : level === "A2" ? 40 : 56;
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

      <!-- roots -->
      <g class="tp-below">
        <path d="${tapD}" fill="none" stroke="${tapStroke}" stroke-width="${tapSw}"
          stroke-linecap="round" opacity="${tapOp}"/>
        <circle cx="${f(cx)}" cy="${f(soilY + 6 + tapLen)}" r="${f(3 + tap.fill * 2.5)}"
          fill="${fillFor(tap.state === "dim" && tap.fill === 0 ? "dim" : tap.state)}"
          opacity="${tapOp}"/>
        <text x="${f(cx)}" y="${f(soilY + 6 + tapLen + 15)}" text-anchor="middle"
          fill="${tap.fill > 0.05 ? C.copper : "#555"}" font-size="9.5"
          font-family="Segoe UI,system-ui,sans-serif">Foundation · ${Math.round(tap.fill * 100)}%</text>
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
