import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease, seeded } from "../explainer/lib/anim";
import { C, Ink, Wash, drawP } from "./ink";

/**
 * Hand-drawn illustrations. Each takes the frame its drawing starts at; strokes draw in one after
 * another and watercolour washes bleed in underneath.
 */

type Art = { at: number; speed?: number };

// ------------------------------------------------------------------ Timișoara: the cathedral by the Bega
export const Cathedral: React.FC<Art> = ({ at, speed = 1 }) => {
  const f = useCurrentFrame();
  const P = (k: number, d = 14) => drawP(f, at + k / speed, d / speed);
  const cx = 960;
  const g = 820;
  const dome = (x: number, w: number, top: number, base: number) =>
    `M ${x - w} ${base} C ${x - w} ${base - (base - top) * 0.55}, ${x - w * 0.15} ${top + 30}, ${x} ${top} C ${x + w * 0.15} ${top + 30}, ${x + w} ${base - (base - top) * 0.55}, ${x + w} ${base}`;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* sky wash */}
      <Wash d="M 300 260 C 600 120, 1300 120, 1640 280 C 1700 520, 1500 760, 960 760 C 420 760, 220 520, 300 260 Z" p={P(0, 30)} color={C.sky} seed={0} opacity={0.45} ox={960} oy={420} r={900} />
      {/* domes and roof colour */}
      <Wash d={`${dome(cx, 70, 245, 335)} Z`} p={P(30, 20)} color={C.green} seed={1} opacity={0.8} ox={cx} oy={300} r={160} />
      <Wash d={`${dome(740, 46, 395, 460)} Z`} p={P(34, 20)} color={C.green} seed={2} opacity={0.8} ox={740} oy={430} r={120} />
      <Wash d={`${dome(1180, 46, 395, 460)} Z`} p={P(36, 20)} color={C.green} seed={0} opacity={0.8} ox={1180} oy={430} r={120} />
      <Wash d={`M 760 560 L 900 470 L 1020 470 L 1160 560 Z`} p={P(38, 20)} color={C.warm} seed={1} opacity={0.7} ox={960} oy={510} r={260} />
      <Wash d="M 160 880 C 500 860, 1400 900, 1780 870 L 1780 930 C 1400 950, 500 930, 160 940 Z" p={P(40, 24)} color={C.sky} seed={2} opacity={0.6} ox={960} oy={900} r={1000} />
      {/* ink */}
      <Ink d={`M 700 ${g} L 700 460 M 780 ${g} L 780 460 M 700 460 L 780 460`} p={P(2)} />
      <Ink d={`M 1140 ${g} L 1140 460 M 1220 ${g} L 1220 460 M 1140 460 L 1220 460`} p={P(4)} />
      <Ink d={dome(740, 46, 395, 460)} p={P(8)} />
      <Ink d={dome(1180, 46, 395, 460)} p={P(9)} />
      <Ink d={`M 740 395 L 740 360 M 732 372 L 748 372 M 1180 395 L 1180 360 M 1172 372 L 1188 372`} p={P(11)} w={4} />
      <Ink d={`M 760 ${g} L 760 560 L 900 470 M 1160 ${g} L 1160 560 L 1020 470`} p={P(6)} />
      <Ink d={`M 900 560 L 900 335 L 1020 335 L 1020 560`} p={P(10)} />
      <Ink d={dome(cx, 70, 245, 335)} p={P(13)} />
      <Ink d={`M ${cx} 245 L ${cx} 175 M ${cx - 16} 198 L ${cx + 16} 198`} p={P(16)} w={4.5} />
      {/* arches and windows */}
      <Ink d={`M 920 ${g} L 920 720 C 920 680, 1000 680, 1000 720 L 1000 ${g}`} p={P(18)} />
      <Ink d={`M 930 470 L 930 420 C 930 395, 990 395, 990 420 L 990 470`} p={P(20)} w={4} />
      <Ink d={`M 810 700 L 810 640 C 810 615, 850 615, 850 640 L 850 700 M 1070 700 L 1070 640 C 1070 615, 1110 615, 1110 640 L 1110 700`} p={P(22)} w={4} />
      <Ink d={`M 724 560 L 724 520 C 724 505, 756 505, 756 520 L 756 560 M 1164 560 L 1164 520 C 1164 505, 1196 505, 1196 520 L 1196 560`} p={P(24)} w={3.5} />
      {/* ground, trees, river */}
      <Ink d={`M 240 ${g} L 1680 ${g}`} p={P(1, 20)} w={4} />
      <Ink d={`M 420 ${g} L 420 740 M 420 740 C 340 740, 340 620, 420 610 C 500 600, 520 730, 420 740`} p={P(26)} w={4} />
      <Ink d={`M 1500 ${g} L 1500 750 M 1500 750 C 1420 750, 1430 640, 1500 630 C 1580 625, 1590 745, 1500 750`} p={P(28)} w={4} />
      <Ink d="M 300 880 C 380 868, 460 892, 540 880 S 700 868, 780 880 M 1080 892 C 1160 880, 1240 904, 1320 892 S 1480 880, 1560 892" p={P(32, 20)} w={3.5} color={C.inkSoft} />
    </svg>
  );
};

