import React from "react";
import { fog } from "../edw/act3";
import { CanvasScene, H, V3, W, clamp01, ease, fbm, flare, glow, hash, lerp, mulberry, proj, rng01, rotX, rotY } from "../edw/kit";
import { contours, fillContours } from "./mark";
import { w } from "./type";

/** the hiring film's clock */
export const Z = {
  bang: w("growing", 0),
  team: 3.55,
  crowd: 5.9,
  one: w("sharp", 0),
  maze: 11.05,
  roof: 13.55,
  black: 16.85,
  city: 17.5,
  earth: 24.3,
  blue: 29.7,
  storm: 33.4,
  beamOn: 34.3,
  ui: 36.7,
  send: w("there", 0) - 0.05,
  signal: 44.8,
  end: 49.5,
};

// ------------------------------------------------------------------ a person, as a silhouette (feet at x, y)
const BODY: [number, number][] = [
  [0.035, -0.845], [0.13, -0.8], [0.158, -0.72], [0.152, -0.47], [0.118, -0.455], [0.1, -0.55], [0.1, -0.47], [0.088, -0.02], [0.095, 0], [0.025, 0], [0.012, -0.4],
];
const COAT: [number, number][] = [
  [0.035, -0.845], [0.14, -0.8], [0.17, -0.72], [0.16, -0.46], [0.15, -0.2], [0.11, -0.18], [0.085, -0.02], [0.095, 0], [0.025, 0], [0.012, -0.18],
];
function personPath(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, coat = false, flap = 0) {
  const P = coat ? COAT : BODY;
  ctx.beginPath();
  ctx.ellipse(x, y - 0.915 * h, 0.06 * h, 0.075 * h, 0, 0, Math.PI * 2);
  ctx.moveTo(x - P[0][0] * h, y + P[0][1] * h);
  for (const [px, py] of P) ctx.lineTo(x + (px + (coat && py > -0.3 && py < -0.15 ? flap : 0)) * h, y + py * h);
  for (let i = P.length - 1; i >= 0; i--) {
    const [px, py] = P[i];
    ctx.lineTo(x - (px - (coat && py > -0.3 && py < -0.15 ? flap * 0.6 : 0)) * h, y + py * h);
  }
  ctx.closePath();
}
/** a backlit figure: a thin rim of light, then the dark body over it */
export function person(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, body: string, rim = 0, coat = false, flap = 0) {
  if (rim > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(240,244,255,${rim})`;
    ctx.shadowBlur = h * 0.06;
    personPath(ctx, x, y, h, coat, flap);
    ctx.fillStyle = `rgba(235,240,250,${rim})`;
    ctx.fill();
    ctx.restore();
    personPath(ctx, x + h * 0.006, y + h * 0.004, h * 0.985, coat, flap);
  } else personPath(ctx, x, y, h, coat, flap);
  ctx.fillStyle = body;
  ctx.fill();
}

function stars(ctx: CanvasRenderingContext2D, T: number, a: number, n = 220) {
  for (let i = 0; i < n; i++) {
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T * (1 + hash(i) * 2) + i));
    ctx.fillStyle = `rgba(235,238,245,${a * tw * (0.2 + 0.6 * hash(i + 0.3))})`;
    const s = hash(i + 0.7) < 0.08 ? 2.2 : 1.3;
    ctx.fillRect(hash(i * 1.37) * W, hash(i * 2.71) * H, s, s);
  }
}

// ------------------------------------------------------------------ 1. a world is born: a flash, then matter spirals into a galaxy
let GAL: { r: number; a: number; y: number; arm: number; v: number; s: number }[] | null = null;
const galaxy = () =>
  (GAL ??= (() => {
    const r = mulberry(12);
    return Array.from({ length: 4200 }, () => {
      const arm = Math.floor(r() * 3);
      const rad = Math.pow(r(), 0.7);
      return { r: rad, a: arm * ((Math.PI * 2) / 3) + rad * 5.2 + (r() - 0.5) * (0.9 - rad * 0.5), y: (r() - 0.5) * 0.08 * (1 - rad), arm, v: 0.5 + r(), s: 0.6 + r() * 1.6 };
    });
  })());

export const BigBang: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.bang;
      const out = rng01(T, Z.team - 0.3, Z.team, ease.inCubic);
      ctx.globalCompositeOperation = "lighter";
      stars(ctx, T, 0.6 * clamp01(t / 0.8));
      if (t < 0) {
        // the singularity, gathering
        const k = clamp01((T - 0.4) / (Z.bang - 0.4));
        glow(ctx, W / 2, H / 2, 10 + 60 * k * k, 0.4 + 0.6 * k);
        flare(ctx, W / 2, H / 2, 0.3 * k, 400 + 600 * k, 10 + 20 * k);
        ctx.globalCompositeOperation = "source-over";
        return;
      }
      const burst = 1 - Math.exp(-t * 2.6);
      const spin = t * 0.35;
      const tilt = lerp(1.1, 0.95, ease.inOut(t / 2.2));
      const R = 640 * burst + 40;
      for (const p of galaxy()) {
        const a = p.a + spin * (1.6 - p.r);
        const q = rotX([Math.cos(a) * p.r, p.y, Math.sin(a) * p.r] as V3, tilt);
        const s = proj(q, R, 3, W / 2, H / 2);
        const al = (0.35 + 0.65 * (1 - p.r)) * (1 - out) * clamp01(t * 3);
        ctx.fillStyle = `rgba(236,240,250,${Math.min(1, al * 1.3)})`;
        ctx.fillRect(s.x, s.y, p.s * s.k * 1.5, p.s * s.k * 1.5);
      }
      // nebula and core
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + spin;
        glow(ctx, W / 2 + Math.cos(a) * R * 0.45, H / 2 + Math.sin(a) * R * 0.45 * Math.cos(tilt), 300 * burst, 0.09 * (1 - out));
      }
      glow(ctx, W / 2, H / 2, 160 + 120 * burst, 0.5 * (1 - out));
      const flash = Math.exp(-t / 0.18);
      flare(ctx, W / 2, H / 2, flash, 1900, 220);
      ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.exp(-t / 0.08)})`;
      ctx.fillRect(0, 0, W, H);
      // shockwave
      const sw = clamp01(t / 1.2);
      ctx.strokeStyle = `rgba(240,244,255,${0.4 * (1 - sw)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, 40 + 1100 * ease.outCubic(sw), (40 + 1100 * ease.outCubic(sw)) * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);

// ------------------------------------------------------------------ 2. the team on a wet floor, three places waiting under their lights
export const Team: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.team;
      const fade = rng01(t, 0, 0.35) * (1 - rng01(T, Z.crowd - 0.25, Z.crowd));
      const hz = 600;
      const zoom = lerp(1.06, 1.0, ease.outCubic(t / 2.4));
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = fade;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#060607");
      bg.addColorStop(0.55, "#15161a");
      bg.addColorStop(1, "#050506");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, W / 2, hz - 40, 900, 0.12);
      fog(ctx, T, 1.2, hz);
      ctx.globalCompositeOperation = "source-over";
      const slots = [1, 4, 7];
      const lit = slots.map((_, k) => rng01(T, w("growing", 7) + k * 0.16, w("growing", 7) + k * 0.16 + 0.12));
      const N = 9, gap = 175;
      for (let i = 0; i < N; i++) {
        const x = W / 2 + (i - (N - 1) / 2) * gap;
        const y = hz + 210 + Math.abs(i - 4) * -6;
        const h = 330;
        const si = slots.indexOf(i);
        if (si >= 0) {
          const L = lit[si] * (0.85 + 0.15 * Math.sin(T * 9 + i));
          // the cone of light from above, the pool on the wet floor
          ctx.globalCompositeOperation = "lighter";
          const cone = ctx.createLinearGradient(0, 0, 0, y);
          cone.addColorStop(0, `rgba(240,244,255,${0.0})`);
          cone.addColorStop(1, `rgba(240,244,255,${0.22 * L})`);
          ctx.fillStyle = cone;
          ctx.beginPath();
          ctx.moveTo(x - 10, 0);
          ctx.lineTo(x + 10, 0);
          ctx.lineTo(x + 95, y);
          ctx.lineTo(x - 95, y);
          ctx.fill();
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(1, 0.22);
          glow(ctx, 0, 0, 120, 0.7 * L);
          ctx.restore();
          for (let k = 0; k < 14; k++) {
            const dx = (hash(i * 17 + k) - 0.5) * 120 * (0.3 + 0.7 * hash(k + 3)), dy = ((hash(i * 5 + k) * y + T * 20 * (0.3 + hash(k))) % y);
            glow(ctx, x + dx * (dy / y), dy, 3, 0.4 * L);
          }
          // the outline of who belongs here, dashed
          ctx.globalCompositeOperation = "source-over";
          ctx.save();
          ctx.setLineDash([6, 7]);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(240,244,255,${0.55 * L})`;
          personPath(ctx, x, y, h);
          ctx.stroke();
          ctx.restore();
        } else {
          person(ctx, x, y, h * (0.97 + 0.03 * hash(i)), "#08080a", 0.55);
          // reflection on the wet floor
          ctx.save();
          ctx.globalAlpha = 0.18 * fade;
          ctx.translate(0, 2 * y);
          ctx.scale(1, -1);
          person(ctx, x, y, h, "#1a1b1f", 0);
          ctx.restore();
          ctx.globalAlpha = fade;
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 3. the crowd, all the same — and one of them lights up
type Fig = { x: number; y: number; h: number; g: number; ph: number };
let CROWD: Fig[] | null = null;
const ONE = { row: 4, x: W / 2 + 18 };
const crowd = () =>
  (CROWD ??= (() => {
    const r = mulberry(31);
    const out: Fig[] = [];
    for (let j = 0; j < 10; j++) {
      const h = 70 + j * j * 7 + j * 22;
      const y = 470 + j * j * 5.2 + j * 30;
      const sp = h * 0.42;
      for (let x = -sp + (j % 2) * sp * 0.5; x < W + sp; x += sp * (0.85 + r() * 0.3)) {
        out.push({ x: x + (r() - 0.5) * sp * 0.3, y: y + (r() - 0.5) * 8, h: h * (0.9 + r() * 0.18), g: 40 + j * -3 + r() * 14, ph: r() * 6 });
      }
    }
    return out;
  })());
const oneFig = () => {
  const C = crowd();
  const row = C.filter((f) => Math.abs(f.y - (470 + 16 * 5.2 + 120)) < 12);
  return row.reduce((b, f) => (Math.abs(f.x - ONE.x) < Math.abs(b.x - ONE.x) ? f : b), row[0]);
};

const ICO: V3[] = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  return ([[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]] as V3[]).map(
    (v) => v.map((c) => c / Math.hypot(...v)) as V3,
  );
})();

