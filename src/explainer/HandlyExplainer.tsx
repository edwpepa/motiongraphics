import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage } from "./components/Stage";
import { useExplainerFonts } from "./fonts";
import { clamp01 } from "./lib/anim";
import { Problem } from "./scenes/Problem";
import { S4Post } from "./scenes/S4Post";
import { S5Radar } from "./scenes/S5Radar";
import { S6Choose } from "./scenes/S6Choose";
import { S7NoFees } from "./scenes/S7NoFees";
import { S8Words } from "./scenes/S8Words";
import { S9Logo } from "./scenes/S9Logo";
import { DURATION_IN_FRAMES, MUSIC_LIFT_FRAME } from "./timing";
import { useLayout } from "./layout";
import { ease } from "./lib/anim";

/** The orb's burst on the drop: a lime-white bloom that floods the frame and clears to the dark set. */
const DropFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const t = frame - (MUSIC_LIFT_FRAME - 4);
  if (t < 0 || t > 14) return null;
  const grow = ease.outCubic(clamp01(t / 6));
  const fade = 1 - ease.outCubic(clamp01((t - 4) / 9));
  const R = Math.hypot(L.W, L.H) * (0.15 + 0.75 * grow);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(230,255,190,0.95) ${R * 0.25}px, rgba(120,255,190,0.45) ${R * 0.55}px, rgba(0,60,40,0) ${R}px)`,
        opacity: fade,
      }}
    />
  );
};

/** Mounts a scene only inside its window. Scenes read the absolute frame, so every beat is authored in VO frames. */
const Window: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

export const HandlyExplainer: React.FC = () => {
  const fontsReady = useExplainerFonts();
  const frame = useCurrentFrame();
  // the top light is dim during the problem, opens up on the drop
  const light = 0.55 + 0.45 * clamp01((frame - MUSIC_LIFT_FRAME + 4) / 10) - 0.2 * clamp01((frame - 790) / 10);

  if (!fontsReady) return <AbsoluteFill style={{ background: "#000" }} />;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage light={light} />
      <Window from={0} to={346}>
        <Problem />
      </Window>
      <Window from={334} to={452}>
        <S4Post />
      </Window>
      <Window from={436} to={526}>
        <S5Radar />
      </Window>
      <Window from={508} to={630}>
        <S6Choose />
      </Window>
      <Window from={616} to={716}>
        <S7NoFees />
      </Window>
      <Window from={706} to={800}>
        <S8Words />
      </Window>
      <Window from={784} to={DURATION_IN_FRAMES}>
        <S9Logo />
      </Window>

      <DropFlash />

      {/* voiceover + score + synced sfx, mixed by tools/audio/compose.py */}
      <Audio src={staticFile("audio/explainer-mix.mp3")} />
    </AbsoluteFill>
  );
};
