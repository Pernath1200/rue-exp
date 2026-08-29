/**
 * Tree status-portrait: ONE tree, drawn at five ages.
 *
 * A single full-size skeleton is grown once from one seed (trunk, five main
 * limbs, twelve house limbs, twigs, leaf and fruit slots, seven roots). Each
 * CEFR level renders an AGE of that same skeleton:
 *   - the stem reaches a fraction of its full height; a main limb is born when
 *     the stem passes its attach height and elongates from there
 *   - a house limb sprouts once its parent limb has grown past its attach point;
 *     twigs and leaves follow the same rule one level down
 *   - a house with no limb yet is a leaf on the stem at its seat (a bud)
 *   - roots mirror the crown at every age; forks and rootlets come with age
 * Nothing re-randomises between levels, so A1 -> C1 reads as growth.
 *
 * Seats (rue-codex, 2026-08-23): grammar = tap root + six laterals
 * (Curriculum_Codex_Grammar); vocab = trunk + twelve houses (the astrological
 * houses of Curriculum_Codex_Vocab), 1st at the collar, 12th at the crown.
 * Lighting: leaf lit = unit started/done, fruit lit = unit done, root knot lit
 * = same on that seat. Unlit slots stay as ghosts so the model is readable.
 * At most 6 slots per seat; empty live units do not steal lights from work
 * already done (A1 map slice, 2026-08-28). Fruit strengthens at remembered
 * then mastered (map only; strongest first). Navigation stays on the spine
 * list; clicks here only focus a unit.
 */

/** @typedef {{ id: string, domain: string, tree_part?: string, root?: string, status?: string, foundation?: boolean, label?: string, codex_unit?: string, levels?: string[] }} TreeNode */

// ---------------------------------------------------------------------------
// Seats
// ---------------------------------------------------------------------------

const LATERALS = [
  { tree_part: "noun_phrase", label: "Forms" },
  { tree_part: "verb_phrase", label: "Verbs" },
  { tree_part: "sentence_syntax", label: "Sentence" },
  { tree_part: "clause_linking", label: "Linking" },
  { tree_part: "verb_complementation", label: "Verb patterns" },
  { tree_part: "prepositions_particles", label: "Prepositions" },
];
const HOUSES_L = [
  { tree_part: "self_body", label: "Self & body" },
  { tree_part: "communication", label: "Communication" },
  { tree_part: "creativity_love", label: "Creativity & love" },
  { tree_part: "partnerships", label: "Partnerships" },
  { tree_part: "knowledge_travel", label: "Knowledge & travel" },
  { tree_part: "community", label: "Community" },
];
const HOUSES_R = [
  { tree_part: "money_possessions", label: "Money" },
  { tree_part: "home_family", label: "Home & family" },
  { tree_part: "work_routine", label: "Work & routine" },
  { tree_part: "change_transformation", label: "Change" },
  { tree_part: "public_life", label: "Public life" },
  { tree_part: "inner_life_belief", label: "Inner life" },
];
const HOUSES = HOUSES_L.concat(HOUSES_R);
const BRANCH_UNIT = /^V_(SEL|MON|COM|HOM|CRE|WRK|PAR|CHA|KNO|PUB|CMT|INN)-/;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// ---------------------------------------------------------------------------
// The one tree (full size) and its ages
// ---------------------------------------------------------------------------

const VB = { w: 860, h: 1100, soil: 700, cx: 430 };

/** Mature tree parameters (the B2 treegen study, which read well). */
const FULL = {
  seed: 7, trunkH: 250, trunkW: 50, taper: 0.42, childWidth: 0.66, mainLimbs: 5,
  branchAngle: 46, limbCurve: 0.5, mainLimbLen: 0.92, houseLimbLen: 100,
  twigWidth: 1.2, leafSize: 30, leafVar: 0.25, fruitR: 4.6,
  rootWidth: 0.9, rootSpread: 1.0, rootDepth: 0.7, rootAngle: 64, rootForks: 2,
};

/** Age per level. stem = fraction of full stem height reached; girth = width factor. */
const AGES = {
  A1: { stem: 0.40, girth: 0.11, leaf: 0.40, caption: "Sapling - one stem, first leaves.", soilLabel: "A1 - soil" },
  A2: { stem: 0.56, girth: 0.24, leaf: 0.55, caption: "Young tree - first limbs.", soilLabel: "A2 - soil" },
  B1: { stem: 0.72, girth: 0.45, leaf: 0.70, caption: "Growing - limbs branching.", soilLabel: "B1 - soil" },
  B2: { stem: 0.88, girth: 0.74, leaf: 0.86, caption: "Filling out - a full crown forming.", soilLabel: "B2 - soil" },
  C1: { stem: 1.00, girth: 1.00, leaf: 1.00, caption: "Mature tree - full system.", soilLabel: "C1 - soil" },
};

const C = {
  wood: "#569cd6", leaf: "#4db6c7", fruit: "#22c55e",
  fruitRemembered: "#4ade80", fruitMastered: "#86efac",
  knotBg: "#0c1014",
  label: "#d4b070", labelDim: "#8a8a8a", muted: "#7a7a7a",
  sky: "#0a0a0a", soil: "#0c1014", soilTop: "#121820",
};
const GHOST = 0.3;
const D2R = Math.PI / 180;

// ---------------------------------------------------------------------------
// RNG + geometry
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
class Rng {
  constructor(seed) { this.f = mulberry32(seed); }
  n() { return this.f(); }
  u(a, b) { return a + (b - a) * this.f(); }
  j(a) { return (this.f() * 2 - 1) * a; }
  int(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
  sign() { return this.f() < 0.5 ? -1 : 1; }
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const dirUp = (th) => [Math.sin(th), -Math.cos(th)];
const dirDn = (th) => [Math.sin(th), Math.cos(th)];
function bez(P, t) {
  const [p0, p1, p2, p3] = P, u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
}
function bezTan(P, t) {
  const [p0, p1, p2, p3] = P, u = 1 - t;
  const v = [3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
             3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])];
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}
const f1 = (x) => (Math.round(x * 10) / 10).toString();
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Cubic limb leaving `start` at angle th0 (from vertical), bending toward vertical by `curve`. */
function makeLimb(start, th0, len, curve, s, up, w0, taper) {
  const th1 = th0 * (1 - 0.55 * curve);
  const D = up ? dirUp : dirDn;
  const d0 = D(th0), d1 = D(th1), dm = D((th0 + th1) / 2);
  const p0 = start;
  const p3 = [p0[0] + dm[0] * len * 0.95, p0[1] + dm[1] * len * 0.95];
  const n0 = [-d0[1], d0[0]];
  const p1 = [p0[0] + d0[0] * len * 0.36 + n0[0] * len * s, p0[1] + d0[1] * len * 0.36 + n0[1] * len * s];
  const p2 = [p3[0] - d1[0] * len * 0.34 - n0[0] * len * s, p3[1] - d1[1] * len * 0.34 - n0[1] * len * s];
  const P = [p0, p1, p2, p3];
  return {
    P, th0, th1, len, up, w0, taper,
    at: (t) => bez(P, t),
    tan: (t) => bezTan(P, t),
    ang: (t) => { const v = bezTan(P, t); return up ? Math.atan2(v[0], -v[1]) : Math.atan2(v[0], v[1]); },
    w: (t) => w0 * (1 - (1 - taper) * t),
    tip: () => bez(P, 1),
  };
}
/** The first `frac` of a limb, re-parametrised to [0,1], tapering to its own tip. */
function partial(L, frac) {
  const len = L.len * frac;
  return {
    len, up: L.up, w0: L.w0, taper: L.taper, P: L.P,
    at: (t) => L.at(t * frac),
    tan: (t) => L.tan(t * frac),
    ang: (t) => L.ang(t * frac),
    w: (t) => L.w0 * (1 - (1 - L.taper) * t),
    tip: () => L.at(frac),
  };
}
/** Filled tapered closed path. `ph` is a fixed phase for the hand-drawn unevenness. */
function taperedPath(L, flare, ph, pinch) {
  const n = Math.max(8, Math.min(40, Math.round(L.len / 7)));
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = L.at(t), tg = L.tan(t);
    let hw = L.w(t) / 2;
    if (flare && t < 0.12) hw *= 1 + flare * Math.pow(1 - t / 0.12, 2);
    if (pinch !== false && t > 0.86) hw *= 1 - 0.72 * Math.pow((t - 0.86) / 0.14, 1.4);
    hw *= 1 + 0.035 * Math.sin(ph + i * 0.9);
    const nx = tg[1], ny = -tg[0];
    left.push([p[0] + nx * hw, p[1] + ny * hw]);
    right.push([p[0] - nx * hw, p[1] - ny * hw]);
  }
  const r = Math.max(0.4, (L.w(1) * (pinch === false ? 1 : 0.28)) / 2);
  let d = "M" + f1(left[0][0]) + "," + f1(left[0][1]);
  for (let i = 1; i <= n; i++) d += "L" + f1(left[i][0]) + "," + f1(left[i][1]);
  d += "A" + f1(r) + "," + f1(r) + " 0 0 1 " + f1(right[n][0]) + "," + f1(right[n][1]);
  for (let i = n - 1; i >= 0; i--) d += "L" + f1(right[i][0]) + "," + f1(right[i][1]);
  return d + "Z";
}
function hairPath(L) {
  const P = L.P;
  return "M" + f1(P[0][0]) + "," + f1(P[0][1]) + "C" + f1(P[1][0]) + "," + f1(P[1][1]) + " " +
         f1(P[2][0]) + "," + f1(P[2][1]) + " " + f1(P[3][0]) + "," + f1(P[3][1]);
}
function edgePoint(parent, t, side, tuck) {
  const p = parent.at(t), tg = parent.tan(t);
  const nx = -tg[1], ny = tg[0];
  const hw = Math.max(0, parent.w(t) / 2 - (tuck == null ? 1.5 : tuck));
  return [p[0] + nx * hw * side, p[1] + ny * hw * side];
}
const LEAF_D = [
  "M0,0C.36,-.22 .4,-.7 0,-1C-.4,-.7 -.36,-.22 0,0ZM0,0L0,-.72",
  "M0,0C.2,-.32 .25,-.76 0,-1C-.25,-.76 -.2,-.32 0,0ZM0,0L0,-.7",
  "M0,0C.44,-.14 .36,-.64 0,-1C-.27,-.74 -.34,-.3 0,0ZM0,0L0,-.68",
];

