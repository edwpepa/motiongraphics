import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { HeroText } from "../components/HeroText";
import { T } from "../constants";
import { idleDrift, premiumMove } from "../utils/easing";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s1.start - 10 || frame > T.s1.end + 20) return null;

  const mascotOpacity = Math.max(
    0,
    Math.min(0.22, premiumMove(frame, { from: 0, to: 0.22, startFrame: T.s1.start, endFrame: T.s1.start + 30, settleAmount: 0 }))
  );
  const mascotDrift = idleDrift(frame, 14, 260, 0);
  const sceneOpacity = premiumMove(frame, { from: 1, to: 0, startFrame: T.s1.end - 10, endFrame: T.s1.end, settleAmount: 0 });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.max(0, Math.min(1, sceneOpacity)) }}>
      <Img
        src={staticFile("images/handyman.webp")}
        style={{
          position: "absolute",
          bottom: -40,
          right: -60,
          width: 620,
          opacity: mascotOpacity,
          filter: "blur(1px) grayscale(0.2)",
          transform: `translateY(${mascotDrift}px)`,
        }}
      />
      <div style={{ width: 880, display: "flex", flexDirection: "column", gap: 28, padding: "0 20px" }}>
        <HeroText
          text="Te tot gândești la treaba aia obositoare prin casă..."
          startFrame={T.s1.start}
          landFrame={T.s1.start + 20}
          fontSize={68}
          from="bottom"
        />
        <HeroText
          text="pe care o tot amâni?"
          startFrame={T.s1Beat}
          landFrame={T.s1Beat + 16}
          fontSize={76}
          accentWords={["amâni?"]}
          from="bottom"
        />
      </div>
    </AbsoluteFill>
  );
};
