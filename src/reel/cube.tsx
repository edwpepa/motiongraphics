import { clamp01, fbm, glow, hash, lerp, mulberry, noise3, proj, rotX, rotY, V3 } from "../edw/kit";
import { RH, RW } from "./rk";

// ------------------------------------------------------------------ the glass cube: the simulated world, the hero object of the film
export type Cam = { cx: number; cy: number; s: number; yaw: number; pitch: number; D?: number };
export type Pt = { x: number; y: number; k: number; z: number };

export const rot = (cam: Cam, p: V3): V3 => rotX(rotY(p, cam.yaw), cam.pitch);
/** cube-local point (the cube spans [-1, 1]³) to camera space, in pixels */
export const world = (cam: Cam, q: V3): V3 => rot(cam, [q[0] * cam.s, q[1] * cam.s, q[2] * cam.s]);
export const P = (cam: Cam, q: V3): Pt => proj(world(cam, q), 1, cam.D ?? 1500, cam.cx, cam.cy);
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const VX: V3[] = Array.from({ length: 8 }, (_, i) => [i & 4 ? 1 : -1, i & 2 ? 1 : -1, i & 1 ? 1 : -1]);
export const FACES: { n: V3; q: number[]; t1: V3; t2: V3 }[] = [
  { n: [1, 0, 0], q: [4, 5, 7, 6], t1: [0, 1, 0], t2: [0, 0, 1] },
  { n: [-1, 0, 0], q: [0, 1, 3, 2], t1: [0, 1, 0], t2: [0, 0, 1] },
  { n: [0, 1, 0], q: [2, 3, 7, 6], t1: [1, 0, 0], t2: [0, 0, 1] },
  { n: [0, -1, 0], q: [0, 1, 5, 4], t1: [1, 0, 0], t2: [0, 0, 1] },
  { n: [0, 0, 1], q: [1, 3, 7, 5], t1: [1, 0, 0], t2: [0, 1, 0] },
  { n: [0, 0, -1], q: [0, 2, 6, 4], t1: [1, 0, 0], t2: [0, 1, 0] },
];
/** [a, b, face, other face] */
export const EDGES: [number, number, number, number][] = (() => {
  const out: [number, number, number, number][] = [];
  FACES.forEach((f, fi) =>
    f.q.forEach((a, k) => {
      const b = f.q[(k + 1) % 4];
      const e = out.find((x) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a));
      if (e) e[3] = fi;
      else out.push([a, b, fi, -1]);
    }),
  );
  return out;
})();
export const facePoint = (f: number, u: number, v: number): V3 => {
  const F = FACES[f];
  return [F.n[0] + u * F.t1[0] + v * F.t2[0], F.n[1] + u * F.t1[1] + v * F.t2[1], F.n[2] + u * F.t1[2] + v * F.t2[2]];
};

/** which panes face the camera */
export function facing(cam: Cam) {
  const D = cam.D ?? 1500;
  return FACES.map((f) => {
    const n = rot(cam, f.n);
    const c = world(cam, f.n);
    return n[0] * c[0] + n[1] * c[1] + n[2] * (c[2] + D) < 0;
  });
}