// ---------------------------------------------------------------------------
// Build the full skeleton once: every random choice is drawn here and stored.
// ---------------------------------------------------------------------------

let MODEL = null;

function buildModel() {
  if (MODEL) return MODEL;
  const p = FULL;
  const rng = new Rng(p.seed);
  const m = { p };

  m.trunk = { lean: rng.j(6) * D2R, s: rng.j(0.025), ph: rng.u(0, 6.28) };

  // main limbs: attach fraction t on the stem, angle, length
  const nMain = p.mainLimbs, hasTop = nMain % 2 === 1, nSide = hasTop ? nMain - 1 : nMain;
  m.mains = [];
  let side = rng.sign();
  for (let i = 0; i < nSide; i++) {
    const f = nSide > 1 ? i / (nSide - 1) : 0;
    m.mains.push({
      t: Math.min(0.99, 0.34 + 0.62 * f + rng.j(0.03)),
      th0: side * (p.branchAngle + (1 - f) * 10 + rng.j(6)) * D2R,
      len: p.trunkH * p.mainLimbLen * (1.1 - 0.32 * f) * (1 + rng.j(0.08)),
      s: rng.j(0.035), ph: rng.u(0, 6.28), side, isTop: false,
    });
    side = -side;
  }
  if (hasTop) {
    const s = rng.sign();
    m.mains.push({ t: 0.985, th0: s * rng.u(6, 14) * D2R, len: p.trunkH * p.mainLimbLen * 0.66, s: rng.j(0.04), ph: rng.u(0, 6.28), side: 0, isTop: true });
  }
  m.mains.forEach((L) => L.ph2 = rng.u(0, 6.28));

  // house slots on main limbs
  const counts = nMain === 5 ? [3, 3, 2, 2, 2] : nMain === 4 ? [3, 3, 3, 3] : [4, 4, 4];
  const slotT = { 2: [0.56, 1], 3: [0.4, 0.72, 1], 4: [0.32, 0.55, 0.78, 1] };
  m.houses = [];
  let topSide = rng.sign();
  m.mains.forEach((L, mi) => {
    const k = counts[mi];
    slotT[k].forEach((t0, si) => {
      const isTip = si === k - 1;
      const t = isTip ? 1 : Math.max(0.2, Math.min(0.9, t0 + rng.j(0.03)));
      let s;
      if (L.isTop) { s = topSide; topSide = -topSide; } else s = si % 2 === 0 ? L.side : -L.side;
      const h = { main: mi, t, side: s, isTip,
        thJit: isTip ? rng.u(6, 18) * D2R : rng.j(8) * D2R,
        len: p.houseLimbLen * (1 + rng.j(0.12)) * (isTip ? 1.1 : 1),
        s: rng.j(0.06), ph: rng.u(0, 6.28), twigs: [] };
      const nt = rng.int(2, 4);
      let ts = rng.sign();
      for (let i = 0; i < nt; i++) {
        h.twigs.push({ t: Math.max(0.12, Math.min(0.95, 0.3 + 0.55 * (nt > 1 ? i / (nt - 1) : 0.5) + rng.j(0.05))),
          th: ts * rng.u(30, 55) * D2R, lenMul: rng.u(0.3, 0.46), s: rng.j(0.05), side: ts, isTip: false });
        ts = -ts;
      }
      h.twigs.push({ t: 1, th: rng.j(12) * D2R, lenMul: rng.u(0.3, 0.4), s: rng.j(0.05), side: rng.sign(), isTip: true });
      // leaf candidates: twig tips first, then twig mids; keep six
      const cands = [];
      h.twigs.forEach((T, ti) => cands.push({ twig: ti, atTip: true, pri: 0, r: rng.n() }));
      h.twigs.forEach((T, ti) => cands.push({ twig: ti, atTip: false, pri: 1, r: rng.n(), thOff: -T.side * rng.u(40, 60) * D2R }));
      cands.sort((a, b) => a.pri - b.pri || a.r - b.r);
      h.leaves = cands.slice(0, 6).map((c) => ({ ...c, thJit: rng.j(35) * D2R, sizeMul: 1 + rng.j(p.leafVar), v: rng.int(0, 2) }));
      h.fruit = [1, 4].map(() => ({ nJit: [rng.j(3), rng.j(3)], a0: rng.u(0, 6.28), aJit: [rng.j(0.35), rng.j(0.35), rng.j(0.35)] }));
      h.budLeaf = { v: rng.int(0, 2), thJit: rng.j(12) * D2R, sizeMul: 1 + rng.j(0.15) };
      m.houses.push(h);
    });
  });

  // roots: six laterals + tap
  const fr6 = [[-1, 0.36], [-0.7, 0.7], [-0.28, 0.95], [0.28, 0.95], [0.7, 0.7], [1, 0.36]];
  const thF6 = [-1, -0.62, -0.22, 0.22, 0.62, 1];
  m.roots = [];
  for (let i = 0; i < 7; i++) {
    const tap = i === 6;
    const r = {
      tap,
      fx: tap ? 0 : fr6[i][0], fy: tap ? 1.02 : fr6[i][1], thF: tap ? 0 : thF6[i],
      endJit: [rng.j(tap ? 6 : 0.05), rng.j(tap ? 0 : 0.06)], thJit: rng.j(tap ? 3 : 4) * D2R,
      ctrlJit: rng.j(10), ph: rng.u(0, 6.28), forks: [], hairs: [],
      knotJit: Array.from({ length: 6 }, () => rng.j(0.015)),
    };
    let fs = rng.sign();
    for (let k = 0; k < p.rootForks; k++) {
      r.forks.push({ t: k === 0 ? rng.u(0.34, 0.46) : rng.u(0.62, 0.74), th: fs * rng.u(28, 48) * D2R, lenMul: rng.u(0.55, 0.8), s: rng.j(0.05), ph: rng.u(0, 6.28), side: fs });
      fs = -fs;
    }
    const nr = rng.int(2, 3);
    for (let k = 0; k < nr; k++) r.hairs.push({ host: k, t: rng.u(0.45, 0.9), th: rng.sign() * rng.u(25, 55) * D2R, lenU: rng.u(28, 60), s: rng.j(0.06) });
    r.tipHair = { th: rng.j(12) * D2R, lenU: rng.u(30, 50), s: rng.j(0.05) };
    m.roots.push(r);
  }

  // leader leaves at the stem tip (young ages only)
  m.leader = Array.from({ length: 3 }, (_, i) => ({ th: (i - 1) * rng.u(28, 40) * D2R + rng.j(6) * D2R, sizeMul: rng.u(0.8, 1.1), v: rng.int(0, 2) }));

  // soil ticks
  m.ticks = Array.from({ length: rng.int(8, 12) }, () => ({ x: rng.u(20, VB.w - 20), h: rng.u(5, 11), dx: rng.j(3) }));

  // seat assignment on the FULL tree: odd houses left, even right, lowest first
  const full = layout(m, { stem: 1, girth: 1, leaf: 1 });
  const lefts = [], rights = [];
  full.houses.forEach((g, i) => { const isLeft = g.side !== 0 ? g.side < 0 : g.tipX < VB.cx; (isLeft ? lefts : rights).push(i); });
  const pick = (arr) => { const j = arr.findIndex((i) => m.houses[i].side === 0); return arr.splice(j >= 0 ? j : arr.length - 1, 1)[0]; };
  while (lefts.length > 6) rights.push(pick(lefts));
  while (rights.length > 6) lefts.push(pick(rights));
  lefts.sort((a, b) => full.houses[b].midY - full.houses[a].midY);
  rights.sort((a, b) => full.houses[b].midY - full.houses[a].midY);
  lefts.forEach((hi, rank) => { m.houses[hi].seat = rank; m.houses[hi].seatSide = -1; });
  rights.forEach((hi, rank) => { m.houses[hi].seat = 6 + rank; m.houses[hi].seatSide = 1; });
  MODEL = m;
  return m;
}

