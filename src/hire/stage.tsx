import React from "react";
import { CanvasScene, H, V3, W, clamp01, ease, flare, glow, hash, lerp, mulberry, proj, rng01, rotX, rotY } from "../edw/kit";
import { P2, allPoints, contours, fillContours, morph, toDot, toLine, toRect, traceContours } from "./mark";
import { w } from "./type";

/** key times of the logo choreography (seconds on the film timeline) */
export const K = {
  lineIn: 0.45,
  unfold: w("growing", 0) - 0.08,
  toSlots: w("growing", 7) - 0.15,
  slotsOut: 6.0,
  one: w("sharp", 0),
  breathe: w("sharp", 14) - 0.3,
  calm: w("calm", 0),
  trace: 17.5,
  fill: w("share", 5),
  full: w("yours", 2) + 0.05,
  toGlobe: w("anywhere", 0) - 0.15,
  back: 33.45,
  hit: 34.3,
  up: w("you", 0) - 0.1,
  away: 36.55,
  rectAt: 43.95,
  end: 49,
};
export const CARD = { x: 960 - 550, y: 540 - 310, w: 1100, h: 620 };

const S_MAIN = 600 / 1854;
const MY = 470;

// three slots: each contour belongs to the slot under its centre
const SLOT_X = [-260, 0, 260];
const slotOf = (cx: number) => (cx < -309 ? 0 : cx < 309 ? 1 : 2);

let SPH: V3[] | null = null;
const sphere = (n: number) => {
  if (SPH && SPH.length === n) return SPH;
  SPH = Array.from({ length: n }, (_, i) => {
    const z = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - z * z), a = i * 2.399963;
    return [r * Math.cos(a), z, r * Math.sin(a)] as V3;
  });
  return SPH;
};

