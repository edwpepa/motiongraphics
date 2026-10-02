import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { premiumMove, idleDrift } from "../utils/easing";
import { CheckBadge, StopwatchIcon } from "./Icons";
import { interFontFamily as fontFamily } from "../font";

interface PhoneCardProps {
  startFrame: number;
  landFrame: number;
  badgeStartFrame: number;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({ startFrame, landFrame, badgeStartFrame }) => {
  const frame = useCurrentFrame();

  const y = premiumMove(frame, { from: 60, to: 0, startFrame, endFrame: landFrame });
  const scale = premiumMove(frame, { from: 0.9, to: 1, startFrame, endFrame: landFrame, settleAmount: 0.015 });
  const opacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame, endFrame: startFrame + (landFrame - startFrame) * 0.6, settleAmount: 0 })));
  const floatY = idleDrift(frame, 7, 210, 0);
  const tiltY = idleDrift(frame, 3.5, 260, 0.8);
  const tiltX = idleDrift(frame, 2.2, 300, 1.6);

  const buttonPress = premiumMove(frame, { from: 1, to: 0.94, startFrame: landFrame + 6, endFrame: landFrame + 12 });

  const badgeScale = premiumMove(frame, { from: 0, to: 1, startFrame: badgeStartFrame, endFrame: badgeStartFrame + 14, settleAmount: 0.05 });
  const badgeOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: badgeStartFrame, endFrame: badgeStartFrame + 10, settleAmount: 0 })));
  const badgeFloat = idleDrift(frame, 5, 190, 2.4);

  const checkOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: landFrame + 10, endFrame: landFrame + 20, settleAmount: 0 })));
  const checkScale = premiumMove(frame, { from: 0.5, to: 1, startFrame: landFrame + 10, endFrame: landFrame + 22, settleAmount: 0.06 });

  return (
    <div style={{ perspective: 1400 }}>
      <div
        style={{
          position: "relative",
          transform: `translateY(${y + floatY}px) scale(${scale}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
          opacity,
          width: 560,
          borderRadius: 40,
          background: COLORS.white,
          border: "1px solid rgba(16,21,26,0.06)",
          padding: 40,
          boxShadow: "0 50px 90px rgba(16,21,26,0.16), 0 8px 24px rgba(16,21,26,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span style={{ fontFamily, fontWeight: 700, fontSize: 32, color: COLORS.ink }}>Task nou</span>
          <div style={{ opacity: checkOpacity, transform: `scale(${checkScale})` }}>
            <CheckBadge size={44} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div style={{ height: 22, borderRadius: 11, background: "#eef1ef", width: "90%" }} />
          <div style={{ height: 22, borderRadius: 11, background: "#eef1ef", width: "65%" }} />
        </div>

        <div
          style={{
            transform: `scale(${buttonPress})`,
            background: `linear-gradient(135deg, #17d97a 0%, ${COLORS.green} 100%)`,
            borderRadius: 999,
            padding: "24px 0",
            textAlign: "center",
            fontFamily,
            fontWeight: 700,
            fontSize: 34,
            color: COLORS.white,
            boxShadow: "0 16px 32px rgba(0,191,99,0.35)",
          }}
        >
          Postează pe handly.ro
        </div>

        <div
          style={{
            position: "absolute",
            top: -34,
            right: -24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.white,
            borderRadius: 999,
            padding: "14px 24px 14px 18px",
            opacity: badgeOpacity,
            transform: `scale(${badgeScale}) translateY(${badgeFloat}px)`,
            boxShadow: "0 20px 44px rgba(16,21,26,0.20)",
            border: "1px solid rgba(16,21,26,0.06)",
          }}
        >
          <StopwatchIcon size={30} color={COLORS.green} />
          <span style={{ fontFamily, fontWeight: 700, fontSize: 24, color: COLORS.ink }}>câteva secunde</span>
        </div>
      </div>
    </div>
  );
};
