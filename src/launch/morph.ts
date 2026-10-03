import { LOGO_PTS } from "./logoShape";

/**
 * Shape morphing engine. Every shape is a closed outline in a 100×100 box centred on 0, resampled
 * to N points by arc length with the same winding; morphs line points up by the best rotation and
 * blend them, with an optional liquid wobble in the middle of the move.
 */
export type Pt = [number, number];
export const N = 180;

const area = (p: Pt[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % p.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
};

export const resample = (poly: Pt[], n = N): Pt[] => {
  const pts = area(poly) < 0 ? [...poly].reverse() : poly;
  const segs: number[] = [0];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    segs.push(segs[i] + Math.hypot(x1 - x0, y1 - y0));
  }
  const L = segs[segs.length - 1];
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * L;
    while (j < pts.length - 1 && segs[j + 1] < s) j++;
    const t = (s - segs[j]) / Math.max(1e-9, segs[j + 1] - segs[j]);
    const [x0, y0] = pts[j];
    const [x1, y1] = pts[(j + 1) % pts.length];
    out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
  }
  return out;
};

// ---------------------------------------------------------------- primitives

const polar = (r: (th: number) => number, m = 360, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: m }, (_, i) => {
    const th = (i / m) * Math.PI * 2 + rot;
    const rr = r(th - rot);
    return [Math.cos(th) * rr, Math.sin(th) * rr];
  });

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, m = 16): Pt[] =>
  Array.from({ length: m }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / (m - 1);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/** rounded rectangle, starting at the top centre, clockwise (y down) */
export const roundRect = (w: number, h: number, r: number): Pt[] => {
  const x = w / 2;
  const y = h / 2;
  const P = Math.PI;
  return [
    [0, -y],
    ...arc(x - r, -y + r, r, -P / 2, 0),
    ...arc(x - r, y - r, r, 0, P / 2),
    ...arc(-x + r, y - r, r, P / 2, P),
    ...arc(-x + r, -y + r, r, P, (3 * P) / 2),
  ];
};

const quad = (a: Pt, c: Pt, b: Pt, m = 20): Pt[] =>
  Array.from({ length: m }, (_, i) => {
    const t = i / m;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  });

const SHAPES: Record<string, () => Pt[]> = {
  circle: () => polar(() => 46),
  dot: () => polar(() => 10),
  drop: () =>
    Array.from({ length: 360 }, (_, i) => {
      const t = (i / 360) * Math.PI * 2;
      return [36 * Math.sin(t) * Math.pow(Math.sin(t / 2), 1.1), -54 * Math.cos(t) + 8] as Pt;
    }),
  heart: () =>
    Array.from({ length: 360 }, (_, i) => {
      const t = (i / 360) * Math.PI * 2;
      return [2.9 * 16 * Math.pow(Math.sin(t), 3), -2.9 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 4] as Pt;
    }),
  square: () => roundRect(84, 84, 22),
  battery: () => roundRect(52, 92, 14),
  pill: () => roundRect(98, 40, 20),
  card: () => roundRect(70, 92, 12),
  note: () => roundRect(98, 52, 8),
  stroke: () => roundRect(150, 34, 17),
  star: () => polar((th) => 30 + 18 * Math.pow(0.5 + 0.5 * Math.cos(th * 5), 2.2)),
  spiky: () => polar((th) => 38 + 9 * Math.sin(th * 15) + 3 * Math.sin(th * 7)),
  badge: () => polar((th) => 44 + 3.2 * Math.cos(th * 12)),
  flower: () => polar((th) => 34 + 12 * Math.cos(th * 6)),
  shield: () => [
    [0, -46],
    ...quad([0, -46], [20, -36], [40, -38]),
    ...quad([40, -38], [44, 10], [0, 48]),
    ...quad([0, 48], [-44, 10], [-40, -38]),
    ...quad([-40, -38], [-20, -36], [0, -46]),
  ],
  bubble: () => {
    const w = 46;
    const h = 34;
    const r = 18;
    const P = Math.PI;
    return [
      [0, -h],
      ...arc(w - r, -h + r, r, -P / 2, 0),
      ...arc(w - r, h - r, r, 0, P / 2),
      [-w + 30, h],
      [-w + 8, h + 16],
      [-w + 14, h - 2],
      ...arc(-w + r, h - r, r, P / 2 + 0.5, P),
      ...arc(-w + r, -h + r, r, P, (3 * P) / 2),
    ];
  },
  house: () => [
    [0, -44],
    [44, -6],
    ...arc(36, 36, 8, -P2(), P2()),
    ...arc(-36, 36, 8, P2(), Math.PI),
    [-44, -6],
  ],
  logo: () => LOGO_PTS.map(([x, y]) => [x * 1.2, y * 1.2 + 2] as Pt),
};
function P2() {
  return Math.PI / 2;
}

export type ShapeName = keyof typeof SHAPES;
const CACHE: Record<string, Pt[]> = {};
export const shape = (name: ShapeName): Pt[] => (CACHE[name] ??= resample(SHAPES[name]()));

/** a living blob (same parametrisation as `circle`, so it morphs cleanly to and from it) */
export const blob = (t: number, amp = 1, seed = 0): Pt[] =>
  resample(
    polar((th) => 46 * (1 + amp * (0.07 * Math.sin(th * 2 + t * 1.3 + seed) + 0.05 * Math.sin(th * 3 - t * 1.7 + seed * 2) + 0.03 * Math.sin(th * 5 + t * 2.3))))
  );

// ---------------------------------------------------------------- morphing

const OFFSETS: Record<string, number> = {};
const bestOffset = (a: Pt[], b: Pt[], key?: string) => {
  if (key && key in OFFSETS) return OFFSETS[key];
  let best = 0;
  let bestD = Infinity;
  for (let o = 0; o < N; o += 2) {
    let d = 0;
    for (let i = 0; i < N; i += 3) {
      const p = a[i];
      const q = b[(i + o) % N];
      d += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  if (key) OFFSETS[key] = best;
  return best;
};

export const mix = (a: Pt[], b: Pt[], t: number, key?: string, wobble = 0, time = 0): Pt[] => {
  const o = bestOffset(a, b, key);
  const k = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  return a.map((p, i) => {
    const q = b[(i + o) % N];
    let x = p[0] + (q[0] - p[0]) * t;
    let y = p[1] + (q[1] - p[1]) * t;
    if (wobble > 0 && k > 0) {
      const th = Math.atan2(y, x);
      const r = 1 + wobble * k * (0.09 * Math.sin(th * 3 + time * 0.5) + 0.06 * Math.sin(th * 5 - time * 0.7));
      x *= r;
      y *= r;
    }
    return [x, y];
  });
};

export const morphNamed = (a: ShapeName, b: ShapeName, t: number, wobble = 0, time = 0) => mix(shape(a), shape(b), t, `${a}>${b}`, wobble, time);

/** closed smooth path through the points (Catmull–Rom → cubic Bézier) */
export const toPath = (p: Pt[], sx = 1, sy = sx, ox = 0, oy = 0): string => {
  const n = p.length;
  const X = (i: number) => p[(i + n) % n][0] * sx + ox;
  const Y = (i: number) => p[(i + n) % n][1] * sy + oy;
  let d = `M${X(0).toFixed(2)} ${Y(0).toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const c1x = X(i) + (X(i + 1) - X(i - 1)) / 6;
    const c1y = Y(i) + (Y(i + 1) - Y(i - 1)) / 6;
    const c2x = X(i + 1) - (X(i + 2) - X(i)) / 6;
    const c2y = Y(i + 1) - (Y(i + 2) - Y(i)) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${X(i + 1).toFixed(2)} ${Y(i + 1).toFixed(2)}`;
  }
  return d + "Z";
};

/**
 * Keyframed morph: `keys` are [frame, shape] pairs; between keys the outline morphs over `dur`
 * frames ending at the key frame, with an overshooting ease and liquid wobble.
 */
export const morphKeys = (frame: number, keys: Array<[number, ShapeName]>, dur = 12, wobble = 1): Pt[] => {
  let cur = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [kf, name] = keys[i];
    if (frame < kf - dur) break;
    if (frame < kf) {
      const t = (frame - (kf - dur)) / dur;
      const e = backOut(t);
      return mix(shape(cur), shape(name), e, `${cur}>${name}`, wobble, frame);
    }
    cur = name;
  }
  return shape(cur);
};

const backOut = (t: number) => {
  const s = 1.4;
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};
