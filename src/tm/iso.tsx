import React from "react";
import { seeded } from "../explainer/lib/anim";

/**
 * A small isometric Timișoara: blocks of houses and flats on a street grid, parks, the Bega with
 * bridges and the Metropolitan Cathedral in the middle. Everything is plain SVG polygons, sorted
 * back to front, so the camera can fly over it smoothly.
 */
export const TW = 120;
export const TH = 60;
export const GRID = 24;

/** world (cell) coordinates → world pixels; z lifts straight up */
export const iso = (i: number, j: number, z = 0): [number, number] => [(i - j) * (TW / 2), (i + j) * (TH / 2) - z];
const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

export const PAL = {
  ground: "#d6ecdc",
  street: "#fbfcfb",
  streetEdge: "#dfe6e1",
  grass: "#cfe8d6",
  water: "#9ed2ea",
  waterDeep: "#7fc2e2",
  wallL: "#cfdad4",
  wallR: "#eef3f0",
  top: "#ffffff",
  roofA: "#ff9a74",
  roofB: "#ee7b57",
  green: "#22b76a",
  greenL: "#4fd28f",
  greenD: "#138a4e",
  tree: "#55c283",
  treeD: "#3aa468",
  trunk: "#b99a7a",
  window: "#cfe3ec",
  windowLit: "#fff1b8",
};

type Shape = { key: string; depth: number; el: React.ReactNode };

const box = (key: string, i: number, j: number, w: number, d: number, h: number, colors: { top: string; l: string; r: string }, z0 = 0, windows = false): Shape[] => {
  const P = (a: number, b: number, z: number) => iso(a, b, z);
  const top = [P(i, j, z0 + h), P(i + w, j, z0 + h), P(i + w, j + d, z0 + h), P(i, j + d, z0 + h)];
  const left = [P(i, j + d, z0), P(i + w, j + d, z0), P(i + w, j + d, z0 + h), P(i, j + d, z0 + h)];
  const right = [P(i + w, j, z0), P(i + w, j + d, z0), P(i + w, j + d, z0 + h), P(i + w, j, z0 + h)];
  const win: React.ReactNode[] = [];
  if (windows && h > 50) {
    const rows = Math.floor((h - 20) / 26);
    for (let r = 0; r < rows; r++) {
      const zz = z0 + 16 + r * 26;
      for (let c = 0; c < w * 2; c++) {
        const a = i + (c + 0.25) / 2;
        const lit = seeded(i * 31 + j * 7 + r * 3 + c, 5) > 0.82;
        win.push(<polygon key={`wl${r}-${c}`} points={[P(a, j + d, zz), P(a + 0.28, j + d, zz), P(a + 0.28, j + d, zz + 12), P(a, j + d, zz + 12)].map(pt).join(" ")} fill={lit ? PAL.windowLit : PAL.window} opacity={0.9} />);
      }
      for (let c = 0; c < d * 2; c++) {
        const b = j + (c + 0.25) / 2;
        const lit = seeded(i * 13 + j * 17 + r * 5 + c, 9) > 0.82;
        win.push(<polygon key={`wr${r}-${c}`} points={[P(i + w, b, zz), P(i + w, b + 0.28, zz), P(i + w, b + 0.28, zz + 12), P(i + w, b, zz + 12)].map(pt).join(" ")} fill={lit ? PAL.windowLit : PAL.window} opacity={0.9} />);
      }
    }
  }
  const sh = h / 95;
  const shadow = [P(i, j + d, 0), P(i + w, j + d, 0), P(i + w + sh * 0.3, j + d + sh, 0), P(i + sh * 0.3, j + d + sh, 0)];
  return [
    {
      key,
      depth: i + w + j + d,
      el: (
        <g key={key}>
          {z0 === 0 && <polygon points={shadow.map(pt).join(" ")} fill="rgba(20,70,45,0.13)" />}
          <polygon points={left.map(pt).join(" ")} fill={colors.l} />
          <polygon points={right.map(pt).join(" ")} fill={colors.r} />
          <polygon points={top.map(pt).join(" ")} fill={colors.top} />
          {win}
        </g>
      ),
    },
  ];
};

