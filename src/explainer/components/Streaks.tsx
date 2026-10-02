import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, seeded } from "../lib/anim";

/** Vertical speed streaks for the fast vertical whip (the reference's phone → task-list cut). */
export const Streaks: React.FC<{ start: number; dur: number; color?: string; count?: number }> = ({
  start,
  dur,
  color = "40,48,44",
  count = 90,
}) => {
  const frame = useCurrentFrame();
  const lines = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: seeded(i, 1) * 1920,
        w: 1 + seeded(i, 2) * 3,
        h: 300 + seeded(i, 3) * 900,
        y0: seeded(i, 4) * 1080,
        a: 0.08 + seeded(i, 5) * 0.32,
        speed: 0.6 + seeded(i, 6) * 0.8,
      })),
    [count]
  );
  const p = (frame - start) / dur;
  if (p <= 0 || p >= 1) return null;
  const env = Math.sin(clamp01(p) * Math.PI);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        {lines.map((l, i) => (
          <rect
            key={i}
            x={l.x}
            y={((l.y0 - p * 2600 * l.speed) % 2400) + 600}
            width={l.w}
            height={l.h}
            fill={`rgba(${color},${l.a * env})`}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