export const Crowd: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const fade = rng01(T, Z.crowd, Z.crowd + 0.4) * (1 - rng01(T, Z.maze - 0.3, Z.maze));
      const one = rng01(T, Z.one - 0.05, Z.one + 0.5, ease.outCubic);
      const sharp = rng01(T, w("sharp", 6) - 0.2, w("sharp", 7) + 0.4, ease.outCubic);
      const f = oneFig();
      const hx = f.x, hy = f.y - 0.915 * f.h;
      const push = ease.inOut(rng01(T, Z.one, Z.maze, (x) => x));
      const zoom = lerp(1.0, 2.6, push);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#0b0b0d";
      ctx.fillRect(0, 0, W, H);
      ctx.translate(lerp(W / 2, W / 2, push), lerp(H / 2, H / 2 + 60, push));
      ctx.scale(zoom, zoom);
      ctx.translate(-lerp(W / 2, hx, push), -lerp(H / 2, hy, push));
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, W / 2, 380, 1100, 0.1 * (1 - one * 0.6));
      fog(ctx, T, 1.0 * (1 - one * 0.5), 520);
      ctx.globalCompositeOperation = "source-over";
      for (const p of crowd()) {
        const isOne = p === f;
        if (isOne) continue;
        const dim = 1 - 0.55 * one;
        const g = Math.round(p.g * dim);
        person(ctx, p.x + Math.sin(T * 0.6 + p.ph) * 1.5, p.y, p.h, `rgb(${g},${g},${g + 3})`);
        if (p.y > f.y - 2 && p.y < f.y + 2) continue;
      }
      // the one: lit from within
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, hx, hy, f.h * (0.8 + 1.8 * one), 0.35 * one);
      // rays out of the mind
      if (one > 0) {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 + T * 0.08;
          const len = f.h * (2.2 + 1.2 * hash(i)) * one;
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(a);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, `rgba(240,244,255,${0.1 * one})`);
          g.addColorStop(1, "rgba(240,244,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(len, -len * 0.03);
          ctx.lineTo(len, len * 0.03);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      person(ctx, f.x, f.y, f.h, "#050506", 0.9 * one + 0.1);
      // a sharp crystal of thought forming around the head
      if (sharp > 0) {
        ctx.globalCompositeOperation = "lighter";
        const R = f.h * 0.22 * (0.6 + 0.4 * sharp);
        const pr = ICO.map((v) => {
          const q = rotX(rotY(v, T * 0.7), 0.4 + T * 0.2);
          return { x: hx + q[0] * R, y: hy + q[1] * R, z: q[2] };
        });
        ctx.lineWidth = 0.9;
        for (let i = 0; i < 12; i++)
          for (let j = i + 1; j < 12; j++) {
            const d = Math.hypot(ICO[i][0] - ICO[j][0], ICO[i][1] - ICO[j][1], ICO[i][2] - ICO[j][2]);
            if (d > 1.1) continue;
            ctx.strokeStyle = `rgba(240,244,255,${(pr[i].z + pr[j].z < 0 ? 0.9 : 0.35) * sharp})`;
            ctx.beginPath();
            ctx.moveTo(pr[i].x, pr[i].y);
            ctx.lineTo(pr[j].x, pr[j].y);
            ctx.stroke();
          }
        for (const p of pr) glow(ctx, p.x, p.y, 6, 0.8 * sharp);
        flare(ctx, hx, hy, Math.exp(-Math.max(0, T - w("sharp", 7)) / 0.3) * sharp * 0.6, 700, 20);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 4. a labyrinth that solves itself the way you breathe
let MAZE: { walls: [number, number, number, number][]; path: [number, number][]; cols: number; rows: number } | null = null;
const maze = () =>
  (MAZE ??= (() => {
    const cols = 37, rows = 19;
    const r = mulberry(8);
    const seen = new Set<number>();
    const open = new Set<string>();
    const stack: number[] = [0];
    seen.add(0);
    while (stack.length) {
      const c = stack[stack.length - 1];
      const x = c % cols, y = Math.floor(c / cols);
      const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows && !seen.has(b * cols + a));
      if (!nb.length) {
        stack.pop();
        continue;
      }
      const [a, b] = nb[Math.floor(r() * nb.length)];
      const n = b * cols + a;
      seen.add(n);
      open.add(`${Math.min(c, n)}-${Math.max(c, n)}`);
      stack.push(n);
    }
    const walls: [number, number, number, number][] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const c = y * cols + x;
        if (x < cols - 1 && !open.has(`${c}-${c + 1}`)) walls.push([x + 1, y, x + 1, y + 1]);
        if (y < rows - 1 && !open.has(`${c}-${c + cols}`)) walls.push([x, y + 1, x + 1, y + 1]);
      }
    walls.push([0, 0, cols, 0], [0, rows, cols, rows], [0, 1, 0, rows], [cols, 0, cols, rows - 1]);
    // solve: breadth first from the top-left to the bottom-right
    const prev = new Map<number, number>();
    const q = [0];
    const vis = new Set([0]);
    while (q.length) {
      const c = q.shift()!;
      const x = c % cols, y = Math.floor(c / cols);
      for (const n of [c + 1, c - 1, c + cols, c - cols]) {
        if (n < 0 || n >= cols * rows || vis.has(n)) continue;
        if ((n === c + 1 && x === cols - 1) || (n === c - 1 && x === 0)) continue;
        if (!open.has(`${Math.min(c, n)}-${Math.max(c, n)}`)) continue;
        vis.add(n);
        prev.set(n, c);
        q.push(n);
      }
      void y;
    }
    const path: [number, number][] = [];
    for (let c: number | undefined = cols * rows - 1; c !== undefined; c = prev.get(c)) path.unshift([(c % cols) + 0.5, Math.floor(c / cols) + 0.5]);
    return { walls, path, cols, rows };
  })());