const line = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt) => {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

/** the panes and edges of the cube; draw "back" first, the contents, then "front" */
export function glass(ctx: CanvasRenderingContext2D, cam: Cam, layer: "back" | "front", a: number, o: { edge?: number; face?: number; spec?: number; draw?: number } = {}) {
  if (a <= 0.002 || cam.s < 0.5) return;
  const front = facing(cam);
  const pts = VX.map((v) => P(cam, v));
  const want = layer === "front";
  const fa = (o.face ?? 1) * a;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  FACES.forEach((f, i) => {
    if (front[i] !== want || fa <= 0.002) return;
    const q = f.q.map((j) => pts[j]);
    ctx.beginPath();
    q.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    // light falls from above: the lid is the brightest pane
    const lit = 0.55 + 0.45 * f.n[1];
    if (want) {
      const g = ctx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
      const u = 0.5 + 0.42 * Math.sin(cam.yaw * 1.3 + i * 1.7);
      const base = (0.014 + 0.026 * lit) * fa;
      const sp = 0.07 * (o.spec ?? 1) * fa;
      g.addColorStop(0, `rgba(215,225,245,${base})`);
      g.addColorStop(clamp01(u - 0.17), `rgba(215,225,245,${base})`);
      g.addColorStop(u, `rgba(236,242,255,${base + sp})`);
      g.addColorStop(clamp01(u + 0.17), `rgba(215,225,245,${base})`);
      g.addColorStop(1, `rgba(215,225,245,${base * 0.5})`);
      ctx.fillStyle = g;
    } else ctx.fillStyle = `rgba(200,210,235,${(0.01 + 0.022 * lit) * fa})`;
    ctx.fill();
  });
  ctx.globalCompositeOperation = "lighter";
  const ea = (o.edge ?? 1) * a;
  const dr = o.draw ?? 1;
  for (const [i, j, f1, f2] of EDGES) {
    if ((front[f1] || front[f2]) !== want) continue;
    const A = pts[i], B = pts[j];
    if (dr < 1) {
      // edges grow out from both corners towards their middle
      const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, k: 1, z: 0 };
      const h = dr;
      ctx.strokeStyle = `rgba(238,243,255,${(want ? 0.78 : 0.22) * ea})`;
      ctx.lineWidth = want ? 1.5 : 1.1;
      line(ctx, A, { ...m, x: lerp(A.x, m.x, h), y: lerp(A.y, m.y, h) });
      line(ctx, B, { ...m, x: lerp(B.x, m.x, h), y: lerp(B.y, m.y, h) });
      continue;
    }
    if (want) {
      ctx.strokeStyle = `rgba(215,228,255,${0.07 * ea})`;
      ctx.lineWidth = 7;
      line(ctx, A, B);
    }
    ctx.strokeStyle = `rgba(238,243,255,${(want ? 0.8 : 0.22) * ea})`;
    ctx.lineWidth = want ? 1.5 : 1.1;
    line(ctx, A, B);
  }
  if (want) pts.forEach((p) => glow(ctx, p.x, p.y, 10, 0.3 * ea));
  ctx.restore();
}

// ------------------------------------------------------------------ the land inside it
export const TN = 26;
const TX = (i: number) => -0.94 + (1.88 * i) / TN;
export const hgt = (x: number, z: number) => {
  const n = clamp01((fbm(x * 1.25 + 7.3, z * 1.25 + 2.1, 0.5) - 0.3) / 0.42);
  const rid = 1 - Math.abs(fbm(x * 2.2 + 1.7, z * 2.2 + 9.2, 1.3) * 2 - 1);
  const edge = clamp01((0.94 - Math.max(Math.abs(x), Math.abs(z))) / 0.3);
  return (0.04 + 0.52 * Math.pow(n, 1.6) + 0.08 * rid) * (0.3 + 0.7 * edge);
};
let HG: Float32Array | null = null;
const grid = () => {
  if (HG) return HG;
  const N = TN + 1;
  HG = new Float32Array(N * N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) HG[i * N + j] = hgt(TX(i), TX(j));
  return HG;
};
/** terrain height (cube-local, above the floor) at (x, z), bilinear on the grid */
export const hAt = (x: number, z: number) => {
  const H = grid(), N = TN + 1;
  const fi = clamp01((x + 0.94) / 1.88) * TN, fj = clamp01((z + 0.94) / 1.88) * TN;
  const i = Math.min(TN - 1, Math.floor(fi)), j = Math.min(TN - 1, Math.floor(fj));
  const u = fi - i, v = fj - j;
  return lerp(lerp(H[i * N + j], H[(i + 1) * N + j], u), lerp(H[i * N + j + 1], H[(i + 1) * N + j + 1], u), v);
};
export const groundY = (x: number, z: number, rise = 1) => -0.99 + hAt(x, z) * rise;

