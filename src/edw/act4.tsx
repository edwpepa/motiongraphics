import React from "react";
import { AbsoluteFill } from "remotion";
import { CanvasScene, FONT, H, Hero, MONO, V3, W, clamp01, ease, flare, glow, hash, lerp, mulberry, proj, rng01, rotX, rotY, w } from "./kit";

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, a: number) => {
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = "rgba(210,214,222,0.9)";
  ctx.textAlign = "left";
  const sp = 6;
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + sp;
  }
  ctx.globalAlpha = 1;
};
const panel = (ctx: CanvasRenderingContext2D, x: number, y: number, w0: number, h0: number, a: number) => {
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(x, y, x, y + h0);
  g.addColorStop(0, "#121316");
  g.addColorStop(1, "#08090a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w0, h0, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const CODE = [
  "import { build } from '@edw/core'",
  "",
  "export async function launch(idea) {",
  "  const plan = await architect(idea)",
  "  const app = compile(plan, {",
  "    platforms: ['ios', 'android', 'web'],",
  "    performance: 'max',",
  "  })",
  "  await test(app, { coverage: 1.0 })",
  "  return deploy(app)",
  "}",
  "",
  "launch(yourIdea) // → shipped",
];

type Trace = { pts: [number, number][]; t0: number };
let TRACES: Trace[] | null = null;
function traces(): Trace[] {
  if (TRACES) return TRACES;
  const r = mulberry(31);
  const out: Trace[] = [];
  const pins = 9;
  for (const side of [0, 1, 2, 3]) {
    for (let i = 0; i < pins; i++) {
      const o = (i - (pins - 1) / 2) * 16;
      let x = 0, y = 0;
      const pts: [number, number][] = [];
      const dir = [[0, -1], [1, 0], [0, 1], [-1, 0]][side];
      if (side === 0) [x, y] = [o, -70];
      if (side === 1) [x, y] = [70, o];
      if (side === 2) [x, y] = [o, 70];
      if (side === 3) [x, y] = [-70, o];
      pts.push([x, y]);
      const l1 = 20 + r() * 50;
      x += dir[0] * l1;
      y += dir[1] * l1;
      pts.push([x, y]);
      const bend = (r() < 0.5 ? -1 : 1) * (20 + r() * 50);
      x += dir[0] * bend * 0 + (dir[1] !== 0 ? bend : 0) + dir[0] * bend * 0.0;
      y += dir[0] !== 0 ? bend : 0;
      x += dir[0] * (20 + r() * 30);
      y += dir[1] * (20 + r() * 30);
      pts.push([x, y]);
      const l2 = 40 + r() * 90;
      x += dir[0] * l2;
      y += dir[1] * l2;
      pts.push([x, y]);
      out.push({ pts, t0: r() * 0.5 });
    }
  }
  TRACES = out;
  return out;
}
const polyLen = (p: [number, number][]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const polyAt = (p: [number, number][], d: number): [number, number] => {
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (d <= l) return [lerp(p[i - 1][0], p[i][0], d / l), lerp(p[i - 1][1], p[i][1], d / l)];
    d -= l;
  }
  return p[p.length - 1];
};
const drawPoly = (ctx: CanvasRenderingContext2D, p: [number, number][], f: number) => {
  const L = polyLen(p) * f;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc + l >= L) {
      const u = (L - acc) / l;
      ctx.lineTo(lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u));
      break;
    }
    ctx.lineTo(p[i][0], p[i][1]);
    acc += l;
  }
  ctx.stroke();
};

