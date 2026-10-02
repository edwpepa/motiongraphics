import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { HeroText } from "../components/HeroText";
import { Avatar } from "../components/Avatars";
import { T } from "../constants";
import { premiumMove, idleDrift } from "../utils/easing";

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s4.start - 10 || frame > T.s4.end + 15) return null;

  const sceneOpacity = premiumMove(frame, { from: 1, to: 0, startFrame: T.s4.end - 10, endFrame: T.s4.end, settleAmount: 0 });

  const selectFrame = T.s4Beat + 14;
  const logoStart = T.s4Beat + 40;
  const logoLand = logoStart + 30;
  const logoScale = premiumMove(frame, { from: 0.6, to: 1, startFrame: logoStart, endFrame: logoLand, settleAmount: 0.03 });
  const logoOpacity = Math.max(0, Math.min(1, premiumMove(frame, { from: 0, to: 1, startFrame: logoStart, endFrame: logoStart + 14, settleAmount: 0 })));
  const logoFloat = idleDrift(frame, 8, 200, 0.5);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 220,
        opacity: Math.max(0, Math.min(1, sceneOpacity)),
      }}
    >
      <div style={{ width: 880, textAlign: "center", display: "flex", flexDirection: "column", gap: 24 }}>
        <HeroText text="Taskerii din zona ta văd task-ul," startFrame={T.s4.start} landFrame={T.s4.start + 22} fontSize={54} />
        <HeroText
          text="tu alegi cu cine lucrezi, la prețul stabilit chiar de voi doi."
          startFrame={T.s4Beat}
          landFrame={T.s4Beat + 24}
          fontSize={54}
          accentWords={["prețul", "stabilit"]}
        />
      </div>

      <div style={{ position: "relative", width: 700, height: 160, marginTop: 70 }}>
        <Avatar startFrame={T.s4.start + 18} landFrame={T.s4.start + 34} x={200} y={20} size={100} delayPhase={0} />
        <Avatar
          startFrame={T.s4.start + 26}
          landFrame={T.s4.start + 42}
          x={300}
          y={0}
          size={120}
          selected
          selectFrame={selectFrame}
          delayPhase={1}
        />
        <Avatar startFrame={T.s4.start + 34} landFrame={T.s4.start + 50} x={430}
          y={20} size={100} delayPhase={2} />
      </div>

      <Img
        src={staticFile("images/logo.webp")}
        style={{
          position: "absolute",
          bottom: 130,
          width: 260,
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${logoFloat}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