/** the land as a fine wire mesh; light is a function of the surface normal (cube-local) */
export function terrain(ctx: CanvasRenderingContext2D, cam: Cam, a: number, o: { rise: number; reveal?: number; light?: (n: V3) => number; tint?: number }) {
  if (a <= 0.002) return;
  const H = grid(), N = TN + 1;
  const pts: Pt[] = new Array(N * N);
  const lum = new Float32Array(N * N);
  const rv = o.reveal ?? 1;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const k = i * N + j, x = TX(i), z = TX(j);
      const vis = clamp01((rv * 1.5 - Math.hypot(x, z)) / 0.28);
      const r = o.rise * vis;
      pts[k] = P(cam, [x, -0.99 + H[k] * r, z]);
      let l = vis;
      if (o.light) {
        const dx = (H[Math.min(N - 1, i + 1) * N + j] - H[Math.max(0, i - 1) * N + j]) * r * (TN / 3.76);
        const dz = (H[i * N + Math.min(N - 1, j + 1)] - H[i * N + Math.max(0, j - 1)]) * r * (TN / 3.76);
        const m = Math.hypot(dx, 1, dz);
        l *= o.light([-dx / m, 1 / m, -dz / m]);
      }
      // nearer is brighter
      l *= clamp01(0.78 - pts[k].z / (cam.s * 3.2));
      lum[k] = l;
    }
  const B = 8;
  const paths = Array.from({ length: B }, () => new Path2D());
  const seg = (p: number, q: number) => {
    const l = (lum[p] + lum[q]) / 2;
    if (l < 0.03) return;
    const b = Math.min(B - 1, Math.floor(l * B));
    paths[b].moveTo(pts[p].x, pts[p].y);
    paths[b].lineTo(pts[q].x, pts[q].y);
  };
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (i < TN) seg(i * N + j, (i + 1) * N + j);
      if (j < TN) seg(i * N + j, i * N + j + 1);
    }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 1;
  for (let b = 0; b < B; b++) {
    ctx.strokeStyle = `rgba(222,230,248,${a * 0.5 * ((b + 0.5) / B)})`;
    ctx.stroke(paths[b]);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the people of that world
export type Ag = { x: number; z: number; ph: number; sp: number };
export const SIMS: Ag[] = (() => {
  const r = mulberry(41);
  const out: Ag[] = [];
  while (out.length < 40) {
    const x = (r() * 2 - 1) * 0.78, z = (r() * 2 - 1) * 0.78;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.17)) continue;
    out.push({ x, z, ph: r() * 6.28, sp: 0.4 + r() * 0.5 });
  }
  return out;
})();
export const simAt = (g: Ag, T: number, rise = 1): V3 => {
  const x = g.x + 0.045 * Math.sin(T * g.sp + g.ph), z = g.z + 0.045 * Math.cos(T * g.sp * 0.8 + g.ph * 1.3);
  return [x, groundY(x, z, rise) + 0.02, z];
};

