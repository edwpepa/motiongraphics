import React from "react";
import {
  CanvasScene,
  H,
  V3,
  W,
  clamp01,
  ease,
  fbm,
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
} from "./kit";

// ------------------------------------------------------------------ a brain made of light: a point cloud with folds, cerebellum and stem
type BP = { p: V3; n: V3; b: number };
let BRAIN: BP[] | null = null;
export function brain(): BP[] {
  if (BRAIN) return BRAIN;
  const out: BP[] = [];
  const r = mulberry(11);
  const N = 30000;
  for (let i = 0; i < N; i++) {
    const zz = 1 - (2 * (i + 0.5)) / N;
    const rr = Math.sqrt(1 - zz * zz);
    const th = i * 2.399963 + r() * 0.002;
    const d: V3 = [rr * Math.cos(th), zz, rr * Math.sin(th)];
    let x = d[0] * 1.08,
      y = d[1] * 0.8,
      z = d[2] * 0.8;
    if (y < 0) y *= 0.78;
    if (y < -0.2 && x > -0.2 && x < 0.55)
      y -=
        0.1 *
        Math.sin(((x + 0.2) / 0.75) * Math.PI) *
        clamp01((-y - 0.2) / 0.3); // temporal lobe
    if (Math.abs(z) < 0.045 && y > -0.05) continue; // the fissure between hemispheres
    const n = fbm(x * 3.4 + 3, y * 3.4 + 1, Math.abs(z) * 3.4);
    const ridge = Math.abs(Math.sin(n * 30));
    if (ridge < 0.3) continue; // sulci
    const k = 1 + 0.04 * (ridge - 0.6);
    out.push({ p: [x * k, y * k, z * k], n: d, b: 0.45 + 0.55 * ridge });
  }
  for (let i = 0; i < 5200; i++) {
    const u = r() * 2 - 1,
      a = r() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    const d: V3 = [s * Math.cos(a), u, s * Math.sin(a)];
    const p: V3 = [-0.66 + d[0] * 0.36, -0.5 + d[1] * 0.22, d[2] * 0.6];
    if (Math.abs(Math.sin(p[1] * 80)) < 0.35) continue;
    out.push({ p, n: d, b: 0.6 });
  }
  for (let i = 0; i < 1400; i++) {
    const v = r(),
      a = r() * Math.PI * 2;
    const rad = 0.13 - 0.03 * v;
    out.push({
      p: [
        -0.3 - 0.08 * v + Math.cos(a) * rad,
        -0.45 - 0.6 * v,
        Math.sin(a) * rad,
      ],
      n: [Math.cos(a), 0, Math.sin(a)],
      b: 0.5,
    });
  }
  BRAIN = out;
  return out;
}

