import React from "react";
import { clamp01, ease, fbm, flare, glow, hash, lerp, mulberry, rng01, V3 } from "../edw/kit";
import { Cam, EDGES, P, SIMS, VX, contours, facePoint, glass, glyph, lerp3, simAt, terrain } from "./cube";
import { RCanvas, RH, RW, starfield, w } from "./rk";
import { treePixels } from "./sceneA";

export const CX = 540;
export const CY = 700;

// ------------------------------------------------------------------ 21.35 – 29: the life becomes data, the data a world in a glass cube
export const simCam = (T: number): Cam => ({ cx: CX, cy: CY, s: lerp(186, 210, ease.outCubic(rng01(T, 21.4, 25.5, (x) => x))), yaw: 0.5 + 0.16 * (T - 21.35), pitch: -0.36 });

type Px = { x: number; y: number; q: V3; t0: number; edge: boolean };
let PX: Px[] | null = null;
const pixels = () =>
  (PX ??= (() => {
    const src = treePixels(21.35);
    let y0 = 1e9, y1 = -1e9;
    for (const [, y] of src) {
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return src.map(([x, y], i) => {
      const edge = i % 3 === 0;
      let q: V3;
      if (edge) {
        const e = EDGES[Math.floor(hash(i * 1.7) * 12) % 12];
        q = lerp3(VX[e[0]], VX[e[1]], (Math.floor(hash(i * 2.3) * 22) + 0.5) / 22);
      } else {
        const g = (k: number) => ((Math.floor(hash(i * k) * 9) + 0.5) / 9) * 2 - 1;
        q = facePoint(Math.floor(hash(i * 3.1) * 6) % 6, g(4.7), g(5.9));
      }
      return { x, y, q, t0: 21.38 + 0.62 * ((y - y0) / Math.max(1, y1 - y0)) + 0.2 * hash(i * 6.7), edge };
    });
  })());

/** a pixel on its way into the cube: a quiet vortex around the centre */
const flight = (p: Px, e: number, cam: Cam) => {
  const tg = P(cam, p.q);
  const a0 = Math.atan2(p.y - CY, p.x - CX), r0 = Math.hypot(p.x - CX, p.y - CY);
  const a1 = Math.atan2(tg.y - CY, tg.x - CX), r1 = Math.hypot(tg.x - CX, tg.y - CY);
  const da = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
  const ang = a0 + da * e + 0.55 * Math.sin(Math.PI * e);
  const rr = lerp(r0, r1, e);
  return { x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr, s: lerp(8, 4.2 * tg.k, e) };
};

// the network that lights up in it: an artificial mind
const NODES: V3[] = (() => {
  const r = mulberry(31);
  return Array.from({ length: 26 }, () => [(r() * 2 - 1) * 0.7, (r() * 2 - 1) * 0.7, (r() * 2 - 1) * 0.7] as V3);
})();
const LINKS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const all: V3[] = [[0, 0, 0], ...NODES];
  all.forEach((a, i) => {
    const near = all
      .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])] as [number, number])
      .filter(([j]) => j !== i)
      .sort((x, y) => x[1] - y[1])
      .slice(0, i === 0 ? 7 : 2);
    for (const [j] of near) if (!out.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) out.push([i, j]);
  });
  return out;
})();

let DIVE = -1;
const diveIdx = () => {
  if (DIVE >= 0) return DIVE;
  const cam = simCam(28.25);
  let best = 1e9;
  SIMS.forEach((g, i) => {
    const p = P(cam, simAt(g, 28.25));
    const sc = Math.abs(p.x - CX) + Math.abs(p.y - (CY + 70)) * 0.7 - p.k * 140;
    if (sc < best) {
      best = sc;
      DIVE = i;
    }
  });
  return DIVE;
};

