import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Chip } from "../components/Chip";
import { FaucetIcon, CabinetIcon, PaintRollerIcon } from "../components/Icons";
import { T } from "../constants";
import { premiumMove } from "../utils/easing";

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s2.start - 10 || frame > T.s2.end + 15) return null;

  const sceneOpacity = premiumMove(frame, { from: 1, to: 0, startFrame: T.s2.end - 10, endFrame: T.s2.end, settleAmount: 0 });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: Math.max(0, Math.min(1, sceneOpacity)),
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "flex-start" }}>
        <Chip icon={<FaucetIcon />} label="Un robinet care curge" startFrame={T.s2Beats[0]} landFrame={T.s2Beats[0] + 16} side="left" />
        <Chip icon={<CabinetIcon />} label="Un dulap de montat" startFrame={T.s2Beats[1]} landFrame={T.s2Beats[1] + 16} side="right" />
        <Chip icon={<PaintRollerIcon />} label="Un perete de zugrăvit" startFrame={T.s2Beats[2] - 20} landFrame={T.s2Beats[2] - 4} side="left" />
      </div>
    </AbsoluteFill>
  );
};