/** a civilisation: lights that spread over the land, roads between them, towers */
export type City = { x: number; z: number; t: number; to: number; tower: number };
export const CITY: City[] = (() => {
  const r = mulberry(88);
  const seeds = [[0.05, 0.1], [-0.55, -0.42], [0.52, -0.5], [-0.42, 0.56], [0.6, 0.46]];
  const out: City[] = seeds.map(([x, z], i) => ({ x, z, t: i * 0.04, to: -1, tower: 0.13 }));
  const M = 300;
  for (let tries = 0; out.length < M && tries < 40000; tries++) {
    const p = out[Math.floor(r() * out.length)];
    const ang = r() * 6.28, d = 0.07 + r() * 0.12;
    const x = p.x + Math.cos(ang) * d, z = p.z + Math.sin(ang) * d;
    if (Math.abs(x) > 0.88 || Math.abs(z) > 0.88) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.04)) continue;
    out.push({ x, z, t: out.length / M, to: out.indexOf(p), tower: r() < 0.1 ? 0.04 + r() * 0.12 : 0 });
  }
  return out;
})();
/** the civilisation grown to fraction g (0..1) */
export function city(ctx: CanvasRenderingContext2D, cam: Cam, g: number, a: number, T: number) {
  if (a <= 0.002 || g <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const P3 = CITY.map((c) => [c.x, groundY(c.x, c.z) + 0.012, c.z] as V3);
  const S = P3.map((q) => P(cam, q));
  // roads
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(230,236,250,${0.26 * a})`;
  ctx.beginPath();
  CITY.forEach((c, i) => {
    if (c.to < 0) return;
    const f = clamp01((g - c.t) / 0.06);
    if (f <= 0) return;
    const A = S[c.to], B = S[i];
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(lerp(A.x, B.x, f), lerp(A.y, B.y, f));
  });
  ctx.stroke();
  // towers
  CITY.forEach((c, i) => {
    const f = clamp01((g - c.t) / 0.08);
    if (f <= 0 || !c.tower) return;
    const top = P(cam, [P3[i][0], P3[i][1] + c.tower * f, P3[i][2]]);
    ctx.strokeStyle = `rgba(240,244,255,${0.6 * a})`;
    ctx.lineWidth = 1.4;
    line(ctx, S[i], top);
    glow(ctx, top.x, top.y, 5, 0.7 * a * (0.7 + 0.3 * Math.sin(T * 5 + i)));
  });
  // lights
  CITY.forEach((c, i) => {
    const f = clamp01((g - c.t) / 0.05);
    if (f <= 0) return;
    const s = (1.3 + 1.1 * f) * Math.min(1.3, S[i].k);
    ctx.fillStyle = `rgba(246,246,240,${0.8 * a * f})`;
    ctx.fillRect(S[i].x - s / 2, S[i].y - s / 2, s, s);
    if (i % 6 === 0) glow(ctx, S[i].x, S[i].y, 10, 0.16 * a * f);
  });
  ctx.restore();
}

// ------------------------------------------------------------------ a mind: a generative glyph, unique to its seed
type Ring = { r: number; kind: number; n: number; spd: number; ph: number; arcs: [number, number][]; al: number };
type GDef = { rings: Ring[]; sparks: { ring: number; spd: number; ph: number }[] };
const GD = new Map<number, GDef>();
const gdef = (seed: number): GDef => {
  const c = GD.get(seed);
  if (c) return c;
  const r = mulberry(seed * 7919 + 13);
  const nR = 4 + Math.floor(r() * 3);
  const rings: Ring[] = [];
  for (let k = 0; k < nR; k++) {
    const last = k === nR - 1;
    const kind = k === 0 ? 0 : last ? (r() < 0.55 ? 4 : 5) : [0, 1, 2, 3, 2, 1][Math.floor(r() * 6)];
    const arcs: [number, number][] = [];
    const na = 1 + Math.floor(r() * 3);
    for (let q = 0; q < na; q++) {
      const st = r() * 6.28;
      arcs.push([st, st + 0.5 + r() * (6.28 / na - 0.8)]);
    }
    rings.push({ r: 0.2 + (0.8 * (k + 1)) / nR - r() * 0.04, kind, n: [1, 12 + Math.floor(r() * 36), 0, 8 + Math.floor(r() * 26), 56 + Math.floor(r() * 40), 24 + Math.floor(r() * 36)][kind], spd: (r() - 0.5) * 0.7, ph: r() * 6.28, arcs, al: 0.5 + 0.5 * r() });
  }
  const sparks = Array.from({ length: 3 + Math.floor(r() * 4) }, () => ({ ring: 1 + Math.floor(r() * (nR - 1)), spd: (0.6 + r() * 1.2) * (r() < 0.5 ? -1 : 1), ph: r() * 6.28 }));
  const d = { rings, sparks };
  GD.set(seed, d);
  return d;
};

export type GlyphOpt = { grow: number; ideas: number; mature: number; think?: number; a: number; T: number; field?: (x: number, y: number) => number };
export function glyph(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, seed: number, o: GlyphOpt) {
  if (o.a <= 0.003 || R < 1) return;
  if (x + R < 0 || x - R > RW || y + R < 0 || y - R > RH) return;
  const d = gdef(seed);
  const nR = d.rings.length;
  const T = o.T;
  const steps = R > 160 ? 120 : R > 70 ? 72 : 44;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const lw = Math.max(0.8, Math.min(1.6, R / 120));
  // the shape the life has taken: each ring bends a little, by temperament and by surroundings
  const rad = (k: number, th: number) => {
    const rg = d.rings[k];
    let m = 1;
    if (o.mature > 0) {
      m += o.mature * 0.11 * (noise3(Math.cos(th) * 1.6 + seed * 3.1, Math.sin(th) * 1.6 + k, k * 0.37 + T * 0.05) - 0.5) * 2;
      if (o.field) {
        const px = x + Math.cos(th) * rg.r * R, py = y + Math.sin(th) * rg.r * R;
        m += o.mature * 0.13 * (o.field(px, py) - 0.5) * 2;
      }
    }
    return rg.r * R * m;
  };
  d.rings.forEach((rg, k) => {
    const g = clamp01(o.grow * nR - k);
    if (g <= 0) return;
    const al = o.a * rg.al * (0.55 + 0.45 * g);
    const rot = rg.ph + rg.spd * T;
    const sweep = g * Math.PI * 2;
    ctx.strokeStyle = `rgba(234,240,252,${al * 0.85})`;
    ctx.fillStyle = `rgba(240,244,255,${al})`;
    ctx.lineWidth = lw;
    if (rg.kind === 0 || rg.kind === 2) {
      const spans: [number, number][] = rg.kind === 0 ? [[0, Math.PI * 2]] : rg.arcs;
      ctx.beginPath();
      for (const [s0, s1] of spans) {
        const e = Math.min(s1, s0 + sweep);
        const n = Math.max(4, Math.ceil(((e - s0) / (Math.PI * 2)) * steps));
        for (let i = 0; i <= n; i++) {
          const th = rot + lerp(s0, e, i / n);
          const r = rad(k, th);
          const px = x + Math.cos(th) * r, py = y + Math.sin(th) * r;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
      }
      ctx.stroke();
    } else if (rg.kind === 1 || rg.kind === 3) {
      const n = rg.n;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const t0 = (i / n) * Math.PI * 2;
        if (t0 > sweep) break;
        const th = rot + t0;
        if (rg.kind === 1) {
          const t1 = th + (Math.PI * 2 * 0.45) / n;
          const r0 = rad(k, th), r1 = rad(k, t1);
          ctx.moveTo(x + Math.cos(th) * r0, y + Math.sin(th) * r0);
          ctx.lineTo(x + Math.cos(t1) * r1, y + Math.sin(t1) * r1);
        } else {
          const r0 = rad(k, th);
          const s = Math.max(1.5, R / 70);
          ctx.rect(x + Math.cos(th) * r0 - s / 2, y + Math.sin(th) * r0 - s / 2, s, s);
        }
      }
      rg.kind === 1 ? ctx.stroke() : ctx.fill();
    } else {
      // a ring of radial lines: a spectrum that moves while it thinks, or the ticks of a dial
      const n = rg.n;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const t0 = (i / n) * Math.PI * 2;
        if (t0 > sweep) break;
        const th = rot * 0.5 + t0;
        const r0 = rad(k, th);
        const len =
          rg.kind === 4
            ? R * 0.1 * (0.25 + 0.75 * noise3(Math.cos(th) * 2 + seed, Math.sin(th) * 2, T * (0.6 + 2.2 * (o.think ?? 0))))
            : R * (i % 4 === 0 ? 0.07 : 0.03);
        ctx.moveTo(x + Math.cos(th) * r0, y + Math.sin(th) * r0);
        ctx.lineTo(x + Math.cos(th) * (r0 + len), y + Math.sin(th) * (r0 + len));
      }
      ctx.stroke();
    }
  });
  // its ideas: sparks running the rings
  if (o.ideas > 0)
    d.sparks.forEach((s, i) => {
      const k = Math.min(s.ring, nR - 1);
      const sp = s.spd * (1 + 1.5 * (o.think ?? 0));
      const th = s.ph + sp * T;
      const al = o.a * clamp01(o.ideas * d.sparks.length - i);
      if (al <= 0) return;
      ctx.lineWidth = lw * 1.4;
      const n = 10;
      for (let j = 0; j < n; j++) {
        const a0 = th - Math.sign(sp) * j * 0.05, a1 = th - Math.sign(sp) * (j + 1) * 0.05;
        const r0 = rad(k, a0), r1 = rad(k, a1);
        ctx.strokeStyle = `rgba(245,248,255,${al * (1 - j / n) * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a0) * r0, y + Math.sin(a0) * r0);
        ctx.lineTo(x + Math.cos(a1) * r1, y + Math.sin(a1) * r1);
        ctx.stroke();
      }
      const r0 = rad(k, th);
      glow(ctx, x + Math.cos(th) * r0, y + Math.sin(th) * r0, Math.max(5, R * 0.06), 0.9 * al);
    });
  // the core
  glow(ctx, x, y, Math.max(6, R * 0.16), 0.55 * o.a * clamp01(o.grow * 4));
  const cs = Math.max(2, R * 0.025);
  ctx.fillStyle = `rgba(255,255,255,${o.a * clamp01(o.grow * 4)})`;
  ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs);
  ctx.restore();
}