// ---------------------------------------------------------------------------
// Lay the skeleton out at an age (pure geometry, no randomness)
// ---------------------------------------------------------------------------

function layout(m, age, girthBonus = 0) {
  const p = m.p, cx = VB.cx, soilY = VB.soil;
  const bbox = { x0: 1e9, x1: -1e9, y0: 1e9 };
  const see = (x, y) => { if (x < bbox.x0) bbox.x0 = x; if (x > bbox.x1) bbox.x1 = x; if (y < bbox.y0) bbox.y0 = y; };
  const fb = { x0: 1e9, x1: -1e9, y0: 1e9 };
  const seeF = (q) => { if (q[0] < fb.x0) fb.x0 = q[0]; if (q[0] > fb.x1) fb.x1 = q[0]; if (q[1] < fb.y0) fb.y0 = q[1]; see(q[0], q[1]); };

  // Cambium bonus rides on top of age girth (trunk + collar + root bases
  // follow through G.trunkW — the growth layer thickens the whole column).
  // The skeleton stays level-driven; the bonus is small, capped, additive.
  const trunkW = p.trunkW * Math.min(1, age.girth + girthBonus);
  const full = makeLimb([cx, soilY + 3], m.trunk.lean, p.trunkH + 3, 0.25, m.trunk.s, true, trunkW, p.taper);
  const trunk = partial(full, age.stem);
  for (let t = 0; t <= 1.001; t += 0.1) seeF(trunk.at(t));
  const stemTip = trunk.tip();

  const mains = m.mains.map((M) => {
    // A limb buds a little below the rising tip (at 0.8 of its attach height)
    // and is full-grown by maturity; lower limbs lead, the crown limb comes last.
    const born = (age.stem - 0.8 * M.t) / ((1 - 0.8 * M.t) * 0.9);
    const g = M.isTop ? clamp01(born * 1.3 - 0.3) : clamp01(born);
    if (g <= 0) return { g: 0, M };
    const tt = Math.min(0.995, M.t / age.stem);
    const w0 = (M.isTop ? trunk.w(tt) * 0.92 : trunk.w(tt) * p.childWidth) * (0.55 + 0.45 * g);
    const start = M.isTop ? trunk.at(tt) : edgePoint(trunk, tt, M.side, w0 * 0.5 + 1);
    const len = M.len * (0.12 + 0.88 * g);
    const L = makeLimb(start, M.th0, len, p.limbCurve, M.s, true, w0, p.taper);
    for (let t = 0; t <= 1.001; t += 0.1) seeF(L.at(t));
    return { g, M, L, fullLen: M.len };
  });

  const houses = m.houses.map((H) => {
    const main = mains[H.main];
    const out = { H, side: H.side, seat: H.seat, seatSide: H.seatSide, g: 0, twigs: [], leaves: [], fruit: [] };
    if (!main.g) return out;
    const cur = main.L.len, attachLen = H.t * main.fullLen;
    let g;
    if (H.isTip) g = clamp01((main.g - 0.6) / 0.4);
    else g = clamp01((cur - attachLen) / (0.32 * main.fullLen));
    if (g <= 0) return out;
    const par = main.L;
    const tt = H.isTip ? 1 : Math.min(0.97, attachLen / cur);
    const parTh = par.ang(tt);
    let th0, start, w0;
    if (H.isTip) { th0 = parTh + H.side * H.thJit; start = par.tip(); w0 = par.w(1) * 0.95; }
    else { th0 = parTh + H.side * (p.branchAngle * 0.95 * D2R + H.thJit); w0 = par.w(tt) * p.childWidth; start = edgePoint(par, tt, H.side, w0 * 0.5 + 1); }
    th0 = Math.max(-82 * D2R, Math.min(82 * D2R, th0));
    const len = H.len * (0.1 + 0.9 * g);
    const L = makeLimb(start, th0, len, p.limbCurve, H.s, true, w0 * (0.5 + 0.5 * g), p.taper);
    for (let t = 0; t <= 1.001; t += 0.2) seeF(L.at(t));
    out.g = g; out.L = L;
    const mid = L.at(0.5); out.midY = mid[1]; out.tipX = L.tip()[0]; out.tip = L.tip();
    // twigs grow once the limb has passed them
    const twigs = H.twigs.map((T) => {
      const tg = T.isTip ? clamp01((g - 0.55) / 0.45) : clamp01((len - T.t * H.len) / (0.35 * H.len));
      if (tg <= 0) return null;
      const tl = H.len * T.lenMul * (0.25 + 0.75 * tg) * (0.6 + 0.4 * age.leaf);
      let TT;
      if (T.isTip) TT = makeLimb(L.at(0.985), L.th1 + T.th, tl, 0.5, T.s, true, 0, 1);
      else { const tt2 = Math.min(0.97, (T.t * H.len) / len); TT = makeLimb(edgePoint(L, tt2, T.side, 0.5), L.ang(tt2) + T.th, tl, 0.5, T.s, true, 0, 1); }
      TT.side = T.side; TT.g = tg;
      see(TT.tip()[0], TT.tip()[1]);
      return TT;
    });
    out.twigs = twigs;
    const base = L.at(0);
    const leaves = [];
    H.leaves.forEach((c) => {
      const T = twigs[c.twig];
      if (!T) return;
      const pt = c.atTip ? T.tip() : T.at(0.55);
      const th = (c.atTip ? T.ang(1) : T.ang(0.55) + c.thOff) + c.thJit;
      const size = p.leafSize * c.sizeMul * (0.45 + 0.55 * age.leaf) * (0.6 + 0.4 * T.g);
      const d = dirUp(th);
      see(pt[0] + d[0] * size, pt[1] + d[1] * size);
      leaves.push({ p: pt, th, size, v: c.v, dist: Math.hypot(pt[0] - base[0], pt[1] - base[1]) });
    });
    leaves.sort((a, b) => a.dist - b.dist);
    out.leaves = leaves;
    const fruit = [];
    H.fruit.forEach((F, fi) => {
      const li = fi === 0 ? 1 : 4;
      const lf = leaves[Math.min(li, leaves.length - 1)];
      if (!lf) return;
      const d = dirUp(lf.th), n = [-d[1], d[0]];
      const c = [lf.p[0] + d[0] * lf.size * 0.38 + n[0] * F.nJit[0], lf.p[1] + d[1] * lf.size * 0.38 + n[1] * F.nJit[1]];
      const rad = p.fruitR * 1.2 * (0.5 + 0.5 * age.leaf);
      for (let k = 0; k < 3; k++) {
        const a = F.a0 + k * 2.094 + F.aJit[k];
        const fp = [c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad];
        fruit.push({ p: fp, dist: Math.hypot(fp[0] - base[0], fp[1] - base[1]) });
      }
    });
    fruit.sort((a, b) => a.dist - b.dist);
    out.fruit = fruit;
    return out;
  });

  return { trunk, full, stemTip, mains, houses, bbox, fb, trunkW };
}

// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------

/** Cap 6. Ghosts of empty units do not thin started/fruited lights. */
export function litSlots(live, count) {
  if (!live || !live.length || !count) return 0;
  return Math.min(6, count);
}

/** Cambium girth bonus (James, 2026-08-29): word-craft reps thicken the
 *  trunk with diminishing returns — rings, not a meter. repSum is the
 *  weighted rank sum of word_craft packs at or below the viewed level
 *  (started 0.5 · learned 1 · remembered 1.6 · mastered 2). Saturating:
 *  early work shows most; hard cap well under one age step. */
export function cambiumGirthBonus(repSum) {
  return repSum > 0 ? 0.14 * (repSum / (repSum + 3)) : 0;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {TreeNode[]} opts.nodes
 * @param {(id: string) => boolean} opts.isFruit
 * @param {(id: string) => string} opts.progressState  "fruit" | "started" | other
 * @param {(node: TreeNode) => void} [opts.onSelect]
 * @param {string} [opts.level]
 */
export function renderTreePortrait(container, opts) {
  const nodes = opts.nodes || [];
  const isFruit = opts.isFruit || (() => false);
  const progressState = opts.progressState || (() => "planned");
  const level = AGES[opts.level] ? opts.level : "A1";
  const age = AGES[level];
  const lvIdx = LEVELS.indexOf(level);
  // Payoff mode: seats to highlight (tree_part ids, "trunk" included) and the
  // unit just completed, whose newest lit slot gets the grow-in animation.
  const highlight = new Set(opts.highlight || []);
  const justNow = opts.justNow || null;
  const animateGrowth = opts.animateGrowth !== false && Boolean(justNow);
  // Node ids with recent activity (Set) — when provided, sapling-age house
  // labels only name houses with recent growth instead of any activity ever.
  const recent = opts.recent || null;
  /* focus:"roots" — the grammar payoff view (James, 2026-08-24): grammar lives
   * below ground, so finishing a grammar unit shows trunk + roots ONLY — no
   * limbs, no crown labels — with the unit's root emphasised, growing, and
   * labelled (focusLabel), and the trunk pulsing slightly thicker. The map
   * portrait and vocab payoffs are unchanged. */
  const focusRoots = opts.focus === "roots";
  // Map render vs payoff render: payoffs pass focus:"roots" (grammar) or
  // justNow (vocab). Map-only dressing (root names, apex bud) keys off this
  // so the payoff look stays exactly as it was (James, 2026-08-29).
  const mapOnly = !focusRoots && !opts.justNow;
  const focusLabel = opts.focusLabel || "";
  const m = buildModel();
  const p = m.p;
  const cx = VB.cx, soilY = VB.soil;

  // ---- units onto seats (material up to this level) ----
  const atLevel = (n) => (n.levels || []).some((l) => LEVELS.indexOf(l) >= 0 && LEVELS.indexOf(l) <= lvIdx);
  const isBranchUnit = (n) => n.domain === "vocab" && BRANCH_UNIT.test(n.codex_unit || "");
  const byPart = {}, themesByHouse = {};
  for (const n of nodes) {
    const tp = n.domain === "grammar" ? n.root || n.tree_part : n.tree_part || null;
    if (!tp) continue;
    const bucket = n.domain === "vocab" && tp !== "trunk" && !isBranchUnit(n) ? themesByHouse : byPart;
    if (!bucket[tp]) bucket[tp] = [];
    bucket[tp].push(n);
  }
  const stateOf = (n) => {
    const st = progressState(n.id);
    if (st === "mastered" || st === "remembered" || st === "fruit" || st === "started") return st;
    if (isFruit(n.id)) return "fruit";
    return "none";
  };
  const rankOf = (s) => (s === "mastered" ? 4 : s === "remembered" ? 3 : s === "fruit" ? 2 : s === "started" ? 1 : 0);
  function seat(list) {
    const live = (list || []).filter((n) => n.status === "live" && atLevel(n));
    const touched = live.filter((n) => rankOf(stateOf(n)) >= 1);
    const fruited = live.filter((n) => rankOf(stateOf(n)) >= 2);
    const remembered = live.filter((n) => rankOf(stateOf(n)) >= 3);
    const mastered = live.filter((n) => rankOf(stateOf(n)) >= 4);
    const fill = live.length ? (fruited.length + 0.45 * (touched.length - fruited.length)) / live.length : 0;
    const state = !live.length ? "dim" : fruited.length ? "fruit" : touched.length ? "started" : "live";
    return { live, fruited, remembered, mastered, touched, fill, state, nodes: list || [] };
  }
  const laterals = LATERALS.map((L) => {
    const s = seat(byPart[L.tree_part]);
    return { ...L, ...s, knots: litSlots(s.live, s.touched.length), knotsFruit: litSlots(s.live, s.fruited.length),
             knotsRemembered: litSlots(s.live, s.remembered.length), knotsMastered: litSlots(s.live, s.mastered.length),
             dataId: (s.touched[0] || s.live[0] || {}).id || "" };
  });
  const tapList = (byPart.tap_root || []).concat(nodes.filter((n) => n.domain === "grammar" && n.foundation && !(byPart.tap_root || []).includes(n)));
  const ts = seat(tapList);
  const tap = { tree_part: "tap_root", label: "Foundation", ...ts, knots: litSlots(ts.live, ts.touched.length), knotsFruit: litSlots(ts.live, ts.fruited.length),
                knotsRemembered: litSlots(ts.live, ts.remembered.length), knotsMastered: litSlots(ts.live, ts.mastered.length),
                dataId: (ts.touched[0] || ts.live[0] || {}).id || "" };
  const houses = HOUSES.map((H) => {
    const branch = seat(byPart[H.tree_part]), themes = seat(themesByHouse[H.tree_part]);
    const live = branch.live.concat(themes.live), touched = branch.touched.concat(themes.touched);
    const fruited = branch.fruited.concat(themes.fruited);
    const remembered = branch.remembered.concat(themes.remembered);
    const mastered = branch.mastered.concat(themes.mastered);
    const state = !live.length ? "dim" : fruited.length ? "fruit" : touched.length ? "started" : "live";
    return { ...H, live, touched, fruited, remembered, mastered, state,
             leaves: litSlots(live, touched.length), fruit: litSlots(live, fruited.length),
             fruitRemembered: litSlots(live, remembered.length), fruitMastered: litSlots(live, mastered.length),
             dataId: (branch.touched[0] || branch.live[0] || themes.touched[0] || themes.live[0] || {}).id || "" };
  });
  const trunk = seat((byPart.trunk || []).concat(Object.values(themesByHouse).flat()));

  // ---- geometry at this age ----
  // Cambium (James, 2026-08-29): the multiplier made visible as mass.
  // Word-craft work at or below the viewed level feeds trunk girth.
  const wcRanks = (byPart.word_craft || [])
    .filter((n) => n.status === "live" && atLevel(n))
    .map((n) => rankOf(stateOf(n)));
  const wcSum = wcRanks.reduce((a, r) => a + [0, 0.5, 1, 1.6, 2][r], 0);
  const cambiumStyle = opts.cambium || "";

  const G = layout(m, age, cambiumGirthBonus(wcSum));
  const lid = (v) => "lf-" + level + "-" + v;
  const leafSizeStem = p.leafSize * (0.45 + 0.55 * age.leaf) * 0.8;

  let above = '<g id="trunk" class="lb' + (highlight.has("trunk") ? " tp-hi-trunk" : "") + '" style="transform-origin:' + cx + 'px ' + soilY + 'px" opacity="' + (trunk.state === "dim" ? 0.5 : 0.95) + '">';
  above += '<path d="' + taperedPath(G.trunk, 0.22, m.trunk.ph, age.stem < 1) + '"/>';
  { const rx = G.trunkW * 0.66, ry = G.trunkW * 0.22;
    above += '<path d="M' + f1(cx - rx) + ',' + f1(soilY - 2) + 'Q' + cx + ',' + f1(soilY + ry * 2.2) + ' ' + f1(cx + rx) + ',' + f1(soilY - 2) + 'Q' + cx + ',' + f1(soilY - ry * 1.2) + ' ' + f1(cx - rx) + ',' + f1(soilY - 2) + 'Z"/>'; }
  if (!focusRoots) G.mains.forEach((Mn) => { if (Mn.g) above += '<path d="' + taperedPath(Mn.L, 0, Mn.M.ph, Mn.g < 0.98) + '"/>'; });
  above += "</g>";

  // Living edge-line variant (?cambium=edge): the growth layer visible
  // under the bark — a thin line up the trunk's edge in the state ladder
  // of the strongest word-craft pack. Map only; absent with no work.
  if (mapOnly && cambiumStyle === "edge" && wcSum > 0) {
    const wcMax = Math.max(0, ...wcRanks);
    const wcCol = wcMax >= 4 ? C.fruitMastered : wcMax >= 3 ? C.fruitRemembered : wcMax >= 2 ? C.fruit : C.leaf;
    let cpts = "";
    for (let t = 0; t <= 1.001; t += 0.08) {
      const q = G.trunk.at(t), v = G.trunk.tan(t);
      const nrm = [-v[1], v[0]];
      const hw = G.trunk.w(t) / 2 + 1;
      cpts += (cpts ? "L" : "M") + f1(q[0] + nrm[0] * hw) + "," + f1(q[1] + nrm[1] * hw);
    }
    above += '<path class="tp-cambium" d="' + cpts + '" fill="none" stroke="' + wcCol + '" stroke-width="1.4" stroke-linecap="round" opacity="0.85"' + (wcMax >= 3 ? ' style="filter:drop-shadow(0 0 3px ' + wcCol + ')"' : "") + "/>";
  }

  // leader leaves while the stem is still rising
  if (age.stem < 1) {
    const tip = G.stemTip, th = G.trunk.ang(1);
    above += '<g class="leader">';
    m.leader.forEach((lf) => {
      const size = leafSizeStem * lf.sizeMul;
      above += '<use href="#' + lid(lf.v) + '" class="lf" transform="translate(' + f1(tip[0]) + ' ' + f1(tip[1]) + ') rotate(' + f1((th + lf.th) / D2R) + ') scale(' + f1(size) + ')"/>';
    });
    // Apex bud (James polish apply, 2026-08-29): one cyan bud at the growing
    // tip — the quiet promise of the next level. Map only; gone at full
    // growth (age.stem = 1) because a mature tree has nowhere left to go.
    if (mapOnly) {
      const bs = 0.55 + 0.45 * age.leaf;
      above += '<ellipse class="tp-bud" cx="0" cy="' + f1(-4.5 * bs) + '" rx="' + f1(2.6 * bs) + '" ry="' + f1(5 * bs) + '" fill="' + C.leaf + '" opacity="0.95" transform="translate(' + f1(tip[0]) + ' ' + f1(tip[1]) + ') rotate(' + f1(th / D2R) + ')"/>';
    }
    above += "</g>";
  }

  let canopy = "", labels = "";
  const labelList = [];
  if (!focusRoots) G.houses.forEach((g) => {
    const house = houses[g.seat];
    const dim = house.state === "dim";
    const active = house.state === "started" || house.state === "fruit";
    const hi = highlight.has(house.tree_part);
    const isNew = hi && animateGrowth;
    let origin = null;
    let s = "";
    let labelAt = null, labelSide = g.seatSide;
    if (g.g > 0 && g.leaves.length >= 2) {
      // a real limb with twigs and leaf slots
      origin = g.L.P[0];
      s += '<path class="lb" d="' + taperedPath(g.L, 0, g.H.ph) + '" opacity="' + (dim ? 0.3 : 0.95) + '"/>';
      g.twigs.forEach((T) => { if (T) s += '<path class="hr" d="' + hairPath(T) + '" opacity="' + (dim ? 0.3 : 1) + '"/>'; });
      g.leaves.forEach((lf, i) => {
        const lit = i < house.leaves;
        const str = (i < house.fruitMastered ? " mastered" : i < house.fruitRemembered ? " remembered" : "");
        s += '<g class="leaf' + str + (isNew && lit && i === house.leaves - 1 ? " tp-new" : "") + '" opacity="' + (lit ? 1 : GHOST) + '"><use href="#' + lid(lf.v) + '" transform="translate(' + f1(lf.p[0]) + ' ' + f1(lf.p[1]) + ') rotate(' + f1(lf.th / D2R) + ') scale(' + f1(lf.size) + ')"/></g>';
      });
      g.fruit.forEach((fr, i) => {
        const lit = i < house.fruit;
        const str = (i < house.fruitMastered ? " mastered" : i < house.fruitRemembered ? " remembered" : lit ? " done" : "");
        s += '<g class="fruit' + str + (isNew && lit && i === house.fruit - 1 ? " tp-new" : "") + '" opacity="' + (lit ? 1 : GHOST) + '"><circle cx="' + f1(fr.p[0]) + '" cy="' + f1(fr.p[1]) + '" r="' + f1(p.fruitR * (0.5 + 0.5 * age.leaf)) + '"/></g>';
      });
      labelAt = [g.tip[0] + g.seatSide * (p.leafSize * age.leaf * 0.9 + 6), g.tip[1] + 4];
    } else {
      // young: a shoot, or a bud-leaf on the stem at the seat height
      let pt, th;
      if (g.g > 0) {
        origin = g.L.P[0];
        s += '<path class="lb" d="' + taperedPath(g.L, 0, g.H.ph) + '" opacity="' + (dim ? 0.3 : 0.95) + '"/>';
        pt = g.L.tip(); th = g.L.ang(1);
        labelSide = g.side || g.seatSide;
      } else {
        const main = G.mains[g.H.main];
        if (main.g) { origin = main.L.P[0]; pt = main.L.tip(); th = main.L.ang(1); labelSide = main.M.side || g.seatSide; }
        else {
          const rank = g.seat % 6;
          const tt = Math.min(0.95, 0.3 + 0.62 * (rank / 5));
          pt = edgePoint(G.trunk, tt, g.seatSide, 0.5); th = G.trunk.ang(tt) + g.seatSide * 52 * D2R;
          origin = pt;
          const stalk = makeLimb(pt, th, leafSizeStem * 0.5, 0.3, 0, true, 0, 1);
          s += '<path class="hr" d="' + hairPath(stalk) + '" opacity="' + (dim ? 0.3 : 1) + '"/>';
          pt = stalk.tip(); th = stalk.ang(1);
        }
      }
      const lf = g.H.budLeaf, size = leafSizeStem * lf.sizeMul;
      const lit = house.leaves > 0;
      const budStr = (house.fruitRemembered > 0 ? " remembered" : "") + (house.fruitMastered > 0 ? " mastered" : "");
      s += '<g class="leaf' + budStr + (isNew && lit ? " tp-new" : "") + '" opacity="' + (lit ? 1 : GHOST) + '"><use href="#' + lid(lf.v) + '" transform="translate(' + f1(pt[0]) + ' ' + f1(pt[1]) + ') rotate(' + f1((th + lf.thJit) / D2R) + ') scale(' + f1(size) + ')"/></g>';
      if (house.fruit > 0) {
        const d = dirUp(th + lf.thJit), n = [-d[1], d[0]];
        const fp = [pt[0] + d[0] * size * 0.3 + n[0] * size * 0.35 * labelSide, pt[1] + d[1] * size * 0.3 + n[1] * size * 0.35 * labelSide];
        const frStr = " done" + (house.fruitRemembered > 0 ? " remembered" : "") + (house.fruitMastered > 0 ? " mastered" : "");
        s += '<g class="fruit' + frStr + (isNew ? " tp-new" : "") + '"><circle cx="' + f1(fp[0]) + '" cy="' + f1(fp[1]) + '" r="' + f1(p.fruitR * (0.45 + 0.4 * age.leaf)) + '"/></g>';
      }
      const d = dirUp(th);
      labelAt = [pt[0] + d[0] * size * 0.5 + labelSide * (size * 0.5 + 6), pt[1] + d[1] * size * 0.5 + 4];
    }
    const o = origin || g.tip || [cx, soilY];
    canopy += '<g class="tp-house ' + house.state + (hi ? " tp-hi" : "") + '" data-part="' + house.tree_part + '" data-node="' + house.dataId + '" style="transform-origin:' + f1(o[0]) + 'px ' + f1(o[1]) + 'px">' + s + "<title>" + esc(house.label) + "</title></g>";
    const recentHouse = recent ? house.touched.some((n) => recent.has(n.id)) : true;
    const showLabel = lvIdx >= 2 ? !dim : hi || (active && recentHouse);
    if (showLabel && labelAt) labelList.push({ x: labelAt[0], y: labelAt[1], side: labelSide, active, house });
  });
  // Labels that would overprint (two houses on one shoot) stack downwards instead.
  labelList.sort((a, b) => a.y - b.y);
  const placed = [];
  const span = (l) => { const w = 6.2 * l.house.label.length; return l.side < 0 ? [l.x - w, l.x] : [l.x, l.x + w]; };
  labelList.forEach((l) => {
    const [a0, a1] = span(l);
    for (const q of placed) {
      const [b0, b1] = span(q);
      if (a0 < b1 + 4 && b0 < a1 + 4 && l.y - q.y < 13) l.y = q.y + 13;
    }
    placed.push(l);
    labels += '<text class="tp-house-label" x="' + f1(l.x) + '" y="' + f1(l.y) + '" text-anchor="' + (l.side < 0 ? "end" : "start") + '" fill="' + (l.active ? C.label : C.labelDim) + '" opacity="' + (l.active ? 0.95 : 0.75) + '" data-node="' + l.house.dataId + '" style="cursor:' + (l.house.dataId ? "pointer" : "default") + '">' + esc(l.house.label) + "</text>";
  });

  // ---- roots mirror the crown at this age ----
  const fb = G.fb;
  const canopySpread = Math.max(40, fb.x1 - fb.x0), canopyH = Math.max(40, soilY - fb.y0);
  const S = (canopySpread * p.rootSpread) / 2;
  let Dd = canopyH * p.rootDepth;
  if (Dd > VB.h - soilY - 62) Dd = VB.h - soilY - 62;
  const rw0 = Math.max(1.2, G.trunkW * p.childWidth * p.rootWidth);
  const rb = { x0: 1e9, x1: -1e9, y1: -1e9 };
  const track = (q) => { if (q[0] < rb.x0) rb.x0 = q[0]; if (q[0] > rb.x1) rb.x1 = q[0]; if (q[1] > rb.y1) rb.y1 = q[1]; };
  const rootSeats = laterals.concat([tap]);
  let roots = "";
  let hiRootTip = null; // tip of the highlighted lateral, for the focus label
  const rootLabelSpots = []; // map-only: every seat wears its name at its tip
  m.roots.forEach((R0, i) => {
    const seatInfo = rootSeats[i];
    // Roots age too: a sapling is a tap root with thin fibrous laterals; the
    // inner laterals thicken first, the outer pair last.
    const birth = R0.tap ? 0 : [0.18, 0.08, 0, 0, 0.08, 0.18][i];
    const rg = clamp01((age.girth - birth) / (1 - birth));
    const reach = 0.55 + 0.45 * rg;
    const end = R0.tap ? [cx + R0.endJit[0], soilY + Dd * R0.fy]
                       : [cx + R0.fx * S * reach * (1 + R0.endJit[0]), soilY + R0.fy * Dd * reach * (1 + R0.endJit[1])];
    const th0 = R0.thF * p.rootAngle * D2R + R0.thJit;
    const hiR = highlight.has(seatInfo.tree_part);
    // A sapling lateral is hairline-thin; without a width boost the payoff
    // emphasis is invisible at A1 age (James smoke, 2026-08-25).
    const w0 = rw0 * (0.3 + 0.7 * rg) * (R0.tap ? 1.15 + 0.6 * (1 - age.girth) : 1) * (hiR ? 1.3 : 1);
    const start = [cx + Math.sin(th0) * G.trunkW * 0.3, soilY - 4];
    const dist = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const d0 = dirDn(th0);
    const P = [start, [start[0] + d0[0] * dist * 0.38, start[1] + d0[1] * dist * 0.38], [end[0] + R0.ctrlJit, end[1] - dist * 0.3], end];
    const R = { P, len: dist, up: false, w0, taper: p.taper * 0.8, at: (t) => bez(P, t), tan: (t) => bezTan(P, t),
      ang: (t) => { const v = bezTan(P, t); return Math.atan2(v[0], v[1]); }, w: (t) => w0 * (1 - (1 - p.taper * 0.8) * t), tip: () => end };
    track(end);
    const dim = seatInfo.state === "dim";
    if (mapOnly) {
      const lblSide = R0.tap ? 1 : Math.sign(end[0] - cx) || 1;
      rootLabelSpots.push({ x: end[0] + lblSide * (R0.tap ? 10 : 14), y: end[1] + (R0.tap ? 8 : 12), side: lblSide, dim, label: seatInfo.label, dataId: seatInfo.dataId });
      track([end[0] + lblSide * (6.8 * seatInfo.label.length + 16), end[1] + 16]);
    }
    if (hiR && !R0.tap) hiRootTip = { x: end[0], y: end[1], side: Math.sign(end[0] - cx) || 1, seatLabel: seatInfo.label };
    if (hiR && R0.tap && !hiRootTip) hiRootTip = { x: end[0], y: end[1], side: 1, seatLabel: seatInfo.label };
    let s = '<g class="tp-lateral ' + seatInfo.state + (hiR ? " tp-hi" : "") + '" data-part="' + seatInfo.tree_part + '" data-node="' + seatInfo.dataId + '" opacity="' + (hiR ? 1 : focusRoots ? 0.35 : dim ? 0.3 : 0.85) + '" style="transform-origin:' + f1(start[0]) + 'px ' + f1(start[1]) + 'px">';
    s += '<path class="rt" d="' + taperedPath(R, 0.15, R0.ph) + '"/>';
    const forks = [];
    R0.forks.forEach((F0, k) => {
      const fg = clamp01((age.girth - (k === 0 ? 0.3 : 0.6)) / 0.3);
      if (fg <= 0) return;
      const t = F0.t, len = dist * (1 - t) * F0.lenMul * (0.3 + 0.7 * fg), fw = R.w(t) * p.childWidth * (0.5 + 0.5 * fg);
      const F = makeLimb(edgePoint({ at: R.at, tan: (t2) => { const v = R.tan(t2); return [-v[0], -v[1]]; }, w: R.w }, t, F0.side, fw * 0.5 + 1), R.ang(t) + F0.th, len, 0.5, F0.s, false, fw, p.taper * 0.7);
      forks.push(F); s += '<path class="rt" d="' + taperedPath(F, 0, F0.ph) + '"/>'; track(F.tip());
    });
    if (age.girth >= 0.2) {
      const hosts = [R].concat(forks);
      R0.hairs.forEach((H0) => {
        const host = hosts[H0.host % hosts.length];
        const T = makeLimb(host.at(H0.t), host.ang(H0.t) + H0.th, H0.lenU * (dist / 260), 0.5, H0.s, false, 0, 1);
        s += '<path class="rh" d="' + hairPath(T) + '"/>'; track(T.tip());
      });
    }
    const tipT = makeLimb(R.at(0.99), R.ang(1) + R0.tipHair.th, R0.tipHair.lenU * (dist / 260), 0.4, R0.tipHair.s, false, 0, 1);
    s += '<path class="rh" d="' + hairPath(tipT) + '"/>'; track(tipT.tip());
    const kr = p.fruitR * 0.85 * (0.4 + 0.6 * age.leaf) * (0.6 + 0.4 * rg);
    for (let k = 0; k < 6; k++) {
      const t = 0.1 + 0.16 * k + R0.knotJit[k];
      const q = R.at(t);
      const lit = k < seatInfo.knots, fruited = k < seatInfo.knotsFruit;
      const rem = k < (seatInfo.knotsRemembered || 0), mas = k < (seatInfo.knotsMastered || 0);
      s += '<g class="knot' + (lit ? " lit" : "") + (fruited ? " done" : "") + (rem ? " remembered" : "") + (mas ? " mastered" : "") + (hiR && animateGrowth && lit && k === seatInfo.knots - 1 ? " tp-new" : "") + '" opacity="' + (lit ? 1 : 0.2 + 0.25 * rg) + '"><circle class="tp-knot" data-node="' + seatInfo.dataId + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="' + f1(kr) + '" style="cursor:' + (seatInfo.dataId ? "pointer" : "default") + '"><title>' + esc(seatInfo.label) + ' - ' + Math.round(seatInfo.fill * 100) + '%</title></circle></g>';
    }
    roots += s + "</g>";
  });
  // The grown root gets its name written next to its tip — below ground the
  // roots are otherwise anonymous, and this payoff is about exactly one of them.
  if (focusRoots && hiRootTip) {
    const t = focusLabel || hiRootTip.seatLabel;
    const lx = hiRootTip.x + hiRootTip.side * 16, ly = hiRootTip.y + 5;
    // Leader from label to its root — at sapling age the laterals bunch and
    // the emphasised one is otherwise unfindable (James, 2026-08-25).
    roots += '<line x1="' + f1(hiRootTip.x + hiRootTip.side * 3) + '" y1="' + f1(hiRootTip.y + 1) + '" x2="' + f1(lx - hiRootTip.side * 3) + '" y2="' + f1(ly - 4) + '" stroke="#d4b070" stroke-width="0.8" opacity="0.55"/>';
    roots += '<text class="tp-root-label" x="' + f1(lx) + '" y="' + f1(ly) + '" text-anchor="' + (hiRootTip.side < 0 ? "end" : "start") + '">' + esc(t) + "</text>";
    track([lx + hiRootTip.side * (6.8 * t.length + 10), ly]);
  }

  // Map only: every seat wears its name at its tip — a ghost seat keeps a
  // readable name (muted, 0.55) so "future" is something the student can aim
  // at; awake seats take the label gold. Payoff keeps its single focus label
  // (James polish apply, 2026-08-29).
  if (mapOnly) {
    rootLabelSpots.forEach((L) => {
      roots += '<text class="tp-root-label" x="' + f1(L.x) + '" y="' + f1(L.y) + '" text-anchor="' + (L.side < 0 ? "end" : "start") + '"' + (L.dim ? ' fill="' + C.muted + '" opacity="0.55"' : ' opacity="0.9"') + ' data-node="' + L.dataId + '" style="cursor:' + (L.dataId ? "pointer" : "default") + '">' + esc(L.label) + "</text>";
    });
  }

  // ---- soil ----
  let soil = "";
  m.ticks.forEach((T) => {
    let x = T.x;
    if (Math.abs(x - cx) < G.trunkW * 0.9 + 10) x = cx + Math.sign(x - cx || 1) * (G.trunkW * 0.9 + 14);
    soil += '<path class="sl" d="M' + f1(x) + ',' + soilY + 'l' + f1(T.dx) + ',' + f1(-T.h) + '"/>';
  });
  let soilDots = "";
  for (let i = 0; i < 80; i++) {
    soilDots += '<circle cx="' + (30 + ((i * 97) % (VB.w - 60))) + '" cy="' + (soilY + 20 + ((i * 53) % (VB.h - soilY - 40))) + '" r="' + (0.6 + (i % 3) * 0.35) + '" fill="rgba(200,160,100,0.06)"/>';
  }

  // ---- per-level crop: frame the tree, keep growth visible (A1 zoomed at most 2.2x) ----
  const MAX_ZOOM = 2.2;
  const bb = G.bbox;
  let x0 = Math.min(bb.x0, rb.x0) - 150, x1 = Math.max(bb.x1, rb.x1) + 150;
  let y0 = Math.min(bb.y0, fb.y0) - 50, y1 = rb.y1 + 40;
  if (focusRoots) {
    // No canopy on screen: frame the trunk and the root system, not the crown's
    // empty airspace.
    const trunkTopY = G.trunk.tip()[1];
    y0 = Math.max(0, trunkTopY - 70);
    x0 = Math.min(rb.x0 - 60, cx - 170);
    x1 = Math.max(rb.x1 + 60, cx + 170);
  }
  x0 = Math.max(0, x0); x1 = Math.min(VB.w, x1); y0 = Math.max(0, y0); y1 = Math.min(VB.h, y1);
  const minW = VB.w / MAX_ZOOM, minH = VB.h / MAX_ZOOM;
  if (x1 - x0 < minW) { const mid = (x0 + x1) / 2; x0 = Math.max(0, mid - minW / 2); x1 = Math.min(VB.w, x0 + minW); x0 = x1 - minW; }
  if (y1 - y0 < minH) { const mid = (y0 + y1) / 2; y0 = Math.max(0, mid - minH / 2); y1 = Math.min(VB.h, y0 + minH); y0 = y1 - minH; }
  const crop = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };

  // Type holds the optical size the A1 slice established (lift, 2026-08-29):
  // world-space labels render ~MAX_ZOOM× larger at A1 than at full view, so
  // scale label type with the crop width. A1 (max zoom) is the anchor — its
  // look is unchanged. Map only: payoff frames its own crop and keeps
  // today's look.
  const typeScale = focusRoots
    ? 1
    : Math.min(MAX_ZOOM, Math.max(1, (crop.w * MAX_ZOOM) / VB.w));

  const sw = Math.max(0.8, p.twigWidth * 0.95);
  const css = [
    ".lb{fill:" + C.wood + ";stroke:none}",
    ".hr{fill:none;stroke:" + C.leaf + ";stroke-width:" + p.twigWidth + ";stroke-linecap:round;stroke-linejoin:round}",
    ".rt{fill:" + C.wood + ";stroke:none}",
    ".rh{fill:none;stroke:" + C.wood + ";stroke-width:" + p.twigWidth + ";stroke-linecap:round}",
    ".sl{fill:none;stroke:rgba(208,144,80,0.65);stroke-width:1.2;stroke-linecap:round}",
    ".leaf use,.leader .lf{fill:none;stroke:" + C.leaf + ";stroke-width:" + sw + ";stroke-linejoin:round;stroke-linecap:round}",
    ".leader .lf{opacity:0.7}",
    ".fruit circle{fill:none;stroke:" + C.leaf + ";stroke-width:" + sw + "}",
    ".fruit.done circle{fill:" + C.fruit + ";stroke:" + C.fruit + ";filter:drop-shadow(0 0 2.5px " + C.fruit + ")}",
    ".fruit.remembered circle{fill:" + C.fruitRemembered + ";stroke:" + C.fruitRemembered + ";filter:drop-shadow(0 0 5px " + C.fruitRemembered + ")}",
    ".fruit.mastered circle{fill:" + C.fruitMastered + ";stroke:" + C.fruitMastered + ";filter:drop-shadow(0 0 8px " + C.fruitMastered + ") drop-shadow(0 0 14px " + C.fruit + ")}",
    ".leaf.remembered use{stroke:" + C.fruitRemembered + ";filter:drop-shadow(0 0 3px " + C.fruitRemembered + ")}",
    ".leaf.mastered use{stroke:" + C.fruitMastered + ";filter:drop-shadow(0 0 6px " + C.fruitMastered + ")}",
    ".knot circle{fill:" + C.knotBg + ";stroke:" + C.wood + ";stroke-width:" + sw + "}",
    ".knot.lit circle{fill:" + C.wood + "}",
    ".knot.done circle{fill:" + C.fruit + ";stroke:" + C.fruit + "}",
    ".knot.remembered circle{fill:" + C.fruitRemembered + ";stroke:" + C.fruitRemembered + ";filter:drop-shadow(0 0 4px " + C.fruitRemembered + ")}",
    ".knot.mastered circle{fill:" + C.fruitMastered + ";stroke:" + C.fruitMastered + ";filter:drop-shadow(0 0 7px " + C.fruitMastered + ")}",
    ".tp-house-label{font:" + f1(11 * typeScale) + "px 'Segoe UI',system-ui,sans-serif;paint-order:stroke;stroke:" + C.sky + ";stroke-width:" + f1(3 * typeScale) + "px;stroke-linejoin:round}",
    // payoff: the practised part grows in from its base and glows; the trunk pulses;
    // the newest lit slot fades in. transform-box:view-box makes the origin above user units.
    // Animations are held until the host adds .tp-run to the svg, so the growth
    // plays when the student is LOOKING at the tree, not while it is still
    // off-screen below the fold (James, 2026-08-23).
    ".tp-hi{transform-box:view-box;transform:scale(.9)}",
    ".tp-run .tp-hi{animation:tpGrow 1.6s cubic-bezier(.22,1,.36,1) both}",
    ".tp-still .tp-hi{transform:scale(1)}",
    ".tp-still .tp-hi-trunk{filter:drop-shadow(0 0 7px rgba(86,156,214,.85))}",
    ".tp-hi .lb{filter:drop-shadow(0 0 4px rgba(77,182,199,.95))}",
    ".tp-hi .rt{filter:drop-shadow(0 0 5px rgba(77,182,199,1)) drop-shadow(0 0 12px rgba(77,182,199,.6))}",
    ".tp-hi-trunk{transform-box:view-box}",
    ".tp-run .tp-hi-trunk{animation:tpPulse 2.2s ease-out both}",
    ".tp-root-label{font:italic " + f1(12 * typeScale) + "px 'Segoe UI',system-ui,sans-serif;fill:" + C.label + ";paint-order:stroke;stroke:" + C.soil + ";stroke-width:" + f1(3 * typeScale) + "px;stroke-linejoin:round}",
    ".tp-new{opacity:0}",
    ".tp-run .tp-new{animation:tpLight 1.3s ease-out .5s both}",
    ".tp-new use,.tp-new circle{filter:drop-shadow(0 0 5px " + C.fruit + ")}",
    "@keyframes tpGrow{from{transform:scale(.9)}to{transform:scale(1)}}",
    // the trunk also THICKENS a touch mid-pulse (origin sits at the collar)
    "@keyframes tpPulse{0%{filter:brightness(1);transform:scale(1)}40%{filter:brightness(1.5) drop-shadow(0 0 7px rgba(86,156,214,.95));transform:scale(1.035)}100%{filter:brightness(1);transform:scale(1)}}",
    "@keyframes tpLight{from{opacity:.25;transform:scale(.6)}to{opacity:1;transform:scale(1)}}",
    ".tp-new{transform-box:fill-box;transform-origin:center}",
    "@media (prefers-reduced-motion:reduce){.tp-hi,.tp-run .tp-hi,.tp-hi-trunk,.tp-run .tp-hi-trunk," +
      ".tp-new,.tp-run .tp-new{animation:none;transform:none;opacity:1}}",
  ].join("\n");
  const defs = "<defs>" + LEAF_D.map((d, i) => '<path id="' + lid(i) + '" d="' + d + '" vector-effect="non-scaling-stroke"/>').join("") +
    '<linearGradient id="tpSoilGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + C.soilTop + '"/><stop offset="100%" stop-color="' + C.soil + '"/></linearGradient>' +
    '<radialGradient id="tpSkyGlow" cx="50%" cy="18%" r="55%"><stop offset="0%" stop-color="rgba(224,160,80,0.09)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient>' +
    '<linearGradient id="tpGroundGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(200,120,64,0.2)"/><stop offset="100%" stop-color="rgba(200,120,64,0)"/></linearGradient>' +
    '<filter id="tpSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>';

  let svg = '<svg class="tree-portrait-svg" viewBox="' + f1(crop.x) + ' ' + f1(crop.y) + ' ' + f1(crop.w) + ' ' + f1(crop.h) + '" width="100%" height="auto" role="img" aria-label="Tree: grammar roots, vocab trunk and houses" data-level="' + level + '">' +
    "<style>" + css + "</style>" + defs +
    '<rect width="' + VB.w + '" height="' + VB.h + '" fill="' + C.sky + '"/>' +
    '<rect width="' + VB.w + '" height="' + soilY + '" fill="url(#tpSkyGlow)"/>' +
    '<rect x="0" y="' + soilY + '" width="' + VB.w + '" height="' + (VB.h - soilY) + '" fill="url(#tpSoilGrad)"/>' + soilDots +
    '<g class="tp-below">' + roots + "</g>" +
    '<g class="tp-above">' + above + canopy + "</g>" +
    '<rect x="0" y="' + (soilY - 10) + '" width="' + VB.w + '" height="18" fill="url(#tpGroundGlow)" opacity="0.55" filter="url(#tpSoft)"/>' +
    '<path class="sl" d="M' + f1(crop.x + 24) + ',' + soilY + 'L' + f1(crop.x + crop.w - 24) + ',' + soilY + '"/>' + soil +
    '<text x="' + f1(crop.x + crop.w - 30) + '" y="' + (soilY - 8) + '" text-anchor="end" fill="' + C.muted + '" font-size="' + f1(10 * typeScale) + '" font-family="Segoe UI,system-ui,sans-serif">' + esc(age.soilLabel) + "</text>" +
    '<g class="tp-labels">' + labels + "</g>" +
    (focusRoots ? "" : '<text x="' + cx + '" y="' + f1(crop.y + 20 * typeScale) + '" text-anchor="middle" fill="' + C.muted + '" font-size="' + f1(12 * typeScale) + '" font-style="italic" font-family="Segoe UI,system-ui,sans-serif">' + esc(age.caption) + "</text>") +
    "</svg>";
  svg = svg.replace(/<path class="hr/g, '<path vector-effect="non-scaling-stroke" class="hr')
           .replace(/<path class="rh/g, '<path vector-effect="non-scaling-stroke" class="rh')
           .replace(/<circle /g, '<circle vector-effect="non-scaling-stroke" ');

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

  return { laterals, houses, trunk, tap, level,
           cambium: { sum: wcSum, bonus: cambiumGirthBonus(wcSum) } };
}
