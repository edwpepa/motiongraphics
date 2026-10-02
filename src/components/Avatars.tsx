import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { premiumMove, idleDrift } from "../utils/easing";

interface AvatarProps {
  startFrame: number;
  landFrame: number;
  x: number;
  y: number;
  size: number;
  selected?: boolean;
  selectFrame?: number;
  delayPhase?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ startFrame, landFrame, x, y, size, selected, selectFrame, delayPhase = 0 }) => {
  const frame = useCurrentFrame();

  const scale = premiumMove(frame, { from: 0, to: 1, startFrame, endFrame: landFrame, settleAmount: 0.04 });
  const opacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame, endFrame: startFrame + (landFrame - startFrame) * 0.7, settleAmount: 0 })));
  const floatY = idleDrift(frame, 8, 220, delayPhase);

  const ringOpacity = selected && selectFrame !== undefined
    ? Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: selectFrame, endFrame: selectFrame + 14, settleAmount: 0 })))
    : 0;
  const ringScale = selected && selectFrame !== undefined
    ? premiumMove(frame, { from: 0.8, to: 1.18, startFrame: selectFrame, endFrame: selectFrame + 16, settleAmount: 0.03 })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: `4px solid ${COLORS.green}`,
            opacity: ringOpacity,
            transform: `scale(${ringScale})`,
          }}
        />
      )}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: selected ? COLORS.green : COLORS.greenTint,
          border: `2px solid ${selected ? COLORS.green : "rgba(0,191,99,0.25)"}`,
          boxShadow: selected ? "0 12px 28px rgba(0,191,99,0.35)" : "0 8px 18px rgba(16,21,26,0.08)",
        }}
      />
    </div>
  );
};
