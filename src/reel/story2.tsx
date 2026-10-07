import React from "react";
import { clamp01, ease, flare, glow, hash, lerp, mulberry, rng01 } from "../edw/kit";
import { Cam, glass, planet, beam, tesseract } from "./cube";
import { figure, icon, Look, mix, P_ARMSUP, P_HOLD, P_KNEEL, P_POINT, P_SCRATCH, P_THINK, Pose, STAND, thought, walk } from "./fig";
import { RCanvas, RH, RW, starfield, w } from "./rk";
import { drawEarth } from "./sceneA";
import { floorLine } from "./story1";

const BG = "#030304";
const GROUND = 1180;
const fill = (ctx: CanvasRenderingContext2D, a = 1) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, RW, RH);
  ctx.globalAlpha = 1;
};
const flip = (ctx: CanvasRenderingContext2D, x: number, f: () => void) => {
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.translate(-x, 0);
  f();
  ctx.restore();
};
const line = (ctx: CanvasRenderingContext2D, pts: [number, number][], close = false) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
  ctx.stroke();
};

// ------------------------------------------------------------------ backgrounds that say where someone grew up
function skyline(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, a: number, seed = 3, tall = 1) {
  const r = mulberry(seed);
  ctx.save();
  ctx.strokeStyle = `rgba(222,229,244,${0.55 * a})`;
  ctx.lineWidth = 1.5;
  let x = x0;
  while (x < x1 - 20) {
    const wd = 34 + r() * 50, hh = (90 + r() * 260) * tall;
    const ww = Math.min(wd, x1 - x);
    ctx.strokeRect(x, y - hh, ww, hh);
    if (r() < 0.35) line(ctx, [[x + ww / 2, y - hh], [x + ww / 2, y - hh - 40 * tall]]);
    ctx.fillStyle = `rgba(245,236,214,${0.55 * a})`;
    for (let k = 0; k < (hh * ww) / 900; k++) ctx.fillRect(x + 5 + r() * (ww - 10), y - hh + 6 + r() * (hh - 12), 3, 3);
    x += ww + 6 + r() * 10;
  }
  ctx.restore();
}
function forest(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, a: number) {
  const r = mulberry(8);
  ctx.save();
  ctx.strokeStyle = `rgba(222,229,244,${0.55 * a})`;
  ctx.lineWidth = 1.5;
  for (let x = x0 + 20; x < x1 - 10; x += 40 + r() * 30) {
    const hh = 140 + r() * 180, wd = hh * 0.32;
    line(ctx, [[x - wd, y - hh * 0.15], [x, y - hh], [x + wd, y - hh * 0.15]], true);
    line(ctx, [[x - wd * 0.75, y - hh * 0.45], [x, y - hh], [x + wd * 0.75, y - hh * 0.45]]);
    line(ctx, [[x, y], [x, y - hh * 0.15]]);
  }
  ctx.restore();
}
function mountains(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, a: number) {
  ctx.save();
  ctx.strokeStyle = `rgba(222,229,244,${0.55 * a})`;
  ctx.lineWidth = 1.5;
  const wd = x1 - x0;
  line(ctx, [[x0, y], [x0 + wd * 0.18, y - 240], [x0 + wd * 0.34, y - 150], [x0 + wd * 0.58, y - 420], [x0 + wd * 0.8, y - 200], [x1, y - 290]]);
  line(ctx, [[x0 + wd * 0.5, y - 330], [x0 + wd * 0.58, y - 420], [x0 + wd * 0.66, y - 340]]);
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x0 + wd * 0.75, y - 520, 40, 0.5 * a);
  ctx.restore();
}