/** a chip with traces routing out of it and current running along them */
function chip(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, f: number, T: number, a: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const tr of traces()) {
    const g = clamp01((f - tr.t0) / 0.5);
    if (g <= 0) continue;
    ctx.strokeStyle = "rgba(200,205,215,0.55)";
    ctx.lineWidth = 2.2;
    drawPoly(ctx, tr.pts, g);
    if (g >= 1) {
      const end = tr.pts[tr.pts.length - 1];
      ctx.fillStyle = "rgba(220,224,232,0.8)";
      ctx.beginPath();
      ctx.arc(end[0], end[1], 4, 0, Math.PI * 2);
      ctx.fill();
      const L = polyLen(tr.pts);
      const u = ((T * 0.9 + tr.t0 * 3) % 1) * L;
      const [px, py] = polyAt(tr.pts, u);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, px, py, 12, 0.9 * a);
      ctx.globalCompositeOperation = "source-over";
    }
  }
  const body = clamp01(f * 3);
  ctx.globalAlpha = a * body;
  const g = ctx.createLinearGradient(-70, -70, 70, 70);
  g.addColorStop(0, "#2a2c31");
  g.addColorStop(1, "#0d0e10");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-70, -70, 140, 140, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(-46, -46, 92, 92);
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = "rgba(235,238,245,0.85)";
  ctx.textAlign = "center";
  ctx.fillText("EDW", 0, 8);
  ctx.restore();
}

/** 36.7 – 39.75 s: "Software specialists, hardware specialists," */
export const SplitScene: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const fade = rng01(t, 0, 0.35) * (1 - rng01(T, to - 0.25, to));
      const a1 = rng01(T, w("specialists", 0) - 0.3, w("specialists", 0) + 0.3, ease.outCubic) * fade;
      const a2 = rng01(T, w("specialists", 2) - 0.3, w("specialists", 2) + 0.3, ease.outCubic) * fade;
      const drift = t * 10;
      // software
      const px = 150 - drift + (1 - a1) * -40, py = 250;
      panel(ctx, px, py, 760, 520, a1);
      ctx.globalAlpha = a1;
      for (const [i, c] of [[0, "#4a4c52"], [1, "#4a4c52"], [2, "#4a4c52"]] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(px + 30 + i * 22, py + 28, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = `500 21px ${MONO}`;
      ctx.textAlign = "left";
      const chars = Math.floor(rng01(T, w("specialists", 0), to - 0.3, (x) => x) * CODE.join("").length);
      let left = chars;
      CODE.forEach((line, i) => {
        const n = Math.max(0, Math.min(line.length, left));
        left -= line.length;
        ctx.fillStyle = "rgba(120,124,132,0.6)";
        ctx.fillText(String(i + 1).padStart(2, " "), px + 26, py + 82 + i * 32);
        ctx.fillStyle = line.trim().startsWith("//") || line.includes("//") ? "rgba(150,154,162,0.9)" : i % 3 === 0 ? "#f0f2f6" : "rgba(205,209,217,0.92)";
        ctx.fillText(line.slice(0, n), px + 70, py + 82 + i * 32);
        if (n < line.length && n > 0 && left < 0 && left > -line.length) {
          const cw = ctx.measureText(line.slice(0, n)).width;
          if (Math.floor(T * 3) % 2 === 0) ctx.fillRect(px + 72 + cw, py + 64 + i * 32, 11, 24);
        }
      });
      ctx.globalAlpha = 1;
      label(ctx, "SOFTWARE", px, py - 30, a1);
      // hardware
      const hx = 1010 + drift + (1 - a2) * 40, hy = 250;
      panel(ctx, hx, hy, 760, 520, a2);
      const f = rng01(T, w("specialists", 2) - 0.1, w("specialists", 2) + 1.4, (x) => x);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(hx, hy, 760, 520, 18);
      ctx.clip();
      ctx.globalAlpha = a2 * 0.25;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let gx = hx + 20; gx < hx + 760; gx += 30) for (let gy = hy + 20; gy < hy + 520; gy += 30) ctx.fillRect(gx, gy, 1.5, 1.5);
      ctx.globalAlpha = 1;
      chip(ctx, hx + 380, hy + 260, 1.15, f, T, a2);
      ctx.restore();
      label(ctx, "HARDWARE", hx, hy - 30, a2);
    }}
  />
);

