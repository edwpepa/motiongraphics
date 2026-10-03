import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp01, ease } from "../explainer/lib/anim";

/** palette: warm paper, soft ink, watercolour washes */
export const C = {
  paper: "#fbfaf6",
  ink: "#1f2a25",
  inkSoft: "#4a5650",
  green: "#22b76a",
  greenDeep: "#0f8a4c",
  mint: "#9be3bd",
  sky: "#9ec9e6",
  warm: "#f1b77a",
  rose: "#ee9a8c",
  sand: "#e8d3a8",
};

/** filters shared by every drawing: ink boil (5 seeds) and a watercolour bleed */
export const InkDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {[0, 1, 2, 3, 4].map((s) => (
        <filter key={s} id={`boil${s}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={s * 7 + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
      {[0, 1, 2].map((s) => (
        <filter key={`w${s}`} id={`wash${s}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={s * 11 + 5} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={22} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={s + 2} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.25" result="g2" />
          <feComposite in="b" in2="g2" operator="in" />
        </filter>
      ))}
    </defs>
  </svg>
);

/** current boil filter: the line wobbles a little every 4 frames, like frame-by-frame drawing */
export const useBoil = () => {
  const f = useCurrentFrame();
  return `url(#boil${Math.floor(f / 4) % 5})`;
};

/** warm paper with fibres and grain */
export const Paper: React.FC<{ tint?: string }> = ({ tint }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 95% at 50% 45%, #ffffff 0%, ${C.paper} 65%, #f1eee6 100%)` }}>
    {tint && <AbsoluteFill style={{ background: tint }} />}
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.07, mixBlendMode: "multiply" }} />
  </AbsoluteFill>
);

/** progress of a stroke being drawn */
export const drawP = (frame: number, at: number, dur = 18) => ease.inOutCubic(clamp01((frame - at) / dur));

/** an ink line drawing itself */
export const Ink: React.FC<{ d: string; p: number; w?: number; color?: string; opacity?: number }> = ({ d, p, w = 5, color = C.ink, opacity = 1 }) => {
  const boil = useBoil();
  if (p <= 0.002) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} filter={boil} opacity={opacity} />;
};

/** a watercolour wash bleeding in from a point */
export const Wash: React.FC<{ d: string; p: number; color: string; seed?: number; opacity?: number; ox?: number; oy?: number; r?: number }> = ({ d, p, color, seed = 0, opacity = 0.75, ox = 0, oy = 0, r = 900 }) => {
  const id = "wm" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (p <= 0.002) return null;
  return (
    <g>
      <defs>
        <mask id={id}>
          <circle cx={ox} cy={oy} r={r * ease.outCubic(p)} fill="#fff" />
        </mask>
      </defs>
      <g mask={`url(#${id})`} filter={`url(#wash${seed % 3})`} opacity={opacity}>
        <path d={d} fill={color} />
        <path d={d} fill="none" stroke={color} strokeWidth={10} opacity={0.6} />
      </g>
    </g>
  );
};

/** soft camera drift so the page always breathes */
export const Drift: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const p = (frame - from) / Math.max(1, to - from);
  const sc = 1.01 + 0.045 * ease.inOutCubic(clamp01(p));
  return <AbsoluteFill style={{ transform: `translate(${Math.sin(frame / 50 + from) * 8}px, ${Math.cos(frame / 61 + from) * 6}px) scale(${sc}) rotate(${Math.sin(frame / 90 + from) * 0.3}deg)` }}>{children}</AbsoluteFill>;
};
