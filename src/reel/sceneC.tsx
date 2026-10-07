import React from "react";
import { clamp01, ease, flare, glow, hash, lerp, mulberry, rng01, V3 } from "../edw/kit";
import { Cam, P, beam, city, glass, groundY, planet, terrain, tesseract } from "./cube";
import { RCanvas, RH, RW, starfield, w } from "./rk";
import { CX, CY } from "./sceneB";

const norm = (v: V3): V3 => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** the cube keeps turning, one continuous motion from 36 s to the tesseract */
const spinIn = (T: number) => (1 - ease.outCubic(rng01(T, 36.2, 37.3, (x) => x))) * 1.4;
export const worldYaw = (T: number) => 0.3 + 0.12 * (T - 36) + spinIn(T);

// ------------------------------------------------------------------ the sun of that world, going round faster and faster
const T_SUN = 37.35, T_ACC = 38.85, W0 = 1.4, K = 1.85, WMAX = 120;
const T_CAP = T_ACC + Math.log(WMAX / W0) / K;
/** orbit angle at time t */
const phi = (t: number) => {
  if (t <= T_SUN) return 0;
  if (t <= T_ACC) return W0 * (t - T_SUN);
  const a = W0 * (T_ACC - T_SUN);
  if (t <= T_CAP) return a + (W0 / K) * (Math.exp(K * (t - T_ACC)) - 1);
  return a + (W0 / K) * (Math.exp(K * (T_CAP - T_ACC)) - 1) + WMAX * (t - T_CAP);
};
const omega = (t: number) => (t <= T_SUN ? 0 : t <= T_ACC ? W0 : Math.min(WMAX, W0 * Math.exp(K * (t - T_ACC))));
/** where the sun is, cube-local, for orbit angle f (the plane slowly precesses as the days pile up) */
const RO = 1.72, TILT = 0.45;
const sunAt = (f: number): V3 => {
  const ps = 0.6 + 0.045 * f;
  const N: V3 = [Math.sin(TILT) * Math.cos(ps), Math.cos(TILT), Math.sin(TILT) * Math.sin(ps)];
  const U: V3 = norm([-Math.sin(ps), 0, Math.cos(ps)]);
  const V = cross(N, U);
  const a = f + 2.3;
  return [RO * (Math.cos(a) * U[0] + Math.sin(a) * V[0]), RO * (Math.cos(a) * U[1] + Math.sin(a) * V[1]), RO * (Math.cos(a) * U[2] + Math.sin(a) * V[2])];
};

/** the light the world rests in when its sun is not racing */
const LREST: V3 = norm([0.4, 1, -0.3]);
const restLight = (n: V3) => 0.25 + 0.75 * Math.max(0, dot(n, LREST));
const daysGlow = (T: number) => (T > w("days", 13) ? Math.exp(-(T - w("days", 13)) / 0.7) : 0);

const fastCam = (T: number): Cam => ({ cx: CX, cy: CY, s: 200 * ease.outCubic(rng01(T, 36.2, 37.25, (x) => x)), yaw: worldYaw(T), pitch: -0.36 });

