import React from "react";
import {
  CanvasScene,
  H,
  MONO,
  V3,
  W,
  clamp01,
  ease,
  flare,
  glow,
  hash,
  lerp,
  mulberry,
  proj,
  rng01,
  rotX,
  rotY,
  w,
  LAYOUT,
} from "./kit";

// ------------------------------------------------------------------ Gotham at night: the city goes to sleep, one window stays lit
type Bld = {
  x: number;
  w: number;
  h: number;
  layer: number;
  top: number;
  win: { x: number; y: number; off: number }[];
};
let CITY: Bld[] | null = null;
const HERO = {
  x: 960,
  w: 250,
  h: 700,
  win: { x: 960 - 44, y: H - 700 + 70, w: 88, h: 52 },
};
function city(): Bld[] {
  if (CITY) return CITY;
  const r = mulberry(4);
  const out: Bld[] = [];
  const offA = w("comfort", 0) - 0.3,
    offB = w("calm", 2);
  for (const layer of [0, 1, 2]) {
    let x = -60;
    while (x < W + 60) {
      const bw =
        (layer === 0 ? 60 : layer === 1 ? 90 : 130) +
        r() * (layer === 2 ? 120 : 80);
      let bh =
        (layer === 0 ? 260 : layer === 1 ? 330 : 380) +
        r() * (layer === 0 ? 260 : layer === 1 ? 300 : 260);
      if (
        layer === 2 &&
        Math.abs(x + bw / 2 - HERO.x) < HERO.w / 2 + bw / 2 + 10
      ) {
        x += 18;
        continue;
      }
      if (layer === 2) bh *= 0.75;
      const win: Bld["win"] = [];
      const sx = layer === 0 ? 14 : layer === 1 ? 20 : 26,
        sy = layer === 0 ? 20 : layer === 1 ? 26 : 34;
      for (let wy = H - bh + 24; wy < H - 20; wy += sy)
        for (let wx = x + 12; wx < x + bw - 16; wx += sx)
          if (r() < 0.42)
            win.push({
              x: wx,
              y: wy,
              off: lerp(offA, offB, Math.pow(r(), 0.8)),
            });
      out.push({ x, w: bw, h: bh, layer, top: r(), win });
      x += bw + 4 + r() * 20;
    }
  }
  CITY = out;
  return out;
}
let RAIN: number[][] | null = null;
const rain = () =>
  (RAIN ??= Array.from({ length: 700 }, (_, i) => [
    hash(i * 3.1),
    hash(i * 7.7),
    0.4 + hash(i * 1.3) * 0.6,
  ]));

