import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { WaveBackground } from "./components/Backgrounds";
import { DarkStage } from "./components/DarkStage";
import { useExplainerFonts } from "./fonts";
import { S1Hook } from "./scenes/S1Hook";
import { S2Calendar } from "./scenes/S2Calendar";
import { S3Chores } from "./scenes/S3Chores";
import { S4Post } from "./scenes/S4Post";
import { S5Radar } from "./scenes/S5Radar";
import { S6Choose } from "./scenes/S6Choose";
import { S7NoFees } from "./scenes/S7NoFees";
import { S8Words } from "./scenes/S8Words";
import { S9Logo } from "./scenes/S9Logo";
import { SCENES } from "./timing";

/** Mounts a scene only inside its window. Scenes read the absolute frame, so every beat is authored in VO frames. */
const Window: React.FC<{ range: readonly [number, number]; children: React.ReactNode }> = ({ range, children }) => {
  const frame = useCurrentFrame();
  return frame >= range[0] && frame < range[1] ? <>{children}</> : null;
};

export const HandlyExplainer: React.FC = () => {
  useExplainerFonts();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <WaveBackground />
      <Window range={SCENES.hook}>
        <S1Hook />
      </Window>
      <Window range={SCENES.calendar}>
        <S2Calendar />
      </Window>
      <Window range={SCENES.chores}>
        <S3Chores />
      </Window>
      <Window range={SCENES.post}>
        <S4Post />
      </Window>
      <Window range={SCENES.noFees}>
        <S7NoFees />
      </Window>
      <Window range={SCENES.words}>
        <S8Words />
      </Window>
      <Window range={[SCENES.radar[0], SCENES.choose[1]]}>
        <DarkStage revealAt={SCENES.radar[0] + 2} exitAt={SCENES.choose[1] - 15}>
          <Window range={SCENES.radar}>
            <S5Radar />
          </Window>
          <Window range={SCENES.choose}>
            <S6Choose />
          </Window>
        </DarkStage>
      </Window>
      <Window range={SCENES.logo}>
        <S9Logo />
      </Window>

      {/* voiceover + original score + synced sfx, mixed by tools/audio/compose.py */}
      <Audio src={staticFile("audio/explainer-mix.mp3")} />
    </AbsoluteFill>
  );
};