const house = (key: string, i: number, j: number, h: number, roof: string): Shape[] => {
  const P = (a: number, b: number, z: number) => iso(a, b, z);
  const inset = 0.12;
  const a0 = i + inset;
  const b0 = j + inset;
  const s = 1 - 2 * inset;
  const base = box(key, a0, b0, s, s, h, { top: PAL.top, l: PAL.wallL, r: PAL.wallR })[0];
  const apex = P(a0 + s / 2, b0 + s / 2, h + 46);
  const c = [P(a0, b0, h), P(a0 + s, b0, h), P(a0 + s, b0 + s, h), P(a0, b0 + s, h)];
  const door = [P(a0 + s * 0.35, b0 + s, 0), P(a0 + s * 0.6, b0 + s, 0), P(a0 + s * 0.6, b0 + s, 26), P(a0 + s * 0.35, b0 + s, 26)];
  return [
    {
      key,
      depth: base.depth,
      el: (
        <g key={key}>
          {base.el}
          <polygon points={door.map(pt).join(" ")} fill={PAL.green} />
          <polygon points={[c[0], c[1], apex].map(pt).join(" ")} fill={roof} />
          <polygon points={[c[3], c[0], apex].map(pt).join(" ")} fill={roof} opacity={0.85} />
          <polygon points={[c[1], c[2], apex].map(pt).join(" ")} fill={roof} style={{ filter: "brightness(1.08)" }} />
          <polygon points={[c[2], c[3], apex].map(pt).join(" ")} fill={roof} style={{ filter: "brightness(0.9)" }} />
        </g>
      ),
    },
  ];
};

const tree = (key: string, i: number, j: number, s = 1): Shape[] => {
  const [x, y] = iso(i + 0.5, j + 0.5);
  return [
    {
      key,
      depth: i + j + 1.2,
      el: (
        <g key={key} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cx={0} cy={0} rx={20} ry={10} fill="rgba(20,60,40,0.12)" />
          <rect x={-3} y={-34} width={6} height={34} rx={3} fill={PAL.trunk} />
          <circle cx={0} cy={-52} r={24} fill={PAL.tree} />
          <circle cx={-8} cy={-60} r={12} fill={PAL.greenL} opacity={0.6} />
          <path d="M -24 -48 A 24 24 0 0 0 24 -48" fill={PAL.treeD} opacity={0.5} />
        </g>
      ),
    },
  ];
};

/** the Metropolitan Cathedral: a cross-shaped body, a tall central tower, four small towers, green domes */
const cathedral = (i: number, j: number): Shape[] => {
  const W = { top: "#fff8ec", l: "#ecd9bd", r: "#f6e8d2" };
  const out: Shape[] = [];
  out.push(...box("cat-body", i, j, 3, 3, 90, W));
  const tower = (k: string, a: number, b: number, w: number, h: number, dome: number) => {
    const s = box(k, a, b, w, w, h, W, 90)[0];
    const [cx, cy] = iso(a + w / 2, b + w / 2, 90 + h);
    const r = (w * TW) / 2.6;
    out.push({
      key: k,
      depth: s.depth + 0.5,
      el: (
        <g key={k}>
          {s.el}
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.5} fill={PAL.greenD} />
          <path d={`M ${cx - r} ${cy} C ${cx - r} ${cy - dome * 0.8}, ${cx - r * 0.2} ${cy - dome}, ${cx} ${cy - dome * 1.15} C ${cx + r * 0.2} ${cy - dome}, ${cx + r} ${cy - dome * 0.8}, ${cx + r} ${cy} Z`} fill={PAL.green} />
          <path d={`M ${cx - r * 0.35} ${cy - dome * 0.2} C ${cx - r * 0.4} ${cy - dome * 0.7}, ${cx - r * 0.1} ${cy - dome * 0.95}, ${cx} ${cy - dome * 1.1}`} stroke={PAL.greenL} strokeWidth={4} fill="none" opacity={0.8} />
          <line x1={cx} y1={cy - dome * 1.15} x2={cx} y2={cy - dome * 1.15 - 30} stroke="#c9a24a" strokeWidth={4} />
          <line x1={cx - 9} y1={cy - dome * 1.15 - 20} x2={cx + 9} y2={cy - dome * 1.15 - 20} stroke="#c9a24a" strokeWidth={4} />
        </g>
      ),
    });
  };
  tower("cat-t1", i - 0.1, j - 0.1, 0.8, 70, 50);
  tower("cat-t2", i + 2.3, j - 0.1, 0.8, 70, 50);
  tower("cat-t3", i - 0.1, j + 2.3, 0.8, 70, 50);
  tower("cat-t4", i + 2.3, j + 2.3, 0.8, 70, 50);
  tower("cat-main", i + 1, j + 1, 1, 170, 90);
  return out;
};

