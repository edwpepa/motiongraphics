import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { premiumMove } from "../utils/easing";
import { interFontFamily as fontFamily } from "../font";

interface StrikeCardProps {
  icon: React.ReactNode;
  label: string;
  startFrame: number;
  landFrame: number;
  strikeFrame: number;
}

export const StrikeCard: React.FC<StrikeCardProps> = ({ icon, label, startFrame, landFrame, strikeFrame }) => {
  const frame = useCurrentFrame();

  const scale = premiumMove(frame, { from: 0.82, to: 1, startFrame, endFrame: landFrame, settleAmount: 0.02 });
  const opacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame, endFrame: startFrame + (landFrame - startFrame) * 0.7, settleAmount: 0 })));

  const strikeProgress = Math.max(
    0,
    Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: strikeFrame, endFrame: strikeFrame + 10, settleAmount: 0 }))
  );
  const shake = frame > strikeFrame && frame < strikeFrame + 14 ? Math.sin((frame - strikeFrame) * 2.4) * 4 * (1 - (frame - strikeFrame) / 14) : 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "26px 40px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.07)",
        border: "1.5px solid rgba(255,255,255,0.16)",
        transform: `scale(${scale}) translateX(${shake}px)`,
        opacity,
      }}
    >
      {icon}
      <span style={{ fontFamily, fontWeight: 700, fontSize: 40, color: COLORS.white }}>{label}</span>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          top: "50%",
          height: 5,
          background: COLORS.white,
          transform: `translateY(-50%) scaleX(${strikeProgress})`,
          transformOrigin: "left center",
          borderRadius: 3,
        }}
      />
    </div>
  );
};