const L: V3 = (() => {
  const v: V3 = [-0.45, 0.6, -0.65];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

let SYN: { i: number; nb: number[]; per: number; ph: number }[] | null = null;
function synapses(B: BP[]) {
  if (SYN) return SYN;
  const r = mulberry(5);
  const idx: number[] = [];
  while (idx.length < 110) {
    const i = Math.floor(r() * (B.length - 6600));
    idx.push(i);
  }
  SYN = idx.map((i) => {
    const p = B[i].p;
    const d = idx
      .filter((j) => j !== i)
      .map((j) => ({
        j,
        d: Math.hypot(B[j].p[0] - p[0], B[j].p[1] - p[1], B[j].p[2] - p[2]),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((o) => o.j);
    return { i, nb: d, per: 0.9 + r() * 2.2, ph: r() * 3 };
  });
  return SYN;
}

export type BrainCam = {
  ry: number;
  rx: number;
  scale: number;
  cx: number;
  cy: number;
  dist: number;
  alpha: number;
  rate: number;
  spark: number;
  focus?: V3;
};
export const SPARK_P: V3 = [0.46, 0.2, 0.08];

export function drawBrain(
  ctx: CanvasRenderingContext2D,
  t: number,
  cam: BrainCam,
) {
  const B = brain();
  const buckets: number[][] = Array.from({ length: 12 }, () => []);
  const pr = (p: V3) => {
    const q = rotX(rotY(p, cam.ry), cam.rx);
    return proj(q, cam.scale, cam.dist, cam.cx, cam.cy);
  };
  for (let i = 0; i < B.length; i++) {
    const bp = B[i];
    const q = rotX(rotY(bp.p, cam.ry), cam.rx);
    const n = rotX(rotY(bp.n, cam.ry), cam.rx);
    const lit = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const front = n[2] < 0 ? 1 : 0.35;
    const a = bp.b * (0.12 + 0.88 * lit) * front * cam.alpha;
    if (a < 0.03) continue;
    const s = proj(q, cam.scale, cam.dist, cam.cx, cam.cy);
    if (s.k <= 0) continue;
    const bi = Math.min(11, Math.floor(a * 12));
    buckets[bi].push(s.x, s.y, 1.5 * s.k);
  }
  ctx.globalCompositeOperation = "lighter";
  for (let b = 0; b < 12; b++) {
    const arr = buckets[b];
    if (!arr.length) continue;
    ctx.fillStyle = `rgba(226,232,240,${((b + 0.5) / 12) * 0.85})`;
    for (let j = 0; j < arr.length; j += 3)
      ctx.fillRect(
        arr[j] - arr[j + 2] / 2,
        arr[j + 1] - arr[j + 2] / 2,
        arr[j + 2],
        arr[j + 2],
      );
  }
  // synapses firing
  if (cam.rate > 0) {
    for (const s of synapses(B)) {
      const ph = (t * (0.6 + cam.rate) + s.ph) % s.per;
      const a = Math.exp(-ph / 0.16) * clamp01(cam.rate) * cam.alpha;
      if (a < 0.02) continue;
      const p0 = pr(B[s.i].p);
      glow(ctx, p0.x, p0.y, 16 * p0.k, a * 0.9);
      ctx.lineWidth = 1.2;
      for (const j of s.nb) {
        const p1 = pr(B[j].p);
        ctx.strokeStyle = `rgba(235,240,255,${a * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        const u = clamp01(ph / 0.35);
        glow(ctx, lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u), 7, a);
      }
    }
  }
  if (cam.spark > 0) {
    const sp = pr(SPARK_P);
    const pulse = 0.75 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    glow(
      ctx,
      sp.x,
      sp.y,
      70 * sp.k * (0.6 + cam.spark),
      cam.spark * 0.55 * pulse,
    );
    glow(ctx, sp.x, sp.y, 14 * sp.k, cam.spark * pulse);
  }
  ctx.globalCompositeOperation = "source-over";
  return pr;
}

/** 0 – 6.4 s: "Some people are born with something in their head that never lets them rest." */
export const BrainScene: React.FC = () => (
  <CanvasScene
    draw={(ctx, t) => {
      const dive = rng01(t, 5.7, 6.55, ease.inCubic);
      const cam: BrainCam = {
        ry: -1.25 + 0.2 * t,
        rx: 0.16 - 0.02 * t,
        scale: lerp(330, 400, ease.inOutSine(t / 6)) * (1 + 7 * dive),
        cx: W / 2 + 20,
        cy: H / 2 - 10,
        dist: 4,
        alpha: rng01(t, 0.2, 1.8, ease.outCubic) * (1 - dive),
        rate:
          rng01(t, w("born", 6) - 0.5, w("rest", 4), ease.inOut) * 1.6 + 0.08,
        spark: rng01(t, w("born", 8) - 0.3, w("born", 8) + 0.6),
      };
      // dive into the spark: shift the centre so the spark stays put on screen
      const sp = rotX(rotY(SPARK_P, cam.ry), cam.rx);
      cam.cx -= sp[0] * (cam.scale - 400) * 0.9 * dive;
      cam.cy += sp[1] * (cam.scale - 400) * 0.9 * dive;
      drawBrain(ctx, t, cam);
      if (dive > 0) {
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, W / 2, H / 2, 120 + 600 * dive, dive * 0.6);
        ctx.globalCompositeOperation = "source-over";
      }
    }}
  />
);

// ------------------------------------------------------------------ a neuron that grows by itself, then ignites into the spark
type Seg = {
  pts: [number, number][];
  w: number;
  t0: number;
  t1: number;
  d: number;
};
function makeNeuron(seed: number): Seg[] {
  const r = mulberry(seed);
  const segs: Seg[] = [];
  const branch = (
    x: number,
    y: number,
    ang: number,
    len: number,
    wd: number,
    d: number,
    t0: number,
  ) => {
    const pts: [number, number][] = [[x, y]];
    const n = 14;
    for (let i = 0; i < n; i++) {
      ang += (r() - 0.5) * 0.32;
      x += (Math.cos(ang) * len) / n;
      y += (Math.sin(ang) * len) / n;
      pts.push([x, y]);
    }
    const t1 = t0 + 0.22 + 0.06 * r();
    segs.push({ pts, w: wd, t0, t1, d });
    if (d < 4) {
      const kids = d < 2 ? 2 + (r() < 0.4 ? 1 : 0) : 2;
      for (let k = 0; k < kids; k++) {
        const sp = (k - (kids - 1) / 2) * (0.5 + r() * 0.35);
        branch(
          x,
          y,
          ang + sp,
          len * (0.58 + r() * 0.15),
          wd * 0.62,
          d + 1,
          t1 - 0.04,
        );
      }
    }
  };
  const arms = 7;
  for (let a = 0; a < arms; a++) {
    const ang = (a / arms) * Math.PI * 2 + r() * 0.4;
    branch(
      Math.cos(ang) * 34,
      Math.sin(ang) * 30,
      ang,
      190 + r() * 90,
      9,
      0,
      r() * 0.06,
    );
  }
  // the axon: one long trunk
  branch(40, 10, 0.12, 520, 7, 2, 0.05);
  return segs;
}
const NEURONS: Record<number, Seg[]> = {};
const neuron = (seed: number) => (NEURONS[seed] ??= makeNeuron(seed));

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  g: number,
  t: number,
  alpha: number,
  pulses: boolean,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of segs) {
    const f = clamp01((g - s.t0) / (s.t1 - s.t0));
    if (f <= 0) continue;
    const n = Math.max(2, Math.ceil(f * (s.pts.length - 1)) + 1);
    ctx.strokeStyle = `rgba(232,236,245,${alpha * (0.85 - s.d * 0.12)})`;
    ctx.lineWidth = s.w * (1 - 0.35 * f);
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
    ctx.stroke();
    if (pulses && f >= 1 && s.d <= 2) {
      const per = 1.3 + hash(s.pts[0][0]) * 1.4;
      const u = 1 - ((t + hash(s.pts[0][1]) * 3) % per) / per;
      const k = u * (s.pts.length - 1);
      const i0 = Math.floor(k),
        fr = k - i0;
      const p0 = s.pts[i0],
        p1 = s.pts[Math.min(i0 + 1, s.pts.length - 1)];
      ctx.globalCompositeOperation = "lighter";
      glow(
        ctx,
        lerp(p0[0], p1[0], fr),
        lerp(p0[1], p1[1], fr),
        16,
        alpha * 0.9 * Math.sin(Math.PI * u),
      );
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

let EMBERS: { d: V3; v: number; ph: number; s: number }[] | null = null;
const embers = () => {
  if (EMBERS) return EMBERS;
  const r = mulberry(21);
  EMBERS = Array.from({ length: 220 }, () => {
    const u = r() * 2 - 1,
      a = r() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    return {
      d: [s * Math.cos(a), u, s * Math.sin(a)] as V3,
      v: 0.4 + r() * 1.4,
      ph: r() * 10,
      s: 0.6 + r() * 1.6,
    };
  });
  return EMBERS;
};

/** 6.3 – 13.7 s: "Nobody teaches it to them and nobody can take it away, it's a spark they carry from the very beginning." */
const sparkZoom = (t: number, sparkAt: number) =>
  lerp(0.62, 1.0, ease.inOutSine(t / 4.5)) *
  (1 + 1.6 * rng01(t, sparkAt - 0.4, sparkAt + 1.4, ease.inOut));

export const SparkScene: React.FC<{ from: number }> = ({ from }) => (
  <>
    <CanvasScene
      style={{ filter: "blur(6px)" }}
      draw={(ctx, T) => {
        const t = T - from;
        const sparkAt = w("spark", 2) - from;
        const ign = rng01(t, sparkAt - 0.15, sparkAt + 0.25, ease.outCubic);
        const zoom = sparkZoom(t, sparkAt);
        const fadeIn = rng01(t, 0, 0.6, ease.outCubic);
        // depth: soft neurons far behind
        ctx.save();
        for (const [seed, x, y, sc, rot] of [
          [3, 380, 260, 0.55, 0.8],
          [8, 1580, 820, 0.6, 2.2],
          [12, 1500, 210, 0.42, 4.1],
        ] as const) {
          ctx.setTransform(
            sc * zoom,
            0,
            0,
            sc * zoom,
            W / 2 + (x - W / 2) * zoom,
            H / 2 + (y - H / 2) * zoom,
          );
          ctx.rotate(rot + t * 0.03);
          drawNeuron(
            ctx,
            neuron(seed),
            1.6,
            t,
            0.22 * fadeIn * (1 - ign * 0.7),
            false,
          );
        }
        ctx.restore();
      }}
    />
    <CanvasScene
      draw={(ctx, T) => {
        const t = T - from;
        const sparkAt = w("spark", 2) - from;
        const ign = rng01(t, sparkAt - 0.15, sparkAt + 0.25, ease.outCubic);
        const zoom = sparkZoom(t, sparkAt);
        const fadeIn = rng01(t, 0, 0.6, ease.outCubic);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        ctx.rotate(-0.25 + t * 0.035);
        const g = rng01(t, 0.05, w("away", 2) - from, (x) => x) * 1.3;
        drawNeuron(ctx, neuron(1), g, t, fadeIn * (1 - 0.85 * ign), true);
        // the cell body
        const body = 0.7 * fadeIn * (1 - ign);
        ctx.fillStyle = `rgba(235,238,245,${body})`;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const a = (i / 40) * Math.PI * 2;
          const rr =
            44 + 7 * Math.sin(a * 3 + t) + 4 * Math.sin(a * 5 - t * 1.3);
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.fill();
        ctx.restore();
        // "…take it away": a shockwave protects the core
        const sw = rng01(
          t,
          w("away", 5) - from - 0.1,
          w("away", 5) - from + 0.9,
          ease.outCubic,
        );
        if (sw > 0 && sw < 1) {
          ctx.strokeStyle = `rgba(240,244,255,${(1 - sw) * 0.6})`;
          ctx.lineWidth = 2 + 6 * (1 - sw);
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, 60 + 520 * sw * zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "lighter";
        // nucleus: a glow even before ignition
        const pulse = 0.8 + 0.2 * Math.sin(t * 6.1);
        glow(ctx, W / 2, H / 2, 46 * zoom, fadeIn * 0.6 * pulse);
        // ignition
        if (ign > 0) {
          const ts = t - sparkAt;
          const burst = Math.exp(-Math.max(0, ts) / 0.5);
          flare(
            ctx,
            W / 2,
            H / 2,
            Math.min(1, ign * (0.55 + 0.45 * burst)),
            700 + 500 * burst,
            40 + 40 * burst,
          );
          for (const e of embers()) {
            const age = Math.max(0, ts);
            const dist = e.v * 520 * (1 - Math.exp(-age * 2.2)) + age * 30;
            const p = rotY(e.d.map((c) => c * dist) as V3, t * 0.4);
            const s = proj(p, 1, 900);
            const fl = 0.5 + 0.5 * Math.sin(T * 9 + e.ph * 5);
            const a = ign * fl * Math.exp(-age / 2.4) * clamp01(age * 8);
            glow(ctx, s.x, s.y, 7 * e.s * s.k, a);
          }
        }
        // the end: the spark flares to white (it becomes lightning)
        const out = rng01(t, 13.35 - from, 13.75 - from, ease.inCubic);
        if (out > 0) {
          ctx.fillStyle = `rgba(255,255,255,${out})`;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.globalCompositeOperation = "source-over";
      }}
    />
  </>
);
