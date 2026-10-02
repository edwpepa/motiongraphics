import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { premiumMove } from "../utils/easing";
import { interFontFamily as fontFamily } from "../font";
import { IconCircle } from "./IconCircle";

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  startFrame: number;
  landFrame: number;
  side: "left" | "right";
}

export const Chip: React.FC<ChipProps> = ({ icon, label, startFrame, landFrame, side }) => {
  const frame = useCurrentFrame();
  const dir = side === "left" ? -1 : 1;

  const x = premiumMove(frame, { from: 140 * dir, to: 0, startFrame, endFrame: landFrame });
  const opacity = Math.max(
    0,
    Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame, endFrame: startFrame + (landFrame - startFrame) * 0.7, settleAmount: 0 }))
  );
  const scale = premiumMove(frame, { from: 0.88, to: 1, startFrame, endFrame: landFrame, settleAmount: 0.01 });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "22px 36px 22px 22px",
        borderRadius: 999,
        background: COLORS.white,
        boxShadow: "0 18px 40px rgba(16,21,26,0.10), 0 2px 8px rgba(16,21,26,0.06)",
        transform: `translateX(${x}px) scale(${scale})`,
        opacity,
      }}
    >
      <IconCircle size={72}>{icon}</IconCircle>
      <span
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 38,
          color: COLORS.ink,
          letterSpacing: -0.3,
        }}
      >
        {label}
      </span>
    </div>
  );
};