export const Maze: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const M = maze();
      const fade = rng01(T, Z.maze, Z.maze + 0.3) * (1 - rng01(T, Z.roof - 0.25, Z.roof));
      const solve = rng01(T, w("sharp", 9) - 0.1, w("sharp", 13), (x) => x);
      const br = rng01(T, w("sharp", 17) - 0.5, w("sharp", 17)) * (0.5 + 0.5 * Math.sin(((T - w("sharp", 17)) / 2.6) * Math.PI * 2 - Math.PI / 2));
      const cs = 46;
      const zoom = lerp(1.9, 1.0, ease.inOut(rng01(T, Z.maze, w("sharp", 12)))) * (1 + 0.025 * br);
      const ox = W / 2 - (M.cols * cs) / 2, oy = H / 2 - (M.rows * cs) / 2;
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.rotate(-0.03 + 0.02 * Math.sin(T * 0.4));
      ctx.translate(-W / 2, -H / 2);
      ctx.strokeStyle = `rgba(225,230,240,${0.22 + 0.2 * br})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "square";
      ctx.beginPath();
      for (const [a, b, c, d] of M.walls) {
        ctx.moveTo(ox + a * cs, oy + b * cs);
        ctx.lineTo(ox + c * cs, oy + d * cs);
      }
      ctx.stroke();
      // the solution, drawn in one stroke
      const n = Math.floor(solve * (M.path.length - 1));
      if (solve > 0) {
        ctx.globalCompositeOperation = "lighter";
        for (const [lw, al] of [[14, 0.08], [6, 0.25], [2.5, 1]] as const) {
          ctx.strokeStyle = `rgba(245,248,255,${al * (0.8 + 0.2 * br)})`;
          ctx.lineWidth = lw;
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i <= n; i++) {
            const [x, y] = M.path[i];
            i ? ctx.lineTo(ox + x * cs, oy + y * cs) : ctx.moveTo(ox + x * cs, oy + y * cs);
          }
          ctx.stroke();
        }
        const [hx, hy] = M.path[n];
        glow(ctx, ox + hx * cs, oy + hy * cs, 40, 0.9);
        if (solve >= 1) flare(ctx, ox + hx * cs, oy + hy * cs, Math.exp(-(T - w("sharp", 13)) / 0.4) * 0.7, 900, 40);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 5. calm, on the edge of the roof, above the city in the rain
let SKY: { x: number; w: number; h: number; l: number; win: [number, number, number][] }[] | null = null;
const skyline = () =>
  (SKY ??= (() => {
    const r = mulberry(17);
    const out: { x: number; w: number; h: number; l: number; win: [number, number, number][] }[] = [];
    for (const l of [0, 1, 2]) {
      let x = -40;
      while (x < W + 40) {
        const bw = 50 + r() * (60 + l * 50), bh = 140 + r() * (220 + l * 120);
        const win: [number, number, number][] = [];
        for (let wy = 20; wy < bh - 10; wy += 16 + l * 4) for (let wx = 8; wx < bw - 10; wx += 12 + l * 3) if (r() < 0.35) win.push([wx, wy, r()]);
        out.push({ x, w: bw, h: bh, l, win });
        x += bw + 3 + r() * 14;
      }
    }
    return out;
  })());

export const Roof: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.roof;
      const fade = rng01(t, 0, 0.3) * (1 - rng01(T, Z.black - 0.4, Z.black));
      const bolt = t > 0.45 ? Math.exp(-(t - 0.45) / 0.15) + 0.6 * Math.exp(-Math.max(0, t - 0.75) / 0.1) * (t > 0.75 ? 1 : 0) : 0;
      const push = lerp(1.0, 1.08, ease.inOut(t / 3.3));
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(push, push);
      ctx.translate(-W / 2, -H / 2);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${8 + 70 * bolt},${9 + 70 * bolt},${12 + 72 * bolt})`);
      sky.addColorStop(1, `rgb(${30 + 40 * bolt},${31 + 40 * bolt},${36 + 40 * bolt})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, 520, 250, 420, 0.12);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#c9ccd2";
      ctx.beginPath();
      ctx.arc(520, 250, 92, 0, Math.PI * 2);
      ctx.fill();
      if (bolt > 0.05) {
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, bolt)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let x = 1500, y = 0;
        ctx.moveTo(x, y);
        for (let i = 0; i < 14; i++) {
          x += (hash(i * 3.3) - 0.5) * 70;
          y += 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (const l of [0, 1, 2]) {
        const sh = [30, 18, 9][l] + bolt * [60, 40, 20][l];
        for (const b of skyline().filter((b) => b.l === l)) {
          const by = 1010 - b.h * (0.8 + 0.25 * l) + l * 40;
          ctx.fillStyle = `rgb(${sh},${sh + 1},${sh + 4})`;
          ctx.fillRect(b.x, by, b.w, H - by);
          for (const [wx, wy, k] of b.win) {
            ctx.fillStyle = `rgba(235,236,240,${(0.25 + 0.35 * k) * [0.4, 0.55, 0.7][l] * (0.8 + 0.2 * Math.sin(T * 0.5 + k * 9))})`;
            ctx.fillRect(b.x + wx, by + wy, 4 + l, 6 + l);
          }
        }
      }
      // the ledge and the figure, still, coat moving in the wind
      ctx.fillStyle = "#030304";
      ctx.beginPath();
      ctx.moveTo(1000, 1080);
      ctx.lineTo(1180, 860);
      ctx.lineTo(1920, 860);
      ctx.lineTo(1920, 1080);
      ctx.fill();
      ctx.fillStyle = "#151619";
      ctx.fillRect(1180, 856, 740, 6);
      person(ctx, 1420, 858, 430, "#030304", 0.5 + 0.5 * bolt, true, Math.sin(T * 2.3) * 0.012 + Math.sin(T * 5.1) * 0.004);
      ctx.restore();
      // rain over everything
      ctx.strokeStyle = "rgba(210,215,225,0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 650; i++) {
        const a = hash(i * 3.1), b = hash(i * 7.7), s = 0.4 + hash(i * 1.3) * 0.6;
        const len = 30 + 40 * s;
        const y = ((b * (H + 200) + T * 1900 * s) % (H + 200)) - 100;
        const x = ((((a * (W + 200) - T * 260 * s) % (W + 200)) + W + 200) % (W + 200)) - 100;
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.14, y + len);
      }
      ctx.stroke();
      if (bolt > 0.01) {
        ctx.fillStyle = `rgba(230,235,245,${bolt * 0.35})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 6. we build together: a city rises out of the ground; one tower is yours
type Blk = { x: number; z: number; h: number; d: number; c: boolean };
let BLK: Blk[] | null = null;
const blocks = () =>
  (BLK ??= (() => {
    const out: Blk[] = [];
    for (let i = -6; i <= 6; i++)
      for (let j = -6; j <= 6; j++) {
        const d = Math.hypot(i, j);
        if (d > 6.6) continue;
        const n = fbm(i * 0.35 + 4, j * 0.35, 1.7);
        const center = i === 0 && j === 0;
        out.push({ x: i * 1.25, z: j * 1.25, h: center ? 9 : (1 + 7 * n * n) * (1.25 - d / 7), d, c: center });
      }
    return out;
  })());

export const City: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.city;
      const fade = rng01(t, 0, 0.5) * (1 - rng01(T, Z.earth - 0.35, Z.earth));
      const yours = rng01(T, w("yours", 2) - 0.1, w("yours", 2) + 0.5, ease.outCubic);
      const yaw = 0.65 + t * 0.09, pitch = -0.5 + 0.06 * Math.sin(t * 0.3);
      const P = (p: V3) => proj(rotX(rotY(p, yaw), pitch), 88, 28, W / 2, H / 2 + 150);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#060607";
      ctx.fillRect(0, 0, W, H);
      // ground grid
      ctx.strokeStyle = "rgba(220,225,235,0.08)";
      ctx.lineWidth = 1;
      for (let k = -9; k <= 9; k++) {
        const a = P([k * 1.25 - 0.62, 0, -11.9]), b = P([k * 1.25 - 0.62, 0, 11.9]);
        const c = P([-11.9, 0, k * 1.25 - 0.62]), d = P([11.9, 0, k * 1.25 - 0.62]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      const list = blocks()
        .map((b) => {
          const g = ease.outCubic(clamp01((T - (Z.city + 0.4 + b.d * 0.42)) / 1.4));
          const q = rotX(rotY([b.x, 0, b.z], yaw), pitch);
          return { b, g, z: q[2] };
        })
        .filter((o) => o.g > 0)
        .sort((a, c) => c.z - a.z);
      const s = 0.42;
      for (const { b, g } of list) {
        const h = b.h * g;
        const c = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([dx, dz]) => [b.x + dx, b.z + dz]);
        const bot = c.map(([x, z]) => P([x, 0, z])), top = c.map(([x, z]) => P([x, h, z]));
        const lit = b.c ? yours : 0;
        // side faces (all four, back ones get covered)
        for (let k = 0; k < 4; k++) {
          const k2 = (k + 1) % 4;
          const shade = 30 + 22 * (k % 2) + lit * 190;
          ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 4})`;
          ctx.beginPath();
          ctx.moveTo(bot[k].x, bot[k].y);
          ctx.lineTo(bot[k2].x, bot[k2].y);
          ctx.lineTo(top[k2].x, top[k2].y);
          ctx.lineTo(top[k].x, top[k].y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = `rgb(${62 + lit * 185},${64 + lit * 185},${70 + lit * 185})`;
        ctx.beginPath();
        top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(235,240,250,${0.7 * (1 - g * 0.4) + 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(bot[k].x, bot[k].y);
          ctx.lineTo(top[k].x, top[k].y);
          ctx.stroke();
        }
        // windows climbing as it grows
        if (h > 1.2 && !b.c) {
          ctx.fillStyle = "rgba(235,238,245,0.5)";
          for (let y = 0.6; y < h - 0.3; y += 0.55) {
            if (hash(b.x * 7 + b.z * 13 + y) < 0.5) continue;
            const p = P([b.x - s, y, b.z + (hash(y + b.x) - 0.5) * 0.5]);
            ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
          }
        }
      }
      // yours: a beam from the tower to the sky
      if (yours > 0) {
        const top = P([0, 9, 0]);
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(0, 0, 0, top.y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, `rgba(255,255,255,${0.35 * yours})`);
        ctx.fillStyle = g;
        ctx.fillRect(top.x - 16, 0, 32, top.y);
        flare(ctx, top.x, top.y, (0.4 + 0.6 * Math.exp(-(T - w("yours", 2)) / 0.4)) * yours, 1300, 70);
        ctx.globalCompositeOperation = "source-over";
      }
      // the share: a thin ring of ticks, sweeping
      const ring = rng01(T, w("share", 5) - 0.2, w("share", 5) + 0.6);
      if (ring > 0) {
        const sweep = ease.inOut(rng01(T, w("share", 5), w("yours", 2), (x) => x));
        ctx.strokeStyle = `rgba(235,240,250,${0.25 * ring})`;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 120; i++) {
          const a = -Math.PI / 2 + (i / 120) * Math.PI * 2;
          const on = i / 120 < sweep;
          const r0 = 470, r1 = i % 10 === 0 ? 492 : 482;
          ctx.strokeStyle = `rgba(235,240,250,${(on ? 0.75 : 0.18) * ring})`;
          ctx.beginPath();
          ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0);
          ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 7. the world from orbit at night, sunrise on the rim, routes of light
let LIGHTS: V3[] | null = null;
const lights = () =>
  (LIGHTS ??= (() => {
    const r = mulberry(23);
    const out: V3[] = [];
    while (out.length < 6000) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const p: V3 = [s * Math.cos(a), u, s * Math.sin(a)];
      const land = fbm(p[0] * 1.6 + 5, p[1] * 1.6, p[2] * 1.6);
      if (land < 0.52) continue;
      if (fbm(p[0] * 9, p[1] * 9 + 3, p[2] * 9) < 0.5 + 0.2 * r()) continue;
      out.push(p);
    }
    return out;
  })());

export const Earth: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.earth;
      const fade = rng01(t, 0, 0.5) * (1 - rng01(T, Z.blue - 0.35, Z.blue));
      const R = 1500, cx = W / 2, cy = 300 + R;
      const rise = rng01(T, w("anywhere", 4) - 0.5, w("anywhere", 4) + 1.2, ease.outCubic);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#020203";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      stars(ctx, T, 0.8);
      ctx.globalCompositeOperation = "source-over";
      const camY = lerp(0, -60, ease.inOut(t / 5.4));
      ctx.save();
      ctx.translate(0, camY);
      // the planet
      const g = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.6, cx, cy, R);
      g.addColorStop(0, "#050506");
      g.addColorStop(1, "#0c0d10");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      // city lights
      const ry = t * 0.05, tilt = -0.95;
      ctx.globalCompositeOperation = "lighter";
      for (const p of lights()) {
        const q = rotX(rotY(p, ry), tilt);
        if (q[2] > -0.05) continue;
        const x = cx + q[0] * R, y = cy - q[1] * R;
        if (y < 250 || y > H + 20) continue;
        const a = 0.35 + 0.45 * hash(p[0] * 99);
        ctx.fillStyle = `rgba(240,240,232,${a * (0.6 + 0.4 * -q[2])})`;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      // routes: arcs of light between cities
      const r = mulberry(4);
      const L = lights();
      for (let k = 0; k < 10; k++) {
        const a = L[Math.floor(r() * L.length)], b = L[Math.floor(r() * L.length)];
        const st = w("anywhere", 0) + 0.4 + k * 0.32;
        const u = clamp01((T - st) / 0.9);
        if (u <= 0) continue;
        ctx.strokeStyle = `rgba(240,244,255,${0.5})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let pen = false;
        for (let j = 0; j <= 24; j++) {
          const v = (j / 24) * u;
          const m: V3 = [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)];
          const n = Math.hypot(...m) || 1, h = 1 + 0.08 * Math.sin(Math.PI * v);
          const q = rotX(rotY([(m[0] / n) * h, (m[1] / n) * h, (m[2] / n) * h], ry), tilt);
          if (q[2] > 0) {
            pen = false;
            continue;
          }
          const x = cx + q[0] * R, y = cy - q[1] * R;
          pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          pen = true;
        }
        ctx.stroke();
      }
      // atmosphere and the sunrise on the rim
      for (const [lw, al] of [[60, 0.05], [24, 0.12], [8, 0.3], [2, 0.7]] as const) {
        ctx.strokeStyle = `rgba(215,225,245,${al * (0.5 + 0.5 * rise)})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(cx, cy, R + lw * 0.3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      flare(ctx, cx + 260, cy - Math.sqrt(R * R - 260 * 260) - 4, rise * (0.85 + 0.15 * Math.sin(T * 2)), 1800, 140);
      glow(ctx, cx + 260, 300, 700, 0.18 * rise);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 8. what you build, drawn as a blueprint; where you sit, gone like dust
export const Blueprint: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.blue;
      const fade = rng01(t, 0, 0.35) * (1 - rng01(T, Z.storm - 0.3, Z.storm));
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#07080a";
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) {
        ctx.strokeStyle = `rgba(220,226,238,${x % 200 === 0 ? 0.08 : 0.035})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.strokeStyle = `rgba(220,226,238,${y % 200 === 0 ? 0.08 : 0.035})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const dim = 1 - 0.65 * rng01(T, w("sit", 3) - 0.4, w("sit", 3));
      const draw = rng01(T, Z.blue + 0.1, w("build", 7) + 0.2, (x) => x);
      // a suspension bridge, line by line
      const segs: [number, number, number, number][] = [];
      const deckY = 700, L = 300, Rr = 1620, t1 = 640, t2 = 1280, top = 330;
      segs.push([L - 140, deckY, Rr + 140, deckY], [L - 140, deckY + 26, Rr + 140, deckY + 26]);
      for (const tx of [t1, t2]) segs.push([tx - 18, top, tx - 18, deckY + 160], [tx + 18, top, tx + 18, deckY + 160], [tx - 18, top + 40, tx + 18, top + 40], [tx - 18, 520, tx + 18, 520]);
      const cable = (x0: number, x1: number, sag: number) => {
        let px = x0, py = top;
        for (let i = 1; i <= 24; i++) {
          const u = i / 24, x = lerp(x0, x1, u), y = top + sag * 4 * u * (1 - u) * (x1 - x0 > 0 ? 1 : 1);
          segs.push([px, py, x, y]);
          if (i % 2 === 0) segs.push([x, y, x, deckY]);
          px = x;
          py = y;
        }
      };
      cable(t1, t2, 300);
      ctx.strokeStyle = "rgba(240,244,252,1)";
      ctx.lineWidth = 2.2;
      const n = segs.length;
      for (let i = 0; i < n; i++) {
        const u = clamp01(draw * n * 1.15 - i);
        if (u <= 0) break;
        const [a, b, c, d] = segs[i];
        ctx.globalAlpha = fade * dim;
        ctx.beginPath();
        ctx.moveTo(a, b);
        ctx.lineTo(lerp(a, c, u), lerp(b, d, u));
        ctx.stroke();
      }
      // dimension lines
      ctx.globalAlpha = fade * dim * clamp01(draw * 2 - 1);
      ctx.strokeStyle = "rgba(235,240,250,0.45)";
      ctx.beginPath();
      ctx.moveTo(t1, 820);
      ctx.lineTo(t2, 820);
      ctx.moveTo(t1, 810);
      ctx.lineTo(t1, 830);
      ctx.moveTo(t2, 810);
      ctx.lineTo(t2, 830);
      ctx.stroke();
      ctx.globalAlpha = fade;
      // the empty chair under a light, then blown away to dust
      const chairIn = rng01(T, w("sit", 3) - 0.3, w("sit", 3) + 0.2);
      const dust = rng01(T, w("sit", 5) + 0.05, Z.storm, (x) => x);
      if (chairIn > 0) {
        const cx = W / 2, cy = 640;
        ctx.globalCompositeOperation = "lighter";
        const cone = ctx.createLinearGradient(0, 0, 0, cy + 120);
        cone.addColorStop(0, "rgba(240,244,255,0)");
        cone.addColorStop(1, `rgba(240,244,255,${0.2 * chairIn})`);
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(cx - 12, 0);
        ctx.lineTo(cx + 12, 0);
        ctx.lineTo(cx + 170, cy + 120);
        ctx.lineTo(cx - 170, cy + 120);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        const parts: [number, number, number, number][] = [
          [-70, -40, 140, 18],
          [-60, -210, 120, 150],
          [-6, -22, 12, 80],
          [-90, 58, 180, 10],
        ];
        const r = mulberry(3);
        for (const [x, y, wd, ht] of parts) {
          for (let i = 0; i < Math.floor((wd * ht) / 60); i++) {
            const px = x + r() * wd, py = y + r() * ht;
            const k = clamp01(dust * 1.6 - (px + 100) / 300);
            const dx = k * (300 + 500 * r()), dy = -k * (80 + 160 * r());
            const a = chairIn * (1 - k);
            if (a <= 0.01) continue;
            ctx.fillStyle = `rgba(225,228,235,${a})`;
            ctx.fillRect(cx + px + dx, cy + py + dy, k > 0 ? 2 : 5.5, k > 0 ? 2 : 5.5);
          }
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 9. the storm and the signal: a beam opens in the clouds, the call
let CLOUD: HTMLCanvasElement | null = null;
function cloudTex() {
  if (CLOUD) return CLOUD;
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 200;
  const g = c.getContext("2d")!;
  const img = g.createImageData(480, 200);
  for (let y = 0; y < 200; y++)
    for (let x = 0; x < 480; x++) {
      const n = fbm(x / 70, y / 40, 2.3);
      const ex = Math.min(1, x / 80, (479 - x) / 80);
      const v = clamp01((n - 0.38) * 2.6) * Math.pow(Math.sin((y / 200) * Math.PI), 1.6) * ex;
      const i = (y * 480 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(v * 255);
    }
  g.putImageData(img, 0, 0);
  CLOUD = c;
  return c;
}
let SPOT: HTMLCanvasElement | null = null;

export const Storm: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - Z.storm;
      const fade = rng01(t, 0, 0.3) * (1 - rng01(T, Z.ui - 0.2, Z.ui + 0.6));
      const bolt = t > 0.1 ? Math.exp(-(t - 0.1) / 0.14) + 0.7 * (t > 0.42 ? Math.exp(-(t - 0.42) / 0.09) : 0) : 0;
      const on = 0;
      const uiDim = 1 - 0.5 * rng01(T, Z.ui, Z.ui + 0.5) * (1 - rng01(T, Z.send, Z.send + 0.6));
      const mark = rng01(T, Z.signal - 0.05, Z.signal + 0.25, ease.outCubic);
      const sx = W / 2, sy = 300;
      ctx.globalAlpha = fade;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${10 + 80 * bolt},${11 + 80 * bolt},${14 + 84 * bolt})`);
      sky.addColorStop(1, "#050506");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // clouds, drifting
      const ct = cloudTex();
      const drift = (T - Z.storm) * 12;
      ctx.globalAlpha = fade * (0.32 + 0.4 * bolt);
      ctx.drawImage(ct, -500 + drift, 0, W * 1.6, 640);
      ctx.globalAlpha = fade;
      // the beam from the ground into the clouds
      if (on > 0) {
        ctx.globalCompositeOperation = "lighter";
        const bx = W / 2, by = H + 40;
        const g = ctx.createLinearGradient(0, by, 0, sy);
        g.addColorStop(0, `rgba(240,244,255,${0.32 * on * uiDim})`);
        g.addColorStop(1, `rgba(240,244,255,${0.08 * on * uiDim})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(bx - 30, by);
        ctx.lineTo(bx + 30, by);
        ctx.lineTo(sx + 250, sy + 30);
        ctx.lineTo(sx - 250, sy + 30);
        ctx.fill();
        // dust in the beam
        for (let i = 0; i < 70; i++) {
          const v = hash(i * 1.7), y = lerp(by, sy, ((v + T * 0.05 * (0.5 + hash(i))) % 1));
          const half = lerp(30, 250, (by - y) / (by - sy));
          glow(ctx, bx + (hash(i * 3.3) - 0.5) * 2 * half, y, 3, 0.35 * on * uiDim);
        }
        // the lit spot on the cloud base: brightness only where there is cloud
        SPOT ??= document.createElement("canvas");
        SPOT.width = 900;
        SPOT.height = 420;
        const s = SPOT.getContext("2d")!;
        s.globalCompositeOperation = "source-over";
        s.clearRect(0, 0, 900, 420);
        const rg = s.createRadialGradient(450, 210, 0, 450, 210, 300);
        rg.addColorStop(0, "rgba(255,255,255,0.95)");
        rg.addColorStop(0.5, "rgba(240,242,248,0.85)");
        rg.addColorStop(0.72, "rgba(225,228,236,0.8)");
        rg.addColorStop(0.8, "rgba(255,255,255,0.2)");
        rg.addColorStop(1, "rgba(255,255,255,0)");
        s.save();
        s.translate(450, 210);
        s.scale(1, 0.55);
        s.translate(-450, -210);
        s.fillStyle = rg;
        s.fillRect(0, 0, 900, 420);
        s.restore();
        if (mark > 0) {
          // the signal: the mark, dark in the light
          s.globalCompositeOperation = "destination-out";
          s.save();
          s.globalAlpha = mark;
          fillContours(s, contours().map((c) => c.pts), 450, 212, 0.25 * (0.9 + 0.1 * mark), "#000");
          s.restore();
        }
        ctx.globalAlpha = fade * on * uiDim * 0.78;
        ctx.drawImage(SPOT, sx - 450, sy - 210);
        ctx.globalAlpha = fade * on * uiDim * 0.55;
        // the soft core of the projection (so it reads even through thin cloud)
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(1, 0.55);
        glow(ctx, 0, 0, 330, 0.25);
        ctx.restore();
        ctx.globalAlpha = fade;
        if (mark > 0) flare(ctx, sx, sy, Math.exp(-(T - Z.signal) / 0.5) * 0.8, 1700, 120);
        ctx.globalCompositeOperation = "source-over";
      }
      // the sent form, shooting up the beam
      const shot = 0;
      if (shot > 0 && shot < 1) {
        ctx.globalCompositeOperation = "lighter";
        const y = lerp(560, sy, shot);
        glow(ctx, W / 2, y, 60, 0.9);
        const g = ctx.createLinearGradient(0, y, 0, y + 300);
        g.addColorStop(0, "rgba(255,255,255,0.6)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(W / 2 - 3, y, 6, 300);
        ctx.globalCompositeOperation = "source-over";
      }
      if (bolt > 0.01) {
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, bolt)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let x = 420, y = 0;
        ctx.moveTo(x, y);
        for (let i = 0; i < 16; i++) {
          x += (hash(i * 5.1) - 0.45) * 90;
          y += 42;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(230,235,245,${bolt * 0.3})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 10. space: the website floats in it, and at the end the mark, alone, fading in and out
export const Space: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const fade = rng01(T, Z.ui - 0.4, Z.ui + 0.6);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#020203";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      // slow parallax through the stars
      for (let i = 0; i < 380; i++) {
        const z = 0.3 + hash(i * 3.7) * 0.7;
        const x = (hash(i * 1.37) * W - T * 6 * z + W * 10) % W;
        const y = hash(i * 2.71) * H;
        const tw = 0.5 + 0.5 * Math.sin(T * (0.8 + hash(i) * 2) + i);
        ctx.fillStyle = `rgba(236,238,245,${(0.15 + 0.6 * z) * tw})`;
        const s = z > 0.92 ? 2.2 : 1.2;
        ctx.fillRect(x, y, s, s);
      }
      glow(ctx, W * 0.32 + Math.sin(T * 0.05) * 80, H * 0.4, 900, 0.05);
      glow(ctx, W * 0.72, H * 0.62, 700, 0.035);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 0. the penthouse: a radio on the table, a hand takes it; a man at the window, listening
let BOKEH: { x: number; y: number; r: number; a: number }[] | null = null;
const bokeh = () =>
  (BOKEH ??= (() => {
    const r = mulberry(61);
    return Array.from({ length: 140 }, () => ({ x: r() * W, y: 120 + r() * 620, r: 8 + r() * 46, a: 0.05 + r() * 0.22 }));
  })());

function windowView(ctx: CanvasRenderingContext2D, T: number, par: number, bright: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#07080a");
  g.addColorStop(0.6, "#121318");
  g.addColorStop(1, "#060607");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  // the city, out of focus: soft discs of light
  for (const b of bokeh()) {
    const x = b.x + par * (b.r / 50) * 40;
    const rg = ctx.createRadialGradient(x, b.y, 0, x, b.y, b.r);
    rg.addColorStop(0, `rgba(235,238,245,${b.a * bright})`);
    rg.addColorStop(0.7, `rgba(235,238,245,${b.a * 0.8 * bright})`);
    rg.addColorStop(1, "rgba(235,238,245,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  }
  glow(ctx, W * 0.55, 420, 900, 0.08 * bright);
  ctx.globalCompositeOperation = "source-over";
  // rain running down the glass
  ctx.strokeStyle = "rgba(220,225,235,0.12)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 160; i++) {
    const x = hash(i * 3.3) * W, sp = 60 + 140 * hash(i * 1.1);
    const y = ((hash(i * 7.1) * H + T * sp) % (H + 60)) - 30;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(y / 40 + i) * 2, y + 14 + 20 * hash(i));
  }
  ctx.stroke();
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(225,230,240,${0.08 + 0.12 * hash(i * 9.1)})`;
    ctx.beginPath();
    ctx.arc(hash(i * 4.4) * W, hash(i * 5.5) * H, 1 + 2.2 * hash(i * 6.6), 0, Math.PI * 2);
    ctx.fill();
  }
  // mullions
  ctx.fillStyle = "#040405";
  for (const x of [380, 1010, 1640]) ctx.fillRect(x + par * 10, 0, 22, H);
  ctx.fillRect(0, 96, W, 14);
}

