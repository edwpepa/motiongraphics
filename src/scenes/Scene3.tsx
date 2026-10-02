import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HeroText } from "../components/HeroText";
import { PhoneCard } from "../components/PhoneCard";
import { LightBackground } from "../components/Background";
import { COLORS, T } from "../constants";
import { premiumMove } from "../utils/easing";

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s3.start - 10 || frame > T.s3.end + 15) return null;

  const sceneOpacity = premiumMove(frame, { from: 1, to: 0, startFrame: T.s3.end - 10, endFrame: T.s3.end, settleAmount: 0 });

  return (
    <AbsoluteFill style={{ opacity: Math.max(0, Math.min(1, sceneOpacity)) }}>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, width: 880, textAlign: "center" }}>
          <HeroText
            text="Postezi task-ul pe handly.ro"
            startFrame={T.s3.start}
            landFrame={T.s3.start + 20}
            fontSize={60}
            color={COLORS.ink}
            accentWords={["handly.ro"]}
            align="center"
          />
        </div>
        <PhoneCard startFrame={T.s3.start + 8} landFrame={T.s3.start + 34} badgeStartFrame={T.s3Beat} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