export const Fast: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const cam = fastCam(T);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.28 * rng01(T, 36.2, 37.4), 150, T * 3);
      // the point everything collapsed into, opening into the world again
      const pt = 1 - rng01(T, 36.4, 37.1);
      const br = 1 + 0.12 * Math.sin((T - 35.9) * 4);
      glow(ctx, CX, CY, 70 * br, 0.4 * pt);
      glow(ctx, CX, CY, 10 * br, pt);
      ctx.globalCompositeOperation = "source-over";
      const open = rng01(T, 36.25, 37.2);
      glass(ctx, cam, "back", open);

      // time: the sun going round, a day per turn, then thousands of them
      const on = rng01(T, T_SUN - 0.15, T_SUN + 0.3) * (1 - rng01(T, 45.35, 46.15));
      const om = omega(T);
      const E = lerp(0.14, 0.5, clamp01((om - 4) / 60));
      const nS = Math.min(700, Math.max(16, Math.ceil((om * E) / 0.05)));
      const lights: V3[] = [];
      for (let j = 0; j < 4; j++) lights.push(norm(sunAt(phi(T - (Math.min(E, 0.12) * j) / 4))));
      ctx.globalCompositeOperation = "lighter";
      if (on > 0.002 && T > T_SUN - 0.15) {
        const B = 6;
        const paths = Array.from({ length: B }, () => new Path2D());
        let prev = P(cam, sunAt(phi(T)));
        for (let j = 1; j <= nS; j++) {
          const t = T - (E * j) / nS;
          if (t < T_SUN) break;
          const p = P(cam, sunAt(phi(t)));
          const age = j / nS;
          const dep = clamp01(0.62 - (p.z + prev.z) / (4 * RO * cam.s));
          const al = Math.pow(1 - age, 1.4) * (0.35 + 0.65 * dep);
          const b = Math.min(B - 1, Math.floor(al * B));
          paths[b].moveTo(prev.x, prev.y);
          paths[b].lineTo(p.x, p.y);
          prev = p;
        }
        for (let b = 0; b < B; b++) {
          ctx.strokeStyle = `rgba(238,242,255,${on * 0.75 * ((b + 0.5) / B)})`;
          ctx.lineWidth = 1.6;
          ctx.stroke(paths[b]);
          ctx.strokeStyle = `rgba(220,230,255,${on * 0.08 * ((b + 0.5) / B)})`;
          ctx.lineWidth = 7;
          ctx.stroke(paths[b]);
        }
        const s = P(cam, sunAt(phi(T)));
        const slow = 1 - clamp01((om - 6) / 30);
        glow(ctx, s.x, s.y, 60, 0.3 * on * (0.4 + 0.6 * slow));
        glow(ctx, s.x, s.y, 12, 0.95 * on);
        // "changes everything": the first sunrise of that world
        if (T > T_SUN - 0.1) flare(ctx, s.x, s.y, 0.5 * Math.exp(-(T - T_SUN + 0.1) / 0.6), 760, 40);
      }

      // the land, lit by that sun: day, night, day, until the days blur
      const rise = ease.inOut(rng01(T, 36.5, 37.6, (x) => x));
      terrain(ctx, cam, open, {
        rise,
        light: (n) => {
          let l = 0;
          for (const L of lights) l += Math.max(0, dot(n, L));
          return lerp(restLight(n), 0.16 + 0.84 * (l / lights.length), on);
        },
      });
      // "what took us thousands of years ... in a matter of days"
      const g = ease.inOut(rng01(T, w("days", 1), w("days", 13) - 0.1, (x) => x));
      city(ctx, cam, g, 1, T);
      glow(ctx, CX, cam.cy + 40, 330, 0.2 * daysGlow(T));
      ctx.globalCompositeOperation = "source-over";
      glass(ctx, cam, "front", open);
    }}
  />
);

// ------------------------------------------------------------------ 46.2 – 57.6: where would it lead — other planets, a god, things we can't imagine
const PLANETS = [
  { x: 196, y: 372, r: 42, at: w("rockets", 3) },
  { x: 884, y: 318, r: 58, at: w("rockets", 7) },
  { x: 892, y: 1062, r: 32, at: w("rockets", 9) },
];
const FLY = 1.05;
const bez = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

// the faithful, gathering in a ring
const FAITH = (() => {
  const r = mulberry(61);
  return Array.from({ length: 52 }, (_, i) => {
    const ang = (i / 52) * Math.PI * 2 + (r() - 0.5) * 0.06;
    const rr = 0.36 + r() * 0.06;
    return { x0: (r() * 2 - 1) * 0.8, z0: (r() * 2 - 1) * 0.8, x1: Math.cos(ang) * rr, z1: Math.sin(ang) * rr, d: r() * 0.5 };
  });
})();