// ------------------------------------------------------------------ 28.85 – 32.8: its own ideas; raised in different places, it becomes different
const ENVS: { look: Look; pose: Pose; k: string; env: (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, a: number) => void }[] = [
  { look: { tie: true, bag: true }, pose: STAND, k: "gear", env: (c, a0, a1, y, a) => skyline(c, a0, a1, y, a, 5) },
  { look: { hat: true, pack: true }, pose: { ...STAND, ra: 0.5, rf: 1.9 }, k: "leaf", env: forest },
  { look: { hair: 2, cane: true }, pose: { ...STAND, la: -0.3, lf: -0.3 }, k: "star", env: mountains },
];
export const Ideas: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fin = rng01(T, 28.85, 29.05);
      const out = 1 - rng01(T, 32.45, 32.8);
      fill(ctx, fin * out);
      ctx.globalAlpha = out;
      const into = 1 - rng01(T, 28.85, 29.35);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, RW / 2, 560, lerp(60, 220, into), 0.7 * into);
      ctx.restore();
      const split = ease.inOut(rng01(T, w("matures", 4), w("matures", 5) + 0.6, (t) => t));
      const shrink = ease.inOut(rng01(T, w("matures", 0), w("matures", 4), (t) => t));
      const H = lerp(760, 430, shrink), y = lerp(1250, GROUND, shrink);
      floorLine(ctx, y, 1);
      // the places
      if (split > 0) {
        for (let i = 0; i < 3; i++) {
          const x0 = i * 360 + 12, x1 = x0 + 336;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0, 0, (x1 - x0) * split + 1, RH);
          ctx.clip();
          ENVS[i].env(ctx, x0, x1, GROUND, split);
          ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = `rgba(222,229,244,${0.2 * split})`;
        for (const x of [360, 720]) line(ctx, [[x, 380], [x, GROUND + 60]]);
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        if (i !== 1 && split <= 0) continue;
        const x = lerp(RW / 2, 180 + i * 360, split);
        const e = ENVS[i];
        const look = split > 0.5 || i === 1 ? (split > 0.5 ? e.look : {}) : {};
        const pose = split > 0 ? mix(STAND, e.pose, split) : mix(STAND, P_THINK, rng01(T, 29.0, 29.5) * (1 - shrink));
        const f = figure(ctx, x, y, H, pose, look, { ai: true, a: i === 1 ? 1 : split });
        if (!f) continue;
        const [hx, hy] = f.hd;
        if (split <= 0) {
          // "forms its own ideas"
          const ta = rng01(T, w("forms", 0) + 0.25, w("forms", 0) + 0.6);
          const ks = ["bulb", "gear", "rocket", "atom"];
          const k = ks[Math.min(3, Math.floor(Math.max(0, T - w("forms", 3)) / 0.32))];
          thought(ctx, hx + 40, hy - 70, hx + 200, hy - 270, lerp(110, 70, shrink), ta, k);
        } else {
          thought(ctx, hx + 18, hy - 30, hx + 70, hy - 150, 52, split, e.k);
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 32.5 – 36.2: no two of them think alike
const ALIKE = ["gear", "music", "heart", "atom", "star", "rocket", "book", "brush", "leaf", "question", "infinity", "planet"];
export const Alike: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fin = rng01(T, 32.5, 32.85);
      fill(ctx, fin);
      ctx.globalAlpha = 1;
      const col = ease.inCubic(rng01(T, 35.15, 35.9, (t) => t));
      ALIKE.forEach((k, i) => {
        const c = i % 3, r = Math.floor(i / 3);
        const cx = 200 + c * 340, cy = 380 + r * 230;
        const t0 = w("alike", 1) - 0.25 + 0.07 * i;
        const a = rng01(T, t0, t0 + 0.35) * (1 - col * 0.6);
        if (a <= 0) return;
        const x = lerp(cx, RW / 2, col), y = lerp(cy, 700, col);
        const s = 1 - col;
        const ripple = 0.4 * Math.exp(-(((T - w("alike", 7) - 0.06 * (c + r)) / 0.15) ** 2));
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        // a bust: head and shoulders, an AI (outline, a light inside)
        ctx.globalAlpha = a;
        ctx.strokeStyle = "rgb(236,240,250)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-40, 20, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-110, 130);
        ctx.quadraticCurveTo(-110, 62, -40, 60);
        ctx.quadraticCurveTo(30, 62, 30, 130);
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, -40, 20, 46, (0.45 + ripple) * a);
        glow(ctx, -40, 20, 8, a);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        const think = 1 + 0.08 * Math.sin(T * 6 + i) * rng01(T, w("alike", 5) - 0.1, w("alike", 5) + 0.3);
        thought(ctx, -20, -10, 70, -60, 50 * think, a, k);
        ctx.restore();
      });
      const pt = rng01(T, 35.45, 35.95);
      if (pt > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const br = 1 + 0.12 * Math.sin((T - 35.9) * 4);
        glow(ctx, RW / 2, 700, 70 * br, 0.4 * pt);
        glow(ctx, RW / 2, 700, 10 * br, pt);
        ctx.restore();
      }
    }}
  />
);

// ------------------------------------------------------------------ 35.9 – 42.2: their clock races, ours doesn't
const T_SUN = 37.35, T_ACC = 38.85, W0 = 1.4, K = 1.85, WMAX = 120;
const T_CAP = T_ACC + Math.log(WMAX / W0) / K;
const phi = (t: number) => {
  if (t <= T_SUN) return 0;
  if (t <= T_ACC) return W0 * (t - T_SUN);
  const a = W0 * (T_ACC - T_SUN);
  if (t <= T_CAP) return a + (W0 / K) * (Math.exp(K * (t - T_ACC)) - 1);
  return a + (W0 / K) * (Math.exp(K * (T_CAP - T_ACC)) - 1) + WMAX * (t - T_CAP);
};
const omega = (t: number) => (t <= T_SUN ? 0 : t <= T_ACC ? W0 : Math.min(WMAX, W0 * Math.exp(K * (t - T_ACC))));

