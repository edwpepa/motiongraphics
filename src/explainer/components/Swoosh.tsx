import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { clamp01, ease } from "../lib/anim";

/** Thin accent arc that streaks past the text as it lands (the little blue strokes in the reference intro). */
export const Swoosh: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  dur?: number;
  color?: string;
  strokeWidth?: number;
  flip?: boolean;
}> = ({ x, y, w, h, start, dur = 16, color = C.green, strokeWidth = 4, flip }) => {
  const frame = useCurrentFrame();
  const p = clamp01((frame - start) / dur);
  if (p <= 0 || p >= 1) return null;

  const e = ease.inOutCubic(p);
  const seg = 0.38;
  const head = e * (1 + seg);
  const d = flip ? `M ${w} ${h} Q ${w * 0.5} ${-h * 0.35} 0 ${h * 0.25}` : `M 0 ${h} Q ${w * 0.45} ${h * 1.25} ${w} 0`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${seg} 2`}
        strokeDashoffset={seg - head}
        opacity={Math.sin(p * Math.PI) * 0.9}
      />
    </svg>
  );
};
