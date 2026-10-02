import React, { useMemo } from "react";
import { clamp01, ease, lerp, seeded } from "../lib/anim";
import { useLayout } from "../layout";

const COLORS = ["#c8ff5a", "#2ee6a8", "#7f948e", "#5cf0c0", "#e6ff9a"];

/**
 * Floating light particles at different depths (bigger = nearer = softer). `pull` (0..1) draws them
 * into the point (px, py) one after another, like the reference's particle funnel.
 */
export const Particles: React.FC<{ frame: number; count?: number; pull?: number; px?: number; py?: number; opacity?: number }> = ({ frame, count = 70, pull = 0, px, py, opacity = 1 }) => {
  const L = useLayout();
  const ps = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const z = seeded(i, 3);
        return { x: seeded(i, 1), y: seeded(i, 2), z, r: 2 + z * z * 9, c: COLORS[Math.floor(seeded(i, 4) * COLORS.length)], sp: 0.3 + seeded(i, 5), ph: seeded(i, 6) * 6.28, d: seeded(i, 7) };
      }),
    [count]
  );
  const tx = px ?? L.cx;
  const ty = py ?? L.cy;
  return (
    <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <filter id="pblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {ps.map((p, i) => {
        const bx = p.x * L.W + Math.sin(frame / 50 + p.ph) * 20 * p.sp;
        const by = ((p.y - (frame / 1400) * p.sp + 5) % 1) * L.H;
        const k = ease.inCubic(clamp01(pull * 1.6 - p.d * 0.6));
        const x = lerp(bx, tx, k);
        const y = lerp(by, ty, k);
        const tw = 0.55 + 0.45 * Math.sin(frame / 9 + p.ph * 3);
        return <circle key={i} cx={x} cy={y} r={p.r * (1 - 0.6 * k)} fill={p.c} opacity={(0.25 + 0.6 * tw) * (0.35 + 0.65 * (1 - p.z * 0.5)) * (k > 0.97 ? 0 : 1)} filter={p.z > 0.72 ? "url(#pblur)" : undefined} />;
      })}
    </svg>
  );
};
