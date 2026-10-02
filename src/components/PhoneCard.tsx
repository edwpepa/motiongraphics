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
  const floatY = idleDrift(frame, 6, 200, 0);

  const buttonPress = premiumMove(frame, { from: 1, to: 0.94, startFrame: landFrame + 6, endFrame: landFrame + 12 });

  const badgeScale = premiumMove(frame, { from: 0, to: 1, startFrame: badgeStartFrame, endFrame: badgeStartFrame + 14, settleAmount: 0.05 });
  const badgeOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: badgeStartFrame, endFrame: badgeStartFrame + 10, settleAmount: 0 })));

  const checkOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: landFrame + 10, endFrame: landFrame + 20, settleAmount: 0 })));
  const checkScale = premiumMove(frame, { from: 0.5, to: 1, startFrame: landFrame + 10, endFrame: landFrame + 22, settleAmount: 0.06 });

  return (
    <div
      style={{
        position: "relative",
        transform: `translateY(${y + floatY}px) scale(${scale})`,
        opacity,
        width: 560,
        borderRadius: 40,
        background: "rgba(255,255,255,0.08)",
        border: "1.5px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        padding: 40,
        boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <span style={{ fontFamily, fontWeight: 700, fontSize: 32, color: COLORS.white }}>Task nou</span>
        <div style={{ opacity: checkOpacity, transform: `scale(${checkScale})` }}>
          <CheckBadge size={44} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.18)", width: "90%" }} />
        <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.18)", width: "65%" }} />
      </div>

      <div
        style={{
          transform: `scale(${buttonPress})`,
          background: COLORS.green,
          borderRadius: 24,
          padding: "22px 0",
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize: 34,
          color: COLORS.black,
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
          padding: "12px 22px 12px 16px",
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}
      >
        <StopwatchIcon size={30} color={COLORS.black} />
        <span style={{ fontFamily, fontWeight: 700, fontSize: 24, color: COLORS.black }}>câteva secunde</span>
      </div>
    </div>
  );
};
