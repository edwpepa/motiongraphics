import React from "react";
import { clamp01, ease, fbm, flare, glow, hash, lerp, mulberry, proj, rng01, rotX, rotY, rotZ, V3 } from "../edw/kit";
import MAP from "../hire/worldmap.json";
import { RCanvas, RH, RW, starfield, w } from "./rk";

const D2R = Math.PI / 180;

// ------------------------------------------------------------------ the Earth at night: real coastlines, lights where people live
type Light = { lon: number; lat: number; b: number };
let LIGHTS: Light[] | null = null;
export function earthLights(): Light[] {
  if (LIGHTS) return LIGHTS;
  const M = MAP as unknown as { world: [number, number][]; romania: [number, number][] };
  const r = mulberry(5);
  const out: Light[] = [];
  for (const [lon, lat] of M.world) {
    const band = lat > 62 ? 0.25 : lat < -38 ? 0.35 : 1;
    const pop = clamp01(fbm(lon * 0.08 + 3, lat * 0.08 + 1, 0.5) * 2.0 - 0.62) * band;
    const k = Math.round(pop * 6 + (r() < 0.2 ? 1 : 0));
    for (let i = 0; i < k; i++) out.push({ lon: lon + (r() - 0.5), lat: lat + (r() - 0.5), b: 0.25 + 0.75 * pop * (0.4 + 0.6 * r()) });
  }
  for (const [lon, lat] of M.romania) if (r() < 0.3) out.push({ lon, lat, b: 0.55 + 0.4 * r() });
  LIGHTS = out;
  return out;
}
export const METROS: [number, number][] = [
  [26.1, 44.43], [2.35, 48.86], [-0.13, 51.5], [13.4, 52.52], [12.5, 41.9], [-3.7, 40.42], [37.6, 55.75], [28.97, 41.0], [31.24, 30.04], [3.38, 6.52],
  [36.82, -1.29], [18.42, -33.92], [55.27, 25.2], [72.88, 19.07], [77.2, 28.6], [51.4, 35.7], [44.4, 33.3], [-74.0, 40.71], [-87.6, 41.9], [-46.63, -23.55],
];

/** orthographic projection of (lon, lat) with the view centred on (lon0, lat0) */
export function ortho(lon: number, lat: number, lon0: number, lat0: number) {
  const p = lat * D2R, l = (lon - lon0) * D2R, p0 = lat0 * D2R;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return { x: Math.cos(p) * Math.sin(l), y: Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l), c: cosc };
}