// ------------------------------------------------------------------ a house
export const House: React.FC<Art & { x?: number; y?: number; s?: number }> = ({ at, x = 960, y = 640, s = 1 }) => {
  const f = useCurrentFrame();
  const P = (k: number, d = 14) => drawP(f, at + k, d);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <Wash d="M -260 -150 L 0 -330 L 260 -150 Z" p={P(22, 20)} color={C.rose} seed={1} ox={0} oy={-240} r={380} />
        <Wash d="M -230 -150 L 230 -150 L 230 200 L -230 200 Z" p={P(26, 22)} color={C.sand} seed={2} opacity={0.6} ox={0} oy={20} r={420} />
        <Wash d="M -40 60 L 40 60 L 40 200 L -40 200 Z" p={P(30, 14)} color={C.green} seed={0} ox={0} oy={130} r={140} />
        <Wash d="M -180 -80 L -90 -80 L -90 10 L -180 10 Z M 90 -80 L 180 -80 L 180 10 L 90 10 Z" p={P(32, 14)} color={C.sky} seed={1} ox={0} oy={-40} r={260} />
        <Ink d="M -280 -140 L 0 -340 L 280 -140" p={P(0)} w={6} />
        <Ink d="M -230 -150 L -230 200 L 230 200 L 230 -150" p={P(5)} w={6} />
        <Ink d="M 140 -240 L 140 -310 L 190 -310 L 190 -205" p={P(9)} />
        <Ink d="M 165 -320 C 150 -350, 190 -360, 175 -390 C 165 -410, 200 -420, 190 -445" p={P(12, 20)} w={3.5} color={C.inkSoft} />
        <Ink d="M -40 200 L -40 60 L 40 60 L 40 200 M 22 130 L 24 132" p={P(14)} />
        <Ink d="M -180 -80 L -90 -80 L -90 10 L -180 10 Z M -135 -80 L -135 10 M -180 -35 L -90 -35" p={P(17)} w={4} />
        <Ink d="M 90 -80 L 180 -80 L 180 10 L 90 10 Z M 135 -80 L 135 10 M 90 -35 L 180 -35" p={P(19)} w={4} />
        <Ink d="M -340 200 L 340 200" p={P(3, 18)} w={4} />
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ service doodles (each in a 300 × 260 box centred on 0,0)
export type Doodle = "pipes" | "furniture" | "paint" | "clean" | "mower" | "boxes" | "dog";

export const ServiceDoodle: React.FC<{ kind: Doodle; at: number; x: number; y: number; s?: number }> = ({ kind, at, x, y, s = 1 }) => {
  const f = useCurrentFrame();
  const P = (k: number, d = 10) => drawP(f, at + k, d);
  const ink = (d: string, k: number, w = 5) => <Ink key={`${kind}${k}`} d={d} p={P(k)} w={w} />;
  const wash = (d: string, k: number, color: string, seed = 0, ox = 0, oy = 0, r = 200) => <Wash key={`w${kind}${k}`} d={d} p={P(k, 14)} color={color} seed={seed} ox={ox} oy={oy} r={r} />;
  let body: React.ReactNode = null;
  switch (kind) {
    case "pipes":
      body = (
        <>
          {wash("M -120 -40 L 60 -40 L 60 0 L -120 0 Z M 30 -40 L 70 -40 L 70 40 L 30 40 Z", 12, C.sky, 0, -20, -10)}
          {wash("M 50 70 C 30 100, 30 120, 50 125 C 70 120, 70 100, 50 70 Z", 16, C.sky, 1, 50, 110, 60)}
          {ink("M -130 -40 L 60 -40 C 80 -40, 80 -40, 80 -20 L 80 30 M -130 0 L 40 0 L 40 30", 0)}
          {ink("M 30 30 L 90 30 L 90 45 L 30 45 Z", 4, 4)}
          {ink("M -40 -40 L -40 -80 M -70 -80 L -10 -80", 6, 5)}
          {ink("M 50 70 C 30 100, 30 120, 50 125 C 70 120, 70 100, 50 70", 9, 4)}
        </>
      );
      break;
    case "furniture":
      body = (
        <>
          {wash("M -110 -110 L 70 -110 L 70 100 L -110 100 Z", 12, C.warm, 1, -20, 0, 220)}
          {ink("M -110 -110 L 70 -110 L 70 100 L -110 100 Z", 0)}
          {ink("M -20 -110 L -20 100 M -40 -10 L -40 10 M 0 -10 L 0 10", 4, 4)}
          {ink("M -100 100 L -100 120 M 60 100 L 60 120", 6, 4)}
          {ink("M 95 -40 L 135 40 M 125 20 L 145 60", 8, 5)}
        </>
      );
      break;
    case "paint":
      body = (
        <>
          {wash("M -140 40 C -60 10, 40 60, 140 20 L 140 80 C 40 110, -60 70, -140 100 Z", 10, C.green, 2, -140, 60, 320)}
          {ink("M -60 -110 L 80 -110 L 80 -60 L -60 -60 Z", 0)}
          {ink("M 80 -85 L 110 -85 L 110 -20 L 10 -20 L 10 20", 4)}
          {ink("M 0 20 L 20 20 L 20 80 L 0 80 Z", 7, 4)}
        </>
      );
      break;
    case "clean":
      body = (
        <>
          {wash("M -80 -20 L 80 -20 L 60 110 L -60 110 Z", 12, C.sky, 0, 0, 40, 200)}
          {ink("M -80 -20 L 80 -20 L 60 110 L -60 110 Z", 0)}
          {ink("M -70 -20 C -70 -90, 70 -90, 70 -20", 4, 4)}
          {ink("M -50 -45 C -60 -55, -40 -70, -30 -55 C -20 -70, 0 -60, -10 -45", 7, 3.5)}
          {ink("M 110 -90 L 110 -50 M 90 -70 L 130 -70 M 130 -10 L 130 10 M 120 0 L 140 0", 9, 4)}
        </>
      );
      break;
    case "mower":
      body = (
        <>
          {wash("M -150 100 L 150 100 L 150 120 L -150 120 Z", 12, C.green, 1, 0, 110, 260)}
          {wash("M -90 10 L 70 10 L 70 70 L -90 70 Z", 10, C.rose, 2, -10, 40, 160)}
          {ink("M -90 10 L 70 10 L 70 70 L -90 70 Z", 0)}
          {ink("M -50 70 m -22 0 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0 M 40 70 m -22 0 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0", 4, 4)}
          {ink("M 60 10 L 130 -100 L 150 -100", 6)}
          {ink("M -140 105 L -130 80 L -120 105 M -100 105 L -92 85 L -84 105 M 100 105 L 110 82 L 120 105 M 130 105 L 138 88 L 146 105", 8, 3.5)}
        </>
      );
      break;
    case "boxes":
      body = (
        <>
          {wash("M -120 0 L 20 0 L 20 110 L -120 110 Z M -10 -110 L 120 -110 L 120 0 L -10 0 Z M 30 0 L 140 0 L 140 110 L 30 110 Z", 10, C.sand, 1, 0, 0, 260)}
          {ink("M -120 0 L 20 0 L 20 110 L -120 110 Z", 0)}
          {ink("M 30 0 L 140 0 L 140 110 L 30 110 Z", 3)}
          {ink("M -10 -110 L 120 -110 L 120 0 L -10 0 Z", 6)}
          {ink("M -50 0 L -50 40 M 85 0 L 85 40 M 55 -110 L 55 -70", 8, 4)}
        </>
      );
      break;
    case "dog":
      body = (
        <>
          {wash("M -90 -10 C -90 -50, 50 -50, 50 -10 C 50 30, -90 30, -90 -10 Z M 40 -70 C 40 -105, 100 -105, 100 -70 C 100 -40, 40 -40, 40 -70 Z", 10, C.warm, 2, -20, -40, 220)}
          {ink("M -90 -10 C -90 -50, 50 -50, 50 -10 C 50 30, -90 30, -90 -10", 0)}
          {ink("M 40 -70 C 40 -105, 100 -105, 100 -70 C 100 -40, 40 -40, 40 -70 M 52 -95 L 44 -120 L 64 -100 M 84 -98 L 92 -122 L 98 -96", 3, 4.5)}
          {ink("M 80 -72 L 82 -70 M 98 -62 C 104 -60, 106 -56, 100 -54", 5, 4)}
          {ink("M -70 15 L -74 70 M -40 20 L -40 70 M 10 20 L 12 70 M 35 15 L 40 68 M -90 -20 C -120 -40, -125 -70, -110 -80", 7, 4.5)}
          {ink("M 70 -50 C 110 -10, 130 30, 150 -20 L 150 -60", 9, 3)}
        </>
      );
      break;
  }
  const pop = ease.outBack(clamp01((f - at) / 10), 1.4);
  return <g transform={`translate(${x} ${y}) scale(${s * (0.85 + 0.15 * pop)})`}>{body}</g>;
};

// ------------------------------------------------------------------ a hand-drawn phone
export const PhoneSketch: React.FC<Art & { x: number; y: number; s?: number; fill?: number; children?: React.ReactNode }> = ({ at, x, y, s = 1, fill = 0, children }) => {
  const f = useCurrentFrame();
  const P = (k: number, d = 16) => drawP(f, at + k, d);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Wash d="M -150 -300 L 150 -300 L 150 300 L -150 300 Z" p={fill} color={C.green} seed={1} opacity={0.85} ox={0} oy={0} r={380} />
      <Ink d="M -120 -310 L 120 -310 C 150 -310, 160 -300, 160 -270 L 160 270 C 160 300, 150 310, 120 310 L -120 310 C -150 310, -160 300, -160 270 L -160 -270 C -160 -300, -150 -310, -120 -310 Z" p={P(0, 20)} w={6} />
      <Ink d="M -30 -285 L 30 -285" p={P(10)} w={5} />
      {children}
    </g>
  );
};