export const Sim: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const cam = simCam(T);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      const rise = ease.inOut(rng01(T, 24.35, 25.7, (x) => x));
      const di = diveIdx();
      const head = (i: number): V3 => {
        const b = simAt(SIMS[i], T, rise);
        const h = 0.09 * ease.outCubic(rng01(T, w("world", 10) - 0.05 + 0.3 * hash(i * 2.9), w("world", 10) + 0.55 + 0.3 * hash(i * 2.9), (x) => x));
        return [b[0], b[1] + h, b[2]];
      };
      // the dive into one of them
      const dv = ease.inCubic(rng01(T, 28.2, 28.95, (x) => x));
      const rest = 1 - rng01(T, 28.4, 28.85);
      if (dv > 0) {
        const a = P(cam, head(di));
        const Z = Math.pow(16, dv);
        ctx.translate(lerp(a.x, CX, dv), lerp(a.y, CY, dv));
        ctx.scale(Z, Z);
        ctx.translate(-a.x, -a.y);
      }
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.3 * rest, 150, T * 3);
      glow(ctx, CX, CY, 640, 0.05 * rng01(T, 21.6, 23) * rest);
      ctx.globalCompositeOperation = "source-over";

      const ga = rng01(T, 22.2, 22.95) * rest;
      glass(ctx, cam, "back", ga);

      // the core: "artificial"
      const ign = rng01(T, w("imagine", 7) - 0.06, w("imagine", 7) + 0.35, ease.outCubic);
      const up = ease.inOut(rng01(T, 24.2, 25.5, (x) => x));
      const core = P(cam, [0, 0.74 * up, 0]);
      const net = ign * (1 - rng01(T, 24.25, 25.0)) * rest;
      ctx.globalCompositeOperation = "lighter";
      if (net > 0.002) {
        const all: V3[] = [[0, 0, 0], ...NODES];
        const S = all.map((q) => P(cam, q));
        const grow = rng01(T, w("imagine", 7) + 0.05, w("imagine", 8) - 0.05, (x) => x);
        const flash = T > w("imagine", 8) ? Math.exp(-(T - w("imagine", 8)) / 0.4) : 0;
        LINKS.forEach(([i, j], k) => {
          const f = clamp01((grow - hash(k * 3.3) * 0.65) / 0.35);
          if (f <= 0) return;
          const A = S[i], B = S[j];
          const dep = clamp01(0.75 - (A.z + B.z) / (4 * cam.s * 1.3));
          ctx.strokeStyle = `rgba(232,238,255,${(0.28 + 0.5 * flash) * dep * net})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(lerp(A.x, B.x, f), lerp(A.y, B.y, f));
          ctx.stroke();
          if (f >= 1) {
            const u = (T * 1.25 + hash(k * 7.1)) % 1;
            glow(ctx, lerp(A.x, B.x, u), lerp(A.y, B.y, u), 5, 0.8 * dep * net);
          }
        });
        S.forEach((p, i) => {
          if (!i) return;
          const f = clamp01((grow - hash(i * 1.9) * 0.6) / 0.4);
          glow(ctx, p.x, p.y, 8 + 10 * flash, (0.5 + 0.5 * flash) * f * net);
        });
      }
      // the core lifts and becomes the light of that world
      const cs = lerp(1, 0.55, up);
      glow(ctx, core.x, core.y, 90 * cs, 0.32 * ign * rest);
      glow(ctx, core.x, core.y, 18 * cs, 0.95 * ign * rest);
      if (T > w("imagine", 8)) flare(ctx, core.x, core.y, 0.55 * Math.exp(-(T - w("imagine", 8)) / 0.55) * rest, 880, 46);

      // the land
      const L: V3 = (() => {
        const v: V3 = [0.5 * Math.cos(T * 0.4), 1, 0.5 * Math.sin(T * 0.4)];
        const m = Math.hypot(v[0], v[1], v[2]);
        return [v[0] / m, v[1] / m, v[2] / m];
      })();
      terrain(ctx, cam, rng01(T, 24.3, 24.8) * rest, { rise, reveal: rng01(T, 24.3, 25.6, ease.outCubic), light: (n) => 0.3 + 0.7 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) });

      // its people: "every individual is an AI that grows up"
      ctx.globalCompositeOperation = "lighter";
      SIMS.forEach((g, i) => {
        const t0 = w("world", 5) - 0.08 + 0.85 * hash(i * 1.9);
        const ap = rng01(T, t0, t0 + 0.4, ease.outCubic);
        if (ap <= 0) return;
        const al = i === di ? 1 : rest;
        const b = P(cam, simAt(g, T, rise));
        const h = P(cam, head(i));
        if (Math.abs(h.y - b.y) > 0.5) {
          ctx.strokeStyle = `rgba(236,240,252,${0.55 * al})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(h.x, h.y);
          ctx.stroke();
        }
        const grown = rng01(T, w("world", 10), w("world", 10) + 0.8);
        glow(ctx, h.x, h.y, (9 + 5 * grown) * ap, (0.6 + 0.3 * grown) * al);
        const s = 2.6 * ap * h.k;
        ctx.fillStyle = `rgba(255,255,255,${al})`;
        ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s);
        // "an AI": a small halo blinks once around each
        const u = rng01(T, w("world", 8) - 0.05 + 0.18 * hash(i * 4.1), w("world", 8) + 0.6 + 0.18 * hash(i * 4.1), (x) => x);
        if (u > 0 && u < 1) {
          ctx.strokeStyle = `rgba(236,242,255,${0.6 * (1 - u) * al})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 4 + 14 * ease.outCubic(u), 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // the pixels of the life, flying in
      ctx.globalCompositeOperation = "source-over";
      for (const p of pixels()) {
        const e = ease.inOut(clamp01((T - p.t0) / 0.75));
        const fa = 1 - rng01(T, p.edge ? 22.6 : 22.45, p.edge ? 23.15 : 23.0);
        if (fa <= 0) continue;
        const q = flight(p, e, cam);
        if (e > 0 && e < 1) {
          const b = flight(p, Math.max(0, e - 0.09), cam);
          ctx.strokeStyle = `rgba(236,240,250,${0.25 * fa})`;
          ctx.lineWidth = q.s * 0.55;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(238,242,250,${0.9 * fa})`;
        ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
      }

      glass(ctx, cam, "front", ga);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);