/** 13.75 – 18.6 s: "While everyone else looks for comfort, they stay calm and keep working," */
export const CityScene: React.FC<{ from: number; to: number }> = ({
  from,
  to,
}) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const push = rng01(
        T,
        w("calm", 3) - 0.3,
        to + 0.1,
        (x) => ease.inCubic(x) * 0.65 + ease.inOut(x) * 0.35,
      );
      const zoom = lerp(1.0, 1.08, t / 5) * Math.pow(9, push);
      const fx = HERO.win.x + HERO.win.w / 2,
        fy = HERO.win.y + HERO.win.h / 2;
      const cx = lerp(W / 2, fx, clamp01(push * 1.4)),
        cy = lerp(H / 2, fy, clamp01(push * 1.4));
      const bolt = Math.max(
        Math.exp(-Math.max(0, t) / 0.18) * (t >= 0 ? 1 : 0),
        0.55 * Math.exp(-Math.max(0, t - 0.32) / 0.12) * (t > 0.32 ? 1 : 0),
      );
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(
        0,
        `rgb(${10 + 60 * bolt},${11 + 60 * bolt},${14 + 62 * bolt})`,
      );
      sky.addColorStop(
        1,
        `rgb(${22 + 40 * bolt},${23 + 40 * bolt},${26 + 40 * bolt})`,
      );
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);
      // the moon behind drifting cloud
      const mx = 1400 - t * 6,
        my = 250;
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, mx, my, 420, 0.12);
      ctx.globalCompositeOperation = "source-over";
      const mg = ctx.createRadialGradient(mx - 30, my - 30, 10, mx, my, 120);
      mg.addColorStop(0, "#d9dbe0");
      mg.addColorStop(1, "#8d9097");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, 118, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 14; i++) {
        const qx = mx - 70 + hash(i) * 140, qy = my - 70 + hash(i + 9) * 140, qr = 6 + hash(i + 3) * 16;
        const cg = ctx.createRadialGradient(qx, qy, 0, qx, qy, qr);
        cg.addColorStop(0, "rgba(90,92,98,0.16)");
        cg.addColorStop(1, "rgba(90,92,98,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(qx - qr, qy - qr, qr * 2, qr * 2);
      }
      for (let i = 0; i < 5; i++) {
        const cy2 = 160 + i * 70,
          cx2 = ((i * 530 + t * (20 + i * 8)) % 2600) - 300;
        const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 420);
        g.addColorStop(0, `rgba(8,9,11,${0.75 - i * 0.08})`);
        g.addColorStop(1, "rgba(8,9,11,0)");
        ctx.save();
        ctx.translate(cx2, cy2);
        ctx.scale(1, 0.22);
        ctx.translate(-cx2, -cy2);
        ctx.fillStyle = g;
        ctx.fillRect(cx2 - 420, cy2 - 420, 840, 840);
        ctx.restore();
      }
      // buildings, far to near
      for (const layer of [0, 1, 2]) {
        const shade = [26, 15, 6][layer] + bolt * [50, 34, 16][layer];
        const par = [0.25, 0.5, 1][layer];
        ctx.save();
        ctx.translate(-(t * 3) * (1 - par), 0);
        for (const b of city().filter((b) => b.layer === layer)) {
          ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 3})`;
          ctx.fillRect(b.x, H - b.h, b.w, b.h);
          if (b.top > 0.7)
            ctx.fillRect(
              b.x + b.w / 2 - 2,
              H - b.h - 60 * b.top,
              4,
              60 * b.top,
            );
          if (b.top < 0.2)
            ctx.fillRect(b.x + b.w * 0.2, H - b.h - 18, b.w * 0.6, 18);
          const ww = [7, 10, 13][layer],
            wh = [10, 14, 18][layer];
          for (const wi of b.win) {
            const on = clamp01((wi.off - T) / 0.06);
            if (on <= 0) continue;
            const fl = 0.75 + 0.25 * hash(wi.x * 0.37 + wi.y);
            ctx.fillStyle = `rgba(232,234,238,${on * fl * [0.35, 0.5, 0.65][layer]})`;
            ctx.fillRect(wi.x, wi.y, ww, wh);
          }
        }
        ctx.restore();
      }
      // the hero tower
      ctx.fillStyle = `rgb(${4 + 12 * bolt},${4 + 12 * bolt},${6 + 12 * bolt})`;
      ctx.fillRect(HERO.x - HERO.w / 2, H - HERO.h, HERO.w, HERO.h);
      ctx.fillRect(HERO.x - HERO.w / 2 + 30, H - HERO.h - 30, HERO.w - 60, 30);
      ctx.fillRect(HERO.x - 3, H - HERO.h - 150, 6, 120);
      const hw = HERO.win;
      const room = ctx.createLinearGradient(0, hw.y, 0, hw.y + hw.h);
      room.addColorStop(0, "#f2f3f5");
      room.addColorStop(1, "#cfd2d8");
      ctx.fillStyle = room;
      ctx.fillRect(hw.x, hw.y, hw.w, hw.h);
      // someone still at the desk, a screen glowing in front of them
      ctx.fillStyle = "#050506";
      const px = hw.x + 34,
        py = hw.y + hw.h;
      ctx.beginPath();
      ctx.arc(px, py - 26, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - 13, py);
      ctx.quadraticCurveTo(px - 13, py - 18, px, py - 18);
      ctx.quadraticCurveTo(px + 13, py - 18, px + 13, py);
      ctx.fill();
      ctx.fillRect(hw.x + 52, hw.y + hw.h - 30, 22, 14);
      ctx.fillRect(hw.x + 62, hw.y + hw.h - 16, 2, 10);
      ctx.fillRect(hw.x + 44, hw.y + hw.h - 6, 40, 6);
      ctx.fillStyle = "#3a3c42";
      ctx.fillRect(hw.x + hw.w / 2 - 1, hw.y, 2, hw.h);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, hw.x + hw.w / 2, hw.y + hw.h / 2, 140, 0.18);
      ctx.globalCompositeOperation = "source-over";
      // the other tower windows: off already
      ctx.restore();
      // fog and rain
      const fog = ctx.createLinearGradient(0, H * 0.55, 0, H);
      fog.addColorStop(0, "rgba(40,42,48,0)");
      fog.addColorStop(1, `rgba(60,62,70,${0.35 * (1 - push)})`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(210,215,225,0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const [a, b, s] of rain()) {
        const len = 30 + 40 * s;
        const y = ((b * (H + 200) + T * 1900 * s) % (H + 200)) - 100;
        const x =
          ((((a * (W + 200) - T * 260 * s) % (W + 200)) + W + 200) %
            (W + 200)) -
          100;
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.14, y + len);
      }
      ctx.stroke();
      // lightning washes over the frame
      if (bolt > 0.01) {
        ctx.fillStyle = `rgba(230,235,245,${bolt * 0.5})`;
        ctx.fillRect(0, 0, W, H);
      }
      // into the window glow
      const out = rng01(T, to - 0.35, to, ease.inCubic);
      if (out > 0) {
        ctx.fillStyle = `rgba(0,0,0,${out})`;
        ctx.fillRect(0, 0, W, H);
      }
    }}
  />
);

// ------------------------------------------------------------------ a road into the dark, a beacon on the horizon
/** 18.6 – 21.05 s: "because they already know where they're going." */
export const RoadScene: React.FC<{ from: number; to: number }> = ({
  from,
  to,
}) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const hy = 500,
        vx = W / 2 + Math.sin(t * 0.6) * 14;
      const fade =
        rng01(t, 0, 0.5, ease.outCubic) * (1 - rng01(T, to - 0.2, to));
      const sky = ctx.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, "#030304");
      sky.addColorStop(1, "#16171b");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hy);
      ctx.fillStyle = "#050506";
      ctx.fillRect(0, hy, W, H - hy);
      ctx.globalAlpha = fade;
      // stars
      for (let i = 0; i < 160; i++) {
        const a =
          0.15 + 0.5 * hash(i + 0.5) * (0.6 + 0.4 * Math.sin(T * 2 + i));
        ctx.fillStyle = `rgba(230,233,240,${a})`;
        ctx.fillRect(hash(i * 2.1) * W, hash(i * 5.3) * (hy - 40), 1.6, 1.6);
      }
      // the ground grid streaming towards us
      const speed = 2.2 + 1.5 * t;
      const dist = t * speed;
      ctx.strokeStyle = "rgba(200,205,215,0.18)";
      ctx.lineWidth = 1;
      for (let i = -24; i <= 24; i++) {
        ctx.beginPath();
        ctx.moveTo(vx, hy);
        ctx.lineTo(vx + i * 260, H + 200);
        ctx.stroke();
      }
      for (let k = 0; k < 40; k++) {
        const z = k + 1 - (dist % 1);
        const y = hy + 420 / z;
        if (y > H + 10) continue;
        ctx.strokeStyle = `rgba(200,205,215,${0.22 * clamp01((y - hy) / 140)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // the path: two bright rails and the centre dashes
      ctx.globalCompositeOperation = "lighter";
      for (const s of [-1, 1]) {
        const g = ctx.createLinearGradient(0, hy, 0, H);
        g.addColorStop(0, "rgba(255,255,255,0.9)");
        g.addColorStop(1, "rgba(255,255,255,0.25)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vx, hy);
        ctx.lineTo(vx + s * 360, H);
        ctx.stroke();
      }
      for (let k = 0; k < 30; k++) {
        const z0 = k * 2 + 1 - ((dist * 2) % 2);
        const y0 = hy + 420 / z0,
          y1 = hy + 420 / (z0 + 0.8);
        if (y0 > H) continue;
        ctx.fillStyle = `rgba(255,255,255,${0.75 * clamp01((y0 - hy) / 60)})`;
        const w0 = 14 / z0,
          w1 = 14 / (z0 + 0.8);
        ctx.beginPath();
        ctx.moveTo(vx - w0, y0);
        ctx.lineTo(vx + w0, y0);
        ctx.lineTo(vx + w1, y1);
        ctx.lineTo(vx - w1, y1);
        ctx.fill();
      }
      // the beacon: a pillar of light on the horizon
      const pulse = 0.85 + 0.15 * Math.sin(T * 5);
      const beam = ctx.createLinearGradient(0, 0, 0, hy);
      beam.addColorStop(0, "rgba(255,255,255,0)");
      beam.addColorStop(1, `rgba(255,255,255,${0.35 * pulse})`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(vx - 3, hy);
      ctx.lineTo(vx + 3, hy);
      ctx.lineTo(vx + 40, 0);
      ctx.lineTo(vx - 40, 0);
      ctx.fill();
      flare(ctx, vx, hy, 0.9 * pulse * fade, 900, 30 + 10 * t);
      const haze = ctx.createLinearGradient(0, hy - 120, 0, hy + 160);
      haze.addColorStop(0, "rgba(120,125,135,0)");
      haze.addColorStop(0.5, "rgba(120,125,135,0.16)");
      haze.addColorStop(1, "rgba(120,125,135,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - 120, W, 280);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);

// ------------------------------------------------------------------ a geodesic sphere, built edge by edge to 100%, then it becomes the world
type Geo = { v: V3[]; e: [number, number][]; f: [number, number, number][] };
let GEO: Geo | null = null;
function geo(): Geo {
  if (GEO) return GEO;
  const p = (1 + Math.sqrt(5)) / 2;
  let v: V3[] = [
    [-1, p, 0],
    [1, p, 0],
    [-1, -p, 0],
    [1, -p, 0],
    [0, -1, p],
    [0, 1, p],
    [0, -1, -p],
    [0, 1, -p],
    [p, 0, -1],
    [p, 0, 1],
    [-p, 0, -1],
    [-p, 0, 1],
  ];
  let f: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  const norm = (a: V3): V3 => {
    const m = Math.hypot(...a);
    return [a[0] / m, a[1] / m, a[2] / m];
  };
  v = v.map(norm);
  for (let it = 0; it < 2; it++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (cache.has(k)) return cache.get(k)!;
      v.push(
        norm([
          (v[a][0] + v[b][0]) / 2,
          (v[a][1] + v[b][1]) / 2,
          (v[a][2] + v[b][2]) / 2,
        ]),
      );
      cache.set(k, v.length - 1);
      return v.length - 1;
    };
    const nf: typeof f = [];
    for (const [a, b, c] of f) {
      const ab = mid(a, b),
        bc = mid(b, c),
        ca = mid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    f = nf;
  }
  const es = new Set<string>();
  const e: [number, number][] = [];
  for (const [a, b, c] of f)
    for (const [x, y] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const k = x < y ? `${x}_${y}` : `${y}_${x}`;
      if (!es.has(k)) {
        es.add(k);
        e.push([x, y]);
      }
    }
  // build from the ground up
  e.sort(
    (A, B) =>
      Math.min(v[A[0]][1], v[A[1]][1]) -
      Math.min(v[B[0]][1], v[B[1]][1]) +
      (hash(A[0] * 13 + A[1]) - hash(B[0] * 13 + B[1])) * 0.25,
  );
  GEO = { v, e, f };
  return GEO;
}

let GLOBE: V3[] | null = null;
const globe = () => {
  if (GLOBE) return GLOBE;
  const out: V3[] = [];
  for (let la = -84; la <= 84; la += 4) {
    const r = Math.cos((la * Math.PI) / 180);
    const n = Math.max(6, Math.round(90 * r));
    for (let i = 0; i < n; i++) {
      const lo = (i / n) * Math.PI * 2;
      out.push([
        r * Math.cos(lo),
        Math.sin((la * Math.PI) / 180),
        r * Math.sin(lo),
      ]);
    }
  }
  GLOBE = out;
  return out;
};
const ARCS: [V3, V3][] = (() => {
  const r = mulberry(9);
  const s = (): V3 => {
    const u = r() * 1.4 - 0.7,
      a = r() * Math.PI * 2,
      c = Math.sqrt(1 - u * u);
    return [c * Math.cos(a), u, c * Math.sin(a)];
  };
  return Array.from({ length: 22 }, () => {
    const a = s();
    let b = s();
    while (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 0.9 || Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.35) b = s();
    return [a, b] as [V3, V3];
  });
})();
const slerp = (a: V3, b: V3, u: number, lift: number): V3 => {
  const p: V3 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const m = Math.hypot(...p) || 1;
  const h = 1 + lift * Math.sin(Math.PI * u);
  return [(p[0] / m) * h, (p[1] / m) * h, (p[2] / m) * h];
};

/** 21.05 – 29.3 s: "They don't need applause along the way, they only need to see the thing finished, and that is how the biggest things in history ended up being built." */
export const BuildScene: React.FC<{ from: number; to: number }> = ({
  from,
  to,
}) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const G = geo();
      const doneAt = w("finished", 7) + 0.15;
      const prog = rng01(
        T,
        from + 0.25,
        doneAt,
        (x) => x * 0.85 + ease.inOut(x) * 0.15,
      );
      const done = rng01(T, doneAt, doneAt + 0.5, ease.outCubic);
      const toGlobe = rng01(
        T,
        w("history", 0) - 0.3,
        w("history", 0) + 0.9,
        ease.inOut,
      );
      const pull = rng01(T, w("history", 3), to, ease.inOut);
      const ry = t * 0.32,
        rx = 0.32;
      const R = lerp(300, 270, toGlobe) * lerp(1, 0.55, pull);
      const cx = W / 2 + lerp(0, -180, pull),
        cy = H / 2 - 10 + lerp(0, 40, pull);
      const P = (p: V3) => proj(rotX(rotY(p, ry), rx), R, 4.2, cx, cy);
      const fade = rng01(t, 0, 0.4) * (1 - rng01(T, to - 0.35, to));
      ctx.globalAlpha = fade;
      // faces, once finished
      if (done > 0 && toGlobe < 1) {
        const faces = G.f
          .map((f) => {
            const q = f.map((i) => rotX(rotY(G.v[i], ry), rx));
            const n: V3 = [
              (q[0][0] + q[1][0] + q[2][0]) / 3,
              (q[0][1] + q[1][1] + q[2][1]) / 3,
              (q[0][2] + q[1][2] + q[2][2]) / 3,
            ];
            return { f, z: n[2], n };
          })
          .filter((o) => o.z < 0.05)
          .sort((a, b) => b.z - a.z);
        for (const o of faces) {
          const pts = o.f.map((i) => P(G.v[i]));
          const lit = clamp01(-0.45 * o.n[0] + 0.6 * o.n[1] - 0.65 * o.n[2]);
          const c = Math.round(18 + 150 * lit);
          ctx.fillStyle = `rgba(${c},${c + 2},${c + 6},${done * (1 - toGlobe)})`;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(pts[2].x, pts[2].y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `rgba(${c},${c + 2},${c + 6},${done * (1 - toGlobe)})`;
          ctx.stroke();
        }
      }
      // edges, being built
      const n = G.e.length;
      const shown = prog * n;
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < Math.min(n, Math.ceil(shown)); i++) {
        const [a, b] = G.e[i];
        const pa = rotX(rotY(G.v[a], ry), rx),
          pb = rotX(rotY(G.v[b], ry), rx);
        const f = clamp01(shown - i);
        const A = P(G.v[a]),
          B = P(G.v[b]);
        const back = (pa[2] + pb[2]) / 2 > 0 ? 0.28 : 1;
        const fresh = clamp01(1 - (shown - i) / 14);
        ctx.strokeStyle = `rgba(235,238,245,${(0.55 * back + 0.45 * fresh) * (1 - toGlobe) * (1 - 0.5 * done)})`;
        ctx.lineWidth = 1.4 + 1.6 * fresh;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(lerp(A.x, B.x, f), lerp(A.y, B.y, f));
        ctx.stroke();
        if (fresh > 0.85 && f < 1)
          glow(ctx, lerp(A.x, B.x, f), lerp(A.y, B.y, f), 18, 0.9);
      }
      // the world: a lattice of dots with routes of light, a launch towards the moon
      if (toGlobe > 0) {
        ctx.fillStyle = "rgba(225,230,240,0.9)";
        const pts = globe();
        for (let i = 0; i < pts.length; i++) {
          const q = rotX(rotY(pts[i], ry), rx);
          if (q[2] > 0.15) continue;
          const s = proj(q, R, 4.2, cx, cy);
          const lit = clamp01(-0.5 * q[0] + 0.55 * q[1] - 0.6 * q[2]);
          ctx.globalAlpha =
            fade * toGlobe * (0.15 + 0.75 * lit) * (q[2] > 0 ? 0.3 : 1);
          ctx.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4);
        }
        ctx.globalAlpha = fade;
        ARCS.forEach(([a, b], k) => {
          const st = w("history", 0) + 0.2 + k * 0.12;
          const u = clamp01((T - st) / 0.9);
          if (u <= 0) return;
          ctx.strokeStyle = `rgba(240,243,250,${0.55 * toGlobe})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          let pen = false;
          for (let j = 0; j <= 24; j++) {
            const q = rotX(rotY(slerp(a, b, (j / 24) * u, 0.18), ry), rx);
            if (q[2] > -0.05) {
              pen = false;
              continue;
            }
            const s = proj(q, R, 4.2, cx, cy);
            if (!pen) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
            pen = true;
          }
          ctx.stroke();
        });
        // the moon, and the trail that reaches it on "built."
        const mx = cx + R * 2.35,
          my = cy - R * 1.25;
        const ma = toGlobe * rng01(T, w("history", 5) - 0.6, w("history", 5));
        const mg = ctx.createRadialGradient(mx - 10, my - 10, 4, mx, my, 46);
        mg.addColorStop(0, `rgba(215,218,225,${ma})`);
        mg.addColorStop(1, `rgba(120,123,130,${ma})`);
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, 44, 0, Math.PI * 2);
        ctx.fill();
        const launch = rng01(
          T,
          w("history", 6),
          w("history", 12) + 0.15,
          ease.inOut,
        );
        if (launch > 0) {
          const sx = cx + R * 0.62,
            sy = cy - R * 0.62;
          const bez = (u: number) => {
            const a = 1 - u;
            return [
              a * a * sx + 2 * a * u * (sx + R * 0.4) + u * u * (mx - 40),
              a * a * sy + 2 * a * u * (sy - R * 1.2) + u * u * (my + 10),
            ];
          };
          ctx.strokeStyle = "rgba(245,247,252,0.85)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const [x, y] = bez((j / 40) * launch);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          const [hx, hy2] = bez(launch);
          glow(ctx, hx, hy2, 30, 0.95);
          const hit = rng01(
            T,
            w("history", 12) + 0.15,
            w("history", 12) + 0.9,
            ease.outCubic,
          );
          if (hit > 0 && hit < 1)
            flare(ctx, mx - 40, my + 10, 1 - hit, 600, 50);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      // the build counter
      if (toGlobe < 1) {
        const a = fade * (1 - toGlobe) * rng01(t, 0.2, 0.6);
        ctx.globalAlpha = a;
        ctx.font = `500 20px ${MONO}`;
        ctx.fillStyle = "rgba(200,204,212,0.8)";
        ctx.textAlign = "left";
        const lx = LAYOUT.reel ? W / 2 - 150 : W / 2 + 380,
          ly = LAYOUT.reel ? H / 2 + 410 : H / 2 + 150;
        ctx.fillText(
          done > 0.5 ? "STATUS  COMPLETE" : "STATUS  BUILDING",
          lx,
          ly - 70,
        );
        ctx.fillText(
          `NODES   ${String(Math.min(G.v.length, Math.round(prog * G.v.length))).padStart(3, "0")}/${G.v.length}`,
          lx,
          ly - 40,
        );
        ctx.font = `700 64px ${MONO}`;
        ctx.fillStyle = "#f2f3f6";
        const pct = prog * 100;
        const scramble =
          done > 0.5 ? "" : String(Math.floor(hash(Math.floor(T * 30)) * 10));
        ctx.fillText(
          `${pct.toFixed(pct >= 100 ? 0 : 1)}${pct < 100 ? scramble : ""}%`,
          lx,
          ly + 30,
        );
        ctx.fillStyle = "rgba(200,204,212,0.25)";
        ctx.fillRect(lx, ly + 54, 260, 2);
        ctx.fillStyle = "#f2f3f6";
        ctx.fillRect(lx, ly + 54, 260 * prog, 2);
        ctx.globalAlpha = 1;
      }
      if (done > 0 && done < 1) {
        ctx.globalCompositeOperation = "lighter";
        flare(ctx, cx, cy, (1 - done) * 0.8, 1100, 120);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    }}
  />
);
