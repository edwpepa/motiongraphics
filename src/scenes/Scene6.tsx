import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { HeroText } from "../components/HeroText";
import { Confetti } from "../components/Confetti";
import { DarkBackground } from "../components/Background";
import { COLORS, T } from "../constants";
import { premiumMove, idleDrift } from "../utils/easing";
import { interFontFamily as fontFamily } from "../font";

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s6.start - 10) return null;

  const logoStart = T.s6.start;
  const logoLand = logoStart + 22;
  const logoScale = premiumMove(frame, { from: 0.5, to: 1, startFrame: logoStart, endFrame: logoLand, settleAmount: 0.03 });
  const logoOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: logoStart, endFrame: logoStart + 14, settleAmount: 0 })));
  const logoFloat = idleDrift(frame, 10, 220, 0);

  const wordmarkOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: logoStart + 4, endFrame: logoStart + 18, settleAmount: 0 })));
  const wordmarkY = premiumMove(frame, { from: 24, to: 0, startFrame: logoStart + 4, endFrame: logoStart + 20 });

  const confettiStart = T.musicHit - 3;
  const mascotStart = T.musicHit + 10;
  const mascotLand = mascotStart + 16;
  const mascotOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: mascotStart, endFrame: mascotLand, settleAmount: 0 })));
  const mascotScale = premiumMove(frame, { from: 0.7, to: 1, startFrame: mascotStart, endFrame: mascotLand, settleAmount: 0.03 });
  const mascotFloat = idleDrift(frame, 8, 180, 1.1);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <DarkBackground />
      {frame >= confettiStart && <Confetti startFrame={confettiStart} count={90} originY={0.38} />}

      <Img
        src={staticFile("images/logo.webp")}
        style={{
          width: 300,
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${logoFloat - 90}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "48%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 110,
            letterSpacing: -2,
            color: COLORS.white,
          }}
        >
          handly<span style={{ color: COLORS.green }}>.ro</span>
        </span>
      </div>

      <div style={{ position: "absolute", top: "64%", display: "flex", gap: 24 }}>
        <HeroText text="Postezi." startFrame={T.s6Beats[1]} landFrame={T.s6Beats[1] + 14} fontSize={56} align="center" from="bottom" />
        <HeroText
          text="Se rezolvă."
          startFrame={T.s6Beats[1] + 10}
          landFrame={T.s6Beats[1] + 24}
          fontSize={56}
          accentWords={["rezolvă."]}
          align="center"
          from="bottom"
        />
      </div>

      <Img
        src={staticFile("images/handyman.webp")}
        style={{
          position: "absolute",
          bottom: 60,
          left: 20,
          width: 260,
          opacity: mascotOpacity,
          transform: `scale(${mascotScale}) translateY(${mascotFloat}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