/** the whole logo performance on one canvas */
export const MarkStage: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      const C = contours();
      const base = C.map((c) => c.pts);
      ctx.globalCompositeOperation = "source-over";

      // ---------------- A/B: a line of light that unfolds into the mark
      if (T >= K.lineIn && T < K.toSlots + 0.8) {
        const grow = ease.outExpo(clamp01((T - K.lineIn) / 0.8));
        const u = rng01(T, K.unfold, K.unfold + 1.1, (x) => x);
        if (u < 0.4) {
          ctx.globalAlpha = 1 - u / 0.4;
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = "rgba(245,247,252,0.95)";
          ctx.fillRect(960 - 300 * grow, MY - 1, 600 * grow, 2);
          glow(ctx, 960, MY, 160 * grow, 0.25);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }
        if (u > 0) {
          const slots = rng01(T, K.toSlots, K.toSlots + 0.7, (x) => x);
          const polys = C.map((c, ci) => {
            let p = morph(toLine(c, 0), c.pts, u, 0.6, (i) => (c.pts[i][0] + 927) / 1854);
            if (slots > 0) {
              const sx = SLOT_X[slotOf(c.cx)] / S_MAIN, half = 65 / S_MAIN;
              const target = c.hole ? c.pts.map(() => [sx, 0] as P2) : toRect(c, sx - half, -half, 2 * half, 2 * half);
              p = morph(p, target, slots, 0.3);
            }
            void ci;
            return p;
          });
          fillContours(ctx, polys, 960, MY + 70 * clamp01((T - K.toSlots) / 0.7), S_MAIN, "#f2f3f6");
          if (u < 1) {
            ctx.globalCompositeOperation = "lighter";
            flare(ctx, 960 - 300 + 600 * u, MY, Math.sin(Math.PI * u) * 0.6, 700, 40);
            ctx.globalCompositeOperation = "source-over";
          }
        }
      }
      // ---------------- C: the three squares open into empty slots
      if (T >= K.toSlots + 0.7 && T < K.slotsOut + 0.5) {
        const open = ease.outExpo(clamp01((T - (K.toSlots + 0.7)) / 0.4));
        const gone = ease.inCubic(clamp01((T - K.slotsOut) / 0.45));
        for (let i = 0; i < 3; i++) {
          const x = 960 + SLOT_X[i], y = MY + 70, s = 130 * (1 - gone);
          ctx.fillStyle = "#f2f3f6";
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          const inner = (s - 8) * open;
          ctx.fillStyle = "#050506";
          ctx.fillRect(x - inner / 2, y - inner / 2, inner, inner);
          if (open > 0.9 && gone < 0.5 && Math.floor(T * 2.4 + i * 0.7) % 2 === 0) {
            ctx.fillStyle = "#f2f3f6";
            ctx.fillRect(x - 3, y - 26, 6, 52);
          }
          ctx.globalAlpha = open * (1 - gone);
          ctx.font = "500 18px 'Liberation Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(220,224,230,0.8)";
          ctx.fillText(`0${i + 1}  OPEN`, x, y + 110);
          ctx.globalAlpha = 1;
        }
      }
      // ---------------- D/E/F: many dots, then only one; it breathes; nothing pushes it
      if (T >= K.slotsOut && T < 17.4) {
        const fieldIn = rng01(T, K.slotsOut + 0.1, K.slotsOut + 0.6);
        const only = rng01(T, K.one - 0.1, K.one + 0.6);
        const cols = 46, rows = 22;
        for (let j = 0; j < rows; j++)
          for (let i = 0; i < cols; i++) {
            const x = 960 + (i - (cols - 1) / 2) * 40, y = 540 + (j - (rows - 1) / 2) * 40;
            const center = i === 23 && j === 10;
            const a = center ? fieldIn : fieldIn * (1 - only) * (0.25 + 0.35 * hash(i * 31 + j));
            if (a < 0.01) continue;
            ctx.fillStyle = `rgba(235,238,245,${a})`;
            ctx.beginPath();
            ctx.arc(x + Math.sin(T * 0.7 + i) * 2, y + Math.cos(T * 0.6 + j) * 2, center ? 4 + 3 * only : 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        // the one: drifts to the middle of the frame, lit
        const cx = lerp(960 + 0.5 * 40 - 20, 960, only), cy = lerp(540 + (10 - 10.5) * 40, MY, only);
        const out = rng01(T, 16.45, 16.9, ease.inCubic);
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, cx, cy, 60 + 30 * only, 0.5 * only * (1 - out));
        // breathing ring
        const br = rng01(T, K.breathe, K.breathe + 0.6) * (1 - rng01(T, 16.2, 16.6));
        if (br > 0) {
          const ph = Math.sin(((T - K.breathe) / 3.2) * Math.PI * 2 - Math.PI / 2);
          const r = 230 + 46 * ph;
          ctx.strokeStyle = `rgba(240,243,250,${0.55 * br})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(960, 540, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(240,243,250,${0.14 * br})`;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(960, 540, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        // an arrow that comes to push, and stops short
        const ar = rng01(T, w("calm", 4) - 0.1, w("calm", 6) + 0.2, ease.outCubic);
        const arOut = rng01(T, w("calm", 7), w("calm", 7) + 0.5);
        if (ar > 0 && arOut < 1) {
          const tip = lerp(80, 560, ar) - 30 * Math.max(0, ar - 0.85) * 4 * (1 - arOut);
          ctx.strokeStyle = `rgba(240,243,250,${0.8 * (1 - arOut)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(tip - 240, 540);
          ctx.lineTo(tip, 540);
          ctx.moveTo(tip - 18, 528);
          ctx.lineTo(tip, 540);
          ctx.lineTo(tip - 18, 552);
          ctx.stroke();
        }
        if (out > 0 && out < 1) flare(ctx, cx, cy, Math.sin(Math.PI * out) * 0.7, 1100, 60);
        ctx.globalCompositeOperation = "source-over";
      }
      // ---------------- H: traced, then filled from below — what we build is partly yours
      if (T >= K.trace && T < K.toGlobe + 1.2) {
        const tr = rng01(T, K.trace, K.trace + 1.2, (x) => x);
        const lvl = ease.inOut(clamp01((T - K.fill) / (K.full - K.fill)));
        const y0 = MY - 40;
        const toG = rng01(T, K.toGlobe, K.toGlobe + 0.25);
        ctx.globalAlpha = 1 - toG;
        traceContours(ctx, base, 960, y0, S_MAIN, tr, 1.8);
        if (lvl > 0) {
          ctx.save();
          ctx.beginPath();
          for (const p of base) {
            p.forEach(([px, py], i) => (i ? ctx.lineTo(960 + px * S_MAIN, y0 + py * S_MAIN) : ctx.moveTo(960 + px * S_MAIN, y0 + py * S_MAIN)));
            ctx.closePath();
          }
          ctx.clip("nonzero");
          const top = y0 + 343 * S_MAIN - lvl * 700 * S_MAIN;
          ctx.fillStyle = "#f2f3f6";
          ctx.beginPath();
          ctx.moveTo(0, H);
          for (let x = 0; x <= W; x += 20) ctx.lineTo(x, top + Math.sin(x / 40 + T * 4) * 5 * (1 - lvl));
          ctx.lineTo(W, H);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        if (lvl >= 1 && T < K.full + 0.6) {
          ctx.globalCompositeOperation = "lighter";
          flare(ctx, 960, y0, Math.exp(-(T - K.full) / 0.25) * 0.6, 900, 50);
          ctx.globalCompositeOperation = "source-over";
        }
      }
      // ---------------- I/J: the mark bursts into a world of points, and comes back together on the hit
      if (T >= K.toGlobe && T < K.hit + 0.15) {
        const pts = allPoints();
        const sp = sphere(pts.length);
        const go = rng01(T, K.toGlobe, K.toGlobe + 1.1, (x) => x);
        const back = rng01(T, K.back, K.hit, (x) => x);
        const u = go * (1 - back);
        const ry = (T - K.toGlobe) * 0.35, R = 250;
        const dim = 1 - 0.55 * rng01(T, w("build", 0) - 0.3, w("build", 0) + 0.3) * (1 - back);
        const y0 = MY - 40;
        ctx.fillStyle = "#f2f3f6";
        for (let i = 0; i < pts.length; i++) {
          const q = rotX(rotY(sp[i], ry), 0.25);
          const s = proj(q, R, 4, 960, MY);
          const a = (i / pts.length) * 0.35;
          const e = ease.inOut(clamp01((u * 1.35 - a) / 1));
          const x = lerp(960 + pts[i].p[0] * S_MAIN, s.x, e), y = lerp(y0 + pts[i].p[1] * S_MAIN, s.y, e);
          const depth = q[2] > 0 ? 0.25 : 1;
          ctx.globalAlpha = dim * lerp(1, depth, e);
          ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
        }
        ctx.globalAlpha = 1;
        // routes between cities while it is a world
        if (u > 0.95) {
          ctx.strokeStyle = `rgba(240,243,250,${0.35 * dim})`;
          ctx.lineWidth = 1.2;
          const r = mulberry(4);
          for (let k = 0; k < 9; k++) {
            const a: V3 = sp[Math.floor(r() * sp.length)], b: V3 = sp[Math.floor(r() * sp.length)];
            const st = K.toGlobe + 1.2 + k * 0.35;
            const prog = clamp01((T - st) / 0.8);
            if (prog <= 0) continue;
            ctx.beginPath();
            let pen = false;
            for (let j = 0; j <= 20; j++) {
              const v = (j / 20) * prog;
              const m: V3 = [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)];
              const L = Math.hypot(...m) || 1, h = 1 + 0.18 * Math.sin(Math.PI * v);
              const q = rotX(rotY([(m[0] / L) * h, (m[1] / L) * h, (m[2] / L) * h], ry), 0.25);
              if (q[2] > 0) {
                pen = false;
                continue;
              }
              const s = proj(q, R, 4, 960, MY);
              pen ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
              pen = true;
            }
            ctx.stroke();
          }
        }
      }
      // ---------------- the hit: the mark, solid, then it rises out of the way
      if (T >= K.hit && T < K.away + 0.3) {
        const up = rng01(T, K.up, K.up + 0.6, ease.inOut);
        const away = rng01(T, K.away - 0.25, K.away + 0.2);
        const s = lerp(S_MAIN * 1.15, S_MAIN * 0.62, up);
        const y = lerp(MY - 40, 360, up);
        ctx.globalAlpha = 1 - away;
        fillContours(ctx, base, 960, y, s, "#f2f3f6");
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "lighter";
        flare(ctx, 960, y, Math.exp(-(T - K.hit) / 0.4) * 0.9, 1500, 90);
        ctx.globalCompositeOperation = "source-over";
      }
      // ---------------- K: the form becomes the mark
      if (T >= K.rectAt) {
        const u = rng01(T, K.rectAt, K.rectAt + 1.0, (x) => x);
        const fade = 1 - rng01(T, K.end - 1.0, K.end - 0.1);
        const sc = S_MAIN * 0.92;
        const y = 500;
        const polys = C.map((c) => {
          const rx = (CARD.x - 960) / sc, ry = (CARD.y - y) / sc;
          const rect = c.hole ? c.pts.map(() => [c.cx, c.cy] as P2) : toRect(c, rx, ry, CARD.w / sc, CARD.h / sc);
          return morph(rect, c.pts, u, 0.45, (i) => i / c.pts.length);
        });
        ctx.globalAlpha = fade;
        const g = ctx.createLinearGradient(0, y - 120, 0, y + 120);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(1, "#cfd2d8");
        fillContours(ctx, polys, 960, y, sc, u < 1 ? "#e9ebef" : g);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "lighter";
        const k = T > K.rectAt + 1.0 ? Math.exp(-(T - K.rectAt - 1.0) / 0.45) : 0;
        flare(ctx, 960, y, k * 0.8, 1500, 80);
        // a slow light passing over it while it holds
        const sw = rng01(T, K.rectAt + 1.4, K.rectAt + 3.2, ease.inOut);
        if (sw > 0 && sw < 1) {
          ctx.save();
          ctx.beginPath();
          for (const p of base) {
            p.forEach(([px, py], i) => (i ? ctx.lineTo(960 + px * sc, y + py * sc) : ctx.moveTo(960 + px * sc, y + py * sc)));
            ctx.closePath();
          }
          ctx.clip("nonzero");
          const sx = lerp(600, 1320, sw);
          const gg = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
          gg.addColorStop(0, "rgba(255,255,255,0)");
          gg.addColorStop(0.5, `rgba(255,255,255,${0.7 * fade})`);
          gg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = gg;
          ctx.fillRect(sx - 90, 0, 180, H);
          ctx.restore();
        }
        ctx.globalCompositeOperation = "source-over";
      }
    }}
  />
);

/** a soft, living darkness behind everything: drifting haze and dust */
export const Atmos: React.FC = () => (
  <CanvasScene
    draw={(ctx, T) => {
      ctx.fillStyle = "#050506";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, 960 + Math.sin(T * 0.15) * 200, 520 + Math.cos(T * 0.11) * 60, 900, 0.07);
      for (let i = 0; i < 6; i++) {
        const x = ((i * 430 + T * (12 + i * 4)) % 2400) - 240, y = 760 + Math.sin(i * 1.7 + T * 0.2) * 70, r = 420 + 120 * hash(i);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.35);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, "rgba(140,145,155,0.05)");
        g.addColorStop(1, "rgba(140,145,155,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-r, -r, 2 * r, 2 * r);
        ctx.restore();
      }
      for (let i = 0; i < 70; i++) {
        const x = (hash(i) * W + T * 10 * (hash(i + 3) - 0.5) * 4 + W) % W, y = (hash(i + 1.7) * H - T * 9 * hash(i + 9) + H * 4) % H;
        glow(ctx, x, y, 2 + 3 * hash(i + 5), 0.12 * (0.5 + 0.5 * Math.sin(T * 1.6 + i)));
      }
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);
