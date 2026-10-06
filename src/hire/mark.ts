import SHAPES from "../edw/logo-shapes.json";

/**
 * The EDW mark as morphable outlines: every contour of the cleaned SVG is resampled to a fixed number of
 * points, so it can melt into a dot, a line, three slots, a rectangle or a cloud of particles and back.
 * Outer contours and holes keep opposite windings, so a nonzero fill always draws the letters correctly.
 */
export type P2 = [number, number];
export type Contour = { pts: P2[]; hole: boolean; word: boolean; cx: number; cy: number; len: number };

const CX = 927, CY = 343;
export const MARK_W = 1854;

const area = (p: P2[]) => p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0) / 2;

function resample(poly: P2[], n: number): { pts: P2[]; len: number } {
  const seg: number[] = [];
  let L = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    L += d;
  }
  const out: P2[] = [];
  let k = 0, acc = 0;
  for (let j = 0; j < n; j++) {
    const target = (j / n) * L;
    while (k < seg.length - 1 && acc + seg[k] < target) acc += seg[k++];
    const a = poly[k], b = poly[(k + 1) % poly.length];
    const u = seg[k] > 0 ? (target - acc) / seg[k] : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return { pts: out, len: L };
}

let C: Contour[] | null = null;
export function contours(): Contour[] {
  if (C) return C;
  const S = SHAPES as unknown as Record<string, number[][][]>;
  const out: Contour[] = [];
  for (const key of ["edw-symbol", "enterprise"]) {
    for (const raw of S[key]) {
      const poly = raw.map(([x, y]) => [x - CX, y - CY] as P2);
      const a = area(poly);
      if (Math.abs(a) <= 30) continue;
      const per = poly.reduce((s, p, i) => s + Math.hypot(poly[(i + 1) % poly.length][0] - p[0], poly[(i + 1) % poly.length][1] - p[1]), 0);
      const n = Math.max(32, Math.min(560, Math.round(per / 4)));
      const r = resample(poly, n);
      const cx = r.pts.reduce((s, p) => s + p[0], 0) / n, cy = r.pts.reduce((s, p) => s + p[1], 0) / n;
      out.push({ pts: r.pts, hole: a > 0, word: key === "enterprise", cx, cy, len: r.len });
    }
  }
  C = out;
  return out;
}

// ------------------------------------------------------------------ targets (same point count as each contour)
const orient = (target: P2[], like: P2[]) => (Math.sign(area(target)) === Math.sign(area(like)) ? target : [target[0], ...target.slice(1).reverse()]);

/** a small circle */
export const toDot = (c: Contour, x: number, y: number, r: number): P2[] =>
  orient(
    c.pts.map((_, i) => {
      const a = (i / c.pts.length) * Math.PI * 2;
      return [x + Math.cos(a) * r, y + Math.sin(a) * r] as P2;
    }),
    c.pts,
  );

/** flattened onto a horizontal line (the logo reads as a line of light) */
export const toLine = (c: Contour, y = 0): P2[] => c.pts.map(([x]) => [x, y] as P2);

/** a rectangle outline (holes collapse to a point inside) */
export function toRect(c: Contour, x0: number, y0: number, w: number, h: number): P2[] {
  const n = c.pts.length;
  if (c.hole) return c.pts.map(() => [x0 + w / 2, y0 + h / 2] as P2);
  const per = 2 * (w + h);
  const pts = c.pts.map((_, i) => {
    let d = (i / n) * per;
    if (d < w) return [x0 + d, y0] as P2;
    d -= w;
    if (d < h) return [x0 + w, y0 + d] as P2;
    d -= h;
    if (d < w) return [x0 + w - d, y0 + h] as P2;
    d -= w;
    return [x0, y0 + h - d] as P2;
  });
  return orient(pts, c.pts);
}

/** blend two point lists; each point starts a little later than the last so the change ripples across */
export function morph(a: P2[], b: P2[], u: number, stagger = 0.35, phaseOf?: (i: number) => number): P2[] {
  const n = a.length;
  return a.map((p, i) => {
    const ph = phaseOf ? phaseOf(i) : i / n;
    const v = Math.min(1, Math.max(0, (u * (1 + stagger) - ph * stagger)));
    const e = v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
    return [p[0] + (b[i][0] - p[0]) * e, p[1] + (b[i][1] - p[1]) * e];
  });
}

/** fill a set of contours (nonzero) at (x, y) with a scale */
export function fillContours(ctx: CanvasRenderingContext2D, polys: P2[][], x: number, y: number, s: number, style: string | CanvasGradient) {
  ctx.beginPath();
  for (const p of polys) {
    p.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * s, y + py * s) : ctx.moveTo(x + px * s, y + py * s)));
    ctx.closePath();
  }
  ctx.fillStyle = style;
  ctx.fill("nonzero");
}

/** draw the outlines on, as if traced by a pen (0 → 1) */
export function traceContours(ctx: CanvasRenderingContext2D, polys: P2[][], x: number, y: number, s: number, prog: number, width = 1.6, color = "rgba(240,242,248,0.95)") {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of polys) {
    const k = Math.floor(prog * p.length);
    if (k < 2) continue;
    ctx.beginPath();
    for (let i = 0; i <= Math.min(k, p.length); i++) {
      const q = p[i % p.length];
      i ? ctx.lineTo(x + q[0] * s, y + q[1] * s) : ctx.moveTo(x + q[0] * s, y + q[1] * s);
    }
    ctx.stroke();
  }
}

/** every outline point, flattened (for particle moves) */
export function allPoints(): { p: P2; ci: number }[] {
  const out: { p: P2; ci: number }[] = [];
  contours().forEach((c, ci) => c.pts.forEach((p, i) => i % 2 === 0 && out.push({ p, ci })));
  return out;
}