// ------------------------------------------------------------------ topographic lines of a scalar field (marching squares)
export function contours(ctx: CanvasRenderingContext2D, f: (x: number, y: number) => number, levels: number[], cell: number, a: number, alphaAt?: (x: number, y: number) => number) {
  if (a <= 0.002) return;
  const nx = Math.ceil(RW / cell), ny = Math.ceil(RH / cell);
  const v = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) v[i * (ny + 1) + j] = f(i * cell, j * cell);
  const B = 5;
  const paths = Array.from({ length: B }, () => new Path2D());
  for (const L of levels)
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const va = v[i * (ny + 1) + j], vb = v[(i + 1) * (ny + 1) + j], vc = v[(i + 1) * (ny + 1) + j + 1], vd = v[i * (ny + 1) + j + 1];
        const c = (va > L ? 8 : 0) | (vb > L ? 4 : 0) | (vc > L ? 2 : 0) | (vd > L ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const x = i * cell, y = j * cell;
        const top = (): [number, number] => [x + ((L - va) / (vb - va)) * cell, y];
        const right = (): [number, number] => [x + cell, y + ((L - vb) / (vc - vb)) * cell];
        const bottom = (): [number, number] => [x + ((L - vd) / (vc - vd)) * cell, y + cell];
        const left = (): [number, number] => [x, y + ((L - va) / (vd - va)) * cell];
        const al = alphaAt ? alphaAt(x, y) : 1;
        if (al <= 0.02) continue;
        const p = paths[Math.min(B - 1, Math.floor(al * B))];
        const S = (A: [number, number], C: [number, number]) => {
          p.moveTo(A[0], A[1]);
          p.lineTo(C[0], C[1]);
        };
        switch (c) {
          case 1: case 14: S(left(), bottom()); break;
          case 2: case 13: S(bottom(), right()); break;
          case 3: case 12: S(left(), right()); break;
          case 4: case 11: S(top(), right()); break;
          case 6: case 9: S(top(), bottom()); break;
          case 7: case 8: S(top(), left()); break;
          case 5: S(top(), right()); S(left(), bottom()); break;
          case 10: S(top(), left()); S(bottom(), right()); break;
        }
      }
  ctx.save();
  ctx.lineWidth = 1;
  for (let b = 0; b < B; b++) {
    ctx.strokeStyle = `rgba(222,230,246,${a * ((b + 0.5) / B)})`;
    ctx.stroke(paths[b]);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ a tesseract: the cube, turned through a fourth direction
const TV: number[][] = Array.from({ length: 16 }, (_, i) => [i & 8 ? 1 : -1, i & 4 ? 1 : -1, i & 2 ? 1 : -1, i & 1 ? 1 : -1]);
const TE: [number, number][] = [];
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) if (!(i & (1 << b))) TE.push([i, i | (1 << b)]);
/** th: rotation in the x–w plane; inner: 0..1 the inner cube grows from the centre; link: 0..1 the struts between them draw in */
export function tesseract(ctx: CanvasRenderingContext2D, cam: Cam, th: number, inner: number, link: number, a: number, th2 = 0) {
  if (a <= 0.002) return;
  const dw = 2.4, norm = (dw - 1) / dw;
  const c = Math.cos(th), s = Math.sin(th), c2 = Math.cos(th2), s2 = Math.sin(th2);
  const W: number[] = [];
  const pts = TV.map((v) => {
    let [x, y, z, w] = v;
    [x, w] = [x * c - w * s, x * s + w * c];
    [y, w] = [y * c2 - w * s2, y * s2 + w * c2];
    let f = (dw / (dw - w)) * norm;
    if (v[3] < 0) f *= inner;
    W.push(w);
    return P(cam, [x * f, y * f, z * f]);
  });
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [i, j] of TE) {
    const strut = (i ^ j) === 1;
    let A = pts[i], B = pts[j];
    if (strut) {
      if (link <= 0) continue;
      // from the outer corner towards the inner one
      const [o, n] = TV[i][3] > 0 ? [A, B] : [B, A];
      A = o;
      B = { ...n, x: lerp(o.x, n.x, link), y: lerp(o.y, n.y, link) };
    } else if (TV[i][3] < 0 && inner <= 0.01) continue;
    const wd = (W[i] + W[j]) / 2;
    const depth = clamp01(0.72 - (A.z + B.z) / (4 * cam.s * 1.8));
    const al = a * (0.3 + 0.7 * ((wd + 1) / 2)) * (0.45 + 0.55 * depth);
    ctx.strokeStyle = `rgba(215,228,255,${al * 0.08})`;
    ctx.lineWidth = 7;
    line(ctx, A, B);
    ctx.strokeStyle = `rgba(240,245,255,${al * 0.85})`;
    ctx.lineWidth = 1.4;
    line(ctx, A, B);
  }
  pts.forEach((p, i) => {
    if (TV[i][3] < 0 && inner <= 0.01) return;
    glow(ctx, p.x, p.y, 9, 0.45 * a * (0.4 + 0.6 * (W[i] + 1) / 2));
  });
  ctx.restore();
}