// ------------------------------------------------------------------ 28.85 – 36.2: one mind, its own ideas, raised by its surroundings; then a wall of minds, none alike
const HERO_R = 300;
const CELL_R = 62;
type Cell = { x: number; y: number; seed: number; d: number };
const WALL: Cell[] = (() => {
  const out: Cell[] = [];
  for (let c = -1; c <= 5; c++)
    for (let r = -4; r <= 4; r++) {
      if (c === 2 && r === 0) continue;
      const x = CX + (c - 2) * 200, y = CY + r * 160;
      out.push({ x, y, seed: 100 + out.length * 7, d: Math.hypot(x - CX, y - CY) });
    }
  return out;
})();
/** the surroundings, in wall coordinates */
const envF = (x: number, y: number, T: number) => fbm(x * 0.0105 + 1.3, y * 0.0105 + 5.1, T * 0.05);

export const Minds: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      ctx.globalAlpha = rng01(T, 28.85, 29.0);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalAlpha = 1;
      const z = ease.inOut(rng01(T, 32.55, 33.75, (x) => x));
      const Z = Math.exp(lerp(Math.log(HERO_R / CELL_R), 0, z));
      const toWall = (px: number, py: number): [number, number] => [CX + (px - CX) / Z, CY + (py - CY) / Z];
      const field = (px: number, py: number) => {
        const [x, y] = toWall(px, py);
        return envF(x, y, T);
      };
      const col = ease.inCubic(rng01(T, 35.15, 35.9, (x) => x));
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.22 * (1 - col), 140, T * 2);

      // the environment: "matures based on the environment it's raised in"
      const env = rng01(T, w("matures", 2), w("matures", 5) + 0.3) * (1 - rng01(T, 32.55, 33.2));
      if (env > 0.003) {
        ctx.globalCompositeOperation = "source-over";
        const R = CELL_R * Z;
        contours(
          ctx,
          (px, py) => {
            const d2 = (px - CX) ** 2 + (py - CY) ** 2;
            return field(px, py) * 0.9 + 0.2 * Math.exp(-d2 / (2 * (R * 1.1) ** 2));
          },
          Array.from({ length: 16 }, (_, i) => 0.3 + i * 0.033),
          18,
          0.26 * env,
          (x, y) => clamp01((Math.hypot(x - CX, y - CY) - R * 0.92) / 110) * clamp01(1.25 - Math.abs(y - 760) / 760),
        );
        ctx.globalCompositeOperation = "lighter";
      }

      // the one we followed in
      const into = 1 - rng01(T, 28.85, 29.45);
      glow(ctx, CX, CY, lerp(40, 210, into), 0.75 * into);
      const heroA = 1 - col * 0.4;
      const hp = { x: lerp(CX, CX, col), y: CY };
      glyph(ctx, hp.x, hp.y, CELL_R * Z * (1 - col), 1, {
        grow: ease.outCubic(rng01(T, 28.9, 29.95, (x) => x)),
        ideas: rng01(T, w("forms", 3) - 0.05, w("forms", 3) + 0.6),
        mature: ease.inOut(rng01(T, w("matures", 1) - 0.05, w("matures", 7) + 0.4)),
        think: rng01(T, w("alike", 5) - 0.1, w("alike", 5) + 0.4),
        a: heroA,
        T,
        field,
      });

      // the others: "with no two of them thinking exactly alike"
      for (const c of WALL) {
        const sx = CX + (c.x - CX) * Z, sy = CY + (c.y - CY) * Z;
        const va = clamp01(1.3 - ((c.x - CX) / 560) ** 2 - ((c.y - CY) / 520) ** 2);
        const t0 = 32.75 + c.d / 1500 + 0.3 * hash(c.seed);
        const g = ease.outCubic(rng01(T, t0, t0 + 0.8, (x) => x));
        if (g <= 0 || va <= 0) continue;
        const ripple = 0.5 * Math.exp(-(((T - w("alike", 7) - c.d / 1100) / 0.16) ** 2));
        const x = lerp(sx, CX, col), y = lerp(sy, CY, col);
        const clear = clamp01((y - 215) / 150);
        if (clear <= 0) continue;
        glyph(ctx, x, y, CELL_R * Z * (1 - col), c.seed, {
          grow: g,
          ideas: rng01(T, t0 + 0.4, t0 + 1.0),
          mature: 0.55 + 0.45 * hash(c.seed * 3.7),
          think: rng01(T, w("alike", 5) - 0.1, w("alike", 5) + 0.4),
          a: va * clear * (0.8 + ripple) * (1 - col * 0.5),
          T,
          field,
        });
      }
      // all of them, drawn in to a single point of light: the breath before the turn
      const pt = rng01(T, 35.45, 35.95);
      if (pt > 0) {
        const br = 1 + 0.12 * Math.sin((T - 35.9) * 4);
        glow(ctx, CX, CY, 70 * br, 0.4 * pt);
        glow(ctx, CX, CY, 10 * br, pt);
      }
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);