function clock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, minute: number, hour: number, blur = 0, sec?: number) {
  if (a <= 0.003 || r < 2) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = "rgb(236,240,250)";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.5, r * 0.022);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const t = (i / 60) * Math.PI * 2, l = i % 5 ? 0.04 : 0.11;
    ctx.lineWidth = i % 5 ? Math.max(1, r * 0.008) : Math.max(1.5, r * 0.02);
    line(ctx, [[x + Math.sin(t) * r * 0.93, y - Math.cos(t) * r * 0.93], [x + Math.sin(t) * r * (0.93 - l), y - Math.cos(t) * r * (0.93 - l)]]);
  }
  if (blur > 0) {
    // the minute hand going round too fast to see: a disc of light
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const sweep = Math.min(Math.PI * 2, blur);
    ctx.fillStyle = `rgba(236,240,250,${0.22 * Math.min(1, blur / 6)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r * 0.8, minute - Math.PI / 2 - sweep, minute - Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.lineWidth = Math.max(2, r * 0.045);
  line(ctx, [[x, y], [x + Math.sin(hour) * r * 0.5, y - Math.cos(hour) * r * 0.5]]);
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  line(ctx, [[x, y], [x + Math.sin(minute) * r * 0.8, y - Math.cos(minute) * r * 0.8]]);
  if (sec !== undefined) {
    ctx.lineWidth = Math.max(1, r * 0.012);
    line(ctx, [[x - Math.sin(sec) * r * 0.15, y + Math.cos(sec) * r * 0.15], [x + Math.sin(sec) * r * 0.86, y - Math.cos(sec) * r * 0.86]]);
  }
  ctx.fillStyle = "rgb(236,240,250)";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, r * 0.035), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export const Clocks: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, 1);
      const out = 1 - rng01(T, 41.95, 42.3);
      ctx.globalAlpha = out;
      const pt = 1 - rng01(T, 36.3, 36.9);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, RW / 2, 700, 70, 0.4 * pt);
      glow(ctx, RW / 2, 700, 10, pt);
      ctx.restore();
      const open = ease.outCubic(rng01(T, w("changes", 0), w("changes", 0) + 0.9, (t) => t));
      const two = ease.inOut(rng01(T, 38.4, 39.2, (t) => t));
      // theirs (top): races with the sun of the simulated world
      const cx = lerp(RW / 2, 650, two), cy = lerp(700, 470, two), r = lerp(230, 175, two) * open;
      const m = phi(T), om = omega(T);
      const start = T > w("changes", 5) ? Math.exp(-(T - w("changes", 5)) / 0.5) : 0;
      clock(ctx, cx, cy, r, open, m, m / 12, om > 6 ? om * 0.12 : 0);
      if (start > 0.01) flare(ctx, cx, cy, 0.4 * start, 700, 40);
      if (two > 0) {
        ctx.globalAlpha = out * two;
        const cam: Cam = { cx: lerp(RW / 2, 220, two), cy: 470, s: 70, yaw: 0.6 + 0.3 * T, pitch: -0.4 };
        glass(ctx, cam, "back", 1);
        glass(ctx, cam, "front", 1);
        // ours (bottom): an ordinary clock, the second hand ticking
        drawEarth(ctx, T, { cx: 220, cy: 1010, R: 95, lon0: 20 + T * 3, lat0: 20, a: two * out });
        ctx.globalAlpha = out * two;
        const sec = (Math.floor(T) / 60) * Math.PI * 2;
        const ours = 1 + 0.4 * Math.exp(-(((T - w("faster", 7) - 0.2) / 0.25) ** 2));
        clock(ctx, 650, 1010, 175, Math.min(1, ours), 1.1, 5.2, 0, sec);
        if (ours > 1.01) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, 650, 1010, 240, 0.12 * (ours - 1) * 2.5);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 42.0 – 46.4: what took us thousands of years, in a matter of days
function hist(ctx: CanvasRenderingContext2D, k: number, x: number, y: number, s: number, a: number) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.scale(s / 100, s / 100);
  ctx.strokeStyle = "rgb(236,240,250)";
  ctx.lineWidth = 3;
  ctx.lineJoin = ctx.lineCap = "round";
  switch (k) {
    case 0: // a hut and a fire
      line(ctx, [[-45, 40], [-45, 0], [-5, -40], [35, 0], [35, 40]]);
      line(ctx, [[-15, 40], [-15, 15], [5, 15], [5, 40]]);
      line(ctx, [[45, 40], [52, 20], [58, 32], [64, 12], [70, 40]]);
      break;
    case 1: // pyramids
      line(ctx, [[-55, 40], [-10, -40], [35, 40]], true);
      line(ctx, [[20, 40], [45, -5], [70, 40]]);
      line(ctx, [[-10, -40], [0, 40]]);
      break;
    case 2: // a temple
      line(ctx, [[-55, -20], [0, -50], [55, -20]], true);
      for (const cx of [-45, -22, 0, 22, 45]) line(ctx, [[cx, -14], [cx, 34]]);
      line(ctx, [[-60, 40], [60, 40]]);
      break;
    case 3: // a castle
      line(ctx, [[-55, 40], [-55, -30], [-45, -30], [-45, -40], [-35, -40], [-35, -30], [-25, -30], [-25, -10], [25, -10], [25, -30], [35, -30], [35, -40], [45, -40], [45, -30], [55, -30], [55, 40]]);
      line(ctx, [[-12, 40], [-12, 15], [12, 15], [12, 40]]);
      break;
    case 4: // a factory
      line(ctx, [[-60, 40], [-60, 0], [-35, -20], [-35, 0], [-10, -20], [-10, 0], [15, -20], [15, 40]]);
      line(ctx, [[30, 40], [30, -50], [45, -50], [45, 40]]);
      ctx.beginPath();
      ctx.arc(52, -62, 8, 0, Math.PI * 2);
      ctx.arc(66, -76, 11, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, [[-70, 40], [60, 40]]);
      break;
    case 5: // a city of towers
      for (const [bx, bh] of [[-55, 50], [-30, 90], [-5, 60], [20, 110], [45, 70]]) ctx.strokeRect(bx, 40 - bh, 20, bh);
      break;
  }
  ctx.restore();
  if (k === 6) icon(ctx, "rocket", x, y, s * 0.9, a, 3 * (s / 100));
}
export const History: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 42.0, 42.35));
      const out = 1 - rng01(T, 46.0, 46.4);
      ctx.globalAlpha = out * rng01(T, 42.0, 42.35);
      // us: a long road through thousands of years
      const ry = 640;
      ctx.save();
      ctx.strokeStyle = "rgba(236,240,250,0.6)";
      ctx.lineWidth = 2;
      const draw = ease.inOut(rng01(T, 42.05, 42.7, (t) => t));
      line(ctx, [[80, ry], [80 + 920 * draw, ry]]);
      for (let i = 0; i <= 40; i++) {
        const x = 80 + i * 23;
        if (x > 80 + 920 * draw) break;
        line(ctx, [[x, ry], [x, ry + (i % 5 ? 8 : 18)]]);
      }
      ctx.restore();
      drawEarth(ctx, T, { cx: 80, cy: ry + 2, R: 0.1, lon0: 0, lat0: 0, a: 0 });
      for (let k = 0; k < 7; k++) {
        const t0 = w("days", 1) + k * 0.24;
        const a = rng01(T, t0, t0 + 0.3);
        hist(ctx, k, 140 + k * 135, ry - 80, 100, a * out);
      }
      // a slow marker walking the road
      const mk = 80 + 920 * clamp01((T - 42.2) / 3.6);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, mk, ry, 18, 0.8 * out);
      ctx.restore();
      // them: the same story inside their world, while three days go by
      const them = rng01(T, w("days", 7) - 0.25, w("days", 7) + 0.25);
      if (them > 0) {
        ctx.globalAlpha = out * them;
        const cam: Cam = { cx: RW / 2, cy: 1000, s: 140, yaw: 0.7 + 0.2 * T, pitch: -0.35 };
        glass(ctx, cam, "back", 1);
        const step = clamp01((T - w("days", 8)) / (w("days", 13) - w("days", 8)));
        const k = Math.min(6, Math.floor(step * 7));
        if (T > w("days", 8) - 0.05) hist(ctx, k, RW / 2, 1010, 110, 1);
        glass(ctx, cam, "front", 1);
        for (let d = 0; d < 3; d++) {
          const on = rng01(T, w("days", 8) + d * ((w("days", 13) - w("days", 8)) / 2.6), w("days", 8) + d * ((w("days", 13) - w("days", 8)) / 2.6) + 0.2);
          const sx = RW / 2 - 110 + d * 110, sy = 790;
          ctx.save();
          ctx.strokeStyle = `rgba(236,240,250,${0.35 + 0.65 * on})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 16, 0, Math.PI * 2);
          ctx.stroke();
          for (let q = 0; q < 8; q++) {
            const t = (q / 8) * Math.PI * 2;
            line(ctx, [[sx + Math.cos(t) * 24, sy + Math.sin(t) * 24], [sx + Math.cos(t) * 32, sy + Math.sin(t) * 32]]);
          }
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, sx, sy, 50, 0.4 * on);
          ctx.restore();
        }
        if (T > w("days", 13)) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, RW / 2, 1000, 300, 0.2 * Math.exp(-(T - w("days", 13)) / 0.6));
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 46.2 – 51.2: their city, their rockets, other planets
const PLAN = [
  { x: 200, y: 380, r: 58, at: w("rockets", 3), from: 330 },
  { x: 860, y: 300, r: 78, at: w("rockets", 7), from: 600 },
  { x: 890, y: 610, r: 44, at: w("rockets", 9), from: 760 },
];
function futureCity(ctx: CanvasRenderingContext2D, y: number, a: number, T: number, tall = 1, grow = 1) {
  const r = mulberry(31);
  ctx.save();
  let x = -10;
  while (x < RW + 10) {
    const wd = 30 + r() * 46, hh = (90 + Math.pow(r(), 1.8) * 300) * tall * clamp01(grow * 1.6 - Math.abs(x - RW / 2) / 900);
    ctx.fillStyle = "#060709";
    ctx.fillRect(x, y - hh, wd, hh);
    ctx.strokeStyle = `rgba(222,229,244,${0.5 * a})`;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(x, y - hh, wd, hh);
    if (r() < 0.4) {
      line(ctx, [[x + wd / 2, y - hh], [x + wd / 2, y - hh - 50]]);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, x + wd / 2, y - hh - 50, 10, a * (0.5 + 0.5 * Math.sin(T * 3 + x)));
      ctx.restore();
    }
    ctx.fillStyle = `rgba(240,244,255,${0.6 * a})`;
    for (let k = 0; k < (hh * wd) / 700; k++) ctx.fillRect(x + 4 + r() * (wd - 8), y - hh + 6 + r() * (hh - 12), 2.5, 2.5);
    x += wd + 4 + r() * 10;
  }
  ctx.restore();
}
export { futureCity };
function rocket(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number, a: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha *= a;
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 0, s * 0.9, s * 0.9, 0.8);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgb(240,243,250)";
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.32, -s * 0.5, s * 0.22, s * 0.45);
  ctx.lineTo(s * 0.45, s * 0.75);
  ctx.lineTo(s * 0.18, s * 0.6);
  ctx.lineTo(-s * 0.18, s * 0.6);
  ctx.lineTo(-s * 0.45, s * 0.75);
  ctx.lineTo(-s * 0.22, s * 0.45);
  ctx.quadraticCurveTo(-s * 0.32, -s * 0.5, 0, -s);
  ctx.fill();
  ctx.restore();
}
export const Rockets: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 46.2, 46.6));
      const out = 1 - rng01(T, 50.95, 51.35);
      ctx.globalAlpha = out * rng01(T, 46.2, 46.6);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.6, 220, T * 3);
      ctx.globalCompositeOperation = "source-over";
      const lift = ease.inOut(rng01(T, 46.2, 47.8, (t) => t));
      const gy = lerp(1000, 1180, lift);
      const bez = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
      PLAN.forEach((p, i) => {
        const a = rng01(T, 47.2 + i * 0.2, 47.8 + i * 0.2);
        if (a <= 0) return;
        planet(ctx, p.x, p.y, p.r, a, -2.3 + i * 0.4);
        const u = rng01(T, p.at, p.at + 1.15, ease.inOut);
        if (u <= 0) return;
        const sx = p.from, sy = gy - 180;
        const ex = p.x, ey = p.y + p.r * 0.9;
        const cx = (sx + ex) / 2 + (ex > sx ? -60 : 60), cy = Math.min(sy, ey) - 140;
        ctx.save();
        for (let j = 0; j < 40; j++) {
          const t0 = (j / 40) * u, t1 = ((j + 1) / 40) * u;
          ctx.strokeStyle = `rgba(236,240,255,${0.5 * ((j + 1) / 40) ** 1.5 * (u < 1 ? 1 : 0.6)})`;
          ctx.lineWidth = 1 + 4 * ((j + 1) / 40);
          line(ctx, [[bez(sx, cx, ex, t0), bez(sy, cy, ey, t0)], [bez(sx, cx, ex, t1), bez(sy, cy, ey, t1)]]);
        }
        ctx.restore();
        if (u < 1) {
          const hx = bez(sx, cx, ex, u), hy = bez(sy, cy, ey, u);
          const dx = bez(sx, cx, ex, u + 0.01) - hx, dy = bez(sy, cy, ey, u + 0.01) - hy;
          rocket(ctx, hx, hy, Math.atan2(dx, -dy), 40, 1);
        } else {
          // landed: a flag on the planet
          const k = clamp01((T - p.at - 1.15) / 0.5);
          ctx.save();
          ctx.strokeStyle = "rgb(240,243,250)";
          ctx.fillStyle = "rgb(240,243,250)";
          ctx.lineWidth = 2.5;
          const fx = p.x + p.r * 0.2, fy = p.y - p.r * 0.98;
          line(ctx, [[fx, fy], [fx, fy - 46 * k]]);
          ctx.fillRect(fx, fy - 46 * k, 30 * k, 18 * k);
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, ex, ey, 60, 0.5 * Math.exp(-(T - p.at - 1.15) / 0.5));
          ctx.restore();
        }
      });
      futureCity(ctx, gy, 1, T, 0.6);
      floorLine(ctx, gy, 1);
      ctx.fillStyle = BG;
      ctx.fillRect(0, gy + 1, RW, RH - gy);
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 51.0 – 53.4: would they start believing in a god?
export const Faith: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 51.0, 51.4));
      const out = 1 - rng01(T, 53.05, 53.4);
      ctx.globalAlpha = out * rng01(T, 51.0, 51.4);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.35, 160);
      ctx.globalCompositeOperation = "source-over";
      const g = GROUND - 30;
      const lit = (0.5 + 0.5 * rng01(T, w("god", 6) - 0.25, w("god", 6) + 0.2)) * rng01(T, 51.2, 51.9);
      // the altar
      ctx.save();
      ctx.strokeStyle = "rgba(230,236,250,0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(RW / 2 - 110, g - 40, 220, 40);
      ctx.strokeRect(RW / 2 - 70, g - 80, 140, 40);
      ctx.strokeRect(RW / 2 - 35, g - 140, 70, 60);
      ctx.restore();
      beam(ctx, RW / 2, 220, g - 140, 70, lit);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, RW / 2, g - 160, 120, 0.5 * lit);
      glow(ctx, RW / 2, g - 160, 24, lit);
      ctx.restore();
      floorLine(ctx, g, 1);
      // they kneel around it, looking up
      const kneel = ease.inOut(rng01(T, 51.3, 52.0, (t) => t));
      const xs = [110, 250, 385, 695, 830, 970];
      xs.forEach((x, i) => {
        const facesRight = x < RW / 2;
        const h = 300 - Math.abs(x - RW / 2) * 0.08;
        const pose = mix(STAND, P_KNEEL, clamp01(kneel * 1.3 - i * 0.05));
        const d = () => figure(ctx, x, g, h, pose, i % 2 ? { hair: 2 } : {}, { ai: true, core: 0.6 + 0.6 * lit });
        facesRight ? d() : flip(ctx, x, d);
      });
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 53.1 – 57.6: things we haven't even thought of yet
export const Invent: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 53.1, 53.45));
      const out = 1 - rng01(T, 57.2, 57.55);
      ctx.globalAlpha = out * rng01(T, 53.1, 53.45);
      const g = GROUND;
      floorLine(ctx, g, 1);
      // the pedestal
      ctx.save();
      ctx.strokeStyle = "rgba(230,236,250,0.7)";
      ctx.lineWidth = 2;
      line(ctx, [[RW / 2 - 60, g], [RW / 2 - 40, g - 240], [RW / 2 + 40, g - 240], [RW / 2 + 60, g]]);
      line(ctx, [[RW / 2 - 70, g - 240], [RW / 2 + 70, g - 240]]);
      ctx.restore();
      // the thing: a shape from a fourth dimension
      const inner = ease.outCubic(rng01(T, 53.5, 54.2, (t) => t));
      const link = ease.inOut(rng01(T, w("invent", 3) - 0.05, w("invent", 3) + 0.6, (t) => t));
      const th = Math.max(0, T - 54.2) * 0.9;
      const cam: Cam = { cx: RW / 2, cy: g - 470, s: 125 * ease.outCubic(rng01(T, 53.3, 53.9, (t) => t)), yaw: 0.5 + 0.3 * T, pitch: -0.35 };
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, RW / 2, g - 470, 330, 0.12 * inner);
      ctx.restore();
      tesseract(ctx, cam, th, inner, link, 1, Math.max(0, T - 55.5) * 0.5);
      // "that benefit them": light flowing into them
      const ben = rng01(T, w("invent", 6) - 0.1, w("invent", 6) + 0.4) * (1 - rng01(T, 56.6, 57.2));
      const ais = [{ x: 220, p: P_POINT }, { x: 420, p: P_ARMSUP }];
      ais.forEach((A, i) => {
        const pose = mix(STAND, A.p, rng01(T, 53.6 + i * 0.15, 54.1 + i * 0.15));
        figure(ctx, A.x, g, 330, pose, i ? { hair: 2, skirt: true } : {}, { ai: true, core: 0.7 + 0.9 * ben });
        if (ben > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (let k = 0; k < 6; k++) {
            const u = (T * 0.8 + k / 6) % 1;
            glow(ctx, lerp(RW / 2, A.x, u), lerp(g - 470, g - 300, u), 8, ben * Math.sin(Math.PI * u));
          }
          ctx.restore();
        }
      });
      // and us, beside it, scratching our heads
      const us = ease.outCubic(rng01(T, w("invent", 10) - 0.3, w("invent", 10) + 0.4, (t) => t));
      if (us > 0) {
        const x = lerp(1180, 860, us);
        const pose = mix(walk(T * 5), P_SCRATCH, rng01(T, w("invent", 11), w("invent", 11) + 0.4));
        const f = figure(ctx, x, g + 60, 560, pose, { build: 1.1 }, { a: 1 });
        if (f) icon(ctx, "question", f.hd[0] - 10, f.hd[1] - 120, 90, rng01(T, w("invent", 12), w("invent", 12) + 0.3), 4);
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 61.6 – 65.4: something of theirs, in our hands, in our world
const OCTA: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function gem(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number, T: number) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, s * 4, 0.35 * a);
  const ry = T * 1.6, rx = 0.5 + T * 0.7;
  const pts = OCTA.map(([px, py, pz]) => {
    let q = [px * s, py * s * 1.35, pz * s];
    q = [q[0] * Math.cos(ry) + q[2] * Math.sin(ry), q[1], -q[0] * Math.sin(ry) + q[2] * Math.cos(ry)];
    q = [q[0], q[1] * Math.cos(rx) - q[2] * Math.sin(rx), q[1] * Math.sin(rx) + q[2] * Math.cos(rx)];
    return [x + q[0], y - q[1]] as [number, number];
  });
  ctx.strokeStyle = `rgba(250,252,255,${0.95 * a})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++) {
      if (i >> 1 === j >> 1) continue;
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[j][0], pts[j][1]);
    }
  ctx.stroke();
  glow(ctx, x, y, s * 0.8, a);
  ctx.restore();
}
export const Rooftop: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 61.6, 62.0));
      const out = 1 - rng01(T, 64.95, 65.35);
      ctx.globalAlpha = out * rng01(T, 61.6, 62.0);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.5, 200, T * 2);
      ctx.globalCompositeOperation = "source-over";
      // their world, small in our sky
      const cam: Cam = { cx: RW / 2, cy: 330, s: 88, yaw: 0.9 + 0.2 * T, pitch: -0.35 };
      glass(ctx, cam, "back", 1);
      glass(ctx, cam, "front", 1);
      // our city below, and a person on a roof
      const land = w("today", 13);
      const spread = ease.outCubic(rng01(T, land, land + 1.2, (t) => t));
      const cityY = 1240;
      futureCity(ctx, cityY, 0.7, T);
      // lights coming on around the person, outward
      if (spread > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const r = mulberry(77);
        for (let i = 0; i < 260; i++) {
          const x = r() * RW, y = cityY - r() * 420;
          const d = Math.hypot(x - RW / 2, (y - cityY) * 1.4);
          if (d > spread * 900) continue;
          ctx.fillStyle = `rgba(255,248,230,${0.9 * clamp01((spread * 900 - d) / 120)})`;
          ctx.fillRect(x, y, 3, 3);
        }
        ctx.restore();
      }
      // the roof: a ledge across the frame
      ctx.fillStyle = "#050607";
      ctx.fillRect(0, cityY - 60, RW, RH);
      floorLine(ctx, cityY - 60, 1);
      const hold = rng01(T, land - 0.8, land - 0.2);
      const f = figure(ctx, RW / 2, cityY - 60, 470, mix(STAND, P_HOLD, hold), { build: 1.05 }, { a: 1 });
      // the thing travels from their world into the hands
      const form = rng01(T, 61.85, 62.4, ease.outCubic);
      const u = ease.inOut(rng01(T, 62.35, land, (t) => t));
      if (f) {
        const tx = (f.lw[0] + f.rw[0]) / 2, ty = (f.lw[1] + f.rw[1]) / 2 - 26;
        const x = lerp(RW / 2, tx, u) + Math.sin(u * Math.PI) * 60, y = lerp(330, ty, u);
        if (u > 0 && u < 1) {
          ctx.save();
          ctx.strokeStyle = "rgba(240,244,255,0.35)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let j = 0; j <= 20; j++) {
            const uu = Math.max(0, u - j * 0.015);
            const xx = lerp(RW / 2, tx, uu) + Math.sin(uu * Math.PI) * 60, yy = lerp(330, ty, uu);
            j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.stroke();
          ctx.restore();
        }
        gem(ctx, x, y, 16 * form, form, T);
        if (T > land) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, tx, ty, 160, 0.4 * Math.exp(-(T - land) / 0.8));
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 67.9 – 72.1: tell me in the comments
const COMMENTS: { k: string; w1: number; w2: number }[] = [
  { k: "rocket", w1: 0.62, w2: 0.4 },
  { k: "star", w1: 0.5, w2: 0.3 },
  { k: "infinity", w1: 0.7, w2: 0.46 },
  { k: "planet", w1: 0.55, w2: 0.36 },
];
export const Phone: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, rng01(T, 67.9, 68.3));
      const out = 1 - rng01(T, 71.45, 72.05);
      ctx.globalAlpha = out * rng01(T, 67.9, 68.3);
      const up = ease.outCubic(rng01(T, 67.95, 68.6, (t) => t));
      const pw = 500, ph = 900, px = RW / 2 - pw / 2, py = 250 + (1 - up) * 80;
      ctx.save();
      ctx.strokeStyle = "rgba(236,240,250,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 56);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(RW / 2 - 55, py + 18, 110, 26, 13);
      ctx.stroke();
      ctx.fillStyle = "rgba(236,240,250,0.85)";
      // the comments header: a speech icon and a line
      ctx.beginPath();
      ctx.roundRect(px + 40, py + 80, 36, 26, 8);
      ctx.stroke();
      ctx.fillRect(px + 92, py + 88, 130, 8);
      ctx.fillStyle = "rgba(236,240,250,0.25)";
      ctx.fillRect(px + 30, py + 130, pw - 60, 1.5);
      ctx.restore();
      COMMENTS.forEach((c, i) => {
        const t0 = w("comments", 0) + 0.15 + i * 0.32;
        const a = ease.outCubic(rng01(T, t0, t0 + 0.4, (t) => t));
        if (a <= 0) return;
        const hl = Math.exp(-(((T - (w("bet", 2) - 0.1 + i * 0.27)) / 0.17) ** 2));
        const y = py + 170 + i * 150 + (1 - a) * 30;
        ctx.save();
        ctx.globalAlpha *= a;
        if (hl > 0.02) {
          ctx.fillStyle = `rgba(236,240,250,${0.08 * hl})`;
          ctx.beginPath();
          ctx.roundRect(px + 20, y - 18, pw - 40, 130, 18);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(236,240,250,0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px + 66, y + 24, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(236,240,250,0.85)";
        ctx.fillRect(px + 110, y + 4, (pw - 220) * 0.45, 9);
        ctx.fillStyle = "rgba(236,240,250,0.45)";
        ctx.fillRect(px + 110, y + 30, (pw - 220) * c.w1, 7);
        ctx.fillRect(px + 110, y + 50, (pw - 220) * c.w2, 7);
        ctx.restore();
        icon(ctx, c.k, px + pw - 70, y + 30, 50, a, 2.5);
        // a heart that fills when it's picked
        const hx = px + pw - 70, hy = y + 82;
        icon(ctx, "heart", hx, hy, 24, a * (0.5 + 0.5 * hl), 2);
        if (hl > 0.1) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, hx, hy, 30, 0.6 * hl);
          ctx.restore();
        }
      });
      // the box at the bottom, a caret blinking
      ctx.save();
      ctx.strokeStyle = "rgba(236,240,250,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px + 30, py + ph - 110, pw - 60, 64, 32);
      ctx.stroke();
      if (Math.floor(T * 2) % 2 === 0) {
        ctx.fillStyle = "rgba(236,240,250,0.9)";
        ctx.fillRect(px + 64, py + ph - 94, 3, 32);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      void hash;
    }}
  />
);

// ------------------------------------------------------------------ 65.0 – 68.35: the peak of their civilisation
export const Summit: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fin = rng01(T, 65.0, 65.45);
      fill(ctx, fin);
      const out = 1 - rng01(T, 67.85, 68.3);
      ctx.globalAlpha = fin * out;
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.5, 200, T * 2);
      ctx.globalCompositeOperation = "source-over";
      const g = GROUND;
      const grow = ease.outCubic(rng01(T, 65.1, 66.3, (t) => t));
      const top = lerp(g, 330, ease.inOut(rng01(T, 65.3, w("peak", 4), (t) => t)));
      const hz = rng01(T, 65.6, w("peak", 4) + 0.2) + (T > w("peak", 4) ? 0.6 * Math.exp(-(T - w("peak", 4)) / 0.9) : 0);
      // the great tower
      ctx.save();
      ctx.strokeStyle = "rgba(236,240,252,0.85)";
      ctx.lineWidth = 2;
      line(ctx, [[RW / 2 - 70, g], [RW / 2 - 8, top], [RW / 2 + 8, top], [RW / 2 + 70, g]]);
      ctx.strokeStyle = "rgba(236,240,252,0.3)";
      ctx.lineWidth = 1;
      for (let y = g - 60; y > top + 20; y -= 60) {
        const k = (g - y) / (g - top);
        const hw = lerp(70, 8, k);
        line(ctx, [[RW / 2 - hw, y], [RW / 2 + hw, y]]);
      }
      ctx.restore();
      futureCity(ctx, g, 1, T, 1.3, grow);
      floorLine(ctx, g, 1);
      ctx.fillStyle = BG;
      ctx.fillRect(0, g + 1, RW, RH - g);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 5; k++) glow(ctx, RW / 2 + Math.sin(T * 0.35 + k * 1.7) * 30, top + Math.cos(T * 0.3 + k * 2.1) * 16, 150 + k * 22, 0.07 * hz);
      glow(ctx, RW / 2, top, 46, 0.6 * hz);
      ctx.restore();
      if (T > w("peak", 4)) flare(ctx, RW / 2, top, 0.42 * Math.exp(-(T - w("peak", 4)) / 0.9), 820, 40);
      ctx.globalAlpha = 1;
    }}
  />
);