/** 39.75 – 42.45 s: "technicians who can make almost anything work," — the signal locks */
export const ScopeScene: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const fade = rng01(t, 0, 0.3) * (1 - rng01(T, to - 0.25, to));
      const lock = rng01(T, w("technicians", 5) - 0.2, w("technicians", 6) + 0.2, ease.inOut);
      const zoom = lerp(1, 1.06, t / 2.7);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      const x0 = 300, y0 = 300, sw = 1320, sh = 470;
      panel(ctx, x0 - 20, y0 - 20, sw + 40, sh + 40, fade);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + (i * sw) / 10, y0);
        ctx.lineTo(x0 + (i * sw) / 10, y0 + sh);
        ctx.stroke();
      }
      for (let j = 0; j <= 6; j++) {
        ctx.beginPath();
        ctx.moveTo(x0, y0 + (j * sh) / 6);
        ctx.lineTo(x0 + sw, y0 + (j * sh) / 6);
        ctx.stroke();
      }
      // the trace: noise → a clean, strong wave
      ctx.globalCompositeOperation = "lighter";
      for (const [lw, al] of [[10, 0.08], [4, 0.25], [2, 0.95]] as const) {
        ctx.strokeStyle = `rgba(240,243,250,${al})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i <= 400; i++) {
          const u = i / 400;
          const x = x0 + u * sw;
          const ph = u * 14 - T * 6;
          const clean = Math.sin(ph) * 0.85 + Math.sin(ph * 3) * 0.08;
          const n = (hash(i * 0.37 + Math.floor(T * 30) * 13.1) - 0.5) * 0.5 + Math.sin(u * 47 + T * 9) * 0.15;
          const dead = 0.04 * Math.sin(u * 90 + T * 40);
          const v = lerp(lerp(dead, n, rng01(t, 0.1, 0.8)), clean, lock);
          const y = y0 + sh / 2 - v * sh * 0.36;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.font = `500 20px ${MONO}`;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(200,204,212,0.8)";
      ctx.fillText(`CH1  ${lock > 0.5 ? "50.00 Hz" : (40 + hash(Math.floor(T * 15)) * 30).toFixed(2) + " Hz"}`, x0 + 20, y0 + 36);
      ctx.textAlign = "right";
      ctx.fillStyle = lock > 0.5 ? "#f4f5f8" : "rgba(160,164,172,0.8)";
      ctx.fillText(lock > 0.5 ? "● SIGNAL LOCKED" : "○ SEARCHING", x0 + sw - 20, y0 + 36);
      ctx.restore();
      label(ctx, "TECHNICIANS", 280, 262, fade * 0.9);
      ctx.globalAlpha = 1;
      if (lock > 0 && lock < 1) {
        ctx.globalCompositeOperation = "lighter";
        flare(ctx, W / 2, H / 2, Math.sin(Math.PI * lock) * 0.5, 1000, 40);
        ctx.globalCompositeOperation = "source-over";
      }
    }}
  />
);

/** 42.45 – 46.6 s: "all of them with ideas that most companies wouldn't even dare to try."
 *  A floor of identical tiles in the dark. One lights up (an idea); a ripple runs out from it and every other tile
 *  sinks into the black (most companies); the lit one rises out of the floor as a cube and the camera follows it up. */
export const DareScene: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const textAt = w("dare", 10) - 0.12;
  return (
    <AbsoluteFill>
      <CanvasScene
        draw={(ctx, T) => {
          const t = T - from;
          const fade = rng01(t, 0, 0.3) * (1 - rng01(T, to - 0.25, to));
          const idea = rng01(T, w("dare", 4) - 0.1, w("dare", 4) + 0.35, ease.outCubic);
          const rip0 = w("dare", 6) - 0.15;
          const rise = rng01(T, w("dare", 8) - 0.35, w("dare", 12) + 0.15, ease.inOut);
          const tryAt = w("dare", 12);
          const COLS = 21, ROWS = 13, SP = 1.0, TS = 0.86;
          const yaw = -0.5 + 0.11 * t + 0.25 * rise;
          const pitch = lerp(-0.68, -0.22, rise);
          const dist = 6.5;
          const zoomS = lerp(105, 120, ease.inOut(t / 4)) * lerp(1, 1.9, rise);
          const ty = 1.7 * rise;
          const cyS = H / 2 + lerp(40, -40, rise);
          const cam = (p: V3) => rotX(rotY([p[0], p[1] - ty, p[2]], yaw), pitch);
          const P = (p: V3) => proj(cam(p), zoomS, dist, W / 2, cyS);
          ctx.globalAlpha = fade;
          // the floor
          type Q = { pts: { x: number; y: number }[]; z: number; c: number; e: number };
          const quads: Q[] = [];
          for (let j = 0; j < ROWS; j++)
            for (let i = 0; i < COLS; i++) {
              const x = (i - (COLS - 1) / 2) * SP, z = (j - (ROWS - 1) / 2) * SP;
              if (i === (COLS - 1) / 2 && j === (ROWS - 1) / 2) continue;
              const d = Math.hypot(x, z);
              const appear = ease.outCubic((t - 0.05 - d * 0.05) / 0.6);
              if (appear <= 0) continue;
              const front = (T - rip0) * 7.5;
              const hitW = Math.exp(-((d - front) ** 2) / 0.5) * (T > rip0 ? 1 : 0);
              const sink = ease.inCubic(clamp01((T - rip0 - d / 7.5) / 0.9));
              const y = lerp(-0.8, 0, appear) + 0.025 * Math.sin(T * 2.2 + i * 0.6 + j * 0.4) + 0.22 * hitW - 1.6 * sink;
              const h = TS / 2;
              const corners = [[x - h, y, z - h], [x + h, y, z - h], [x + h, y, z + h], [x - h, y, z + h]] as V3[];
              if (corners.some((cp) => cam(cp)[2] < -dist + 0.8)) continue;
              const pts = corners.map(P);
              const lit = 120 * Math.exp(-d / 2.0) * idea * (1 - 0.6 * rise);
              const c = (22 + lit + 55 * hitW) * (1 - 0.85 * sink) * appear;
              quads.push({ pts, z: cam([x, y, z])[2], c, e: (0.3 + 0.7 * hitW) * (1 - sink) * appear });
            }
          quads.sort((a, b) => b.z - a.z);
          ctx.lineWidth = 1.1;
          for (const q of quads) {
            ctx.fillStyle = `rgb(${q.c},${q.c + 1},${q.c + 4})`;
            ctx.strokeStyle = `rgba(190,195,205,${0.3 * q.e})`;
            ctx.beginPath();
            q.pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          // the shock ring on the floor as it breaks free
          const ring = rng01(T, rip0, rip0 + 1.6, ease.outCubic);
          if (ring > 0 && ring < 1) {
            ctx.strokeStyle = `rgba(240,243,250,${(1 - ring) * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let k = 0; k <= 64; k++) {
              const a = (k / 64) * Math.PI * 2;
              const p = P([Math.cos(a) * ring * 12, 0.02, Math.sin(a) * ring * 12]);
              k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            }
            ctx.stroke();
          }
          // the one that dares: a lit tile that becomes a cube and rises
          const cy = 0.03 + 2.2 * rise;
          const hh = lerp(0.03, TS / 2, ease.outCubic(rise * 1.6));
          const s = TS / 2 * lerp(1, 0.9, rise);
          const spin = rise * Math.PI * 0.9 + Math.max(0, T - tryAt) * 0.6;
          const tilt = rise * 0.45;
          const V: V3[] = [];
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) V.push(rotX(rotY([sx * s, sy * hh, sz * s], spin), tilt));
          const Vw = V.map((v) => [v[0], v[1] + cy, v[2]] as V3);
          const F = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
          const ctr = P([0, cy, 0]);
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, ctr.x, ctr.y, 3.2 * zoomS * ctr.k, 0.22 * idea);
          ctx.globalCompositeOperation = "source-over";
          const faces = F.map((f) => {
            const c = f.map((k) => cam(Vw[k]));
            const ux = c[1][0] - c[0][0], uy = c[1][1] - c[0][1], uz = c[1][2] - c[0][2];
            const vx = c[3][0] - c[0][0], vy = c[3][1] - c[0][1], vz = c[3][2] - c[0][2];
            const n: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
            const m = Math.hypot(...n) || 1;
            const z = (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4;
            const cc = cam([0, cy, 0]);
            const fcx = (c[0][0] + c[2][0]) / 2, fcy = (c[0][1] + c[2][1]) / 2, fcz = (c[0][2] + c[2][2]) / 2;
            const vis = (fcx - cc[0]) * fcx + (fcy - cc[1]) * fcy + (fcz - cc[2]) * (fcz + dist) < 0;
            return { f, n: [n[0] / m, n[1] / m, n[2] / m] as V3, z, vis };
          }).filter((o) => o.vis);
          for (const fc of faces) {
            const lit = clamp01(0.55 + 0.45 * Math.abs(-0.4 * fc.n[0] + 0.7 * fc.n[1] - 0.6 * fc.n[2]));
            const v = Math.round(lerp(40, 255, idea) * lit);
            const pts = fc.f.map((k) => P(Vw[k]));
            ctx.fillStyle = `rgb(${v},${v},${Math.min(255, v + 4)})`;
            ctx.strokeStyle = `rgba(255,255,255,${0.9 * idea})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.globalCompositeOperation = "lighter";
          if (idea > 0 && idea < 1) flare(ctx, ctr.x, ctr.y, Math.sin(Math.PI * idea) * 0.8, 900, 50);
          const hit = rng01(T, tryAt, tryAt + 0.7, ease.outCubic);
          if (hit > 0 && hit < 1) flare(ctx, ctr.x, ctr.y, (1 - hit) * 0.9, 1300, 90);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }}
      />
      <Hero text="DARE TO TRY." at={textAt} out={to - 0.4} size={120} y={H / 2 + 250} tracking={0.24} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ minds in one room: a network that organises itself into a structure
let NODES: { p: V3; q: V3; at: number }[] | null = null;
function nodes(from: number, until: number) {
  if (NODES) return NODES;
  const r = mulberry(41);
  const out = [];
  for (let i = 0; i < 27; i++) {
    const q: V3 = [((i % 3) - 1) * 0.55, (Math.floor(i / 3) % 3 - 1) * 0.55, (Math.floor(i / 9) - 1) * 0.55];
    out.push({ p: [(r() - 0.5) * 2.4, (r() - 0.5) * 1.3, (r() - 0.5) * 1.6] as V3, q, at: from + (i / 27) * (until - from) + r() * 0.1 });
  }
  NODES = out;
  return out;
}

/** 46.6 – 51.25 s: "When you put minds like that in the same room, there's very little they can't build," */
export const NetworkScene: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const fade = rng01(t, 0, 0.35) * (1 - rng01(T, to - 0.25, to));
      const N = nodes(w("room", 0), w("room", 9));
      const org = rng01(T, w("build", 4) - 0.2, w("build", 5) + 0.4, ease.inOut);
      const ry = -0.5 + t * 0.22, rx = 0.18;
      const sc = 330;
      const P = (p: V3) => proj(rotX(rotY(p, ry), rx), sc, 4, W / 2, H / 2 - 20);
      ctx.globalAlpha = fade;
      // the room: a wireframe box around them
      const room = rng01(T, w("room", 6) - 0.2, w("room", 9) + 0.2, ease.outCubic);
      const B = 1.05;
      const corners: V3[] = [];
      for (const x of [-B * 1.2, B * 1.2]) for (const y of [-B * 0.7, B * 0.7]) for (const z of [-B, B]) corners.push([x, y, z]);
      ctx.strokeStyle = `rgba(200,205,215,${0.25 * room})`;
      ctx.lineWidth = 1.2;
      for (let a = 0; a < 8; a++)
        for (let b = a + 1; b < 8; b++) {
          const d = (a ^ b);
          if (d !== 1 && d !== 2 && d !== 4) continue;
          const A = P(corners[a]), Bp = P(corners[b]);
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(lerp(A.x, Bp.x, room), lerp(A.y, Bp.y, room));
          ctx.stroke();
        }
      const pos = N.map((n) => {
        const wob: V3 = [Math.sin(T * 0.8 + n.at * 3) * 0.05, Math.cos(T * 0.7 + n.at * 5) * 0.05, 0];
        const p: V3 = [lerp(n.p[0], n.q[0], org) + wob[0] * (1 - org), lerp(n.p[1], n.q[1], org) + wob[1] * (1 - org), lerp(n.p[2], n.q[2], org)];
        return P(p);
      });
      const vis = N.map((n) => clamp01((T - n.at) / 0.3));
      // links: nearest neighbours while free, the lattice once organised
      ctx.lineWidth = 1.3;
      for (let i = 0; i < N.length; i++)
        for (let j = i + 1; j < N.length; j++) {
          const a = Math.min(vis[i], vis[j]);
          if (a <= 0) continue;
          const dFree = Math.hypot(N[i].p[0] - N[j].p[0], N[i].p[1] - N[j].p[1], N[i].p[2] - N[j].p[2]);
          const dLat = Math.hypot(N[i].q[0] - N[j].q[0], N[i].q[1] - N[j].q[1], N[i].q[2] - N[j].q[2]);
          const la = lerp(dFree < 0.75 ? 0.45 : 0, dLat < 0.6 ? 0.8 : 0, org) * a;
          if (la <= 0.01) continue;
          ctx.strokeStyle = `rgba(230,234,242,${la})`;
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
          const u = (T * 0.8 + i * 0.13 + j * 0.07) % 1;
          ctx.globalCompositeOperation = "lighter";
          glow(ctx, lerp(pos[i].x, pos[j].x, u), lerp(pos[i].y, pos[j].y, u), 8, la * 0.9);
          ctx.globalCompositeOperation = "source-over";
        }
      ctx.globalCompositeOperation = "lighter";
      pos.forEach((p, i) => {
        if (vis[i] <= 0) return;
        glow(ctx, p.x, p.y, 34 * p.k, 0.45 * vis[i]);
        glow(ctx, p.x, p.y, 7 * p.k, vis[i]);
      });
      if (org > 0 && org < 1) flare(ctx, W / 2, H / 2 - 20, Math.sin(Math.PI * org) * 0.4, 1100, 60);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ what they build: phone, browser, hardware
function phone(ctx: CanvasRenderingContext2D, x: number, y: number, f: number, T: number) {
  const pw = 250, phh = 500;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = clamp01(f * 2);
  ctx.strokeStyle = "rgba(235,238,245,0.9)";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#0b0c0e";
  ctx.beginPath();
  ctx.roundRect(-pw / 2, -phh / 2, pw, phh, 40);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(-38, -phh / 2 + 16, 76, 22, 11);
  ctx.fill();
  const ui = (k: number) => clamp01((f - 0.3 - k * 0.06) / 0.25);
  ctx.fillStyle = `rgba(240,242,248,${ui(0)})`;
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Today", -pw / 2 + 24, -phh / 2 + 88);
  for (let k = 0; k < 4; k++) {
    const a = ui(k + 1);
    ctx.fillStyle = `rgba(255,255,255,${0.08 * a})`;
    ctx.beginPath();
    ctx.roundRect(-pw / 2 + 20, -phh / 2 + 110 + k * 78 + (1 - a) * 20, pw - 40, 64, 14);
    ctx.fill();
    ctx.fillStyle = `rgba(235,238,245,${0.8 * a})`;
    ctx.beginPath();
    ctx.arc(-pw / 2 + 50, -phh / 2 + 142 + k * 78 + (1 - a) * 20, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(235,238,245,${0.5 * a})`;
    ctx.fillRect(-pw / 2 + 76, -phh / 2 + 132 + k * 78 + (1 - a) * 20, 110 - k * 12, 8);
    ctx.fillStyle = `rgba(235,238,245,${0.25 * a})`;
    ctx.fillRect(-pw / 2 + 76, -phh / 2 + 146 + k * 78 + (1 - a) * 20, 70, 6);
  }
  const b = ui(6);
  ctx.fillStyle = `rgba(245,247,252,${b})`;
  ctx.beginPath();
  ctx.roundRect(-pw / 2 + 20, phh / 2 - 74, pw - 40, 50, 25);
  ctx.fill();
  ctx.restore();
}
function browser(ctx: CanvasRenderingContext2D, x: number, y: number, f: number, T: number) {
  const bw = 620, bh = 400;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = clamp01(f * 2);
  ctx.fillStyle = "#0b0c0e";
  ctx.strokeStyle = "rgba(235,238,245,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-bw / 2, -bh / 2 + 44);
  ctx.lineTo(bw / 2, -bh / 2 + 44);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "rgba(235,238,245,0.5)";
    ctx.beginPath();
    ctx.arc(-bw / 2 + 24 + i * 20, -bh / 2 + 22, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(-140, -bh / 2 + 10, 280, 24, 12);
  ctx.fill();
  const ui = (k: number) => clamp01((f - 0.3 - k * 0.07) / 0.25);
  ctx.fillStyle = `rgba(240,242,248,${ui(0)})`;
  ctx.font = `700 34px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Built to scale.", -bw / 2 + 40, -bh / 2 + 120);
  ctx.fillStyle = `rgba(235,238,245,${0.35 * ui(1)})`;
  ctx.fillRect(-bw / 2 + 40, -bh / 2 + 140, 300, 8);
  ctx.fillRect(-bw / 2 + 40, -bh / 2 + 156, 220, 8);
  ctx.fillStyle = `rgba(245,247,252,${ui(2)})`;
  ctx.beginPath();
  ctx.roundRect(-bw / 2 + 40, -bh / 2 + 182, 140, 40, 20);
  ctx.fill();
  // a live chart
  const c = ui(3);
  ctx.strokeStyle = `rgba(240,243,250,${c})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    const px = -bw / 2 + 40 + u * (bw - 80) * c, py = bh / 2 - 40 - (u * 90 + Math.sin(u * 9 + T * 2) * 14);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/** 51.25 – 56.7 s: "from mobile apps and web platforms to custom hardware made for your project." */
export const DevicesScene: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const fade = 1 - rng01(T, to - 0.35, to);
      const fp = rng01(T, w("apps", 1) - 0.3, w("apps", 2) + 1.3, (x) => x);
      const fb = rng01(T, w("apps", 4) - 0.3, w("apps", 5) + 1.3, (x) => x);
      const fh = rng01(T, w("apps", 7) - 0.3, w("apps", 8) + 1.4, (x) => x);
      const tog = rng01(T, w("apps", 10) - 0.2, w("apps", 12) + 0.4, ease.inOut);
      const zoom = lerp(1, 0.94, t / 5);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = fade;
      const y = H / 2 - 20;
      const sp = lerp(1, 0.9, tog);
      const lift = (f: number) => (1 - ease.outCubic(f * 1.6)) * 60;
      ctx.save();
      ctx.globalAlpha = fade;
      phone(ctx, W / 2 + (-560) * sp, y + lift(fp), fp, T);
      ctx.restore();
      browser(ctx, W / 2 - 20 * sp + 0, y + lift(fb), fb, T);
      if (fh > 0) {
        ctx.save();
        ctx.translate(W / 2 + 560 * sp, y + lift(fh));
        ctx.globalAlpha = clamp01(fh * 2) * fade;
        ctx.fillStyle = "#0b0c0e";
        ctx.strokeStyle = "rgba(235,238,245,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-150, -150, 300, 300, 18);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(W / 2 + 560 * sp - 150, y + lift(fh) - 150, 300, 300, 18);
        ctx.clip();
        chip(ctx, W / 2 + 560 * sp, y + lift(fh), 0.62, fh, T, clamp01(fh * 2) * fade);
        ctx.restore();
      }
      ctx.globalAlpha = fade;
      for (const [txt, x, f] of [["MOBILE APPS", W / 2 - 560 * sp, fp], ["WEB PLATFORMS", W / 2 - 20 * sp, fb], ["CUSTOM HARDWARE", W / 2 + 560 * sp, fh]] as const) {
        const a = clamp01((f - 0.2) / 0.3) * fade;
        ctx.globalAlpha = a;
        ctx.font = `600 18px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(210,214,222,0.9)";
        ctx.fillText(txt.split("").join(String.fromCharCode(8202)), x, y + 300);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (tog > 0) {
        ctx.globalCompositeOperation = "lighter";
        const sx = lerp(-300, W + 300, tog);
        const g = ctx.createLinearGradient(sx - 200, 0, sx + 200, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(255,255,255,${0.1 * fade})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    }}
  />
);