/** a walkie-talkie standing on the table (x = centre, y = base) */
function radio(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, led: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  const body = (path: () => void, fill: string) => {
    ctx.beginPath();
    path();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  // antenna and knobs
  body(() => ctx.roundRect(-60, -470, 26, 140, 10), "#0b0b0d");
  body(() => ctx.roundRect(30, -372, 26, 40, 6), "#0e0e10");
  // the body
  const g = ctx.createLinearGradient(-80, 0, 80, 0);
  g.addColorStop(0, "#0a0a0c");
  g.addColorStop(0.75, "#141519");
  g.addColorStop(1, "#2a2c32");
  body(() => ctx.roundRect(-80, -340, 160, 340, 22), g as unknown as string);
  ctx.strokeStyle = "rgba(190,195,205,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-80, -340, 160, 340, 22);
  ctx.stroke();
  // screen, grille, led
  body(() => ctx.roundRect(-52, -300, 104, 48, 6), "#1c1e22");
  ctx.strokeStyle = "rgba(160,165,175,0.25)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-50, -220 + i * 22);
    ctx.lineTo(50, -220 + i * 22);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 36, -320, 26, 0.9 * led);
  glow(ctx, 36, -320, 6, led);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

/** a hand coming in from the right, fingers closing (u: 0 open → 1 closed) */
function hand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, u: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // the sleeve of a dark coat, out to the edge of the frame
  ctx.fillStyle = "#060607";
  ctx.beginPath();
  ctx.moveTo(150, -110);
  ctx.lineTo(1400, -170);
  ctx.lineTo(1400, 120);
  ctx.lineTo(150, 90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(200,205,215,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, -110);
  ctx.lineTo(1400, -170);
  ctx.stroke();
  // the hand: palm, thumb up, fingers wrapping round the front
  ctx.fillStyle = "#0d0d0f";
  ctx.beginPath();
  ctx.moveTo(160, -95);
  ctx.quadraticCurveTo(40, -110, -10, -70);
  ctx.lineTo(-10, 80);
  ctx.quadraticCurveTo(60, 100, 160, 80);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(40, -112, 70, 22, -0.25, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const fy = -60 + i * 38;
    const reach = lerp(40, 120, u);
    ctx.beginPath();
    ctx.roundRect(-10 - reach, fy, reach + 20, 30, 15);
    ctx.fill();
    ctx.strokeStyle = "rgba(200,205,215,0.18)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

const OFF: Record<number, HTMLCanvasElement> = {};
/** the window, drawn small and scaled up: a cheap, real out-of-focus look */
function softWindow(ctx: CanvasRenderingContext2D, T: number, par: number, bright: number, k: number) {
  const c = (OFF[k] ??= Object.assign(document.createElement("canvas"), { width: Math.round(W * k), height: Math.round(H * k) }));
  const g = c.getContext("2d")!;
  g.setTransform(k, 0, 0, k, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  windowView(g, T, par, bright);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(c, 0, 0, W, H);
}

export const Penthouse: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const cut = 1.95;
      const fadeIn = rng01(T, 0.05, 0.6);
      const out = 1 - rng01(T, Z.team - 0.3, Z.team);
      ctx.globalAlpha = fadeIn * out;
      if (T < cut) {
        // shot one: the radio on the table, crackling; a hand takes it
        const push = lerp(1.0, 1.06, T / cut);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(push, push);
        ctx.translate(-W / 2, -H / 2);
        softWindow(ctx, T, -T * 0.6, 0.8, 0.18);
        // the table, a dark glossy slab with the window in it
        const tg = ctx.createLinearGradient(0, 760, 0, H);
        tg.addColorStop(0, "#111215");
        tg.addColorStop(1, "#040405");
        ctx.fillStyle = tg;
        ctx.fillRect(0, 760, W, H - 760);
        ctx.fillStyle = "rgba(210,215,225,0.35)";
        ctx.fillRect(0, 758, W, 2);
        ctx.globalCompositeOperation = "lighter";
        ctx.save();
        ctx.translate(W * 0.5, 800);
        ctx.scale(1, 0.12);
        glow(ctx, 0, 0, 700, 0.12);
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
        const grab = 1.32;
        const reach = ease.outCubic(clamp01((T - 0.95) / (grab - 0.95)));
        const lift = ease.inCubic(clamp01((T - (grab + 0.08)) / 0.55));
        const led = T < 0.8 ? 0.3 : 0.5 + 0.5 * Math.sign(Math.sin(T * 26));
        const rx = 900, ry = 760 - lift * 700;
        // its reflection in the table
        if (lift < 0.2) {
          ctx.save();
          ctx.globalAlpha = 0.18 * fadeIn * (1 - lift * 5);
          ctx.translate(0, 2 * 760);
          ctx.scale(1, -1);
          radio(ctx, rx, 760, 1.3, 0);
          ctx.restore();
          ctx.globalAlpha = fadeIn * out;
        }
        radio(ctx, rx, ry, 1.3, led, -lift * 0.15);
        if (reach > 0) hand(ctx, lerp(2150, rx + 104, reach), ry - 230, 1.2, clamp01((T - grab + 0.1) / 0.15));
        ctx.restore();
      } else {
        // shot two: from behind him, the radio at his ear, the city in the window
        const t = T - cut;
        const push = lerp(1.0, 1.07, ease.inOut(t / 1.7));
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(push, push);
        ctx.translate(-W / 2, -H / 2);
        softWindow(ctx, T, t * 0.8, 1.0, 0.4);
        // head and shoulders, back to us, rim-lit by the window
        const sil = (fill: string) => {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.ellipse(800, 560, 150, 185, 0.05, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(700, 700);
          ctx.quadraticCurveTo(560, 760, 330, 820);
          ctx.quadraticCurveTo(200, 860, 160, H + 10);
          ctx.lineTo(1460, H + 10);
          ctx.quadraticCurveTo(1400, 850, 1180, 800);
          ctx.quadraticCurveTo(980, 760, 900, 700);
          ctx.closePath();
          ctx.fill();
          // the arm up to the ear, the radio against it
          ctx.beginPath();
          ctx.moveTo(1150, 820);
          ctx.quadraticCurveTo(1060, 650, 990, 560);
          ctx.lineTo(925, 600);
          ctx.quadraticCurveTo(1000, 720, 1060, 860);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(905, 430, 70, 170, 14);
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(918, 330, 18, 110, 8);
          ctx.fill();
        };
        ctx.save();
        ctx.shadowColor = "rgba(230,236,248,0.8)";
        ctx.shadowBlur = 22;
        sil("rgba(200,206,218,0.85)");
        ctx.restore();
        sil("#040405");
        ctx.globalCompositeOperation = "lighter";
        const led = 0.5 + 0.5 * Math.sign(Math.sin(T * 9));
        glow(ctx, 960, 444, 18, 0.7 * led);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }}
  />
);
