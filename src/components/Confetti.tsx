import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { Easing, interpolate } from "remotion";

// deterministic pseudo-random (seeded) so renders are reproducible across frames/workers
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface ConfettiProps {
  startFrame: number;
  count?: number;
  originX?: number;
  originY?: number;
}

const COLOR_SET = [COLORS.green, COLORS.white, COLORS.greenDark];

export const Confetti: React.FC<ConfettiProps> = ({ startFrame, count = 70, originX = 0.5, originY = 0.42 }) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const angle = seeded(i, 1) * Math.PI * 2;
      const speed = 6 + seeded(i, 2) * 14;
      const size = 10 + seeded(i, 3) * 16;
      const color = COLOR_SET[Math.floor(seeded(i, 4) * COLOR_SET.length)];
      const rotSpeed = (seeded(i, 5) - 0.5) * 18;
      const delay = seeded(i, 6) * 8;
      const shape = seeded(i, 7) > 0.5 ? "circle" : "rect";
      return { angle, speed, size, color, rotSpeed, delay, shape };
    });
  }, [count]);

  const t = Math.max(0, frame - startFrame);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {particles.map((p, i) => {
        const local = Math.max(0, t - p.delay);
        const progress = interpolate(local, [0, 70], [0, 1], {
          easing: Easing.out(Easing.quad),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const gravity = 0.11 * local * local * 0.5;
        const dx = Math.cos(p.angle) * p.speed * (local * 0.9);
        const dy = Math.sin(p.angle) * p.speed * (local * 0.6) + gravity;
        const opacity = interpolate(local, [0, 6, 55, 85], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const rotation = local * p.rotSpeed;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${originX * 100}%`,
              top: `${originY * 100}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.shape === "circle" ? "50%" : 3,
              opacity,
              transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
