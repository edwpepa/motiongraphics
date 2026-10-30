import React from "react";
import { clamp01 } from "../../explainer/lib/anim";
import { io3 } from "../tv3d/kit3d";

// ------------------------------------------------------------------ the phone's halo: ribbons that orbit it like garlands.
// Each ring is a tilted ellipse round the phone; its far half is drawn behind the phone and its near half in front,
// so the ribbons wrap it. They draw themselves on as the phone arrives, then keep turning, with lights running along.
/** t: frames since the phone started to arrive */
type HaloProps = { x: number; y: number; s?: number; t: number; f: number; dark?: boolean; opacity?: number };
const RINGS = [
  { a: 400, b: 112, tilt: -16, w: 16, speed: 0.9, delay: 0 },
  { a: 470, b: 150, tilt: 12, w: 9, speed: -0.7, delay: 5 },
  { a: 350, b: 86, tilt: 26, w: 5, speed: 1.3, delay: 10 },
];

const Rings: React.FC<HaloProps & { half: "back" | "front" }> = ({ x, y, s = 1, t, f, dark, opacity = 1, half }) => {
  if (t <= 0 || opacity <= 0.01) return null;
  const c0 = dark ? "#2fe08a" : "#7be8b2";
  const c1 = dark ? "#0b8f4a" : "#00bf63";
  const glint = dark ? "#d6ffe9" : "#ffffff";
  const W = 1200;
  return (
    <svg width={W} height={W} viewBox={`${-W / 2} ${-W / 2} ${W} ${W}`} style={{ position: "absolute", left: x - W / 2, top: y + 170 * s - W / 2, overflow: "visible", opacity, transform: `scale(${s})`, pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`hg${dark ? "d" : "l"}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c0} stopOpacity={0.15} />
          <stop offset="0.5" stopColor={c0} stopOpacity={0.9} />
          <stop offset="1" stopColor={c1} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      {RINGS.map((r, i) => {
        const draw = io3(clamp01((t - r.delay) / 26));
        if (draw <= 0) return null;
        const tilt = r.tilt + Math.sin(f / 70 + i * 2) * 4;
        // far half = local y < 0 (behind), near half = y > 0 (in front)
        const d = half === "back" ? `M ${r.a} 0 A ${r.a} ${r.b} 0 0 0 ${-r.a} 0` : `M ${-r.a} 0 A ${r.a} ${r.b} 0 0 0 ${r.a} 0`;
        const run = ((f * r.speed) / 120) % 1;
        return (
          <g key={i} transform={`rotate(${tilt})`}>
            <path d={d} fill="none" stroke={`url(#hg${dark ? "d" : "l"})`} strokeWidth={r.w} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={half === "back" ? 0.55 : 0.7} />
            {/* a light running along the ribbon */}
            <path d={d} fill="none" stroke={glint} strokeWidth={r.w * 0.55} strokeLinecap="round" pathLength={1} strokeDasharray="0.06 0.94" strokeDashoffset={-run} opacity={0.75 * draw} />
          </g>
        );
      })}
    </svg>
  );
};

/** soft light and the far halves of the ribbons — draw before the phone */
export const HaloBack: React.FC<HaloProps> = (p) => {
  if (p.t <= 0) return null;
  const e = io3(clamp01(p.t / 20));
  return (
    <>
      <div style={{ position: "absolute", left: p.x - 420 * (p.s ?? 1), top: p.y - 420 * (p.s ?? 1), width: 840 * (p.s ?? 1), height: 840 * (p.s ?? 1), borderRadius: "50%", background: p.dark ? "radial-gradient(circle, rgba(0,191,99,0.16) 0%, rgba(0,191,99,0.05) 45%, rgba(0,0,0,0) 70%)" : "radial-gradient(circle, rgba(123,232,178,0.32) 0%, rgba(123,232,178,0.1) 45%, rgba(255,255,255,0) 70%)", opacity: e * (p.opacity ?? 1), transform: `scale(${0.7 + 0.3 * e + 0.02 * Math.sin(p.f / 30)})`, pointerEvents: "none" }} />
      <Rings {...p} half="back" />
    </>
  );
};
/** the near halves of the ribbons — draw after the phone */
export const HaloFront: React.FC<HaloProps> = (p) => <Rings {...p} half="front" />;
