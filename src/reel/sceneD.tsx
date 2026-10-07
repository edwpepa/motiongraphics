import React from "react";
import { clamp01, ease, flare, glow, hash, lerp, mulberry, rng01, V3 } from "../edw/kit";
import { Cam, P, beam, city, glass, groundY, planet, terrain, tesseract } from "./cube";
import { RCanvas, RH, RW, starfield, w } from "./rk";
import { drawEarth, ortho } from "./sceneA";

const MONO = "'Liberation Mono', 'DejaVu Sans Mono', monospace";

// ------------------------------------------------------------------ 57.4 – 61.9: twenty times greater than anything we've built
const GY = 1180;
const TOWER = 828, SPIRE = TOWER * 20, SX = 2000;
/** our tallest: a stepped needle (half-widths in metres at heights) */
const TPROF: [number, number][] = [
  [0, 50], [150, 46], [150, 40], [300, 36], [300, 30], [440, 26], [440, 20], [570, 16], [570, 11], [670, 8], [670, 4.5], [760, 2.6], [828, 0.6],
];
type Bld = { x: number; w: number; h: number; win: [number, number][] };
const CITYLINE: Bld[] = (() => {
  const r = mulberry(17);
  const out: Bld[] = [];
  let x = -3200;
  while (x < 5600) {
    const wd = 22 + r() * 60;
    const nearT = Math.abs(x) < 90, nearS = Math.abs(x - SX) < 300;
    if (!nearT && !nearS) {
      const h = (18 + Math.pow(r(), 2.2) * 250) * (1 - Math.min(0.6, Math.abs(x - 600) / 9000));
      const win: [number, number][] = [];
      const n = Math.floor((h * wd) / 1100);
      for (let i = 0; i < n; i++) win.push([r(), r()]);
      out.push({ x, w: wd, h, win });
    }
    x += wd + r() * 14;
  }
  return out;
})();
const CLOUDS = (() => {
  const r = mulberry(23);
  const out: { x: number; h: number; w: number; t: number; a: number }[] = [];
  for (let i = 0; i < 26; i++) out.push({ x: -4000 + r() * 11000, h: 2100 + r() * 1300, w: 900 + r() * 2600, t: 50 + r() * 110, a: 0.5 + 0.5 * r() });
  for (let i = 0; i < 12; i++) out.push({ x: -5000 + r() * 13000, h: 9800 + r() * 1800, w: 2000 + r() * 4000, t: 40 + r() * 70, a: 0.25 + 0.3 * r() });
  return out;
})();
const spireHW = (h: number) => 12 + 250 * Math.pow(1 - h / SPIRE, 2.2);