export function drawEarth(ctx: CanvasRenderingContext2D, T: number, o: { cx: number; cy: number; R: number; lon0: number; lat0: number; a: number; sun?: number; bloom?: { x: number; y: number; k: number; rad: number } }) {
  const { cx, cy, R, lon0, lat0, a } = o;
  const g = ctx.createRadialGradient(cx, cy - R * 0.35, R * 0.4, cx, cy, R);
  g.addColorStop(0, "#040406");
  g.addColorStop(1, "#0b0c10");
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  const top = cy - R - 10;
  for (const L of earthLights()) {
    const p = ortho(L.lon, L.lat, lon0, lat0);
    if (p.c < 0.02) continue;
    const x = cx + p.x * R, y = cy - p.y * R;
    if (y < top || y > RH + 4 || x < -4 || x > RW + 4) continue;
    let b = L.b * Math.pow(p.c, 0.35) * (0.82 + 0.18 * Math.sin(T * 3 + L.lon * 7));
    if (o.bloom) {
      const d = Math.hypot(x - o.bloom.x, y - o.bloom.y);
      b *= 1 + 2.4 * o.bloom.k * Math.exp(-Math.pow(d / o.bloom.rad, 2));
    }
    ctx.fillStyle = `rgba(240,238,228,${Math.min(1, b) * a})`;
    const s = 1.3 + 1.3 * Math.min(1, b);
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  }
  for (const [lon, lat] of METROS) {
    const p = ortho(lon, lat, lon0, lat0);
    if (p.c < 0.05) continue;
    const x = cx + p.x * R, y = cy - p.y * R;
    if (y < top || y > RH) continue;
    glow(ctx, x, y, 22 * Math.pow(p.c, 0.5), 0.35 * a);
  }
  // atmosphere on the rim
  for (const [lw, al] of [[70, 0.035], [30, 0.08], [10, 0.22], [2.5, 0.6]] as const) {
    ctx.strokeStyle = `rgba(205,218,255,${al * a})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, R + lw * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (o.sun && o.sun > 0) {
    const ang = -Math.PI / 2 + 0.42;
    flare(ctx, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R - 6, o.sun * a, 1400, 110);
    glow(ctx, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 520, 0.12 * o.sun * a);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/** 0 – 4.7: the planet, lights coming on, the sun about to rise on the rim */
export const EarthOpen: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const into = rng01(T, 3.9, 4.75, ease.inCubic);
      const a = rng01(T, 0.05, 1.2, ease.outCubic) * (1 - rng01(T, 4.45, 4.75));
      ctx.fillStyle = "#020203";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, a * 0.9, 240, T * 4);
      ctx.globalCompositeOperation = "source-over";
      const push = ease.inOut(T / 4.7);
      const R = lerp(1180, 1290, push);
      // dive towards Bucharest at the end
      const zoom = 1 + 7 * into;
      ctx.save();
      const bx = RW / 2 - 40, by = 860;
      ctx.translate(bx, by);
      ctx.scale(zoom, zoom);
      ctx.translate(-bx, -by);
      drawEarth(ctx, T, { cx: RW / 2, cy: 820 + R, R, lon0: 18 + T * 0.9, lat0: -24, a, sun: rng01(T, 1.6, 3.4, ease.inOut) });
      ctx.restore();
    }}
  />
);

// ------------------------------------------------------------------ people: every one a light with its own path through life
type Agent = { bx: number; by: number; ax: number[]; fx: number[]; px: number[]; ay: number[]; fy: number[]; py: number[] };
let AG: Agent[] | null = null;
const agents = () =>
  (AG ??= (() => {
    const r = mulberry(77);
    return Array.from({ length: 210 }, () => {
      const comp = () => [0, 1, 2].map((k) => (180 - k * 55) * (0.4 + 0.6 * r()));
      return {
        bx: 80 + r() * 920,
        by: 260 + r() * 900,
        ax: comp(),
        fx: [0, 1, 2].map((k) => (0.12 + 0.3 * r()) * (1 + k * 1.3)),
        px: [0, 1, 2].map(() => r() * 6.28),
        ay: comp(),
        fy: [0, 1, 2].map((k) => (0.1 + 0.3 * r()) * (1 + k * 1.4)),
        py: [0, 1, 2].map(() => r() * 6.28),
      };
    });
  })());
const pos = (g: Agent, t: number): [number, number] => {
  let x = g.bx, y = g.by;
  for (let k = 0; k < 3; k++) {
    x += g.ax[k] * Math.sin(g.fx[k] * t + g.px[k]);
    y += g.ay[k] * Math.sin(g.fy[k] * t + g.py[k]) * 0.8;
  }
  return [x, y];
};

export const People: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const A = agents();
      const fade = rng01(T, 4.5, 5.0) * (1 - rng01(T, 9.15, 9.6));
      const spread = ease.outCubic(rng01(T, 4.5, 6.0, (x) => x));
      const zoom = lerp(1.14, 1.0, ease.inOut(rng01(T, 4.5, 9.5, (x) => x)));
      const lit = [
        [12, w("laugh", 4)],
        [57, w("laugh", 6)],
        [101, w("laugh", 11)],
        [160, w("laugh", 13)],
      ] as const;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.save();
      ctx.translate(RW / 2, 700);
      ctx.scale(zoom, zoom);
      ctx.translate(-RW / 2, -700);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, RW / 2, 720, 760, 0.06);
      const heads: [number, number][] = [];
      const cx = RW / 2 - 40, cy = 860;
      A.forEach((g, i) => {
        const hl = lit.reduce((m, [k, at]) => (k === i ? Math.max(m, Math.exp(-Math.max(0, T - at) / 1.1) * (T >= at - 0.1 ? 1 : 0)) : m), 0);
        const pts: [number, number][] = [];
        for (let j = 0; j <= 36; j++) {
          const [x, y] = pos(g, T - j * 0.065);
          pts.push([lerp(cx, x, spread), lerp(cy, y, spread)]);
        }
        heads.push(pts[0]);
        // the trail, fading out behind
        for (let s = 0; s < 4; s++) {
          ctx.strokeStyle = `rgba(232,236,246,${([0.34, 0.19, 0.09, 0.04][s] + 0.5 * hl) * 0.9})`;
          ctx.lineWidth = 1.2 + 1.4 * hl;
          ctx.beginPath();
          for (let j = s * 9; j <= Math.min(36, s * 9 + 9); j++) (j === s * 9 ? ctx.moveTo(pts[j][0], pts[j][1]) : ctx.lineTo(pts[j][0], pts[j][1]));
          ctx.stroke();
        }
        if (hl > 0.02) glow(ctx, pts[0][0], pts[0][1], 28 * (0.5 + hl), 0.8 * hl);
      });
      // when two pass close, a thread between them
      ctx.lineWidth = 1;
      for (let i = 0; i < heads.length; i++)
        for (let j = i + 1; j < heads.length; j++) {
          const d = Math.hypot(heads[i][0] - heads[j][0], heads[i][1] - heads[j][1]);
          if (d > 74) continue;
          ctx.strokeStyle = `rgba(232,236,246,${0.32 * (1 - d / 74) * spread})`;
          ctx.beginPath();
          ctx.moveTo(heads[i][0], heads[i][1]);
          ctx.lineTo(heads[j][0], heads[j][1]);
          ctx.stroke();
        }
      ctx.fillStyle = "rgba(245,247,252,0.95)";
      for (const [x, y] of heads) ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
      // everyone pulses once on "people"
      const all = Math.exp(-Math.max(0, T - w("laugh", 16)) / 0.5) * (T > w("laugh", 16) ? 1 : 0);
      if (all > 0.02) for (const [x, y] of heads) glow(ctx, x, y, 14, 0.5 * all);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ genes: a double helix of light
export const Helix: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const t = T - 9.3;
      const fade = rng01(t, 0, 0.4);
      const reveal = ease.outCubic(rng01(T, 9.35, 10.4, (x) => x));
      const melt = rng01(T, 11.2, 11.95, (x) => x);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.4, 120);
      const cy = 690, Rh = 175, tilt = 0.22 + 0.04 * Math.sin(T * 0.4);
      const P = (y: number, s: number): { x: number; y: number; k: number; z: number } => {
        const ang = y * 0.0105 + T * 1.15 + s * Math.PI;
        let q: V3 = [Rh * Math.cos(ang), -(y - cy), Rh * Math.sin(ang)];
        q = rotZ(rotY(q, 0.15), tilt);
        return proj(q, 1, 1500, RW / 2, cy);
      };
      const half = 470 * reveal;
      for (let y = cy - 490; y <= cy + 490; y += 26) {
        if (Math.abs(y - cy) > half) continue;
        const a = P(y, 0), b = P(y, 1);
        const lift = melt * (120 + 380 * hash(y)) * clamp01((cy + 490 - y) / 980 + melt - 0.4);
        const d = 0.45 + 0.55 * clamp01(0.5 - (a.z + b.z) / (4 * Rh));
        ctx.strokeStyle = `rgba(225,230,242,${0.28 * d * (1 - melt)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - lift);
        ctx.lineTo(b.x, b.y - lift);
        ctx.stroke();
        for (const u of [0.33, 0.66]) {
          ctx.fillStyle = `rgba(235,240,250,${0.5 * d * (1 - melt)})`;
          ctx.fillRect(lerp(a.x, b.x, u) - 2, lerp(a.y, b.y, u) - lift - 2, 4, 4);
        }
      }
      for (let y = cy - 490; y <= cy + 490; y += 5) {
        if (Math.abs(y - cy) > half) continue;
        for (const s of [0, 1]) {
          const p = P(y, s);
          const depth = clamp01(0.5 - p.z / (2 * Rh));
          const lift = melt * (120 + 380 * hash(y + s)) * clamp01((cy + 490 - y) / 980 + melt - 0.4);
          const sz = (2 + 3 * depth) * p.k;
          ctx.fillStyle = `rgba(240,244,252,${(0.25 + 0.75 * depth) * (1 - melt * 0.8)})`;
          ctx.fillRect(p.x - sz / 2, p.y - sz / 2 - lift, sz, sz);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ a life growing: a tree of light shaped by parents, schooling, place and ideas
type Br = { ang: number; len: number; w: number; d: number; kids: Br[]; seed: number };
let TREE: Br | null = null;
const tree = () =>
  (TREE ??= (() => {
    const r = mulberry(19);
    const make = (ang: number, len: number, wd: number, d: number): Br => {
      const b: Br = { ang, len, w: wd, d, kids: [], seed: r() };
      if (d < 8) {
        const n = d < 2 ? 2 : r() < 0.22 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const spread = (0.32 + 0.22 * r()) * (i - (n - 1) / 2) * 2;
          b.kids.push(make(ang + spread + (r() - 0.5) * 0.25, len * (0.72 + 0.1 * r()), wd * 0.68, d + 1));
        }
      }
      return b;
    };
    return make(-Math.PI / 2, 210, 13, 0);
  })());
export const ORBS: [number, number][] = [
  [270, 380],
  [820, 330],
];
export type Seg = { x0: number; y0: number; x1: number; y1: number; w: number; d: number; tip: boolean; f: number };
/** the tree's branches at time T (grown fraction applied) */
export function treeSegs(T: number, grow: number, pull: number): Seg[] {
  const out: Seg[] = [];
  const walk = (b: Br, x: number, y: number, parentF: number) => {
    let ang = b.ang + Math.sin(T * 0.9 + b.seed * 6) * 0.025 * b.d;
    if (pull > 0 && b.d >= 2) {
      const [ox, oy] = ORBS[x < RW / 2 ? 0 : 1];
      let da = Math.atan2(oy - y, ox - x) - ang;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      ang += da * 0.1 * pull * (b.d / 8);
    }
    const f = clamp01((grow * 9 - b.d) / 1) * parentF;
    if (f <= 0) return;
    const L = b.len * f;
    const x1 = x + Math.cos(ang) * L, y1 = y + Math.sin(ang) * L;
    out.push({ x0: x, y0: y, x1, y1, w: b.w, d: b.d, tip: b.kids.length === 0, f });
    if (f >= 1) for (const k of b.kids) walk(k, x1, y1, 1);
  };
  walk(tree(), RW / 2, 1235, 1);
  return out;
}

/** the grown tree, snapped to a 12px grid of squares (what the scan leaves behind) */
export function treePixels(T: number, segs = treeSegs(T, 1, 1), below = 1e9): [number, number][] {
  const px = new Set<string>();
  for (const s of segs) {
    if (Math.max(s.y0, s.y1) >= below) continue;
    const n = Math.max(1, Math.ceil(Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / 9));
    for (let i = 0; i <= n; i++) px.add(`${Math.round(lerp(s.x0, s.x1, i / n) / 12) * 12},${Math.round(lerp(s.y0, s.y1, i / n) / 12) * 12}`);
  }
  return [...px].map((k) => k.split(",").map(Number) as [number, number]);
}
/** staggered 0→1 for item i of n as p runs 0→1 (every item finishes by p = 1) */
const stag = (p: number, i: number, n: number, s = 0.6) => clamp01((p - (s * i) / n) / (1 - s));

export const Tree: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 11.25, 11.8);
      const grow = ease.inOut(rng01(T, 11.35, 16.4, (x) => x));
      const parents = rng01(T, w("parents", 7) - 0.3, w("parents", 7) + 0.6);
      const school = rng01(T, w("parents", 9) - 0.2, w("parents", 9) + 0.6);
      const place = rng01(T, w("place", 1) - 0.2, w("place", 1) + 0.6);
      const heard = rng01(T, w("idea", 1) - 0.1, w("idea", 6), (x) => x);
      const own = rng01(T, w("idea", 7) - 0.1, w("idea", 13) + 0.3, (x) => x);
      const scan = rng01(T, 20.2, 21.35, ease.inOut);
      const sy = lerp(80, 1300, scan);
      const segs = treeSegs(T, grow, parents);
      // everything but the tree itself leaves as the scan passes
      const keep = 1 - rng01(T, 20.2, 21.2);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      // the two who raised it: lights it leans towards
      for (const [ox, oy] of ORBS) {
        glow(ctx, ox, oy, 230, 0.16 * parents * keep);
        glow(ctx, ox, oy, 40, 0.7 * parents * keep);
      }
      ctx.globalCompositeOperation = "source-over";
      // schooling: a quiet lattice behind it
      if (school * keep > 0) {
        ctx.strokeStyle = `rgba(220,226,240,${0.07 * school * keep})`;
        ctx.lineWidth = 1;
        for (let k = -12; k <= 12; k++) {
          ctx.beginPath();
          ctx.moveTo(RW / 2 + k * 90 - 700, 1260);
          ctx.lineTo(RW / 2 + k * 90 + 700, 1260 - 1400);
          ctx.moveTo(RW / 2 + k * 90 + 700, 1260);
          ctx.lineTo(RW / 2 + k * 90 - 700, 1260 - 1400);
          ctx.stroke();
        }
      }
      // the place: contour lines of the ground it grew from
      if (place * keep > 0) {
        for (let k = 0; k < 7; k++) {
          ctx.strokeStyle = `rgba(225,230,240,${(0.32 - k * 0.035) * place * keep})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (let x = 0; x <= RW; x += 12) {
            const y = 1238 + k * 11 + Math.sin(x * 0.009 + k * 0.7) * (10 + k * 3) + Math.sin(x * 0.023 + k) * 4;
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      // the tree itself (pixels above the scan line once the scan starts)
      ctx.lineCap = "round";
      for (const s of segs) {
        if (scan > 0 && Math.max(s.y0, s.y1) < sy) continue;
        ctx.strokeStyle = `rgba(236,240,248,${0.92 - s.d * 0.05})`;
        ctx.lineWidth = Math.max(0.8, s.w);
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1);
        ctx.stroke();
      }
      if (scan > 0) {
        ctx.fillStyle = "rgba(238,242,250,0.9)";
        for (const [x, y] of treePixels(T, segs, sy)) ctx.fillRect(x - 4, y - 4, 8, 8);
      }
      ctx.globalCompositeOperation = "lighter";
      const tips = segs.filter((s) => s.tip && s.f >= 1);
      // blossoms once it has grown
      const bloom = rng01(T, 16.4, 18.0);
      tips.forEach((s, i) => {
        if (scan > 0 && s.y1 < sy) return;
        const a = clamp01(bloom * 1.6 - (i % 17) / 17);
        if (a > 0) glow(ctx, s.x1, s.y1, 7, 0.55 * a * keep);
      });
      // ideas heard: sparks drifting in from the edges, into the crown
      if (heard > 0 && tips.length) {
        for (let i = 0; i < 26; i++) {
          const u = stag(heard, i, 26);
          if (u <= 0 || u >= 1) continue;
          const tip = tips[(i * 37) % tips.length];
          const sx = i % 2 ? -30 : RW + 30, sy0 = 250 + hash(i) * 700;
          const e = ease.inOut(u);
          const x = lerp(sx, tip.x1, e), y = lerp(sy0, tip.y1, e) - Math.sin(Math.PI * e) * 90;
          glow(ctx, x, y, 12, 0.85);
          glow(ctx, x, y, 3, 1);
        }
      }
      // ideas of its own: brighter sparks rising out of the crown
      if (own > 0 && tips.length) {
        for (let i = 0; i < 22; i++) {
          const u = stag(own, i, 22);
          if (u <= 0 || u >= 1) continue;
          const tip = tips[(i * 53 + 7) % tips.length];
          const x = tip.x1 + Math.sin(u * 5 + i) * 30 * u, y = tip.y1 - ease.outCubic(u) * 520;
          glow(ctx, x, y, 22 * (1 - u * 0.5), 0.9 * (1 - u));
          glow(ctx, x, y, 4, 1 - u);
        }
      }
      // the scan line
      if (scan > 0 && scan < 1) {
        ctx.fillStyle = "rgba(245,248,255,0.95)";
        ctx.fillRect(0, sy - 1, RW, 2);
        const g = ctx.createLinearGradient(0, sy - 90, 0, sy);
        g.addColorStop(0, "rgba(235,240,255,0)");
        g.addColorStop(1, "rgba(235,240,255,0.16)");
        ctx.fillStyle = g;
        ctx.fillRect(0, sy - 90, RW, 90);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }}
  />
);