// ------------------------------------------------------------------ Romania, with its cities
const RO: Array<[number, number]> = [
  [22.88, 47.95], [24.0, 47.96], [24.9, 47.73], [26.2, 48.06], [26.62, 48.26], [27.4, 47.6], [28.1, 46.97], [28.2, 46.1], [28.1, 45.6], [28.6, 45.3],
  [29.6, 45.4], [29.7, 45.0], [28.8, 44.6], [28.6, 43.78], [27.9, 44.0], [27.0, 44.15], [25.6, 43.65], [24.5, 43.7], [23.3, 43.85], [22.7, 44.2],
  [22.45, 44.55], [22.0, 44.62], [21.4, 44.8], [21.5, 45.18], [20.7, 45.75], [20.26, 46.13], [21.1, 46.4], [21.6, 46.9], [22.1, 47.6],
];
export const CITIES: Array<{ n: string; lon: number; lat: number }> = [
  { n: "Timișoara", lon: 21.23, lat: 45.75 },
  { n: "Arad", lon: 21.31, lat: 46.18 },
  { n: "Oradea", lon: 21.92, lat: 47.07 },
  { n: "Cluj", lon: 23.6, lat: 46.77 },
  { n: "Sibiu", lon: 24.15, lat: 45.8 },
  { n: "Craiova", lon: 23.8, lat: 44.32 },
  { n: "Brașov", lon: 25.6, lat: 45.65 },
  { n: "Iași", lon: 27.6, lat: 47.16 },
  { n: "București", lon: 26.1, lat: 44.43 },
  { n: "Constanța", lon: 28.65, lat: 44.17 },
];
const K = 100;
export const proj = (lon: number, lat: number): [number, number] => [960 - 4.95 * K + (lon - 20) * K, 560 - 2.3 * K * 1.38 + (48.3 - lat) * K * 1.38];
export const roPath = () => "M " + RO.map(([lo, la]) => proj(lo, la).map((v) => v.toFixed(1)).join(" ")).join(" L ") + " Z";

/** a smooth-ish wobble for the drawn cities' dots */
export const jitter = (i: number) => (seeded(i, 3) - 0.5) * 4;