/** rotation angle with a linear ramp-up of speed from 0 to `om` over [a, a + ramp] */
const spinAngle = (t: number, a: number, ramp: number, om: number) => {
  if (t <= a) return 0;
  if (t <= a + ramp) return (0.5 * om * (t - a) ** 2) / ramp;
  return 0.5 * om * ramp + om * (t - a - ramp);
};

const futCam = (T: number): Cam => {
  const back = ease.inOut(rng01(T, 46.2, 47.6, (x) => x));
  const god = ease.inOut(rng01(T, 50.95, 52.3, (x) => x));
  const inv = ease.inOut(rng01(T, 53.2, 54.6, (x) => x));
  const out = ease.inCubic(rng01(T, 57.15, 57.6, (x) => x));
  return {
    cx: CX,
    cy: lerp(lerp(lerp(CY, 760, back), 800, god), CY, inv),
    s: lerp(lerp(lerp(200, 150, back), 245, god), 222, inv) * (1 - 0.15 * out),
    yaw: worldYaw(T),
    pitch: lerp(lerp(-0.36, -0.6, god), -0.38, inv),
  };
};

export const Futures: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const cam = futCam(T);
      const out = 1 - rng01(T, 57.2, 57.55);
      ctx.fillStyle = "#030304";
      ctx.fillRect(0, 0, RW, RH);
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, lerp(0.28, 0.62, rng01(T, 46.2, 47.4)) * out, 150, T * 3);
      ctx.globalCompositeOperation = "source-over";

      const world = 1 - rng01(T, 53.0, 53.6);
      const godA = rng01(T, 51.1, 51.9) * world;
      const paneA = 1 - rng01(T, 53.3, 54.0);
      const edgeA = 1 - rng01(T, 53.75, 54.0);
      glass(ctx, cam, "back", out, { face: paneA, edge: edgeA });

      // the planets they could reach
      const pl = 1 - rng01(T, 50.9, 51.45);
      ctx.globalCompositeOperation = "lighter";
      PLANETS.forEach((p, i) => {
        const a = rng01(T, 47.35 + i * 0.22, 48.0 + i * 0.22) * pl;
        if (a <= 0) return;
        ctx.globalCompositeOperation = "source-over";
        planet(ctx, p.x, p.y, p.r, a, -2.3 + i * 0.4);
        ctx.globalCompositeOperation = "lighter";
        // the flight
        const u = rng01(T, p.at, p.at + FLY, ease.inOut);
        if (u <= 0) return;
        const s = P(cam, [0, 1, 0]);
        const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy);
        const ex = p.x - (dx / d) * p.r * 1.05, ey = p.y - (dy / d) * p.r * 1.05;
        const side = p.x < CX ? -1 : 1;
        const cx = (s.x + ex) / 2 + side * 0.18 * d - 0 * dy, cy = Math.min(s.y, ey) - 0.32 * d;
        const n = 48;
        for (let j = 0; j < n; j++) {
          const t0 = (j / n) * u, t1 = ((j + 1) / n) * u;
          const tail = (j + 1) / n;
          ctx.strokeStyle = `rgba(236,240,255,${a * (0.12 + 0.6 * tail * tail) * (u < 1 ? 1 : 0.65)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(bez(s.x, cx, ex, t0), bez(s.y, cy, ey, t0));
          ctx.lineTo(bez(s.x, cx, ex, t1), bez(s.y, cy, ey, t1));
          ctx.stroke();
        }
        if (u < 1) {
          const hx = bez(s.x, cx, ex, u), hy = bez(s.y, cy, ey, u);
          glow(ctx, hx, hy, 16, 0.85 * a);
          glow(ctx, hx, hy, 4, a);
        } else {
          // arrival: a soft flash, an orbit, a few lights on the night side
          const k = T - p.at - FLY;
          glow(ctx, ex, ey, 46, 0.5 * a * Math.exp(-k / 0.5));
          const o = ease.outCubic(clamp01(k / 0.8));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(-0.28 + i * 0.2);
          ctx.strokeStyle = `rgba(230,236,255,${0.45 * a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.75, p.r * 0.42, 0, -Math.PI / 2, -Math.PI / 2 + o * Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          for (let q = 0; q < 6; q++) {
            const la = clamp01((k - q * 0.08) / 0.3) * a;
            const ang = 0.6 + i + q * 0.37, rr = p.r * (0.35 + 0.5 * hash(q + i * 9));
            ctx.fillStyle = `rgba(250,248,240,${0.85 * la})`;
            ctx.fillRect(p.x + Math.cos(ang) * rr - 1, p.y + Math.sin(ang) * rr - 1, 2, 2);
          }
        }
      });

      // their world, still growing inside
      terrain(ctx, cam, world * lerp(1, 0.6, godA), { rise: 1, light: restLight });
      city(ctx, cam, 1, world * (1 - 0.85 * godA), T);
      glow(ctx, CX, cam.cy + 40, 330, 0.2 * daysGlow(T));

      // "would they start believing in a god?"
      if (godA > 0.002) {
        const gather = ease.inOut(rng01(T, 51.3, 52.4, (x) => x));
        const top = P(cam, [0, 1, 0]);
        const floor = P(cam, [0, groundY(0, 0) + 0.01, 0]);
        const lit = (0.55 + 0.45 * rng01(T, w("god", 6) - 0.2, w("god", 6) + 0.25)) * godA;
        beam(ctx, floor.x, 205, floor.y, 46, lit);
        glow(ctx, top.x, top.y, 70, 0.3 * lit);
        glow(ctx, floor.x, floor.y, 120, 0.35 * lit);
        glow(ctx, floor.x, floor.y, 26, 0.7 * lit);
        // dust drifting down the shaft
        for (let i = 0; i < 34; i++) {
          const u = (T * 0.08 + hash(i * 3.3)) % 1;
          const y = lerp(250, floor.y, u);
          const x = floor.x + (hash(i * 7.7) - 0.5) * 50 * (0.6 + 0.4 * u) + Math.sin(T * 0.7 + i) * 4;
          ctx.fillStyle = `rgba(245,248,255,${0.5 * lit * Math.sin(Math.PI * u)})`;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        FAITH.forEach((f, i) => {
          const e = ease.inOut(clamp01((gather - f.d * 0.4) / 0.6));
          const x = lerp(f.x0, f.x1, e), z = lerp(f.z0, f.z1, e);
          const p = P(cam, [x, groundY(x, z) + 0.025, z]);
          const a = godA * (0.6 + 0.4 * e);
          glow(ctx, p.x, p.y, 7, 0.55 * a);
          ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`;
          ctx.fillRect(p.x - 1.3, p.y - 1.3, 2.6, 2.6);
          void i;
        });
      }

      // "or would they invent things ... in ways we haven't even thought of yet?"
      const tes = rng01(T, 53.35, 53.8) * out;
      if (tes > 0.002) {
        const inner = ease.outCubic(rng01(T, 53.45, 54.25, (x) => x));
        const link = ease.inOut(rng01(T, w("invent", 3) - 0.05, w("invent", 3) + 0.7, (x) => x));
        const th = spinAngle(T, 54.15, 0.9, 0.95);
        const th2 = spinAngle(T, w("invent", 11) - 0.1, 1.0, 0.55);
        tesseract(ctx, cam, th, inner, link, tes, th2);
        const gl = (k: number) => (T > k ? Math.exp(-(T - k) / 0.45) : 0);
        const flash = gl(w("invent", 14)) + 0.7 * gl(w("invent", 16));
        if (flash > 0.01) glow(ctx, cam.cx, cam.cy, 260, 0.14 * flash * tes);
      }
      ctx.globalCompositeOperation = "source-over";
      glass(ctx, cam, "front", out, { face: paneA, edge: edgeA, spec: paneA });
    }}
  />
);
