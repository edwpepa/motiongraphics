import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { useLayout } from "../layout";
import { seeded } from "../lib/anim";

/** Closed, smoothly wobbling blob outline: a circle whose radius is a sum of slow travelling sines. */
export const blobPath = (cx: number, cy: number, r: number, t: number, seed: number, amount = 0.18, pts = 72) => {
  const h = [2, 3, 5].map((k, i) => ({ k, a: amount * (0.6 - i * 0.15) * (0.7 + 0.6 * seeded(seed, 10 + i)), ph: seeded(seed, 20 + i) * 6.28, w: (0.6 + seeded(seed, 30 + i)) * (i % 2 ? -1 : 1) }));
  let d = "";
  for (let i = 0; i <= pts; i++) {
    const th = (i / pts) * Math.PI * 2;
    let rr = 1;
    for (const q of h) rr += q.a * Math.sin(q.k * th + q.ph + q.w * t);
    const x = cx + Math.cos(th) * r * rr;
    const y = cy + Math.sin(th) * r * rr;
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
};

type Tone = "light" | "dark";
const PALETTE: Record<Tone, string[][]> = {
  light: [
    ["#bff3d6", "#7fe3b0"],
    ["#d9f7e6", "#a6ecc8"],
    ["#c4f0db", "#61d79c"],
    ["#e6fbef", "#b7f0d1"],
  ],
  dark: [
    ["#0d5a34", "#063a20"],
    ["#0a7a43", "#04351c"],
    ["#0b4f2e", "#03200f"],
    ["#11804a", "#05391f"],
  ],
};

/**
 * Big soft out-of-focus shapes that drift and morph behind everything (Apple keynote-style
 * bokeh). Monochrome greens only, heavily blurred so they never compete with the type.
 */
export const MorphShapes: React.FC<{ tone: Tone; opacity?: number; count?: number; speed?: number }> = ({ tone, opacity = 1, count = 4, speed = 1 }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const t = (frame / 30) * speed;
  const shapes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: [0.18, 0.82, 0.62, 0.3][i % 4],
        y: [0.22, 0.3, 0.82, 0.75][i % 4],
        r: (0.22 + 0.12 * seeded(i, 3)) * Math.max(L.W, L.H),
        ph: seeded(i, 4) * 6.28,
      })),
    [count, L.W, L.H]
  );
  const blur = Math.max(L.W, L.H) * 0.06;
  return (
    <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0, opacity, filter: `blur(${blur}px)` }}>
      <defs>
        {shapes.map((_, i) => {
          const [a, b] = PALETTE[tone][i % 4];
          return (
            <radialGradient key={i} id={`ms${tone}${i}`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor={b} />
            </radialGradient>
          );
        })}
      </defs>
      {shapes.map((s, i) => {
        const cx = (s.x + 0.08 * Math.sin(t / 3.1 + s.ph)) * L.W;
        const cy = (s.y + 0.07 * Math.cos(t / 2.6 + s.ph * 1.3)) * L.H;
        return <path key={i} d={blobPath(cx, cy, s.r * (0.9 + 0.1 * Math.sin(t / 2 + s.ph)), t * 0.9, i + 1, 0.22)} fill={`url(#ms${tone}${i})`} opacity={tone === "light" ? 0.5 : 0.55} />;
      })}
    </svg>
  );
};