// ------------------------------------------------------------------ a planet: a dark disc lit on one side
export function planet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, light = -2.2) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(5,6,8,${a})`;
  ctx.fill();
  ctx.clip();
  const lx = x + Math.cos(light) * r * 0.75, ly = y + Math.sin(light) * r * 0.75;
  const g = ctx.createRadialGradient(lx, ly, r * 0.05, lx, ly, r * 1.5);
  g.addColorStop(0, `rgba(226,232,246,${0.3 * a})`);
  g.addColorStop(0.45, `rgba(200,210,232,${0.07 * a})`);
  g.addColorStop(1, "rgba(200,210,232,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, al] of [[6, 0.06], [1.4, 0.7]] as const) {
    ctx.strokeStyle = `rgba(228,236,255,${al * a})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y, r, light - 1.35, light + 1.35);
    ctx.stroke();
  }
  ctx.restore();
}

/** a soft vertical shaft of light, top to y1 */
export function beam(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, wd: number, a: number) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const n = 24;
  for (let i = 0; i < n; i++) {
    const ya = lerp(y0, y1, i / n), yb = lerp(y0, y1, (i + 1) / n);
    const u = (i + 0.5) / n;
    const al = a * (0.35 + 0.65 * u) * Math.min(1, u / 0.3);
    const ww = wd * (0.75 + 0.25 * u);
    const g = ctx.createLinearGradient(x - ww, 0, x + ww, 0);
    g.addColorStop(0, "rgba(230,236,255,0)");
    g.addColorStop(0.35, `rgba(230,236,255,${al * 0.1})`);
    g.addColorStop(0.5, `rgba(245,248,255,${al * 0.32})`);
    g.addColorStop(0.65, `rgba(230,236,255,${al * 0.1})`);
    g.addColorStop(1, "rgba(230,236,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - ww, ya, ww * 2, yb - ya + 0.5);
  }
  ctx.restore();
}

export const hashPick = (i: number, n: number) => Math.floor(hash(i) * n) % n;
