import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { StrikeCard } from "../components/StrikeCard";
import { BuildingIcon, ChainIcon } from "../components/Icons";
import { DarkBackground } from "../components/Background";
import { T } from "../constants";
import { premiumMove } from "../utils/easing";

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.s5.start - 10 || frame > T.s5.end + 10) return null;

  const sceneOpacity = premiumMove(frame, { from: 1, to: 0, startFrame: T.s5.end - 6, endFrame: T.s5.end, settleAmount: 0 });

  return (
    <AbsoluteFill style={{ opacity: Math.max(0, Math.min(1, sceneOpacity)) }}>
      <DarkBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <StrikeCard
            icon={<BuildingIcon />}
            label="Tarife de firmă"
            startFrame={T.s5Beats[0]}
            landFrame={T.s5Beats[0] + 20}
            strikeFrame={T.s5Beats[0] + 34}
          />
          <StrikeCard
            icon={<ChainIcon />}
            label="Intermediari"
            startFrame={T.s5Beats[1]}
            landFrame={T.s5Beats[1] + 12}
            strikeFrame={T.s5Beats[1] + 18}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
