import React from "react";
import { AbsoluteFill } from "remotion";
import { useLayout } from "../layout";

/**
 * One huge, soft green shape drifting briskly behind everything. Built from a few overlapping
 * radial gradients that orbit each other, so the silhouette keeps morphing while it moves.
 * `t` is the global frame, so every set that draws it stays in sync across cuts.
 */
export const BlurBlob: React.FC<{ t: number; strength?: number }> = ({ t, strength = 1.45 }) => {
  const L = useLayout();
  const s = t / 30; // seconds
  const D = L.W * 0.95;
  // the body sweeps across the frame on a lively Lissajous path
  const cx = L.cx + Math.sin(s * 1.1) * L.W * 0.26 + Math.sin(s * 2.3 + 1) * L.W * 0.06;
  const cy = L.cy + Math.cos(s * 0.9 + 0.6) * L.H * 0.24 + Math.sin(s * 1.9) * L.H * 0.06;
  const lobes = [
    { r: 1, ox: 0, oy: 0, a: 0.2, ph: 0, sp: 0 },
    { r: 0.7, ox: 0.28, oy: 0.12, a: 0.17, ph: 0.5, sp: 1.6 },
    { r: 0.6, ox: 0.24, oy: 0.22, a: 0.15, ph: 2.6, sp: -1.3 },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {lobes.map((b, i) => {
        const ang = b.ph + s * b.sp;
        const x = cx + Math.cos(ang) * b.ox * D;
        const y = cy + Math.sin(ang) * b.oy * D;
        const w = D * b.r * (1 + 0.12 * Math.sin(s * 2.1 + i * 2));
        const h = w * (0.62 + 0.14 * Math.sin(s * 1.7 + i));
        const rot = (s * 24 + i * 50) % 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: y - h / 2,
              width: w,
              height: h,
              borderRadius: "50%",
              transform: `rotate(${rot}deg)`,
              background: `radial-gradient(closest-side, rgba(0,200,105,${b.a * strength}) 0%, rgba(0,170,90,${b.a * 0.55 * strength}) 45%, rgba(0,120,64,0) 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