/** the static city; built once */
let CACHE: { shapes: Shape[]; houses: Array<[number, number]> } | null = null;
export const RIVER_J = 15;
export const CATHEDRAL: [number, number] = [8, 8];

export const city = () => {
  if (CACHE) return CACHE;
  const shapes: Shape[] = [];
  const houses: Array<[number, number]> = [];
  for (let bi = 0; bi < 6; bi++) {
    for (let bj = 0; bj < 6; bj++) {
      const i0 = bi * 4;
      const j0 = bj * 4;
      if (j0 + 2 >= RIVER_J - 1 && j0 <= RIVER_J + 1) continue; // the river runs through this row of blocks
      if (bi === 2 && bj === 2) {
        shapes.push(...cathedral(i0, j0));
        continue;
      }
      const kind = seeded(bi * 7 + bj, 3);
      if (kind < 0.2) {
        // park
        for (let k = 0; k < 6; k++) shapes.push(...tree(`t${bi}${bj}${k}`, i0 + seeded(k, bi + bj) * 2.4, j0 + seeded(k + 9, bi * bj + 1) * 2.4, 0.9 + 0.3 * seeded(k, 7)));
      } else if (kind < 0.55) {
        // flats
        const h = 120 + Math.round(seeded(bi, bj + 4) * 120);
        shapes.push(...box(`f${bi}${bj}`, i0 + 0.2, j0 + 0.2, 2.6, 1.2, h, { top: PAL.top, l: PAL.wallL, r: PAL.wallR }, 0, true));
        shapes.push(...box(`g${bi}${bj}`, i0 + 0.2, j0 + 1.7, 1.2, 1.1, h * 0.6, { top: PAL.top, l: PAL.wallL, r: PAL.wallR }, 0, true));
        shapes.push(...tree(`ft${bi}${bj}`, i0 + 1.8, j0 + 2.1, 0.9));
      } else {
        // houses
        for (let a = 0; a < 3; a++)
          for (let b = 0; b < 3; b++) {
            if ((a + b) % 2 === 1 && seeded(a + bi, b + bj) > 0.5) {
              shapes.push(...tree(`ht${bi}${bj}${a}${b}`, i0 + a, j0 + b, 0.8));
              continue;
            }
            shapes.push(...house(`h${bi}${bj}${a}${b}`, i0 + a, j0 + b, 46 + Math.round(seeded(a * 3 + b, bi + bj) * 14), seeded(a, b + bi) > 0.5 ? PAL.roofA : PAL.roofB));
            houses.push([i0 + a, j0 + b]);
          }
      }
    }
  }
  shapes.sort((p, q) => p.depth - q.depth);
  CACHE = { shapes, houses };
  return CACHE;
};

/** the ground: lawn, streets, the Bega and two bridges */
export const Ground: React.FC = () => {
  const G = GRID;
  const quad = (i: number, j: number, w: number, d: number) => [iso(i, j), iso(i + w, j), iso(i + w, j + d), iso(i, j + d)].map(pt).join(" ");
  const streets: React.ReactNode[] = [];
  for (let k = 0; k <= 6; k++) {
    streets.push(<polygon key={`si${k}`} points={quad(k * 4 - 1, -1, 1, G + 2)} fill={PAL.street} />);
    streets.push(<polygon key={`sj${k}`} points={quad(-1, k * 4 - 1, G + 2, 1)} fill={PAL.street} />);
  }
  return (
    <g>
      <polygon points={quad(-2, -2, G + 4, G + 4)} fill={PAL.ground} />
      {streets}
      <polygon points={quad(-2, RIVER_J - 1.3, G + 4, 2.6)} fill={PAL.water} />
      <polygon points={quad(-2, RIVER_J - 0.5, G + 4, 1)} fill={PAL.waterDeep} opacity={0.6} />
      {[7, 15].map((k) => (
        <polygon key={k} points={quad(k, RIVER_J - 1.5, 1, 3)} fill="#f1ede6" stroke="#d9d1c4" strokeWidth={2} />
      ))}
    </g>
  );
};

export const CityShapes: React.FC = () => <>{city().shapes.map((s) => s.el)}</>;