export const Spire: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const e = ease.inOut(rng01(T, 58.0, 60.0, (x) => x));
      const sc = Math.exp(lerp(Math.log(1.0), Math.log(0.0555), e)) * (1 + 0.012 * (1 - e) * (T - 57.4));
      const xc = 1100 * e;
      const X = (xm: number) => 540 + (xm - xc) * sc;
      const Y = (hm: number) => GY - hm * sc;
      const fade = rng01(T, 57.4, 57.95) * (1 - rng01(T, 61.45, 61.9));
      const H = SPIRE * ease.inOut(rng01(T, 57.75, 59.95, (x) => x));
      // the sky: darker the higher the frame reaches
      const g = ctx.createLinearGradient(0, 0, 0, GY);
      g.addColorStop(0, "#020203");
      g.addColorStop(0.75, "#050608");
      g.addColorStop(1, "#0b0c10");
      ctx.globalAlpha = fade;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      const altTop = GY / sc;
      starfield(ctx, T, 0.55 * clamp01((altTop - 3000) / 9000), 220);
      glow(ctx, 540, GY + 60, 1100, 0.1);
      glow(ctx, X(0), GY, 520 * Math.max(0.3, sc), 0.08);
      const sx = X(SX);
      // its light, before it is even in frame
      glow(ctx, sx, Y(Math.min(H, altTop) * 0.5), 900, 0.09 * clamp01(H / 3000));
      // clouds, lit near the spire
      for (const c of CLOUDS) {
        const cx = X(c.x), cy = Y(c.h), cw = c.w * sc, ch = Math.max(2, c.t * sc);
        if (cy < -200 || cy > GY || cx + cw < -100 || cx - cw > RW + 100) continue;
        const near = Math.exp(-Math.abs(c.x - SX) / 2500) * clamp01((H - c.h) / 800);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(cw / ch, 1);
        glow(ctx, 0, 0, ch * 1.4, (0.05 + 0.13 * near) * c.a, "214,222,240");
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";

      // the spire: a lattice of light
      if (H > 1 && sx > -400 && sx < RW + 400) {
        ctx.globalCompositeOperation = "lighter";
        const ringStep = 400;
        const brace = clamp01((ringStep * sc - 4) / 16);
        const top = Y(H);
        // the spine
        const sg = ctx.createLinearGradient(0, Y(0), 0, top);
        sg.addColorStop(0, "rgba(235,240,255,0.55)");
        sg.addColorStop(1, "rgba(250,252,255,0.95)");
        ctx.strokeStyle = sg;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx, Y(0));
        ctx.lineTo(sx, top);
        ctx.stroke();
        // the rails
        ctx.strokeStyle = "rgba(230,236,252,0.6)";
        ctx.lineWidth = 1.2;
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          for (let h = 0; h <= H; h += Math.max(20, 40 / sc)) {
            const xx = X(SX + sd * spireHW(h)), yy = Y(h);
            h ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.lineTo(X(SX + sd * spireHW(H)), top);
          ctx.stroke();
        }
        // rings and bracing
        ctx.lineWidth = 1;
        for (let h = 0; h + ringStep <= H; h += ringStep) {
          const a = X(SX - spireHW(h)), b = X(SX + spireHW(h));
          const a2 = X(SX - spireHW(h + ringStep)), b2 = X(SX + spireHW(h + ringStep));
          const y0 = Y(h), y1 = Y(h + ringStep);
          if (y1 > RH + 10 || y0 < -10) continue;
          ctx.strokeStyle = `rgba(230,236,252,${0.45})`;
          ctx.beginPath();
          ctx.moveTo(a, y0);
          ctx.lineTo(b, y0);
          ctx.stroke();
          if (brace > 0) {
            ctx.strokeStyle = `rgba(225,232,250,${0.22 * brace})`;
            ctx.beginPath();
            ctx.moveTo(a, y0);
            ctx.lineTo(b2, y1);
            ctx.moveTo(b, y0);
            ctx.lineTo(a2, y1);
            ctx.stroke();
          }
        }
        // energy climbing it
        for (let i = 0; i < 6; i++) {
          const u = (T * 0.32 + i / 6) % 1;
          const hh = u * H;
          glow(ctx, sx, Y(hh), 10, 0.7 * Math.sin(Math.PI * u));
        }
        // the tip
        const done = T > w("greater", 7) ? Math.exp(-(T - w("greater", 7)) / 0.8) : 0;
        glow(ctx, sx, top, 60, 0.35 + 0.3 * done);
        glow(ctx, sx, top, 9, 1);
        if (done > 0.01) flare(ctx, sx, top, 0.5 * done, 700, 34);
        ctx.globalCompositeOperation = "source-over";
      }

      // the city along the ground
      ctx.fillStyle = "#060709";
      for (const b of CITYLINE) {
        const x0 = X(b.x), x1 = X(b.x + b.w);
        if (x1 < -2 || x0 > RW + 2) continue;
        ctx.fillRect(x0, Y(b.h), Math.max(1, x1 - x0), b.h * sc + 1);
      }
      ctx.globalCompositeOperation = "lighter";
      for (const b of CITYLINE) {
        const x0 = X(b.x), wd = b.w * sc, hh = b.h * sc;
        if (x0 + wd < -2 || x0 > RW + 2) continue;
        const near = Math.exp(-Math.abs(b.x - SX) / 1600) * clamp01(H / 2000);
        ctx.fillStyle = `rgba(245,240,226,${0.42 + 0.3 * near})`;
        const s = Math.max(1, Math.min(2.4, 3 * sc));
        const n = sc > 0.3 ? b.win.length : Math.min(2, b.win.length);
        for (let i = 0; i < n; i++) ctx.fillRect(x0 + b.win[i][0] * wd, Y(b.h) + 2 + b.win[i][1] * (hh - 4), s, s);
      }
      ctx.globalCompositeOperation = "source-over";
      // our tallest
      const tx = X(0);
      ctx.beginPath();
      TPROF.forEach(([h, hw], i) => (i ? ctx.lineTo(tx + hw * sc, Y(h)) : ctx.moveTo(tx + hw * sc, Y(h))));
      [...TPROF].reverse().forEach(([h, hw]) => ctx.lineTo(tx - hw * sc, Y(h)));
      ctx.closePath();
      ctx.fillStyle = "#0a0b0e";
      ctx.fill();
      // its right side catches the spire's light
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(222,230,248,${0.3 + 0.35 * clamp01(H / 4000)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      TPROF.forEach(([h, hw], i) => (i ? ctx.lineTo(tx + hw * sc, Y(h)) : ctx.moveTo(tx + hw * sc, Y(h))));
      ctx.stroke();
      ctx.strokeStyle = "rgba(222,230,248,0.1)";
      ctx.beginPath();
      TPROF.forEach(([h, hw], i) => (i ? ctx.lineTo(tx - hw * sc, Y(h)) : ctx.moveTo(tx - hw * sc, Y(h))));
      ctx.stroke();
      // its floors, lit
      if (sc > 0.25) {
        ctx.fillStyle = "rgba(245,240,226,0.5)";
        for (let i = 0; i < 90; i++) {
          const h = hash(i * 3.7) * 640, hw = TPROF.reduce((m, [ph, w]) => (ph <= h ? w : m), 50);
          ctx.fillRect(tx + (hash(i * 5.3) * 2 - 1) * hw * 0.8 * sc, Y(h), 1.6, 1.6);
        }
      }
      // aircraft light
      glow(ctx, tx, Y(TOWER), 10, 0.5 + 0.5 * (Math.sin(T * 3.2) > 0.6 ? 1 : 0.15));
      // ground line
      ctx.fillStyle = "rgba(225,232,248,0.14)";
      ctx.fillRect(0, GY, RW, 1);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, GY + 1, RW, RH - GY);

      // the measure of it
      const lab = rng01(T, w("greater", 7) + 0.15, w("greater", 7) + 0.75) * (1 - rng01(T, 61.3, 61.7));
      if (lab > 0.01) {
        ctx.save();
        ctx.globalAlpha = fade * lab;
        ctx.strokeStyle = "rgba(225,232,248,0.45)";
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1;
        const yT = Y(TOWER), yS = Y(SPIRE);
        ctx.beginPath();
        ctx.moveTo(tx - 70, yT);
        ctx.lineTo(sx - 18, yT);
        ctx.moveTo(tx - 70, yS);
        ctx.lineTo(sx - 26, yS);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(232,238,250,0.85)";
        ctx.font = `500 22px ${MONO}`;
        ctx.textAlign = "right";
        ctx.fillText("828 M", tx - 80, yT + 7);
        ctx.fillText("16 560 M", tx - 80, yS + 7);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 61.6 – 65.3: something of theirs, falling into our world
const E_R = 1500, E_CY = 1050 + E_R, E_LON = 24, E_LAT = -25;
const LAND = (() => {
  const p = ortho(26.1, 44.43, E_LON, E_LAT);
  return { x: 540 + p.x * E_R, y: E_CY - p.y * E_R };
})();
const giftCam = (T: number): Cam => ({ cx: 540, cy: 470, s: 118, yaw: 0.9 + 0.14 * (T - 61.6), pitch: -0.34 });
const cub = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
const giftPath = (u: number) => ({ x: cub(540, 540, 640, LAND.x, u), y: cub(470, 760, 940, LAND.y, u) });
const T_GO = 62.35, T_LAND = w("today", 13);
const OCTA: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

export const Gift: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 61.6, 62.0) * (1 - rng01(T, 64.95, 65.35));
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#020203";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.55, 220, T * 2);
      ctx.globalCompositeOperation = "source-over";
      const land = rng01(T, T_LAND - 0.05, T_LAND + 0.35);
      const spread = ease.outCubic(rng01(T, T_LAND, T_LAND + 1.2, (x) => x));
      drawEarth(ctx, T, { cx: 540, cy: E_CY, R: E_R, lon0: E_LON + (T - 61.6) * 0.25, lat0: E_LAT, a: fade, sun: 0.35, bloom: { x: LAND.x, y: LAND.y, k: land, rad: 50 + 420 * spread } });
      ctx.globalAlpha = 1;
      const cam = giftCam(T);
      glass(ctx, cam, "back", fade);
      terrain(ctx, cam, 0.8 * fade, { rise: 1, light: (n) => 0.3 + 0.7 * Math.max(0, n[1] * 0.9 + n[0] * 0.3) });
      city(ctx, cam, 1, 0.85 * fade, T);
      ctx.globalCompositeOperation = "lighter";
      // the thing itself: it forms in their world, then leaves it
      const form = rng01(T, 61.85, 62.4, ease.outCubic);
      const u = ease.inOut(rng01(T, T_GO, T_LAND, (x) => x));
      const p = giftPath(u);
      const arrived = T >= T_LAND;
      if (form > 0 && !arrived) {
        // trail
        for (let j = 1; j <= 30; j++) {
          const uu = ease.inOut(rng01(T - j * 0.022, T_GO, T_LAND, (x) => x));
          const q0 = giftPath(uu), q1 = giftPath(ease.inOut(rng01(T - (j - 1) * 0.022, T_GO, T_LAND, (x) => x)));
          ctx.strokeStyle = `rgba(238,242,255,${0.55 * (1 - j / 30) * fade})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(q0.x, q0.y);
          ctx.lineTo(q1.x, q1.y);
          ctx.stroke();
        }
        glow(ctx, p.x, p.y, 70 * form, 0.3 * fade);
        const sz = 15 * form;
        const ry = T * 1.6, rx = 0.5 + T * 0.7;
        const pts = OCTA.map((v) => {
          let q: V3 = [v[0] * sz, v[1] * sz * 1.35, v[2] * sz];
          q = [q[0] * Math.cos(ry) + q[2] * Math.sin(ry), q[1], -q[0] * Math.sin(ry) + q[2] * Math.cos(ry)];
          q = [q[0], q[1] * Math.cos(rx) - q[2] * Math.sin(rx), q[1] * Math.sin(rx) + q[2] * Math.cos(rx)];
          return { x: p.x + q[0], y: p.y - q[1] };
        });
        ctx.strokeStyle = `rgba(250,252,255,${0.9 * fade})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++)
          for (let j = i + 1; j < 6; j++) {
            if ((i >> 1) === (j >> 1)) continue;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
          }
        ctx.stroke();
        glow(ctx, p.x, p.y, 10, fade);
      }
      // it passes through the floor of the cube: a ripple in the glass
      const yFloor = P(cam, [0, -1, 0]).y;
      let tCross = T_GO;
      for (let k = 0; k <= 60; k++) {
        const tt = lerp(T_GO, T_LAND, k / 60);
        if (giftPath(ease.inOut(rng01(tt, T_GO, T_LAND, (x) => x))).y >= yFloor) {
          tCross = tt;
          break;
        }
      }
      const rp = rng01(T, tCross, tCross + 0.9, (x) => x);
      if (rp > 0 && rp < 1) {
        for (const [d, al] of [[0, 1], [0.12, 0.5]] as const) {
          const rr = 0.95 * ease.outCubic(clamp01(rp - d));
          ctx.strokeStyle = `rgba(236,242,255,${0.6 * al * (1 - rp) * fade})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const th = (i / 48) * Math.PI * 2;
            const q = P(cam, [Math.cos(th) * rr, -1, Math.sin(th) * rr]);
            i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
          }
          ctx.stroke();
        }
      }
      // touchdown: "our own world, today"
      if (arrived) {
        const k = T - T_LAND;
        glow(ctx, LAND.x, LAND.y, 90, 0.7 * Math.exp(-k / 0.6) * fade);
        glow(ctx, LAND.x, LAND.y, 14, (0.6 + 0.4 * Math.exp(-k / 0.4)) * fade);
        for (const [d, al] of [[0, 1], [0.25, 0.6]] as const) {
          const q = clamp01((k - d) / 1.3);
          if (q <= 0 || q >= 1) continue;
          const r = 12 + 380 * ease.outCubic(q);
          ctx.strokeStyle = `rgba(236,240,250,${0.5 * al * (1 - q) * fade})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(LAND.x, LAND.y, r, r * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      glass(ctx, cam, "front", fade);
    }}
  />
);

// ------------------------------------------------------------------ 65 – 68.2: the peak of their civilisation, lost in light
const peakCam = (T: number): Cam => ({ cx: 540, cy: 905, s: 182, yaw: 1.6 + 0.1 * (T - 65), pitch: -0.3 });
export const Peak: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 65.0, 65.45) * (1 - rng01(T, 67.85, 68.3));
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.4 * fade, 200, T * 2);
      ctx.globalCompositeOperation = "source-over";
      const cam = peakCam(T);
      glass(ctx, cam, "back", fade);
      const L: V3 = [0.3, 0.92, 0.25];
      terrain(ctx, cam, fade, { rise: 1, light: (n) => 0.3 + 0.7 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) });
      const civ = T > w("peak", 7) ? 0.25 * Math.exp(-(T - w("peak", 7)) / 0.8) : 0;
      city(ctx, cam, 1, fade * (1 + civ), T);
      ctx.globalCompositeOperation = "lighter";
      // a rising column of light, out of the world and up into a haze no one can see into
      const base = P(cam, [0, groundY(0, 0) + 0.02, 0]);
      const topY = 330;
      const climb = rng01(T, 65.15, 66.2, ease.outCubic);
      const hz = rng01(T, 65.5, w("peak", 4) + 0.2) + (T > w("peak", 4) ? 0.6 * Math.exp(-(T - w("peak", 4)) / 0.9) : 0);
      const yTop = lerp(base.y, topY, climb);
      beam(ctx, 540, yTop, base.y, 26, 0.55 * fade * climb);
      for (let i = 0; i < 240; i++) {
        const u = (T * (0.18 + 0.1 * hash(i * 1.3)) + hash(i * 2.9)) % 1;
        const y = lerp(base.y, topY, u);
        if (y < yTop) continue;
        const wd = 60 * Math.pow(1 - u, 1.6) + 3;
        const x = 540 + (hash(i * 5.1) - 0.5) * 2 * wd + Math.sin(T * 1.3 + i) * 2;
        const s = 1.2 + 1.6 * hash(i * 7.7);
        ctx.fillStyle = `rgba(246,248,255,${0.75 * Math.sin(Math.PI * u) * fade})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      // the haze at the top
      for (let k = 0; k < 5; k++) {
        const ox = Math.sin(T * 0.35 + k * 1.7) * 30, oy = Math.cos(T * 0.3 + k * 2.1) * 16;
        glow(ctx, 540 + ox, topY + oy, 150 + k * 22, 0.07 * hz * fade);
      }
      glow(ctx, 540, topY, 46, 0.5 * hz * fade);
      if (T > w("peak", 4)) flare(ctx, 540, topY, 0.42 * Math.exp(-(T - w("peak", 4)) / 0.9) * fade, 820, 40);
      ctx.globalCompositeOperation = "source-over";
      glass(ctx, cam, "front", fade);
    }}
  />
);

// ------------------------------------------------------------------ 67.9 – 72: four futures to bet on
const SLOTS = [
  [318, 590],
  [762, 590],
  [318, 1010],
  [762, 1010],
] as const;
const FAITH_MINI = Array.from({ length: 22 }, (_, i) => [Math.cos((i / 22) * Math.PI * 2) * 0.4, Math.sin((i / 22) * Math.PI * 2) * 0.4] as const);

export const Bet: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const out = 1 - rng01(T, 71.45, 72.05);
      ctx.globalAlpha = rng01(T, 67.9, 68.3);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.35 * out * rng01(T, 67.9, 68.4), 180, T * 2);
      ctx.globalCompositeOperation = "source-over";
      SLOTS.forEach(([x, y], i) => {
        const a = rng01(T, w("comments", 0) - 0.25 + i * 0.16, w("comments", 0) + 0.35 + i * 0.16) * out;
        if (a <= 0.002) return;
        const hl = Math.exp(-(((T - (w("bet", 2) - 0.1 + i * 0.27)) / 0.17) ** 2));
        const A = a * (0.82 + 0.5 * hl);
        const cam: Cam = { cx: x, cy: y, s: 92 * (0.94 + 0.06 * ease.outCubic(a)), yaw: 0.55 + 0.22 * (T - 68) + i * 0.5, pitch: -0.38 };
        if (i !== 2) glass(ctx, cam, "back", A);
        if (i !== 2) terrain(ctx, cam, 0.7 * A, { rise: 1, light: (n) => 0.3 + 0.7 * Math.max(0, n[1]) });
        ctx.globalCompositeOperation = "lighter";
        if (i === 0) {
          // rockets: a flight out of the world to a small planet
          const px = x + 92, py = y - 172;
          ctx.globalCompositeOperation = "source-over";
          planet(ctx, px, py, 21, A, -2.4);
          ctx.globalCompositeOperation = "lighter";
          const s = P(cam, [0, 1, 0]);
          const u = ((T - 68) * 0.45) % 1;
          const cx = (s.x + px) / 2 - 30, cy = Math.min(s.y, py) - 50;
          for (let j = 0; j < 24; j++) {
            const t0 = (j / 24) * u, t1 = ((j + 1) / 24) * u;
            ctx.strokeStyle = `rgba(236,240,255,${A * 0.6 * ((j + 1) / 24) ** 2})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo((1 - t0) ** 2 * s.x + 2 * (1 - t0) * t0 * cx + t0 * t0 * px, (1 - t0) ** 2 * s.y + 2 * (1 - t0) * t0 * cy + t0 * t0 * py);
            ctx.lineTo((1 - t1) ** 2 * s.x + 2 * (1 - t1) * t1 * cx + t1 * t1 * px, (1 - t1) ** 2 * s.y + 2 * (1 - t1) * t1 * cy + t1 * t1 * py);
            ctx.stroke();
          }
          ctx.strokeStyle = `rgba(230,236,255,${0.4 * A})`;
          ctx.beginPath();
          ctx.ellipse(px, py, 38, 9, -0.3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (i === 1) {
          // a god: a shaft of light on a ring of the faithful
          const fl = P(cam, [0, groundY(0, 0) + 0.01, 0]);
          beam(ctx, fl.x, y - 260, fl.y, 18, 0.6 * A);
          glow(ctx, fl.x, fl.y, 30, 0.5 * A);
          for (const [fx, fz] of FAITH_MINI) {
            const p = P(cam, [fx, groundY(fx, fz) + 0.03, fz]);
            ctx.fillStyle = `rgba(255,255,255,${0.9 * A})`;
            ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
          }
        } else if (i === 2) {
          // inventions we can't picture: the tesseract
          tesseract(ctx, cam, 0.6 * (T - 68) + 0.5, 1, 1, A, 0.3 * (T - 68));
        } else {
          // something twenty times greater: a spire through the lid
          const b = P(cam, [0.05, groundY(0.05, 0.1), 0.1]);
          const tp = P(cam, [0.05, 2.25, 0.1]);
          ctx.strokeStyle = `rgba(245,248,255,${0.85 * A})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(tp.x, tp.y);
          ctx.stroke();
          glow(ctx, tp.x, tp.y, 22, 0.55 * A);
          glow(ctx, tp.x, tp.y, 4, A);
          const u = ((T - 68) * 0.6) % 1;
          glow(ctx, lerp(b.x, tp.x, u), lerp(b.y, tp.y, u), 7, 0.7 * A * Math.sin(Math.PI * u));
        }
        if (i !== 2) city(ctx, cam, 1, 0.5 * A, T);
        ctx.globalCompositeOperation = "source-over";
        if (i !== 2) glass(ctx, cam, "front", A);
      });
    }}
  />
);
